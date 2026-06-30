import PropTypes from "prop-types";
import classes from "./TariffGeographyList.module.css";
import CityRegionPicker from "../CityRegionPicker/CityRegionPicker.jsx";
import { createEmptyGeoRow } from "../../../utils/airlineTariffGeography.js";
import CloseIcon from "../../../shared/icons/CloseIcon.jsx";

/**
 * Редактирование списка гео-привязок тарифа (город или регион в каждой строке).
 * value: Array<{key,cityId,region,country,city}>
 * onChange: (nextRows) => void
 */
function TariffGeographyList({ value = [], onChange, disabled = false }) {
  const updateRow = (index, patch) => {
    const next = value.map((row, i) => (i === index ? { ...row, ...patch } : row));
    onChange(next);
  };

  const removeRow = (index) => {
    onChange(value.filter((_, i) => i !== index));
  };

  const addRow = () => {
    onChange([...value, createEmptyGeoRow()]);
  };

  return (
    <div className={classes.wrapper}>
      <label>Географическая привязка</label>
      {value.length === 0 && (
        <div className={classes.empty}>
          Не задана — тариф сработает только по аэропортам.
        </div>
      )}
      {value.map((row, index) => (
        <div className={classes.row} key={row.key}>
          <div className={classes.picker}>
            <CityRegionPicker
              allowEmpty
              disabled={disabled}
              value={{
                regionId: row.regionId,
                region: row.region,
                cityId: row.cityId,
                city: row.city,
              }}
              onChange={({ regionId, region, cityId, city }) =>
                updateRow(index, {
                  regionId: regionId || null,
                  region: region || null,
                  cityId: cityId || null,
                  city: city || null,
                })
              }
            />
          </div>
          <button
            type="button"
            className={classes.removeBtn}
            onClick={() => removeRow(index)}
            disabled={disabled}
            title="Удалить"
          >
            <CloseIcon />
          </button>
        </div>
      ))}
      <button type="button" className={classes.addBtn} onClick={addRow} disabled={disabled}>
        + Добавить город/регион
      </button>
    </div>
  );
}

TariffGeographyList.propTypes = {
  value: PropTypes.arrayOf(PropTypes.object),
  onChange: PropTypes.func,
  disabled: PropTypes.bool,
};

export default TariffGeographyList;
