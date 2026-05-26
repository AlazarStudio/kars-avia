import React from "react";
import classes from "./PersonBadge.module.css";
import { PERSON_TYPE_CONFIG } from "../fapConstants";

export default function PersonBadge({ type }) {
  const cfg = PERSON_TYPE_CONFIG[type === "CREW" ? "CREW" : "PASSENGER"];
  return (
    <span className={classes.badge} style={{ color: cfg.color, background: cfg.bg }}>
      {cfg.label}
    </span>
  );
}
