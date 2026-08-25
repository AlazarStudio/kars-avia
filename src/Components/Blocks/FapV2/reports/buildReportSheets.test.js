import { test } from "node:test";
import assert from "node:assert/strict";
import ExcelJS from "exceljs";
import {
  addBaggageSheet,
  addCombinedSheet,
  addHotelSheet,
  addRequestReportSheets,
} from "./buildReportSheets.js";

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
