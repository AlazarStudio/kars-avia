// HotelAboutTariffs.jsx
import classes from "./HotelAboutTariffs.module.css";

const mealLabels = {
  breakfast: "Завтрак",
  lunch: "Обед",
  dinner: "Ужин",
};

const transferLabels = {
  arrival: "Аэропорт → гостиница",
  departure: "Гостиница → аэропорт",
};

const VAT_RATE = 0.05;

const fmt = (n) =>
  typeof n === "number"
    ? new Intl.NumberFormat("ru-RU", {
        style: "currency",
        currency: "RUB",
        maximumFractionDigits: 0,
      }).format(n)
    : "—";

const fmtWithVat = (n) =>
  typeof n === "number" ? fmt(Math.round(n * (1 + VAT_RATE))) : "—";

const declension = (number, forms) => {
  const n = Math.abs(Number(number));
  const opts = [2, 0, 1, 1, 1, 2];
  return forms[
    n % 100 > 4 && n % 100 < 20 ? 2 : opts[n % 10 < 5 ? n % 10 : 5]
  ];
};

function TariffSection({ title, items, hotelSide = false }) {
  if (!items.length) return null;
  return (
    <section className={classes.section}>
      <div className={classes.sectionHead}>
        <h3 className={classes.sectionTitle}>{title}</h3>
        <span className={classes.sectionCount}>
          {items.length} {declension(items.length, ["позиция", "позиции", "позиций"])}
        </span>
      </div>
      <table className={classes.table}>
        <colgroup>
          <col className={classes.colName} />
          {hotelSide ? (
            <col className={classes.colGross} />
          ) : (
            <>
              <col className={classes.colNet} />
              <col className={classes.colVat} />
              <col className={classes.colGross} />
            </>
          )}
        </colgroup>
        <thead>
          <tr>
            <th>Наименование</th>
            {hotelSide ? (
              <th className={classes.num}>Цена</th>
            ) : (
              <>
                <th className={classes.num}>Цена без НДС</th>
                <th className={classes.num}>НДС</th>
                <th className={classes.num}>Цена с НДС</th>
              </>
            )}
          </tr>
        </thead>
        <tbody>
          {items.map((item, i) => (
            <tr key={i}>
              <td className={classes.name}>{item.name}</td>
              {hotelSide ? (
                <td className={`${classes.num} ${classes.gross}`}>
                  {fmt(item.net)}
                </td>
              ) : item.byReq ? (
                <td className={classes.byRequest} colSpan={3}>
                  <span className={classes.byRequestValue}>По запросу</span>
                  <span className={classes.priceHint}>
                    Идёт согласование тарифов и условий — точная стоимость будет
                    доступна после уточнения деталей.
                  </span>
                </td>
              ) : (
                <>
                  <td className={classes.num}>{fmt(item.net)}</td>
                  <td className={classes.num}>5%</td>
                  <td className={`${classes.num} ${classes.gross}`}>
                    {fmtWithVat(item.net)}
                  </td>
                </>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

export default function HotelAboutTariffs({
  mealPrices = null,
  mealPriceForAirReq = false,
  transferPrices = null,
  transferPriceForAirReq = false,
  additionalServices,
  // Гостиница смотрит свои цены: без разбивки по НДС и без «по запросу» —
  // это логика счёта для авиакомпании.
  hotelSide = false,
}) {
  const mealKeys = ["breakfast", "lunch", "dinner"];
  const transferKeys = ["arrival", "departure"];

  const hasMeals =
    mealPriceForAirReq ||
    (mealPrices && mealKeys.some((k) => typeof mealPrices[k] === "number"));

  const hasTransfer =
    transferPriceForAirReq ||
    (transferPrices &&
      transferKeys.some((k) => typeof transferPrices[k] === "number"));

  const extras = Array.isArray(additionalServices) ? additionalServices : [];

  const mealItems = hasMeals
    ? mealKeys.map((k) => ({
        name: mealLabels[k],
        net: mealPrices?.[k],
        byReq: mealPriceForAirReq,
      }))
    : [];

  const extraItems = extras.map((s) => ({
    name: s.name,
    net: hotelSide ? s.price : s.priceForAirline,
    byReq: hotelSide ? false : s.priceForAirReq,
  }));

  const transferItems = hasTransfer
    ? transferKeys.map((k) => ({
        name: transferLabels[k],
        net: transferPrices?.[k],
        byReq: transferPriceForAirReq,
      }))
    : [];

  const empty =
    !mealItems.length && !extraItems.length && !transferItems.length;

  if (empty) {
    return <div className={classes.empty}>Нет тарифов</div>;
  }

  return (
    <div className={classes.tariffs}>
      <TariffSection title="Питание" items={mealItems} hotelSide={hotelSide} />
      <TariffSection
        title="Дополнительные услуги"
        items={extraItems}
        hotelSide={hotelSide}
      />
      <TariffSection title="Трансфер" items={transferItems} hotelSide={hotelSide} />
    </div>
  );
}
