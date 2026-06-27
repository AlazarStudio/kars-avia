import React, { useState } from "react";
import classes from "./StarRatingFilter.module.css";

const STAR_PATH =
  "M12 2.5l2.95 5.98 6.6.96-4.77 4.65 1.13 6.57L12 17.55l-5.9 3.11 1.13-6.57L2.46 9.44l6.6-.96L12 2.5z";

// Парсит значение, понимая и точку, и запятую (в данных встречаются оба).
const toNum = (v) => {
  const n = Number(String(v ?? "").replace(",", "."));
  return Number.isNaN(n) ? 0 : n;
};

// Звёздная оценка 1..5. По умолчанию шаг 0.5 (полузвёзды) + число с шагом 0.1.
// integer — только целые: полные звёзды + число с шагом 1.
// value/onChange — строка ("", "4.5", "4.9", "5"); ввод принимает и точку, и запятую.
// label опционален: в формах подпись своя (тогда звёзды слева, без лейбла);
// в фильтре label плавающий (всегда наверху на рамке).
// disabled — только просмотр: без клика/«×», затемнение.
function StarRatingFilter({
  label,
  value,
  max = 5,
  onChange,
  disabled = false,
  width,
  integer = false,
}) {
  const current = toNum(value);
  const [hover, setHover] = useState(0);
  const active = disabled ? current : hover || current;
  const canClear = current > 0 && !disabled;

  const setStar = (v) => {
    if (!disabled) onChange(current === v ? "" : String(v));
  };

  const onNumber = (e) => {
    const raw = e.target.value.replace(",", ".");
    if (raw === "") return onChange("");
    const n = Number(raw);
    if (Number.isNaN(n)) return;
    let clamped = Math.min(max, Math.max(0, n));
    clamped = integer ? Math.round(clamped) : Math.round(clamped * 10) / 10;
    onChange(String(clamped));
  };

  return (
    <div
      className={[
        classes.field,
        label ? classes.hasLabel : classes.fieldBare,
        disabled ? classes.fieldDisabled : "",
      ]
        .filter(Boolean)
        .join(" ")}
      style={width ? { width } : undefined}
    >
      {label && <span className={classes.floatLabel}>{label}</span>}
      <div className={classes.controls}>
        <div className={classes.stars} onMouseLeave={() => setHover(0)}>
          {Array.from({ length: max }, (_, i) => i + 1).map((n) => {
            const frac = Math.max(0, Math.min(1, active - (n - 1)));
            return (
              <span key={n} className={classes.starWrap}>
                <svg viewBox="0 0 24 24" className={classes.starBase}>
                  <path d={STAR_PATH} />
                </svg>
                <span className={classes.starFillClip} style={{ width: `${frac * 100}%` }}>
                  <svg viewBox="0 0 24 24" className={classes.starFill}>
                    <path d={STAR_PATH} />
                  </svg>
                </span>
                {!disabled &&
                  (integer ? (
                    <button
                      type="button"
                      className={`${classes.half} ${classes.halfFull}`}
                      aria-label={`${label || "Оценка"}: ${n}`}
                      onMouseEnter={() => setHover(n)}
                      onClick={() => setStar(n)}
                    />
                  ) : (
                    <>
                      <button
                        type="button"
                        className={`${classes.half} ${classes.halfL}`}
                        aria-label={`${label || "Оценка"}: ${n - 0.5}`}
                        onMouseEnter={() => setHover(n - 0.5)}
                        onClick={() => setStar(n - 0.5)}
                      />
                      <button
                        type="button"
                        className={`${classes.half} ${classes.halfR}`}
                        aria-label={`${label || "Оценка"}: ${n}`}
                        onMouseEnter={() => setHover(n)}
                        onClick={() => setStar(n)}
                      />
                    </>
                  ))}
              </span>
            );
          })}
        </div>

        <div className={classes.valueGroup}>
          <input
            type="number"
            className={classes.num}
            min={0}
            max={max}
            step={integer ? 1 : 0.1}
            value={value == null ? "" : String(value).replace(",", ".")}
            disabled={disabled}
            onChange={onNumber}
            aria-label={label || "Оценка"}
          />
          {current > 0 && <span className={classes.numSuffix}>/ {max}</span>}
        </div>

        <button
          type="button"
          className={`${classes.clear} ${canClear ? "" : classes.clearHidden}`}
          aria-label="Сбросить"
          aria-hidden={!canClear}
          tabIndex={canClear ? 0 : -1}
          onClick={() => onChange("")}
        >
          <svg viewBox="0 0 24 24">
            <path
              d="M6 6l12 12M18 6L6 18"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}

export default StarRatingFilter;
