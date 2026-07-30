import test from "node:test";
import assert from "node:assert/strict";
import {
  accommodationChargeFactor,
  accommodationDiscountPercent,
} from "./fapConstants.js";

test("процент скидки по возрастной категории", () => {
  assert.equal(accommodationDiscountPercent("ADULT"), 0);
  assert.equal(accommodationDiscountPercent("CHILD"), 50);
  assert.equal(accommodationDiscountPercent("INFANT"), 100);
});

test("неизвестная и пустая категория считаются взрослым", () => {
  assert.equal(accommodationDiscountPercent(undefined), 0);
  assert.equal(accommodationDiscountPercent(null), 0);
  assert.equal(accommodationDiscountPercent("CREW"), 0);
});

test("процент согласован с коэффициентом оплаты", () => {
  for (const c of ["ADULT", "CHILD", "INFANT", undefined]) {
    assert.equal(
      accommodationDiscountPercent(c),
      Math.round((1 - accommodationChargeFactor(c)) * 100)
    );
  }
});
