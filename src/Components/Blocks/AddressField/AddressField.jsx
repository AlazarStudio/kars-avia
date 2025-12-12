import { useEffect, useState } from "react";
import classes from "./AddressField.module.css";
import { geocodeByTextRU } from "../../../../graphQL_requests";
import { YandexMapModal } from "../YandexMapModal/YandexMapModal";

export const AddressField = ({ label, value, onChange, placeholder }) => {
  const [mode, setMode] = useState("map"); // 'search' | 'map'
  const [query, setQuery] = useState(value || "");
  const [suggestions, setSuggestions] = useState([]);
  const [mapOpen, setMapOpen] = useState(false);

  useEffect(() => {
    setQuery(value || "");
  }, [value]);

  // const handleInputChange = async (e) => {
  //   const val = e.target.value;
  //   setQuery(val);
  //   onChange(val);

  //   if (val.length >= 3) {
  //     try {
  //       const list = await geocodeByTextRU(val);
  //       setSuggestions(list);
  //     } catch (e) {
  //       console.error(e);
  //       setSuggestions([]);
  //     }
  //   } else {
  //     setSuggestions([]);
  //   }
  // };

  const handleInputChange = async (e) => {
    const val = e.target.value;
    setQuery(val);
    onChange(val);

    if (val.length >= 3) {
      try {
        const list = await geocodeByTextRU(val, {
          center: [44.225, 42.057], // [lat, lon] – центр твоего региона
          initialRadiusKm: 20, // стартуем с 20 км
          maxRadiusKm: 80, // максимум 80 км
          stepKm: 20, // шаг увеличения
        });
        setSuggestions(list);
      } catch (e) {
        console.error(e);
        setSuggestions([]);
      }
    } else {
      setSuggestions([]);
    }
  };

  const handleSuggestionClick = (addr) => {
    onChange(addr);
    setQuery(addr);
    setSuggestions([]);
  };

  const handleSelectFromMap = (addr) => {
    onChange(addr);
    setQuery(addr);
    setMode("search");
    setMapOpen(false);
  };

  return (
    <div className={classes.addressField}>
      <div className={classes.addressFieldHeader}>
        <span className={classes.addressLabel}>{label}</span>
        <div className={classes.addressModeSwitch}>
          <button
            type="button"
            className={`${classes.modeBtn} ${
              mode === "search" ? classes.modeBtnActive : ""
            }`}
            onClick={() => setMode("search")}
          >
            Поиск
          </button>
          <button
            type="button"
            className={`${classes.modeBtn} ${
              mode === "map" ? classes.modeBtnActive : ""
            }`}
            onClick={() => setMode("map")}
          >
            На карте
          </button>
        </div>
      </div>

      {mode === "search" && (
        <div className={classes.addressSearch}>
          <input
            type="text"
            className={classes.addressInput}
            value={query}
            onChange={handleInputChange}
            placeholder={placeholder}
          />
          {!!suggestions.length && (
            <ul className={classes.suggestionsList}>
              {suggestions.map((s) => (
                <li
                  key={s}
                  className={classes.suggestionItem}
                  onClick={() => handleSuggestionClick(s)}
                >
                  {s}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {mode === "map" && (
        <>
          <button
            type="button"
            className={classes.mapBtn}
            onClick={() => setMapOpen(true)}
          >
            Выбрать на карте
          </button>

          <YandexMapModal
            open={mapOpen}
            onClose={() => setMapOpen(false)}
            onSelect={handleSelectFromMap}
          />
        </>
      )}
    </div>
  );
};
