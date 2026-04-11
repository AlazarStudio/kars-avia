import {
  Fragment,
  useState,
  useEffect,
  useMemo,
  useCallback,
  useRef,
} from "react";
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
import {
  AIRPORT_BAR_METRICS,
  SERVICE_LABELS,
  buildGroupedBarDataForMetric,
  buildGroupedBarDataForPositionBudget,
  formatRoomsForService,
  getPeriodServices,
  getServiceBlock,
  hasMeaningfulServiceBlock,
  mergeAirportRows,
  mergeEntityRequestRowsFromServices,
  mergePositionRows,
  orderedServiceKeys,
  sumRequestServiceBudgets,
} from "./airlineAnalyticsMappers";
import {
  nextSortDir,
  sortAirportRows,
  sortMergedRequestRows,
  sortPositionRows,
  sortSegmentBlocks,
} from "./analyticsTableSortUtils";

const SERVICE_OPTIONS = [
  { id: "LIVING", label: "Проживание" },
  { id: "MEAL", label: "Питание" },
  { id: "TRANSFER", label: "Трансфер" },
];

function isPeriodRangeComplete(range) {
  return Boolean(
    range?.startDate &&
      range?.endDate &&
      !Number.isNaN(new Date(range.startDate).getTime()) &&
      !Number.isNaN(new Date(range.endDate).getTime())
  );
}

function formatPeriodHuman(range) {
  if (!isPeriodRangeComplete(range)) return "";
  return `${format(range.startDate, "dd.MM.yyyy")} — ${format(
    range.endDate,
    "dd.MM.yyyy"
  )}`;
}

const ALL_AIRPORTS_OPTION = { id: null, name: "Все аэропорты", code: "" };

const ALL_SERVICES_OPTION = { id: null, label: "Все услуги", isAll: true };
const ALL_POSITIONS_OPTION = { id: null, label: "Все должности", isAll: true };

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

function SortableTh({
  children,
  sortKey,
  active,
  dir,
  onSort,
  rowSpan,
  colSpan,
}) {
  return (
    <th
      rowSpan={rowSpan}
      colSpan={colSpan}
      scope="col"
      className={`${classes.sortableTh}${active ? ` ${classes.sortableThActive}` : ""}`}
      onClick={() => onSort(sortKey)}
    >
      <span className={classes.sortableThInner}>
        {children}
        <span className={classes.sortIndicator} aria-hidden>
          {active ? (dir === "asc" ? "↑" : "↓") : "↕"}
        </span>
      </span>
    </th>
  );
}

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

  const [mainRange, setMainRange] = useState(null);
  const [compareRange, setCompareRange] = useState(null);

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

  const airportAutocompleteOptions = useMemo(
    () => [ALL_AIRPORTS_OPTION, ...(airportsData?.airports ?? [])],
    [airportsData?.airports]
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
  const period2Result = appliedAnalytics?.compareEnabled
    ? analyticsData?.airlineAnalytics?.period2 ?? null
    : null;

  const isPeriodMultiChart =
    appliedAnalytics?.compareEnabled && period2Result != null;

  const serviceKeys = useMemo(
    () => orderedServiceKeys(period1Result, period2Result),
    [period1Result, period2Result]
  );

  const mergedRequestsPeriod1 = useMemo(
    () => mergeEntityRequestRowsFromServices(period1Result),
    [period1Result]
  );
  const mergedRequestsPeriod2 = useMemo(
    () => mergeEntityRequestRowsFromServices(period2Result),
    [period2Result]
  );
  const unifiedShowGroupedBars =
    isPeriodMultiChart && period1Result && period2Result;
  const showUnifiedRequestsTable =
    serviceKeys.includes("LIVING") || serviceKeys.includes("MEAL");

  const chartAreaHasAnyData = useMemo(() => {
    const check = (period) =>
      getPeriodServices(period).some((b) => hasMeaningfulServiceBlock(b));
    return (
      check(period1Result) ||
      (isPeriodMultiChart && check(period2Result))
    );
  }, [period1Result, period2Result, isPeriodMultiChart]);

  const hasRequestRows =
    mergedRequestsPeriod1.length > 0 ||
    (isPeriodMultiChart && mergedRequestsPeriod2.length > 0);

  const analyticsIsEmpty = !chartAreaHasAnyData && !hasRequestRows;

  const [tableSortById, setTableSortById] = useState({});
  const [pdfExporting, setPdfExporting] = useState(false);
  const analyticsPdfRef = useRef(null);

  const handleExportAnalyticsPdf = useCallback(async () => {
    const root = analyticsPdfRef.current;
    if (!root || pdfExporting) return;

    const scrollEl = root.querySelector("[data-analytics-pdf-scroll]");
    const prevStyle = scrollEl
      ? {
          maxHeight: scrollEl.style.maxHeight,
          overflow: scrollEl.style.overflow,
          overflowY: scrollEl.style.overflowY,
        }
      : null;

    try {
      setPdfExporting(true);
      if (scrollEl) {
        scrollEl.style.maxHeight = "none";
        scrollEl.style.overflow = "visible";
        scrollEl.style.overflowY = "visible";
      }

      const { default: html2pdf } = await import("html2pdf.js");

      const airlineTitle =
        selectedAirline?.name ?? airlines[0]?.name ?? "Аналитика";
      const safeSlug = airlineTitle.replace(/[\\/:*?"<>|]+/g, " ").trim();
      const fileName = `Аналитика_${safeSlug}_${format(new Date(), "dd-MM-yyyy_HH-mm")}.pdf`;

      await html2pdf()
        .set({
          margin: [10, 8, 10, 8],
          filename: fileName,
          image: { type: "jpeg", quality: 0.95 },
          html2canvas: {
            scale: 1.75,
            useCORS: true,
            logging: false,
            letterRendering: true,
            ignoreElements: (el) =>
              Boolean(el?.classList?.contains("pdfNoCapture")),
          },
          jsPDF: { unit: "mm", format: "a4", orientation: "landscape" },
          pagebreak: {
            mode: ["css", "legacy"],
            avoid: [`.${classes.pdfAvoidSplit}`],
          },
        })
        .from(root)
        .save();
    } catch (err) {
      console.error(err);
    } finally {
      if (scrollEl && prevStyle) {
        scrollEl.style.maxHeight = prevStyle.maxHeight;
        scrollEl.style.overflow = prevStyle.overflow;
        scrollEl.style.overflowY = prevStyle.overflowY;
      }
      setPdfExporting(false);
    }
  }, [pdfExporting, selectedAirline?.name, airlines[0]?.name]);

  const handleTableSort = useCallback((tableId, columnKey) => {
    setTableSortById((prev) => {
      const cur = prev[tableId];
      const dir = nextSortDir(
        cur?.key === columnKey ? cur : null,
        columnKey
      );
      return { ...prev, [tableId]: { key: columnKey, dir } };
    });
  }, []);

  const segmentTableBlocks = useMemo(() => {
    const blocks = [];
    const isMulti = isPeriodMultiChart;
    for (const sk of serviceKeys) {
      const sb1 = getServiceBlock(period1Result, sk);
      const sb2 = isMulti ? getServiceBlock(period2Result, sk) : null;
      if (
        !hasMeaningfulServiceBlock(sb1) &&
        !hasMeaningfulServiceBlock(sb2)
      ) {
        continue;
      }
      const sl = SERVICE_LABELS[sk] || sk;
      const rows = [
        {
          label: "Заявки",
          v1: sb1 ? formatInt(sb1.totalRequests) : "—",
          v2: sb2 ? formatInt(sb2.totalRequests) : "—",
        },
        {
          label: "Уник. люди",
          v1: sb1 ? formatInt(sb1.uniquePeopleCount) : "—",
          v2: sb2 ? formatInt(sb2.uniquePeopleCount) : "—",
        },
        {
          label: "Бюджет",
          v1: sb1 ? formatRub(sb1.totalBudget) : "—",
          v2: sb2 ? formatRub(sb2.totalBudget) : "—",
        },
        ...(sk === "LIVING"
          ? [
              {
                label: "Комнаты",
                v1: sb1
                  ? formatRoomsForService(
                      sk,
                      sb1.usedRoomsCount,
                      formatInt
                    )
                  : "—",
                v2: sb2
                  ? formatRoomsForService(
                      sk,
                      sb2.usedRoomsCount,
                      formatInt
                    )
                  : "—",
              },
            ]
          : []),
      ];
      blocks.push({ sk, sb1, sb2, sl, rows });
    }
    return sortSegmentBlocks(
      blocks,
      tableSortById.segments ?? null,
      isMulti
    );
  }, [
    serviceKeys,
    period1Result,
    period2Result,
    isPeriodMultiChart,
    tableSortById.segments,
  ]);

  const sortReqP1 = tableSortById["req-p1"];
  const sortReqP2 = tableSortById["req-p2"];
  const sortReqSingle = tableSortById["req-single"];

  const mergedRequestsP1Sorted = useMemo(
    () =>
      sortMergedRequestRows(
        mergedRequestsPeriod1,
        sortReqP1 ?? null,
        sumRequestServiceBudgets
      ),
    [mergedRequestsPeriod1, sortReqP1?.key, sortReqP1?.dir]
  );

  const mergedRequestsP2Sorted = useMemo(
    () =>
      sortMergedRequestRows(
        mergedRequestsPeriod2,
        sortReqP2 ?? null,
        sumRequestServiceBudgets
      ),
    [mergedRequestsPeriod2, sortReqP2?.key, sortReqP2?.dir]
  );

  const mergedRequestsSingleSorted = useMemo(
    () =>
      sortMergedRequestRows(
        mergedRequestsPeriod1,
        sortReqSingle ?? null,
        sumRequestServiceBudgets
      ),
    [mergedRequestsPeriod1, sortReqSingle?.key, sortReqSingle?.dir]
  );

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
        if (compareEnabled) {
          setCompareRange((cr) =>
            isPeriodRangeComplete(cr) ? cr : defaultCompareRange(range)
          );
        }
      } else {
        setCompareRange(range);
      }
      setShowPicker(false);
    },
    [pickerTarget, compareEnabled]
  );

  const handleCompareToggle = useCallback(
    (event) => {
      const next = event.target.checked;
      setCompareEnabled(next);
      if (next) {
        setCompareRange(
          isPeriodRangeComplete(mainRange)
            ? defaultCompareRange(mainRange)
            : null
        );
        setSelectedAirportB(selectedAirport);
        setSelectedPositionIdsB([...selectedPositionIds]);
      } else {
        setCompareRange(null);
      }
    },
    [mainRange, selectedAirport, selectedPositionIds]
  );

  const handleApplyAnalytics = useCallback(() => {
    if (!airlineId) return;
    if (!isPeriodRangeComplete(mainRange)) return;
    if (compareEnabled && !isPeriodRangeComplete(compareRange)) return;
    setAppliedAnalytics({
      mainRange: { ...mainRange },
      compareRange:
        compareEnabled && compareRange ? { ...compareRange } : null,
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

  const mainDays = isPeriodRangeComplete(mainRange)
    ? differenceInCalendarDays(mainRange.endDate, mainRange.startDate) + 1
    : null;
  const compareDays = isPeriodRangeComplete(compareRange)
    ? differenceInCalendarDays(compareRange.endDate, compareRange.startDate) +
      1
    : null;

  const period1Label = appliedAnalytics
    ? formatPeriodHuman(appliedAnalytics.mainRange)
    : "";
  const period2Label = appliedAnalytics
    ? formatPeriodHuman(appliedAnalytics.compareRange)
    : "";

  const groupedBarSeries = useMemo(
    () => [
      { key: "p0", label: period1Label },
      { key: "p1", label: period2Label },
    ],
    [period1Label, period2Label]
  );

  return (
    <div className={classes.pageWrap} style={height ? { height } : undefined}>
      <div className={classes.filtersStrip}>
        <div className={classes.filtersRow}>
          <button
            type="button"
            className={classes.periodButton}
            onClick={openMainPicker}
          >
            {compareEnabled ? "Период 1" : "Период"}
          </button>

          <span className={classes.periodSummaryInline}>
            {isPeriodRangeComplete(mainRange)
              ? `${formatPeriodHuman(mainRange)} (${mainDays} дн.)`
              : ""}
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
              disabled={
                !airlineId ||
                !isPeriodRangeComplete(mainRange) ||
                (compareEnabled && !isPeriodRangeComplete(compareRange))
              }
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
              {isPeriodRangeComplete(compareRange)
                ? `${formatPeriodHuman(compareRange)} (${compareDays} дн.)`
                : ""}
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
                    className={`${classes.listItem} ${
                      selectedAirline && selectedAirline.id === airline.id
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
            <div ref={analyticsPdfRef} className={classes.graphsPdfRoot}>
              <div className={classes.headerRow}>
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
                    {selectedAirline
                      ? selectedAirline?.name
                      : airlines[0]?.name}
                  </p>
                </h2>
                {appliedAnalytics && !analyticsLoading && airlineId ? (
                  <button
                    type="button"
                    className={`${classes.exportPdfButton} pdfNoCapture`}
                    disabled={pdfExporting}
                    onClick={handleExportAnalyticsPdf}
                  >
                    {pdfExporting
                      ? "Формирование…"
                      : "Выгрузить аналитику"}
                  </button>
                ) : null}
              </div>

            <div
              className={classes.contentWrapper}
              data-analytics-pdf-scroll
            >
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
                  {analyticsIsEmpty ? (
                    <div className={classes.analyticsEmptyState}>
                      <p className={classes.analyticsEmptyMessage}>
                        Нет данных
                      </p>
                    </div>
                  ) : (
                    <>
                  <div
                    className={
                      user?.airlineId ? classes.rowNoAdaptive : classes.row
                    }
                  >
                    <div className={classes.chartsColumn}>
                      {chartAreaHasAnyData
                        ? serviceKeys.map((serviceKey) => {
                        const b1 = getServiceBlock(period1Result, serviceKey);
                        const b2 = isPeriodMultiChart
                          ? getServiceBlock(period2Result, serviceKey)
                          : null;
                        if (
                          !hasMeaningfulServiceBlock(b1) &&
                          !hasMeaningfulServiceBlock(b2)
                        ) {
                          return null;
                        }

                        const label =
                          SERVICE_LABELS[serviceKey] || serviceKey;
                        const showAirportRoomsCol = serviceKey === "LIVING";
                        const airportMetrics = AIRPORT_BAR_METRICS.filter(
                          (m) =>
                            m.id !== "usedRoomsCount" ||
                            serviceKey === "LIVING"
                        );

                        const showGroupedBars =
                          isPeriodMultiChart && b1 && b2;
                        const periodFilters = appliedAnalytics
                          ? [
                              appliedAnalytics.selectedAirport,
                              appliedAnalytics.selectedAirportB,
                            ]
                          : [null, null];

                        const posRows = mergePositionRows(
                          b1?.positions,
                          b2?.positions,
                          showGroupedBars
                        );
                        const apRows = mergeAirportRows(
                          b1?.airports,
                          b2?.airports,
                          showGroupedBars
                        );

                        const posTableId = `pos-${serviceKey}`;
                        const apTableId = `ap-${serviceKey}`;
                        const posSort = tableSortById[posTableId] ?? null;
                        const apSort = tableSortById[apTableId] ?? null;
                        const posSorted = sortPositionRows(
                          posRows,
                          showGroupedBars,
                          posSort
                        );
                        const apSorted = sortAirportRows(
                          apRows,
                          showGroupedBars,
                          apSort
                        );

                        const budgetBarFromPositions = (positions) => {
                          if (serviceKey !== "LIVING" && serviceKey !== "MEAL") {
                            return null;
                          }
                          const rows = (positions ?? [])
                            .map((p) => ({
                              name: p.positionName,
                              value: Number(p.budget) || 0,
                            }))
                            .filter((r) => r.value > 0);
                          return rows.length > 0 ? rows : null;
                        };

                        const positionsToPieData = (positions) =>
                          (positions ?? [])
                            .map((item) => ({
                              x: item.positionName,
                              value: Number(item.count) || 0,
                            }))
                            .filter((d) => d.value > 0);

                        const pieBlocks = [];
                        if (
                          b1 &&
                          shouldShowPositionsPie(
                            appliedAnalytics.selectedPositionIds
                          )
                        ) {
                          const p1Pie = positionsToPieData(b1.positions);
                          if (p1Pie.length > 0) {
                            pieBlocks.push({
                              key: "p1",
                              title: showGroupedBars ? period1Label : label,
                              data: p1Pie,
                              barData: budgetBarFromPositions(b1.positions),
                            });
                          }
                        }
                        if (
                          showGroupedBars &&
                          b2 &&
                          shouldShowPositionsPie(
                            appliedAnalytics.selectedPositionIdsB
                          )
                        ) {
                          const p2Pie = positionsToPieData(b2.positions);
                          if (p2Pie.length > 0) {
                            pieBlocks.push({
                              key: "p2",
                              title: period2Label,
                              data: p2Pie,
                              barData: budgetBarFromPositions(b2.positions),
                            });
                          }
                        }

                        const hasSideBySideBarInPeriod =
                          (serviceKey === "LIVING" ||
                            serviceKey === "MEAL") &&
                          pieBlocks.some(
                            (pb) =>
                              pb.barData && pb.barData.length > 0
                          );

                        const positionBudgetGroupedData =
                          showGroupedBars &&
                          (serviceKey === "LIVING" ||
                            serviceKey === "MEAL") &&
                          b1 &&
                          b2
                            ? buildGroupedBarDataForPositionBudget([
                                b1,
                                b2,
                              ])
                            : null;
                        const showPositionBudgetGroupedChart =
                          positionBudgetGroupedData &&
                          positionBudgetGroupedData.length > 0;

                        const airportChartConfigs = airportMetrics.filter(
                          (cfg) => {
                            if (showGroupedBars) {
                              const gData = buildGroupedBarDataForMetric(
                                cfg.id,
                                [b1, b2].filter(Boolean),
                                periodFilters
                              );
                              return gData.length > 0;
                            }
                            return (b1?.airports?.length ?? 0) > 0;
                          }
                        );

                        const showPieRow =
                          pieBlocks.length > 0 ||
                          showPositionBudgetGroupedChart;
                        const showAirportBarBlock =
                          serviceKey !== "TRANSFER" &&
                          airportChartConfigs.length > 0;
                        const showPosTable = posSorted.length > 0;
                        const showApTable = apSorted.length > 0;

                        if (
                          !showPieRow &&
                          !showAirportBarBlock &&
                          !showPosTable &&
                          !showApTable
                        ) {
                          return null;
                        }

                        return (
                          <div
                            key={serviceKey}
                            className={classes.serviceSection}
                          >
                            <h3 className={classes.serviceSectionTitle}>
                              {label}
                            </h3>

                            {showPieRow ? (
                              <div
                                className={`${classes.pieChartsRow} ${
                                  hasSideBySideBarInPeriod
                                    ? classes.pieChartsRowStacked
                                    : classes.pieChartsRowInline
                                }`}
                              >
                                {showPositionBudgetGroupedChart ? (
                                  <div
                                    className={classes.pieChartsComparePiesRow}
                                  >
                                    {pieBlocks.map((pb) => (
                                      <div
                                        key={`${serviceKey}-${pb.key}`}
                                        className={`${classes.pieBarPair1} ${classes.pdfAvoidSplit}`}
                                      >
                                        <AnalyticsChart
                                          type="pie"
                                          title={pb.title}
                                          data={pb.data}
                                          xKey="x"
                                          dataKey="value"
                                        />
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  pieBlocks.map((pb) => (
                                    <div
                                      key={`${serviceKey}-${pb.key}`}
                                      className={`${
                                        serviceKey === "LIVING" ||
                                        serviceKey === "MEAL"
                                          ? classes.pieBarPair1
                                          : classes.pieBarPair
                                      } ${classes.pdfAvoidSplit}`}
                                    >
                                      <AnalyticsChart
                                        type="pie"
                                        title={pb.title}
                                        data={pb.data}
                                        xKey="x"
                                        dataKey="value"
                                      />
                                      {(serviceKey === "LIVING" ||
                                        serviceKey === "MEAL") &&
                                      pb.barData &&
                                      pb.barData.length > 0 ? (
                                        <AnalyticsChart
                                          type="simpleBar"
                                          title="Бюджет по должностям"
                                          data={pb.barData}
                                          xKey="name"
                                          yKey="value"
                                          barValueLabel="Бюджет, ₽"
                                          height={280}
                                          // fullWidth
                                        />
                                      ) : null}
                                    </div>
                                  ))
                                )}
                                {showPositionBudgetGroupedChart ? (
                                  <div
                                    className={`${classes.pieChartsGroupedBudgetWrap} ${classes.pdfAvoidSplit}`}
                                  >
                                    <AnalyticsChart
                                      type="groupedBar"
                                      title="Бюджет по должностям"
                                      data={positionBudgetGroupedData}
                                      series={groupedBarSeries}
                                      xKey="name"
                                      height={280}
                                      fullWidth
                                      groupedValueFormat={(v) =>
                                        formatRub(v)
                                      }
                                    />
                                  </div>
                                ) : null}
                              </div>
                            ) : null}

                            {showPosTable ? (
                            <div className={classes.breakdownTableSection}>
                              <h4 className={classes.breakdownTableTitle}>
                                Должности
                              </h4>
                              <div className={classes.tableScroll}>
                                <table className={classes.analyticsTable}>
                                  <thead>
                                    {showGroupedBars ? (
                                      <>
                                        <tr>
                                          <SortableTh
                                            rowSpan={2}
                                            sortKey="name"
                                            active={posSort?.key === "name"}
                                            dir={posSort?.dir}
                                            onSort={(k) =>
                                              handleTableSort(posTableId, k)
                                            }
                                          >
                                            Должность
                                          </SortableTh>
                                          <th colSpan={3}>{period1Label}</th>
                                          <th colSpan={3}>{period2Label}</th>
                                        </tr>
                                        <tr>
                                          <SortableTh
                                            sortKey="p1count"
                                            active={posSort?.key === "p1count"}
                                            dir={posSort?.dir}
                                            onSort={(k) =>
                                              handleTableSort(posTableId, k)
                                            }
                                          >
                                            Заявки
                                          </SortableTh>
                                          <SortableTh
                                            sortKey="p1pct"
                                            active={posSort?.key === "p1pct"}
                                            dir={posSort?.dir}
                                            onSort={(k) =>
                                              handleTableSort(posTableId, k)
                                            }
                                          >
                                            %
                                          </SortableTh>
                                          <SortableTh
                                            sortKey="p1budget"
                                            active={
                                              posSort?.key === "p1budget"
                                            }
                                            dir={posSort?.dir}
                                            onSort={(k) =>
                                              handleTableSort(posTableId, k)
                                            }
                                          >
                                            Бюджет, ₽
                                          </SortableTh>
                                          <SortableTh
                                            sortKey="p2count"
                                            active={posSort?.key === "p2count"}
                                            dir={posSort?.dir}
                                            onSort={(k) =>
                                              handleTableSort(posTableId, k)
                                            }
                                          >
                                            Заявки
                                          </SortableTh>
                                          <SortableTh
                                            sortKey="p2pct"
                                            active={posSort?.key === "p2pct"}
                                            dir={posSort?.dir}
                                            onSort={(k) =>
                                              handleTableSort(posTableId, k)
                                            }
                                          >
                                            %
                                          </SortableTh>
                                          <SortableTh
                                            sortKey="p2budget"
                                            active={
                                              posSort?.key === "p2budget"
                                            }
                                            dir={posSort?.dir}
                                            onSort={(k) =>
                                              handleTableSort(posTableId, k)
                                            }
                                          >
                                            Бюджет, ₽
                                          </SortableTh>
                                        </tr>
                                      </>
                                    ) : (
                                      <tr>
                                        <SortableTh
                                          sortKey="name"
                                          active={posSort?.key === "name"}
                                          dir={posSort?.dir}
                                          onSort={(k) =>
                                            handleTableSort(posTableId, k)
                                          }
                                        >
                                          Должность
                                        </SortableTh>
                                        <SortableTh
                                          sortKey="p1count"
                                          active={posSort?.key === "p1count"}
                                          dir={posSort?.dir}
                                          onSort={(k) =>
                                            handleTableSort(posTableId, k)
                                          }
                                        >
                                          Заявки
                                        </SortableTh>
                                        <SortableTh
                                          sortKey="p1pct"
                                          active={posSort?.key === "p1pct"}
                                          dir={posSort?.dir}
                                          onSort={(k) =>
                                            handleTableSort(posTableId, k)
                                          }
                                        >
                                          %
                                        </SortableTh>
                                        <SortableTh
                                          sortKey="p1budget"
                                          active={
                                            posSort?.key === "p1budget"
                                          }
                                          dir={posSort?.dir}
                                          onSort={(k) =>
                                            handleTableSort(posTableId, k)
                                          }
                                        >
                                          Бюджет, ₽
                                        </SortableTh>
                                      </tr>
                                    )}
                                  </thead>
                                  <tbody>
                                    {posSorted.map((row) => (
                                      <tr key={row.key}>
                                        <td>{row.name}</td>
                                        {showGroupedBars ? (
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
                                              {row.p1 != null
                                                ? formatRub(row.p1.budget)
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
                                            <td>
                                              {row.p2 != null
                                                ? formatRub(row.p2.budget)
                                                : "—"}
                                            </td>
                                          </>
                                        ) : (
                                          <>
                                            <td>
                                              {formatInt(row.p1?.count)}
                                            </td>
                                            <td>
                                              {formatPct(row.p1?.percent)}
                                            </td>
                                            <td>
                                              {formatRub(row.p1?.budget)}
                                            </td>
                                          </>
                                        )}
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                            ) : null}

                            {showAirportBarBlock ? (
                                <div className={classes.barBlock}>
                                  <div className={classes.barHeader}>
                                    <h4 className={classes.barTitle}>
                                      Аэропорты
                                    </h4>
                                  </div>
                                  <div className={classes.airportBarsStack}>
                                    {airportChartConfigs.map((cfg) => {
                                      let chartEl;
                                      if (showGroupedBars) {
                                        const data =
                                          buildGroupedBarDataForMetric(
                                            cfg.id,
                                            [b1, b2].filter(Boolean),
                                            periodFilters
                                          );
                                        chartEl = (
                                          <AnalyticsChart
                                            type="groupedBar"
                                            data={data}
                                            series={groupedBarSeries}
                                            xKey="name"
                                            height={260}
                                            fullWidth
                                            groupedValueFormat={(v) =>
                                              cfg.id === "budget"
                                                ? formatRub(v)
                                                : formatInt(v)
                                            }
                                          />
                                        );
                                      } else {
                                        const data = (b1.airports ?? []).map(
                                          (row) => ({
                                            name:
                                              row.airportCode ||
                                              row.airportName ||
                                              row.airportId ||
                                              "—",
                                            value:
                                              cfg.id === "requestsCount"
                                                ? Number(row.requestsCount) ||
                                                  0
                                                : cfg.id === "budget"
                                                  ? Number(row.budget) || 0
                                                  : cfg.id ===
                                                      "uniquePeopleCount"
                                                    ? Number(
                                                        row.uniquePeopleCount
                                                      ) || 0
                                                    : Number(
                                                        row.usedRoomsCount
                                                      ) || 0,
                                          })
                                        );
                                        chartEl = (
                                          <AnalyticsChart
                                            type="simpleBar"
                                            data={data}
                                            xKey="name"
                                            yKey="value"
                                            barValueLabel={cfg.label}
                                            height={260}
                                            fullWidth
                                          />
                                        );
                                      }
                                      return (
                                        <div
                                          key={`${serviceKey}-${cfg.id}`}
                                          className={`${classes.airportBarChartItem} ${classes.pdfAvoidSplit}`}
                                        >
                                          <h5
                                            className={
                                              classes.airportBarChartSubtitle
                                            }
                                          >
                                            {cfg.label}
                                          </h5>
                                          {chartEl}
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                            ) : null}

                            {showApTable ? (
                                <div
                                  className={classes.breakdownTableSection}
                                >
                                  <h4 className={classes.breakdownTableTitle}>
                                    Аэропорты
                                  </h4>
                                  <div className={classes.tableScroll}>
                                    <table className={classes.analyticsTable}>
                                      <thead>
                                        {showGroupedBars ? (
                                          <>
                                            <tr>
                                              <SortableTh
                                                rowSpan={2}
                                                sortKey="name"
                                                active={apSort?.key === "name"}
                                                dir={apSort?.dir}
                                                onSort={(k) =>
                                                  handleTableSort(
                                                    apTableId,
                                                    k
                                                  )
                                                }
                                              >
                                                Аэропорт
                                              </SortableTh>
                                              <th
                                                colSpan={
                                                  showAirportRoomsCol ? 4 : 3
                                                }
                                              >
                                                {period1Label}
                                              </th>
                                              <th
                                                colSpan={
                                                  showAirportRoomsCol ? 4 : 3
                                                }
                                              >
                                                {period2Label}
                                              </th>
                                            </tr>
                                            <tr>
                                              <SortableTh
                                                sortKey="p1req"
                                                active={
                                                  apSort?.key === "p1req"
                                                }
                                                dir={apSort?.dir}
                                                onSort={(k) =>
                                                  handleTableSort(
                                                    apTableId,
                                                    k
                                                  )
                                                }
                                              >
                                                Заявки
                                              </SortableTh>
                                              <SortableTh
                                                sortKey="p1people"
                                                active={
                                                  apSort?.key === "p1people"
                                                }
                                                dir={apSort?.dir}
                                                onSort={(k) =>
                                                  handleTableSort(
                                                    apTableId,
                                                    k
                                                  )
                                                }
                                              >
                                                Люди
                                              </SortableTh>
                                              {showAirportRoomsCol ? (
                                                <SortableTh
                                                  sortKey="p1rooms"
                                                  active={
                                                    apSort?.key === "p1rooms"
                                                  }
                                                  dir={apSort?.dir}
                                                  onSort={(k) =>
                                                    handleTableSort(
                                                      apTableId,
                                                      k
                                                    )
                                                  }
                                                >
                                                  Комнаты
                                                </SortableTh>
                                              ) : null}
                                              <SortableTh
                                                sortKey="p1budget"
                                                active={
                                                  apSort?.key === "p1budget"
                                                }
                                                dir={apSort?.dir}
                                                onSort={(k) =>
                                                  handleTableSort(
                                                    apTableId,
                                                    k
                                                  )
                                                }
                                              >
                                                Бюджет, ₽
                                              </SortableTh>
                                              <SortableTh
                                                sortKey="p2req"
                                                active={
                                                  apSort?.key === "p2req"
                                                }
                                                dir={apSort?.dir}
                                                onSort={(k) =>
                                                  handleTableSort(
                                                    apTableId,
                                                    k
                                                  )
                                                }
                                              >
                                                Заявки
                                              </SortableTh>
                                              <SortableTh
                                                sortKey="p2people"
                                                active={
                                                  apSort?.key === "p2people"
                                                }
                                                dir={apSort?.dir}
                                                onSort={(k) =>
                                                  handleTableSort(
                                                    apTableId,
                                                    k
                                                  )
                                                }
                                              >
                                                Люди
                                              </SortableTh>
                                              {showAirportRoomsCol ? (
                                                <SortableTh
                                                  sortKey="p2rooms"
                                                  active={
                                                    apSort?.key === "p2rooms"
                                                  }
                                                  dir={apSort?.dir}
                                                  onSort={(k) =>
                                                    handleTableSort(
                                                      apTableId,
                                                      k
                                                    )
                                                  }
                                                >
                                                  Комнаты
                                                </SortableTh>
                                              ) : null}
                                              <SortableTh
                                                sortKey="p2budget"
                                                active={
                                                  apSort?.key === "p2budget"
                                                }
                                                dir={apSort?.dir}
                                                onSort={(k) =>
                                                  handleTableSort(
                                                    apTableId,
                                                    k
                                                  )
                                                }
                                              >
                                                Бюджет, ₽
                                              </SortableTh>
                                            </tr>
                                          </>
                                        ) : (
                                          <tr>
                                            <SortableTh
                                              sortKey="name"
                                              active={apSort?.key === "name"}
                                              dir={apSort?.dir}
                                              onSort={(k) =>
                                                handleTableSort(apTableId, k)
                                              }
                                            >
                                              Аэропорт
                                            </SortableTh>
                                            <SortableTh
                                              sortKey="p1req"
                                              active={apSort?.key === "p1req"}
                                              dir={apSort?.dir}
                                              onSort={(k) =>
                                                handleTableSort(apTableId, k)
                                              }
                                            >
                                              Заявки
                                            </SortableTh>
                                            <SortableTh
                                              sortKey="p1people"
                                              active={
                                                apSort?.key === "p1people"
                                              }
                                              dir={apSort?.dir}
                                              onSort={(k) =>
                                                handleTableSort(apTableId, k)
                                              }
                                            >
                                              Люди
                                            </SortableTh>
                                            {showAirportRoomsCol ? (
                                              <SortableTh
                                                sortKey="p1rooms"
                                                active={
                                                  apSort?.key === "p1rooms"
                                                }
                                                dir={apSort?.dir}
                                                onSort={(k) =>
                                                  handleTableSort(
                                                    apTableId,
                                                    k
                                                  )
                                                }
                                              >
                                                Комнаты
                                              </SortableTh>
                                            ) : null}
                                            <SortableTh
                                              sortKey="p1budget"
                                              active={
                                                apSort?.key === "p1budget"
                                              }
                                              dir={apSort?.dir}
                                              onSort={(k) =>
                                                handleTableSort(apTableId, k)
                                              }
                                            >
                                              Бюджет, ₽
                                            </SortableTh>
                                          </tr>
                                        )}
                                      </thead>
                                      <tbody>
                                        {apSorted.map((row) => (
                                          <tr key={row.key}>
                                            <td>{row.name}</td>
                                            {showGroupedBars ? (
                                              <>
                                                <td>
                                                  {row.p1
                                                    ? formatInt(
                                                        row.p1.requestsCount
                                                      )
                                                    : "—"}
                                                </td>
                                                <td>
                                                  {row.p1
                                                    ? formatInt(
                                                        row.p1.uniquePeopleCount
                                                      )
                                                    : "—"}
                                                </td>
                                                {showAirportRoomsCol ? (
                                                  <td>
                                                    {row.p1
                                                      ? formatRoomsForService(
                                                          serviceKey,
                                                          row.p1
                                                            .usedRoomsCount,
                                                          formatInt
                                                        )
                                                      : "—"}
                                                  </td>
                                                ) : null}
                                                <td>
                                                  {row.p1
                                                    ? formatRub(row.p1.budget)
                                                    : "—"}
                                                </td>
                                                <td>
                                                  {row.p2
                                                    ? formatInt(
                                                        row.p2.requestsCount
                                                      )
                                                    : "—"}
                                                </td>
                                                <td>
                                                  {row.p2
                                                    ? formatInt(
                                                        row.p2.uniquePeopleCount
                                                      )
                                                    : "—"}
                                                </td>
                                                {showAirportRoomsCol ? (
                                                  <td>
                                                    {row.p2
                                                      ? formatRoomsForService(
                                                          serviceKey,
                                                          row.p2
                                                            .usedRoomsCount,
                                                          formatInt
                                                        )
                                                      : "—"}
                                                  </td>
                                                ) : null}
                                                <td>
                                                  {row.p2
                                                    ? formatRub(row.p2.budget)
                                                    : "—"}
                                                </td>
                                              </>
                                            ) : (
                                              <>
                                                <td>
                                                  {formatInt(
                                                    row.p1?.requestsCount
                                                  )}
                                                </td>
                                                <td>
                                                  {formatInt(
                                                    row.p1?.uniquePeopleCount
                                                  )}
                                                </td>
                                                {showAirportRoomsCol ? (
                                                  <td>
                                                    {formatRoomsForService(
                                                      serviceKey,
                                                      row.p1?.usedRoomsCount,
                                                      formatInt
                                                    )}
                                                  </td>
                                                ) : null}
                                                <td>
                                                  {formatRub(row.p1?.budget)}
                                                </td>
                                              </>
                                            )}
                                          </tr>
                                        ))}
                                      </tbody>
                                    </table>
                                  </div>
                                </div>
                            ) : null}
                          </div>
                        );
                      })
                        : null}
                    </div>
                  </div>

                  {segmentTableBlocks.length > 0 ? (
                    <div className={classes.segmentsSection}>
                      <h4 className={classes.segmentsTitle}>
                        Сводка по услугам
                      </h4>
                      <div className={classes.tableScroll}>
                        <table className={classes.analyticsTable}>
                          <thead>
                            <tr>
                              <SortableTh
                                sortKey="service"
                                active={
                                  tableSortById.segments?.key === "service"
                                }
                                dir={tableSortById.segments?.dir}
                                onSort={(k) => handleTableSort("segments", k)}
                              >
                                Услуга / метрика
                              </SortableTh>
                              {isPeriodMultiChart ? (
                                <>
                                  <SortableTh
                                    sortKey="p1"
                                    active={
                                      tableSortById.segments?.key === "p1"
                                    }
                                    dir={tableSortById.segments?.dir}
                                    onSort={(k) =>
                                      handleTableSort("segments", k)
                                    }
                                  >
                                    {period1Label}
                                  </SortableTh>
                                  <SortableTh
                                    sortKey="p2"
                                    active={
                                      tableSortById.segments?.key === "p2"
                                    }
                                    dir={tableSortById.segments?.dir}
                                    onSort={(k) =>
                                      handleTableSort("segments", k)
                                    }
                                  >
                                    {period2Label}
                                  </SortableTh>
                                </>
                              ) : (
                                <SortableTh
                                  sortKey="value"
                                  active={
                                    tableSortById.segments?.key === "value"
                                  }
                                  dir={tableSortById.segments?.dir}
                                  onSort={(k) =>
                                    handleTableSort("segments", k)
                                  }
                                >
                                  Значение
                                </SortableTh>
                              )}
                            </tr>
                          </thead>
                          <tbody>
                            {segmentTableBlocks.map(
                              ({ sk, sl, rows: segRows }) => (
                                <Fragment key={sk}>
                                  <tr>
                                    <td
                                      colSpan={
                                        isPeriodMultiChart ? 3 : 2
                                      }
                                    >
                                      <strong>{sl}</strong>
                                    </td>
                                  </tr>
                                  {segRows.map((r) => (
                                    <tr key={`${sk}-${r.label}`}>
                                      <td>{r.label}</td>
                                      {isPeriodMultiChart ? (
                                        <>
                                          <td>{r.v1}</td>
                                          <td>{r.v2}</td>
                                        </>
                                      ) : (
                                        <td>{r.v1}</td>
                                      )}
                                    </tr>
                                  ))}
                                </Fragment>
                              )
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ) : null}
                  {showUnifiedRequestsTable && hasRequestRows ? (
                    <div className={classes.breakdownTableSection}>
                      <h4 className={classes.breakdownTableTitle}>Заявки</h4>
                      {unifiedShowGroupedBars ? (
                        <>
                          <h5
                            className={classes.airportBarChartSubtitle}
                          >
                            {period1Label}
                          </h5>
                          <div className={classes.tableScroll}>
                            <table className={classes.analyticsTable}>
                              <thead>
                                <tr>
                                  <SortableTh
                                    sortKey="number"
                                    active={sortReqP1?.key === "number"}
                                    dir={sortReqP1?.dir}
                                    onSort={(k) =>
                                      handleTableSort("req-p1", k)
                                    }
                                  >
                                    Номер
                                  </SortableTh>
                                  <SortableTh
                                    sortKey="person"
                                    active={sortReqP1?.key === "person"}
                                    dir={sortReqP1?.dir}
                                    onSort={(k) =>
                                      handleTableSort("req-p1", k)
                                    }
                                  >
                                    Человек
                                  </SortableTh>
                                  <SortableTh
                                    sortKey="position"
                                    active={sortReqP1?.key === "position"}
                                    dir={sortReqP1?.dir}
                                    onSort={(k) =>
                                      handleTableSort("req-p1", k)
                                    }
                                  >
                                    Должность
                                  </SortableTh>
                                  <SortableTh
                                    sortKey="airport"
                                    active={sortReqP1?.key === "airport"}
                                    dir={sortReqP1?.dir}
                                    onSort={(k) =>
                                      handleTableSort("req-p1", k)
                                    }
                                  >
                                    Аэропорт
                                  </SortableTh>
                                  <SortableTh
                                    sortKey="total"
                                    active={sortReqP1?.key === "total"}
                                    dir={sortReqP1?.dir}
                                    onSort={(k) =>
                                      handleTableSort("req-p1", k)
                                    }
                                  >
                                    Бюджет
                                  </SortableTh>
                                  <SortableTh
                                    sortKey="living"
                                    active={sortReqP1?.key === "living"}
                                    dir={sortReqP1?.dir}
                                    onSort={(k) =>
                                      handleTableSort("req-p1", k)
                                    }
                                  >
                                    Проживание
                                  </SortableTh>
                                  <SortableTh
                                    sortKey="meal"
                                    active={sortReqP1?.key === "meal"}
                                    dir={sortReqP1?.dir}
                                    onSort={(k) =>
                                      handleTableSort("req-p1", k)
                                    }
                                  >
                                    Питание
                                  </SortableTh>
                                  <SortableTh
                                    sortKey="transfer"
                                    active={sortReqP1?.key === "transfer"}
                                    dir={sortReqP1?.dir}
                                    onSort={(k) =>
                                      handleTableSort("req-p1", k)
                                    }
                                  >
                                    Трансфер
                                  </SortableTh>
                                </tr>
                              </thead>
                              <tbody>
                                {mergedRequestsP1Sorted.length ? (
                                  mergedRequestsP1Sorted.map((r, idx) => (
                                    <tr
                                      key={
                                        r.requestId ??
                                        r.requestNumber ??
                                        `p1-${idx}`
                                      }
                                    >
                                      <td>
                                        {r.requestNumber ??
                                          r.requestId ??
                                          "—"}
                                      </td>
                                      <td>{r.personName ?? "—"}</td>
                                      <td>{r.positionName ?? "—"}</td>
                                      <td>
                                        {r.airportCode ??
                                          r.airportName ??
                                          "—"}
                                      </td>
                                      <td>
                                        {formatRub(
                                          sumRequestServiceBudgets(r)
                                        )}
                                      </td>
                                      <td>
                                        {formatRub(r.livingBudget)}
                                      </td>
                                      <td>{formatRub(r.mealBudget)}</td>
                                      <td>
                                        {formatRub(r.transferBudget)}
                                      </td>
                                    </tr>
                                  ))
                                ) : (
                                  <tr>
                                    <td colSpan={8}>Нет строк</td>
                                  </tr>
                                )}
                              </tbody>
                            </table>
                          </div>
                          <h5
                            className={classes.airportBarChartSubtitle}
                          >
                            {period2Label}
                          </h5>
                          <div className={classes.tableScroll}>
                            <table className={classes.analyticsTable}>
                              <thead>
                                <tr>
                                  <SortableTh
                                    sortKey="number"
                                    active={sortReqP2?.key === "number"}
                                    dir={sortReqP2?.dir}
                                    onSort={(k) =>
                                      handleTableSort("req-p2", k)
                                    }
                                  >
                                    Номер
                                  </SortableTh>
                                  <SortableTh
                                    sortKey="person"
                                    active={sortReqP2?.key === "person"}
                                    dir={sortReqP2?.dir}
                                    onSort={(k) =>
                                      handleTableSort("req-p2", k)
                                    }
                                  >
                                    Человек
                                  </SortableTh>
                                  <SortableTh
                                    sortKey="position"
                                    active={sortReqP2?.key === "position"}
                                    dir={sortReqP2?.dir}
                                    onSort={(k) =>
                                      handleTableSort("req-p2", k)
                                    }
                                  >
                                    Должность
                                  </SortableTh>
                                  <SortableTh
                                    sortKey="airport"
                                    active={sortReqP2?.key === "airport"}
                                    dir={sortReqP2?.dir}
                                    onSort={(k) =>
                                      handleTableSort("req-p2", k)
                                    }
                                  >
                                    Аэропорт
                                  </SortableTh>
                                  <SortableTh
                                    sortKey="total"
                                    active={sortReqP2?.key === "total"}
                                    dir={sortReqP2?.dir}
                                    onSort={(k) =>
                                      handleTableSort("req-p2", k)
                                    }
                                  >
                                    Бюджет
                                  </SortableTh>
                                  <SortableTh
                                    sortKey="living"
                                    active={sortReqP2?.key === "living"}
                                    dir={sortReqP2?.dir}
                                    onSort={(k) =>
                                      handleTableSort("req-p2", k)
                                    }
                                  >
                                    Проживание
                                  </SortableTh>
                                  <SortableTh
                                    sortKey="meal"
                                    active={sortReqP2?.key === "meal"}
                                    dir={sortReqP2?.dir}
                                    onSort={(k) =>
                                      handleTableSort("req-p2", k)
                                    }
                                  >
                                    Питание
                                  </SortableTh>
                                  <SortableTh
                                    sortKey="transfer"
                                    active={sortReqP2?.key === "transfer"}
                                    dir={sortReqP2?.dir}
                                    onSort={(k) =>
                                      handleTableSort("req-p2", k)
                                    }
                                  >
                                    Трансфер
                                  </SortableTh>
                                </tr>
                              </thead>
                              <tbody>
                                {mergedRequestsP2Sorted.length ? (
                                  mergedRequestsP2Sorted.map((r, idx) => (
                                    <tr
                                      key={
                                        r.requestId ??
                                        r.requestNumber ??
                                        `p2-${idx}`
                                      }
                                    >
                                      <td>
                                        {r.requestNumber ??
                                          r.requestId ??
                                          "—"}
                                      </td>
                                      <td>{r.personName ?? "—"}</td>
                                      <td>{r.positionName ?? "—"}</td>
                                      <td>
                                        {r.airportCode ??
                                          r.airportName ??
                                          "—"}
                                      </td>
                                      <td>
                                        {formatRub(
                                          sumRequestServiceBudgets(r)
                                        )}
                                      </td>
                                      <td>
                                        {formatRub(r.livingBudget)}
                                      </td>
                                      <td>{formatRub(r.mealBudget)}</td>
                                      <td>
                                        {formatRub(r.transferBudget)}
                                      </td>
                                    </tr>
                                  ))
                                ) : (
                                  <tr>
                                    <td colSpan={8}>Нет строк</td>
                                  </tr>
                                )}
                              </tbody>
                            </table>
                          </div>
                        </>
                      ) : (
                        <div className={classes.tableScroll}>
                          <table className={classes.analyticsTable}>
                            <thead>
                              <tr>
                                <SortableTh
                                  sortKey="number"
                                  active={sortReqSingle?.key === "number"}
                                  dir={sortReqSingle?.dir}
                                  onSort={(k) =>
                                    handleTableSort("req-single", k)
                                  }
                                >
                                  Номер
                                </SortableTh>
                                <SortableTh
                                  sortKey="person"
                                  active={sortReqSingle?.key === "person"}
                                  dir={sortReqSingle?.dir}
                                  onSort={(k) =>
                                    handleTableSort("req-single", k)
                                  }
                                >
                                  Человек
                                </SortableTh>
                                <SortableTh
                                  sortKey="position"
                                  active={
                                    sortReqSingle?.key === "position"
                                  }
                                  dir={sortReqSingle?.dir}
                                  onSort={(k) =>
                                    handleTableSort("req-single", k)
                                  }
                                >
                                  Должность
                                </SortableTh>
                                <SortableTh
                                  sortKey="airport"
                                  active={sortReqSingle?.key === "airport"}
                                  dir={sortReqSingle?.dir}
                                  onSort={(k) =>
                                    handleTableSort("req-single", k)
                                  }
                                >
                                  Аэропорт
                                </SortableTh>
                                <SortableTh
                                  sortKey="total"
                                  active={sortReqSingle?.key === "total"}
                                  dir={sortReqSingle?.dir}
                                  onSort={(k) =>
                                    handleTableSort("req-single", k)
                                  }
                                >
                                  Бюджет
                                </SortableTh>
                                <SortableTh
                                  sortKey="living"
                                  active={sortReqSingle?.key === "living"}
                                  dir={sortReqSingle?.dir}
                                  onSort={(k) =>
                                    handleTableSort("req-single", k)
                                  }
                                >
                                  Проживание
                                </SortableTh>
                                <SortableTh
                                  sortKey="meal"
                                  active={sortReqSingle?.key === "meal"}
                                  dir={sortReqSingle?.dir}
                                  onSort={(k) =>
                                    handleTableSort("req-single", k)
                                  }
                                >
                                  Питание
                                </SortableTh>
                                <SortableTh
                                  sortKey="transfer"
                                  active={
                                    sortReqSingle?.key === "transfer"
                                  }
                                  dir={sortReqSingle?.dir}
                                  onSort={(k) =>
                                    handleTableSort("req-single", k)
                                  }
                                >
                                  Трансфер
                                </SortableTh>
                              </tr>
                            </thead>
                            <tbody>
                              {mergedRequestsSingleSorted.length ? (
                                mergedRequestsSingleSorted.map((r, idx) => (
                                  <tr
                                    key={
                                      r.requestId ??
                                      r.requestNumber ??
                                      `p1-${idx}`
                                    }
                                  >
                                    <td>
                                      {r.requestNumber ??
                                        r.requestId ??
                                        "—"}
                                    </td>
                                    <td>{r.personName ?? "—"}</td>
                                    <td>{r.positionName ?? "—"}</td>
                                    <td>
                                      {r.airportCode ??
                                        r.airportName ??
                                        "—"}
                                    </td>
                                    <td>
                                      {formatRub(sumRequestServiceBudgets(r))}
                                    </td>
                                    <td>
                                      {formatRub(r.livingBudget)}
                                    </td>
                                    <td>{formatRub(r.mealBudget)}</td>
                                    <td>
                                      {formatRub(r.transferBudget)}
                                    </td>
                                  </tr>
                                ))
                              ) : (
                                <tr>
                                  <td colSpan={8}>Нет строк</td>
                                </tr>
                              )}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  ) : null}
                    </>
                  )}
                </>
              )}
            </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AirlineAnalytics;
