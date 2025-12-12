import classes from "./DriverItem.module.css";

import { convertToDate, server } from "../../../../graphQL_requests.js";
import CarIcon from "../../../shared/icons/CarIcon.jsx";
import Button from "../../Standart/Button/Button.jsx";

function DriverItem({
  user,
  token,
  unreadCount,
  handleObject,
  activeTransfersCount,
  btnTitle = 'Данные профиля',
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
        <img src="/avatar1.png" alt="" />
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
          <CarIcon /> {activeTransfersCount}
        </div>
      </div>
      <div className={`${classes.col} ${classes.colCarInfo}`}>
        <div className={classes.colLabel}>А666АА</div>
        <div className={classes.routeItem}>
          <span className={classes.routeIndex}>Toyota Camry</span>
          <span className={classes.routeText}>черный</span>
        </div>
      </div>

      {/* Колонка чат */}
      <div className={`${classes.col} ${classes.colChat}`}>
        {/* <button className={classes.colChatButton}>
          <CarIcon color={"var(--main-gray)"} /> Заказы
        </button> */}
        <div className={classes.chatButton}>
          <img src="/chatReserve.png" alt="" />
          {unreadCount && unreadCount > 0 && (
            <div className={classes.chatBadge}>
              {unreadCount > 99 ? "99+" : unreadCount}
            </div>
          )}
        </div>
        <Button padding="0 15px" minwidth="150px">
          {btnTitle}
        </Button>
      </div>
    </div>
  );
}

export default DriverItem;
