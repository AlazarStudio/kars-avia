import PropTypes from "prop-types";
import classes from "./HotelStatusBadge.module.css";

// Статус-пилюля для строки списка гостиниц.
// Приоритет: неактивна > скрыта. Активна и видима — ничего не рендерим.
function HotelStatusBadge({ hotel }) {
  if (hotel?.active === false) {
    return (
      <span className={`${classes.badge} ${classes.red}`}>
        <span className={classes.dot} />
        Неактивна
      </span>
    );
  }
  if (hotel?.show === false) {
    return (
      <span className={`${classes.badge} ${classes.amber}`}>
        <span className={classes.dot} />
        Скрыта
      </span>
    );
  }
  return null;
}

HotelStatusBadge.propTypes = {
  hotel: PropTypes.shape({
    active: PropTypes.bool,
    show: PropTypes.bool,
  }),
};

export default HotelStatusBadge;
