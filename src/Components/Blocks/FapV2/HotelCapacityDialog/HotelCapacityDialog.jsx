import React, { useEffect, useRef, useState } from "react";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Button from "../../../Standart/Button/Button";
import classes from "./HotelCapacityDialog.module.css";

// Диалог «Изменить количество мест». Валидирует только то, что защищает от потери данных:
// положительное число и не ниже уже размещённых. Ограничение «сумма мест ≤ план услуги»
// снято осознанно — иначе диспетчер не может привести число мест к фактическому.
export default function HotelCapacityDialog({
  open,
  hotelName,
  placed,
  initialValue,
  saving,
  onClose,
  onSave,
  onError,
}) {
  const [value, setValue] = useState("");
  const prevOpenRef = useRef(false);

  // Предзаполняем ТОЛЬКО на открытии. placed — живая величина (подписка на заявку),
  // и держать её в зависимостях означало бы затирать уже набранное пользователем.
  useEffect(() => {
    if (open && !prevOpenRef.current) {
      setValue(String(initialValue ?? placed ?? 0));
    }
    prevOpenRef.current = open;
  }, [open, initialValue, placed]);

  const handleSubmit = () => {
    const next = Number(value);
    if (!Number.isFinite(next) || next <= 0) {
      onError?.("Укажите корректное количество мест");
      return;
    }
    if (next < placed) {
      onError?.(`Нельзя задать меньше количества уже размещённых человек (${placed})`);
      return;
    }
    onSave(next);
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="xs"
      fullWidth
      PaperProps={{ sx: { borderRadius: "16px" } }}
    >
      <DialogTitle
        sx={{
          fontFamily: "Inter, sans-serif",
          fontWeight: 700,
          fontSize: 18,
          color: "var(--text)",
          borderBottom: "1px solid #F1F5F9",
          pb: 2,
        }}
      >
        Изменить количество мест
      </DialogTitle>
      <DialogContent sx={{ pt: "16px !important", display: "flex", flexDirection: "column", gap: 2 }}>
        <div className={classes.hotelLine}>
          Гостиница: <strong>{hotelName || "—"}</strong>
        </div>
        <div className={classes.editHotelField}>
          <label className={classes.editHotelLabel}>Количество мест *</label>
          <input
            type="number"
            min={1}
            className={classes.editHotelInput}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            autoFocus
          />
          <div className={classes.editHotelHint}>
            Сейчас размещено: <strong>{placed}</strong>
          </div>
        </div>
      </DialogContent>
      <DialogActions sx={{ padding: "12px 20px 20px", gap: 1 }}>
        <Button backgroundcolor="#F6F7FB" color="#545873" onClick={onClose}>
          Отмена
        </Button>
        <Button
          backgroundcolor="var(--dark-blue)"
          color="#fff"
          onClick={handleSubmit}
          disabled={saving}
        >
          {saving ? "Сохранение..." : "Сохранить"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
