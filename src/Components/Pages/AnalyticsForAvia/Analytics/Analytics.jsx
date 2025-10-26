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
