import PropTypes from "prop-types";
import classes from "./ContractTypeToggle.module.css";

/**
 * Переключатель типа договора авиакомпании:
 *   "individual" — по аэропортам, "shared" — по регионам/городам.
 * Взаимоисключающие: договор либо один, либо другой.
 */
function ContractTypeToggle({ value, onChange, disabled = false }) {
  const options = [
    { key: "individual", label: "Индивидуальный" },
    { key: "shared", label: "Общий" },
  ];

  return (
    <div className={`${classes.toggle} ${disabled ? classes.disabled : ""}`}>
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
  );
}

ContractTypeToggle.propTypes = {
  value: PropTypes.oneOf(["individual", "shared"]).isRequired,
  onChange: PropTypes.func.isRequired,
  disabled: PropTypes.bool,
};

export default ContractTypeToggle;
