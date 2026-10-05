import { test } from "node:test";
import assert from "node:assert/strict";
import { buildSummary, buildChartData } from "./passengerAnalyticsAggregations.js";
import { formatRequestsCount } from "./passengerAnalyticsMappers.js";

const row = (over) => ({
  airportCode: "VKO",
  airportName: "Внуково",
  airlineName: "Россия",
  flightDate: "2026-09-30T21:00:00.000Z",
  status: "COMPLETED",
  costMissing: false,
  peopleCount: 0,
  childrenCount: 0,
  infantsCount: 0,
  roomNights: 0,
  living: 0,
  meal: 0,
  transfer: 0,
  waterMeal: 0,
  total: 0,
  ...over,
});

test("сводка: отменённая — только в «Заявок» и cancelledCount", () => {
  const [g] = buildSummary(
    [
      row({ peopleCount: 2, roomNights: 2, living: 7000, meal: 400, transfer: 1000, waterMeal: 500, total: 8900 }),
      row({ status: "CANCELLED", peopleCount: 5, roomNights: 3, costMissing: true }),
    ],
    "airport"
  );
  assert.equal(g.requestsCount, 2);
  assert.equal(g.cancelledCount, 1);
  assert.equal(g.missingCostCount, 0);
  assert.equal(g.peopleCount, 2);
  assert.equal(g.roomNights, 2);
  assert.equal(g.waterMeal, 500);
  assert.equal(g.total, 8900);
});

test("сводка (вариант C): деньги заявки «нет отчёта» в сумме, её люди — нет", () => {
  const [g] = buildSummary(
    [
      row({ peopleCount: 2, childrenCount: 1, living: 7000, transfer: 1000, total: 8000 }),
      row({ costMissing: true, peopleCount: 5, childrenCount: 2, transfer: 600, waterMeal: 6440, total: 7040 }),
    ],
    "airport"
  );
  assert.equal(g.peopleCount, 2);
  assert.equal(g.childrenCount, 1);
  assert.equal(g.missingCostCount, 1);
  assert.equal(g.transfer, 1600);
  assert.equal(g.waterMeal, 6440);
  assert.equal(g.total, 15040);
});

test("график: четвёртая денежная серия «Вода и питание», у авиакомпании её нет", () => {
  const summary = buildSummary(
    [row({ living: 100, meal: 50, transfer: 30, waterMeal: 20, total: 200 })],
    "airport"
  );
  const full = buildChartData(summary, "airport", "money");
  assert.deepEqual(full.series.map((s) => s.key), ["living", "meal", "transfer", "waterMeal"]);
  assert.deepEqual(full.series.map((s) => s.label), [
    "Проживание",
    "Питание в гостинице",
    "Трансфер",
    "Вода и питание",
  ]);
  assert.equal(full.data[0].waterMeal, 20);
  const airline = buildChartData(summary, "airport", "money", { withWaterMeal: false });
  assert.deepEqual(airline.series.map((s) => s.key), ["living", "meal", "transfer"]);
});

test("график: «Прочие» складывают и «Воду и питание»", () => {
  const rows = Array.from({ length: 10 }, (_, i) =>
    row({ airportCode: `A${i}`, airportName: `Аэропорт ${i}`, waterMeal: 10, total: 100 - i })
  );
  const { data } = buildChartData(buildSummary(rows, "airport"), "airport", "money");
  assert.equal(data.length, 9);
  assert.equal(data[8].x, "Прочие");
  assert.equal(data[8].waterMeal, 20);
});

test("«Заявок»: отменённые пометкой, без них — просто число", () => {
  assert.equal(formatRequestsCount(12, 2), "12 · 2 отм.");
  assert.equal(formatRequestsCount(12, 0), "12");
});
