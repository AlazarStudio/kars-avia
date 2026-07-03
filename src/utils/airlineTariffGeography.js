/**
 * Конвертеры географии тарифа авиакомпании (AirlinePrice.geography).
 * Бэкенд хранит geography МАССИВОМ записей PriceGeography:
 *   { country, region, city, cityId, cityRef, regionId, regionRef }
 * Регион вынесен в отдельную модель Region — приоритетно работаем с regionId.
 * Форма работает со списком "строк" (rows), каждая — один город ИЛИ регион.
 */

let _geoRowSeq = 0;
const nextGeoRowKey = () => `geo_row_${++_geoRowSeq}`;

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

/**
 * Ищет первый дубль в списке гео-строк — для валидации перед сохранением.
 * Правила 1:1 с бэком (assertNoDuplicateGeography): дубль — это повтор
 * cityId, либо regionId, либо legacy-имени региона. Город внутри региона и
 * сам регион дублями НЕ считаются (в input это разные поля).
 * @param {Array} rows
 * @returns {{ kind: "city"|"region", label: string|null } | null}
 */
export function findDuplicateGeoRow(rows) {
  if (!Array.isArray(rows)) return null;
  const seen = new Set();
  for (const r of rows) {
    let key;
    let kind;
    let label;
    if (r?.cityId) {
      key = `c:${r.cityId}`;
      kind = "city";
      label = r.city;
    } else if (r?.regionId) {
      key = `r:${r.regionId}`;
      kind = "region";
      label = r.region;
    } else if (r?.region) {
      key = `rn:${r.region.trim().toLowerCase()}`;
      kind = "region";
      label = r.region;
    } else {
      continue;
    }
    if (seen.has(key)) return { kind, label: label || null };
    seen.add(key);
  }
  return null;
}

const geoNorm = (s) => (s || "").trim().toLowerCase();

/**
 * Строки value -> выбранные регионы/города для мультиселектов.
 * Регионы и города НЕЗАВИСИМЫ: строка с cityId/city -> город;
 * строка с regionId/region (без города) -> регион.
 * @param {Array} rows
 * @param {Array} regionOptions [{id,name,...}]
 * @param {Array} cityOptions [{id,city,region,...}]
 * @returns {{ selectedRegions: Array, selectedCities: Array }}
 */
export function geographyRowsToSelection(rows, regionOptions = [], cityOptions = []) {
  const regionById = new Map(regionOptions.map((r) => [String(r.id), r]));
  const regionByName = new Map(regionOptions.map((r) => [geoNorm(r.name), r]));
  const cityById = new Map(cityOptions.map((c) => [String(c.id), c]));
  const cityByName = new Map(
    cityOptions.map((c) => [`${geoNorm(c.city)}|${geoNorm(c.region)}`, c])
  );

  const regions = [];
  const regionSeen = new Set();
  const cities = [];
  const citySeen = new Set();

  for (const r of rows || []) {
    if (r?.cityId || r?.city) {
      let opt = r?.cityId ? cityById.get(String(r.cityId)) : null;
      if (!opt && r?.city) opt = cityByName.get(`${geoNorm(r.city)}|${geoNorm(r.region)}`);
      if (opt && !citySeen.has(opt.id)) {
        cities.push(opt);
        citySeen.add(opt.id);
      }
    } else if (r?.regionId || r?.region) {
      const opt = r?.regionId
        ? regionById.get(String(r.regionId))
        : regionByName.get(geoNorm(r.region));
      if (opt && !regionSeen.has(opt.id)) {
        regions.push(opt);
        regionSeen.add(opt.id);
      }
    }
  }

  return { selectedRegions: regions, selectedCities: cities };
}

/**
 * Выбранные регионы/города -> строки value (независимо).
 * Регион -> строка-регион ({regionId}); город -> строка-город ({cityId}).
 * @param {Array} regions [{id,name,...}]
 * @param {Array} cities [{id,city,region,...}]
 * @returns {Array} rows
 */
export function selectionToGeographyRows(regions = [], cities = []) {
  const rows = [];
  for (const R of regions) {
    rows.push({
      key: `region:${R.id}`,
      cityId: null,
      city: null,
      regionId: R.id,
      region: R.name,
      country: null,
    });
  }
  for (const c of cities) {
    rows.push({
      key: `city:${c.id}`,
      cityId: c.id,
      city: c.city,
      regionId: null,
      region: c.region,
      country: null,
    });
  }
  return rows;
}
