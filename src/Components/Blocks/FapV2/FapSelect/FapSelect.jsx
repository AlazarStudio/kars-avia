import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import classes from "./FapSelect.module.css";

// Оценка высоты меню по числу опций — держим в согласии с FapSelect.module.css:
// .option = 8px padding сверху и снизу + строка 13px шрифта, .menu = padding 4px
// с каждой стороны плюс 1px рамки, и растёт не выше max-height.
const OPTION_HEIGHT = 32;
const MENU_CHROME = 10;
const MENU_MAX_HEIGHT = 262;
// Отступ меню от триггера и минимальный зазор до края окна.
const MENU_GAP = 4;
const VIEWPORT_MARGIN = 8;

const estimateMenuHeight = (optionsCount) =>
  Math.min(MENU_MAX_HEIGHT, optionsCount * OPTION_HEIGHT + MENU_CHROME);

// Кастомный стилизованный дропдаун. Меню рендерится в портал (position: fixed),
// чтобы не обрезаться overflow родительских карточек. Закрывается по клику вне,
// Esc, скроллу и ресайзу. options — массив строк или { value, label }.
//
// Направление раскрытия выбирается в момент открытия: снизу не хватает места, а
// сверху хватает — раскрываемся вверх. Пересчитывать позже не нужно, потому что
// скролл и ресайз меню закрывают.
export default function FapSelect({
  value,
  onChange,
  options = [],
  placeholder = "—",
  disabled = false,
  accent = "#8B5CF6",
  style,
  // Опциональные пропы (без них рендер прежний):
  // className — класс на обёртку (размеры под конкретный layout),
  // triggerPrefix — подпись перед значением в триггере (напр. «Гостиница:»),
  // active — подсветить рамку акцентом, когда фильтр не в дефолтном значении.
  className,
  triggerPrefix,
  active = false,
  // menuMinWidth — минимальная ширина меню, когда триггер узкий и подписи опций
  // не помещаются. Без пропа меню шириной ровно с триггер (прежнее поведение).
  menuMinWidth,
}) {
  const [open, setOpen] = useState(false);
  const [rect, setRect] = useState(null);
  // { up, space } — направление раскрытия и доступная в нём высота.
  const [placement, setPlacement] = useState({ up: false, space: null });
  const triggerRef = useRef(null);
  const menuRef = useRef(null);

  const norm = options.map((o) =>
    typeof o === "string" ? { value: o, label: o } : o
  );
  const current = norm.find((o) => o.value === value);

  const openMenu = () => {
    if (disabled) return;
    const el = triggerRef.current;
    if (el) {
      const next = el.getBoundingClientRect();
      const needed = estimateMenuHeight(norm.length) + MENU_GAP;
      const spaceBelow = window.innerHeight - next.bottom - VIEWPORT_MARGIN;
      const spaceAbove = next.top - VIEWPORT_MARGIN;
      const up = needed > spaceBelow && spaceAbove > spaceBelow;
      setRect(next);
      setPlacement({
        up,
        space: Math.max(0, (up ? spaceAbove : spaceBelow) - MENU_GAP),
      });
    }
    setOpen(true);
  };
  const close = () => setOpen(false);

  useEffect(() => {
    if (!open) return;
    const onDocMouse = (e) => {
      if (triggerRef.current && triggerRef.current.contains(e.target)) return;
      if (menuRef.current && menuRef.current.contains(e.target)) return;
      close();
    };
    const onKey = (e) => {
      if (e.key === "Escape") close();
    };
    const onScrollResize = () => close();
    document.addEventListener("mousedown", onDocMouse);
    document.addEventListener("keydown", onKey);
    window.addEventListener("scroll", onScrollResize, true);
    window.addEventListener("resize", onScrollResize);
    return () => {
      document.removeEventListener("mousedown", onDocMouse);
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("scroll", onScrollResize, true);
      window.removeEventListener("resize", onScrollResize);
    };
  }, [open]);

  const pick = (v) => {
    onChange?.(v);
    close();
  };

  // Ширина меню: по умолчанию ровно как у триггера; menuMinWidth расширяет узкий.
  const menuWidth = !rect
    ? 0
    : menuMinWidth
    ? Math.max(rect.width, menuMinWidth)
    : rect.width;
  // Расширенное меню растим влево от правого края триггера — иначе оно вылезает
  // за правый край карточки/диалога. У края окна прижимаем к безопасному отступу.
  const menuLeft = !rect
    ? 0
    : menuWidth > rect.width
    ? Math.max(VIEWPORT_MARGIN, rect.right - menuWidth)
    : rect.left;

  return (
    <div
      className={`${classes.wrap}${className ? ` ${className}` : ""}`}
      style={style}
    >
      <button
        ref={triggerRef}
        type="button"
        className={`${classes.trigger} ${open ? classes.triggerOpen : ""}`}
        style={
          open
            ? { borderColor: accent, boxShadow: `0 0 0 3px ${accent}22` }
            : active
            ? { borderColor: accent }
            : undefined
        }
        onClick={() => (open ? close() : openMenu())}
        disabled={disabled}
      >
        {triggerPrefix && (
          <span className={classes.triggerPrefix}>{triggerPrefix}</span>
        )}
        <span
          className={current && current.value ? classes.value : classes.placeholder}
          // Значение режется многоточием — полный текст остаётся в подсказке.
          title={typeof current?.label === "string" ? current.label : undefined}
        >
          {current ? current.label : placeholder}
        </span>
        <svg
          className={`${classes.chevron} ${open ? classes.chevronOpen : ""}`}
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
        >
          <path
            d="M6 9l6 6 6-6"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
      {open &&
        rect &&
        createPortal(
          <div
            ref={menuRef}
            className={`${classes.menu} ${placement.up ? classes.menuUp : ""}`}
            style={{
              position: "fixed",
              // Вверх привязываемся снизу к триггеру: тогда точная высота меню
              // не нужна — оно растёт от места, где обрывается.
              ...(placement.up
                ? { bottom: window.innerHeight - rect.top + MENU_GAP }
                : { top: rect.bottom + MENU_GAP }),
              left: menuLeft,
              width: menuWidth,
              // Длинный список не должен упираться в край окна: внутри меню
              // свой скролл, поэтому режем высоту по доступному месту.
              ...(placement.space != null
                ? { maxHeight: Math.min(MENU_MAX_HEIGHT, placement.space) }
                : null),
            }}
          >
            {norm.map((o) => {
              const sel = o.value === value;
              return (
                <div
                  key={o.value || "__empty"}
                  className={`${classes.option} ${sel ? classes.optionSelected : ""}`}
                  style={sel ? { color: accent } : undefined}
                  onClick={() => pick(o.value)}
                >
                  <span
                    className={classes.optionLabel}
                    title={typeof o.label === "string" ? o.label : undefined}
                  >
                    {o.label}
                  </span>
                  {sel && (
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
                      <path
                        d="M5 12l5 5L20 6"
                        stroke={accent}
                        strokeWidth="2.4"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  )}
                </div>
              );
            })}
          </div>,
          document.body
        )}
    </div>
  );
}
