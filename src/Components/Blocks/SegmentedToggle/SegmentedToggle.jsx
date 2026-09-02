import PropTypes from "prop-types";
import classes from "./SegmentedToggle.module.css";

// Универсальный переключатель взаимоисключающих значений.
// Визуально повторяет ContractTypeToggle, вписан в поле поповера с плавающим лейблом.
// options: [{ key, label, count }]; value — текущий key; onChange(key).
// variant="toolbar" — таблетка для строки действий: без рамки поля, высотой в
// поисковое поле, сегменты по содержимому (цвета зеркалят FapModeToggle).
// Необязательный count рисуется бейджем справа от подписи — только при > 0.
function SegmentedToggle({
  options,
  value,
  onChange,
  label,
  disabled = false,
  variant = "field",
}) {
  const toolbar = variant === "toolbar";
  // Классы собираем заранее, чтобы вариант по умолчанию давал ровно ту же
  // строку className, что и до появления `variant`.
  const rootClass = toolbar ? classes.toolbarField : classes.field;
  const segmentClass = toolbar
    ? `${classes.segment} ${classes.toolbarSegment}`
    : classes.segment;

  return (
    <div className={`${rootClass} ${disabled ? classes.disabled : ""}`}>
      {label && <span className={classes.floatLabel}>{label}</span>}
      <div className={toolbar ? `${classes.toggle} ${classes.toolbarToggle}` : classes.toggle}>
        {options.map((opt) => (
          <button
            key={opt.key}
            type="button"
            className={`${segmentClass} ${value === opt.key ? classes.active : ""}`}
            onClick={() => !disabled && value !== opt.key && onChange(opt.key)}
          >
            {opt.label}
            {opt.count > 0 && <span className={classes.count}>{opt.count}</span>}
          </button>
        ))}
      </div>
    </div>
  );
}

SegmentedToggle.propTypes = {
  options: PropTypes.arrayOf(
    PropTypes.shape({
      key: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
      count: PropTypes.number,
    }),
  ).isRequired,
  value: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  label: PropTypes.string,
  disabled: PropTypes.bool,
  variant: PropTypes.oneOf(["field", "toolbar"]),
};

export default SegmentedToggle;
