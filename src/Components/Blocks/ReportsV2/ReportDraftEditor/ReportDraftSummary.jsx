import PropTypes from "prop-types";
import classes from "./ReportDraftSummary.module.css";
import { summarizeHotels } from "../reportDraftRows";
import { pluralizeRows } from "./reportDraftEditorUtils";

// Шапка черновика: по какой авиакомпании, аэропорту и каким гостиницам собран
// отчёт. Без неё из таблицы не ответить на вопрос «какие вообще гостиницы тут
// и какой аэропорт» — отчёт по авиакомпании собирается по всем гостиницам
// аэропорта сразу, и в живом черновике их бывает под десяток.
export default function ReportDraftSummary({ filterJson, rows, airports }) {
  const hotels = summarizeHotels(rows);

  // Аэропорт лежит в фильтре одним id — расшифровываем по уже загруженному
  // на экране справочнику, отдельный запрос ради одной строки не нужен.
  const airport = airports?.find((item) => item.id === filterJson?.airportId);
  const airportLabel = airport
    ? `${airport.code}${airport.name ? ` · ${airport.name}` : ""}`
    : filterJson?.airportId
    ? "—"
    : "все";

  const hotelsTitle = hotels
    .map((hotel) => `${hotel.name} — ${hotel.count} ${pluralizeRows(hotel.count)}`)
    .join("\n");

  return (
    <div className={classes.bar}>
      <div className={classes.item}>
        <span className={classes.label}>Авиакомпания</span>
        <span className={classes.value}>{filterJson?.companyName || "—"}</span>
      </div>

      <div className={classes.item}>
        <span className={classes.label}>Аэропорт</span>
        <span className={classes.value}>{airportLabel}</span>
      </div>

      <div className={classes.item}>
        <span className={classes.label}>Город</span>
        <span className={classes.value}>{filterJson?.companyCity || "—"}</span>
      </div>

      <div className={`${classes.item} ${classes.itemWide}`} title={hotelsTitle || undefined}>
        <span className={classes.label}>
          Гостиницы {hotels.length > 0 && <span className={classes.count}>{hotels.length}</span>}
        </span>
        <span className={classes.value}>
          {hotels.length > 0 ? hotels.map((hotel) => hotel.name).join(", ") : "—"}
        </span>
      </div>

      {filterJson?.contractName && (
        <div className={`${classes.item} ${classes.itemWide}`} title={filterJson.contractName}>
          <span className={classes.label}>Договор</span>
          <span className={classes.value}>{filterJson.contractName}</span>
        </div>
      )}
    </div>
  );
}

ReportDraftSummary.propTypes = {
  filterJson: PropTypes.object,
  rows: PropTypes.array,
  airports: PropTypes.array,
};
