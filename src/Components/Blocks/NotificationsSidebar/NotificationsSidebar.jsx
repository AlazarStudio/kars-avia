import React, { useState, useRef, useEffect, useCallback } from "react";
import classes from "./NotificationsSidebar.module.css";
import Sidebar from "../Sidebar/Sidebar";
import {
  convertToDate,
  NOTIFICATIONS_SUBSCRIPTION,
  QUERY_NOTIFICATIONS,
} from "../../../../graphQL_requests";
import { useMutation, useQuery, useSubscription } from "@apollo/client";
import MUILoader from "../MUILoader/MUILoader";
import { useNavigate } from "react-router-dom";
import { NetworkStatus } from "@apollo/client";
import { roles } from "../../../roles";

const TAKE = 50; // размер страницы

function NotificationsSidebar({ onRequestClick, user, token, show, onClose }) {
  const sidebarRef = useRef();

  // const resetForm = useCallback(() => {
  //   setIsEdited(false); // Сбрасываем флаг изменений
  // }, []);

  // const closeButton = useCallback(() => {
  //   if (!isEdited) {
  //     resetForm();
  //     onClose();
  //     return;
  //   }

  //   if (window.confirm("Вы уверены? Все несохраненные данные будут удалены.")) {
  //     resetForm();
  //     onClose();
  //   }
  // }, [isEdited, resetForm, onClose]);

  const navigate = useNavigate();

  const [separator, setSeparator] = useState("All");
  const [items, setItems] = useState([]);
  const [currentPage, setCurrentPage] = useState(0); // номер текущей страницы (0-based)
  const [totalPages, setTotalPages] = useState(null); // если сервер отдаёт
  const [hasMore, setHasMore] = useState(true);
  const [loadingMoreLocal, setLoadingMoreLocal] = useState(false);

  const wrapperRef = useRef(null); // скролл-контейнер
  const sentinelRef = useRef(null); // «якорь» внизу
  const lastLenRef = useRef(0); // guard от зацикливания

  const { loading, error, data, refetch, fetchMore, networkStatus } = useQuery(
    QUERY_NOTIFICATIONS,
    {
      context: { headers: { Authorization: `Bearer ${token}` } },
      variables: { pagination: { skip: 0, take: TAKE } }, // страница 0
      notifyOnNetworkStatusChange: true,
    }
  );

  // Показ «большого» лоадера только до первой отрисовки данных
  const isInitialLoading =
    networkStatus === NetworkStatus.loading && items.length === 0;
  const isApolloFetchMore = networkStatus === NetworkStatus.fetchMore; // 3
  const isApolloRefetch = networkStatus === NetworkStatus.refetch; // 4

  // Сабскрипшн: мягко обновляем с головы
  useSubscription(NOTIFICATIONS_SUBSCRIPTION, {
    context: { headers: { Authorization: `Bearer ${token}` } },
    onData: () => {
      setCurrentPage(0);
      setHasMore(true);
      refetch({ pagination: { skip: 0, take: TAKE } });
    },
  });

  // Инициализация/рефетч — приводим локальное состояние к ответу
  useEffect(() => {
    const arr = data?.getAllNotifications?.notifications || [];
    setItems(arr);
    const tp = data?.getAllNotifications?.totalPages ?? null;
    setTotalPages(tp);

    // текущая страница = 0 при первом запросе/рефетче
    setCurrentPage(0);

    // вычисляем hasMore
    if (typeof tp === "number") {
      setHasMore(1 < tp); // следующая страница существует?
    } else {
      setHasMore(arr.length === TAKE); // fallback
    }
    lastLenRef.current = arr.length;
  }, [data]);

  // При раскрытии панели — обновить список с начала
  useEffect(() => {
    if (show) {
      setCurrentPage(0);
      setHasMore(true);
      refetch({ pagination: { skip: 0, take: TAKE } });
    }
  }, [show, refetch]);

  // Клиентская фильтрация
  const filtered = items.filter((n) => {
    if (separator === "All") return true;
    if (separator === "request") return n.reserveId === null;
    if (separator === "reserve") return !!n.reserveId;
    return true;
  });

  // helpers (выше компонента/внутри)
  const dayKey = (s) => {
    const d = new Date(s);
    d.setHours(0, 0, 0, 0); // локальная полуночь
    return d.getTime();
  };
  const fmtDay = (ts) =>
    new Date(ts).toLocaleDateString("ru-RU", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });

  // …внутри компонента:
  const sorted = React.useMemo(
    () =>
      [...filtered].sort(
        (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
      ),
    [filtered]
  );

  const grouped = React.useMemo(() => {
    const m = new Map();
    for (const n of sorted) {
      const k = dayKey(n.createdAt);
      if (!m.has(k)) m.set(k, []);
      m.get(k).push(n);
    }
    return Array.from(m.entries()).sort((a, b) => b[0] - a[0]); // дни ↓
  }, [sorted]);

  // Ленивый догрузчик (страничная пагинация: skip = pageIndex)
  useEffect(() => {
    const rootEl = wrapperRef.current;
    const targetEl = sentinelRef.current;
    if (!rootEl || !targetEl) return;

    const io = new IntersectionObserver(
      async ([entry]) => {
        if (!entry.isIntersecting) return;
        if (!hasMore) return;
        // if (isInitialLoading || isApolloFetchMore || isApolloRefetch) return;
        // if (loadingMoreLocal) return;

        // если длина не увеличивается — останавливаем (защита от дублей)
        // if (items.length === lastLenRef.current) return;

        // если знаем totalPages — не запрашиваем за пределами
        if (typeof totalPages === "number" && currentPage + 1 >= totalPages) {
          setHasMore(false);
          return;
        }

        try {
          setLoadingMoreLocal(true);
          const nextPage = currentPage + 1; // страница 1,2,3...
          const { data: more } = await fetchMore({
            variables: { pagination: { skip: nextPage, take: TAKE } },
          });

          const newItems = more?.getAllNotifications?.notifications || [];

          // склеиваем без дублей
          setItems((prev) => {
            const seen = new Set();
            const merged = [...prev, ...newItems].filter((it) => {
              const key =
                it.id ??
                `${it.createdAt}-${it.description?.action}-${
                  it.reserveId ?? it.requestId ?? ""
                }`;
              if (seen.has(key)) return false;
              seen.add(key);
              return true;
            });
            // если ничего не добавилось — дальше грузить бессмысленно
            // if (merged.length === prev.length) setHasMore(false);
            return merged;
          });

          // обновляем номер текущей страницы
          setCurrentPage(nextPage);

          // стоп по размеру страницы (если сервер totalPages не отдаёт)
          // if (newItems.length < TAKE) setHasMore(false);

          lastLenRef.current = items.length + newItems.length;
        } finally {
          setLoadingMoreLocal(false);
        }
      },
      {
        root: rootEl, // наблюдаем внутри прокручиваемого контейнера
        rootMargin: "200px", // предзагрузка заранее
        threshold: 0.1,
      }
    );

    io.observe(targetEl);
    return () => io.disconnect();
  }, [
    hasMore,
    isInitialLoading,
    isApolloFetchMore,
    isApolloRefetch,
    loadingMoreLocal,
    items.length,
    currentPage,
    totalPages,
    fetchMore,
  ]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (sidebarRef.current && !sidebarRef.current.contains(event.target)) {
        onClose();
      }
    };

    if (show) document.addEventListener("mousedown", handleClickOutside);
    else document.removeEventListener("mousedown", handleClickOutside);

    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [show, onClose]);

  return (
    <Sidebar show={show} sidebarRef={sidebarRef}>
      <div
        className={classes.notifyWrapper}
        // убедитесь, что этот контейнер реально скроллится:
        // style={{ overflow: "auto", maxHeight: 600 }}
      >
        {isInitialLoading && <MUILoader fullHeight={"100vh"} />}

        {!isInitialLoading && !error && (
          <>
            <div className={classes.separatorWrapper}>
              <button
                onClick={() => setSeparator("All")}
                className={separator === "All" ? classes.active : null}
              >
                Все
              </button>
              <button
                onClick={() => setSeparator("request")}
                className={separator === "request" ? classes.active : null}
              >
                Эскадрилья
              </button>
              <button
                onClick={() => setSeparator("reserve")}
                className={separator === "reserve" ? classes.active : null}
              >
                Пассажиры
              </button>
            </div>

            <div className={classes.notify} ref={wrapperRef}>
              {grouped.map(([dayTs, list]) => (
                <div className={classes.notifySection} key={dayTs}>
                  <p className={classes.notifyDate}>{fmtDay(dayTs)}</p>
                  {list.map((notify, index) => {
                    const isHotelAdmin = user?.role === roles.hotelAdmin;
                    const isReserve = notify.reserveId !== null;
                    const requestLink = `/reserve/reservePlacement/${notify.reserveId}`;
                    return (
                      <div
                        className={classes.notifyMessageWrapper}
                        key={notify.id ?? `${dayTs}-${index}`}
                      >
                        <div className={classes.notifyTextWrapper}>
                          <div className={classes.notifyMessageHeader}>
                            <div className={classes.notifyMessageTime}>
                              <p>{convertToDate(notify.createdAt, true)}</p>
                            </div>
                            {isHotelAdmin && isReserve ? (
                              <p
                                className={classes.toRequest}
                                onClick={() => navigate(requestLink)}
                              >
                                Перейти к заявке
                              </p>
                            ) : (
                              <p
                                className={classes.toRequest}
                                onClick={() =>
                                  isReserve
                                    ? navigate(requestLink)
                                    : onRequestClick(notify)
                                }
                              >
                                Перейти к заявке
                              </p>
                            )}
                          </div>
                          <div className={classes.notifyMessageText}>
                            {notify?.description?.action === "new_message" &&
                            notify.chatId ? (
                              <p className={classes.notifyDescription}>
                                В чате новое сообщение
                              </p>
                            ) : (
                              <p
                                className={classes.notifyDescription}
                                dangerouslySetInnerHTML={{
                                  __html: notify.description?.description || "",
                                }}
                              />
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))}

              <div
                ref={sentinelRef}
                aria-hidden="true"
                style={{ height: 1, width: "100%" }}
              />
              {(isApolloFetchMore || loadingMoreLocal) && (
                <div style={{ padding: "12px 0" }}>
                  <MUILoader loadSize={"28px"} fullHeight={"unset"} />
                </div>
              )}
              {!hasMore && grouped.length > 0 && (
                <div className={classes.endOfListNote}>Это все уведомления</div>
              )}
            </div>
          </>
        )}
      </div>
    </Sidebar>
  );
}

export default NotificationsSidebar;

// import React, { useState, useRef, useEffect, useCallback } from "react";
// import classes from "./NotificationsSidebar.module.css";
// import Sidebar from "../Sidebar/Sidebar";
// import {
//   convertToDate,
//   NOTIFICATIONS_SUBSCRIPTION,
//   QUERY_NOTIFICATIONS,
// } from "../../../../graphQL_requests";
// import { useMutation, useQuery, useSubscription } from "@apollo/client";
// import MUILoader from "../MUILoader/MUILoader";
// import { useNavigate } from "react-router-dom";
// import { NetworkStatus } from "@apollo/client";
// import { roles } from "../../../roles";

// const TAKE = 50; // размер страницы

// function NotificationsSidebar({ onRequestClick, user, token, show, onClose }) {
//   const sidebarRef = useRef();

//   // const resetForm = useCallback(() => {
//   //   setIsEdited(false); // Сбрасываем флаг изменений
//   // }, []);

//   // const closeButton = useCallback(() => {
//   //   if (!isEdited) {
//   //     resetForm();
//   //     onClose();
//   //     return;
//   //   }

//   //   if (window.confirm("Вы уверены? Все несохраненные данные будут удалены.")) {
//   //     resetForm();
//   //     onClose();
//   //   }
//   // }, [isEdited, resetForm, onClose]);

//   const navigate = useNavigate();

//   const [separator, setSeparator] = useState("All");
//   const [items, setItems] = useState([]);
//   const [currentPage, setCurrentPage] = useState(0); // номер текущей страницы (0-based)
//   const [totalPages, setTotalPages] = useState(null); // если сервер отдаёт
//   const [hasMore, setHasMore] = useState(true);
//   const [loadingMoreLocal, setLoadingMoreLocal] = useState(false);

//   const wrapperRef = useRef(null); // скролл-контейнер
//   const sentinelRef = useRef(null); // «якорь» внизу
//   const lastLenRef = useRef(0); // guard от зацикливания

//   const { loading, error, data, refetch, fetchMore, networkStatus } = useQuery(
//     QUERY_NOTIFICATIONS,
//     {
//       context: { headers: { Authorization: `Bearer ${token}` } },
//       variables: { pagination: { skip: 0, take: TAKE } }, // страница 0
//       notifyOnNetworkStatusChange: true,
//     }
//   );

//   // Показ «большого» лоадера только до первой отрисовки данных
//   const isInitialLoading =
//     networkStatus === NetworkStatus.loading && items.length === 0;
//   const isApolloFetchMore = networkStatus === NetworkStatus.fetchMore; // 3
//   const isApolloRefetch = networkStatus === NetworkStatus.refetch; // 4

//   // Сабскрипшн: мягко обновляем с головы
//   useSubscription(NOTIFICATIONS_SUBSCRIPTION, {
//     context: { headers: { Authorization: `Bearer ${token}` } },
//     onData: () => {
//       setCurrentPage(0);
//       setHasMore(true);
//       refetch({ pagination: { skip: 0, take: TAKE } });
//     },
//   });

//   // Инициализация/рефетч — приводим локальное состояние к ответу
//   useEffect(() => {
//     const arr = data?.getAllNotifications?.notifications || [];
//     setItems(arr);
//     const tp = data?.getAllNotifications?.totalPages ?? null;
//     setTotalPages(tp);

//     // текущая страница = 0 при первом запросе/рефетче
//     setCurrentPage(0);

//     // вычисляем hasMore
//     if (typeof tp === "number") {
//       setHasMore(1 < tp); // следующая страница существует?
//     } else {
//       setHasMore(arr.length === TAKE); // fallback
//     }
//     lastLenRef.current = arr.length;
//   }, [data]);

//   // При раскрытии панели — обновить список с начала
//   useEffect(() => {
//     if (show) {
//       setCurrentPage(0);
//       setHasMore(true);
//       refetch({ pagination: { skip: 0, take: TAKE } });
//     }
//   }, [show, refetch]);

//   // Клиентская фильтрация
//   const filtered = items.filter((n) => {
//     if (separator === "All") return true;
//     if (separator === "request") return n.reserveId === null;
//     if (separator === "reserve") return !!n.reserveId;
//     return true;
//   });

//   // Ленивый догрузчик (страничная пагинация: skip = pageIndex)
//   useEffect(() => {
//     const rootEl = wrapperRef.current;
//     const targetEl = sentinelRef.current;
//     if (!rootEl || !targetEl) return;

//     const io = new IntersectionObserver(
//       async ([entry]) => {
//         if (!entry.isIntersecting) return;
//         if (!hasMore) return;
//         // if (isInitialLoading || isApolloFetchMore || isApolloRefetch) return;
//         // if (loadingMoreLocal) return;

//         // если длина не увеличивается — останавливаем (защита от дублей)
//         // if (items.length === lastLenRef.current) return;

//         // если знаем totalPages — не запрашиваем за пределами
//         if (typeof totalPages === "number" && currentPage + 1 >= totalPages) {
//           setHasMore(false);
//           return;
//         }

//         try {
//           setLoadingMoreLocal(true);
//           const nextPage = currentPage + 1; // страница 1,2,3...
//           const { data: more } = await fetchMore({
//             variables: { pagination: { skip: nextPage, take: TAKE } },
//           });

//           const newItems = more?.getAllNotifications?.notifications || [];

//           // склеиваем без дублей
//           setItems((prev) => {
//             const seen = new Set();
//             const merged = [...prev, ...newItems].filter((it) => {
//               const key =
//                 it.id ??
//                 `${it.createdAt}-${it.description?.action}-${
//                   it.reserveId ?? it.requestId ?? ""
//                 }`;
//               if (seen.has(key)) return false;
//               seen.add(key);
//               return true;
//             });
//             // если ничего не добавилось — дальше грузить бессмысленно
//             // if (merged.length === prev.length) setHasMore(false);
//             return merged;
//           });

//           // обновляем номер текущей страницы
//           setCurrentPage(nextPage);

//           // стоп по размеру страницы (если сервер totalPages не отдаёт)
//           // if (newItems.length < TAKE) setHasMore(false);

//           lastLenRef.current = items.length + newItems.length;
//         } finally {
//           setLoadingMoreLocal(false);
//         }
//       },
//       {
//         root: rootEl, // наблюдаем внутри прокручиваемого контейнера
//         rootMargin: "200px", // предзагрузка заранее
//         threshold: 0.1,
//       }
//     );

//     io.observe(targetEl);
//     return () => io.disconnect();
//   }, [
//     hasMore,
//     isInitialLoading,
//     isApolloFetchMore,
//     isApolloRefetch,
//     loadingMoreLocal,
//     items.length,
//     currentPage,
//     totalPages,
//     fetchMore,
//   ]);

//   useEffect(() => {
//     const handleClickOutside = (event) => {
//       if (sidebarRef.current && !sidebarRef.current.contains(event.target)) {
//         onClose();
//       }
//     };

//     if (show) document.addEventListener("mousedown", handleClickOutside);
//     else document.removeEventListener("mousedown", handleClickOutside);

//     return () => document.removeEventListener("mousedown", handleClickOutside);
//   }, [show, onClose]);

//   return (
//     <Sidebar show={show} sidebarRef={sidebarRef}>
//       <div
//         className={classes.notifyWrapper}
//         // убедитесь, что этот контейнер реально скроллится:
//         // style={{ overflow: "auto", maxHeight: 600 }}
//       >
//         {isInitialLoading && <MUILoader fullHeight={"100vh"} />}

//         {!isInitialLoading && !error && (
//           <>
//             <div className={classes.separatorWrapper}>
//               <button
//                 onClick={() => setSeparator("All")}
//                 className={separator === "All" ? classes.active : null}
//               >
//                 Все
//               </button>
//               <button
//                 onClick={() => setSeparator("request")}
//                 className={separator === "request" ? classes.active : null}
//               >
//                 Эскадрилья
//               </button>
//               <button
//                 onClick={() => setSeparator("reserve")}
//                 className={separator === "reserve" ? classes.active : null}
//               >
//                 Пассажиры
//               </button>
//             </div>

//             <div className={classes.notify} ref={wrapperRef}>
//               {filtered.map((notify, index) => {
//                 const isHotelAdmin = user?.role === roles.hotelAdmin;
//                 const isReserve = notify.reserveId !== null;
//                 const requestLink = `/reserve/reservePlacement/${notify.reserveId}`;
//                 return (
//                   <div
//                     className={classes.notifyMessageWrapper}
//                     key={notify.id ?? index}
//                   >
//                     <p className={classes.notifyDate}>
//                       {/* {convertToDate(notify.createdAt)}{" "}
//                       {convertToDate(notify.createdAt, true)} */}
//                       {new Date(notify.createdAt).toLocaleDateString("ru-RU", {
//                         day: "numeric",
//                         month: "long",
//                         year: "numeric",
//                       })}
//                     </p>
//                     <div className={classes.notifyTextWrapper}>
//                       <div className={classes.notifyMessageHeader}>
//                         <div className={classes.notifyMessageTime}>
//                           <p>{convertToDate(notify.createdAt, true)}</p>
//                         </div>
//                         {isHotelAdmin && isReserve ? (
//                           <p
//                             className={classes.toRequest}
//                             onClick={() => navigate(requestLink)}
//                           >
//                             Перейти к заявке
//                           </p>
//                         ) : (
//                           <p
//                             className={classes.toRequest}
//                             onClick={() =>
//                               isReserve
//                                 ? navigate(requestLink)
//                                 : onRequestClick(notify)
//                             }
//                           >
//                             Перейти к заявке
//                           </p>
//                         )}
//                       </div>
//                       <div className={classes.notifyMessageText}>
//                         {notify?.description?.action === "new_message" &&
//                         notify.chatId ? (
//                           <p className={classes.notifyDescription}>
//                             В чате новое сообщение
//                           </p>
//                         ) : (
//                           <p
//                             className={classes.notifyDescription}
//                             dangerouslySetInnerHTML={{
//                               __html: notify.description?.description || "",
//                             }}
//                           />
//                         )}
//                       </div>
//                     </div>
//                   </div>
//                 );
//               })}
//               {/* якорь для подгрузки */}
//               <div
//                 ref={sentinelRef}
//                 aria-hidden="true"
//                 style={{ height: 1, width: "100%" }}
//               />

//               {(isApolloFetchMore || loadingMoreLocal) && (
//                 <div style={{ padding: "12px 0" }}>
//                   <MUILoader loadSize={"28px"} fullHeight={"unset"} />
//                 </div>
//               )}

//               {!hasMore && filtered.length > 0 && (
//                 <div className={classes.endOfListNote}>Это все уведомления</div>
//               )}
//             </div>
//           </>
//         )}
//       </div>
//     </Sidebar>
//   );
// }

// export default NotificationsSidebar;
