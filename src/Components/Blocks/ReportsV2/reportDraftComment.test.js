import { test } from "node:test";
import assert from "node:assert/strict";
import { draftAirlineNote } from "./reportDraftComment.js";

const AT = "2026-09-10T09:00:00.000Z";

test("draftAirlineNote: returned draft is rejected, text trimmed, date kept", () => {
  assert.deepEqual(
    draftAirlineNote({ airlineComment: "  Нет двух гостей  ", airlineCommentAt: AT, rejectedAt: AT }),
    { rejected: true, text: "Нет двух гостей", at: AT }
  );
});

test("draftAirlineNote: resubmitted draft keeps the comment but is not rejected", () => {
  assert.deepEqual(
    draftAirlineNote({ airlineComment: "Нет двух гостей", airlineCommentAt: AT, rejectedAt: null }),
    { rejected: false, text: "Нет двух гостей", at: AT }
  );
});

test("draftAirlineNote: no comment gives null", () => {
  assert.equal(draftAirlineNote({ airlineComment: null, rejectedAt: AT }), null);
  assert.equal(draftAirlineNote({ airlineComment: "   " }), null);
  assert.equal(draftAirlineNote({}), null);
  assert.equal(draftAirlineNote(null), null);
});

test("draftAirlineNote: missing date is null, not undefined", () => {
  assert.deepEqual(draftAirlineNote({ airlineComment: "x" }), {
    rejected: false,
    text: "x",
    at: null,
  });
});
