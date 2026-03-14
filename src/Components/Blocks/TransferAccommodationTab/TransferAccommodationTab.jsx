import React, { useMemo, useState } from "react";
import classes from "./TransferAccommodationTab.module.css";
import ServiceFooter from "../ServiceFooter/ServiceFooter";
import { convertToDate, COMPLETE_PASSENGER_REQUEST_TRANSFER_EARLY, getCookie } from "../../../../graphQL_requests";
import CopyIcon from "../../../shared/icons/CopyIcon";
import PeopleCountIcon from "../../../shared/icons/PeopleCountIcon";
import { useMutation } from "@apollo/client";
import Button from "../../Standart/Button/Button";

export default function TransferAccommodationTab({
  id,
  request,
  onStatusChanged,
  addNotification,
  onDriverSelect,
}) {
  const token = getCookie("token");
  const drivers = useMemo(() => request?.transferService?.drivers ?? [], [request]);
  const ts = request?.transferService;
  const statusToLabel = { NEW: "Принята", ACCEPTED: "Принята", IN_PROGRESS: "Выполняется", COMPLETED: "Поставка завершена", CANCELLED: "Отменена" };
  const statusDrivers = statusToLabel[ts?.status] ?? "Принята";

  const requestCancelled = request?.status === "CANCELLED";
  const canEarlyComplete =
    !requestCancelled &&
    ts?.status !== "COMPLETED" &&
    ts?.status !== "CANCELLED";

  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [completeReason, setCompleteReason] = useState("");

  const [completeEarly, { loading: completingEarly }] = useMutation(
    COMPLETE_PASSENGER_REQUEST_TRANSFER_EARLY,
    {
      context: token ? { headers: { Authorization: `Bearer ${token}` } } : undefined,
      onCompleted: () => {
        addNotification?.("Услуга «Трансфер» завершена", "success");
        setShowCompleteModal(false);
        setCompleteReason("");
        onStatusChanged?.();
      },
      onError: (err) => {
        addNotification?.(err?.message || "Ошибка", "error");
      },
    }
  );

  const handleComplete = () => {
    const reason = completeReason?.trim();
    if (!reason) {
      addNotification?.("Укажите причину завершения", "error");
      return;
    }
    completeEarly({
      variables: { requestId: request?.id, reason },
    });
  };

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
          earlyCompleteLabel={canEarlyComplete ? "Завершить" : undefined}
          onEarlyCompleteClick={canEarlyComplete ? () => setShowCompleteModal(true) : undefined}
          earlyCompleteDisabled={completingEarly}
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

      {showCompleteModal && (
        <div
          className={classes.modalOverlay}
          onClick={() => !completingEarly && setShowCompleteModal(false)}
        >
          <div
            className={classes.modalContent}
            onClick={(e) => e.stopPropagation()}
          >
            <h3>Завершить услугу «Трансфер»</h3>
            <p>Укажите причину завершения (обязательно):</p>
            <textarea
              className={classes.modalReasonInput}
              value={completeReason}
              onChange={(e) => setCompleteReason(e.target.value)}
              rows={4}
              placeholder="Причина"
            />
            <div className={classes.modalActions}>
              <Button
                onClick={() => {
                  setShowCompleteModal(false);
                  setCompleteReason("");
                }}
                disabled={completingEarly}
              >
                Отмена
              </Button>
              <Button onClick={handleComplete} disabled={completingEarly}>
                {completingEarly ? "Сохранение…" : "Завершить"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
