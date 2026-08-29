import React from "react";
import { format, isToday, isWeekend } from "date-fns";
import { ru } from "date-fns/locale";
import { dayCellBg } from "../utils/placementPeriod";
import classes from "./GridHeader.module.css";

// view: "month" | "week"; period: результат buildPeriod; dayW: ширина дня в px
const GridHeader = ({ view, period, dayW, onSetView, onShift, onToday }) => {
  const dayLabel = (day) => {
    if (view !== "week") return format(day, "d");
    // ru-локаль отдаёт «пн» — в макете день недели с заглавной: «Пн 24»
    const weekday = format(day, "EEEEEE", { locale: ru });
    return `${weekday.charAt(0).toUpperCase()}${weekday.slice(1)} ${format(day, "d")}`;
  };

  return (
    <div className={classes.header}>
      <div className={classes.corner}>
        <div className={classes.viewPill}>
          <button
            type="button"
            className={`${classes.viewTab} ${view === "week" ? classes.viewTabActive : ""}`}
            onClick={() => onSetView("week")}
          >
            Неделя
          </button>
          <button
            type="button"
            className={`${classes.viewTab} ${view === "month" ? classes.viewTabActive : ""}`}
            onClick={() => onSetView("month")}
          >
            Месяц
          </button>
        </div>
        <button type="button" className={classes.todayButton} onClick={onToday}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#0057C3" strokeWidth="2" strokeLinecap="round">
            <circle cx="12" cy="12" r="9" />
            <circle cx="12" cy="12" r="2.5" fill="#0057C3" />
          </svg>
          Сегодня
        </button>
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
