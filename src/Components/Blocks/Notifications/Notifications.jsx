import { useEffect, useRef, useState } from "react";
import classes from "./Notifications.module.css";
import { useNavigate } from "react-router-dom";
import { roles } from "../../../roles";
import {
  convertToDate,
  NOTIFICATIONS_SUBSCRIPTION,
  QUERY_NOTIFICATIONS,
} from "../../../../graphQL_requests";
import { useQuery, useSubscription, NetworkStatus } from "@apollo/client";
import MUILoader from "../MUILoader/MUILoader";

const TAKE = 25; // размер страницы

function notificationDedupeKey(it) {
  return (
    it.id ??
    `${it.createdAt}-${it.description?.action}-${
      it.passengerRequestId ?? it.reserveId ?? it.requestId ?? ""
    }`
  );
}

function mergeNotificationsLists(prevList, nextList) {
  const seen = new Set();
  return [...prevList, ...nextList].filter((it) => {
    const key = notificationDedupeKey(it);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function Notifications({
  onRequestClick,
  user,
  token,
  isNotificationsFullyVisible,
}) {
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

  // Синхронизация с кэшем Apollo (первая страница, refetch, merge после fetchMore)
  useEffect(() => {
    const arr = data?.getAllNotifications?.notifications || [];
    setItems(arr);
    const tp = data?.getAllNotifications?.totalPages ?? null;
    setTotalPages(tp);

    if (typeof tp === "number") {
      setHasMore(currentPage + 1 < tp);
    } else {
      const tc = data?.getAllNotifications?.totalCount;
      if (typeof tc === "number") {
        setHasMore(arr.length < tc);
      } else {
        setHasMore(arr.length === TAKE);
      }
    }
    lastLenRef.current = arr.length;
  }, [data, currentPage]);

  // При раскрытии панели — обновить список с начала
  useEffect(() => {
    if (isNotificationsFullyVisible) {
      setCurrentPage(0);
      setHasMore(true);
      refetch({ pagination: { skip: 0, take: TAKE } });
    }
  }, [isNotificationsFullyVisible, refetch]);

  // Клиентская фильтрация
  const filtered = items.filter((n) => {
    if (separator === "All") return true;
    if (separator === "request")
      return !!n.requestId && !n.passengerRequestId;
    if (separator === "passengerRequest") return !!n.passengerRequestId;
    return true;
  });

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
          let lastChunkLen = TAKE;
          const { data: more } = await fetchMore({
            variables: { pagination: { skip: nextPage, take: TAKE } },
            updateQuery: (prev, { fetchMoreResult }) => {
              if (!fetchMoreResult?.getAllNotifications) return prev;
              const chunk =
                fetchMoreResult.getAllNotifications.notifications ?? [];
              lastChunkLen = chunk.length;
              const merged = mergeNotificationsLists(
                prev?.getAllNotifications?.notifications ?? [],
                chunk
              );
              return {
                ...(prev || {}),
                getAllNotifications: {
                  ...(prev?.getAllNotifications || {}),
                  ...fetchMoreResult.getAllNotifications,
                  notifications: merged,
                },
              };
            },
          });

          const tp =
            more?.getAllNotifications?.totalPages ?? totalPages ?? null;
          if (typeof tp === "number") {
            setHasMore(nextPage + 1 < tp);
          } else {
            setHasMore(lastChunkLen === TAKE);
          }

          setCurrentPage(nextPage);

          lastLenRef.current =
            (more?.getAllNotifications?.notifications?.length ?? 0) ||
            items.length + lastChunkLen;
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

  return (
    <div
      className={classes.notifyWrapper}
      ref={wrapperRef}
      // убедитесь, что этот контейнер реально скроллится:
      // style={{ overflow: "auto", maxHeight: 600 }}
    >
      {isInitialLoading && <MUILoader loadSize={"40px"} fullHeight={"50vh"} />}

      {!isInitialLoading && !error && (
        <div className={classes.notify}>
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
              onClick={() => setSeparator("passengerRequest")}
              className={
                separator === "passengerRequest" ? classes.active : null
              }
            >
              Пассажиры
            </button>
          </div>

          {filtered.map((notify, index) => {
            const isHotelAdmin = user?.role === roles.hotelAdmin;
            const isPassengerRequest = notify.passengerRequestId != null;
            const isReserve =
              notify.reserveId != null && !isPassengerRequest;
            const passengerRequestLink = `/representativeRequests/representativeRequestsPlacement/${notify.passengerRequestId}`;
            const reserveLink = `/reserve/reservePlacement/${notify.reserveId}`;

            return (
              <div
                className={classes.notifyMessageWrapper}
                key={notify.id ?? index}
              >
                <div className={classes.notifyMessageHeader}>
                  <div className={classes.notifyMessageTime}>
                    <p>{convertToDate(notify.createdAt)}</p>
                    <p>{convertToDate(notify.createdAt, true)}</p>
                  </div>
                  {isHotelAdmin && isPassengerRequest ? (
                    <p
                      className={classes.toRequest}
                      onClick={() => navigate(passengerRequestLink)}
                    >
                      Перейти к заявке
                    </p>
                  ) : isHotelAdmin && isReserve ? (
                    <p
                      className={classes.toRequest}
                      onClick={() => navigate(reserveLink)}
                    >
                      Перейти к заявке
                    </p>
                  ) : (
                    <p
                      className={classes.toRequest}
                      onClick={() =>
                        isPassengerRequest
                          ? navigate(passengerRequestLink)
                          : isReserve
                            ? navigate(reserveLink)
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
            );
          })}

          {/* якорь для подгрузки */}
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

          {!hasMore && filtered.length > 0 && (
            <div className={classes.endOfListNote}>Это все уведомления</div>
          )}
        </div>
      )}
    </div>
  );
}

export default Notifications;

// import { useEffect, useRef, useState } from "react";
// import classes from "./Notifications.module.css";
// import { useNavigate } from "react-router-dom";
// import { roles } from "../../../roles";
// import {
//   convertToDate,
//   NOTIFICATIONS_SUBSCRIPTION,
//   QUERY_NOTIFICATIONS,
// } from "../../../../graphQL_requests";
// import { useQuery, useSubscription } from "@apollo/client";
// import MUILoader from "../MUILoader/MUILoader";
// import ReactPaginate from "react-paginate";

// function Notifications({
//   onRequestClick,
//   user,
//   token,
//   isNotificationsFullyVisible,
// }) {
//   const navigate = useNavigate();

//   const [separator, setSeparator] = useState("All");

//   const [totalPages, setTotalPages] = useState(1);
//   const currentPageRelay = 0;

//   // Состояние для хранения информации о странице (для пагинации)
//   const [pageInfo, setPageInfo] = useState({
//     skip: currentPageRelay,
//     take: 25,
//   });

//   const { loading, error, data, refetch } = useQuery(QUERY_NOTIFICATIONS, {
//     context: {
//       headers: {
//         Authorization: `Bearer ${token}`,
//       },
//     },
//     variables: {
//       pagination: {
//         skip: pageInfo.skip,
//         take: pageInfo.take,
//       },
//     },
//   });

//   const { data: notifySubscriptionData } = useSubscription(
//     NOTIFICATIONS_SUBSCRIPTION,
//     {
//       context: {
//         headers: {
//           Authorization: `Bearer ${token}`,
//         },
//       },
//       onData: () => {
//         refetch();
//       },
//     }
//   );

//   useEffect(() => {
//     if (isNotificationsFullyVisible) refetch();
//   }, [isNotificationsFullyVisible]);

//   // console.log(notifySubscriptionData);

//   const [notifyData, setNotifyData] = useState([]);

//   useEffect(() => {
//     if (
//       data &&
//       data.getAllNotifications &&
//       data.getAllNotifications.notifications
//     ) {
//       setNotifyData(data.getAllNotifications.notifications);
//       setTotalPages(data.getAllNotifications.totalPages || 1);
//     }
//   }, [data]);

//   // console.log(totalPages);

//   const filteredNotifyData = notifyData.filter((notify) => {
//     if (separator === "All") return true; // Показываем все
//     if (separator === "request") return notify.reserveId === null; // Только обычные заявки
//     if (separator === "reserve") return notify.reserveId; // Только заявки в резерве
//     return false;
//   });

//   // console.log(filteredNotifyData);

//   const notifyRef = useRef(null);

//   // Обработчик смены страницы в ReactPaginate
//   const handlePageChange = (event) => {
//     notifyRef.current.scrollTo({
//       top: 0,
//       behavior: "instant",
//     });
//     const newPageIndex = event.selected; // нумерация с 0
//     // Вычисляем skip (например, newPageIndex * take)
//     setPageInfo((prev) => ({
//       ...prev,
//       skip: newPageIndex,
//     }));
//   };

//   return (
//     <div className={classes.notifyWrapper} ref={notifyRef}>
//       {loading && <MUILoader loadSize={"40px"} fullHeight={"50vh"} />}
//       {!loading && !error && (
//         <div className={classes.notify}>
//           <div className={classes.separatorWrapper}>
//             <button
//               onClick={() => setSeparator("All")}
//               className={separator === "All" ? classes.active : null}
//             >
//               Все
//             </button>
//             <button
//               onClick={() => setSeparator("request")}
//               className={separator === "request" ? classes.active : null}
//             >
//               Эскадрилья
//             </button>
//             <button
//               onClick={() => setSeparator("reserve")}
//               className={separator === "reserve" ? classes.active : null}
//             >
//               Пассажиры
//             </button>
//           </div>

//           {filteredNotifyData.map((notify, index) => {
//             const isHotelAdmin = user?.role === roles.hotelAdmin;
//             const isReserve = notify.reserveId !== null;
//             const requestLink = `/reserve/reservePlacement/${notify.reserveId}`;

//             return (
//               <div className={classes.notifyMessageWrapper} key={index}>
//                 <div className={classes.notifyMessageHeader}>
//                   {/* <p>{notify.description?.action}</p> */}
//                   <div className={classes.notifyMessageTime}>
//                     <p>{`${convertToDate(notify.createdAt)}`}</p>
//                     <p>{`${convertToDate(notify.createdAt, true)}`}</p>
//                   </div>
//                   {isHotelAdmin && isReserve && (
//                     <p
//                       className={classes.toRequest}
//                       onClick={() => navigate(requestLink)}
//                     >
//                       Перейти к заявке
//                       {/* {`Перейти к заявке №${
//                         notify.request?.requestNumber ||
//                         notify.reserve?.reserveNumber
//                       }`} */}
//                     </p>
//                   )}
//                   {!isHotelAdmin && (
//                     <p
//                       className={classes.toRequest}
//                       onClick={() =>
//                         isReserve
//                           ? navigate(requestLink)
//                           : onRequestClick(notify)
//                       }
//                     >
//                       Перейти к заявке
//                       {/* {`Перейти к заявке №${
//                         notify?.request?.requestNumber
//                           ? notify?.request?.requestNumber
//                           : notify?.reserve?.reserveNumber
//                       }`} */}
//                     </p>
//                   )}
//                 </div>
//                 <div className={classes.notifyMessageText}>
//                   {notify?.description?.action === "new_message" &&
//                   notify.chatId ? (
//                     <p className={classes.notifyDescription}>
//                       В чате новое сообщение
//                     </p>
//                   ) : (
//                     <p
//                       dangerouslySetInnerHTML={{
//                         __html: `${notify.description?.description || ""}`,
//                       }}
//                       className={classes.notifyDescription}
//                     ></p>
//                   )}
//                 </div>
//               </div>
//             );
//           })}
//         </div>
//       )}
//       {totalPages > 1 && (
//         <div className={classes.pagination}>
//           <ReactPaginate
//             previousLabel={"←"}
//             nextLabel={"→"}
//             breakLabel={"..."}
//             pageCount={totalPages}
//             pageRangeDisplayed={3}
//             marginPagesDisplayed={2}
//             onPageChange={handlePageChange}
//             // forcePage={currentPage} // Можно использовать, чтобы привязать номер страницы из state
//             containerClassName={classes.pagination} // Класс для контейнера с пагинацией
//             activeClassName={classes.activePaginationNumber} // Класс для активной страницы
//             pageLinkClassName={classes.paginationNumber}
//           />
//         </div>
//       )}
//     </div>
//   );
// }

// export default Notifications;
