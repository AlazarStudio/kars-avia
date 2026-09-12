import { test } from "node:test";
import assert from "node:assert/strict";
import { registryMenuActions } from "./fapRegistryMenu.js";

// Стадии карточки в терминах отметок реестра.
const DRAFT = { submitted: false, approved: false };
const SUBMITTED = { submitted: true, approved: false };
const RETURNED = SUBMITTED; // возвращён АК — та же пара отметок
const APPROVED = { submitted: true, approved: true };

const dispatcher = { isDispatcher: true, canManage: true };
const airline = { isAirline: true };

test("диспетчер с правом управления: по стадиям", () => {
  assert.deepEqual(registryMenuActions({ ...DRAFT, ...dispatcher }), [
    "rebuild",
    "editHeader",
    "submit",
    "downloadInternal",
    "sep",
    "delete",
  ]);
  assert.deepEqual(registryMenuActions({ ...SUBMITTED, ...dispatcher }), [
    "rebuild",
    "editHeader",
    "unsubmit",
    "downloadInternal",
    "sep",
  ]);
  assert.deepEqual(
    registryMenuActions({ ...RETURNED, ...dispatcher }),
    registryMenuActions({ ...SUBMITTED, ...dispatcher })
  );
  assert.deepEqual(registryMenuActions({ ...APPROVED, ...dispatcher }), [
    "downloadInternal",
    "sep",
  ]);
});

test("авиакомпания: утверждение и возврат на доработку", () => {
  assert.deepEqual(registryMenuActions({ ...DRAFT, ...airline }), [
    "download",
    "approve",
    "returnForRework",
  ]);
  assert.deepEqual(registryMenuActions({ ...SUBMITTED, ...airline }), [
    "download",
    "approve",
    "returnForRework",
  ]);
  assert.deepEqual(registryMenuActions({ ...APPROVED, ...airline }), [
    "download",
    "revokeApproval",
  ]);
});

test("прочие роли: только скачивание, диспетчеру без права — с внутренним листом", () => {
  assert.deepEqual(registryMenuActions({ ...SUBMITTED, isDispatcher: true }), [
    "downloadInternal",
  ]);
  assert.deepEqual(registryMenuActions({ ...APPROVED }), ["download"]);
  assert.deepEqual(registryMenuActions(), ["download"]);
});
