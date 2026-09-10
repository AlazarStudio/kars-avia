import React from "react";
import classes from "./FapReportStageChip.module.css";
import { formatDateTime } from "../fapConstants";
import {
  REPORT_STEPS,
  REPORT_STAGE_DONE,
  reportStageLabel,
  requestReportSummary,
} from "../fapReportStages";

// Чип стадии отчёта в шапке карточки списка заявок ФАП: три шага самой
// отстающей гостиницы, при наведении — шаги и даты по каждой видимой гостинице.
export default function FapReportStageChip({ request, user }) {
  const summary = requestReportSummary(request, user);
  if (!summary) return null;

  const { stage, laggingCount, total, hotels } = summary;
  const label = reportStageLabel(stage);
  const allDone = stage === REPORT_STAGE_DONE;

  return (
    <span className={classes.wrap}>
      <span
        className={`${classes.chip} ${allDone ? classes.chipDone : ""}`}
        aria-label={`Отчёт: ${label}`}
      >
        <span className={classes.caption}>Отчёт</span>
        <span className={classes.steps}>
          {REPORT_STEPS.map((step, i) => (
            <React.Fragment key={step.done}>
              {i > 0 && (
                <span className={`${classes.conn} ${i < stage ? classes.connDone : ""}`} />
              )}
              <span className={`${classes.dot} ${i < stage ? classes.dotDone : ""}`}>
                {i < stage ? "✓" : null}
              </span>
            </React.Fragment>
          ))}
        </span>
        <span className={classes.text}>{label}</span>
        {total > 1 && !allDone && (
          <span className={classes.count}>
            {laggingCount} из {total}
          </span>
        )}
      </span>

      <span className={classes.tooltip}>
        {hotels.map((hotel) => (
          <span key={hotel.index} className={classes.tipHotel}>
            <span className={classes.tipName}>{hotel.name}</span>
            {/* Неотправленный отчёт — одна строка: остальные шаги без отправки
                невозможны. */}
            {(hotel.stage === 0 ? REPORT_STEPS.slice(0, 1) : REPORT_STEPS).map((step, i) => {
              const done = i < hotel.stage;
              return (
                <span
                  key={step.done}
                  className={`${classes.tipStep} ${done ? "" : classes.tipStepWait}`}
                >
                  <span className={`${classes.dot} ${done ? classes.dotDone : classes.dotOnDark}`}>
                    {done ? "✓" : null}
                  </span>
                  {done ? step.done : step.wait}
                  {done && <span className={classes.tipDate}>{formatDateTime(hotel.dates[i])}</span>}
                </span>
              );
            })}
          </span>
        ))}
      </span>
    </span>
  );
}
