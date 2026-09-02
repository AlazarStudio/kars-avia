import PropTypes from "prop-types";
import classes from "./ReportDraftsPanel.module.css";
import { convertToDate, convertToDateNew } from "../../../../../graphQL_requests";
import { isDraftStale } from "../reportDraftAge";
import DeleteIcon from "../../../../shared/icons/DeleteIcon";

// Плашка черновиков раздела «Отчёты v2»: висит над таблицей готовых отчётов
// и даёт вернуться к черновику. Черновик — мёртвый снимок строк на бэке
// (подтверждение печатает их как есть), поэтому возраст с момента создания —
// значимая информация, а не украшение.
// Дата+время черновика: convertToDate(x, true) возвращает ТОЛЬКО время
// (проектный приём, см. InfoTableDataReports), поэтому дату и время нужно
// склеивать вручную. Пустое значение отсекаем сами, до convertToDate: на null
// он отдаёт не "", а «01.01.1970» — new Date(null) это эпоха. Возвращённое ""
// нужно, чтобы вызывающий код не оставил висящее слово-подпись с пробелом
// там, где значения нет.
const formatDateTime = (value) => {
  if (!value) return "";
  const date = convertToDate(value);
  if (!date) return "";
  const time = convertToDate(value, true);
  return time ? `${date} ${time}` : date;
};

// Один и тот же список рисует две панели: незавершённые черновики диспетчера
// и отправленные авиакомпании. Отличий ровно два — заголовок и подпись справа
// («изменён» против «отправлено»), поэтому вариант, а не второй компонент.
export default function ReportDraftsPanel({
  drafts,
  isAirline,
  onOpen,
  onDelete,
  onUnsubmit,
  title = "Незавершённые черновики",
  variant = "open",
}) {
  if (!Array.isArray(drafts) || drafts.length === 0) {
    return null;
  }

  const submitted = variant === "submitted";

  return (
    <div className={classes.panel}>
      <div className={classes.header}>
        <span className={classes.headerDot} />
        {title} · {drafts.length}
      </div>

      <div className={classes.list}>
        {drafts.map((draft) => {
          const name = isAirline ? draft?.airline?.name : draft?.hotel?.name;
          const rowsCount = draft.rows?.length ?? 0;
          // Бейдж «устарел» в обоих вариантах считается от создания: отправка
          // авиакомпании данные заявок не освежает, снимок остаётся тем же.
          const stale = isDraftStale(draft.createdAt);
          const timeLabel = submitted
            ? formatDateTime(draft.submittedAt)
            : formatDateTime(draft.updatedAt);

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

              <div className={classes.updated}>
                {timeLabel ? `${submitted ? "отправлено" : "изменён"} ${timeLabel}` : ""}
              </div>

              <div className={classes.actions}>
                <button
                  type="button"
                  className={classes.openBtn}
                  onClick={() => onOpen(draft.id)}
                >
                  Открыть
                </button>
                {/* Отзыв — единственный способ снова начать править отправленный
                    черновик, поэтому он в строке, а не только внутри редактора. */}
                {onUnsubmit && (
                  <button
                    type="button"
                    className={classes.unsubmitBtn}
                    onClick={() => onUnsubmit(draft.id)}
                  >
                    Отозвать
                  </button>
                )}
                {onDelete && (
                  <button
                    type="button"
                    className={classes.deleteBtn}
                    onClick={() => onDelete(draft.id)}
                    title="Удалить"
                  >
                    <DeleteIcon cursor="pointer" />
                  </button>
                )}
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
  // Удаление и отзыв — необязательные: отправленный черновик авиакомпания
  // не удаляет, а отзывает его только диспетчер.
  onDelete: PropTypes.func,
  onUnsubmit: PropTypes.func,
  title: PropTypes.string,
  variant: PropTypes.oneOf(["open", "submitted"]),
};
