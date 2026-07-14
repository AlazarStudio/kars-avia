import React, { useState, useEffect, useMemo, useRef } from "react";
import { createPortal } from "react-dom";
import classes from "./YandexMapModal.module.css";
import Button from "../../Standart/Button/Button.jsx";
import { DEFAULT_CENTER, YMAPS_KEY, geocodeAddressToCoords } from "../../../../graphQL_requests.js";
import { YMaps, Map, Placemark } from "@pbe/react-yandex-maps";
import { useReverseGeocode } from "../../../hooks/useReverseGeocode";
import { useAddressSuggestions } from "../../../hooks/useAddressSuggestions";

export const YandexMapModal = ({ open, onClose, onSelect, initialCenter }) => {
  const effectiveCenter = useMemo(() => {
    if (initialCenter && initialCenter.length === 2) return initialCenter;
    return DEFAULT_CENTER;
  }, [initialCenter]);

  const [coords, setCoords] = useState(effectiveCenter);
  // якорь поиска — координаты подтверждённого места; клики по карте его НЕ меняют
  const [searchAnchor, setSearchAnchor] = useState(effectiveCenter);
  const [searchQuery, setSearchQuery] = useState("");
  const [ymaps, setYmaps] = useState(null);

  const {
    suggestions: searchSuggestions,
    accept: acceptSearch,
  } = useAddressSuggestions(searchQuery, searchAnchor);

  const { address, approximate, loading, resolve, reset } = useReverseGeocode(ymaps);

  const mapInstanceRef = useRef(null);
  const modalRootRef = useRef(null);

  useEffect(() => {
    const el = modalRootRef.current;
    if (!el) return;
    const stop = (e) => e.stopPropagation();
    el.addEventListener("mousedown", stop);
    return () => el.removeEventListener("mousedown", stop);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    setCoords(effectiveCenter);
    setSearchAnchor(effectiveCenter);
    setSearchQuery("");
    reset();
    resolve(effectiveCenter); // адрес центра доиграется, когда ymaps загрузится
  }, [effectiveCenter, open, reset, resolve]);

  if (!open) return null;

  // единственная точка смены выбранной точки: маркер + запрос адреса
  const selectCoords = (newCoords) => {
    setCoords(newCoords);
    resolve(newCoords);
  };

  const handleMapClick = (e) => {
    selectCoords(e.get("coords"));
  };

  const handlePlacemarkDragEnd = (e) => {
    selectCoords(e.get("target").geometry.getCoordinates());
  };

  const handleSearchSelect = async (addr) => {
    setSearchQuery(addr);
    acceptSearch(addr);
    try {
      const newCoords = await geocodeAddressToCoords(addr);
      if (newCoords) {
        if (mapInstanceRef.current) {
          mapInstanceRef.current.setCenter(newCoords, 16, { duration: 300 });
        }
        setSearchAnchor(newCoords); // следующий поиск — вокруг выбранного места
        selectCoords(newCoords);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleApply = () => {
    if (!address || loading) return;
    onSelect(address, coords);
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
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Поиск адреса..."
          />
          {!!searchSuggestions.length && (
            <ul className={classes.mapSearchSuggestions}>
              {searchSuggestions.map((s, i) => (
                <li
                  key={`${s}-${i}`}
                  className={classes.mapSearchItem}
                  onClick={() => handleSearchSelect(s)}
                >
                  {s}
                </li>
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
            onLoad={(ymapsApi) => setYmaps(ymapsApi)}
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

        <div className={classes.selectedAddress}>
          Выбранный адрес:{" "}
          {loading ? "Определяем адрес…" : address || "кликните по карте"}
        </div>

        {approximate && !loading && (
          <div className={classes.approximateHint}>
            ⚠ Приблизительно — точный дом не найден
          </div>
        )}

        <div className={classes.mapButtons}>
          <Button onClick={onClose} variant="secondary">Отмена</Button>
          <Button onClick={handleApply} disabled={!address || loading}>Выбрать адрес</Button>
        </div>
      </div>
    </div>,
    document.body
  );
};
