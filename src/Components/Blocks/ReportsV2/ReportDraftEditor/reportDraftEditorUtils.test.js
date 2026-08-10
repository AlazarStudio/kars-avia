import { test } from "node:test";
import assert from "node:assert/strict";
import {
  formatMoney,
  trimSeconds,
  splitDateTime,
  getArrivalHighlight,
  getDepartureHighlight,
  livingCostTooltip,
  pluralizeRows,
  rowMatchesSearch,
} from "./reportDraftEditorUtils.js";

test("formatMoney rounds and groups thousands the way ru-RU toLocaleString does", () => {
  // toLocaleString("ru-RU") groups with a non-breaking space (U+00A0), not a
  // regular space — comparing against a literal risks a silent whitespace
  // mismatch, so the expectation is derived the same way the source does.
  assert.equal(formatMoney(1234567), (1234567).toLocaleString("ru-RU"));
  assert.equal(formatMoney(1234.6), (1235).toLocaleString("ru-RU"));
  assert.equal(formatMoney(null), "0");
  assert.equal(formatMoney("abc"), "0");
});

test("trimSeconds strips :SS and tolerates missing/short values", () => {
  assert.equal(trimSeconds("07.07.2026 22:00:00"), "07.07.2026 22:00");
  assert.equal(trimSeconds("07.07.2026 22:00"), "07.07.2026 22:00");
  assert.equal(trimSeconds(""), "");
  assert.equal(trimSeconds(null), null);
});

test("splitDateTime separates date and time", () => {
  assert.deepEqual(splitDateTime("07.07.2026 22:00:00"), { date: "07.07.2026", time: "22:00" });
  assert.deepEqual(splitDateTime(""), { date: "", time: "" });
  assert.deepEqual(splitDateTime(null), { date: "", time: "" });
});

test("getArrivalHighlight flags an arrival before the full-day threshold", () => {
  assert.equal(getArrivalHighlight("07.07.2026 05:30:00").highlighted, true);
  assert.equal(getArrivalHighlight("07.07.2026 06:00:00").highlighted, false);
  assert.equal(getArrivalHighlight("07.07.2026 14:00:00").highlighted, false);
  assert.equal(getArrivalHighlight("").highlighted, false);
  assert.equal(getArrivalHighlight(null).title, undefined);
});

test("getDepartureHighlight flags a departure after the half-day threshold", () => {
  assert.equal(getDepartureHighlight("07.07.2026 12:30:00").highlighted, true);
  assert.equal(getDepartureHighlight("07.07.2026 12:00:00").highlighted, false);
  assert.equal(getDepartureHighlight("07.07.2026 09:00:00").highlighted, false);
  assert.equal(getDepartureHighlight("").highlighted, false);
});

test("livingCostTooltip explains an edited row unconditionally", () => {
  const row = { totalDays: 2, pricePerDay: 1000, totalLivingCost: 2000 };
  assert.equal(livingCostTooltip(row, true), "Сутки × цена (строка правлена вручную)");
});

test("livingCostTooltip stays quiet when the untouched sum matches days × price", () => {
  const row = { totalDays: 2, pricePerDay: 1000, totalLivingCost: 2000 };
  assert.equal(livingCostTooltip(row, false), undefined);
});

test("livingCostTooltip explains a shared-room split on an untouched row", () => {
  const row = { totalDays: 2, pricePerDay: 1000, totalLivingCost: 1500 };
  assert.equal(livingCostTooltip(row, false), "Сервер разделил стоимость номера между соседями");
});

test("pluralizeRows follows the standard Russian plural rule", () => {
  assert.equal(pluralizeRows(1), "строка");
  assert.equal(pluralizeRows(21), "строка");
  assert.equal(pluralizeRows(2), "строки");
  assert.equal(pluralizeRows(3), "строки");
  assert.equal(pluralizeRows(4), "строки");
  assert.equal(pluralizeRows(24), "строки");
  assert.equal(pluralizeRows(5), "строк");
  assert.equal(pluralizeRows(11), "строк");
  assert.equal(pluralizeRows(12), "строк");
  assert.equal(pluralizeRows(14), "строк");
  assert.equal(pluralizeRows(0), "строк");
});

test("rowMatchesSearch matches name, position, room and category case-insensitively", () => {
  const row = {
    personName: "Иванов Иван",
    personPosition: "КВС",
    roomName: "101",
    category: "Двухместный",
  };
  assert.equal(rowMatchesSearch(row, ""), true);
  assert.equal(rowMatchesSearch(row, "иванов"), true);
  assert.equal(rowMatchesSearch(row, "КВС"), true);
  assert.equal(rowMatchesSearch(row, "101"), true);
  assert.equal(rowMatchesSearch(row, "двухместный"), true);
  assert.equal(rowMatchesSearch(row, "нет такого"), false);
});
