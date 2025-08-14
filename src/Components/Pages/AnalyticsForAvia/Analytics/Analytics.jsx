import React, { useState } from "react";
import classes from "./Analytics.module.css";

import AirlineAnalytics from "../tabs/AirlineAnalytics/AirlineAnalytics";
import DispatcherAnalytics from "../tabs/DispatcherAnalytics/DispatcherAnalytics";
import HotelAnalytics from "../tabs/HotelAnalytics/HotelAnalytics";
import SupportAnalytics from "../tabs/SupportAnalytics/SupportAnalytics";
import Header from "../../../Blocks/Header/Header";

const tabs = [
  { key: "airlines", label: "Авиакомпании" },
  { key: "dispatchers", label: "Диспетчеры" },
  { key: "hotels", label: "Гостиницы" },
  { key: "support", label: "Техподдержка" }
];

function Analytics() {
  const [activeTab, setActiveTab] = useState("airlines");

  const renderTabContent = () => {
    switch (activeTab) {
      case "airlines":
        return <AirlineAnalytics />;
      case "dispatchers":
        return <DispatcherAnalytics />;
      case "hotels":
        return <HotelAnalytics />;
      case "support":
        return <SupportAnalytics />;
      default:
        return null;
    }
  };
  ``;
  return (
    <div className={classes.analyticsContainer}>
      <Header>Аналитика</Header>
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

      <div className={classes.tabContent}>{renderTabContent()}</div>
    </div>
  );
}

export default Analytics;
