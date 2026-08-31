import PropTypes from "prop-types";
import classes from "./RoomKindSeasons.module.css";
import SeasonRowEditor from "./SeasonRowEditor.jsx";
import { generateTimestampId } from "../../../../graphQL_requests.js";

/** Пустой черновик строки сезона. Локальный: наружу компонент отдаёт только value/onChange. */
const emptySeasonDraft = () => ({
  key: generateTimestampId(),
  name: "",
  startDate: "",
  endDate: "",
  price: "",
  priceForAirline: "",
});

/**
 * Сезонные цены в форме СОЗДАНИЯ тарифа: roomKindId ещё нет, поэтому строки —
 * черновики в стейте родителя, ни query, ни мутаций, ни confirm пересчёта
 * (на новой категории заявок нет). Сохраняет их родитель после updateHotel.
 *
 * @param {Array<object>} value    черновики (см. emptySeasonDraft)
 * @param {Function} onChange      (nextValue) => void
 * @param {object} errors          ошибки по key черновика: { [key]: {field: msg} }
 * @param {boolean} showAirlinePrice
 */
function RoomKindSeasonsDraft({
  value,
  onChange,
  errors = {},
  showAirlinePrice = false,
}) {
  const handleRowChange = (key, nextForm) => {
    onChange(value.map((row) => (row.key === key ? { ...nextForm, key } : row)));
  };

  const handleRemove = (key) => {
    onChange(value.filter((row) => row.key !== key));
  };

  const handleAdd = () => {
    onChange([...value, emptySeasonDraft()]);
  };

  return (
    <div className={classes.block}>
      <div className={classes.title}>Сезонные цены</div>
      <div className={classes.hint}>
        Необязательно. Сохранятся вместе с тарифом.
      </div>

      {value.map((row) => (
        <SeasonRowEditor
          key={row.key}
          form={row}
          errors={errors[row.key] || {}}
          onChange={(next) => handleRowChange(row.key, next)}
          showAirlinePrice={showAirlinePrice}
        >
          <button
            type="button"
            className={classes.cancel}
            onClick={() => handleRemove(row.key)}
          >
            Убрать
          </button>
        </SeasonRowEditor>
      ))}

      <button type="button" className={classes.addLink} onClick={handleAdd}>
        + Добавить сезон
      </button>
    </div>
  );
}

RoomKindSeasonsDraft.propTypes = {
  value: PropTypes.array.isRequired,
  onChange: PropTypes.func.isRequired,
  errors: PropTypes.object,
  showAirlinePrice: PropTypes.bool,
};

export default RoomKindSeasonsDraft;
