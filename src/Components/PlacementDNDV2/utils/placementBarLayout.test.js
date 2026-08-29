import { test } from "node:test";
import assert from "node:assert/strict";
import { layoutBar } from "./placementBarLayout.js";
import { buildPeriod } from "./placementPeriod.js";

const MONTH = buildPeriod("month", new Date("2026-08-15T12:00:00"));
const DAY_W = 44;

const req = (checkInDate, checkInTime, checkOutDate, checkOutTime) => ({
  checkInDate,
  checkInTime,
  checkOutDate,
  checkOutTime,
});

const approx = (actual, expected, message) =>
  assert.ok(
    Math.abs(actual - expected) < 1e-6,
    `${message}: ожидалось ${expected}, получено ${actual}`
  );

test("бронь целиком в периоде: без клипов, позиция по времени", () => {
  const bar = layoutBar(
    req("2026-08-05", "14:00", "2026-08-07", "12:00"),
    MONTH,
    DAY_W
  );

  assert.ok(bar);
  assert.equal(bar.clipL, false);
  assert.equal(bar.clipR, false);
  assert.equal(bar.clipLLabel, null);
  assert.equal(bar.clipRLabel, null);
  // 4 полных дня + 14 часов от начала месяца
  approx(bar.left, (4 + 14 / 24) * DAY_W, "left");
  // 1 день 22 часа длительности минус 3px зазор
  approx(bar.width, (1 + 22 / 24) * DAY_W - 3, "width");
});

test("заезд до начала периода: clipL, left=0, метка даты заезда", () => {
  const bar = layoutBar(
    req("2026-07-29", "14:00", "2026-08-03", "12:00"),
    MONTH,
    DAY_W
  );

  assert.ok(bar);
  assert.equal(bar.clipL, true);
  assert.equal(bar.clipR, false);
  assert.equal(bar.clipLLabel, "29.07");
  assert.equal(bar.clipRLabel, null);
  approx(bar.left, 0, "left");
  approx(bar.width, 2.5 * DAY_W - 3, "width");
});

test("выезд после конца периода: clipR, ширина обрезана концом месяца", () => {
  const bar = layoutBar(
    req("2026-08-29", "14:00", "2026-09-03", "12:00"),
    MONTH,
    DAY_W
  );

  assert.ok(bar);
  assert.equal(bar.clipL, false);
  assert.equal(bar.clipR, true);
  assert.equal(bar.clipRLabel, "03.09");
  approx(bar.left, (28 + 14 / 24) * DAY_W, "left");
  // обрезано ровно по 01.09 00:00, а не по 01.09 23:59
  approx(bar.width, (2 + 10 / 24) * DAY_W - 3, "width");
});

test("выезд в последний день периода клипом НЕ считается", () => {
  const bar = layoutBar(
    req("2026-08-30", "14:00", "2026-08-31", "12:00"),
    MONTH,
    DAY_W
  );

  assert.ok(bar);
  assert.equal(bar.clipR, false);
  assert.equal(bar.clipRLabel, null);
  approx(bar.width, (22 / 24) * DAY_W - 3, "width");
});

test("выезд в 23:59 последнего дня — всё ещё без клипа", () => {
  const bar = layoutBar(
    req("2026-08-31", "08:00", "2026-08-31", "23:59"),
    MONTH,
    DAY_W
  );

  assert.ok(bar);
  assert.equal(bar.clipR, false);
});

test("выезд на следующие сутки после периода — уже клип", () => {
  // Граница periodEndExclusive: конец периода от date-fns — 23:59:59.999
  // последнего дня, исключающая граница = 01.09 00:00, а не 02.09.
  const bar = layoutBar(
    req("2026-08-30", "10:00", "2026-09-01", "12:00"),
    MONTH,
    DAY_W
  );

  assert.ok(bar);
  assert.equal(bar.clipR, true);
  assert.equal(bar.clipRLabel, "01.09");
  approx(bar.width, (1 + 14 / 24) * DAY_W - 3, "width");
});

test("выезд ровно в 01.09 00:00 — конец периода, но не клип", () => {
  const bar = layoutBar(
    req("2026-08-31", "10:00", "2026-09-01", "00:00"),
    MONTH,
    DAY_W
  );

  assert.ok(bar);
  assert.equal(bar.clipR, false);
  approx(bar.width, (14 / 24) * DAY_W - 3, "width");
});

test("бронь целиком до периода → null", () => {
  assert.equal(
    layoutBar(req("2026-07-20", "10:00", "2026-07-25", "12:00"), MONTH, DAY_W),
    null
  );
});

test("выезд ровно в начало периода → null", () => {
  assert.equal(
    layoutBar(req("2026-07-28", "10:00", "2026-08-01", "00:00"), MONTH, DAY_W),
    null
  );
});

test("бронь целиком после периода → null", () => {
  assert.equal(
    layoutBar(req("2026-09-05", "10:00", "2026-09-08", "12:00"), MONTH, DAY_W),
    null
  );
});

test("заезд ровно в исключающую границу периода → null", () => {
  assert.equal(
    layoutBar(req("2026-09-01", "00:00", "2026-09-03", "12:00"), MONTH, DAY_W),
    null
  );
});

test("короткая бронь получает минимальную ширину 14px", () => {
  const bar = layoutBar(
    req("2026-08-05", "10:00", "2026-08-05", "11:00"),
    MONTH,
    DAY_W
  );

  assert.ok(bar);
  assert.equal(bar.width, 14);
});

test("бронь шире периода с обеих сторон: клипы с двух сторон, ширина = сетка", () => {
  const bar = layoutBar(
    req("2026-07-15", "10:00", "2026-09-15", "12:00"),
    MONTH,
    DAY_W
  );

  assert.ok(bar);
  assert.equal(bar.clipL, true);
  assert.equal(bar.clipR, true);
  assert.equal(bar.clipLLabel, "15.07");
  assert.equal(bar.clipRLabel, "15.09");
  approx(bar.left, 0, "left");
  // ровно ширина сетки за вычетом зазора — плашка не вылезает за месяц
  approx(bar.width, MONTH.days.length * DAY_W - 3, "width");
});

test("метки клипов дополняются нулями до DD.MM", () => {
  const bar = layoutBar(
    req("2026-07-05", "10:00", "2026-09-09", "12:00"),
    MONTH,
    DAY_W
  );

  assert.equal(bar.clipLLabel, "05.07");
  assert.equal(bar.clipRLabel, "09.09");
});

test("недельный период: своя ширина дня и своя исключающая граница", () => {
  const week = buildPeriod("week", new Date("2026-08-26T12:00:00")); // 24–30.08
  const bar = layoutBar(
    req("2026-08-25", "12:00", "2026-08-27", "12:00"),
    week,
    150
  );

  assert.ok(bar);
  assert.equal(bar.clipL, false);
  assert.equal(bar.clipR, false);
  approx(bar.left, 1.5 * 150, "left");
  approx(bar.width, 2 * 150 - 3, "width");

  const spilling = layoutBar(
    req("2026-08-29", "12:00", "2026-09-02", "12:00"),
    week,
    150
  );
  assert.equal(spilling.clipR, true);
  assert.equal(spilling.clipRLabel, "02.09");
  approx(spilling.width, (1 + 12 / 24) * 150 - 3, "width");
});
