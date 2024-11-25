import { Tab, TabList, TabPanel, Tabs } from "react-tabs";

import AirlineCompany_tabComponent from "../../../Blocks/AirlineCompany_tabComponent/AirlineCompany_tabComponent";
import AirlineShahmatka_tabComponent_Staff from "../../../Blocks/AirlineShahmatka_tabComponent_Staff/AirlineShahmatka_tabComponent_Staff";
import AirlineAbout_tabComponent from "../../../Blocks/AirlineAbout_tabComponent/AirlineAbout_tabComponent";

import classes from "./DisAdminAirlineContent.module.css";

const DisAdminAirlineContent = ({ id, user, selectedTab, handleTabSelect }) => (
<Tabs
    className={classes.tabs}
    selectedIndex={selectedTab}
    onSelect={handleTabSelect}
  >
    <TabList className={classes.tabList}>
      <Tab className={classes.tab}>Компания</Tab>
      <Tab className={classes.tab}>Экипаж</Tab>
      <Tab className={classes.tab}>О авиакомпании</Tab>
    </TabList>

    <TabPanel className={classes.tabPanel}>
      <AirlineCompany_tabComponent id={id} />
    </TabPanel>

    <TabPanel className={classes.tabPanel}>
      <AirlineShahmatka_tabComponent_Staff id={id} />
    </TabPanel>

    <TabPanel className={classes.tabPanel}>
      <AirlineAbout_tabComponent id={id} />
    </TabPanel>
  </Tabs>
);

export default DisAdminAirlineContent;
