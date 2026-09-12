import { test } from "node:test";
import assert from "node:assert/strict";
import ExcelJS from "exceljs";
import {
  addBaggageSheet,
  addCombinedSheet,
  addHotelSheet,
  addRequestReportSheets,
  addTransferSheet,
  addWaterMealSheet,
} from "./buildReportSheets.js";
import { preserveMoneyFields } from "../fapReportMoney.js";
import { supplyTotal } from "../fapSupply.js";

function makeRequest(airlineOverrides) {
  return {
    airline: { id: "a1", name: "Азимут", nameFull: "АО «Авиакомпания Азимут»", ...airlineOverrides },
    flightNumber: "A4-123",
    livingService: {
      plan: { enabled: true },
      hotels: [{ hotelId: "h1", name: "Гостиница Тест", address: "Город, ул. Тестовая 1", people: [] }],
    },
    hotelReports: [],
  };
}

// Заявка с одним гостем и сохранённым отчётом — чтобы в листе были строки данных.
function makeRequestWithGuest() {
  const request = makeRequest();
  request.livingService.hotels[0].people = [
    {
      personId: "p1",
      fullName: "Иванов И.И.",
      personType: "PASSENGER",
      personCategory: "ADULT",
      arrival: "2026-08-01T10:00:00.000Z",
      departure: "2026-08-03T10:00:00.000Z",
    },
  ];
  request.hotelReports = [
    {
      hotelIndex: 0,
      reportRows: [
        {
          personId: "p1",
          fullName: "Иванов И.И.",
          tariffName: "Стандарт",
          pricePerDay: 5000,
          placementKind: 1,
          roomNumber: "101",
          daysCount: 2,
          breakfast: 500, lunch: 0, dinner: 0,
          breakfastCount: 2, lunchCount: 0, dinnerCount: 0,
          lunchboxCount: 0, lunchboxPrice: 0,
          foodCost: 1000,
          accommodationCost: 10000,
        },
      ],
    },
  ];
  return request;
}

const guestSheet = () =>
  addHotelSheet(new ExcelJS.Workbook(), {
    request: makeRequestWithGuest(),
    hotelIndex: 0,
    sheetNames: new Set(),
  });

test("шапка A1 берёт полное имя авиакомпании", () => {
  const request = makeRequest();
  const wb = new ExcelJS.Workbook();
  const ws = addHotelSheet(wb, { request, hotelIndex: 0, sheetNames: new Set() });
  assert.equal(ws.getCell("A1").value, "АО «Авиакомпания Азимут»");
});

test("при пустом nameFull откатывается на короткое имя", () => {
  const requestNull = makeRequest({ nameFull: null });
  const wbNull = new ExcelJS.Workbook();
  const wsNull = addHotelSheet(wbNull, { request: requestNull, hotelIndex: 0, sheetNames: new Set() });
  assert.equal(wsNull.getCell("A1").value, "Азимут");

  const requestEmpty = makeRequest({ nameFull: "" });
  const wbEmpty = new ExcelJS.Workbook();
  const wsEmpty = addHotelSheet(wbEmpty, { request: requestEmpty, hotelIndex: 0, sheetNames: new Set() });
  assert.equal(wsEmpty.getCell("A1").value, "Азимут");
});

test("денежная колонка строки данных получает формат #,##0.00", () => {
  const ws = guestSheet();
  assert.equal(ws.getCell("Y5").numFmt, "#,##0.00");
  assert.equal(ws.getCell("X5").numFmt, "#,##0.00");
});

test("строка данных получает Times New Roman 12 и выравнивание по колонке", () => {
  const ws = guestSheet();
  const name = ws.getCell("B5");
  assert.equal(name.value, "Иванов И.И.");
  assert.equal(name.font.name, "Times New Roman");
  assert.equal(name.font.size, 12);
  assert.ok(!name.font.bold);
  assert.equal(name.alignment.horizontal, "left");
  // Соседняя колонка не в leftCols — по центру.
  assert.equal(ws.getCell("C5").alignment.horizontal, "center");
  assert.equal(ws.getCell("C5").font.name, "Times New Roman");
});

test("шапка листа закреплена по 4-ю строку", () => {
  const ws = guestSheet();
  assert.equal(ws.views[0].state, "frozen");
  assert.equal(ws.views[0].ySplit, 4);
});

test("дата заезда сохраняет свой numFmt после финального прохода", () => {
  const ws = guestSheet();
  assert.equal(ws.getCell("E5").numFmt, "dd.mm.yyyy");
  assert.equal(ws.getCell("F5").numFmt, "hh:mm");
});

test("колонка «Скидка» текстовая — без денежного формата", () => {
  const ws = guestSheet();
  assert.ok(!ws.getCell("W5").numFmt);
});

test("заголовок колонки остался жирным и получил границы", () => {
  const ws = guestSheet();
  const hdr = ws.getCell(4, 2);
  assert.equal(hdr.value, "ФИО");
  assert.equal(hdr.font.name, "Times New Roman");
  assert.equal(hdr.font.bold, true);
  assert.equal(hdr.border.top.style, "thin");
  assert.equal(hdr.border.bottom.style, "thin");
  assert.equal(hdr.border.left.style, "thin");
  assert.equal(hdr.border.right.style, "thin");
  // Заголовки центрируются при создании — проход не меняет.
  assert.equal(hdr.alignment.horizontal, "center");
});

// ── Прежняя «Сводка» (legacyLayout, детализация аналитики) ──
//
// Раскладка фикстуры: 5 — сабхедер «Гостиница: …» (merged A:Y), 6 — гость,
// 7 — пустая строка-разделитель, 8 — заголовок «Трансфер», 9 — рейс ARRIVAL,
// 10 — «Итого:».
const combinedSheet = () => {
  const request = makeRequestWithGuest();
  request.transferService = {
    plan: { enabled: true, plannedAt: "2026-08-01T08:00:00.000Z" },
    drivers: [{ fullName: "Петров П.П.", vehicleType: "Автобус", reportCost: 3000 }],
  };
  return addCombinedSheet(new ExcelJS.Workbook(), {
    request, sheetNames: new Set(), legacyLayout: true,
  });
};

test("сводка: сабхедер гостиницы остаётся left и не получает денежный формат", () => {
  const ws = combinedSheet();
  const hdr = ws.getCell("A5");
  assert.ok(String(hdr.value).startsWith("Гостиница: "));
  assert.equal(hdr.alignment.horizontal, "left");
  // L входит в moneyCols; L5 — slave того же merged-региона и делит объект стиля
  // с master, поэтому запись numFmt через него испортила бы сабхедер.
  assert.notEqual(hdr.numFmt, "#,##0.00");
  assert.notEqual(ws.getCell("L5").numFmt, "#,##0.00");
});

test("сводка: заголовок «Трансфер» остаётся по центру", () => {
  const ws = combinedSheet();
  const tHdr = ws.getCell("B8");
  assert.equal(tHdr.value, "Трансфер");
  assert.equal(tHdr.alignment.horizontal, "center");
});

test("сводка: «Итого:» выровнен влево и без переноса", () => {
  const ws = combinedSheet();
  const total = ws.getCell("A10");
  assert.equal(total.value, "Итого:");
  assert.equal(total.alignment.horizontal, "left");
  assert.notEqual(total.alignment.wrapText, true);
});

test("сводка: строка-разделитель перед «Трансфером» остаётся без сетки", () => {
  const ws = combinedSheet();
  const gap = ws.getCell("B7");
  assert.equal(gap.value, null);
  assert.ok(!gap.border || !gap.border.top);
});

test("сводка: Y1 остаётся справа и без границ (строка 1 вне диапазона)", () => {
  const ws = combinedSheet();
  const contract = ws.getCell("Y1");
  assert.equal(contract.alignment.horizontal, "right");
  assert.ok(!contract.border || !contract.border.top);
});

// ── Доставка багажа (addBaggageSheet) ──
//
// Реестр по багажу: строка = пассажир. Раскладка фикстуры: 5 — подзаголовок
// поездки №1, 6-7 — её пассажиры, 8 — подзаголовок поездки №2 (пассажиров нет),
// 9 — подзаголовок поездки №3, 10 — её пассажир, 11 — «Итого:».
//
// pickupAt/addressFrom/addressTo водителя в фикстуре нет намеренно: у багажных
// поездок они не заполняются, и раскладка их больше не печатает.
function makeBaggageRequest() {
  return {
    airline: { id: "a1", name: "Азимут", nameFull: "АО «Авиакомпания Азимут»" },
    flightNumber: "A4-123",
    baggageDeliveryService: {
      plan: { enabled: true },
      drivers: [
        {
          fullName: "Водителев В.В.",
          phone: "+7 900 000-00-01",
          vehicleType: "Легковой",
          reportCost: 3500,
          deliveryCompletedAt: "2026-08-01T12:00:00.000Z",
          peopleCount: 2, // читается кодом только когда поимённого списка нет
          people: [
            {
              personId: "p1",
              fullName: "Иванов И.И.",
              baggageTags: ["AB123", "AB124"],
              reportCost: 2000,
              addressTo: "ул. Первая 1",
            },
            {
              personId: "p2",
              fullName: "Петров П.П.",
              baggageTags: [],
              reportCost: 1500,
              addressTo: "ул. Вторая 2",
            },
          ],
        },
        {
          fullName: "Пустов П.П.",
          phone: null,
          vehicleType: null,
          reportCost: null,
          deliveryCompletedAt: null,
          peopleCount: 0,
          people: [],
        },
        {
          fullName: "Возов В.В.",
          phone: "+7 900 000-00-03",
          vehicleType: "Грузовой",
          reportCost: 800,
          deliveryCompletedAt: null, // доставка не завершена
          peopleCount: 1,
          people: [
            {
              personId: "p3",
              fullName: "Сидоров С.С.",
              baggageTags: ["CD900"],
              reportCost: 800,
              addressTo: "ул. Третья 3",
            },
          ],
        },
      ],
    },
  };
}

const baggageSheet = () =>
  addBaggageSheet(new ExcelJS.Workbook(), {
    request: makeBaggageRequest(),
    sheetNames: new Set(),
  });

test("багаж: подзаголовок поездки и строки пассажиров под ним", () => {
  const ws = baggageSheet();
  assert.equal(ws.name, "Доставка багажа");

  assert.deepEqual(ws.getRow(4).values.slice(1), [
    "№", "ФИО пассажира", "Номера бирок", "Адрес доставки",
    "Дата доставки", "Время доставки", `Сумма${VAT}`,
  ]);

  // Поездка №1 — подзаголовок на объединённой A:D, сумма поездки в G
  assert.ok(ws.model.merges.includes("A5:D5"));
  assert.equal(
    ws.getCell("A5").value,
    "Поездка 1: Водителев В.В., +7 900 000-00-01, Легковой, перевезено 2"
  );
  assert.equal(ws.getCell("A5").font.bold, true);
  assert.equal(ws.getCell("A5").alignment.horizontal, "left");
  assert.equal(ws.getCell("G5").value, 3500);

  // Её пассажиры
  assert.equal(ws.getCell("A6").value, 1);
  assert.equal(ws.getCell("B6").value, "Иванов И.И.");
  assert.equal(ws.getCell("C6").value, "AB123, AB124");
  assert.equal(ws.getCell("D6").value, "ул. Первая 1");
  assert.ok(ws.getCell("E6").value instanceof Date);
  assert.equal(ws.getCell("E6").numFmt, "dd.mm.yyyy");
  assert.ok(ws.getCell("F6").value instanceof Date);
  assert.equal(ws.getCell("F6").numFmt, "hh:mm");
  assert.equal(ws.getCell("G6").value, 2000);
  assert.equal(ws.getCell("A7").value, 2);
  assert.equal(ws.getCell("B7").value, "Петров П.П.");
  assert.equal(ws.getCell("C7").value, ""); // бирок нет
  assert.equal(ws.getCell("G7").value, 1500);

  // Поездка №2 — без пассажиров и без сумм, «перевезено» из peopleCount
  assert.equal(ws.getCell("A8").value, "Поездка 2: Пустов П.П., перевезено 0");
  assert.ok(ws.getCell("G8").value == null);

  // Поездка №3 — нумерация пассажиров сквозная по листу
  assert.equal(
    ws.getCell("A9").value,
    "Поездка 3: Возов В.В., +7 900 000-00-03, Грузовой, перевезено 1"
  );
  assert.equal(ws.getCell("G9").value, 800);
  assert.equal(ws.getCell("A10").value, 3);
  assert.equal(ws.getCell("B10").value, "Сидоров С.С.");
  assert.equal(ws.getCell("A11").value, "Итого:");
});

test("багаж: итог перечисляет только строки поездок", () => {
  const ws = baggageSheet();
  assert.equal(ws.getCell("G11").formula, "G5+G8+G9");
  // Не проверка поведения кода (тот просто копирует d.reportCost в G5) — фиксация
  // инварианта бэка на уровне фикстуры: reportCost поездки является производной
  // от пассажиров (Σ reportCost), поэтому SUM по диапазону задвоил бы деньги.
  assert.equal(ws.getCell("G5").value, ws.getCell("G6").value + ws.getCell("G7").value);
});

test("багаж: доставка не завершена — дата и время пусты", () => {
  const ws = baggageSheet();
  assert.equal(ws.getCell("E10").value, null);
  assert.equal(ws.getCell("F10").value, null);
});

test("багаж: деньги в формате #,##0.00, шапка закреплена по 4-ю строку", () => {
  const ws = baggageSheet();
  assert.equal(ws.getCell("G5").numFmt, "#,##0.00");
  assert.equal(ws.getCell("G6").numFmt, "#,##0.00");
  assert.equal(ws.views[0].state, "frozen");
  assert.equal(ws.views[0].ySplit, 4);
});

test("багаж: поездок нет — лист есть, «Итого:» без формул", () => {
  const request = makeBaggageRequest();
  request.baggageDeliveryService.drivers = [];
  const ws = addBaggageSheet(new ExcelJS.Workbook(), { request, sheetNames: new Set() });
  assert.equal(ws.getCell("A5").value, "Итого:");
  const g5 = ws.getCell("G5").value;
  assert.ok(!(g5 != null && typeof g5 === "object" && "formula" in g5));
});

test("книга заявки: только багаж — один лист «Доставка багажа» без сводки", () => {
  const wb = new ExcelJS.Workbook();
  const ok = addRequestReportSheets(wb, makeBaggageRequest(), {
    notifyError: () => {
      throw new Error("notifyError не должен вызываться");
    },
  });
  assert.equal(ok, true);
  assert.deepEqual(wb.worksheets.map((w) => w.name), ["Доставка багажа"]);
});

// Ревью T3, находка №1: проживание включено, но белый список гостиниц пуст
// (авиакомпания — пока отчёты не отправлены) + багаж включён. Гейт проходит
// по багажу; без фикса «Сводка» всё равно добавлялась бы по livingEnabled и
// оставалась пустой (все гостиницы отфильтрованы белым списком).
test("книга заявки: проживание с пустым белым списком гостиниц + багаж — только лист багажа, без «Сводки»", () => {
  const request = makeRequestWithGuest();
  request.baggageDeliveryService = makeBaggageRequest().baggageDeliveryService;
  const wb = new ExcelJS.Workbook();
  const ok = addRequestReportSheets(wb, request, {
    hotelIndexes: [],
    notifyError: () => {
      throw new Error("notifyError не должен вызываться");
    },
  });
  assert.equal(ok, true);
  assert.deepEqual(wb.worksheets.map((w) => w.name), ["Доставка багажа"]);
});

test("книга заявки: без услуг — false и уведомление об ошибке", () => {
  const wb = new ExcelJS.Workbook();
  const errors = [];
  const ok = addRequestReportSheets(wb, { airline: { name: "Азимут" } }, {
    notifyError: (msg) => errors.push(msg),
  });
  assert.equal(ok, false);
  assert.deepEqual(errors, ["Нет данных для отчёта"]);
  assert.equal(wb.worksheets.length, 0);
});

// ── T3: гейт услуг в книге (hiddenServiceKeys) ──
//
// Гостиница, которая сама трансфер не возит, не видит на экранах плитки
// трансфера и багажа — книга обязана вести себя так же.
function makeFullServiceRequest() {
  const request = makeRequestWithGuest();
  request.transferService = {
    plan: { enabled: true, plannedAt: "2026-08-01T08:00:00.000Z" },
    drivers: [{ fullName: "Петров П.П.", vehicleType: "Автобус", reportCost: 3000 }],
  };
  request.departureTransferService = {
    plan: { enabled: true, plannedAt: "2026-08-03T08:00:00.000Z" },
    drivers: [{ fullName: "Сидоров С.С.", vehicleType: "Микроавтобус", reportCost: 2500 }],
  };
  request.baggageDeliveryService = makeBaggageRequest().baggageDeliveryService;
  return request;
}

const throwOnError = (msg) => {
  throw new Error(`notifyError не должен вызываться: ${msg}`);
};

const buildBook = (request, opts) => {
  const wb = new ExcelJS.Workbook();
  const ok = addRequestReportSheets(wb, request, { notifyError: throwOnError, ...opts });
  return { ok, names: wb.worksheets.map((w) => w.name), wb };
};

// Блок «Трансфер» живёт внутри «Сводки», отдельным листом он не отражается —
// проверить его можно только обходом ячеек.
const hasCellValue = (ws, value) => {
  let found = false;
  ws.eachRow({ includeEmpty: false }, (row) => {
    row.eachCell({ includeEmpty: false }, (cell) => {
      if (cell.value === value) found = true;
    });
  });
  return found;
};

test("книга заявки: без hiddenServiceKeys состав листов прежний", () => {
  const { ok, names, wb } = buildBook(makeFullServiceRequest());
  assert.equal(ok, true);
  assert.deepEqual(names, [
    "Сводка",
    "Гостиница Тест",
    "Трансфер (в гостиницу)",
    "Трансфер (в аэропорт)",
    "Доставка багажа",
  ]);
  // Позитивный контроль к тестам ниже: в умолчании таблицы трансфера в «Сводке»
  // есть. Без этой проверки захардкоженный includeTransfer: false оставил бы
  // весь набор зелёным, а диспетчер молча потерял бы трансфер.
  const summary = wb.getWorksheet("Сводка");
  assert.equal(hasCellValue(summary, "Трансфер (в гостиницу)"), true);
  assert.equal(hasCellValue(summary, "Трансфер (в аэропорт)"), true);
});

test("книга заявки: скрыты трансфер и багаж — только «Сводка» и лист гостиницы, и в «Сводке» нет блока «Трансфер»", () => {
  const { ok, names, wb } = buildBook(makeFullServiceRequest(), {
    hiddenServiceKeys: ["transfer", "transferDeparture", "baggage"],
  });
  assert.equal(ok, true);
  assert.deepEqual(names, ["Сводка", "Гостиница Тест"]);

  // Обход всех ячеек, а не только состава листов: без includeTransfer таблицы
  // трансфера внутри «Сводки» вернули бы тех же водителей, ТС и суммы.
  const summary = wb.getWorksheet("Сводка");
  assert.equal(hasCellValue(summary, "Трансфер (в гостиницу)"), false);
  assert.equal(hasCellValue(summary, "Трансфер (в аэропорт)"), false);
  assert.equal(hasCellValue(summary, "Петров П.П."), false);
  assert.equal(hasCellValue(summary, "Сидоров С.С."), false);
});

test("книга заявки: скрыт только трансфер-прилёт — в «Сводке» осталось одно направление", () => {
  const { ok, names, wb } = buildBook(makeFullServiceRequest(), {
    hiddenServiceKeys: ["transfer"],
  });
  assert.equal(ok, true);
  assert.deepEqual(names, [
    "Сводка",
    "Гостиница Тест",
    "Трансфер (в аэропорт)",
    "Доставка багажа",
  ]);
  // Скрытие по одному ключу: таблица видимого направления в «Сводке» остаётся,
  // таблица скрытого вместе с его водителями уходит.
  const combined = wb.getWorksheet("Сводка");
  assert.equal(hasCellValue(combined, "Трансфер (в гостиницу)"), false);
  assert.equal(hasCellValue(combined, "Петров П.П."), false);
  assert.equal(hasCellValue(combined, "Трансфер (в аэропорт)"), true);
  assert.equal(hasCellValue(combined, "Сидоров С.С."), true);
});

test("книга заявки: скрыт только багаж — листы трансфера на месте", () => {
  const { ok, names } = buildBook(makeFullServiceRequest(), {
    hiddenServiceKeys: ["baggage"],
  });
  assert.equal(ok, true);
  assert.deepEqual(names, [
    "Сводка",
    "Гостиница Тест",
    "Трансфер (в гостиницу)",
    "Трансфер (в аэропорт)",
  ]);
});

test("книга заявки: всё скрыто и белый список гостиниц пуст — false и уведомление", () => {
  const wb = new ExcelJS.Workbook();
  const errors = [];
  const ok = addRequestReportSheets(wb, makeFullServiceRequest(), {
    hotelIndexes: [],
    hiddenServiceKeys: ["transfer", "transferDeparture", "baggage"],
    notifyError: (msg) => errors.push(msg),
  });
  assert.equal(ok, false);
  assert.deepEqual(errors, ["Нет данных для отчёта"]);
  assert.equal(wb.worksheets.length, 0);
});

// ── Деньги скрыты от гостиницы (hideMoney) ──
//
// Гостиница заполняет факт, деньги проживания и питания считает диспетчер по
// ценам для авиакомпании — в её выгрузке этих колонок нет вовсе. Колонка «Итого»
// остаётся: в ней ещё и суммы трансфера, а они принадлежат гостинице-перевозчику.
// Все цены в книге подписаны «(без НДС)» (решение владельца 10.09); «Скидка» —
// процент, подписи у неё нет.
const VAT = " (без НДС)";
const MONEY_HEADERS = [
  `Цена за сутки${VAT}`, `Завтрак${VAT}`, `Обед${VAT}`, `Ужин${VAT}`, `Ланчбокс${VAT}`,
  `Стоимость питания${VAT}`, "Скидка", `Стоимость проживания${VAT}`, `Итого${VAT}`,
];
const HIDDEN_MONEY_HEADERS = MONEY_HEADERS.filter((h) => h !== `Итого${VAT}`);
// Раскладка под гейтом: «Итого» появляется только когда на листе будут деньги
// трансфера (гостиница-перевозчик), поэтому в базовый набор она не входит.
const FACT_HEADERS = [
  "ID", "ФИО", "Тип", "Возрастная категория", "Дата заезда", "Время заезда",
  "Дата выезда", "Время выезда", "Номер", "Вид размещения", "Тариф",
  "Количество суток", "Количество завтраков", "Количество обедов",
  "Количество ужинов", "Количество ланчбоксов",
];

const headersOf = (ws) => ws.getRow(4).values.slice(1);

// Заголовки колонок, ячейки которых получили денежный формат.
const moneyFormatHeaders = (ws) => {
  const headers = headersOf(ws);
  const found = new Set();
  ws.eachRow({ includeEmpty: false }, (row) => {
    row.eachCell({ includeEmpty: true }, (cell, col) => {
      if (cell.numFmt === "#,##0.00") found.add(headers[col - 1]);
    });
  });
  return [...found];
};

test("лист гостиницы: без hideMoney раскладка прежняя — 25 колонок", () => {
  const ws = guestSheet();
  const headers = headersOf(ws);
  assert.equal(headers.length, 25);
  MONEY_HEADERS.forEach((h) => assert.ok(headers.includes(h), `нет колонки «${h}»`));
  assert.equal(ws.getCell("M5").value, 2);      // Количество суток
  assert.equal(ws.getCell("X5").value, 10000);  // Стоимость проживания
});

test("лист гостиницы: hideMoney убирает денежные колонки, факт остаётся", () => {
  const ws = addHotelSheet(new ExcelJS.Workbook(), {
    request: makeRequestWithGuest(),
    hotelIndex: 0,
    sheetNames: new Set(),
    hideMoney: true,
  });
  const headers = headersOf(ws);
  assert.deepEqual(headers, FACT_HEADERS);
  HIDDEN_MONEY_HEADERS.forEach((h) =>
    assert.ok(!headers.includes(h), `осталась колонка «${h}»`)
  );
  // Факт на месте, но уже в сдвинутых колонках.
  assert.equal(ws.getCell("I5").value, "101"); // Номер
  assert.equal(ws.getCell("L5").value, 2);     // Количество суток (было M)
  assert.equal(ws.getCell("M5").value, 2);     // Количество завтраков (было N)
  // Ни одной суммы отчёта в листе — ни ценой за сутки, ни стоимостью.
  [5000, 10000, 1000, 500].forEach((v) =>
    assert.equal(hasCellValue(ws, v), false, `в листе осталась сумма ${v}`)
  );
  // Трансфера в заявке нет — «Итого» не выводится, денежного формата в листе нет.
  assert.deepEqual(moneyFormatHeaders(ws), []);
});

test("лист гостиницы: перевозчик под hideMoney сохраняет «Итого» с суммами трансфера", () => {
  // hiddenServiceKeys пуст — гостиница возит сама, её трансфер ей и принадлежит.
  const ws = addHotelSheet(new ExcelJS.Workbook(), {
    request: makeFullServiceRequest(),
    hotelIndex: 0,
    sheetNames: new Set(),
    hideMoney: true,
  });
  const headers = headersOf(ws);
  assert.ok(headers.includes(`Итого${VAT}`));
  HIDDEN_MONEY_HEADERS.forEach((h) => assert.ok(!headers.includes(h)));
  assert.equal(hasCellValue(ws, "Трансфер"), true);
  assert.equal(hasCellValue(ws, 3000), true);   // прилёт
  assert.equal(hasCellValue(ws, 2500), true);   // вылет
  assert.equal(hasCellValue(ws, 10000), false); // проживание скрыто
  const totalCol = headers.indexOf(`Итого${VAT}`) + 1;
  assert.ok(
    ws.getRow(ws.rowCount).getCell(totalCol).value.formula.startsWith("SUM(")
  );
});

test("лист гостиницы: не-перевозчик под гейтом услуг — ни блока «Трансфер», ни «Итого»", () => {
  const ws = addHotelSheet(new ExcelJS.Workbook(), {
    request: makeFullServiceRequest(),
    hotelIndex: 0,
    sheetNames: new Set(),
    hideMoney: true,
    hiddenServiceKeys: ["transfer", "transferDeparture", "baggage"],
  });
  const headers = headersOf(ws);
  assert.deepEqual(headers, FACT_HEADERS);
  assert.equal(hasCellValue(ws, "Трансфер"), false);
  assert.equal(hasCellValue(ws, 3000), false);
  assert.equal(hasCellValue(ws, 2500), false);
  assert.equal(hasCellValue(ws, "Автобус"), false);
  assert.deepEqual(moneyFormatHeaders(ws), []);
});

test("лист гостиницы: направления гейтятся по отдельности", () => {
  // Деньги не скрыты (диспетчерская выгрузка со скрытым прилётом): в блоке
  // остаётся только вылет, колонки прежние.
  const ws = addHotelSheet(new ExcelJS.Workbook(), {
    request: makeFullServiceRequest(),
    hotelIndex: 0,
    sheetNames: new Set(),
    hiddenServiceKeys: ["transfer"],
  });
  assert.equal(headersOf(ws).length, 25);
  assert.equal(hasCellValue(ws, "Трансфер"), true);
  assert.equal(hasCellValue(ws, "аэропорт-гостиница Гостиница Тест"), false);
  assert.equal(hasCellValue(ws, "гостиница Гостиница Тест-аэропорт"), true);
  assert.equal(hasCellValue(ws, 3000), false);
  assert.equal(hasCellValue(ws, 2500), true);
});

// ── Блока «Трансфер» нет, когда трансфера нет ──
//
// Гейт видимости услуг блок не убирал — на проде в выгрузке гостиницы без
// трансфера висели шапка «Трансфер» и две пустые строки направлений.
// Лист гостиницы гейтит направления так же, как «Сводка»: видимо И включено.

test("лист гостиницы: трансфера у заявки нет — блока «Трансфер» тоже нет", () => {
  // Услуг трансфера в заявке нет вовсе.
  const wsNoService = guestSheet();
  // И тот же лист, где услуги есть, но выключены.
  const disabled = makeRequestWithGuest();
  disabled.transferService = { plan: { enabled: false }, drivers: [] };
  disabled.departureTransferService = { plan: { enabled: false }, drivers: [] };
  const wsDisabled = addHotelSheet(new ExcelJS.Workbook(), {
    request: disabled,
    hotelIndex: 0,
    sheetNames: new Set(),
  });

  [wsNoService, wsDisabled].forEach((ws) => {
    assert.equal(hasCellValue(ws, "Трансфер"), false);
    assert.equal(hasCellValue(ws, "аэропорт-гостиница Гостиница Тест"), false);
    assert.equal(hasCellValue(ws, "гостиница Гостиница Тест-аэропорт"), false);
    // 5 — гость, 6 — «Итого:» сразу под ним, без разделителя и блока.
    assert.equal(ws.getCell("A6").value, "Итого:");
    // Диапазон «Итого» кончается на последней строке гостя.
    assert.equal(ws.getCell("Y6").value.formula, "SUM(Y5:Y5)");
  });
});

test("лист гостиницы: включён только прилёт — в блоке одна строка", () => {
  const request = makeFullServiceRequest();
  request.departureTransferService.plan.enabled = false;
  const ws = addHotelSheet(new ExcelJS.Workbook(), {
    request,
    hotelIndex: 0,
    sheetNames: new Set(),
  });
  assert.equal(hasCellValue(ws, "Трансфер"), true);
  assert.equal(hasCellValue(ws, "аэропорт-гостиница Гостиница Тест"), true);
  assert.equal(hasCellValue(ws, "гостиница Гостиница Тест-аэропорт"), false);
  assert.equal(hasCellValue(ws, 3000), true);  // деньги прилёта
  assert.equal(hasCellValue(ws, 2500), false); // выключенный вылет денег не даёт
  // 5 — гость, 6 — разделитель, 7 — «Трансфер», 8 — прилёт, 9 — «Итого:».
  assert.equal(ws.getCell("A9").value, "Итого:");
  assert.equal(ws.getCell("Y9").value.formula, "SUM(Y5:Y8)");
});

test("лист гостиницы: выключенный трансфер не удерживает «Итого» под hideMoney", () => {
  const request = makeRequestWithGuest();
  request.transferService = { plan: { enabled: false }, drivers: [{ reportCost: 3000 }] };
  const ws = addHotelSheet(new ExcelJS.Workbook(), {
    request,
    hotelIndex: 0,
    sheetNames: new Set(),
    hideMoney: true,
  });
  // Суммы выключенного направления в лист не попадают, значит и колонка «Итого»
  // ради них не остаётся — иначе висел бы её пустой заголовок.
  assert.deepEqual(headersOf(ws), FACT_HEADERS);
  assert.equal(hasCellValue(ws, 3000), false);
});

test("лист гостиницы: hideMoney оставляет в «Итого:» только количества", () => {
  const ws = addHotelSheet(new ExcelJS.Workbook(), {
    request: makeRequestWithGuest(),
    hotelIndex: 0,
    sheetNames: new Set(),
    hideMoney: true,
  });
  // 5 — гость, 6 — «Итого:»: трансфера в фикстуре нет, блока «Трансфер» тоже.
  assert.equal(ws.getCell("A6").value, "Итого:");
  assert.equal(ws.getCell("L6").value.formula, "SUM(L5:L5)"); // Суток
  assert.equal(ws.getCell("M6").value.formula, "SUM(M5:M5)"); // Завтраки
  assert.equal(ws.getCell("P6").value.formula, "SUM(P5:P5)"); // Ланчбоксы
  // Трансфера в фикстуре нет — суммировать в «Итого» нечего, формулы нет.
  assert.equal(ws.getCell("Q6").value, null);
});

test("книга заявки: hideMoney доезжает и до «Сводки», и до листа гостиницы", () => {
  const { wb } = buildBook(makeFullServiceRequest(), {
    hiddenServiceKeys: ["transfer", "transferDeparture", "baggage"],
    hideMoney: true,
  });
  ["Сводка", "Гостиница Тест"].forEach((name) => {
    const ws = wb.getWorksheet(name);
    const headers = headersOf(ws);
    HIDDEN_MONEY_HEADERS.forEach((h) =>
      assert.ok(!headers.includes(h), `${name}: осталась колонка «${h}»`)
    );
    assert.equal(hasCellValue(ws, 10000), false, `${name}: осталась сумма проживания`);
    assert.equal(hasCellValue(ws, 11000), false, `${name}: остался итог по гостю`);
    // Гейт услуг доезжает вместе с hideMoney: чужих денег трансфера нет ни на
    // одном листе книги — ни в «Сводке», ни на листе гостиницы.
    assert.equal(hasCellValue(ws, 3000), false, `${name}: осталась сумма прилёта`);
    assert.equal(hasCellValue(ws, 2500), false, `${name}: осталась сумма вылета`);
    ["Трансфер", "Трансфер (в гостиницу)", "Трансфер (в аэропорт)"].forEach((caption) =>
      assert.equal(hasCellValue(ws, caption), false, `${name}: остался «${caption}»`)
    );
  });
  assert.deepEqual(headersOf(wb.getWorksheet("Гостиница Тест")), FACT_HEADERS);
});

test("книга заявки: без hideMoney деньги в книге на месте", () => {
  const { wb } = buildBook(makeFullServiceRequest());
  const combined = wb.getWorksheet("Сводка");
  assert.ok(headersOf(combined).includes(`Стоимость проживания${VAT}`));
  assert.equal(hasCellValue(combined, 10000), true);
  assert.ok(
    moneyFormatHeaders(wb.getWorksheet("Гостиница Тест")).includes(`Стоимость проживания${VAT}`)
  );
});

// ── Заморозка денег в связке с листом (регресс интеграционного ревью) ──
//
// Гостиница правит факт, buildReportRows прогоняет строки через
// preserveMoneyFields — и книга, которую печатает уже диспетчер/авиакомпания,
// не должна получить ни выдуманной скидки, ни спорящих между собой итогов.
const preservedRows = (patch) => {
  const request = makeRequestWithGuest();
  const saved = request.hotelReports[0].reportRows;
  return { request, rows: preserveMoneyFields([{ ...saved[0], ...patch }], saved) };
};

test("книга: правка суток гостиницей не фабрикует скидку", () => {
  const { request, rows } = preservedRows({ daysCount: 5 });
  const ws = addHotelSheet(new ExcelJS.Workbook(), {
    request,
    hotelIndex: 0,
    sheetNames: new Set(),
    rows,
  });
  assert.equal(ws.getCell("M5").value, 2);   // сутки остались диспетчерскими
  assert.equal(ws.getCell("L5").value, 5000); // цена за сутки
  assert.equal(ws.getCell("X5").value, 10000);
  assert.equal(ws.getCell("W5").value, "—"); // 1 − 10000/(5000×2) = 0
});

test("книга: «Стоимость питания» согласована со счётчиками и ставками строки", () => {
  const { request, rows } = preservedRows({ breakfastCount: 4 });
  const ws = addHotelSheet(new ExcelJS.Workbook(), {
    request,
    hotelIndex: 0,
    sheetNames: new Set(),
    rows,
  });
  const cell = (a) => Number(ws.getCell(a).value);
  // V = N×O + P×Q + R×S + T×U — ровно то, что суммирует строка «Итого:».
  assert.equal(
    cell("V5"),
    cell("N5") * cell("O5") + cell("P5") * cell("Q5") + cell("R5") * cell("S5") + cell("T5") * cell("U5")
  );
  assert.equal(cell("V5"), 2000); // 500 × 4
});

// ── Вид размещения соседей по номеру ──
//
// Тариф с режимом «Номер» начисляет проживание один раз — на «несущего» гостя
// номера, у соседей в сохранённых строках placementKind: 0 и нули по деньгам.
// Книга подставляет соседу вид размещения несущего, но ни одной цифры строки
// при этом не трогает (пустая «Цена за сутки» у соседа — так и задумано).
function makeRoomMateRequest() {
  const request = makeRequest();
  request.livingService.hotels[0].people = [
    { personId: "p1", fullName: "Иванов И.И.", personType: "PASSENGER", personCategory: "ADULT" },
    { personId: "p2", fullName: "Петров П.П.", personType: "PASSENGER", personCategory: "ADULT" },
  ];
  request.hotelReports = [
    {
      hotelIndex: 0,
      reportRows: [
        {
          personId: "p1", fullName: "Иванов И.И.", tariffName: "Стандарт",
          pricePerDay: 2700, placementKind: 2, roomNumber: "12", daysCount: 2,
          foodCost: 0, accommodationCost: 5400,
        },
        {
          personId: "p2", fullName: "Петров П.П.", tariffName: "Стандарт",
          pricePerDay: 0, placementKind: 0, roomNumber: "12", daysCount: 2,
          foodCost: 0, accommodationCost: 0,
        },
      ],
    },
  ];
  return request;
}

test("лист гостиницы: сосед по номеру получает вид размещения несущего гостя", () => {
  const ws = addHotelSheet(new ExcelJS.Workbook(), {
    request: makeRoomMateRequest(),
    hotelIndex: 0,
    sheetNames: new Set(),
  });
  assert.equal(ws.getCell("I5").value, "12");
  assert.equal(ws.getCell("I6").value, "12");
  assert.equal(ws.getCell("J5").value, "двухместное");
  assert.equal(ws.getCell("J6").value, "двухместное");
  // Деньги строк остались как в отчёте: у соседа цена за сутки пустая, суммы нулевые.
  assert.equal(ws.getCell("L5").value, 2700);
  assert.equal(ws.getCell("L6").value, null);
  assert.equal(ws.getCell("X5").value, 5400);
  assert.equal(ws.getCell("X6").value, 0);
  assert.equal(ws.getCell("Y5").value, 5400);
  assert.equal(ws.getCell("Y6").value, 0);
  assert.equal(ws.getCell("W6").value, "—"); // базы для скидки нет
});

test("лист гостиницы: гость без номера остаётся без вида размещения", () => {
  const request = makeRoomMateRequest();
  request.hotelReports[0].reportRows[1].roomNumber = "";
  const ws = addHotelSheet(new ExcelJS.Workbook(), {
    request,
    hotelIndex: 0,
    sheetNames: new Set(),
  });
  assert.equal(ws.getCell("J5").value, "двухместное");
  assert.equal(ws.getCell("J6").value, "");
});

// ── Доли номера (тариф «Номер» делит цену между заселёнными) ──
//
// С 09.2026 сумма номера раскладывается по жильцам: у каждого своя цена за
// сутки (база B) и своя доля. Книга не меняется — она печатает то, что лежит в
// строках, — но колонки «Цена за сутки», «Вид размещения» и «Скидка» теперь
// заполнены у всех, а не у одного «несущего».
function makeRoomSplitRequest() {
  const request = makeRequest();
  request.livingService.hotels[0].people = [
    { personId: "p1", fullName: "Иванов И.И.", personType: "PASSENGER", personCategory: "ADULT" },
    { personId: "p2", fullName: "Петров П.П.", personType: "PASSENGER", personCategory: "ADULT" },
    { personId: "p3", fullName: "Петров Ваня", personType: "PASSENGER", personCategory: "CHILD" },
  ];
  // Номер 4500 за сутки на троих: Σ(вес × сутки) = 1 + 1 + 0.5 = 2.5 → B = 1800.
  const row = (personId, fullName, accommodationCost) => ({
    personId, fullName, tariffName: "Стандарт",
    pricePerDay: 1800, placementKind: 3, roomNumber: "12", daysCount: 1,
    foodCost: 0, accommodationCost,
  });
  request.hotelReports = [
    {
      hotelIndex: 0,
      reportRows: [
        row("p1", "Иванов И.И.", 1800),
        row("p2", "Петров П.П.", 1800),
        row("p3", "Петров Ваня", 900),
      ],
    },
  ];
  return request;
}

test("лист гостиницы: доли номера печатают скидку ребёнка и сходятся в «Итого»", () => {
  const ws = addHotelSheet(new ExcelJS.Workbook(), {
    request: makeRoomSplitRequest(),
    hotelIndex: 0,
    sheetNames: new Set(),
  });
  // Цена за сутки и вид размещения заполнены у всех троих — подстановка
  // printedKind для этого больше не нужна.
  [5, 6, 7].forEach((r) => {
    assert.equal(ws.getCell(`L${r}`).value, 1800);
    assert.equal(ws.getCell(`J${r}`).value, "трёхместное");
  });
  // Скидка выводится из чисел строки: у взрослых базы нет, у ребёнка 1 − 900/1800.
  assert.equal(ws.getCell("W5").value, "—");
  assert.equal(ws.getCell("W6").value, "—");
  assert.equal(ws.getCell("W7").value, "50%");
  // Сумма долей = цена номера, и «Итого» суммирует ровно эти три строки.
  const shares = [5, 6, 7].map((r) => Number(ws.getCell(`X${r}`).value));
  assert.deepEqual(shares, [1800, 1800, 900]);
  assert.equal(shares.reduce((s, v) => s + v, 0), 4500);
  assert.equal(ws.getCell("A8").value, "Итого:");
  assert.equal(ws.getCell("X8").value.formula, "SUM(X5:X7)");
});

// Сводка: у каждой гостиницы своя карта номеров — «1» в разных гостиницах
// это разные номера.
function makeTwoHotelsRequest() {
  const request = makeRequest();
  request.livingService.hotels = [
    {
      hotelId: "h1", name: "Гостиница А",
      people: [
        { personId: "a1", fullName: "Иванов И.И." },
        { personId: "a2", fullName: "Петров П.П." },
      ],
    },
    {
      hotelId: "h2", name: "Гостиница Б",
      people: [
        { personId: "b1", fullName: "Сидоров С.С." },
        { personId: "b2", fullName: "Кузнецов К.К." },
      ],
    },
  ];
  request.hotelReports = [
    {
      hotelIndex: 0,
      reportRows: [
        {
          personId: "a1", fullName: "Иванов И.И.", placementKind: 2, roomNumber: "1",
          pricePerDay: 2700, daysCount: 1, accommodationCost: 2700,
        },
        { personId: "a2", fullName: "Петров П.П.", placementKind: 0, roomNumber: "1" },
      ],
    },
    {
      hotelIndex: 1,
      reportRows: [
        {
          personId: "b1", fullName: "Сидоров С.С.", placementKind: 3, roomNumber: "1",
          pricePerDay: 3300, daysCount: 1, accommodationCost: 3300,
        },
        { personId: "b2", fullName: "Кузнецов К.К.", placementKind: 0, roomNumber: "1" },
      ],
    },
  ];
  return request;
}

test("сводка: сосед получает вид размещения из своей гостиницы", () => {
  const ws = addCombinedSheet(new ExcelJS.Workbook(), {
    request: makeTwoHotelsRequest(),
    sheetNames: new Set(),
    includeTransfer: false,
  });
  // 5 — сабхедер «Гостиница А», 6-7 — её гости, 8 — сабхедер «Гостиница Б», 9-10 — её.
  assert.equal(ws.getCell("J6").value, "двухместное");
  assert.equal(ws.getCell("J7").value, "двухместное");
  assert.equal(ws.getCell("J9").value, "трёхместное");
  assert.equal(ws.getCell("J10").value, "трёхместное");
  // Деньги остались при несущих гостях.
  assert.equal(ws.getCell("X6").value, 2700);
  assert.equal(ws.getCell("X7").value, 0);
  assert.equal(ws.getCell("X9").value, 3300);
});

// ── Порядок печати: соседи по номеру идут подряд ──
//
// Экран вкладки «Отчёт» группирует гостей по номеру комнаты (мемо reportGroups),
// книга обязана печатать в том же порядке — иначе жильцы одного номера
// разбросаны по листу чужими строками.

// Ростер по алфавиту: A(208) · B(5) · C(208). Ожидаемый порядок печати — A, C, B.
function makeRoomOrderRequest() {
  const request = makeRequest();
  request.livingService.hotels[0].people = [
    { personId: "p1", fullName: "AMAF I.", personType: "PASSENGER", personCategory: "ADULT" },
    { personId: "p2", fullName: "BORISOV B.", personType: "PASSENGER", personCategory: "ADULT" },
    { personId: "p3", fullName: "CHIN C.", personType: "PASSENGER", personCategory: "ADULT" },
  ];
  request.hotelReports = [
    {
      hotelIndex: 0,
      reportRows: [
        {
          personId: "p1", fullName: "AMAF I.", tariffName: "Стандарт",
          pricePerDay: 1000, placementKind: 2, roomNumber: "208", daysCount: 1,
          foodCost: 0, accommodationCost: 1000,
        },
        {
          personId: "p2", fullName: "BORISOV B.", tariffName: "Стандарт",
          pricePerDay: 2000, placementKind: 1, roomNumber: "5", daysCount: 1,
          foodCost: 0, accommodationCost: 2000,
        },
        {
          personId: "p3", fullName: "CHIN C.", tariffName: "Стандарт",
          pricePerDay: 3000, placementKind: 2, roomNumber: "208", daysCount: 1,
          foodCost: 0, accommodationCost: 3000,
        },
      ],
    },
  ];
  return request;
}

const hotelSheetOf = (request) =>
  addHotelSheet(new ExcelJS.Workbook(), { request, hotelIndex: 0, sheetNames: new Set() });

test("лист гостиницы: жильцы одного номера печатаются подряд, ID — по новому порядку", () => {
  const ws = hotelSheetOf(makeRoomOrderRequest());
  // Ростер A(208) · B(5) · C(208) → лист A · C · B.
  assert.deepEqual(
    [ws.getCell("B5").value, ws.getCell("B6").value, ws.getCell("B7").value],
    ["AMAF I.", "CHIN C.", "BORISOV B."]
  );
  // ID — порядковый номер строки листа, а не индекс в ростере.
  assert.deepEqual(
    [ws.getCell("A5").value, ws.getCell("A6").value, ws.getCell("A7").value],
    [1, 2, 3]
  );
  // Значения строк уехали вместе с людьми: номер, цена, стоимость, итог.
  assert.deepEqual(
    [ws.getCell("I5").value, ws.getCell("I6").value, ws.getCell("I7").value],
    ["208", "208", "5"]
  );
  assert.deepEqual(
    [ws.getCell("L5").value, ws.getCell("L6").value, ws.getCell("L7").value],
    [1000, 3000, 2000]
  );
  assert.deepEqual(
    [ws.getCell("X5").value, ws.getCell("X6").value, ws.getCell("X7").value],
    [1000, 3000, 2000]
  );
  assert.deepEqual(
    [ws.getCell("Y5").value, ws.getCell("Y6").value, ws.getCell("Y7").value],
    [1000, 3000, 2000]
  );
});

test("лист гостиницы: гость без номера не разрывает пару соседей", () => {
  const request = makeRoomOrderRequest();
  // A(9) · B(без номера) · C(9) → лист A · C · B: безномерной остаётся
  // одиночной группой на своей позиции, то есть после уже открытой группы «9».
  request.hotelReports[0].reportRows[0].roomNumber = "9";
  request.hotelReports[0].reportRows[1].roomNumber = "";
  request.hotelReports[0].reportRows[2].roomNumber = "9";
  const ws = hotelSheetOf(request);
  assert.deepEqual(
    [ws.getCell("B5").value, ws.getCell("B6").value, ws.getCell("B7").value],
    ["AMAF I.", "CHIN C.", "BORISOV B."]
  );
  assert.deepEqual(
    [ws.getCell("I5").value, ws.getCell("I6").value, ws.getCell("I7").value],
    ["9", "9", ""]
  );
});

// Значения строки листа как сравнимый массив: формулы — строкой «=…».
const rowValues = (ws, r) =>
  Array.from({ length: 25 }, (_, i) => {
    const v = ws.getRow(r).getCell(i + 1).value;
    return v && typeof v === "object" && "formula" in v ? `=${v.formula}` : v;
  });

test("лист гостиницы: «Итого» не зависит от порядка строк", () => {
  const ws = hotelSheetOf(makeRoomOrderRequest());

  // Тот же набор данных, но ростер УЖЕ сгруппирован (A · C · B) — печать
  // обоих ростеров обязана дать одинаковую строку «Итого».
  const pre = makeRoomOrderRequest();
  const order = [0, 2, 1];
  pre.livingService.hotels[0].people = order.map(
    (i) => makeRoomOrderRequest().livingService.hotels[0].people[i]
  );
  pre.hotelReports[0].reportRows = order.map(
    (i) => makeRoomOrderRequest().hotelReports[0].reportRows[i]
  );
  const wsPre = hotelSheetOf(pre);

  // 5-7 — гости, 8 — «Итого:»: трансфера в фикстуре нет, блока «Трансфер» тоже.
  assert.equal(ws.getCell("A8").value, "Итого:");
  assert.deepEqual(rowValues(ws, 8), rowValues(wsPre, 8));
  // Диапазон сплошной и тот же, что был до перестановки.
  assert.equal(ws.getCell("M8").value.formula, "SUM(M5:M7)");
  assert.equal(ws.getCell("X8").value.formula, "SUM(X5:X7)");
  assert.equal(ws.getCell("V8").value.formula, "SUM(V5:V7)");
});

test("лист гостиницы: сосед по номеру печатается сразу под несущим и берёт его вид", () => {
  const request = makeRequest();
  request.livingService.hotels[0].people = [
    { personId: "p1", fullName: "Несущий Н.Н." },
    { personId: "p2", fullName: "Одиночка О.О." },
    { personId: "p3", fullName: "Сосед С.С." },
  ];
  request.hotelReports = [
    {
      hotelIndex: 0,
      reportRows: [
        {
          personId: "p1", fullName: "Несущий Н.Н.", placementKind: 2, roomNumber: "12",
          pricePerDay: 2700, daysCount: 2, accommodationCost: 5400,
        },
        {
          personId: "p2", fullName: "Одиночка О.О.", placementKind: 1, roomNumber: "3",
          pricePerDay: 1800, daysCount: 2, accommodationCost: 3600,
        },
        // Тариф с режимом «Номер»: у соседа placementKind: 0 и нули по деньгам.
        {
          personId: "p3", fullName: "Сосед С.С.", placementKind: 0, roomNumber: "12",
          pricePerDay: 0, daysCount: 2, accommodationCost: 0,
        },
      ],
    },
  ];
  const ws = hotelSheetOf(request);
  assert.deepEqual(
    [ws.getCell("B5").value, ws.getCell("B6").value, ws.getCell("B7").value],
    ["Несущий Н.Н.", "Сосед С.С.", "Одиночка О.О."]
  );
  // Фолбэк вида размещения работает поверх нового порядка.
  assert.deepEqual(
    [ws.getCell("J5").value, ws.getCell("J6").value, ws.getCell("J7").value],
    ["двухместное", "двухместное", "одноместное"]
  );
  // Деньги остались при своих людях: у соседа пустая цена и нулевая стоимость.
  assert.equal(ws.getCell("L6").value, null);
  assert.equal(ws.getCell("X6").value, 0);
  assert.equal(ws.getCell("X7").value, 3600);
});

test("сводка: группировка по номерам внутри каждой гостиницы, ID сквозной", () => {
  const request = makeRequest();
  request.livingService.hotels = [
    {
      hotelId: "h1", name: "Гостиница А",
      people: [
        { personId: "a1", fullName: "Первый П." },
        { personId: "a2", fullName: "Второй В." },
        { personId: "a3", fullName: "Третий Т." },
      ],
    },
    {
      hotelId: "h2", name: "Гостиница Б",
      people: [
        { personId: "b1", fullName: "Четвёртый Ч." },
        { personId: "b2", fullName: "Пятый П." },
      ],
    },
  ];
  request.hotelReports = [
    {
      hotelIndex: 0,
      reportRows: [
        { personId: "a1", fullName: "Первый П.", roomNumber: "1", accommodationCost: 100 },
        { personId: "a2", fullName: "Второй В.", roomNumber: "2", accommodationCost: 200 },
        { personId: "a3", fullName: "Третий Т.", roomNumber: "1", accommodationCost: 300 },
      ],
    },
    {
      hotelIndex: 1,
      reportRows: [
        { personId: "b1", fullName: "Четвёртый Ч.", roomNumber: "7", accommodationCost: 400 },
        { personId: "b2", fullName: "Пятый П.", roomNumber: "7", accommodationCost: 500 },
      ],
    },
  ];
  const ws = addCombinedSheet(new ExcelJS.Workbook(), {
    request,
    sheetNames: new Set(),
    includeTransfer: false,
  });
  // 5 — сабхедер «Гостиница А», 6-8 — её гости, 9 — сабхедер «Гостиница Б», 10-11 — её.
  assert.ok(String(ws.getCell("A5").value).startsWith("Гостиница: Гостиница А"));
  assert.ok(String(ws.getCell("A9").value).startsWith("Гостиница: Гостиница Б"));
  assert.deepEqual(
    [6, 7, 8, 10, 11].map((r) => ws.getCell(`B${r}`).value),
    ["Первый П.", "Третий Т.", "Второй В.", "Четвёртый Ч.", "Пятый П."]
  );
  assert.deepEqual(
    [6, 7, 8, 10, 11].map((r) => ws.getCell(`I${r}`).value),
    ["1", "1", "2", "7", "7"]
  );
  // Группировка не выходит за границы гостиницы, ID сквозной по книге.
  assert.deepEqual([6, 7, 8, 10, 11].map((r) => ws.getCell(`A${r}`).value), [1, 2, 3, 4, 5]);
  // Деньги уехали вместе с людьми.
  assert.deepEqual(
    [6, 7, 8, 10, 11].map((r) => ws.getCell(`X${r}`).value),
    [100, 300, 200, 400, 500]
  );
});

test("сводка: ghost-строка тарифа не подставляет вид размещения гостю", () => {
  const request = makeRequest();
  request.livingService.hotels[0].people = [{ personId: "p1", fullName: "Иванов И.И." }];
  request.hotelReports = [
    {
      hotelIndex: 0,
      reportRows: [
        { personId: "p1", fullName: "Иванов И.И.", placementKind: 0, roomNumber: "1" },
        // Ghost-строка таблицы цен тарифа: ФИО пустое, вид — из ценовой пары.
        { fullName: "", tariffName: "Стандарт", placementKind: 4, roomNumber: "1", pricePerDay: 1800 },
      ],
    },
  ];
  const ws = addCombinedSheet(new ExcelJS.Workbook(), {
    request,
    sheetNames: new Set(),
    includeTransfer: false,
  });
  assert.equal(ws.getCell("I6").value, "1");
  assert.equal(ws.getCell("J6").value, "");
});

// ── Титулы: город может отсутствовать ──
//
// Города нет, когда у заявки нет аэропорта с городом и нет адреса гостиницы
// (типично для багаж-only заявки). «г. » клеилось в шаблон всё равно — титул
// заканчивался висящим «г.» с двойным пробелом, имя файла — «… г. .xlsx».

const TITLE_PREFIX = "Детализация оказанных услуг пассажиров задержанного рейса № A4-123";

test("титулы: город есть — формат прежний", () => {
  const request = makeRequestWithGuest(); // адрес «Город, ул. Тестовая 1» → «Город»
  const hotel = addHotelSheet(new ExcelJS.Workbook(), {
    request, hotelIndex: 0, sheetNames: new Set(),
  });
  assert.equal(
    hotel.getCell("C3").value,
    `${TITLE_PREFIX} г. Город гостиница Гостиница Тест`
  );
  const combined = addCombinedSheet(new ExcelJS.Workbook(), {
    request, sheetNames: new Set(), includeTransfer: false,
  });
  assert.equal(combined.getCell("C3").value, `${TITLE_PREFIX} г. Город`);
});

test("титулы: города нет — «г.» не печатается и лишних пробелов не остаётся", () => {
  const request = makeRequestWithGuest();
  request.livingService.hotels[0].address = "";
  const hotel = addHotelSheet(new ExcelJS.Workbook(), {
    request, hotelIndex: 0, sheetNames: new Set(),
  });
  assert.equal(hotel.getCell("C3").value, `${TITLE_PREFIX} гостиница Гостиница Тест`);
  const combined = addCombinedSheet(new ExcelJS.Workbook(), {
    request, sheetNames: new Set(), includeTransfer: false,
  });
  assert.equal(combined.getCell("C3").value, TITLE_PREFIX);
  [hotel, combined].forEach((ws) => {
    const title = String(ws.getCell("C3").value);
    assert.ok(!title.includes("г."), `в титуле осталось «г.»: ${title}`);
    assert.ok(!title.includes("  "), `в титуле двойной пробел: ${title}`);
  });
});

test("титул багажа: у багаж-only заявки города нет — «г.» не печатается", () => {
  // Гостиниц у такой заявки нет вовсе, аэропорта тоже — реальный прод-случай.
  const ws = baggageSheet();
  assert.equal(ws.getCell("C3").value, "Доставка багажа по рейсу № A4-123");
});

// ── Режим аналитики (legacyLayout): «Сводка» один в один как до 10.09 ──
//
// Эталон снят с кода до правок (компактный «Трансфер» строками в раскладке
// проживания, одна строка «Итого:», подписи без «(без НДС)»). Детализация Excel
// аналитики по пассажирам обязана остаться такой — решение владельца 10.09.

// Снимок листа: значения и формулы по ячейкам (даты — меткой: их сдвиг зависит
// от часового пояса машины), merge-регионы и ширины 25 колонок.
const sheetSnapshot = (ws) => {
  const cells = [];
  ws.eachRow({ includeEmpty: false }, (row) => {
    row.eachCell({ includeEmpty: false }, (cell) => {
      if (cell.master !== cell) return;
      const v = cell.value;
      const shown = v instanceof Date ? "<date>"
        : v && typeof v === "object" && "formula" in v ? `=${v.formula}` : v;
      cells.push(`${cell.address}=${shown}`);
    });
  });
  const widths = [];
  for (let c = 1; c <= 25; c += 1) widths.push(ws.getColumn(c).width ?? null);
  return { cells, merges: [...ws.model.merges].sort(), widths };
};

const LEGACY_HEAD = [
  "A1=АО «Авиакомпания Азимут»",
];
const LEGACY_TITLE = "C3=Детализация оказанных услуг пассажиров задержанного рейса № A4-123 г. Город";
const LEGACY_GUEST = [
  "A5=Гостиница: Гостиница Тест · Город, ул. Тестовая 1",
  "A6=1", "B6=Иванов И.И.", "C6=Пассажир", "D6=Взрослый",
  "E6=<date>", "F6=<date>", "G6=<date>", "H6=<date>",
  "I6=101", "J6=одноместное", "K6=Стандарт",
];

const LEGACY_SUMMARY = {
  cells: [
    ...LEGACY_HEAD,
    'Y1=Договор № или "по согласованию"',
    LEGACY_TITLE,
    "A4=ID", "B4=ФИО", "C4=Тип", "D4=Возрастная категория", "E4=Дата заезда",
    "F4=Время заезда", "G4=Дата выезда", "H4=Время выезда", "I4=Номер",
    "J4=Вид размещения", "K4=Тариф", "L4=Цена за сутки", "M4=Количество суток",
    "N4=Количество завтраков", "O4=Завтрак", "P4=Количество обедов", "Q4=Обед",
    "R4=Количество ужинов", "S4=Ужин", "T4=Количество ланчбоксов", "U4=Ланчбокс",
    "V4=Стоимость питания", "W4=Скидка", "X4=Стоимость проживания", "Y4=Итого",
    ...LEGACY_GUEST,
    "L6=5000", "M6=2", "N6=2", "O6=500", "P6=0", "Q6=0", "R6=0", "S6=0",
    "T6=0", "U6=0", "V6=1000", "W6=—", "X6=10000", "Y6=11000",
    "B8=Трансфер",
    "B9=аэропорт → гостиницы", "C9=Автобус", "E9=<date>", "F9=<date>", "Y9=3000",
    "B10=гостиницы → аэропорт", "C10=Микроавтобус", "E10=<date>", "F10=<date>", "Y10=2500",
    "A11=Итого:",
    "M11==SUM(M6:M6)", "N11==SUM(N6:N6)", "O11==SUMPRODUCT(N6:N6,O6:O6)",
    "P11==SUM(P6:P6)", "Q11==SUMPRODUCT(P6:P6,Q6:Q6)", "R11==SUM(R6:R6)",
    "S11==SUMPRODUCT(R6:R6,S6:S6)", "T11==SUM(T6:T6)", "U11==SUMPRODUCT(T6:T6,U6:U6)",
    "V11==SUM(V6:V6)", "X11==SUM(X6:X6)", "Y11==SUM(Y6:Y10)",
  ],
  merges: ["A5:Y5", "B8:H8"],
  widths: [6, 28, 12, 15, 13, 12, 13, 12, 12, 18, 20, 14, 15, 15, 12, 15, 12, 15, 12, 18, 12, 15, 10, 15, 12],
};

const LEGACY_SUMMARY_HIDE_MONEY = {
  cells: [
    ...LEGACY_HEAD,
    'Q1=Договор № или "по согласованию"',
    LEGACY_TITLE,
    "A4=ID", "B4=ФИО", "C4=Тип", "D4=Возрастная категория", "E4=Дата заезда",
    "F4=Время заезда", "G4=Дата выезда", "H4=Время выезда", "I4=Номер",
    "J4=Вид размещения", "K4=Тариф", "L4=Количество суток", "M4=Количество завтраков",
    "N4=Количество обедов", "O4=Количество ужинов", "P4=Количество ланчбоксов", "Q4=Итого",
    ...LEGACY_GUEST,
    "L6=2", "M6=2", "N6=0", "O6=0", "P6=0",
    "B8=Трансфер",
    "B9=аэропорт → гостиницы", "C9=Автобус", "E9=<date>", "F9=<date>", "Q9=3000",
    "B10=гостиницы → аэропорт", "C10=Микроавтобус", "E10=<date>", "F10=<date>", "Q10=2500",
    "A11=Итого:",
    "L11==SUM(L6:L6)", "M11==SUM(M6:M6)", "N11==SUM(N6:N6)", "O11==SUM(O6:O6)",
    "P11==SUM(P6:P6)", "Q11==SUM(Q6:Q10)",
  ],
  merges: ["A5:Q5", "B8:H8"],
  widths: [6, 28, 12, 15, 13, 12, 13, 12, 12, 18, 20, 15, 15, 15, 15, 18, 12,
    null, null, null, null, null, null, null, null],
};

test("сводка аналитики (legacyLayout): значения, формулы, merge и ширины — как до 10.09", () => {
  [[false, LEGACY_SUMMARY], [true, LEGACY_SUMMARY_HIDE_MONEY]].forEach(([hideMoney, expected]) => {
    const ws = addCombinedSheet(new ExcelJS.Workbook(), {
      request: makeFullServiceRequest(),
      sheetNames: new Set(),
      hideMoney,
      legacyLayout: true,
    });
    assert.deepEqual(sheetSnapshot(ws), expected, `hideMoney=${hideMoney}`);
  });
});

// ── Подписи «(без НДС)» на всех листах книги ──

test("подписи: денежные колонки листа гостиницы — «(без НДС)», «Скидка» и факт — без", () => {
  const headers = headersOf(guestSheet());
  assert.ok(headers.includes("Цена за сутки (без НДС)"));
  assert.ok(headers.includes("Итого (без НДС)"));
  assert.ok(headers.includes("Скидка"));
  assert.ok(!headers.includes("Скидка (без НДС)"));
  assert.ok(headers.includes("Количество суток"));
});

test("подписи: лист трансфера и лист багажа — «Сумма (без НДС)»", () => {
  const { wb } = buildBook(makeFullServiceRequest());
  assert.equal(wb.getWorksheet("Трансфер (в гостиницу)").getCell("K4").value, "Сумма (без НДС)");
  assert.equal(wb.getWorksheet("Трансфер (в аэропорт)").getCell("K4").value, "Сумма (без НДС)");
  const baggage = wb.getWorksheet("Доставка багажа");
  assert.equal(baggage.getCell("G4").value, "Сумма (без НДС)");
});

// ── Лист трансфера: та же таблица потом встаёт в «Сводку» ──

test("лист трансфера: шапка, строки водителей, «Итого:», сетка не шире K", () => {
  const request = makeFullServiceRequest();
  request.transferService.drivers = [
    {
      fullName: "Петров П.П.", phone: "+79000000001", addressFrom: "Аэропорт",
      addressTo: "ул. Тестовая 1", pickupAt: "2026-08-01T08:00:00.000Z",
      vehicleType: "Автобус", vehicleNumber: "А123АА", transportedCount: 17, reportCost: 3000,
    },
    { fullName: "Сергеев С.С.", vehicleType: "Минивэн", reportCost: 1500 },
  ];
  const ws = addTransferSheet(new ExcelJS.Workbook(), {
    request, direction: "ARRIVAL", sheetNames: new Set(),
  });
  assert.equal(ws.name, "Трансфер (в гостиницу)");
  assert.deepEqual(ws.getRow(4).values.slice(1), [
    "№", "ФИО водителя", "Телефон", "Адрес отправления", "Адрес прибытия",
    "Дата подачи", "Время подачи", "Тип ТС", "Гос. номер", "Перевезено", "Сумма (без НДС)",
  ]);
  assert.equal(ws.getCell("A5").value, 1);
  assert.equal(ws.getCell("B5").value, "Петров П.П.");
  assert.equal(ws.getCell("D5").value, "Аэропорт");
  assert.equal(ws.getCell("F5").numFmt, "dd.mm.yyyy");
  assert.equal(ws.getCell("G5").numFmt, "hh:mm");
  assert.equal(ws.getCell("I5").value, "А123АА");
  assert.equal(ws.getCell("J5").value, 17);
  assert.equal(ws.getCell("K5").value, 3000);
  assert.equal(ws.getCell("K5").numFmt, "#,##0.00");
  assert.equal(ws.getCell("A6").value, 2);
  assert.equal(ws.getCell("A7").value, "Итого:");
  assert.equal(ws.getCell("J7").value.formula, "SUM(J5:J6)");
  assert.equal(ws.getCell("K7").value.formula, "SUM(K5:K6)");
  assert.equal(ws.getCell("B5").alignment.horizontal, "left");
  assert.ok(!ws.getCell("L5").border, "сетка вышла за K");
});

test("лист трансфера: водителей нет — «Итого:» без формул", () => {
  const request = makeFullServiceRequest();
  request.transferService.drivers = [];
  const ws = addTransferSheet(new ExcelJS.Workbook(), {
    request, direction: "ARRIVAL", sheetNames: new Set(),
  });
  assert.equal(ws.getCell("A5").value, "Итого:");
  assert.equal(ws.getCell("K5").value, null);
});

// ── Новая «Сводка»: трансфер таблицами, как на листах (решение владельца 10.09) ──
//
// Раскладка фикстуры makeFullServiceRequest: 5 — «Гостиница: …», 6 — гость,
// 7 — «Итого:» проживания, 8 — разделитель, 9 — «Трансфер (в гостиницу)»,
// 10 — шапка, 11 — Петров, 12 — «Итого:», 13 — разделитель,
// 14 — «Трансфер (в аэропорт)», 15 — шапка, 16 — Сидоров, 17 — «Итого:»,
// 18 — разделитель, 19 — «Всего по заявке:».
const summarySheet = (opts = {}) =>
  addCombinedSheet(new ExcelJS.Workbook(), {
    request: makeFullServiceRequest(),
    sheetNames: new Set(),
    ...opts,
  });

test("сводка: «Итого:» проживания сразу под гостями, только по их строкам", () => {
  const ws = summarySheet();
  assert.equal(ws.getCell("A7").value, "Итого:");
  assert.equal(ws.getCell("M7").value.formula, "SUM(M6:M6)");
  assert.equal(ws.getCell("O7").value.formula, "SUMPRODUCT(N6:N6,O6:O6)");
  assert.equal(ws.getCell("Y7").value.formula, "SUM(Y6:Y6)");
});

test("сводка: таблица трансфера в раскладке листа — заголовок, шапка, водитель, «Итого:»", () => {
  const ws = summarySheet();
  const caption = ws.getCell("A9");
  assert.equal(caption.value, "Трансфер (в гостиницу)");
  assert.ok(ws.model.merges.includes("A9:K9"));
  assert.equal(caption.font.bold, true);
  assert.equal(caption.alignment.horizontal, "left");
  assert.equal(caption.fill.fgColor.argb, "FFEEF2F7");
  assert.deepEqual(ws.getRow(10).values.slice(1), [
    "№", "ФИО водителя", "Телефон", "Адрес отправления", "Адрес прибытия",
    "Дата подачи", "Время подачи", "Тип ТС", "Гос. номер", "Перевезено", "Сумма (без НДС)",
  ]);
  assert.equal(ws.getCell("A11").value, 1);
  assert.equal(ws.getCell("B11").value, "Петров П.П.");
  assert.equal(ws.getCell("H11").value, "Автобус");
  assert.equal(ws.getCell("K11").value, 3000);
  assert.equal(ws.getCell("K11").numFmt, "#,##0.00");
  assert.equal(ws.getCell("A12").value, "Итого:");
  assert.equal(ws.getCell("J12").value.formula, "SUM(J11:J11)");
  assert.equal(ws.getCell("K12").value.formula, "SUM(K11:K11)");
  assert.equal(ws.getCell("A14").value, "Трансфер (в аэропорт)");
  assert.equal(ws.getCell("B16").value, "Сидоров С.С.");
  assert.equal(ws.getCell("K16").value, 2500);
  assert.equal(ws.getCell("K17").value.formula, "SUM(K16:K16)");
});

test("сводка: «Всего по заявке» = «Итого» проживания + «Итого» таблиц трансфера", () => {
  const ws = summarySheet();
  assert.equal(ws.getCell("A19").value, "Всего по заявке:");
  assert.equal(ws.getCell("A19").font.bold, true);
  assert.equal(ws.getCell("Y19").value.formula, "Y7+K12+K17");
  assert.equal(ws.getCell("Y19").numFmt, "#,##0.00");
  assert.equal(ws.rowCount, 19);
});

test("сводка: разделители без сетки, сетка таблицы трансфера не шире K", () => {
  const ws = summarySheet();
  [8, 13, 18].forEach((r) => {
    const gap = ws.getCell(`B${r}`);
    assert.ok(!gap.border || !gap.border.top, `строка ${r} получила сетку`);
  });
  assert.equal(ws.getCell("K11").border.top.style, "thin");
  assert.ok(!ws.getCell("L11").border, "L11 получила сетку");
  assert.ok(!ws.getCell("Y11").border, "Y11 получила сетку");
  assert.ok(!ws.getCell("L9").border, "L9 (заголовок таблицы) получила сетку");
  assert.equal(ws.getCell("Y7").border.top.style, "thin"); // проживание — во всю ширину
  assert.equal(ws.getCell("B11").alignment.horizontal, "left"); // выравнивание листа трансфера
});

test("сводка: при трансфере колонки под адреса расширены до ширин листа трансфера", () => {
  const ws = summarySheet();
  assert.deepEqual([3, 4, 5, 8, 9].map((c) => ws.getColumn(c).width), [16, 30, 30, 22, 14]);
  assert.equal(ws.getColumn(2).width, 28); // остальные — по раскладке проживания
});

test("сводка: без трансфера — ни таблиц, ни «Всего по заявке», ширины прежние", () => {
  const ws = addCombinedSheet(new ExcelJS.Workbook(), {
    request: makeRequestWithGuest(),
    sheetNames: new Set(),
  });
  assert.equal(ws.getCell("A7").value, "Итого:");
  assert.equal(ws.rowCount, 7);
  assert.equal(hasCellValue(ws, "Всего по заявке:"), false);
  assert.equal(ws.getColumn(4).width, 15);
});

test("сводка: скрыт прилёт — одна таблица, «Всего» складывает только её", () => {
  const ws = summarySheet({ hiddenServiceKeys: ["transfer"] });
  assert.equal(hasCellValue(ws, "Трансфер (в гостиницу)"), false);
  assert.equal(hasCellValue(ws, "Петров П.П."), false);
  assert.equal(ws.getCell("A9").value, "Трансфер (в аэропорт)");
  assert.equal(ws.getCell("A14").value, "Всего по заявке:");
  assert.equal(ws.getCell("Y14").value.formula, "Y7+K12");
});

test("сводка: только трансфер, без гостей — «Всего» из «Итого» таблиц", () => {
  const request = makeFullServiceRequest();
  request.livingService = { plan: { enabled: false }, hotels: [] };
  const ws = addCombinedSheet(new ExcelJS.Workbook(), { request, sheetNames: new Set() });
  assert.equal(ws.getCell("A6").value, "Трансфер (в гостиницу)");
  assert.equal(ws.getCell("A9").value, "Итого:");
  assert.equal(ws.getCell("A16").value, "Всего по заявке:");
  assert.equal(ws.getCell("Y16").value.formula, "K9+K14");
});

test("сводка: hideMoney — без денег проживания и «Всего», суммы трансфера в своих таблицах", () => {
  const ws = summarySheet({ hideMoney: true });
  assert.deepEqual(headersOf(ws), FACT_HEADERS); // и колонки «Итого» тоже нет
  assert.equal(hasCellValue(ws, 10000), false);
  assert.equal(hasCellValue(ws, 3000), true);
  assert.equal(hasCellValue(ws, 2500), true);
  assert.equal(hasCellValue(ws, "Всего по заявке:"), false);
  assert.equal(ws.getCell("A7").value, "Итого:");
  assert.equal(ws.getCell("L7").value.formula, "SUM(L6:L6)"); // сутки остаются
  assert.equal(ws.getCell("K11").numFmt, "#,##0.00");
});

test("сводка: includeTransfer: false — таблиц трансфера и «Всего» нет, ширины прежние", () => {
  // На этот гейт опирается отчёт «Проживание» (downloadLivingReport): в заявке
  // трансфер есть, но в отчёт по проживанию он попадать не должен.
  const ws = summarySheet({ includeTransfer: false });
  assert.equal(ws.rowCount, 7);
  assert.equal(hasCellValue(ws, "Трансфер (в гостиницу)"), false);
  assert.equal(hasCellValue(ws, "Трансфер (в аэропорт)"), false);
  assert.equal(hasCellValue(ws, "Всего по заявке:"), false);
  assert.equal(ws.getColumn(4).width, 15);
});

// ── Лист «Вода и питание» (addWaterMealSheet) ──
//
// Раскладка фикстуры: 5 — вода, 6 — питание, 7 — «Итого:».
// Суммы для АК: вода 40 × 60.5 + 500 = 2920, питание 30 × 350 = 10500.
function makeSupplyRequest() {
  return {
    airline: { id: "a1", name: "Азимут", nameFull: "АО «Авиакомпания Азимут»" },
    flightNumber: "A4-123",
    waterService: {
      plan: { enabled: true, peopleCount: 40, plannedAt: "2026-08-01T06:00:00.000Z" },
      supplier: "ООО «Вода»",
      suppliedAt: "2026-08-01T09:00:00.000Z",
      quantity: 40,
      unitPrice: 60.5,
      deliveryCost: 500,
      supplierCost: 1200, // внутренняя стоимость поставщику — в книгу не идёт никогда
      people: [],
    },
    mealService: {
      plan: { enabled: true, peopleCount: 30, plannedAt: "2026-08-01T11:00:00.000Z" },
      supplier: "ООО «Питание»",
      suppliedAt: "2026-08-01T12:30:00.000Z",
      quantity: 30,
      unitPrice: 350,
      deliveryCost: null,
      supplierCost: 7000,
      people: [],
    },
  };
}

const WATER_MEAL_HEADERS = [
  "№", "Услуга", "Поставщик", "Дата поставки", "Время поставки", "Количество",
  `Цена за единицу${VAT}`, `Доставка${VAT}`, `Сумма${VAT}`,
];

const supplySheet = (request, opts = {}) =>
  addWaterMealSheet(new ExcelJS.Workbook(), { request, sheetNames: new Set(), ...opts });

test("вода и питание: строка воды и строка питания, суммы и «Итого»", () => {
  const request = makeSupplyRequest();
  const ws = supplySheet(request);
  assert.equal(ws.name, "Вода и питание");
  assert.equal(ws.getCell("A1").value, "АО «Авиакомпания Азимут»");
  assert.equal(ws.getCell("C3").value, "Вода и питание по рейсу № A4-123");
  assert.deepEqual(ws.getRow(4).values.slice(1), WATER_MEAL_HEADERS);

  // Вода
  assert.equal(ws.getCell("A5").value, 1);
  assert.equal(ws.getCell("B5").value, "Поставка воды");
  assert.equal(ws.getCell("C5").value, "ООО «Вода»");
  assert.equal(ws.getCell("D5").numFmt, "dd.mm.yyyy");
  assert.equal(ws.getCell("E5").numFmt, "hh:mm");
  assert.equal(ws.getCell("F5").value, 40);
  assert.equal(ws.getCell("G5").value, 60.5);
  assert.equal(ws.getCell("H5").value, 500);
  assert.equal(ws.getCell("I5").value, supplyTotal(request.waterService)); // 2920
  assert.equal(ws.getCell("I5").numFmt, "#,##0.00");

  // Питание — второй строкой, доставки нет
  assert.equal(ws.getCell("A6").value, 2);
  assert.equal(ws.getCell("B6").value, "Поставка питания");
  assert.equal(ws.getCell("C6").value, "ООО «Питание»");
  assert.equal(ws.getCell("F6").value, 30);
  assert.equal(ws.getCell("G6").value, 350);
  assert.equal(ws.getCell("H6").value, null);
  assert.equal(ws.getCell("I6").value, supplyTotal(request.mealService)); // 10500

  // Стоимость поставщику — внутренняя, в книге её нет ни у одной услуги.
  assert.equal(hasCellValue(ws, 1200), false);
  assert.equal(hasCellValue(ws, 7000), false);

  assert.equal(ws.getCell("A7").value, "Итого:");
  assert.equal(ws.getCell("F7").value.formula, "SUM(F5:F6)");
  assert.equal(ws.getCell("I7").value.formula, "SUM(I5:I6)");
});

test("вода и питание: услуга выключена — строки нет", () => {
  const request = makeSupplyRequest();
  request.mealService.plan.enabled = false;
  const ws = supplySheet(request);
  assert.equal(hasCellValue(ws, "Поставка питания"), false);
  assert.equal(ws.getCell("A6").value, "Итого:");
  assert.equal(ws.getCell("I6").value.formula, "SUM(I5:I5)");
});

test("вода и питание: факт без цен — «Сумма» пуста", () => {
  const request = makeSupplyRequest();
  request.waterService.unitPrice = null;
  request.waterService.deliveryCost = null;
  request.mealService.plan.enabled = false;
  const ws = supplySheet(request);
  assert.equal(ws.getCell("F5").value, 40); // количество факта осталось
  assert.equal(ws.getCell("G5").value, null);
  assert.equal(ws.getCell("H5").value, null);
  assert.equal(ws.getCell("I5").value, null); // ноль за пустой факт не печатаем
});

test("вода и питание: hideMoney убирает денежные колонки, факт остаётся", () => {
  const ws = supplySheet(makeSupplyRequest(), { hideMoney: true });
  assert.deepEqual(ws.getRow(4).values.slice(1), [
    "№", "Услуга", "Поставщик", "Дата поставки", "Время поставки", "Количество",
  ]);
  assert.equal(ws.getCell("C5").value, "ООО «Вода»");
  assert.equal(ws.getCell("F5").value, 40);
  [60.5, 500, 2920, 350, 10500].forEach((v) =>
    assert.equal(hasCellValue(ws, v), false, `в листе осталась сумма ${v}`)
  );
  assert.equal(ws.getCell("A7").value, "Итого:");
  assert.equal(ws.getCell("F7").value.formula, "SUM(F5:F6)");
  assert.equal(ws.getCell("G7").value, null); // денег нет — суммировать нечего
});

// ── Книга: лист «Вода и питание» ──

test("книга заявки: только вода — единственный лист «Вода и питание»", () => {
  const request = makeSupplyRequest();
  delete request.mealService;
  const { ok, names } = buildBook(request);
  assert.equal(ok, true);
  assert.deepEqual(names, ["Вода и питание"]);
});

test("книга заявки: вода и питание идут листом после багажа", () => {
  const request = makeFullServiceRequest();
  request.waterService = makeSupplyRequest().waterService;
  request.mealService = makeSupplyRequest().mealService;
  const { names } = buildBook(request);
  assert.deepEqual(names, [
    "Сводка",
    "Гостиница Тест",
    "Трансфер (в гостиницу)",
    "Трансфер (в аэропорт)",
    "Доставка багажа",
    "Вода и питание",
  ]);
});

test("книга заявки: ключи воды и питания скрыты — листа нет", () => {
  const request = makeFullServiceRequest();
  request.waterService = makeSupplyRequest().waterService;
  request.mealService = makeSupplyRequest().mealService;
  const { names } = buildBook(request, { hiddenServiceKeys: ["water", "meal"] });
  assert.equal(names.includes("Вода и питание"), false);

  // Заявка без других услуг: скрытая поставка гейт не проходит.
  const only = makeSupplyRequest();
  const wb = new ExcelJS.Workbook();
  const errors = [];
  const ok = addRequestReportSheets(wb, only, {
    hiddenServiceKeys: ["water", "meal"],
    notifyError: (msg) => errors.push(msg),
  });
  assert.equal(ok, false);
  assert.deepEqual(errors, ["Нет данных для отчёта"]);
});

// ── «Сводка»: строка «Вода и питание» и «Всего по заявке» ──
//
// Раскладка фикстуры: 5 — «Гостиница: …», 6 — гость, 7 — «Итого:» проживания,
// 8 — разделитель, 9 — «Вода и питание:», 10 — разделитель, 11 — «Всего по заявке:».
function makeGuestWithSupplyRequest() {
  const request = makeRequestWithGuest();
  const supply = makeSupplyRequest();
  request.waterService = supply.waterService;
  request.mealService = supply.mealService;
  return request;
}

test("сводка: проживание и поставки без трансфера — строка «Вода и питание:» и «Всего по заявке»", () => {
  const request = makeGuestWithSupplyRequest();
  const ws = addCombinedSheet(new ExcelJS.Workbook(), { request, sheetNames: new Set() });
  assert.equal(ws.getCell("A7").value, "Итого:");
  assert.equal(ws.getCell("A9").value, "Вода и питание:");
  // Значение, а не формула: деталь поставки живёт на своём листе.
  assert.equal(
    ws.getCell("Y9").value,
    supplyTotal(request.waterService) + supplyTotal(request.mealService)
  );
  assert.equal(ws.getCell("Y9").numFmt, "#,##0.00");
  assert.equal(ws.getCell("A11").value, "Всего по заявке:");
  assert.equal(ws.getCell("Y11").value.formula, "Y7+Y9");
  // Строка-разделитель перед блоком остаётся без сетки.
  assert.ok(!ws.getCell("B8").border || !ws.getCell("B8").border.top);
});

test("сводка: трансфер и поставки — обе суммы слагаемыми «Всего по заявке»", () => {
  const request = makeFullServiceRequest();
  request.waterService = makeSupplyRequest().waterService;
  const ws = addCombinedSheet(new ExcelJS.Workbook(), { request, sheetNames: new Set() });
  assert.equal(ws.getCell("A19").value, "Вода и питание:");
  assert.equal(ws.getCell("A21").value, "Всего по заявке:");
  assert.equal(ws.getCell("Y21").value.formula, "Y7+K12+K17+Y19");
});

test("сводка: hideMoney — ни строки «Вода и питание:», ни «Всего по заявке»", () => {
  const ws = addCombinedSheet(new ExcelJS.Workbook(), {
    request: makeGuestWithSupplyRequest(),
    sheetNames: new Set(),
    hideMoney: true,
  });
  assert.equal(hasCellValue(ws, "Вода и питание:"), false);
  assert.equal(hasCellValue(ws, "Всего по заявке:"), false);
  assert.equal(hasCellValue(ws, 13420), false);
  assert.equal(ws.rowCount, 7);
});

test("сводка: скрытая поставка в строку «Вода и питание:» не попадает", () => {
  const ws = addCombinedSheet(new ExcelJS.Workbook(), {
    request: makeGuestWithSupplyRequest(),
    sheetNames: new Set(),
    hiddenServiceKeys: ["meal"],
  });
  assert.equal(ws.getCell("A9").value, "Вода и питание:");
  assert.equal(ws.getCell("Y9").value, 2920); // только вода
});

// ── Лист багажа: внутренние колонки диспетчера (internal) ──

function makeInternalBaggageRequest() {
  const request = makeBaggageRequest();
  const [first, second] = request.baggageDeliveryService.drivers;
  first.driverCost = 2800;
  first.distanceKm = 120;
  second.driverCost = 900;
  second.distanceKm = null;
  return request;
}

test("багаж: internal печатает «Водителю» и «Межгород, км» в строках поездок", () => {
  const ws = addBaggageSheet(new ExcelJS.Workbook(), {
    request: makeInternalBaggageRequest(),
    sheetNames: new Set(),
    internal: true,
  });
  assert.deepEqual(ws.getRow(4).values.slice(1), [
    "№", "ФИО пассажира", "Номера бирок", "Адрес доставки",
    "Дата доставки", "Время доставки", `Сумма${VAT}`,
    `Водителю${VAT}`, "Межгород, км",
  ]);
  assert.equal(ws.getCell("H5").value, 2800);
  assert.equal(ws.getCell("H5").numFmt, "#,##0.00");
  assert.equal(ws.getCell("I5").value, 120);
  assert.equal(ws.getCell("H8").value, 900);
  assert.equal(ws.getCell("I8").value, null);
  // Пассажирские строки внутренних колонок не несут.
  assert.equal(ws.getCell("H6").value, null);
  assert.equal(ws.getCell("I6").value, null);
  // «Итого» по H — перечислением строк поездок, как по G; I не суммируется.
  assert.equal(ws.getCell("H11").value.formula, "H5+H8+H9");
  assert.equal(ws.getCell("I11").value, null);
  // Сетка дотянута до I и не дальше.
  assert.equal(ws.getCell("I5").border.top.style, "thin");
  assert.ok(!ws.getCell("J5").border, "сетка вышла за I");
});

test("багаж: без internal — 7 колонок, внутренних чисел в листе нет", () => {
  const ws = addBaggageSheet(new ExcelJS.Workbook(), {
    request: makeInternalBaggageRequest(),
    sheetNames: new Set(),
  });
  assert.equal(ws.getRow(4).values.slice(1).length, 7);
  assert.equal(hasCellValue(ws, 2800), false);
  assert.equal(hasCellValue(ws, 900), false);
  assert.equal(hasCellValue(ws, 120), false);
  assert.ok(!ws.getCell("H5").border, "сетка вышла за G");
});
