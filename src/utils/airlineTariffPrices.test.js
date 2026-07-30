import test from "node:test";
import assert from "node:assert/strict";
import {
  PRICE_APPLIES_TO_OPTIONS,
  DEFAULT_APPLIES_TO,
  normalizeAppliesTo,
  conflictingContractTypes,
  appliesToLabel,
  tariffInputToPayload,
} from "./airlineTariffPrices.js";

test("три значения в порядке показа, дефолт — заявки экипажа", () => {
  assert.deepEqual(
    PRICE_APPLIES_TO_OPTIONS.map((o) => o.key),
    ["request", "fap", "all"],
  );
  assert.deepEqual(
    PRICE_APPLIES_TO_OPTIONS.map((o) => o.label),
    ["Эскадрилья", "ФАП", "Все типы"],
  );
  assert.equal(DEFAULT_APPLIES_TO, "request");
});

test("normalizeAppliesTo сводит мусор и пустоту к request", () => {
  assert.equal(normalizeAppliesTo("fap"), "fap");
  assert.equal(normalizeAppliesTo("all"), "all");
  assert.equal(normalizeAppliesTo("request"), "request");
  for (const bad of [undefined, null, "", "REQUEST", "crew", 0]) {
    assert.equal(normalizeAppliesTo(bad), "request");
  }
});

test("конфликты типов по таблице из спеки", () => {
  assert.deepEqual(conflictingContractTypes("request").sort(), ["all", "request"]);
  assert.deepEqual(conflictingContractTypes("fap").sort(), ["all", "fap"]);
  assert.deepEqual(conflictingContractTypes("all").sort(), ["all", "fap", "request"]);
});

test("конфликты для неизвестного значения считаются как для request", () => {
  assert.deepEqual(conflictingContractTypes(undefined).sort(), ["all", "request"]);
});

test("appliesToLabel даёт подпись для бейджа", () => {
  assert.equal(appliesToLabel("fap"), "ФАП");
  assert.equal(appliesToLabel("all"), "Все типы");
  assert.equal(appliesToLabel(undefined), "Эскадрилья");
});

test("payload несёт contractType, по умолчанию request", () => {
  const formData = { name: "Тест", airportIds: [], geography: [] };
  assert.equal(tariffInputToPayload(formData, "individual").contractType, "request");
  assert.equal(
    tariffInputToPayload(formData, "individual", { appliesTo: "fap" }).contractType,
    "fap",
  );
  assert.equal(
    tariffInputToPayload(formData, "shared", { appliesTo: "мусор" }).contractType,
    "request",
  );
});
