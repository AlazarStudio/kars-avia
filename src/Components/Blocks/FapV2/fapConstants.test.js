import test from "node:test";
import assert from "node:assert/strict";
import {
  accommodationChargeFactor,
  accommodationDiscountPercent,
  isRequestCancelled,
  toMoneyOrNull,
  toWholeCountOrNull,
  toDraftString,
  toLocalInputValue,
  fromLocalInputValue,
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

test("toMoneyOrNull повторяет бэковый toNonNegative2dp", () => {
  // Ради этих трёх строк правило и вынесено во фронт: строковое сравнение
  // черновика с сервером считало «60.10» и «007» правками, патч не пустел, и
  // карточка оставалась грязной после успешного сохранения.
  assert.equal(toMoneyOrNull("60.10"), 60.1);
  assert.equal(toMoneyOrNull("007"), 7);
  assert.equal(toMoneyOrNull("1200.00"), 1200);
  assert.equal(toMoneyOrNull(12.345), 12.35);
  // Двоичное представление 1.005 чуть меньше точного — Math.round(1.005*100)
  // даёт 100, а не 101. Фиксируем фактическое поведение: оно совпадает с бэком,
  // где стоит ровно та же формула.
  assert.equal(toMoneyOrNull("1.005"), 1);
});

test("toMoneyOrNull: отрицательное, нечисловое и пустое — «не задано»", () => {
  // Бэк на минус не ругается, а пишет null: расхождение и было видно как
  // «-5» в поле после тоста «Сохранено».
  assert.equal(toMoneyOrNull("-5"), null);
  assert.equal(toMoneyOrNull(""), null);
  assert.equal(toMoneyOrNull("   "), null);
  assert.equal(toMoneyOrNull(null), null);
  assert.equal(toMoneyOrNull(undefined), null);
  assert.equal(toMoneyOrNull("abc"), null);
});

test("toWholeCountOrNull: целое ≥ 0, дробное — null", () => {
  assert.equal(toWholeCountOrNull("94"), 94);
  assert.equal(toWholeCountOrNull("94.5"), null, "дробное бэк не округляет, а обнуляет");
  assert.equal(toWholeCountOrNull("-1"), null);
  assert.equal(toWholeCountOrNull(""), null);
  assert.equal(toWholeCountOrNull(null), null);
});

test("toDraftString: null — пустая строка инпута", () => {
  assert.equal(toDraftString(null), "");
  assert.equal(toDraftString(undefined), "");
  assert.equal(toDraftString(0), "0", "ноль — заданное значение, а не пустое поле");
  assert.equal(toDraftString(60.1), "60.1");
});

test("fromLocalInputValue: обратная к toLocalInputValue, мусор — null", () => {
  const iso = "2026-08-22T08:01:00.000Z";
  assert.equal(fromLocalInputValue(toLocalInputValue(iso)), iso);
  assert.equal(toLocalInputValue(null), "");
  assert.equal(fromLocalInputValue(""), null);
  assert.equal(fromLocalInputValue("не дата"), null);
  assert.equal(
    new Date(fromLocalInputValue("2026-06-22T10:30")).getTime(),
    new Date(2026, 5, 22, 10, 30).getTime(),
    "локальная строка инпута — та же минута в ISO"
  );
});
