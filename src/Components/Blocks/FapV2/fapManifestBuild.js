// Манифест для старых заявок: файл манифеста уходит во вложения только с 02.09,
// а реестр (`savedPassengers`) есть у всех. Собираем XLSX в форме ПМ — ровно в том
// формате, который наш же импорт распознаёт профилем PM (utils/manifestProfiles.js),
// чтобы выгрузку можно было залить обратно и получить тех же людей.
import * as XLSX from "xlsx";
import { formatDate, normalizeCategory } from "./fapConstants.js";
import { safeFilename } from "./reports/buildReportSheets.js";

// Пассажиры реестра без экипажа, по алфавиту ФИО.
const manifestPeople = (request) =>
  (request?.savedPassengers || [])
    .filter((p) => p?.personType !== "CREW")
    .slice()
    .sort((a, b) => (a.fullName ?? "").localeCompare(b.fullName ?? "", "ru"));

const mark = (p, category) =>
  normalizeCategory(p.personCategory) === category ? "X" : "";

// Есть ли из чего собирать манифест — единственный источник правила «кто пассажир».
export const hasManifestRoster = (request) => manifestPeople(request).length > 0;

// Строки листа в форме ПМ. Заголовок «FLIGHT» и колонки РЕГ/ФИО/МЕСТО/РБ/РМ — ровно
// те синонимы, по которым профиль PM (manifestProfiles.js) распознаёт файл при
// импорте обратно.
export function buildManifestRows(request) {
  const people = manifestPeople(request);
  return [
    ["ПАССАЖИРСКАЯ ВЕДОМОСТЬ"],
    // FLIGHT/DATE сдвинуты на колонку вправо намеренно: номер рейса без буквенного
    // кода («6346») в первой колонке профиль PM принял бы за «РЕГ» и завёл бы
    // пассажира с датой вместо ФИО. Номер рейса читается из ячейки под «FLIGHT» в
    // ТОЙ ЖЕ колонке, так что сдвиг разметку не ломает.
    [null, "FLIGHT", "DATE"],
    [
      null,
      request?.flightNumber ?? "",
      request?.flightDate ? formatDate(request.flightDate) : "",
    ],
    [],
    ["РЕГ", "ФИО", "МЕСТО", "РБ", "РМ", "ТЕЛЕФОН"],
    ...people.map((p, i) => [
      i + 1,
      p.fullName ?? "",
      p.seat ?? "",
      mark(p, "CHILD"),
      mark(p, "INFANT"),
      p.phone ?? "",
    ]),
  ];
}

export function buildManifestWorkbook(request) {
  const ws = XLSX.utils.aoa_to_sheet(buildManifestRows(request));
  ws["!cols"] = [
    { wch: 6 },
    { wch: 36 },
    { wch: 8 },
    { wch: 5 },
    { wch: 5 },
    { wch: 20 },
  ];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Манифест");
  return wb;
}

export function manifestDownloadName(request) {
  const tag = request?.flightNumber || request?.requestNumber || "";
  return `${safeFilename(`Манифест ${tag}`.trim())}.xlsx`;
}

export function downloadManifestXlsx(request) {
  XLSX.writeFile(buildManifestWorkbook(request), manifestDownloadName(request));
}
