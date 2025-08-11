import React from "react";
import classes from "./HotelAboutTariffs.module.css";

const categories = [
  { key: "accommodation", label: "Проживание" },
  { key: "meal",          label: "Питание" },
];

const roomTypes = [
  { key: "single",  label: "Одноместный" },
  { key: "double",  label: "Двухместный" },
  { key: "triple",  label: "Трехместный" },
];

export default function HotelAboutTariffs({ tariffs }) {
  // tariffs should be an object like:
  // {
  //   accommodation: { single: { quota: 10, reserve: 2 }, … },
  //   meal:          { single: { quota: 10, reserve: 2 }, … },
  // }
  return (
    <div className={classes.tariffs}>
      <table className={classes.table}>
        <thead>
          <tr>
            <th>Категория</th>
            <th>Квота</th>
            <th>Резерв</th>
          </tr>
        </thead>
        <tbody>
          {categories.map(({ key, label }) => (
            <React.Fragment key={key}>
              <tr className={classes.categoryRow}>
                <td colSpan="3">{label}</td>
              </tr>
              {roomTypes.map(({ key: rtKey, label: rtLabel }) => {
                const { quota = "-", reserve = "-" } =
                  tariffs[key]?.[rtKey] || {};
                return (
                  <tr key={`${key}-${rtKey}`}>
                    <td className={classes.roomType}>{rtLabel}</td>
                    <td>{quota}</td>
                    <td>{reserve}</td>
                  </tr>
                );
              })}
            </React.Fragment>
          ))}
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

