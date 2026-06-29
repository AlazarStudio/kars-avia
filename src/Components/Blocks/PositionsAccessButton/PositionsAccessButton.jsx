import React from "react";
import classes from "./PositionsAccessButton.module.css";

// Контурная кнопка «Должности и доступ» со щитом-галочкой (по дизайну).
export default function PositionsAccessButton({ onClick }) {
  return (
    <button type="button" className={classes.btn} onClick={onClick}>
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 3l7 3v5c0 4.5-3 7.6-7 9-4-1.4-7-4.5-7-9V6l7-3Z" />
        <path d="M9.5 12l1.8 1.8L15 10" />
      </svg>
      Должности и доступ
    </button>
  );
}
