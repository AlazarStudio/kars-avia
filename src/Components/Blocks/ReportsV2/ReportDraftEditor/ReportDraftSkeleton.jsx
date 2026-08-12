import table from "./ReportDraftTable.module.css";
import skeleton from "./ReportDraftSkeleton.module.css";

// Ширины текстовых плашек намеренно разные по строкам — ровный "забор"
// одинаковых полосок читается как декорация, а не как намёк на текст.
const NAME_WIDTHS = [120, 96, 140, 84, 128, 104, 92, 132];
const ROOM_WIDTHS = [48, 36, 56, 40, 52, 44, 38, 60];
const HOTEL_WIDTHS = [110, 84, 126, 96, 118, 90, 104, 80];

// 8 строк-плашек на время первой загрузки черновика — вместо спиннера,
// чтобы структура таблицы (закреплённые колонки, ширины) была видна сразу.
// Набор колонок обязан совпадать с ReportDraftRow: иначе на загрузке сетка
// разъезжается, и таблица «прыгает», когда приходят данные.
export default function ReportDraftSkeleton() {
  return (
    <div aria-hidden="true">
      {NAME_WIDTHS.map((nameWidth, i) => (
        <div className={table.row} key={i}>
          <div className={`${table.colIndex} ${table.stickyIndex}`}>
            <div className={skeleton.barSmall} style={{ width: 16 }} />
          </div>

          <div className={`${table.colPassenger} ${table.stickyPassenger}`}>
            <div className={skeleton.bar} style={{ width: nameWidth }} />
          </div>

          <div className={table.colArrival}>
            <div className={skeleton.bar} style={{ width: 118 }} />
          </div>

          <div className={table.colDeparture}>
            <div className={skeleton.bar} style={{ width: 118 }} />
          </div>

          <div className={table.colDays}>
            <div className={skeleton.barInput} style={{ width: 62 }} />
          </div>

          <div className={table.colCategory}>
            <div className={skeleton.bar} style={{ width: 96 }} />
          </div>

          <div className={table.colRoom}>
            <div className={skeleton.bar} style={{ width: ROOM_WIDTHS[i] }} />
          </div>

          <div className={table.colShare}>
            <div className={skeleton.bar} style={{ width: 140 }} />
          </div>

          <div className={table.colPosition}>
            <div className={skeleton.bar} style={{ width: 62 }} />
          </div>

          <div className={table.colBreakfast}>
            <div className={skeleton.barSmall} style={{ width: 18 }} />
          </div>

          <div className={table.colLunch}>
            <div className={skeleton.barSmall} style={{ width: 18 }} />
          </div>

          <div className={table.colDinner}>
            <div className={skeleton.barSmall} style={{ width: 18 }} />
          </div>

          <div className={table.colMeal}>
            <div className={skeleton.barInput} style={{ width: 96 }} />
          </div>

          <div className={table.colPrice}>
            <div className={skeleton.barInput} style={{ width: 88 }} />
          </div>

          <div className={table.colLiving}>
            <div className={skeleton.bar} style={{ width: 76 }} />
          </div>

          <div className={table.colTotal}>
            <div className={skeleton.bar} style={{ width: 68 }} />
          </div>

          <div className={table.colHotel}>
            <div className={skeleton.bar} style={{ width: HOTEL_WIDTHS[i] }} />
          </div>

          <div className={table.colActions} />
        </div>
      ))}
    </div>
  );
}
