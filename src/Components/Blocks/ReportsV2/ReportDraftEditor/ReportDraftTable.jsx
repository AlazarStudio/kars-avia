import PropTypes from "prop-types";
import classes from "./ReportDraftTable.module.css";
import ReportDraftRow from "./ReportDraftRow";
import ReportDraftSkeleton from "./ReportDraftSkeleton";
import ReportDraftEmptyState from "./ReportDraftEmptyState";
import { buildShareClusters, groupRowsByHotel } from "../reportDraftRows";
import ReportDraftGroupHeader from "./ReportDraftGroupHeader";

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
  snapshotValue,
  editableFields,
  positions,
  roomMates,
  onCellChange,
  onCellFocus,
  onCellBlur,
  onResetRow,
  onRequestDeleteRow,
  onResetFilters,
  hoveredCluster,
  onHoverCluster,
  rules,
  groupBy,
  collapsedHotels,
  onToggleHotel,
  narrowed,
  canEdit = true,
  sortKey,
  sortDir,
  onSort,
}) {
  const rowNumbers = new Map(rows.map((row, i) => [row._uid, i + 1]));

  // №58 · Кликабельный заголовок сортируемой колонки. Сортировка визуальная
  // (порядок файла не трогается), поэтому доступна и в режиме чтения.
  const Th = ({ cls, k, children }) =>
    k && onSort ? (
      <div
        className={`${cls} ${classes.sortableHead}`}
        role="button"
        tabIndex={0}
        title="Клик — по возрастанию, ещё раз — по убыванию, третий — как в файле"
        onClick={() => onSort(k)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onSort(k);
          }
        }}
      >
        {children}
        {sortKey === k && (
          <span className={classes.sortArrow}>{sortDir === "asc" ? "▲" : "▼"}</span>
        )}
      </div>
    ) : (
      <div className={cls}>{children}</div>
    );
  // Группы считаем по ПОЛНОМУ списку строк, а не по отфильтрованному: номер
  // группы не должен меняться от того, что часть соседей отсеял фильтр.
  const clusters = buildShareClusters(rows);

  // Отрисовка строки одна на оба режима — плоский список и группы отличаются
  // только обёрткой, а набор пропсов у строки один и тот же.
  const renderRow = (row) => (
    <ReportDraftRow
      key={row._uid}
      row={row}
      number={rowNumbers.get(row._uid)}
      isEdited={editedUids.has(row._uid)}
      fieldEdited={fieldEdited}
      snapshotValue={snapshotValue}
      editableFields={editableFields}
      positions={positions}
      roomMates={roomMates?.get(row._uid)}
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
      rules={rules}
      canEdit={canEdit}
    />
  );

  let body;
  if (loading && rows.length === 0) {
    body = <ReportDraftSkeleton />;
  } else if (rows.length === 0) {
    body = <ReportDraftEmptyState variant="no-rows" />;
  } else if (displayedRows.length === 0) {
    body = <ReportDraftEmptyState variant="no-match" onResetFilters={onResetFilters} />;
  } else if (groupBy === "hotel") {
    // В состоянии загрузки таблица рендерится без новых пропсов
    // (ReportDraftEditor.jsx), поэтому Set может не прийти.
    const collapsed = collapsedHotels || new Set();
    // Группируем ПОКАЗАННЫЕ строки: пустых групп при фильтре быть не должно.
    // withMoney выключается на суженном наборе — см. groupRowsByHotel.
    body = groupRowsByHotel(displayedRows, { withMoney: !narrowed }).map((group) => {
      const isCollapsed = collapsed.has(group.hotel);
      return (
        <div key={group.hotel}>
          <ReportDraftGroupHeader
            group={group}
            collapsed={isCollapsed}
            onToggle={() => onToggleHotel?.(group.hotel)}
          />
          {!isCollapsed && group.rows.map(renderRow)}
        </div>
      );
    });
  } else {
    body = displayedRows.map(renderRow);
  }

  return (
    <>
      {/* Заголовки — дословно из печатной формы реестра, чтобы экран сверялся
          с Excel без перевода. Порядок тоже её, кроме «Сотрудника» (закреплён
          вторым ради прокрутки) и «Цены/сут.» (поля редактора в форме нет). */}
      <div className={classes.headRow}>
        {/* Колонка заморозки: галочка фиксирует строку, пересоздание её не
            меняет. Заголовок — иконка-замок смыслом не легла бы (закреплена
            не запись, а расчёт), поэтому короткая подпись. */}
        <div
          className={`${classes.colFreeze} ${classes.stickyFreeze}`}
          title="Заморозить строку — пересоздание черновика её не изменит"
        >
          Фикс.
        </div>
        <div className={`${classes.colIndex} ${classes.stickyIndex}`}>№</div>
        <Th cls={`${classes.colPassenger} ${classes.stickyPassenger}`} k="personName">Сотрудник</Th>
        <Th cls={classes.colArrival} k="arrival">Дата/время заезда</Th>
        <Th cls={classes.colDeparture} k="departure">Дата/время выезда</Th>
        <Th cls={classes.colDays} k="totalDays">Кол-во суток</Th>
        <Th cls={classes.colCategory} k="category">Категория номера</Th>
        <Th cls={classes.colRoom} k="roomName">Комната</Th>
        <div className={classes.colShare}>Вид проживания</div>
        <Th cls={classes.colPosition} k="personPosition">Должность</Th>
        <Th cls={classes.colBreakfast} k="breakfastCount">Завтрак</Th>
        <Th cls={classes.colLunch} k="lunchCount">Обед</Th>
        <Th cls={classes.colDinner} k="dinnerCount">Ужин</Th>
        <Th cls={classes.colMeal} k="totalMealCost">Стоимость питания</Th>
        <Th cls={classes.colPrice} k="pricePerDay">Цена/сут.</Th>
        {/* «Гостиница» перед стоимостью проживания — просьба заказчика;
            в файле выгрузки порядок печатной формы не меняется. */}
        <Th cls={classes.colHotel} k="hotelName">Гостиница</Th>
        <Th cls={classes.colLiving} k="totalLivingCost">Стоимость проживания</Th>
        <Th cls={classes.colTotal} k="totalDebt">Итоговая стоимость</Th>
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
  snapshotValue: PropTypes.func,
  editableFields: PropTypes.instanceOf(Set),
  positions: PropTypes.arrayOf(PropTypes.string),
  roomMates: PropTypes.instanceOf(Map),
  onCellChange: PropTypes.func.isRequired,
  onCellFocus: PropTypes.func,
  onCellBlur: PropTypes.func,
  onResetRow: PropTypes.func.isRequired,
  onRequestDeleteRow: PropTypes.func.isRequired,
  onResetFilters: PropTypes.func.isRequired,
  hoveredCluster: PropTypes.string,
  onHoverCluster: PropTypes.func,
  rules: PropTypes.object,
  groupBy: PropTypes.oneOf(["file", "hotel"]),
  collapsedHotels: PropTypes.instanceOf(Set),
  onToggleHotel: PropTypes.func,
  narrowed: PropTypes.bool,
  canEdit: PropTypes.bool,
  sortKey: PropTypes.string,
  sortDir: PropTypes.oneOf(["asc", "desc"]),
  onSort: PropTypes.func,
};
