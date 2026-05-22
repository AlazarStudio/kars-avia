import React, { useState, useEffect, useMemo, useRef } from "react";
import { createPortal } from "react-dom";
import classes from "./YandexMapModal.module.css";
import Button from "../../Standart/Button/Button.jsx";
import { DEFAULT_CENTER, reverseGeocodeByCoordsWithYmaps, YMAPS_KEY, geocodeByTextRU, geocodeAddressToCoords } from "../../../../graphQL_requests.js";
import { YMaps, Map, Placemark } from "@pbe/react-yandex-maps";

export const YandexMapModal = ({ open, onClose, onSelect, initialCenter }) => {
  const effectiveCenter = useMemo(() => {
    if (initialCenter && initialCenter.length === 2) return initialCenter;
    return DEFAULT_CENTER;
  }, [initialCenter]);

  const [coords, setCoords] = useState(effectiveCenter);
  const [address, setAddress] = useState("");
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchSuggestions, setSearchSuggestions] = useState([]);

  const ymapsRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const pendingCoordsRef = useRef(null);
  const modalRootRef = useRef(null);

  useEffect(() => {
    const el = modalRootRef.current;
    if (!el) return;
    const stop = (e) => e.stopPropagation();
    el.addEventListener("mousedown", stop);
    return () => el.removeEventListener("mousedown", stop);
  }, [open]);

  useEffect(() => {
    if (open) {
      setCoords(effectiveCenter);
      setAddress("");
      setLoading(false);
      setSearchQuery("");
      setSearchSuggestions([]);
      pendingCoordsRef.current = effectiveCenter;
    }
  }, [effectiveCenter, open]);

  if (!open) return null;

  const updateByCoords = async (newCoords) => {
    setCoords(newCoords);

    // если API ещё не готов — запоминаем координаты и выходим
    if (!ymapsRef.current) {
      pendingCoordsRef.current = newCoords;
      setLoading(true);
      setAddress("Загрузка карты...");
      return;
    }

    try {
      setLoading(true);
      setAddress("Поиск адреса...");
      const addr = await reverseGeocodeByCoordsWithYmaps(ymapsRef.current, newCoords);
      setAddress(addr || "");
    } catch (e) {
      console.error(e);
      setAddress("");
    } finally {
      setLoading(false);
    }
  };

  const handleMapClick = (e) => {
    const newCoords = e.get("coords");
    updateByCoords(newCoords);
  };

  const handlePlacemarkDragEnd = (e) => {
    const newCoords = e.get("target").geometry.getCoordinates();
    updateByCoords(newCoords);
  };

  const handleSearchChange = async (e) => {
    const val = e.target.value;
    setSearchQuery(val);
    if (val.length < 3) { setSearchSuggestions([]); return; }
    try {
      const list = await geocodeByTextRU(val, { center: coords, initialRadiusKm: 20, maxRadiusKm: 80, stepKm: 20 });
      setSearchSuggestions(list);
    } catch (e) {
      console.error(e);
    }
  };

  const handleSearchSelect = async (addr) => {
    setSearchQuery(addr);
    setSearchSuggestions([]);
    try {
      const newCoords = await geocodeAddressToCoords(addr);
      if (newCoords) {
        if (mapInstanceRef.current) {
          mapInstanceRef.current.setCenter(newCoords, 16, { duration: 300 });
        }
        updateByCoords(newCoords);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleApply = () => {
    if (!address || loading) return;
    onSelect(address);
  };

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  return createPortal(
    <div ref={modalRootRef} className={classes.mapModal} onClick={handleOverlayClick}>
      <div className={classes.mapModalContent} onClick={(e) => e.stopPropagation()}>
        <div className={classes.mapModalHeader}>
          <span>Выбор адреса на карте</span>
          <button type="button" onClick={onClose} className={classes.mapModalClose}>✕</button>
        </div>

        <div className={classes.mapSearch}>
          <input
            className={classes.mapSearchInput}
            value={searchQuery}
            onChange={handleSearchChange}
            placeholder="Поиск адреса..."
          />
          {!!searchSuggestions.length && (
            <ul className={classes.mapSearchSuggestions}>
              {searchSuggestions.map((s) => (
                <li key={s} className={classes.mapSearchItem} onClick={() => handleSearchSelect(s)}>{s}</li>
              ))}
            </ul>
          )}
        </div>

        <YMaps
          query={{
            apikey: YMAPS_KEY,
            lang: "ru_RU",
          }}
        >
          <Map
            defaultState={{ center: coords, zoom: 15 }}
            width="100%"
            height="320px"
            instanceRef={mapInstanceRef}
            onClick={handleMapClick}
            onLoad={(ymaps) => {
              ymapsRef.current = ymaps;

              if (pendingCoordsRef.current) {
                const c = pendingCoordsRef.current;
                pendingCoordsRef.current = null;
                updateByCoords(c);
              }
            }}
            options={{
              suppressMapOpenBlock: true,
              yandexMapDisablePoiInteractivity: true,
            }}
            modules={["geocode"]}
          >
            {coords && (
              <Placemark
                geometry={coords}
                options={{ draggable: true }}
                onDragEnd={handlePlacemarkDragEnd}
              />
            )}
          </Map>
        </YMaps>

        <div style={{ marginTop: 8, fontSize: 13 }}>
          Выбранный адрес: {address || "кликните по карте"}
        </div>

        <div className={classes.mapButtons}>
          <Button onClick={onClose} variant="secondary">Отмена</Button>
          <Button onClick={handleApply} disabled={!address || loading}>Выбрать адрес</Button>
        </div>
      </div>
    </div>,
    document.body
  );
};
