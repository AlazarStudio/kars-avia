import test from "node:test";
import assert from "node:assert/strict";
import { serializeListFilters, parseListFilters } from "./fapListFilters.js";

const baseFilters = {
  search: "SU1234",
  airline: { id: "a-1", name: "Аврора", color: "#fff" },
  airport: { id: "p-1", name: "Шереметьево", code: "SVO" },
  services: ["WATER", "MEAL"],
  reportStage: "SUBMITTED",
  startDate: new Date("2026-09-01T00:10:00.000Z"),
  endDate: new Date("2026-09-10T23:50:00.000Z"),
};

test("round-trip: serialize → parse сохраняет все поля, даты равны по getTime", () => {
  const raw = serializeListFilters(baseFilters, "u-1");
  const parsed = parseListFilters(raw, "u-1");
  assert.equal(parsed.search, "SU1234");
  assert.deepEqual(parsed.airline, { id: "a-1", name: "Аврора" });
  assert.deepEqual(parsed.airport, { id: "p-1", name: "Шереметьево", code: "SVO" });
  assert.deepEqual(parsed.services, ["WATER", "MEAL"]);
  assert.equal(parsed.reportStage, "SUBMITTED");
  assert.equal(parsed.startDate.getTime(), baseFilters.startDate.getTime());
  assert.equal(parsed.endDate.getTime(), baseFilters.endDate.getTime());
});

test("другой userId — null", () => {
  const raw = serializeListFilters(baseFilters, "u-1");
  assert.equal(parseListFilters(raw, "u-2"), null);
});

test("оба userId null — восстанавливается", () => {
  const raw = serializeListFilters(baseFilters, null);
  const parsed = parseListFilters(raw, null);
  assert.equal(parsed.search, "SU1234");
});

test("null / пустая строка / битый JSON / JSON-число — null", () => {
  assert.equal(parseListFilters(null, "u-1"), null);
  assert.equal(parseListFilters("", "u-1"), null);
  assert.equal(parseListFilters("{не json", "u-1"), null);
  assert.equal(parseListFilters("42", "u-1"), null);
});

test("невалидная дата — null в этом поле, остальное на месте", () => {
  const raw = JSON.stringify({
    userId: "u-1",
    search: "test",
    airline: null,
    airport: null,
    services: [],
    reportStage: null,
    startDate: "not-a-date",
    endDate: null,
  });
  const parsed = parseListFilters(raw, "u-1");
  assert.equal(parsed.startDate, null);
  assert.equal(parsed.endDate, null);
  assert.equal(parsed.search, "test");
});

test("services не массив или с нестроковыми элементами — только строки / []", () => {
  const rawNotArray = JSON.stringify({
    userId: "u-1",
    search: "",
    airline: null,
    airport: null,
    services: "WATER",
    reportStage: null,
    startDate: null,
    endDate: null,
  });
  assert.deepEqual(parseListFilters(rawNotArray, "u-1").services, []);

  const rawMixed = JSON.stringify({
    userId: "u-1",
    search: "",
    airline: null,
    airport: null,
    services: ["WATER", 5, null, "MEAL"],
    reportStage: null,
    startDate: null,
    endDate: null,
  });
  assert.deepEqual(parseListFilters(rawMixed, "u-1").services, ["WATER", "MEAL"]);
});

test("лишние поля airline/airport отрезаются, у airport без code — code: \"\"", () => {
  const raw = serializeListFilters(
    {
      ...baseFilters,
      airport: { id: "p-1", name: "Шереметьево" },
    },
    "u-1"
  );
  const parsed = parseListFilters(raw, "u-1");
  assert.deepEqual(parsed.airport, { id: "p-1", name: "Шереметьево", code: "" });
  assert.deepEqual(Object.keys(parsed.airline), ["id", "name"]);
});

test("airline без id — null", () => {
  const raw = serializeListFilters(
    { ...baseFilters, airline: { name: "Аврора" } },
    "u-1"
  );
  const parsed = parseListFilters(raw, "u-1");
  assert.equal(parsed.airline, null);
});
