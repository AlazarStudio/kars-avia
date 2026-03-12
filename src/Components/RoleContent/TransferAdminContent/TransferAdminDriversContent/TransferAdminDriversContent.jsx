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
const OrganizationAboutTab = lazy(() =>
  import("../../../Blocks/OrganizationAbout_tabComponent/OrganizationAbout_tabComponent")
);
const OrganizationRegisterOfContracts = lazy(() =>
  import("../../../Blocks/OrganizationRegisterOfContracts/OrganizationRegisterOfContracts")
);
const OrganizationTransferPricesTab = lazy(() =>
  import("../../../Blocks/OrganizationTransferPrices_tabComponent/OrganizationTransferPrices_tabComponent")
);

import MUILoader from "../../../Blocks/MUILoader/MUILoader";
import classes from "./TransferAdminDriversContent.module.css";

const TransferAdminDriversContent = ({ id, user, accessMenu, selectedTab, handleTabSelect }) => (
  <Tabs
    className={classes.tabs}
    selectedIndex={selectedTab}
    onSelect={handleTabSelect}
    forceRenderTabPanel={false}
  >
    <TabList className={classes.tabList}>
      <Tab className={classes.tab}>Водители</Tab>
      <Tab className={classes.tab}>Цены</Tab>
      <Tab className={classes.tab}>Реестр договоров</Tab>
      <Tab className={classes.tab}>Об организации</Tab>
    </TabList>

    {/* Wrap each lazy-loaded panel in Suspense for fallback */}
    <TabPanel className={classes.tabPanel} forceRender={false}>
      <Suspense fallback={<MUILoader fullHeight={"100%"} />}>
        <DriversCompanyTab id={id} user={user} accessMenu={accessMenu} />
      </Suspense>
    </TabPanel>

    <TabPanel className={classes.tabPanel} forceRender={false}>
      <Suspense fallback={<MUILoader fullHeight={"100%"} />}>
        <OrganizationTransferPricesTab id={id} user={user} accessMenu={accessMenu} />
      </Suspense>
    </TabPanel>

    <TabPanel className={classes.tabPanel} forceRender={false}>
      <Suspense fallback={<MUILoader fullHeight={"100%"} />}>
        <OrganizationRegisterOfContracts id={id} user={user} accessMenu={accessMenu} />
      </Suspense>
    </TabPanel>


    <TabPanel className={classes.tabPanel} forceRender={false}>
      <Suspense fallback={<MUILoader fullHeight={"100%"} />}>
        <OrganizationAboutTab id={id} accessMenu={accessMenu} />
      </Suspense>
    </TabPanel>

  </Tabs>
);

export default TransferAdminDriversContent;
