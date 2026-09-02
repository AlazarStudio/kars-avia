import { test } from "node:test";
import assert from "node:assert/strict";
import { canDeleteReport } from "./reportsV2Access.js";
import { roles } from "../../../roles.js";

test("canDeleteReport allows SUPERADMIN and DISPATCHERADMIN without the key", () => {
  assert.equal(canDeleteReport({ role: roles.superAdmin }, {}), true);
  assert.equal(canDeleteReport({ role: roles.dispatcerAdmin }, {}), true);
  // accessMenu вовсе может не приехать — гейт по роли не должен от него зависеть
  assert.equal(canDeleteReport({ role: roles.superAdmin }, null), true);
  assert.equal(canDeleteReport({ role: roles.dispatcerAdmin }, undefined), true);
});

test("canDeleteReport denies other roles without reportDelete", () => {
  assert.equal(canDeleteReport({ role: roles.dispatcherModerator }, {}), false);
  assert.equal(canDeleteReport({ role: roles.airlineAdmin }, {}), false);
  assert.equal(canDeleteReport({ role: roles.airlineModerator }, {}), false);
  assert.equal(canDeleteReport({ role: roles.hotelAdmin }, {}), false);
  assert.equal(canDeleteReport({ role: roles.hotelModerator }, {}), false);
});

test("canDeleteReport lets the reportDelete key open deletion for the rest", () => {
  assert.equal(
    canDeleteReport({ role: roles.airlineAdmin }, { reportDelete: true }),
    true,
  );
  assert.equal(
    canDeleteReport({ role: roles.hotelAdmin }, { reportDelete: true }),
    true,
  );
  assert.equal(
    canDeleteReport({ role: roles.dispatcherModerator }, { reportDelete: true }),
    true,
  );
});

test("canDeleteReport on empty input denies", () => {
  assert.equal(canDeleteReport(null, null), false);
  assert.equal(canDeleteReport(undefined, undefined), false);
  assert.equal(canDeleteReport({}, { reportDelete: false }), false);
});
