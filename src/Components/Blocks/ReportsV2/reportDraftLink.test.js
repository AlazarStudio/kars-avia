import { test } from "node:test";
import assert from "node:assert/strict";
import {
  REPORT_DRAFT_PARAM,
  REPORT_PARAM,
  draftModeForRole,
  hasReportLink,
  readReportLink,
  resolveEditorTarget,
  withReportLink,
} from "./reportDraftLink.js";

test("param names match backend email links", () => {
  assert.equal(REPORT_DRAFT_PARAM, "reportdraftid");
  assert.equal(REPORT_PARAM, "reportid");
});

test("readReportLink reads and decodes both params", () => {
  assert.deepEqual(readReportLink(new URLSearchParams("?reportdraftid=d%201")), {
    draftId: "d 1",
    reportId: null,
  });
  assert.deepEqual(readReportLink(new URLSearchParams("reportid=r-1&page=2")), {
    draftId: null,
    reportId: "r-1",
  });
  assert.deepEqual(readReportLink(new URLSearchParams("")), { draftId: null, reportId: null });
});

test("readReportLink treats empty values as absent", () => {
  assert.deepEqual(readReportLink(new URLSearchParams("reportdraftid=&reportid=")), {
    draftId: null,
    reportId: null,
  });
});

test("hasReportLink detects either param", () => {
  assert.equal(hasReportLink("?reportdraftid=d-1"), true);
  assert.equal(hasReportLink("?reportid=r-1"), true);
  assert.equal(hasReportLink("?page=1"), false);
  assert.equal(hasReportLink(""), false);
  assert.equal(hasReportLink(undefined), false);
});

test("draftModeForRole mirrors the open buttons of each role", () => {
  assert.equal(draftModeForRole({ showDrafts: true, isAirlineUser: false }), "edit");
  assert.equal(draftModeForRole({ showDrafts: false, isAirlineUser: true }), "review");
  assert.equal(draftModeForRole({ showDrafts: false, isAirlineUser: false }), "view");
});

test("resolveEditorTarget opens a draft link in the role mode", () => {
  assert.deepEqual(resolveEditorTarget({ draftId: "d-1", reportId: null }, new Map(), "review"), {
    draftId: "d-1",
    mode: "review",
  });
});

test("resolveEditorTarget opens a report link as a view of its draft", () => {
  const byReport = new Map([["r-1", "d-9"]]);
  assert.deepEqual(resolveEditorTarget({ draftId: null, reportId: "r-1" }, byReport, "edit"), {
    draftId: "d-9",
    mode: "view",
  });
});

test("resolveEditorTarget gives null for an unknown report or no link", () => {
  assert.equal(resolveEditorTarget({ draftId: null, reportId: "r-x" }, new Map(), "edit"), null);
  assert.equal(resolveEditorTarget({ draftId: null, reportId: null }, new Map(), "edit"), null);
  assert.equal(resolveEditorTarget(null, undefined, "edit"), null);
});

test("withReportLink sets one param, keeps foreign ones, clears on null", () => {
  const base = new URLSearchParams("page=2&reportid=r-1");
  assert.equal(withReportLink(base, { draftId: "d-1" }).toString(), "page=2&reportdraftid=d-1");
  assert.equal(withReportLink(base, { reportId: "r-2" }).toString(), "page=2&reportid=r-2");
  assert.equal(withReportLink(base, null).toString(), "page=2");
  // исходный объект не мутируется
  assert.equal(base.toString(), "page=2&reportid=r-1");
});

test("both params present: the draft link wins", () => {
  const link = readReportLink(new URLSearchParams("reportdraftid=d-1&reportid=r-1"));
  assert.deepEqual(link, { draftId: "d-1", reportId: "r-1" });
  assert.deepEqual(resolveEditorTarget(link, new Map([["r-1", "d-9"]]), "edit"), {
    draftId: "d-1",
    mode: "edit",
  });
});
