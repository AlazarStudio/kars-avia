import { useEffect, useState } from "react";
import PropTypes from "prop-types";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Button from "../../../Standart/Button/Button";
import { fromLocalInputValue } from "../fapConstants";
import { calculateCostDaysByDuration } from "../../../../utils/effectiveCostDays";
import classes from "./FapHotelPage.module.css";

const EMPTY = { arrival: "", departure: "", days: "" };

// Диалог «Даты и сутки всем»: заезд, выезд и сутки одним действием на всех
// гостей отчёта. Пустое поле — не менять, как в «Количестве приёмов».
export default function StayBulkDialog({ open, onClose, onApply }) {
  const [form, setForm] = useState(EMPTY);
  useEffect(() => {
    if (open) setForm(EMPTY);
  }, [open]);

  const arrival = fromLocalInputValue(form.arrival);
  const departure = fromLocalInputValue(form.departure);
  const reversed = Boolean(arrival && departure && departure <= arrival);
  const daysByDates =
    arrival && departure && !reversed ? calculateCostDaysByDuration(arrival, departure) : 0;
  const empty = !arrival && !departure && form.days === "";

  const set = (key) => (e) => setForm((p) => ({ ...p, [key]: e.target.value }));

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
        Даты и сутки всем
      </DialogTitle>
      <DialogContent sx={{ pt: "16px !important", display: "flex", flexDirection: "column", gap: 2 }}>
        <p className={classes.dialogHint}>
          Значение проставится всем гостям отчёта. Пустое поле — не менять. Сутки
          пересчитаются по датам, если не задать их вручную.
        </p>
        <div className={classes.bulkDialogGrid}>
          <div className={classes.dialogField}>
            <label className={classes.dialogLabel}>Заезд</label>
            <input type="datetime-local" className={classes.dialogInput} value={form.arrival} onChange={set("arrival")} />
          </div>
          <div className={classes.dialogField}>
            <label className={classes.dialogLabel}>Выезд</label>
            <input type="datetime-local" className={classes.dialogInput} value={form.departure} onChange={set("departure")} />
          </div>
          <div className={classes.dialogField}>
            <label className={classes.dialogLabel}>Сутки</label>
            <input
              type="number"
              min={0}
              step={0.5}
              className={classes.dialogInput}
              value={form.days}
              onChange={set("days")}
              placeholder={daysByDates > 0 ? `по датам — ${daysByDates}` : "не менять"}
            />
          </div>
        </div>
        {reversed && <p className={classes.stayDialogWarn}>Выезд должен быть позже заезда</p>}
      </DialogContent>
      <DialogActions sx={{ padding: "12px 20px 20px", gap: 1 }}>
        <Button backgroundcolor="#F6F7FB" color="#545873" onClick={onClose}>
          Отмена
        </Button>
        <Button
          backgroundcolor="var(--dark-blue)"
          color="#fff"
          onClick={() =>
            onApply({
              arrival,
              departure,
              days: form.days === "" ? null : Math.max(0, Number(form.days) || 0),
            })
          }
          disabled={empty || reversed}
        >
          Применить
        </Button>
      </DialogActions>
    </Dialog>
  );
}

StayBulkDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onApply: PropTypes.func.isRequired,
};
