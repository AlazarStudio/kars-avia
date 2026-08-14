/**
 * Конвертеры цен тарифа авиакомпании (AirlinePrice) — API ↔ форма ↔ payload.
 * Зеркалит подход utils/transferPrices.js: форма работает с плоским formData,
 * маппинг вынесен сюда, персист (мутация) — на стороне родителя.
 *
 * Payload — ОДНА запись для input.prices мутации UPDATE_AIRLINE_TARIF
 * (upsert одной записи: без id — создание, с id — обновление).
 */

import { geographyToRows, rowsToGeographyInput } from "./airlineTariffGeography.js";
import { PRICE_FIELDS } from "./roomCategories.js";

export { PRICE_FIELDS };

const MEAL_FIELDS = ["breakfast", "dinner", "lunch"];

/** Строки полей питания в формах цен (порядок отображения — исторический). */
export const MEAL_ROWS = [
  { key: "breakfast", title: "Завтрак" },
  { key: "lunch", title: "Обед" },
  { key: "dinner", title: "Ужин" },
];

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

/**
 * Локации, занятые ДРУГИМИ ценниками, для заданного вида заявок.
 * Учитываются только ценники с конфликтующим типом (conflictingContractTypes).
 * Используется и для дизейбла опций в пикерах, и для пересчёта уже сделанного
 * выбора при смене «Применяется к».
 *
 * @param {Array} contracts список ценников авиакомпании (addTarif)
 * @param {string} appliesTo вид заявок, для которого считаем занятость
 * @param {string} [excludeId] id редактируемого ценника — сам себя не блокирует
 * @returns {{ airportIds: Set<string>, regionIds: Set<string>, cityIds: Set<string> }}
 */
export function collectUsedLocations(contracts, appliesTo, excludeId) {
  const conflicting = new Set(conflictingContractTypes(appliesTo));
  const airportIds = new Set();
  const regionIds = new Set();
  const cityIds = new Set();

  (contracts || []).forEach((contract) => {
    if (excludeId && contract?.id === excludeId) return;
    if (!conflicting.has(normalizeAppliesTo(contract?.contractType))) return;
    (contract?.airports || []).forEach((a) => {
      const airportId = a?.airport?.id ?? a?.id;
      if (airportId != null) airportIds.add(String(airportId));
    });
    (contract?.geography || []).forEach((g) => {
      const cityId = g?.cityId || g?.cityRef?.id;
      const regionId = g?.regionId || g?.regionRef?.id;
      if (cityId) cityIds.add(String(cityId));
      else if (regionId) regionIds.add(String(regionId));
    });
  });

  return { airportIds, regionIds, cityIds };
}

/**
 * Убирает из выбора формы локации, занятые в конфликтующих ценниках.
 * Чистая функция: возвращает новые массивы и то, что было снято
 * (аэропорты — id, гео — названия региона/города для подсказки).
 *
 * @param {object} formData { airportIds?: Array, geography?: Array }
 * @param {{ airportIds: Set<string>, regionIds: Set<string>, cityIds: Set<string> }} used
 * @returns {{ airportIds: Array, geography: Array, removedAirportIds: Array<string>, removedGeoLabels: Array<string> }}
 */
export function pruneUsedSelections(formData, used) {
  const usedAirports = used?.airportIds || new Set();
  const usedCities = used?.cityIds || new Set();
  const usedRegions = used?.regionIds || new Set();

  const airportIds = [];
  const removedAirportIds = [];
  (formData?.airportIds || []).forEach((airportId) => {
    if (usedAirports.has(String(airportId))) removedAirportIds.push(String(airportId));
    else airportIds.push(airportId);
  });

  const geography = [];
  const removedGeoLabels = [];
  (formData?.geography || []).forEach((row) => {
    if (row?.cityId && usedCities.has(String(row.cityId))) {
      removedGeoLabels.push(row.city || "Город");
      return;
    }
    if (!row?.cityId && row?.regionId && usedRegions.has(String(row.regionId))) {
      removedGeoLabels.push(row.region || "Регион");
      return;
    }
    geography.push(row);
  });

  return { airportIds, geography, removedAirportIds, removedGeoLabels };
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
