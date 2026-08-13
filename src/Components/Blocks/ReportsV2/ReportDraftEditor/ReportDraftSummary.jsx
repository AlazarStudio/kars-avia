import PropTypes from "prop-types";
import Tooltip from "@mui/material/Tooltip";
import classes from "./ReportDraftSummary.module.css";
import { groupRowsByHotel } from "../reportDraftRows";
import { formatMoney, pluralizeRows } from "./reportDraftEditorUtils";

// Полоса-сводка над таблицей: по какому аэропорту, городу, гостиницам и
// договору собран отчёт. Авиакомпания сюда не входит — она в заголовке рядом
// с логотипом.
//
// Длинные значения (список гостиниц, название договора) не влезают в строку
// никогда: гостиниц в живом черновике бывает под десяток, а название договора
// это «МРВ:ДС № 3 от 30.03.2026 к договору №001 от 01.01.2024». Раньше они
// резались многоточием, а полный текст лежал в браузерном `title` — тот
// появляется через секунду, не оформлен и не умеет показывать таблицу.
// Поэтому подсказка сделана как в ФАПе: MUI Tooltip на кружке «?»
// (см. CalcHint в FapHotelPage.jsx).

// Оформление совпадает с ФАПом дословно (FapHotelPage.jsx:287-301) — это одна
// и та же сущность в системе, и выглядеть она должна одинаково.
const hintTooltipSlotProps = {
  tooltip: {
    sx: {
      bgcolor: "#fff",
      color: "#2E355D",
      border: "1px solid #E4E4EF",
      borderRadius: "12px",
      padding: "10px 12px",
      fontSize: "12px",
      maxWidth: 340,
      boxShadow: "0 10px 28px rgba(20, 30, 60, 0.14)",
    },
  },
};

function Hint({ children, placement = "bottom-start" }) {
  return (
    <Tooltip placement={placement} slotProps={hintTooltipSlotProps} title={children}>
      <span className={classes.hint} tabIndex={0}>
        ?
      </span>
    </Tooltip>
  );
}

Hint.propTypes = {
  children: PropTypes.node.isRequired,
  placement: PropTypes.string,
};

export default function ReportDraftSummary({ filterJson, rows, airports }) {
  // Суммы берём тем же способом, что и шапки групп: из готового totalDebt
  // строк, где сервер уже поделил стоимость номера между соседями.
  const hotels = groupRowsByHotel(rows);
  const hotelsTotal = hotels.reduce((acc, hotel) => acc + (hotel.total || 0), 0);

  // Аэропорт лежит в фильтре одним id — расшифровываем по уже загруженному
  // на экране справочнику, отдельный запрос ради одной строки не нужен.
  const airport = airports?.find((item) => item.id === filterJson?.airportId);
  const airportLabel = airport
    ? `${airport.code}${airport.name ? ` · ${airport.name}` : ""}`
    : filterJson?.airportId
    ? "—"
    : "все";

  return (
    <div className={classes.bar}>
      <div className={classes.item}>
        <span className={classes.label}>Аэропорт</span>
        <span className={classes.value}>{airportLabel}</span>
      </div>

      <div className={classes.item}>
        <span className={classes.label}>Город</span>
        <span className={classes.value}>{filterJson?.companyCity || "—"}</span>
      </div>

      <div className={classes.item}>
        <span className={classes.label}>
          Гостиницы
          {hotels.length > 0 && <span className={classes.count}>{hotels.length}</span>}
        </span>
        <span className={classes.value}>
          {hotels.length === 0 ? (
            "—"
          ) : (
            <>
              <span className={classes.hotelName}>{hotels[0].hotel}</span>
              {hotels.length > 1 && (
                <span className={classes.muted}>&nbsp;и ещё {hotels.length - 1}</span>
              )}
              <Hint>
                <div className={classes.hintBody}>
                  {hotels.map((hotel) => (
                    <div key={hotel.hotel} className={classes.hintRow}>
                      <span className={classes.hintName}>{hotel.hotel}</span>
                      <span className={classes.hintCount}>
                        {hotel.count} {pluralizeRows(hotel.count)}
                      </span>
                      <span className={classes.hintSum}>{formatMoney(hotel.total)} ₽</span>
                    </div>
                  ))}
                  <div className={classes.hintTotal}>
                    <span>Итого</span>
                    <span>{formatMoney(hotelsTotal)} ₽</span>
                  </div>
                </div>
              </Hint>
            </>
          )}
        </span>
      </div>

      {filterJson?.contractName && (
        <div className={classes.item}>
          <span className={classes.label}>Договор</span>
          <span className={classes.value}>
            <span className={classes.contract}>{filterJson.contractName}</span>
            <Hint placement="bottom-end">
              <div className={classes.hintContract}>{filterJson.contractName}</div>
            </Hint>
          </span>
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
