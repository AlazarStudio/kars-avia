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
// считает PlacementBarV2 по позиции плашки во вьюпорте. При above=true top —
// это низ поповера: translateY(-100%) сдвигает его вверх на фактическую
// высоту, которая зависит от того, какие строки внутри отрендерились.
const BarPopover = ({ request, style, top, left, above }) => {
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
    room,
    guestPosition,
  } = request;
  const roomName = room?.name;
  const position = guestPosition
    ? String(guestPosition).split("(")[0].trim()
    : "";
  const avatar = airline?.images?.[0] ? getMediaUrl(airline.images[0]) : null;

  return ReactDOM.createPortal(
    <div
      className={classes.popover}
      style={{
        top: `${top}px`,
        left: `${left}px`,
        transform: above ? "translateY(-100%)" : undefined,
      }}
    >
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

      {roomName ? (
        <div className={classes.popoverRow}>
          Комната
          <span className={classes.popoverValue}>{roomName}</span>
        </div>
      ) : null}
      {position ? (
        <div className={classes.popoverRow}>
          Должность
          <span className={classes.popoverValue}>{position}</span>
        </div>
      ) : null}
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
