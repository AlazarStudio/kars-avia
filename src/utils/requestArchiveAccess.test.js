import test from "node:test";
import assert from "node:assert/strict";
import {
  isRequestArchived,
  canEditArchivedRequest,
  isArchiveEditLocked,
} from "./requestArchiveAccess.js";
import { roles } from "../roles.js";

const dispatcher = { role: roles.dispatcerAdmin };
const superAdmin = { role: roles.superAdmin };
const external = { role: roles.dispatcerAdmin, subjectType: "EXTERNAL_USER" };
const WITH = { requestUpdateCompleted: true };
const WITHOUT = { requestUpdateCompleted: false };

test("архив по статусу archived", () => {
  assert.equal(isRequestArchived({ status: "archived" }), true);
});

test("архив по флагу archive при другом статусе — как на сервере", () => {
  assert.equal(isRequestArchived({ status: "archiving", archive: true }), true);
});

test("archiving, canceled, done, extended — не архив", () => {
  for (const status of ["archiving", "canceled", "done", "extended"]) {
    assert.equal(isRequestArchived({ status }), false, status);
  }
});

test("статус нормализуется: регистр и пробелы", () => {
  assert.equal(isRequestArchived({ status: " Archived " }), true);
});

test("пустая заявка — не архив и не заперта", () => {
  assert.equal(isRequestArchived(null), false);
  assert.equal(isRequestArchived(undefined), false);
  assert.equal(isArchiveEditLocked(null, WITHOUT, dispatcher), false);
});

test("право: диспетчер с ключом — может, без ключа — нет", () => {
  assert.equal(canEditArchivedRequest(WITH, dispatcher), true);
  assert.equal(canEditArchivedRequest(WITHOUT, dispatcher), false);
  assert.equal(canEditArchivedRequest(undefined, dispatcher), false);
});

test("право: суперадмин проходит без ключа", () => {
  assert.equal(canEditArchivedRequest(WITHOUT, superAdmin), true);
  assert.equal(canEditArchivedRequest(undefined, superAdmin), true);
});

test("право: внешний пользователь не проходит даже с ключом", () => {
  assert.equal(canEditArchivedRequest(WITH, external), false);
});

test("замок: архив без права заперт, с правом открыт, не архив — открыт", () => {
  const archived = { status: "archived" };
  assert.equal(isArchiveEditLocked(archived, WITHOUT, dispatcher), true);
  assert.equal(isArchiveEditLocked(archived, WITH, dispatcher), false);
  assert.equal(isArchiveEditLocked({ status: "done" }, WITHOUT, dispatcher), false);
});
