import PropTypes from "prop-types";
import classes from "./RoomKindSeasons.module.css";

/**
 * Поля одной строки сезона (инлайн-редактор). Чистый UI без данных: значения и
 * ошибки приходят пропсами, действия (кнопки) — слотом children, чтобы live- и
 * draft-режимы вешали свои.
 *
 * onChange получает ЦЕЛИКОМ следующий объект формы: правило «окончание не может
 * быть раньше начала» (сброс endDate) живёт здесь, чтобы оба режима вели себя
 * одинаково.
 */
function SeasonRowEditor({
  form,
  errors = {},
  onChange,
  showAirlinePrice = false,
  children,
}) {
  const handleField = (e) => {
    const { name, value } = e.target;
    const next = { ...form, [name]: value };
    if (name === "startDate" && next.endDate && next.endDate < value) {
      next.endDate = "";
    }
    onChange(next);
  };

  return (
    <div className={classes.editor}>
      <div className={classes.fieldRow}>
        <label className={classes.field}>
          <span className={`${classes.fieldTitle} ${classes.required}`}>Начало</span>
          <input
            type="date"
            name="startDate"
            value={form.startDate}
            onChange={handleField}
          />
          {errors.startDate && (
            <span className={classes.fieldError}>{errors.startDate}</span>
          )}
        </label>
        <label className={classes.field}>
          <span className={`${classes.fieldTitle} ${classes.required}`}>Окончание</span>
          <input
            type="date"
            name="endDate"
            min={form.startDate}
            value={form.endDate}
            onChange={handleField}
          />
          {errors.endDate && (
            <span className={classes.fieldError}>{errors.endDate}</span>
          )}
        </label>
      </div>

      <div className={classes.fieldRow}>
        <label className={classes.field}>
          <span className={`${classes.fieldTitle} ${classes.required}`}>Цена по договору</span>
          <input
            type="number"
            name="price"
            value={form.price}
            onChange={handleField}
            placeholder="Введите стоимость"
          />
          {errors.price && (
            <span className={classes.fieldError}>{errors.price}</span>
          )}
        </label>
        {showAirlinePrice && (
          <label className={classes.field}>
            <span className={classes.fieldTitle}>Цена для АК</span>
            <input
              type="number"
              name="priceForAirline"
              value={form.priceForAirline}
              onChange={handleField}
              placeholder="Необязательно"
            />
            {errors.priceForAirline && (
              <span className={classes.fieldError}>{errors.priceForAirline}</span>
            )}
          </label>
        )}
      </div>

      <label className={classes.field}>
        <span className={classes.fieldTitle}>Название</span>
        <input
          type="text"
          name="name"
          value={form.name}
          onChange={handleField}
          placeholder="Например: Высокий сезон"
        />
      </label>

      <div className={classes.editorActions}>{children}</div>
    </div>
  );
}

SeasonRowEditor.propTypes = {
  form: PropTypes.shape({
    name: PropTypes.string,
    startDate: PropTypes.string,
    endDate: PropTypes.string,
    price: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    priceForAirline: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  }).isRequired,
  errors: PropTypes.object,
  onChange: PropTypes.func.isRequired,
  showAirlinePrice: PropTypes.bool,
  children: PropTypes.node,
};

export default SeasonRowEditor;
