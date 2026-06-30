/**
 * Конвертеры географии тарифа авиакомпании (AirlinePrice.geography).
 * Бэкенд хранит geography МАССИВОМ записей PriceGeography:
 *   { country, region, city, cityId, cityRef, regionId, regionRef }
 * Регион вынесен в отдельную модель Region — приоритетно работаем с regionId.
 * Форма работает со списком "строк" (rows), каждая — один город ИЛИ регион.
 */

let _geoRowSeq = 0;
const nextGeoRowKey = () => `geo_row_${++_geoRowSeq}`;

/** Пустая строка для добавления в форму. */
export function createEmptyGeoRow() {
  return {
    key: nextGeoRowKey(),
    cityId: null,
    city: null,
    regionId: null,
    region: null,
    country: null,
  };
}

/**
 * API geography (массив) -> строки формы.
 * @param {Array|undefined|null} apiGeography
 */
export function geographyToRows(apiGeography) {
  if (!Array.isArray(apiGeography)) return [];
  return apiGeography.map((g) => ({
    key: g?.cityId || g?.regionId || g?.region || nextGeoRowKey(),
    cityId: g?.cityId || null,
    city: g?.cityRef?.city || g?.city || null,
    regionId: g?.regionId || g?.regionRef?.id || null,
    region: g?.regionRef?.name || g?.region || null,
    country: g?.country || null,
  }));
}

/**
 * Строки формы -> input для GraphQL ([PriceGeographyInput!]).
 * Город -> { cityId, country }; иначе регион -> { regionId, country };
 * legacy (только строка region без id) -> { region, country };
 * пустые строки отсекаются (бэк не принимает поле city и пустые объекты).
 * @param {Array} rows
 */
export function rowsToGeographyInput(rows) {
  if (!Array.isArray(rows)) return [];
  return rows
    .map((r) => {
      if (r?.cityId) return { cityId: r.cityId, country: r.country || null };
      if (r?.regionId) return { regionId: r.regionId, country: r.country || null };
      if (r?.region) return { region: r.region, country: r.country || null };
      return null;
    })
    .filter(Boolean);
}
