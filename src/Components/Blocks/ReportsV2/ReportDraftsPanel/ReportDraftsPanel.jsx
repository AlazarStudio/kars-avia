import PropTypes from "prop-types";
import classes from "./ReportDraftsPanel.module.css";
import { convertToDate, convertToDateNew } from "../../../../../graphQL_requests";
import { isDraftStale } from "../reportDraftAge";
import DeleteIcon from "../../../../shared/icons/DeleteIcon";

// Плашка незавершённых черновиков раздела «Отчёты v2»: висит над таблицей
// готовых отчётов и даёт вернуться к черновику или удалить его. Черновик —
// мёртвый снимок строк на бэке (подтверждение печатает их как есть), поэтому
// возраст с момента создания — значимая информация, а не украшение.
// Дата+время черновика: convertToDate(x, true) возвращает ТОЛЬКО время
// (проектный приём, см. InfoTableDataReports), поэтому дату и время нужно
// склеивать вручную. На пустом/битом значении convertToDate отдаёт "" —
// в этом случае возвращаем "", чтобы вызывающий код не оставил висящее
// слово-подпись с пробелом там, где значения нет.
const formatDateTime = (value) => {
  const date = convertToDate(value);
  if (!date) return "";
  const time = convertToDate(value, true);
  return time ? `${date} ${time}` : date;
};

export default function ReportDraftsPanel({ drafts, isAirline, onOpen, onDelete }) {
  if (!Array.isArray(drafts) || drafts.length === 0) {
    return null;
  }

  return (
    <div className={classes.panel}>
      <div className={classes.header}>
        <span className={classes.headerDot} />
        Незавершённые черновики · {drafts.length}
      </div>

      <div className={classes.list}>
        {drafts.map((draft) => {
          const name = isAirline ? draft?.airline?.name : draft?.hotel?.name;
          const rowsCount = draft.rows?.length ?? 0;
          const stale = isDraftStale(draft.createdAt);
          const updatedLabel = formatDateTime(draft.updatedAt);

          return (
            <div className={classes.row} key={draft.id}>
              <div className={classes.info}>
                <div className={classes.nameRow}>
                  <span className={classes.name} title={name || "—"}>
                    {name || "—"}
                  </span>
                  {stale && (
                    <span
                      className={classes.staleBadge}
                      title="Данные заявок могли измениться с момента создания черновика"
                    >
                      <span className={classes.staleDot} />
                      устарел
                    </span>
                  )}
                </div>
                {/* Границы периода — сентинелы T00:10/T23:50 в UTC; московский рендер сдвигал конец на +1 день */}
                <div className={classes.period}>
                  {convertToDateNew(draft.startDate)} – {convertToDateNew(draft.endDate)}
                </div>
              </div>

              <div className={classes.rowsCount}>строк: {rowsCount}</div>

              <div className={classes.updated}>{updatedLabel ? `изменён ${updatedLabel}` : ""}</div>

              <div className={classes.actions}>
                <button
                  type="button"
                  className={classes.openBtn}
                  onClick={() => onOpen(draft.id)}
                >
                  Открыть
                </button>
                <button
                  type="button"
                  className={classes.deleteBtn}
                  onClick={() => onDelete(draft.id)}
                  title="Удалить"
                >
                  <DeleteIcon cursor="pointer" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

ReportDraftsPanel.propTypes = {
  drafts: PropTypes.arrayOf(PropTypes.object),
  isAirline: PropTypes.bool,
  onOpen: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
};
