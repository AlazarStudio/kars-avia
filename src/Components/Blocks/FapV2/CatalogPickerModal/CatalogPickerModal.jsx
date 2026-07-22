import React, { useEffect, useMemo, useState } from "react";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import GroupChip from "../GroupChip/GroupChip";
import { groupDisplayLabel } from "../fapGroups";
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
  maxSelectable,
  loading = false,
  onConfirm,
  title = "Выбрать из реестра заявки",
  // { groups, groupIndex: Map<personId, group>, placedElsewhere: Map<personId, hotelName> }
  // Без пропа — прежний плоский список (вода/питание/водитель).
  groupContext = null,
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

  // Секции: сначала группы (в порядке заявки), затем «Без группы».
  // Без groupContext — одна безымянная секция (прежнее поведение).
  const sections = useMemo(() => {
    if (!groupContext) return [{ id: "all", group: null, index: 0, rows }];

    const groups = groupContext.groups ?? [];
    const index =
      groupContext.groupIndex instanceof Map ? groupContext.groupIndex : new Map();
    const buckets = new Map(groups.map((g) => [g.groupId, []]));
    const rest = [];

    rows.forEach((r) => {
      const group = r.key ? index.get(r.key) : null;
      const bucket = group ? buckets.get(group.groupId) : null;
      if (bucket) bucket.push({ ...r, group });
      else rest.push({ ...r, group: null });
    });

    const list = groups
      .map((group, i) => ({
        id: group.groupId,
        group,
        index: i,
        rows: buckets.get(group.groupId) ?? [],
      }))
      .filter((s) => s.rows.length > 0);

    if (rest.length > 0) list.push({ id: "none", group: null, index: 0, rows: rest });
    return list;
  }, [rows, groupContext]);

  const hasGroupSections = sections.some((s) => s.group);
  const placedElsewhere =
    groupContext?.placedElsewhere instanceof Map ? groupContext.placedElsewhere : null;

  const selectableRows = rows.filter((r) => !r.disabled);
  // Ограничение по свободным местам (отель/водитель). undefined → без лимита.
  const limit =
    typeof maxSelectable === "number" ? Math.max(0, maxSelectable) : Infinity;
  const atLimit = selectedIds.size >= limit;
  const cappedSelectable =
    limit === Infinity ? selectableRows : selectableRows.slice(0, limit);
  const allSelected =
    cappedSelectable.length > 0 &&
    cappedSelectable.every((r) => selectedIds.has(r.person.personId));

  const toggleOne = (id) =>
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else if (next.size < limit) next.add(id);
      return next;
    });

  const toggleAll = () =>
    setSelectedIds((prev) => {
      if (allSelected) {
        const next = new Set(prev);
        cappedSelectable.forEach((r) => next.delete(r.person.personId));
        return next;
      }
      return new Set(cappedSelectable.map((r) => r.person.personId));
    });

  // Выбрать/снять всю группу (в пределах свободных мест).
  const toggleGroup = (ids) =>
    setSelectedIds((prev) => {
      const next = new Set(prev);
      const missing = ids.filter((id) => !next.has(id));
      if (missing.length === 0) {
        ids.forEach((id) => next.delete(id));
        return next;
      }
      missing.forEach((id) => {
        if (next.size < limit) next.add(id);
      });
      return next;
    });

  // Состояние секции относительно текущего выбора и лимита мест.
  const sectionState = (section) => {
    const ids = section.rows.filter((r) => !r.disabled).map((r) => r.key);
    const missing = ids.filter((id) => !selectedIds.has(id));
    const remaining =
      limit === Infinity ? Infinity : Math.max(0, limit - selectedIds.size);
    return {
      ids,
      missing,
      remaining,
      fits: missing.length <= remaining,
      allChecked: ids.length > 0 && missing.length === 0,
    };
  };

  // Превентивный хинт: часть группы уже размещена в другой гостинице.
  const elsewhereHotels = (section) => {
    if (!placedElsewhere || !section.group) return [];
    const names = new Set();
    section.rows
      .filter((r) => !r.disabled)
      .forEach((r) => {
        const hotel = placedElsewhere.get(r.key);
        if (hotel) names.add(hotel);
      });
    return [...names];
  };

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

  const renderRow = ({ person, disabled, group, groupIdx }) => (
    <label
      key={person.personId}
      className={`${classes.row} ${disabled ? classes.rowDisabled : ""}`}
    >
      <input
        type="checkbox"
        checked={selectedIds.has(person.personId)}
        disabled={disabled || (atLimit && !selectedIds.has(person.personId))}
        onChange={() => toggleOne(person.personId)}
      />
      <span className={classes.avatar}>{initials(person.fullName)}</span>
      <span className={classes.info}>
        <span className={classes.nameLine}>
          {group && <GroupChip group={group} index={groupIdx ?? 0} compact />}
          <b>{person.fullName}</b>
        </span>
        <span className={classes.meta}>
          {[person.phone, person.seat, group ? groupDisplayLabel(group) : null]
            .filter(Boolean)
            .join(" · ")}
        </span>
      </span>
      {disabled && <span className={classes.added}>уже добавлен</span>}
    </label>
  );

  const renderSection = (section) => {
    const { ids, missing, remaining, fits, allChecked } = sectionState(section);
    const hotels = elsewhereHotels(section);
    const showHeader = !!groupContext && (!!section.group || hasGroupSections);

    return (
      <div key={section.id} className={classes.section}>
        {showHeader && (
          <div className={classes.sectionHead}>
            {section.group ? (
              <label className={classes.sectionLabel}>
                <input
                  type="checkbox"
                  checked={allChecked}
                  disabled={ids.length === 0 || (!allChecked && !fits)}
                  onChange={() => toggleGroup(ids)}
                />
                <GroupChip group={section.group} index={section.index} />
                <span className={classes.sectionCount}>
                  {section.rows.length} чел.
                </span>
              </label>
            ) : (
              <span className={classes.sectionLabel}>
                <span className={classes.sectionTitle}>Без группы</span>
                <span className={classes.sectionCount}>
                  {section.rows.length} чел.
                </span>
              </span>
            )}
            {section.group && !allChecked && !fits && (
              <span className={classes.sectionHint}>
                свободно {remaining} — группа не помещается
              </span>
            )}
          </div>
        )}

        {hotels.length > 0 && (
          <div className={classes.warnRow}>
            Часть группы уже в «{hotels.join("», «")}»
          </div>
        )}

        {section.group && missing.length > 0 && missing.length < ids.length && fits && (
          <button
            type="button"
            className={classes.groupAddAll}
            onClick={() => toggleGroup(ids)}
          >
            + вся группа (ещё {missing.length})
          </button>
        )}

        {section.rows.map((row) =>
          renderRow({ ...row, groupIdx: section.index })
        )}
      </div>
    );
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle className={classes.title}>
        {title}
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
            disabled={cappedSelectable.length === 0}
            onChange={toggleAll}
          />
          <span>
            Выбрать все ({cappedSelectable.length})
            {limit !== Infinity && (
              <span className={classes.selCount}> · свободно мест: {limit}</span>
            )}
            {selectedIds.size > 0 && (
              <span className={classes.selCount}> · выбрано {selectedIds.size}</span>
            )}
          </span>
        </label>
        <div className={classes.list}>
          {rows.length === 0 ? (
            <div className={classes.empty}>Ничего не найдено</div>
          ) : (
            sections.map(renderSection)
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
