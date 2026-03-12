import React from "react";
import classes from "./TransferPricesForm.module.css";
import MultiSelectAutocomplete from "../MultiSelectAutocomplete/MultiSelectAutocomplete.jsx";
import { createEmptyTransferPriceInput } from "../../../utils/transferPrices.js";

function TransferPricesForm({
  value = [],
  onChange,
  airports = [],
  cities = [],
  readOnly = false,
}) {
  const airportOptions = airports.map((a) => ({
    id: a.id,
    label: [a.code, a.name, a.city].filter(Boolean).join(" — "),
  }));

  const cityOptions = cities.map((c) => ({
    id: c.id,
    label: [c.city, c.region].filter(Boolean).join(", "),
  }));

  const addRecord = () => {
    onChange([...value, createEmptyTransferPriceInput()]);
  };

  const updateRecord = (index, patch) => {
    const next = value.map((item, i) =>
      i === index ? { ...item, ...patch } : item
    );
    onChange(next);
  };

  const removeRecord = (index) => {
    onChange(value.filter((_, i) => i !== index));
  };

  const updatePrices = (index, seatKey, routeKey, numValue) => {
    const item = value[index];
    const prices = { ...item.prices };
    const seat = { ...(prices[seatKey] || {}) };
    seat[routeKey] = numValue === "" ? null : Number(numValue);
    prices[seatKey] = seat;
    updateRecord(index, { prices });
  };

  const getSelectedAirports = (airportIds) =>
    airportOptions.filter((opt) => airportIds && airportIds.includes(opt.id));

  const getSelectedCities = (cityIds) =>
    cityOptions.filter((opt) => cityIds && cityIds.includes(opt.id));

  return (
    <div className={classes.wrapper}>
      <div className={classes.sectionTitle}>Цены на трансфер</div>

      {value.map((record, index) => (
        <div key={index} className={classes.recordCard}>
          <div className={classes.recordHeader}>
            <span className={classes.recordIndex}>Запись {index + 1}</span>
            {!readOnly && (
              <button
                type="button"
                className={classes.removeBtn}
                onClick={() => removeRecord(index)}
              >
                Удалить
              </button>
            )}
          </div>

          <div className={classes.pricesRow}>
            {[
              { key: "threeSeater", label: "3-местный" },
              { key: "fiveSeater", label: "5-местный" },
              { key: "sevenSeater", label: "7-местный" },
            ].map(({ key, label }) => (
              <div key={key} className={classes.seaterBlock}>
                <div className={classes.priceLabel}>{label}</div>
                <div className={classes.priceGroup}>
                  <input
                    type="number"
                    className={classes.priceInput}
                    placeholder="Межгород"
                    value={record.prices?.[key]?.intercity ?? ""}
                    onChange={(e) =>
                      updatePrices(index, key, "intercity", e.target.value)
                    }
                    readOnly={readOnly}
                    min={0}
                    step={100}
                  />
                  <span>₽</span>
                  <input
                    type="number"
                    className={classes.priceInput}
                    placeholder="Город"
                    value={record.prices?.[key]?.city ?? ""}
                    onChange={(e) =>
                      updatePrices(index, key, "city", e.target.value)
                    }
                    readOnly={readOnly}
                    min={0}
                    step={100}
                  />
                  <span>₽</span>
                </div>
              </div>
            ))}
          </div>

          {!readOnly && (airportOptions.length > 0 || cityOptions.length > 0) && (
            <div className={classes.selectsRow}>
              {airportOptions.length > 0 && (
                <div className={classes.selectWrap}>
                  <MultiSelectAutocomplete
                    label="Аэропорты"
                    options={airportOptions}
                    isMultiple
                    value={getSelectedAirports(record.airportIds || [])}
                    onChange={(_, selected) =>
                      updateRecord(index, {
                        airportIds: (selected || []).map((o) => o.id),
                      })
                    }
                    dropdownWidth="100%"
                    listboxHeight="200px"
                  />
                </div>
              )}
              {cityOptions.length > 0 && (
                <div className={classes.selectWrap}>
                  <MultiSelectAutocomplete
                    label="Города"
                    options={cityOptions}
                    isMultiple
                    value={getSelectedCities(record.cityIds || [])}
                    onChange={(_, selected) =>
                      updateRecord(index, {
                        cityIds: (selected || []).map((o) => o.id),
                      })
                    }
                    dropdownWidth="100%"
                    listboxHeight="200px"
                  />
                </div>
              )}
            </div>
          )}
        </div>
      ))}

      {!readOnly && (
        <button
          type="button"
          className={classes.addBtn}
          onClick={addRecord}
        >
          + Добавить договор
        </button>
      )}
    </div>
  );
}

export default TransferPricesForm;
