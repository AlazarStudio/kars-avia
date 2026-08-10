import { useCallback, useEffect, useRef, useState } from "react";
import PropTypes from "prop-types";
import { useMutation, useQuery } from "@apollo/client";
import classes from "./ReportRulesSidebar.module.css";
import Sidebar from "../../Sidebar/Sidebar";
import MUILoader from "../../MUILoader/MUILoader";
import CloseIcon from "../../../../shared/icons/CloseIcon";
import { useDialog } from "../../../../contexts/DialogContext";
import { useToast } from "../../../../contexts/ToastContext";
import {
  GET_REPORT_PARTIAL_DAY_SETTINGS,
  UPSERT_REPORT_PARTIAL_DAY_SETTING,
  getCookie,
} from "../../../../../graphQL_requests";
import { toRulesForm, validateRules, rulesChanged, toUpsertInput } from "../reportRules";

// Иконка замка в плашке "нет прав на редактирование".
function LockIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 17 17" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="3.5" y="7.5" width="10" height="7" rx="1.6" stroke="#8B90A5" strokeWidth="1.3" />
      <path
        d="M5.7 7.5V5.3C5.7 3.75 6.95 2.5 8.5 2.5C10.05 2.5 11.3 3.75 11.3 5.3V7.5"
        stroke="#8B90A5"
        strokeWidth="1.3"
        strokeLinecap="round"
      />
    </svg>
  );
}

// Порядок групп/строк — контрактный: заезд (полный, половина), затем
// выезд (половина, полный). Именно так их видит бэкенд в toUpsertInput.
const FIELD_GROUPS = [
  {
    title: "Заезд",
    rows: [
      {
        timeKey: "arrivalFullBefore",
        daysKey: "arrivalFullDays",
        prefix: "раньше",
        timeLabel: "Время: заезд раньше — полные сутки",
        daysLabel: "Надбавка в сутках: заезд раньше — полные сутки",
      },
      {
        timeKey: "arrivalHalfBefore",
        daysKey: "arrivalHalfDays",
        prefix: "раньше",
        timeLabel: "Время: заезд раньше — половина суток",
        daysLabel: "Надбавка в сутках: заезд раньше — половина суток",
      },
    ],
  },
  {
    title: "Выезд",
    rows: [
      {
        timeKey: "departureHalfAfter",
        daysKey: "departureHalfDays",
        prefix: "позже",
        timeLabel: "Время: выезд позже — половина суток",
        daysLabel: "Надбавка в сутках: выезд позже — половина суток",
      },
      {
        timeKey: "departureFullAfter",
        daysKey: "departureFullDays",
        prefix: "позже",
        timeLabel: "Время: выезд позже — полные сутки",
        daysLabel: "Надбавка в сутках: выезд позже — полные сутки",
      },
    ],
  },
];

export default function ReportRulesSidebar({ show, onClose, canEdit }) {
  const token = getCookie("token");
  const { confirm, isDialogOpen } = useDialog();
  const { success, error: notifyError } = useToast();

  const sidebarRef = useRef();

  // form и initial живут в одном стейте, чтобы при повторном ответе с бэка
  // (cache-and-network отвечает дважды) можно было синхронно сравнить их
  // актуальные значения внутри функционального апдейтера — без гонки между
  // двумя отдельными setState и без дублирующего флага "правил ли пользователь".
  const [state, setState] = useState(() => {
    const emptyForm = toRulesForm(null);
    return { form: emptyForm, initial: emptyForm };
  });
  const { form, initial } = state;

  const { data, loading } = useQuery(GET_REPORT_PARTIAL_DAY_SETTINGS, {
    variables: { level: "GLOBAL" },
    fetchPolicy: "cache-and-network",
    skip: !show,
    context: { headers: { Authorization: `Bearer ${token}` } },
  });

  const setting = data?.reportPartialDaySettings?.[0] || null;

  // Синхронизация формы: при открытии сайдбара и при каждом приходе свежей
  // настройки с бэка (в т.ч. второй раз — из сети, после кэша) initial всегда
  // подтягивается к серверным данным. form обновляется вместе с ним только
  // если пользователь ещё ничего не поменял (rulesChanged(prev.form, prev.initial)
  // ложно) — иначе правки не трогаем. При закрытии сайдбара стейт сбрасывается,
  // поэтому повторное открытие всегда стартует с серверных значений.
  useEffect(() => {
    if (!show) {
      const emptyForm = toRulesForm(null);
      setState({ form: emptyForm, initial: emptyForm });
      return;
    }
    const next = toRulesForm(setting);
    setState((prev) => {
      const userEdited = rulesChanged(prev.form, prev.initial);
      return { form: userEdited ? prev.form : next, initial: next };
    });
  }, [show, setting]);

  const [upsertRules, { loading: saving }] = useMutation(UPSERT_REPORT_PARTIAL_DAY_SETTING, {
    context: { headers: { Authorization: `Bearer ${token}` } },
  });

  const { errors, isValid } = validateRules(form);
  const hasChanges = rulesChanged(form, initial);

  const handleFieldChange = useCallback((key, value) => {
    setState((prev) => ({ ...prev, form: { ...prev.form, [key]: value } }));
  }, []);

  const closeSidebar = useCallback(async () => {
    if (isDialogOpen) return;
    if (!hasChanges) {
      onClose();
      return;
    }
    const isConfirmed = await confirm(
      "Вы уверены? Все несохраненные данные будут удалены."
    );
    if (isConfirmed) onClose();
  }, [isDialogOpen, hasChanges, confirm, onClose]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isDialogOpen) return;
      if (event.target.closest(".MuiSnackbar-root")) return;
      if (sidebarRef.current?.contains(event.target)) return;
      closeSidebar();
    };

    if (show) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [show, closeSidebar, isDialogOpen]);

  const handleSave = async () => {
    try {
      const { data: result } = await upsertRules({ variables: { input: toUpsertInput(form) } });
      const saved = result?.upsertReportPartialDaySetting;
      if (saved) {
        const next = toRulesForm(saved);
        setState((prev) => ({ ...prev, initial: next }));
      }
      success("Правила сохранены");
    } catch (e) {
      notifyError(e?.graphQLErrors?.[0]?.message || "Не удалось сохранить правила");
    }
  };

  // Ошибки группы (заезд/выезд) — собираются из тех же errors, что и рамки
  // полей, просто выводятся одним блоком под строками группы, а не под
  // каждым полем по отдельности.
  const groupErrorMessages = (group) =>
    group.rows.flatMap((row) => {
      const messages = [];
      if (errors[row.timeKey]) messages.push(errors[row.timeKey]);
      if (errors[row.daysKey]) messages.push(errors[row.daysKey]);
      return messages;
    });

  return (
    <>
      {show && <div className={classes.overlay} />}
      <Sidebar show={show} sidebarRef={sidebarRef}>
        <div className={classes.header}>
          <div className={classes.headerTitle}>Правила расчёта суток</div>
          <button
            type="button"
            className={classes.closeBtn}
            onClick={closeSidebar}
            aria-label="Закрыть"
          >
            <CloseIcon />
          </button>
        </div>

        {loading ? (
          <MUILoader loadSize="50px" fullHeight="80vh" />
        ) : (
          <>
            <div className={classes.body}>
              {!canEdit && (
                <div className={classes.noticeBlock}>
                  <span className={classes.noticeIcon}>
                    <LockIcon />
                  </span>
                  <div className={classes.noticeText}>
                    Изменять правила может только супер-администратор. Значения показаны для
                    справки — они уже применены ко всем новым отчётам.
                  </div>
                </div>
              )}

              {FIELD_GROUPS.map((group) => {
                const groupErrors = groupErrorMessages(group);
                return (
                  <div className={classes.group} key={group.title}>
                    <div className={classes.groupTitle}>{group.title}</div>
                    {group.rows.map((row) => (
                      <div className={classes.row} key={row.timeKey}>
                        <span className={classes.prefixLabel}>{row.prefix}</span>

                        <input
                          type="time"
                          className={`${classes.timeInput} ${
                            errors[row.timeKey] ? classes.inputError : ""
                          }`}
                          value={form[row.timeKey] ?? ""}
                          disabled={!canEdit}
                          aria-label={row.timeLabel}
                          onChange={(e) => handleFieldChange(row.timeKey, e.target.value)}
                        />

                        <span className={classes.arrow}>→</span>
                        <span className={classes.plus}>+</span>

                        <input
                          type="number"
                          step="0.5"
                          min="0"
                          className={`${classes.daysInput} ${
                            errors[row.daysKey] ? classes.inputError : ""
                          }`}
                          value={form[row.daysKey] ?? ""}
                          disabled={!canEdit}
                          aria-label={row.daysLabel}
                          onChange={(e) => handleFieldChange(row.daysKey, e.target.value)}
                        />

                        <span className={classes.unit}>сут.</span>
                      </div>
                    ))}

                    {groupErrors.length > 0 && (
                      <div className={classes.groupErrors}>
                        {groupErrors.map((message, index) => (
                          <div className={classes.errorText} key={index}>
                            {message}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}

              <div className={classes.infoBlock}>
                <span className={classes.infoIcon}>i</span>
                <div className={classes.infoText}>
                  То же правило применяется к заявкам, которые выходят за конец периода отчёта:
                  сутки за последний день считаются по времени выезда из заявки, а не по дате
                  окончания периода.
                </div>
              </div>
            </div>

            {canEdit && (
              <div className={classes.footer}>
                <button type="button" className={classes.cancelBtn} onClick={closeSidebar}>
                  Отмена
                </button>
                <button
                  type="button"
                  className={classes.mainBtn}
                  disabled={!hasChanges || !isValid || saving}
                  onClick={handleSave}
                >
                  Сохранить правила
                </button>
              </div>
            )}
          </>
        )}
      </Sidebar>
    </>
  );
}

ReportRulesSidebar.propTypes = {
  show: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  canEdit: PropTypes.bool,
};
