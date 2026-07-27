import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import classes from "./AddressField.module.css";
import {
  DEFAULT_CENTER,
  geocodeAddressToCoords,
} from "../../../../graphQL_requests";
import { YandexMapModal } from "../YandexMapModal/YandexMapModal";
import { useAddressSuggestions } from "../../../hooks/useAddressSuggestions";
import PinIcon from "../../../shared/icons/PinIcon";

// Оценка высоты выпадашки по числу подсказок — держим в согласии с
// AddressField.module.css: .suggestionItem = 8px padding сверху и снизу + строка
// 13px шрифта, .popup = padding 4px сверху и снизу и растёт не выше max-height.
const SUGGESTION_HEIGHT = 33;
const PANEL_CHROME = 8;
const PANEL_MAX_HEIGHT = 200;
// Отступ выпадашки от поля и минимальный зазор до края окна.
const PANEL_GAP = 4;
const VIEWPORT_MARGIN = 8;

const estimatePanelHeight = (count) =>
  Math.min(PANEL_MAX_HEIGHT, count * SUGGESTION_HEIGHT + PANEL_CHROME);

// compact — вариант для узкой ячейки таблицы: поле и кнопка карты сжаты до
// высоты остальных полей строки, подпись обычно не нужна.
export const AddressField = ({
  label,
  value,
  onChange,
  placeholder,
  compact = false,
}) => {
  const [query, setQuery] = useState(value || "");
  const [anchor, setAnchor] = useState(null); // координаты ПОДТВЕРЖДЁННОГО адреса
  const [mapOpen, setMapOpen] = useState(false);
  const [mapCenter, setMapCenter] = useState(null); // снимок центра на момент открытия карты
  // Позиция и направление выпадашки, посчитанные в момент её появления.
  const [panel, setPanel] = useState(null);

  const lastEmittedRef = useRef(null);
  const containerRef = useRef(null);
  const inputRowRef = useRef(null);
  const panelRef = useRef(null);
  // Якорь запрашивается один раз на адрес; фоновый ответ не должен писать стейт
  // размонтированного поля (в таблице поездки строки живут и умирают пачками).
  const anchorRequestedRef = useRef(false);
  const aliveRef = useRef(true);

  const { suggestions, loading, notFound, accept } = useAddressSuggestions(
    query,
    anchor
  );

  const panelOpen = suggestions.length > 0 || loading || notFound;

  useEffect(() => {
    aliveRef.current = true;
    return () => {
      aliveRef.current = false;
    };
  }, []);

  // единственная точка выхода наружу: всё, что мы отдали, помечается как «наше»
  const emit = (val) => {
    lastEmittedRef.current = val;
    setQuery(val);
    onChange(val);
  };

  // Якорь нужен только подсказкам, поэтому геокодим лениво — по первому фокусу,
  // а не на монтировании: на поездке с двадцатью пассажирами это были двадцать
  // фоновых запросов при открытии страницы ни за что.
  const requestAnchor = () => {
    const addr = (query || "").trim();
    if (!addr || anchorRequestedRef.current) return;
    anchorRequestedRef.current = true;
    geocodeAddressToCoords(addr)
      .then((coords) => {
        if (aliveRef.current && coords) setAnchor(coords);
      })
      .catch((e) => console.error(e));
  };

  // value пришёл извне (загрузилась заявка / сброс формы). Собственные изменения
  // опознаются по lastEmittedRef и игнорируются — иначе печать защёлкивала бы
  // anchor на огрызке вроде «г. Ми».
  useEffect(() => {
    setQuery(value || "");
    if (!value) {
      setAnchor(null); // поле очистили — якорь больше не действителен
      anchorRequestedRef.current = false;
      return;
    }
    if (value === lastEmittedRef.current) return;

    // внешний адрес считается уже принятым: подсказки по нему искать не надо
    accept(value);
    // адрес другой — прежний якорь к нему не относится, запросим по фокусу
    setAnchor(null);
    anchorRequestedRef.current = false;
  }, [value, accept]);

  // Выпадашка рендерится в портал, поэтому позицию считаем сами — в момент
  // появления списка. Пересчитывать позже не нужно: скролл и ресайз её закрывают.
  useEffect(() => {
    if (!panelOpen) {
      setPanel(null);
      return;
    }
    const el = inputRowRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const needed = estimatePanelHeight(suggestions.length || 1) + PANEL_GAP;
    const spaceBelow = window.innerHeight - rect.bottom - VIEWPORT_MARGIN;
    const spaceAbove = rect.top - VIEWPORT_MARGIN;
    const up = needed > spaceBelow && spaceAbove > spaceBelow;
    setPanel({
      up,
      top: rect.bottom,
      bottom: rect.top,
      left: rect.left,
      width: rect.width,
      space: Math.max(0, (up ? spaceAbove : spaceBelow) - PANEL_GAP),
    });
  }, [panelOpen, suggestions.length]);

  // Клик мимо поля и Esc закрывают выпадашку. Список больше не потомок поля,
  // поэтому проверяем обе ссылки — как в FapSelect. Слушатель нужен и пока
  // запрос ещё летит: иначе ответ, пришедший после ухода фокуса, раскрыл бы
  // список поверх формы.
  useEffect(() => {
    if (!panelOpen) return;

    const closePanel = () => accept(query);
    const onDocMouseDown = (e) => {
      if (containerRef.current?.contains(e.target)) return;
      if (panelRef.current?.contains(e.target)) return;
      closePanel();
    };
    const onKey = (e) => {
      if (e.key === "Escape") closePanel();
    };
    // Скролл страницы уводит поле из-под выпадашки — закрываем. Скролл внутри
    // самой выпадашки долетает до window в фазе перехвата, но её закрывать не
    // должен.
    const onScroll = (e) => {
      if (panelRef.current?.contains(e.target)) return;
      closePanel();
    };

    document.addEventListener("mousedown", onDocMouseDown);
    document.addEventListener("keydown", onKey);
    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", closePanel);
    return () => {
      document.removeEventListener("mousedown", onDocMouseDown);
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", closePanel);
    };
  }, [panelOpen, accept, query]);

  const handleInputChange = (e) => emit(e.target.value);

  // центр снимается снимком: пока карта открыта, догрузившийся anchor её не сбросит
  const handleOpenMap = () => {
    setMapCenter(anchor || DEFAULT_CENTER);
    setMapOpen(true);
  };

  const handleSuggestionClick = async (addr) => {
    emit(addr);
    accept(addr);
    anchorRequestedRef.current = true;
    try {
      const coords = await geocodeAddressToCoords(addr);
      if (aliveRef.current && coords) setAnchor(coords);
    } catch (e) {
      console.error(e);
    }
  };

  const handleSelectFromMap = (addr, coords) => {
    emit(addr);
    accept(addr);
    anchorRequestedRef.current = true;
    if (coords) setAnchor(coords); // координаты уже известны — геокодить не нужно
    setMapOpen(false);
  };

  return (
    <div
      className={`${classes.addressField} ${compact ? classes.compact : ""}`}
      ref={containerRef}
    >
      {label && <span className={classes.addressLabel}>{label}</span>}

      <div className={classes.inputRow} ref={inputRowRef}>
        <input
          type="text"
          className={classes.addressInput}
          value={query}
          onChange={handleInputChange}
          onFocus={requestAnchor}
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

      {panelOpen &&
        panel &&
        createPortal(
          <div
            ref={panelRef}
            className={classes.popup}
            style={{
              // Вверх привязываемся снизу к полю: тогда точная высота списка не
              // нужна — он растёт от места, где обрывается.
              ...(panel.up
                ? { bottom: window.innerHeight - panel.bottom + PANEL_GAP }
                : { top: panel.top + PANEL_GAP }),
              left: panel.left,
              width: panel.width,
              maxHeight: Math.min(PANEL_MAX_HEIGHT, panel.space),
            }}
          >
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
          </div>,
          document.body
        )}

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
