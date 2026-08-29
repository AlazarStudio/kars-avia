import { test } from "node:test";
import assert from "node:assert/strict";
import { format } from "date-fns";
import {
  DAY_BG,
  DRAG_HIGHLIGHT_BG,
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

test("декада: первая декада августа-2026 — 1–10, 10 дней", () => {
  const period = buildPeriod("decade", at("2026-08-05"));

  assert.equal(period.view, "decade");
  assert.equal(period.days.length, 10);
  assert.equal(ymd(period.start), "2026-08-01");
  assert.equal(ymd(period.end), "2026-08-10");
  assert.equal(period.title, "1 – 10 августа 2026");
});

test("декада: вторая декада августа-2026 — 11–20, 10 дней", () => {
  const period = buildPeriod("decade", at("2026-08-15"));

  assert.equal(period.days.length, 10);
  assert.equal(ymd(period.start), "2026-08-11");
  assert.equal(ymd(period.end), "2026-08-20");
  assert.equal(period.title, "11 – 20 августа 2026");
});

test("декада: третья декада августа-2026 — 21–31, 11 дней", () => {
  const period = buildPeriod("decade", at("2026-08-25"));

  assert.equal(period.days.length, 11);
  assert.equal(ymd(period.start), "2026-08-21");
  assert.equal(ymd(period.end), "2026-08-31");
  assert.equal(period.title, "21 – 31 августа 2026");
});

test("декада: дни-границы попадают в свою декаду", () => {
  assert.equal(ymd(buildPeriod("decade", at("2026-08-01")).start), "2026-08-01");
  assert.equal(ymd(buildPeriod("decade", at("2026-08-10")).start), "2026-08-01");
  assert.equal(ymd(buildPeriod("decade", at("2026-08-11")).start), "2026-08-11");
  assert.equal(ymd(buildPeriod("decade", at("2026-08-20")).start), "2026-08-11");
  assert.equal(ymd(buildPeriod("decade", at("2026-08-21")).start), "2026-08-21");
  assert.equal(ymd(buildPeriod("decade", at("2026-08-31")).start), "2026-08-21");
});

test("декада: третья декада февраля-2026 — 21–28, 8 дней", () => {
  const period = buildPeriod("decade", at("2026-02-25"));

  assert.equal(period.days.length, 8);
  assert.equal(ymd(period.start), "2026-02-21");
  assert.equal(ymd(period.end), "2026-02-28");
  assert.equal(period.title, "21 – 28 февраля 2026");
});

test("декада: третья декада високосного февраля-2028 — 21–29, 9 дней", () => {
  const period = buildPeriod("decade", at("2028-02-25"));

  assert.equal(period.days.length, 9);
  assert.equal(ymd(period.end), "2028-02-29");
});

test("декада: третья декада 30-дневного месяца — 21–30, 10 дней", () => {
  const period = buildPeriod("decade", at("2026-06-25"));

  assert.equal(period.days.length, 10);
  assert.equal(ymd(period.start), "2026-06-21");
  assert.equal(ymd(period.end), "2026-06-30");
});

test("декада: границы — начало первого дня и конец последнего", () => {
  for (const day of ["2026-08-05", "2026-08-15", "2026-08-25"]) {
    const { start, end } = buildPeriod("decade", at(day));

    assert.equal(start.getHours(), 0);
    assert.equal(start.getMinutes(), 0);
    assert.equal(start.getSeconds(), 0);
    assert.equal(start.getMilliseconds(), 0);
    // Как у недели/месяца: 23:59:59.999 — на это опирается periodEndExclusive.
    assert.equal(end.getHours(), 23);
    assert.equal(end.getMinutes(), 59);
    assert.equal(end.getSeconds(), 59);
    assert.equal(end.getMilliseconds(), 999);
  }
});

test("shiftAnchor: декада вперёд — 1→11→21→следующий месяц", () => {
  assert.equal(ymd(shiftAnchor("decade", at("2026-08-05"), 1)), "2026-08-11");
  assert.equal(ymd(shiftAnchor("decade", at("2026-08-15"), 1)), "2026-08-21");
  assert.equal(ymd(shiftAnchor("decade", at("2026-08-25"), 1)), "2026-09-01");
});

test("shiftAnchor: декада назад — 21→11→1→предыдущий месяц", () => {
  assert.equal(ymd(shiftAnchor("decade", at("2026-08-25"), -1)), "2026-08-11");
  assert.equal(ymd(shiftAnchor("decade", at("2026-08-15"), -1)), "2026-08-01");
  assert.equal(ymd(shiftAnchor("decade", at("2026-08-05"), -1)), "2026-07-21");
});

test("shiftAnchor: декада через границу года", () => {
  assert.equal(ymd(shiftAnchor("decade", at("2026-12-25"), 1)), "2027-01-01");
  assert.equal(ymd(shiftAnchor("decade", at("2026-01-05"), -1)), "2025-12-21");
});

test("shiftAnchor: декада из конца длинного месяца в короткий", () => {
  // 31.01 → следующий месяц: важно, что addMonths не съедает день (Feb 28).
  assert.equal(ymd(shiftAnchor("decade", at("2026-01-31"), 1)), "2026-02-01");
  // 31.03 назад → вторая декада того же марта.
  assert.equal(ymd(shiftAnchor("decade", at("2026-03-31"), -1)), "2026-03-11");
  // 05.03 назад → третья декада февраля.
  assert.equal(ymd(shiftAnchor("decade", at("2026-03-05"), -1)), "2026-02-21");
});

test("shiftAnchor: декада не мутирует переданный anchor", () => {
  const anchor = at("2026-08-25");
  shiftAnchor("decade", anchor, 1);
  shiftAnchor("decade", anchor, -1);
  assert.equal(ymd(anchor), "2026-08-25");
});

test("сдвинутый anchor даёт соседнюю декаду", () => {
  const next = buildPeriod("decade", shiftAnchor("decade", at("2026-08-25"), 1));
  assert.equal(next.title, "1 – 10 сентября 2026");
  assert.equal(next.days.length, 10);
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

test("dayCellBg: сегодня — жёлтая колонка", () => {
  assert.equal(dayCellBg(new Date()), DAY_BG.today);
  assert.equal(DAY_BG.today, "#f3f292");
});

// Подсветка дат при драге — отдельный голубой цвет, не «сегодня».
test("DRAG_HIGHLIGHT_BG — голубой и не совпадает с фоном сегодня", () => {
  assert.equal(DRAG_HIGHLIGHT_BG, "#eaf2fd");
  assert.notEqual(DRAG_HIGHLIGHT_BG, DAY_BG.today);
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
