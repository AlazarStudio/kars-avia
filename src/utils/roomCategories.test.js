import test from "node:test";
import assert from "node:assert/strict";

import {
  ROOM_CATEGORIES,
  CATEGORY_LABELS,
  CATEGORY_TO_PRICE_FIELD,
  CATEGORY_PLACES,
  CATEGORY_STATED_PLACES,
  categoryLabel,
  categoryShortLabel,
  PRICE_FIELDS,
  AIRLINE_PRICE_ROWS,
  pickCategories,
  TARIF_ROOM_CATEGORIES,
  ROOM_FUND_CATEGORIES,
  APARTMENT_CATEGORIES,
} from "./roomCategories.js";

// Копия энума Category из typeDefs/hotel/hotel.typeDef.js. Тест падает, когда
// бэкенд завёл категорию, а фронт про неё не знает: без подписи она покажется
// сырым ключом, а без поля цены не подберётся тариф договора.
const BACKEND_CATEGORY_ENUM = [
  "apartment",
  "studio",
  "luxe",
  "comfort",
  "improvedComfort",
  "economySingle",
  "standardSingle",
  "standardDouble",
  "deluxe",
  "onePlace",
  "twoPlace",
  "threePlace",
  "fourPlace",
  "fivePlace",
  "sixPlace",
  "sevenPlace",
  "eightPlace",
  "ninePlace",
  "tenPlace",
];

// Копия categoryToPlaces из services/hotel/roomUtils.js.
const BACKEND_PLACES = {
  apartment: 2, studio: 2, luxe: 2, comfort: 2, improvedComfort: 2,
  economySingle: 1, standardSingle: 1, standardDouble: 2, deluxe: 2,
  onePlace: 1, twoPlace: 2, threePlace: 3, fourPlace: 4, fivePlace: 5,
  sixPlace: 6, sevenPlace: 7, eightPlace: 8, ninePlace: 9, tenPlace: 10,
};

// Копия priceMap из getCategoryPriceFromContract (resolvePriceByHotelLocation.js).
const BACKEND_PRICE_FIELDS = {
  studio: "priceStudio",
  apartment: "priceApartment",
  luxe: "priceLuxe",
  comfort: "priceComfort",
  improvedComfort: "priceImprovedComfort",
  economySingle: "priceEconomySingle",
  standardSingle: "priceStandardSingle",
  standardDouble: "priceStandardDouble",
  deluxe: "priceDeluxe",
  onePlace: "priceOneCategory",
  twoPlace: "priceTwoCategory",
  threePlace: "priceThreeCategory",
  fourPlace: "priceFourCategory",
  fivePlace: "priceFiveCategory",
  sixPlace: "priceSixCategory",
  sevenPlace: "priceSevenCategory",
  eightPlace: "priceEightCategory",
  ninePlace: "priceNineCategory",
  tenPlace: "priceTenCategory",
};

test("справочник покрывает энум Category целиком и без лишнего", () => {
  assert.deepEqual(
    ROOM_CATEGORIES.map((c) => c.value).sort(),
    [...BACKEND_CATEGORY_ENUM].sort()
  );
});

test("вместимость совпадает с серверной картой", () => {
  assert.deepEqual(CATEGORY_PLACES, BACKEND_PLACES);
});

test("поля цен совпадают с серверной картой", () => {
  assert.deepEqual(CATEGORY_TO_PRICE_FIELD, BACKEND_PRICE_FIELDS);
});

test("ключи, подписи и поля цен уникальны", () => {
  const unique = (list) => new Set(list).size === list.length;
  assert.ok(unique(ROOM_CATEGORIES.map((c) => c.value)));
  assert.ok(unique(ROOM_CATEGORIES.map((c) => c.label)));
  assert.ok(unique(PRICE_FIELDS));
});

test("statedPlaces только у категорий, называющих число мест", () => {
  assert.deepEqual(Object.keys(CATEGORY_STATED_PLACES).sort(), [
    "economySingle", "eightPlace", "fivePlace", "fourPlace", "ninePlace",
    "onePlace", "sevenPlace", "sixPlace", "standardDouble", "standardSingle",
    "tenPlace", "threePlace", "twoPlace",
  ]);
  assert.equal(CATEGORY_STATED_PLACES.standardDouble, 2);
  assert.equal(CATEGORY_STATED_PLACES.luxe, undefined);
  assert.equal(CATEGORY_STATED_PLACES.deluxe, undefined);
});

test("неизвестный ключ возвращается как есть", () => {
  assert.equal(categoryLabel("penthouse"), "penthouse");
  assert.equal(categoryShortLabel("penthouse"), "penthouse");
  assert.equal(categoryLabel(undefined), "");
  assert.equal(CATEGORY_LABELS.standardSingle, "Стандарт одноместный");
});

test("строки формы цен идут в порядке справочника", () => {
  assert.equal(AIRLINE_PRICE_ROWS.length, ROOM_CATEGORIES.length);
  assert.deepEqual(
    AIRLINE_PRICE_ROWS.map((r) => r.key),
    PRICE_FIELDS
  );
  assert.deepEqual(AIRLINE_PRICE_ROWS.at(-1), {
    key: "priceStudio",
    title: "Стоимость студии",
    label: "Студия",
  });
});

test("pickCategories держит порядок и молча пропускает мусор", () => {
  assert.deepEqual(
    pickCategories(["studio", "penthouse", "luxe"]).map((c) => c.value),
    ["studio", "luxe"]
  );
});

test("списки выбора содержат четыре новые категории и не содержат лишних", () => {
  const added = ["economySingle", "standardSingle", "standardDouble", "deluxe"];

  added.forEach((value) => {
    assert.ok(TARIF_ROOM_CATEGORIES.some((c) => c.value === value), value);
    assert.ok(ROOM_FUND_CATEGORIES.some((c) => c.value === value), value);
  });

  // Расширять выбор молча нельзя: этих категорий в формах не предлагали.
  ["ninePlace", "tenPlace", "comfort", "improvedComfort"].forEach((value) => {
    assert.ok(!TARIF_ROOM_CATEGORIES.some((c) => c.value === value), value);
    assert.ok(!ROOM_FUND_CATEGORIES.some((c) => c.value === value), value);
  });

  assert.equal(TARIF_ROOM_CATEGORIES.length, 13);
  assert.equal(ROOM_FUND_CATEGORIES.length, 12);
  assert.deepEqual(
    APARTMENT_CATEGORIES.map((c) => c.value),
    ["apartment", "studio"]
  );
});
