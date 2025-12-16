import React, { useCallback, useEffect, useRef, useState } from "react";
import classes from "./InfoTableDataTransferOrders.module.css";
import InfoTable from "../InfoTable/InfoTable";
import { convertToDate, server } from "../../../../graphQL_requests";
import { roles, statusLabels } from "../../../roles";
import Message from "../Message/Message";
import { useNavigate } from "react-router-dom";

function InfoTableDataTransferOrders({
  user,
  token,
  disAdmin,
  toggleRequestSidebar,
  scrollToId,
  requests,
  setChooseObject,
  chooseRequestID,
  setChooseRequestID,
  pageInfo,
}) {
  const navigate = useNavigate();

  const handleObject = useCallback(
    (id, arrival, departure, person, requestNumber) => {
      setChooseObject([
        {
          room: "",
          place: "",
          start: arrival.date,
          startTime: arrival.time,
          end: departure.date,
          endTime: departure.time,
          client: person?.name,
          public: false,
          clientId: person?.id,
          hotelId: "",
          requestId: id,
          requestNumber,
        },
      ]);
      setChooseRequestID(id);
      toggleRequestSidebar();
    },
    [setChooseObject, setChooseRequestID, toggleRequestSidebar]
  );

  const [separator, setSeparator] = useState("airline");
  const [isHaveTwoChats, setIsHaveTwoChats] = useState();
  const [orgName, setOrgName] = useState("");

  const listContainerRef = useRef(null);

  useEffect(() => {
    if (listContainerRef.current) {
      listContainerRef.current.scrollTo({
        top: 0,
        behavior: "instant",
      });
    }
  }, [pageInfo]);
  // console.log(disAdmin);

  return (
    <div className={classes.wrapper}>
      <InfoTable>
        <div
          className={classes.list}
          style={disAdmin ? { height: "calc(100vh - 281px)" } : {}}
          ref={listContainerRef}
        >
          {requests.map((item, index) => {
            const isActive = chooseRequestID === item.id;
            const unreadForUser = (item?.chat || []).filter((chat) => {
              if (chat.unreadMessagesCount <= 0) return false;
              if (user.hotelId && chat.hotelId === user.hotelId) return true;
              if (user.airlineId && chat.airlineId === user.airlineId)
                return true;
              if (!user.hotelId && !user.airlineId) return true;
              return false;
            });
            const unreadCount = unreadForUser.reduce(
              (sum, chat) => sum + (chat.unreadMessagesCount || 0),
              0
            );
            return (
              <div
                key={item.id}
                className={[
                  classes.InfoTable_row,
                  isActive ? classes.InfoTable_row_active : "",
                ].join(" ")}
                //   style={{
                //     opacity:
                //       item.status !== "archiving" && item.status !== "canceled"
                //         ? 1
                //         : 0.5,
                //   }}
                onClick={() =>
                  // Переход на отдельную страницу с заявкой
                  navigate(`/orders/${item.id}`, {
                    state: { requestId: item.id }, // если хочешь передать ещё что-то
                  })
                }
                // data-id={item.id}
              >
                {/* {console.log(item)} */}
                {/* Колонка № + статус */}
                <div className={`${classes.col} ${classes.colNumber}`}>
                  <button
                    type="button"
                    className={classes.orderLink}
                    // onClick={(e) => {
                    //   e.stopPropagation();
                    //   handleObject(
                    //     item.id,
                    //     item.arrival,
                    //     item.departure,
                    //     item.person,
                    //     item.requestNumber
                    //   );
                    // }}
                  >
                    № {index + 1}
                  </button>
                  <div className={classes.statusRow}>
                    <span className={item?.status.toLowerCase()}></span>
                    <span className={classes.statusText}>
                      {statusLabels[item.status] || item.status}
                    </span>
                  </div>
                  {/* <div className={classes.createdAt}>
                      {convertToDate(item.createdAt)}{" "}
                      {convertToDate(item.createdAt, true)}
                    </div> */}
                </div>
                {/* Колонка пассажир / авиакомпания */}
                <div className={`${classes.col} ${classes.colClient}`}>
                  <div className={classes.clientTop}>
                    {item.persons.length > 0 ? (
                      <>
                        <span className={classes.clientName}>
                          {item.persons[0]?.name}{" "}
                          {item.persons.length > 1 &&
                            `+ ${item.persons.length - 1}`}
                          {/* <span className={classes.clientPosition}>
                            {item?.person?.position?.name}
                          </span> */}
                        </span>
                      </>
                    ) : (
                      <span className={classes.clientName}>
                        Предварительная бронь
                      </span>
                    )}
                  </div>
                  <div className={classes.clientBottom}>
                    <div className={classes.createdAt}>
                      {convertToDate(item.scheduledPickupAt)}{" "}
                      {convertToDate(item.scheduledPickupAt, true)}
                    </div>
                  </div>
                </div>
                {/* Колонка Подача */}
                <div className={`${classes.col} ${classes.colFrom}`}>
                  <div className={classes.colLabel}>Подача</div>
                  <div className={classes.routeItem}>
                    <span className={classes.routeIndex}>
                      <img src="/location.png" alt="" />
                    </span>
                    <span className={classes.routeText}>
                      {item.fromAddress || ""}
                    </span>
                  </div>
                </div>
                {/* Колонка Куда ехать */}
                <div className={`${classes.col} ${classes.colTo}`}>
                  <div className={classes.colLabel}>Куда ехать</div>
                  {/* если у тебя есть массив точек маршрута — подставь сюда;
                        пока делаем одну строку с аэропортом */}
                  <div className={classes.routeItem}>
                    <span className={classes.routeIndex}>1</span>
                    <span className={classes.routeText}>
                      {item.toAddress || ""}
                    </span>
                  </div>
                </div>
                {/* Колонка чат */}
                {/* <div className={`${classes.col} ${classes.colChat}`}>
                  <div
                    className={classes.chatButton}
                    onClick={() =>
                      handleObject(
                        item.id,
                        item.arrival,
                        item.departure,
                        item.person,
                        item.requestNumber
                      )
                    }
                  >
                    <img src="/chatReserve.png" alt="" />
                    {unreadCount > 0 && (
                      <div className={classes.chatBadge}>
                        {unreadCount > 99 ? "99+" : unreadCount}
                      </div>
                    )}
                  </div>
                </div> */}
              </div>
            );
          })}
        </div>
      </InfoTable>
      {/* <div className={classes.chatWrapper}>
        {user.role !== roles.superAdmin &&
        user.role !== roles.dispatcerAdmin ? null : (
          <div className={classes.separatorWrapper}>
            {isHaveTwoChats === false ? (
              <button
                onClick={() => setSeparator("airline")} // Установить separator как 'airline'
                className={separator === "airline" ? classes.active : null}
              >
                Сотрудник
              </button>
            ) : (
              <>
                <button
                  onClick={() => setSeparator("airline")} // Установить separator как 'airline'
                  className={separator === "airline" ? classes.active : null}
                >
                  Сотрудник
                </button>
                <button
                  onClick={() => setSeparator("hotel")} // Установить separator как 'hotel'
                  className={separator === "hotel" ? classes.active : null}
                >
                  Водитель
                </button>
              </>
            )}
          </div>
        )}
        <Message
          activeTab={"Комментарий"}
          setIsHaveTwoChats={setIsHaveTwoChats}
          setTitle={setOrgName}
          chooseRequestID={chooseRequestID}
          chooseReserveID={""}
          token={token}
          user={user}
          chatPadding={"0"}
          chatHeight={
            user.role !== roles.hotelAdmin && user.role !== roles.airlineAdmin
              ? "calc(100vh - 399px)"
              : "calc(100vh - 280px)"
          }
          separator={separator}
        />
      </div> */}
    </div>
  );
}

export default InfoTableDataTransferOrders;
