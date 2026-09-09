import test from "node:test";
import assert from "node:assert/strict";
import { roles } from "../../../../roles.js";
import { ANALYTICS_TABS, visibleAnalyticsTabs } from "./analyticsTabs.js";

test("обе вкладки описаны в порядке эскадрилья → пассажиры", () => {
  assert.deepEqual(
    ANALYTICS_TABS.map((t) => [t.key, t.label, t.accessKey]),
    [
      ["squadron", "Эскадрилья", "analyticsMenu"],
      ["passengers", "Пассажиры", "analyticsPassengerMenu"],
    ],
  );
});

test("каждая вкладка гейтится своим ключом", () => {
  assert.deepEqual(
    visibleAnalyticsTabs({ analyticsMenu: true }).map((t) => t.key),
    ["squadron"],
  );
  assert.deepEqual(
    visibleAnalyticsTabs({ analyticsPassengerMenu: true }).map((t) => t.key),
    ["passengers"],
  );
  assert.deepEqual(
    visibleAnalyticsTabs({
      analyticsMenu: true,
      analyticsPassengerMenu: true,
    }).map((t) => t.key),
    ["squadron", "passengers"],
  );
  assert.deepEqual(visibleAnalyticsTabs({}), []);
  assert.deepEqual(visibleAnalyticsTabs(null), []);
});

test("суперадмину отдаются обе вкладки без accessMenu", () => {
  // SuperAdminContent рендерит <Analytics user={user} /> без accessMenu.
  assert.deepEqual(
    visibleAnalyticsTabs(null, { role: roles.superAdmin }).map((t) => t.key),
    ["squadron", "passengers"],
  );
});
