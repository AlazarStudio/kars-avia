import PropTypes from "prop-types";
import classes from "./ReportDraftEmptyState.module.css";
import { DocIcon, SearchIcon } from "../ReportsV2Icons";

// Два пустых состояния таблицы черновика: в черновике вообще нет строк
// (нечего выгружать) и — отдельно — фильтр/поиск не нашли ничего среди
// имеющихся строк (данные есть, просто не показаны).
export default function ReportDraftEmptyState({ variant, onResetFilters }) {
  if (variant === "no-match") {
    return (
      <div className={classes.wrap}>
        <div className={classes.icon}>
          <SearchIcon size={30} />
        </div>
        <div className={classes.title}>Под фильтр ничего не попало</div>
        <div className={classes.text}>Ни одна строка не подходит под текущий фильтр и поиск.</div>
        <button type="button" className={classes.resetBtn} onClick={onResetFilters}>
          Сбросить фильтры
        </button>
      </div>
    );
  }

  return (
    <div className={classes.wrap}>
      <div className={classes.icon}>
        <DocIcon size={34} />
      </div>
      <div className={classes.title}>В черновике нет строк</div>
      <div className={classes.text}>
        За выбранный период по этой организации нет заявок с проживанием. Измените период или
        пересоздайте черновик — выгрузка при нуле строк недоступна.
      </div>
    </div>
  );
}

ReportDraftEmptyState.propTypes = {
  variant: PropTypes.oneOf(["no-rows", "no-match"]).isRequired,
  onResetFilters: PropTypes.func,
};
