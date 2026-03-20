import React, { useState, useEffect, useMemo } from "react";
import classes from "./AirlineAnalytics.module.css";
import AnalyticsChart from "../../AnalyticsChart/AnalyticsChart";
import DateRangePickerCustom from "../../DateRangePickerCustom";
import {
  addDays,
  formatISO,
  startOfToday,
  subDays,
  differenceInCalendarDays,
} from "date-fns";
import {
  GET_AIRLINES,
  GET_ANALYTICS_AIRLINE_SERVICE_COMPARISON,
  GET_CITY_REGIONS,
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
const CREW_OPTIONS = [
  { id: "ALL", label: "Все" },
  { id: "SQUADRON", label: "Эскадрилья" },
  { id: "TECHNICIAN", label: "Инженеры" },
  // { id: "POSITIONS", label: "Должности" },
];
const SERVICE_LABEL_MAP = {
  LIVING: "Проживание",
  MEAL: "Питание",
  TRANSFER: "Трансфер",
};

const formatInt = (value) => new Intl.NumberFormat("ru-RU").format(Number(value) || 0);
const formatRub = (value) =>
  `${new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 0 }).format(
    Number(value) || 0
  )} ₽`;
const formatPct = (value) =>
  value === null || value === undefined
    ? "—"
    : `${value > 0 ? "+" : ""}${Number(value).toFixed(1)}%`;

function AirlineAnalytics({ user, height }) {
  const token = getCookie("token");

  const [period2, setPeriod2] = useState({
    startDate: addDays(startOfToday(), -6),
    endDate: startOfToday(),
    key: "selection",
  });
  const [period1, setPeriod1] = useState(() => {
    const p2End = startOfToday();
    const p2Start = addDays(p2End, -6);
    const p1End = subDays(p2Start, 1);
    const p1Start = subDays(p1End, 6);
    return { startDate: p1Start, endDate: p1End, key: "selection" };
  });

  const [showPicker, setShowPicker] = useState(false);
  const [pickerTarget, setPickerTarget] = useState("period2");
  const [airlines, setAirlines] = useState([]);
  const [selectedAirline, setSelectedAirline] = useState();
  const [searchQuery, setSearchQuery] = useState();
  const [selectedServices, setSelectedServices] = useState(["LIVING"]);
  const [crewMode, setCrewMode] = useState("SQUADRON");
  const [positionsText, setPositionsText] = useState("");
  const [selectedRegions, setSelectedRegions] = useState([]);
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

  // useEffect(() => {
  //   if (airlinesData?.airlines?.airlines) {
  //     setAirlines(airlinesData.airlines.airlines || []);
  //   }
  // }, [airlinesData]);
  useEffect(() => {
    const conn = airlinesData?.airlines;
    const page = conn?.airlines ?? [];
    const count = conn?.totalCount ?? 0;

    if (page.length) {
      setAirlines(page);
      setTotal(count);
      setHasMore(page.length < count); // если пришло меньше total — показываем кнопку
    }
    if (user?.airlineId) {
      setSelectedAirline(page.find((i) => i.id === user?.airlineId));
    }
  }, [airlinesData, user]);

  // 4) догрузка следующих 15
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

    setAirlines(newList); // просто заменяем массив на «первые nextTake»
    setTotal(newTotal);
    setHasMore(newList.length < newTotal); // если всё забрали — кнопка исчезает
  };

  const airlineId = user?.airlineId || selectedAirline?.id || airlines[0]?.id;

  const { data: regionsData } = useQuery(GET_CITY_REGIONS, {
    context: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  });

  const comparisonInput = useMemo(() => {
    if (!airlineId) return null;

    const parsedPositions = positionsText
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);

    const input = {
      airlineId,
      period1: {
        startDate: formatISO(period1.startDate, { representation: "date" }),
        endDate: formatISO(period1.endDate, { representation: "date" }),
      },
      period2: {
        startDate: formatISO(period2.startDate, { representation: "date" }),
        endDate: formatISO(period2.endDate, { representation: "date" }),
      },
      services: selectedServices,
      crew: {
        mode: crewMode,
      },
    };

    if (crewMode === "POSITIONS" && parsedPositions.length) {
      input.crew.positionNames = parsedPositions;
    }

    if (selectedRegions.length) {
      input.regions = selectedRegions;
    }

    return input;
  }, [
    airlineId,
    crewMode,
    period1.endDate,
    period1.startDate,
    period2.endDate,
    period2.startDate,
    positionsText,
    selectedRegions,
    selectedServices,
  ]);

  const { data: comparisonData, loading: comparisonLoading } = useQuery(
    GET_ANALYTICS_AIRLINE_SERVICE_COMPARISON,
    {
      context: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
      variables: {
        input: comparisonInput,
      },
      skip: !comparisonInput,
    }
  );

  const handleSearch = (e) => {
    setSearchQuery(e.target.value);
  };

  const filteredAirlines = useMemo(() => {
    if (!searchQuery) return airlines;

    return airlines.filter((request) =>
      request?.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [airlines, searchQuery]);

  const rows = comparisonData?.analyticsAirlineServiceComparison || [];
  const allRegions = regionsData?.cityRegions || [];
  const period2Days = differenceInCalendarDays(period2.endDate, period2.startDate) + 1;
  const serviceOptions = useMemo(() => SERVICE_OPTIONS, []);
  const selectedServiceOptions = useMemo(
    () => serviceOptions.filter((item) => selectedServices.includes(item.id)),
    [selectedServices, serviceOptions]
  );
  const regionOptions = useMemo(
    () => allRegions.map((region) => ({ id: region, label: region })),
    [allRegions]
  );
  const selectedRegionOptions = useMemo(
    () => regionOptions.filter((item) => selectedRegions.includes(item.id)),
    [regionOptions, selectedRegions]
  );

  const budgetByServiceData = useMemo(() => {
    const map = new Map();
    rows.forEach((row) => {
      const current = map.get(row.service) || 0;
      map.set(row.service, current + (Number(row.period2?.budgetRub) || 0));
    });

    return Array.from(map.entries()).map(([service, value]) => ({
      x: SERVICE_LABEL_MAP[service] || service,
      value,
    }));
  }, [rows]);

  const peopleByRegionData = useMemo(() => {
    const map = new Map();
    rows.forEach((row) => {
      const current = map.get(row.region) || 0;
      map.set(row.region, current + (Number(row.period2?.peopleCount) || 0));
    });

    return Array.from(map.entries())
      .map(([x, count]) => ({ x, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);
  }, [rows]);

  const periodCompareData = useMemo(() => {
    let peopleP1 = 0;
    let peopleP2 = 0;
    let budgetP1 = 0;
    let budgetP2 = 0;

    rows.forEach((row) => {
      peopleP1 += Number(row.period1?.peopleCount) || 0;
      peopleP2 += Number(row.period2?.peopleCount) || 0;
      budgetP1 += Number(row.period1?.budgetRub) || 0;
      budgetP2 += Number(row.period2?.budgetRub) || 0;
    });

    return [
      { x: "P1 люди", value: peopleP1 },
      { x: "P2 люди", value: peopleP2 },
      { x: "P1 бюджет", value: budgetP1 },
      { x: "P2 бюджет", value: budgetP2 },
    ];
  }, [rows]);

  useEffect(() => {
    if (!selectedRegions.length && allRegions.length >= 2) {
      setSelectedRegions(allRegions.slice(0, 2));
    } else if (!selectedRegions.length && allRegions.length === 1) {
      setSelectedRegions([allRegions[0]]);
    }
  }, [allRegions, selectedRegions.length]);

  return (
    <div className={classes.container} style={height && { height }}>
      {user?.airlineId ? null : (
        <div className={classes.sidebarContainer}>
          <div className={classes.searchContainer}>
            {/* <input type="text" placeholder="Поиск" name="search" id="search" value={searchQuery} onChange={handleSearch}/> */}
            <MUITextField
              label={"Поиск"}
              value={searchQuery}
              onChange={handleSearch}
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
            {hasMore && (
              <button className={classes.periodButton} onClick={handleLoadMore}>
                {loadingMore ? <MUILoader loadSize={"16px"} /> : "Показать ещё"}
              </button>
            )}
          </div>
        </div>
      )}

      <div className={classes.content}>
        <div className={classes.graphs}>
          <div className={classes.header}>
            <div className={classes.headerTop}>
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

              <div className={classes.headerControls}>
                <div className={classes.filtersRow}>
                  <MultiSelectAutocomplete
                    dropdownWidth={220}
                    label="Услуги"
                    options={serviceOptions}
                    value={selectedServiceOptions}
                    isMultiple
                    limitTags={1}
                    onChange={(_, newValue) => {
                      const next = (newValue || []).map((item) => item.id);
                      if (!next.length) return;
                      setSelectedServices(next);
                    }}
                  />

                  <div className={classes.positionsWrap}>
                <MUIAutocomplete
                      dropdownWidth={220}
                      label="Состав"
                  options={CREW_OPTIONS.map((item) => item.label)}
                  value={
                    CREW_OPTIONS.find((item) => item.id === crewMode)?.label || "Эскадрилья"
                  }
                  onChange={(_, newValue) => {
                    const nextId =
                      CREW_OPTIONS.find((item) => item.label === newValue)?.id ||
                      "SQUADRON";
                    setCrewMode(nextId);
                  }}
                      hideLabelOnFocus={false}
                    />
                    {crewMode === "POSITIONS" ? (
                      <MUITextField
                        label={"Должности (через запятую)"}
                        value={positionsText}
                        onChange={(e) => setPositionsText(e.target.value)}
                        className={classes.mainSearch}
                      />
                    ) : null}
                  </div>

                  <MultiSelectAutocomplete
                    dropdownWidth={220}
                    label="Регионы"
                    options={regionOptions}
                    value={selectedRegionOptions}
                    isMultiple
                    limitTags={1}
                    showSelectAll
                    listboxHeight={240}
                    onChange={(_, newValue) => {
                      const next = (newValue || []).map((item) => item.id);
                      setSelectedRegions(next);
                    }}
                  />
                </div>

                <div className={classes.periodButtons}>
                <button
                  className={classes.periodButton}
                  onClick={() => {
                    setPickerTarget("period1");
                    setShowPicker(true);
                  }}
                >
                  Период 1
                </button>
                <button
                  className={classes.periodButton}
                  onClick={() => {
                    setPickerTarget("period2");
                    setShowPicker(true);
                  }}
                >
                  Период 2
                </button>
                </div>
              </div>
            </div>
            {showPicker && (
              <DateRangePickerCustom
                value={pickerTarget === "period1" ? period1 : period2}
                onChange={(range) => {
                  if (pickerTarget === "period1") {
                    setPeriod1(range);
                  } else {
                    setPeriod2(range);
                  }
                  setShowPicker(false);
                }}
                onClose={() => setShowPicker(false)}
              />
            )}
          </div>

          <div className={classes.contentWrapper}>
            <div className={classes.periodInfo}>
              <p>
                P1: {formatISO(period1.startDate, { representation: "date" })} -{" "}
                {formatISO(period1.endDate, { representation: "date" })}
              </p>
              <p>
                P2: {formatISO(period2.startDate, { representation: "date" })} -{" "}
                {formatISO(period2.endDate, { representation: "date" })} ({period2Days} дн.)
              </p>
          </div>

            {comparisonLoading ? (
              <div className={classes.loaderWrap}>
                <MUILoader />
              </div>
            ) : (
              <>
                <div className={user?.airlineId ? classes.rowNoAdaptive : classes.row}>
                  <AnalyticsChart
                    type="pie"
                    title="Бюджет P2 по услугам"
                    data={budgetByServiceData}
                    xKey="x"
                    dataKey="value"
                  />
                  <AnalyticsChart
                    type="bar"
                    title="Топ регионов по людям (P2)"
                    data={peopleByRegionData}
                    xKey="x"
                    yKey="count"
                  />
                </div>

                <div className={classes.row}>
                  <AnalyticsChart
                    type="pie"
                    title="Сравнение периодов (люди и бюджет)"
                    data={periodCompareData}
                    xKey="x"
                    dataKey="value"
                  />
                </div>

                <table className={classes.analyticsTable}>
                  <thead>
                    <tr>
                      <th>Регион</th>
                      <th>Услуга</th>
                      <th>Люди (P1 / P2 / %)</th>
                      <th>Бюджет (P1 / P2 / %)</th>
                      <th>Номерной фонд (P1 / P2 / %)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row, idx) => (
                      <tr key={`${row.region}-${row.service}-${idx}`}>
                        <td>{row.region}</td>
                        <td>{SERVICE_LABEL_MAP[row.service] || row.service}</td>
                        <td>
                          {formatInt(row.period1.peopleCount)} / {formatInt(row.period2.peopleCount)} /{" "}
                          {formatPct(row.diff.peopleDeltaPct)}
                        </td>
                        <td>
                          {formatRub(row.period1.budgetRub)} / {formatRub(row.period2.budgetRub)} /{" "}
                          {formatPct(row.diff.budgetDeltaPct)}
                        </td>
                        <td>
                          {row.service === "LIVING"
                            ? `${formatInt(row.period1.roomsUsed)} / ${formatInt(
                                row.period2.roomsUsed
                              )} / ${formatPct(row.diff.roomsDeltaPct)}`
                            : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default AirlineAnalytics;



// import React, { useState, useEffect, useMemo } from "react";
// import classes from "./AirlineAnalytics.module.css";
// import AnalyticsChart from "../../AnalyticsChart/AnalyticsChart";
// import DateRangePickerCustom from "../../DateRangePickerCustom";
// import {
//   addDays,
//   formatISO,
//   startOfToday,
//   format,
//   eachDayOfInterval,
// } from "date-fns";
// import {
//   GET_AIRLINES,
//   GET_AIRLINES_RELAY,
//   GET_ANALYTICS_AIRLINE_REQUESTS,
//   getCookie,
//   getMediaUrl,
// } from "../../../../../../graphQL_requests";
// import { useQuery } from "@apollo/client";
// import MUITextField from "../../../../Blocks/MUITextField/MUITextField";
// import { useDebounce } from "../../../../../hooks/useDebounce";
// import MUILoader from "../../../../Blocks/MUILoader/MUILoader";

// function fillMissingDates(data, startDate, endDate) {
//   const allDates = eachDayOfInterval({ start: startDate, end: endDate });

//   const map = new Map(data.map((item) => [item.date.slice(0, 10), item.count]));

//   return allDates.map((date) => {
//     const formatted = format(date, "yyyy-MM-dd");
//     return {
//       date: formatted,
//       count: map.get(formatted) ?? 0,
//     };
//   });
// }

// function AirlineAnalytics({ user, height }) {
//   const token = getCookie("token");

//   const [dateRange, setDateRange] = useState({
//     startDate: addDays(startOfToday(), -6),
//     endDate: startOfToday(),
//     key: "selection",
//   });

//   const [showPicker, setShowPicker] = useState(false);
//   const [airlines, setAirlines] = useState([]);
//   const [selectedAirline, setSelectedAirline] = useState();
//   const [searchQuery, setSearchQuery] = useState();
//   const debouncedSearch = useDebounce(searchQuery, 500);

//   const PAGE_SIZE = 15;
//   const [total, setTotal] = useState(0);
//   const [hasMore, setHasMore] = useState(false);
//   const [loadingMore, setLoadingMore] = useState(false);

//   const { data: airlinesData, refetch: itemsRefetch } = useQuery(GET_AIRLINES, {
//     context: {
//       headers: {
//         Authorization: `Bearer ${token}`,
//       },
//     },
//     variables: {
//       pagination: {
//         skip: 0,
//         take: PAGE_SIZE,
//         search: debouncedSearch,
//       },
//     },
//   });

//   // useEffect(() => {
//   //   if (airlinesData?.airlines?.airlines) {
//   //     setAirlines(airlinesData.airlines.airlines || []);
//   //   }
//   // }, [airlinesData]);
//   useEffect(() => {
//     const conn = airlinesData?.airlines;
//     const page = conn?.airlines ?? [];
//     const count = conn?.totalCount ?? 0;

//     if (page.length) {
//       setAirlines(page);
//       setTotal(count);
//       setHasMore(page.length < count); // если пришло меньше total — показываем кнопку
//     }
//     if (user?.airlineId) {
//       setSelectedAirline(page.find((i) => i.id === user?.airlineId));
//     }
//   }, [airlinesData, user]);

//   // 4) догрузка следующих 15
//   const handleLoadMore = async () => {
//     const nextTake = Math.min(
//       airlines.length + PAGE_SIZE,
//       total || Number.MAX_SAFE_INTEGER
//     );

//     setLoadingMore(true);
//     const res = await itemsRefetch({ pagination: { skip: 0, take: nextTake } });
//     setLoadingMore(false);

//     const conn = res?.data?.airlines;
//     const newList = conn?.airlines ?? [];
//     const newTotal = conn?.totalCount ?? total;

//     setAirlines(newList); // просто заменяем массив на «первые nextTake»
//     setTotal(newTotal);
//     setHasMore(newList.length < newTotal); // если всё забрали — кнопка исчезает
//   };

//   const airlineId = selectedAirline ? selectedAirline.id : airlines[0]?.id;

//   const { data, refetch } = useQuery(GET_ANALYTICS_AIRLINE_REQUESTS, {
//     context: {
//       headers: {
//         Authorization: `Bearer ${token}`,
//       },
//     },
//     variables: {
//       input: {
//         filters: {
//           airlineId: user?.airlineId ? user?.airlineId : airlineId,
//         },
//         startDate:
//           formatISO(dateRange.startDate, { representation: "date" }) +
//           "T00:00:00",
//         endDate:
//           formatISO(dateRange.endDate, { representation: "date" }) +
//           "T23:59:59",
//       },
//     },
//   });

//   useEffect(() => {
//     refetch({
//       input: {
//         filters: {
//           airlineId: user?.airlineId ? user?.airlineId : airlineId,
//         },
//         startDate: formatISO(dateRange.startDate, { representation: "date" }),
//         endDate: formatISO(dateRange.endDate, { representation: "date" }),
//       },
//     });
//   }, [dateRange, user]);

//   const rawCreatedRequests =
//     data?.analyticsEntityRequests?.createdByPeriod?.map((item) => ({
//       date: item.date,
//       count: item.count_created,
//     })) || [];

//   const handleSearch = (e) => {
//     setSearchQuery(e.target.value);
//   };
//   const createdRequests = fillMissingDates(
//     rawCreatedRequests,
//     dateRange.startDate,
//     dateRange.endDate
//   );

//   const filteredAirlines = useMemo(() => {
//     if (!searchQuery) return airlines;

//     return airlines.filter((request) =>
//       request?.name.toLowerCase().includes(searchQuery.toLowerCase())
//     );
//   }, [airlines, searchQuery]);

//   return (
//     <div className={classes.container} style={height && { height }}>
//       {user?.airlineId ? null : (
//         <div className={classes.sidebarContainer}>
//           <div className={classes.searchContainer}>
//             {/* <input type="text" placeholder="Поиск" name="search" id="search" value={searchQuery} onChange={handleSearch}/> */}
//             <MUITextField
//               label={"Поиск"}
//               value={searchQuery}
//               onChange={handleSearch}
//               className={classes.mainSearch}
//             />
//           </div>
//           <div className={classes.sidebar}>
//             <ul className={classes.list}>
//               {filteredAirlines.map((airline) => (
//                 <li
//                   key={airline.id}
//                   className={`${classes.listItem} ${
//                     selectedAirline && selectedAirline.id === airline.id
//                       ? classes.active
//                       : !selectedAirline && airline.id === airlines[0]?.id
//                       ? classes.active
//                       : ""
//                   }`}
//                   onClick={() =>
//                     setSelectedAirline({
//                       id: airline.id,
//                       name: airline.name,
//                       images: airline.images,
//                     })
//                   }
//                 >
//                   <div className={classes.circle}>
//                     <img src={getMediaUrl(airline.images[0])} alt="" />
//                   </div>
//                   <p>{airline.name}</p>
//                 </li>
//               ))}
//             </ul>
//             {hasMore && (
//               <button className={classes.periodButton} onClick={handleLoadMore}>
//                 {loadingMore ? <MUILoader loadSize={"16px"} /> : "Показать ещё"}
//               </button>
//             )}
//           </div>
//         </div>
//       )}

//       <div className={classes.content}>
//         <div className={classes.graphs}>
//           <div className={classes.header}>
//             <h2 className={classes.title}>
//               <div className={classes.circle}>
//                 <img
//                   src={getMediaUrl(
//                     selectedAirline
//                       ? selectedAirline?.images?.[0]
//                       : airlines[0]?.images?.[0]
//                   )}
//                   alt=""
//                 />
//               </div>
//               <p>
//                 {selectedAirline ? selectedAirline?.name : airlines[0]?.name}
//               </p>
//             </h2>

//             <button
//               className={classes.periodButton}
//               onClick={() => setShowPicker(true)}
//             >
//               Выбрать период
//             </button>
//             {showPicker && (
//               <DateRangePickerCustom
//                 value={dateRange}
//                 onChange={(range) => {
//                   setDateRange(range);
//                   setShowPicker(false);
//                 }}
//                 onClose={() => setShowPicker(false)}
//               />
//             )}
//           </div>

//           <div className={classes.contentWrapper}>
//             <div className={user?.airlineId ? classes.rowNoAdaptive : classes.row}>
//               <AnalyticsChart
//                 type="bar"
//                 title="Количество созданных заявок"
//                 data={createdRequests}
//                 xKey="date"
//                 yKey="count"
//               />

//               <AnalyticsChart
//                 type="pie"
//                 title="Отмененные заявки"
//                 data={[
//                   {
//                     x: "Отработанные",
//                     value:
//                       data?.analyticsEntityRequests?.totalCreatedRequests || 0,
//                   },
//                   {
//                     x: "Отмененые",
//                     value:
//                       data?.analyticsEntityRequests?.totalCancelledRequests ||
//                       0,
//                   },
//                 ]}
//                 xKey="x"
//                 dataKey="value"
//               />

//               {/* <AnalyticsChart
//                   type="line"
//                   title="Среднее время ожидания обработки заявки"
//                   data={filteredAverageTime}
//                   xKey="date"
//                   yKey="hours"
//                 /> */}
//             </div>

//             <div className={classes.row}>
//               <AnalyticsChart
//                 type="pie"
//                 title="Заявки по статусам"
//                 data={[
//                   {
//                     x: "Создано",
//                     value:
//                       data?.analyticsEntityRequests?.statusCounts?.created || 0,
//                   },
//                   {
//                     x: "Продлено",
//                     value:
//                       data?.analyticsEntityRequests?.statusCounts?.extended ||
//                       0,
//                   },
//                   {
//                     x: "Забронировано",
//                     value:
//                       data?.analyticsEntityRequests?.statusCounts?.done || 0,
//                   },
//                   {
//                     x: "Ранний заезд",
//                     value:
//                       data?.analyticsEntityRequests?.statusCounts?.earlyStart ||
//                       0,
//                   },
//                   {
//                     x: "Перенесено ",
//                     value:
//                       data?.analyticsEntityRequests?.statusCounts
//                         ?.transferred || 0,
//                   },
//                   {
//                     x: "Сокращено ",
//                     value:
//                       data?.analyticsEntityRequests?.statusCounts?.reduced || 0,
//                   },
//                   {
//                     x: "Готово к архиву ",
//                     value:
//                       data?.analyticsEntityRequests?.statusCounts?.archiving ||
//                       0,
//                   },
//                   {
//                     x: "Архив",
//                     value:
//                       data?.analyticsEntityRequests?.statusCounts?.archived ||
//                       0,
//                   },
//                 ]}
//                 xKey="x"
//                 dataKey="value"
//               />

//               {/* <AnalyticsChart
//                   type="bar"
//                   title="Количество дублированных заявок"
//                   data={[]}
//                   xKey="date"
//                   yKey="count"
//                 /> */}
//             </div>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }

// export default AirlineAnalytics;

