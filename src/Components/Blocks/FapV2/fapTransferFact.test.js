import { test } from "node:test";
import assert from "node:assert/strict";
import { driverFactCount, transferFactCount } from "./fapTransferFact.js";

test("факт = списку без числа", () => {
  assert.equal(driverFactCount({ people: [{}, {}] }), 2);
});

test("факт = числу при пустом списке", () => {
  assert.equal(driverFactCount({ people: [], transportedCount: 18 }), 18);
});

test("факт = max — без двойного счёта", () => {
  assert.equal(driverFactCount({ people: [{}, {}, {}], transportedCount: 2 }), 3);
  assert.equal(driverFactCount({ people: [{}], transportedCount: 20 }), 20);
});

test("пустые значения", () => {
  assert.equal(driverFactCount({}), 0);
  assert.equal(driverFactCount({ transportedCount: null }), 0);
  assert.equal(transferFactCount(null), 0);
  assert.equal(driverFactCount({ transportedCount: -3 }), 0);
  assert.equal(driverFactCount({ people: [{}], transportedCount: 2.5 }), 1);
});

test("сумма по поездкам", () => {
  assert.equal(
    transferFactCount([{ people: [{}], transportedCount: 5 }, { people: [{}, {}] }]),
    7
  );
});
