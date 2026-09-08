import test from "node:test";
import assert from "node:assert/strict";
import { DISCOUNT_ZONES, zoneMembers, buildDiscountPatch } from "./fapDiscountZones.js";

// Фикстура §5 спеки: трое в двухместном (kind 2), взрослый в одноместном (kind 1),
// взрослый без номера (kind null) и взрослый без тарифа (ячейка «Скидка» неактивна).
const targets = () => [
  { index: 0, fullName: "Адамов А.", category: "ADULT", roomNumber: "101", placementKind: 2, applicable: true },
  { index: 1, fullName: "Борисов Б.", category: "CHILD", roomNumber: "101", placementKind: 2, applicable: true },
  { index: 2, fullName: "Власов В.", category: "INFANT", roomNumber: "101", placementKind: 2, applicable: true },
  { index: 3, fullName: "Громов Г.", category: "ADULT", roomNumber: "102", placementKind: 1, applicable: true },
  { index: 4, fullName: "Данилов Д.", category: "ADULT", roomNumber: "", placementKind: null, applicable: true },
  { index: 5, fullName: "Егоров Е.", category: "ADULT", roomNumber: "103", placementKind: 2, applicable: false },
];

const patchOf = (over) =>
  buildDiscountPatch({
    targets: targets(),
    zone: "all",
    selectedIndices: [],
    presets: { infant: false, child: false },
    custom: { on: false, value: "" },
    ...over,
  });

test("своя скидка всем ложится и на детей, и на инфантов (вариант 1)", () => {
  const patch = patchOf({ custom: { on: true, value: 10 } });
  assert.deepEqual(patch, { 0: 10, 1: 10, 2: 10, 3: 10, 4: 10 });
});

test("категорийные пункты приоритетнее своей скидки", () => {
  const patch = patchOf({
    presets: { infant: true, child: true },
    custom: { on: true, value: 10 },
  });
  assert.deepEqual(patch, { 0: 10, 1: null, 2: null, 3: 10, 4: 10 });
});

test("один пресет «Ребёнок» — в патче только ребёнок", () => {
  const patch = patchOf({ presets: { infant: false, child: true } });
  assert.deepEqual(patch, { 1: null });
});

test("зона «только одноместное» — гость с kind 1", () => {
  const patch = patchOf({ zone: "single", custom: { on: true, value: 5 } });
  assert.deepEqual(patch, { 3: 5 });
});

test("зона «только двухместное» — без гостя без номера и без гостя без тарифа", () => {
  const patch = patchOf({ zone: "double", custom: { on: true, value: 5 } });
  assert.deepEqual(patch, { 0: 5, 1: 5, 2: 5 });
});

test("индивидуально: выбранный без тарифа в патч не попадает", () => {
  const patch = patchOf({
    zone: "custom",
    selectedIndices: [1, 5],
    custom: { on: true, value: 15 },
  });
  assert.deepEqual(patch, { 1: 15 });
});

test("ничего не отмечено — пустой патч", () => {
  assert.deepEqual(patchOf({}), {});
});

test("своя скидка включена с пустым значением — пустой патч", () => {
  assert.deepEqual(patchOf({ custom: { on: true, value: "" } }), {});
});

test("кламп процента: 150 → 100, −5 → 0, «0» → 0 и ключ есть", () => {
  assert.equal(patchOf({ zone: "single", custom: { on: true, value: 150 } })[3], 100);
  assert.equal(patchOf({ zone: "single", custom: { on: true, value: -5 } })[3], 0);
  const zero = patchOf({ zone: "single", custom: { on: true, value: "0" } });
  assert.equal(zero[3], 0);
  assert.ok(Object.prototype.hasOwnProperty.call(zero, 3));
});

test("zoneMembers считает состав зоны, а не строки под скидку", () => {
  const list = targets();
  assert.equal(zoneMembers(list, "all").length, 6);
  assert.equal(zoneMembers(list, "single").length, 1);
  // Гость без тарифа в счётчике есть — счётчик по составу номера.
  assert.equal(zoneMembers(list, "double").length, 4);
  assert.deepEqual(
    zoneMembers(list, "custom", [2, 4]).map((t) => t.index),
    [2, 4]
  );
  assert.equal(zoneMembers(list, "custom").length, 0);
});

test("вход не мутируется", () => {
  const list = targets();
  const snapshot = JSON.stringify(list);
  buildDiscountPatch({
    targets: list,
    zone: "all",
    selectedIndices: [],
    presets: { infant: true, child: true },
    custom: { on: true, value: 20 },
  });
  assert.equal(JSON.stringify(list), snapshot);
});

test("зоны перечислены в порядке макета", () => {
  assert.deepEqual(
    DISCOUNT_ZONES.map((z) => z.value),
    ["all", "single", "double", "custom"]
  );
});
