import { test } from "node:test";
import assert from "node:assert/strict";
import { format } from "date-fns";
import {
  DAY_BG,
  buildPeriod,
  dayCellBg,
  shiftAnchor,
} from "./placementPeriod.js";

// Локальный полдень, чтобы тесты не зависели от смещения таймзоны.
const at = (iso) => new Date(`${iso}T12:00:00`);
const ymd = (d) => format(d, "yyyy-MM-dd");

test("месяц: август-2026 — 31 день и заголовок «Август 2026»", () => {
  const period = buildPeriod("month", at("2026-08-15"));

  assert.equal(period.view, "month");
  assert.equal(period.days.length, 31);
  assert.equal(ymd(period.start), "2026-08-01");
  assert.equal(ymd(period.end), "2026-08-31");
  assert.equal(ymd(period.days[0]), "2026-08-01");
  assert.equal(ymd(period.days[30]), "2026-08-31");
  assert.equal(period.title, "Август 2026");
});

test("месяц: заголовок капитализируется для любого месяца", () => {
  assert.equal(buildPeriod("month", at("2026-02-10")).title, "Февраль 2026");
  assert.equal(buildPeriod("month", at("2026-12-01")).title, "Декабрь 2026");
});

test("месяц: границы — начало первого дня и конец последнего", () => {
  const { start, end } = buildPeriod("month", at("2026-08-15"));

  assert.equal(start.getHours(), 0);
  assert.equal(start.getMinutes(), 0);
  assert.equal(start.getSeconds(), 0);
  assert.equal(start.getMilliseconds(), 0);
  // date-fns отдаёт конец периода как 23:59:59.999 — на это опирается
  // periodEndExclusive в placementBarLayout.
  assert.equal(end.getHours(), 23);
  assert.equal(end.getMinutes(), 59);
  assert.equal(end.getSeconds(), 59);
  assert.equal(end.getMilliseconds(), 999);
});

test("неделя: 26.08.2026 → пн 24.08 – вс 30.08, 7 дней", () => {
  const period = buildPeriod("week", at("2026-08-26"));

  assert.equal(period.view, "week");
  assert.equal(period.days.length, 7);
  assert.equal(ymd(period.start), "2026-08-24");
  assert.equal(ymd(period.end), "2026-08-30");
  assert.equal(period.title, "24 – 30 августа 2026");
});

test("неделя: понедельник остаётся началом своей же недели", () => {
  const period = buildPeriod("week", at("2026-08-24"));
  assert.equal(ymd(period.start), "2026-08-24");
  assert.equal(ymd(period.end), "2026-08-30");
});

test("неделя через границу месяцев: 31.08 – 06.09 с месяцем слева", () => {
  const period = buildPeriod("week", at("2026-08-31"));

  assert.equal(period.days.length, 7);
  assert.equal(ymd(period.start), "2026-08-31");
  assert.equal(ymd(period.end), "2026-09-06");
  assert.equal(period.title, "31 августа – 6 сентября 2026");
});

test("неделя через границу годов: год проставлен с обеих сторон", () => {
  const period = buildPeriod("week", at("2026-12-30"));

  assert.equal(ymd(period.start), "2026-12-28");
  assert.equal(ymd(period.end), "2027-01-03");
  assert.equal(period.title, "28 декабря 2026 – 3 января 2027");
});

test("shiftAnchor: месяц вперёд и назад", () => {
  const anchor = at("2026-08-15");
  assert.equal(ymd(shiftAnchor("month", anchor, 1)), "2026-09-15");
  assert.equal(ymd(shiftAnchor("month", anchor, -1)), "2026-07-15");
});

test("shiftAnchor: месяц через границу года", () => {
  assert.equal(ymd(shiftAnchor("month", at("2026-12-10"), 1)), "2027-01-10");
  assert.equal(ymd(shiftAnchor("month", at("2026-01-10"), -1)), "2025-12-10");
});

test("shiftAnchor: неделя — ровно 7 дней в обе стороны", () => {
  const anchor = at("2026-08-26");
  assert.equal(ymd(shiftAnchor("week", anchor, 1)), "2026-09-02");
  assert.equal(ymd(shiftAnchor("week", anchor, -1)), "2026-08-19");
});

test("shiftAnchor не мутирует переданный anchor", () => {
  const anchor = at("2026-08-26");
  shiftAnchor("week", anchor, 1);
  shiftAnchor("month", anchor, -1);
  assert.equal(ymd(anchor), "2026-08-26");
});

test("сдвинутый anchor даёт соседний период", () => {
  const anchor = at("2026-08-15");
  const next = buildPeriod("month", shiftAnchor("month", anchor, 1));
  assert.equal(next.title, "Сентябрь 2026");
  assert.equal(next.days.length, 30);
});

test("dayCellBg: сегодня — голубая колонка", () => {
  assert.equal(dayCellBg(new Date()), DAY_BG.today);
});

// Даты в прошлом: «сегодня» их никогда не перебьёт, тест не протухнет.
test("dayCellBg: выходной (не сегодня) — светло-серый", () => {
  // 2020-01-04 — суббота, 2020-01-05 — воскресенье.
  assert.equal(dayCellBg(at("2020-01-04")), DAY_BG.weekend);
  assert.equal(dayCellBg(at("2020-01-05")), DAY_BG.weekend);
});

test("dayCellBg: будний (не сегодня) — белый", () => {
  // 2020-01-02 — четверг, 2020-01-03 — пятница.
  assert.equal(dayCellBg(at("2020-01-02")), DAY_BG.plain);
  assert.equal(dayCellBg(at("2020-01-03")), DAY_BG.plain);
});

test("dayCellBg: сегодня перебивает выходной", () => {
  const today = new Date();
  const isWeekendToday = today.getDay() === 0 || today.getDay() === 6;
  if (!isWeekendToday) return;
  assert.equal(dayCellBg(today), DAY_BG.today);
});
