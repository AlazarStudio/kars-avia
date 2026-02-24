import React, { useState, useEffect, useMemo } from "react";
import classes from "./AirlineAnalytics.module.css";
import AnalyticsChart from "../../AnalyticsChart/AnalyticsChart";
import DateRangePickerCustom from "../../DateRangePickerCustom";
import {
  addDays,
  formatISO,
  startOfToday,
  format,
  eachDayOfInterval,
} from "date-fns";
import {
  GET_AIRLINES,
  GET_AIRLINES_RELAY,
  GET_ANALYTICS_AIRLINE_REQUESTS,
  getCookie,
  getMediaUrl,
} from "../../../../../../graphQL_requests";
import { useQuery } from "@apollo/client";
import MUITextField from "../../../../Blocks/MUITextField/MUITextField";
import { useDebounce } from "../../../../../hooks/useDebounce";
import MUILoader from "../../../../Blocks/MUILoader/MUILoader";

function fillMissingDates(data, startDate, endDate) {
  const allDates = eachDayOfInterval({ start: startDate, end: endDate });

  const map = new Map(data.map((item) => [item.date.slice(0, 10), item.count]));

  return allDates.map((date) => {
    const formatted = format(date, "yyyy-MM-dd");
    return {
      date: formatted,
      count: map.get(formatted) ?? 0,
    };
  });
}

function AirlineAnalytics({ user, height }) {
  const token = getCookie("token");

  const [dateRange, setDateRange] = useState({
    startDate: addDays(startOfToday(), -6),
    endDate: startOfToday(),
    key: "selection",
  });

  const [showPicker, setShowPicker] = useState(false);
  const [airlines, setAirlines] = useState([]);
  const [selectedAirline, setSelectedAirline] = useState();
  const [searchQuery, setSearchQuery] = useState();
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

  const airlineId = selectedAirline ? selectedAirline.id : airlines[0]?.id;

  const { data, refetch } = useQuery(GET_ANALYTICS_AIRLINE_REQUESTS, {
    context: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
    variables: {
      input: {
        filters: {
          airlineId: user?.airlineId ? user?.airlineId : airlineId,
        },
        startDate:
          formatISO(dateRange.startDate, { representation: "date" }) +
          "T00:00:00",
        endDate:
          formatISO(dateRange.endDate, { representation: "date" }) +
          "T23:59:59",
      },
    },
  });

  useEffect(() => {
    refetch({
      input: {
        filters: {
          airlineId: user?.airlineId ? user?.airlineId : airlineId,
        },
        startDate: formatISO(dateRange.startDate, { representation: "date" }),
        endDate: formatISO(dateRange.endDate, { representation: "date" }),
      },
    });
  }, [dateRange, user]);

  const rawCreatedRequests =
    data?.analyticsEntityRequests?.createdByPeriod?.map((item) => ({
      date: item.date,
      count: item.count_created,
    })) || [];

  const handleSearch = (e) => {
    setSearchQuery(e.target.value);
  };
  const createdRequests = fillMissingDates(
    rawCreatedRequests,
    dateRange.startDate,
    dateRange.endDate
  );

  const filteredAirlines = useMemo(() => {
    if (!searchQuery) return airlines;

    return airlines.filter((request) =>
      request?.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [airlines, searchQuery]);

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

            <button
              className={classes.periodButton}
              onClick={() => setShowPicker(true)}
            >
              Выбрать период
            </button>
            {showPicker && (
              <DateRangePickerCustom
                value={dateRange}
                onChange={(range) => {
                  setDateRange(range);
                  setShowPicker(false);
                }}
                onClose={() => setShowPicker(false)}
              />
            )}
          </div>

          <div className={classes.contentWrapper}>
            <div className={user?.airlineId ? classes.rowNoAdaptive : classes.row}>
              <AnalyticsChart
                type="bar"
                title="Количество созданных заявок"
                data={createdRequests}
                xKey="date"
                yKey="count"
              />

              <AnalyticsChart
                type="pie"
                title="Отмененные заявки"
                data={[
                  {
                    x: "Отработанные",
                    value:
                      data?.analyticsEntityRequests?.totalCreatedRequests || 0,
                  },
                  {
                    x: "Отмененые",
                    value:
                      data?.analyticsEntityRequests?.totalCancelledRequests ||
                      0,
                  },
                ]}
                xKey="x"
                dataKey="value"
              />

              {/* <AnalyticsChart
                  type="line"
                  title="Среднее время ожидания обработки заявки"
                  data={filteredAverageTime}
                  xKey="date"
                  yKey="hours"
                /> */}
            </div>

            <div className={classes.row}>
              <AnalyticsChart
                type="pie"
                title="Заявки по статусам"
                data={[
                  {
                    x: "Создано",
                    value:
                      data?.analyticsEntityRequests?.statusCounts?.created || 0,
                  },
                  {
                    x: "Продлено",
                    value:
                      data?.analyticsEntityRequests?.statusCounts?.extended ||
                      0,
                  },
                  {
                    x: "Забронировано",
                    value:
                      data?.analyticsEntityRequests?.statusCounts?.done || 0,
                  },
                  {
                    x: "Ранний заезд",
                    value:
                      data?.analyticsEntityRequests?.statusCounts?.earlyStart ||
                      0,
                  },
                  {
                    x: "Перенесено ",
                    value:
                      data?.analyticsEntityRequests?.statusCounts
                        ?.transferred || 0,
                  },
                  {
                    x: "Сокращено ",
                    value:
                      data?.analyticsEntityRequests?.statusCounts?.reduced || 0,
                  },
                  {
                    x: "Готово к архиву ",
                    value:
                      data?.analyticsEntityRequests?.statusCounts?.archiving ||
                      0,
                  },
                  {
                    x: "Архив",
                    value:
                      data?.analyticsEntityRequests?.statusCounts?.archived ||
                      0,
                  },
                ]}
                xKey="x"
                dataKey="value"
              />

              {/* <AnalyticsChart
                  type="bar"
                  title="Количество дублированных заявок"
                  data={[]}
                  xKey="date"
                  yKey="count"
                /> */}
            </div>
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
//   server,
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

// function AirlineAnalytics({ user, height, generateMockData, generatePieData }) {
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
//   // const createdRequests = fillMissingDates(
//   //   rawCreatedRequests,
//   //   dateRange.startDate,
//   //   dateRange.endDate
//   // );

//     const createdRequests = useMemo(() => 
//     generateMockData(dateRange.startDate, dateRange.endDate, 'createdRequests'),
//     [dateRange]
//   );

//     const statusRequestsData = useMemo(() => 
//     generatePieData([
//       "Создано",
//       "Продлено", 
//       "Забронировано",
//       "Ранний заезд",
//       "Перенесено",
//       "Сокращено",
//       "Готово к архиву",
//       "Архив"
//     ], [300, 1000]),
//     [dateRange]
//   );

//   // Генерация mock-данных для новых графиков
//   const requestsByCities = useMemo(() => 
//     generatePieData ? generatePieData(
//       ["Москва", "Санкт-Петербург", "Сочи", "Казань", "Екатеринбург", "Новосибирск"],
//       [200, 800]
//     ) : [],
//     [generatePieData, dateRange]
//   );

//   const requestsByType = useMemo(() => 
//     generatePieData ? generatePieData(
//       ["Трансфер", "Эстафета", "Сбойная ситуация"],
//       [300, 1000]
//     ) : [],
//     [generatePieData, dateRange]
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
//                     <img src={`${server}${airline.images[0]}`} alt="" />
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
//                   src={`${server}${
//                     selectedAirline
//                       ? selectedAirline?.images?.[0] || ""
//                       : airlines[0]?.images?.[0] || ""
//                   }`}
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
//                 title="Заявки по городам"
//                 data={requestsByCities}
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
//                 data={statusRequestsData}
//                 xKey="x"
//                 dataKey="value"
//               />

//               <AnalyticsChart
//                 type="pie"
//                 title="Заявки по типу"
//                 data={requestsByType}
//                 xKey="x"
//                 dataKey="value"
//               />
//             </div>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }

// export default AirlineAnalytics;
