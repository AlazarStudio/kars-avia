import { useState, useEffect, useMemo, useCallback } from "react";
import classes from "./AirlineAnalytics.module.css";
import AnalyticsChart from "../../AnalyticsChart/AnalyticsChart";
import DateRangePickerCustom from "../../DateRangePickerCustom";
import {
  addDays,
  differenceInCalendarDays,
  format,
  formatISO,
  startOfToday,
  subDays,
} from "date-fns";
import {
  GET_AIRLINES,
  GET_AIRLINE_ANALYTICS,
  GET_AIRPORTS_RELAY,
  GET_AIRLINE_POSITIONS,
  getCookie,
  getMediaUrl,
} from "../../../../../../graphQL_requests";
import { useQuery } from "@apollo/client";
import MUITextField from "../../../../Blocks/MUITextField/MUITextField";
import MUIAutocompleteColor from "../../../../Blocks/MUIAutocompleteColor/MUIAutocompleteColor";
import { useDebounce } from "../../../../../hooks/useDebounce";
import MUILoader from "../../../../Blocks/MUILoader/MUILoader";
import Button from "../../../../Standart/Button/Button";

const SERVICE_OPTIONS = [
  { id: "LIVING", label: "Проживание" },
  { id: "MEAL", label: "Питание" },
  { id: "TRANSFER", label: "Трансфер" },
];

function formatPeriodHuman(range) {
  return `${format(range.startDate, "dd.MM.yyyy")} — ${format(
    range.endDate,
    "dd.MM.yyyy"
  )}`;
}

/** Единый формат ID аэропорта из GraphQL (строка/число) — для сопоставления периодов */
function normAirportId(id) {
  if (id == null || id === "") return "";
  return String(id);
}

function findAirportRow(rows, airportId) {
  const want = normAirportId(airportId);
  if (!want) return undefined;
  return rows.find((r) => normAirportId(r.airportId) === want);
}

/** Один выбранный аэропорт или null = все аэропорты */
function airportMatchesPeriodFilter(airportId, selectedAirportEntry) {
  if (!selectedAirportEntry?.id) return true;
  return normAirportId(airportId) === normAirportId(selectedAirportEntry.id);
}

const ALL_AIRPORTS_OPTION = { id: null, name: "Все аэропорты", code: "" };

const ALL_SERVICES_OPTION = { id: null, label: "Все услуги", isAll: true };
const ALL_POSITIONS_OPTION = { id: null, label: "Все должности", isAll: true };

const BAR_METRIC_OPTIONS = [
  { id: "totalSpend", label: "Траты, ₽" },
  { id: "totalRequests", label: "Заявки" },
  { id: "uniquePeopleCount", label: "Уникальные люди" },
  { id: "usedRoomsCount", label: "Комнаты" },
];

const formatInt = (value) =>
  new Intl.NumberFormat("ru-RU").format(Number(value) || 0);
const formatRub = (value) =>
  `${new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 0 }).format(
    Number(value) || 0
  )} ₽`;

function formatPct(value) {
  if (value == null || Number.isNaN(Number(value))) return "—";
  return `${Number(value).toFixed(1)}%`;
}

function normPositionKey(row) {
  if (!row) return "";
  return String(row.positionId ?? row.positionName ?? "");
}

/** Круговая диаграмма по должностям: скрыть при выборе ровно одной должности (тривиальное 100%); 0 = все должности — показывать */
function shouldShowPositionsPie(selectedPositionIds) {
  return (
    selectedPositionIds.length === 0 || selectedPositionIds.length >= 2
  );
}

function defaultCompareRange(mainRange) {
  const p2Start = mainRange.startDate;
  const p1End = subDays(p2Start, 1);
  const p1Start = subDays(p1End, 6);
  return { startDate: p1Start, endDate: p1End, key: "selection" };
}

/** Снимок фильтров для запроса аналитики (после «Применить») */
function buildAirlineAnalyticsQueryInput(airlineId, snapshot) {
  if (!airlineId || !snapshot) return null;
  const period1 = {
    dateFrom: formatISO(snapshot.mainRange.startDate, { representation: "date" }),
    dateTo: formatISO(snapshot.mainRange.endDate, { representation: "date" }),
  };
  if (snapshot.selectedAirport?.id) period1.airportIds = [snapshot.selectedAirport.id];
  if (snapshot.selectedPositionIds.length) period1.positionIds = snapshot.selectedPositionIds;

  const input = {
    airlineId,
    period1,
  };
  if (snapshot.selectedServices.length) input.services = snapshot.selectedServices;

  if (snapshot.compareEnabled) {
    const period2 = {
      dateFrom: formatISO(snapshot.compareRange.startDate, {
        representation: "date",
      }),
      dateTo: formatISO(snapshot.compareRange.endDate, { representation: "date" }),
    };
    if (snapshot.selectedAirportB?.id) period2.airportIds = [snapshot.selectedAirportB.id];
    if (snapshot.selectedPositionIdsB.length)
      period2.positionIds = snapshot.selectedPositionIdsB;
    input.period2 = period2;
  }

  return input;
}

function AirlineAnalytics({ user, height }) {
  const token = getCookie("token");

  const [mainRange, setMainRange] = useState({
    startDate: addDays(startOfToday(), -6),
    endDate: startOfToday(),
    key: "selection",
  });
  const [compareRange, setCompareRange] = useState(() => ({
    startDate: subDays(addDays(startOfToday(), -6), 7),
    endDate: subDays(addDays(startOfToday(), -6), 1),
    key: "selection",
  }));

  const [compareEnabled, setCompareEnabled] = useState(false);

  const [showPicker, setShowPicker] = useState(false);
  const [pickerTarget, setPickerTarget] = useState("main");

  const [airlines, setAirlines] = useState([]);
  const [selectedAirline, setSelectedAirline] = useState();
  const [searchQuery, setSearchQuery] = useState();
  const [selectedServices, setSelectedServices] = useState([]);
  const [selectedAirport, setSelectedAirport] = useState(null);
  const [selectedPositionIds, setSelectedPositionIds] = useState([]);
  const [selectedAirportB, setSelectedAirportB] = useState(null);
  const [selectedPositionIdsB, setSelectedPositionIdsB] = useState([]);

  /** Запрос аналитики только после нажатия «Применить» */
  const [appliedAnalytics, setAppliedAnalytics] = useState(null);

  const debouncedSearch = useDebounce(searchQuery, 500);

  const PAGE_SIZE = 15;
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  const { data: airlinesData, refetch: itemsRefetch } = useQuery(GET_AIRLINES, {
    context: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
    variables: {
      pagination: {
        skip: 0,
        take: PAGE_SIZE,
        search: debouncedSearch,
      },
    },
  });

  useEffect(() => {
    const conn = airlinesData?.airlines;
    const page = conn?.airlines ?? [];
    const count = conn?.totalCount ?? 0;

    if (page.length) {
      setAirlines(page);
      setTotal(count);
      setHasMore(page.length < count);
    }
    if (user?.airlineId) {
      setSelectedAirline(page.find((i) => i.id === user?.airlineId));
    }
  }, [airlinesData, user]);

  const handleLoadMore = async () => {
    const nextTake = Math.min(
      airlines.length + PAGE_SIZE,
      total || Number.MAX_SAFE_INTEGER
    );

    setLoadingMore(true);
    const res = await itemsRefetch({ pagination: { skip: 0, take: nextTake } });
    setLoadingMore(false);

    const conn = res?.data?.airlines;
    const newList = conn?.airlines ?? [];
    const newTotal = conn?.totalCount ?? total;

    setAirlines(newList);
    setTotal(newTotal);
    setHasMore(newList.length < newTotal);
  };

  const airlineId = user?.airlineId || selectedAirline?.id || airlines[0]?.id;

  useEffect(() => {
    setAppliedAnalytics(null);
  }, [airlineId]);

  const { data: airportsData } = useQuery(GET_AIRPORTS_RELAY, {
    context: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  });

  const { data: positionsData } = useQuery(GET_AIRLINE_POSITIONS, {
    context: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  });

  const airportsList = useMemo(
    () => airportsData?.airports ?? [],
    [airportsData?.airports]
  );

  const airportAutocompleteOptions = useMemo(
    () => [ALL_AIRPORTS_OPTION, ...airportsList],
    [airportsList]
  );

  const positionOptions = useMemo(
    () =>
      (positionsData?.getAirlinePositions ?? []).map((p) => ({
        id: p.id,
        label: p.name,
      })),
    [positionsData?.getAirlinePositions]
  );

  const serviceOptionsWithAll = useMemo(
    () => [ALL_SERVICES_OPTION, ...SERVICE_OPTIONS],
    []
  );

  const positionOptionsWithAll = useMemo(
    () => [ALL_POSITIONS_OPTION, ...positionOptions],
    [positionOptions]
  );

  const selectedServiceAutocompleteValue = useMemo(() => {
    if (!selectedServices.length) return ALL_SERVICES_OPTION;
    const found = SERVICE_OPTIONS.find((o) => selectedServices.includes(o.id));
    return found ?? ALL_SERVICES_OPTION;
  }, [selectedServices]);

  const selectedPositionAutocompleteValue = useMemo(() => {
    if (!selectedPositionIds.length) return ALL_POSITIONS_OPTION;
    const found = positionOptions.find((o) => selectedPositionIds.includes(o.id));
    return found ?? ALL_POSITIONS_OPTION;
  }, [positionOptions, selectedPositionIds]);

  const selectedPositionAutocompleteValueB = useMemo(() => {
    if (!selectedPositionIdsB.length) return ALL_POSITIONS_OPTION;
    const found = positionOptions.find((o) => selectedPositionIdsB.includes(o.id));
    return found ?? ALL_POSITIONS_OPTION;
  }, [positionOptions, selectedPositionIdsB]);

  const analyticsQueryInput = useMemo(
    () => buildAirlineAnalyticsQueryInput(airlineId, appliedAnalytics),
    [airlineId, appliedAnalytics]
  );

  const authHeaders = useMemo(
    () => ({
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }),
    [token]
  );

  const { data: analyticsData, loading: analyticsLoading } = useQuery(
    GET_AIRLINE_ANALYTICS,
    {
      context: authHeaders,
      variables: { input: analyticsQueryInput },
      skip: !analyticsQueryInput,
    }
  );

  const period1Result = appliedAnalytics
    ? analyticsData?.airlineAnalytics?.period1
    : undefined;
  const period2Result = appliedAnalytics
    ? analyticsData?.airlineAnalytics?.period2 ?? null
    : null;

  const summary = period1Result?.summary;
  const positionsBreakdown = period1Result?.positionsBreakdown;
  const airportsBreakdown = period1Result?.airportsBreakdown;

  const segments = useMemo(() => {
    if (!period1Result || !appliedAnalytics) return [];
    const f = appliedAnalytics;
    const rows = [
      {
        segmentKey: "period1",
        label: formatPeriodHuman(f.mainRange),
        metrics: period1Result.summary,
        positionsBreakdown: period1Result.positionsBreakdown ?? [],
        airportsBreakdown: period1Result.airportsBreakdown ?? [],
      },
    ];
    if (f.compareEnabled && period2Result) {
      rows.push({
        segmentKey: "period2",
        label: formatPeriodHuman(f.compareRange),
        metrics: period2Result.summary,
        positionsBreakdown: period2Result.positionsBreakdown ?? [],
        airportsBreakdown: period2Result.airportsBreakdown ?? [],
      });
    }
    return rows;
  }, [period1Result, period2Result, appliedAnalytics]);

  const isPeriodMultiChart =
    appliedAnalytics?.compareEnabled && period2Result != null;

  const pieData = useMemo(
    () =>
      (positionsBreakdown ?? []).map((item) => ({
        x: item.positionName,
        value: item.count,
      })),
    [positionsBreakdown]
  );

  /** Один период: по одному simpleBar на каждую метрику аэропортов */
  const singlePeriodAirportBarCharts = useMemo(
    () =>
      BAR_METRIC_OPTIONS.map((opt) => ({
        id: opt.id,
        label: opt.label,
        data: (airportsBreakdown ?? []).map((row) => ({
          name:
            row.airportName ||
            row.airportCode ||
            row.airportId ||
            "—",
          value: Number(row[opt.id]) || 0,
        })),
      })),
    [airportsBreakdown]
  );

  const groupedBarSeries = useMemo(
    () =>
      segments.map((s, i) => ({
        key: `p${i}`,
        label: s.label,
      })),
    [segments]
  );

  const groupedBarChartsByMetric = useMemo(() => {
    if (!isPeriodMultiChart || !segments.length) {
      return BAR_METRIC_OPTIONS.map((o) => ({ id: o.id, label: o.label, data: [] }));
    }
    const rowsList = segments.map((s) => s.airportsBreakdown ?? []);
    if (rowsList.length < 2) {
      return BAR_METRIC_OPTIONS.map((o) => ({ id: o.id, label: o.label, data: [] }));
    }

    const periodCount = rowsList.length;
    const metaById = new Map();

    for (const rows of rowsList) {
      for (const r of rows) {
        const id = normAirportId(r.airportId);
        if (!id) continue;
        if (!metaById.has(id)) {
          metaById.set(id, {
            airportName: r.airportName,
            airportCode: r.airportCode,
          });
        } else {
          const m = metaById.get(id);
          if (!m.airportName && r.airportName) m.airportName = r.airportName;
          if (!m.airportCode && r.airportCode) m.airportCode = r.airportCode;
        }
      }
    }

    const primaryIds = rowsList[0]
      .map((r) => normAirportId(r.airportId))
      .filter(Boolean);
    const seen = new Set(primaryIds);
    const idOrdered = [...primaryIds];
    for (const id of metaById.keys()) {
      if (!seen.has(id)) {
        seen.add(id);
        idOrdered.push(id);
      }
    }

    const periodFilters = [
      appliedAnalytics?.selectedAirport ?? null,
      appliedAnalytics?.selectedAirportB ?? null,
    ];

    const idOrderedFiltered = idOrdered.filter((airportId) =>
      periodFilters.some((ids) => airportMatchesPeriodFilter(airportId, ids))
    );

    return BAR_METRIC_OPTIONS.map((opt) => ({
      id: opt.id,
      label: opt.label,
      data: idOrderedFiltered.map((airportId) => {
        const meta = metaById.get(airportId);
        const name =
          meta?.airportName ||
          meta?.airportCode ||
          airportId;

        const point = { name };
        for (let idx = 0; idx < periodCount; idx++) {
          if (!airportMatchesPeriodFilter(airportId, periodFilters[idx])) {
            point[`p${idx}`] = null;
            continue;
          }
          const row = findAirportRow(rowsList[idx], airportId);
          point[`p${idx}`] = Number(row?.[opt.id]) || 0;
        }
        return point;
      }),
    }));
  }, [isPeriodMultiChart, segments, appliedAnalytics]);

  const comparisonRows = useMemo(
    () => [
      { metric: "Заявки", key: "totalRequests", format: formatInt },
      { metric: "Уникальные люди", key: "uniquePeopleCount", format: formatInt },
      { metric: "Комнаты", key: "usedRoomsCount", format: formatInt },
      { metric: "Общие траты", key: "totalSpend", format: formatRub },
      { metric: "Проживание", key: "livingSpend", format: formatRub },
      { metric: "Питание", key: "mealSpend", format: formatRub },
      { metric: "Трансфер", key: "transferSpend", format: formatRub },
    ],
    []
  );

  const mergedPositionTableRows = useMemo(() => {
    const p1 = period1Result?.positionsBreakdown ?? [];
    const p2 = period2Result?.positionsBreakdown ?? [];
    if (!isPeriodMultiChart || !period2Result) {
      return p1.map((r) => ({
        key: normPositionKey(r),
        name: r.positionName,
        p1: r,
        p2: null,
      }));
    }
    const map = new Map();
    for (const r of p1) {
      const k = normPositionKey(r);
      if (!k) continue;
      map.set(k, { key: k, name: r.positionName, p1: r, p2: null });
    }
    for (const r of p2) {
      const k = normPositionKey(r);
      if (!k) continue;
      if (!map.has(k)) {
        map.set(k, { key: k, name: r.positionName, p1: null, p2: null });
      }
      const row = map.get(k);
      row.p2 = r;
      if (!row.name) row.name = r.positionName;
    }
    return Array.from(map.values()).sort(
      (a, b) =>
        (b.p1?.count ?? b.p2?.count ?? 0) - (a.p1?.count ?? a.p2?.count ?? 0)
    );
  }, [period1Result, period2Result, isPeriodMultiChart]);

  const mergedAirportTableRows = useMemo(() => {
    const p1 = period1Result?.airportsBreakdown ?? [];
    const p2 = period2Result?.airportsBreakdown ?? [];
    if (!isPeriodMultiChart || !period2Result) {
      return p1.map((r) => ({
        key: normAirportId(r.airportId),
        name: r.airportName || r.airportCode || r.airportId,
        p1: r,
        p2: null,
      }));
    }
    const map = new Map();
    for (const r of p1) {
      const k = normAirportId(r.airportId);
      if (!k) continue;
      map.set(k, {
        key: k,
        name: r.airportName || r.airportCode || k,
        p1: r,
        p2: null,
      });
    }
    for (const r of p2) {
      const k = normAirportId(r.airportId);
      if (!k) continue;
      if (!map.has(k)) {
        map.set(k, {
          key: k,
          name: r.airportName || r.airportCode || k,
          p1: null,
          p2: null,
        });
      }
      const row = map.get(k);
      row.p2 = r;
      if (!row.name || row.name === row.key) {
        row.name = r.airportName || r.airportCode || k;
      }
    }
    return Array.from(map.values()).sort(
      (a, b) =>
        (Number(b.p1?.totalSpend) || Number(b.p2?.totalSpend) || 0) -
        (Number(a.p1?.totalSpend) || Number(a.p2?.totalSpend) || 0)
    );
  }, [period1Result, period2Result, isPeriodMultiChart]);

  const filteredAirlines = useMemo(() => {
    if (!searchQuery) return airlines;
    return airlines.filter((request) =>
      request?.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [airlines, searchQuery]);

  const openMainPicker = useCallback(() => {
    setPickerTarget("main");
    setShowPicker(true);
  }, []);

  const openCompareRangePicker = useCallback(() => {
    setPickerTarget("compare");
    setShowPicker(true);
  }, []);

  const pickerValue = useMemo(
    () => (pickerTarget === "compare" ? compareRange : mainRange),
    [pickerTarget, mainRange, compareRange]
  );

  const applyPickerRange = useCallback(
    (range) => {
      if (pickerTarget === "main") {
        setMainRange(range);
      } else {
        setCompareRange(range);
      }
      setShowPicker(false);
    },
    [pickerTarget]
  );

  const handleCompareToggle = useCallback(
    (event) => {
      const next = event.target.checked;
      setCompareEnabled(next);
      if (next) {
        setCompareRange(defaultCompareRange(mainRange));
        setSelectedAirportB(selectedAirport);
        setSelectedPositionIdsB([...selectedPositionIds]);
      }
    },
    [mainRange, selectedAirport, selectedPositionIds]
  );

  const handleApplyAnalytics = useCallback(() => {
    if (!airlineId) return;
    setAppliedAnalytics({
      mainRange: { ...mainRange },
      compareRange: { ...compareRange },
      compareEnabled,
      selectedServices: [...selectedServices],
      selectedAirport,
      selectedPositionIds: [...selectedPositionIds],
      selectedAirportB,
      selectedPositionIdsB: [...selectedPositionIdsB],
    });
  }, [
    airlineId,
    mainRange,
    compareRange,
    compareEnabled,
    selectedServices,
    selectedAirport,
    selectedPositionIds,
    selectedAirportB,
    selectedPositionIdsB,
  ]);

  const mainDays =
    differenceInCalendarDays(mainRange.endDate, mainRange.startDate) + 1;
  const compareDays =
    differenceInCalendarDays(compareRange.endDate, compareRange.startDate) +
    1;

  return (
    <div className={classes.pageWrap} style={height ? { height } : undefined}>
      <div className={classes.filtersStrip}>
        <div className={classes.filtersRow}>
          <button
            type="button"
            className={classes.periodButton}
            onClick={openMainPicker}
          >
            Период 1
          </button>

          <span className={classes.periodSummaryInline}>
            Период 1:{" "}
            {formatISO(mainRange.startDate, { representation: "date" })} —{" "}
            {formatISO(mainRange.endDate, { representation: "date" })} (
            {mainDays} дн.)
          </span>

          <MUIAutocompleteColor
            dropdownWidth="180px"
            label="Аэропорт"
            hideLabelOnFocus={false}
            listboxHeight={280}
            options={airportAutocompleteOptions}
            getOptionLabel={(option) =>
              option ? `${option.code || ""} ${option.name || ""}`.trim() : ""
            }
            isOptionEqualToValue={(option, value) =>
              (option?.id ?? null) === (value?.id ?? null) &&
              (option?.name ?? "") === (value?.name ?? "")
            }
            renderOption={(optionProps, option) => {
              const isAll =
                option.name === "Все аэропорты" || option.code === "";

              if (isAll) {
                return (
                  <li {...optionProps} key={option.id ?? "all-airports"}>
                    <span style={{ color: "black" }}>{option.name}</span>
                  </li>
                );
              }

              const labelText = `${option.code || ""} ${option.name || ""}`.trim();
              const words = labelText.split(" ");

              return (
                <li {...optionProps} key={option.id}>
                  {words.map((word, index) => (
                    <span
                      key={index}
                      style={{
                        color: index === 0 ? "black" : "gray",
                        marginRight: "4px",
                      }}
                    >
                      {word}
                    </span>
                  ))}
                </li>
              );
            }}
            value={selectedAirport ?? ALL_AIRPORTS_OPTION}
            onChange={(event, newValue) => {
              if (
                !newValue ||
                newValue.id == null ||
                newValue.name === "Все аэропорты"
              ) {
                setSelectedAirport(null);
              } else {
                setSelectedAirport(newValue);
              }
            }}
          />

          <MUIAutocompleteColor
            dropdownWidth="180px"
            label="Услуги"
            hideLabelOnFocus={false}
            listboxHeight={240}
            options={serviceOptionsWithAll}
            getOptionLabel={(option) => option?.label ?? ""}
            isOptionEqualToValue={(option, value) =>
              (option?.id ?? null) === (value?.id ?? null)
            }
            renderOption={(optionProps, option) => {
              if (option?.isAll) {
                return (
                  <li {...optionProps} key="all-services">
                    <span style={{ color: "black" }}>{option.label}</span>
                  </li>
                );
              }
              return (
                <li {...optionProps} key={option.id}>
                  <span style={{ color: "black" }}>{option.label}</span>
                </li>
              );
            }}
            value={selectedServiceAutocompleteValue}
            onChange={(event, newValue) => {
              if (!newValue || newValue.isAll || newValue.id == null) {
                setSelectedServices([]);
              } else {
                setSelectedServices([newValue.id]);
              }
            }}
          />

          <MUIAutocompleteColor
            dropdownWidth="180px"
            label="Должности"
            hideLabelOnFocus={false}
            listboxHeight={240}
            options={positionOptionsWithAll}
            getOptionLabel={(option) => option?.label ?? ""}
            isOptionEqualToValue={(option, value) =>
              (option?.id ?? null) === (value?.id ?? null)
            }
            renderOption={(optionProps, option) => {
              if (option?.isAll) {
                return (
                  <li {...optionProps} key="all-positions">
                    <span style={{ color: "black" }}>{option.label}</span>
                  </li>
                );
              }
              return (
                <li {...optionProps} key={option.id}>
                  <span style={{ color: "black" }}>{option.label}</span>
                </li>
              );
            }}
            value={selectedPositionAutocompleteValue}
            onChange={(event, newValue) => {
              if (!newValue || newValue.isAll || newValue.id == null) {
                setSelectedPositionIds([]);
              } else {
                setSelectedPositionIds([newValue.id]);
              }
            }}
          />

          <div className={classes.compareApplyGroup}>
            <label className={classes.compareCheckbox}>
              <input
                type="checkbox"
                checked={compareEnabled}
                onChange={handleCompareToggle}
              />
              <span>Сравнить</span>
            </label>
            <Button
              type="button"
              onClick={handleApplyAnalytics}
              disabled={!airlineId}
              padding="0 18px"
              height="36px"
              fontSize="13px"
              fontWeight="600"
            >
              Применить
            </Button>
          </div>
        </div>

        {compareEnabled ? (
          <div className={classes.filtersRowCompare}>
            <button
              type="button"
              className={classes.periodButton}
              onClick={openCompareRangePicker}
            >
              Период 2
            </button>

            <span className={classes.periodSummaryInline}>
              Период 2:{" "}
              {formatISO(compareRange.startDate, { representation: "date" })} —{" "}
              {formatISO(compareRange.endDate, { representation: "date" })} (
              {compareDays} дн.)
            </span>

            <MUIAutocompleteColor
              dropdownWidth="180px"
              label="Аэропорт"
              hideLabelOnFocus={false}
              listboxHeight={280}
              options={airportAutocompleteOptions}
              getOptionLabel={(option) =>
                option ? `${option.code || ""} ${option.name || ""}`.trim() : ""
              }
              isOptionEqualToValue={(option, value) =>
                (option?.id ?? null) === (value?.id ?? null) &&
                (option?.name ?? "") === (value?.name ?? "")
              }
              renderOption={(optionProps, option) => {
                const isAll =
                  option.name === "Все аэропорты" || option.code === "";

                if (isAll) {
                  return (
                    <li {...optionProps} key={option.id ?? "all-airports-b"}>
                      <span style={{ color: "black" }}>{option.name}</span>
                    </li>
                  );
                }

                const labelText = `${option.code || ""} ${option.name || ""}`.trim();
                const words = labelText.split(" ");

                return (
                  <li {...optionProps} key={option.id}>
                    {words.map((word, index) => (
                      <span
                        key={index}
                        style={{
                          color: index === 0 ? "black" : "gray",
                          marginRight: "4px",
                        }}
                      >
                        {word}
                      </span>
                    ))}
                  </li>
                );
              }}
              value={selectedAirportB ?? ALL_AIRPORTS_OPTION}
              onChange={(event, newValue) => {
                if (
                  !newValue ||
                  newValue.id == null ||
                  newValue.name === "Все аэропорты"
                ) {
                  setSelectedAirportB(null);
                } else {
                  setSelectedAirportB(newValue);
                }
              }}
            />

            <MUIAutocompleteColor
              dropdownWidth="180px"
              label="Должности"
              hideLabelOnFocus={false}
              listboxHeight={240}
              options={positionOptionsWithAll}
              getOptionLabel={(option) => option?.label ?? ""}
              isOptionEqualToValue={(option, value) =>
                (option?.id ?? null) === (value?.id ?? null)
              }
              renderOption={(optionProps, option) => {
                if (option?.isAll) {
                  return (
                    <li {...optionProps} key="all-positions-b">
                      <span style={{ color: "black" }}>{option.label}</span>
                    </li>
                  );
                }
                return (
                  <li {...optionProps} key={option.id}>
                    <span style={{ color: "black" }}>{option.label}</span>
                  </li>
                );
              }}
              value={selectedPositionAutocompleteValueB}
              onChange={(event, newValue) => {
                if (!newValue || newValue.isAll || newValue.id == null) {
                  setSelectedPositionIdsB([]);
                } else {
                  setSelectedPositionIdsB([newValue.id]);
                }
              }}
            />
          </div>
        ) : null}
      </div>

      {showPicker ? (
        <DateRangePickerCustom
          value={pickerValue}
          onChange={applyPickerRange}
          onClose={() => setShowPicker(false)}
        />
      ) : null}

      <div className={classes.container}>
        {user?.airlineId ? null : (
          <div className={classes.sidebarContainer}>
            <div className={classes.searchContainer}>
              <MUITextField
                label="Поиск"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={classes.mainSearch}
              />
            </div>
            <div className={classes.sidebar}>
              <ul className={classes.list}>
                {filteredAirlines.map((airline) => (
                  <li
                    key={airline.id}
                    className={`${classes.listItem} ${selectedAirline && selectedAirline.id === airline.id
                        ? classes.active
                        : !selectedAirline && airline.id === airlines[0]?.id
                          ? classes.active
                          : ""
                      }`}
                    onClick={() =>
                      setSelectedAirline({
                        id: airline.id,
                        name: airline.name,
                        images: airline.images,
                      })
                    }
                  >
                    <div className={classes.circle}>
                      <img src={getMediaUrl(airline.images[0])} alt="" />
                    </div>
                    <p>{airline.name}</p>
                  </li>
                ))}
              </ul>
              {hasMore ? (
                <button
                  type="button"
                  className={classes.periodButton}
                  onClick={handleLoadMore}
                >
                  {loadingMore ? (
                    <MUILoader loadSize="16px" />
                  ) : (
                    "Показать ещё"
                  )}
                </button>
              ) : null}
            </div>
          </div>
        )}

        <div className={classes.content}>
          <div className={classes.graphs}>
            <div className={classes.header}>
              <h2 className={classes.title}>
                <div className={classes.circle}>
                  <img
                    src={getMediaUrl(
                      selectedAirline
                        ? selectedAirline?.images?.[0]
                        : airlines[0]?.images?.[0]
                    )}
                    alt=""
                  />
                </div>
                <p>
                  {selectedAirline ? selectedAirline?.name : airlines[0]?.name}
                </p>
              </h2>
            </div>

            <div className={classes.contentWrapper}>
              {!airlineId ? (
                <p className={classes.periodHint}>Загрузка списка авиакомпаний…</p>
              ) : !appliedAnalytics ? (
                <p className={classes.periodHint}>
                  Настройте период и фильтры, затем нажмите «Применить» — данные
                  загрузятся после этого.
                </p>
              ) : analyticsLoading ? (
                <div className={classes.loaderWrap}>
                  <MUILoader fullHeight="55vh" />
                </div>
              ) : (
                <>
                  {/* <div className={classes.kpiGrid}>
                    <div className={classes.kpiCard}>
                      <span className={classes.kpiLabel}>Заявки</span>
                      <span className={classes.kpiValue}>
                        {formatInt(summary?.totalRequests)}
                      </span>
                    </div>
                    <div className={classes.kpiCard}>
                      <span className={classes.kpiLabel}>Уникальные люди</span>
                      <span className={classes.kpiValue}>
                        {formatInt(summary?.uniquePeopleCount)}
                      </span>
                    </div>
                    <div className={classes.kpiCard}>
                      <span className={classes.kpiLabel}>Номерной фонд</span>
                      <span className={classes.kpiValue}>
                        {formatInt(summary?.usedRoomsCount)}
                      </span>
                    </div>
                    <div className={classes.kpiCard}>
                      <span className={classes.kpiLabel}>Общие траты</span>
                      <span className={classes.kpiValue}>
                        {formatRub(summary?.totalSpend)}
                      </span>
                    </div>
                    <div className={classes.kpiCard}>
                      <span className={classes.kpiLabel}>Проживание</span>
                      <span className={classes.kpiValue}>
                        {formatRub(summary?.livingSpend)}
                      </span>
                    </div>
                    <div className={classes.kpiCard}>
                      <span className={classes.kpiLabel}>Питание</span>
                      <span className={classes.kpiValue}>
                        {formatRub(summary?.mealSpend)}
                      </span>
                    </div>
                    <div className={classes.kpiCard}>
                      <span className={classes.kpiLabel}>Трансфер</span>
                      <span className={classes.kpiValue}>
                        {formatRub(summary?.transferSpend)}
                      </span>
                    </div>
                  </div> */}

                  <div
                    className={
                      user?.airlineId ? classes.rowNoAdaptive : classes.row
                    }
                  >
                    {isPeriodMultiChart ? (
                      <div className={classes.chartsStackPeriod}>
                        {segments.some((_, idx) =>
                          shouldShowPositionsPie(
                            idx === 0
                              ? appliedAnalytics.selectedPositionIds
                              : appliedAnalytics.selectedPositionIdsB
                          )
                        ) ? (
                          <div className={classes.pieChartsRow}>
                            {segments.map((seg, idx) => {
                              const posIds =
                                idx === 0
                                  ? appliedAnalytics.selectedPositionIds
                                  : appliedAnalytics.selectedPositionIdsB;
                              if (!shouldShowPositionsPie(posIds)) return null;
                              return (
                                <AnalyticsChart
                                  key={seg.segmentKey}
                                  type="pie"
                                  title={seg.label}
                                  data={(
                                    seg.positionsBreakdown ?? []
                                  ).map((item) => ({
                                    x: item.positionName,
                                    value: item.count,
                                  }))}
                                  xKey="x"
                                  dataKey="value"
                                />
                              );
                            })}
                          </div>
                        ) : null}

                        <div className={classes.breakdownTableSection}>
                          <h4 className={classes.breakdownTableTitle}>
                            Детализация по должностям
                          </h4>
                          <div className={classes.tableScroll}>
                            <table className={classes.analyticsTable}>
                              <thead>
                                {segments.length >= 2 ? (
                                  <>
                                    <tr>
                                      <th rowSpan={2}>Должность</th>
                                      <th colSpan={2}>{segments[0].label}</th>
                                      <th colSpan={2}>{segments[1].label}</th>
                                    </tr>
                                    <tr>
                                      <th>Заявки</th>
                                      <th>%</th>
                                      <th>Заявки</th>
                                      <th>%</th>
                                    </tr>
                                  </>
                                ) : null}
                              </thead>
                              <tbody>
                                {mergedPositionTableRows.map((row) => (
                                  <tr key={row.key}>
                                    <td>{row.name}</td>
                                    {segments.length >= 2 ? (
                                      <>
                                        <td>
                                          {row.p1 != null
                                            ? formatInt(row.p1.count)
                                            : "—"}
                                        </td>
                                        <td>
                                          {row.p1 != null
                                            ? formatPct(row.p1.percent)
                                            : "—"}
                                        </td>
                                        <td>
                                          {row.p2 != null
                                            ? formatInt(row.p2.count)
                                            : "—"}
                                        </td>
                                        <td>
                                          {row.p2 != null
                                            ? formatPct(row.p2.percent)
                                            : "—"}
                                        </td>
                                      </>
                                    ) : null}
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>

                        <div
                          className={`${classes.barBlock} ${classes.barBlockBelowPies}`}
                        >
                          <div className={classes.barHeader}>
                            <h4 className={classes.barTitle}>Аэропорты</h4>
                          </div>
                          <div className={classes.airportBarsStack}>
                            {groupedBarChartsByMetric.map((cfg) => (
                              <div
                                key={cfg.id}
                                className={classes.airportBarChartItem}
                              >
                                <h5
                                  className={classes.airportBarChartSubtitle}
                                >
                                  {cfg.label}
                                </h5>
                                <AnalyticsChart
                                  type="groupedBar"
                                  data={cfg.data}
                                  series={groupedBarSeries}
                                  xKey="name"
                                  height={260}
                                  fullWidth
                                  groupedValueFormat={(v) =>
                                    cfg.id === "totalSpend"
                                      ? formatRub(v)
                                      : formatInt(v)
                                  }
                                />
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className={classes.breakdownTableSection}>
                          <h4 className={classes.breakdownTableTitle}>
                            Детализация по аэропортам
                          </h4>
                          <div className={classes.tableScroll}>
                            <table className={classes.analyticsTable}>
                              <thead>
                                {segments.length >= 2 ? (
                                  <>
                                    <tr>
                                      <th rowSpan={2}>Аэропорт</th>
                                      <th colSpan={4}>{segments[0].label}</th>
                                      <th colSpan={4}>{segments[1].label}</th>
                                    </tr>
                                    <tr>
                                      <th>Заявки</th>
                                      <th>Люди</th>
                                      <th>Комнаты</th>
                                      <th>Траты, ₽</th>
                                      <th>Заявки</th>
                                      <th>Люди</th>
                                      <th>Комнаты</th>
                                      <th>Траты, ₽</th>
                                    </tr>
                                  </>
                                ) : null}
                              </thead>
                              <tbody>
                                {mergedAirportTableRows.map((row) => (
                                  <tr key={row.key}>
                                    <td>{row.name}</td>
                                    {segments.length >= 2 ? (
                                      <>
                                        <td>
                                          {row.p1
                                            ? formatInt(row.p1.totalRequests)
                                            : "—"}
                                        </td>
                                        <td>
                                          {row.p1
                                            ? formatInt(
                                                row.p1.uniquePeopleCount
                                              )
                                            : "—"}
                                        </td>
                                        <td>
                                          {row.p1
                                            ? formatInt(row.p1.usedRoomsCount)
                                            : "—"}
                                        </td>
                                        <td>
                                          {row.p1
                                            ? formatRub(row.p1.totalSpend)
                                            : "—"}
                                        </td>
                                        <td>
                                          {row.p2
                                            ? formatInt(row.p2.totalRequests)
                                            : "—"}
                                        </td>
                                        <td>
                                          {row.p2
                                            ? formatInt(
                                                row.p2.uniquePeopleCount
                                              )
                                            : "—"}
                                        </td>
                                        <td>
                                          {row.p2
                                            ? formatInt(row.p2.usedRoomsCount)
                                            : "—"}
                                        </td>
                                        <td>
                                          {row.p2
                                            ? formatRub(row.p2.totalSpend)
                                            : "—"}
                                        </td>
                                      </>
                                    ) : null}
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className={classes.chartsColumn}>
                        <div className={classes.pieChartSection}>
                          {shouldShowPositionsPie(
                            appliedAnalytics.selectedPositionIds
                          ) ? (
                            <AnalyticsChart
                              type="pie"
                              title="Заявки по должностям"
                              data={pieData}
                              xKey="x"
                              dataKey="value"
                            />
                          ) : null}
                          <div className={classes.breakdownTableSection}>
                            <h4 className={classes.breakdownTableTitle}>
                              Детализация по должностям
                            </h4>
                            <div className={classes.tableScroll}>
                              <table className={classes.analyticsTable}>
                                <thead>
                                  <tr>
                                    <th>Должность</th>
                                    <th>Заявки</th>
                                    <th>%</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {mergedPositionTableRows.map((row) => (
                                    <tr key={row.key}>
                                      <td>{row.name}</td>
                                      <td>{formatInt(row.p1?.count)}</td>
                                      <td>{formatPct(row.p1?.percent)}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        </div>

                        <div className={classes.barBlock}>
                          <div className={classes.barHeader}>
                            <h4 className={classes.barTitle}>Аэропорты</h4>
                          </div>
                          <div className={classes.airportBarsStack}>
                            {singlePeriodAirportBarCharts.map((cfg) => (
                              <div
                                key={cfg.id}
                                className={classes.airportBarChartItem}
                              >
                                <h5
                                  className={classes.airportBarChartSubtitle}
                                >
                                  {cfg.label}
                                </h5>
                                <AnalyticsChart
                                  type="simpleBar"
                                  data={cfg.data}
                                  xKey="name"
                                  yKey="value"
                                  barValueLabel={cfg.label}
                                  height={260}
                                  fullWidth
                                />
                              </div>
                            ))}
                          </div>
                          <div className={classes.breakdownTableSection}>
                            <h4 className={classes.breakdownTableTitle}>
                              Детализация по аэропортам
                            </h4>
                            <div className={classes.tableScroll}>
                              <table className={classes.analyticsTable}>
                                <thead>
                                  <tr>
                                    <th>Аэропорт</th>
                                    <th>Заявки</th>
                                    <th>Уник. люди</th>
                                    <th>Комнаты</th>
                                    <th>Траты, ₽</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {mergedAirportTableRows.map((row) => (
                                    <tr key={row.key}>
                                      <td>{row.name}</td>
                                      <td>
                                        {formatInt(row.p1?.totalRequests)}
                                      </td>
                                      <td>
                                        {formatInt(row.p1?.uniquePeopleCount)}
                                      </td>
                                      <td>
                                        {formatInt(row.p1?.usedRoomsCount)}
                                      </td>
                                      <td>
                                        {formatRub(row.p1?.totalSpend)}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {segments.length > 0 ? (
                    <div className={classes.segmentsSection}>
                      <h4 className={classes.segmentsTitle}>
                        {segments.length > 1
                          ? "Сравнение периодов"
                          : "Показатели периода"}
                      </h4>
                      <div className={classes.tableScroll}>
                        <table className={classes.analyticsTable}>
                          <thead>
                            <tr>
                              <th>Метрика</th>
                              {segments.map((s) => (
                                <th key={s.segmentKey}>{s.label}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {comparisonRows.map((row) => (
                              <tr key={row.key}>
                                <td>{row.metric}</td>
                                {segments.map((s) => (
                                  <td key={`${s.segmentKey}-${row.key}`}>
                                    {row.format(s.metrics?.[row.key])}
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ) : null}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AirlineAnalytics;
