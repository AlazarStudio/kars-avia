import PropTypes from "prop-types";
import classes from "./ContractTypeToggle.module.css";

/** Значения по умолчанию — тип договора авиакомпании (по аэропортам / по географии). */
const DEFAULT_OPTIONS = [
  { key: "individual", label: "Индивидуальный" },
  { key: "shared", label: "Общий" },
];

/**
 * Сегментный переключатель взаимоисключающих значений.
 * Без пропа `options` — прежний переключатель типа договора
 * ("individual" — по аэропортам, "shared" — по регионам/городам).
 */
function ContractTypeToggle({ value, onChange, disabled = false, options }) {
  const items = options && options.length > 0 ? options : DEFAULT_OPTIONS;

  return (
    <div className={`${classes.toggle} ${disabled ? classes.disabled : ""}`}>
      {items.map((opt) => (
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
  );
}

ContractTypeToggle.propTypes = {
  value: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  disabled: PropTypes.bool,
  options: PropTypes.arrayOf(
    PropTypes.shape({
      key: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
    }),
  ),
};

export default ContractTypeToggle;
