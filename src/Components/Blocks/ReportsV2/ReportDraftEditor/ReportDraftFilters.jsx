import PropTypes from "prop-types";
import classes from "./ReportDraftFilters.module.css";
import { SearchIcon } from "../ReportsV2Icons";
import { DRAFT_FILTERS } from "./reportDraftEditorUtils";

// Панель клиентских фильтра и поиска над таблицей строк черновика. Счётчики
// в чипах считаются от строк, уже прошедших поиск (см. ReportDraftEditor) —
// поэтому ввод в поиске одновременно двигает все три числа, а переключение
// вкладки само по себе числа не меняет.
export default function ReportDraftFilters({
  filter,
  onFilterChange,
  counts,
  dirty,
  onResetAll,
  search,
  onSearchChange,
  groupBy,
  onGroupByChange,
  canEdit = true,
}) {
  return (
    <div className={classes.bar}>
      <div className={classes.chips}>
        <button
          type="button"
          className={filter === DRAFT_FILTERS.ALL ? classes.chipAllActive : classes.chipAll}
          onClick={() => onFilterChange(DRAFT_FILTERS.ALL)}
        >
          Все · {counts.all}
        </button>

        <button
          type="button"
          className={
            filter === DRAFT_FILTERS.WARNINGS ? classes.chipWarningActive : classes.chipWarning
          }
          onClick={() => onFilterChange(DRAFT_FILTERS.WARNINGS)}
        >
          <span className={classes.chipDot} />
          Предупреждения · {counts.warnings}
        </button>

        {canEdit && (
          <button
            type="button"
            className={filter === DRAFT_FILTERS.EDITED ? classes.chipEditedActive : classes.chipEdited}
            onClick={() => onFilterChange(DRAFT_FILTERS.EDITED)}
          >
            <span className={classes.chipDot} />
            Изменено · {counts.edited}
          </button>
        )}

        {canEdit && counts.deleted > 0 && (
          <span className={classes.chipDeleted}>Удалено · {counts.deleted}</span>
        )}
      </div>

      <div className={classes.tools}>
        {/* Порядок строк в файле — контрактный, поэтому по умолчанию таблица
            открывается как печатная форма, а группировка включается руками. */}
        <div className={classes.segmented} role="group" aria-label="Порядок строк">
          <button
            type="button"
            className={groupBy === "file" ? classes.segActive : classes.seg}
            aria-pressed={groupBy === "file"}
            onClick={() => onGroupByChange("file")}
          >
            Файл
          </button>
          <button
            type="button"
            className={groupBy === "hotel" ? classes.segActive : classes.seg}
            aria-pressed={groupBy === "hotel"}
            onClick={() => onGroupByChange("hotel")}
          >
            Гостиницы
          </button>
        </div>

        {canEdit && dirty && (
          <button type="button" className={classes.resetLink} onClick={onResetAll}>
            Сбросить все правки
          </button>
        )}

        <div className={classes.searchBox}>
          <SearchIcon size={15} className={classes.searchIcon} />
          <input
            className={classes.searchInput}
            placeholder="Фамилия, должность или номер"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
      </div>
    </div>
  );
}

ReportDraftFilters.propTypes = {
  filter: PropTypes.oneOf(Object.values(DRAFT_FILTERS)).isRequired,
  onFilterChange: PropTypes.func.isRequired,
  counts: PropTypes.shape({
    all: PropTypes.number,
    warnings: PropTypes.number,
    edited: PropTypes.number,
    deleted: PropTypes.number,
  }).isRequired,
  dirty: PropTypes.bool,
  onResetAll: PropTypes.func.isRequired,
  search: PropTypes.string.isRequired,
  onSearchChange: PropTypes.func.isRequired,
  groupBy: PropTypes.oneOf(["file", "hotel"]).isRequired,
  onGroupByChange: PropTypes.func.isRequired,
  canEdit: PropTypes.bool,
};
