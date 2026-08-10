import { test } from "node:test";
import assert from "node:assert/strict";
import { STALE_DRAFT_DAYS, getDraftAgeDays, isDraftStale } from "./reportDraftAge.js";

const DAY_MS = 24 * 60 * 60 * 1000;
const daysAgoISO = (days) => new Date(Date.now() - days * DAY_MS).toISOString();

test("невалидный createdAt даёт null/false", () => {
  for (const value of [null, undefined, "", "not-a-date"]) {
    assert.equal(getDraftAgeDays(value), null);
    assert.equal(isDraftStale(value), false);
  }
});

test("ровно порог — черновик ещё не устарел", () => {
  // Date.now() зафиксирован на время теста, чтобы сравнение с порогом было
  // точным, а не зависело от миллисекунд, утёкших между вычислением
  // createdAt и вызовом функции.
  const originalNow = Date.now;
  const fixedNow = originalNow();
  Date.now = () => fixedNow;
  try {
    const createdAt = new Date(fixedNow - STALE_DRAFT_DAYS * DAY_MS).toISOString();
    assert.equal(getDraftAgeDays(createdAt), STALE_DRAFT_DAYS);
    assert.equal(isDraftStale(createdAt), false);
  } finally {
    Date.now = originalNow;
  }
});

test("старше порога — черновик устарел", () => {
  const createdAt = daysAgoISO(STALE_DRAFT_DAYS + 1);
  assert.ok(getDraftAgeDays(createdAt) > STALE_DRAFT_DAYS);
  assert.equal(isDraftStale(createdAt), true);
});

test("младше порога — черновик не устарел", () => {
  const createdAt = daysAgoISO(STALE_DRAFT_DAYS - 1);
  assert.ok(getDraftAgeDays(createdAt) < STALE_DRAFT_DAYS);
  assert.equal(isDraftStale(createdAt), false);
});
