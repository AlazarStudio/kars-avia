import test from "node:test";
import assert from "node:assert/strict";
import { parseStarValue, starFractions } from "./starRating.js";

test("точка и запятая дают одно и то же число", () => {
  assert.equal(parseStarValue("4.5"), 4.5);
  assert.equal(parseStarValue("4,5"), 4.5);
});

test("целые значения строкой и числом", () => {
  assert.equal(parseStarValue("5"), 5);
  assert.equal(parseStarValue(4), 4);
});

test("пустое, null и undefined дают ноль", () => {
  assert.equal(parseStarValue(""), 0);
  assert.equal(parseStarValue(null), 0);
  assert.equal(parseStarValue(undefined), 0);
});

test("текст вместо числа считается нулём", () => {
  assert.equal(parseStarValue("Нет"), 0);
});

test("starFractions: точка и запятая дают одинаковый ряд долей", () => {
  assert.deepEqual(starFractions("4,5"), [1, 1, 1, 1, 0.5]);
  assert.deepEqual(starFractions("4.5"), [1, 1, 1, 1, 0.5]);
});

test("starFractions: округление до сотых (4.7 - 4 в float даёт хвост)", () => {
  assert.deepEqual(starFractions("4.7"), [1, 1, 1, 1, 0.7]);
});

test("starFractions: целое значение без частичной звезды", () => {
  assert.deepEqual(starFractions("3"), [1, 1, 1, 0, 0]);
});

test("starFractions: пустое и нечисловое значение — все нули", () => {
  assert.deepEqual(starFractions(""), [0, 0, 0, 0, 0]);
  assert.deepEqual(starFractions("Нет"), [0, 0, 0, 0, 0]);
});

test("starFractions: клампинг за пределами диапазона 0..max", () => {
  assert.deepEqual(starFractions(7), [1, 1, 1, 1, 1]);
  assert.deepEqual(starFractions(-1), [0, 0, 0, 0, 0]);
});

test("starFractions: параметр max", () => {
  assert.deepEqual(starFractions("2.5", 3), [1, 1, 0.5]);
});
