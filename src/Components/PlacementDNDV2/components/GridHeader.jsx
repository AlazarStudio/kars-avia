import React from "react";
import { format, isToday, isWeekend } from "date-fns";
import { ru } from "date-fns/locale";
import { dayCellBg } from "../utils/placementPeriod";
import classes from "./GridHeader.module.css";

const VIEW_TABS = [
  { value: "week", label: "Неделя" },
  { value: "decade", label: "Декада" },
  { value: "month", label: "Месяц" },
];

// view: "month" | "decade" | "week"; period: buildPeriod; dayW: ширина дня в px
const GridHeader = ({ view, period, dayW, onSetView, onShift }) => {
  const dayLabel = (day) => {
    // В месяце колонок 28–31 — влезает только число. Неделя и декада широкие,
    // там подписываем день недели: «Пн 24».
    if (view === "month") return format(day, "d");
    // ru-локаль отдаёт «пн» — в макете день недели с заглавной
    const weekday = format(day, "EEEEEE", { locale: ru });
    return `${weekday.charAt(0).toUpperCase()}${weekday.slice(1)} ${format(day, "d")}`;
  };

  return (
    <div className={classes.header}>
      <div className={classes.corner}>
        <div className={classes.viewPill}>
          {VIEW_TABS.map((tab) => (
            <button
              key={tab.value}
              type="button"
              className={`${classes.viewTab} ${view === tab.value ? classes.viewTabActive : ""}`}
              onClick={() => onSetView(tab.value)}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className={classes.right}>
        <div className={classes.periodRow}>
          <div className={classes.periodInner}>
            <svg
              className={classes.arrow}
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#545873"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              onClick={() => onShift(-1)}
            >
              <path d="m15 18-6-6 6-6" />
            </svg>
            <span className={classes.periodTitle}>{period.title}</span>
            <svg
              className={classes.arrow}
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#545873"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              onClick={() => onShift(1)}
            >
              <path d="m9 6 6 6-6 6" />
            </svg>
          </div>
        </div>

        <div className={classes.daysRow}>
          {period.days.map((day) => {
            const today = isToday(day);
            return (
              <div
                key={day.getTime()}
                className={classes.dayCell}
                style={{
                  width: `${dayW}px`,
                  minWidth: `${dayW}px`,
                  background: dayCellBg(day),
                }}
              >
                <span
                  className={`${classes.dayPill} ${today ? classes.dayPillToday : ""} ${
                    !today && isWeekend(day) ? classes.dayPillWeekend : ""
                  }`}
                >
                  {dayLabel(day)}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default GridHeader;
