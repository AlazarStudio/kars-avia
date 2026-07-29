import { test } from "node:test";
import assert from "node:assert/strict";
import { calculateCostDaysByDuration } from "./effectiveCostDays.js";

// departure = base + N минут
const base = "2026-01-01T00:00:00.000Z";
const plus = (minutes) =>
  new Date(new Date(base).getTime() + minutes * 60000).toISOString();

test("минимум 1 сутки: любая длительность до 24ч включительно = 1", () => {
  assert.equal(calculateCostDaysByDuration(base, plus(30)), 1); // 30 мин
  assert.equal(calculateCostDaysByDuration(base, plus(180)), 1); // 3 ч
  assert.equal(calculateCostDaysByDuration(base, plus(1200)), 1); // 20 ч
  assert.equal(calculateCostDaysByDuration(base, plus(1440)), 1); // 24 ч ровно
});

test("сверх суток: +0.5 за каждый начатый 12ч блок (округление вверх)", () => {
  assert.equal(calculateCostDaysByDuration(base, plus(1441)), 1.5); // 24ч+1мин
  assert.equal(calculateCostDaysByDuration(base, plus(1620)), 1.5); // +3ч (27ч)
  assert.equal(calculateCostDaysByDuration(base, plus(1740)), 1.5); // +5ч (29ч)
  assert.equal(calculateCostDaysByDuration(base, plus(2160)), 1.5); // +12ч (36ч)
  assert.equal(calculateCostDaysByDuration(base, plus(2280)), 2); // +14ч (38ч)
  assert.equal(calculateCostDaysByDuration(base, plus(2880)), 2); // 48ч
  assert.equal(calculateCostDaysByDuration(base, plus(3600)), 2.5); // 60ч
});

test("пустые / невалидные / непозитивные → 0", () => {
  assert.equal(calculateCostDaysByDuration("", ""), 0);
  assert.equal(calculateCostDaysByDuration(null, base), 0);
  assert.equal(calculateCostDaysByDuration(base, null), 0);
  assert.equal(calculateCostDaysByDuration("нет", base), 0); // невалидная дата
  assert.equal(calculateCostDaysByDuration(base, base), 0); // равны
  assert.equal(calculateCostDaysByDuration(plus(60), base), 0); // departure < arrival
});

test("Date и ISO-строка дают одинаковый результат", () => {
  const a = new Date(base);
  const b = new Date(new Date(base).getTime() + 2280 * 60000); // +38ч
  assert.equal(calculateCostDaysByDuration(a, b), 2);
  assert.equal(calculateCostDaysByDuration(base, b.toISOString()), 2);
});
