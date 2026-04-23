import React, { useState, useEffect } from "react";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Button from "../../../Standart/Button/Button";

export default function FapDestructiveModal({
  open,
  onClose,
  onConfirm,
  title,
  description,
  reasonLabel = null,
  showReason,
  placeholder = "Укажите причину...",
  reasonRequired = true,
  confirmText = "Подтвердить",
  cancelText = "Отмена",
  saving = false,
}) {
  const [reason, setReason] = useState("");

  useEffect(() => {
    if (!open) setReason("");
  }, [open]);

  const hasReasonField = showReason !== undefined ? showReason : !!reasonLabel;
  const canConfirm = !saving && (!reasonRequired || !hasReasonField || !!reason.trim());

  return (
    <Dialog
      open={open}
      onClose={onClose}
      PaperProps={{ sx: { borderRadius: "16px", minWidth: 440, maxWidth: 500 } }}
    >
      <DialogTitle
        sx={{
          fontFamily: "Inter, sans-serif",
          fontWeight: 700,
          fontSize: 18,
          color: "#EF4444",
          borderBottom: "1px solid #F1F5F9",
          pb: 2,
        }}
      >
        {title}
      </DialogTitle>
      <DialogContent sx={{ pt: "16px !important", pb: 1 }}>
        {description && (
          <p
            style={{
              fontFamily: "Inter, sans-serif",
              fontSize: 14,
              color: "#545873",
              margin: hasReasonField ? "0 0 16px" : 0,
            }}
          >
            {description}
          </p>
        )}
        {hasReasonField && (
          <div>
            {reasonLabel && (
              <label
                style={{
                  fontFamily: "Inter, sans-serif",
                  fontSize: 13,
                  color: "#545873",
                  display: "block",
                  marginBottom: 6,
                }}
              >
                {reasonLabel}
              </label>
            )}
            <textarea
              rows={4}
              style={{
                width: "100%",
                padding: 10,
                border: "1px solid var(--text-gray)",
                borderRadius: 10,
                fontSize: 14,
                color: "var(--text)",
                background: "#fff",
                resize: "vertical",
                outline: "none",
                transition: "border-color 0.2s",
                boxSizing: "border-box",
                fontFamily: "Inter, sans-serif",
              }}
              placeholder={placeholder}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </div>
        )}
      </DialogContent>
      <DialogActions sx={{ padding: "12px 20px 20px", gap: 1 }}>
        <Button backgroundcolor="#F6F7FB" color="#545873" onClick={onClose}>
          {cancelText}
        </Button>
        <Button
          backgroundcolor="#EF4444"
          color="#fff"
          onClick={() => onConfirm(reason.trim() || undefined)}
          disabled={!canConfirm}
        >
          {saving ? "Сохранение..." : confirmText}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
