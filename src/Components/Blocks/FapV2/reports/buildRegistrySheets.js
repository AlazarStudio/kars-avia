import ExcelJS from "exceljs";
import {
  BASE_FONT,
  HEADER_FONT,
  finishSheet,
  putTotalLabel,
  toExcelLocal,
  downloadWorkbook,
} from "./buildReportSheets.js";

// Книга реестра услуг ФАП за период — из снимка rows/header/totals реестра
// (services/passengerRequest/registryRows.js на бэке). Лист «Реестр» — документ
// для АК по образцам реестров №10 (багаж) и №326 (питание); лист «Внутренний» —
// только диспетчеру (opts.internal) и только если снимок несёт внутренние ключи
// (у АК они замаскированы null-ами — тогда листа нет, даже если попросили).

const FMT_DATETIME = "dd.mm.yyyy hh:mm";
const HEADER_ROW = 4;
const FIRST_ROW = 5;

const KIND_FILE_LABEL = { BAGGAGE: "багаж", CATERING: "вода и питание" };

const pad = (n) => String(n).padStart(2, "0");

// Границы периода хранятся как МСК-сутки в UTC; печатаем календарную дату по МСК.
const mskDate = (iso) => {
  if (!iso) return "";
  const d = new Date(new Date(iso).getTime() + 3 * 60 * 60 * 1000);
  return `${pad(d.getUTCDate())}.${pad(d.getUTCMonth() + 1)}.${d.getUTCFullYear()}`;
};

// header.contractDate — обычная строка "YYYY-MM-DD" без времени и часового
// пояса: через new Date() её нельзя пропускать — в западных зонах она уедет
// на день назад. Печатаем перестановкой частей строки.
const plainDate = (value) => {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(value ?? "");
  return m ? `${m[3]}.${m[2]}.${m[1]}` : "";
};

const excelDateTime = (iso) => (iso ? toExcelLocal(new Date(iso)) : null);

const colLetter = (n) => String.fromCharCode(64 + n);

const hasInternal = (registry) =>
  (registry?.rows ?? []).some(
    (r) => r.driverCost != null || r.distanceKm != null || r.driverName != null || r.supplierCost != null
  ) || registry?.totals?.internalCost != null;

function registryTitle(registry, city) {
  const period = `за период с ${mskDate(registry.periodStart)} по ${mskDate(registry.periodEnd)}`;
  const where = city ? ` в г. ${city}` : "";
  if (registry.kind === "BAGGAGE") {
    return `Реестр №${registry.number} на доставку несвоевременно прибывшего багажа ${period}${where}`;
  }
  const customer = registry.header?.customerName || registry.airline?.nameFull || registry.airline?.name || "";
  return `Реестр №${registry.number} оказанных услуг по предоставлению питания пассажирам авиакомпании "${customer}"${where} ${period}`;
}

// Колонки: label, width, get(row), money, left, internal, sum, formula(rowIdx, at).
const BAGGAGE_COLS = [
  { key: "idx", label: "п/п", width: 6 },
  { key: "fullName", label: "ФИО пассажира", width: 28, left: true, get: (r) => r.fullName ?? "" },
  { key: "flight", label: "Номер и дата рейса", width: 18, get: (r) => `${r.flightNumber ?? ""} ${mskDate(r.flightDate)}`.trim() },
  { key: "tags", label: "№ б/бирки", width: 18, get: (r) => (r.baggageTags ?? []).join(", ") },
  { key: "addressTo", label: "Адрес доставки", width: 40, left: true, get: (r) => r.addressTo ?? "" },
  { key: "deliveredAt", label: "Дата и время доставки", width: 20, get: (r) => excelDateTime(r.deliveredAt), numFmt: FMT_DATETIME },
  { key: "price", label: "Стоимость оказанной услуги без НДС (руб)", width: 20, money: true, get: (r) => r.price, sum: true },
  { key: "driverName", label: "Водитель", width: 22, left: true, internal: true, get: (r) => r.driverName ?? "" },
  { key: "driverCost", label: "Стоимость водителю", width: 18, money: true, internal: true, get: (r) => r.driverCost, sum: true },
  { key: "distanceKm", label: "Км", width: 8, internal: true, get: (r) => r.distanceKm },
  { key: "diff", label: "Разница", width: 14, money: true, internal: true, formula: (row, at) => `${colLetter(at.price)}${row}-${colLetter(at.driverCost)}${row}`, sum: true },
];

const CATERING_COLS = [
  { key: "idx", label: "п/п", width: 6 },
  { key: "suppliedAt", label: "Дата/время", width: 18, get: (r) => excelDateTime(r.suppliedAt), numFmt: FMT_DATETIME },
  { key: "flightNumber", label: "Номер рейса", width: 14, get: (r) => r.flightNumber ?? "" },
  { key: "meals", label: "кол-во питание", width: 14, get: (r) => (r.serviceKind === "MEAL" ? r.quantity ?? 0 : 0), sum: true },
  { key: "drinks", label: "кол-во напитки", width: 14, get: (r) => (r.serviceKind === "WATER" ? r.quantity ?? 0 : 0), sum: true },
  { key: "mealAmount", label: "Стоимость питания", width: 18, money: true, get: (r) => (r.serviceKind === "MEAL" ? r.amount ?? 0 : 0), sum: true },
  { key: "waterAmount", label: "Стоимость напитков", width: 18, money: true, get: (r) => (r.serviceKind === "WATER" ? r.amount ?? 0 : 0), sum: true },
  { key: "deliveryCost", label: "Доставка", width: 12, money: true, get: (r) => r.deliveryCost ?? 0, sum: true },
  { key: "total", label: "Итоговая стоимость", width: 18, money: true, get: (r) => r.total ?? 0, sum: true },
  { key: "supplier", label: "Поставщик", width: 22, left: true, internal: true, get: (r) => r.supplier ?? "" },
  { key: "supplierCost", label: "Стоимость поставщику", width: 20, money: true, internal: true, get: (r) => r.supplierCost, sum: true },
  { key: "diff", label: "Разница", width: 14, money: true, internal: true, formula: (row, at) => `${colLetter(at.total)}${row}-${colLetter(at.supplierCost)}${row}`, sum: true },
];

function writeSheet(wb, registry, { internal, name }) {
  const ws = wb.addWorksheet(name);
  const city = registry.airport?.city ?? "";
  const header = registry.header ?? {};
  const all = registry.kind === "BAGGAGE" ? BAGGAGE_COLS : CATERING_COLS;
  const cols = all.filter((c) => internal || !c.internal);
  const at = Object.fromEntries(cols.map((c, i) => [c.key, i + 1]));
  const lastCol = cols.length;

  // Шапка: A1 — заказчик; справа — приложение и договор; A3 — заголовок.
  const customer = header.customerName || registry.airline?.nameFull || registry.airline?.name || "";
  ws.getCell("A1").value = customer;
  ws.getCell("A1").font = HEADER_FONT;
  const rightCol = colLetter(Math.max(lastCol, 2));
  if (header.appendixLabel) {
    ws.getCell(`${rightCol}1`).value = header.appendixLabel;
    ws.getCell(`${rightCol}1`).alignment = { horizontal: "right" };
  }
  if (header.contractNumber || header.contractDate) {
    ws.getCell(`${rightCol}2`).value = `К договору № ${header.contractNumber ?? ""} от ${plainDate(header.contractDate)}`.replace(/\s+$/, "");
    ws.getCell(`${rightCol}2`).alignment = { horizontal: "right" };
  }
  ws.getCell("A3").value = registryTitle(registry, city);
  ws.getCell("A3").font = HEADER_FONT;
  ws.mergeCells(3, 1, 3, lastCol);
  ws.getCell("A3").alignment = { horizontal: "left", vertical: "middle" };

  cols.forEach((c, i) => {
    const cell = ws.getCell(HEADER_ROW, i + 1);
    cell.value = c.label;
    cell.font = HEADER_FONT;
    cell.alignment = { wrapText: true, vertical: "middle", horizontal: "center" };
    ws.getColumn(i + 1).width = c.width;
  });
  ws.getRow(HEADER_ROW).height = 45;

  const rows = registry.rows ?? [];
  rows.forEach((r, i) => {
    const rowIdx = FIRST_ROW + i;
    const row = ws.getRow(rowIdx);
    cols.forEach((c, ci) => {
      const cell = row.getCell(ci + 1);
      if (c.key === "idx") cell.value = i + 1;
      else if (c.formula) cell.value = { formula: c.formula(rowIdx, at) };
      else {
        const v = c.get(r);
        cell.value = v == null ? null : v;
      }
      if (c.numFmt) cell.numFmt = c.numFmt;
    });
    // Поставщик воды/питания в документе для АК — справа за рамкой, как в
    // реестре №326 (в бланке под него нет колонки).
    if (!internal && registry.kind === "CATERING" && r.supplier) {
      const cell = row.getCell(lastCol + 1);
      cell.value = r.supplier;
      cell.font = BASE_FONT;
      cell.alignment = { vertical: "middle", horizontal: "left" };
    }
  });

  const totalRowIdx = FIRST_ROW + rows.length;
  const totalRow = ws.getRow(totalRowIdx);
  putTotalLabel(totalRow, "Итого:");
  cols.forEach((c, ci) => {
    if (!c.sum) return;
    const letter = colLetter(ci + 1);
    const cell = totalRow.getCell(ci + 1);
    cell.value = rows.length
      ? { formula: `SUM(${letter}${FIRST_ROW}:${letter}${totalRowIdx - 1})` }
      : 0;
    cell.font = HEADER_FONT;
  });

  finishSheet(ws, {
    lastCol,
    moneyCols: cols.map((c, i) => (c.money ? i + 1 : null)).filter(Boolean),
    leftCols: cols.map((c, i) => (c.left ? i + 1 : null)).filter(Boolean),
    headerRow: HEADER_ROW,
  });
  // Ширина колонки поставщика за рамкой (только лист для АК).
  if (!internal && registry.kind === "CATERING") ws.getColumn(lastCol + 1).width = 22;

  // Подписи — ПОСЛЕ finishSheet и без рамок (проход красит до rowCount).
  const signRow = totalRowIdx + 2;
  const put = (ref, value) => {
    const cell = ws.getCell(ref);
    cell.value = value;
    cell.font = BASE_FONT;
    cell.alignment = { horizontal: "left", vertical: "middle", wrapText: false };
  };
  const line = (title, signatory) => `${title ?? ""} ______________ ${signatory ?? ""}`.replace(/\s+/g, " ").trim();
  if (header.executorName || header.executorSignatory) {
    put(`A${signRow}`, header.executorName ?? "");
    put(`A${signRow + 1}`, line(header.executorTitle, header.executorSignatory));
  }
  if (header.customerSignatory && header.customerTitle) {
    const c = colLetter(Math.min(Math.max(Math.ceil(lastCol / 2) + 1, 2), lastCol));
    put(`${c}${signRow}`, customer);
    put(`${c}${signRow + 1}`, line(header.customerTitle, header.customerSignatory));
  }
  return ws;
}

export function buildRegistryWorkbook(registry, { internal = false } = {}) {
  const wb = new ExcelJS.Workbook();
  writeSheet(wb, registry, { internal: false, name: "Реестр" });
  if (internal && hasInternal(registry)) writeSheet(wb, registry, { internal: true, name: "Внутренний" });
  return wb;
}

// Сырое имя: запрещённые символы и длину режет downloadWorkbook — санитайзить
// здесь значило бы обрезать до 100 символов ещё без «.xlsx» и потерять расширение.
export function registryFilename(registry) {
  const kind = KIND_FILE_LABEL[registry.kind] ?? "услуги";
  const start = mskDate(registry.periodStart);
  const end = mskDate(registry.periodEnd);
  const period = start && end ? `${start.slice(0, 5)}–${end}` : "";
  return (
    `Реестр №${registry.number} ${kind} ${registry.airline?.name ?? ""} ${registry.airport?.city ?? ""} ${period}`.replace(/\s+/g, " ").trim() + ".xlsx"
  );
}

export async function downloadRegistryWorkbook(registry, opts) {
  const wb = buildRegistryWorkbook(registry, opts);
  await downloadWorkbook(wb, registryFilename(registry));
}
