import PropTypes from "prop-types";
import classes from "./SegmentedToggle.module.css";

// Универсальный переключатель взаимоисключающих значений.
// Визуально повторяет ContractTypeToggle, вписан в поле поповера с плавающим лейблом.
// options: [{ key, label }]; value — текущий key; onChange(key).
function SegmentedToggle({ options, value, onChange, label, disabled = false }) {
  return (
    <div className={`${classes.field} ${disabled ? classes.disabled : ""}`}>
      {label && <span className={classes.floatLabel}>{label}</span>}
      <div className={classes.toggle}>
        {options.map((opt) => (
          <button
            key={opt.key}
            type="button"
            className={`${classes.segment} ${value === opt.key ? classes.active : ""}`}
            onClick={() => !disabled && value !== opt.key && onChange(opt.key)}
          >
            {opt.label}
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
    }),
  ).isRequired,
  value: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  label: PropTypes.string,
  disabled: PropTypes.bool,
};

export default SegmentedToggle;
