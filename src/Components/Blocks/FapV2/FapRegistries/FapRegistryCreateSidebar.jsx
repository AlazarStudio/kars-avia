import { useCallback, useEffect, useRef, useState } from "react";
import { useLazyQuery, useMutation } from "@apollo/client";
import classes from "./FapRegistryCreateSidebar.module.css";
import Sidebar from "../../Sidebar/Sidebar";
import MUILoader from "../../MUILoader/MUILoader";
import MUIAutocomplete from "../../MUIAutocomplete/MUIAutocomplete";
import MUIAutocompleteColor from "../../MUIAutocompleteColor/MUIAutocompleteColor";
import CloseIcon from "../../../../shared/icons/CloseIcon";
import { useDialog } from "../../../../contexts/DialogContext";
import { useToast } from "../../../../contexts/ToastContext";
import useRequiredFields from "../../../../hooks/useRequiredFields";
import { apolloErrorText } from "../../../../utils/apolloErrorText.js";
import { toDateInputValue } from "../../../../utils/dateInputValue.js";
import {
  CREATE_PASSENGER_SERVICE_REGISTRY,
  UPDATE_PASSENGER_SERVICE_REGISTRY,
  GET_PASSENGER_SERVICE_REGISTRY_DEFAULTS,
  convertToDate,
  getCookie,
} from "../../../../../graphQL_requests";
import { REGISTRY_KIND_OPTIONS } from "../fapRegistryStages";

const HEADER_KEYS = [
  ["appendixLabel", "Приложение", "Приложение №3"],
  ["contractNumber", "Договор №", "1147/25"],
  ["contractDate", "Договор от", "2025-09-04"],
  ["executorName", "Исполнитель", "ООО «Карс Туристик»"],
  ["executorTitle", "Должность исполнителя", "Генеральный директор"],
  ["executorSignatory", "Подписант исполнителя", "Иванова И.И."],
  ["customerName", "Заказчик", "АО «Авиакомпания …»"],
  ["customerTitle", "Должность заказчика", "Заместитель генерального директора"],
  ["customerSignatory", "Подписант заказчика", "Петров П.П."],
];

// Прошлый календарный месяц — период по умолчанию.
const previousMonth = () => {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const end = new Date(now.getFullYear(), now.getMonth(), 0);
  return {
    periodStart: toDateInputValue(start),
    periodEnd: toDateInputValue(end),
  };
};

// Дата с бэка → YYYY-MM-DD для input[type="date"]. Границы периода бэк хранит
// как московские сутки (00:00 МСК = 21:00 UTC предыдущего дня), поэтому резать
// ISO по первым 10 символам нельзя — начало периода уехало бы на день назад.
// convertToDate даёт «DD.MM.YYYY» именно по Москве.
const toDateInput = (value) => {
  const [day, month, year] = convertToDate(value).split(".");
  return year ? `${year}-${month}-${day}` : "";
};

const emptyHeader = () => Object.fromEntries(HEADER_KEYS.map(([k]) => [k, ""]));

// registry — режим правки шапки/номера/периода уже сформированного реестра
// (вид и АК не меняются); без него — формирование нового.
export default function FapRegistryCreateSidebar({
  show,
  onClose,
  airlines = [],
  airports = [],
  onCreated,
  registry = null,
  onUpdated,
}) {
  const token = getCookie("token");
  const auth = { context: { headers: { Authorization: `Bearer ${token}` } } };
  const { confirm, isDialogOpen } = useDialog();
  const { success, error: notifyError } = useToast();
  const sidebarRef = useRef();
  const bodyRef = useRef();
  const editing = Boolean(registry);

  const [form, setForm] = useState(() => ({
    kind: "BAGGAGE",
    airlineId: "",
    airportId: "",
    number: "",
    ...previousMonth(),
    header: emptyHeader(),
  }));
  // Тронутые руками поля шапки — в ref, а не в state: .then запроса дефолтов
  // читает замыкание того рендера, что запустил эффект, и набранное, пока
  // запрос в полёте, иначе затиралось бы ответом. Рендер от этого не зависит.
  const touchedRef = useRef({});
  const [lastNumber, setLastNumber] = useState(null);
  const [isEdited, setIsEdited] = useState(false);
  const [saving, setSaving] = useState(false);

  const requiredKeys = editing
    ? ["number", "periodStart", "periodEnd"]
    : ["kind", "airlineId", "airportId", "number", "periodStart", "periodEnd"];
  const { invalid, validate, reset: resetRequired } = useRequiredFields(
    form,
    requiredKeys,
    bodyRef
  );

  const [loadDefaults, { loading: defaultsLoading }] = useLazyQuery(
    GET_PASSENGER_SERVICE_REGISTRY_DEFAULTS,
    { ...auth, fetchPolicy: "network-only" }
  );
  const [createRegistry] = useMutation(CREATE_PASSENGER_SERVICE_REGISTRY, auth);
  const [updateRegistry] = useMutation(UPDATE_PASSENGER_SERVICE_REGISTRY, auth);

  const resetForm = useCallback(() => {
    resetRequired();
    touchedRef.current = {};
    setLastNumber(null);
    setIsEdited(false);
    if (registry) {
      setForm({
        kind: registry.kind,
        airlineId: registry.airlineId,
        airportId: registry.airportId,
        number: registry.number ?? "",
        periodStart: toDateInput(registry.periodStart),
        periodEnd: toDateInput(registry.periodEnd),
        header: {
          ...emptyHeader(),
          ...Object.fromEntries(
            Object.entries(registry.header ?? {})
              .filter(([k]) => k !== "__typename")
              .map(([k, v]) => [k, v ?? ""])
          ),
        },
      });
    } else {
      setForm({
        kind: "BAGGAGE",
        airlineId: "",
        airportId: "",
        number: "",
        ...previousMonth(),
        header: emptyHeader(),
      });
    }
  }, [registry, resetRequired]);

  useEffect(() => {
    if (show) resetForm();
  }, [show, resetForm]);

  // Подсказки: последний номер, шапка предыдущего реестра, договор. Перезаполняем
  // только нетронутые поля — введённое руками не затираем.
  useEffect(() => {
    if (!show || editing || !form.kind || !form.airlineId) return undefined;
    let cancelled = false;
    loadDefaults({ variables: { kind: form.kind, airlineId: form.airlineId } }).then(
      ({ data }) => {
        if (cancelled) return;
        const d = data?.passengerServiceRegistryDefaults;
        if (!d) return;
        setLastNumber(d.lastNumber ?? null);
        setForm((prev) => {
          const header = { ...prev.header };
          for (const [key] of HEADER_KEYS) {
            if (touchedRef.current[`header.${key}`]) continue;
            let value = d.header?.[key] ?? "";
            if (key === "contractNumber" && d.contract?.number) value = d.contract.number;
            if (key === "contractDate" && d.contract?.date)
              value = toDateInput(d.contract.date);
            header[key] = value ?? "";
          }
          return { ...prev, header };
        });
      }
    );
    return () => {
      cancelled = true;
    };
  }, [show, editing, form.kind, form.airlineId, loadDefaults]);

  const setField = (key, value) => {
    setIsEdited(true);
    setForm((prev) => ({ ...prev, [key]: value }));
  };
  const setHeader = (key, value) => {
    setIsEdited(true);
    touchedRef.current[`header.${key}`] = true;
    setForm((prev) => ({ ...prev, header: { ...prev.header, [key]: value } }));
  };

  const closeButton = useCallback(async () => {
    if (isDialogOpen) return;
    if (!isEdited || (await confirm("Вы уверены? Введённые данные будут потеряны."))) {
      onClose();
    }
  }, [isDialogOpen, isEdited, confirm, onClose]);

  useEffect(() => {
    const onMouseDown = (event) => {
      if (isDialogOpen) return;
      if (
        event.target.closest(".MuiSnackbar-root") ||
        event.target.closest(".MuiPopper-root")
      )
        return;
      if (sidebarRef.current?.contains(event.target)) return;
      closeButton();
    };
    if (show) document.addEventListener("mousedown", onMouseDown);
    return () => document.removeEventListener("mousedown", onMouseDown);
  }, [show, closeButton, isDialogOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    if (form.periodEnd < form.periodStart) {
      notifyError("Конец периода раньше начала");
      return;
    }
    const header = Object.fromEntries(
      HEADER_KEYS.map(([k]) => [k, form.header[k]?.trim() || null])
    );
    try {
      setSaving(true);
      if (editing) {
        const { data } = await updateRegistry({
          variables: {
            id: registry.id,
            patch: {
              number: form.number.trim(),
              header,
              periodStart: form.periodStart,
              periodEnd: form.periodEnd,
            },
          },
        });
        setIsEdited(false);
        success("Реестр обновлён");
        onUpdated?.(data?.updatePassengerServiceRegistry);
      } else {
        const { data } = await createRegistry({
          variables: {
            input: {
              kind: form.kind,
              airlineId: form.airlineId,
              airportId: form.airportId,
              periodStart: form.periodStart,
              periodEnd: form.periodEnd,
              number: form.number.trim(),
              header,
            },
          },
        });
        setIsEdited(false);
        success("Реестр сформирован");
        onCreated?.(data?.createPassengerServiceRegistry?.id);
      }
    } catch (err) {
      notifyError(apolloErrorText(err));
    } finally {
      setSaving(false);
    }
  };

  const numberDuplicate =
    lastNumber != null && form.number.trim() !== "" && form.number.trim() === String(lastNumber);
  const label = (key, text, required) => (
    <label
      className={`${classes.label} ${required ? classes.labelRequired : ""} ${
        invalid(key) ? "fieldInvalid" : ""
      }`}
    >
      {text}
    </label>
  );

  return (
    <>
      {show && <div className={classes.overlay} />}
      <Sidebar show={show} sidebarRef={sidebarRef}>
        <div className={classes.header}>
          <div className={classes.headerTitle}>
            {editing ? "Изменить реестр" : "Сформировать реестр"}
          </div>
          <button
            type="button"
            className={classes.closeBtn}
            onClick={closeButton}
            aria-label="Закрыть"
          >
            <CloseIcon />
          </button>
        </div>
        {saving ? (
          <MUILoader loadSize="50px" fullHeight="80vh" />
        ) : (
          <form onSubmit={handleSubmit} className={classes.form}>
            <div className={classes.body} ref={bodyRef}>
              {!editing && (
                <>
                  <div className={classes.field}>
                    {label("kind", "Вид реестра", true)}
                    <MUIAutocomplete
                      dropdownWidth="100%"
                      label="Вид"
                      hideLabelOnFocus={false}
                      options={REGISTRY_KIND_OPTIONS.filter((o) => o.value)}
                      value={REGISTRY_KIND_OPTIONS.find((o) => o.value === form.kind) ?? null}
                      onChange={(_, v) => setField("kind", v?.value ?? "")}
                      getOptionLabel={(o) => o?.label ?? ""}
                      isOptionEqualToValue={(o, v) => o?.value === v?.value}
                      error={invalid("kind")}
                    />
                  </div>
                  <div className={classes.field}>
                    {label("airlineId", "Авиакомпания", true)}
                    <MUIAutocomplete
                      dropdownWidth="100%"
                      label="Выберите авиакомпанию"
                      options={airlines.map((a) => a.name)}
                      value={airlines.find((a) => a.id === form.airlineId)?.name ?? ""}
                      onChange={(_, v) =>
                        setField("airlineId", airlines.find((a) => a.name === v)?.id ?? "")
                      }
                      error={invalid("airlineId")}
                    />
                  </div>
                  <div className={classes.field}>
                    {label("airportId", "Аэропорт", true)}
                    <MUIAutocompleteColor
                      dropdownWidth="100%"
                      label="Выберите аэропорт"
                      options={airports}
                      getOptionLabel={(o) =>
                        o
                          ? `${o.code} ${o.name}${
                              o.city && o.city !== o.name ? `, ${o.city}` : ""
                            }`.trim()
                          : ""
                      }
                      renderOption={(optionProps, option) => (
                        <li {...optionProps} key={option.id}>
                          <span style={{ color: "black" }}>
                            {`${option.code} ${option.name}`.trim()}
                          </span>
                          {option.city && option.city !== option.name && (
                            <span style={{ color: "gray", marginLeft: 4 }}>{option.city}</span>
                          )}
                        </li>
                      )}
                      value={airports.find((o) => o.id === form.airportId) || null}
                      isOptionEqualToValue={(o, v) => o?.id === v?.id}
                      onChange={(_, v) => setField("airportId", v?.id ?? "")}
                      error={invalid("airportId")}
                    />
                  </div>
                </>
              )}

              <div className={classes.row}>
                <div className={`${classes.field} ${classes.rowItem}`}>
                  {label("periodStart", "Период с", true)}
                  <input
                    type="date"
                    className={`${classes.input} ${invalid("periodStart") ? "inputInvalid" : ""}`}
                    value={form.periodStart}
                    onChange={(e) => setField("periodStart", e.target.value)}
                  />
                </div>
                <div className={`${classes.field} ${classes.rowItem}`}>
                  {label("periodEnd", "по", true)}
                  <input
                    type="date"
                    className={`${classes.input} ${invalid("periodEnd") ? "inputInvalid" : ""}`}
                    min={form.periodStart}
                    value={form.periodEnd}
                    onChange={(e) => setField("periodEnd", e.target.value)}
                  />
                </div>
              </div>

              <div className={classes.field}>
                {label("number", "Номер реестра", true)}
                <input
                  className={`${classes.input} ${invalid("number") ? "inputInvalid" : ""}`}
                  value={form.number}
                  onChange={(e) => setField("number", e.target.value)}
                  placeholder={
                    lastNumber != null ? `Последний по этой АК: №${lastNumber}` : "10"
                  }
                />
                {defaultsLoading && <span className={classes.hint}>Ищем последний номер…</span>}
                {numberDuplicate && (
                  <span className={classes.warn}>
                    Такой номер у этой АК уже есть — реестр всё равно можно сформировать
                  </span>
                )}
              </div>

              <div className={classes.groupTitle}>Шапка документа</div>
              {HEADER_KEYS.map(([key, text, placeholder]) => (
                <div className={classes.field} key={key}>
                  <label className={classes.label}>{text}</label>
                  <input
                    className={classes.input}
                    type={key === "contractDate" ? "date" : "text"}
                    value={form.header[key] ?? ""}
                    onChange={(e) => setHeader(key, e.target.value)}
                    placeholder={placeholder}
                  />
                </div>
              ))}
            </div>
            <div className={classes.footer}>
              <button type="button" className={classes.cancelBtn} onClick={closeButton}>
                Отмена
              </button>
              <button type="submit" className={classes.mainBtn}>
                {editing ? "Сохранить" : "Сформировать"}
              </button>
            </div>
          </form>
        )}
      </Sidebar>
    </>
  );
}
