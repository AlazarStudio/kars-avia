import { test } from "node:test";
import assert from "node:assert/strict";
import ExcelJS from "exceljs";
import {
  addBaggageSheet,
  addCombinedSheet,
  addHotelSheet,
  addRequestReportSheets,
} from "./buildReportSheets.js";
import { preserveMoneyFields } from "../fapReportMoney.js";

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

// ── Сводка (addCombinedSheet): merged-сабхедер, разделитель, «Итого» ──
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
  return addCombinedSheet(new ExcelJS.Workbook(), { request, sheetNames: new Set() });
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
// Раскладка фикстуры: 5 — водитель №1, 6 — сабхедер мини-таблицы, 7-8 — его
// пассажиры, 9 — водитель №2 (пассажиров нет → сабхедера нет), 10 — «Итого:».
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
          pickupAt: "2026-08-01T12:00:00.000Z",
          addressFrom: "Аэропорт",
          addressTo: "Город",
          vehicleType: "Легковой",
          reportCost: 3500,
          peopleCount: 2, // не читается кодом — поле здесь зеркалит реальный payload
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
          pickupAt: null,
          addressFrom: null,
          addressTo: null,
          vehicleType: null,
          reportCost: null,
          peopleCount: 0,
          people: [],
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

test("багаж: строка водителя, сабхедер и строки пассажиров под ним", () => {
  const ws = baggageSheet();
  assert.equal(ws.name, "Доставка багажа");

  // Водитель №1
  assert.equal(ws.getCell("B5").value, "Водителев В.В.");
  assert.equal(ws.getCell("H5").value, "Легковой");
  assert.equal(ws.getCell("J5").value, 3500);
  assert.equal(ws.getCell("I5").value, 2); // «Перевезено» = число пассажиров

  // Сабхедер мини-таблицы
  assert.equal(ws.getCell("B6").value, "Пассажир");
  assert.equal(ws.getCell("E6").value, "Адрес доставки");
  assert.equal(ws.getCell("H6").value, "Номера бирок");
  assert.equal(ws.getCell("J6").value, "Сумма");
  assert.equal(ws.getCell("B6").font.bold, true);

  // Пассажиры
  assert.equal(ws.getCell("B7").value, "Иванов И.И.");
  assert.equal(ws.getCell("E7").value, "ул. Первая 1");
  assert.equal(ws.getCell("H7").value, "AB123, AB124");
  assert.equal(ws.getCell("J7").value, 2000);
  assert.equal(ws.getCell("B8").value, "Петров П.П.");
  assert.equal(ws.getCell("E8").value, "ул. Вторая 2");
  assert.equal(ws.getCell("H8").value, ""); // бирок нет
  assert.equal(ws.getCell("J8").value, 1500);

  // Водитель №2: сумм нет, пассажиров нет → сабхедера под ним тоже нет.
  assert.equal(ws.getCell("B9").value, "Пустов П.П.");
  assert.ok(ws.getCell("J9").value == null);
  assert.ok(ws.getCell("I9").value == null);
  assert.equal(ws.getCell("A10").value, "Итого:");
});

test("багаж: итог перечисляет только водительские строки", () => {
  const ws = baggageSheet();
  assert.equal(ws.getCell("J10").formula, "J5+J9");
  assert.equal(ws.getCell("I10").formula, "I5+I9");
  // Не проверка поведения кода (тот просто копирует d.reportCost в J5) — фиксация
  // инварианта бэка на уровне фикстуры: reportCost водителя является производной
  // от пассажиров (Σ reportCost), поэтому SUM по диапазону задвоил бы деньги.
  assert.equal(ws.getCell("J5").value, ws.getCell("J7").value + ws.getCell("J8").value);
});

test("багаж: деньги в формате #,##0.00, шапка закреплена по 4-ю строку", () => {
  const ws = baggageSheet();
  assert.equal(ws.getCell("J5").numFmt, "#,##0.00");
  assert.equal(ws.views[0].state, "frozen");
  assert.equal(ws.views[0].ySplit, 4);
});

test("багаж: водителей нет — лист есть, «Итого:» без формул", () => {
  const request = makeBaggageRequest();
  request.baggageDeliveryService.drivers = [];
  const ws = addBaggageSheet(new ExcelJS.Workbook(), { request, sheetNames: new Set() });
  assert.equal(ws.getCell("A5").value, "Итого:");
  const j5 = ws.getCell("J5").value;
  const i5 = ws.getCell("I5").value;
  assert.ok(!(j5 != null && typeof j5 === "object" && "formula" in j5));
  assert.ok(!(i5 != null && typeof i5 === "object" && "formula" in i5));
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
  // Позитивный контроль к тестам ниже: в умолчании блок «Трансфер» в «Сводке»
  // есть. Без этой проверки захардкоженный includeTransfer: false оставил бы
  // весь набор зелёным, а диспетчер молча потерял бы блок.
  assert.equal(hasCellValue(wb.getWorksheet("Сводка"), "Трансфер"), true);
});

test("книга заявки: скрыты трансфер и багаж — только «Сводка» и лист гостиницы, и в «Сводке» нет блока «Трансфер»", () => {
  const { ok, names, wb } = buildBook(makeFullServiceRequest(), {
    hiddenServiceKeys: ["transfer", "transferDeparture", "baggage"],
  });
  assert.equal(ok, true);
  assert.deepEqual(names, ["Сводка", "Гостиница Тест"]);

  // Обход всех ячеек, а не только состава листов: без includeTransfer блок
  // «Трансфер» внутри «Сводки» вернул бы те же рейсы, ТС и суммы.
  assert.equal(hasCellValue(wb.getWorksheet("Сводка"), "Трансфер"), false);
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
  // Скрытие по одному ключу: блок «Трансфер» в «Сводке» остаётся ради видимого
  // направления, но строка скрытого направления из него уходит.
  const combined = wb.getWorksheet("Сводка");
  assert.equal(hasCellValue(combined, "Трансфер"), true);
  assert.equal(hasCellValue(combined, "аэропорт → гостиницы"), false);
  assert.equal(hasCellValue(combined, "гостиницы → аэропорт"), true);
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
const MONEY_HEADERS = [
  "Цена за сутки", "Завтрак", "Обед", "Ужин", "Ланчбокс",
  "Стоимость питания", "Скидка", "Стоимость проживания", "Итого",
];
const HIDDEN_MONEY_HEADERS = MONEY_HEADERS.filter((h) => h !== "Итого");
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
  assert.ok(headers.includes("Итого"));
  HIDDEN_MONEY_HEADERS.forEach((h) => assert.ok(!headers.includes(h)));
  assert.equal(hasCellValue(ws, "Трансфер"), true);
  assert.equal(hasCellValue(ws, 3000), true);   // прилёт
  assert.equal(hasCellValue(ws, 2500), true);   // вылет
  assert.equal(hasCellValue(ws, 10000), false); // проживание скрыто
  const totalCol = headers.indexOf("Итого") + 1;
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
    assert.equal(hasCellValue(ws, "Трансфер"), false, `${name}: остался блок трансфера`);
  });
  assert.deepEqual(headersOf(wb.getWorksheet("Гостиница Тест")), FACT_HEADERS);
});

test("сводка: под hideMoney «Итого» остаётся ради сумм трансфера перевозчика", () => {
  // У гостиницы-перевозчика hiddenServiceKeys пуст: трансфер — её собственные
  // деньги, и на её листе «Трансфер» они видны в любом случае.
  const { wb } = buildBook(makeFullServiceRequest(), { hideMoney: true });
  const ws = wb.getWorksheet("Сводка");
  const headers = headersOf(ws);
  assert.ok(headers.includes("Итого"));
  HIDDEN_MONEY_HEADERS.forEach((h) => assert.ok(!headers.includes(h)));
  assert.equal(hasCellValue(ws, 3000), true);   // прилёт
  assert.equal(hasCellValue(ws, 2500), true);   // вылет
  assert.equal(hasCellValue(ws, 10000), false); // проживание всё так же скрыто
  // «Итого:» суммирует колонку, в которой лежат только деньги трансфера.
  const totalCol = headers.indexOf("Итого") + 1;
  const totalRow = ws.rowCount;
  assert.ok(ws.getRow(totalRow).getCell(totalCol).value.formula.startsWith("SUM("));
});

test("книга заявки: без hideMoney деньги в книге на месте", () => {
  const { wb } = buildBook(makeFullServiceRequest());
  const combined = wb.getWorksheet("Сводка");
  assert.ok(headersOf(combined).includes("Стоимость проживания"));
  assert.equal(hasCellValue(combined, 10000), true);
  assert.ok(
    moneyFormatHeaders(wb.getWorksheet("Гостиница Тест")).includes("Стоимость проживания")
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
