import React from "react";
import classes from "./ServiceProgressDot.module.css";
import { SERVICE_CONFIG, SERVICE_STATUS_CONFIG } from "../fapConstants";
import WaterIcon from "../../../../shared/icons/WaterIcon";
import MealIcon from "../../../../shared/icons/MealIcon";
import HotelBedIcon from "../../../../shared/icons/HotelBedIcon";
import BusIcon from "../../../../shared/icons/BusIcon";
import BusDownIcon from "../../../../shared/icons/BusDownIcon";
import BaggageIcon from "../../../../shared/icons/BaggageIcon";

const ICON_MAP = {
  water: WaterIcon,
  meal: MealIcon,
  living: HotelBedIcon,
  transfer: BusIcon,
  transferDeparture: BusDownIcon,
  baggage: BaggageIcon,
};

const DISABLED_STATUS_LABEL = "не подключено";

// Размер по умолчанию — компактная плитка-иконка услуги. В списке заявок используется size=40.
export default function ServiceProgressDot({
  serviceKey,
  status,
  size = 28,
  disabled = false,
}) {
  const cfg = SERVICE_CONFIG[serviceKey];
  if (!cfg) return null;

  if (disabled) {
    return (
      <span className={classes.wrap}>
        <span
          className={classes.placeholder}
          style={{ width: size, height: size }}
        />
        <span className={classes.tooltip}>
          {cfg.label}
          <span className={classes.tooltipStatus}>{DISABLED_STATUS_LABEL}</span>
        </span>
      </span>
    );
  }

  const Icon = ICON_MAP[serviceKey];
  const statusCfg = SERVICE_STATUS_CONFIG[status] || {};

  const isDone = status === "COMPLETED";
  const isProg = status === "IN_PROGRESS";
  const isCanc = status === "CANCELLED";
  const isNew = status === "NEW";

  const bg = isCanc ? "#FEF2F2" : cfg.bg;
  const fg = isCanc ? "#EF4444" : cfg.color;

  const iconPx = Math.round(size * 0.58);
  const statusLabel = statusCfg.label || status || "—";

  return (
    <span className={classes.wrap}>
      <span
        className={classes.dot}
        style={{
          width: size,
          height: size,
          background: bg,
          color: fg,
          opacity: isNew ? 0.7 : 1,
        }}
      >
        {Icon ? <Icon size={iconPx} strokeWidth={2} /> : null}
        {isDone && (
          <span className={classes.badge} style={{ background: "#10B981" }}>
            <svg width="7" height="7" viewBox="0 0 24 24" fill="none">
              <path
                d="M4 12l5 5L20 6"
                stroke="#fff"
                strokeWidth="4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
        )}
        {isProg && (
          <span className={classes.badge} style={{ background: "#F59E0B" }} />
        )}
        {isCanc && (
          <span
            className={classes.badge}
            style={{ background: "#EF4444", color: "#fff" }}
          >
            ×
          </span>
        )}
      </span>
      <span className={classes.tooltip}>
        {cfg.label}
        <span className={classes.tooltipStatus}>{statusLabel}</span>
      </span>
    </span>
  );
}
