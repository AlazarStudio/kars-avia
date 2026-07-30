import test from "node:test";
import assert from "node:assert/strict";
import {
  NOTIFICATION_SECTIONS,
  NOTIFICATION_MASTER_KEYS,
  emailKey,
  sitePushKey,
} from "./notificationSections.js";

test("три секции в текущем порядке", () => {
  assert.deepEqual(
    NOTIFICATION_SECTIONS.map((s) => s.title),
    ["Заявки", "ФАП", "Сообщения"],
  );
});

test("десять событий с текущими подписями", () => {
  assert.deepEqual(
    NOTIFICATION_SECTIONS.flatMap((s) => s.rows.map((r) => r.label)),
    [
      "Создание заявки",
      "Изменение дат заявки",
      "Смена размещения заявки",
      "Отмена заявки",
      "Создание",
      "Запрос на изменение дат",
      "Обновление",
      "Смена размещения",
      "Отмена",
      "Новое сообщение в чате",
    ],
  );
});

test("NOTIFICATION_MASTER_KEYS собирает ключи всех строк без дублей", () => {
  assert.deepEqual(NOTIFICATION_MASTER_KEYS, [
    "requestCreate",
    "requestDatesChange",
    "requestPlacementChange",
    "requestCancel",
    "passengerRequestCreate",
    "passengerRequestDatesChange",
    "passengerRequestUpdate",
    "passengerRequestPlacementChange",
    "passengerRequestCancel",
    "newMessage",
  ]);
  assert.equal(new Set(NOTIFICATION_MASTER_KEYS).size, 10);
});

test("имена канальных ключей выводятся из ключа мастера", () => {
  assert.equal(emailKey("requestCreate"), "emailRequestCreate");
  assert.equal(sitePushKey("requestCreate"), "sitePushRequestCreate");
  assert.equal(emailKey("newMessage"), "emailNewMessage");
  assert.equal(
    sitePushKey("passengerRequestPlacementChange"),
    "sitePushPassengerRequestPlacementChange",
  );
});

test("каждая секция описана полностью", () => {
  for (const section of NOTIFICATION_SECTIONS) {
    assert.equal(typeof section.key, "string");
    assert.equal(typeof section.title, "string");
    assert.ok(section.rows.length > 0, `${section.key}: пустая секция`);
    for (const row of section.rows) {
      assert.match(row.key, /^[a-z][A-Za-z]+$/);
      assert.ok(row.label.length > 0);
    }
  }
});
