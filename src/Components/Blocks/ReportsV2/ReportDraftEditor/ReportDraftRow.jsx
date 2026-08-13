import PropTypes from "prop-types";
import classes from "./ReportDraftTable.module.css";
import RestoreIcon from "../../../../shared/icons/RestoreIcon";
import DeleteIcon from "../../../../shared/icons/DeleteIcon";
import { rowHasWarning, rowNeedsDays, rowNeedsPrice } from "../reportDraftRows";
import {
  formatDays,
  formatMoney,
  getArrivalHighlight,
  getDepartureHighlight,
  livingCostTooltip,
  splitDateTime,
  describeShareSegments,
  listCohabitants,
  editableValue,
} from "./reportDraftEditorUtils";

// Одна строка таблицы черновика. Чисто UI: получает уже готовую строку и
// колбэки, всю логику (что такое "правлено", что сохранять) решает вызывающий
// код (ReportDraftEditor/useReportDraft).
//
// Набор и порядок колонок повторяют печатную форму реестра (см. `presentation`
// с бэка): заезд, выезд, сутки, категория, комната, вид проживания, должность,
// завтрак/обед/ужин по отдельности, стоимости, гостиница. Свёрнутых пар вроде
// «ФИО + должность в одной ячейке» больше нет — заказчик сверяет экран с Excel
// построчно, и склейка ему мешала.
//
// Два отступления от формы, оба намеренные:
//  - ФИО стоит вторым и закреплено по горизонтали: таблица шире экрана, и без
//    закреплённого имени при прокрутке вправо непонятно, чья это строка;
//  - «Цена/сут.» в форме нет вовсе — это поле редактора, из которого считается
//    стоимость проживания. Стоит рядом с ней.
export default function ReportDraftRow({
  row,
  number,
  isEdited,
  fieldEdited,
  onCellChange,
  onCellFocus,
  onCellBlur,
  onResetRow,
  onRequestDelete,
  cluster,
  clusterHighlighted,
  onHoverCluster,
  canEdit = true,
}) {
  // Пока курсор в любом поле строки, строка держится в выборке, даже если
  // перестала подходить под фильтр (см. useEditingPins). Без этого строка без
  // цены исчезает из «Предупреждений» на первой же введённой цифре.
  const cellFocusProps = {
    onFocus: () => onCellFocus?.(row._uid),
    onBlur: () => onCellBlur?.(row._uid),
  };
  const needsDays = rowNeedsDays(row);
  const needsPrice = rowNeedsPrice(row);
  const hasWarning = rowHasWarning(row);
  const personLabel = row.personName || "без имени";

  const arrival = splitDateTime(row.arrival);
  const departure = splitDateTime(row.departure);
  const arrivalHighlight = getArrivalHighlight(row.arrival);
  const departureHighlight = getDepartureHighlight(row.departure);

  const daysEdited = fieldEdited(row, "totalDays");
  const priceEdited = fieldEdited(row, "pricePerDay");
  const mealEdited = fieldEdited(row, "totalMealCost");

  const livingCost = Number(row.totalLivingCost) || 0;

  // Структурные данные о подселении (shareSegments) вместо разбора текстового
  // shareNote: из них видно и кто сосед, и в какие именно интервалы.
  const cohabitants = listCohabitants(row.shareSegments);
  const shareSegments = describeShareSegments(row.shareSegments);
  const shareTitle =
    shareSegments.length > 0
      ? shareSegments
          .map((s) => `${s.period}: ${s.alone ? "жил один" : `с ${s.names.join(", ")}`}`)
          .join("\n")
      : row.shareNote || undefined;

  const rowClassName = [
    classes.row,
    hasWarning ? classes.rowWarning : isEdited ? classes.rowEdited : "",
    // Подсветка всей группы соседей — включается наведением на любую её строку.
    clusterHighlighted ? classes.rowClusterMatch : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={rowClassName}>
      <div className={`${classes.colIndex} ${classes.stickyIndex}`}>{number}</div>

      <div className={`${classes.colPassenger} ${classes.stickyPassenger}`}>
        <div className={classes.personName} title={row.personName || undefined}>
          {row.personName || "—"}
        </div>
      </div>

      <div className={classes.colArrival}>
        {arrival.date}{" "}
        <span
          className={arrivalHighlight.highlighted ? classes.stayTimeWarn : undefined}
          title={arrivalHighlight.title}
        >
          {arrival.time}
        </span>
      </div>

      <div className={classes.colDeparture}>
        {departure.date}{" "}
        <span
          className={departureHighlight.highlighted ? classes.stayTimeWarn : undefined}
          title={departureHighlight.title}
        >
          {departure.time}
        </span>
      </div>

      <div className={classes.colDays}>
        <div className={classes.cellField}>
          {canEdit ? (
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
                value={editableValue(row.totalDays)}
                placeholder="0"
                aria-label={`Сутки проживания — ${personLabel}`}
                onChange={(e) => onCellChange(row._uid, "totalDays", e.target.value)}
                {...cellFocusProps}
              />
              {daysEdited && <span className={classes.editedDot} />}
            </div>
          ) : (
            <span>{formatDays(row.totalDays)}</span>
          )}
          {needsDays && <span className={classes.needCaption}>нет суток</span>}
        </div>
      </div>

      <div className={classes.colCategory} title={row.category || undefined}>
        {row.category || "—"}
      </div>

      <div className={classes.colRoom} title={row.roomName || undefined}>
        {row.roomName || "—"}
      </div>

      {/* «Вид проживания» — с кем именно делили номер. Именно из-за подселения
          стоимость номера делится между жильцами, поэтому это не украшение,
          а объяснение суммы в строке. */}
      <div
        className={cohabitants.length > 0 ? classes.colShareWith : classes.colShare}
        title={shareTitle}
        onMouseEnter={cluster ? () => onHoverCluster?.(row.shareClusterId) : undefined}
        onMouseLeave={cluster ? () => onHoverCluster?.(null) : undefined}
      >
        {/* Номер группы совместного проживания: одинаковый у всех жильцов
            номера. Строки в таблице стоят в порядке реестра и вперемешку,
            поэтому без метки соседей глазами не сопоставить. */}
        {cluster && (
          <span className={classes.clusterBadge} title="Группа совместного проживания">
            {cluster.number}
          </span>
        )}
        {cohabitants.length > 0 ? `с ${cohabitants.join(", ")}` : "жил один"}
      </div>

      <div className={classes.colPosition} title={row.personPosition || undefined}>
        {row.personPosition || "—"}
      </div>

      <div className={classes.colBreakfast}>{row.breakfastCount ?? 0}</div>
      <div className={classes.colLunch}>{row.lunchCount ?? 0}</div>
      <div className={classes.colDinner}>{row.dinnerCount ?? 0}</div>

      <div className={classes.colMeal}>
        <div className={classes.cellField}>
          {canEdit ? (
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
                value={editableValue(row.totalMealCost)}
                placeholder="0"
                aria-label={`Стоимость питания — ${personLabel}`}
                onChange={(e) => onCellChange(row._uid, "totalMealCost", e.target.value)}
                {...cellFocusProps}
              />
              {mealEdited && <span className={classes.editedDot} />}
            </div>
          ) : (
            <span>{formatMoney(row.totalMealCost)}</span>
          )}
        </div>
      </div>

      <div className={classes.colPrice}>
        <div className={classes.cellField}>
          {canEdit ? (
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
                value={editableValue(row.pricePerDay)}
                placeholder="0"
                aria-label={`Цена за сутки — ${personLabel}`}
                onChange={(e) => onCellChange(row._uid, "pricePerDay", e.target.value)}
                {...cellFocusProps}
              />
              {priceEdited && <span className={classes.editedDot} />}
            </div>
          ) : (
            <span>{formatMoney(row.pricePerDay)}</span>
          )}
          {needsPrice && <span className={classes.needCaption}>нет цены</span>}
        </div>
      </div>

      <div className={classes.colLiving} title={livingCostTooltip(row, isEdited)}>
        <span
          className={
            livingCost === 0 ? `${classes.livingValue} ${classes.livingZero}` : classes.livingValue
          }
        >
          {formatMoney(row.totalLivingCost)}
        </span>
      </div>

      <div className={classes.colTotal}>
        <span className={classes.totalValue}>{formatMoney(row.totalDebt)}</span>
      </div>

      <div className={classes.colHotel} title={row.hotelName || undefined}>
        {row.hotelName || "—"}
      </div>

      <div className={classes.colActions}>
        {canEdit && (
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
              {/* color="currentColor" обязателен: DeleteIcon по умолчанию зашивает
                  #545873 в stroke, и без этого перекрашивание при наведении
                  (.deleteBtn:hover в ReportDraftTable.module.css) перестало бы
                  работать. */}
              <DeleteIcon width={16} height={16} color="currentColor" cursor="pointer" />
            </button>
          </div>
        )}
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
  onCellFocus: PropTypes.func,
  onCellBlur: PropTypes.func,
  onResetRow: PropTypes.func.isRequired,
  onRequestDelete: PropTypes.func.isRequired,
  cluster: PropTypes.shape({ number: PropTypes.number }),
  clusterHighlighted: PropTypes.bool,
  onHoverCluster: PropTypes.func,
  canEdit: PropTypes.bool,
};
