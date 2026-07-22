import ExcelJS from "exceljs";
import { PERSON_CATEGORY_LABEL, normalizeCategory } from "../fapConstants";
import { findRowIndexForPerson } from "./reportRowMatch";

// ── helpers ──

const toNum = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

const placementKindLabel = (n) => {
  const k = Number(n);
  if (!Number.isFinite(k) || k <= 0) return "";
  const names = { 1: "одноместное", 2: "двухместное", 3: "трёхместное", 4: "четырёхместное" };
  return names[k] || `${k}-местное`;
};

const safeFilename = (s) =>
  String(s ?? "").replace(/[/\\?*[\]:]/g, "_").slice(0, 100);

// Имя листа в Excel ≤ 31 символ; дубли получают суффикс #2, #3, ...
export function chooseSheetName(rawName, existingNames) {
  const base = String(rawName ?? "Лист").replace(/[\\/?*[\]:]/g, "_");
  let name = base.length > 31 ? base.slice(0, 30) + "…" : base;
  if (!existingNames.has(name)) {
    existingNames.add(name);
    return name;
  }
  let n = 2;
  while (true) {
    const suffix = ` #${n}`;
    const trimmed = base.slice(0, 31 - suffix.length) + suffix;
    if (!existingNames.has(trimmed)) {
      existingNames.add(trimmed);
      return trimmed;
    }
    n += 1;
  }
}

const fmtDate = "dd.mm.yyyy";
const fmtTime = "hh:mm";

// Сдвигает Date так, чтобы при сериализации в Excel-serial (UTC-based) ячейка
// показала локальное время браузера, а не UTC. Без этого «12:12 MSK» в БД
// (хранится как «09:12Z») попадает в Excel как «09:12».
const toExcelLocal = (d) => {
  if (!(d instanceof Date) || Number.isNaN(d.getTime())) return d;
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000);
};

// Извлечь city по приоритету (см. §7 спеки).
export function pickCity(request, hotel) {
  const fromAirport = request?.airport?.city?.trim();
  if (fromAirport) return fromAirport;
  const addr = hotel?.address ?? "";
  if (!addr) return "";
  const beforeComma = addr.split(",")[0]?.trim();
  return beforeComma || "";
}

// HOTEL_NAME fallback (см. §7).
export function pickHotelName(hotel) {
  return (hotel?.name && hotel.name.trim()) || hotel?.id || "Отель";
}

// Применить ширины колонок (для листа проживания).
function applyHotelColumnWidths(ws) {
  ws.getColumn(1).width = 6;      // A = ID
  ws.getColumn(2).width = 28;     // B = ФИО
  ws.getColumn(3).width = 12;     // C = Тип
  ws.getColumn(4).width = 15;     // D = Возрастная категория
  ws.getColumn(5).width = 13;     // E = Дата заезда
  ws.getColumn(6).width = 12;     // F = Время заезда
  ws.getColumn(7).width = 13;     // G = Дата выезда
  ws.getColumn(8).width = 12;     // H = Время выезда
  ws.getColumn(9).width = 12;     // I = Номер
  ws.getColumn(10).width = 18;    // J = Вид размещения (вмещает «четырёхместное»)
  ws.getColumn(11).width = 20;    // K = Тариф
  ws.getColumn(12).width = 14;    // L = Цена за сутки
  ws.getColumn(13).width = 15;    // M = Количество суток
  ws.getColumn(14).width = 15;    // N = Количество завтраков
  ws.getColumn(15).width = 12;    // O = Завтрак
  ws.getColumn(16).width = 15;    // P = Количество обедов
  ws.getColumn(17).width = 12;    // Q = Обед
  ws.getColumn(18).width = 15;    // R = Количество ужинов
  ws.getColumn(19).width = 12;    // S = Ужин
  ws.getColumn(20).width = 15;    // T = Стоимость питания
  ws.getColumn(21).width = 10;    // U = Скидка
  ws.getColumn(22).width = 15;    // V = Стоимость проживания
  ws.getColumn(23).width = 12;    // W = Итого
}

const HOTEL_HEADERS = [
  "ID", "ФИО", "Тип", "Возрастная категория", "Дата заезда", "Время заезда",
  "Дата выезда", "Время выезда", "Номер", "Вид размещения", "Тариф", "Цена за сутки",
  "Количество суток", "Количество завтраков", "Завтрак",
  "Количество обедов", "Обед", "Количество ужинов", "Ужин",
  "Стоимость питания", "Скидка", "Стоимость проживания", "Итого",
];

// Процент возрастной скидки на проживание, выведенный из чисел строки:
// 1 − факт/(цена за сутки × сутки). «—», если базы нет (ручной ввод / легаси).
function accommodationDiscountLabel(pricePerDay, daysCount, accommodationCost) {
  const base = toNum(pricePerDay) * toNum(daysCount);
  if (base <= 0) return "—";
  const disc = 1 - toNum(accommodationCost) / base;
  return disc > 0.005 ? `${Math.round(disc * 100)}%` : "—";
}

// Извлечь даты заезда/выезда персоны (Date или null).
// Приоритет: person.arrival/departure (явное переопределение per-person)
//          → service.plan.plannedFromAt/plannedToAt (план услуги, дефолт)
//          → accommodationChesses[hotelIndex].startAt/endAt (history, последний шанс).
//
// accommodationChesses содержит ИСТОРИЮ операций (когда диспетчер заселил/выселил),
// а не плановые даты пребывания, поэтому используется только как fallback.
function getCheckInOut(person, hotelIndex, plan) {
  let inAt = person?.arrival ? new Date(person.arrival) : null;
  let outAt = person?.departure ? new Date(person.departure) : null;

  if (!inAt) {
    // plannedFromAt первичен (начало периода проживания) — симметрично getPersonDays
    // в FapHotelPage, иначе сутки и дата заезда считаются от разных моментов.
    const planned = plan?.plannedFromAt || plan?.plannedAt;
    if (planned) inAt = new Date(planned);
  }
  if (!outAt && plan?.plannedToAt) {
    outAt = new Date(plan.plannedToAt);
  }

  if (!inAt || !outAt) {
    const chess =
      (person?.accommodationChesses ?? []).find(
        (c) => c != null && Number(c.hotelIndex) === Number(hotelIndex)
      ) || (person?.accommodationChesses ?? [])[0];
    if (!inAt && chess?.startAt) inAt = new Date(chess.startAt);
    if (!outAt && chess?.endAt) outAt = new Date(chess.endAt);
  }

  return { inAt, outAt };
}

// ── основной API ──

/**
 * Добавить лист «Проживание (отель N)».
 *
 * opts.rows: готовый массив строк отчёта (формат reportRows из FapHotelPage).
 * Иначе — берёт сохранённые строки из request.hotelReports[hotelIndex].
 */
export function addHotelSheet(wb, opts) {
  const { request, hotelIndex, sheetNames } = opts;
  const hotel = request?.livingService?.hotels?.[hotelIndex];
  if (!hotel) return null;

  const hotelName = pickHotelName(hotel);
  const city = pickCity(request, hotel);
  const ws = wb.addWorksheet(chooseSheetName(hotelName, sheetNames));

  // ── Шапка ──
  ws.getCell("A1").value = request?.airline?.name ?? "";
  ws.getCell("W1").value = "Договор № или \"по согласованию\"";
  ws.getCell("W1").alignment = { horizontal: "right" };
  const flightPart = request?.flightDate
    ? ` от ${new Date(request.flightDate).toLocaleDateString("ru-RU")}`
    : "";
  ws.getCell("C3").value =
    `Детализация оказанных услуг пассажиров задерженного рейса № ${request?.flightNumber ?? ""}${flightPart} г. ${city} гостиница ${hotelName}`;
  [ws.getCell("A1"), ws.getCell("W1"), ws.getCell("C3")].forEach((c) => {
    c.font = { name: "Calibri", size: 12, bold: true };
  });

  // ── Заголовки колонок (row 4) ──
  HOTEL_HEADERS.forEach((label, i) => {
    const cell = ws.getCell(4, i + 1);
    cell.value = label;
    cell.font = { name: "Calibri", size: 12, bold: true };
    cell.alignment = { wrapText: true, vertical: "middle", horizontal: "center" };
  });
  ws.getRow(4).height = 51;

  // ── Строки гостей ──
  const people = hotel?.people ?? [];
  let rowIdx = 5;

  // Источник строк: готовый opts.rows (из buildReportRows) ИЛИ сохранённый отчёт.
  let sourceRows;
  if (Array.isArray(opts.rows)) {
    sourceRows = opts.rows;
  } else {
    const saved = (request?.hotelReports ?? []).find(
      (r) => r.hotelIndex === Number(hotelIndex)
    );
    sourceRows = saved?.reportRows ?? [];
  }
  // Матч к гостям: personId — первично, ФИО — fallback для старых строк
  // (consumed-сет: дубликаты ФИО получают разные строки).
  const consumed = new Set();
  const rowsByPersonIdx = people.map((p) => {
    const idx = findRowIndexForPerson(sourceRows, p, consumed);
    if (idx < 0) {
      return { tariffName: "", pricePerDay: 0, placementKind: 0, roomNumber: "", daysCount: 0, breakfast: 0, lunch: 0, dinner: 0, foodCost: 0, accommodationCost: 0 };
    }
    consumed.add(idx);
    const r = sourceRows[idx];
    return {
      tariffName: (r.tariffName ?? "").trim() || (r.roomCategory ?? ""), // legacy → roomCategory
      pricePerDay: toNum(r.pricePerDay),
      placementKind: Number(r.placementKind) || 0,
      roomNumber: r.roomNumber ?? "",
      daysCount: toNum(r.daysCount),
      breakfast: toNum(r.breakfast),
      lunch: toNum(r.lunch),
      dinner: toNum(r.dinner),
      foodCost: toNum(r.foodCost),
      accommodationCost: toNum(r.accommodationCost),
    };
  });

  const livingPlan = request?.livingService?.plan;
  people.forEach((p, i) => {
    const r = rowsByPersonIdx[i];
    const { inAt, outAt } = getCheckInOut(p, hotelIndex, livingPlan);
    const row = ws.getRow(rowIdx);

    row.getCell(1).value = i + 1; // A
    row.getCell(2).value = p.fullName ?? ""; // B
    row.getCell(3).value = p.personType === "CREW" ? "Экипаж" : "Пассажир"; // C
    row.getCell(4).value = PERSON_CATEGORY_LABEL[normalizeCategory(p.personCategory)] ?? "Взрослый"; // D
    if (inAt) {
      const inLocal = toExcelLocal(inAt);
      row.getCell(5).value = inLocal;
      row.getCell(5).numFmt = fmtDate;
      row.getCell(6).value = inLocal;
      row.getCell(6).numFmt = fmtTime;
    }
    if (outAt) {
      const outLocal = toExcelLocal(outAt);
      row.getCell(7).value = outLocal;
      row.getCell(7).numFmt = fmtDate;
      row.getCell(8).value = outLocal;
      row.getCell(8).numFmt = fmtTime;
    }
    row.getCell(9).value = r.roomNumber;                        // I Номер
    row.getCell(10).value = placementKindLabel(r.placementKind); // J Вид размещения ("" для legacy)
    row.getCell(11).value = r.tariffName;                       // K Тариф
    if (r.pricePerDay > 0) row.getCell(12).value = r.pricePerDay; // L Цена за сутки
    row.getCell(13).value = r.daysCount;                        // M Суток
    row.getCell(14).value = r.breakfast > 0 ? 1 : 0;            // N (флаг — как раньше)
    row.getCell(15).value = r.breakfast;                        // O
    row.getCell(16).value = r.lunch > 0 ? 1 : 0;               // P
    row.getCell(17).value = r.lunch;                            // Q
    row.getCell(18).value = r.dinner > 0 ? 1 : 0;              // R
    row.getCell(19).value = r.dinner;                           // S
    row.getCell(20).value = r.foodCost;                         // T Стоимость питания
    row.getCell(21).value = accommodationDiscountLabel(r.pricePerDay, r.daysCount, r.accommodationCost); // U Скидка
    row.getCell(22).value = r.accommodationCost;                // V Стоимость проживания
    row.getCell(23).value = r.foodCost + r.accommodationCost;   // W Итого

    rowIdx += 1;
  });

  const lastPersonRow = rowIdx - 1;

  // ── Блок «Трансфер» (одна пустая строка + 3 строки) ──
  rowIdx += 1; // gap
  const tHeaderRow = rowIdx;
  ws.mergeCells(`B${tHeaderRow}:H${tHeaderRow}`);
  const tHdr = ws.getCell(`B${tHeaderRow}`);
  tHdr.value = "Трансфер";
  tHdr.font = { name: "Calibri", size: 12, bold: true };
  tHdr.alignment = { horizontal: "center" };
  rowIdx += 1;

  // ARRIVAL
  const arrival = request?.transferService;
  const aDrivers = arrival?.drivers ?? [];
  const aFirstType = aDrivers.find((d) => d.vehicleType)?.vehicleType ?? "";
  const aHasAnyCost = aDrivers.some((d) => d.reportCost != null);
  const aCost = aHasAnyCost
    ? aDrivers.reduce((s, d) => s + (d.reportCost ?? 0), 0)
    : null;
  const aRow = ws.getRow(rowIdx);
  aRow.height = 34;
  aRow.getCell(2).value = `аэропорт-гостиница ${hotelName}`;
  aRow.getCell(3).value = aFirstType;
  if (arrival?.plan?.plannedAt) {
    const dt = toExcelLocal(new Date(arrival.plan.plannedAt));
    aRow.getCell(5).value = dt;
    aRow.getCell(5).numFmt = fmtDate;
    aRow.getCell(6).value = dt;
    aRow.getCell(6).numFmt = fmtTime;
  }
  if (aCost != null) aRow.getCell(23).value = aCost;
  rowIdx += 1;

  // DEPARTURE
  const departure = request?.departureTransferService;
  const dDrivers = departure?.drivers ?? [];
  const dFirstType = dDrivers.find((d) => d.vehicleType)?.vehicleType ?? "";
  const dHasAnyCost = dDrivers.some((d) => d.reportCost != null);
  const dCost = dHasAnyCost
    ? dDrivers.reduce((s, d) => s + (d.reportCost ?? 0), 0)
    : null;
  const dRow = ws.getRow(rowIdx);
  dRow.height = 34;
  dRow.getCell(2).value = `гостиница ${hotelName}-аэропорт`;
  dRow.getCell(3).value = dFirstType;
  if (departure?.plan?.plannedAt) {
    const dt = toExcelLocal(new Date(departure.plan.plannedAt));
    dRow.getCell(5).value = dt;
    dRow.getCell(5).numFmt = fmtDate;
    dRow.getCell(6).value = dt;
    dRow.getCell(6).numFmt = fmtTime;
  }
  if (dCost != null) dRow.getCell(23).value = dCost;
  const lastTransferRow = rowIdx;
  rowIdx += 1;

  // ── Строка «Итого:» ──
  const totalRow = ws.getRow(rowIdx);
  totalRow.getCell(1).value = "Итого:";
  totalRow.getCell(1).font = { name: "Calibri", size: 12, bold: true };
  if (lastPersonRow >= 5) {
    totalRow.getCell(13).value = { formula: `SUM(M5:M${lastPersonRow})` };
    totalRow.getCell(14).value = { formula: `SUM(N5:N${lastPersonRow})` };
    totalRow.getCell(15).value = { formula: `SUM(O5:O${lastPersonRow})` };
    totalRow.getCell(16).value = { formula: `SUM(P5:P${lastPersonRow})` };
    totalRow.getCell(17).value = { formula: `SUM(Q5:Q${lastPersonRow})` };
    totalRow.getCell(18).value = { formula: `SUM(R5:R${lastPersonRow})` };
    totalRow.getCell(19).value = { formula: `SUM(S5:S${lastPersonRow})` };
    totalRow.getCell(20).value = { formula: `SUM(T5:T${lastPersonRow})` };
    // U (Скидка) — не суммируется.
    totalRow.getCell(22).value = { formula: `SUM(V5:V${lastPersonRow})` };
  }
  totalRow.getCell(23).value = {
    formula: `SUM(W5:W${lastTransferRow})`,
  };

  applyHotelColumnWidths(ws);
  return ws;
}

const TRANSFER_HEADERS = [
  "№", "ФИО водителя", "Телефон", "Адрес отправления", "Адрес прибытия",
  "Дата подачи", "Время подачи", "Тип ТС", "Сумма",
];

export function addTransferSheet(wb, opts) {
  const { request, direction, sheetNames } = opts;
  const service =
    direction === "DEPARTURE"
      ? request?.departureTransferService
      : request?.transferService;

  const baseName =
    direction === "DEPARTURE" ? "Трансфер (в аэропорт)" : "Трансфер (в гостиницу)";
  const ws = wb.addWorksheet(chooseSheetName(baseName, sheetNames));
  const city = pickCity(request, request?.livingService?.hotels?.[0]);

  ws.getCell("A1").value = request?.airline?.name ?? "";
  ws.getCell("A1").font = { name: "Calibri", size: 12, bold: true };
  ws.getCell("C3").value =
    `${baseName} по рейсу № ${request?.flightNumber ?? ""} г. ${city}`;
  ws.getCell("C3").font = { name: "Calibri", size: 12, bold: true };

  TRANSFER_HEADERS.forEach((label, i) => {
    const cell = ws.getCell(4, i + 1);
    cell.value = label;
    cell.font = { name: "Calibri", size: 12, bold: true };
    cell.alignment = { wrapText: true, vertical: "middle", horizontal: "center" };
  });
  ws.getRow(4).height = 51;
  ws.getColumn(1).width = 6;      // №
  ws.getColumn(2).width = 26;     // ФИО водителя
  ws.getColumn(3).width = 16;     // Телефон
  ws.getColumn(4).width = 30;     // Адрес отправления
  ws.getColumn(5).width = 30;     // Адрес прибытия
  ws.getColumn(6).width = 13;     // Дата подачи
  ws.getColumn(7).width = 11;     // Время подачи
  ws.getColumn(8).width = 22;     // Тип ТС
  ws.getColumn(9).width = 12;     // Сумма

  const drivers = service?.drivers ?? [];
  drivers.forEach((d, i) => {
    const row = ws.getRow(5 + i);
    row.getCell(1).value = i + 1;
    row.getCell(2).value = d.fullName ?? "";
    row.getCell(3).value = d.phone ?? "";
    row.getCell(4).value = d.addressFrom ?? "";
    row.getCell(5).value = d.addressTo ?? "";
    if (d.pickupAt) {
      const dt = toExcelLocal(new Date(d.pickupAt));
      row.getCell(6).value = dt;
      row.getCell(6).numFmt = fmtDate;
      row.getCell(7).value = dt;
      row.getCell(7).numFmt = fmtTime;
    }
    row.getCell(8).value = d.vehicleType ?? "";
    if (d.reportCost != null) row.getCell(9).value = d.reportCost;
  });

  const last = drivers.length > 0 ? 4 + drivers.length : 4;
  const totalRow = ws.getRow(last + 1);
  totalRow.getCell(1).value = "Итого:";
  totalRow.getCell(1).font = { name: "Calibri", size: 12, bold: true };
  if (drivers.length > 0) {
    totalRow.getCell(9).value = { formula: `SUM(I5:I${last})` };
  }
  return ws;
}

export async function downloadWorkbook(wb, filename) {
  const buffer = await wb.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = safeFilename(filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 0);
}

// Удобные обёртки для каждой кнопки.

export async function downloadHotelReport(request, hotelIndex, opts) {
  const wb = new ExcelJS.Workbook();
  const sheetNames = new Set();
  addHotelSheet(wb, { request, hotelIndex, sheetNames, ...opts });
  const hotel = request?.livingService?.hotels?.[hotelIndex];
  const filename = `${request?.airline?.name ?? ""} гостиница ${pickHotelName(hotel)} г. ${pickCity(request, hotel)}.xlsx`;
  await downloadWorkbook(wb, filename);
}

// Сводный лист «Сводка» — все гостиницы заявки одним списком + общий блок трансфера.
// Используется как первый лист в per-living и per-request отчётах.
export function addCombinedSheet(wb, opts) {
  const { request, sheetNames, includeTransfer = true } = opts;
  const ws = wb.addWorksheet(chooseSheetName("Сводка", sheetNames));
  const city = pickCity(request, request?.livingService?.hotels?.[0]);

  // ── Шапка ──
  ws.getCell("A1").value = request?.airline?.name ?? "";
  ws.getCell("W1").value = "Договор № или \"по согласованию\"";
  ws.getCell("W1").alignment = { horizontal: "right" };
  const flightPart = request?.flightDate
    ? ` от ${new Date(request.flightDate).toLocaleDateString("ru-RU")}`
    : "";
  ws.getCell("C3").value =
    `Детализация оказанных услуг пассажиров задерженного рейса № ${request?.flightNumber ?? ""}${flightPart} г. ${city}`;
  [ws.getCell("A1"), ws.getCell("W1"), ws.getCell("C3")].forEach((c) => {
    c.font = { name: "Calibri", size: 12, bold: true };
  });

  // ── Заголовки колонок (row 4) ──
  HOTEL_HEADERS.forEach((label, i) => {
    const cell = ws.getCell(4, i + 1);
    cell.value = label;
    cell.font = { name: "Calibri", size: 12, bold: true };
    cell.alignment = { wrapText: true, vertical: "middle", horizontal: "center" };
  });
  ws.getRow(4).height = 51;

  // ── Группы по отелям (с сабхедерами) ──
  let rowIdx = 5;
  let firstPersonRow = null;
  let lastPersonRow = null;
  let runningId = 0;

  const hotels = request?.livingService?.hotels ?? [];
  hotels.forEach((hotel, hotelIndex) => {
    if (!hotel) return;
    const people = hotel?.people ?? [];
    if (people.length === 0) return; // пустые гостиницы пропускаем в сводке

    // Сабхедер гостиницы — merged A:W
    ws.mergeCells(`A${rowIdx}:W${rowIdx}`);
    const hdr = ws.getCell(`A${rowIdx}`);
    hdr.value = `Гостиница: ${pickHotelName(hotel)}${hotel?.address ? ` · ${hotel.address}` : ""}`;
    hdr.font = { name: "Calibri", size: 12, bold: true };
    hdr.alignment = { horizontal: "left" };
    hdr.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFEEF2F7" },
    };
    rowIdx += 1;

    // Источник данных: saved hotelReport, fallback на нули
    const saved = (request?.hotelReports ?? []).find(
      (r) => r.hotelIndex === Number(hotelIndex)
    );
    const savedRows = saved?.reportRows ?? [];

    // Матч к гостям: personId — первично, ФИО — fallback для старых строк.
    const consumed = new Set();
    people.forEach((p) => {
      const idx = findRowIndexForPerson(savedRows, p, consumed);
      const matched = idx >= 0 ? savedRows[idx] : null;
      if (idx >= 0) consumed.add(idx);
      const r = matched ?? {};
      const foodCost = toNum(r.foodCost);
      const accommodationCost = toNum(r.accommodationCost);
      const { inAt, outAt } = getCheckInOut(p, hotelIndex, request?.livingService?.plan);
      const row = ws.getRow(rowIdx);

      runningId += 1;
      row.getCell(1).value = runningId;
      row.getCell(2).value = p.fullName ?? "";
      row.getCell(3).value = p.personType === "CREW" ? "Экипаж" : "Пассажир";
      row.getCell(4).value = PERSON_CATEGORY_LABEL[normalizeCategory(p.personCategory)] ?? "Взрослый";
      if (inAt) {
        const inLocal = toExcelLocal(inAt);
        row.getCell(5).value = inLocal;  row.getCell(5).numFmt = fmtDate;
        row.getCell(6).value = inLocal;  row.getCell(6).numFmt = fmtTime;
      }
      if (outAt) {
        const outLocal = toExcelLocal(outAt);
        row.getCell(7).value = outLocal; row.getCell(7).numFmt = fmtDate;
        row.getCell(8).value = outLocal; row.getCell(8).numFmt = fmtTime;
      }
      const pricePerDay = toNum(r.pricePerDay);
      row.getCell(9).value = r.roomNumber ?? "";                                    // I Номер
      row.getCell(10).value = placementKindLabel(Number(r.placementKind) || 0);     // J Вид размещения
      row.getCell(11).value = (r.tariffName ?? "").trim() || (r.roomCategory ?? ""); // K Тариф
      if (pricePerDay > 0) row.getCell(12).value = pricePerDay;                      // L Цена за сутки
      row.getCell(13).value = toNum(r.daysCount);                                    // M Суток
      row.getCell(14).value = toNum(r.breakfast) > 0 ? 1 : 0;                        // N
      row.getCell(15).value = toNum(r.breakfast);                                    // O
      row.getCell(16).value = toNum(r.lunch) > 0 ? 1 : 0;                            // P
      row.getCell(17).value = toNum(r.lunch);                                        // Q
      row.getCell(18).value = toNum(r.dinner) > 0 ? 1 : 0;                           // R
      row.getCell(19).value = toNum(r.dinner);                                       // S
      row.getCell(20).value = foodCost;                                             // T Ст-ть питания
      row.getCell(21).value = accommodationDiscountLabel(pricePerDay, r.daysCount, accommodationCost); // U Скидка
      row.getCell(22).value = accommodationCost;                                     // V Ст-ть проживания
      row.getCell(23).value = foodCost + accommodationCost;                          // W Итого

      if (firstPersonRow == null) firstPersonRow = rowIdx;
      lastPersonRow = rowIdx;
      rowIdx += 1;
    });
  });

  // ── Блок «Трансфер» ──
  let lastTransferRow = null;
  if (includeTransfer) {
    rowIdx += 1; // gap
    const tHeaderRow = rowIdx;
    ws.mergeCells(`B${tHeaderRow}:H${tHeaderRow}`);
    const tHdr = ws.getCell(`B${tHeaderRow}`);
    tHdr.value = "Трансфер";
    tHdr.font = { name: "Calibri", size: 12, bold: true };
    tHdr.alignment = { horizontal: "center" };
    rowIdx += 1;

    // ARRIVAL
    const arrival = request?.transferService;
    const aDrivers = arrival?.drivers ?? [];
    const aFirstType = aDrivers.find((d) => d.vehicleType)?.vehicleType ?? "";
    const aHasAnyCost = aDrivers.some((d) => d.reportCost != null);
    const aCost = aHasAnyCost ? aDrivers.reduce((s, d) => s + (d.reportCost ?? 0), 0) : null;
    if (arrival?.plan?.enabled) {
      const aRow = ws.getRow(rowIdx);
      aRow.height = 34;
      aRow.getCell(2).value = "аэропорт → гостиницы";
      aRow.getCell(3).value = aFirstType;
      if (arrival?.plan?.plannedAt) {
        const dt = toExcelLocal(new Date(arrival.plan.plannedAt));
        aRow.getCell(5).value = dt; aRow.getCell(5).numFmt = fmtDate;
        aRow.getCell(6).value = dt; aRow.getCell(6).numFmt = fmtTime;
      }
      if (aCost != null) aRow.getCell(23).value = aCost;
      lastTransferRow = rowIdx;
      rowIdx += 1;
    }

    // DEPARTURE
    const departure = request?.departureTransferService;
    const dDrivers = departure?.drivers ?? [];
    const dFirstType = dDrivers.find((d) => d.vehicleType)?.vehicleType ?? "";
    const dHasAnyCost = dDrivers.some((d) => d.reportCost != null);
    const dCost = dHasAnyCost ? dDrivers.reduce((s, d) => s + (d.reportCost ?? 0), 0) : null;
    if (departure?.plan?.enabled) {
      const dRow = ws.getRow(rowIdx);
      dRow.height = 34;
      dRow.getCell(2).value = "гостиницы → аэропорт";
      dRow.getCell(3).value = dFirstType;
      if (departure?.plan?.plannedAt) {
        const dt = toExcelLocal(new Date(departure.plan.plannedAt));
        dRow.getCell(5).value = dt; dRow.getCell(5).numFmt = fmtDate;
        dRow.getCell(6).value = dt; dRow.getCell(6).numFmt = fmtTime;
      }
      if (dCost != null) dRow.getCell(23).value = dCost;
      lastTransferRow = rowIdx;
      rowIdx += 1;
    }
  }

  // ── Итого ──
  const totalRow = ws.getRow(rowIdx);
  totalRow.getCell(1).value = "Итого:";
  totalRow.getCell(1).font = { name: "Calibri", size: 12, bold: true };
  if (firstPersonRow != null && lastPersonRow != null) {
    totalRow.getCell(13).value = { formula: `SUM(M${firstPersonRow}:M${lastPersonRow})` };
    totalRow.getCell(14).value = { formula: `SUM(N${firstPersonRow}:N${lastPersonRow})` };
    totalRow.getCell(15).value = { formula: `SUM(O${firstPersonRow}:O${lastPersonRow})` };
    totalRow.getCell(16).value = { formula: `SUM(P${firstPersonRow}:P${lastPersonRow})` };
    totalRow.getCell(17).value = { formula: `SUM(Q${firstPersonRow}:Q${lastPersonRow})` };
    totalRow.getCell(18).value = { formula: `SUM(R${firstPersonRow}:R${lastPersonRow})` };
    totalRow.getCell(19).value = { formula: `SUM(S${firstPersonRow}:S${lastPersonRow})` };
    totalRow.getCell(20).value = { formula: `SUM(T${firstPersonRow}:T${lastPersonRow})` };
    // U (Скидка) — не суммируется.
    totalRow.getCell(22).value = { formula: `SUM(V${firstPersonRow}:V${lastPersonRow})` };
  }
  const sumStart = firstPersonRow ?? 5;
  const sumEnd = lastTransferRow ?? lastPersonRow ?? sumStart;
  totalRow.getCell(23).value = { formula: `SUM(W${sumStart}:W${sumEnd})` };

  applyHotelColumnWidths(ws);
  return ws;
}

export async function downloadLivingReport(request) {
  const wb = new ExcelJS.Workbook();
  const sheetNames = new Set();
  addCombinedSheet(wb, { request, sheetNames, includeTransfer: false });
  (request?.livingService?.hotels ?? []).forEach((_, hotelIndex) => {
    addHotelSheet(wb, { request, hotelIndex, sheetNames });
  });
  const filename = `${request?.airline?.name ?? ""} заявка ${request?.requestNumber ?? ""} проживание.xlsx`;
  await downloadWorkbook(wb, filename);
}

export async function downloadTransferReport(request, direction) {
  const wb = new ExcelJS.Workbook();
  const sheetNames = new Set();
  addTransferSheet(wb, { request, direction, sheetNames });
  const label = direction === "DEPARTURE" ? "трансфер вылет" : "трансфер прилёт";
  const filename = `${request?.airline?.name ?? ""} заявка ${request?.requestNumber ?? ""} ${label}.xlsx`;
  await downloadWorkbook(wb, filename);
}

export async function downloadRequestReport(request, notifyError) {
  const livingEnabled = request?.livingService?.plan?.enabled;
  const arrEnabled = request?.transferService?.plan?.enabled;
  const depEnabled = request?.departureTransferService?.plan?.enabled;
  if (!livingEnabled && !arrEnabled && !depEnabled) {
    notifyError?.("Нет данных для отчёта");
    return;
  }
  const wb = new ExcelJS.Workbook();
  const sheetNames = new Set();
  // Первый лист — сводка по всей заявке (все гостиницы + блок трансфера).
  if (livingEnabled || arrEnabled || depEnabled) {
    addCombinedSheet(wb, { request, sheetNames, includeTransfer: arrEnabled || depEnabled });
  }
  if (livingEnabled) {
    (request?.livingService?.hotels ?? []).forEach((_, hotelIndex) => {
      addHotelSheet(wb, { request, hotelIndex, sheetNames });
    });
  }
  if (arrEnabled) addTransferSheet(wb, { request, direction: "ARRIVAL", sheetNames });
  if (depEnabled) addTransferSheet(wb, { request, direction: "DEPARTURE", sheetNames });
  const filename = `${request?.airline?.name ?? ""} заявка ${request?.requestNumber ?? ""}.xlsx`;
  await downloadWorkbook(wb, filename);
}
