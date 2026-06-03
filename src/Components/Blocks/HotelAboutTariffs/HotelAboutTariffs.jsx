// HotelAboutTariffs.jsx
import React from "react";
import classes from "./HotelAboutTariffs.module.css";

const categoryNames = {
  luxe: "Люкс",
  apartment: "Апартаменты",
  studio: "Студия",
  onePlace: "Одноместный",
  twoPlace: "Двухместный",
  threePlace: "Трехместный",
  fourPlace: "Четырехместный",
  fivePlace: "Пятиместный",
  sixPlace: "Шестиместный",
  sevenPlace: "Семиместный",
  eightPlace: "Восьмиместный",
  ninePlace: "Девятиместный",
  tenPlace: "Десятиместный",
};

const mealLabels = {
  breakfast: "Завтрак",
  lunch: "Обед",
  dinner: "Ужин",
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

const fmtVat = (n) =>
  typeof n === "number" ? fmt(Math.round(n * VAT_RATE)) : "—";

const fmtWithVat = (n) =>
  typeof n === "number" ? fmt(Math.round(n * (1 + VAT_RATE))) : "—";

const transferLabels = {
  arrival: "Аэропорт → гостиница",
  departure: "Гостиница → аэропорт",
};

export default function HotelAboutTariffs({
  user,
  tariffs = [],
  mealPrices = null,
  mealPriceForAirReq = false,
  transferPrices = null,
  transferPriceForAirReq = false,
  additionalServices,
}) {
  const hasMeals =
    mealPriceForAirReq ||
    (mealPrices &&
      ["breakfast", "lunch", "dinner"].some(
        (k) => typeof mealPrices[k] === "number"
      ));

  const hasTransfer =
    transferPriceForAirReq ||
    (transferPrices &&
      ["arrival", "departure"].some(
        (k) => typeof transferPrices[k] === "number"
      ));

  return (
    <div className={classes.tariffs}>
      <table className={classes.table}>
        <tbody>
          {hasMeals && (
            <>
              <tr className={classes.sectionRow}>
                <td>Питание</td>
                <td>Цена без НДС</td>
                <td>НДС</td>
                <td>Цена с НДС</td>
              </tr>
              {["breakfast", "lunch", "dinner"].map((k) => (
                <tr key={`meal-${k}`}>
                  <td className={classes.mealName}>{mealLabels[k]}</td>
                  {mealPriceForAirReq ? (
                    <td className={classes.price} colSpan={3}>
                      <div className={classes.byRequestValue}>По запросу</div>
                      <div className={classes.priceHint}>
                        Идёт согласование тарифов и условий размещения — точная
                        стоимость будет доступна после уточнения деталей.
                      </div>
                    </td>
                  ) : (
                    <>
                      <td className={classes.price}>{fmt(mealPrices?.[k])}</td>
                      <td className={classes.price}>5%</td>
                      <td className={classes.price}>{fmtWithVat(mealPrices?.[k])}</td>
                    </>
                  )}
                </tr>
              ))}
            </>
          )}
          {(additionalServices && additionalServices.length > 0) && (
            <>
              <tr className={classes.sectionRow}>
                <td>Дополнительные услуги</td>
                <td>Цена без НДС</td>
                <td>НДС</td>
                <td>Цена с НДС</td>
              </tr>
              {additionalServices.map((k) => (
                <tr key={k.id}>
                  <td className={classes.mealName}>{k.name}</td>
                  {k?.priceForAirReq ? (
                    <td className={classes.price} colSpan={3}>
                      <div className={classes.byRequestValue}>По запросу</div>
                      <div className={classes.priceHint}>
                        Идёт согласование тарифов и условий размещения — точная
                        стоимость будет доступна после уточнения деталей.
                      </div>
                    </td>
                  ) : (
                    <>
                      <td className={classes.price}>{fmt(k?.priceForAirline)}</td>
                      <td className={classes.price}>5%</td>
                      <td className={classes.price}>{fmtWithVat(k?.priceForAirline)}</td>
                    </>
                  )}
                </tr>
              ))}
            </>
          )}
          {hasTransfer && (
            <>
              <tr className={classes.sectionRow}>
                <td>Трансфер</td>
                <td>Цена без НДС</td>
                <td>НДС</td>
                <td>Цена с НДС</td>
              </tr>
              {["arrival", "departure"].map((k) => (
                <tr key={`transfer-${k}`}>
                  <td className={classes.mealName}>{transferLabels[k]}</td>
                  {transferPriceForAirReq ? (
                    <td className={classes.price} colSpan={3}>
                      <div className={classes.byRequestValue}>По запросу</div>
                      <div className={classes.priceHint}>
                        Идёт согласование тарифов и условий перевозки — точная
                        стоимость будет доступна после уточнения деталей.
                      </div>
                    </td>
                  ) : (
                    <>
                      <td className={classes.price}>{fmt(transferPrices?.[k])}</td>
                      <td className={classes.price}>5%</td>
                      <td className={classes.price}>{fmtWithVat(transferPrices?.[k])}</td>
                    </>
                  )}
                </tr>
              ))}
            </>
          )}
        </tbody>
      </table>
    </div>
  );
}

// import React from "react";
// import classes from "./HotelAboutTariffs.module.css";

// const categories = [
//   { key: "accommodation", label: "Проживание" },
//   { key: "meal",          label: "Питание" },
// ];

// const roomTypes = [
//   { key: "single",  label: "Одноместный" },
//   { key: "double",  label: "Двухместный" },
//   { key: "triple",  label: "Трехместный" },
// ];

// export default function HotelAboutTariffs({ tariffs }) {

//   return (
//     <div className={classes.tariffs}>
//       <table className={classes.table}>
//         <thead>
//           <tr>
//             <th>Категория</th>
//             <th>Квота</th>
//             <th>Резерв</th>
//           </tr>
//         </thead>
//         <tbody>
//           {categories.map(({ key, label }) => (
//             <React.Fragment key={key}>
//               <tr className={classes.categoryRow}>
//                 <td colSpan="3">{label}</td>
//               </tr>
//               {roomTypes.map(({ key: rtKey, label: rtLabel }) => {
//                 const { quota = "-", reserve = "-" } =
//                   tariffs[key]?.[rtKey] || {};
//                 return (
//                   <tr key={`${key}-${rtKey}`}>
//                     <td className={classes.roomType}>{rtLabel}</td>
//                     <td>{quota}</td>
//                     <td>{reserve}</td>
//                   </tr>
//                 );
//               })}
//             </React.Fragment>
//           ))}
//         </tbody>
//       </table>
//     </div>
//   );
// }

// import React from "react";
// import classes from "./HotelAboutTariffs.module.css";

// const categories = [
//   { key: "accommodation", label: "Проживание" },
//   { key: "meal",          label: "Питание" },
// ];

// const roomTypes = [
//   { key: "single",  label: "Одноместный" },
//   { key: "double",  label: "Двухместный" },
//   { key: "triple",  label: "Трехместный" },
// ];

// export default function HotelAboutTariffs({ tariffs }) {
//   // Ожидаем структуру:
//   // tariffs = {
//   //   accommodation: { single: { quota, reserve }, … },
//   //   meal:          { single: { quota, reserve }, … },
//   // }
//   return (
//     <div className={classes.container}>
//       {/* Заголовки колонок */}
//       <div className={classes.headerRow}>
//         <div className={classes.headerCell}>Категория</div>
//         <div className={classes.headerCell}>Квота</div>
//         <div className={classes.headerCell}>Резерв</div>
//       </div>

//       {categories.map(({ key, label }) => (
//         <div key={key} className={classes.categoryBlock}>
//           {/* Надпись-категория */}
//           <div className={classes.categoryLabel}>{label}</div>

//           {roomTypes.map(({ key: rtKey, label: rtLabel }) => {
//             const { quota = "-", reserve = "-" } =
//               tariffs[key]?.[rtKey] || {};
//             return (
//               <div key={rtKey} className={classes.row}>
//                 <div className={classes.cell + " " + classes.roomType}>
//                   {rtLabel}
//                 </div>
//                 <div className={classes.cell}>{quota}</div>
//                 <div className={classes.cell}>{reserve}</div>
//               </div>
//             );
//           })}
//         </div>
//       ))}
//     </div>
//   );
// }
