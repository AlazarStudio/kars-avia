import React from "react";
import classes from "./FapCancelledBanner.module.css";
import { isRequestCancelled } from "../fapConstants";

// Полоса «заявка отменена» для экранов услуг и реестра.
//
// Отмена заявки статусы услуг НЕ меняет (бэк каскада не делает), поэтому на
// экране услуги бейдж по-прежнему показывает «В работе», и без этой полосы
// понять, что заявка закрыта, нельзя вовсе — а редактирование теперь заблокировано.
export default function FapCancelledBanner({ request }) {
  if (!isRequestCancelled(request)) return null;

  return (
    <div className={classes.banner}>
      <span className={classes.title}>Заявка отменена</span>
      <span className={classes.text}>
        Редактирование закрыто. Статусы услуг остались теми, что были на момент
        отмены.
      </span>
    </div>
  );
}
