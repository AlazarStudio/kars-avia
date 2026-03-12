import classes from "./DriverItem.module.css";

import { convertToDate, getMediaUrl } from "../../../../graphQL_requests.js";
import CarIcon from "../../../shared/icons/CarIcon.jsx";
import Button from "../../Standart/Button/Button.jsx";

function DriverItem({
  user,
  token,
  unreadCount,
  handleObject,
  activeTransfersCount,
  btnTitle = "Данные профиля",
  ...props
}) {
  return (
    <div
      className={classes.InfoTable_row}
      onClick={() => handleObject(props.id, props)}
    // data-id={props.id}
    >
      {/* {console.log(props)} */}
      <div className={`${classes.col} ${classes.colImage}`}>
        {/* <button
                    type="button"
                    className={classes.orderLink}
                    onClick={(e) => {
                      e.stopPropagation();
                    }}
                  >
                    №{props.order}
                  </button> */}
        {/* {console.log(props?.documents?.driverPhoto)} */}
        <img
          src={
            props?.documents?.driverPhoto.length > 0
              ? getMediaUrl(props?.documents?.driverPhoto[0])
              : "/no-avatar.png"
          }
          alt=""
        />
      </div>
      <div className={`${classes.col} ${classes.colClient}`}>
        <div className={classes.clientTop}>
          <span className={classes.clientName}>
            {props?.name}
            {/* <span className={classes.clientPosition}>
                        {props?.position?.name}
                      </span> */}
          </span>
        </div>
        <div className={classes.clientBottom}>
          {/* <CarIcon /> */}
          {"Активные заявки: "}
          {activeTransfersCount ||
            props.transfers.filter(
              (i) =>
                i.status.toLowerCase() !== "completed" &&
                i.status.toLowerCase() !== "cancelled"
            ).length}
          {/* <span className={classes.tooltip}>Активные заявки</span> */}
        </div>
      </div>
      <div className={`${classes.col} ${classes.colCarInfo}`}>
        <div className={classes.colLabel}>{props.driverLicenseNumber}</div>
        <div className={classes.routeItem}>
          <span className={classes.routeIndex}>{props?.car}</span>
          {/* <span className={classes.routeText}>черный</span> */}
        </div>
      </div>

      {/* Колонка чат */}
      <div className={`${classes.col} ${classes.colChat}`}>
        {/* <button className={classes.colChatButton}>
          <CarIcon color={"var(--main-gray)"} /> Заказы
        </button> */}
        {/* <div className={classes.chatButton}>
          <img src="/chatReserve.png" alt="" />
          {unreadCount && unreadCount > 0 && (
            <div className={classes.chatBadge}>
              {unreadCount > 99 ? "99+" : unreadCount}
            </div>
          )}
        </div> */}
        {btnTitle === "Назначен" ? (
          <span style={{ padding: "0 15px", minWidth: "150px", color: "var(--blue)", fontWeight: 600, display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
            {btnTitle}
          </span>
        ) : (
          <Button padding="0 15px" minwidth="150px">
            {btnTitle}
          </Button>
        )}
        {/* <Button padding="0 15px" minwidth="150px">
          {btnTitle}
        </Button> */}
      </div>
    </div>
  );
}

export default DriverItem;
