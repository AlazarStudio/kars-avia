import React, { useEffect, useMemo, useState } from "react";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import classes from "./CatalogPickerModal.module.css";

// Ключ совпадения = personId (зеркалит rosterMatchKey бэка — идентичность по personId).
export function personKey(person) {
  return person?.personId;
}

const initials = (fullName) =>
  String(fullName ?? "")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0] || "")
    .join("")
    .toUpperCase();

export default function CatalogPickerModal({
  open,
  onClose,
  savedPassengers = [],
  excludeKeys,
  loading = false,
  onConfirm,
}) {
  const [search, setSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState(() => new Set());

  const exclude = excludeKeys instanceof Set ? excludeKeys : new Set();

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return savedPassengers
      .map((p) => {
        const key = personKey(p);
        return { person: p, key, disabled: exclude.has(key) };
      })
      .filter((r) => {
        if (!q) return true;
        const p = r.person;
        return (
          (p.fullName ?? "").toLowerCase().includes(q) ||
          (p.phone ?? "").toLowerCase().includes(q) ||
          (p.seat ?? "").toLowerCase().includes(q)
        );
      })
      // Недобавленные — сверху, уже добавленные — вниз (стабильно).
      .sort((a, b) => Number(a.disabled) - Number(b.disabled));
  }, [savedPassengers, search, exclude]);

  const selectableRows = rows.filter((r) => !r.disabled);
  const allSelected =
    selectableRows.length > 0 &&
    selectableRows.every((r) => selectedIds.has(r.person.personId));

  const toggleOne = (id) =>
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const toggleAll = () =>
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (allSelected) selectableRows.forEach((r) => next.delete(r.person.personId));
      else selectableRows.forEach((r) => next.add(r.person.personId));
      return next;
    });

  const reset = () => {
    setSearch("");
    setSelectedIds(new Set());
  };

  // Сброс при закрытии — на случай, если родитель закрывает напрямую через open
  // (после успешного bulk-добавления), минуя onClose/handleClose.
  useEffect(() => {
    if (!open) {
      setSearch("");
      setSelectedIds(new Set());
    }
  }, [open]);

  const handleClose = () => {
    if (loading) return;
    reset();
    onClose?.();
  };

  const handleConfirm = () => {
    const selected = savedPassengers.filter((p) => selectedIds.has(p.personId));
    if (selected.length === 0) return;
    onConfirm?.(selected);
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle className={classes.title}>
        Выбрать из каталога заявки
        <span className={classes.count}> · {savedPassengers.length} чел.</span>
      </DialogTitle>
      <DialogContent dividers className={classes.content}>
        <input
          className={classes.search}
          placeholder="Поиск по ФИО, телефону, месту…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <label className={classes.selectAll}>
          <input
            type="checkbox"
            checked={allSelected}
            disabled={selectableRows.length === 0}
            onChange={toggleAll}
          />
          <span>
            Выбрать все ({selectableRows.length})
            {selectedIds.size > 0 && (
              <span className={classes.selCount}> · выбрано {selectedIds.size}</span>
            )}
          </span>
        </label>
        <div className={classes.list}>
          {rows.length === 0 ? (
            <div className={classes.empty}>Ничего не найдено</div>
          ) : (
            rows.map(({ person, disabled }) => (
              <label
                key={person.personId}
                className={`${classes.row} ${disabled ? classes.rowDisabled : ""}`}
              >
                <input
                  type="checkbox"
                  checked={selectedIds.has(person.personId)}
                  disabled={disabled}
                  onChange={() => toggleOne(person.personId)}
                />
                <span className={classes.avatar}>{initials(person.fullName)}</span>
                <span className={classes.info}>
                  <b>{person.fullName}</b>
                  <span className={classes.meta}>
                    {[person.phone, person.seat].filter(Boolean).join(" · ")}
                  </span>
                </span>
                {disabled && <span className={classes.added}>уже добавлен</span>}
              </label>
            ))
          )}
        </div>
      </DialogContent>
      <DialogActions className={classes.actions}>
        <button
          type="button"
          className={classes.cancelBtn}
          onClick={handleClose}
          disabled={loading}
        >
          Отмена
        </button>
        <button
          type="button"
          className={classes.addBtn}
          onClick={handleConfirm}
          disabled={loading || selectedIds.size === 0}
        >
          {loading ? "Добавление…" : `Добавить выбранных (${selectedIds.size})`}
        </button>
      </DialogActions>
    </Dialog>
  );
}
