import React, { useMemo, useState } from "react";
import classes from "./PowerSupplyTab.module.css";
import PeopleCountIcon from "../../../shared/icons/PeopleCountIcon";
import ServiceFooter from "../ServiceFooter/ServiceFooter";
import Button from "../../Standart/Button/Button";
import { useMutation } from "@apollo/client";
import {
  convertToDate,
  SET_PASSENGER_SERVICE_STATUS,
  COMPLETE_PASSENGER_REQUEST_MEAL_EARLY,
} from "../../../../graphQL_requests";

const statusToLabel = {
  NEW: "Принята",
  ACCEPTED: "Принята",
  IN_PROGRESS: "Выполняется",
  COMPLETED: "Поставка завершена",
  CANCELLED: "Отменена",
};

export default function PowerSupplyTab({
  id,
  request,
  onStatusChanged,
  addNotification,
  token,
}) {
  const people = useMemo(() => request?.mealService?.people ?? [], [request]);
  const ms = request?.mealService;
  const rawStatus = ms?.status ?? "NEW";
  const statusText = statusToLabel[rawStatus] ?? "Принята";
  const canMarkDelivered = rawStatus === "NEW";
  const requestCancelled = request?.status === "CANCELLED";
  const canEarlyComplete =
    !requestCancelled &&
    rawStatus !== "COMPLETED" &&
    rawStatus !== "CANCELLED";

  const [showEarlyCompleteModal, setShowEarlyCompleteModal] = useState(false);
  const [earlyCompleteReason, setEarlyCompleteReason] = useState("");

  const [mutate, { loading }] = useMutation(SET_PASSENGER_SERVICE_STATUS, {
    variables: {
      id: request?.id,
      service: "MEAL",
      status: "ACCEPTED",
    },
    context: token
      ? { headers: { Authorization: `Bearer ${token}` } }
      : undefined,
    onCompleted: () => {
      addNotification("Питание доставлено (услуга принята)", "success");
      onStatusChanged?.();
    },
    onError: (err) => {
      addNotification(err?.message || "Ошибка", "error");
      onStatusChanged?.();
    },
  });

  const [completeEarly, { loading: completingEarly }] = useMutation(
    COMPLETE_PASSENGER_REQUEST_MEAL_EARLY,
    {
      context: token
        ? { headers: { Authorization: `Bearer ${token}` } }
        : undefined,
      onCompleted: () => {
        addNotification("Услуга «Поставка питания» досрочно завершена", "success");
        setShowEarlyCompleteModal(false);
        setEarlyCompleteReason("");
        onStatusChanged?.();
      },
      onError: (err) => {
        addNotification(err?.message || "Ошибка", "error");
      },
    }
  );

  const handleEarlyComplete = () => {
    const reason = earlyCompleteReason?.trim();
    if (!reason) {
      addNotification("Укажите причину досрочного завершения", "error");
      return;
    }
    completeEarly({
      variables: { requestId: request?.id, reason },
    });
  };

  return (
    <div className={classes.cardWrap}>
      <div
        id={id}
        role="tabpanel"
        aria-labelledby="powerSupply"
        className={classes.tableCard}
      >
        <div className={classes.tableHead}>
          <div className={classes.w10}>ID</div>
          <div className={`${classes.w30} ${classes.jcCenter}`}>ФИО</div>
          <div className={`${classes.w20} ${classes.jcCenter}`}>
            Время выдачи
          </div>
          <div style={{ flex: 1, display: "flex", justifyContent: "end" }}>
            {/* <span>Время выдачи</span> */}
            {!!request?.mealService?.plan?.peopleCount && (
              <span className={classes.countChip}>
                <PeopleCountIcon /> {request.mealService.plan.peopleCount}
              </span>
            )}
          </div>
        </div>
        {people.map((p, idx) => (
          <div key={p.id || idx} className={classes.tableRow}>
            <div className={classes.w10}>
              {String(idx + 1).padStart(4, "0")}
            </div>
            <div className={`${classes.w30} ${classes.jcCenter}`}>
              {p.fullName ?? "—"}
            </div>
            <div className={`${classes.w20} ${classes.jcCenter}`}>
              {p.issuedAt ? convertToDate(p.issuedAt, true).trim() : "—"}
            </div>
          </div>
        ))}
      </div>
      <ServiceFooter
        statusText={statusText}
        ctaLabel={!requestCancelled && canMarkDelivered ? "Питание доставлено" : undefined}
        onCta={!requestCancelled && canMarkDelivered ? () => mutate() : undefined}
        disabled={loading || !canMarkDelivered}
        earlyCompleteLabel={canEarlyComplete ? "Завершить" : undefined}
        onEarlyCompleteClick={
          canEarlyComplete ? () => setShowEarlyCompleteModal(true) : undefined
        }
        earlyCompleteDisabled={completingEarly}
        history={[
          {
            label: "Принята",
            dot: "#C4CBD6",
            time: ms?.times?.acceptedAt ? convertToDate(ms.times.acceptedAt, true).trim() : "—",
          },
          {
            label: "Выполняется",
            dot: "#2A6EF5",
            time: ms?.times?.inProgressAt ? convertToDate(ms.times.inProgressAt, true).trim() : "—",
          },
          {
            label: "Поставка завершена",
            dot: "#2ABF46",
            time: ms?.times?.finishedAt ? convertToDate(ms.times.finishedAt, true).trim() : "—",
          },
        ]}
      />

      {showEarlyCompleteModal && (
        <div
          className={classes.modalOverlay}
          onClick={() => !completingEarly && setShowEarlyCompleteModal(false)}
        >
          <div
            className={classes.modalContent}
            onClick={(e) => e.stopPropagation()}
          >
            <h3>Досрочно завершить услугу «Поставка питания»</h3>
            <p>Укажите причину досрочного завершения (обязательно):</p>
            {/* <label className={classes.modalReasonLabel} htmlFor="meal-early-reason">Причина</label> */}
            <textarea
              id="meal-early-reason"
              className={classes.modalReasonInput}
              value={earlyCompleteReason}
              onChange={(e) => setEarlyCompleteReason(e.target.value)}
              rows={4}
              placeholder="Причина"
            />
            <div className={classes.modalActions}>
              <Button
                onClick={() => {
                  setShowEarlyCompleteModal(false);
                  setEarlyCompleteReason("");
                }}
                disabled={completingEarly}
              >
                Отмена
              </Button>
              <Button onClick={handleEarlyComplete} disabled={completingEarly}>
                {completingEarly ? "Сохранение…" : "Завершить"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
