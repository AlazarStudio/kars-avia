import React, { useState } from "react";
import classes from "./HabitationTab.module.css";
import ServiceFooter from "../ServiceFooter/ServiceFooter";
import { hotelsReserveData } from "../../../roles";
import CopyIcon from "../../../shared/icons/CopyIcon";

export default function HabitationTab({ id, hotels, request }) {
  const [status] = useState(request?.accommodation?.status ?? "Принята");

  return (
    <section
      id={id}
      role="tabpanel"
      aria-labelledby="habitation"
      className={classes.cardWrap}
    >
      <div className={classes.tableCard}>
        <div className={classes.tableHead}>
          <div className={classes.w20}>Название</div>
          <div className={`${classes.w25} ${classes.jcCenter}`}>
            Количество мест
          </div>
          <div className={`${classes.w20} ${classes.jcCenter}`}>Адрес</div>
          <div className={`${classes.w20} ${classes.jcEnd}`}>Ссылка</div>
        </div>
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
              <div className={classes.link}>Ссылка <CopyIcon/></div>
            </div>
          </div>
        ))}
      </div>
      <ServiceFooter statusText={status} />
    </section>
  );
}
