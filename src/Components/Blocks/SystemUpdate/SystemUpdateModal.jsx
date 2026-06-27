import React from "react";
import Dialog from "@mui/material/Dialog";
import Button from "../../Standart/Button/Button";
import classes from "./SystemUpdateModal.module.css";

const RU_MONTHS = [
  "января",
  "февраля",
  "марта",
  "апреля",
  "мая",
  "июня",
  "июля",
  "августа",
  "сентября",
  "октября",
  "ноября",
  "декабря",
];

function formatReleaseDate(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return `${d.getDate()} ${RU_MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

export default function SystemUpdateModal({
  open,
  title,
  message,
  version,
  publishedAt,
  dismissing = false,
  onDismiss,
}) {
  if (!open) return null;

  const lines = (message || "").split("\n").filter((line) => line.trim());
  const date = formatReleaseDate(publishedAt);

  return (
    <Dialog
      open={open}
      onClose={onDismiss}
      PaperProps={{
        sx: {
          borderRadius: "20px",
          overflow: "hidden",
          maxWidth: 680,
          width: "92vw",
          margin: 2,
        },
      }}
    >
      <div className={classes.wrap}>
        <div className={classes.brand}>
          <div className={classes.brandGlow} />
          <div className={classes.iconBox}>
            <svg
              width="26"
              height="26"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z" />
              <path d="M12 15l-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z" />
              <path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0" />
              <path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5" />
            </svg>
          </div>
          <div className={classes.brandTitle}>{title}</div>
          <div className={classes.brandSpacer} />
          {version ? (
            <div className={classes.brandVersion}>{version}</div>
          ) : null}
          {date ? <div className={classes.brandDate}>{date}</div> : null}
        </div>

        <div className={classes.changes}>
          <div className={classes.changesLabel}>Изменения</div>
          <div className={classes.changesList}>
            {lines.map((line, i) => (
              <div key={i} className={classes.changeRow}>
                <span className={classes.checkDot}>
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M20 6L9 17l-5-5" />
                  </svg>
                </span>
                <span>{line}</span>
              </div>
            ))}
          </div>
          <div className={classes.actions}>
            <Button onClick={onDismiss} disabled={dismissing} padding="0 26px">
              {dismissing ? "..." : "Понятно"}
            </Button>
          </div>
        </div>
      </div>
    </Dialog>
  );
}
