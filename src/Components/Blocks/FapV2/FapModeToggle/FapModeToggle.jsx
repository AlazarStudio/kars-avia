import React from "react";
import EyeIcon from "../../../../shared/icons/EyeIcon.jsx";
import classes from "./FapModeToggle.module.css";

// Сегментированный переключатель «Просмотр / Редактирование».
// mode: "view" | "edit"; onChange(nextMode).
const SEGMENTS = [
  { key: "view", label: "Просмотр", icon: EyeIcon },
  { key: "edit", label: "Редактирование" },
];

export default function FapModeToggle({ mode = "view", onChange, className = "" }) {
  return (
    <div className={[classes.root, className].filter(Boolean).join(" ")}>
      {SEGMENTS.map((seg) => {
        const active = mode === seg.key;
        const Icon = seg.icon;
        return (
          <button
            key={seg.key}
            type="button"
            className={[classes.segment, active ? classes.active : ""].filter(Boolean).join(" ")}
            aria-pressed={active}
            onClick={() => onChange && onChange(seg.key)}
          >
            {Icon && <Icon size={15} color={active ? "#0057C3" : "#545873"} />}
            <span>{seg.label}</span>
          </button>
        );
      })}
    </div>
  );
}
