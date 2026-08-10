import PropTypes from "prop-types";
import classes from "./ReportDraftTable.module.css";
import RestoreIcon from "../../../../shared/icons/RestoreIcon";
import { TrashIcon } from "../ReportsV2Icons";
import { rowNeedsDays, rowNeedsPrice } from "../reportDraftRows";
import {
  formatMoney,
  getArrivalHighlight,
  getDepartureHighlight,
  livingCostTooltip,
  splitDateTime,
} from "./reportDraftEditorUtils";

// Одна строка таблицы черновика. Чисто UI: получает уже готовую строку и
// колбэки, всю логику (что такое "правлено", что сохранять) решает вызывающий
// код (ReportDraftEditor/useReportDraft).
export default function ReportDraftRow({
  row,
  number,
  isEdited,
  fieldEdited,
  onCellChange,
  onResetRow,
  onRequestDelete,
}) {
  const needsDays = rowNeedsDays(row);
  const needsPrice = rowNeedsPrice(row);
  const hasWarning = needsDays || needsPrice;
  const personLabel = row.personName || "без имени";

  const arrival = splitDateTime(row.arrival);
  const departure = splitDateTime(row.departure);
  const arrivalHighlight = getArrivalHighlight(row.arrival);
  const departureHighlight = getDepartureHighlight(row.departure);

  const daysEdited = fieldEdited(row, "totalDays");
  const priceEdited = fieldEdited(row, "pricePerDay");
  const mealEdited = fieldEdited(row, "totalMealCost");

  const livingCost = Number(row.totalLivingCost) || 0;

  const rowClassName = [
    classes.row,
    hasWarning ? classes.rowWarning : isEdited ? classes.rowEdited : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={rowClassName}>
      <span className={classes.stripe} />

      <div className={`${classes.colIndex} ${classes.stickyIndex}`}>{number}</div>

      <div
        className={`${classes.colPassenger} ${classes.stickyPassenger}`}
        title={row.shareNote || undefined}
      >
        <div className={classes.cellStack}>
          <div className={classes.personName}>{row.personName || "—"}</div>
          <div className={classes.personPosition}>{row.personPosition || "—"}</div>
        </div>
      </div>

      <div className={classes.colRoom}>
        <div className={classes.cellStack}>
          <div className={classes.roomName}>{row.roomName || "—"}</div>
          <div className={classes.roomCategory}>{row.category || "—"}</div>
        </div>
      </div>

      <div className={classes.colStay}>
        <div className={classes.cellStay}>
          <div className={classes.stayLine}>
            {arrival.date}{" "}
            <span
              className={arrivalHighlight.highlighted ? classes.stayTimeWarn : undefined}
              title={arrivalHighlight.title}
            >
              {arrival.time}
            </span>
          </div>
          <div className={classes.stayLine}>
            {departure.date}{" "}
            <span
              className={departureHighlight.highlighted ? classes.stayTimeWarn : undefined}
              title={departureHighlight.title}
            >
              {departure.time}
            </span>
          </div>
        </div>
      </div>

      <div className={classes.colDays}>
        <div className={classes.cellField}>
          <div className={classes.fieldWrap}>
            <input
              type="number"
              name="days"
              inputMode="decimal"
              step={0.5}
              min={0}
              className={
                needsDays ? `${classes.inputDays} ${classes.inputNeedsValue}` : classes.inputDays
              }
              value={row.totalDays ?? ""}
              aria-label={`Сутки проживания — ${personLabel}`}
              onChange={(e) => onCellChange(row._uid, "totalDays", e.target.value)}
            />
            {daysEdited && <span className={classes.editedDot} />}
          </div>
          {needsDays && <span className={classes.needCaption}>нет суток</span>}
        </div>
      </div>

      <div className={classes.colPrice}>
        <div className={classes.cellField}>
          <div className={classes.fieldWrap}>
            <input
              type="number"
              name="pricePerDay"
              inputMode="decimal"
              step={1}
              min={0}
              className={
                needsPrice
                  ? `${classes.inputPrice} ${classes.inputNeedsValue}`
                  : classes.inputPrice
              }
              value={row.pricePerDay ?? ""}
              aria-label={`Цена за сутки — ${personLabel}`}
              onChange={(e) => onCellChange(row._uid, "pricePerDay", e.target.value)}
            />
            {priceEdited && <span className={classes.editedDot} />}
          </div>
          {needsPrice && <span className={classes.needCaption}>нет цены</span>}
        </div>
      </div>

      <div
        className={classes.colLiving}
        title={livingCostTooltip(row, isEdited)}
      >
        <span className={livingCost === 0 ? `${classes.livingValue} ${classes.livingZero}` : classes.livingValue}>
          {formatMoney(row.totalLivingCost)}
        </span>
      </div>

      <div className={classes.colMeal}>
        <div className={classes.cellField}>
          <div className={classes.fieldWrap}>
            <input
              type="number"
              name="mealCost"
              inputMode="decimal"
              step={1}
              min={0}
              className={
                mealEdited ? `${classes.inputMeal} ${classes.inputMealEdited}` : classes.inputMeal
              }
              value={row.totalMealCost ?? ""}
              aria-label={`Стоимость питания — ${personLabel}`}
              onChange={(e) => onCellChange(row._uid, "totalMealCost", e.target.value)}
            />
            {mealEdited && <span className={classes.editedDot} />}
          </div>
          <div className={classes.mealCounts}>
            {row.breakfastCount ?? 0}/{row.lunchCount ?? 0}/{row.dinnerCount ?? 0}
          </div>
        </div>
      </div>

      <div className={classes.colTotal}>
        <span className={classes.totalValue}>{formatMoney(row.totalDebt)}</span>
      </div>

      <div className={classes.colActions}>
        <div className={classes.actionsCell}>
          {isEdited && (
            <button
              type="button"
              className={`${classes.iconBtn} ${classes.revertBtn}`}
              title="Вернуть расчёт сервера"
              aria-label={`Вернуть расчёт сервера — ${personLabel}`}
              onClick={() => onResetRow(row._uid)}
            >
              <RestoreIcon width={16} height={16} color="#0057C3" cursor="pointer" />
            </button>
          )}
          <button
            type="button"
            className={`${classes.iconBtn} ${classes.deleteBtn}`}
            title="Удалить строку"
            aria-label={`Удалить строку — ${personLabel}`}
            onClick={() => onRequestDelete(row)}
          >
            <TrashIcon size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}

ReportDraftRow.propTypes = {
  row: PropTypes.object.isRequired,
  number: PropTypes.number.isRequired,
  isEdited: PropTypes.bool,
  fieldEdited: PropTypes.func.isRequired,
  onCellChange: PropTypes.func.isRequired,
  onResetRow: PropTypes.func.isRequired,
  onRequestDelete: PropTypes.func.isRequired,
};
