import table from "./ReportDraftTable.module.css";
import skeleton from "./ReportDraftSkeleton.module.css";

// Ширины текстовых плашек намеренно разные по строкам — ровный "забор"
// одинаковых полосок читается как декорация, а не как намёк на текст.
const NAME_WIDTHS = [120, 96, 140, 84, 128, 104, 92, 132];
const ROOM_WIDTHS = [48, 36, 56, 40, 52, 44, 38, 60];

// 8 строк-плашек на время первой загрузки черновика — вместо спиннера,
// чтобы структура таблицы (закреплённые колонки, ширины) была видна сразу.
export default function ReportDraftSkeleton() {
  return (
    <div aria-hidden="true">
      {NAME_WIDTHS.map((nameWidth, i) => (
        <div className={table.row} key={i}>
          <div className={`${table.colIndex} ${table.stickyIndex}`}>
            <div className={skeleton.barSmall} style={{ width: 16 }} />
          </div>

          <div className={`${table.colPassenger} ${table.stickyPassenger}`}>
            <div className={table.cellStack}>
              <div className={skeleton.bar} style={{ width: nameWidth }} />
              <div className={skeleton.barSmall} style={{ width: nameWidth * 0.6 }} />
            </div>
          </div>

          <div className={table.colRoom}>
            <div className={table.cellStack}>
              <div className={skeleton.bar} style={{ width: ROOM_WIDTHS[i] }} />
              <div className={skeleton.barSmall} style={{ width: ROOM_WIDTHS[i] * 1.4 }} />
            </div>
          </div>

          <div className={table.colStay}>
            <div className={table.cellStay}>
              <div className={skeleton.bar} style={{ width: 118 }} />
              <div className={skeleton.bar} style={{ width: 110 }} />
            </div>
          </div>

          <div className={table.colDays}>
            <div className={skeleton.barInput} style={{ width: 62 }} />
          </div>

          <div className={table.colPrice}>
            <div className={skeleton.barInput} style={{ width: 88 }} />
          </div>

          <div className={table.colLiving}>
            <div className={skeleton.bar} style={{ width: 64 }} />
          </div>

          <div className={table.colMeal}>
            <div className={skeleton.barInput} style={{ width: 96 }} />
          </div>

          <div className={table.colTotal}>
            <div className={skeleton.bar} style={{ width: 60 }} />
          </div>

          <div className={table.colActions} />
        </div>
      ))}
    </div>
  );
}
