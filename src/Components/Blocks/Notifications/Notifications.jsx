import { useEffect, useRef, useState } from "react";
import classes from "./Notifications.module.css";
import { useNavigate } from "react-router-dom";
import { roles } from "../../../roles";
import {
  convertToDate,
  NOTIFICATIONS_SUBSCRIPTION,
  QUERY_NOTIFICATIONS,
} from "../../../../graphQL_requests";
import { useQuery, useSubscription } from "@apollo/client";
import MUILoader from "../MUILoader/MUILoader";
import ReactPaginate from "react-paginate";

function Notifications({
  onRequestClick,
  user,
  token,
  isNotificationsFullyVisible,
}) {
  const navigate = useNavigate();

  const [separator, setSeparator] = useState("All");

  // const notifyData = [
  //   {
  //     notifyTitle: "Название оповещения",
  //     notifyText:
  //       "Какое-то действие совершенное кем-то, касающееся какой-то заявки.",
  //     notifyTime: "13:36",
  //     requestId: "679b6f61178473d1c88d2ebd",
  //     requestNumber: "0190-ABA-30.01.2025",
  //     client: "Петров П.П.",
  //     clientId: "67444ca096ee539bb5c14666",
  //     chooseCityRequest: "Абакан",
  //     reserve: false,
  //   },
  //   {
  //     notifyTitle: "Название оповещения",
  //     notifyText:
  //       "Какое-то действие совершенное кем-то, касающееся какой-то заявки В РЕЗЕРВЕ.",
  //     notifyTime: "13:36",
  //     requestId: "679b51ab178473d1c88d2ead",
  //     requestNumber: "0014-ABA-30.01.2025",
  //     reserve: true,
  //   },
  //   {
  //     notifyTitle: "Название оповещения",
  //     notifyText:
  //       "Какое-то действие совершенное кем-то, касающееся какой-то заявки.",
  //     notifyTime: "13:36",
  //     requestId: "679b6f61178473d1c88d2ebd",
  //     requestNumber: "0190-ABA-30.01.2025",
  //     client: "Петров П.П.",
  //     clientId: "67444ca096ee539bb5c14666",
  //     chooseCityRequest: "Абакан",
  //     reserve: false,
  //   },
  //   {
  //     notifyTitle: "Название оповещения",
  //     notifyText:
  //       "Какое-то действие совершенное кем-то, касающееся какой-то заявки.",
  //     notifyTime: "13:36",
  //     requestId: "679b6f61178473d1c88d2ebd",
  //     requestNumber: "0190-ABA-30.01.2025",
  //     client: "Петров П.П.",
  //     clientId: "67444ca096ee539bb5c14666",
  //     chooseCityRequest: "Абакан",
  //     reserve: false,
  //   },
  //   {
  //     notifyTitle: "Название оповещения",
  //     notifyText:
  //       "Какое-то действие совершенное кем-то, касающееся какой-то заявки.",
  //     notifyTime: "13:36",
  //     requestId: "679b6f61178473d1c88d2ebd",
  //     requestNumber: "0190-ABA-30.01.2025",
  //     client: "Петров П.П.",
  //     clientId: "67444ca096ee539bb5c14666",
  //     chooseCityRequest: "Абакан",
  //     reserve: false,
  //   },
  //   {
  //     notifyTitle: "Название оповещения",
  //     notifyText:
  //       "Какое-то действие совершенное кем-то, касающееся какой-то заявки.",
  //     notifyTime: "13:36",
  //     requestId: "679b6f61178473d1c88d2ebd",
  //     requestNumber: "0190-ABA-30.01.2025",
  //     client: "Петров П.П.",
  //     clientId: "67444ca096ee539bb5c14666",
  //     chooseCityRequest: "Абакан",
  //     reserve: false,
  //   },
  // ];

  // Запрос на получение списка заявок с использованием параметров пагинации

  const [totalPages, setTotalPages] = useState(1);
  const currentPageRelay = 0;

  // Состояние для хранения информации о странице (для пагинации)
  const [pageInfo, setPageInfo] = useState({
    skip: currentPageRelay,
    take: 25,
  });

  const { loading, error, data, refetch } = useQuery(QUERY_NOTIFICATIONS, {
    context: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
    variables: {
      pagination: {
        skip: pageInfo.skip,
        take: pageInfo.take,
      },
    },
  });

  const { data: notifySubscriptionData } = useSubscription(
    NOTIFICATIONS_SUBSCRIPTION,
    {
      context: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
      onData: () => {
        refetch();
      },
    }
  );

  useEffect(() => {
    if (isNotificationsFullyVisible) refetch();
  }, [isNotificationsFullyVisible]);

  // console.log(notifySubscriptionData);

  const [notifyData, setNotifyData] = useState([]);

  useEffect(() => {
    if (
      data &&
      data.getAllNotifications &&
      data.getAllNotifications.notifications
    ) {
      setNotifyData(data.getAllNotifications.notifications);
      setTotalPages(data.getAllNotifications.totalPages || 1);
    }
  }, [data]);

  // console.log(totalPages);

  const filteredNotifyData = notifyData.filter((notify) => {
    if (separator === "All") return true; // Показываем все
    if (separator === "request") return notify.reserveId === null; // Только обычные заявки
    if (separator === "reserve") return notify.reserveId; // Только заявки в резерве
    return false;
  });

  // console.log(filteredNotifyData);

  const notifyRef = useRef(null);

  // Обработчик смены страницы в ReactPaginate
  const handlePageChange = (event) => {
    notifyRef.current.scrollTo({
      top: 0,
      behavior: "instant",
    });
    const newPageIndex = event.selected; // нумерация с 0
    // Вычисляем skip (например, newPageIndex * take)
    setPageInfo((prev) => ({
      ...prev,
      skip: newPageIndex,
    }));
  };

  return (
    <div className={classes.notifyWrapper} ref={notifyRef}>
      {loading && <MUILoader loadSize={"40px"} fullHeight={"50vh"} />}
      {!loading && !error && (
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
              onClick={() => setSeparator("reserve")}
              className={separator === "reserve" ? classes.active : null}
            >
              Пассажиры
            </button>
          </div>

          {filteredNotifyData.map((notify, index) => {
            const isHotelAdmin = user?.role === roles.hotelAdmin;
            const isReserve = notify.reserveId !== null;
            const requestLink = `/reserve/reservePlacement/${notify.reserveId}`;

            return (
              <div className={classes.notifyMessageWrapper} key={index}>
                <div className={classes.notifyMessageHeader}>
                  {/* <p>{notify.description?.action}</p> */}
                  <div className={classes.notifyMessageTime}>
                    <p>{`${convertToDate(notify.createdAt)}`}</p>
                    <p>{`${convertToDate(notify.createdAt, true)}`}</p>
                  </div>
                  {isHotelAdmin && isReserve && (
                    <p
                      className={classes.toRequest}
                      onClick={() => navigate(requestLink)}
                    >
                      Перейти к заявке
                      {/* {`Перейти к заявке №${
                        notify.request?.requestNumber ||
                        notify.reserve?.reserveNumber
                      }`} */}
                    </p>
                  )}
                  {!isHotelAdmin && (
                    <p
                      className={classes.toRequest}
                      onClick={() =>
                        isReserve
                          ? navigate(requestLink)
                          : onRequestClick(notify)
                      }
                    >
                      Перейти к заявке
                      {/* {`Перейти к заявке №${
                        notify?.request?.requestNumber
                          ? notify?.request?.requestNumber
                          : notify?.reserve?.reserveNumber
                      }`} */}
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
                      dangerouslySetInnerHTML={{
                        __html: `${notify.description?.description || ""}`,
                      }}
                      className={classes.notifyDescription}
                    ></p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
      {totalPages > 1 && (
        <div className={classes.pagination}>
          <ReactPaginate
            previousLabel={"←"}
            nextLabel={"→"}
            breakLabel={"..."}
            pageCount={totalPages}
            pageRangeDisplayed={3}
            marginPagesDisplayed={2}
            onPageChange={handlePageChange}
            // forcePage={currentPage} // Можно использовать, чтобы привязать номер страницы из state
            containerClassName={classes.pagination} // Класс для контейнера с пагинацией
            activeClassName={classes.activePaginationNumber} // Класс для активной страницы
            pageLinkClassName={classes.paginationNumber}
          />
        </div>
      )}
    </div>
  );
}

export default Notifications;
