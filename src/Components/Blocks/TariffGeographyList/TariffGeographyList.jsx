import { useMemo } from "react";
import PropTypes from "prop-types";
import { useQuery } from "@apollo/client";
import { createFilterOptions } from "@mui/material/Autocomplete";
import classes from "./TariffGeographyList.module.css";
import MultiSelectAutocomplete from "../MultiSelectAutocomplete/MultiSelectAutocomplete.jsx";
import { GET_REGIONS, GET_CITIES, getCookie } from "../../../../graphQL_requests.js";
import {
  geographyRowsToSelection,
  selectionToGeographyRows,
} from "../../../utils/airlineTariffGeography.js";

// Список всех городов может быть большим — ограничиваем выдачу дропдауна.
const cityFilter = createFilterOptions({ limit: 100 });

/**
 * Гео-привязка тарифа авиакомпании: два независимых мультиселекта —
 * «Регионы» (все регионы) и «Города» (все города; выбор не требует региона).
 * Правило записей (1:1 с rowsToGeographyInput): регион -> {regionId},
 * город -> {cityId}.
 *
 * Контракт пропсов не меняется:
 *   value: Array<{key,cityId,city,regionId,region,country}>
 *   onChange: (nextRows) => void
 */
function TariffGeographyList({ value = [], onChange, disabled = false }) {
  const token = getCookie("token");

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

  const { selectedRegions, selectedCities } = useMemo(
    () => geographyRowsToSelection(value, regionOptions, cityOptions),
    [value, regionOptions, cityOptions]
  );

  const emit = (regions, cities) => onChange(selectionToGeographyRows(regions, cities));

  const hasSelection = selectedRegions.length > 0 || selectedCities.length > 0;

  return (
    <div className={classes.wrapper}>
      <label>Географическая привязка</label>
      {!hasSelection && (
        <div className={classes.empty}>
          Не задана — тариф сработает только по аэропортам.
        </div>
      )}

      <MultiSelectAutocomplete
        isMultiple
        showSelectAll
        dropdownWidth="100%"
        label="Регионы"
        options={regionOptions}
        value={selectedRegions}
        onChange={(_e, newRegions) => emit(newRegions || [], selectedCities)}
        isDisabled={disabled || regionsQuery.loading}
      />

      <MultiSelectAutocomplete
        isMultiple
        showSelectAll
        dropdownWidth="100%"
        label="Города"
        options={cityOptions}
        value={selectedCities}
        filterOptions={cityFilter}
        onChange={(_e, newCities) => emit(selectedRegions, newCities || [])}
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
};

export default TariffGeographyList;
