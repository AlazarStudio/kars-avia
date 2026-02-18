import React, { useState } from "react";
import classes from "./Analytics.module.css";

import AirlineAnalytics from "../tabs/AirlineAnalytics/AirlineAnalytics";
import DispatcherAnalytics from "../tabs/DispatcherAnalytics/DispatcherAnalytics";
import HotelAnalytics from "../tabs/HotelAnalytics/HotelAnalytics";
import SupportAnalytics from "../tabs/SupportAnalytics/SupportAnalytics";
import Header from "../../../Blocks/Header/Header";

const tabs = [
  { key: "airlines", label: "Авиакомпании" },
  { key: "hotels", label: "Гостиницы" },
  { key: "dispatchers", label: "Диспетчеры" },
  // { key: "support", label: "Техподдержка" }
];

function Analytics({user}) {
  const [activeTab, setActiveTab] = useState("airlines");
  // console.log(user);
  
  const renderTabContent = () => {
    switch (activeTab) {
      case "airlines":
        return <AirlineAnalytics user={user} height={user.airlineId ? "calc(100vh - 125px)" : null}/>;
      case "dispatchers":
        return <DispatcherAnalytics />;
      case "hotels":
        return <HotelAnalytics />;
      // case "support":
      //   return <SupportAnalytics />;
      default:
        return null;
    }
  };
  ``;
  return (
    <div className={classes.analyticsContainer}>
      <Header>Аналитика (в разработке)</Header>
      {user?.airlineId ? null : (
        <div className={classes.tabs}>
          {tabs.map((tab) => (
            <button
              key={tab.key}
              className={`${classes.tabButton} ${
                activeTab === tab.key ? classes.active : ""
              }`}
              onClick={() => setActiveTab(tab.key)}
            >
              {tab.label}
            </button>
          ))}
        </div>
      )}

      <div className={user?.airlineId ? classes.tabContent : null}>{renderTabContent()}</div>
    </div>
  );
}

export default Analytics;


// import React, { useState } from "react";
// import classes from "./Analytics.module.css";

// import AirlineAnalytics from "../tabs/AirlineAnalytics/AirlineAnalytics";
// import DispatcherAnalytics from "../tabs/DispatcherAnalytics/DispatcherAnalytics";
// import HotelAnalytics from "../tabs/HotelAnalytics/HotelAnalytics";
// import SupportAnalytics from "../tabs/SupportAnalytics/SupportAnalytics";
// import Header from "../../../Blocks/Header/Header";
// import { differenceInDays, eachDayOfInterval, format } from "date-fns";

// // Функция для генерации случайных данных на основе диапазона дат
// function generateMockData(startDate, endDate, dataType) {
//   const days = differenceInDays(endDate, startDate) + 1;
//   const allDates = eachDayOfInterval({ start: startDate, end: endDate });
  
//   return allDates.map((date, index) => {
//     const formatted = format(date, "yyyy-MM-dd");
//     let value;
    
//     switch (dataType) {
//       case 'createdRequests':
//         // Количество созданных заявок (5-50 штук)
//         value = Math.floor(Math.random() * 45 + 5);
//         break;
//       case 'processedRequests':
//         // Количество обработанных заявок (5-50 штук)
//         value = Math.floor(Math.random() * 45 + 5);
//         break;
//       case 'averageTime':
//         // Среднее время размещения (1-8 часов)
//         value = Math.floor(Math.random() * 7 + 1) + Math.random();
//         break;
//       case 'crmTime':
//         // Время в CRM (2-10 часов)
//         value = Math.floor(Math.random() * 8 + 2);
//         break;
//       case 'activityTime':
//         // Среднее время ожидания обработки (0.5-4 часа)
//         value = Math.random() * 3.5 + 0.5;
//         break;
//       case 'processingTime':
//         // Время обработки заявки (0.5-6 часов)
//         value = Math.random() * 5.5 + 0.5;
//         break;
//       case 'systemWorkTime':
//         // Время работы в системе (4-12 часов)
//         value = Math.random() * 8 + 4;
//         break;
//       case 'duplicatedRequests':
//         // Дублированные заявки (0-8 штук)
//         value = Math.floor(Math.random() * 9);
//         break;
//       default:
//         value = 0;
//     }
    
//     return {
//       date: formatted,
//       value: parseFloat(value.toFixed(2)),
//       count: parseFloat(value.toFixed(2)), // для совместимости с существующим кодом
//       hours: parseFloat(value.toFixed(2)), // для совместимости с существующим кодом
//     };
//   });
// }

// // Функция для генерации случайных данных для pie-чартов
// function generatePieData(labels, totalRange = [100, 500]) {
//   const total = Math.floor(Math.random() * (totalRange[1] - totalRange[0] + 1)) + totalRange[0];
//   const data = [];
//   let remaining = total;
  
//   for (let i = 0; i < labels.length; i++) {
//     let value;
//     if (i === labels.length - 1) {
//       value = remaining;
//     } else {
//       value = Math.floor(Math.random() * (remaining / 2)) + 1;
//       remaining -= value;
//     }
//     data.push({
//       x: labels[i],
//       value: value
//     });
//   }
  
//   return data;
// }

// const tabs = [
//   { key: "airlines", label: "Авиакомпании" },
//   { key: "hotels", label: "Гостиницы" },
//   { key: "dispatchers", label: "Диспетчеры" },
//   // { key: "support", label: "Техподдержка" }
// ];

// function Analytics({user}) {
//   const [activeTab, setActiveTab] = useState("airlines");
//   // console.log(user);
  
//   const renderTabContent = () => {
//     switch (activeTab) {
//       case "airlines":
//         return <AirlineAnalytics user={user} generateMockData={generateMockData} generatePieData={generatePieData} height={user.airlineId ? "calc(100vh - 125px)" : null}/>;
//       case "dispatchers":
//         return <DispatcherAnalytics generateMockData={generateMockData} generatePieData={generatePieData} />;
//       case "hotels":
//         return <HotelAnalytics generateMockData={generateMockData} generatePieData={generatePieData} />;
//       // case "support":
//       //   return <SupportAnalytics />;
//       default:
//         return null;
//     }
//   };
//   ``;
//   return (
//     <div className={classes.analyticsContainer}>
//       <Header>Аналитика</Header>
//       {user?.airlineId ? null : (
//         <div className={classes.tabs}>
//           {tabs.map((tab) => (
//             <button
//               key={tab.key}
//               className={`${classes.tabButton} ${
//                 activeTab === tab.key ? classes.active : ""
//               }`}
//               onClick={() => setActiveTab(tab.key)}
//             >
//               {tab.label}
//             </button>
//           ))}
//         </div>
//       )}

//       <div className={user?.airlineId ? classes.tabContent : null}>{renderTabContent()}</div>
//     </div>
//   );
// }

// export default Analytics;
