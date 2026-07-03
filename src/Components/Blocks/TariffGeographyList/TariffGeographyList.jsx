import { useMemo, useState } from "react";
import PropTypes from "prop-types";
import { useQuery } from "@apollo/client";
import classes from "./TariffGeographyList.module.css";
import MultiSelectAutocomplete from "../MultiSelectAutocomplete/MultiSelectAutocomplete.jsx";
import { GET_REGIONS, GET_CITIES, getCookie } from "../../../../graphQL_requests.js";
import {
  geographyRowsToSelection,
  selectionToGeographyRows,
  computeDisabledRegionIds,
} from "../../../utils/airlineTariffGeography.js";

/**
 * Гео-привязка тарифа авиакомпании: два независимых мультиселекта —
 * «Регионы» (все регионы) и «Города» (все города; выбор не требует региона).
 * Правило записей (1:1 с rowsToGeographyInput): регион -> {regionId},
 * город -> {cityId}.
 *
 * usedRegionIds / usedCityIds — id, уже занятые другими договорами: такие
 * опции блокируются (бэк запрещает регион/город в двух тарифах).
 *
 * Контракт пропсов не меняется:
 *   value: Array<{key,cityId,city,regionId,region,country}>
 *   onChange: (nextRows) => void
 */
function TariffGeographyList({
  value = [],
  onChange,
  disabled = false,
  usedRegionIds = [],
  usedCityIds = [],
}) {
  const token = getCookie("token");
  const [skippedRegions, setSkippedRegions] = useState([]);
  const [skippedCities, setSkippedCities] = useState([]);

  const regionsQuery = useQuery(GET_REGIONS, {
    context: { headers: { Authorization: `Bearer ${token}` } },
  });
  const citiesQuery = useQuery(GET_CITIES, {
    context: { headers: { Authorization: `Bearer ${token}` } },
  });

  const regionOptions = useMemo(
    () =>
      (regionsQuery.data?.regions || []).map((r) => ({
        id: r.id,
        label: r.name,
        name: r.name,
      })),
    [regionsQuery.data]
  );

  const cityOptions = useMemo(
    () =>
      (citiesQuery.data?.citys || []).map((c) => ({
        id: c.id,
        label: c.region ? `${c.city} (${c.region})` : c.city,
        city: c.city,
        region: c.region || "",
      })),
    [citiesQuery.data]
  );

  const usedCitySet = useMemo(
    () => new Set((usedCityIds || []).map(String)),
    [usedCityIds]
  );

  const regionDisabledSet = useMemo(
    () =>
      computeDisabledRegionIds(
        regionOptions,
        cityOptions,
        usedRegionIds,
        usedCityIds
      ),
    [regionOptions, cityOptions, usedRegionIds, usedCityIds]
  );

  const allRegionsUsed =
    regionOptions.length > 0 &&
    regionOptions.every((o) => regionDisabledSet.has(String(o.id)));
  const allCitiesUsed =
    cityOptions.length > 0 &&
    cityOptions.every((o) => usedCitySet.has(String(o.id)));

  const { selectedRegions, selectedCities } = useMemo(
    () => geographyRowsToSelection(value, regionOptions, cityOptions),
    [value, regionOptions, cityOptions]
  );

  const emit = (regions, cities) => onChange(selectionToGeographyRows(regions, cities));

  const handleRegionsChange = (_e, newRegions, _reason, details) => {
    emit(newRegions || [], selectedCities);
    if (details?.option?.isSelectAll && (newRegions || []).length > 0) {
      setSkippedRegions(regionOptions.filter((o) => regionDisabledSet.has(String(o.id))));
    } else {
      setSkippedRegions([]);
    }
  };

  const handleCitiesChange = (_e, newCities, _reason, details) => {
    emit(selectedRegions, newCities || []);
    if (details?.option?.isSelectAll && (newCities || []).length > 0) {
      setSkippedCities(cityOptions.filter((o) => usedCitySet.has(String(o.id))));
    } else {
      setSkippedCities([]);
    }
  };

  const hasSelection = selectedRegions.length > 0 || selectedCities.length > 0;

  return (
    <div className={classes.wrapper}>
      <label>Географическая привязка</label>
      {!hasSelection && (
        <div className={classes.empty}>
          Не задана — тариф сработает только по аэропортам.
        </div>
      )}

      {allRegionsUsed && (
        <div className={classes.usedHint}>
          Все регионы уже используются в других договорах — свободных нет.
        </div>
      )}
      {skippedRegions.length > 0 && (
        <div className={classes.usedHint}>
          Не выбраны: {skippedRegions.map((r) => r.label).join(", ")} — уже
          используются в других договорах
        </div>
      )}
      <MultiSelectAutocomplete
        isMultiple
        showSelectAll
        dropdownWidth="100%"
        label="Регионы"
        options={regionOptions}
        getOptionDisabled={(opt) => regionDisabledSet.has(String(opt.id))}
        value={selectedRegions}
        onChange={handleRegionsChange}
        isDisabled={disabled || regionsQuery.loading}
      />

      {allCitiesUsed && (
        <div className={classes.usedHint}>
          Все города уже используются в других договорах — свободных нет.
        </div>
      )}
      {skippedCities.length > 0 && (
        <div className={classes.usedHint}>
          Не выбраны: {skippedCities.map((c) => c.label).join(", ")} — уже
          используются в других договорах
        </div>
      )}
      <MultiSelectAutocomplete
        isMultiple
        showSelectAll
        dropdownWidth="100%"
        label="Города"
        options={cityOptions}
        getOptionDisabled={(opt) => usedCitySet.has(String(opt.id))}
        value={selectedCities}
        onChange={handleCitiesChange}
        isDisabled={disabled || citiesQuery.loading}
      />

      <div className={classes.hint}>
        Регион — тариф на весь регион. Города можно выбирать отдельно, регион для
        этого выбирать не нужно.
      </div>
    </div>
  );
}

TariffGeographyList.propTypes = {
  value: PropTypes.arrayOf(PropTypes.object),
  onChange: PropTypes.func,
  disabled: PropTypes.bool,
  usedRegionIds: PropTypes.array,
  usedCityIds: PropTypes.array,
};

export default TariffGeographyList;
