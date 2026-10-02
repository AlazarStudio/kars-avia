import { test } from "node:test";
import assert from "node:assert/strict";
import ExcelJS from "exceljs";
import { fillFormulaResults } from "./formulaResults.js";
import { addRequestReportSheets } from "./buildReportSheets.js";
import { supplyTotal } from "../fapSupply.js";

const sheetWith = (cells) => {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("Лист");
  Object.entries(cells).forEach(([address, value]) => {
    ws.getCell(address).value = value;
  });
  return { wb, ws };
};

const isFormula = (v) => v != null && typeof v === "object" && typeof v.formula === "string";

test("SUM по колонке: пустые ячейки и текст пропускаются, формула остаётся", () => {
  const { wb, ws } = sheetWith({
    A1: 10,
    A3: "—",
    A4: 2.5,
    A5: { formula: "SUM(A1:A4)" },
  });
  fillFormulaResults(wb);
  assert.deepEqual(ws.getCell("A5").value, { formula: "SUM(A1:A4)", result: 12.5 });
});

test("SUMPRODUCT: попарные произведения, текст считается нулём", () => {
  const { wb, ws } = sheetWith({
    N6: 2, O6: 500,
    N7: 1, O7: "—",
    N8: 3, O8: 100.5,
    O9: { formula: "SUMPRODUCT(N6:N8,O6:O8)" },
  });
  fillFormulaResults(wb);
  assert.equal(ws.getCell("O9").value.formula, "SUMPRODUCT(N6:N8,O6:O8)");
  assert.equal(ws.getCell("O9").value.result, 1301.5);
});

test("цепочка формул считается независимо от порядка обхода ячеек", () => {
  const { wb, ws } = sheetWith({
    // B1 обходится первым, но зависит от формул ниже по листу.
    B1: { formula: "Y12-K5" },
    Y1: 100, Y2: 200, Y3: 300,
    K1: 40, K2: 2,
    Y10: { formula: "SUM(Y1:Y3)" },
    K5: { formula: "SUM(K1:K2)" },
    Y12: { formula: "Y10+K5" },
  });
  fillFormulaResults(wb);
  assert.equal(ws.getCell("Y10").value.result, 600);
  assert.equal(ws.getCell("K5").value.result, 42);
  assert.equal(ws.getCell("Y12").value.result, 642);
  assert.equal(ws.getCell("B1").value.result, 600);
  assert.equal(ws.getCell("Y12").value.formula, "Y10+K5");
});

test("пробелы, регистр функции, $-ссылки и числа-аргументы", () => {
  const { wb, ws } = sheetWith({
    A1: 5, A2: 7,
    B1: { formula: " sum( $A$1:$A2 , 3 ) + A1 - 1.5 " },
  });
  fillFormulaResults(wb);
  assert.equal(ws.getCell("B1").value.result, 18.5);
});

test("ссылка на пустую ячейку в сумме ссылок — ноль", () => {
  const { wb, ws } = sheetWith({ A1: 5, B1: { formula: "A1+A2" } });
  fillFormulaResults(wb);
  assert.equal(ws.getCell("B1").value.result, 5);
});

test("итог округляется до копеек — без хвостов плавающей точки", () => {
  const { wb, ws } = sheetWith({ A1: 0.1, A2: 0.2, A3: { formula: "SUM(A1:A2)" } });
  fillFormulaResults(wb);
  assert.equal(ws.getCell("A3").value.result, 0.3);
});

test("объединённая ячейка считается один раз — по мастеру", () => {
  const { wb, ws } = sheetWith({});
  ws.mergeCells("A1:B1");
  ws.getCell("A1").value = 7;
  ws.getCell("C1").value = { formula: "SUM(A1:B1)" };
  fillFormulaResults(wb);
  assert.equal(ws.getCell("C1").value.result, 7);
});

test("неподдержанная формула остаётся без результата, остальные считаются", () => {
  const { wb, ws } = sheetWith({
    A1: 1, A2: 2, A3: 3,
    B1: { formula: "AVERAGE(A1:A3)" },
    B2: { formula: "Sheet2!A1+1" },
    B3: { formula: "A1*2" },
    B4: { formula: "B3+1" }, // зависит от неподдержанной — тоже без результата
    B5: { formula: "SUM(A1:A3" },
    B6: { formula: "SUMPRODUCT(A1:A3,A1:A2)" }, // разная форма диапазонов
    B7: { formula: "SUM(A1:A3)" },
  });
  assert.doesNotThrow(() => fillFormulaResults(wb));
  ["B1", "B2", "B3", "B4", "B5", "B6"].forEach((address) => {
    const v = ws.getCell(address).value;
    assert.ok(isFormula(v), `${address} потеряла формулу`);
    assert.equal("result" in v, false, `${address} получила результат`);
  });
  assert.equal(ws.getCell("B2").value.formula, "Sheet2!A1+1");
  assert.equal(ws.getCell("B7").value.result, 6);
});

test("цикл не роняет расчёт и оставляет обе ячейки без результата", () => {
  const { wb, ws } = sheetWith({
    A1: { formula: "B1+1" },
    B1: { formula: "A1+1" },
  });
  assert.doesNotThrow(() => fillFormulaResults(wb));
  assert.deepEqual(ws.getCell("A1").value, { formula: "B1+1" });
  assert.deepEqual(ws.getCell("B1").value, { formula: "A1+1" });
});

test("книга просит Excel пересчитать формулы при открытии", () => {
  const { wb } = sheetWith({ A1: 1 });
  wb.calcProperties = { calcId: 1 };
  fillFormulaResults(wb);
  assert.equal(wb.calcProperties.fullCalcOnLoad, true);
  assert.equal(wb.calcProperties.calcId, 1);
});

// ── Настоящая книга заявки ──
//
// Два гостя в разных номерах, трансфер в обе стороны, багаж (внутренний режим —
// с колонкой «Водителю»), вода и питание: формулы всех видов, что пишет
// buildReportSheets.
const GUEST_ROWS = [
  {
    personId: "p1", fullName: "Иванов И.И.", tariffName: "Стандарт",
    pricePerDay: 5000, placementKind: 1, roomNumber: "101", daysCount: 2,
    breakfast: 500, lunch: 0, dinner: 0,
    breakfastCount: 2, lunchCount: 0, dinnerCount: 0,
    lunchboxCount: 0, lunchboxPrice: 0,
    foodCost: 1000, accommodationCost: 10000,
  },
  {
    personId: "p2", fullName: "Петрова А.А.", tariffName: "Стандарт",
    pricePerDay: 4000, placementKind: 1, roomNumber: "102", daysCount: 1.5,
    breakfast: 0, lunch: 700, dinner: 0,
    breakfastCount: 0, lunchCount: 1, dinnerCount: 0,
    lunchboxCount: 2, lunchboxPrice: 250.5,
    foodCost: 1201, accommodationCost: 6000,
  },
];

function makeBookRequest() {
  return {
    airline: { id: "a1", name: "Азимут", nameFull: "АО «Авиакомпания Азимут»" },
    flightNumber: "A4-123",
    livingService: {
      plan: { enabled: true },
      hotels: [{
        hotelId: "h1",
        name: "Гостиница Тест",
        address: "Город, ул. Тестовая 1",
        people: GUEST_ROWS.map((r) => ({
          personId: r.personId,
          fullName: r.fullName,
          personType: "PASSENGER",
          personCategory: "ADULT",
          arrival: "2026-08-01T10:00:00.000Z",
          departure: "2026-08-03T10:00:00.000Z",
        })),
      }],
    },
    hotelReports: [{ hotelIndex: 0, reportRows: GUEST_ROWS }],
    transferService: {
      plan: { enabled: true, plannedAt: "2026-08-01T08:00:00.000Z" },
      drivers: [{ fullName: "Петров П.П.", vehicleType: "Автобус", transportedCount: 2, reportCost: 3000 }],
    },
    departureTransferService: {
      plan: { enabled: true, plannedAt: "2026-08-03T08:00:00.000Z" },
      drivers: [{ fullName: "Сидоров С.С.", vehicleType: "Микроавтобус", reportCost: 2500 }],
    },
    baggageDeliveryService: {
      plan: { enabled: true },
      drivers: [
        {
          fullName: "Водителев В.В.", reportCost: 3500, driverCost: 2000,
          deliveryCompletedAt: "2026-08-01T12:00:00.000Z",
          people: [
            { personId: "p1", fullName: "Иванов И.И.", baggageTags: ["AB1"], reportCost: 2000 },
            { personId: "p2", fullName: "Петрова А.А.", baggageTags: [], reportCost: 1500 },
          ],
        },
        { fullName: "Пустов П.П.", reportCost: null, peopleCount: 0, people: [] },
      ],
    },
    waterService: {
      plan: { enabled: true },
      supplier: "ООО «Вода»", quantity: 40, unitPrice: 60.5, deliveryCost: 500, people: [],
    },
    mealService: {
      plan: { enabled: true },
      supplier: "ООО «Питание»", quantity: 30, unitPrice: 350, deliveryCost: null, people: [],
    },
  };
}

const buildBook = () => {
  const request = makeBookRequest();
  const wb = new ExcelJS.Workbook();
  const ok = addRequestReportSheets(wb, request, {
    notifyError: (msg) => { throw new Error(msg); },
    internal: true,
  });
  assert.equal(ok, true);
  return { wb, request };
};

const formulaCells = (wb) => {
  const found = [];
  wb.eachSheet((ws) => {
    ws.eachRow({ includeEmpty: false }, (row) => {
      row.eachCell({ includeEmpty: false }, (cell) => {
        if (isFormula(cell.value)) found.push({ sheet: ws.name, cell });
      });
    });
  });
  return found;
};

// Строка по подписи в колонке A — раскладка листов не хардкодится.
const rowOf = (ws, label) => {
  let found = null;
  ws.eachRow({ includeEmpty: false }, (row, rowNumber) => {
    if (found == null && row.getCell(1).value === label) found = rowNumber;
  });
  assert.ok(found != null, `на листе «${ws.name}» нет строки «${label}»`);
  return found;
};

const livingTotal = GUEST_ROWS.reduce((s, r) => s + r.foodCost + r.accommodationCost, 0);
const transferTotal = 3000 + 2500;

test("книга заявки: у каждой формулы появился числовой результат", () => {
  const { wb } = buildBook();
  const cells = formulaCells(wb);
  assert.ok(cells.length >= 20, `формул всего ${cells.length}`);
  fillFormulaResults(wb);
  cells.forEach(({ sheet, cell }) => {
    // cell.result, а не cell.value.result: геттер value exceljs теряет результат 0.
    assert.equal(typeof cell.result, "number", `${sheet}!${cell.address} = ${cell.formula}`);
  });
});

test("книга заявки: итоги совпадают с суммами фикстуры", () => {
  const { wb, request } = buildBook();
  fillFormulaResults(wb);

  const summary = wb.getWorksheet("Сводка");
  const grand = summary.getCell(`Y${rowOf(summary, "Всего по заявке:")}`);
  const supply = supplyTotal(request.waterService) + supplyTotal(request.mealService);
  assert.equal(grand.result, livingTotal + transferTotal + supply);

  const hotel = wb.getWorksheet("Гостиница Тест");
  const hotelTotalRow = rowOf(hotel, "Итого:");
  assert.equal(hotel.getCell(`Y${hotelTotalRow}`).result, livingTotal + transferTotal);
  // SUMPRODUCT: завтраки 2 × 500, ланчбоксы 2 × 250.5.
  assert.equal(hotel.getCell(`O${hotelTotalRow}`).result, 1000);
  assert.equal(hotel.getCell(`U${hotelTotalRow}`).result, 501);

  const baggage = wb.getWorksheet("Доставка багажа");
  const baggageTotalRow = rowOf(baggage, "Итого:");
  assert.equal(baggage.getCell(`G${baggageTotalRow}`).result, 3500);
  assert.equal(baggage.getCell(`H${baggageTotalRow}`).result, 2000);
});

test("книга заявки: результат формулы переживает запись в xlsx и чтение", async () => {
  const { wb, request } = buildBook();
  fillFormulaResults(wb);
  const summary = wb.getWorksheet("Сводка");
  const address = `Y${rowOf(summary, "Всего по заявке:")}`;
  const formula = summary.getCell(address).value.formula;

  const buffer = await wb.xlsx.writeBuffer();
  const back = new ExcelJS.Workbook();
  await back.xlsx.load(buffer);
  const cell = back.getWorksheet("Сводка").getCell(address);
  const supply = supplyTotal(request.waterService) + supplyTotal(request.mealService);
  assert.equal(cell.value.formula, formula);
  assert.equal(cell.value.result, livingTotal + transferTotal + supply);
});
