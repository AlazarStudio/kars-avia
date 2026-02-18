import { useState, useEffect, useCallback } from "react";
import classes from "./AddressField.module.css";
import { DEFAULT_CENTER, geocodeAddressToCoords, geocodeByTextRU } from "../../../../graphQL_requests";
import { YandexMapModal } from "../YandexMapModal/YandexMapModal";

export const AddressField = ({ label, value, onChange, placeholder }) => {
  const [mode, setMode] = useState("map"); // 'search' | 'map'
  const [query, setQuery] = useState(value || "");
  const [suggestions, setSuggestions] = useState([]);
  const [mapOpen, setMapOpen] = useState(false);

  const [center, setCenter] = useState(null); // пока нет координат
  const [geoStatus, setGeoStatus] = useState("idle"); // idle | loading | success | denied | error

  useEffect(() => {
    setQuery(value || "");
  }, [value]);

  // если пришла заявка с готовым адресом, пробуем один раз геокодировать его в центр
  useEffect(() => {
    if (!value || center) return; // уже есть центр или нет строки

    let cancelled = false;
    (async () => {
      try {
        const coords = await geocodeAddressToCoords(value);
        if (!cancelled && coords) {
          setCenter(coords);
        }
      } catch (e) {
        console.error(e);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [value, center]);

  // --- подсказки вокруг центра ---
  const loadSuggestions = useCallback(
    async (val) => {
      if (!val || val.length < 3) {
        setSuggestions([]);
        return;
      }

      const effectiveCenter =
        center && center.length === 2 ? center : DEFAULT_CENTER;

      try {
        const list = await geocodeByTextRU(val, {
          center: effectiveCenter,
          initialRadiusKm: 20,
          maxRadiusKm: 80,
          stepKm: 20,
        });
        setSuggestions(list);
      } catch (e) {
        console.error(e);
        setSuggestions([]);
      }
    },
    [center]
  );

  const handleInputChange = async (e) => {
    const val = e.target.value;
    setQuery(val);
    onChange(val);
    await loadSuggestions(val);
  };

  const handleSuggestionClick = async (addr) => {
    onChange(addr);
    setQuery(addr);
    setSuggestions([]);

    // заодно ставим центр по выбранной подсказке
    try {
      const coords = await geocodeAddressToCoords(addr);
      if (coords) setCenter(coords);
    } catch (e) {
      console.error(e);
    }
  };

  // --- геолокация и открытие карты ---
  const requestGeolocation = () => {
    if (!("geolocation" in navigator)) {
      setGeoStatus("error");
      setCenter(DEFAULT_CENTER);
      setMapOpen(true);
      return;
    }

    setGeoStatus("loading");

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude; // без округлений
        const lon = pos.coords.longitude; // без округлений
        setCenter([lat, lon]);
        setGeoStatus("success");
        setMapOpen(true);
      },
      (err) => {
        console.warn("Geolocation error", err);
        if (err.code === 1) setGeoStatus("denied");
        else setGeoStatus("error");
        setCenter(DEFAULT_CENTER); // fallback
        setMapOpen(true);
      },
      {
        enableHighAccuracy: true,
        timeout: 7000,
        maximumAge: 60_000,
      }
    );
  };

  const handleOpenMap = () => {
    if (!center) {
      requestGeolocation();
    } else {
      setMapOpen(true);
    }
  };

  const handleSelectFromMap = (addr) => {
    onChange(addr);
    setQuery(addr);
    setSuggestions([]);
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
            onClick={() => {
              setMode("map");
              setSuggestions([]);
            }}
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
          {geoStatus === "denied" && (
            <div className={classes.geoHint}>
              Доступ к геолокации запрещён. Поиск идёт от стандартного центра.
            </div>
          )}
        </div>
      )}

      {mode === "map" && (
        <>
          <button
            type="button"
            className={classes.mapBtn}
            onClick={handleOpenMap}
          >
            {geoStatus === "loading"
              ? "Определяем местоположение…"
              : "Выбрать на карте"}
          </button>

          {/* Рендерим модалку только когда центр уже известен */}
          {mapOpen && (center || DEFAULT_CENTER) && (
            <YandexMapModal
              open={mapOpen}
              onClose={() => setMapOpen(false)}
              onSelect={handleSelectFromMap}
              initialCenter={
                center && center.length === 2 ? center : DEFAULT_CENTER
              }
            />
          )}
        </>
      )}
    </div>
  );
};
