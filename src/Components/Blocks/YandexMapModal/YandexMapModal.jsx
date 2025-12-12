import React, { useState } from "react";
import classes from "./YandexMapModal.module.css";
import Button from "../../Standart/Button/Button.jsx";
import {
  reverseGeocodeByCoords,
  YMAPS_KEY,
} from "../../../../graphQL_requests.js";
import { YMaps, Map, Placemark } from "@pbe/react-yandex-maps";

// Основной компонент страницы, отображающий список заявок с возможностью фильтрации, поиска и пагинации
export const YandexMapModal = ({ open, onClose, onSelect, initialCenter }) => {
  const [coords, setCoords] = useState(initialCenter || [44.225, 42.057]); // центр региона
  const [address, setAddress] = useState("");

  if (!open) return null;

  const handleMapClick = async (e) => {
    const newCoords = e.get("coords"); // [lat, lon]
    setCoords(newCoords);
    try {
      const addr = await reverseGeocodeByCoords(newCoords);
      setAddress(addr);
    } catch (e) {
      console.error(e);
    }
  };

  const handleApply = () => {
    if (!address) return;
    onSelect(address);
  };

  // клик по подложке = закрыть, по контенту — нет
  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
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

        <YMaps query={{ apikey: YMAPS_KEY, lang: "ru_RU" }}>
          <Map
            defaultState={{ center: coords, zoom: 13 }}
            width="100%"
            height="320px"
            onClick={handleMapClick}
          >
            {coords && <Placemark geometry={coords} />}
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
