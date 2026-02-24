import { lazy, Suspense, useMemo } from "react";
import { Tab, TabList, TabPanel, Tabs } from "react-tabs";
import { useNavigate, useParams } from "react-router-dom";

import classes from "./DisAdminAutoparkContent.module.css";
import MUILoader from "../../../Blocks/MUILoader/MUILoader";
import Header from "../../../Blocks/Header/Header";
import { isSuperAdmin } from "../../../../utils/access";

const DriversCompanyList = lazy(() =>
  import("../../../Blocks/DriversCompanyList/DriversCompanyList")
);
const DriversList = lazy(() =>
  import("../../../Blocks/DriversList/DriversList")
);
const DriversCompanyPage = lazy(() =>
  import("../../../Blocks/DriversCompanyPage/DriversCompanyPage")
);

const DisAdminAutoparkContent = ({ user, accessMenu }) => {
  const navigate = useNavigate();
  const { id, driversCompanyID } = useParams();

  const effectiveAccessMenu = isSuperAdmin(user)
    ? {
        organizationCreate: true,
        organizationAcceptDrivers: true,
        organizationAddDrivers: true,
        organizationUpdate: true,
        contractCreate: true,
        contractUpdate: true,
      }
    : accessMenu;

  const isCompanyDetails = !id && !!driversCompanyID;

  const selectedTab = useMemo(() => {
    if (id === "driversCompany") return 0;
    if (id === "driversList") return 1;
    return 0;
  }, [id]);

  const shouldShowTabs = useMemo(() => {
    if (isCompanyDetails) return false;
    return id === "driversCompany" || id === "driversList";
  }, [id, isCompanyDetails]);

  const handleTabSelect = (index) => {
    if (index === 0) navigate("/driversCompany");
    if (index === 1) navigate("/driversList");
  };

  if (isCompanyDetails) {
    return (
      <Suspense fallback={<MUILoader fullHeight={"100%"} />}>
        <DriversCompanyPage id={driversCompanyID} user={user} accessMenu={effectiveAccessMenu} />
      </Suspense>
    );
  }

  if (!shouldShowTabs) return null;

  return (
    <div className={classes.section}>
      <div className={classes.header}>
        <Header>
          <div className={classes.titleHeader}>Автопарк</div>
        </Header>
      </div>
      <Tabs
        className={classes.tabs}
        selectedIndex={selectedTab}
        onSelect={handleTabSelect}
        forceRenderTabPanel={false}
      >
        <TabList className={classes.tabList}>
          <Tab className={classes.tab}>Организации</Tab>
          <Tab className={classes.tab}>Водители</Tab>
        </TabList>

        <TabPanel className={classes.tabPanel} forceRender={false}>
          <Suspense fallback={<MUILoader fullHeight={"100vh"} />}>
            <DriversCompanyList user={user} disAdmin={true} accessMenu={effectiveAccessMenu} />
          </Suspense>
        </TabPanel>

        <TabPanel className={classes.tabPanel} forceRender={false}>
          <Suspense fallback={<MUILoader fullHeight={"100vh"} />}>
            <DriversList user={user} disAdmin={true} accessMenu={effectiveAccessMenu} />
          </Suspense>
        </TabPanel>
      </Tabs>
    </div>
  );
};

export default DisAdminAutoparkContent;
