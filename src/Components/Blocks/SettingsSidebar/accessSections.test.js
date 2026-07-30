import test from "node:test";
import assert from "node:assert/strict";
import {
  ACCESS_SECTIONS,
  DISPATCHER_SECTION_KEYS,
  AIRLINE_SECTION_KEYS,
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

test("наборы ключей и ACCESS_SECTIONS описывают один и тот же набор секций", () => {
  const described = new Set(ACCESS_SECTIONS.map((s) => s.key));

  for (const [name, keys] of [
    ["DISPATCHER_SECTION_KEYS", DISPATCHER_SECTION_KEYS],
    ["AIRLINE_SECTION_KEYS", AIRLINE_SECTION_KEYS],
  ]) {
    assert.equal(new Set(keys).size, keys.length, `${name}: дубли ключей`);
    for (const key of keys) {
      // опечатка здесь молча выкинула бы карточку с экрана: панель делает
      // ACCESS_SECTIONS.find(...) и при промахе рендерит null
      assert.ok(described.has(key), `${name}: секция "${key}" не описана в ACCESS_SECTIONS`);
    }
  }

  for (const key of described) {
    assert.ok(
      DISPATCHER_SECTION_KEYS.includes(key),
      `ACCESS_SECTIONS: секция "${key}" не показывается ни на одном экране`,
    );
  }
});

test("у аналитики нет строк действий — выгрузка закомментирована в обеих панелях", () => {
  const analytics = ACCESS_SECTIONS.find((s) => s.key === "analytics");
  assert.deepEqual(analytics.rows, []);
});

test("секция пассажиров называется «ФАП»", () => {
  const passengers = ACCESS_SECTIONS.find((s) => s.key === "passengers");
  assert.equal(passengers.title, "ФАП");
});
