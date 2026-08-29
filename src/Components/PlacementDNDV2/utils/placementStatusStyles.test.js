import { test } from "node:test";
import assert from "node:assert/strict";
import { STATUS_STYLES, getStatusStyle } from "./placementStatusStyles.js";
import { translateStatus } from "./placementTransforms.js";

// Сырые коды, которые translateStatus умеет переводить в русские подписи.
// «Неизвестно» (default-ветка) в карту стилей намеренно не входит.
const RAW_STATUSES = [
  "done",
  "extended",
  "reduced",
  "transferred",
  "earlyStart",
  "archived",
  "archiving",
];

const DEFAULT_STYLE = { edge: "#6b7090", tint: "#eef1f7" };
const LEGACY_STYLE = { edge: "#c3c8d9", tint: "#f6f7fa" };

const HEX = /^#[0-9a-fA-F]{6}$/;

test("каждый переводимый статус имеет запись в STATUS_STYLES", () => {
  for (const raw of RAW_STATUSES) {
    const status = translateStatus(raw);
    const style = STATUS_STYLES[status];
    assert.ok(style, `нет стиля для статуса «${status}» (код ${raw})`);
    assert.match(style.edge, HEX);
    assert.match(style.tint, HEX);
  }
});

test("в STATUS_STYLES нет ключей сверх подписей translateStatus", () => {
  const known = new Set(RAW_STATUSES.map((raw) => translateStatus(raw)));
  for (const key of Object.keys(STATUS_STYLES)) {
    assert.ok(known.has(key), `лишний ключ в STATUS_STYLES: «${key}»`);
  }
});

test("getStatusStyle отдаёт стиль статуса для заявки", () => {
  assert.deepEqual(getStatusStyle("Забронирован"), {
    edge: "#2e7d32",
    tint: "#e8f5e9",
  });
  assert.deepEqual(getStatusStyle("Продлен", true), {
    edge: "#0057C3",
    tint: "#e7effa",
  });
});

test("«Неизвестно» (default-ветка translateStatus) → DEFAULT", () => {
  assert.deepEqual(getStatusStyle(translateStatus("что-то новое")), DEFAULT_STYLE);
});

test("«Ожидает» (неразмещённая заявка) → DEFAULT", () => {
  assert.deepEqual(getStatusStyle("Ожидает"), DEFAULT_STYLE);
});

test("пустые значения статуса → DEFAULT", () => {
  for (const value of [null, undefined, ""]) {
    assert.deepEqual(getStatusStyle(value), DEFAULT_STYLE);
  }
});

test("isRequest:false → LEGACY при любом статусе", () => {
  for (const raw of RAW_STATUSES) {
    assert.deepEqual(getStatusStyle(translateStatus(raw), false), LEGACY_STYLE);
  }
  assert.deepEqual(getStatusStyle("Ожидает", false), LEGACY_STYLE);
  assert.deepEqual(getStatusStyle(null, false), LEGACY_STYLE);
});
