import React, { useState, useRef, useEffect, useCallback, useMemo } from "react";
import classes from "./Logs.module.css";
import Sidebar from "../Sidebar/Sidebar";
import { useQuery } from "@apollo/client";
import {
  convertToDate,
  GET_AIRLINE_LOGS,
  GET_HOTEL_LOGS,
  GET_RESERVE_LOGS,
  getCookie,
  getMediaUrl,
} from "../../../../graphQL_requests";
import ReactPaginate from "react-paginate";
import MUILoader from "../MUILoader/MUILoader";
import CloseIcon from "../../../shared/icons/CloseIcon";
import { roleLabels } from "../../../roles";

function Logs({ type, queryLog, queryID, show, onClose, id, name }) {
  const token = getCookie("token");

  const query = queryLog;
  const ID = queryID;

  const [totalPages, setTotalPages] = useState(1);
  const currentPageRelay = 0;

  // Состояние для хранения информации о странице (для пагинации)
  const [pageInfo, setPageInfo] = useState({
    skip: currentPageRelay,
    take: 50,
  });

  const {
    data: dataLogs,
    error,
    loading,
    refetch,
  } = useQuery(query, {
    context: {
      headers: {
        Authorization: `Bearer ${token}`,
        // 'Apollo-Require-Preflight': 'true'
      },
    },
    variables: {
      [ID]: id,
      pagination: {
        skip: pageInfo.skip,
        take: pageInfo.take,
      },
    },
  });

  // console.error(error);

  const [logsData, setLogsData] = useState(null);

  useEffect(() => {
    if (dataLogs) {
      setLogsData(
        type === "hotel"
          ? dataLogs.hotel.logs
          : type === "airline"
            ? dataLogs.airline.logs
            : dataLogs.reserve.logs
      );
      setTotalPages(
        type === "hotel"
          ? dataLogs.hotel.logs.totalPages
          : type === "airline"
            ? dataLogs.airline.logs.totalPages
            : dataLogs.reserve.logs.totalPages
      );
    }
    if (show) refetch();
  }, [dataLogs, show]);

  const logRef = useRef(null);

  // Обработчик смены страницы в ReactPaginate
  const handlePageClick = (event) => {
    logRef.current.scrollTo({
      top: 0,
      behavior: "instant",
    });
    const newPageIndex = event.selected; // нумерация с 0
    // Вычисляем skip (например, newPageIndex * take)
    setPageInfo((prev) => ({
      ...prev,
      skip: newPageIndex * 50,
    }));
  };

  // Группировка истории по датам (как в уведомлениях и ExistRequest)
  const dayKey = (s) => {
    const d = new Date(s);
    d.setHours(0, 0, 0, 0);
    return d.getTime();
  };
  const fmtDay = (ts) =>
    new Date(ts).toLocaleDateString("ru-RU", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  const groupedHistory = useMemo(() => {
    const list = logsData?.logs ?? [];
    const sorted = [...list].sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
    );
    const m = new Map();
    for (const log of sorted) {
      const k = dayKey(log.createdAt);
      if (!m.has(k)) m.set(k, []);
      m.get(k).push(log);
    }
    return Array.from(m.entries()).sort((a, b) => b[0] - a[0]);
  }, [logsData?.logs]);

  // useEffect(() => {
  //   console.log(pageInfo);
  // }, [pageInfo]);

  // console.log(totalPages);

  const sidebarRef = useRef();

  // Функция закрытия формы
  const closeButton = useCallback(() => {
    onClose();
  }, [onClose]);

  // Клик вне боковой панели закрывает её
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (sidebarRef.current && !sidebarRef.current.contains(event.target)) {
        closeButton();
      }
    };

    if (show) document.addEventListener("mousedown", handleClickOutside);
    else document.removeEventListener("mousedown", handleClickOutside);

    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [show, closeButton]);

  return (
    <>
      <Sidebar show={show} sidebarRef={sidebarRef}>
        <div className={classes.requestTitle}>
          <div className={classes.requestTitle_name}>{`История ${name}`}</div>
          <div className={classes.requestTitle_close} onClick={closeButton}>
            <CloseIcon />
          </div>
        </div>

        {loading && <MUILoader fullHeight={"92vh"} />}

        {logsData && (
          <div
            className={classes.requestData}
            style={{ paddingBottom: totalPages > 1 ? "40px" : "20px" }}
          >
            <div ref={logRef} className={classes.logs}>
              {groupedHistory.map(([dayTs, dayLogs]) => (
                <div
                  className={classes.historySection}
                  key={dayTs}
                >
                  <div className={classes.historyDate}>
                    {fmtDay(dayTs)}
                  </div>
                  {dayLogs.map((log, idx) => (
                    <div className={classes.logText} key={log.id ?? `${dayTs}-${idx}`}>
                      <span className={classes.historyLogTime}>
                        {convertToDate(log.createdAt, true)}
                      </span>
                      <div
                        className={classes.historyLog}
                        dangerouslySetInnerHTML={{
                          __html: log.description,
                        }}
                      />
                      <div
                        className={classes.logImg}
                        title={
                          log.user
                            ? [log.user.name, roleLabels[log.user.role] ?? roleLabels[log.user.role?.toUpperCase()] ?? log.user.role]
                                .filter(Boolean)
                                .join(", ") || undefined
                            : undefined
                        }
                      >
                        <img src={log.user?.images[0] ? getMediaUrl(log.user?.images[0]) : "/no-avatar.png"} alt="" />
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
            {totalPages > 1 && (
              <div className={classes.pagination}>
                <ReactPaginate
                  previousLabel={"←"}
                  nextLabel={"→"}
                  breakLabel={"..."}
                  pageCount={totalPages}
                  marginPagesDisplayed={1}
                  pageRangeDisplayed={2}
                  onPageChange={handlePageClick}
                  // forcePage={validCurrentPage}
                  containerClassName={classes.pagination}
                  activeClassName={classes.activePaginationNumber}
                  pageLinkClassName={classes.paginationNumber}
                />
              </div>
            )}
          </div>
        )}
      </Sidebar>
    </>
  );
}

export default Logs;


// import React, { useState, useRef, useEffect, useCallback } from "react";
// import classes from "./Logs.module.css";
// import Sidebar from "../Sidebar/Sidebar";
// import { useQuery } from "@apollo/client";
// import {
//   convertToDate,
//   GET_AIRLINE_LOGS,
//   GET_HOTEL_LOGS,
//   GET_RESERVE_LOGS,
//   getCookie,
// } from "../../../../graphQL_requests";
// import ReactPaginate from "react-paginate";
// import MUILoader from "../MUILoader/MUILoader";
// import CloseIcon from "../../../shared/icons/CloseIcon";

// function Logs({ type, queryLog, queryID, show, onClose, id, name }) {
//   const token = getCookie("token");

//   const query = queryLog;
//   const ID = queryID;

//   const [totalPages, setTotalPages] = useState(1);
//   const currentPageRelay = 0;

//   // Состояние для хранения информации о странице (для пагинации)
//   const [pageInfo, setPageInfo] = useState({
//     skip: currentPageRelay,
//     take: 50,
//   });

//   const {
//     data: dataLogs,
//     error,
//     loading,
//     refetch,
//   } = useQuery(query, {
//     context: {
//       headers: {
//         Authorization: `Bearer ${token}`,
//         // 'Apollo-Require-Preflight': 'true'
//       },
//     },
//     variables: {
//       [ID]: id,
//       pagination: {
//         skip: pageInfo.skip,
//         take: pageInfo.take,
//       },
//     },
//   });

//   // console.error(error);

//   const [logsData, setLogsData] = useState(null);

//   useEffect(() => {
//     if (dataLogs) {
//       setLogsData(
//         type === "hotel"
//           ? dataLogs.hotel.logs
//           : type === "airline"
//             ? dataLogs.airline.logs
//             : dataLogs.reserve.logs
//       );
//       setTotalPages(
//         type === "hotel"
//           ? dataLogs.hotel.logs.totalPages
//           : type === "airline"
//             ? dataLogs.airline.logs.totalPages
//             : dataLogs.reserve.logs.totalPages
//       );
//     }
//     if (show) refetch();
//   }, [dataLogs, show]);

//   const logRef = useRef(null);

//   // Обработчик смены страницы в ReactPaginate
//   const handlePageClick = (event) => {
//     logRef.current.scrollTo({
//       top: 0,
//       behavior: "instant",
//     });
//     const newPageIndex = event.selected; // нумерация с 0
//     // Вычисляем skip (например, newPageIndex * take)
//     setPageInfo((prev) => ({
//       ...prev,
//       skip: newPageIndex * 50,
//     }));
//   };

//   // useEffect(() => {
//   //   console.log(pageInfo);
//   // }, [pageInfo]);

//   // console.log(totalPages);

//   const sidebarRef = useRef();

//   // Функция закрытия формы
//   const closeButton = useCallback(() => {
//     onClose();
//   }, [onClose]);

//   // Клик вне боковой панели закрывает её
//   useEffect(() => {
//     const handleClickOutside = (event) => {
//       if (sidebarRef.current && !sidebarRef.current.contains(event.target)) {
//         closeButton();
//       }
//     };

//     if (show) document.addEventListener("mousedown", handleClickOutside);
//     else document.removeEventListener("mousedown", handleClickOutside);

//     return () => document.removeEventListener("mousedown", handleClickOutside);
//   }, [show, closeButton]);

//   return (
//     <>
//       <Sidebar show={show} sidebarRef={sidebarRef}>
//         <div className={classes.requestTitle}>
//           <div className={classes.requestTitle_name}>{`История ${name}`}</div>
//           <div className={classes.requestTitle_close} onClick={closeButton}>
//             <CloseIcon />
//           </div>
//         </div>

//         {loading && <MUILoader fullHeight={"92vh"} />}

//         {logsData && (
//           <div
//             className={classes.requestData}
//             style={{ paddingBottom: totalPages > 1 ? "40px" : "20px" }}
//           >
//             <div ref={logRef} className={classes.logs}>
//               {[...logsData.logs].map((log, index) => (
//                 <div className={classes.logs1} key={log.id}>
//                   <div className={classes.historyDate} key={index}>
//                     {new Date(log.createdAt).toLocaleDateString("ru-RU", {
//                       day: "numeric",
//                       month: "long",
//                       year: "numeric",
//                     })}
//                     {/* {convertToDate(log.createdAt)}{" "} */}
//                     {/* {convertToDate(log.createdAt, true)} */}
//                   </div>
//                   <div className={classes.historyLogWrapper}>
//                     {/* <span className={classes.historyLogTime}>
//                       {convertToDate(log.createdAt, true)}
//                     </span> */}
//                     <div
//                       className={classes.historyLog}
//                       dangerouslySetInnerHTML={{
//                         __html: `<span class='historyLogTime'>${convertToDate(
//                           log.createdAt,
//                           true
//                         )}</span> ${log.description}`,
//                       }}
//                     >
//                       {/* {log.description} */}
//                     </div>
//                   </div>
//                 </div>
//               ))}
//             </div>
//             {totalPages > 1 && (
//               <div className={classes.pagination}>
//                 <ReactPaginate
//                   previousLabel={"←"}
//                   nextLabel={"→"}
//                   breakLabel={"..."}
//                   pageCount={totalPages}
//                   marginPagesDisplayed={1}
//                   pageRangeDisplayed={2}
//                   onPageChange={handlePageClick}
//                   // forcePage={validCurrentPage}
//                   containerClassName={classes.pagination}
//                   activeClassName={classes.activePaginationNumber}
//                   pageLinkClassName={classes.paginationNumber}
//                 />
//               </div>
//             )}
//           </div>
//         )}
//       </Sidebar>
//     </>
//   );
// }

// export default Logs;

