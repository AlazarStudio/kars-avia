import PropTypes from "prop-types";
import classes from "./ReportDraftGroupHeader.module.css";
import ChevronIcon from "../../../../shared/icons/ChevronIcon";
import { formatDays, formatMoney, pluralizeRows } from "./reportDraftEditorUtils";

// Строка-разделитель группы гостиницы в режиме «Гостиницы». Полоса тянется на
// всю ширину таблицы, а её содержимое липнет к левому краю: без этого при
// прокрутке к деньгам название гостиницы уезжает за край и становится
// непонятно, чья это группа.
//
// Сутки и деньги приходят как null, когда набор строк сужен фильтром или
// поиском: частичной суммы по гостинице не существует, а число рядом с
// названием прочитали бы как её итог.
export default function ReportDraftGroupHeader({ group, collapsed, onToggle }) {
  return (
    <div className={classes.band}>
      <button
        type="button"
        className={classes.inner}
        onClick={onToggle}
        aria-expanded={!collapsed}
        title={collapsed ? "Развернуть группу" : "Свернуть группу"}
      >
        <ChevronIcon
          width={14}
          height={14}
          className={collapsed ? classes.chevronCollapsed : classes.chevron}
        />
        <span className={classes.hotel}>{group.hotel}</span>
        <span className={classes.count} title={`${group.count} ${pluralizeRows(group.count)}`}>
          {group.count}
        </span>

        {group.warnings > 0 && (
          <span className={classes.warnings}>
            <span className={classes.warnDot} />
            {group.warnings}
          </span>
        )}

        {(group.days !== null || group.total !== null) && (
          <>
            <span className={classes.divider} />
            {group.days !== null && <span className={classes.days}>{formatDays(group.days)} сут.</span>}
            {group.total !== null && (
              <span className={classes.total}>{formatMoney(group.total)} ₽</span>
            )}
          </>
        )}
      </button>
    </div>
  );
}

ReportDraftGroupHeader.propTypes = {
  group: PropTypes.shape({
    hotel: PropTypes.string.isRequired,
    count: PropTypes.number.isRequired,
    warnings: PropTypes.number.isRequired,
    days: PropTypes.number,
    total: PropTypes.number,
  }).isRequired,
  collapsed: PropTypes.bool,
  onToggle: PropTypes.func.isRequired,
};
