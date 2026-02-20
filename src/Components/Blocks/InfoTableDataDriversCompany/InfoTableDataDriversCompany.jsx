import React, { useCallback, useEffect, useRef, useState } from "react";
import classes from "./InfoTableDataDriversCompany.module.css";
import InfoTable from "../InfoTable/InfoTable.jsx";

import { convertToDate, server } from "../../../../graphQL_requests.js";
import { roles } from "../../../roles.js";
import Message from "../Message/Message.jsx";
import CarIcon from "../../../shared/icons/CarIcon.jsx";
import Button from "../../Standart/Button/Button.jsx";
import DriverItem from "../DriverItem/DriverItem.jsx";

function InfoTableDataDriversCompany({
  user,
  token,
  toggleRequestSidebar,
  requests,
  setChooseObject,
  choosePersonId,
  setChooseRequestID,
  disAdmin,
  canAcceptDrivers = true,
}) {
  const handleObject = useCallback(
    (id, item) => {
      const isPending = disAdmin
        ? item?.registrationStatus === "PENDING"
        : !item?.organizationConfirmed;
      if (disAdmin && isPending && !canAcceptDrivers) return;
      setChooseObject({ ...item });
      toggleRequestSidebar();
    },
    [setChooseObject, toggleRequestSidebar, disAdmin, canAcceptDrivers]
  );

  const [separator, setSeparator] = useState("airline");
  const [isHaveTwoChats, setIsHaveTwoChats] = useState();
  const [orgName, setOrgName] = useState("");

  // табы сверху: подтверждены / ожидают
  const [activeTab, setActiveTab] = useState("confirmed");

  // Определяем источник: если disAdmin передан, значит это страница водителей
  // и используем registrationStatus, иначе - organizationConfirmed (страница организации)
  const useRegistrationStatus = !!disAdmin;

  const confirmedList = useRegistrationStatus
    ? (requests || []).filter(
        (i) => i.registrationStatus === "APPROVED"
      )
    : (requests || []).filter(
        (i) => i.organizationConfirmed && i.organizationConfirmed === true
      );

  const pendingList = useRegistrationStatus
    ? (requests || []).filter(
        (i) => i.registrationStatus === "PENDING"
      )
    : (requests || []).filter(
        (i) => !i.organizationConfirmed || i.organizationConfirmed === null
      );

  const listForRender = activeTab === "confirmed" ? confirmedList : pendingList;

  return (
    <div className={classes.wrapper}>
      <InfoTable>
        <div className={classes.tabs}>
          <button
            type="button"
            className={`${classes.tabButton} ${
              activeTab === "confirmed" ? classes.active : ""
            }`}
            onClick={() => setActiveTab("confirmed")}
          >
            Подтверждены
          </button>
          <button
            type="button"
            className={`${classes.tabButton} ${
              activeTab === "pending" ? classes.active : ""
            }`}
            onClick={() => setActiveTab("pending")}
          >
            Ожидают подтверждения
          </button>
        </div>
        <div
          className={classes.list}
          style={disAdmin ? { height: "calc(100vh - 427px)" } : {}}
        >
          {listForRender.map((item) => {
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
              <DriverItem
                key={item.id}
                {...item}
                handleObject={handleObject}
                unreadCount={unreadCount > 0 ? unreadCount : null}
              />
            );
          })}
        </div>
      </InfoTable>
      {/* {activeTab !== "pending" && (
        <div className={classes.chatWrapper}>
          {user.role !== roles.superAdmin &&
          user.role !== roles.dispatcerAdmin ? null : (
            <div className={classes.separatorWrapper}>
              <img src="/avatar1.png" alt="" />
              <span>Иван</span>
            </div>
          )}
          <Message
            activeTab={"Комментарий"}
            setIsHaveTwoChats={setIsHaveTwoChats}
            setTitle={setOrgName}
            choosePersonId={choosePersonId}
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
        </div>
      )} */}
    </div>
  );
}

export default InfoTableDataDriversCompany;

// <div
//   key={item.id}
//   className={classes.InfoTable_row}
//   onClick={() => handleObject(item.id, item)}
//   // data-id={item.id}
// >
//   {/* {console.log(item)} */}
//   <div className={`${classes.col} ${classes.colImage}`}>
//     {/* <button
//       type="button"
//       className={classes.orderLink}
//       onClick={(e) => {
//         e.stopPropagation();
//       }}
//     >
//       №{item.order}
//     </button> */}
//     <img src={`${server}${item?.images[0]}`} alt="" />
//   </div>
//   <div className={`${classes.col} ${classes.colClient}`}>
//     <div className={classes.clientTop}>
//       <span className={classes.clientName}>
//         {item?.name}
//         {/* <span className={classes.clientPosition}>
//           {item?.position?.name}
//         </span> */}
//       </span>
//     </div>
//     <div className={classes.clientBottom}>
//       <CarIcon /> 2
//     </div>
//   </div>
//   <div className={`${classes.col} ${classes.colCarInfo}`}>
//     <div className={classes.colLabel}>А666АА</div>
//     <div className={classes.routeItem}>
//       <span className={classes.routeIndex}>Toyota Camry</span>
//       <span className={classes.routeText}>черный</span>
//     </div>
//   </div>

//   {/* Колонка чат */}
//   <div className={`${classes.col} ${classes.colChat}`}>
//     <button className={classes.colChatButton}>
//       <CarIcon color={"var(--main-gray)"} /> Заказы
//     </button>
//     <div className={classes.chatButton}>
//       <img src="/chatReserve.png" alt="" />
//       {unreadCount > 0 && (
//         <div className={classes.chatBadge}>
//           {unreadCount > 99 ? "99+" : unreadCount}
//         </div>
//       )}
//     </div>
//     <Button padding="0 15px" minwidth="150px">
//       Данные профиля
//     </Button>
//   </div>
// </div>
