import React from "react";
import classes from "../TravellinePage.module.css";

export default function SyncProgressModal({ status, onClose, canClose }) {
  if (!status) return null;
  const { running, total, done, currentName, error } = status;
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;

  return (
    <div className={classes.modalOverlay} style={{ zIndex: 900 }}>
      <div className={classes.modalBackdrop} />
      <div
        className={classes.modalBox}
        style={{ maxWidth: 420, padding: 0, background: "#ffffff" }}
      >
        <div style={{ padding: "20px 24px" }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0, color: "#0f172a" }}>
            {running
              ? "Синхронизация каталога TravelLine"
              : error
              ? "Ошибка синхронизации"
              : "Каталог TravelLine загружен"}
          </h2>
          <p style={{ fontSize: 13, color: "#64748b", marginTop: 6 }}>
            {running
              ? "Загружаем отели, фотографии и контент. Это может занять несколько минут."
              : error
              ? `Произошла ошибка: ${error}`
              : `Загружено ${done} отелей.`}
          </p>

          <div
            style={{
              marginTop: 16,
              background: "#f1f5f9",
              borderRadius: 8,
              height: 10,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                width: `${pct}%`,
                height: "100%",
                background: "#2196F3",
                transition: "width 0.3s ease",
              }}
            />
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginTop: 8,
              fontSize: 12,
              color: "#475569",
            }}
          >
            <span>
              {done} / {total || "?"} ({pct}%)
            </span>
            {currentName && running && (
              <span
                style={{
                  maxWidth: 240,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {currentName}
              </span>
            )}
          </div>

          {canClose && (
            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                marginTop: 20,
              }}
            >
              <button
                type="button"
                onClick={onClose}
                style={{
                  height: 36,
                  padding: "0 18px",
                  borderRadius: 8,
                  background: "#0057C3",
                  color: "#fff",
                  border: "none",
                  fontFamily: "Nunito Sans",
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Готово
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
