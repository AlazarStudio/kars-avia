import React, { useState, useEffect, useMemo } from "react";
import classes from "./YandexMapModal.module.css";
import Button from "../../Standart/Button/Button.jsx";
import {
  DEFAULT_CENTER,
  reverseGeocodeByCoords,
  YMAPS_KEY,
} from "../../../../graphQL_requests.js";
import { YMaps, Map, Placemark } from "@pbe/react-yandex-maps";

export const YandexMapModal = ({ open, onClose, onSelect, initialCenter }) => {
  const effectiveCenter = useMemo(() => {
    if (initialCenter && initialCenter.length === 2) return initialCenter;
    return DEFAULT_CENTER;
  }, [initialCenter]);

  const [coords, setCoords] = useState(effectiveCenter);
  const [address, setAddress] = useState("");

  // когда приходит новый initialCenter — обновляем coords
  useEffect(() => {
    if (open) {
      setCoords(effectiveCenter);
      setAddress("");
    }
  }, [effectiveCenter, open]);

  if (!open) return null;

  const updateByCoords = async (newCoords) => {
    setCoords(newCoords);
    try {
      const addr = await reverseGeocodeByCoords(newCoords);
      setAddress(addr);
    } catch (err) {
      console.error(err);
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

  const handleApply = () => {
    if (!address) return;
    onSelect(address);
  };

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div className={classes.mapModal} onClick={handleOverlayClick}>
      <div
        className={classes.mapModalContent}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={classes.mapModalHeader}>
          <span>Выбор адреса на карте</span>
          <button
            type="button"
            onClick={onClose}
            className={classes.mapModalClose}
          >
            ✕
          </button>
        </div>

        {/* Карта рендерится только когда есть валидный центр */}
        <YMaps query={{ apikey: YMAPS_KEY, lang: "ru_RU" }}>
          <Map
            // state={{ center: coords, zoom: 15 }}
            defaultState={{ center: coords, zoom: 15 }}
            width="100%"
            height="320px"
            onClick={handleMapClick}
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
          <Button onClick={onClose} variant="secondary">
            Отмена
          </Button>
          <Button onClick={handleApply} disabled={!address}>
            Выбрать адрес
          </Button>
        </div>
      </div>
    </div>
  );
};
