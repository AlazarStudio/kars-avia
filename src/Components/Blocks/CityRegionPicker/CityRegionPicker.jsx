import React, { useEffect, useMemo } from "react";
import { useQuery } from "@apollo/client";
import classes from "./CityRegionPicker.module.css";
import MUIAutocomplete from "../MUIAutocomplete/MUIAutocomplete.jsx";
import {
  GET_REGIONS,
  GET_CITIES_BY_REGION_ID,
  getCookie,
} from "../../../../graphQL_requests.js";

/**
 * Пикер региона + города из справочника (модель Region).
 *
 * Props:
 *  - value: { regionId, region, cityId, city }
 *  - onChange: ({ regionId, region, cityId, city }) => void
 *  - allowEmpty: boolean — если false, очистка региона запрещена UI-уровнем.
 *  - disabled: boolean
 *  - hint: string
 */
function CityRegionPicker({
  value = { regionId: null, region: null, cityId: null, city: null },
  onChange,
  allowEmpty = true,
  disabled = false,
  hint,
}) {
  const token = getCookie("token");

  const regionsQuery = useQuery(GET_REGIONS, {
    context: { headers: { Authorization: `Bearer ${token}` } },
  });

  const citiesQuery = useQuery(GET_CITIES_BY_REGION_ID, {
    variables: { regionId: value.regionId || "" },
    skip: !value.regionId,
    context: { headers: { Authorization: `Bearer ${token}` } },
  });

  const regionOptions = useMemo(
    () =>
      (regionsQuery.data?.regions || []).map((r) => ({
        id: r.id,
        label: r.name,
      })),
    [regionsQuery.data]
  );

  const cityOptions = useMemo(
    () =>
      (citiesQuery.data?.citiesByRegionId || []).map((c) => ({
        id: c.id,
        label: c.city,
        region: c.region,
      })),
    [citiesQuery.data]
  );

  const selectedRegion = useMemo(() => {
    if (value.regionId)
      return regionOptions.find((o) => o.id === value.regionId) || null;
    if (value.region)
      return (
        regionOptions.find(
          (o) =>
            o.label.trim().toLowerCase() === value.region.trim().toLowerCase()
        ) || null
      );
    return null;
  }, [regionOptions, value.regionId, value.region]);

  const selectedCity = useMemo(
    () => cityOptions.find((o) => o.id === value.cityId) || null,
    [cityOptions, value.cityId]
  );

  // legacy: регион пришёл строкой без id — разрешаем по имени и апгрейдим до regionId
  useEffect(() => {
    if (value.regionId || !value.region) return;
    if (selectedRegion?.id) {
      onChange({
        regionId: selectedRegion.id,
        region: selectedRegion.label,
        cityId: value.cityId || null,
        city: value.city || null,
      });
    }
  }, [value.regionId, value.region, value.cityId, value.city, selectedRegion, onChange]);

  const handleRegionChange = (_, newRegion) => {
    if (!allowEmpty && !newRegion) return;
    onChange({
      regionId: newRegion?.id || null,
      region: newRegion?.label || null,
      cityId: null,
      city: null,
    });
  };

  const handleCityChange = (_, newCity) => {
    onChange({
      regionId: value.regionId || selectedRegion?.id || null,
      region: value.region || selectedRegion?.label || null,
      cityId: newCity?.id || null,
      city: newCity?.label || null,
    });
  };

  return (
    <div className={classes.wrapper}>
      <div className={classes.fields}>
        <div>
          <div className={classes.fieldLabel}>Регион</div>
          <MUIAutocomplete
            dropdownWidth="100%"
            label="Выберите регион"
            options={regionOptions}
            value={selectedRegion}
            onChange={handleRegionChange}
            isDisabled={disabled || regionsQuery.loading}
          />
        </div>

        <div>
          <div className={classes.fieldLabel}>Город</div>
          <MUIAutocomplete
            dropdownWidth="100%"
            label={value.regionId ? "Выберите город" : "Сначала выберите регион"}
            options={cityOptions}
            value={selectedCity}
            onChange={handleCityChange}
            isDisabled={disabled || !value.regionId || citiesQuery.loading}
          />
        </div>
      </div>
      {hint ? <div className={classes.hint}>{hint}</div> : null}
    </div>
  );
}

export default CityRegionPicker;
