import test from "node:test";
import assert from "node:assert/strict";
import { canEditCompletedRequest, isRequestEditLocked } from "./fapEditAccess.js";

const DISPATCHER = { role: "DISPATCHERADMIN" };
const SUPER = { role: "SUPERADMIN" };
const EXT_HOTEL = { subjectType: "EXTERNAL_USER", scope: "HOTEL" };

const WITH = { reserveUpdate: true, reserveUpdateCompleted: true };
const WITHOUT = { reserveUpdate: true, reserveUpdateCompleted: false };

test("завершённая заявка заперта без права", () => {
  assert.equal(
    isRequestEditLocked({ status: "COMPLETED" }, WITHOUT, DISPATCHER),
    true,
  );
});

test("завершённая заявка открыта при наличии права", () => {
  assert.equal(
    isRequestEditLocked({ status: "COMPLETED" }, WITH, DISPATCHER),
    false,
  );
});

test("внешней гостинице право выдать нельзя — завершённая заперта всегда", () => {
  assert.equal(canEditCompletedRequest(WITH, EXT_HOTEL), false);
  assert.equal(
    isRequestEditLocked({ status: "COMPLETED" }, WITH, EXT_HOTEL),
    true,
  );
});

test("суперадмин проходит мимо ключа — как везде в системе", () => {
  assert.equal(canEditCompletedRequest(WITHOUT, SUPER), true);
  assert.equal(isRequestEditLocked({ status: "COMPLETED" }, WITHOUT, SUPER), false);
});

// Обратные проверки: правило не должно задеть ничего, кроме COMPLETED.
test("отменённая заперта даже с правом", () => {
  assert.equal(isRequestEditLocked({ status: "CANCELLED" }, WITH, DISPATCHER), true);
});

test("незавершённые статусы правило не трогает", () => {
  for (const status of ["CREATED", "ACCEPTED", "IN_PROGRESS"]) {
    assert.equal(
      isRequestEditLocked({ status }, WITHOUT, DISPATCHER),
      false,
      `статус ${status} не должен запираться`,
    );
  }
});

test("пока заявка грузится, экран не запирается", () => {
  // request пуст при loading; true запер бы экран у всех заявок подряд
  assert.equal(isRequestEditLocked(undefined, WITHOUT, DISPATCHER), false);
});
