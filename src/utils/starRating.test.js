import test from "node:test";
import assert from "node:assert/strict";
import { parseStarValue } from "./starRating.js";

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
