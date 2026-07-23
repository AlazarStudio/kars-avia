import { useState, useMemo, useCallback, useEffect, useRef, Fragment } from "react";
import { useQuery } from "@apollo/client";
import { differenceInCalendarDays } from "date-fns";
import classes from "./PassengerAnalytics.module.css";
import aa from "../AirlineAnalytics/AirlineAnalytics.module.css";
import DateRangePickerCustom from "../../DateRangePickerCustom";
import MUITextField from "../../../../Blocks/MUITextField/MUITextField";
import MUIAutocompleteColor from "../../../../Blocks/MUIAutocompleteColor/MUIAutocompleteColor";
import MultiSelectAutocomplete from "../../../../Blocks/MultiSelectAutocomplete/MultiSelectAutocomplete";
import MUILoader from "../../../../Blocks/MUILoader/MUILoader";
import Button from "../../../../Standart/Button/Button";
import AnalyticsChart from "../../AnalyticsChart/AnalyticsChart";
import { REQUEST_STATUS_CONFIG } from "../../../../Blocks/FapV2/fapConstants";
import {
  cmpNum,
  cmpStr,
  nextSortDir,
} from "../AirlineAnalytics/analyticsTableSortUtils";
import {
  GET_PASSENGER_ANALYTICS,
  GET_AIRLINES_LIGHT,
  GET_AIRPORTS_RELAY,
  getCookie,
} from "../../../../../../graphQL_requests";
import {
  formatRub,
  formatInt,
  formatDateRu,
  buildPassengerAnalyticsInput,
  decadePresets,
} from "./passengerAnalyticsMappers";
import { exportPassengerAnalyticsXlsx, exportPassengerSummaryXlsx } from "./passengerAnalyticsExport";
import { buildSummary, buildChartData } from "./passengerAnalyticsAggregations";

const COLUMN_TYPE = {
  number: "str",
  airport: "str",
  flightDate: "num",
  people: "num",
  groups: "num",
  kids: "num",
  nights: "num",
  living: "num",
  meal: "num",
  transfer: "num",
  total: "num",
};

const STATUS_ORDER = ["CREATED", "ACCEPTED", "IN_PROGRESS", "COMPLETED", "CANCELLED"];
const DEFAULT_STATUSES = ["CREATED", "ACCEPTED", "IN_PROGRESS", "COMPLETED"];

const DIMENSIONS = [
  { key: "airport", label: "Аэропорты", col: "Аэропорт", chartTitle: "По аэропортам" },
  { key: "airline", label: "Авиакомпании", col: "Авиакомпания", chartTitle: "По авиакомпаниям" },
  { key: "month", label: "Месяцы", col: "Месяц", chartTitle: "По месяцам" },
];

const CHART_METRICS = {
  money: { colors: ["#0057C3", "#4CAF50", "#ff9800"], format: formatRub },
  people: { colors: ["#0057C3", "#2196f3"], format: formatInt },
};

const DONUT_COLORS = ["#0057C3", "#4CAF50", "#ff9800"];

function isPeriodComplete(r) {
  return Boolean(
    r?.startDate &&
      r?.endDate &&
      !Number.isNaN(new Date(r.startDate).getTime()) &&
      !Number.isNaN(new Date(r.endDate).getTime())
  );
}

function periodHuman(r) {
  if (!isPeriodComplete(r)) return "";
  const days = differenceInCalendarDays(new Date(r.endDate), new Date(r.startDate)) + 1;
  return `${formatDateRu(r.startDate)} — ${formatDateRu(r.endDate)}  ·  ${days} дн.`;
}

function getSortVal(row, key) {
  switch (key) {
    case "number":
      return row.flightNumber ?? row.requestNumber ?? "";
    case "airport":
      return row.airportCode ?? row.airportName ?? "";
    case "flightDate":
      return row.flightDate ? new Date(row.flightDate).getTime() : null;
    case "people":
      return row.peopleCount;
    case "groups":
      return row.groupsCount;
    case "kids":
      return (row.childrenCount || 0) + (row.infantsCount || 0);
    case "nights":
      return row.roomNights;
    case "living":
      return row.living;
    case "meal":
      return row.meal;
    case "transfer":
      return row.transfer;
    case "total":
      return row.total;
    default:
      return null;
  }
}

const formatNights = (n) => {
  const v = Number(n) || 0;
  return Number.isInteger(v)
    ? formatInt(v)
    : v.toLocaleString("ru-RU", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
};

function StatusPill({ status }) {
  const cfg = REQUEST_STATUS_CONFIG?.[status];
  return (
    <span
      className={classes.statusPill}
      style={cfg ? { color: cfg.color, backgroundColor: cfg.bg } : undefined}
    >
      {cfg?.label || status || "—"}
    </span>
  );
}

function SortHead({ label, columnKey, sort, onSort, num }) {
  const active = sort?.key === columnKey;
  const arrow = active ? (sort.dir === "asc" ? "↑" : "↓") : "";
  return (
    <th
      className={`${classes.th} ${num ? classes.num : ""} ${classes.sortable} ${
        active ? classes.sortActive : ""
      }`}
      onClick={() => onSort(columnKey)}
    >
      {label}
      {arrow && <span className={classes.sortArrow}>{arrow}</span>}
    </th>
  );
}

function CalendarIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}

function PassengerAnalytics({ user, filterOpen, onFilterClose, onPeriodChange }) {
  const token = getCookie("token");
  const isAirline = !!user?.airlineId;

  // draft-фильтры (в модалке)
  const [range, setRange] = useState(null);
  const [airports, setAirports] = useState([]);
  const [flightNumber, setFlightNumber] = useState("");
  const [statuses, setStatuses] = useState(DEFAULT_STATUSES);
  const [airline, setAirline] = useState(null);
  const [presetMonth, setPresetMonth] = useState(() => new Date());
  const [showPicker, setShowPicker] = useState(false);
  const [discardConfirmOpen, setDiscardConfirmOpen] = useState(false);

  // применённый снимок, который гонит запрос
  const [appliedInput, setAppliedInput] = useState(null);
  const [sort, setSort] = useState(null);
  const [expandedId, setExpandedId] = useState(null);
  const [viewMode, setViewMode] = useState("requests");
  const [dimension, setDimension] = useState("airport");
  const [summarySort, setSummarySort] = useState(null);
  const [chartMetric, setChartMetric] = useState("money");

  const filterStateRef = useRef({});
  const openSnapshotRef = useRef(null);
  filterStateRef.current = { range, airports, flightNumber, statuses, airline };

  const { data: airportsData } = useQuery(GET_AIRPORTS_RELAY, {
    context: { headers: { Authorization: token ? `Bearer ${token}` : "" } },
  });
  const airportOptions = useMemo(
    () => (airportsData?.airports || []).map((a) => ({ id: a.id, label: a.name })),
    [airportsData]
  );

  const { data: airlinesData } = useQuery(GET_AIRLINES_LIGHT, {
    context: { headers: { Authorization: token ? `Bearer ${token}` : "" } },
    skip: isAirline,
  });
  const airlineOptions = useMemo(
    () => (airlinesData?.airlines?.airlines || []).map((a) => ({ id: a.id, label: a.name })),
    [airlinesData]
  );

  const { data, loading } = useQuery(GET_PASSENGER_ANALYTICS, {
    variables: { input: appliedInput },
    skip: !appliedInput,
    context: { headers: { Authorization: token ? `Bearer ${token}` : "" } },
    fetchPolicy: "cache-and-network",
  });

  const result = data?.passengerAnalytics || null;
  const rows = result?.requests || [];
  const totals = result?.totals || null;

  // Снимок фильтров при открытии модалки (для discard-подтверждения)
  useEffect(() => {
    if (filterOpen) {
      const f = filterStateRef.current;
      openSnapshotRef.current = {
        range: f.range ? { ...f.range } : null,
        airports: [...(f.airports || [])],
        flightNumber: f.flightNumber || "",
        statuses: [...(f.statuses || [])],
        airline: f.airline || null,
      };
      setDiscardConfirmOpen(false);
    }
  }, [filterOpen]);

  // Оповещаем родителя (шапка над табами) о применённом периоде
  useEffect(() => {
    if (!appliedInput) {
      onPeriodChange?.(null);
      return;
    }
    const days =
      differenceInCalendarDays(new Date(appliedInput.dateTo), new Date(appliedInput.dateFrom)) + 1;
    onPeriodChange?.({
      p1: `${formatDateRu(appliedInput.dateFrom)} — ${formatDateRu(appliedInput.dateTo)} · ${days} дн.`,
    });
  }, [appliedInput]); // eslint-disable-line react-hooks/exhaustive-deps

  const sortedRows = useMemo(() => {
    if (!sort) return rows;
    const { key, dir } = sort;
    const cmp = COLUMN_TYPE[key] === "num" ? cmpNum : cmpStr;
    return [...rows].sort((a, b) => cmp(getSortVal(a, key), getSortVal(b, key), dir));
  }, [rows, sort]);

  const summaryRows = useMemo(() => buildSummary(rows, dimension), [rows, dimension]);
  const sortedSummaryRows = useMemo(() => {
    if (!summarySort) return summaryRows;
    const { key, dir } = summarySort;
    const getVal = (g) =>
      key === "label" ? g.label : key === "kids" ? g.childrenCount + g.infantsCount : g[key];
    const cmp = key === "label" ? cmpStr : cmpNum;
    return [...summaryRows].sort((a, b) => cmp(getVal(a), getVal(b), dir));
  }, [summaryRows, summarySort]);
  const onSummarySort = (key) => setSummarySort((s) => ({ key, dir: nextSortDir(s, key) }));

  const chartData = useMemo(
    () => buildChartData(summaryRows, dimension, chartMetric),
    [summaryRows, dimension, chartMetric]
  );
  const donutData = useMemo(
    () =>
      totals
        ? [
            { x: "Проживание", value: totals.living },
            { x: "Питание", value: totals.meal },
            { x: "Трансфер", value: totals.transfer },
          ]
        : [],
    [totals]
  );

  const onSort = (key) => {
    if (!COLUMN_TYPE[key]) return;
    setSort((s) => ({ key, dir: nextSortDir(s, key) }));
  };

  const openPicker = useCallback(() => setShowPicker(true), []);
  const applyPicker = useCallback((r) => {
    setRange({ ...r, key: "selection" });
    setShowPicker(false);
  }, []);
  const applyDecade = (preset) =>
    setRange({ startDate: preset.startDate, endDate: preset.endDate, key: "selection" });

  const hasDraftChanges = useCallback(() => {
    const s = openSnapshotRef.current;
    if (!s) return false;
    const f = filterStateRef.current;
    const rangesEqual = (a, b) => {
      if (!a && !b) return true;
      if (!a || !b) return false;
      return (
        new Date(a.startDate).getTime() === new Date(b.startDate).getTime() &&
        new Date(a.endDate).getTime() === new Date(b.endDate).getTime()
      );
    };
    const idsKey = (arr) => (arr || []).map((x) => x?.id).join(",");
    return (
      !rangesEqual(f.range, s.range) ||
      idsKey(f.airports) !== idsKey(s.airports) ||
      (f.flightNumber || "") !== s.flightNumber ||
      (f.statuses || []).join(",") !== (s.statuses || []).join(",") ||
      (f.airline?.id ?? null) !== (s.airline?.id ?? null)
    );
  }, []);

  const handleModalCloseAttempt = useCallback(() => {
    if (hasDraftChanges()) setDiscardConfirmOpen(true);
    else onFilterClose?.();
  }, [hasDraftChanges, onFilterClose]);

  const handleDiscardAndClose = useCallback(() => {
    const s = openSnapshotRef.current;
    if (s) {
      setRange(s.range);
      setAirports(s.airports);
      setFlightNumber(s.flightNumber);
      setStatuses(s.statuses);
      setAirline(s.airline);
    }
    setDiscardConfirmOpen(false);
    onFilterClose?.();
  }, [onFilterClose]);

  const handleApplyAndClose = useCallback(() => {
    setAppliedInput(
      buildPassengerAnalyticsInput({
        range,
        airportIds: airports.map((a) => a.id),
        flightNumber,
        statuses,
        airlineId: !isAirline ? airline?.id || null : null,
      })
    );
    onFilterClose?.();
  }, [range, airports, flightNumber, statuses, airline, isAirline, onFilterClose]);

  const handleExport = () => {
    if (!result) return;
    if (viewMode === "summary") {
      exportPassengerSummaryXlsx({
        summaryRows: sortedSummaryRows,
        totals,
        dimensionLabel: DIMENSIONS.find((d) => d.key === dimension).label,
        meta: {
          periodLabel: periodHuman(range) || "",
          fileName: `Аналитика_пассажиры_сводка_${formatDateRu(appliedInput?.dateFrom)}_${formatDateRu(appliedInput?.dateTo)}.xlsx`,
        },
      });
      return;
    }
    exportPassengerAnalyticsXlsx({
      rows: sortedRows,
      totals,
      showAirline: !isAirline,
      meta: {
        periodLabel: periodHuman(range) || "",
        airlineName: isAirline ? rows[0]?.airlineName || "" : "",
        fileName: `Аналитика_пассажиры_${formatDateRu(appliedInput?.dateFrom)}_${formatDateRu(
          appliedInput?.dateTo
        )}.xlsx`,
      },
    });
  };

  return (
    <div className={classes.wrap}>
      {/* ─── Модалка фильтров (открывается кнопкой «Фильтры» в шапке) ─── */}
      {filterOpen && (
        <div className={aa.filterModalOverlay} onClick={handleModalCloseAttempt}>
          <div className={aa.filterModalCard} onClick={(e) => e.stopPropagation()}>
            <div className={aa.filterModalHeader}>
              <span className={aa.filterModalTitle}>Фильтры</span>
              <button type="button" className={aa.filterModalCloseBtn} onClick={handleModalCloseAttempt}>
                ✕
              </button>
            </div>

            <div className={aa.filterModalBody}>
              <div className={aa.filterModalPeriodCard}>
                <span className={aa.filterModalPeriodLabel}>Период</span>
                <button type="button" className={aa.periodButtonModal} onClick={openPicker}>
                  <CalendarIcon />
                  {isPeriodComplete(range) ? periodHuman(range) : "Выбрать период"}
                </button>

                <div className={classes.monthSwitch}>
                  <button type="button" className={classes.monthBtn} onClick={() => setPresetMonth((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1))}>‹</button>
                  <span className={classes.monthLabel}>
                    {presetMonth.toLocaleDateString("ru-RU", { month: "long" })} {presetMonth.getFullYear()}
                  </span>
                  <button type="button" className={classes.monthBtn} onClick={() => setPresetMonth((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1))}>›</button>
                </div>

                <div className={classes.modalDecades}>
                  {decadePresets(presetMonth).map((p) => (
                    <button
                      key={p.label}
                      type="button"
                      className={classes.decadeBtn}
                      onClick={() => applyDecade(p)}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>

                <div className={classes.statusChips}>
                  {STATUS_ORDER.map((code) => {
                    const cfg = REQUEST_STATUS_CONFIG?.[code];
                    const active = statuses.includes(code);
                    return (
                      <button
                        key={code}
                        type="button"
                        className={`${classes.statusChip} ${active ? classes.statusChipActive : ""}`}
                        style={active && cfg ? { color: cfg.color, backgroundColor: cfg.bg, borderColor: cfg.color } : undefined}
                        onClick={() =>
                          setStatuses((prev) => (prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]))
                        }
                      >
                        {cfg?.label || code}
                      </button>
                    );
                  })}
                </div>

                <div className={aa.filterModalRow2col}>
                  <MultiSelectAutocomplete
                    dropdownWidth="100%"
                    label="Аэропорты"
                    options={airportOptions}
                    value={airports}
                    onChange={(e, v) => setAirports(v || [])}
                    isMultiple
                    limitTags={2}
                  />
                  <MUITextField
                    label="№ рейса"
                    value={flightNumber}
                    onChange={(e) => setFlightNumber(e.target.value)}
                  />
                </div>

                {!isAirline && (
                  <MUIAutocompleteColor
                    dropdownWidth="100%"
                    label="Авиакомпания"
                    options={airlineOptions}
                    value={airline}
                    onChange={(e, v) => setAirline(v || null)}
                  />
                )}
              </div>
            </div>

            <div className={aa.filterModalFooter}>
              <button type="button" className={aa.filterModalCancelBtn} onClick={handleModalCloseAttempt}>
                Отмена
              </button>
              <Button
                type="button"
                onClick={handleApplyAndClose}
                disabled={!isPeriodComplete(range) || statuses.length === 0}
                padding="0 28px"
                height="40px"
                fontSize="14px"
                fontWeight="600"
              >
                Применить
              </Button>
            </div>

            {discardConfirmOpen && (
              <div className={aa.discardOverlay}>
                <div className={aa.discardCard}>
                  <p className={aa.discardText}>
                    Вы изменили параметры фильтра, но не применили их. Закрыть без сохранения?
                  </p>
                  <div className={aa.discardActions}>
                    <button type="button" className={aa.discardContinueBtn} onClick={() => setDiscardConfirmOpen(false)}>
                      Продолжить редактирование
                    </button>
                    <button type="button" className={aa.discardCloseBtn} onClick={handleDiscardAndClose}>
                      Закрыть без сохранения
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {showPicker && (
        <DateRangePickerCustom value={range} onChange={applyPicker} onClose={() => setShowPicker(false)} />
      )}

      {/* ─── Пустое состояние: гайд ─── */}
      {!appliedInput ? (
        <div className={aa.emptyState}>
          <div className={aa.emptyStateIcon}>
            <svg width="56" height="56" viewBox="0 0 56 56" fill="none" aria-hidden>
              <rect width="56" height="56" rx="16" fill="#eef2fd" />
              <g stroke="#0057c3" strokeWidth="2.6" strokeLinecap="round">
                <line x1="19" y1="21" x2="37" y2="21" />
                <line x1="23" y1="28" x2="33" y2="28" />
                <line x1="26" y1="35" x2="30" y2="35" />
              </g>
            </svg>
          </div>
          <p className={aa.emptyStateTitle}>Настройте фильтры</p>
          <p className={aa.emptyStateSubtitle}>
            Выберите период (при необходимости — аэропорт / № рейса)
            <br />
            в фильтрах справа сверху
          </p>
          <div className={aa.emptyStateSteps}>
            <div className={aa.emptyStateStep}>
              <span className={aa.emptyStateStepNum}>1</span>
              <span>Нажмите «Фильтры»</span>
            </div>
            <div className={aa.emptyStateStep}>
              <span className={aa.emptyStateStepNum}>2</span>
              <span>Выберите период</span>
            </div>
            <div className={aa.emptyStateStep}>
              <span className={aa.emptyStateStepNum}>3</span>
              <span>Нажмите «Применить» — данные загрузятся</span>
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* Шапка результатов */}
          <div className={classes.resultsHeader}>
            <span className={classes.resultsTitle}>Сводка по пассажирам</span>
            <div className={classes.viewSwitch}>
              <button
                type="button"
                className={`${classes.viewBtn} ${viewMode === "requests" ? classes.viewBtnActive : ""}`}
                onClick={() => setViewMode("requests")}
              >
                По заявкам
              </button>
              <button
                type="button"
                className={`${classes.viewBtn} ${viewMode === "summary" ? classes.viewBtnActive : ""}`}
                onClick={() => setViewMode("summary")}
              >
                Сводки
              </button>
            </div>
            <div className={`${aa.exportButtons} pdfNoCapture`}>
              <button
                type="button"
                className={aa.exportXlsxButton}
                onClick={handleExport}
                disabled={!result}
              >
                Выгрузить xlsx
              </button>
            </div>
          </div>

          {/* Итоги */}
          {totals && (
            <div className={classes.kpiRow}>
              <div className={classes.kpi}>
                <span className={classes.kpiLabel}>Заявок</span>
                <span className={classes.kpiValue}>{formatInt(totals.requestsCount)}</span>
              </div>
              <div className={classes.kpi}>
                <span className={classes.kpiLabel}>Человек</span>
                <span className={classes.kpiValue}>{formatInt(totals.peopleCount)}</span>
              </div>
              <div className={classes.kpi}>
                <span className={classes.kpiLabel}>Связано пассажиров</span>
                <span className={classes.kpiValue}>{formatInt(totals.linkedPeopleCount)}</span>
              </div>
              <div className={classes.kpi}>
                <span className={classes.kpiLabel}>Дети</span>
                <span className={classes.kpiValue}>
                  {formatInt((totals.childrenCount || 0) + (totals.infantsCount || 0))}
                  {totals.infantsCount > 0 ? ` (+${formatInt(totals.infantsCount)} млад.)` : ""}
                </span>
              </div>
              <div className={classes.kpi}>
                <span className={classes.kpiLabel}>Суток</span>
                <span className={classes.kpiValue}>{formatNights(totals.roomNights)}</span>
              </div>
              <div className={classes.kpi}>
                <span className={classes.kpiLabel}>Проживание</span>
                <span className={classes.kpiValue}>{formatRub(totals.living)}</span>
              </div>
              <div className={classes.kpi}>
                <span className={classes.kpiLabel}>Питание</span>
                <span className={classes.kpiValue}>{formatRub(totals.meal)}</span>
              </div>
              <div className={classes.kpi}>
                <span className={classes.kpiLabel}>Трансфер</span>
                <span className={classes.kpiValue}>{formatRub(totals.transfer)}</span>
              </div>
              <div className={`${classes.kpi} ${classes.kpiGrand}`}>
                <span className={classes.kpiLabel}>Итого</span>
                <span className={classes.kpiValue}>{formatRub(totals.total)}</span>
              </div>
              {totals.missingCostCount > 0 && (
                <div className={`${classes.kpi} ${classes.kpiWarn}`}>
                  <span className={classes.kpiLabel}>Без стоимости</span>
                  <span className={classes.kpiValue}>{formatInt(totals.missingCostCount)}</span>
                </div>
              )}
            </div>
          )}

          {loading && (
            <div className={classes.stateBox}>
              <MUILoader />
            </div>
          )}
          {!loading && rows.length === 0 && (
            <div className={classes.empty}>Нет заявок за выбранный период.</div>
          )}

          {viewMode === "requests" && rows.length > 0 && (
            <div className={classes.tableCard}>
              <div className={classes.tableScroll}>
                <table className={classes.table}>
                  <thead>
                    <tr>
                      <SortHead label="№ рейса" columnKey="number" sort={sort} onSort={onSort} />
                      <SortHead label="Дата рейса" columnKey="flightDate" sort={sort} onSort={onSort} />
                      {!isAirline && <th className={classes.th}>Авиакомпания</th>}
                      <SortHead label="Аэропорт" columnKey="airport" sort={sort} onSort={onSort} />
                      <th className={classes.th}>Гостиница(ы)</th>
                      <SortHead label="Чел." columnKey="people" sort={sort} onSort={onSort} num />
                      <SortHead label="Дети" columnKey="kids" sort={sort} onSort={onSort} num />
                      <SortHead label="Группы" columnKey="groups" sort={sort} onSort={onSort} num />
                      <SortHead label="Суток" columnKey="nights" sort={sort} onSort={onSort} num />
                      <SortHead label="Проживание" columnKey="living" sort={sort} onSort={onSort} num />
                      <SortHead label="Питание" columnKey="meal" sort={sort} onSort={onSort} num />
                      <SortHead label="Трансфер" columnKey="transfer" sort={sort} onSort={onSort} num />
                      <SortHead label="Итого" columnKey="total" sort={sort} onSort={onSort} num />
                      <th className={classes.th}>Статус</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedRows.map((r) => (
                      <Fragment key={r.requestId}>
                        <tr
                          className={`${r.costMissing ? classes.rowMissing : ""} ${classes.rowClickable} ${
                            expandedId === r.requestId ? classes.rowExpanded : ""
                          }`}
                          onClick={() => setExpandedId(expandedId === r.requestId ? null : r.requestId)}
                        >
                          <td className={classes.tdStrong}>
                            {r.flightNumber || r.requestNumber || "—"}
                            <a
                              className={classes.openLink}
                              href={`/far/${r.requestId}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              title="Открыть заявку"
                            >
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                                <polyline points="15 3 21 3 21 9" />
                                <line x1="10" y1="14" x2="21" y2="3" />
                              </svg>
                            </a>
                          </td>
                          <td>{r.flightDate ? formatDateRu(r.flightDate) : "—"}</td>
                          {!isAirline && <td className={classes.tdEllipsis} title={r.airlineName || ""}>{r.airlineName || "—"}</td>}
                          <td>{r.airportCode || r.airportName || "—"}</td>
                          <td className={classes.tdHotels} title={r.hotelNames?.length ? r.hotelNames.join(", ") : ""}>
                            {r.hotelNames?.length ? r.hotelNames.join(", ") : "—"}
                          </td>
                          <td className={classes.num}>{formatInt(r.peopleCount)}</td>
                          <td className={classes.num}>
                            {(r.childrenCount || 0) + (r.infantsCount || 0) > 0
                              ? r.infantsCount > 0
                                ? `${r.childrenCount || 0}+${r.infantsCount}`
                                : `${r.childrenCount}`
                              : "—"}
                          </td>
                          <td className={classes.num}>
                            {r.groupsCount > 0 ? (
                              <span className={classes.grp}>
                                {formatInt(r.groupsCount)} гр. · {formatInt(r.linkedPeopleCount)} чел.
                              </span>
                            ) : (
                              "—"
                            )}
                          </td>
                          <td className={classes.num}>{r.roomNights > 0 ? formatNights(r.roomNights) : "—"}</td>
                          <td className={classes.num}>{r.costMissing ? "—" : formatRub(r.living)}</td>
                          <td className={classes.num}>{r.costMissing ? "—" : formatRub(r.meal)}</td>
                          <td className={classes.num}>{r.costMissing ? "—" : formatRub(r.transfer)}</td>
                          <td className={`${classes.num} ${classes.tdTotal}`}>
                            {r.costMissing ? (
                              <span className={classes.missingTag}>нет отчёта</span>
                            ) : (
                              formatRub(r.total)
                            )}
                          </td>
                          <td>
                            <StatusPill status={r.status} />
                          </td>
                        </tr>
                        {expandedId === r.requestId && (
                          <tr className={classes.detailRow}>
                            <td colSpan={isAirline ? 13 : 14} className={classes.detailCell}>
                              <div className={classes.detailGrid}>
                                <div className={classes.detailBlock}>
                                  <div className={classes.detailTitle}>Трансфер</div>
                                  <div className={classes.detailLine}><span>Прилёт</span><span>{formatRub(r.transferArrival)}</span></div>
                                  <div className={classes.detailLine}><span>Вылет</span><span>{formatRub(r.transferDeparture)}</span></div>
                                  <div className={classes.detailLine}><span>Багаж</span><span>{formatRub(r.transferBaggage)}</span></div>
                                  {r.transferIntercity > 0 && (
                                    <div className={classes.detailLine}><span>Межгород</span><span>{formatRub(r.transferIntercity)}</span></div>
                                  )}
                                </div>
                                <div className={classes.detailBlock}>
                                  <div className={classes.detailTitle}>По гостиницам</div>
                                  {(r.hotels || []).length === 0 ? (
                                    <div className={classes.detailMuted}>Нет проживания</div>
                                  ) : (
                                    <table className={classes.detailTable}>
                                      <thead>
                                        <tr><th>Гостиница</th><th>Чел.</th><th>Суток</th><th>Проживание</th><th>Питание</th></tr>
                                      </thead>
                                      <tbody>
                                        {r.hotels.map((h, i) => (
                                          <tr key={i}>
                                            <td>{h.hotelName || "—"}</td>
                                            <td className={classes.num}>{formatInt(h.peopleCount)}</td>
                                            {h.reportSaved ? (
                                              <>
                                                <td className={classes.num}>{formatNights(h.roomNights)}</td>
                                                <td className={classes.num}>{formatRub(h.living)}</td>
                                                <td className={classes.num}>{formatRub(h.meal)}</td>
                                              </>
                                            ) : (
                                              <td colSpan={3}><span className={classes.missingTag}>нет отчёта</span></td>
                                            )}
                                          </tr>
                                        ))}
                                      </tbody>
                                    </table>
                                  )}
                                </div>
                                <div className={classes.detailBlock}>
                                  <div className={classes.detailTitle}>Люди и сервисы</div>
                                  <div className={classes.detailLine}>
                                    <span>Взр. / дети / млад.</span>
                                    <span>{formatInt(r.adultsCount)} / {formatInt(r.childrenCount)} / {formatInt(r.infantsCount)}</span>
                                  </div>
                                  {r.crewCount > 0 && (
                                    <div className={classes.detailLine}><span>Экипаж</span><span>{formatInt(r.crewCount)}</span></div>
                                  )}
                                  {(r.breakfastsCount || 0) + (r.lunchesCount || 0) + (r.dinnersCount || 0) + (r.lunchboxesCount || 0) > 0 && (
                                    <div className={classes.detailLine}>
                                      <span>Питание З/О/У/ЛБ</span>
                                      <span>{formatInt(r.breakfastsCount)} / {formatInt(r.lunchesCount)} / {formatInt(r.dinnersCount)} / {formatInt(r.lunchboxesCount)}</span>
                                    </div>
                                  )}
                                  {(r.waterPlanned > 0 || r.waterServed > 0) && (
                                    <div className={classes.detailLine}><span>Вода (план/факт)</span><span>{formatInt(r.waterPlanned)} / {formatInt(r.waterServed)}</span></div>
                                  )}
                                  {(r.mealServicePlanned > 0 || r.mealServiceServed > 0) && (
                                    <div className={classes.detailLine}><span>Раздача питания (план/факт)</span><span>{formatInt(r.mealServicePlanned)} / {formatInt(r.mealServiceServed)}</span></div>
                                  )}
                                  {r.avgPricePerNight > 0 && (
                                    <div className={classes.detailLine}><span>Средняя цена за ночь</span><span>{formatRub(r.avgPricePerNight)}</span></div>
                                  )}
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </Fragment>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {viewMode === "summary" && rows.length > 0 && (
            <>
              <div className={classes.dimChips}>
                {DIMENSIONS.filter((d) => !(isAirline && d.key === "airline")).map((d) => (
                  <button
                    key={d.key}
                    type="button"
                    className={`${classes.dimChip} ${dimension === d.key ? classes.dimChipActive : ""}`}
                    onClick={() => setDimension(d.key)}
                  >
                    {d.label}
                  </button>
                ))}
              </div>
              <div className={classes.summaryFlow}>
              <div className={classes.chartsRow}>
                <div className={classes.chartCard}>
                  <div className={classes.chartCardHead}>
                    <span className={classes.chartCardTitle}>
                      {DIMENSIONS.find((d) => d.key === dimension).chartTitle}
                    </span>
                    <div className={classes.metricSwitch}>
                      <button
                        type="button"
                        className={`${classes.metricBtn} ${chartMetric === "money" ? classes.metricBtnActive : ""}`}
                        onClick={() => setChartMetric("money")}
                      >
                        ₽
                      </button>
                      <button
                        type="button"
                        className={`${classes.metricBtn} ${chartMetric === "people" ? classes.metricBtnActive : ""}`}
                        onClick={() => setChartMetric("people")}
                      >
                        Люди
                      </button>
                    </div>
                  </div>
                  <AnalyticsChart
                    type="stackedBar"
                    data={chartData.data}
                    series={chartData.series}
                    xKey="x"
                    height={260}
                    colors={CHART_METRICS[chartMetric].colors}
                    groupedValueFormat={CHART_METRICS[chartMetric].format}
                    fullWidth
                  />
                  {dimension === "month" && chartData.noDateCount > 0 && (
                    <div className={classes.chartCaption}>
                      Заявок без даты рейса: {formatInt(chartData.noDateCount)} — на графике не показаны
                    </div>
                  )}
                </div>
                {totals && (
                  <div className={classes.chartCardSide}>
                    <span className={classes.chartCardTitle}>Структура расходов</span>
                    <AnalyticsChart
                      type="pie"
                      data={donutData}
                      xKey="x"
                      dataKey="value"
                      colors={DONUT_COLORS}
                      pieValueFormat={formatRub}
                    />
                  </div>
                )}
              </div>
              <div className={`${classes.tableCard} ${classes.tableCardFlow}`}>
                <div className={classes.tableScroll}>
                  <table className={classes.table}>
                    <thead>
                      <tr>
                        <SortHead label={DIMENSIONS.find((d) => d.key === dimension).col} columnKey="label" sort={summarySort} onSort={onSummarySort} />
                        <SortHead label="Заявок" columnKey="requestsCount" sort={summarySort} onSort={onSummarySort} num />
                        <SortHead label="Чел." columnKey="peopleCount" sort={summarySort} onSort={onSummarySort} num />
                        <SortHead label="Дети" columnKey="kids" sort={summarySort} onSort={onSummarySort} num />
                        <SortHead label="Суток" columnKey="roomNights" sort={summarySort} onSort={onSummarySort} num />
                        <SortHead label="Проживание" columnKey="living" sort={summarySort} onSort={onSummarySort} num />
                        <SortHead label="Питание" columnKey="meal" sort={summarySort} onSort={onSummarySort} num />
                        <SortHead label="Трансфер" columnKey="transfer" sort={summarySort} onSort={onSummarySort} num />
                        <SortHead label="Итого" columnKey="total" sort={summarySort} onSort={onSummarySort} num />
                        <SortHead label="Без стоимости" columnKey="missingCostCount" sort={summarySort} onSort={onSummarySort} num />
                      </tr>
                    </thead>
                    <tbody>
                      {sortedSummaryRows.map((g) => (
                        <tr key={g.key}>
                          <td className={classes.tdStrong}>{g.label}</td>
                          <td className={classes.num}>{formatInt(g.requestsCount)}</td>
                          <td className={classes.num}>{formatInt(g.peopleCount)}</td>
                          <td className={classes.num}>
                            {g.childrenCount + g.infantsCount > 0
                              ? g.infantsCount > 0
                                ? `${g.childrenCount}+${g.infantsCount}`
                                : `${g.childrenCount}`
                              : "—"}
                          </td>
                          <td className={classes.num}>{g.roomNights > 0 ? formatNights(g.roomNights) : "—"}</td>
                          <td className={classes.num}>{formatRub(g.living)}</td>
                          <td className={classes.num}>{formatRub(g.meal)}</td>
                          <td className={classes.num}>{formatRub(g.transfer)}</td>
                          <td className={`${classes.num} ${classes.tdTotal}`}>{formatRub(g.total)}</td>
                          <td className={classes.num}>{g.missingCostCount > 0 ? formatInt(g.missingCostCount) : "—"}</td>
                        </tr>
                      ))}
                      {totals && (
                        <tr className={classes.summaryTotalRow}>
                          <td className={classes.tdStrong}>ИТОГО</td>
                          <td className={classes.num}>{formatInt(totals.requestsCount)}</td>
                          <td className={classes.num}>{formatInt(totals.peopleCount)}</td>
                          <td className={classes.num}>
                            {formatInt((totals.childrenCount || 0) + (totals.infantsCount || 0))}
                          </td>
                          <td className={classes.num}>{formatNights(totals.roomNights)}</td>
                          <td className={classes.num}>{formatRub(totals.living)}</td>
                          <td className={classes.num}>{formatRub(totals.meal)}</td>
                          <td className={classes.num}>{formatRub(totals.transfer)}</td>
                          <td className={`${classes.num} ${classes.tdTotal}`}>{formatRub(totals.total)}</td>
                          <td className={classes.num}>{totals.missingCostCount > 0 ? formatInt(totals.missingCostCount) : "—"}</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}

export default PassengerAnalytics;
