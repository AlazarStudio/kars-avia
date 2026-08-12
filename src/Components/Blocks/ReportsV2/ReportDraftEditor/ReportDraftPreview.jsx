import { useEffect } from "react";
import PropTypes from "prop-types";
import { useQuery } from "@apollo/client";
import classes from "./ReportDraftPreview.module.css";
import MUILoader from "../../MUILoader/MUILoader";
import { formatMoney, pluralizeRows } from "./reportDraftEditorUtils";
import { readPrintedTotals, compareWithPrintedTotal, buildTotalsCells } from "../reportDraftRows";
import {
  GET_REPORT_DRAFT_PRESENTATION,
  getCookie,
} from "../../../../../graphQL_requests";

// Предпросмотр черновика ровно в том виде, в каком он уйдёт в Excel: шапка,
// колонки и строка ИТОГО приходят с бэка полем `presentation`, значения в нём
// уже отформатированы. Своего форматирования тут нет и быть не должно — иначе
// предпросмотр начнёт расходиться с файлом, ради чего всё и затевалось.
//
// Ровно одно намеренное исключение: подпись «ИТОГО:» дублируется в первой
// колонке строки итогов (см. buildTotalsCells). В файле она стоит в девятой,
// слева от неё пусто, и без дубля строка итогов читается как пустая, пока
// таблицу не прокрутят. Значения самих ячеек при этом не трогаются.
//
// Важное свойство: `presentation` считается из строк В БАЗЕ. Несохранённые
// правки в него не попадают — ровно как и в сам файл, который печатает
// confirmReportDraft. Поэтому при грязном редакторе показываем предупреждение,
// а не молча рисуем устаревшие цифры.
export default function ReportDraftPreview({ open, draftId, onClose, localTotal, unsavedCount }) {
  const token = getCookie("token");

  const { data, loading, error } = useQuery(GET_REPORT_DRAFT_PRESENTATION, {
    variables: { id: draftId },
    // Открыли предпросмотр — тянем свежее: между открытиями строки могли
    // сохраниться, и кэш показал бы прошлый вариант.
    fetchPolicy: "network-only",
    skip: !open || !draftId,
    context: { headers: { Authorization: `Bearer ${token}` } },
  });

  useEffect(() => {
    if (!open) return undefined;
    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  const presentation = data?.reportDraft?.presentation;
  const columns = presentation?.columns || [];
  const dataRows = presentation?.dataRows || [];
  const header = presentation?.header;

  const printed = readPrintedTotals(presentation?.totalsRow);
  const totals = printed ? compareWithPrintedTotal(localTotal, printed.debt) : null;
  const cellByKey = (row) => {
    const map = new Map();
    for (const cell of row?.cells || []) map.set(cell.key, cell.value);
    return map;
  };
  const totalsCells = buildTotalsCells(presentation?.totalsRow, columns);

  return (
    <div
      className={classes.overlay}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className={classes.card} role="dialog" aria-modal="true" aria-label="Предпросмотр отчёта">
        <div className={classes.top}>
          <div className={classes.topText}>
            <div className={classes.title}>Так отчёт уйдёт в Excel</div>
            {header?.title && <div className={classes.subtitle}>{header.title}</div>}
          </div>
          <button type="button" className={classes.closeBtn} onClick={onClose} aria-label="Закрыть">
            ✕
          </button>
        </div>

        {unsavedCount > 0 && (
          <div className={classes.warn}>
            Показан сохранённый вариант. Несохранённых правок — {unsavedCount}{" "}
            {pluralizeRows(unsavedCount)}: в файл они попадут только после сохранения.
          </div>
        )}

        {loading && <MUILoader loadSize="40px" fullHeight="240px" />}

        {error && !loading && (
          <div className={classes.error}>
            Не удалось получить предпросмотр: {error.graphQLErrors?.[0]?.message || "сервер не ответил"}
          </div>
        )}

        {!loading && !error && presentation && (
          <>
            {header && (
              <div className={classes.header}>
                {header.companyNameFull && <div>{header.companyNameFull}</div>}
                {header.contractName && (
                  <div className={classes.headerMuted}>{header.contractName}</div>
                )}
                {header.city && <div className={classes.headerMuted}>{header.city}</div>}
              </div>
            )}

            <div className={classes.scroll}>
              <table className={classes.table}>
                <thead>
                  <tr>
                    {columns.map((column) => (
                      <th key={column.key} style={{ minWidth: (column.width || 12) * 7 }}>
                        {column.header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {dataRows.map((row, index) => {
                    const cells = cellByKey(row);
                    return (
                      <tr key={index}>
                        {columns.map((column) => (
                          <td key={column.key}>{cells.get(column.key) ?? ""}</td>
                        ))}
                      </tr>
                    );
                  })}
                </tbody>
                {presentation.totalsRow && (
                  <tfoot>
                    <tr>
                      {columns.map((column) => (
                        <td key={column.key}>{totalsCells.get(column.key) ?? ""}</td>
                      ))}
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>

            <div className={classes.foot}>
              <span>
                Строк в файле: {dataRows.length}
              </span>
              {totals && (
                <span className={totals.matches ? classes.totalsOk : classes.totalsGap}>
                  {totals.matches
                    ? `Итог сходится с экраном: ${formatMoney(printed.debt)} ₽`
                    : `Итог в файле ${formatMoney(printed.debt)} ₽, на экране ${formatMoney(
                        localTotal
                      )} ₽ — расхождение ${formatMoney(Math.abs(totals.diff))} ₽`}
                </span>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

ReportDraftPreview.propTypes = {
  open: PropTypes.bool,
  draftId: PropTypes.string,
  onClose: PropTypes.func.isRequired,
  localTotal: PropTypes.number,
  unsavedCount: PropTypes.number,
};
