// import React from "react";
// import { DateRange } from "react-date-range";
// import {
//   addDays,
//   startOfMonth,
//   endOfMonth,
//   subMonths,
//   startOfQuarter,
//   endOfQuarter,
//   subQuarters,
//   startOfYear,
//   endOfYear,
//   subYears,
// } from "date-fns";
// import ru from "date-fns/locale/ru";
// import "react-date-range/dist/styles.css";
// import "react-date-range/dist/theme/default.css";

// function DateRangePickerCustom({ onChange, onClose, value }) {
//   // дефолт (последние 7 дней), либо внешнее value
//   const defaultSelection =
//     value || { startDate: addDays(new Date(), -7), endDate: new Date(), key: "selection" };

//   const [range, setRange] = React.useState([defaultSelection]);
//   const [active, setActive] = React.useState("custom");

//   // пресеты слева
//   const presets = [
//     {
//       key: "custom",
//       label: "Задать свой",
//       get: () => ({ startDate: defaultSelection.startDate, endDate: defaultSelection.endDate }),
//     },
//     {
//       key: "last7",
//       label: "Последние 7 дней",
//       get: () => ({ startDate: addDays(new Date(), -7), endDate: new Date() }),
//     },
//     {
//       key: "last30",
//       label: "Последние 30 дней",
//       get: () => ({ startDate: addDays(new Date(), -30), endDate: new Date() }),
//     },
//     {
//       key: "thisMonth",
//       label: "Текущий месяц",
//       get: () => ({ startDate: startOfMonth(new Date()), endDate: endOfMonth(new Date()) }),
//     },
//     {
//       key: "prevMonth",
//       label: "Прошлый месяц",
//       get: () => {
//         const d = subMonths(new Date(), 1);
//         return { startDate: startOfMonth(d), endDate: endOfMonth(d) };
//       },
//     },
//     {
//       key: "thisQuarter",
//       label: "Текущий квартал",
//       get: () => ({ startDate: startOfQuarter(new Date()), endDate: endOfQuarter(new Date()) }),
//     },
//     {
//       key: "prevQuarter",
//       label: "Прошлый квартал",
//       get: () => {
//         const d = subQuarters(new Date(), 1);
//         return { startDate: startOfQuarter(d), endDate: endOfQuarter(d) };
//       },
//     },
//     {
//       key: "thisYear",
//       label: "Текущий год",
//       get: () => ({ startDate: startOfYear(new Date()), endDate: endOfYear(new Date()) }),
//     },
//     {
//       key: "prevYear",
//       label: "Прошлый год",
//       get: () => {
//         const d = subYears(new Date(), 1);
//         return { startDate: startOfYear(d), endDate: endOfYear(d) };
//       },
//     },
//   ];

//   const applyPreset = (pKey) => {
//     const { startDate, endDate } = presets.find((p) => p.key === pKey).get();
//     setActive(pKey);
//     setRange([{ startDate, endDate, key: "selection" }]);
//   };

//   // стили (как в твоём примере)
//   const overlayStyles = {
//     position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)",
//     display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1000,
//   };
//   const modalStyles = {
//     background: "#fff", borderRadius: 12, padding: 0, boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
//     position: "relative", display: "flex", overflow: "hidden",
//   };
//   const sidebarStyles = { width: 240, padding: 16, borderRight: "1px solid #E5E7EB" };
//   const itemStyles = (isActive) => ({
//     padding: "10px 12px", borderRadius: 8, cursor: "pointer", userSelect: "none",
//     background: isActive ? "#F3F4F6" : "transparent", fontWeight: isActive ? 600 : 400, marginBottom: 4,
//   });
//   const calendarWrapStyles = { padding: 16 };
//   const footerStyles = { display: "flex", justifyContent: "flex-end", gap: 10, padding: 16, borderTop: "1px solid #E5E7EB" };
//   const btnBase = { padding: "8px 16px", border: "none", borderRadius: 8, fontSize: 14, cursor: "pointer" };

//   return (
//     <div style={overlayStyles} onClick={onClose}>
//       <div style={modalStyles} onClick={(e) => e.stopPropagation()}>
//         {/* Левая колонка пресетов */}
//         <div style={sidebarStyles}>
//           {presets.map((p) => (
//             <div key={p.key} style={itemStyles(active === p.key)} onClick={() => applyPreset(p.key)}>
//               {p.label}
//             </div>
//           ))}
//         </div>

//         {/* Календарь + футер */}
//         <div style={{ display: "flex", flexDirection: "column" }}>
//           <div style={calendarWrapStyles}>
//             <DateRange
//               editableDateInputs
//               onChange={(item) => {
//                 setActive("custom");           // ручная правка => "Задать свой"
//                 setRange([item.selection]);
//               }}
//               moveRangeOnFirstSelection={false}
//               ranges={range}
//               locale={ru}
//               months={2}
//               direction="horizontal"
//             />
//           </div>

//           <div style={footerStyles}>
//             <button style={{ ...btnBase, backgroundColor: "#E5E7EB", color: "#111827" }} onClick={onClose}>
//               Отменить
//             </button>
//             <button
//               style={{ ...btnBase, backgroundColor: "#1d4ed8", color: "#fff" }}
//               onClick={() => onChange(range[0])}
//             >
//               Применить
//             </button>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }

// export default DateRangePickerCustom;


import React from "react";
import { DateRangePicker } from "react-date-range";
import {
  addDays,
  startOfMonth, endOfMonth, subMonths,
  startOfQuarter, endOfQuarter, subQuarters,
  startOfYear, endOfYear, subYears,
  isSameDay,
} from "date-fns";
import ru from "date-fns/locale/ru";
import "react-date-range/dist/styles.css";
import "react-date-range/dist/theme/default.css";
import Button from "../../Standart/Button/Button";

function DateRangePickerCustom({ onChange, onClose, value }) {
    // меняй 7 на 6, если нужно
  const LAST_N_DAYS = 7;

  // хелпер: последние N дней ТЕКУЩЕГО МЕСЯЦА (конец = конец месяца, старт ограничен началом месяца)
  const lastNDaysUpToToday = (n) => {
    const end = new Date();                // сегодня
    const start = addDays(end, -(n - 1));  // N-1 дней назад
    return { startDate: start, endDate: end };
  };
  
  // дефолт = последние 7 дней (или внешнее value)
  const defaultSelection =
    value || { startDate: addDays(new Date(), -7), endDate: new Date(), key: "selection" };

  const [range, setRange] = React.useState([defaultSelection]);

  // хелпер для своих статик-пресетов (подсветка активного варианта)
  const makeStatic = (label, getter) => ({
    label,
    range: () => {
      const { startDate, endDate } = getter();
      return { startDate, endDate };
    },
    isSelected: (r) => {
      const { startDate, endDate } = getter();
      return r && isSameDay(r.startDate, startDate) && isSameDay(r.endDate, endDate);
    },
  });

  const staticRanges = [
    makeStatic("Задать свой", () => lastNDaysUpToToday(LAST_N_DAYS)),

    // makeStatic("Задать свой", () => ({
    //   startDate: defaultSelection.startDate,
    //   endDate: defaultSelection.endDate,
    // })),
    makeStatic("Последние 7 дней", () => ({
      startDate: addDays(new Date(), -7),
      endDate: new Date(),
    })),
    makeStatic("Последние 30 дней", () => ({
      startDate: addDays(new Date(), -30),
      endDate: new Date(),
    })),
    makeStatic("Текущий месяц", () => ({
      startDate: startOfMonth(new Date()),
      endDate: endOfMonth(new Date()),
    })),
    makeStatic("Прошлый месяц", () => {
      const d = subMonths(new Date(), 1);
      return { startDate: startOfMonth(d), endDate: endOfMonth(d) };
    }),
    makeStatic("Текущий квартал", () => ({
      startDate: startOfQuarter(new Date()),
      endDate: endOfQuarter(new Date()),
    })),
    makeStatic("Прошлый квартал", () => {
      const d = subQuarters(new Date(), 1);
      return { startDate: startOfQuarter(d), endDate: endOfQuarter(d) };
    }),
    makeStatic("Текущий год", () => ({
      startDate: startOfYear(new Date()),
      endDate: endOfYear(new Date()),
    })),
    makeStatic("Прошлый год", () => {
      const d = subYears(new Date(), 1);
      return { startDate: startOfYear(d), endDate: endOfYear(d) };
    }),
  ];

  // стили твоей модалки
  const overlayStyles = {
    position: "fixed",
    inset: 0,
    background: "rgba(0, 0, 0, 0.4)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  };
  const modalStyles = {
    background: "#fff",
    borderRadius: "12px",
    padding: "20px",
    boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
    position: "relative",
  };
  const footerStyles = {
    display: "flex",
    justifyContent: "flex-end",
    marginTop: "10px",
    gap: "10px",
  };
  const buttonStyles = {
    padding: "0 30px",
    border: "none",
    borderRadius: "10px",
    fontSize: "14px",
    cursor: "pointer",
  };
  const applyButtonStyles = { ...buttonStyles, backgroundColor: "#1d4ed8", color: "#fff" };
  const cancelButtonStyles = { ...buttonStyles, backgroundColor: "#e5e7eb", color: "#111827" };

  return (
    <div style={overlayStyles} onClick={onClose}>
      <div style={modalStyles} onClick={(e) => e.stopPropagation()}>
        <DateRangePicker
          // главное отличие: DateRangePicker с пресетами слева
          ranges={range}
          onChange={(item) => setRange([item.selection])}
          months={2}
          direction="horizontal"
          locale={ru}
          staticRanges={staticRanges} // наши пресеты
          inputRanges={[]}            // скрыть дефолтные "Days up to today" и т.п.
          showDateDisplay={false}
        />
        <div style={footerStyles}>
          <button style={cancelButtonStyles} onClick={onClose}>Отменить</button>
          <Button onClick={() => onChange(range[0])}>Применить</Button>
        </div>
      </div>
    </div>
  );
}

export default DateRangePickerCustom;


// import React from "react";
// import { DateRange } from "react-date-range";
// import { addDays } from "date-fns";
// import ru from "date-fns/locale/ru";
// import "react-date-range/dist/styles.css";
// import "react-date-range/dist/theme/default.css";

// function DateRangePickerCustom({ onChange, onClose, value }) {
//   const [range, setRange] = React.useState([
//     value || {
//       startDate: addDays(new Date(), -7),
//       endDate: new Date(),
//       key: "selection",
//     },
//   ]);

//   const overlayStyles = {
//     position: "fixed",
//     top: 0,
//     left: 0,
//     width: "100vw",
//     height: "100vh",
//     background: "rgba(0, 0, 0, 0.4)",
//     display: "flex",
//     justifyContent: "center",
//     alignItems: "center",
//     zIndex: 1000,
//   };

//   const modalStyles = {
//     background: "#fff",
//     borderRadius: "12px",
//     padding: "20px",
//     boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
//     position: "relative",
//   };

//   const footerStyles = {
//     display: "flex",
//     justifyContent: "flex-end",
//     marginTop: "10px",
//     gap: "10px",
//   };

//   const buttonStyles = {
//     padding: "8px 16px",
//     border: "none",
//     borderRadius: "6px",
//     fontSize: "14px",
//     cursor: "pointer",
//   };

//   const applyButtonStyles = {
//     ...buttonStyles,
//     backgroundColor: "#1d4ed8",
//     color: "#fff",
//   };

//   const cancelButtonStyles = {
//     ...buttonStyles,
//     backgroundColor: "#e5e7eb",
//     color: "#111827",
//   };

//   return (
//     <div style={overlayStyles} onClick={onClose}>
//       <div style={modalStyles} onClick={(e) => e.stopPropagation()}>
//         <DateRange
//           editableDateInputs={true}
//           onChange={(item) => setRange([item.selection])}
//           moveRangeOnFirstSelection={false}
//           ranges={range}
//           locale={ru}
//           months={2}
//           direction="horizontal"
//         />
//         <div style={footerStyles}>
//           <button
//             style={cancelButtonStyles}
//             onClick={onClose}
//           >
//             Отменить
//           </button>
//           <button
//             style={applyButtonStyles}
//             onClick={() => onChange(range[0])}
//           >
//             Применить
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// }

// export default DateRangePickerCustom;
