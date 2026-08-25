import { test } from "node:test";
import assert from "node:assert/strict";
import {
  PARTIAL_DAY_DEFAULTS,
  toRulesForm,
  parseHhMm,
  validateRules,
  rulesChanged,
  toUpsertInput,
  pickSetting,
  resolveDraftPartialDayRules,
} from "./reportRules.js";

test("toRulesForm returns defaults when setting is missing", () => {
  assert.deepEqual(toRulesForm(null), PARTIAL_DAY_DEFAULTS);
  assert.deepEqual(toRulesForm(undefined), PARTIAL_DAY_DEFAULTS);
});

test("toRulesForm takes values from setting and ignores extra keys", () => {
  const form = toRulesForm({
    id: "1",
    level: "GLOBAL",
    __typename: "ReportPartialDaySetting",
    arrivalFullBefore: "05:30",
    arrivalHalfBefore: "13:00",
    departureHalfAfter: "11:00",
    departureFullAfter: "17:00",
    arrivalFullDays: 1,
    arrivalHalfDays: 0.5,
    departureHalfDays: 0.5,
    departureFullDays: 1,
  });
  assert.equal(form.arrivalFullBefore, "05:30");
  assert.equal(form.departureFullAfter, "17:00");
  assert.equal(Object.keys(form).length, 8);
});

test("toRulesForm falls back per field when a field is null", () => {
  const form = toRulesForm({ arrivalFullBefore: null, arrivalHalfDays: null });
  assert.equal(form.arrivalFullBefore, "06:00");
  assert.equal(form.arrivalHalfDays, 0.5);
});

test("parseHhMm converts valid time and rejects garbage", () => {
  assert.equal(parseHhMm("06:00"), 360);
  assert.equal(parseHhMm("00:10"), 10);
  assert.equal(parseHhMm("23:50"), 1430);
  assert.equal(parseHhMm(""), null);
  assert.equal(parseHhMm("25:00"), null);
  assert.equal(parseHhMm("6:0"), null);
  assert.equal(parseHhMm(null), null);
});

test("validateRules accepts the defaults", () => {
  const { isValid, errors } = validateRules(PARTIAL_DAY_DEFAULTS);
  assert.equal(isValid, true);
  assert.deepEqual(errors, {});
});

test("validateRules rejects an empty time field", () => {
  const { isValid, errors } = validateRules({ ...PARTIAL_DAY_DEFAULTS, arrivalFullBefore: "" });
  assert.equal(isValid, false);
  assert.ok(errors.arrivalFullBefore);
});

test("validateRules rejects a negative coefficient", () => {
  const { isValid, errors } = validateRules({ ...PARTIAL_DAY_DEFAULTS, arrivalHalfDays: -1 });
  assert.equal(isValid, false);
  assert.ok(errors.arrivalHalfDays);
});

test("validateRules rejects a non-numeric coefficient", () => {
  const { isValid, errors } = validateRules({ ...PARTIAL_DAY_DEFAULTS, departureFullDays: "abc" });
  assert.equal(isValid, false);
  assert.ok(errors.departureFullDays);
});

test("validateRules requires the arrival thresholds to be ordered", () => {
  const { isValid, errors } = validateRules({
    ...PARTIAL_DAY_DEFAULTS,
    arrivalFullBefore: "14:00",
    arrivalHalfBefore: "06:00",
  });
  assert.equal(isValid, false);
  assert.ok(errors.arrivalHalfBefore);
});

test("validateRules requires the departure thresholds to be ordered", () => {
  const { isValid, errors } = validateRules({
    ...PARTIAL_DAY_DEFAULTS,
    departureHalfAfter: "18:00",
    departureFullAfter: "12:00",
  });
  assert.equal(isValid, false);
  assert.ok(errors.departureFullAfter);
});

test("equal thresholds are rejected too", () => {
  const { isValid } = validateRules({
    ...PARTIAL_DAY_DEFAULTS,
    arrivalFullBefore: "06:00",
    arrivalHalfBefore: "06:00",
  });
  assert.equal(isValid, false);
});

test("rulesChanged detects a change and ignores string/number drift", () => {
  assert.equal(rulesChanged(PARTIAL_DAY_DEFAULTS, PARTIAL_DAY_DEFAULTS), false);
  assert.equal(
    rulesChanged({ ...PARTIAL_DAY_DEFAULTS, arrivalFullDays: "1" }, PARTIAL_DAY_DEFAULTS),
    false
  );
  assert.equal(
    rulesChanged({ ...PARTIAL_DAY_DEFAULTS, arrivalFullDays: 2 }, PARTIAL_DAY_DEFAULTS),
    true
  );
});

test("toUpsertInput produces a GLOBAL payload with numeric coefficients", () => {
  const input = toUpsertInput({ ...PARTIAL_DAY_DEFAULTS, arrivalFullDays: "2" });
  assert.equal(input.level, "GLOBAL");
  assert.equal(input.arrivalFullDays, 2);
  assert.equal(input.arrivalFullBefore, "06:00");
  assert.equal("id" in input, false);
  assert.equal("airlineId" in input, false);
});

test("validateRules rejects an emptied coefficient", () => {
  const { isValid, errors } = validateRules({ ...PARTIAL_DAY_DEFAULTS, arrivalFullDays: "" });
  assert.equal(isValid, false);
  assert.ok(errors.arrivalFullDays);
});

test("validateRules rejects a missing coefficient", () => {
  for (const value of [null, undefined]) {
    const { isValid, errors } = validateRules({ ...PARTIAL_DAY_DEFAULTS, departureHalfDays: value });
    assert.equal(isValid, false);
    assert.ok(errors.departureHalfDays);
  }
});

test("validateRules still accepts zero and numeric strings", () => {
  const zero = validateRules({ ...PARTIAL_DAY_DEFAULTS, arrivalHalfDays: 0 });
  assert.equal(zero.isValid, true);
  const asString = validateRules({ ...PARTIAL_DAY_DEFAULTS, arrivalHalfDays: "0" });
  assert.equal(asString.isValid, true);
});

test("rulesChanged treats two empty inputs as unchanged", () => {
  assert.equal(rulesChanged(null, null), false);
  assert.equal(rulesChanged({}, {}), false);
});

const LEVEL_SETTINGS = [
  { id: "a1", level: "AIRLINE", airlineId: "air-1", hotelId: null },
  { id: "g1", level: "GLOBAL", airlineId: null, hotelId: null },
  { id: "h1", level: "HOTEL", airlineId: null, hotelId: "hot-1" },
];

test("pickSetting finds GLOBAL even when an AIRLINE row comes first", () => {
  assert.equal(pickSetting(LEVEL_SETTINGS, "GLOBAL")?.id, "g1");
});

test("pickSetting finds AIRLINE by airlineId and HOTEL by hotelId", () => {
  assert.equal(pickSetting(LEVEL_SETTINGS, "AIRLINE", "air-1")?.id, "a1");
  assert.equal(pickSetting(LEVEL_SETTINGS, "HOTEL", "hot-1")?.id, "h1");
});

test("pickSetting does not cross levels when ids collide", () => {
  const collide = [
    { id: "x", level: "AIRLINE", airlineId: "same", hotelId: null },
    { id: "y", level: "HOTEL", airlineId: null, hotelId: "same" },
  ];
  assert.equal(pickSetting(collide, "HOTEL", "same")?.id, "y");
  assert.equal(pickSetting(collide, "AIRLINE", "same")?.id, "x");
});

test("pickSetting returns null without an entity or a match", () => {
  assert.equal(pickSetting(LEVEL_SETTINGS, "AIRLINE"), null);
  assert.equal(pickSetting(LEVEL_SETTINGS, "AIRLINE", "missing"), null);
  assert.equal(pickSetting([], "GLOBAL"), null);
  assert.equal(pickSetting(null, "GLOBAL"), null);
  assert.equal(pickSetting(LEVEL_SETTINGS, "UNKNOWN", "air-1"), null);
});

test("toUpsertInput carries the level and only the matching entity id", () => {
  const airline = toUpsertInput(PARTIAL_DAY_DEFAULTS, "AIRLINE", "air-1");
  assert.equal(airline.level, "AIRLINE");
  assert.equal(airline.airlineId, "air-1");
  assert.equal("hotelId" in airline, false);
  assert.equal("id" in airline, false);

  const hotel = toUpsertInput(PARTIAL_DAY_DEFAULTS, "HOTEL", "hot-1");
  assert.equal(hotel.level, "HOTEL");
  assert.equal(hotel.hotelId, "hot-1");
  assert.equal("airlineId" in hotel, false);
  assert.equal("id" in hotel, false);

  assert.equal(toUpsertInput(PARTIAL_DAY_DEFAULTS, "AIRLINE").airlineId, null);
});

// Записи как с бэка: все восемь полей правил заполнены (в БД они non-null),
// плюс служебные поля, которые в правила протекать не должны.
const RULE_SETTINGS = [
  {
    id: "g1",
    level: "GLOBAL",
    airlineId: null,
    hotelId: null,
    __typename: "ReportPartialDaySetting",
    arrivalFullBefore: "05:00",
    arrivalHalfBefore: "13:00",
    departureHalfAfter: "11:00",
    departureFullAfter: "17:00",
    arrivalFullDays: 1,
    arrivalHalfDays: 0.5,
    departureHalfDays: 0.5,
    departureFullDays: 1,
  },
  {
    id: "a1",
    level: "AIRLINE",
    airlineId: "air-1",
    hotelId: null,
    __typename: "ReportPartialDaySetting",
    arrivalFullBefore: "07:00",
    arrivalHalfBefore: "15:00",
    departureHalfAfter: "13:00",
    departureFullAfter: "19:00",
    arrivalFullDays: 1,
    arrivalHalfDays: 0.5,
    departureHalfDays: 0.5,
    departureFullDays: 1,
  },
  {
    id: "h1",
    level: "HOTEL",
    airlineId: null,
    hotelId: "hot-1",
    __typename: "ReportPartialDaySetting",
    arrivalFullBefore: "08:00",
    arrivalHalfBefore: "16:00",
    departureHalfAfter: "14:00",
    departureFullAfter: "20:00",
    arrivalFullDays: 1,
    arrivalHalfDays: 0.5,
    departureHalfDays: 0.5,
    departureFullDays: 1,
  },
];

test("resolveDraftPartialDayRules puts the GLOBAL setting over the defaults", () => {
  const rules = resolveDraftPartialDayRules(RULE_SETTINGS, { type: "AIRLINE", airlineId: "air-9" });
  assert.equal(rules.arrivalFullBefore, "05:00");
  assert.equal(rules.departureHalfAfter, "11:00");
});

test("resolveDraftPartialDayRules applies the AIRLINE override to that airline's draft", () => {
  const rules = resolveDraftPartialDayRules(RULE_SETTINGS, {
    type: "AIRLINE",
    airlineId: "air-1",
    hotelId: "hot-1",
  });
  assert.equal(rules.arrivalFullBefore, "07:00");
  assert.equal(rules.departureHalfAfter, "13:00");
});

test("resolveDraftPartialDayRules ignores an AIRLINE override for another airline or a hotel draft", () => {
  const otherAirline = resolveDraftPartialDayRules(RULE_SETTINGS, {
    type: "AIRLINE",
    airlineId: "air-2",
  });
  assert.equal(otherAirline.arrivalFullBefore, "05:00");

  // Черновик гостиницы с заполненным airlineId: переопределение по АК в
  // hotel-отчёте не участвует — так же, как на бэке.
  const hotelDraft = resolveDraftPartialDayRules(RULE_SETTINGS, {
    type: "HOTEL",
    airlineId: "air-1",
    hotelId: "hot-9",
  });
  assert.equal(hotelDraft.arrivalFullBefore, "05:00");
});

test("resolveDraftPartialDayRules applies the HOTEL override only to that hotel's draft", () => {
  const own = resolveDraftPartialDayRules(RULE_SETTINGS, { type: "HOTEL", hotelId: "hot-1" });
  assert.equal(own.arrivalFullBefore, "08:00");
  assert.equal(own.departureHalfAfter, "14:00");

  const other = resolveDraftPartialDayRules(RULE_SETTINGS, { type: "HOTEL", hotelId: "hot-2" });
  assert.equal(other.arrivalFullBefore, "05:00");

  const airlineDraft = resolveDraftPartialDayRules(RULE_SETTINGS, {
    type: "AIRLINE",
    airlineId: "air-2",
    hotelId: "hot-1",
  });
  assert.equal(airlineDraft.arrivalFullBefore, "05:00");
});

test("resolveDraftPartialDayRules falls back to defaults without settings", () => {
  assert.deepEqual(resolveDraftPartialDayRules(null, { type: "AIRLINE", airlineId: "air-1" }), PARTIAL_DAY_DEFAULTS);
  assert.deepEqual(resolveDraftPartialDayRules([], { type: "HOTEL", hotelId: "hot-1" }), PARTIAL_DAY_DEFAULTS);
  assert.deepEqual(resolveDraftPartialDayRules(null, null), PARTIAL_DAY_DEFAULTS);
});

test("resolveDraftPartialDayRules without a draft still applies the GLOBAL setting", () => {
  // Общая настройка — это и есть «общие правила»: без черновика накрывать
  // переопределением нечего, но GLOBAL применяется, а не отбрасывается.
  const rules = resolveDraftPartialDayRules(RULE_SETTINGS, null);
  assert.equal(rules.arrivalFullBefore, "05:00");
  assert.equal(rules.departureHalfAfter, "11:00");
});

test("resolveDraftPartialDayRules builds on the defaults when there is no GLOBAL setting", () => {
  // Общая запись создаётся на бэке лениво (ensureGlobalPartialDaySetting), так
  // что список из одних override'ов — рабочее состояние, а не мусор.
  const onlyOverride = RULE_SETTINGS.filter((s) => s.level === "AIRLINE");
  const rules = resolveDraftPartialDayRules(onlyOverride, { type: "AIRLINE", airlineId: "air-1" });
  assert.equal(rules.arrivalFullBefore, "07:00");
  assert.equal(rules.departureHalfAfter, "13:00");

  // Черновик другой АК накрывать нечем — остаются чистые дефолты.
  const other = resolveDraftPartialDayRules(onlyOverride, { type: "AIRLINE", airlineId: "air-2" });
  assert.deepEqual(other, PARTIAL_DAY_DEFAULTS);
});

test("resolveDraftPartialDayRules returns a copy, not the shared defaults object", () => {
  // Фолбэк-ветка (нет настроек) — самое место вернуть саму константу; если
  // это когда-нибудь случится, правка результата испортит дефолты всему приложению.
  const rules = resolveDraftPartialDayRules([], null);
  rules.arrivalFullBefore = "23:59";
  assert.equal(PARTIAL_DAY_DEFAULTS.arrivalFullBefore, "06:00");
  assert.equal(resolveDraftPartialDayRules([], null).arrivalFullBefore, "06:00");
});

test("resolveDraftPartialDayRules returns only rule fields", () => {
  const rules = resolveDraftPartialDayRules(RULE_SETTINGS, { type: "AIRLINE", airlineId: "air-1" });
  assert.deepEqual(Object.keys(rules).sort(), Object.keys(PARTIAL_DAY_DEFAULTS).sort());
  for (const key of ["id", "level", "airlineId", "hotelId", "__typename", "updatedAt"]) {
    assert.equal(key in rules, false, `лишний ключ в правилах: ${key}`);
  }
});
