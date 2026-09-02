import { test } from "node:test";
import assert from "node:assert/strict";
import { buildDraftByReport, splitDraftsByStatus } from "./releasedReports.js";

test("buildDraftByReport maps a released report to its draft", () => {
  const map = buildDraftByReport([
    { id: "draft-1", savedReportId: "report-1" },
    { id: "draft-2", savedReportId: "report-2" },
  ]);
  assert.equal(map.get("report-1"), "draft-1");
  assert.equal(map.get("report-2"), "draft-2");
  assert.equal(map.size, 2);
});

test("buildDraftByReport skips drafts without a released report", () => {
  const map = buildDraftByReport([
    { id: "draft-1", savedReportId: null },
    { id: "draft-2" },
    { id: "draft-3", savedReportId: "" },
    { id: "draft-4", savedReportId: "report-4" },
  ]);
  assert.equal(map.size, 1);
  assert.equal(map.get("report-4"), "draft-4");
});

test("buildDraftByReport keeps the first draft when a report has several", () => {
  // Бэк проставляет savedReportId одному черновику, но пересоздание оставляет
  // историю: если дубль всё-таки случится, экран не должен прыгать между ними.
  const map = buildDraftByReport([
    { id: "draft-old", savedReportId: "report-1" },
    { id: "draft-new", savedReportId: "report-1" },
  ]);
  assert.equal(map.get("report-1"), "draft-old");
});

test("buildDraftByReport on empty or broken input gives an empty map", () => {
  assert.equal(buildDraftByReport([]).size, 0);
  assert.equal(buildDraftByReport(null).size, 0);
  assert.equal(buildDraftByReport(undefined).size, 0);
});

test("splitDraftsByStatus spreads drafts over the three panels", () => {
  const { open, submitted, confirmed } = splitDraftsByStatus([
    { id: "a", status: "DRAFT" },
    { id: "b", status: "SUBMITTED" },
    { id: "c", status: "CONFIRMED" },
    { id: "d", status: "DRAFT" },
  ]);
  assert.deepEqual(open.map((d) => d.id), ["a", "d"]);
  assert.deepEqual(submitted.map((d) => d.id), ["b"]);
  assert.deepEqual(confirmed.map((d) => d.id), ["c"]);
});

test("splitDraftsByStatus keeps the backend order inside each group", () => {
  // Порядок задаёт бэк (свежие сверху) — деление на панели его не пересобирает.
  const { open } = splitDraftsByStatus([
    { id: "new", status: "DRAFT" },
    { id: "mid", status: "SUBMITTED" },
    { id: "old", status: "DRAFT" },
  ]);
  assert.deepEqual(open.map((d) => d.id), ["new", "old"]);
});

test("splitDraftsByStatus drops unknown and broken entries", () => {
  // Незнакомый статус не должен попасть в «Незавершённые»: панель открывает
  // строки на правку, а правится только DRAFT.
  const { open, submitted, confirmed } = splitDraftsByStatus([
    { id: "a", status: "ARCHIVED" },
    { id: "b" },
    null,
    undefined,
  ]);
  assert.equal(open.length, 0);
  assert.equal(submitted.length, 0);
  assert.equal(confirmed.length, 0);
});

test("splitDraftsByStatus on empty or broken input gives three empty lists", () => {
  for (const input of [[], null, undefined]) {
    const groups = splitDraftsByStatus(input);
    assert.deepEqual(groups, { open: [], submitted: [], confirmed: [] });
  }
});
