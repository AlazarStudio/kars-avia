import PropTypes from "prop-types";
import classes from "./ReportDraftTable.module.css";
import ReportDraftRow from "./ReportDraftRow";
import ReportDraftSkeleton from "./ReportDraftSkeleton";
import ReportDraftEmptyState from "./ReportDraftEmptyState";

// Таблица строк черновика: закреплённая шапка колонок + прокручиваемое тело.
// Тело — скелетон (первая загрузка), одно из двух пустых состояний или
// строки. Порядковый номер строки (первая колонка) считается по позиции в
// ПОЛНОМ списке rows, а не в отфильтрованном displayedRows — иначе при
// переключении фильтра/поиске у одного и того же человека менялся бы номер.
export default function ReportDraftTable({
  loading,
  rows,
  displayedRows,
  editedUids,
  fieldEdited,
  onCellChange,
  onCellFocus,
  onCellBlur,
  onResetRow,
  onRequestDeleteRow,
  onResetFilters,
}) {
  const rowNumbers = new Map(rows.map((row, i) => [row._uid, i + 1]));

  let body;
  if (loading && rows.length === 0) {
    body = <ReportDraftSkeleton />;
  } else if (rows.length === 0) {
    body = <ReportDraftEmptyState variant="no-rows" />;
  } else if (displayedRows.length === 0) {
    body = <ReportDraftEmptyState variant="no-match" onResetFilters={onResetFilters} />;
  } else {
    body = displayedRows.map((row) => (
      <ReportDraftRow
        key={row._uid}
        row={row}
        number={rowNumbers.get(row._uid)}
        isEdited={editedUids.has(row._uid)}
        fieldEdited={fieldEdited}
        onCellChange={onCellChange}
        onCellFocus={onCellFocus}
        onCellBlur={onCellBlur}
        onResetRow={onResetRow}
        onRequestDelete={onRequestDeleteRow}
      />
    ));
  }

  return (
    <>
      <div className={classes.headRow}>
        <div className={`${classes.colIndex} ${classes.stickyIndex}`}>№</div>
        <div className={`${classes.colPassenger} ${classes.stickyPassenger}`}>Пассажир</div>
        <div className={classes.colRoom}>Номер</div>
        <div className={classes.colStay}>Проживание</div>
        <div className={classes.colDays}>Сут.</div>
        <div className={classes.colPrice}>Цена/сут.</div>
        <div className={classes.colLiving}>Проживание ₽</div>
        <div className={classes.colMeal}>Питание</div>
        <div className={classes.colTotal}>Итого</div>
        <div className={classes.colActions} />
      </div>

      <div className={classes.body}>{body}</div>
    </>
  );
}

ReportDraftTable.propTypes = {
  loading: PropTypes.bool,
  rows: PropTypes.array.isRequired,
  displayedRows: PropTypes.array.isRequired,
  editedUids: PropTypes.instanceOf(Set).isRequired,
  fieldEdited: PropTypes.func.isRequired,
  onCellChange: PropTypes.func.isRequired,
  onCellFocus: PropTypes.func,
  onCellBlur: PropTypes.func,
  onResetRow: PropTypes.func.isRequired,
  onRequestDeleteRow: PropTypes.func.isRequired,
  onResetFilters: PropTypes.func.isRequired,
};
