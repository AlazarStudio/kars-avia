import test from "node:test";
import assert from "node:assert/strict";
import { splitRoomAccommodation } from "./fapRoomSplit.js";

// Вес гостя = 1 − скидка/100: взрослый 1, ребёнок 0.5, инфант 0.
const ADULT = 1;
const CHILD = 0.5;
const INFANT = 0;

const sumOf = (shares) =>
  Math.round(Object.values(shares).reduce((s, v) => s + v, 0) * 100) / 100;

test("пример спеки: 4500 × 2 суток на взрослого, взрослого и ребёнка", () => {
  const res = splitRoomAccommodation({
    total: 9000,
    carrierKey: 0,
    members: [
      { key: 0, factor: ADULT, days: 2 },
      { key: 1, factor: ADULT, days: 2 },
      { key: 2, factor: CHILD, days: 2 },
    ],
  });
  assert.equal(res.base, 1800);
  assert.deepEqual(res.shares, { 0: 3600, 1: 3600, 2: 1800 });
  assert.equal(sumOf(res.shares), 9000);
});

test("один гость платит всю сумму номера при любой скидке", () => {
  const res = splitRoomAccommodation({
    total: 9000,
    carrierKey: 0,
    members: [{ key: 0, factor: CHILD, days: 2 }],
  });
  // База вдвое выше цены номера — но платит он ровно T, как и должен.
  assert.equal(res.base, 9000);
  assert.equal(res.shares[0], 9000);
});

test("одни инфанты — делить нечего, фолбэк", () => {
  const res = splitRoomAccommodation({
    total: 9000,
    carrierKey: 0,
    members: [
      { key: 0, factor: INFANT, days: 2 },
      { key: 1, factor: INFANT, days: 2 },
    ],
  });
  assert.equal(res, null);
});

test("нулевые сутки у всех — делить нечего, фолбэк", () => {
  const res = splitRoomAccommodation({
    total: 9000,
    carrierKey: 0,
    members: [{ key: 0, factor: ADULT, days: 0 }],
  });
  assert.equal(res, null);
});

test("разные сутки у соседей — Σ долей равна сумме номера", () => {
  const res = splitRoomAccommodation({
    total: 9000,
    carrierKey: 0,
    members: [
      { key: 0, factor: ADULT, days: 2 },
      { key: 1, factor: ADULT, days: 3 },
      { key: 2, factor: CHILD, days: 1 },
    ],
  });
  // Σ(f × D) = 2 + 3 + 0.5 = 5.5 → B = 1636.36
  assert.equal(res.base, 1636.36);
  assert.equal(res.shares[1], 4909.08); // 1636.36 × 1 × 3
  assert.equal(res.shares[2], 818.18);  // 1636.36 × 0.5 × 1
  assert.equal(sumOf(res.shares), 9000);
});

test("копейки: остаток ложится на несущего, Σ сходится точно", () => {
  const res = splitRoomAccommodation({
    total: 5000,
    carrierKey: 0,
    members: [
      { key: 0, factor: ADULT, days: 1 },
      { key: 1, factor: ADULT, days: 1 },
      { key: 2, factor: CHILD, days: 1 },
    ],
  });
  assert.equal(res.base, 2000);
  assert.equal(sumOf(res.shares), 5000);

  // База не делится нацело: 5000 / 3 = 1666.666… → у несущего 1666.66.
  const odd = splitRoomAccommodation({
    total: 5000,
    carrierKey: 0,
    members: [
      { key: 0, factor: ADULT, days: 1 },
      { key: 1, factor: ADULT, days: 1 },
      { key: 2, factor: ADULT, days: 1 },
    ],
  });
  assert.equal(odd.base, 1666.67);
  assert.equal(odd.shares[1], 1666.67);
  assert.equal(odd.shares[2], 1666.67);
  assert.equal(odd.shares[0], 1666.66);
  assert.equal(sumOf(odd.shares), 5000);
});

test("гость с нулевыми сутками не платит — остальные делят всё", () => {
  const res = splitRoomAccommodation({
    total: 9000,
    carrierKey: 0,
    members: [
      { key: 0, factor: ADULT, days: 2 },
      { key: 1, factor: ADULT, days: 2 },
      { key: 2, factor: CHILD, days: 0 },
    ],
  });
  assert.equal(res.base, 2250);
  assert.equal(res.shares[2], 0);
  assert.equal(res.shares[0], 4500);
  assert.equal(res.shares[1], 4500);
  assert.equal(sumOf(res.shares), 9000);
});

test("произвольный процент скидки работает так же, как 50%", () => {
  // Ручные 30% у соседа: вес 0.7.
  const res = splitRoomAccommodation({
    total: 8500,
    carrierKey: 0,
    members: [
      { key: 0, factor: ADULT, days: 1 },
      { key: 1, factor: 0.7, days: 1 },
    ],
  });
  assert.equal(res.base, 5000); // 8500 / 1.7
  assert.equal(res.shares[1], 3500);
  assert.equal(res.shares[0], 5000);
  assert.equal(sumOf(res.shares), 8500);
});

test("инфант рядом со взрослым: платит взрослый, сумма прежняя", () => {
  const res = splitRoomAccommodation({
    total: 9000,
    carrierKey: 0,
    members: [
      { key: 0, factor: ADULT, days: 2 },
      { key: 1, factor: INFANT, days: 2 },
    ],
  });
  assert.equal(res.base, 4500);
  assert.equal(res.shares[0], 9000);
  assert.equal(res.shares[1], 0);
});
