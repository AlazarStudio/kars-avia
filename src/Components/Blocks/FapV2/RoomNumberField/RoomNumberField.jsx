import React, { useEffect, useState } from "react";
import { Autocomplete, TextField } from "@mui/material";
import classes from "./RoomNumberField.module.css";
import { roomKey } from "../fapGroups";
import { roomCapacity, roomCategoryLabel } from "../fapRooms";

// Поле номера комнаты с выбором из реального фонда гостиницы (freeSolo-автокомплит).
// В покое — лёгкий обычный <input> (в отчёте таких десятки; монтировать десятки MUI
// Autocomplete разом дорого и тормозит). Тяжёлый автокомплит поднимается только на
// время фокуса/редактирования. rooms пуст (нет hotelId/фонда) → просто ручной ввод.
// live=false (ячейка отчёта): коммит на blur/выбор. live=true (формы/диалог): на каждое.
export default function RoomNumberField({
  value,
  onCommit,
  rooms = [],
  occupancy,
  live = false,
  disabled = false,
  placeholder = "№",
  className,
}) {
  const [active, setActive] = useState(false);
  const [text, setText] = useState(value ?? "");
  useEffect(() => { setText(value ?? ""); }, [value]);

  const commit = (v) => {
    const next = (v ?? "").toString();
    if (next !== (value ?? "")) onCommit(next);
  };

  // В покое — дешёвый input; внешний вид берёт из переданного className контекста.
  if (!active) {
    return (
      <input
        className={`${classes.plain} ${className || ""}`}
        value={value ?? ""}
        placeholder={placeholder}
        readOnly={disabled}
        onChange={() => {}}
        onFocus={() => { if (!disabled) setActive(true); }}
      />
    );
  }

  return (
    <Autocomplete
      freeSolo
      selectOnFocus
      handleHomeEndKeys
      openOnFocus
      size="small"
      disabled={disabled}
      options={rooms}
      inputValue={text}
      getOptionLabel={(o) => (typeof o === "string" ? o : o?.name ?? "")}
      filterOptions={(opts, state) => {
        const q = state.inputValue.trim().toLowerCase();
        if (!q) return opts;
        return opts.filter((o) => (o?.name ?? "").toLowerCase().includes(q));
      }}
      onInputChange={(_e, val, reason) => {
        if (reason === "reset") return;
        setText(val);
        if (live) commit(val);
      }}
      onChange={(_e, val, reason) => {
        if (reason === "selectOption" || reason === "createOption") {
          const name = typeof val === "string" ? val : val?.name ?? "";
          setText(name);
          commit(name);
        }
      }}
      onBlur={() => { commit(text); setActive(false); }}
      className={classes.root}
      slotProps={{
        popper: { style: { width: 260 } },
        paper: { className: classes.paper },
        listbox: { className: classes.listbox },
      }}
      renderOption={(props, room) => {
        const cap = roomCapacity(room);
        const occ = occupancy?.get(roomKey(room?.name)) ?? 0;
        const meta = [
          roomCategoryLabel(room?.category),
          cap != null ? `занят ${occ}/${cap}` : "",
        ].filter(Boolean).join(" · ");
        return (
          <li
            {...props}
            key={room?.id ?? room?.name}
            className={`${props.className || ""} ${classes.option}`}
          >
            <span className={classes.optName}>№ {room?.name}</span>
            {meta && <span className={classes.optMeta}>{meta}</span>}
          </li>
        );
      }}
      renderInput={(params) => (
        <TextField
          {...params}
          autoFocus
          variant="standard"
          placeholder={placeholder}
          className={classes.field}
          InputProps={{ ...params.InputProps, disableUnderline: true }}
        />
      )}
    />
  );
}
