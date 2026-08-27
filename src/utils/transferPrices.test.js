import test from "node:test";
import assert from "node:assert/strict";

import { matchesTransferPriceSearch } from "./transferPrices.js";

const airports = [
  { id: "a1", name: "Шереметьево" },
  { id: "a2", name: "Пулково" },
];
const cities = [
  { id: "c1", city: "Москва" },
  { id: "c2", city: "Санкт-Петербург" },
];
const refs = { airports, cities };

const item = {
  name: "№ 42 от 01.02.2026",
  prices: {
    threeSeater: { intercity: 3100, city: 1100 },
    fiveSeater: { intercity: null, city: null },
    sevenSeater: { intercity: null, city: null },
    twentySeater: { intercity: 20500, city: null },
    fiftySeater: { intercity: null, city: 50900 },
  },
  airportIds: ["a1"],
  cityIds: ["c1"],
};

test("пустой запрос пропускает всё", () => {
  assert.equal(matchesTransferPriceSearch(item, ""), true);
  assert.equal(matchesTransferPriceSearch(item, "   "), true);
  assert.equal(matchesTransferPriceSearch(item, undefined), true);
});

test("ищет по названию договора", () => {
  assert.equal(matchesTransferPriceSearch(item, "№ 42", refs), true);
  assert.equal(matchesTransferPriceSearch(item, "01.02.2026", refs), true);
  assert.equal(matchesTransferPriceSearch(item, "№ 43", refs), false);
});

// Автобусные вместимости раньше выпадали из склейки цен — прайс «только автобусы»
// по сумме не находился.
test("ищет по ценам автобусов", () => {
  assert.equal(matchesTransferPriceSearch(item, "20500", refs), true);
  assert.equal(matchesTransferPriceSearch(item, "50900", refs), true);
  assert.equal(matchesTransferPriceSearch(item, "3100", refs), true);
  assert.equal(matchesTransferPriceSearch(item, "1100", refs), true);
});

test("ищет по названию аэропорта и города", () => {
  assert.equal(matchesTransferPriceSearch(item, "шереметьево", refs), true);
  assert.equal(matchesTransferPriceSearch(item, "МОСКВА", refs), true);
  assert.equal(matchesTransferPriceSearch(item, "пулково", refs), false);
  assert.equal(matchesTransferPriceSearch(item, "санкт", refs), false);
});

test("неизвестный id аэропорта/города остаётся сам собой", () => {
  const orphan = { ...item, airportIds: ["a9"], cityIds: ["c9"] };
  assert.equal(matchesTransferPriceSearch(orphan, "a9", refs), true);
  assert.equal(matchesTransferPriceSearch(orphan, "c9", refs), true);
});

test("нет совпадения — false", () => {
  assert.equal(matchesTransferPriceSearch(item, "казань", refs), false);
  assert.equal(matchesTransferPriceSearch(item, "99999", refs), false);
});

test("запись без цен и без справочников не роняет поиск", () => {
  const empty = { name: "Договор без цен", prices: {}, airportIds: [], cityIds: [] };
  assert.equal(matchesTransferPriceSearch(empty, "без цен"), true);
  assert.equal(matchesTransferPriceSearch(empty, "3100"), false);
  assert.equal(matchesTransferPriceSearch({}, "что-нибудь"), false);
});
