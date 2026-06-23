import * as XLSX from "xlsx";

// Маппинг по именам заголовков MRV-файла (скрытые колонки допустимы)
export const BULK_HEADERS = {
  count: "Количество ЧЭ",
  arrivalDate: "Дата заезда LOC",
  arrivalTime: "Время заезда LOC",
  arrivalFlight: "Рейс прибытия",
  arrivalAircraft: "Тип ВС прибытия",
  arrivalStatus: "Статус рейса прибытия (р-рабочий п-пассажирский)",
  departureDate: "Дата выезда LOC",
  departureTime: "Время выезда LOC",
  departureFlight: "Рейс отправления",
  departureAircraft: "Тип ВС отправления",
  departureStatus: "Статус рейса отправления (р-рабочий п-пассажирский)",
  single: "Количество одноместных",
  double: "Количество двухместных",
  link: "Номер связки",
};

const DATE_RE = /^(0?[1-9]|[12]\d|3[01])\.(0?[1-9]|1[0-2])\.\d{2,4}$/;
const TIME_RE = /^\d{1,2}:\d{2}(:\d{2})?$/;
const STATUS_RE = /^[ПPРRпpрr]$/;

const s = (v) => String(v ?? "").trim();
const pad = (n) => String(n).padStart(2, "0");

// Ячейки дат/времени в xlsx бывают текстом ("15.06.2026"), Excel-serial числом
// (45931) или Date-объектом. Приводим к единому "DD.MM.YYYY" / "HH:MM".
const fmtDate = (v) => {
  if (typeof v === "number") {
    const d = XLSX.SSF.parse_date_code(v);
    if (d) return `${pad(d.d)}.${pad(d.m)}.${d.y}`;
  }
  if (v instanceof Date) {
    return `${pad(v.getDate())}.${pad(v.getMonth() + 1)}.${v.getFullYear()}`;
  }
  return s(v);
};
const fmtTime = (v) => {
  if (typeof v === "number") {
    const d = XLSX.SSF.parse_date_code(v);
    if (d) return `${pad(d.H)}:${pad(d.M)}`;
  }
  if (v instanceof Date) {
    return `${pad(v.getHours())}:${pad(v.getMinutes())}`;
  }
  return s(v);
};

// Возвращает { rows, totalRequests, headerError, rowIssues }
export async function parseBulkXlsx(file) {
  const buf = await file.arrayBuffer();
  const wb = XLSX.read(buf, { type: "array" });
  const sheet = wb.Sheets[wb.SheetNames[0]];
  // raw: true → сырые значения ячеек (числа/Date/строки); даты/время нормализуем сами
  const raw = XLSX.utils.sheet_to_json(sheet, { defval: "", raw: true });

  if (!raw.length) {
    return { rows: [], totalRequests: 0, headerError: "Файл пустой", rowIssues: [] };
  }

  const present = Object.keys(raw[0]);
  const missing = Object.values(BULK_HEADERS).filter((h) => !present.includes(h));
  if (missing.length) {
    return {
      rows: [],
      totalRequests: 0,
      headerError: `Не найдены колонки: ${missing.join(", ")}`,
      rowIssues: [],
    };
  }

  const rows = raw.map((r, i) => {
    const arrivalDate = fmtDate(r[BULK_HEADERS.arrivalDate]);
    const arrivalTime = fmtTime(r[BULK_HEADERS.arrivalTime]);
    const departureDate = fmtDate(r[BULK_HEADERS.departureDate]);
    const departureTime = fmtTime(r[BULK_HEADERS.departureTime]);

    const issues = [];
    const count = Number(s(r[BULK_HEADERS.count]));
    if (!Number.isInteger(count) || count < 1) issues.push("Количество ЧЭ");
    if (!DATE_RE.test(arrivalDate)) issues.push("Дата заезда");
    if (!TIME_RE.test(arrivalTime)) issues.push("Время заезда");
    if (!DATE_RE.test(departureDate)) issues.push("Дата выезда");
    if (!TIME_RE.test(departureTime)) issues.push("Время выезда");
    if (!STATUS_RE.test(s(r[BULK_HEADERS.arrivalStatus]))) issues.push("Статус прибытия");
    if (!STATUS_RE.test(s(r[BULK_HEADERS.departureStatus]))) issues.push("Статус вылета");
    if (!s(r[BULK_HEADERS.link])) issues.push("Номер связки");

    return {
      rowNumber: i + 2, // +1 заголовок, +1 для 1-based нумерации как в файле
      count: Number.isFinite(count) ? count : 0,
      arrivalDate,
      arrivalTime,
      arrivalFlight: s(r[BULK_HEADERS.arrivalFlight]),
      arrivalAircraft: s(r[BULK_HEADERS.arrivalAircraft]),
      arrivalStatus: s(r[BULK_HEADERS.arrivalStatus]),
      departureDate,
      departureTime,
      departureFlight: s(r[BULK_HEADERS.departureFlight]),
      departureAircraft: s(r[BULK_HEADERS.departureAircraft]),
      departureStatus: s(r[BULK_HEADERS.departureStatus]),
      single: Number(s(r[BULK_HEADERS.single])) || 0,
      double: Number(s(r[BULK_HEADERS.double])) || 0,
      link: s(r[BULK_HEADERS.link]),
      issues,
    };
  });

  const totalRequests = rows.reduce(
    (acc, r) => acc + (r.issues.includes("Количество ЧЭ") ? 0 : r.count),
    0
  );
  const rowIssues = rows.filter((r) => r.issues.length);

  return { rows, totalRequests, headerError: null, rowIssues };
}
