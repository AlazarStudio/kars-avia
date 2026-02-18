import { lazy, Suspense } from "react";
import { Tab, TabList, TabPanel, Tabs } from "react-tabs";

const HotelAboutTab = lazy(() =>
  import("../../../Blocks/HotelAbout_tabComponent/HotelAbout_tabComponent")
);
const HotelCompanyTab = lazy(() =>
  import("../../../Blocks/HotelCompany_tabComponent/HotelCompany_tabComponent")
);
const HotelNomerFondTab = lazy(() =>
  import(
    "../../../Blocks/HotelNomerFond_tabComponent/HotelNomerFond_tabComponent"
  )
);
const HotelShahmatkaTab = lazy(() =>
  import(
    "../../../Blocks/HotelShahmatka_tabComponent/HotelShahmatka_tabComponent"
  )
);
const HotelTarifsTab = lazy(() =>
  import("../../../Blocks/HotelTarifs_tabComponent/HotelTarifs_tabComponent")
);
const HotelRegisterOfContracts = lazy(() =>
  import("../../../Blocks/HotelRegisterOfContracts/HotelRegisterOfContracts")
);
const HotelSettingsTab = lazy(() =>
  import(
    "../../../Blocks/HotelSettings_tabComponent/HotelSettings_tabComponent"
  )
);

import classes from "./TransferAdminOrdersContent.module.css";
import MUILoader from "../../../Blocks/MUILoader/MUILoader";

const TransferAdminOrdersContent = ({
  id,
  user,
  selectedTab,
  handleTabSelect,
  type,
}) => {
  return (
    <>
      <Tabs
        className={classes.tabs}
        selectedIndex={selectedTab}
        onSelect={handleTabSelect}
        forceRenderTabPanel={false}
      >
        <TabList className={classes.tabList}>
          <Tab className={classes.tab}>Шахматка</Tab>
          {type === "apartment" ? null : (
            <Tab className={classes.tab}>Тарифы</Tab>
          )}

          <Tab className={classes.tab}>Реестр договоров</Tab>
          <Tab className={classes.tab}>Номерной фонд</Tab>
          <Tab className={classes.tab}>Пользователи</Tab>
          <Tab className={classes.tab}>О гостинице</Tab>
          <Tab className={classes.tab}>Редактирование</Tab>
          {/* <Tab className={classes.tab}>Настройки</Tab> */}
        </TabList>

        <TabPanel className={classes.tabPanel} forceRender={false}>
          <Suspense fallback={<MUILoader fullHeight={"100%"} />}>
            <HotelShahmatkaTab id={id} user={user} />
          </Suspense>
        </TabPanel>

        {type === "apartment" ? null : (
          <TabPanel className={classes.tabPanel} forceRender={false}>
            <Suspense fallback={<MUILoader fullHeight={"100%"} />}>
              <HotelTarifsTab id={id} user={user} />
            </Suspense>
          </TabPanel>
        )}

        <TabPanel className={classes.tabPanel} forceRender={false}>
          <Suspense fallback={<MUILoader fullHeight={"100%"} />}>
            <HotelRegisterOfContracts id={id} />
          </Suspense>
        </TabPanel>

        <TabPanel className={classes.tabPanel} forceRender={false}>
          <Suspense fallback={<MUILoader fullHeight={"100%"} />}>
            <HotelNomerFondTab id={id} />
          </Suspense>
        </TabPanel>

        <TabPanel className={classes.tabPanel} forceRender={false}>
          <Suspense fallback={<MUILoader fullHeight={"100%"} />}>
            <HotelCompanyTab id={id} />
          </Suspense>
        </TabPanel>

        <TabPanel className={classes.tabPanel} forceRender={false}>
          <Suspense fallback={<MUILoader fullHeight={"100%"} />}>
            <HotelAboutTab id={id} />
          </Suspense>
        </TabPanel>

        <TabPanel className={classes.tabPanel} forceRender={false}>
          <Suspense fallback={<MUILoader fullHeight={"100%"} />}>
            <HotelSettingsTab id={id} />
          </Suspense>
        </TabPanel>
      </Tabs>
    </>
  );
};

export default TransferAdminOrdersContent;
