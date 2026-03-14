import React, { useMemo, useState } from "react";
import classes from "../TransferAccommodationTab/TransferAccommodationTab.module.css";
import modalClasses from "./BaggageDeliveryTab.module.css";
import ServiceFooter from "../ServiceFooter/ServiceFooter";
import { convertToDate, COMPLETE_PASSENGER_REQUEST_BAGGAGE_EARLY, getCookie } from "../../../../graphQL_requests";
import CopyIcon from "../../../shared/icons/CopyIcon";
import { useMutation } from "@apollo/client";
import Button from "../../Standart/Button/Button";

export default function BaggageDeliveryTab({
  id,
  request,
  onStatusChanged,
  addNotification,
}) {
  const token = getCookie("token");
  const drivers = useMemo(() => request?.baggageDeliveryService?.drivers ?? [], [request]);
  const bds = request?.baggageDeliveryService;
  const statusToLabel = { NEW: "Принята", ACCEPTED: "Принята", IN_PROGRESS: "Выполняется", COMPLETED: "Поставка завершена", CANCELLED: "Отменена" };
  const statusDrivers = statusToLabel[bds?.status] ?? "Принята";

  const requestCancelled = request?.status === "CANCELLED";
  const canEarlyComplete =
    !requestCancelled &&
    bds?.status !== "COMPLETED" &&
    bds?.status !== "CANCELLED";

  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [completeReason, setCompleteReason] = useState("");

  const [completeEarly, { loading: completingEarly }] = useMutation(
    COMPLETE_PASSENGER_REQUEST_BAGGAGE_EARLY,
    {
      context: token ? { headers: { Authorization: `Bearer ${token}` } } : undefined,
      onCompleted: () => {
        addNotification?.("Услуга «Доставка багажа» завершена", "success");
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

  const copyLink = (url, e) => {
    e?.stopPropagation?.();
    if (!url) return;
    navigator.clipboard.writeText(url).then(() => {
      addNotification?.("Ссылка скопирована в буфер обмена", "success");
    }).catch(() => {
      addNotification?.("Не удалось скопировать ссылку", "error");
    });
  };

  const plannedTimeStr = bds?.plan?.plannedAt
    ? convertToDate(bds.plan.plannedAt, true).trim()
    : "—";

  return (
    <section
      id={id}
      role="tabpanel"
      aria-labelledby="baggageDelivery"
      style={{ display: "flex", flexDirection: "column", gap: 30 }}
    >
      <div className={classes.cardWrap}>
        <div className={classes.tableHead}>
          <div className={classes.w5}>ID</div>
          <div className={`${classes.w15} ${classes.jcCenter}`}>ФИО</div>
          <div className={`${classes.w18} ${classes.jcCenter}`}>Адрес отправления</div>
          <div className={`${classes.w18} ${classes.jcCenter}`}>Адрес прибытия</div>
          <div className={`${classes.w12} ${classes.jcCenter}`}>Время</div>
          <div className={`${classes.w18} ${classes.jcCenter}`}>Описание</div>
          <div className={`${classes.w10} ${classes.jcEnd}`}>Ссылка</div>
        </div>
        <div className={classes.tableCard}>
          {drivers.map((d, idx) => (
            <div key={d.id || idx} className={classes.tableRow}>
              <div className={classes.w5}>
                {String(idx + 1).padStart(4, "0")}
              </div>
              <div className={`${classes.w15} ${classes.jcCenter}`}>
                {d.fullName ?? "—"}
              </div>
              <div
                className={`${modalClasses.addressCell} ${classes.w18} ${classes.jcCenter}`}
                title={d.addressFrom ?? undefined}
              >
                {d.addressFrom ?? "—"}
              </div>
              <div
                className={`${modalClasses.addressCell} ${classes.w18} ${classes.jcCenter}`}
                title={d.addressTo ?? undefined}
              >
                {d.addressTo ?? "—"}
              </div>
              <div className={`${classes.w12} ${classes.jcCenter}`}>
                {d.pickupAt ? convertToDate(d.pickupAt, true).trim() : plannedTimeStr}
              </div>
              <div className={`${classes.w18} ${classes.jcCenter}`}>
                {d.description ?? "—"}
              </div>
              <div className={`${classes.w10} ${classes.jcEnd}`}>
                {d.link ? (
                  <button
                    type="button"
                    className={classes.link}
                    onClick={(e) => copyLink(d.link, e)}
                    title="Скопировать ссылку"
                  >
                    Ссылка <CopyIcon />
                  </button>
                ) : (
                  "—"
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
              time: bds?.times?.acceptedAt ? convertToDate(bds.times.acceptedAt, true).trim() : "—",
            },
            {
              label: "Выполняется",
              dot: "#2A6EF5",
              time: bds?.times?.inProgressAt ? convertToDate(bds.times.inProgressAt, true).trim() : "—",
            },
            {
              label: "Поставка завершена",
              dot: "#2ABF46",
              time: bds?.times?.finishedAt ? convertToDate(bds.times.finishedAt, true).trim() : "—",
            },
          ]}
        />
      </div>

      {showCompleteModal && (
        <div
          className={modalClasses.modalOverlay}
          onClick={() => !completingEarly && setShowCompleteModal(false)}
        >
          <div
            className={modalClasses.modalContent}
            onClick={(e) => e.stopPropagation()}
          >
            <h3>Завершить услугу «Доставка багажа»</h3>
            <p>Укажите причину завершения (обязательно):</p>
            <textarea
              className={modalClasses.modalReasonInput}
              value={completeReason}
              onChange={(e) => setCompleteReason(e.target.value)}
              rows={4}
              placeholder="Причина"
            />
            <div className={modalClasses.modalActions}>
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
