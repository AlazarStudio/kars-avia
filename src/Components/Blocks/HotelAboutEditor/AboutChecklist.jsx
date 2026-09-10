import classes from "./HotelAboutEditor.module.css";

// Раздел описания: галки-чипы по группам и поле для всего, что в словарь не попало.
export default function AboutChecklist({
  title,
  groups,
  value,
  extraLabel,
  extraPlaceholder,
  disabled,
  onChange,
}) {
  const checked = new Set(value.checked);

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

  return (
    <section className={classes.section}>
      <div className={classes.sectionHead}>
        <span className={classes.sectionTitle}>{title}</span>
        {summary && <span className={classes.sectionCount}>{summary}</span>}
      </div>

      {groups.map((group) => (
        <div key={group.title || "all"} className={classes.group}>
          {group.title && <div className={classes.groupTitle}>{group.title}</div>}
          <div className={classes.chips}>
            {group.items.map((entry) => {
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
