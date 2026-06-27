/**
 * Конвертеры географии тарифа авиакомпании (AirlinePrice.geography).
 * Бэкенд хранит geography МАССИВОМ записей PriceGeography:
 *   { country, region, city, cityId, cityRef }
 * Форма работает со списком "строк" (rows), каждая — один город ИЛИ регион.
 */

let _geoRowSeq = 0;
const nextGeoRowKey = () => `geo_row_${++_geoRowSeq}`;

/** Пустая строка для добавления в форму. */
export function createEmptyGeoRow() {
  return { key: nextGeoRowKey(), cityId: null, region: null, country: null, city: null };
}

/**
 * API geography (массив) -> строки формы.
 * @param {Array|undefined|null} apiGeography
 * @returns {Array<{key,cityId,region,country,city}>}
 */
export function geographyToRows(apiGeography) {
  if (!Array.isArray(apiGeography)) return [];
  return apiGeography.map((g) => ({
    key: g?.cityId || g?.region || nextGeoRowKey(),
    cityId: g?.cityId || null,
    region: g?.region || null,
    country: g?.country || null,
    city: g?.cityRef?.city || g?.city || null,
  }));
}

/**
 * Строки формы -> input для GraphQL ([PriceGeographyInput!]).
 * Город -> { cityId, country }; иначе регион -> { region, country };
 * пустые строки отсекаются (бэк не принимает поле city и пустые объекты).
 * @param {Array} rows
 * @returns {Array<{cityId?:string,region?:string,country?:string|null}>}
 */
export function rowsToGeographyInput(rows) {
  if (!Array.isArray(rows)) return [];
  return rows
    .map((r) => {
      if (r?.cityId) return { cityId: r.cityId, country: r.country || null };
      if (r?.region) return { region: r.region, country: r.country || null };
      return null;
    })
    .filter(Boolean);
}
