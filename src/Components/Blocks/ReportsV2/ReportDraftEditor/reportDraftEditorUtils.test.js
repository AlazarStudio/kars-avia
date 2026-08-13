import { test } from "node:test";
import assert from "node:assert/strict";
import {
  formatMoney,
  formatDays,
  trimSeconds,
  splitDateTime,
  getArrivalHighlight,
  getDepartureHighlight,
  livingCostTooltip,
  pluralizeRows,
  pluralizeDays,
  rowMatchesSearch,
  describeShareSegments,
  listCohabitants,
} from "./reportDraftEditorUtils.js";

// Формат границ — как на стенде: "DD.MM.YYYY HH:MM:SS", уже отформатирован бэком.
const segments = [
  {
    start: "01.08.2026 00:10:00",
    end: "07.08.2026 12:00:00",
    alone: false,
    cohabitants: [{ requestId: "r1", personName: "Котов Д.С." }],
  },
  {
    start: "09.08.2026 14:00:00",
    end: "10.08.2026 23:50:00",
    alone: false,
    cohabitants: [{ requestId: "r2", personName: "Еремин А.П." }],
  },
];

test("describeShareSegments trims seconds and pulls out cohabitant names", () => {
  assert.deepEqual(describeShareSegments(segments), [
    {
      period: "01.08.2026 00:10 — 07.08.2026 12:00",
      names: ["Котов Д.С."],
      alone: false,
    },
    {
      period: "09.08.2026 14:00 — 10.08.2026 23:50",
      names: ["Еремин А.П."],
      alone: false,
    },
  ]);
});

test("describeShareSegments marks a solo stay as alone", () => {
  const solo = [
    { start: "03.08.2026 19:00:00", end: "10.08.2026 23:50:00", alone: true, cohabitants: [] },
  ];
  const [only] = describeShareSegments(solo);
  assert.equal(only.alone, true);
  assert.deepEqual(only.names, []);
});

test("describeShareSegments survives junk", () => {
  assert.deepEqual(describeShareSegments(null), []);
  assert.deepEqual(describeShareSegments(undefined), []);
  const [broken] = describeShareSegments([{}]);
  assert.equal(broken.period, "");
  assert.equal(broken.alone, true); // соседей нет — значит жил один
});

test("listCohabitants collects names once, in order", () => {
  assert.deepEqual(listCohabitants(segments), ["Котов Д.С.", "Еремин А.П."]);

  const repeated = [
    { start: "a", end: "b", cohabitants: [{ personName: "Котов Д.С." }] },
    { start: "c", end: "d", cohabitants: [{ personName: "Котов Д.С." }] },
  ];
  assert.deepEqual(listCohabitants(repeated), ["Котов Д.С."]);
  assert.deepEqual(listCohabitants(null), []);
});

test("formatMoney rounds and groups thousands the way ru-RU toLocaleString does", () => {
  // toLocaleString("ru-RU") groups with a non-breaking space (U+00A0), not a
  // regular space — comparing against a literal risks a silent whitespace
  // mismatch, so the expectation is derived the same way the source does.
  assert.equal(formatMoney(1234567), (1234567).toLocaleString("ru-RU"));
  assert.equal(formatMoney(1234.6), (1235).toLocaleString("ru-RU"));
  assert.equal(formatMoney(null), "0");
  assert.equal(formatMoney("abc"), "0");
});

test("formatDays trims binary tails and uses the Russian decimal comma", () => {
  assert.equal(formatDays(4.5), "4,5");
  assert.equal(formatDays(12), "12");
  assert.equal(formatDays(3.3000000000000003), "3,3");
  assert.equal(formatDays(0), "0");
  assert.equal(formatDays(null), "0");
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

test("pluralizeDays follows the standard Russian plural rule", () => {
  assert.equal(pluralizeDays(1), "день");
  assert.equal(pluralizeDays(21), "день");
  assert.equal(pluralizeDays(2), "дня");
  assert.equal(pluralizeDays(3), "дня");
  assert.equal(pluralizeDays(4), "дня");
  assert.equal(pluralizeDays(22), "дня");
  assert.equal(pluralizeDays(5), "дней");
  assert.equal(pluralizeDays(8), "дней");
  assert.equal(pluralizeDays(11), "дней");
  assert.equal(pluralizeDays(12), "дней");
  assert.equal(pluralizeDays(14), "дней");
  assert.equal(pluralizeDays(0), "дней");
});
