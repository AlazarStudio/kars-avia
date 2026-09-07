import test from "node:test";
import assert from "node:assert/strict";
import { splitRoomAccommodation } from "./fapRoomSplit.js";

// Вес гостя = 1 − скидка/100: взрослый 1, ребёнок 0.5, инфант 0.
const ADULT = 1;
const CHILD = 0.5;
const INFANT = 0;

const sumOf = (shares) =>
  Math.round(Object.values(shares).reduce((s, v) => s + v, 0) * 100) / 100;

test("пример спеки: 4500 × 2 суток, скидка ребёнка режет итог номера", () => {
  const res = splitRoomAccommodation({
    total: 9000,
    carrierKey: 0,
    members: [
      { key: 0, factor: ADULT, days: 2 },
      { key: 1, factor: ADULT, days: 2 },
      { key: 2, factor: CHILD, days: 2 },
    ],
  });
  assert.equal(res.base, 1500);
  assert.deepEqual(res.shares, { 0: 3000, 1: 3000, 2: 1500 });
  assert.equal(sumOf(res.shares), 7500);
});

test("один гость платит свою долю со скидкой", () => {
  const res = splitRoomAccommodation({
    total: 9000,
    carrierKey: 0,
    members: [{ key: 0, factor: CHILD, days: 2 }],
  });
  assert.equal(res.base, 4500);
  assert.equal(res.shares[0], 4500);
});

test("одни инфанты — делится, все платят 0", () => {
  const res = splitRoomAccommodation({
    total: 9000,
    carrierKey: 0,
    members: [
      { key: 0, factor: INFANT, days: 2 },
      { key: 1, factor: INFANT, days: 2 },
    ],
  });
  assert.notEqual(res, null);
  assert.equal(res.base, 2250);
  assert.deepEqual(res.shares, { 0: 0, 1: 0 });
});

test("нулевые сутки у всех — фолбэк", () => {
  const res = splitRoomAccommodation({
    total: 9000,
    carrierKey: 0,
    members: [{ key: 0, factor: ADULT, days: 0 }],
  });
  assert.equal(res, null);
});

test("разные сутки у соседей — Σ долей без скидки равна сумме номера", () => {
  const res = splitRoomAccommodation({
    total: 9000,
    carrierKey: 0,
    members: [
      { key: 0, factor: ADULT, days: 2 },
      { key: 1, factor: ADULT, days: 3 },
      { key: 2, factor: CHILD, days: 1 },
    ],
  });
  assert.equal(res.base, 1500);
  assert.deepEqual(res.shares, { 0: 3000, 1: 4500, 2: 750 });
  assert.equal(sumOf(res.shares), 8250);
});

test("копейки: остаток без скидки ложится на несущего", () => {
  const res = splitRoomAccommodation({
    total: 5000,
    carrierKey: 0,
    members: [
      { key: 0, factor: ADULT, days: 1 },
      { key: 1, factor: ADULT, days: 1 },
      { key: 2, factor: CHILD, days: 1 },
    ],
  });
  assert.equal(res.base, 1666.67);
  assert.equal(res.shares[1], 1666.67);
  assert.equal(res.shares[0], 1666.66);
  assert.ok(Math.abs(res.shares[2] - 833.335) <= 0.005);

  // Без скидок доли без скидки и итоговые совпадают, Σ сходится точно.
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
  assert.deepEqual(odd.shares, { 1: 1666.67, 2: 1666.67, 0: 1666.66 });
  assert.equal(sumOf(odd.shares), 5000);
});

test("гость с нулевыми сутками не платит", () => {
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
  assert.deepEqual(res.shares, { 0: 4500, 1: 4500, 2: 0 });
  assert.equal(sumOf(res.shares), 9000);
});

test("произвольный процент скидки работает так же, как 50%", () => {
  // Ручные 30% у соседа: множитель 0.7.
  const res = splitRoomAccommodation({
    total: 8500,
    carrierKey: 0,
    members: [
      { key: 0, factor: ADULT, days: 1 },
      { key: 1, factor: 0.7, days: 1 },
    ],
  });
  assert.equal(res.base, 4250);
  assert.deepEqual(res.shares, { 0: 4250, 1: 2975 });
  assert.equal(sumOf(res.shares), 7225);
});

test("инфант рядом со взрослым: взрослый платит свою половину", () => {
  const res = splitRoomAccommodation({
    total: 9000,
    carrierKey: 0,
    members: [
      { key: 0, factor: ADULT, days: 2 },
      { key: 1, factor: INFANT, days: 2 },
    ],
  });
  assert.equal(res.base, 2250);
  assert.deepEqual(res.shares, { 0: 4500, 1: 0 });
  assert.equal(sumOf(res.shares), 4500);
});

test("несущий со скидкой режет свою долю", () => {
  const res = splitRoomAccommodation({
    total: 9000,
    carrierKey: 0,
    members: [
      { key: 0, factor: CHILD, days: 2 },
      { key: 1, factor: ADULT, days: 2 },
    ],
  });
  assert.equal(res.base, 2250);
  assert.deepEqual(res.shares, { 0: 2250, 1: 4500 });
  assert.equal(sumOf(res.shares), 6750);
});

test("Σ долей без скидки равна T при кривом делении на троих", () => {
  const res = splitRoomAccommodation({
    total: 1000,
    carrierKey: 0,
    members: [
      { key: 0, factor: ADULT, days: 1 },
      { key: 1, factor: ADULT, days: 1 },
      { key: 2, factor: ADULT, days: 1 },
    ],
  });
  assert.equal(sumOf(res.shares), 1000);
});
