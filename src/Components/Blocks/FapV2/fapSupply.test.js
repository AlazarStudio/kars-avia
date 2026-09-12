import { test } from "node:test";
import assert from "node:assert/strict";
import {
  supplyTotal,
  buildSupplyPatch,
  supplyDraftFromService,
  isSupplyDraftDirty,
} from "./fapSupply.js";
import { toLocalInputValue } from "./fapConstants.js";

test("supplyTotal: количество × цена + доставка, пустые — нули", () => {
  assert.equal(supplyTotal({ quantity: "94", unitPrice: "60", deliveryCost: "800" }), 6440);
  assert.equal(supplyTotal({ quantity: "", unitPrice: "", deliveryCost: "" }), 0);
  assert.equal(supplyTotal({ quantity: "3", unitPrice: "0.1", deliveryCost: "0.2" }), 0.5);
});

test("supplyDraftFromService: числа строками, дата в local-input, план как подстановка", () => {
  const draft = supplyDraftFromService(
    { supplier: "Моя столовая", quantity: 94, unitPrice: 60, plan: { peopleCount: 100, plannedAt: "2026-08-22T08:00:00.000Z" } },
  );
  assert.equal(draft.supplier, "Моя столовая");
  assert.equal(draft.quantity, "94");
  assert.equal(draft.unitPrice, "60");
  assert.equal(draft.deliveryCost, "");
  assert.equal(draft.supplierCost, "");
  const empty = supplyDraftFromService({ plan: { peopleCount: 100, plannedAt: "2026-08-22T08:00:00.000Z" } });
  assert.equal(empty.quantity, "100", "нет факта — подставляется план");
  assert.equal(empty.suppliedAt, toLocalInputValue("2026-08-22T08:00:00.000Z"));
});

test("buildSupplyPatch: только изменённые ключи, пустое → null", () => {
  const service = { supplier: "Моя столовая", quantity: 94, unitPrice: 60, deliveryCost: null, supplierCost: null, suppliedAt: null };
  const draft = { supplier: "Моя столовая", quantity: "100", unitPrice: "", deliveryCost: "800", supplierCost: "", suppliedAt: "" };
  assert.deepEqual(buildSupplyPatch(service, draft), { quantity: 100, unitPrice: null, deliveryCost: 800 });
  assert.deepEqual(buildSupplyPatch(service, supplyDraftFromService(service)), {}, "нетронутый черновик — пустой патч");
});

test("buildSupplyPatch: дата уходит ISO", () => {
  const local = toLocalInputValue("2026-08-22T08:01:00.000Z");
  const patch = buildSupplyPatch({ suppliedAt: null }, { suppliedAt: local });
  assert.equal(patch.suppliedAt, "2026-08-22T08:01:00.000Z");
});

test("buildSupplyPatch: числа сравниваются числами, а не строками", () => {
  // Ради этого сравнение и переписано: строковое «60.10» ≠ «60.1» держало
  // черновик грязным после сохранения, а страж по dirty больше не давал
  // эффекту пересинхронизировать его с сервером.
  const service = { quantity: 7, unitPrice: 60.1, deliveryCost: null, supplierCost: null, suppliedAt: null, supplier: "" };
  const draft = supplyDraftFromService(service);
  assert.deepEqual(
    buildSupplyPatch(service, { ...draft, unitPrice: "60.10" }),
    {},
    "«60.10» при сервере 60.1 — не правка"
  );
  assert.deepEqual(
    buildSupplyPatch(service, { ...draft, quantity: "007" }),
    {},
    "«007» при сервере 7 — не правка"
  );
});

test("buildSupplyPatch: отрицательное — то же «не задано», что запишет бэк", () => {
  const empty = { quantity: null, unitPrice: null, deliveryCost: null, supplierCost: null, suppliedAt: null, supplier: "" };
  assert.deepEqual(
    buildSupplyPatch(empty, { ...supplyDraftFromService(empty), supplierCost: "-5" }),
    {},
    "минус при пустом сервере — патч пуст, кнопка не активна"
  );
  assert.deepEqual(
    buildSupplyPatch({ ...empty, supplierCost: 60.1 }, { ...supplyDraftFromService(empty), supplierCost: "-5" }),
    { supplierCost: null },
    "минус поверх заполненного — очистка поля"
  );
});

test("buildSupplyPatch: дробное количество уходит как null, а не округляется", () => {
  const service = { quantity: 94, unitPrice: null, deliveryCost: null, supplierCost: null, suppliedAt: null, supplier: "" };
  const patch = buildSupplyPatch(service, { ...supplyDraftFromService(service), quantity: "94.5" });
  assert.deepEqual(patch, { quantity: null });
});

test("buildSupplyPatch: после сохранения тот же черновик даёт пустой патч", () => {
  // Сервер вернул нормализованные значения — черновик пользователя (как он его
  // набрал) обязан сойтись с ними, иначе кнопка «Сохранить» остаётся активной.
  const draft = { supplier: "Моя столовая", suppliedAt: "", quantity: "007", unitPrice: "60.10", deliveryCost: "1200.00", supplierCost: "" };
  const saved = { supplier: "Моя столовая", suppliedAt: null, quantity: 7, unitPrice: 60.1, deliveryCost: 1200, supplierCost: null };
  assert.deepEqual(buildSupplyPatch(saved, draft), {});
});

test("isSupplyDraftDirty: подстановка из плана — не правка, изменение поля — правка", () => {
  const service = { plan: { peopleCount: 100, plannedAt: "2026-08-22T08:00:00.000Z" } };
  const initial = supplyDraftFromService(service);
  assert.equal(isSupplyDraftDirty(initial, { ...initial }), false, "нетронутый черновик с подстановкой");
  assert.equal(isSupplyDraftDirty(initial, { ...initial, unitPrice: "60" }), true, "изменён unitPrice");
});
