import { useEffect, useRef } from "react";
import PropTypes from "prop-types";
import classes from "./ReportDraftDialog.module.css";

// Проектный useDialog умеет только два действия (да/нет) — редактору
// черновика местами нужно три (например "Остаться" / "Выйти без сохранения" /
// "Сохранить и выйти"), поэтому здесь свой лёгкий модальный диалог вместо
// системного MUIConfirm. Закрывается по Esc и клику на затемнение; фокус при
// открытии — на кнопке отмены (самое безопасное действие по умолчанию).
export default function ReportDraftDialog({
  open,
  onClose,
  symbol,
  symbolBg,
  symbolColor,
  title,
  message,
  note,
  cancelLabel,
  onCancel,
  primaryLabel,
  primaryColor,
  onPrimary,
  tertiaryLabel,
  onTertiary,
}) {
  const cancelRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    cancelRef.current?.focus();

    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className={classes.overlay}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className={classes.card}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="reportDraftDialogTitle"
      >
        <div className={classes.top}>
          <div className={classes.symbol} style={{ background: symbolBg, color: symbolColor }}>
            {symbol}
          </div>
          <div className={classes.copy}>
            <div id="reportDraftDialogTitle" className={classes.title}>
              {title}
            </div>
            <div className={classes.message}>{message}</div>
            {note && <div className={classes.note}>{note}</div>}
          </div>
        </div>

        <div className={classes.actions}>
          {tertiaryLabel && (
            <button type="button" className={classes.tertiaryBtn} onClick={onTertiary}>
              {tertiaryLabel}
            </button>
          )}
          <button
            type="button"
            ref={cancelRef}
            className={classes.cancelBtn}
            onClick={onCancel || onClose}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            className={classes.primaryBtn}
            style={{ background: primaryColor }}
            onClick={onPrimary}
          >
            {primaryLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

ReportDraftDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  symbol: PropTypes.string.isRequired,
  symbolBg: PropTypes.string.isRequired,
  symbolColor: PropTypes.string.isRequired,
  title: PropTypes.string.isRequired,
  message: PropTypes.string.isRequired,
  note: PropTypes.string,
  cancelLabel: PropTypes.string.isRequired,
  onCancel: PropTypes.func,
  primaryLabel: PropTypes.string.isRequired,
  primaryColor: PropTypes.string.isRequired,
  onPrimary: PropTypes.func.isRequired,
  tertiaryLabel: PropTypes.string,
  onTertiary: PropTypes.func,
};
