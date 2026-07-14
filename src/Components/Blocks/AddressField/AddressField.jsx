import { useEffect, useRef, useState } from "react";
import classes from "./AddressField.module.css";
import {
  DEFAULT_CENTER,
  geocodeAddressToCoords,
} from "../../../../graphQL_requests";
import { YandexMapModal } from "../YandexMapModal/YandexMapModal";
import { useAddressSuggestions } from "../../../hooks/useAddressSuggestions";
import PinIcon from "../../../shared/icons/PinIcon";

export const AddressField = ({ label, value, onChange, placeholder }) => {
  const [query, setQuery] = useState(value || "");
  const [anchor, setAnchor] = useState(null); // координаты ПОДТВЕРЖДЁННОГО адреса
  const [mapOpen, setMapOpen] = useState(false);
  const [mapCenter, setMapCenter] = useState(null); // снимок центра на момент открытия карты

  const lastEmittedRef = useRef(null);
  const containerRef = useRef(null);

  const { suggestions, loading, notFound, accept } = useAddressSuggestions(
    query,
    anchor
  );

  // единственная точка выхода наружу: всё, что мы отдали, помечается как «наше»
  const emit = (val) => {
    lastEmittedRef.current = val;
    setQuery(val);
    onChange(val);
  };

  // value пришёл извне (загрузилась заявка / сброс формы) → геокодим ОДИН раз.
  // Собственные изменения опознаются по lastEmittedRef и игнорируются — иначе печать
  // защёлкивала бы anchor на огрызке вроде «г. Ми».
  useEffect(() => {
    setQuery(value || "");
    if (!value) {
      setAnchor(null); // поле очистили — якорь больше не действителен
      return;
    }
    if (value === lastEmittedRef.current) return;

    // внешний адрес считается уже принятым: подсказки по нему искать не надо
    accept(value);

    let cancelled = false;
    geocodeAddressToCoords(value)
      .then((coords) => {
        if (!cancelled && coords) setAnchor(coords);
      })
      .catch((e) => console.error(e));

    return () => {
      cancelled = true;
    };
  }, [value, accept]);

  // клик мимо поля закрывает выпадашку. Слушатель нужен и пока запрос ещё летит:
  // иначе ответ, пришедший после ухода фокуса, раскрыл бы список поверх формы.
  useEffect(() => {
    if (!suggestions.length && !loading) return;

    const onDocMouseDown = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        accept(query);
      }
    };

    document.addEventListener("mousedown", onDocMouseDown);
    return () => document.removeEventListener("mousedown", onDocMouseDown);
  }, [suggestions.length, loading, accept, query]);

  const handleInputChange = (e) => emit(e.target.value);

  // центр снимается снимком: пока карта открыта, догрузившийся anchor её не сбросит
  const handleOpenMap = () => {
    setMapCenter(anchor || DEFAULT_CENTER);
    setMapOpen(true);
  };

  const handleSuggestionClick = async (addr) => {
    emit(addr);
    accept(addr);
    try {
      const coords = await geocodeAddressToCoords(addr);
      if (coords) setAnchor(coords);
    } catch (e) {
      console.error(e);
    }
  };

  const handleSelectFromMap = (addr, coords) => {
    emit(addr);
    accept(addr);
    if (coords) setAnchor(coords); // координаты уже известны — геокодить не нужно
    setMapOpen(false);
  };

  return (
    <div className={classes.addressField} ref={containerRef}>
      {label && <span className={classes.addressLabel}>{label}</span>}

      <div className={classes.addressSearch}>
        <div className={classes.inputRow}>
          <input
            type="text"
            className={classes.addressInput}
            value={query}
            onChange={handleInputChange}
            placeholder={placeholder}
          />
          <button
            type="button"
            className={classes.mapIconBtn}
            onClick={handleOpenMap}
            title="Выбрать на карте"
          >
            <PinIcon />
          </button>
        </div>

        {!!suggestions.length && (
          <ul className={classes.suggestionsList}>
            {suggestions.map((s, i) => (
              <li
                key={`${s}-${i}`}
                className={classes.suggestionItem}
                onClick={() => handleSuggestionClick(s)}
              >
                {s}
              </li>
            ))}
          </ul>
        )}

        {loading && <div className={classes.hint}>Ищем адрес…</div>}
        {notFound && <div className={classes.hint}>Ничего не найдено</div>}
      </div>

      {mapOpen && (
        <YandexMapModal
          open={mapOpen}
          onClose={() => setMapOpen(false)}
          onSelect={handleSelectFromMap}
          initialCenter={mapCenter}
        />
      )}
    </div>
  );
};
