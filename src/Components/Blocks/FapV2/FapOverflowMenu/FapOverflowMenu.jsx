import React, { useState, useRef, useEffect } from "react";
import DotsIcon from "../../../../shared/icons/DotsIcon.jsx";
import classes from "./FapOverflowMenu.module.css";

// Оверфлоу-меню «⋯».
// items: Array<{ label, icon?, onClick?, tone?, sep?, hidden? }>
//   icon  — компонент иконки (необязательно)
//   tone  — "danger" → красный пункт
//   sep   — true → разделитель (без label)
//   hidden— true → пункт пропускается
// trigger — необязательная render-функция ({ open, toggle }) => node вместо «⋯»:
//   позволяет повесить тот же выпадающий список на чужую кнопку (чип манифестов).
// Схлопывает ведущие/соседние/хвостовые разделители. Если реальных пунктов нет — рендерит null.
function normalizeItems(items) {
  const visible = (items || []).filter((it) => it && !it.hidden);
  const out = [];
  for (const it of visible) {
    if (it.sep) {
      // не добавляем ведущий или соседний разделитель
      if (out.length === 0 || out[out.length - 1].sep) continue;
      out.push(it);
    } else {
      out.push(it);
    }
  }
  // убираем хвостовой разделитель
  while (out.length && out[out.length - 1].sep) out.pop();
  return out;
}

export default function FapOverflowMenu({ items = [], className = "", trigger }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const onMouseDown = (e) => {
      if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onMouseDown);
    return () => document.removeEventListener("mousedown", onMouseDown);
  }, [open]);

  const normalized = normalizeItems(items);
  const hasReal = normalized.some((it) => !it.sep);
  if (!hasReal) return null;

  const handleItemClick = (item) => {
    if (typeof item.onClick === "function") item.onClick();
    setOpen(false);
  };

  return (
    <div ref={rootRef} className={[classes.root, className].filter(Boolean).join(" ")}>
      {typeof trigger === "function" ? (
        trigger({ open, toggle: () => setOpen((v) => !v) })
      ) : (
        <button
          type="button"
          className={[classes.trigger, open ? classes.triggerOpen : ""].filter(Boolean).join(" ")}
          onClick={() => setOpen((v) => !v)}
          aria-haspopup="menu"
          aria-expanded={open}
        >
          <DotsIcon color={open ? "#0057C3" : "#545873"} />
        </button>
      )}

      {open && (
        <div className={classes.dropdown} role="menu">
          {normalized.map((item, i) => {
            if (item.sep) return <div key={`sep-${i}`} className={classes.sep} />;
            const Icon = item.icon;
            const danger = item.tone === "danger";
            return (
              <button
                key={`item-${i}`}
                type="button"
                role="menuitem"
                className={[classes.item, danger ? classes.danger : ""].filter(Boolean).join(" ")}
                onClick={() => handleItemClick(item)}
              >
                {Icon && (
                  <span className={classes.itemIcon}>
                    <Icon color={danger ? "#C03B28" : "#545873"} />
                  </span>
                )}
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
