import { format, formatISO } from "date-fns";

export const formatRub = (n) =>
  new Intl.NumberFormat("ru-RU", {
    style: "currency",
    currency: "RUB",
    maximumFractionDigits: 0,
  }).format(Number(n) || 0);

export const formatInt = (n) => new Intl.NumberFormat("ru-RU").format(Number(n) || 0);

export function formatDateRu(d) {
  if (!d) return "";
  const dt = new Date(d);
  if (Number.isNaN(dt.getTime())) return "";
  return format(dt, "dd.MM.yyyy");
}

// Пресеты декад текущего (или переданного) месяца
export function decadePresets(ref = new Date()) {
  const y = ref.getFullYear();
  const m = ref.getMonth();
  const lastDay = new Date(y, m + 1, 0).getDate();
  const mk = (d1, d2) => ({ startDate: new Date(y, m, d1), endDate: new Date(y, m, d2) });
  return [
    { label: "1–10", ...mk(1, 10) },
    { label: "11–20", ...mk(11, 20) },
    { label: "21–конец", ...mk(21, lastDay) },
    { label: "Весь месяц", ...mk(1, lastDay) },
  ];
}

// Собираем input для GET_PASSENGER_ANALYTICS (null → запрос пропускается)
export function buildPassengerAnalyticsInput({ range, airportId, flightNumber }) {
  if (!range?.startDate || !range?.endDate) return null;
  const input = {
    dateFrom: formatISO(range.startDate, { representation: "date" }),
    dateTo: formatISO(range.endDate, { representation: "date" }),
  };
  if (airportId) input.airportIds = [airportId];
  const fn = (flightNumber || "").trim();
  if (fn) input.flightNumber = fn;
  return input;
}
