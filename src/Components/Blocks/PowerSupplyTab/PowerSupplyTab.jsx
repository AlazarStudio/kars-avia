import React, { useMemo } from "react";
import classes from "./PowerSupplyTab.module.css";
import PeopleCountIcon from "../../../shared/icons/PeopleCountIcon";
import ServiceFooter from "../ServiceFooter/ServiceFooter";
import { useMutation } from "@apollo/client";
import { convertToDate, SET_PASSENGER_SERVICE_STATUS } from "../../../../graphQL_requests";

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
}) {
  const people = useMemo(() => request?.mealService?.people ?? [], [request]);
  const ms = request?.mealService;
  const rawStatus = ms?.status ?? "NEW";
  const statusText = statusToLabel[rawStatus] ?? "Принята";
  const canMarkDelivered = rawStatus === "NEW";

  const [mutate, { loading }] = useMutation(SET_PASSENGER_SERVICE_STATUS, {
    variables: {
      id: request?.id,
      service: "MEAL",
      status: "ACCEPTED",
    },
    onCompleted: () => {
      addNotification("Питание доставлено (услуга принята)", "success");
      onStatusChanged?.();
    },
    onError: (err) => {
      addNotification(err?.message || "Ошибка", "error");
      onStatusChanged?.();
    },
  });

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
        ctaLabel="Питание доставлено"
        onCta={() => mutate()}
        disabled={loading || !canMarkDelivered}
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
    </div>
  );
}
