import React, { useState } from "react";
import { useQuery } from "@apollo/client";
import classes from "./SystemNotificationsSettings.module.css";
import Header from "../Header/Header";
import MaintenanceBannerSettings from "../MaintenanceBanner/MaintenanceBannerSettings";
import SystemUpdateSettings from "./SystemUpdateSettings";
import { MAINTENANCE_BANNER, SYSTEM_UPDATE } from "../../../../graphQL_requests";

// Одна страница SuperAdmin: Header + белая карточка + pill-контрол.
// Статус-точки на pill отражают сохранённое enabled каждой секции;
// дочерние формы делают те же query — Apollo дедуплицирует по кэшу.
function SystemNotificationsSettings() {
  const [active, setActive] = useState("systemUpdate");

  const { data: suData } = useQuery(SYSTEM_UPDATE, {
    fetchPolicy: "cache-and-network",
  });
  const { data: mbData } = useQuery(MAINTENANCE_BANNER, {
    fetchPolicy: "cache-and-network",
  });

  const suOn = suData?.systemUpdate?.enabled === true;
  const mbOn = mbData?.maintenanceBanner?.enabled === true;

  const renderPill = (key, label, on) => (
    <button
      type="button"
      role="tab"
      aria-selected={active === key}
      className={`${classes.pill} ${active === key ? classes.pillActive : ""}`}
      onClick={() => setActive(key)}
    >
      <span className={`${classes.dot} ${on ? classes.dotOn : ""}`} />
      {label}
    </button>
  );

  return (
    <div className={classes.section}>
      <Header>Системные уведомления</Header>

      <div className={classes.card}>
        <div className={classes.pills} role="tablist">
          {renderPill("systemUpdate", "Что нового", suOn)}
          {renderPill("maintenance", "Плашка техработ", mbOn)}
        </div>

        {active === "systemUpdate" ? (
          <SystemUpdateSettings />
        ) : (
          <MaintenanceBannerSettings />
        )}
      </div>
    </div>
  );
}

export default SystemNotificationsSettings;
