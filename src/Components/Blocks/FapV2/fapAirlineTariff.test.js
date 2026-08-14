import test from "node:test";
import assert from "node:assert/strict";
import {
  CATEGORY_TO_PRICE_FIELD,
  placesToCategoryKey,
  pickAirlinePriceForAirport,
  airlinePriceToTariff,
} from "./fapAirlineTariff.js";

// Карта пришла из utils/roomCategories.js и покрывает энум Category целиком —
// все 19 категорий, включая «Комфорт» и четыре добавленные бэком 10.08.
test("категории отображаются на поля ценника", () => {
  assert.equal(Object.keys(CATEGORY_TO_PRICE_FIELD).length, 19);
  assert.equal(CATEGORY_TO_PRICE_FIELD.onePlace, "priceOneCategory");
  assert.equal(CATEGORY_TO_PRICE_FIELD.tenPlace, "priceTenCategory");
  assert.equal(CATEGORY_TO_PRICE_FIELD.luxe, "priceLuxe");
  assert.equal(CATEGORY_TO_PRICE_FIELD.apartment, "priceApartment");
  assert.equal(CATEGORY_TO_PRICE_FIELD.studio, "priceStudio");
  assert.equal(CATEGORY_TO_PRICE_FIELD.standardDouble, "priceStandardDouble");
  assert.equal(CATEGORY_TO_PRICE_FIELD.deluxe, "priceDeluxe");
});

test("число мест переводится в ключ категории", () => {
  assert.equal(placesToCategoryKey(1), "onePlace");
  assert.equal(placesToCategoryKey(2), "twoPlace");
  assert.equal(placesToCategoryKey(10), "tenPlace");
  for (const bad of [0, 11, null, undefined, "x", -3]) {
    assert.equal(placesToCategoryKey(bad), null);
  }
});

test("подбор берёт только fap/all и только по аэропорту заявки", () => {
  const prices = [
    { id: "p1", contractType: "request", airports: [{ airport: { id: "A" } }] },
    { id: "p2", contractType: "fap", airports: [{ airport: { id: "B" } }] },
    { id: "p3", contractType: "fap", airports: [{ airport: { id: "A" } }] },
  ];
  assert.equal(pickAirlinePriceForAirport(prices, "A")?.id, "p3");
  assert.equal(pickAirlinePriceForAirport(prices, "B")?.id, "p2");
  assert.equal(pickAirlinePriceForAirport(prices, "C"), null);
});

test("тип all подходит, отсутствующий тип трактуется как request", () => {
  const all = [{ id: "a", contractType: "all", airports: [{ airport: { id: "A" } }] }];
  assert.equal(pickAirlinePriceForAirport(all, "A")?.id, "a");
  const legacy = [{ id: "l", airports: [{ airport: { id: "A" } }] }];
  assert.equal(pickAirlinePriceForAirport(legacy, "A"), null);
});

test("подбор устойчив к пустым и кривым данным", () => {
  assert.equal(pickAirlinePriceForAirport(null, "A"), null);
  assert.equal(pickAirlinePriceForAirport([], "A"), null);
  assert.equal(pickAirlinePriceForAirport([{ id: "x", contractType: "fap" }], "A"), null);
  assert.equal(pickAirlinePriceForAirport([{ id: "x", contractType: "fap", airports: [{ airport: { id: "A" } }] }], null), null);
});

test("ценник превращается в тариф с картой цен и питанием", () => {
  const tariff = airlinePriceToTariff({
    id: "p1",
    name: "Договор №7",
    prices: { priceOneCategory: 2300, priceLuxe: 5000, priceTwoCategory: 0 },
    mealPrice: { breakfast: 100, lunch: 200, dinner: 300 },
  });
  assert.equal(tariff.id, "p1");
  assert.equal(tariff.name, "Договор №7");
  assert.equal(tariff.source, "airline");
  assert.equal(tariff.draft, false);
  assert.equal(tariff.breakfast, 100);
  assert.equal(tariff.foodCost, 600);
  assert.equal(tariff.categoryPrices.onePlace, 2300);
  assert.equal(tariff.categoryPrices.luxe, 5000);
  // нулевая цена = категория не заполнена, в карту не попадает
  assert.equal(tariff.categoryPrices.twoPlace, undefined);
});

test("тариф из пустого ценника не падает и получает имя по умолчанию", () => {
  const tariff = airlinePriceToTariff({ id: "p2" });
  assert.equal(tariff.name, "Договор авиакомпании");
  assert.deepEqual(tariff.categoryPrices, {});
  assert.equal(tariff.foodCost, 0);
  assert.equal(airlinePriceToTariff(null), null);
});
