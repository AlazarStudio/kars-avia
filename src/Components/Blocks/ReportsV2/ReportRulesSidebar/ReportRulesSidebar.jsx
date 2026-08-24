import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import PropTypes from "prop-types";
import { useMutation, useQuery } from "@apollo/client";
import classes from "./ReportRulesSidebar.module.css";
import Sidebar from "../../Sidebar/Sidebar";
import MUILoader from "../../MUILoader/MUILoader";
import MUIAutocompleteColor from "../../MUIAutocompleteColor/MUIAutocompleteColor";
import ContractTypeToggle from "../../ContractTypeToggle/ContractTypeToggle";
import CloseIcon from "../../../../shared/icons/CloseIcon";
import AdditionalMenu from "../../../Standart/AdditionalMenu/AdditionalMenu";
import { useDialog } from "../../../../contexts/DialogContext";
import { useToast } from "../../../../contexts/ToastContext";
import { apolloErrorText } from "../../../../utils/apolloErrorText";
import {
  GET_REPORT_PARTIAL_DAY_SETTINGS,
  UPSERT_REPORT_PARTIAL_DAY_SETTING,
  DELETE_REPORT_PARTIAL_DAY_SETTING,
  GET_AIRLINES_LIGHT,
  GET_HOTELS_RELAY,
  getCookie,
} from "../../../../../graphQL_requests";
import {
  toRulesForm,
  validateRules,
  rulesChanged,
  toUpsertInput,
  pickSetting,
} from "../reportRules";

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

const LEVEL_OPTIONS = [
  { key: "GLOBAL", label: "Общие" },
  { key: "AIRLINE", label: "По авиакомпании" },
  { key: "HOTEL", label: "По гостинице" },
];

const PERIOD_EDGE_NOTE =
  "То же правило применяется к заявкам, которые выходят за конец периода отчёта: " +
  "сутки за последний день считаются по времени выезда из заявки, а не по дате " +
  "окончания периода.";

// Переопределение накладывается бэком по типу отчёта: AIRLINE — только в отчётах
// по этой АК, HOTEL — только в отчётах по этой гостинице (resolvePartialDayRules).
const LEVEL_INFO_TEXT = {
  GLOBAL: PERIOD_EDGE_NOTE,
  AIRLINE:
    "Эти правила действуют только при формировании отчётов и черновиков по этой " +
    "авиакомпании. В отчётах по гостиницам применяются правила гостиницы или общие. " +
    PERIOD_EDGE_NOTE,
  HOTEL:
    "Эти правила действуют только при формировании отчётов и черновиков по этой " +
    "гостинице. В отчётах по авиакомпаниям применяются правила авиакомпании или общие. " +
    PERIOD_EDGE_NOTE,
};

export default function ReportRulesSidebar({ show, onClose, canEdit }) {
  const token = getCookie("token");
  const { confirm, isDialogOpen } = useDialog();
  const { success, error: notifyError } = useToast();

  const sidebarRef = useRef();
  // Меню MUI рисуется в портале — вне узла сайдбара, поэтому его нужно уметь
  // отличить в обработчике клика снаружи (иначе клик по «Редактировать»
  // закрывает панель).
  const menuRef = useRef(null);
  const [anchorEl, setAnchorEl] = useState(null);
  // Панель открывается в режиме просмотра; правка включается пунктом меню.
  const [isEditing, setIsEditing] = useState(false);

  // Цель настройки: уровень и выбранная сущность для не-общих уровней.
  const [level, setLevel] = useState("GLOBAL");
  const [selectedAirline, setSelectedAirline] = useState(null);
  const [selectedHotel, setSelectedHotel] = useState(null);

  // form и initial живут в одном стейте, чтобы при повторном ответе с бэка
  // (cache-and-network отвечает дважды) можно было синхронно сравнить их
  // актуальные значения внутри функционального апдейтера — без гонки между
  // двумя отдельными setState и без дублирующего флага "правил ли пользователь".
  const [state, setState] = useState(() => {
    const emptyForm = toRulesForm(null);
    return { form: emptyForm, initial: emptyForm };
  });
  const { form, initial } = state;

  const { data, loading, refetch } = useQuery(GET_REPORT_PARTIAL_DAY_SETTINGS, {
    fetchPolicy: "cache-and-network",
    skip: !show,
    context: { headers: { Authorization: `Bearer ${token}` } },
  });

  const { data: airlinesData } = useQuery(GET_AIRLINES_LIGHT, {
    skip: !show || level !== "AIRLINE",
    context: { headers: { Authorization: `Bearer ${token}` } },
  });

  const { data: hotelsData } = useQuery(GET_HOTELS_RELAY, {
    skip: !show || level !== "HOTEL",
    context: { headers: { Authorization: `Bearer ${token}` } },
  });

  const settings = useMemo(() => data?.reportPartialDaySettings || [], [data]);
  const airlines = airlinesData?.airlines?.airlines || [];
  const hotels = hotelsData?.hotels?.hotels || [];

  const entityId =
    level === "AIRLINE"
      ? selectedAirline?.id || null
      : level === "HOTEL"
        ? selectedHotel?.id || null
        : null;

  const globalSetting = useMemo(() => pickSetting(settings, "GLOBAL"), [settings]);
  const targetSetting = useMemo(
    () => (level === "GLOBAL" ? globalSetting : pickSetting(settings, level, entityId)),
    [settings, level, entityId, globalSetting]
  );
  // Не-общий уровень без своей записи наследует значения глобальной.
  const baseSetting = targetSetting || globalSetting;
  const hasOverride = level !== "GLOBAL" && Boolean(targetSetting);

  const overriddenAirlineIds = useMemo(
    () => new Set(settings.filter((s) => s.level === "AIRLINE").map((s) => s.airlineId)),
    [settings]
  );
  const overriddenHotelIds = useMemo(
    () => new Set(settings.filter((s) => s.level === "HOTEL").map((s) => s.hotelId)),
    [settings]
  );

  // Синхронизация формы: initial всегда подтягивается к серверным данным цели,
  // form — только пока пользователь не правил. Смена цели (уровня или сущности)
  // пересобирает форму принудительно: правки не переживают переключение —
  // переключение с несохранёнными правками гейтится confirm'ом в обработчиках.
  const targetKey = `${level}:${entityId || ""}`;
  const prevTargetKeyRef = useRef(targetKey);
  useEffect(() => {
    if (!show) {
      const emptyForm = toRulesForm(null);
      setState({ form: emptyForm, initial: emptyForm });
      // Закрыли панель — следующее открытие снова начинается с просмотра общих.
      setIsEditing(false);
      setAnchorEl(null);
      setLevel("GLOBAL");
      setSelectedAirline(null);
      setSelectedHotel(null);
      prevTargetKeyRef.current = "GLOBAL:";
      return;
    }
    const targetChanged = prevTargetKeyRef.current !== targetKey;
    prevTargetKeyRef.current = targetKey;
    const next = toRulesForm(baseSetting);
    setState((prev) => {
      const userEdited = !targetChanged && rulesChanged(prev.form, prev.initial);
      return { form: userEdited ? prev.form : next, initial: next };
    });
  }, [show, baseSetting, targetKey]);

  const [upsertRules, { loading: saving }] = useMutation(UPSERT_REPORT_PARTIAL_DAY_SETTING, {
    context: { headers: { Authorization: `Bearer ${token}` } },
  });
  const [deleteRules, { loading: deleting }] = useMutation(DELETE_REPORT_PARTIAL_DAY_SETTING, {
    context: { headers: { Authorization: `Bearer ${token}` } },
  });

  const { errors, isValid } = validateRules(form);
  const hasChanges = rulesChanged(form, initial);
  // Не-общий уровень без выбранной сущности: форма показывает наследуемую
  // базу, но править и сохранять нечего.
  const needsEntity = level !== "GLOBAL" && !entityId;
  const fieldsLocked = !canEdit || !isEditing || needsEntity;

  const handleFieldChange = useCallback((key, value) => {
    setState((prev) => ({ ...prev, form: { ...prev.form, [key]: value } }));
  }, []);

  const handleMenuOpen = (event) => setAnchorEl(event.currentTarget);
  const handleMenuClose = () => setAnchorEl(null);

  const handleEditFromMenu = () => {
    handleMenuClose();
    setIsEditing(true);
  };

  // «Отмена» возвращает к просмотру и откатывает правки, но панель не
  // закрывает — так же, как в остальных сайдбарах с этим меню.
  const handleCancelEdit = () => {
    setState((prev) => ({ ...prev, form: prev.initial }));
    setIsEditing(false);
  };

  const confirmDiscardEdits = useCallback(async () => {
    if (!isEditing || !hasChanges) return true;
    return confirm("Вы уверены? Все несохраненные данные будут удалены.");
  }, [isEditing, hasChanges, confirm]);

  const handleLevelChange = async (nextLevel) => {
    if (nextLevel === level) return;
    if (!(await confirmDiscardEdits())) return;
    setLevel(nextLevel);
    setSelectedAirline(null);
    setSelectedHotel(null);
  };

  const handleAirlineSelect = async (nextValue) => {
    if (!(await confirmDiscardEdits())) return;
    setSelectedAirline(nextValue || null);
  };

  const handleHotelSelect = async (nextValue) => {
    if (!(await confirmDiscardEdits())) return;
    setSelectedHotel(nextValue || null);
  };

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
      // Выпадающее меню живёт в портале, вне узла сайдбара: без этой проверки
      // клик по «Редактировать» считается кликом снаружи и закрывает панель.
      if (anchorEl && menuRef.current?.contains(event.target)) return;
      if (sidebarRef.current?.contains(event.target)) return;
      closeSidebar();
    };

    if (show) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [show, closeSidebar, isDialogOpen, anchorEl]);

  const handleSave = async () => {
    try {
      const { data: result } = await upsertRules({
        variables: { input: toUpsertInput(form, level, entityId) },
      });
      const saved = result?.upsertReportPartialDaySetting;
      if (saved) {
        const next = toRulesForm(saved);
        setState((prev) => ({ ...prev, initial: next }));
      }
      // Сохранили — возвращаемся к просмотру, панель остаётся открытой.
      setIsEditing(false);
      success("Правила сохранены");
      // Список настроек перечитываем: от него живут бейджи «переопределено».
      // Отказ refetch не превращаем в «не удалось сохранить» — запись уже в базе.
      refetch().catch(() => {});
    } catch (e) {
      notifyError(apolloErrorText(e, "Не удалось сохранить правила"));
    }
  };

  const handleResetToGlobal = async () => {
    if (!targetSetting) return;
    const isConfirmed = await confirm({
      message: "Сбросить правила к общим? Переопределение будет удалено.",
      confirmText: "Сбросить",
      cancelText: "Отмена",
    });
    if (!isConfirmed) return;
    try {
      await deleteRules({ variables: { id: targetSetting.id } });
      // Несохранённые правки не должны пережить сброс: форма возвращается к
      // initial, а после refetch синк-эффект подтянет унаследованные общие.
      setState((prev) => ({ ...prev, form: prev.initial }));
      setIsEditing(false);
      success("Правила сброшены к общим");
      refetch().catch(() => {});
    } catch (e) {
      notifyError(apolloErrorText(e, "Не удалось сбросить правила"));
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

  const airlinePicker = (
    <MUIAutocompleteColor
      dropdownWidth="100%"
      label="Выберите авиакомпанию"
      isDisabled={saving || deleting}
      options={airlines}
      getOptionLabel={(option) => (option ? option.name || "" : "")}
      renderOption={(optionProps, option) => (
        <li
          {...optionProps}
          className={`${optionProps.className || ""} ${classes.entityOption}`}
          key={option.id}
        >
          <span className={classes.entityOptionName}>{option.name}</span>
          {overriddenAirlineIds.has(option.id) && (
            <span className={classes.optionBadge}>переопределено</span>
          )}
        </li>
      )}
      value={selectedAirline || ""}
      onChange={(event, newValue) => handleAirlineSelect(newValue)}
    />
  );

  const hotelPicker = (
    <MUIAutocompleteColor
      dropdownWidth="100%"
      label="Выберите гостиницу"
      isDisabled={saving || deleting}
      options={hotels}
      getOptionLabel={(option) =>
        option ? `${option.name}, город: ${option?.information?.city || ""}`.trim() : ""
      }
      renderOption={(optionProps, option) => (
        <li
          {...optionProps}
          className={`${optionProps.className || ""} ${classes.entityOption}`}
          key={option.id}
        >
          <span className={classes.entityOptionName}>{option.name}</span>
          <span className={classes.entityOptionCity}>
            {option?.information?.city || ""}
          </span>
          {overriddenHotelIds.has(option.id) && (
            <span className={classes.optionBadge}>переопределено</span>
          )}
        </li>
      )}
      value={selectedHotel || ""}
      onChange={(event, newValue) => handleHotelSelect(newValue)}
    />
  );

  return (
    <>
      {show && <div className={classes.overlay} />}
      <Sidebar show={show} sidebarRef={sidebarRef}>
        <div className={classes.header}>
          <div className={classes.headerTitle}>Правила расчёта суток</div>
          <div className={classes.headerActions}>
            {/* Три точки видны только тем, кто вправе править: у остальных
                панель просто остаётся справочной. */}
            {canEdit && !isEditing && (
              <AdditionalMenu
                anchorEl={anchorEl}
                onOpen={handleMenuOpen}
                onClose={handleMenuClose}
                menuRef={menuRef}
                onEdit={handleEditFromMenu}
              />
            )}
            <button
              type="button"
              className={classes.closeBtn}
              onClick={closeSidebar}
              aria-label="Закрыть"
            >
              <CloseIcon />
            </button>
          </div>
        </div>

        {loading ? (
          <MUILoader loadSize="50px" fullHeight="80vh" />
        ) : (
          <>
            <div className={classes.body}>
              <ContractTypeToggle
                value={level}
                onChange={handleLevelChange}
                disabled={saving || deleting}
                options={LEVEL_OPTIONS}
              />

              {level !== "GLOBAL" && (
                <div className={classes.entityBlock}>
                  {level === "AIRLINE" ? airlinePicker : hotelPicker}
                  {entityId && (
                    <div className={classes.statusRow}>
                      {hasOverride ? (
                        <span className={classes.overrideBadge}>Переопределено</span>
                      ) : (
                        <span className={classes.inheritNote}>
                          Наследует общие правила
                        </span>
                      )}
                    </div>
                  )}
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
                          disabled={fieldsLocked}
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
                          disabled={fieldsLocked}
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

              {isEditing && hasOverride && (
                <button
                  type="button"
                  className={classes.resetLink}
                  onClick={handleResetToGlobal}
                  disabled={saving || deleting}
                >
                  Сбросить к общим
                </button>
              )}

              <div className={classes.infoBlock}>
                <span className={classes.infoIcon}>i</span>
                <div className={classes.infoText}>{LEVEL_INFO_TEXT[level]}</div>
              </div>
            </div>

            {/* Подвал — только в режиме правки: в просмотре сохранять нечего. */}
            {canEdit && isEditing && (
              <div className={classes.footer}>
                <button type="button" className={classes.cancelBtn} onClick={handleCancelEdit}>
                  Отмена
                </button>
                <button
                  type="button"
                  className={classes.mainBtn}
                  disabled={!hasChanges || !isValid || saving || needsEntity || deleting}
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
