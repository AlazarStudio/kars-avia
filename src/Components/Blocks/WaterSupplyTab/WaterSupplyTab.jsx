import React, { useMemo, useState } from "react";
import classes from "./WaterSupplyTab.module.css";
import { useMutation } from "@apollo/client";
import PeopleCountIcon from "../../../shared/icons/PeopleCountIcon";
import ServiceFooter from "../ServiceFooter/ServiceFooter";
import { convertToDateNew, SET_PASSENGER_SERVICE_STATUS } from "../../../../graphQL_requests";

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
  const initialStatus = statusToLabel[rawStatus] ?? "Принята";
  const [status, setStatus] = useState(initialStatus);

  const [mutate, { loading }] = useMutation(SET_PASSENGER_SERVICE_STATUS, {
    variables: {
      id: request?.id,
      service: "WATER",
      status: "COMPLETED",
    },
    onCompleted: () => {
      addNotification("Поставка завершена", "success");
      setStatus("Поставка завершена");
      onStatusChanged?.();
    },
    onError: () => {
      setStatus("Поставка завершена");
      onStatusChanged?.();
      addNotification("Поставка завершена", "success");
    },
  });

  // WaterSupplyTab.jsx
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
              {p.issuedAt ? convertToDateNew(p.issuedAt, true).trim() : "—"}
            </div>
          </div>
        ))}
      </div>

      <ServiceFooter
        statusText={status}
        ctaLabel="Вода доставлена"
        onCta={() => mutate()}
        disabled={loading || status === "Поставка завершена"}
        history={[
          {
            label: "Принята",
            dot: "#C4CBD6",
            time: ws?.times?.acceptedAt ? convertToDateNew(ws.times.acceptedAt, true).trim() : "—",
          },
          {
            label: "Выполняется",
            dot: "#2A6EF5",
            time: ws?.times?.inProgressAt ? convertToDateNew(ws.times.inProgressAt, true).trim() : "—",
          },
          {
            label: "Поставка завершена",
            dot: "#2ABF46",
            time: ws?.times?.finishedAt ? convertToDateNew(ws.times.finishedAt, true).trim() : "—",
          },
        ]}
      />
    </section>
  );
}
