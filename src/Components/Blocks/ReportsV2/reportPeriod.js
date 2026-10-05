import { plural } from "../../../utils/plural.js";

// Период отчёта из полей формы создания (`<input type="date">` → "YYYY-MM-DD").
//
// Однодневный период почти всегда ошибка ввода: замер 05.10.2026 — из 47 отчётов
// и черновиков ни одного за один день, самый короткий 8 дней. Заказчица так собрала
// черновик за 01.08–01.08 вместо 01.08–10.08 и искала пропавшие экипажи, а
// «Пересоздать» период не меняет.
//
// Без graphQL_requests.js: утилита гоняется под `node --test`.

const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;
const DAY_MS = 24 * 60 * 60 * 1000;

function parseIsoDate(value) {
  const match = typeof value === "string" ? value.match(ISO_DATE) : null;
  if (!match) return null;
  const [, year, month, day] = match;
  const time = Date.UTC(Number(year), Number(month) - 1, Number(day));
  // Date.UTC молча переносит 31.02 на март — такую дату считаем битой.
  if (new Date(time).getUTCDate() !== Number(day)) return null;
  return { time, text: `${day}.${month}.${year}` };
}

/**
 * Описывает период отчёта для подписи под датами и проверки «один день».
 *
 * @param {string} startDate - "YYYY-MM-DD"
 * @param {string} endDate - "YYYY-MM-DD"
 * @returns {{start: string, end: string, days: number, isSingleDay: boolean, label: string} | null}
 *   `null`, если дата пустая/битая или конец раньше начала
 */
export function describeReportPeriod(startDate, endDate) {
  const start = parseIsoDate(startDate);
  const end = parseIsoDate(endDate);
  if (!start || !end || end.time < start.time) return null;

  const days = Math.round((end.time - start.time) / DAY_MS) + 1;
  const isSingleDay = days === 1;
  const range = isSingleDay ? start.text : `${start.text} – ${end.text}`;
  return {
    start: start.text,
    end: end.text,
    days,
    isSingleDay,
    label: `${range} · ${days} ${plural(days, ["день", "дня", "дней"])}`,
  };
}
