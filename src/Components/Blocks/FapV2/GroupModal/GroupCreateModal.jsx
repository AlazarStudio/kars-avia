import React, { useEffect, useMemo, useState } from "react";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import classes from "./GroupCreateModal.module.css";
import Button from "../../../Standart/Button/Button";
import { GROUP_KIND_OPTIONS, defaultGroupLabel } from "../fapGroups";

// Создание/редактирование группы пассажиров. Цвет не выбирается — назначается
// автоматически (следующий незанятый из палитры) на стороне вызывающего.
export default function GroupCreateModal({
  open,
  onClose,
  members = [],
  group = null,
  ordinal = 1,
  saving = false,
  onConfirm,
}) {
  const [kind, setKind] = useState("FAMILY");
  const [label, setLabel] = useState("");
  const [labelTouched, setLabelTouched] = useState(false);
  const [removedIds, setRemovedIds] = useState(() => new Set());

  useEffect(() => {
    if (!open) return;
    setKind(group?.kind || "FAMILY");
    setLabel(group?.label || "");
    setLabelTouched(!!group?.label);
    setRemovedIds(new Set());
  }, [open, group]);

  const kept = useMemo(
    () => members.filter((m) => !removedIds.has(m.personId)),
    [members, removedIds]
  );

  const autoLabel = defaultGroupLabel(kept, ordinal);
  const effectiveLabel = labelTouched ? label : autoLabel;

  const removeMember = (personId) =>
    setRemovedIds((prev) => new Set(prev).add(personId));

  const handleConfirm = () => {
    if (kept.length === 0) return;
    onConfirm?.({
      groupId: group?.groupId,
      label: effectiveLabel.trim() || null,
      kind,
      memberPersonIds: kept.map((m) => m.personId),
    });
  };

  return (
    <Dialog
      open={open}
      onClose={saving ? undefined : onClose}
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
        {group ? "Изменить группу" : "Связать в группу"}
      </DialogTitle>
      <DialogContent sx={{ pt: "16px !important" }}>
        <div className={classes.field}>
          <label className={classes.label}>Тип связи</label>
          <div className={classes.kinds}>
            {GROUP_KIND_OPTIONS.map((o) => (
              <button
                key={o.value}
                type="button"
                className={`${classes.kind} ${kind === o.value ? classes.kindActive : ""}`}
                onClick={() => setKind(o.value)}
              >
                {o.label}
              </button>
            ))}
          </div>
        </div>

        <div className={classes.field}>
          <label className={classes.label}>Подпись</label>
          <input
            className={classes.input}
            value={effectiveLabel}
            onChange={(e) => {
              setLabelTouched(true);
              setLabel(e.target.value);
            }}
            placeholder={autoLabel}
          />
        </div>

        <div className={classes.field}>
          <label className={classes.label}>Состав · {kept.length} чел.</label>
          <div className={classes.members}>
            {kept.length === 0 ? (
              <div className={classes.empty}>Все участники убраны</div>
            ) : (
              kept.map((m) => (
                <span key={m.personId} className={classes.member}>
                  {m.fullName || "—"}
                  <button
                    type="button"
                    className={classes.remove}
                    onClick={() => removeMember(m.personId)}
                    title="Убрать из группы"
                  >
                    ×
                  </button>
                </span>
              ))
            )}
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
          onClick={handleConfirm}
          disabled={saving || kept.length === 0}
        >
          {saving ? "Сохранение..." : group ? "Сохранить" : "Связать"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
