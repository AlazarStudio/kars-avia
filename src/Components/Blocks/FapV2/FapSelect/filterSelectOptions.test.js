import { test } from "node:test";
import assert from "node:assert/strict";
import { filterSelectOptions } from "./filterSelectOptions.js";

const options = [
  { groupLabel: "MRV · Минеральные Воды" },
  { value: "1", label: "Азимут" },
  { value: "2", label: "Кавказ" },
  { groupLabel: "ABA · Абакан" },
  { value: "3", label: "Азия" },
];

test("пустой запрос возвращает опции как есть", () => {
  assert.equal(filterSelectOptions(options, ""), options);
  assert.equal(filterSelectOptions(options, "   "), options);
});

test("совпадение по опции — опция под своим заголовком, пустые группы выпадают", () => {
  assert.deepEqual(filterSelectOptions(options, "кавк"), [
    { groupLabel: "MRV · Минеральные Воды" },
    { value: "2", label: "Кавказ" },
  ]);
});

test("совпадение по заголовку группы — вся группа", () => {
  assert.deepEqual(filterSelectOptions(options, "aba"), [
    { groupLabel: "ABA · Абакан" },
    { value: "3", label: "Азия" },
  ]);
});

test("регистр не важен, опции из разных групп", () => {
  assert.deepEqual(filterSelectOptions(options, "АЗИ"), [
    { groupLabel: "MRV · Минеральные Воды" },
    { value: "1", label: "Азимут" },
    { groupLabel: "ABA · Абакан" },
    { value: "3", label: "Азия" },
  ]);
});

test("опции без групп фильтруются по label", () => {
  assert.deepEqual(
    filterSelectOptions([{ value: "a", label: "КВС" }, { value: "b", label: "БП" }], "бп"),
    [{ value: "b", label: "БП" }]
  );
});
