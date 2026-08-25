import ExcelJS from "exceljs";
import { PERSON_CATEGORY_LABEL, normalizeCategory, placementKindLabel } from "../fapConstants.js";
import { driverFactCount } from "../fapTransferFact.js";
import { findRowIndexForPerson } from "./reportRowMatch.js";

// ── helpers ──

const toNum = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

const safeFilename = (s) =>
  String(s ?? "").replace(/[/\\?*[\]:]/g, "_").slice(0, 100);

const prefixedSheetName = (name, prefix) =>
  prefix ? `${prefix} ${name}` : name;

// Имя листа в Excel ≤ 31 символ; дубли получают суффикс #2, #3, ...
export function chooseSheetName(rawName, existingNames) {
  const base = String(rawName ?? "Лист").replace(/[\\/?*[\]:]/g, "_");
  let name = base.length > 31 ? base.slice(0, 30) + "…" : base;
  if (!existingNames.has(name)) {
    existingNames.add(name);
    return name;
  }
  let n = 2;
  for (;;) {
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

const BASE_FONT = { name: "Times New Roman", size: 12 };
const HEADER_FONT = { ...BASE_FONT, bold: true };
const FMT_MONEY = "#,##0.00";
const THIN_BORDER = {
  top: { style: "thin" },
  left: { style: "thin" },
  bottom: { style: "thin" },
  right: { style: "thin" },
};

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
  ws.getColumn(20).width = 18;    // T = Количество ланчбоксов
  ws.getColumn(21).width = 12;    // U = Ланчбокс (цена за штуку)
  ws.getColumn(22).width = 15;    // V = Стоимость питания
  ws.getColumn(23).width = 10;    // W = Скидка
  ws.getColumn(24).width = 15;    // X = Стоимость проживания
  ws.getColumn(25).width = 12;    // Y = Итого
}

// Применить ширины колонок раскладки TRANSFER_HEADERS —
// общей для листов трансфера и доставки багажа.
function applyTransferColumnWidths(ws) {
  ws.getColumn(1).width = 6;      // №
  ws.getColumn(2).width = 26;     // ФИО водителя
  ws.getColumn(3).width = 16;     // Телефон
  ws.getColumn(4).width = 30;     // Адрес отправления
  ws.getColumn(5).width = 30;     // Адрес прибытия
  ws.getColumn(6).width = 13;     // Дата подачи
  ws.getColumn(7).width = 11;     // Время подачи
  ws.getColumn(8).width = 22;     // Тип ТС
  ws.getColumn(9).width = 12;     // Перевезено
  ws.getColumn(10).width = 12;    // Сумма
}

// Финальный проход по телу листа: шрифт, выравнивание, сетка, формат денег.
//
// Почему по ячейкам, а не через `ws.getColumn(n).font` / `ws.getRow(n).font`:
// их `_applyStyle` перетирает стиль КАЖДОЙ ячейки безусловно — ломается контракт
// «докрашиваем только незаданное»; к тому же стиль колонки в XML красит колонку
// целиком до конца листа, а не диапазон таблицы.
// Осознанные стили (жирные заголовки и «Итого», right у Y1, left у сабхедера
// гостиницы, центр у «Трансфера», numFmt дат/времени) проход не трогает.
// Границы ставятся всем ячейкам диапазона, включая пустые: таблица должна
// выглядеть сеткой. Но строки из `skipRows` — разделители между таблицами, они
// вне таблицы: сетка на них склеила бы два блока в один.
function finishSheet(ws, { lastCol, moneyCols, leftCols, headerRow = 4, skipRows = [] }) {
  const money = new Set(moneyCols);
  const left = new Set(leftCols);
  const skip = new Set(skipRows);
  for (let r = headerRow; r <= ws.rowCount; r += 1) {
    if (skip.has(r)) continue;
    const row = ws.getRow(r);
    for (let c = 1; c <= lastCol; c += 1) {
      const cell = row.getCell(c);
      if (!cell.font) cell.font = BASE_FONT;
      if (!cell.alignment) {
        cell.alignment = {
          vertical: "middle",
          wrapText: true,
          horizontal: left.has(c) ? "left" : "center",
        };
      }
      cell.border = THIN_BORDER;
      // `cell.master === cell` истинно для обычных ячеек и master merged-региона,
      // ложно для slave: в exceljs 4.4 slave делит ОБЪЕКТ стиля с master, и запись
      // numFmt через slave протекла бы в формат сабхедера «Гостиница: …».
      if (money.has(c) && cell.master === cell && !cell.numFmt) cell.numFmt = FMT_MONEY;
    }
  }
  // Шапка (строки 1..headerRow) остаётся на экране при прокрутке списка гостей.
  ws.views = [{ state: "frozen", ySplit: headerRow }];
}

const HOTEL_HEADERS = [
  "ID", "ФИО", "Тип", "Возрастная категория", "Дата заезда", "Время заезда",
  "Дата выезда", "Время выезда", "Номер", "Вид размещения", "Тариф", "Цена за сутки",
  "Количество суток", "Количество завтраков", "Завтрак",
  "Количество обедов", "Обед", "Количество ужинов", "Ужин",
  "Количество ланчбоксов", "Ланчбокс",
  "Стоимость питания", "Скидка", "Стоимость проживания", "Итого",
];

// Количество порций приёма: легаси-строки без количеств — 1 при цене > 0.
const mealCountOf = (r, priceField, countField) =>
  r?.[countField] != null ? toNum(r[countField]) : (toNum(r?.[priceField]) > 0 ? 1 : 0);

// Число ланчбоксов гостя: новое поле lunchboxCount; иначе легаси — число тумблеров.
const lunchboxCountOf = (r) =>
  r?.lunchboxCount != null
    ? toNum(r.lunchboxCount)
    : (r?.breakfastLunchbox ? 1 : 0) + (r?.lunchLunchbox ? 1 : 0) + (r?.dinnerLunchbox ? 1 : 0);

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
  const { request, hotelIndex, sheetNames, sheetPrefix = "" } = opts;
  const hotel = request?.livingService?.hotels?.[hotelIndex];
  if (!hotel) return null;

  const hotelName = pickHotelName(hotel);
  const city = pickCity(request, hotel);
  const ws = wb.addWorksheet(chooseSheetName(prefixedSheetName(hotelName, sheetPrefix), sheetNames));

  // ── Шапка ──
  ws.getCell("A1").value = request?.airline?.nameFull || request?.airline?.name || "";
  ws.getCell("Y1").value = "Договор № или \"по согласованию\"";
  ws.getCell("Y1").alignment = { horizontal: "right" };
  const flightPart = request?.flightDate
    ? ` от ${new Date(request.flightDate).toLocaleDateString("ru-RU")}`
    : "";
  ws.getCell("C3").value =
    `Детализация оказанных услуг пассажиров задержанного рейса № ${request?.flightNumber ?? ""}${flightPart} г. ${city} гостиница ${hotelName}`;
  [ws.getCell("A1"), ws.getCell("Y1"), ws.getCell("C3")].forEach((c) => {
    c.font = HEADER_FONT;
  });

  // ── Заголовки колонок (row 4) ──
  HOTEL_HEADERS.forEach((label, i) => {
    const cell = ws.getCell(4, i + 1);
    cell.value = label;
    cell.font = HEADER_FONT;
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
      return {
        tariffName: "", pricePerDay: 0, placementKind: 0, roomNumber: "", daysCount: 0,
        breakfast: 0, lunch: 0, dinner: 0,
        breakfastCount: 0, lunchCount: 0, dinnerCount: 0, lunchboxCount: 0, lunchboxPrice: 0,
        foodCost: 0, accommodationCost: 0,
      };
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
      breakfastCount: mealCountOf(r, "breakfast", "breakfastCount"),
      lunchCount: mealCountOf(r, "lunch", "lunchCount"),
      dinnerCount: mealCountOf(r, "dinner", "dinnerCount"),
      lunchboxCount: lunchboxCountOf(r),
      lunchboxPrice: toNum(r.lunchboxPrice),
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
    row.getCell(14).value = r.breakfastCount;                   // N Кол-во завтраков
    row.getCell(15).value = r.breakfast;                        // O Цена завтрака (за порцию)
    row.getCell(16).value = r.lunchCount;                       // P
    row.getCell(17).value = r.lunch;                            // Q
    row.getCell(18).value = r.dinnerCount;                      // R
    row.getCell(19).value = r.dinner;                           // S
    row.getCell(20).value = r.lunchboxCount;                    // T Количество ланчбоксов
    row.getCell(21).value = r.lunchboxPrice;                    // U Ланчбокс (цена за штуку)
    row.getCell(22).value = r.foodCost;                         // V Стоимость питания
    row.getCell(23).value = accommodationDiscountLabel(r.pricePerDay, r.daysCount, r.accommodationCost); // W Скидка
    row.getCell(24).value = r.accommodationCost;                // X Стоимость проживания
    row.getCell(25).value = r.foodCost + r.accommodationCost;   // Y Итого

    rowIdx += 1;
  });

  const lastPersonRow = rowIdx - 1;

  // ── Блок «Трансфер» (одна пустая строка + 3 строки) ──
  const gapRow = rowIdx; // строка-разделитель: остаётся без сетки
  rowIdx += 1;
  const tHeaderRow = rowIdx;
  ws.mergeCells(`B${tHeaderRow}:H${tHeaderRow}`);
  const tHdr = ws.getCell(`B${tHeaderRow}`);
  tHdr.value = "Трансфер";
  tHdr.font = HEADER_FONT;
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
  aRow.getCell(2).value = `аэропорт-гостиница ${hotelName}`;
  aRow.getCell(3).value = aFirstType;
  if (arrival?.plan?.plannedAt) {
    const dt = toExcelLocal(new Date(arrival.plan.plannedAt));
    aRow.getCell(5).value = dt;
    aRow.getCell(5).numFmt = fmtDate;
    aRow.getCell(6).value = dt;
    aRow.getCell(6).numFmt = fmtTime;
  }
  if (aCost != null) aRow.getCell(25).value = aCost;
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
  dRow.getCell(2).value = `гостиница ${hotelName}-аэропорт`;
  dRow.getCell(3).value = dFirstType;
  if (departure?.plan?.plannedAt) {
    const dt = toExcelLocal(new Date(departure.plan.plannedAt));
    dRow.getCell(5).value = dt;
    dRow.getCell(5).numFmt = fmtDate;
    dRow.getCell(6).value = dt;
    dRow.getCell(6).numFmt = fmtTime;
  }
  if (dCost != null) dRow.getCell(25).value = dCost;
  const lastTransferRow = rowIdx;
  rowIdx += 1;

  // ── Строка «Итого:» ──
  const totalRow = ws.getRow(rowIdx);
  totalRow.getCell(1).value = "Итого:";
  totalRow.getCell(1).font = HEADER_FONT;
  // Явное выравнивание: иначе проход центрирует с переносом и в колонке шириной 6
  // слово уезжает на две строки.
  totalRow.getCell(1).alignment = { vertical: "middle", horizontal: "left" };
  if (lastPersonRow >= 5) {
    totalRow.getCell(13).value = { formula: `SUM(M5:M${lastPersonRow})` };
    totalRow.getCell(14).value = { formula: `SUM(N5:N${lastPersonRow})` };
    // Деньги приёма = Σ(кол-во × цена за порцию) — простой SUM цен потерял смысл.
    totalRow.getCell(15).value = { formula: `SUMPRODUCT(N5:N${lastPersonRow},O5:O${lastPersonRow})` };
    totalRow.getCell(16).value = { formula: `SUM(P5:P${lastPersonRow})` };
    totalRow.getCell(17).value = { formula: `SUMPRODUCT(P5:P${lastPersonRow},Q5:Q${lastPersonRow})` };
    totalRow.getCell(18).value = { formula: `SUM(R5:R${lastPersonRow})` };
    totalRow.getCell(19).value = { formula: `SUMPRODUCT(R5:R${lastPersonRow},S5:S${lastPersonRow})` };
    totalRow.getCell(20).value = { formula: `SUM(T5:T${lastPersonRow})` };
    // Деньги ланчбоксов = Σ(кол-во × цена за штуку).
    totalRow.getCell(21).value = { formula: `SUMPRODUCT(T5:T${lastPersonRow},U5:U${lastPersonRow})` };
    totalRow.getCell(22).value = { formula: `SUM(V5:V${lastPersonRow})` };
    // W (Скидка) — не суммируется.
    totalRow.getCell(24).value = { formula: `SUM(X5:X${lastPersonRow})` };
  }
  totalRow.getCell(25).value = {
    formula: `SUM(Y5:Y${lastTransferRow})`,
  };

  applyHotelColumnWidths(ws);
  finishSheet(ws, {
    lastCol: 25,
    moneyCols: [12, 15, 17, 19, 21, 22, 24, 25],
    leftCols: [2],
    skipRows: [gapRow],
  });
  return ws;
}

const TRANSFER_HEADERS = [
  "№", "ФИО водителя", "Телефон", "Адрес отправления", "Адрес прибытия",
  "Дата подачи", "Время подачи", "Тип ТС", "Перевезено", "Сумма",
];

export function addTransferSheet(wb, opts) {
  const { request, direction, sheetNames, sheetPrefix = "" } = opts;
  const service =
    direction === "DEPARTURE"
      ? request?.departureTransferService
      : request?.transferService;

  const baseName =
    direction === "DEPARTURE" ? "Трансфер (в аэропорт)" : "Трансфер (в гостиницу)";
  const ws = wb.addWorksheet(chooseSheetName(prefixedSheetName(baseName, sheetPrefix), sheetNames));
  const city = pickCity(request, request?.livingService?.hotels?.[0]);

  ws.getCell("A1").value = request?.airline?.nameFull || request?.airline?.name || "";
  ws.getCell("A1").font = HEADER_FONT;
  ws.getCell("C3").value =
    `${baseName} по рейсу № ${request?.flightNumber ?? ""} г. ${city}`;
  ws.getCell("C3").font = HEADER_FONT;

  TRANSFER_HEADERS.forEach((label, i) => {
    const cell = ws.getCell(4, i + 1);
    cell.value = label;
    cell.font = HEADER_FONT;
    cell.alignment = { wrapText: true, vertical: "middle", horizontal: "center" };
  });
  ws.getRow(4).height = 51;
  applyTransferColumnWidths(ws);

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
    // Факт поездки: поимённый список ИЛИ «перевезено N» — что больше.
    const fact = driverFactCount(d);
    if (fact > 0) row.getCell(9).value = fact;
    if (d.reportCost != null) row.getCell(10).value = d.reportCost;
  });

  const last = drivers.length > 0 ? 4 + drivers.length : 4;
  const totalRow = ws.getRow(last + 1);
  totalRow.getCell(1).value = "Итого:";
  totalRow.getCell(1).font = HEADER_FONT;
  // Явное выравнивание: иначе проход центрирует с переносом в узкой колонке A.
  totalRow.getCell(1).alignment = { vertical: "middle", horizontal: "left" };
  if (drivers.length > 0) {
    totalRow.getCell(9).value = { formula: `SUM(I5:I${last})` };
    totalRow.getCell(10).value = { formula: `SUM(J5:J${last})` };
  }
  finishSheet(ws, { lastCol: 10, moneyCols: [10], leftCols: [2, 4, 5] });
  return ws;
}

/**
 * Лист «Доставка багажа» — раскладка «водитель + его пассажиры».
 *
 * Колонки те же, что у трансфера (TRANSFER_HEADERS): поездка багажа — это тот же
 * рейс водителя. Под строкой водителя идёт мини-таблица его пассажиров, которая
 * зеркалит экран поездки (ФИО / адрес доставки / номера бирок / сумма), поэтому у
 * пассажирских строк заполнены только B, E, H, J — остальные колонки водительские.
 * Сабхедер мини-таблицы пишется только при непустом списке пассажиров.
 */
export function addBaggageSheet(wb, opts) {
  const { request, sheetNames, sheetPrefix = "" } = opts;
  const ws = wb.addWorksheet(
    chooseSheetName(prefixedSheetName("Доставка багажа", sheetPrefix), sheetNames)
  );
  const city = pickCity(request, request?.livingService?.hotels?.[0]);

  ws.getCell("A1").value = request?.airline?.nameFull || request?.airline?.name || "";
  ws.getCell("A1").font = HEADER_FONT;
  ws.getCell("C3").value =
    `Доставка багажа по рейсу № ${request?.flightNumber ?? ""} г. ${city}`;
  ws.getCell("C3").font = HEADER_FONT;

  TRANSFER_HEADERS.forEach((label, i) => {
    const cell = ws.getCell(4, i + 1);
    cell.value = label;
    cell.font = HEADER_FONT;
    cell.alignment = { wrapText: true, vertical: "middle", horizontal: "center" };
  });
  ws.getRow(4).height = 51;
  applyTransferColumnWidths(ws);

  const drivers = request?.baggageDeliveryService?.drivers ?? [];
  const driverRows = []; // номера строк водителей — для формул итога
  let rowIdx = 5;

  drivers.forEach((d, i) => {
    const row = ws.getRow(rowIdx);
    driverRows.push(rowIdx);
    row.getCell(1).value = i + 1;               // A № (сквозной по водителям)
    row.getCell(2).value = d.fullName ?? "";    // B
    row.getCell(3).value = d.phone ?? "";       // C
    row.getCell(4).value = d.addressFrom ?? ""; // D
    row.getCell(5).value = d.addressTo ?? "";   // E
    if (d.pickupAt) {
      const dt = toExcelLocal(new Date(d.pickupAt));
      row.getCell(6).value = dt;
      row.getCell(6).numFmt = fmtDate;
      row.getCell(7).value = dt;
      row.getCell(7).numFmt = fmtTime;
    }
    row.getCell(8).value = d.vehicleType ?? ""; // H
    const people = d.people ?? [];
    // «Перевезено» багажного водителя = число его пассажиров: у доставки багажа
    // поимённый список — это и есть факт (сумма поездки и состав считаются от
    // пассажиров, см. deriveTripCost на бэке), чужое transportedCount тут не факт.
    if (people.length > 0) row.getCell(9).value = people.length; // I
    if (d.reportCost != null) row.getCell(10).value = d.reportCost; // J
    rowIdx += 1;

    if (people.length === 0) return;

    const subRow = ws.getRow(rowIdx);
    [[2, "Пассажир"], [5, "Адрес доставки"], [8, "Номера бирок"], [10, "Сумма"]].forEach(
      ([col, label]) => {
        subRow.getCell(col).value = label;
        subRow.getCell(col).font = HEADER_FONT;
        // Явное выравнивание: иначе finishSheet раздаёт B/E/H влево (leftCols),
        // а J по центру — заголовочная строка мини-таблицы разъезжается.
        subRow.getCell(col).alignment = { vertical: "middle", horizontal: "center" };
      }
    );
    rowIdx += 1;

    people.forEach((p) => {
      const pRow = ws.getRow(rowIdx);
      pRow.getCell(2).value = p.fullName ?? "";                    // B Пассажир
      pRow.getCell(5).value = p.addressTo ?? "";                   // E Адрес доставки
      pRow.getCell(8).value = (p.baggageTags ?? []).join(", ");    // H Номера бирок
      if (p.reportCost != null) pRow.getCell(10).value = p.reportCost; // J Сумма
      rowIdx += 1;
    });
  });

  const totalRow = ws.getRow(rowIdx);
  totalRow.getCell(1).value = "Итого:";
  totalRow.getCell(1).font = HEADER_FONT;
  // Явное выравнивание: иначе проход центрирует с переносом в узкой колонке A.
  totalRow.getCell(1).alignment = { vertical: "middle", horizontal: "left" };
  if (driverRows.length > 0) {
    // Перечисление водительских строк, а не SUM диапазона: сумма поездки на бэке —
    // производная (Σ reportCost её пассажиров), и диапазон задвоил бы деньги.
    totalRow.getCell(9).value = { formula: driverRows.map((r) => `I${r}`).join("+") };
    totalRow.getCell(10).value = { formula: driverRows.map((r) => `J${r}`).join("+") };
  }

  finishSheet(ws, { lastCol: 10, moneyCols: [10], leftCols: [2, 4, 5, 8] });
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
  const {
    request,
    sheetNames,
    includeTransfer = true,
    sheetPrefix = "",
    hotelIndexes = null,
  } = opts;
  const ws = wb.addWorksheet(chooseSheetName(prefixedSheetName("Сводка", sheetPrefix), sheetNames));
  const city = pickCity(request, request?.livingService?.hotels?.[0]);

  // ── Шапка ──
  ws.getCell("A1").value = request?.airline?.nameFull || request?.airline?.name || "";
  ws.getCell("Y1").value = "Договор № или \"по согласованию\"";
  ws.getCell("Y1").alignment = { horizontal: "right" };
  const flightPart = request?.flightDate
    ? ` от ${new Date(request.flightDate).toLocaleDateString("ru-RU")}`
    : "";
  ws.getCell("C3").value =
    `Детализация оказанных услуг пассажиров задержанного рейса № ${request?.flightNumber ?? ""}${flightPart} г. ${city}`;
  [ws.getCell("A1"), ws.getCell("Y1"), ws.getCell("C3")].forEach((c) => {
    c.font = HEADER_FONT;
  });

  // ── Заголовки колонок (row 4) ──
  HOTEL_HEADERS.forEach((label, i) => {
    const cell = ws.getCell(4, i + 1);
    cell.value = label;
    cell.font = HEADER_FONT;
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
    // Белый список гостиниц: авиакомпании уходят только отправленные отчёты.
    if (hotelIndexes && !hotelIndexes.includes(hotelIndex)) return;
    const people = hotel?.people ?? [];
    if (people.length === 0) return; // пустые гостиницы пропускаем в сводке

    // Сабхедер гостиницы — merged A:X
    ws.mergeCells(`A${rowIdx}:Y${rowIdx}`);
    const hdr = ws.getCell(`A${rowIdx}`);
    hdr.value = `Гостиница: ${pickHotelName(hotel)}${hotel?.address ? ` · ${hotel.address}` : ""}`;
    hdr.font = HEADER_FONT;
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
      row.getCell(14).value = mealCountOf(r, "breakfast", "breakfastCount");         // N Кол-во завтраков
      row.getCell(15).value = toNum(r.breakfast);                                    // O Цена завтрака
      row.getCell(16).value = mealCountOf(r, "lunch", "lunchCount");                 // P
      row.getCell(17).value = toNum(r.lunch);                                        // Q
      row.getCell(18).value = mealCountOf(r, "dinner", "dinnerCount");               // R
      row.getCell(19).value = toNum(r.dinner);                                       // S
      row.getCell(20).value = lunchboxCountOf(r);                                    // T Количество ланчбоксов
      row.getCell(21).value = toNum(r.lunchboxPrice);                                // U Ланчбокс (цена за штуку)
      row.getCell(22).value = foodCost;                                             // V Ст-ть питания
      row.getCell(23).value = accommodationDiscountLabel(pricePerDay, r.daysCount, accommodationCost); // W Скидка
      row.getCell(24).value = accommodationCost;                                     // X Ст-ть проживания
      row.getCell(25).value = foodCost + accommodationCost;                          // Y Итого

      if (firstPersonRow == null) firstPersonRow = rowIdx;
      lastPersonRow = rowIdx;
      rowIdx += 1;
    });
  });

  // ── Блок «Трансфер» ──
  let lastTransferRow = null;
  let gapRow = null; // строка-разделитель есть только вместе с блоком трансфера
  if (includeTransfer) {
    gapRow = rowIdx;
    rowIdx += 1;
    const tHeaderRow = rowIdx;
    ws.mergeCells(`B${tHeaderRow}:H${tHeaderRow}`);
    const tHdr = ws.getCell(`B${tHeaderRow}`);
    tHdr.value = "Трансфер";
    tHdr.font = HEADER_FONT;
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
      aRow.getCell(2).value = "аэропорт → гостиницы";
      aRow.getCell(3).value = aFirstType;
      if (arrival?.plan?.plannedAt) {
        const dt = toExcelLocal(new Date(arrival.plan.plannedAt));
        aRow.getCell(5).value = dt; aRow.getCell(5).numFmt = fmtDate;
        aRow.getCell(6).value = dt; aRow.getCell(6).numFmt = fmtTime;
      }
      if (aCost != null) aRow.getCell(25).value = aCost;
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
      dRow.getCell(2).value = "гостиницы → аэропорт";
      dRow.getCell(3).value = dFirstType;
      if (departure?.plan?.plannedAt) {
        const dt = toExcelLocal(new Date(departure.plan.plannedAt));
        dRow.getCell(5).value = dt; dRow.getCell(5).numFmt = fmtDate;
        dRow.getCell(6).value = dt; dRow.getCell(6).numFmt = fmtTime;
      }
      if (dCost != null) dRow.getCell(25).value = dCost;
      lastTransferRow = rowIdx;
      rowIdx += 1;
    }
  }

  // ── Итого ──
  const totalRow = ws.getRow(rowIdx);
  totalRow.getCell(1).value = "Итого:";
  totalRow.getCell(1).font = HEADER_FONT;
  // Явное выравнивание: иначе проход центрирует с переносом в узкой колонке A.
  totalRow.getCell(1).alignment = { vertical: "middle", horizontal: "left" };
  if (firstPersonRow != null && lastPersonRow != null) {
    totalRow.getCell(13).value = { formula: `SUM(M${firstPersonRow}:M${lastPersonRow})` };
    totalRow.getCell(14).value = { formula: `SUM(N${firstPersonRow}:N${lastPersonRow})` };
    // Деньги приёма = Σ(кол-во × цена за порцию).
    totalRow.getCell(15).value = { formula: `SUMPRODUCT(N${firstPersonRow}:N${lastPersonRow},O${firstPersonRow}:O${lastPersonRow})` };
    totalRow.getCell(16).value = { formula: `SUM(P${firstPersonRow}:P${lastPersonRow})` };
    totalRow.getCell(17).value = { formula: `SUMPRODUCT(P${firstPersonRow}:P${lastPersonRow},Q${firstPersonRow}:Q${lastPersonRow})` };
    totalRow.getCell(18).value = { formula: `SUM(R${firstPersonRow}:R${lastPersonRow})` };
    totalRow.getCell(19).value = { formula: `SUMPRODUCT(R${firstPersonRow}:R${lastPersonRow},S${firstPersonRow}:S${lastPersonRow})` };
    totalRow.getCell(20).value = { formula: `SUM(T${firstPersonRow}:T${lastPersonRow})` };
    // Деньги ланчбоксов = Σ(кол-во × цена за штуку).
    totalRow.getCell(21).value = { formula: `SUMPRODUCT(T${firstPersonRow}:T${lastPersonRow},U${firstPersonRow}:U${lastPersonRow})` };
    totalRow.getCell(22).value = { formula: `SUM(V${firstPersonRow}:V${lastPersonRow})` };
    // W (Скидка) — не суммируется.
    totalRow.getCell(24).value = { formula: `SUM(X${firstPersonRow}:X${lastPersonRow})` };
  }
  const sumStart = firstPersonRow ?? 5;
  const sumEnd = lastTransferRow ?? lastPersonRow ?? sumStart;
  totalRow.getCell(25).value = { formula: `SUM(Y${sumStart}:Y${sumEnd})` };

  applyHotelColumnWidths(ws);
  finishSheet(ws, {
    lastCol: 25,
    moneyCols: [12, 15, 17, 19, 21, 22, 24, 25],
    leftCols: [2],
    skipRows: gapRow == null ? [] : [gapRow],
  });
  return ws;
}

export async function downloadLivingReport(request, opts = {}) {
  const { hotelIndexes = null } = opts;
  const wb = new ExcelJS.Workbook();
  const sheetNames = new Set();
  addCombinedSheet(wb, { request, sheetNames, includeTransfer: false, hotelIndexes });
  (request?.livingService?.hotels ?? []).forEach((_, hotelIndex) => {
    if (hotelIndexes && !hotelIndexes.includes(hotelIndex)) return;
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

export function addRequestReportSheets(wb, request, opts = {}) {
  const {
    notifyError,
    sheetNames = new Set(),
    sheetPrefix = "",
    hotelIndexes = null,
  } = opts;
  const livingEnabled = request?.livingService?.plan?.enabled;
  const arrEnabled = request?.transferService?.plan?.enabled;
  const depEnabled = request?.departureTransferService?.plan?.enabled;
  const bagEnabled = request?.baggageDeliveryService?.plan?.enabled;
  // Пустой белый список = ни одной доступной гостиницы (авиакомпания, пока
  // отчёты не отправлены; гостиница, которой в этой заявке нет). Проживание в
  // такой книге не даст ни листов, ни строк в сводке, поэтому считаем его
  // выключенным: иначе молча скачивалась книга из одной пустой шапки.
  // null — ограничения нет, старое поведение.
  // Используется вместо livingEnabled и в гейте, и ниже (сводка, листы гостиниц):
  // иначе заявка «проживание включено + пустой белый список + багаж включён»
  // проходит гейт благодаря багажу, а «Сводка» всё равно добавляется по
  // livingEnabled — в книге появляется пустая «Сводка» без единой строки.
  const livingVisible =
    livingEnabled && !(Array.isArray(hotelIndexes) && hotelIndexes.length === 0);
  if (!livingVisible && !arrEnabled && !depEnabled && !bagEnabled) {
    notifyError?.("Нет данных для отчёта");
    return false;
  }

  // Сводка — про проживание и трансфер; багаж в неё не входит, поэтому условие
  // сюда не расширяется: багаж-only книга состоит из одного листа багажа.
  if (livingVisible || arrEnabled || depEnabled) {
    addCombinedSheet(wb, {
      request,
      sheetNames,
      sheetPrefix,
      hotelIndexes,
      // Без !! отсутствующая услуга (arrEnabled и depEnabled оба undefined)
      // даёт includeTransfer: undefined, а дефолт деструктуризации в
      // addCombinedSheet (= true) включает пустой блок «Трансфер».
      includeTransfer: !!(arrEnabled || depEnabled),
    });
  }
  if (livingVisible) {
    (request?.livingService?.hotels ?? []).forEach((_, hotelIndex) => {
      if (hotelIndexes && !hotelIndexes.includes(hotelIndex)) return;
      addHotelSheet(wb, { request, hotelIndex, sheetNames, sheetPrefix });
    });
  }
  if (arrEnabled) {
    addTransferSheet(wb, { request, direction: "ARRIVAL", sheetNames, sheetPrefix });
  }
  if (depEnabled) {
    addTransferSheet(wb, { request, direction: "DEPARTURE", sheetNames, sheetPrefix });
  }
  // Белый список гостиниц багаж не гейтит — как и трансфер.
  if (bagEnabled) {
    addBaggageSheet(wb, { request, sheetNames, sheetPrefix });
  }

  return true;
}

export async function downloadRequestReport(request, notifyError, opts = {}) {
  const wb = new ExcelJS.Workbook();
  const sheetNames = new Set();
  if (!addRequestReportSheets(wb, request, { notifyError, sheetNames, ...opts })) return;
  const filename = `${request?.airline?.name ?? ""} заявка ${request?.requestNumber ?? ""}.xlsx`;
  await downloadWorkbook(wb, filename);
}
