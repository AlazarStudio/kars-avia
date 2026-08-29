import {
  addDays,
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameMonth,
  isSameYear,
  isToday,
  isWeekend,
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

// view: "month" | "week"; anchor: Date. Возвращает всё, что нужно шапке и запросу.
export const buildPeriod = (view, anchor) => {
  const start =
    view === "week"
      ? startOfWeek(anchor, { weekStartsOn: 1 })
      : startOfMonth(anchor);
  const end =
    view === "week" ? endOfWeek(anchor, { weekStartsOn: 1 }) : endOfMonth(anchor);
  const days = eachDayOfInterval({ start, end });
  const title =
    view === "week"
      ? weekTitle(start, end)
      : capitalize(format(start, "LLLL yyyy", { locale: ru }));
  return { view, start, end, days, title };
};

export const shiftAnchor = (view, anchor, dir) =>
  view === "week" ? addDays(anchor, 7 * dir) : addMonths(anchor, dir);

// Фон колонки дня — общий для шапки сетки и ячеек строк комнат.
export const DAY_BG = {
  today: "#eaf2fd",
  weekend: "#f4f6fa",
  plain: "#fff",
};

export const dayCellBg = (day) =>
  isToday(day) ? DAY_BG.today : isWeekend(day) ? DAY_BG.weekend : DAY_BG.plain;
