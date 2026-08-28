import ExcelJS from "exceljs";
import { PERSON_CATEGORY_LABEL, normalizeCategory, placementKindLabel } from "../fapConstants.js";
import { driverFactCount } from "../fapTransferFact.js";
import { roomKey } from "../fapGroups.js";
import { lunchboxCountOf } from "../fapReportMoney.js";
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

// Кусок «г. Город» для титулов и имени файла — вместе с ведущим пробелом.
// Города может не быть вовсе (заявка без аэропорта и без гостиниц — типично для
// багаж-only), и тогда шаблон должен схлопнуться целиком: «г.» без города и
// двойные пробелы уезжали в титул и в имя файла.
const cityPart = (city) => (city ? ` г. ${city}` : "");

// Раскладка листа проживания — общая для листа гостиницы и «Сводки».
// money — колонка про деньги проживания и питания: под hideMoney её в листе нет
// вовсе (пустая колонка с заголовком «Цена за сутки» — тот же ответ на вопрос
// «почём»), а значения в неё не пишутся (putMoney).
// shared — колонка может пережить гейт, потому что в ней не только деньги
// проживания: «Итого» несёт ещё и суммы трансфера. Оставлять её осмысленно
// только когда эти суммы на листе действительно будут (гостиница-перевозчик,
// которой трансфер не скрыт правилом видимости услуг), — иначе останется голый
// заголовок с денежным форматом; решает вызывающая сторона вторым аргументом.
// text — денежная по смыслу, но с текстом внутри: денежный формат ей не ставится.
// left — выравнивание по левому краю.
const HOTEL_COLUMNS = [
  { key: "id", label: "ID", width: 6 },
  { key: "fullName", label: "ФИО", width: 28, left: true },
  { key: "personType", label: "Тип", width: 12 },
  { key: "personCategory", label: "Возрастная категория", width: 15 },
  { key: "inDate", label: "Дата заезда", width: 13 },
  { key: "inTime", label: "Время заезда", width: 12 },
  { key: "outDate", label: "Дата выезда", width: 13 },
  { key: "outTime", label: "Время выезда", width: 12 },
  { key: "roomNumber", label: "Номер", width: 12 },
  // Вмещает «четырёхместное»
  { key: "placementKind", label: "Вид размещения", width: 18 },
  { key: "tariffName", label: "Тариф", width: 20 },
  { key: "pricePerDay", label: "Цена за сутки", width: 14, money: true },
  { key: "daysCount", label: "Количество суток", width: 15 },
  { key: "breakfastCount", label: "Количество завтраков", width: 15 },
  { key: "breakfast", label: "Завтрак", width: 12, money: true },
  { key: "lunchCount", label: "Количество обедов", width: 15 },
  { key: "lunch", label: "Обед", width: 12, money: true },
  { key: "dinnerCount", label: "Количество ужинов", width: 15 },
  { key: "dinner", label: "Ужин", width: 12, money: true },
  { key: "lunchboxCount", label: "Количество ланчбоксов", width: 18 },
  { key: "lunchboxPrice", label: "Ланчбокс", width: 12, money: true },
  { key: "foodCost", label: "Стоимость питания", width: 15, money: true },
  { key: "discount", label: "Скидка", width: 10, money: true, text: true },
  { key: "accommodationCost", label: "Стоимость проживания", width: 15, money: true },
  { key: "total", label: "Итого", width: 12, money: true, shared: true },
];

// Буква колонки для формул: раскладка не шире 25 колонок, двухбуквенных нет.
const colLetter = (n) => String.fromCharCode(64 + n);

// Раскладка под текущий режим: индексы колонок по ключу (`at`), запись значения
// с пропуском отсутствующей колонки (`put`), запись денег проживания (`putMoney`)
// и наборы для finishSheet.
function hotelLayout(hideMoney, keepShared = true) {
  const cols = HOTEL_COLUMNS.filter(
    (c) => !(hideMoney && c.money && !(c.shared && keepShared))
  );
  const at = {};
  cols.forEach((c, i) => { at[c.key] = i + 1; });
  return {
    cols,
    at,
    lastCol: cols.length,
    // Буква скрытой колонки — пустая строка: формула с ней всё равно не пишется,
    // её ячейку отсекает put.
    letter: (key) => (at[key] ? colLetter(at[key]) : ""),
    put: (row, key, value) => {
      if (at[key]) row.getCell(at[key]).value = value;
    },
    // Деньги проживания и питания: под гейтом не пишутся и в уцелевшую колонку
    // «Итого» — она остаётся только ради сумм трансфера.
    putMoney: (row, key, value) => {
      if (!hideMoney && at[key]) row.getCell(at[key]).value = value;
    },
    moneyCols: cols.map((c, i) => (c.money && !c.text ? i + 1 : 0)).filter(Boolean),
    leftCols: cols.map((c, i) => (c.left ? i + 1 : 0)).filter(Boolean),
  };
}

// Применить ширины колонок (для листа проживания).
function applyHotelColumnWidths(ws, cols) {
  cols.forEach((c, i) => { ws.getColumn(i + 1).width = c.width; });
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

// Количество порций приёма: легаси-строки без количеств — 1 при цене > 0.
const mealCountOf = (r, priceField, countField) =>
  r?.[countField] != null ? toNum(r[countField]) : (toNum(r?.[priceField]) > 0 ? 1 : 0);

// Сумма направления трансфера: null, если reportCost не проставлен ни одному
// водителю — пустая ячейка вместо нуля, так было всегда.
const transferCost = (drivers) => {
  const list = drivers ?? [];
  return list.some((d) => d.reportCost != null)
    ? list.reduce((s, d) => s + (d.reportCost ?? 0), 0)
    : null;
};

// Процент возрастной скидки на проживание, выведенный из чисел строки:
// 1 − факт/(цена за сутки × сутки). «—», если базы нет (ручной ввод / легаси).
function accommodationDiscountLabel(pricePerDay, daysCount, accommodationCost) {
  const base = toNum(pricePerDay) * toNum(daysCount);
  if (base <= 0) return "—";
  const disc = 1 - toNum(accommodationCost) / base;
  return disc > 0.005 ? `${Math.round(disc * 100)}%` : "—";
}

// Карта «номер комнаты → вид размещения» для печати колонки «Вид размещения».
//
// При тарифе с режимом «Номер» (PER_ROOM) проживание начисляется один раз — на
// «несущего» гостя номера, а у соседей по тому же номеру в сохранённых строках
// остаётся placementKind: 0. Так сделано ради денег (обнулённые поля строки
// пересчитывать нельзя), но в книге из-за этого колонка вида пустела у всех,
// кроме одного жильца, хотя номер у них общий.
//
// Карта чинит только ПЕЧАТЬ: ни одна цифра строки (цена за сутки, скидка,
// стоимость проживания, итоги) от неё не меняется. Пустая «Цена за сутки»
// у соседей — правильное поведение и остаётся как есть.
// Первое встреченное значение выигрывает; строки без номера или без вида в карту
// не попадают.
function roomKindByNumber(rows) {
  const kinds = new Map();
  (rows ?? []).forEach((r) => {
    const room = String(r?.roomNumber ?? "").trim();
    const kind = Number(r?.placementKind) || 0;
    if (!room || kind <= 0 || kinds.has(room)) return;
    kinds.set(room, kind);
  });
  return kinds;
}

// Вид размещения строки для печати: свой (режим «Койко-место») либо вид несущего
// гостя того же номера. Гость без номера остаётся без вида — подставлять нечего.
function printedKind(r, kinds) {
  const own = Number(r?.placementKind) || 0;
  if (own > 0) return own;
  const room = String(r?.roomNumber ?? "").trim();
  return (room && kinds.get(room)) || 0;
}

// Порядок ПЕЧАТИ строк гостей: зеркалим порядок групп экрана (мемо reportGroups
// в FapHotelPage), чтобы бумага совпадала с экраном — живущие в одном номере
// стоят подряд, а не разбросаны по ростеру.
//
// Правило то же, что на экране: идём по ростеру, первый гость номера «открывает»
// группу на своей позиции, каждый следующий жилец того же номера доклеивается
// к ней (то есть подтягивается вверх, к первому), гость без номера остаётся
// одиночной группой на своём месте.
//
// rooms — номера комнат по индексам гостей (в порядке ростера); возвращает
// перестановку индексов. На матчинг строк к гостям не влияет: тот идёт своим
// проходом строго по ростеру.
function groupedPrintOrder(rooms) {
  const groups = [];
  const byRoom = new Map();
  (rooms ?? []).forEach((room, i) => {
    const key = roomKey(room);
    if (!key) {
      groups.push([i]);
      return;
    }
    const group = byRoom.get(key);
    if (group) {
      group.push(i);
      return;
    }
    const created = [i];
    byRoom.set(key, created);
    groups.push(created);
  });
  return groups.flat();
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
 * opts.hideMoney: лист без денежных колонок — гостинице, которая заполняет факт.
 * opts.hiddenServiceKeys: скрытые правилом видимости услуг направления трансфера
 * (те же ключи, что у книги) — в блок «Трансфер» листа они не печатаются.
 */
export function addHotelSheet(wb, opts) {
  const {
    request, hotelIndex, sheetNames, sheetPrefix = "",
    hideMoney = false, hiddenServiceKeys = [],
  } = opts;
  const hotel = request?.livingService?.hotels?.[hotelIndex];
  if (!hotel) return null;

  // Гейт услуг доводится внутрь листа: гостиница, которая сама не возит, не
  // должна видеть на своём листе чужие рейсы, типы ТС и суммы. Направления
  // проверяются по отдельности — скрыть могут только прилёт или только вылет.
  const hidden = new Set(hiddenServiceKeys);
  const arrVisible = !hidden.has("transfer");
  const depVisible = !hidden.has("transferDeparture");
  const arrival = request?.transferService;
  const departure = request?.departureTransferService;
  // Направление печатается, только если оно И видимо, И включено в заявке —
  // как в «Сводке». Без проверки enabled лист получал шапку «Трансфер» и две
  // пустые строки рейсов у заявки, где трансфера нет вовсе.
  const arrOn = arrVisible && Boolean(arrival?.plan?.enabled);
  const depOn = depVisible && Boolean(departure?.plan?.enabled);
  const aCost = arrOn ? transferCost(arrival?.drivers) : null;
  const dCost = depOn ? transferCost(departure?.drivers) : null;
  // Под гейтом колонка «Итого» остаётся только ради денег трансфера: нет их —
  // нет и колонки, иначе на листе без денег висел бы её пустой заголовок.
  const { cols, at, put, putMoney, letter, lastCol, moneyCols, leftCols } =
    hotelLayout(hideMoney, aCost != null || dCost != null);
  const hotelName = pickHotelName(hotel);
  const city = pickCity(request, hotel);
  const ws = wb.addWorksheet(chooseSheetName(prefixedSheetName(hotelName, sheetPrefix), sheetNames));

  // ── Шапка ──
  ws.getCell("A1").value = request?.airline?.nameFull || request?.airline?.name || "";
  const contractCell = ws.getCell(1, lastCol);
  contractCell.value = "Договор № или \"по согласованию\"";
  contractCell.alignment = { horizontal: "right" };
  const flightPart = request?.flightDate
    ? ` от ${new Date(request.flightDate).toLocaleDateString("ru-RU")}`
    : "";
  ws.getCell("C3").value =
    `Детализация оказанных услуг пассажиров задержанного рейса № ${request?.flightNumber ?? ""}${flightPart}${cityPart(city)} гостиница ${hotelName}`;
  [ws.getCell("A1"), contractCell, ws.getCell("C3")].forEach((c) => {
    c.font = HEADER_FONT;
  });

  // ── Заголовки колонок (row 4) ──
  cols.forEach((c, i) => {
    const cell = ws.getCell(4, i + 1);
    cell.value = c.label;
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

  // Вид размещения соседей по номеру берётся с несущего гостя (см. roomKindByNumber).
  // Источник — уже сматченные строки реальных гостей: ghost-строки тарифов сюда
  // не попадают.
  const roomKinds = roomKindByNumber(rowsByPersonIdx);

  // Печатаем не в порядке ростера, а группами по номеру комнаты — как на экране.
  const printOrder = groupedPrintOrder(rowsByPersonIdx.map((r) => r.roomNumber));

  const livingPlan = request?.livingService?.plan;
  printOrder.forEach((personIdx, seq) => {
    const p = people[personIdx];
    const r = rowsByPersonIdx[personIdx];
    const { inAt, outAt } = getCheckInOut(p, hotelIndex, livingPlan);
    const row = ws.getRow(rowIdx);

    // «ID» — порядковый номер строки в листе, а не индекс гостя в ростере.
    put(row, "id", seq + 1);
    put(row, "fullName", p.fullName ?? "");
    put(row, "personType", p.personType === "CREW" ? "Экипаж" : "Пассажир");
    put(row, "personCategory", PERSON_CATEGORY_LABEL[normalizeCategory(p.personCategory)] ?? "Взрослый");
    if (inAt) {
      const inLocal = toExcelLocal(inAt);
      row.getCell(at.inDate).value = inLocal;
      row.getCell(at.inDate).numFmt = fmtDate;
      row.getCell(at.inTime).value = inLocal;
      row.getCell(at.inTime).numFmt = fmtTime;
    }
    if (outAt) {
      const outLocal = toExcelLocal(outAt);
      row.getCell(at.outDate).value = outLocal;
      row.getCell(at.outDate).numFmt = fmtDate;
      row.getCell(at.outTime).value = outLocal;
      row.getCell(at.outTime).numFmt = fmtTime;
    }
    put(row, "roomNumber", r.roomNumber);
    put(row, "placementKind", placementKindLabel(printedKind(r, roomKinds))); // "" для legacy
    put(row, "tariffName", r.tariffName);
    if (r.pricePerDay > 0) putMoney(row, "pricePerDay", r.pricePerDay);
    put(row, "daysCount", r.daysCount);
    put(row, "breakfastCount", r.breakfastCount);
    putMoney(row, "breakfast", r.breakfast);                    // цена за порцию
    put(row, "lunchCount", r.lunchCount);
    putMoney(row, "lunch", r.lunch);
    put(row, "dinnerCount", r.dinnerCount);
    putMoney(row, "dinner", r.dinner);
    put(row, "lunchboxCount", r.lunchboxCount);
    putMoney(row, "lunchboxPrice", r.lunchboxPrice);            // цена за штуку
    putMoney(row, "foodCost", r.foodCost);
    putMoney(row, "discount", accommodationDiscountLabel(r.pricePerDay, r.daysCount, r.accommodationCost));
    putMoney(row, "accommodationCost", r.accommodationCost);
    putMoney(row, "total", r.foodCost + r.accommodationCost);

    rowIdx += 1;
  });

  const lastPersonRow = rowIdx - 1;

  // ── Блок «Трансфер» (одна пустая строка + строки видимых направлений) ──
  // Оба направления скрыты — блока нет вовсе: пустая шапка «Трансфер» говорила бы
  // о рейсах, которых гостинице видеть не положено. Блока нет и когда трансфера
  // у заявки нет: пустая шапка выглядела бы как услуга, которой не было.
  let gapRow = null; // строка-разделитель есть только вместе с блоком
  let lastTransferRow = null;
  if (arrOn || depOn) {
    gapRow = rowIdx; // строка-разделитель: остаётся без сетки
    rowIdx += 1;
    const tHeaderRow = rowIdx;
    ws.mergeCells(`${letter("fullName")}${tHeaderRow}:${letter("outTime")}${tHeaderRow}`);
    const tHdr = ws.getCell(`${letter("fullName")}${tHeaderRow}`);
    tHdr.value = "Трансфер";
    tHdr.font = HEADER_FONT;
    tHdr.alignment = { horizontal: "center" };
    rowIdx += 1;

    // ARRIVAL
    if (arrOn) {
      const aFirstType = (arrival?.drivers ?? []).find((d) => d.vehicleType)?.vehicleType ?? "";
      const aRow = ws.getRow(rowIdx);
      put(aRow, "fullName", `аэропорт-гостиница ${hotelName}`);
      put(aRow, "personType", aFirstType);
      if (arrival?.plan?.plannedAt) {
        const dt = toExcelLocal(new Date(arrival.plan.plannedAt));
        aRow.getCell(at.inDate).value = dt;
        aRow.getCell(at.inDate).numFmt = fmtDate;
        aRow.getCell(at.inTime).value = dt;
        aRow.getCell(at.inTime).numFmt = fmtTime;
      }
      if (aCost != null) put(aRow, "total", aCost);
      lastTransferRow = rowIdx;
      rowIdx += 1;
    }

    // DEPARTURE
    if (depOn) {
      const dFirstType = (departure?.drivers ?? []).find((d) => d.vehicleType)?.vehicleType ?? "";
      const dRow = ws.getRow(rowIdx);
      put(dRow, "fullName", `гостиница ${hotelName}-аэропорт`);
      put(dRow, "personType", dFirstType);
      if (departure?.plan?.plannedAt) {
        // Время подачи обоих направлений живёт в колонках заезда — так было и раньше.
        const dt = toExcelLocal(new Date(departure.plan.plannedAt));
        dRow.getCell(at.inDate).value = dt;
        dRow.getCell(at.inDate).numFmt = fmtDate;
        dRow.getCell(at.inTime).value = dt;
        dRow.getCell(at.inTime).numFmt = fmtTime;
      }
      if (dCost != null) put(dRow, "total", dCost);
      lastTransferRow = rowIdx;
      rowIdx += 1;
    }
  }

  // ── Строка «Итого:» ──
  const totalRow = ws.getRow(rowIdx);
  totalRow.getCell(1).value = "Итого:";
  totalRow.getCell(1).font = HEADER_FONT;
  // Явное выравнивание: иначе проход центрирует с переносом и в колонке шириной 6
  // слово уезжает на две строки.
  totalRow.getCell(1).alignment = { vertical: "middle", horizontal: "left" };
  if (lastPersonRow >= 5) {
    // Диапазон одной колонки и пара колонок для SUMPRODUCT — по ключам раскладки:
    // под hideMoney буквы съезжают, а денежных слагаемых просто нет.
    const range = (key) => `${letter(key)}5:${letter(key)}${lastPersonRow}`;
    const sum = (key) => ({ formula: `SUM(${range(key)})` });
    const product = (countKey, priceKey) => ({
      formula: `SUMPRODUCT(${range(countKey)},${range(priceKey)})`,
    });
    put(totalRow, "daysCount", sum("daysCount"));
    put(totalRow, "breakfastCount", sum("breakfastCount"));
    // Деньги приёма = Σ(кол-во × цена за порцию) — простой SUM цен потерял смысл.
    putMoney(totalRow, "breakfast", product("breakfastCount", "breakfast"));
    put(totalRow, "lunchCount", sum("lunchCount"));
    putMoney(totalRow, "lunch", product("lunchCount", "lunch"));
    put(totalRow, "dinnerCount", sum("dinnerCount"));
    putMoney(totalRow, "dinner", product("dinnerCount", "dinner"));
    put(totalRow, "lunchboxCount", sum("lunchboxCount"));
    // Деньги ланчбоксов = Σ(кол-во × цена за штуку).
    putMoney(totalRow, "lunchboxPrice", product("lunchboxCount", "lunchboxPrice"));
    putMoney(totalRow, "foodCost", sum("foodCost"));
    // «Скидка» — не суммируется.
    putMoney(totalRow, "accommodationCost", sum("accommodationCost"));
  }
  // Под гейтом в колонке «Итого» лежат только деньги трансфера: без них колонки
  // уже нет (put промолчит), а с ними диапазон захватывает и пустые строки гостей.
  const sumEnd = lastTransferRow ?? Math.max(lastPersonRow, 5);
  put(totalRow, "total", {
    formula: `SUM(${letter("total")}5:${letter("total")}${sumEnd})`,
  });

  applyHotelColumnWidths(ws, cols);
  finishSheet(ws, {
    lastCol,
    moneyCols,
    leftCols,
    skipRows: gapRow == null ? [] : [gapRow],
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
    `${baseName} по рейсу № ${request?.flightNumber ?? ""}${cityPart(city)}`;
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
    `Доставка багажа по рейсу № ${request?.flightNumber ?? ""}${cityPart(city)}`;
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
  const filename = `${request?.airline?.name ?? ""} гостиница ${pickHotelName(hotel)}${cityPart(pickCity(request, hotel))}.xlsx`;
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
    hiddenServiceKeys = [],
    hideMoney = false,
  } = opts;
  // includeTransfer отвечает за блок целиком, hiddenServiceKeys — за каждое
  // направление отдельно: скрыть могут только прилёт или только вылет, а блок
  // при этом остаётся. Поэтому видимость проверяется и здесь, а не только на
  // уровне листов: строки блока несут тот же тип ТС, время подачи и суммы.
  const hidden = new Set(hiddenServiceKeys);
  // «Сводка» — та же раскладка, что у листа гостиницы: без денежных колонок она
  // тоже обязана уметь, иначе гостиница читала бы в книге ровно те суммы,
  // которые убраны с её листа.
  const { cols, at, put, putMoney, letter, lastCol, moneyCols, leftCols } = hotelLayout(hideMoney);
  const ws = wb.addWorksheet(chooseSheetName(prefixedSheetName("Сводка", sheetPrefix), sheetNames));
  const city = pickCity(request, request?.livingService?.hotels?.[0]);

  // ── Шапка ──
  ws.getCell("A1").value = request?.airline?.nameFull || request?.airline?.name || "";
  const contractCell = ws.getCell(1, lastCol);
  contractCell.value = "Договор № или \"по согласованию\"";
  contractCell.alignment = { horizontal: "right" };
  const flightPart = request?.flightDate
    ? ` от ${new Date(request.flightDate).toLocaleDateString("ru-RU")}`
    : "";
  ws.getCell("C3").value =
    `Детализация оказанных услуг пассажиров задержанного рейса № ${request?.flightNumber ?? ""}${flightPart}${cityPart(city)}`;
  [ws.getCell("A1"), contractCell, ws.getCell("C3")].forEach((c) => {
    c.font = HEADER_FONT;
  });

  // ── Заголовки колонок (row 4) ──
  cols.forEach((c, i) => {
    const cell = ws.getCell(4, i + 1);
    cell.value = c.label;
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

    // Сабхедер гостиницы — merged на всю ширину раскладки
    ws.mergeCells(`A${rowIdx}:${colLetter(lastCol)}${rowIdx}`);
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

    // Карта видов размещения строится по КАЖДОЙ гостинице отдельно (номера комнат
    // разных гостиниц совпадают) и только по гостевым строкам: ghost-строки без
    // ФИО несут таблицы цен тарифа, их placementKind — вид из ценовой пары, а не
    // вид номера, соседям его подставлять нельзя.
    const roomKinds = roomKindByNumber(
      savedRows.filter((r) => (r?.fullName ?? "").trim())
    );

    // Матч к гостям: personId — первично, ФИО — fallback для старых строк.
    // Отдельным проходом и строго по ростеру: consumed-сет раздаёт строки
    // дубликатам ФИО по порядку, поэтому порядок печати ниже его не касается.
    const consumed = new Set();
    const rowsByPersonIdx = people.map((p) => {
      const idx = findRowIndexForPerson(savedRows, p, consumed);
      if (idx < 0) return {};
      consumed.add(idx);
      return savedRows[idx];
    });

    // Печать — группами по номеру комнаты (как на экране), в пределах гостиницы.
    const printOrder = groupedPrintOrder(rowsByPersonIdx.map((r) => r.roomNumber));

    printOrder.forEach((personIdx) => {
      const p = people[personIdx];
      const r = rowsByPersonIdx[personIdx];
      const foodCost = toNum(r.foodCost);
      const accommodationCost = toNum(r.accommodationCost);
      const { inAt, outAt } = getCheckInOut(p, hotelIndex, request?.livingService?.plan);
      const row = ws.getRow(rowIdx);

      runningId += 1;
      put(row, "id", runningId);
      put(row, "fullName", p.fullName ?? "");
      put(row, "personType", p.personType === "CREW" ? "Экипаж" : "Пассажир");
      put(row, "personCategory", PERSON_CATEGORY_LABEL[normalizeCategory(p.personCategory)] ?? "Взрослый");
      if (inAt) {
        const inLocal = toExcelLocal(inAt);
        row.getCell(at.inDate).value = inLocal;  row.getCell(at.inDate).numFmt = fmtDate;
        row.getCell(at.inTime).value = inLocal;  row.getCell(at.inTime).numFmt = fmtTime;
      }
      if (outAt) {
        const outLocal = toExcelLocal(outAt);
        row.getCell(at.outDate).value = outLocal; row.getCell(at.outDate).numFmt = fmtDate;
        row.getCell(at.outTime).value = outLocal; row.getCell(at.outTime).numFmt = fmtTime;
      }
      const pricePerDay = toNum(r.pricePerDay);
      put(row, "roomNumber", r.roomNumber ?? "");
      put(row, "placementKind", placementKindLabel(printedKind(r, roomKinds)));
      put(row, "tariffName", (r.tariffName ?? "").trim() || (r.roomCategory ?? ""));
      if (pricePerDay > 0) putMoney(row, "pricePerDay", pricePerDay);
      put(row, "daysCount", toNum(r.daysCount));
      put(row, "breakfastCount", mealCountOf(r, "breakfast", "breakfastCount"));
      putMoney(row, "breakfast", toNum(r.breakfast));            // цена за порцию
      put(row, "lunchCount", mealCountOf(r, "lunch", "lunchCount"));
      putMoney(row, "lunch", toNum(r.lunch));
      put(row, "dinnerCount", mealCountOf(r, "dinner", "dinnerCount"));
      putMoney(row, "dinner", toNum(r.dinner));
      put(row, "lunchboxCount", lunchboxCountOf(r));
      putMoney(row, "lunchboxPrice", toNum(r.lunchboxPrice));    // цена за штуку
      putMoney(row, "foodCost", foodCost);
      putMoney(row, "discount", accommodationDiscountLabel(pricePerDay, r.daysCount, accommodationCost));
      putMoney(row, "accommodationCost", accommodationCost);
      putMoney(row, "total", foodCost + accommodationCost);

      if (firstPersonRow == null) firstPersonRow = rowIdx;
      lastPersonRow = rowIdx;
      rowIdx += 1;
    });
  });

  // ── Блок «Трансфер» ──
  let lastTransferRow = null;
  // Писали ли в колонку «Итого» деньги трансфера — под гейтом это единственное,
  // что в ней вообще может оказаться.
  let transferMoney = false;
  let gapRow = null; // строка-разделитель есть только вместе с блоком трансфера
  if (includeTransfer) {
    gapRow = rowIdx;
    rowIdx += 1;
    const tHeaderRow = rowIdx;
    ws.mergeCells(`${letter("fullName")}${tHeaderRow}:${letter("outTime")}${tHeaderRow}`);
    const tHdr = ws.getCell(`${letter("fullName")}${tHeaderRow}`);
    tHdr.value = "Трансфер";
    tHdr.font = HEADER_FONT;
    tHdr.alignment = { horizontal: "center" };
    rowIdx += 1;

    // ARRIVAL
    const arrival = request?.transferService;
    const aFirstType = (arrival?.drivers ?? []).find((d) => d.vehicleType)?.vehicleType ?? "";
    const aCost = transferCost(arrival?.drivers);
    if (arrival?.plan?.enabled && !hidden.has("transfer")) {
      const aRow = ws.getRow(rowIdx);
      put(aRow, "fullName", "аэропорт → гостиницы");
      put(aRow, "personType", aFirstType);
      if (arrival?.plan?.plannedAt) {
        const dt = toExcelLocal(new Date(arrival.plan.plannedAt));
        aRow.getCell(at.inDate).value = dt; aRow.getCell(at.inDate).numFmt = fmtDate;
        aRow.getCell(at.inTime).value = dt; aRow.getCell(at.inTime).numFmt = fmtTime;
      }
      if (aCost != null) {
        put(aRow, "total", aCost);
        transferMoney = true;
      }
      lastTransferRow = rowIdx;
      rowIdx += 1;
    }

    // DEPARTURE
    const departure = request?.departureTransferService;
    const dFirstType = (departure?.drivers ?? []).find((d) => d.vehicleType)?.vehicleType ?? "";
    const dCost = transferCost(departure?.drivers);
    if (departure?.plan?.enabled && !hidden.has("transferDeparture")) {
      const dRow = ws.getRow(rowIdx);
      put(dRow, "fullName", "гостиницы → аэропорт");
      put(dRow, "personType", dFirstType);
      if (departure?.plan?.plannedAt) {
        const dt = toExcelLocal(new Date(departure.plan.plannedAt));
        dRow.getCell(at.inDate).value = dt; dRow.getCell(at.inDate).numFmt = fmtDate;
        dRow.getCell(at.inTime).value = dt; dRow.getCell(at.inTime).numFmt = fmtTime;
      }
      if (dCost != null) {
        put(dRow, "total", dCost);
        transferMoney = true;
      }
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
    const range = (key) => `${letter(key)}${firstPersonRow}:${letter(key)}${lastPersonRow}`;
    const sum = (key) => ({ formula: `SUM(${range(key)})` });
    const product = (countKey, priceKey) => ({
      formula: `SUMPRODUCT(${range(countKey)},${range(priceKey)})`,
    });
    put(totalRow, "daysCount", sum("daysCount"));
    put(totalRow, "breakfastCount", sum("breakfastCount"));
    // Деньги приёма = Σ(кол-во × цена за порцию).
    putMoney(totalRow, "breakfast", product("breakfastCount", "breakfast"));
    put(totalRow, "lunchCount", sum("lunchCount"));
    putMoney(totalRow, "lunch", product("lunchCount", "lunch"));
    put(totalRow, "dinnerCount", sum("dinnerCount"));
    putMoney(totalRow, "dinner", product("dinnerCount", "dinner"));
    put(totalRow, "lunchboxCount", sum("lunchboxCount"));
    // Деньги ланчбоксов = Σ(кол-во × цена за штуку).
    putMoney(totalRow, "lunchboxPrice", product("lunchboxCount", "lunchboxPrice"));
    putMoney(totalRow, "foodCost", sum("foodCost"));
    // «Скидка» — не суммируется.
    putMoney(totalRow, "accommodationCost", sum("accommodationCost"));
  }
  const sumStart = firstPersonRow ?? 5;
  const sumEnd = lastTransferRow ?? lastPersonRow ?? sumStart;
  // Под гейтом суммировать нечего, пока в колонке нет денег трансфера.
  if (!hideMoney || transferMoney) {
    put(totalRow, "total", {
      formula: `SUM(${letter("total")}${sumStart}:${letter("total")}${sumEnd})`,
    });
  }

  applyHotelColumnWidths(ws, cols);
  finishSheet(ws, {
    lastCol,
    moneyCols,
    leftCols,
    skipRows: gapRow == null ? [] : [gapRow],
  });
  return ws;
}

export async function downloadLivingReport(request, opts = {}) {
  const { hotelIndexes = null, hideMoney = false, hiddenServiceKeys = [] } = opts;
  const wb = new ExcelJS.Workbook();
  const sheetNames = new Set();
  addCombinedSheet(wb, { request, sheetNames, includeTransfer: false, hotelIndexes, hideMoney });
  (request?.livingService?.hotels ?? []).forEach((_, hotelIndex) => {
    if (hotelIndexes && !hotelIndexes.includes(hotelIndex)) return;
    addHotelSheet(wb, { request, hotelIndex, sheetNames, hideMoney, hiddenServiceKeys });
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
    hiddenServiceKeys = [],
    hideMoney = false,
  } = opts;
  const livingEnabled = request?.livingService?.plan?.enabled;
  const arrEnabled = request?.transferService?.plan?.enabled;
  const depEnabled = request?.departureTransferService?.plan?.enabled;
  const bagEnabled = request?.baggageDeliveryService?.plan?.enabled;
  // Ключи услуг (SERVICE_CONFIG), скрытых от текущего пользователя правилом
  // fapServiceVisibility: гостинице, которая сама трансфер не возит, на экранах
  // не показывают трансфер и багаж — в книге они тоже не должны появляться,
  // иначе по кнопке «Скачать отчёт» уезжают чужие водители, рейсы и деньги.
  // Скрытая услуга дальше везде равна выключенной.
  // Ключи — те же строки, что в HOTEL_RESTRICTED_SERVICE_KEYS
  // (src/Components/Blocks/FapV2/fapServiceVisibility.js); импорт не делаем,
  // чтобы модуль отчётов не зависел от модуля видимости — при переименовании
  // ключа править оба файла парой.
  const hidden = new Set(hiddenServiceKeys);
  const arrVisible = arrEnabled && !hidden.has("transfer");
  const depVisible = depEnabled && !hidden.has("transferDeparture");
  const bagVisible = bagEnabled && !hidden.has("baggage");
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
  if (!livingVisible && !arrVisible && !depVisible && !bagVisible) {
    notifyError?.("Нет данных для отчёта");
    return false;
  }

  // Сводка — про проживание и трансфер; багаж в неё не входит, поэтому условие
  // сюда не расширяется: багаж-only книга состоит из одного листа багажа.
  if (livingVisible || arrVisible || depVisible) {
    addCombinedSheet(wb, {
      request,
      sheetNames,
      sheetPrefix,
      hotelIndexes,
      // Без !! отсутствующая услуга (arrEnabled и depEnabled оба undefined)
      // даёт includeTransfer: undefined, а дефолт деструктуризации в
      // addCombinedSheet (= true) включает пустой блок «Трансфер».
      // Считаем по *Visible, а не по *Enabled: это обязательная часть гейта —
      // блок «Трансфер» внутри «Сводки» отдаёт направления, типы ТС, время
      // подачи и суммы, то есть ровно то, что убрали с отдельных листов.
      includeTransfer: !!(arrVisible || depVisible),
      // includeTransfer говорит только «есть ли блок»; какие из двух
      // направлений внутри него рисовать, решает тот же список ключей.
      hiddenServiceKeys,
      hideMoney,
    });
  }
  if (livingVisible) {
    (request?.livingService?.hotels ?? []).forEach((_, hotelIndex) => {
      if (hotelIndexes && !hotelIndexes.includes(hotelIndex)) return;
      // Гейт услуг доводится и до листа гостиницы: его блок «Трансфер» несёт те
      // же направления, ТС и суммы, что убраны с отдельных листов.
      addHotelSheet(wb, {
        request, hotelIndex, sheetNames, sheetPrefix, hideMoney, hiddenServiceKeys,
      });
    });
  }
  if (arrVisible) {
    addTransferSheet(wb, { request, direction: "ARRIVAL", sheetNames, sheetPrefix });
  }
  if (depVisible) {
    addTransferSheet(wb, { request, direction: "DEPARTURE", sheetNames, sheetPrefix });
  }
  // Белый список гостиниц багаж не гейтит — как и трансфер.
  if (bagVisible) {
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
