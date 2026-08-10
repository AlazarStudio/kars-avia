import PropTypes from "prop-types";
import classes from "./ReportDraftFooter.module.css";
import { formatMoney } from "./reportDraftEditorUtils";

// Подвал таблицы черновика: слева — сводка по текущему виду (показано/
// изменено/предупреждения/удалено), справа — расчёт сервера, дельта правок и
// итоговая сумма к оплате.
export default function ReportDraftFooter({
  shownCount,
  totalCount,
  editedCount,
  warningsCount,
  deletedCount,
  total,
  serverTotal,
}) {
  const delta = total - serverTotal;
  const deltaClass =
    delta === 0 ? classes.deltaZero : delta > 0 ? classes.deltaPositive : classes.deltaNegative;
  const deltaSign = delta > 0 ? "+" : delta < 0 ? "−" : "";
  const deltaText = `${deltaSign}${formatMoney(Math.abs(delta))} ₽`;

  return (
    <div className={classes.footer}>
      <div className={classes.summary}>
        Показано {shownCount} из {totalCount} · изменено {editedCount} · с предупреждениями{" "}
        {warningsCount}
        {deletedCount > 0 ? ` · удалено ${deletedCount}` : ""}
      </div>

      <div className={classes.totals}>
        <div className={classes.serverLine}>
          Расчёт сервера {formatMoney(serverTotal)} ₽ · правки{" "}
          <span className={deltaClass}>{deltaText}</span>
        </div>
        <div className={classes.totalLabel}>Итого к оплате</div>
        <div className={classes.totalValue}>{formatMoney(total)} ₽</div>
      </div>
    </div>
  );
}

ReportDraftFooter.propTypes = {
  shownCount: PropTypes.number.isRequired,
  totalCount: PropTypes.number.isRequired,
  editedCount: PropTypes.number.isRequired,
  warningsCount: PropTypes.number.isRequired,
  deletedCount: PropTypes.number.isRequired,
  total: PropTypes.number.isRequired,
  serverTotal: PropTypes.number.isRequired,
};
