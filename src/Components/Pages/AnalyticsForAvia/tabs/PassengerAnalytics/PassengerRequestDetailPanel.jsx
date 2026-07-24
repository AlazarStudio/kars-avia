import classes from "./PassengerAnalytics.module.css";
import {
  formatRub,
  formatInt,
  formatNights,
  formatMoneyShort,
} from "./passengerAnalyticsMappers";

const num = (v) => Number(v) || 0;
const joinParts = (parts) => parts.filter(Boolean).join(" · ");

// Раскрывашка заявки: цветные стат-плитки + чипы. Показывается только ненулевое.
function PassengerRequestDetailPanel({ r }) {
  const adults = num(r.adultsCount);
  const children = num(r.childrenCount);
  const infants = num(r.infantsCount);
  const mealsCount =
    num(r.breakfastsCount) + num(r.lunchesCount) + num(r.dinnersCount) + num(r.lunchboxesCount);
  const transferSplit =
    num(r.transferArrival) + num(r.transferDeparture) + num(r.transferBaggage) + num(r.transferIntercity);

  const tiles = [];
  if (r.costMissing) {
    tiles.push({
      key: "missing",
      variant: classes.tileMissing,
      label: "Стоимость",
      value: "Нет отчёта",
      sub: "появится после отчёта гостиницы",
    });
  } else {
    if (num(r.living) > 0 || num(r.roomNights) > 0) {
      tiles.push({
        key: "living",
        variant: classes.tileLiving,
        label: "Проживание",
        value: formatRub(r.living),
        sub: joinParts([
          num(r.roomNights) > 0 && `${formatNights(r.roomNights)} сут`,
          num(r.avgPricePerNight) > 0 && `ср. ${formatRub(r.avgPricePerNight)}/сут`,
        ]),
      });
    }
    if (num(r.meal) > 0 || mealsCount > 0) {
      tiles.push({
        key: "meal",
        variant: classes.tileMeal,
        label: "Питание",
        value: formatRub(r.meal),
        sub: joinParts([
          num(r.breakfastsCount) + num(r.lunchesCount) + num(r.dinnersCount) > 0 &&
            `З/О/У ${formatInt(r.breakfastsCount)}/${formatInt(r.lunchesCount)}/${formatInt(r.dinnersCount)}`,
          num(r.lunchboxesCount) > 0 && `ЛБ ${formatInt(r.lunchboxesCount)}`,
        ]),
      });
    }
    if (num(r.transfer) > 0 || transferSplit > 0) {
      tiles.push({
        key: "transfer",
        variant: classes.tileTransfer,
        label: "Трансфер",
        value: formatRub(r.transfer),
        sub: joinParts([
          num(r.transferArrival) > 0 && `прилёт ${formatMoneyShort(r.transferArrival)}`,
          num(r.transferDeparture) > 0 && `вылет ${formatMoneyShort(r.transferDeparture)}`,
          num(r.transferBaggage) > 0 && `багаж ${formatMoneyShort(r.transferBaggage)}`,
          num(r.transferIntercity) > 0 && `межгород ${formatMoneyShort(r.transferIntercity)}`,
        ]),
      });
    }
  }
  if (num(r.peopleCount) > 0 || adults + children + infants > 0) {
    tiles.push({
      key: "people",
      variant: classes.tilePeople,
      label: "Люди",
      value: formatInt(r.peopleCount),
      sub: joinParts([
        `${formatInt(adults)} взр · ${formatInt(children)} дет · ${formatInt(infants)} млад`,
        num(r.crewCount) > 0 && `экипаж ${formatInt(r.crewCount)}`,
      ]),
    });
  }

  const chips = [];
  (r.hotels || []).forEach((h, i) => {
    chips.push(
      h.reportSaved
        ? {
            key: `hotel-${i}`,
            variant: classes.chipGreen,
            text: `${h.hotelName || "—"} · ${formatInt(h.peopleCount)} чел · ${formatNights(h.roomNights)} сут`,
          }
        : { key: `hotel-${i}`, variant: classes.chipAmber, text: `${h.hotelName || "—"} · нет отчёта` }
    );
  });
  if (num(r.waterPlanned) > 0 || num(r.waterServed) > 0) {
    chips.push({
      key: "water",
      variant: classes.chipBlue,
      text: `Вода ${formatInt(r.waterPlanned)}/${formatInt(r.waterServed)}`,
    });
  }
  if (num(r.mealServicePlanned) > 0 || num(r.mealServiceServed) > 0) {
    chips.push({
      key: "mealService",
      variant: classes.chipAmber,
      text: `Раздача ${formatInt(r.mealServicePlanned)}/${formatInt(r.mealServiceServed)}`,
    });
  }
  if (num(r.groupsCount) > 0) {
    chips.push({
      key: "groups",
      variant: classes.chipGreen,
      text: `Группы: ${formatInt(r.groupsCount)} гр · ${formatInt(r.linkedPeopleCount)} чел`,
    });
  }

  if (tiles.length === 0 && chips.length === 0) {
    return (
      <div className={classes.panelWrap}>
        <div className={classes.detailMuted}>Нет данных по услугам</div>
      </div>
    );
  }

  return (
    <div className={classes.panelWrap}>
      {tiles.length > 0 && (
        <div className={classes.tilesRow}>
          {tiles.map((t) => (
            <div key={t.key} className={`${classes.tile} ${t.variant}`}>
              <span className={classes.tileLabel}>{t.label}</span>
              <span className={classes.tileValue}>{t.value}</span>
              {t.sub ? <span className={classes.tileSub}>{t.sub}</span> : null}
            </div>
          ))}
        </div>
      )}
      {chips.length > 0 && (
        <div className={classes.chipsRow}>
          {chips.map((c) => (
            <span key={c.key} className={`${classes.chip} ${c.variant}`}>
              {c.text}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

export default PassengerRequestDetailPanel;
