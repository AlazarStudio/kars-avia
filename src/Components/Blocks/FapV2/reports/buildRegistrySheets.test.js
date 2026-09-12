import { test } from "node:test";
import assert from "node:assert/strict";
import ExcelJS from "exceljs";
import { buildRegistryWorkbook, registryFilename } from "./buildRegistrySheets.js";

const header = {
  appendixLabel: "Приложение №3",
  contractNumber: "1147/25",
  contractDate: "2025-09-04",
  executorName: "ООО «Тест Туристик»",
  executorTitle: "Генеральный директор",
  executorSignatory: "Иванова И.И.",
  customerName: "АО «Авиакомпания Тест»",
  customerTitle: "Заместитель генерального директора",
  customerSignatory: "Петров П.П.",
};

const baggage = {
  id: "reg-1",
  kind: "BAGGAGE",
  number: "10",
  periodStart: "2026-05-31T21:00:00.000Z",
  periodEnd: "2026-06-30T20:59:59.999Z",
  airline: { name: "Тест", nameFull: "АО «Авиакомпания Тест»" },
  airport: { city: "Тестовск" },
  header,
  rows: [
    { fullName: "SIDOROVA/MARIA", flightNumber: "6601", flightDate: "2026-06-22T00:00:00.000Z", baggageTags: ["FV1", "FV2"], addressTo: "г. Тестовск, ул. Ленина 1", deliveredAt: "2026-06-24T06:00:00.000Z", price: 8360, driverName: "Водитель", driverCost: 5300, distanceKm: 126 },
    { fullName: "1PETROV/IVAN", flightNumber: "6601", flightDate: "2026-06-22T00:00:00.000Z", baggageTags: [], addressTo: "г. Тестовск, ул. Мира 2", deliveredAt: "2026-06-24T06:00:00.000Z", price: 560, driverName: "Водитель", driverCost: 5300, distanceKm: 126 },
  ],
  totals: { rowsCount: 2, airlineTotal: 8920, internalCost: 5300 },
};

const catering = {
  ...baggage,
  id: "reg-2",
  kind: "CATERING",
  number: "326",
  rows: [
    { flightNumber: "A4-5135", suppliedAt: "2026-06-22T08:01:00.000Z", serviceKind: "WATER", quantity: 94, unitPrice: 60, amount: 5640, deliveryCost: 800, total: 6440, supplier: "Моя столовая", supplierCost: 4000 },
    { flightNumber: "A4-7036", suppliedAt: "2026-06-28T18:44:00.000Z", serviceKind: "MEAL", quantity: 99, unitPrice: 380, amount: 37620, deliveryCost: 800, total: 38420, supplier: "Вкусно и точка", supplierCost: 30000 },
  ],
  totals: { rowsCount: 2, airlineTotal: 44860, internalCost: 34000 },
};

const cellText = (ws, ref) => {
  const v = ws.getCell(ref).value;
  return v && typeof v === "object" && "formula" in v ? v.formula : v;
};

test("багаж, лист для АК: шапка, колонки, строки, итог SUM, подписи после итога без рамок", () => {
  const wb = buildRegistryWorkbook(baggage, { internal: false });
  assert.deepEqual(wb.worksheets.map((w) => w.name), ["Реестр"]);
  const ws = wb.getWorksheet("Реестр");
  assert.equal(cellText(ws, "A1"), "АО «Авиакомпания Тест»");
  assert.equal(cellText(ws, "G1"), "Приложение №3");
  assert.equal(cellText(ws, "G2"), "К договору № 1147/25 от 04.09.2025");
  assert.match(String(cellText(ws, "A3")), /^Реестр №10 на доставку несвоевременно прибывшего багажа за период с 01\.06\.2026 по 30\.06\.2026 в г\. Тестовск$/);
  assert.deepEqual(
    [1, 2, 3, 4, 5, 6, 7].map((c) => ws.getCell(4, c).value),
    ["п/п", "ФИО пассажира", "Номер и дата рейса", "№ б/бирки", "Адрес доставки", "Дата и время доставки", "Стоимость оказанной услуги без НДС (руб)"]
  );
  assert.equal(ws.getCell("B5").value, "SIDOROVA/MARIA");
  assert.equal(ws.getCell("C5").value, "6601 22.06.2026");
  assert.equal(ws.getCell("D5").value, "FV1, FV2");
  assert.equal(ws.getCell("G5").value, 8360);
  assert.equal(ws.getCell("G6").value, 560);
  assert.equal(ws.getCell("A7").value, "Итого:");
  assert.equal(cellText(ws, "G7"), "SUM(G5:G6)");
  assert.equal(ws.getCell("G5").numFmt, "#,##0.00");
  assert.equal(ws.getCell("A9").value, "ООО «Тест Туристик»");
  assert.equal(ws.getCell("A10").value, "Генеральный директор ______________ Иванова И.И.");
  assert.equal(ws.getCell("E9").value, "АО «Авиакомпания Тест»");
  assert.equal(ws.getCell("E10").value, "Заместитель генерального директора ______________ Петров П.П.");
  assert.equal(ws.getCell("A9").border?.top, undefined);
  assert.ok(ws.getCell("A5").border?.top, "у таблицы рамки есть");
  assert.equal(ws.getCell("G7").font?.bold, true);
});

test("багаж, внутренний лист только диспетчеру: водитель, водителю, км, разница", () => {
  const wb = buildRegistryWorkbook(baggage, { internal: true });
  assert.deepEqual(wb.worksheets.map((w) => w.name), ["Реестр", "Внутренний"]);
  const ws = wb.getWorksheet("Внутренний");
  assert.deepEqual(
    [8, 9, 10, 11].map((c) => ws.getCell(4, c).value),
    ["Водитель", "Стоимость водителю", "Км", "Разница"]
  );
  assert.equal(ws.getCell("H5").value, "Водитель");
  assert.equal(ws.getCell("I5").value, 5300);
  assert.equal(ws.getCell("J5").value, 126);
  assert.equal(cellText(ws, "K5"), "G5-I5");
  assert.equal(cellText(ws, "I7"), "SUM(I5:I6)");
});

test("багаж: маскированный снимок (АК) не даёт внутреннего листа даже с internal: true", () => {
  const masked = { ...baggage, rows: baggage.rows.map((r) => ({ ...r, driverName: null, driverCost: null, distanceKm: null })), totals: { ...baggage.totals, internalCost: null } };
  const wb = buildRegistryWorkbook(masked, { internal: true });
  assert.deepEqual(wb.worksheets.map((w) => w.name), ["Реестр"]);
});

test("вода и питание: строка воды в колонках напитков, питания — в колонках порций, поставщик за рамкой", () => {
  const wb = buildRegistryWorkbook(catering, { internal: false });
  const ws = wb.getWorksheet("Реестр");
  assert.match(String(cellText(ws, "A3")), /^Реестр №326 оказанных услуг по предоставлению питания пассажирам авиакомпании "АО «Авиакомпания Тест»" в г\. Тестовск за период с 01\.06\.2026 по 30\.06\.2026$/);
  assert.deepEqual(
    [1, 2, 3, 4, 5, 6, 7, 8, 9].map((c) => ws.getCell(4, c).value),
    ["п/п", "Дата/время", "Номер рейса", "кол-во питание", "кол-во напитки", "Стоимость питания", "Стоимость напитков", "Доставка", "Итоговая стоимость"]
  );
  assert.equal(ws.getCell("D5").value, 0);
  assert.equal(ws.getCell("E5").value, 94);
  assert.equal(ws.getCell("F5").value, 0);
  assert.equal(ws.getCell("G5").value, 5640);
  assert.equal(ws.getCell("D6").value, 99);
  assert.equal(ws.getCell("F6").value, 37620);
  assert.equal(ws.getCell("I6").value, 38420);
  assert.equal(ws.getCell("J5").value, "Моя столовая", "поставщик справа за рамкой");
  assert.equal(ws.getCell("J5").border?.top, undefined);
  assert.equal(cellText(ws, "F7"), "SUM(F5:F6)");
  assert.equal(cellText(ws, "I7"), "SUM(I5:I6)");
  assert.equal(ws.getCell("A9").value, "ООО «Тест Туристик»");
});

test("вода и питание, внутренний лист: поставщик колонкой, поставщику, разница", () => {
  const ws = buildRegistryWorkbook(catering, { internal: true }).getWorksheet("Внутренний");
  assert.deepEqual([10, 11, 12].map((c) => ws.getCell(4, c).value), ["Поставщик", "Стоимость поставщику", "Разница"]);
  assert.equal(ws.getCell("K5").value, 4000);
  assert.equal(cellText(ws, "L5"), "I5-K5");
});

test("подписант заказчика пуст — блока заказчика нет", () => {
  const ws = buildRegistryWorkbook({ ...baggage, header: { ...header, customerSignatory: null } }, { internal: false }).getWorksheet("Реестр");
  assert.equal(ws.getCell("E9").value, null);
  assert.equal(ws.getCell("A9").value, "ООО «Тест Туристик»");
});

test("должность заказчика пуста при заполненном подписанте — блока заказчика нет", () => {
  const ws = buildRegistryWorkbook({ ...baggage, header: { ...header, customerTitle: null } }, { internal: false }).getWorksheet("Реестр");
  assert.equal(ws.getCell("E9").value, null);
  assert.equal(ws.getCell("A9").value, "ООО «Тест Туристик»");
});

test("имя файла", () => {
  assert.equal(registryFilename(baggage), "Реестр №10 багаж Тест Тестовск 01.06–30.06.2026.xlsx");
  assert.equal(registryFilename(catering), "Реестр №326 вода и питание Тест Тестовск 01.06–30.06.2026.xlsx");
});

test("roundtrip: книга читается обратно", async () => {
  const wb = buildRegistryWorkbook(baggage, { internal: true });
  const buffer = await wb.xlsx.writeBuffer();
  const back = new ExcelJS.Workbook();
  await back.xlsx.load(buffer);
  assert.equal(back.getWorksheet("Реестр").getCell("B5").value, "SIDOROVA/MARIA");
  assert.equal(back.getWorksheet("Внутренний").getCell("I5").value, 5300);
});
