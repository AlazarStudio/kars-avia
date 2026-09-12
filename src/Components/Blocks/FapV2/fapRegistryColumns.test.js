import { test } from "node:test";
import assert from "node:assert/strict";
import { registryColumns, registryMoney } from "./fapRegistryColumns.js";

const keys = (kind, opts) => registryColumns(kind, opts).map((c) => c.key);
const col = (kind, key) =>
  registryColumns(kind, { internal: true }).find((c) => c.key === key);
// Разделитель разрядов ru-RU зависит от сборки ICU — ожидание считаем так же.
const rub = (n) => `${n.toLocaleString("ru-RU")} ₽`;

test("без internal внутренних колонок нет", () => {
  assert.deepEqual(keys("BAGGAGE"), [
    "fullName",
    "flight",
    "baggageTags",
    "addressTo",
    "deliveredAt",
    "price",
  ]);
  assert.deepEqual(keys("CATERING", { internal: false }), [
    "suppliedAt",
    "flightNumber",
    "portions",
    "drinks",
    "mealAmount",
    "waterAmount",
    "deliveryCost",
    "total",
    "supplier",
  ]);
});

test("с internal внутренние колонки есть", () => {
  assert.deepEqual(keys("BAGGAGE", { internal: true }).slice(-4), [
    "driverName",
    "driverCost",
    "distanceKm",
    "diff",
  ]);
  assert.deepEqual(keys("CATERING", { internal: true }).slice(-2), [
    "supplierCost",
    "diff",
  ]);
});

test("«Разница»: багаж — price − driverCost, питание — total − supplierCost", () => {
  assert.equal(col("BAGGAGE", "diff").get({ price: 8360, driverCost: 5300 }), rub(3060));
  assert.equal(col("BAGGAGE", "diff").get({ price: 8360 }), rub(8360));
  assert.equal(col("CATERING", "diff").get({ total: 6440, supplierCost: 4000 }), rub(2440));
  assert.equal(col("CATERING", "diff").get({ total: 6440 }), rub(6440));
});

test("пустая цена печатается прочерком", () => {
  assert.equal(col("BAGGAGE", "price").get({ price: null }), "—");
  assert.equal(col("BAGGAGE", "driverCost").get({}), "—");
  assert.equal(registryMoney(null), "—");
});
