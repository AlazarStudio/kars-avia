import React, { useMemo } from "react";
import classes from "./TransferAccommodationTab.module.css";
import ServiceFooter from "../ServiceFooter/ServiceFooter";
import { convertToDate } from "../../../../graphQL_requests";
import CopyIcon from "../../../shared/icons/CopyIcon";
import PeopleCountIcon from "../../../shared/icons/PeopleCountIcon";

export default function TransferAccommodationTab({
  id,
  request,
  onStatusChanged,
  addNotification,
  onDriverSelect,
}) {
  const drivers = useMemo(() => request?.transferService?.drivers ?? [], [request]);
  const ts = request?.transferService;
  const statusToLabel = { NEW: "Принята", ACCEPTED: "Принята", IN_PROGRESS: "Выполняется", COMPLETED: "Поставка завершена", CANCELLED: "Отменена" };
  const statusDrivers = statusToLabel[ts?.status] ?? "Принята";

  const copyLink = (url) => {
    if (!url) return;
    navigator.clipboard.writeText(url).then(() => {
      addNotification?.("Ссылка скопирована в буфер обмена", "success");
    }).catch(() => {
      addNotification?.("Не удалось скопировать ссылку", "error");
    });
  };

  const boardingTimeStr = ts?.plan?.plannedAt
    ? convertToDate(ts.plan.plannedAt, true).trim()
    : "—";

  return (
    <section
      id={id}
      role="tabpanel"
      aria-labelledby="transferAccommodation"
      style={{ display: "flex", flexDirection: "column", gap: 30 }}
    >
      <div className={classes.cardWrap}>
        <div className={classes.tableHead}>
          <div className={classes.w5}>ID</div>
          <div className={`${classes.w30} ${classes.jcCenter}`}>ФИО</div>
          <div className={`${classes.w15} ${classes.jcCenter}`}>
            Время посадки
          </div>
          <div className={`${classes.w20} ${classes.jcCenter}`}>
            Кол-во пассажиров
          </div>
          <div className={`${classes.w10} ${classes.jcEnd}`}>Ссылка</div>
          {!!request?.transferService?.plan?.peopleCount && (
            <span className={classes.countChip}>
              <PeopleCountIcon /> {request.transferService.plan.peopleCount}
            </span>
          )}
        </div>
        <div className={classes.tableCard}>
          {drivers.map((d, idx) => (
            <div
              key={d.id || idx}
              className={classes.tableRow}
              role={onDriverSelect ? "button" : undefined}
              onClick={onDriverSelect ? () => onDriverSelect(d, idx) : undefined}
              onKeyDown={
                onDriverSelect
                  ? (e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        onDriverSelect(d, idx);
                      }
                    }
                  : undefined
              }
              tabIndex={onDriverSelect ? 0 : undefined}
            >
              <div className={classes.w5}>
                {String(idx + 1).padStart(4, "0")}
              </div>
              <div className={`${classes.w30} ${classes.jcCenter}`}>
                {d.fullName ?? "—"}
              </div>
              <div className={`${classes.w15} ${classes.jcCenter}`}>
                {boardingTimeStr}
              </div>
              <div className={`${classes.w20} ${classes.jcCenter}`}>
                {d.peopleCount ?? "—"}
              </div>
              <div className={`${classes.w10} ${classes.jcEnd}`}>
                {d.link ? (
                  <button
                    type="button"
                    className={classes.link}
                    onClick={(e) => {
                      e.stopPropagation();
                      copyLink(d.link);
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
          statusText={statusDrivers}
          history={[
            {
              label: "Принята",
              dot: "#C4CBD6",
              time: ts?.times?.acceptedAt ? convertToDate(ts.times.acceptedAt, true).trim() : "—",
            },
            {
              label: "Выполняется",
              dot: "#2A6EF5",
              time: ts?.times?.inProgressAt ? convertToDate(ts.times.inProgressAt, true).trim() : "—",
            },
            {
              label: "Поставка завершена",
              dot: "#2ABF46",
              time: ts?.times?.finishedAt ? convertToDate(ts.times.finishedAt, true).trim() : "—",
            },
          ]}
        />
      </div>
    </section>
  );
}
