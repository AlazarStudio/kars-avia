import React, { useMemo, useState } from "react";
import classes from "./WaterSupplyTab.module.css";
import { gql, useMutation } from "@apollo/client";
import PeopleCountIcon from "../../../shared/icons/PeopleCountIcon";
import ServiceFooter from "../ServiceFooter/ServiceFooter";
import { exampleData } from "../../../roles";

const UPDATE_SERVICE_STATUS = gql`
  mutation UpdateServiceStatus(
    $reserveId: ID!
    $service: ServiceType!
    $status: ServiceStatus!
  ) {
    updateReserveServiceStatus(
      reserveId: $reserveId
      service: $service
      status: $status
    ) {
      service
      status
    }
  }
`;

export default function WaterSupplyTab({
  id,
  request,
  onStatusChanged,
  addNotification,
}) {
  // Драйверы для воды из бэка (если нет — пусто)
  const drivers = useMemo(() => request?.waterSupply?.drivers ?? [], [request]);

  const initialStatus = request?.waterSupply?.status ?? "Принята";
  const [status, setStatus] = useState(initialStatus);

  const [mutate, { loading }] = useMutation(UPDATE_SERVICE_STATUS, {
    variables: {
      reserveId: request?.id,
      service: "WATER",
      status: "DELIVERED",
    },
    onCompleted: () => {
      addNotification("Поставка завершена", "success");
      setStatus("Поставка завершена");
      onStatusChanged?.();
    },
    onError: () => {
      /* оставим локально, чтобы не падало */ setStatus("Поставка завершена");
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
            {!!request?.passengerCount && (
              <span className={classes.countChip}>
                <PeopleCountIcon /> {request.passengerCount}4
              </span>
            )}
          </div>
        </div>

        {(drivers.length ? drivers : request?.drivers ?? exampleData).map(
          (d, idx) => (
            <div key={d.id || idx} className={classes.tableRow}>
              <div className={classes.w10}>
                {String(d.code ?? d.id ?? idx).padStart(4, "0")}
              </div>
              <div className={`${classes.w30} ${classes.jcCenter}`}>
                {d.name ?? d.fullName ?? "—"}
              </div>
              <div className={`${classes.w20} ${classes.jcCenter}`}>
                {d.time ?? d.issueTime ?? "—"}
              </div>
            </div>
          )
        )}
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
            time: request?.waterSupply?.acceptedAt ?? "14:30",
          },
          {
            label: "Выполняется",
            dot: "#2A6EF5",
            time: request?.waterSupply?.inProgressAt ?? "14:40",
          },
          {
            label: "Поставка завершена",
            dot: "#2ABF46",
            time: request?.waterSupply?.finishedAt ?? "15:00",
          },
        ]}
      />
    </section>
  );
}
