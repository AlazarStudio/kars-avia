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

const fmt = (n) =>
  typeof n === "number"
    ? new Intl.NumberFormat("ru-RU", {
        style: "currency",
        currency: "RUB",
        maximumFractionDigits: 0,
      }).format(n)
    : "—";

export default function HotelAboutTariffs({user, tariffs = [], mealPrices = null, additionalServices }) {
  const hasMeals =
    mealPrices &&
    ["breakfast", "lunch", "dinner"].some(
      (k) => typeof mealPrices[k] === "number"
    );
    // console.log(mealPrices);

    // console.log(additionalServices)
    

  return (
    <div className={classes.tariffs}>
      <table className={classes.table}>
        {/* <thead>
          <tr>
            <th>Тарифы</th>
            <th className={classes.priceCol}>Цены</th>
          </tr>
        </thead> */}
        <tbody>
          {/* {tariffs.map((t) => {
            const price = t.priceForAirline ?? t.price ?? null;
            return (
              <tr key={t.id}>
                <td>
                  <div className={classes.name}>{t.name}</div>
                  <div className={classes.category}>
                    {categoryNames[t.category] ?? t.category}
                  </div>
                </td>
                <td className={classes.price}>{fmt(price)}</td>
              </tr>
            );
          })} */}

          {hasMeals && (
            <>
              <tr className={classes.sectionRow}>
                <td>Питание</td>
                <td>Цены</td>
              </tr>
              {["breakfast", "lunch", "dinner"].map((k) => (
                <tr key={`meal-${k}`}>
                  <td className={classes.mealName}>{mealLabels[k]}</td>
                  <td className={classes.price}>{fmt(mealPrices[k])}</td>
                </tr>
              ))}
            </>
          )}
          {(additionalServices && additionalServices.length > 0) && (
            <>
              <tr className={classes.sectionRow}>
                <td>Дополнительные услуги</td>
                <td>Цены</td>
              </tr>
              {additionalServices.map((k) => (
                <tr key={k.id}>
                  <td className={classes.mealName}>{k.name}</td>
                  <td className={classes.price}>{fmt(k?.priceForAirline)}</td>
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
