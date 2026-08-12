import PropTypes from "prop-types";
import classes from "./ReportDraftTable.module.css";
import ReportDraftRow from "./ReportDraftRow";
import ReportDraftSkeleton from "./ReportDraftSkeleton";
import ReportDraftEmptyState from "./ReportDraftEmptyState";
import { buildShareClusters } from "../reportDraftRows";

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
  hoveredCluster,
  onHoverCluster,
}) {
  const rowNumbers = new Map(rows.map((row, i) => [row._uid, i + 1]));
  // Группы считаем по ПОЛНОМУ списку строк, а не по отфильтрованному: номер
  // группы не должен меняться от того, что часть соседей отсеял фильтр.
  const clusters = buildShareClusters(rows);

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
        cluster={clusters.get(row.shareClusterId)}
        clusterHighlighted={
          Boolean(hoveredCluster) && row.shareClusterId === hoveredCluster
        }
        onHoverCluster={onHoverCluster}
      />
    ));
  }

  return (
    <>
      {/* Заголовки — дословно из печатной формы реестра, чтобы экран сверялся
          с Excel без перевода. Порядок тоже её, кроме «Сотрудника» (закреплён
          вторым ради прокрутки) и «Цены/сут.» (поля редактора в форме нет). */}
      <div className={classes.headRow}>
        <div className={`${classes.colIndex} ${classes.stickyIndex}`}>№</div>
        <div className={`${classes.colPassenger} ${classes.stickyPassenger}`}>Сотрудник</div>
        <div className={classes.colArrival}>Дата/время заезда</div>
        <div className={classes.colDeparture}>Дата/время выезда</div>
        <div className={classes.colDays}>Кол-во суток</div>
        <div className={classes.colCategory}>Категория номера</div>
        <div className={classes.colRoom}>Комната</div>
        <div className={classes.colShare}>Вид проживания</div>
        <div className={classes.colPosition}>Должность</div>
        <div className={classes.colBreakfast}>Завтрак</div>
        <div className={classes.colLunch}>Обед</div>
        <div className={classes.colDinner}>Ужин</div>
        <div className={classes.colMeal}>Стоимость питания</div>
        <div className={classes.colPrice}>Цена/сут.</div>
        <div className={classes.colLiving}>Стоимость проживания</div>
        <div className={classes.colTotal}>Итоговая стоимость</div>
        <div className={classes.colHotel}>Гостиница</div>
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
  hoveredCluster: PropTypes.string,
  onHoverCluster: PropTypes.func,
};
