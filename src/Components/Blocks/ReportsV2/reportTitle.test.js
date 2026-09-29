import { test } from "node:test";
import assert from "node:assert/strict";
import { shortReportTitle } from "./reportTitle.js";

const AIRLINE = "РЕЕСТР № # оказанных услуг по размещению экипажа авиакомпании";
const HOTEL = "РЕЕСТР № # оказанных услуг по размещению экипажа в отеле";

test("авиакомпания: реестр, имя и город", () => {
  assert.equal(
    shortReportTitle(`${AIRLINE} "Азимут" в г. Минеральные Воды`),
    "Реестр · Азимут · Минеральные Воды"
  );
});

test("город с дефисом сохраняется целиком", () => {
  assert.equal(
    shortReportTitle(`${AIRLINE} "Руслайн" в г. Ханты-Мансийск`),
    "Реестр · Руслайн · Ханты-Мансийск"
  );
});

test("пустой город — без хвоста", () => {
  assert.equal(shortReportTitle(`${AIRLINE} "Азимут" в г. `), "Реестр · Азимут");
});

test("гостиница: хвостовые пробелы в имени и в конце срезаются", () => {
  assert.equal(shortReportTitle(`${HOTEL} "Кавказ " `), "Реестр · Кавказ");
});

test("кавычки внутри имени не ломают разбор", () => {
  assert.equal(
    shortReportTitle(`${AIRLINE} "ООО "Азимут 2000"" в г. Псков`),
    'Реестр · ООО "Азимут 2000" · Псков'
  );
});

test("нет кавычек, пустая строка, null, undefined — null", () => {
  for (const value of [`${AIRLINE} Азимут в г. Псков`, "", null, undefined]) {
    assert.equal(shortReportTitle(value), null);
  }
});
