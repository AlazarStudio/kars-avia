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
    "travelline",
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
    "travelline",
  ]);
});

test("defaultSectionKeys выбирает набор по типу", () => {
  assert.deepEqual(defaultSectionKeys("dispatcher"), DISPATCHER_SECTION_KEYS);
  assert.deepEqual(defaultSectionKeys("airline"), AIRLINE_SECTION_KEYS);
  assert.deepEqual(defaultSectionKeys(undefined), DISPATCHER_SECTION_KEYS);
});

test("каждая секция описана полностью и ключи строк уникальны", () => {
  assert.equal(ACCESS_SECTIONS.length, 11);
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

test("extras описаны отдельно от rows и не пересекаются с ними", () => {
  for (const section of ACCESS_SECTIONS) {
    const extras = section.extras || [];
    assert.ok(Array.isArray(extras), `${section.key}: extras должен быть массивом`);
    const rowKeys = new Set(section.rows.map((r) => r.key));
    for (const extra of extras) {
      assert.equal(typeof extra.label, "string");
      assert.ok(extra.label.length > 0);
      assert.ok(
        !rowKeys.has(extra.key),
        `${section.key}: ключ "${extra.key}" объявлен и в rows, и в extras`,
      );
    }
  }
});

test("правка завершённой заявки — отдельный переключатель секции ФАП", () => {
  const passengers = ACCESS_SECTIONS.find((s) => s.key === "passengers");
  assert.deepEqual(
    (passengers.extras || []).map((e) => e.key),
    ["editCompleted"],
  );
});

test("удаление отчёта — отдельный переключатель секции «Отчёты»", () => {
  // В rows его класть нельзя: «Взаимодействие с разделом» включает все строки
  // разом, и необратимое удаление приезжало бы вместе с созданием.
  const reports = ACCESS_SECTIONS.find((s) => s.key === "reports");
  assert.deepEqual((reports.extras || []).map((e) => e.key), ["delete"]);
  assert.equal(reports.extras[0].label, "Удаление");
  assert.equal(reports.rows.some((r) => r.key === "delete"), false);
});

test("секция TravelLine описана одной строкой доступа", () => {
  const tl = ACCESS_SECTIONS.find((s) => s.key === "travelline");
  assert.equal(tl.title, "TravelLine");
  assert.deepEqual(tl.rows, []);
});

test("управление доступами — строка внутри «Пользователей», а не своя секция", () => {
  // Право гейтит шестерёнку отдела и кнопку «Должности и доступ» именно в этом
  // разделе, поэтому визуально оно относится к нему.
  assert.equal(ACCESS_SECTIONS.some((s) => s.key === "accessManagement"), false);

  const users = ACCESS_SECTIONS.find((s) => s.key === "users");
  const extra = (users.extras || []).find((e) => e.key === "manageAccess");
  assert.ok(extra, "у секции «Пользователи» нет строки manageAccess");
  assert.equal(extra.label, "Управление доступами");
  assert.equal(extra.requiresAccessManage, true);
});

test("под собственным правом скрывается ровно одна строка", () => {
  const restricted = ACCESS_SECTIONS.flatMap((s) =>
    (s.extras || [])
      .filter((e) => e.requiresAccessManage)
      .map((e) => `${s.key}.${e.key}`),
  );
  assert.deepEqual(restricted, ["users.manageAccess"]);
});
