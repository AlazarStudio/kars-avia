import test from "node:test";
import assert from "node:assert/strict";
import { buildNotificationPayload } from "./notificationPayload.js";

test("payload содержит ровно 30 ключей", () => {
  assert.equal(Object.keys(buildNotificationPayload({})).length, 30);
});

test("выключенный мастер гасит оба своих канала", () => {
  const payload = buildNotificationPayload({
    requestCreate: false,
    emailRequestCreate: true,
    sitePushRequestCreate: true,
  });
  assert.equal(payload.requestCreate, false);
  assert.equal(payload.emailRequestCreate, false);
  assert.equal(payload.sitePushRequestCreate, false);
});

test("включённый мастер пропускает каналы как есть", () => {
  const payload = buildNotificationPayload({
    newMessage: true,
    emailNewMessage: true,
    sitePushNewMessage: false,
  });
  assert.equal(payload.newMessage, true);
  assert.equal(payload.emailNewMessage, true);
  assert.equal(payload.sitePushNewMessage, false);
});

test("пустое и невалидное состояние дают все false, без исключений", () => {
  for (const input of [undefined, null, {}]) {
    const payload = buildNotificationPayload(input);
    assert.equal(Object.values(payload).every((v) => v === false), true);
  }
});

test("значения всегда булевы, а не исходные truthy", () => {
  const payload = buildNotificationPayload({ newMessage: 1, emailNewMessage: "да" });
  assert.equal(payload.newMessage, true);
  assert.equal(payload.emailNewMessage, true);
});
