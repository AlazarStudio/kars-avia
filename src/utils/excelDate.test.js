import { test } from "node:test";
import assert from "node:assert/strict";
import { excelSerialToParts, fmtDate, fmtTime } from "./excelDate.js";

// Значения серийников сняты из реального MRV-файла (MMK OCT.xlsx) и сверены с XLSX.SSF

test("Excel-серийник даты → DD.MM.YYYY", () => {
  assert.equal(fmtDate(45931), "01.10.2025");
  assert.equal(fmtDate(45932), "02.10.2025");
  assert.equal(fmtDate(45933), "03.10.2025");
});

test("доля суток → HH:MM (округление до секунды, иначе 00:34 вместо 00:35)", () => {
  assert.equal(fmtTime(0.024305555555555556), "00:35");
  assert.equal(fmtTime(0.16666666666666666), "04:00");
});

test("полдень: 0.5 → 12:00", () => {
  assert.equal(fmtTime(0.5), "12:00");
});

test("серийник с дробной частью: дата и время из одной ячейки", () => {
  assert.equal(fmtDate(45931.5), "01.10.2025");
  assert.equal(fmtTime(45931.5), "12:00");
});

test("Date-объект форматируется с ведущими нулями", () => {
  assert.equal(fmtDate(new Date(2026, 5, 15)), "15.06.2026");
  assert.equal(fmtTime(new Date(2026, 5, 15, 7, 5)), "07:05");
});

test("строка проходит насквозь", () => {
  assert.equal(fmtDate("15.06.2026"), "15.06.2026");
  assert.equal(fmtTime("7:05"), "7:05");
});

test("пустые значения → пустая строка", () => {
  assert.equal(fmtDate(null), "");
  assert.equal(fmtDate(undefined), "");
  assert.equal(fmtDate(""), "");
  assert.equal(fmtTime(null), "");
  assert.equal(fmtTime(undefined), "");
  assert.equal(fmtTime(""), "");
});

test("нечисловые серийники → null, fmtDate не падает", () => {
  assert.equal(excelSerialToParts(NaN), null);
  assert.equal(excelSerialToParts(Infinity), null);
  assert.doesNotThrow(() => fmtDate(NaN));
  assert.equal(fmtDate(NaN), "NaN"); // фоллбэк s(v) как в оригинале
});

test("граница мнимого 29.02.1900: сдвиг эпохи до и после серийника 60", () => {
  assert.deepEqual(excelSerialToParts(61), { y: 1900, m: 3, d: 1, H: 0, M: 0, S: 0 });
  assert.deepEqual(excelSerialToParts(59), { y: 1900, m: 2, d: 28, H: 0, M: 0, S: 0 });
});

test("округление секунд переносит на следующие сутки", () => {
  const parts = excelSerialToParts(45931.9999999);
  assert.equal(parts.d, 2);
  assert.equal(parts.H, 0);
  assert.equal(parts.M, 0);
});
