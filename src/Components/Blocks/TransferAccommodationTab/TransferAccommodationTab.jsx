import React, { useMemo, useState } from "react";
import classes from "./TransferAccommodationTab.module.css";
import ServiceFooter from "../ServiceFooter/ServiceFooter";
import { exampleData, hotelsReserveData } from "../../../roles";
import Button from "../../Standart/Button/Button";
import CopyIcon from "../../../shared/icons/CopyIcon";

export default function TransferAccommodationTab({
  id,
  request,
  hotels,
  transferAccommodation,
  addHotel,
}) {
  const drivers = useMemo(() => request?.transfer?.drivers ?? [], [request]);
  const [statusDrivers] = useState(request?.transfer?.status ?? "Принята");
  const [statusHotels] = useState(request?.accommodation?.status ?? "Принята");

  return (
    <section
      id={id}
      role="tabpanel"
      aria-labelledby="transferAccommodation"
      style={{ display: "flex", flexDirection: "column", gap: 30 }}
    >
      {/* Водители */}
      {transferAccommodation === "driver" ? (
        <div className={classes.cardWrap}>
          <>
            {/* <p className={classes.title}>Водитель</p> */}
            <div className={classes.tableHead}>
              <div className={classes.w5}>ID</div>
              <div className={`${classes.w30} ${classes.jcCenter}`}>ФИО</div>
              <div className={`${classes.w15} ${classes.jcCenter}`}>
                Время выдачи
              </div>
              <div className={`${classes.w20} ${classes.jcCenter}`}>
                Кол-во пассажиров
              </div>
              <div className={`${classes.w10} ${classes.jcEnd}`}>Ссылка</div>
            </div>
            <div className={classes.tableCard}>
              {(drivers.length ? drivers : request?.drivers ?? exampleData).map(
                (d, idx) => (
                  <div key={d.id || idx} className={classes.tableRow}>
                    <div className={classes.w5}>
                      {String(d.code ?? d.id ?? idx).padStart(4, "0")}
                    </div>
                    <div className={`${classes.w30} ${classes.jcCenter}`}>
                      {d.name ?? d.fullName ?? "—"}
                    </div>
                    <div className={`${classes.w15} ${classes.jcCenter}`}>
                      {d.time ?? d.issueTime ?? "—"}
                    </div>
                    <div className={`${classes.w20} ${classes.jcCenter}`}>
                      {d.passengers ?? d.passengersCount ?? "—"}
                    </div>
                    <div className={`${classes.w10} ${classes.jcEnd} blueText`}>
                      <div className={classes.link}>
                        Ссылка <CopyIcon />
                      </div>
                    </div>
                  </div>
                )
              )}
            </div>
          </>
          <ServiceFooter
            statusText={statusDrivers}
            // ctaLabel="Питание доставлена"
            // onCta={() => mutate()}
            disabled={statusHotels === "Поставка завершена"}
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
        </div>
      ) : (
        <>
          {/* Гостиницы */}
          <div className={classes.cardWrap}>
            <>
              {/* <div className={classes.cardWrapHeader}>
                <p className={classes.title}>Гостиница</p>
                <Button onClick={addHotel}>Добавить гостиницу</Button>
              </div> */}
              <div className={classes.tableHead}>
                <div className={classes.w20}>Название</div>
                <div className={`${classes.w25} ${classes.jcCenter}`}>
                  Количество мест
                </div>
                <div className={`${classes.w20} ${classes.jcCenter}`}>
                  Адрес
                </div>
                <div className={`${classes.w20} ${classes.jcEnd}`}>Ссылка</div>
              </div>
              <div className={classes.tableCard}>
                {(hotelsReserveData ?? hotels ?? []).map((h, i) => (
                  <div key={h.hotel?.id || i} className={classes.tableRow}>
                    <div className={classes.w20}>{h.hotel?.name}</div>
                    <div className={`${classes.w25} ${classes.jcCenter}`}>
                      {h.hotel?.passengersCount}
                    </div>
                    <div className={`${classes.w20} ${classes.jcCenter}`}>
                      {h.hotel?.city || h.hotel?.address || "—"}
                    </div>
                    <div className={`${classes.w20} ${classes.jcEnd} blueText`}>
                      <div className={classes.link}>
                        Ссылка <CopyIcon />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
            <ServiceFooter
              statusText={statusHotels}
              // ctaLabel="Питание доставлена"
              // onCta={() => mutate()}
              disabled={statusHotels === "Поставка завершена"}
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
          </div>
        </>
      )}
    </section>
  );
}
