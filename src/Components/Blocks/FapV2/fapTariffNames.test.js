import { test } from "node:test";
import assert from "node:assert/strict";
import { tariffNameKey, findTariffByName } from "./fapTariffNames.js";

test("tariffNameKey: хвостовые пробелы, регистр и повторные пробелы не различают тарифы", () => {
  assert.equal(tariffNameKey("Стандарт SGL "), tariffNameKey("Стандарт SGL"));
  assert.equal(tariffNameKey(" Стандарт SGL"), tariffNameKey("Стандарт SGL"));
  assert.equal(tariffNameKey("Стандарт  SGL"), tariffNameKey("Стандарт SGL"));
  assert.equal(tariffNameKey("СТАНДАРТ sgl"), tariffNameKey("Стандарт SGL"));
});

test("tariffNameKey: разные тарифы остаются разными", () => {
  assert.notEqual(tariffNameKey("Стандарт SGL"), tariffNameKey("Стандарт DBL"));
  assert.notEqual(tariffNameKey("Эконом SGL"), tariffNameKey("Стандарт SGL"));
});

test("tariffNameKey: пустое и отсутствующее дают пустой ключ", () => {
  assert.equal(tariffNameKey(""), "");
  assert.equal(tariffNameKey("   "), "");
  assert.equal(tariffNameKey(null), "");
  assert.equal(tariffNameKey(undefined), "");
});

test("findTariffByName: тариф гостиницы с хвостовым пробелом находится по имени из строки", () => {
  const hotelTariffs = [
    { id: "h1", name: "Эконом SGL", pricePerDay: 4446 },
    { id: "h2", name: "Стандарт SGL ", pricePerDay: 4788 },
  ];
  assert.equal(findTariffByName(hotelTariffs, "Стандарт SGL")?.id, "h2");
  assert.equal(findTariffByName(hotelTariffs, "Эконом SGL")?.id, "h1");
});

test("findTariffByName: чужое имя и пустой запрос не матчатся", () => {
  const list = [{ id: "h1", name: "Стандарт SGL " }];
  assert.equal(findTariffByName(list, "Люкс"), null);
  assert.equal(findTariffByName(list, ""), null);
  // Пустое имя тарифа не должно ловить пустой запрос.
  assert.equal(findTariffByName([{ id: "x", name: "  " }], "   "), null);
});
