import React from "react";
import { PERSON_CATEGORY_BADGE, normalizeCategory } from "../fapConstants";

// Бейдж возрастной категории пассажира. Рендерит ВСЕ категории (включая «взрослый»).
export default function CategoryBadge({ category }) {
  const cfg = PERSON_CATEGORY_BADGE[normalizeCategory(category)];
  if (!cfg) return null;
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        padding: "1px 8px",
        borderRadius: 8,
        fontSize: 11,
        fontWeight: 500,
        whiteSpace: "nowrap",
        verticalAlign: "middle",
        background: cfg.bg,
        color: cfg.color,
      }}
    >
      {cfg.label}
    </span>
  );
}
