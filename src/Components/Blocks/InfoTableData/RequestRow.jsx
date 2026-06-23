import React from "react";
import classes from "./InfoTableData.module.css";
import { convertToDate, convertToDateNew, getMediaUrl } from "../../../../graphQL_requests";

export const statusLabels = {
  created: "Создан",
  opened: "В обработке",
  extended: "Продлён",
  reduced: "Сокращён",
  transferred: "Перенесён",
  earlyStart: "Ранний заезд",
  canceled: "Отменён",
  archiving: "Готов к архиву",
  archived: "Архив",
  done: "Размещён",
};

const AIRLINE_COLORS = ["#534AB7", "#1565C0", "#1E8E3E", "#C2410C", "#9575CD", "#0F6E56"];
const airlineInitials = (name) =>
  (name || "?").trim().split(/\s+/).slice(0, 2).map((w) => w[0] || "").join("").toUpperCase() || "?";
export const airlineColor = (name) => {
  const s = name || "";
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return AIRLINE_COLORS[h % AIRLINE_COLORS.length];
};

// Одна строка заявки. Общая для плоского списка (InfoTableData) и группового вида (GroupedRequests).
function RequestRow({ item, user, chooseRequestID, onSelect }) {
  const totalUnread = (item?.chat || []).reduce((acc, chat) => {
    if (
      chat.unreadMessagesCount > 0 &&
      ((user.hotelId && chat.hotelId === user.hotelId) ||
        (user.airlineId && chat.airlineId === user.airlineId) ||
        (!user.hotelId && !user.airlineId))
    ) {
      return acc + chat.unreadMessagesCount;
    }
    return acc;
  }, 0);

  const hasLogo = !!item.airline?.images?.[0];

  return (
    <div
      className={`${classes.InfoTable_data} ${chooseRequestID === item.id && classes.InfoTable_data_active}`}
      style={{ opacity: item.status !== "archiving" && item.status !== "canceled" ? 1 : 0.5 }}
      onClick={() => onSelect(item)}
    >
      <div className={`${classes.InfoTable_data_elem} ${classes.w12}`}>{item.requestNumber}</div>
      {totalUnread > 0 ? (
        <div className={classes.newRequest}>{totalUnread > 99 ? "99+" : totalUnread}</div>
      ) : null}
      <div className={`${classes.InfoTable_data_elem} ${classes.w15}`}>
        <div className={classes.InfoTable_data_elem_information}>
          {item.person ? (
            <>
              <div className={classes.InfoTable_data_elem_title}>
                {item?.person?.name} {" "} {item?.reserve ? "(Резерв)" : ""}{" "}
              </div>
              <div className={classes.InfoTable_data_elem_moreInfo}>
                {item?.person?.position?.name?.split(" ")[0]}
              </div>
            </>
          ) : (
            "Предварительная бронь"
          )}
        </div>
      </div>
      <div
        className={`${classes.InfoTable_data_elem} ${classes.w13}`}
        style={{ justifyContent: "center", padding: "0 0 0 10px" }}
      >
        {convertToDate(item.createdAt)}
      </div>
      <div className={`${classes.InfoTable_data_elem} ${classes.w10}`} style={{ padding: "0 10px" }}>
        {hasLogo ? (
          <div className={classes.InfoTable_data_elem_img}>
            <img src={getMediaUrl(item.airline.images[0])} alt="" />
          </div>
        ) : (
          <div
            className={classes.airlineBadge}
            style={{ backgroundColor: airlineColor(item.airline?.name) }}
          >
            {airlineInitials(item.airline?.name)}
          </div>
        )}
        {item.airline?.name}
      </div>
      <div className={`${classes.InfoTable_data_elem} ${classes.w12}`} style={{ justifyContent: "center" }}>
        {item.airport?.code}
      </div>
      <div className={`${classes.InfoTable_data_elem} ${classes.w12}`}>
        <div className={classes.InfoTable_data_elem_information}>
          <div className={classes.InfoTable_data_elem_moreInfo}>
            <span><img src="/calendar.png" alt="" /> {convertToDateNew(item.arrival)}</span>
            <span><img src="/time.png" alt="" /> {convertToDateNew(item.arrival, true)}</span>
          </div>
        </div>
      </div>
      <div className={`${classes.InfoTable_data_elem} ${classes.w12}`}>
        <div className={classes.InfoTable_data_elem_information}>
          <div className={classes.InfoTable_data_elem_moreInfo}>
            <span><img src="/calendar.png" alt="" /> {convertToDateNew(item.departure)}</span>
            <span><img src="/time.png" alt="" /> {convertToDateNew(item.departure, true)}</span>
          </div>
        </div>
      </div>
      <div className={`${classes.InfoTable_data_elem} ${classes.w12}`}>
        <span className={`${classes.statusPill} ${classes["st_" + item.status] || ""}`}>
          {statusLabels[item.status]}
        </span>
      </div>
    </div>
  );
}

export default RequestRow;
