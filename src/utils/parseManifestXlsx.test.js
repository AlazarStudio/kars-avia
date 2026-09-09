import test from "node:test";
import assert from "node:assert/strict";
import { parseManifestXlsx, isCsvFile, decodeTextBuffer } from "./parseManifestXlsx.js";

test("decodeTextBuffer: windows-1251 без BOM", () => {
  const buffer = Uint8Array.of(0xcf, 0xe0, 0xf1, 0xf1, 0xe0, 0xe6, 0xe8, 0xf0).buffer;
  assert.equal(decodeTextBuffer(buffer), "Пассажир");
});

test("decodeTextBuffer: UTF-8 с BOM", () => {
  const buffer = new TextEncoder().encode("﻿Привет").buffer;
  assert.equal(decodeTextBuffer(buffer), "Привет");
});

test("decodeTextBuffer: UTF-8 без BOM", () => {
  const buffer = new TextEncoder().encode("Привет").buffer;
  assert.equal(decodeTextBuffer(buffer), "Привет");
});

test("isCsvFile: расширение .CSV в любом регистре", () => {
  assert.equal(isCsvFile({ name: "a.CSV", type: "application/vnd.ms-excel" }), true);
});

test("isCsvFile: MIME text/csv без расширения", () => {
  assert.equal(isCsvFile({ name: "manifest", type: "text/csv" }), true);
});

test("isCsvFile: обычный xlsx — false", () => {
  assert.equal(isCsvFile({ name: "a.xlsx", type: "" }), false);
});

// Образец формата «Руслайн»: разделитель «;», CRLF, две строки шапки (группы
// колонок сверху, сами заголовки снизу — «Категория»/«Фамилия»/«Имя»).
const RUSLINE_CSV = [
  "5N-596, 14.08.2026;;;;;;;;;;;;;;;;",
  ";;;;;;;;;;;;;;;;",
  "KRR-LED;;;;;;;;;;;;;;;;",
  "№;Заказ;;;;;;Пассажир;;;Билет;Телефон агента;Email;SSP;Услуги;Место;DCS Info",
  ";PNR;Агентство;Группа;Статус;Дата/время бронирования;RBD;Категория;Фамилия;Имя;;;;;;;Регистрационный ID",
  "1;8P3W6M;08АКА;;TK;11.02.2026 12:28;N;Взрослый;ИВАНОВА;МАРИЯ ПЕТРОВНА;3166176804544 C1;79110000000;TEST@EXAMPLE.COM;;;32A;110",
  "2;8P3W6M;08АКА;;TK;11.02.2026 12:28;N;Ребёнок;ИВАНОВ;ПЁТР ИВАНОВИЧ;3166176804545 C1;79110000000;TEST@EXAMPLE.COM;;;32B;111",
].join("\r\n");

function makeCsvFile(text, name = "m.csv") {
  const buf = new TextEncoder().encode(text).buffer;
  if (typeof File !== "undefined") {
    return new File([buf], name, { type: "text/csv" });
  }
  return {
    name,
    type: "text/csv",
    size: buf.byteLength,
    arrayBuffer: async () => buf,
  };
}

test("parseManifestXlsx: CSV-выгрузка «Руслайн» (UTF-8)", async () => {
  const file = makeCsvFile(RUSLINE_CSV);
  const result = await parseManifestXlsx(file);

  assert.equal(result.error, null);
  assert.equal(result.flightNumber, "5N-596");
  assert.equal(result.people.length, 2);

  assert.equal(result.people[0].fullName, "ИВАНОВА МАРИЯ ПЕТРОВНА");
  assert.equal(result.people[0].personCategory, "ADULT");

  assert.equal(result.people[1].fullName, "ИВАНОВ ПЁТР ИВАНОВИЧ");
  assert.equal(result.people[1].personCategory, "CHILD");
});
