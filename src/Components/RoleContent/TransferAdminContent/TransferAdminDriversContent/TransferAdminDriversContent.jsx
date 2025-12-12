import React, { lazy, Suspense } from "react";
import { Tab, TabList, TabPanel, Tabs } from "react-tabs";

// Lazy-loaded components for each tab
const DriversCompanyTab = lazy(() =>
  import(
    "../../../Blocks/DriversCompany_tabComponent/DriversCompany_tabComponent"
  )
);
const AirlineTarifsTab = lazy(() =>
  import(
    "../../../Blocks/AirlineTarifs_tabComponent/AirlineTarifs_tabComponent"
  )
);
const AirlineRegisterOfContracts = lazy(() =>
  import(
    "../../../Blocks/AirlineRegisterOfContracts/AirlineRegisterOfContracts"
  )
);
const AirlineShahmatkaTabStaff = lazy(() =>
  import(
    "../../../Blocks/AirlineShahmatka_tabComponent_Staff/AirlineShahmatka_tabComponent_Staff"
  )
);
const AirlineAboutTab = lazy(() =>
  import("../../../Blocks/AirlineAbout_tabComponent/AirlineAbout_tabComponent")
);

import MUILoader from "../../../Blocks/MUILoader/MUILoader";
import classes from "./TransferAdminDriversContent.module.css";

const TransferAdminDriversContent = ({ id, user, selectedTab, handleTabSelect }) => (
  <Tabs
    className={classes.tabs}
    selectedIndex={selectedTab}
    onSelect={handleTabSelect}
    forceRenderTabPanel={false}
  >
    <TabList className={classes.tabList}>
      <Tab className={classes.tab}>Пользователи</Tab>
      {/* <Tab className={classes.tab}>Цены</Tab> */}
      <Tab className={classes.tab}>Договоры</Tab>
      {/* <Tab className={classes.tab}>Сотрудники</Tab> */}
      <Tab className={classes.tab}>Об организации</Tab>
    </TabList>

    {/* Wrap each lazy-loaded panel in Suspense for fallback */}
    <TabPanel className={classes.tabPanel} forceRender={false}>
      <Suspense fallback={<MUILoader fullHeight={"100%"} />}>
        <DriversCompanyTab id={id} user={user} />
      </Suspense>
    </TabPanel>

    {/* <TabPanel className={classes.tabPanel} forceRender={false}>
      <Suspense fallback={<MUILoader fullHeight={"100%"} />}>
        <AirlineTarifsTab id={id} />
      </Suspense>
    </TabPanel> */}

    <TabPanel className={classes.tabPanel} forceRender={false}>
      <Suspense fallback={<MUILoader fullHeight={"100%"} />}>
        <AirlineRegisterOfContracts id={id} />
      </Suspense>
    </TabPanel>

    {/* <TabPanel className={classes.tabPanel} forceRender={false}>
      <Suspense fallback={<MUILoader fullHeight={"100%"} />}>
        <AirlineShahmatkaTabStaff id={id} />
      </Suspense>
    </TabPanel> */}

    <TabPanel className={classes.tabPanel} forceRender={false}>
      <Suspense fallback={<MUILoader fullHeight={"100%"} />}>
        <AirlineAboutTab id={id} />
      </Suspense>
    </TabPanel>
  </Tabs>
);

export default TransferAdminDriversContent;
