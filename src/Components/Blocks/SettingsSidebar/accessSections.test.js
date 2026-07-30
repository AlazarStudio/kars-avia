import test from "node:test";
import assert from "node:assert/strict";
import {
  ACCESS_SECTIONS,
  DISPATCHER_SECTION_KEYS,
  AIRLINE_SECTION_KEYS,
  LEGACY_SECTION_KEYS,
  defaultSectionKeys,
} from "./accessSections.js";

test("порядок секций диспетчера совпадает с текущим сайдбаром", () => {
  assert.deepEqual(DISPATCHER_SECTION_KEYS, [
    "squadron",
    "passengers",
    "transfer",
    "organization",
    "users",
    "employees",
    "contracts",
    "analytics",
    "aboutAirlines",
    "reports",
  ]);
});

test("у авиакомпании скрыты автопарк и реестр договоров, порядок остальных сохранён", () => {
  assert.deepEqual(AIRLINE_SECTION_KEYS, [
    "squadron",
    "passengers",
    "transfer",
    "users",
    "employees",
    "analytics",
    "aboutAirlines",
    "reports",
  ]);
});

test("легаси-порядок заканчивается автопарком", () => {
  assert.equal(LEGACY_SECTION_KEYS.at(-1), "organization");
  assert.equal(LEGACY_SECTION_KEYS.length, 10);
  assert.deepEqual([...LEGACY_SECTION_KEYS].sort(), [...DISPATCHER_SECTION_KEYS].sort());
});

test("defaultSectionKeys выбирает набор по типу", () => {
  assert.deepEqual(defaultSectionKeys("dispatcher"), DISPATCHER_SECTION_KEYS);
  assert.deepEqual(defaultSectionKeys("airline"), AIRLINE_SECTION_KEYS);
  assert.deepEqual(defaultSectionKeys(undefined), DISPATCHER_SECTION_KEYS);
});

test("каждая секция описана полностью и ключи строк уникальны", () => {
  assert.equal(ACCESS_SECTIONS.length, 10);
  for (const section of ACCESS_SECTIONS) {
    assert.equal(typeof section.key, "string");
    assert.equal(typeof section.title, "string");
    assert.ok(Array.isArray(section.rows), `${section.key}: rows должен быть массивом`);
    const rowKeys = section.rows.map((r) => r.key);
    assert.equal(new Set(rowKeys).size, rowKeys.length, `${section.key}: дубли ключей строк`);
    for (const row of section.rows) {
      assert.equal(typeof row.label, "string");
      assert.ok(row.label.length > 0);
    }
  }
});

test("у аналитики нет строк действий — выгрузка закомментирована в обеих панелях", () => {
  const analytics = ACCESS_SECTIONS.find((s) => s.key === "analytics");
  assert.deepEqual(analytics.rows, []);
});

test("секция пассажиров называется по-разному в сайдбаре и на легаси-странице", () => {
  const passengers = ACCESS_SECTIONS.find((s) => s.key === "passengers");
  assert.equal(passengers.title, "ФАП");
  assert.equal(passengers.detailedTitle, "Пассажиры");
});
