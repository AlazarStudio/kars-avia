import React, { useState } from "react";
import classes from "./HabitationTab.module.css";
import ServiceFooter from "../ServiceFooter/ServiceFooter";
import CopyIcon from "../../../shared/icons/CopyIcon";

const statusToLabel = { NEW: "Принята", ACCEPTED: "Принята", IN_PROGRESS: "Выполняется", COMPLETED: "Поставка завершена", CANCELLED: "Отменена" };

export default function HabitationTab({ id, request, addNotification, onHotelSelect }) {
  const [status] = useState(statusToLabel[request?.livingService?.status] ?? "Принята");
  const hotels = request?.livingService?.hotels ?? [];

  const copyLink = (url) => {
    if (!url) return;
    navigator.clipboard.writeText(url).then(() => {
      addNotification?.("Ссылка скопирована в буфер обмена", "success");
    }).catch(() => {
      addNotification?.("Не удалось скопировать ссылку", "error");
    });
  };

  return (
    <section
      id={id}
      role="tabpanel"
      aria-labelledby="habitation"
      className={classes.cardWrap}
    >
      <div className={classes.tableCard}>
        <div className={classes.tableHead}>
          <div className={classes.w20}>Название</div>
          <div className={`${classes.w25} ${classes.jcCenter}`}>
            Количество мест
          </div>
          <div className={`${classes.w20} ${classes.jcCenter}`}>Адрес</div>
          <div className={`${classes.w20} ${classes.jcEnd}`}>Ссылка</div>
        </div>
        {hotels.map((h, i) => (
          <div
            key={h.hotelId || h.name + i || i}
            className={`${classes.tableRow} ${onHotelSelect ? classes.tableRowClickable : ""}`}
            role={onHotelSelect ? "button" : undefined}
            tabIndex={onHotelSelect ? 0 : undefined}
            onClick={() => onHotelSelect?.(h, i)}
            onKeyDown={(e) => onHotelSelect && (e.key === "Enter" || e.key === " ") && (e.preventDefault(), onHotelSelect(h, i))}
          >
            <div className={`${classes.w20} ${classes.lineClamp2}`}>{h.name ?? "—"}</div>
            <div className={`${classes.w25} ${classes.jcCenter}`}>
              {h.peopleCount ?? "—"}
            </div>
            <div className={`${classes.w20} ${classes.jcCenter} ${classes.lineClamp2}`}>
              {h.address ?? "—"}
            </div>
            <div className={`${classes.w20} ${classes.jcEnd}`}>
              {h.link ? (
                <button
                  type="button"
                  className={classes.link}
                  onClick={(e) => {
                    e.stopPropagation();
                    copyLink(h.link);
                  }}
                  title="Скопировать ссылку"
                >
                  Ссылка <CopyIcon />
                </button>
              ) : (
                <span className={classes.link}>—</span>
              )}
            </div>
          </div>
        ))}
      </div>
      <ServiceFooter statusText={status} />
    </section>
  );
}
