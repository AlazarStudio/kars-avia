import { useState, useEffect, useMemo, useCallback } from "react";
import classes from "./AirlineAnalytics.module.css";
import AnalyticsChart from "../../AnalyticsChart/AnalyticsChart";
import DateRangePickerCustom from "../../DateRangePickerCustom";
import {
  addDays,
  differenceInCalendarDays,
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
import MUIAutocomplete from "../../../../Blocks/MUIAutocomplete/MUIAutocomplete";
import MultiSelectAutocomplete from "../../../../Blocks/MultiSelectAutocomplete/MultiSelectAutocomplete";
import { useDebounce } from "../../../../../hooks/useDebounce";
import MUILoader from "../../../../Blocks/MUILoader/MUILoader";

const SERVICE_OPTIONS = [
  { id: "LIVING", label: "Проживание" },
  { id: "MEAL", label: "Питание" },
  { id: "TRANSFER", label: "Трансфер" },
];

const GROUP_BY_OPTIONS = [
  { id: "NONE", label: "Без сравнения" },
  { id: "AIRPORT", label: "По аэропортам" },
  { id: "POSITION", label: "По должностям" },
  { id: "PERIOD", label: "По периодам" },
];

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

function defaultCompareRange(mainRange) {
  const p2Start = mainRange.startDate;
  const p1End = subDays(p2Start, 1);
  const p1Start = subDays(p1End, 6);
  return { startDate: p1Start, endDate: p1End, key: "selection" };
}

function AirlineAnalytics({ user, height }) {
  const token = getCookie("token");

  const [mainRange, setMainRange] = useState({
    startDate: addDays(startOfToday(), -6),
    endDate: startOfToday(),
    key: "selection",
  });
  const [comparePeriodRanges, setComparePeriodRanges] = useState([]);

  const [showPicker, setShowPicker] = useState(false);
  const [pickerMode, setPickerMode] = useState("main");

  const [airlines, setAirlines] = useState([]);
  const [selectedAirline, setSelectedAirline] = useState();
  const [searchQuery, setSearchQuery] = useState();
  const [selectedServices, setSelectedServices] = useState([]);
  const [selectedAirportIds, setSelectedAirportIds] = useState([]);
  const [selectedPositionIds, setSelectedPositionIds] = useState([]);
  const [groupBy, setGroupBy] = useState("NONE");
  const [barMetric, setBarMetric] = useState("totalSpend");

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

  const airportOptions = useMemo(
    () =>
      (airportsData?.airports ?? []).map((a) => ({
        id: a.id,
        label: [a.code, a.name, a.city].filter(Boolean).join(" · "),
      })),
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

  const selectedAirportOpts = useMemo(
    () => airportOptions.filter((o) => selectedAirportIds.includes(o.id)),
    [airportOptions, selectedAirportIds]
  );

  const selectedPositionOpts = useMemo(
    () => positionOptions.filter((o) => selectedPositionIds.includes(o.id)),
    [positionOptions, selectedPositionIds]
  );

  const serviceOptions = useMemo(() => SERVICE_OPTIONS, []);
  const selectedServiceOptions = useMemo(
    () => serviceOptions.filter((item) => selectedServices.includes(item.id)),
    [selectedServices, serviceOptions]
  );

  const analyticsInput = useMemo(() => {
    if (!airlineId) return null;
    if (groupBy === "PERIOD" && comparePeriodRanges.length === 0) return null;

    const input = {
      airlineId,
      dateFrom: formatISO(mainRange.startDate, { representation: "date" }),
      dateTo: formatISO(mainRange.endDate, { representation: "date" }),
    };

    if (selectedServices.length) input.services = selectedServices;
    if (selectedAirportIds.length) input.airportIds = selectedAirportIds;
    if (selectedPositionIds.length) input.positionIds = selectedPositionIds;
    if (groupBy && groupBy !== "NONE") input.groupBy = groupBy;
    if (groupBy === "PERIOD" && comparePeriodRanges.length) {
      input.comparePeriods = comparePeriodRanges.map((r) => ({
        startDate: formatISO(r.startDate, { representation: "date" }),
        endDate: formatISO(r.endDate, { representation: "date" }),
      }));
    }

    return input;
  }, [
    airlineId,
    mainRange.endDate,
    mainRange.startDate,
    groupBy,
    comparePeriodRanges,
    selectedServices,
    selectedAirportIds,
    selectedPositionIds,
  ]);

  const { data: analyticsData, loading: analyticsLoading } = useQuery(
    GET_AIRLINE_ANALYTICS,
    {
      context: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
      variables: { input: analyticsInput },
      skip: !analyticsInput,
    }
  );

  const result = analyticsData?.airlineAnalytics;
  const summary = result?.summary;
  const positionsBreakdown = result?.positionsBreakdown;
  const airportsBreakdown = result?.airportsBreakdown;
  const segments = result?.segments ?? [];

  const pieData = useMemo(
    () =>
      (positionsBreakdown ?? []).map((item) => ({
        x: item.positionName,
        value: item.count,
      })),
    [positionsBreakdown]
  );

  const barChartData = useMemo(() => {
    return (airportsBreakdown ?? []).map((row) => ({
      name:
        row.airportName ||
        row.airportCode ||
        row.airportId ||
        "—",
      value: Number(row[barMetric]) || 0,
    }));
  }, [airportsBreakdown, barMetric]);

  const barMetricLabel = useMemo(
    () => BAR_METRIC_OPTIONS.find((o) => o.id === barMetric)?.label || barMetric,
    [barMetric]
  );

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

  const filteredAirlines = useMemo(() => {
    if (!searchQuery) return airlines;
    return airlines.filter((request) =>
      request?.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [airlines, searchQuery]);

  const openMainPicker = useCallback(() => {
    setPickerMode("main");
    setShowPicker(true);
  }, []);

  const openComparePicker = useCallback((index) => {
    setPickerMode(index);
    setShowPicker(true);
  }, []);

  const openAddComparePicker = useCallback(() => {
    setPickerMode("add");
    setShowPicker(true);
  }, []);

  const pickerValue = useMemo(() => {
    if (pickerMode === "main") return mainRange;
    if (pickerMode === "add") {
      return (
        comparePeriodRanges[comparePeriodRanges.length - 1] ||
        defaultCompareRange(mainRange)
      );
    }
    if (typeof pickerMode === "number" && comparePeriodRanges[pickerMode]) {
      return comparePeriodRanges[pickerMode];
    }
    return mainRange;
  }, [pickerMode, mainRange, comparePeriodRanges]);

  const applyPickerRange = useCallback(
    (range) => {
      if (pickerMode === "main") {
        setMainRange(range);
      } else if (pickerMode === "add") {
        setComparePeriodRanges((prev) => [...prev, { ...range, key: "selection" }]);
      } else if (typeof pickerMode === "number") {
        setComparePeriodRanges((prev) => {
          const next = [...prev];
          next[pickerMode] = { ...range, key: "selection" };
          return next;
        });
      }
      setShowPicker(false);
    },
    [pickerMode]
  );

  const handleGroupByChange = useCallback((_, label) => {
    const nextId =
      GROUP_BY_OPTIONS.find((item) => item.label === label)?.id ?? "NONE";
    setGroupBy(nextId);
    if (nextId === "PERIOD") {
      setComparePeriodRanges((prev) =>
        prev.length ? prev : [defaultCompareRange(mainRange)]
      );
    }
  }, [mainRange]);

  const removeComparePeriod = useCallback((index) => {
    setComparePeriodRanges((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const periodHint =
    groupBy === "PERIOD" && comparePeriodRanges.length === 0
      ? "Добавьте хотя бы один период для сравнения с основным."
      : null;

  const mainDays =
    differenceInCalendarDays(mainRange.endDate, mainRange.startDate) + 1;

  return (
    <div className={classes.pageWrap} style={height ? { height } : undefined}>
      <div className={classes.filtersStrip}>
        <div className={classes.filtersRow}>
          <button
            type="button"
            className={classes.periodButton}
            onClick={openMainPicker}
          >
            Основной период
          </button>

          <MultiSelectAutocomplete
            dropdownWidth="220px"
            label="Услуги"
            flexWrap
            options={serviceOptions}
            value={selectedServiceOptions}
            isMultiple
            limitTags={1}
            onChange={(_, newValue) => {
              setSelectedServices((newValue || []).map((item) => item.id));
            }}
          />

          <MultiSelectAutocomplete
            dropdownWidth="260px"
            label="Аэропорты"
            flexWrap
            options={airportOptions}
            value={selectedAirportOpts}
            isMultiple
            limitTags={1}
            listboxHeight={280}
            onChange={(_, newValue) => {
              setSelectedAirportIds((newValue || []).map((item) => item.id));
            }}
          />

          <MultiSelectAutocomplete
            dropdownWidth="220px"
            label="Должности"
            flexWrap
            options={positionOptions}
            value={selectedPositionOpts}
            isMultiple
            limitTags={1}
            listboxHeight={240}
            onChange={(_, newValue) => {
              setSelectedPositionIds((newValue || []).map((item) => item.id));
            }}
          />

          <div className={classes.groupByWrap}>
            <MUIAutocomplete
              dropdownWidth="200px"
              label="Группировка"
              flexWrap
              options={GROUP_BY_OPTIONS.map((item) => item.label)}
              value={
                GROUP_BY_OPTIONS.find((item) => item.id === groupBy)?.label ||
                "Без сравнения"
              }
              onChange={handleGroupByChange}
              hideLabelOnFocus={false}
            />
          </div>
        </div>

        {groupBy === "PERIOD" ? (
          <div className={classes.comparePeriodsRow}>
            <span className={classes.compareLabel}>
              Сравниваемые периоды (основной — в датах выше):
            </span>
            {comparePeriodRanges.map((r, idx) => (
              <div key={idx} className={classes.compareChip}>
                <button
                  type="button"
                  className={classes.periodButton}
                  onClick={() => openComparePicker(idx)}
                >
                  {formatISO(r.startDate, { representation: "date" })} —{" "}
                  {formatISO(r.endDate, { representation: "date" })}
                </button>
                <button
                  type="button"
                  className={classes.removeCompareBtn}
                  onClick={() => removeComparePeriod(idx)}
                  aria-label="Удалить период"
                >
                  ×
                </button>
              </div>
            ))}
            <button
              type="button"
              className={classes.periodButton}
              onClick={openAddComparePicker}
            >
              + Период
            </button>
          </div>
        ) : null}

        {periodHint ? (
          <p className={classes.periodHint}>{periodHint}</p>
        ) : (
          <p className={classes.periodInfo}>
            Период:{" "}
            {formatISO(mainRange.startDate, { representation: "date" })} —{" "}
            {formatISO(mainRange.endDate, { representation: "date" })} (
            {mainDays} дн.)
          </p>
        )}
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
              {!analyticsInput ? (
                periodHint ? (
                  <p className={classes.periodHint}>{periodHint}</p>
                ) : !airlineId ? (
                  <p className={classes.periodHint}>Загрузка списка авиакомпаний…</p>
                ) : null
              ) : analyticsLoading ? (
                <div className={classes.loaderWrap}>
                  <MUILoader fullHeight="55vh" />
                </div>
              ) : (
                <>
                  <div className={classes.kpiGrid}>
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
                  </div>

                  <div
                    className={
                      user?.airlineId ? classes.rowNoAdaptive : classes.row
                    }
                  >
                    <AnalyticsChart
                      type="pie"
                      title="Заявки по должностям"
                      data={pieData}
                      xKey="x"
                      dataKey="value"
                    />
                    <div className={classes.barBlock}>
                      <div className={classes.barHeader}>
                        <h4 className={classes.barTitle}>Аэропорты</h4>
                        <div className={classes.wrapper}>
                          <select
                            className={classes.select}
                            value={barMetric}
                            onChange={(e) => setBarMetric(e.target.value)}
                          >
                            {BAR_METRIC_OPTIONS.map((o) => (
                              <option key={o.id} value={o.id}>
                                {o.label}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                      <AnalyticsChart
                        type="simpleBar"
                        data={barChartData}
                        xKey="name"
                        yKey="value"
                        barValueLabel={barMetricLabel}
                        height={320}
                      />
                    </div>
                  </div>

                  {segments.length > 0 ? (
                    <div className={classes.segmentsSection}>
                      <h4 className={classes.segmentsTitle}>Сравнение сегментов</h4>
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
