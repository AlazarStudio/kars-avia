import test from "node:test";
import assert from "node:assert/strict";
import {
  accommodationChargeFactor,
  accommodationDiscountPercent,
  isRequestCancelled,
} from "./fapConstants.js";

test("закрытой для правок считается только ОТМЕНЁННАЯ заявка", () => {
  assert.equal(isRequestCancelled({ status: "CANCELLED" }), true);
  // Завершённая заявка правки не запрещает: отчёт по проживанию дозаполняют
  // и после завершения. Решение владельца — закрываем только отмену.
  assert.equal(isRequestCancelled({ status: "COMPLETED" }), false);
  assert.equal(isRequestCancelled({ status: "IN_PROGRESS" }), false);
});

test("отсутствующая заявка не считается отменённой", () => {
  // Данные приходят асинхронно: пока запрос грузится, request === undefined.
  // Ответ true запер бы экран на время загрузки у всех заявок подряд.
  assert.equal(isRequestCancelled(null), false);
  assert.equal(isRequestCancelled(undefined), false);
  assert.equal(isRequestCancelled({}), false);
});

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
