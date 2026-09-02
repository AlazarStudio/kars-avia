import test from "node:test";
import assert from "node:assert/strict";
import {
  manifestUploadName,
  parseManifestFile,
  isManifestFile,
  manifestFilesNewestFirst,
} from "./fapManifestFiles.js";

// Путь загрузки бэка: /files/uploads/passenger-requests/<id>/YYYY/MM/DD/<file>
const uploadPath = (file, ymd = "2026/09/02") =>
  `/files/uploads/passenger-requests/ckreq1/${ymd}/${file}`;

// ── Имя файла при загрузке ──

test("имя: латинский рейс — кириллица исходного имени не важна, расширение сохранено", () => {
  assert.equal(
    manifestUploadName("Манифест FV6346.xlsx", "FV6346"),
    "manifest-fv6346.xlsx"
  );
});

test("имя: кириллица в рейсе схлопывается в дефисы и срезается с краёв", () => {
  assert.equal(manifestUploadName("m.xlsx", "СУ 1234"), "manifest-1234.xlsx");
});

test("имя: рейс целиком кириллический — остаётся просто manifest", () => {
  assert.equal(manifestUploadName("Манифест.xls", "Рейс"), "manifest.xls");
});

test("имя: пустой рейс — просто manifest с расширением", () => {
  assert.equal(manifestUploadName("Манифест.xlsx", ""), "manifest.xlsx");
  assert.equal(manifestUploadName("Манифест.xlsx", null), "manifest.xlsx");
});

test("имя: расширение в верхнем регистре приводится к нижнему", () => {
  assert.equal(manifestUploadName("ПМ ФОРМА.XLSB", "FV6346"), "manifest-fv6346.xlsb");
});

test("имя: у файла без расширения точки не появляется", () => {
  assert.equal(manifestUploadName("манифест", "FV6346"), "manifest-fv6346");
});

// ── Разбор пути ──

test("разбор: ведущее число до дефиса — это Date.now() бэка, время известно", () => {
  const path = uploadPath("1756800000000-manifest-fv6346.xlsx");
  const parsed = parseManifestFile(path);
  assert.equal(parsed.path, path);
  assert.equal(parsed.uploadedAt.getTime(), 1756800000000);
  assert.equal(parsed.hasTime, true);
});

test("разбор: без timestamp дата берётся из сегментов /YYYY/MM/DD/, времени нет", () => {
  const parsed = parseManifestFile(uploadPath("manifest-fv6346.xlsx"));
  assert.equal(parsed.uploadedAt.getFullYear(), 2026);
  assert.equal(parsed.uploadedAt.getMonth(), 8);
  assert.equal(parsed.uploadedAt.getDate(), 2);
  assert.equal(parsed.hasTime, false);
});

test("разбор: ни timestamp, ни каталога даты — даты нет", () => {
  const parsed = parseManifestFile("manifest-fv6346.xlsx");
  assert.equal(parsed.uploadedAt, null);
  assert.equal(parsed.hasTime, false);
});

// ── Фильтр ──

test("фильтр: манифест узнаётся по имени с timestamp и без него", () => {
  assert.equal(isManifestFile(uploadPath("1756800000000-manifest-fv6346.xlsx")), true);
  assert.equal(isManifestFile(uploadPath("manifest.xlsx")), true);
  assert.equal(isManifestFile(uploadPath("1756800000000-report.xlsx")), false);
  assert.equal(isManifestFile(uploadPath("dogovor.pdf")), false);
  assert.equal(isManifestFile(null), false);
});

// ── Сортировка ──

test("сортировка: новые сверху, файлы без даты — в конце", () => {
  const older = uploadPath("1756800000000-manifest-fv6346.xlsx");
  const newer = uploadPath("1756899999999-manifest-fv6346.xlsx");
  const undated = "manifest-fv6346.xlsx";
  const alien = uploadPath("1756999999999-report.xlsx");

  const sorted = manifestFilesNewestFirst([older, undated, alien, newer]);

  assert.deepEqual(
    sorted.map((f) => f.path),
    [newer, older, undated]
  );
});

test("сортировка: пустой и невалидный вход не ломают вызов", () => {
  assert.deepEqual(manifestFilesNewestFirst([]), []);
  assert.deepEqual(manifestFilesNewestFirst(null), []);
  assert.deepEqual(manifestFilesNewestFirst(undefined), []);
});
