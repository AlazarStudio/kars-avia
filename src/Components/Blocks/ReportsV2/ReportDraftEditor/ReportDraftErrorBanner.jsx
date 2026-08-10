import PropTypes from "prop-types";
import classes from "./ReportDraftErrorBanner.module.css";

// Показывается, когда последнее сохранение упало. Ошибка при этом всё равно
// уходит в системный тост (см. ReportDraftEditor) — баннер держит сообщение
// на экране дольше, чем автоскрывающийся тост, и даёт повторить попытку, не
// уходя искать кнопку "Сохранить" в шапке.
export default function ReportDraftErrorBanner({ onRetry, retrying }) {
  return (
    <div className={classes.banner}>
      <div className={classes.mark}>!</div>
      <div className={classes.copy}>
        <div className={classes.title}>Не удалось сохранить черновик</div>
        <div className={classes.text}>
          Сервер не ответил. Правки остались в браузере и не потеряны — повторите попытку.
        </div>
      </div>
      <button type="button" className={classes.retryBtn} disabled={retrying} onClick={onRetry}>
        {retrying ? "Сохранение…" : "Повторить"}
      </button>
    </div>
  );
}

ReportDraftErrorBanner.propTypes = {
  onRetry: PropTypes.func.isRequired,
  retrying: PropTypes.bool,
};
