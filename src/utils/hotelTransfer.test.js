import test from "node:test";
import assert from "node:assert/strict";

import { hotelProvidesTransfer } from "./hotelTransfer.js";

test("нет данных — трансфера нет", () => {
  assert.equal(hotelProvidesTransfer(null), false);
  assert.equal(hotelProvidesTransfer(undefined), false);
  assert.equal(hotelProvidesTransfer({}), false);
});

test("аргумент-строка не роняет функцию", () => {
  assert.equal(hotelProvidesTransfer("нет"), false);
  assert.equal(hotelProvidesTransfer(""), false);
});

test("нули и null в ценах — трансфера нет", () => {
  assert.equal(hotelProvidesTransfer({ arrival: 0, departure: 0 }), false);
  assert.equal(hotelProvidesTransfer({ arrival: null, departure: null }), false);
});

test("хватает одной выставленной цены", () => {
  assert.equal(hotelProvidesTransfer({ arrival: 1500, departure: 0 }), true);
  assert.equal(hotelProvidesTransfer({ arrival: 0, departure: 1500 }), true);
});

// Бэк отдаёт Float, но исторически цены приходили строками — числовая строка
// должна считаться выставленной ценой, нечисловая — нет.
test("числовые строки считаются ценой, текст — нет", () => {
  assert.equal(hotelProvidesTransfer({ arrival: "1500", departure: "0" }), true);
  assert.equal(hotelProvidesTransfer({ arrival: "", departure: "нет" }), false);
});
