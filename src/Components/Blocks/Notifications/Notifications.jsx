import { useEffect, useState } from "react";
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

function Notifications({ onRequestClick, user, token }) {
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

  const [notifyData, setNotifyData] = useState([]);
  const [totalPages, setTotalPages] = useState(1);

  // Параметры для пагинации
  const itemsPerPage = 30; // Количество элементов на странице
  const [currentPage, setCurrentPage] = useState(0); // Номер текущей страницы (начинаем с 0)

  const { loading, error, data, refetch } = useQuery(QUERY_NOTIFICATIONS, {
    context: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
    variables: {
      pagination: {
        skip: 0,
        take: 1000000,
      },
    },
  });

  const { data: notifySubscriptionData } = useSubscription(
    NOTIFICATIONS_SUBSCRIPTION,
    {
      onData: () => {
        refetch();
      },
    }
  );

  // console.log(notifySubscriptionData);

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

  // Обработка переключения страниц
  const handlePageChange = (selectedItem) => {
    setCurrentPage(selectedItem.selected); // react-paginate возвращает объект {selected: число}
  };

  return (
    <div className={classes.notifyWrapper}>
      {loading && <MUILoader loadSize={"40px"} fullHeight={"50vh"} />}
      {!loading && !error && (
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

          {filteredNotifyData.map((notify, index) => {
            const isHotelAdmin = user?.role === roles.hotelAdmin;
            const isReserve = notify.reserveId !== null;
            const requestLink = `/reserve/reservePlacement/${notify.reserveId}`;

            return (
              <div className={classes.notifyMessageWrapper} key={index}>
                <div className={classes.notifyMessageHeader}>
                  {/* <p>{notify.description?.action}</p> */}
                  <p>{`${convertToDate(notify.createdAt)} ${convertToDate(
                    notify.createdAt,
                    true
                  )}`}</p>
                </div>
                <div className={classes.notifyMessageText}>
                  {notify.description === null && notify.chatId ? (
                    <p className={classes.notifyDescription}>В чате новое сообщение</p>
                  ) : (
                    <p
                      dangerouslySetInnerHTML={{
                        __html: `${notify.description?.description || ""}`,
                      }}
                      className={classes.notifyDescription}
                    ></p>
                  )}

                  {isHotelAdmin && isReserve && (
                    <p
                      className={classes.toRequest}
                      onClick={() => navigate(requestLink)}
                    >
                      {`Перейти к заявке №${
                        notify.request?.requestNumber ||
                        notify.reserve?.reserveNumber
                      }`}
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
                      {`Перейти к заявке №${
                        notify?.request?.requestNumber
                          ? notify?.request?.requestNumber
                          : notify?.reserve?.reserveNumber
                      }`}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
          {/* {totalPages > 0 && (
            <div className={classes.pagination}>
              <ReactPaginate
                previousLabel={"←"}
                nextLabel={"→"}
                breakLabel={"..."}
                onPageChange={handlePageChange}
                pageRangeDisplayed={3}
                pageCount={totalPages}
                // Если totalPages = 1 и вы хотите скрыть пагинацию, можно сделать проверку:
                // forcePage={currentPage} // Можно использовать, чтобы привязать номер страницы из state
                renderOnZeroPageCount={null}
                containerClassName={classes.pagination} // Класс для контейнера с пагинацией
                activeClassName={classes.activePaginationNumber} // Класс для активной страницы
                pageLinkClassName={classes.paginationNumber}
                // disabledClassName={classes.disabledPage} // Класс для неактивных кнопок (если нужны стили)
              />
            </div>
          )} */}
        </>
      )}
    </div>
  );
}

export default Notifications;
