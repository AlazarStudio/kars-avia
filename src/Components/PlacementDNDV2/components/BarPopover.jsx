import React from "react";
import ReactDOM from "react-dom";
import { convertToDate, getMediaUrl } from "../../../../graphQL_requests";
import classes from "./PlacementBarV2.module.css";

const MEAL_LABELS = [
  ["breakfast", "Завтрак"],
  ["lunch", "Обед"],
  ["dinner", "Ужин"],
];

// Поповер деталей брони. Рендерится порталом в body — координаты (top/left)
// считает PlacementBarV2 по позиции плашки во вьюпорте.
const BarPopover = ({ request, style, top, left }) => {
  const { edge, tint } = style;
  const {
    guest,
    airline,
    requestNumber,
    status,
    checkInDate,
    checkInTime,
    checkOutDate,
    checkOutTime,
    mealPlan,
  } = request;
  const avatar = airline?.images?.[0] ? getMediaUrl(airline.images[0]) : null;

  return ReactDOM.createPortal(
    <div className={classes.popover} style={{ top: `${top}px`, left: `${left}px` }}>
      <div className={classes.popoverHead}>
        <span className={classes.popoverAvatar}>
          {avatar ? <img src={avatar} alt="" /> : null}
        </span>
        <div className={classes.popoverTitles}>
          <span className={classes.popoverName}>
            {guest || "Предварительная бронь"}
          </span>
          <span className={classes.popoverSub}>
            {airline?.name}
            {requestNumber ? ` · заявка ${requestNumber}` : ""}
          </span>
        </div>
        <span
          className={classes.popoverStatus}
          style={{ color: edge, background: tint }}
        >
          {status}
        </span>
      </div>

      <div className={classes.popoverRow}>
        Заселение
        <span className={classes.popoverValue}>
          {convertToDate(checkInDate)} {checkInTime}
        </span>
      </div>
      <div className={classes.popoverRow}>
        Выселение
        <span className={classes.popoverValue}>
          {convertToDate(checkOutDate)} {checkOutTime}
        </span>
      </div>

      {mealPlan?.included ? (
        <div className={classes.popoverRow}>
          Питание
          <span className={classes.mealChips}>
            {MEAL_LABELS.map(([key, label]) => (
              <span
                key={key}
                className={
                  mealPlan[key] ? classes.mealChipOn : classes.mealChipOff
                }
              >
                {label}
              </span>
            ))}
          </span>
        </div>
      ) : null}
    </div>,
    document.body
  );
};

export default BarPopover;
