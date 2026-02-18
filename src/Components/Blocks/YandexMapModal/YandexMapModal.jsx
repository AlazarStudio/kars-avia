import React, { useState, useEffect, useMemo, useRef } from "react";
import classes from "./YandexMapModal.module.css";
import Button from "../../Standart/Button/Button.jsx";
import { DEFAULT_CENTER, reverseGeocodeByCoordsWithYmaps, YMAPS_KEY } from "../../../../graphQL_requests.js";
import { YMaps, Map, Placemark } from "@pbe/react-yandex-maps";

export const YandexMapModal = ({ open, onClose, onSelect, initialCenter }) => {
  const effectiveCenter = useMemo(() => {
    if (initialCenter && initialCenter.length === 2) return initialCenter;
    return DEFAULT_CENTER;
  }, [initialCenter]);

  const [coords, setCoords] = useState(effectiveCenter);
  const [address, setAddress] = useState("");
  const [loading, setLoading] = useState(false);

  const ymapsRef = useRef(null);
  const pendingCoordsRef = useRef(null);

  useEffect(() => {
    if (open) {
      setCoords(effectiveCenter);
      setAddress("");
      setLoading(false);
      pendingCoordsRef.current = effectiveCenter; // чтобы после загрузки ymaps сразу подставить адрес
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

  const handleApply = () => {
    if (!address || loading) return;
    onSelect(address);
  };

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div className={classes.mapModal} onClick={handleOverlayClick}>
      <div className={classes.mapModalContent} onClick={(e) => e.stopPropagation()}>
        <div className={classes.mapModalHeader}>
          <span>Выбор адреса на карте</span>
          <button type="button" onClick={onClose} className={classes.mapModalClose}>✕</button>
        </div>

        <YMaps
          query={{
            apikey: YMAPS_KEY,
            lang: "ru_RU",
            // load: "package.full", // чтобы geocode точно был доступен :contentReference[oaicite:2]{index=2}
          }}
        >
          <Map
            defaultState={{ center: coords, zoom: 15 }}
            width="100%"
            height="320px"
            onClick={handleMapClick}
            onLoad={(ymaps) => {
              // ВАЖНО: onLoad ставим на Map → получаем API instance :contentReference[oaicite:3]{index=3}
              ymapsRef.current = ymaps;

              // если у нас уже есть отложенные координаты — геокодим их
              if (pendingCoordsRef.current) {
                const c = pendingCoordsRef.current;
                pendingCoordsRef.current = null;
                updateByCoords(c);
              }
            }}
            options={{
              suppressMapOpenBlock: true,
              yandexMapDisablePoiInteractivity: true, // клики по POI не перехватываются :contentReference[oaicite:4]{index=4}
            }}
            modules={["geocode"]} // можно так, но package.full уже гарантирует :contentReference[oaicite:5]{index=5}
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
    </div>
  );
};
