import React, { useMemo, useState } from "react";
import classes from "./TransferAccommodationTab.module.css";
import ServiceFooter from "../ServiceFooter/ServiceFooter";
import { convertToDateNew } from "../../../../graphQL_requests";
import { hotelsReserveData } from "../../../roles";
import Button from "../../Standart/Button/Button";
import CopyIcon from "../../../shared/icons/CopyIcon";
import PeopleCountIcon from "../../../shared/icons/PeopleCountIcon";

export default function TransferAccommodationTab({
  id,
  request,
  hotels,
  transferAccommodation,
  addHotel,
}) {
  const drivers = useMemo(() => request?.transferService?.drivers ?? [], [request]);
  const ts = request?.transferService;
  const statusToLabel = { NEW: "Принята", ACCEPTED: "Принята", IN_PROGRESS: "Выполняется", COMPLETED: "Поставка завершена", CANCELLED: "Отменена" };
  const [statusDrivers] = useState(statusToLabel[ts?.status] ?? "Принята");
  const [statusHotels] = useState(statusToLabel[request?.livingService?.status] ?? "Принята");

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
              {!!request?.transferService?.plan?.peopleCount && (
                <span className={classes.countChip}>
                  <PeopleCountIcon /> {request.transferService.plan.peopleCount}
                </span>
              )}
            </div>
            <div className={classes.tableCard}>
              {drivers.map((d, idx) => (
                  <div key={d.id || idx} className={classes.tableRow}>
                    <div className={classes.w5}>
                      {String(idx + 1).padStart(4, "0")}
                    </div>
                    <div className={`${classes.w30} ${classes.jcCenter}`}>
                      {d.fullName ?? "—"}
                    </div>
                    <div className={`${classes.w15} ${classes.jcCenter}`}>
                      {d.pickupAt ? convertToDateNew(d.pickupAt, true).trim() : "—"}
                    </div>
                    <div className={`${classes.w20} ${classes.jcCenter}`}>
                      {d.peopleCount ?? "—"}
                    </div>
                    <div className={`${classes.w10} ${classes.jcEnd} blueText`}>
                      <div className={classes.link}>
                        Ссылка <CopyIcon />
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </>
          <ServiceFooter
            statusText={statusDrivers}
            disabled={statusHotels === "Поставка завершена"}
            history={[
              {
                label: "Принята",
                dot: "#C4CBD6",
                time: ts?.times?.acceptedAt ? convertToDateNew(ts.times.acceptedAt, true).trim() : "—",
              },
              {
                label: "Выполняется",
                dot: "#2A6EF5",
                time: ts?.times?.inProgressAt ? convertToDateNew(ts.times.inProgressAt, true).trim() : "—",
              },
              {
                label: "Поставка завершена",
                dot: "#2ABF46",
                time: ts?.times?.finishedAt ? convertToDateNew(ts.times.finishedAt, true).trim() : "—",
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
                  time: request?.livingService?.times?.acceptedAt ? convertToDateNew(request.livingService.times.acceptedAt, true).trim() : "—",
                },
                {
                  label: "Выполняется",
                  dot: "#2A6EF5",
                  time: request?.livingService?.times?.inProgressAt ? convertToDateNew(request.livingService.times.inProgressAt, true).trim() : "—",
                },
                {
                  label: "Поставка завершена",
                  dot: "#2ABF46",
                  time: request?.livingService?.times?.finishedAt ? convertToDateNew(request.livingService.times.finishedAt, true).trim() : "—",
                },
              ]}
            />
          </div>
        </>
      )}
    </section>
  );
}
