import React, { lazy, Suspense } from "react";
import { Tab, TabList, TabPanel, Tabs } from "react-tabs";

// Lazy-loaded components for each tab
const AirlineCompanyTab = lazy(() =>
  import(
    "../../../Blocks/AirlineCompany_tabComponent/AirlineCompany_tabComponent"
  )
);
const AirlineTarifsTab = lazy(() =>
  import(
    "../../../Blocks/AirlineTarifs_tabComponent/AirlineTarifs_tabComponent"
  )
);
const AirlineTransferPricesTab = lazy(() =>
  import(
    "../../../Blocks/AirlineTransferPrices_tabComponent/AirlineTransferPrices_tabComponent"
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
import classes from "./DisAdminAirlineContent.module.css";

const DisAdminAirlineContent = ({ id, user, accessMenu, selectedTab, handleTabSelect }) => (
  <Tabs
    className={classes.tabs}
    selectedIndex={selectedTab}
    onSelect={handleTabSelect}
    forceRenderTabPanel={false}
  >
    <TabList className={classes.tabList}>
      <Tab className={classes.tab}>Пользователи</Tab>
      <Tab className={classes.tab}>Цены</Tab>
      <Tab className={classes.tab}>Цены на трансфер</Tab>
      <Tab className={classes.tab}>Реестр договоров</Tab>
      <Tab className={classes.tab}>Сотрудники</Tab>
      <Tab className={classes.tab}>Об авиакомпании</Tab>
    </TabList>

    {/* Wrap each lazy-loaded panel in Suspense for fallback */}
    <TabPanel className={classes.tabPanel} forceRender={false}>
      <Suspense fallback={<MUILoader fullHeight={"100%"} />}>
        <AirlineCompanyTab id={id} />
      </Suspense>
    </TabPanel>

    <TabPanel className={classes.tabPanel} forceRender={false}>
      <Suspense fallback={<MUILoader fullHeight={"100%"} />}>
        <AirlineTarifsTab id={id} />
      </Suspense>
    </TabPanel>

    <TabPanel className={classes.tabPanel} forceRender={false}>
      <Suspense fallback={<MUILoader fullHeight={"100%"} />}>
        <AirlineTransferPricesTab id={id} user={user} accessMenu={accessMenu} />
      </Suspense>
    </TabPanel>

    <TabPanel className={classes.tabPanel} forceRender={false}>
      <Suspense fallback={<MUILoader fullHeight={"100%"} />}>
        <AirlineRegisterOfContracts id={id} user={user} accessMenu={accessMenu} />
      </Suspense>
    </TabPanel>

    <TabPanel className={classes.tabPanel} forceRender={false}>
      <Suspense fallback={<MUILoader fullHeight={"100%"} />}>
        <AirlineShahmatkaTabStaff id={id} />
      </Suspense>
    </TabPanel>

    <TabPanel className={classes.tabPanel} forceRender={false}>
      <Suspense fallback={<MUILoader fullHeight={"100%"} />}>
        <AirlineAboutTab id={id} />
      </Suspense>
    </TabPanel>
  </Tabs>
);

export default DisAdminAirlineContent;

// import { Tab, TabList, TabPanel, Tabs } from "react-tabs";

// import AirlineCompany_tabComponent from "../../../Blocks/AirlineCompany_tabComponent/AirlineCompany_tabComponent";
// import AirlineShahmatka_tabComponent_Staff from "../../../Blocks/AirlineShahmatka_tabComponent_Staff/AirlineShahmatka_tabComponent_Staff";
// import AirlineAbout_tabComponent from "../../../Blocks/AirlineAbout_tabComponent/AirlineAbout_tabComponent";

// import classes from "./DisAdminAirlineContent.module.css";
// import AirlineTarifs_tabComponent from "../../../Blocks/AirlineTarifs_tabComponent/AirlineTarifs_tabComponent";

// const DisAdminAirlineContent = ({ id, user, selectedTab, handleTabSelect }) => (
// <Tabs
//     className={classes.tabs}
//     selectedIndex={selectedTab}
//     onSelect={handleTabSelect}
//     forceRenderTabPanel={false}
//   >
//     <TabList className={classes.tabList}>
//       <Tab className={classes.tab}>Пользователи</Tab>
//       <Tab className={classes.tab}>Цены</Tab>
//       <Tab className={classes.tab}>Сотрудники</Tab>
//       <Tab className={classes.tab}>Об авиакомпании</Tab>
//     </TabList>

//     <TabPanel className={classes.tabPanel} forceRender={false}>
//       <AirlineCompany_tabComponent id={id} />
//     </TabPanel>

//     <TabPanel className={classes.tabPanel} forceRender={false}>
//       <AirlineTarifs_tabComponent id={id} />
//     </TabPanel>

//     <TabPanel className={classes.tabPanel} forceRender={false}>
//       <AirlineShahmatka_tabComponent_Staff id={id} />
//     </TabPanel>

//     <TabPanel className={classes.tabPanel} forceRender={false}>
//       <AirlineAbout_tabComponent id={id} />
//     </TabPanel>
//   </Tabs>
// );

// export default DisAdminAirlineContent;
