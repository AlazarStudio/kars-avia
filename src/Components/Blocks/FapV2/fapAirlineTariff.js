// Ценник авиакомпании как источник тарифа проживания ФАП.
// Чистый модуль: без React и без запросов.
//
// Категории номера ФАП (ROOM_CATEGORY_LABEL в fapRooms.js) сопоставляются с полями
// ценника АК (PRICE_FIELDS в utils/airlineTariffPrices.js). Пар ровно 13.
// priceComfort и priceImprovedComfort не используются: категории «Комфорт» нет
// ни в одном справочнике номеров гостиницы.

import { normalizeAppliesTo } from "../../../utils/airlineTariffPrices.js";

export const CATEGORY_TO_PRICE_FIELD = {
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
  luxe: "priceLuxe",
  apartment: "priceApartment",
  studio: "priceStudio",
};

const PLACES_TO_CATEGORY = [
  null, "onePlace", "twoPlace", "threePlace", "fourPlace", "fivePlace",
  "sixPlace", "sevenPlace", "eightPlace", "ninePlace", "tenPlace",
];

/** Число мест → ключ категории; вне диапазона 1..10 — null. */
export function placesToCategoryKey(places) {
  const n = Number(places);
  if (!Number.isInteger(n) || n < 1 || n > 10) return null;
  return PLACES_TO_CATEGORY[n];
}

/** Типы ценников, применимых к пассажирской заявке. */
const FAP_CONTRACT_TYPES = new Set(["fap", "all"]);

/**
 * Ценник для заявки: тип fap/all И аэропорт заявки в списке аэропортов ценника.
 * По правилам конфликтов подходящий ценник может быть только один; если данные
 * рассинхронизированы и подходит несколько — берём первый и не падаем.
 */
export function pickAirlinePriceForAirport(prices, airportId) {
  if (!Array.isArray(prices) || !airportId) return null;
  const wanted = String(airportId);
  return (
    prices.find(
      (p) =>
        FAP_CONTRACT_TYPES.has(normalizeAppliesTo(p?.contractType)) &&
        (p?.airports ?? []).some((a) => String(a?.airport?.id ?? a?.id) === wanted)
    ) ?? null
  );
}

const toNum = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

/**
 * Ценник АК → тариф отчёта. Нулевые и незаполненные категории в карту не попадают:
 * их отсутствие означает «цена не задана» и даёт в отчёте предупреждение.
 */
export function airlinePriceToTariff(price) {
  if (!price) return null;
  const categoryPrices = {};
  for (const [category, field] of Object.entries(CATEGORY_TO_PRICE_FIELD)) {
    const value = toNum(price?.prices?.[field]);
    if (value > 0) categoryPrices[category] = value;
  }
  const breakfast = toNum(price?.mealPrice?.breakfast);
  const lunch = toNum(price?.mealPrice?.lunch);
  const dinner = toNum(price?.mealPrice?.dinner);
  return {
    id: price.id,
    name: price.name || "Договор авиакомпании",
    source: "airline",
    draft: false,
    breakfast,
    lunch,
    dinner,
    foodCost: breakfast + lunch + dinner,
    categoryPrices,
  };
}

/** Цена за сутки договорного тарифа: по категории, иначе по числу мест. */
export function airlineTariffPricePerDay(tariff, places, category) {
  const map = tariff?.categoryPrices ?? {};
  const byCategory = category ? map[category] : undefined;
  if (byCategory > 0) return byCategory;
  const key = placesToCategoryKey(places);
  const byPlaces = key ? map[key] : undefined;
  return byPlaces > 0 ? byPlaces : null;
}
