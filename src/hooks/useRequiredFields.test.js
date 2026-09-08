import test from "node:test";
import assert from "node:assert/strict";
import {
  isEmptyValue,
  getMissingKeys,
  INVALID_SELECTOR,
} from "./useRequiredFields.js";

test("isEmptyValue: пусто — null, undefined, пустая строка, пустой массив", () => {
  assert.equal(isEmptyValue(null), true);
  assert.equal(isEmptyValue(undefined), true);
  assert.equal(isEmptyValue(""), true);
  assert.equal(isEmptyValue([]), true);
});

test("isEmptyValue: не пусто — строка, число 0, false, непустой массив, объект", () => {
  assert.equal(isEmptyValue("a"), false);
  assert.equal(isEmptyValue(0), false);
  assert.equal(isEmptyValue(false), false);
  assert.equal(isEmptyValue([1]), false);
  assert.equal(isEmptyValue({ id: "x" }), false);
});

test("getMissingKeys: возвращает пустые ключи в порядке requiredKeys", () => {
  const values = { airportId: "", airlineId: "a1", arrivalDate: "", departureDate: "2026-09-10" };
  assert.deepEqual(
    getMissingKeys(values, ["airlineId", "airportId", "arrivalDate", "departureDate"]),
    ["airportId", "arrivalDate"]
  );
});

test("getMissingKeys: отсутствующий в values ключ считается пустым", () => {
  assert.deepEqual(getMissingKeys({}, ["personId"]), ["personId"]);
  assert.deepEqual(getMissingKeys(undefined, ["personId"]), ["personId"]);
});

test("getMissingKeys: пустой requiredKeys → []", () => {
  assert.deepEqual(getMissingKeys({ a: "" }, []), []);
});

test("INVALID_SELECTOR покрывает оба глобальных класса и MUI-ошибку", () => {
  assert.equal(INVALID_SELECTOR, ".fieldInvalid, .inputInvalid, .Mui-error");
});
