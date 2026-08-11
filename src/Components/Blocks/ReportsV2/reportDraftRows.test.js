import { test } from "node:test";
import assert from "node:assert/strict";
import {
  DRAFT_ROW_FIELDS,
  EDITABLE_FIELDS,
  attachRowKeys,
  recalcRow,
  stripRow,
  prepareRowsForSave,
  rowsEqual,
  sumTotalDebt,
  rowNeedsPrice,
  rowNeedsDays,
  measureSavePayload,
  SAVE_PAYLOAD_LIMIT_BYTES,
} from "./reportDraftRows.js";

const baseRow = {
  index: 1,
  requestId: "req-1",
  arrival: "01.07.2026 14:30",
  departure: "03.07.2026 11:00",
  totalDays: 2.5,
  category: "Двухместный",
  personName: "Иванов И. И.",
  personPosition: "КВС",
  roomName: "101",
  roomId: "room-1",
  shareNote: "жил один",
  breakfastCount: 2,
  lunchCount: 2,
  dinnerCount: 1,
  breakfastIncludedInPrice: false,
  totalMealCost: 1400,
  totalLivingCost: 11250,
  pricePerDay: 4500,
  totalDebt: 12650,
  hotelName: "Кайфа",
};

test("attachRowKeys assigns stable unique keys", () => {
  const rows = attachRowKeys([baseRow, { ...baseRow, index: 2 }]);
  assert.equal(rows[0]._uid, 0);
  assert.equal(rows[1]._uid, 1);
  assert.equal(rows[0].personName, "Иванов И. И.");
});

test("attachRowKeys tolerates a missing array", () => {
  assert.deepEqual(attachRowKeys(null), []);
});

test("recalcRow derives living cost and total", () => {
  const row = recalcRow({ ...baseRow, totalDays: 3 });
  assert.equal(row.totalLivingCost, 13500);
  assert.equal(row.totalDebt, 14900);
});

test("recalcRow rounds the living cost", () => {
  const row = recalcRow({ ...baseRow, totalDays: 2.5, pricePerDay: 3333 });
  assert.equal(row.totalLivingCost, 8333);
});

test("recalcRow treats a null price as zero without crashing", () => {
  const row = recalcRow({ ...baseRow, pricePerDay: null, totalMealCost: 600 });
  assert.equal(row.totalLivingCost, 0);
  assert.equal(row.totalDebt, 600);
});

test("recalcRow handles the strings that number inputs produce", () => {
  const row = recalcRow({
    ...baseRow,
    totalDays: "2.5",
    pricePerDay: "4500",
    totalMealCost: "600",
  });
  assert.equal(row.totalLivingCost, 11250);
  assert.equal(row.totalDebt, 11850);
});

test("rowNeedsPrice flags a priced-out row that still has days", () => {
  assert.equal(rowNeedsPrice({ ...baseRow, pricePerDay: null }), true);
  assert.equal(rowNeedsPrice({ ...baseRow, pricePerDay: 0 }), true);
  assert.equal(rowNeedsPrice({ ...baseRow, pricePerDay: null, totalDays: 0 }), false);
  assert.equal(rowNeedsPrice(baseRow), false);
});

test("rowNeedsDays flags a row with no (or non-positive) living days", () => {
  assert.equal(rowNeedsDays({ ...baseRow, totalDays: null }), true);
  assert.equal(rowNeedsDays({ ...baseRow, totalDays: 0 }), true);
  assert.equal(rowNeedsDays({ ...baseRow, totalDays: -1 }), true);
  assert.equal(rowNeedsDays(baseRow), false);
});

test("clearing the days field collapses the row to zero and rowNeedsPrice stays quiet", () => {
  const row = recalcRow({ ...baseRow, totalDays: "" });
  assert.equal(row.totalLivingCost, 0);
  assert.equal(row.totalDebt, 1400);
  assert.equal(rowNeedsPrice(row), false);
});

test("stripRow drops client and apollo keys", () => {
  const row = stripRow({ ...baseRow, _uid: 7, __typename: "ReportDraftRow", junk: 1 });
  assert.equal("_uid" in row, false);
  assert.equal("__typename" in row, false);
  assert.equal("junk" in row, false);
  assert.equal(Object.keys(row).length, DRAFT_ROW_FIELDS.length);
});

test("stripRow keeps a null price as null", () => {
  const row = stripRow({ ...baseRow, pricePerDay: null });
  assert.equal(row.pricePerDay, null);
});

test("prepareRowsForSave renumbers from one after a deletion", () => {
  const rows = prepareRowsForSave([
    { ...baseRow, index: 2, _uid: 1 },
    { ...baseRow, index: 5, _uid: 4 },
  ]);
  assert.equal(rows[0].index, 1);
  assert.equal(rows[1].index, 2);
  assert.equal("_uid" in rows[0], false);
});

test("rowsEqual ignores client keys and compares by position", () => {
  const a = [{ ...baseRow, _uid: 0, __typename: "ReportDraftRow" }];
  const b = [{ ...baseRow }];
  assert.equal(rowsEqual(a, b), true);
  assert.equal(rowsEqual(a, [{ ...baseRow, totalDays: 9 }]), false);
  assert.equal(rowsEqual(a, []), false);
});

test("rowsEqual is blind to raw index values but catches reordering", () => {
  const a = [{ ...baseRow, index: 5 }];
  const b = [{ ...baseRow, index: 999 }];
  assert.equal(rowsEqual(a, b), true);

  const first = { ...baseRow, personName: "Первый" };
  const second = { ...baseRow, personName: "Второй" };
  assert.equal(rowsEqual([first, second], [second, first]), false);
});

test("sumTotalDebt adds up and survives junk", () => {
  assert.equal(sumTotalDebt([baseRow, { ...baseRow, totalDebt: 100 }]), 12750);
  assert.equal(sumTotalDebt([{ ...baseRow, totalDebt: null }]), 0);
  assert.equal(sumTotalDebt([]), 0);
});

test("editable fields are exactly the three agreed ones", () => {
  assert.deepEqual(EDITABLE_FIELDS, ["totalDays", "pricePerDay", "totalMealCost"]);
});

test("save payload limit mirrors JSON_BODY_LIMIT=2mb on the backend", () => {
  assert.equal(SAVE_PAYLOAD_LIMIT_BYTES, 2 * 1024 * 1024);
});

test("measureSavePayload counts UTF-8 bytes, not string length", () => {
  // Кириллица занимает два байта на символ вместо одного, поэтому три русские
  // буквы вместо трёх латинских дают ровно три лишних байта. String.length
  // такой разницы не видит и занизил бы размер.
  const ascii = measureSavePayload([{ ...baseRow, personName: "AAA" }]);
  const cyrillic = measureSavePayload([{ ...baseRow, personName: "ЯЯЯ" }]);
  assert.equal(cyrillic.bytes, ascii.bytes + 3);

  const asLength = JSON.stringify(prepareRowsForSave([{ ...baseRow, personName: "ЯЯЯ" }])).length;
  assert.ok(cyrillic.bytes > asLength);
});

test("measureSavePayload flags only payloads over the limit", () => {
  const small = measureSavePayload([baseRow]);
  assert.equal(small.exceeds, false);
  assert.equal(small.limit, SAVE_PAYLOAD_LIMIT_BYTES);
  assert.ok(small.bytes > 0);

  // 227 строк — реальный черновик владельца. На лимите 2mb он проходит; до
  // подъёма лимита на бэке падал, и тест на это же число тогда ждал обратного.
  const real = measureSavePayload(Array.from({ length: 227 }, () => ({ ...baseRow })));
  assert.equal(real.exceeds, false);
  assert.equal(real.rowCount, 227);

  const huge = measureSavePayload(Array.from({ length: 6000 }, () => ({ ...baseRow })));
  assert.equal(huge.exceeds, true);
  assert.ok(huge.bytes > SAVE_PAYLOAD_LIMIT_BYTES);
});

test("measureSavePayload derives the row cap from the actual row weight", () => {
  const huge = measureSavePayload(Array.from({ length: 6000 }, () => ({ ...baseRow })));
  // Столько строк такого же веса влезает в лимит — меньше, чем есть сейчас.
  assert.ok(huge.maxRows > 0);
  assert.ok(huge.maxRows < huge.rowCount);

  // Строки тяжелее — влезает меньше. Число не задано константой, а считается.
  const heavy = measureSavePayload(
    Array.from({ length: 6000 }, () => ({ ...baseRow, personName: "Я".repeat(200) }))
  );
  assert.ok(heavy.maxRows < huge.maxRows);
});

test("measureSavePayload survives junk input", () => {
  const empty = measureSavePayload([]);
  assert.equal(empty.bytes, 2); // "[]"
  assert.equal(empty.exceeds, false);
  assert.equal(empty.rowCount, 0);
  assert.equal(empty.maxRows, 0); // без строк делить не на что — не NaN и не Infinity

  const junk = measureSavePayload(null);
  assert.equal(junk.exceeds, false);
  assert.equal(junk.maxRows, 0);
});
