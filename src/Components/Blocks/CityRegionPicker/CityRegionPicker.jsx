import React, { useMemo } from "react";
import { useQuery } from "@apollo/client";
import classes from "./CityRegionPicker.module.css";
import MUIAutocomplete from "../MUIAutocomplete/MUIAutocomplete.jsx";
import {
  GET_CITY_REGIONS,
  GET_CITIES_BY_REGION,
  getCookie,
} from "../../../../graphQL_requests.js";

/**
 * Универсальный пикер региона + города из справочника `City`.
 *
 * Props:
 *  - value: { cityId: string|null, region: string|null }
 *  - onChange: ({ cityId, region }) => void
 *  - mode: "both" | "cityOnly"
 *      "both"     — оба поля видны (для тарифа АК)
 *      "cityOnly" — оба поля показаны, но регион здесь лишь каскадный фильтр.
 *                   В onChange всё равно передаётся пара { cityId, region }.
 *  - allowEmpty: boolean — если false, очистка региона запрещена UI-уровнем.
 *  - disabled: boolean
 *  - hint: string  — необязательная подпись под полями.
 */
function CityRegionPicker({
  value = { cityId: null, region: null },
  onChange,
  mode = "both",
  allowEmpty = true,
  disabled = false,
  hint,
}) {
  const token = getCookie("token");

  const regionsQuery = useQuery(GET_CITY_REGIONS, {
    context: { headers: { Authorization: `Bearer ${token}` } },
  });

  const citiesQuery = useQuery(GET_CITIES_BY_REGION, {
    variables: { region: value.region || "" },
    skip: !value.region,
    context: { headers: { Authorization: `Bearer ${token}` } },
  });

  const regionOptions = useMemo(
    () => regionsQuery.data?.cityRegions || [],
    [regionsQuery.data]
  );

  const cityOptions = useMemo(
    () =>
      (citiesQuery.data?.citiesByRegion || []).map((c) => ({
        id: c.id,
        label: c.city,
        region: c.region,
      })),
    [citiesQuery.data]
  );

  const selectedCity = useMemo(
    () => cityOptions.find((o) => o.id === value.cityId) || null,
    [cityOptions, value.cityId]
  );

  const handleRegionChange = (_, newRegion) => {
    if (!allowEmpty && !newRegion) return;
    onChange({ region: newRegion || null, cityId: null });
  };

  const handleCityChange = (_, newCity) => {
    onChange({ region: value.region || null, cityId: newCity?.id || null });
  };

  return (
    <div className={classes.wrapper}>
      <div className={classes.fields}>
        <div>
          <div className={classes.fieldLabel}>
            {mode === "cityOnly" ? "Регион (фильтр)" : "Регион"}
          </div>
          <MUIAutocomplete
            dropdownWidth="100%"
            label="Выберите регион"
            options={regionOptions}
            value={value.region || null}
            onChange={handleRegionChange}
            isDisabled={disabled || regionsQuery.loading}
          />
        </div>

        <div>
          <div className={classes.fieldLabel}>Город</div>
          <MUIAutocomplete
            dropdownWidth="100%"
            label={value.region ? "Выберите город" : "Сначала выберите регион"}
            options={cityOptions}
            value={selectedCity}
            onChange={handleCityChange}
            isDisabled={disabled || !value.region || citiesQuery.loading}
          />
        </div>
      </div>
      {hint ? <div className={classes.hint}>{hint}</div> : null}
    </div>
  );
}

export default CityRegionPicker;
