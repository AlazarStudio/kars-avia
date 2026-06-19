import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import classes from "./FapSelect.module.css";

// Кастомный стилизованный дропдаун. Меню рендерится в портал (position: fixed),
// чтобы не обрезаться overflow родительских карточек. Закрывается по клику вне,
// Esc, скроллу и ресайзу. options — массив строк или { value, label }.
export default function FapSelect({
  value,
  onChange,
  options = [],
  placeholder = "—",
  disabled = false,
  accent = "#8B5CF6",
  style,
}) {
  const [open, setOpen] = useState(false);
  const [rect, setRect] = useState(null);
  const triggerRef = useRef(null);
  const menuRef = useRef(null);

  const norm = options.map((o) =>
    typeof o === "string" ? { value: o, label: o } : o
  );
  const current = norm.find((o) => o.value === value);

  const openMenu = () => {
    if (disabled) return;
    const el = triggerRef.current;
    if (el) setRect(el.getBoundingClientRect());
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

  return (
    <div className={classes.wrap} style={style}>
      <button
        ref={triggerRef}
        type="button"
        className={`${classes.trigger} ${open ? classes.triggerOpen : ""}`}
        style={open ? { borderColor: accent, boxShadow: `0 0 0 3px ${accent}22` } : undefined}
        onClick={() => (open ? close() : openMenu())}
        disabled={disabled}
      >
        <span className={current && current.value ? classes.value : classes.placeholder}>
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
            className={classes.menu}
            style={{
              position: "fixed",
              top: rect.bottom + 4,
              left: rect.left,
              width: rect.width,
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
                  <span className={classes.optionLabel}>{o.label}</span>
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
