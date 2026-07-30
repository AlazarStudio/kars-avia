/**
 * Конвертеры цен тарифа авиакомпании (AirlinePrice) — API ↔ форма ↔ payload.
 * Зеркалит подход utils/transferPrices.js: форма работает с плоским formData,
 * маппинг вынесен сюда, персист (мутация) — на стороне родителя.
 *
 * Payload — ОДНА запись для input.prices мутации UPDATE_AIRLINE_TARIF
 * (upsert одной записи: без id — создание, с id — обновление).
 */

import { geographyToRows, rowsToGeographyInput } from "./airlineTariffGeography.js";

/** Список числовых полей цен (порядок как в формах). */
const PRICE_FIELDS = [
  "priceOneCategory",
  "priceTwoCategory",
  "priceThreeCategory",
  "priceFourCategory",
  "priceFiveCategory",
  "priceSixCategory",
  "priceSevenCategory",
  "priceEightCategory",
  "priceLuxe",
  "priceApartment",
  "priceStudio",
  "priceComfort",
  "priceImprovedComfort",
  "priceNineCategory",
  "priceTenCategory",
];

const MEAL_FIELDS = ["breakfast", "dinner", "lunch"];

/**
 * Значения бэкенд-поля AirlinePrice.contractType (энум AirlinePriceContractType).
 * ВАЖНО: это НЕ «Тип договора» из формы (individual/shared) — то другое поле,
 * которое решает, задаётся ценник географией или аэропортами.
 * Здесь — к какому виду заявок ценник применяется.
 */
export const PRICE_APPLIES_TO_OPTIONS = [
  { key: "request", label: "Эскадрилья" },
  { key: "fap", label: "ФАП" },
  { key: "all", label: "Все типы" },
];

export const DEFAULT_APPLIES_TO = "request";

/** Ценники, созданные до появления поля, читаются как request. */
export function normalizeAppliesTo(value) {
  return PRICE_APPLIES_TO_OPTIONS.some((o) => o.key === value)
    ? value
    : DEFAULT_APPLIES_TO;
}

/**
 * Типы, внутри которых локация не может быть занята дважды.
 * request ↔ request/all, fap ↔ fap/all, all ↔ всем.
 */
export function conflictingContractTypes(appliesTo) {
  const type = normalizeAppliesTo(appliesTo);
  return type === "all" ? ["all", "fap", "request"] : [type, "all"];
}

/** Подпись типа для бейджа в списке ценников. */
export function appliesToLabel(value) {
  const type = normalizeAppliesTo(value);
  return PRICE_APPLIES_TO_OPTIONS.find((o) => o.key === type).label;
}

/**
 * Пустой input формы (значения цен — null, как при создании).
 * @returns {object}
 */
export function createEmptyTariffInput() {
  const empty = {
    name: "",
    airportIds: [],
    geography: [],
  };
  PRICE_FIELDS.forEach((k) => {
    empty[k] = null;
  });
  MEAL_FIELDS.forEach((k) => {
    empty[k] = null;
  });
  return empty;
}

/**
 * API AirlinePrice -> input формы (как getInitialFormData в форме редактирования).
 * @param {object} tarif AirlinePrice ({ name, airports?, geography?, prices?, mealPrice? })
 * @returns {object}
 */
export function airlineTariffToInput(tarif) {
  const airportIds = Array.isArray(tarif?.airports)
    ? tarif.airports
        .map((a) => String(a?.airport?.id ?? a?.id ?? a))
        .filter(Boolean)
    : [];

  const input = {
    name: tarif?.name || "",
    airportIds,
    geography: geographyToRows(tarif?.geography),
  };
  PRICE_FIELDS.forEach((k) => {
    input[k] = tarif?.prices?.[k] ?? 0;
  });
  MEAL_FIELDS.forEach((k) => {
    input[k] = tarif?.mealPrice?.[k] ?? 0;
  });
  return input;
}

/**
 * Input формы -> одна запись payload для input.prices мутации UPDATE_AIRLINE_TARIF.
 * Тип договора: individual -> шлём airportIds (geography пустая),
 * shared -> шлём geography (airportIds пустые) — как в текущих handleSubmit.
 *
 * @param {object} formData
 * @param {"individual"|"shared"} contractType
 * @param {{ id?: string, coerceZero?: boolean, appliesTo?: string }} [opts]
 *   id — для обновления существующей записи;
 *   coerceZero — приводить NaN к 0 (форма создания шлёт `parseFloat || 0`,
 *   форма редактирования — `parseFloat`). Сохраняем историческое поведение;
 *   appliesTo — вид заявок ценника (уходит в поле contractType, см.
 *   PRICE_APPLIES_TO_OPTIONS); по умолчанию request.
 * @returns {object}
 */
export function tariffInputToPayload(formData, contractType, opts = {}) {
  const { id, coerceZero = false, appliesTo } = opts;
  const isIndividual = contractType === "individual";
  const num = (v) => (coerceZero ? parseFloat(v) || 0 : parseFloat(v));

  const prices = {};
  PRICE_FIELDS.forEach((k) => {
    prices[k] = num(formData[k]);
  });

  const mealPrice = {};
  MEAL_FIELDS.forEach((k) => {
    mealPrice[k] = num(formData[k]);
  });

  const record = {
    ...(id ? { id } : {}),
    name: formData.name,
    individual: isIndividual,
    contractType: normalizeAppliesTo(appliesTo),
    airportIds: isIndividual ? formData.airportIds : [],
    geography: isIndividual ? [] : rowsToGeographyInput(formData.geography),
    prices,
    mealPrice,
  };
  return record;
}

/**
 * Input формы -> display-элемент (форма AirlinePrice, как в data.airline.prices)
 * для ОПТИМИСТИЧНОГО показа в таблице до прихода серверных данных (refetch).
 * Таблица читает airports[].airport.{code,city,name}, geography[] (city/region),
 * prices/mealPrice, name, individual — их и собираем из того, что уже есть у формы.
 * Числа приводим к числу (в таблице `value?.toLocaleString()`).
 *
 * @param {object} formData
 * @param {"individual"|"shared"} contractType
 * @param {Array} airports полный список аэропортов ({id,code,name,city}) — есть у формы
 * @param {{ id?: string, prevCategory?: Array, appliesTo?: string }} [opts]
 *   id — для существующей записи (edit); prevCategory — сохранить категории записи;
 *   appliesTo — вид заявок ценника (поле contractType), нужен бейджу в таблице.
 * @returns {object}
 */
export function tariffFormToDisplayItem(formData, contractType, airports = [], opts = {}) {
  const { id, prevCategory = [], appliesTo } = opts;
  const isIndividual = contractType === "individual";
  const toNum = (v) => parseFloat(v) || 0;
  const airportsById = new Map((airports || []).map((a) => [String(a.id), a]));

  const prices = {};
  PRICE_FIELDS.forEach((k) => {
    prices[k] = toNum(formData[k]);
  });
  const mealPrice = {};
  MEAL_FIELDS.forEach((k) => {
    mealPrice[k] = toNum(formData[k]);
  });

  return {
    ...(id ? { id } : {}),
    name: formData.name || "",
    individual: isIndividual,
    contractType: normalizeAppliesTo(appliesTo),
    airports: isIndividual
      ? (formData.airportIds || [])
          .map((aid) => {
            const a = airportsById.get(String(aid));
            return a ? { id: String(aid), airport: a } : null;
          })
          .filter(Boolean)
      : [],
    geography: isIndividual ? [] : formData.geography || [],
    prices,
    mealPrice,
    category: prevCategory,
  };
}
