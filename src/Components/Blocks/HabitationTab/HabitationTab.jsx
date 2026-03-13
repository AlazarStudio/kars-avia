import React from "react";
import classes from "./HabitationTab.module.css";
import ServiceFooter from "../ServiceFooter/ServiceFooter";
import CopyIcon from "../../../shared/icons/CopyIcon";
import PeopleCountIcon from "../../../shared/icons/PeopleCountIcon";
import { convertToDate } from "../../../../graphQL_requests";

const statusToLabel = { NEW: "Принята", ACCEPTED: "Принята", IN_PROGRESS: "Выполняется", COMPLETED: "Поставка завершена", CANCELLED: "Отменена" };

export default function HabitationTab({ id, request, searchQuery = "", addNotification, onHotelSelect }) {
  const ls = request?.livingService;
  const statusText = statusToLabel[ls?.status] ?? "Принята";
  const allHotels = request?.livingService?.hotels ?? [];
  const q = (searchQuery || "").trim().toLowerCase();
  const hotelsWithIndex = q
    ? allHotels
        .map((h, i) => ({ h, originalIndex: i }))
        .filter(
          ({ h }) =>
            (h.name ?? "").toLowerCase().includes(q) ||
            (h.address ?? "").toLowerCase().includes(q)
        )
    : allHotels.map((h, i) => ({ h, originalIndex: i }));

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
          {!!request?.livingService?.plan?.peopleCount && (
            <span className={classes.countChip}>
              <PeopleCountIcon /> {request.livingService.plan.peopleCount}
            </span>
          )}
        </div>
        {hotelsWithIndex.map(({ h, originalIndex }, i) => (
          <div
            key={h.hotelId || h.name + originalIndex || i}
            className={`${classes.tableRow} ${onHotelSelect ? classes.tableRowClickable : ""}`}
            role={onHotelSelect ? "button" : undefined}
            tabIndex={onHotelSelect ? 0 : undefined}
            onClick={() => onHotelSelect?.(h, originalIndex)}
            onKeyDown={(e) => onHotelSelect && (e.key === "Enter" || e.key === " ") && (e.preventDefault(), onHotelSelect(h, originalIndex))}
          >
            <div className={`${classes.w20} ${classes.lineClamp2}`}>{h.name ?? "—"}</div>
            <div className={`${classes.w25} ${classes.jcCenter}`}>
              {h.peopleCount ?? "—"}
            </div>
            <div
              className={`${classes.w20} ${classes.jcCenter} ${classes.lineClamp2}`}
              title={h.address ?? undefined}
            >
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
      <ServiceFooter
        statusText={statusText}
        history={[
          {
            label: "Принята",
            dot: "#C4CBD6",
            time: ls?.times?.acceptedAt ? convertToDate(ls.times.acceptedAt, true).trim() : "—",
          },
          {
            label: "Выполняется",
            dot: "#2A6EF5",
            time: ls?.times?.inProgressAt ? convertToDate(ls.times.inProgressAt, true).trim() : "—",
          },
          {
            label: "Поставка завершена",
            dot: "#2ABF46",
            time: ls?.times?.finishedAt ? convertToDate(ls.times.finishedAt, true).trim() : "—",
          },
        ]}
      />
    </section>
  );
}
