import {
  addDays,
  addMonths,
  eachDayOfInterval,
  endOfDay,
  endOfMonth,
  endOfWeek,
  format,
  isSameMonth,
  isSameYear,
  isToday,
  isWeekend,
  setDate,
  startOfDay,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { ru } from "date-fns/locale";

const capitalize = (s) => s.charAt(0).toUpperCase() + s.slice(1);

// Неделя через границу месяца/года подписывается полностью с обеих сторон:
// «31 августа – 6 сентября 2026», «28 декабря 2026 – 3 января 2027».
const weekTitle = (start, end) => {
  const right = format(end, "d MMMM yyyy", { locale: ru });
  if (!isSameYear(start, end)) {
    return `${format(start, "d MMMM yyyy", { locale: ru })} – ${right}`;
  }
  if (!isSameMonth(start, end)) {
    return `${format(start, "d MMMM", { locale: ru })} – ${right}`;
  }
  return `${format(start, "d")} – ${right}`;
};

// Декады месяца: 0 → 1–10, 1 → 11–20, 2 → 21–конец месяца.
const decadeIndex = (anchor) => {
  const day = anchor.getDate();
  return day <= 10 ? 0 : day <= 20 ? 1 : 2;
};

const decadeRange = (anchor) => {
  const index = decadeIndex(anchor);
  return {
    start: startOfDay(setDate(anchor, index * 10 + 1)),
    // Последняя декада тянется до конца месяца: 28/29/30/31 день.
    end: index === 2 ? endOfMonth(anchor) : endOfDay(setDate(anchor, index * 10 + 10)),
  };
};

// Декада всегда внутри одного месяца, поэтому weekTitle сам сожмёт левый край
// до числа: «1 – 10 августа 2026».
const periodRange = (view, anchor) => {
  if (view === "week") {
    return {
      start: startOfWeek(anchor, { weekStartsOn: 1 }),
      end: endOfWeek(anchor, { weekStartsOn: 1 }),
    };
  }
  if (view === "decade") return decadeRange(anchor);
  return { start: startOfMonth(anchor), end: endOfMonth(anchor) };
};

// view: "month" | "decade" | "week"; anchor: Date. Всё, что нужно шапке и запросу.
export const buildPeriod = (view, anchor) => {
  const { start, end } = periodRange(view, anchor);
  const days = eachDayOfInterval({ start, end });
  const title =
    view === "month"
      ? capitalize(format(start, "LLLL yyyy", { locale: ru }))
      : weekTitle(start, end);
  return { view, start, end, days, title };
};

// Декада шагает по индексу, а через край месяца — в первую/последнюю соседнего.
const shiftDecadeAnchor = (anchor, dir) => {
  const next = decadeIndex(anchor) + dir;
  if (next < 0) return setDate(addMonths(anchor, -1), 21);
  if (next > 2) return setDate(addMonths(anchor, 1), 1);
  return setDate(anchor, next * 10 + 1);
};

export const shiftAnchor = (view, anchor, dir) => {
  if (view === "week") return addDays(anchor, 7 * dir);
  if (view === "decade") return shiftDecadeAnchor(anchor, dir);
  return addMonths(anchor, dir);
};

// Фон колонки дня — общий для шапки сетки и ячеек строк комнат.
export const DAY_BG = {
  today: "#f3f292",
  weekend: "#f4f6fa",
  plain: "#fff",
};

// Подсветка дат заявки при драге — намеренно отдельный цвет от «сегодня».
export const DRAG_HIGHLIGHT_BG = "#eaf2fd";

export const dayCellBg = (day) =>
  isToday(day) ? DAY_BG.today : isWeekend(day) ? DAY_BG.weekend : DAY_BG.plain;
