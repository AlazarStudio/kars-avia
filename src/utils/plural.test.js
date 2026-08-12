import test from "node:test";
import assert from "node:assert/strict";
import { plural } from "./plural.js";

const INFANT = ["инфант", "инфанта", "инфантов"];

test("единица берёт первую форму, кроме одиннадцати", () => {
  assert.equal(plural(1, INFANT), "инфант");
  assert.equal(plural(21, INFANT), "инфант");
  assert.equal(plural(101, INFANT), "инфант");
  assert.equal(plural(11, INFANT), "инфантов");
  assert.equal(plural(111, INFANT), "инфантов");
});

test("два-четыре берут вторую форму, кроме двенадцати-четырнадцати", () => {
  assert.equal(plural(2, INFANT), "инфанта");
  assert.equal(plural(4, INFANT), "инфанта");
  assert.equal(plural(22, INFANT), "инфанта");
  assert.equal(plural(12, INFANT), "инфантов");
  assert.equal(plural(14, INFANT), "инфантов");
});

test("пять и больше берут третью форму", () => {
  assert.equal(plural(5, INFANT), "инфантов");
  assert.equal(plural(19, INFANT), "инфантов");
  assert.equal(plural(97, INFANT), "инфантов");
});

test("ноль берёт третью форму", () => {
  assert.equal(plural(0, INFANT), "инфантов");
});

test("мусор вместо числа считается нулём, а не падает", () => {
  assert.equal(plural(undefined, INFANT), "инфантов");
  assert.equal(plural(null, INFANT), "инфантов");
  assert.equal(plural(NaN, INFANT), "инфантов");
});
