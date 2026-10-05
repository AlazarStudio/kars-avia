import { test } from "node:test";
import assert from "node:assert/strict";
import { describeReportPeriod } from "./reportPeriod.js";

test("декада: 10 дней включительно", () => {
  assert.deepEqual(describeReportPeriod("2026-08-01", "2026-08-10"), {
    start: "01.08.2026",
    end: "10.08.2026",
    days: 10,
    isSingleDay: false,
    label: "01.08.2026 – 10.08.2026 · 10 дней",
  });
});

test("один день: одна дата в подписи", () => {
  assert.deepEqual(describeReportPeriod("2026-08-01", "2026-08-01"), {
    start: "01.08.2026",
    end: "01.08.2026",
    days: 1,
    isSingleDay: true,
    label: "01.08.2026 · 1 день",
  });
});

test("через границу месяца: 31.07–01.08 — 2 дня", () => {
  const period = describeReportPeriod("2026-07-31", "2026-08-01");
  assert.equal(period.days, 2);
  assert.equal(period.label, "31.07.2026 – 01.08.2026 · 2 дня");
});

test("склонение: 21 день", () => {
  assert.equal(
    describeReportPeriod("2026-08-01", "2026-08-21").label,
    "01.08.2026 – 21.08.2026 · 21 день"
  );
});

test("пустая дата — null", () => {
  assert.equal(describeReportPeriod("", "2026-08-10"), null);
  assert.equal(describeReportPeriod("2026-08-01", ""), null);
});

test("конец раньше начала — null", () => {
  assert.equal(describeReportPeriod("2026-08-10", "2026-08-01"), null);
});

test("несуществующая дата — null", () => {
  assert.equal(describeReportPeriod("2026-02-31", "2026-03-05"), null);
});
