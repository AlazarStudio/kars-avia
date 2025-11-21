import React, { useState, useEffect, useMemo } from "react";
import classes from "./DispatcherAnalytics.module.css";
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
  GET_ALL_DISPATCHERS,
  GET_ANALYTICS_AIRLINE_REQUESTS,
  GET_ANALYTICS_USERS,
  GET_DISPATCHERS,
  getCookie,
  server,
} from "../../../../../../graphQL_requests";
import { useQuery } from "@apollo/client";
import MUITextField from "../../../../Blocks/MUITextField/MUITextField";
import { getDispatcherAnalyticsMock } from "../../mockAirlineAnalytics";
import MUILoader from "../../../../Blocks/MUILoader/MUILoader";
import { useDebounce } from "../../../../../hooks/useDebounce";

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

function DispatcherAnalytics() {
  const token = getCookie("token");

  const [dateRange, setDateRange] = useState({
    startDate: addDays(startOfToday(), -6),
    endDate: startOfToday(),
    key: "selection",
  });

  const [showPicker, setShowPicker] = useState(false);
  const [airlines, setAirlines] = useState([]);
  const [selectedAirline, setSelectedAirline] = useState([]);
  const [searchQuery, setSearchQuery] = useState();
  const debouncedSearch = useDebounce(searchQuery, 500);

  const PAGE_SIZE = 15;
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  const { data: airlinesData, refetch: itemRefetch } = useQuery(
    GET_DISPATCHERS,
    {
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
    }
  );

  // useEffect(() => {
  //   if (airlinesData?.dispatcherUsers?.users) {
  //     setAirlines(airlinesData.dispatcherUsers.users || []);
  //   }
  // }, [airlinesData]);

  useEffect(() => {
    const conn = airlinesData?.dispatcherUsers;
    const page = conn?.users ?? [];
    const count = conn?.totalCount ?? 0;

    if (page.length) {
      setAirlines(page);
      setTotal(count);
      setHasMore(page.length < count); // если пришло меньше total — показываем кнопку
    }
  }, [airlinesData]);

  // 4) догрузка следующих 15
  const handleLoadMore = async () => {
    const nextTake = Math.min(
      airlines.length + PAGE_SIZE,
      total || Number.MAX_SAFE_INTEGER
    );

    setLoadingMore(true);
    const res = await itemRefetch({ pagination: { skip: 0, take: nextTake } });
    setLoadingMore(false);

    const conn = res?.data?.dispatcherUsers;
    const newList = conn?.users ?? [];
    const newTotal = conn?.totalCount ?? total;

    setAirlines(newList); // просто заменяем массив на «первые nextTake»
    setTotal(newTotal);
    setHasMore(newList.length < newTotal); // если всё забрали — кнопка исчезает
  };

  const airlineId = selectedAirline.id || airlines[0]?.id;

  const { data, refetch } = useQuery(GET_ANALYTICS_USERS, {
    context: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
    variables: {
      input: {
        filters: {
          personId: airlineId,
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
          personId: airlineId,
        },
        startDate: formatISO(dateRange.startDate, { representation: "date" }),
        endDate: formatISO(dateRange.endDate, { representation: "date" }),
      },
    });
  }, [dateRange]);

  // const [data, setData] = useState(null);
  // useEffect(() => {
  //   if (!airlineId) return;
  //   setData(
  //     getDispatcherAnalyticsMock({
  //       personId: airlineId,
  //       startDate: dateRange.startDate,
  //       endDate: dateRange.endDate,
  //     })
  //   );
  // }, [airlineId, dateRange]);

  // const rawCreatedRequests =
  //   data?.analyticsEntityUsers?.map((item) => ({
  //     date: item.date,
  //     count: item.count_created,
  //   })) || [];

  const handleSearch = (e) => {
    setSearchQuery(e.target.value);
  };
  // const createdRequests = fillMissingDates(
  //   rawCreatedRequests,
  //   dateRange.startDate,
  //   dateRange.endDate
  // );

  const filteredAirlines = useMemo(() => {
    if (!searchQuery) return airlines;

    return airlines.filter((request) =>
      request?.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [airlines, searchQuery]);

  return (
    <div className={classes.container}>
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
                    : selectedAirline.length === 0 &&
                      airline.id === airlines[0]?.id
                    ? classes.active
                    : ""
                }`}
                onClick={() =>
                  setSelectedAirline({ id: airline.id, name: airline.name })
                }
              >
                <div className={classes.circle}>
                  <img src={`${airline.images[0] ? `${server}${airline.images[0]}` : '/no-avatar.png'}`} alt="" />
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

      <div className={classes.content}>
        <div className={classes.graphs}>
          <div className={classes.header}>
            <h2 className={classes.title}>
              <div className={classes.circle}></div>
              <p>{selectedAirline.name || airlines[0]?.name}</p>
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
            <div className={classes.row}>
              {/* <AnalyticsChart
                type="bar"
                title="Количество созданных заявок"
                data={[]}
                xKey="date"
                yKey="count"
              /> */}

              <AnalyticsChart
                type="pie"
                title="Количество заявок (данные до 2 сентября могут быть неточные)"
                data={[
                  {
                    x: "Созданные",
                    value: data?.analyticsEntityUsers?.createdRequests || 0,
                  },
                  {
                    x: "Обработанные",
                    value: data?.analyticsEntityUsers?.processedRequests || 0,
                  },
                  {
                    x: "Отмененные",
                    value: data?.analyticsEntityUsers?.cancelledRequests || 0,
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
              {/* <AnalyticsChart
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

              <AnalyticsChart
                type="line"
                title="Среднее время обработки заявки (в часах)"
                data={[
                  { date: "2025-08-01", hours: 4 },
                  { date: "2025-08-02", hours: 12 },
                  { date: "2025-08-03", hours: 7 },
                  { date: "2025-08-04", hours: 29 },
                  { date: "2025-08-05", hours: 22 },
                  { date: "2025-08-08", hours: 14 },
                  { date: "2025-08-10", hours: 6 },
                  { date: "2025-08-11", hours: 11 },
                ]}
                xKey="date"
                yKey="hours"
              /> */}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DispatcherAnalytics;



// import React, { useState, useEffect, useMemo } from "react";
// import classes from "./DispatcherAnalytics.module.css";
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
//   GET_ALL_DISPATCHERS,
//   GET_ANALYTICS_AIRLINE_REQUESTS,
//   GET_ANALYTICS_USERS,
//   GET_DISPATCHERS,
//   getCookie,
//   server,
// } from "../../../../../../graphQL_requests";
// import { useQuery } from "@apollo/client";
// import MUITextField from "../../../../Blocks/MUITextField/MUITextField";
// import { getDispatcherAnalyticsMock } from "../../mockAirlineAnalytics";
// import MUILoader from "../../../../Blocks/MUILoader/MUILoader";
// import { useDebounce } from "../../../../../hooks/useDebounce";

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

// function DispatcherAnalytics({ generateMockData, generatePieData }) {
//   const token = getCookie("token");

//   const [dateRange, setDateRange] = useState({
//     startDate: addDays(startOfToday(), -6),
//     endDate: startOfToday(),
//     key: "selection",
//   });

//   const [showPicker, setShowPicker] = useState(false);
//   const [airlines, setAirlines] = useState([]);
//   const [selectedAirline, setSelectedAirline] = useState([]);
//   const [searchQuery, setSearchQuery] = useState();
//   const debouncedSearch = useDebounce(searchQuery, 500);

//   const PAGE_SIZE = 15;
//   const [total, setTotal] = useState(0);
//   const [hasMore, setHasMore] = useState(false);
//   const [loadingMore, setLoadingMore] = useState(false);

//   const { data: airlinesData, refetch: itemRefetch } = useQuery(
//     GET_DISPATCHERS,
//     {
//       context: {
//         headers: {
//           Authorization: `Bearer ${token}`,
//         },
//       },
//       variables: {
//         pagination: {
//           skip: 0,
//           take: PAGE_SIZE,
//           search: debouncedSearch,
//         },
//       },
//     }
//   );

//   // useEffect(() => {
//   //   if (airlinesData?.dispatcherUsers?.users) {
//   //     setAirlines(airlinesData.dispatcherUsers.users || []);
//   //   }
//   // }, [airlinesData]);

//   useEffect(() => {
//     const conn = airlinesData?.dispatcherUsers;
//     const page = conn?.users ?? [];
//     const count = conn?.totalCount ?? 0;

//     if (page.length) {
//       setAirlines(page);
//       setTotal(count);
//       setHasMore(page.length < count); // если пришло меньше total — показываем кнопку
//     }
//   }, [airlinesData]);

//   // 4) догрузка следующих 15
//   const handleLoadMore = async () => {
//     const nextTake = Math.min(
//       airlines.length + PAGE_SIZE,
//       total || Number.MAX_SAFE_INTEGER
//     );

//     setLoadingMore(true);
//     const res = await itemRefetch({ pagination: { skip: 0, take: nextTake } });
//     setLoadingMore(false);

//     const conn = res?.data?.dispatcherUsers;
//     const newList = conn?.users ?? [];
//     const newTotal = conn?.totalCount ?? total;

//     setAirlines(newList); // просто заменяем массив на «первые nextTake»
//     setTotal(newTotal);
//     setHasMore(newList.length < newTotal); // если всё забрали — кнопка исчезает
//   };

//   const airlineId = selectedAirline.id || airlines[0]?.id;

//   const { data, refetch } = useQuery(GET_ANALYTICS_USERS, {
//     context: {
//       headers: {
//         Authorization: `Bearer ${token}`,
//       },
//     },
//     variables: {
//       input: {
//         filters: {
//           personId: airlineId,
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
//           personId: airlineId,
//         },
//         startDate: formatISO(dateRange.startDate, { representation: "date" }),
//         endDate: formatISO(dateRange.endDate, { representation: "date" }),
//       },
//     });
//   }, [dateRange]);
//     const crmTimeData = useMemo(() => 
//       generateMockData(dateRange.startDate, dateRange.endDate, 'crmTime'),
//       [dateRange]
//     );
  
//     const activityTimeData = useMemo(() => 
//       generateMockData(dateRange.startDate, dateRange.endDate, 'activityTime'),
//       [dateRange]
//     );

//         const activityTimeData2 = useMemo(() => 
//       generateMockData(dateRange.startDate, dateRange.endDate, 'activityTime'),
//       [dateRange]
//     );

//   // const [data, setData] = useState(null);
//   // useEffect(() => {
//   //   if (!airlineId) return;
//   //   setData(
//   //     getDispatcherAnalyticsMock({
//   //       personId: airlineId,
//   //       startDate: dateRange.startDate,
//   //       endDate: dateRange.endDate,
//   //     })
//   //   );
//   // }, [airlineId, dateRange]);

//   // const rawCreatedRequests =
//   //   data?.analyticsEntityUsers?.map((item) => ({
//   //     date: item.date,
//   //     count: item.count_created,
//   //   })) || [];

//   const handleSearch = (e) => {
//     setSearchQuery(e.target.value);
//   };
//   // const createdRequests = fillMissingDates(
//   //   rawCreatedRequests,
//   //   dateRange.startDate,
//   //   dateRange.endDate
//   // );

//   const filteredAirlines = useMemo(() => {
//     if (!searchQuery) return airlines;

//     return airlines.filter((request) =>
//       request?.name.toLowerCase().includes(searchQuery.toLowerCase())
//     );
//   }, [airlines, searchQuery]);

//   return (
//     <div className={classes.container}>
//       <div className={classes.sidebarContainer}>
//         <div className={classes.searchContainer}>
//           {/* <input type="text" placeholder="Поиск" name="search" id="search" value={searchQuery} onChange={handleSearch}/> */}
//           <MUITextField
//             label={"Поиск"}
//             value={searchQuery}
//             onChange={handleSearch}
//             className={classes.mainSearch}
//           />
//         </div>
//         <div className={classes.sidebar}>
//           <ul className={classes.list}>
//             {filteredAirlines.map((airline) => (
//               <li
//                 key={airline.id}
//                 className={`${classes.listItem} ${
//                   selectedAirline && selectedAirline.id === airline.id
//                     ? classes.active
//                     : selectedAirline.length === 0 &&
//                       airline.id === airlines[0]?.id
//                     ? classes.active
//                     : ""
//                 }`}
//                 onClick={() =>
//                   setSelectedAirline({ id: airline.id, name: airline.name })
//                 }
//               >
//                 <div className={classes.circle}>
//                   <img
//                     src={`${
//                       airline.images[0]
//                         ? `${server}${airline.images[0]}`
//                         : "/no-avatar.png"
//                     }`}
//                     alt=""
//                   />
//                 </div>
//                 <p>{airline.name}</p>
//               </li>
//             ))}
//           </ul>
//           {hasMore && (
//             <button className={classes.periodButton} onClick={handleLoadMore}>
//               {loadingMore ? <MUILoader loadSize={"16px"} /> : "Показать ещё"}
//             </button>
//           )}
//         </div>
//       </div>

//       <div className={classes.content}>
//         <div className={classes.graphs}>
//           <div className={classes.header}>
//             <h2 className={classes.title}>
//               <div className={classes.circle}></div>
//               <p>{selectedAirline.name || airlines[0]?.name}</p>
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
//             <div className={classes.row}>
//               {/* <AnalyticsChart
//                 type="bar"
//                 title="Количество созданных заявок"
//                 data={[]}
//                 xKey="date"
//                 yKey="count"
//               /> */}

//               <AnalyticsChart
//                 type="pie"
//                 // title="Количество заявок"
//                 title="Количество заявок (данные до 2 сентября могут быть неточные)"
//                 data={[
//                   {
//                     x: "Созданные",
//                     value: Math.floor(Math.random() * 45 + 5) || 0,
//                     // value: data?.analyticsEntityUsers?.createdRequests || 0,
//                   },
//                   {
//                     x: "Обработанные",
//                     value: Math.floor(Math.random() * 45 + 5) || 0,
//                     // value: data?.analyticsEntityUsers?.processedRequests || 0,
//                   },
//                   {
//                     x: "Отмененные",
//                     value: Math.floor(Math.random() * 45 + 5) || 0,
//                     // value: data?.analyticsEntityUsers?.cancelledRequests || 0,
//                   },
//                 ]}
//                 xKey="x"
//                 dataKey="value"
//               />

//               <AnalyticsChart
//                   type="line"
//                   title="Среднее время обработки заявки"
//                   data={activityTimeData}
//                   xKey="date"
//                   yKey="hours"
//                 />
//             </div>

//             <div className={classes.row}>
//                             <AnalyticsChart
//                 type="bar"
//                 title="Количество проведенного времени в CRM (часы)"
//                 data={crmTimeData}
//                 xKey="date"
//                 yKey="hours"
//               />
//               <AnalyticsChart
//                 type="line"
//                 title="Время активности (часы)"
//                 data={activityTimeData2}
//                 xKey="date"
//                 yKey="hours"
//               />
//               {/* <AnalyticsChart
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

//               <AnalyticsChart
//                 type="line"
//                 title="Среднее время обработки заявки (в часах)"
//                 data={[
//                   { date: "2025-08-01", hours: 4 },
//                   { date: "2025-08-02", hours: 12 },
//                   { date: "2025-08-03", hours: 7 },
//                   { date: "2025-08-04", hours: 29 },
//                   { date: "2025-08-05", hours: 22 },
//                   { date: "2025-08-08", hours: 14 },
//                   { date: "2025-08-10", hours: 6 },
//                   { date: "2025-08-11", hours: 11 },
//                 ]}
//                 xKey="date"
//                 yKey="hours"
//               /> */}
//             </div>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }

// export default DispatcherAnalytics;

