import React from "react";
import { placementRequirementLabel } from "../fapGroups";

// Бейдж требования вида размещения («1-местн»). Нейтральный outline — требование
// не является статусом, только меткой; редактируется ТОЛЬКО в реестре.
export default function PlacementBadge({ value, violated = false }) {
  const label = placementRequirementLabel(value);
  if (!label) return null;
  return (
    <span
      title={
        violated
          ? "Нарушено: в номере больше гостей, чем допускает требование"
          : "Требование вида размещения (меняется в реестре)"
      }
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 3,
        padding: "1px 7px",
        borderRadius: 8,
        border: `1px solid ${violated ? "#F59E0B" : "#CBD5E1"}`,
        background: violated ? "#FEF3C7" : "#fff",
        color: violated ? "#92400E" : "#64748B",
        fontSize: 11,
        fontWeight: 600,
        whiteSpace: "nowrap",
        verticalAlign: "middle",
      }}
    >
      {violated && "⚠"}
      {label}
    </span>
  );
}
