import { useState } from "react";
import classes from "./HotelAboutEditor.module.css";

// Раздел описания: галки-чипы по группам и поле для всего, что в словарь не попало.
// Редкие пункты (rareKeys) спрятаны под «ещё», пока не отмечены: отмеченный
// редкий пункт виден всегда, иначе галку было бы не снять.
export default function AboutChecklist({
  title,
  groups,
  value,
  rareKeys,
  extraLabel,
  extraPlaceholder,
  disabled,
  onChange,
}) {
  const [expanded, setExpanded] = useState(false);
  const checked = new Set(value.checked);
  const isRareUnchecked = (key) => Boolean(rareKeys?.has(key)) && !checked.has(key);

  const toggle = (key) => {
    const next = new Set(checked);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    // Порядок галок — порядок словаря: так их пишет и сборка текста.
    const order = groups.flatMap((group) => group.items.map((entry) => entry.key));
    onChange({ ...value, checked: order.filter((itemKey) => next.has(itemKey)) });
  };

  const summary = [
    value.checked.length ? `отмечено ${value.checked.length}` : "",
    value.extra.trim() ? extraLabel.toLowerCase() : "",
  ]
    .filter(Boolean)
    .join(" · ");

  // Каждой группе — свои скрытые (редкие и не отмеченные) пункты; общий счёт — для кнопки.
  const groupsWithHidden = groups.map((group) => ({
    ...group,
    hidden: group.items.filter((entry) => isRareUnchecked(entry.key)),
  }));
  const hiddenCount = groupsWithHidden.reduce((sum, group) => sum + group.hidden.length, 0);

  return (
    <section className={classes.section}>
      <div className={classes.sectionHead}>
        <span className={classes.sectionTitle}>{title}</span>
        {summary && <span className={classes.sectionCount}>{summary}</span>}
      </div>

      {groupsWithHidden.map((group, index, arr) => (
        <div key={group.title || "all"} className={classes.group}>
          {group.title && <div className={classes.groupTitle}>{group.title}</div>}
          <div className={classes.chips}>
            {group.items
              .filter((entry) => expanded || !isRareUnchecked(entry.key))
              .map((entry) => {
                const on = checked.has(entry.key);
                return (
                  <button
                    key={entry.key}
                    type="button"
                    className={`${classes.chip} ${on ? classes.chipOn : ""}`}
                    aria-pressed={on}
                    disabled={disabled}
                    onClick={() => toggle(entry.key)}
                  >
                    {entry.label}
                  </button>
                );
              })}
            {/* Раскрытие — навигация, а не правка: доступно и без режима редактирования. */}
            {index === arr.length - 1 && hiddenCount > 0 && (
              <button
                type="button"
                className={classes.moreToggle}
                aria-expanded={expanded}
                onClick={() => setExpanded((prev) => !prev)}
              >
                {expanded ? "Свернуть" : `Ещё ${hiddenCount}`}
              </button>
            )}
          </div>
        </div>
      ))}

      <label className={classes.extra}>
        <span className={classes.extraLabel}>{extraLabel}</span>
        <textarea
          className={classes.textarea}
          rows={2}
          value={value.extra}
          placeholder={disabled ? "" : extraPlaceholder}
          disabled={disabled}
          onChange={(e) => onChange({ ...value, extra: e.target.value })}
        />
      </label>
    </section>
  );
}
