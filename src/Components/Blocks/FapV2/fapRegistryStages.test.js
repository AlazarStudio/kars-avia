import { test } from "node:test";
import assert from "node:assert/strict";
import {
  REGISTRY_STAGE_OPTIONS,
  registryStageLabel,
  registryStageDate,
  registryKindLabel,
  REGISTRY_KIND_OPTIONS,
} from "./fapRegistryStages.js";

test("подписи стадий и виды", () => {
  assert.equal(registryStageLabel("DRAFT"), "Сформирован");
  assert.equal(registryStageLabel("SUBMITTED"), "Отправлен АК");
  assert.equal(registryStageLabel("RETURNED"), "Возвращён АК");
  assert.equal(registryStageLabel("APPROVED"), "Утверждён АК");
  assert.equal(registryStageLabel("X"), "X");
  assert.deepEqual(REGISTRY_STAGE_OPTIONS.map((o) => o.value), [null, "DRAFT", "SUBMITTED", "RETURNED", "APPROVED"]);
  assert.equal(registryKindLabel("BAGGAGE"), "Доставка багажа");
  assert.equal(registryKindLabel("CATERING"), "Вода и питание");
  assert.deepEqual(REGISTRY_KIND_OPTIONS.map((o) => o.value), [null, "BAGGAGE", "CATERING"]);
});

test("дата стадии — по её отметке", () => {
  const r = { submittedAt: "2026-07-01T10:00:00Z", airlineCommentAt: "2026-07-02T10:00:00Z", airlineApprovedAt: null };
  assert.equal(registryStageDate({ ...r, stage: "SUBMITTED" }), "2026-07-01T10:00:00Z");
  assert.equal(registryStageDate({ ...r, stage: "RETURNED" }), "2026-07-02T10:00:00Z");
  assert.equal(registryStageDate({ ...r, stage: "DRAFT" }), null);
});
