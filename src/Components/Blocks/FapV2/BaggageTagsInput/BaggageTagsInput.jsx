import React, { useState } from "react";
import classes from "./BaggageTagsInput.module.css";

// Ввод номеров багажных бирок чипами. Enter, запятая или потеря фокуса
// добавляют значение, крестик и Backspace на пустом поле — удаляют.
// Дубли без учёта регистра игнорируем: в одной доставке бирка уникальна.
// Черновик может содержать сразу несколько бирок (вставка из буфера или
// ручной ввод через запятую/пробел) — разбираем на токены и добавляем пачкой.
export default function BaggageTagsInput({
  value = [],
  onChange,
  disabled = false,
  placeholder = "FV640586",
}) {
  const [draft, setDraft] = useState("");
  // value по контракту не nullable, но на всякий случай подстрахуемся от null
  // со стороны черновика формы — иначе .some/.map уронят рендер.
  const tags = Array.isArray(value) ? value : [];

  const commit = () => {
    const raw = draft;
    setDraft("");
    const tokens = raw
      .split(/[,\s]+/)
      .map((token) => token.trim())
      .filter(Boolean);
    if (tokens.length === 0) return;

    const seen = new Set(tags.map((tag) => tag.toUpperCase()));
    const additions = [];
    tokens.forEach((token) => {
      const key = token.toUpperCase();
      if (seen.has(key)) return;
      seen.add(key);
      additions.push(token);
    });
    if (additions.length === 0) return;
    onChange?.([...tags, ...additions]);
  };

  const remove = (index) => onChange?.(tags.filter((_, i) => i !== index));

  const handleKeyDown = (e) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      commit();
      return;
    }
    if (e.key === "Backspace" && draft === "" && tags.length > 0) {
      remove(tags.length - 1);
    }
  };

  return (
    <div
      className={`${classes.root} ${disabled ? classes.disabled : ""}`}
      role="group"
      aria-label="Номера багажных бирок"
    >
      {tags.map((tag, index) => (
        <span key={`${tag}-${index}`} className={classes.chip}>
          {tag}
          {!disabled && (
            <button
              type="button"
              className={classes.chipRemove}
              onClick={() => remove(index)}
              aria-label={`Удалить бирку ${tag}`}
            >
              ×
            </button>
          )}
        </span>
      ))}
      {!disabled && (
        <input
          type="text"
          className={classes.input}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={commit}
          placeholder={tags.length === 0 ? placeholder : ""}
          aria-label="Добавить номер бирки"
        />
      )}
      {disabled && tags.length === 0 && <span className={classes.empty}>—</span>}
    </div>
  );
}
