import test from "node:test";
import assert from "node:assert/strict";
import { preserveMoneyFields } from "./fapReportMoney.js";

// Строка гостя из билдера: факт свежий, деньги посчитаны по ценам смотрящего
// (у гостиницы — по её прайсу, поэтому в базу они уходить не должны).
const builtPerson = (over = {}) => ({
  fullName: "Иванов И.И.",
  personId: "p1",
  roomNumber: "101",
  roomCategory: "Стандарт",
  roomKind: "",
  daysCount: 3,
  breakfast: 300,
  lunch: 0,
  dinner: 0,
  breakfastCount: 3,
  lunchCount: 0,
  dinnerCount: 0,
  breakfastLunchbox: false,
  lunchLunchbox: false,
  dinnerLunchbox: false,
  lunchboxPrice: 0,
  lunchboxCount: 0,
  foodCost: 900,
  accommodationCost: 4500,
  tariffName: "Стандарт",
  pricePerDay: 1500,
  placementKind: 2,
  placementKindOverride: 2,
  accommodationDiscount: null,
  ...over,
});

// Та же строка, как её сохранил диспетчер: деньги по ценам для авиакомпании.
const savedPerson = (over = {}) => ({
  ...builtPerson(),
  daysCount: 2,
  roomNumber: "100",
  breakfast: 500,
  foodCost: 1000,
  accommodationCost: 5000,
  pricePerDay: 2500,
  placementKind: 1,
  tariffName: "Договор АК",
  accommodationDiscount: 50,
  ...over,
});

const shadowRow = (over = {}) => ({
  fullName: "",
  personId: "",
  roomNumber: "",
  roomCategory: "Договор АК",
  roomKind: "",
  daysCount: 0,
  breakfast: 500,
  lunch: 0,
  dinner: 0,
  lunchboxPrice: 250,
  foodCost: 500,
  accommodationCost: 0,
  tariffName: "Договор АК",
  pricePerDay: 2500,
  placementKind: 1,
  accommodationDiscount: null,
  ...over,
});

test("деньги берутся из сохранённой строки, факт — из построенной", () => {
  const [row] = preserveMoneyFields([builtPerson()], [savedPerson()]);
  // Деньги — как у диспетчера
  assert.equal(row.pricePerDay, 2500);
  assert.equal(row.accommodationCost, 5000);
  assert.equal(row.breakfast, 500);
  assert.equal(row.tariffName, "Договор АК");
  assert.equal(row.placementKind, 1);
  assert.equal(row.accommodationDiscount, 50);
  // Факт — как правила гостиница
  assert.equal(row.roomNumber, "101");
  assert.equal(row.breakfastCount, 3);
  assert.equal(row.placementKindOverride, 2);
  assert.equal(row.fullName, "Иванов И.И.");
  // Питание — ставки диспетчера × новые счётчики: 500 × 3
  assert.equal(row.foodCost, 1500);
});

test("сутки заморожены вместе с ценой — книга не выведет из них скидку", () => {
  const [row] = preserveMoneyFields(
    [builtPerson({ daysCount: 5 })],
    [savedPerson()]
  );
  assert.equal(row.daysCount, 2);
  // База скидки (цена × сутки) сходится со стоимостью — процент не фабрикуется.
  assert.equal(row.pricePerDay * row.daysCount, row.accommodationCost);
});

test("гость без personId матчится по ФИО", () => {
  const [row] = preserveMoneyFields(
    [builtPerson({ personId: "", roomNumber: "202" })],
    [savedPerson({ personId: "" })]
  );
  assert.equal(row.pricePerDay, 2500);
  assert.equal(row.roomNumber, "202");
});

test("новый гость сохраняет деньги и сутки билдера — их заполнит диспетчер", () => {
  const fresh = builtPerson({
    personId: "p2",
    fullName: "Петров П.П.",
    accommodationCost: 0,
    pricePerDay: 0,
    foodCost: 0,
  });
  const rows = preserveMoneyFields([builtPerson(), fresh], [savedPerson()]);
  assert.equal(rows.length, 2);
  assert.equal(rows[0].accommodationCost, 5000);
  assert.equal(rows[1].fullName, "Петров П.П.");
  assert.equal(rows[1].accommodationCost, 0);
  assert.equal(rows[1].pricePerDay, 0);
  // Морозить нечего: сутки нового гостя остаются построенными. Про экран это
  // ничего не говорит — поле «Сут.» под гейтом read-only у всех строк.
  assert.equal(rows[1].daysCount, 3);
});

test("питание считается замороженными ставками по новым счётчикам", () => {
  const built = builtPerson({
    breakfastCount: 4,
    lunchCount: 1,
    dinnerCount: 0,
    lunchboxCount: 2,
    foodCost: 999, // билдер посчитал по ценам гостиницы — не должно доехать
  });
  const saved = savedPerson({ breakfast: 500, lunch: 400, dinner: 0, lunchboxPrice: 250 });
  const [row] = preserveMoneyFields([built], [saved]);
  // 500×4 + 400×1 + 0 + 2×250
  assert.equal(row.foodCost, 2900);
});

test("легаси-тумблеры ланчбокса считаются так же, как на экране", () => {
  const built = builtPerson({
    breakfastCount: 1,
    lunchCount: 0,
    dinnerCount: 0,
    lunchboxCount: undefined,
    breakfastLunchbox: true,
    dinnerLunchbox: true,
  });
  const saved = savedPerson({ breakfast: 500, lunch: 0, dinner: 0, lunchboxPrice: 100 });
  const [row] = preserveMoneyFields([built], [saved]);
  // 500×1 + два тумблера × 100
  assert.equal(row.foodCost, 700);
});

test("теневые тарифные строки берутся из сохранённых, построенные отбрасываются", () => {
  const rows = preserveMoneyFields(
    [builtPerson(), shadowRow({ pricePerDay: 1500, lunchboxPrice: 0 })],
    [savedPerson(), shadowRow()]
  );
  assert.equal(rows.length, 2);
  const shadow = rows.find((r) => !r.fullName);
  assert.equal(shadow.pricePerDay, 2500);
  assert.equal(shadow.lunchboxPrice, 250);
});

test("гость без ФИО не принимается за теневую строку", () => {
  const nameless = builtPerson({ fullName: "", roomNumber: "303" });
  const rows = preserveMoneyFields([nameless], [savedPerson({ fullName: "" })]);
  assert.equal(rows.length, 1);
  assert.equal(rows[0].roomNumber, "303");
  assert.equal(rows[0].accommodationCost, 5000);
});

test("__typename из кэша Apollo не уезжает в мутацию", () => {
  const rows = preserveMoneyFields(
    [builtPerson()],
    [
      { ...savedPerson(), __typename: "PassengerRequestReportRow" },
      { ...shadowRow(), __typename: "PassengerRequestReportRow" },
    ]
  );
  rows.forEach((r) => assert.ok(!("__typename" in r)));
});

test("сохранённого отчёта нет — строки уходят как построены", () => {
  const built = [builtPerson(), shadowRow()];
  assert.deepEqual(preserveMoneyFields(built, []), built);
  assert.deepEqual(preserveMoneyFields(built, null), built);
});

test("выселенный гость в строки не возвращается", () => {
  const rows = preserveMoneyFields(
    [],
    [savedPerson(), savedPerson({ personId: "p2", fullName: "Петров П.П." })]
  );
  assert.deepEqual(rows, []);
});

test("однофамильцы без personId разбираются по порядку, а не задваиваются", () => {
  const built = [
    builtPerson({ personId: "", roomNumber: "201" }),
    builtPerson({ personId: "", roomNumber: "202" }),
  ];
  const saved = [
    savedPerson({ personId: "", accommodationCost: 5000 }),
    savedPerson({ personId: "", accommodationCost: 7000 }),
  ];
  const rows = preserveMoneyFields(built, saved);
  assert.equal(rows[0].accommodationCost, 5000);
  assert.equal(rows[1].accommodationCost, 7000);
  assert.equal(rows[0].roomNumber, "201");
  assert.equal(rows[1].roomNumber, "202");
});
