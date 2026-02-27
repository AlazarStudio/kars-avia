import React, { useMemo } from "react";
import classes from "./WaterSupplyTab.module.css";
import { useMutation } from "@apollo/client";
import PeopleCountIcon from "../../../shared/icons/PeopleCountIcon";
import ServiceFooter from "../ServiceFooter/ServiceFooter";
import { convertToDate, SET_PASSENGER_SERVICE_STATUS } from "../../../../graphQL_requests";

const statusToLabel = {
  NEW: "Принята",
  ACCEPTED: "Принята",
  IN_PROGRESS: "Выполняется",
  COMPLETED: "Поставка завершена",
  CANCELLED: "Отменена",
};

export default function WaterSupplyTab({
  id,
  request,
  onStatusChanged,
  addNotification,
}) {
  const people = useMemo(() => request?.waterService?.people ?? [], [request]);
  const ws = request?.waterService;
  const rawStatus = ws?.status ?? "NEW";
  const statusText = statusToLabel[rawStatus] ?? "Принята";
  const canMarkDelivered = rawStatus === "NEW";

  const [mutate, { loading }] = useMutation(SET_PASSENGER_SERVICE_STATUS, {
    variables: {
      id: request?.id,
      service: "WATER",
      status: "ACCEPTED",
    },
    onCompleted: () => {
      addNotification("Вода доставлена (услуга принята)", "success");
      onStatusChanged?.();
    },
    onError: (err) => {
      addNotification(err?.message || "Ошибка", "error");
      onStatusChanged?.();
    },
  });

  return (
    <section
      id={id}
      role="tabpanel"
      aria-labelledby="waterSupply"
      className={classes.cardWrap}
    >
      <div className={classes.tableCard}>
        <div className={classes.tableHead}>
          <div className={classes.w10}>ID</div>
          <div className={`${classes.w30} ${classes.jcCenter}`}>ФИО</div>
          <div className={`${classes.w20} ${classes.jcCenter}`}>
            Время выдачи
          </div>
          <div style={{ flex: 1, display: "flex", justifyContent: "end" }}>
            {/* <span>Время выдачи</span> */}
            {!!request?.waterService?.plan?.peopleCount && (
              <span className={classes.countChip}>
                <PeopleCountIcon /> {request.waterService.plan.peopleCount}
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
        ctaLabel="Вода доставлена"
        onCta={() => mutate()}
        disabled={loading || !canMarkDelivered}
        history={[
          {
            label: "Принята",
            dot: "#C4CBD6",
            time: ws?.times?.acceptedAt ? convertToDate(ws.times.acceptedAt, true).trim() : "—",
          },
          {
            label: "Выполняется",
            dot: "#2A6EF5",
            time: ws?.times?.inProgressAt ? convertToDate(ws.times.inProgressAt, true).trim() : "—",
          },
          {
            label: "Поставка завершена",
            dot: "#2ABF46",
            time: ws?.times?.finishedAt ? convertToDate(ws.times.finishedAt, true).trim() : "—",
          },
        ]}
      />
    </section>
  );
}
