import PropTypes from "prop-types";
import classes from "./ReportDraftErrorBanner.module.css";
import { pluralizeRows } from "./reportDraftEditorUtils";

// Показывается, когда последнее сохранение упало. Ошибка при этом всё равно
// уходит в системный тост (см. ReportDraftEditor) — баннер держит сообщение
// на экране дольше, чем автоскрывающийся тост.
//
// Два разных случая, и различать их важно:
//
// 1. `oversize` задан — строк в черновике больше, чем уходит за одну
//    отправку. Повторная попытка это не обойдёт, поэтому кнопки «Повторить»
//    здесь нет: она бы только гоняла заведомо мёртвый запрос. Пользователю
//    называем то, чем он управляет, — число строк и период отчёта. Байты и
//    лимит запроса ему ничего не говорят и остаются в консоли.
// 2. `oversize` не задан — причина неизвестна (сеть, бэк, что угодно).
//    Тогда и не утверждаем ничего конкретного, а даём повторить.
export default function ReportDraftErrorBanner({ onRetry, retrying, oversize }) {
  return (
    <div className={classes.banner}>
      <div className={classes.mark}>!</div>
      <div className={classes.copy}>
        <div className={classes.title}>
          {oversize
            ? "Черновик не сохранён: слишком много строк"
            : "Не удалось сохранить черновик"}
        </div>
        <div className={classes.text}>
          {oversize ? (
            <>
              В черновике {oversize.rowCount} {pluralizeRows(oversize.rowCount)}, сохранить
              получается примерно до {oversize.maxRows}. Соберите отчёт за более короткий
              период — правки останутся в браузере.
            </>
          ) : (
            "Сервер не ответил. Правки остались в браузере и не потеряны — повторите попытку."
          )}
        </div>
      </div>
      {!oversize && (
        <button
          type="button"
          className={classes.retryBtn}
          disabled={retrying}
          onClick={onRetry}
        >
          {retrying ? "Сохранение…" : "Повторить"}
        </button>
      )}
    </div>
  );
}

ReportDraftErrorBanner.propTypes = {
  onRetry: PropTypes.func.isRequired,
  retrying: PropTypes.bool,
  oversize: PropTypes.shape({
    rowCount: PropTypes.number.isRequired,
    maxRows: PropTypes.number.isRequired,
  }),
};
