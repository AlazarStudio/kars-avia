import { lazy, Suspense, useMemo } from "react";
import { Tab, TabList, TabPanel, Tabs } from "react-tabs";
import { useNavigate, useParams } from "react-router-dom";

import classes from "./DisAdminTransferContent.module.css";
import MUILoader from "../../../Blocks/MUILoader/MUILoader";
import Header from "../../../Blocks/Header/Header";

const TransferOrders = lazy(() =>
  import("../../../Blocks/TransferOrders/TransferOrders")
);
const DriversCompanyList = lazy(() =>
  import("../../../Blocks/DriversCompanyList/DriversCompanyList")
);
const DriversList = lazy(() =>
  import("../../../Blocks/DriversList/DriversList")
);
const TransferOrder = lazy(() =>
  import("../../../Blocks/TransferOrder/TransferOrder")
);
const DriversCompanyPage = lazy(() =>
  import("../../../Blocks/DriversCompanyPage/DriversCompanyPage")
);

const DisAdminTransferContent = ({ user }) => {
  const navigate = useNavigate();
  const { id, orderId, driversCompanyID, hotelID, airlineID } = useParams();

  // ✅ ВСЕ хуки/мемо — ДО любых return
  const isOrderDetails = !!orderId;
  const isCompanyDetails = !id && !!driversCompanyID;

  const selectedTab = useMemo(() => {
    if (id === "driversCompany") return 1;
    if (id === "driversList") return 2;
    return 0;
  }, [id]);

  const shouldShowTabs = useMemo(() => {
    // показываем табы только для списков
    if (isOrderDetails || isCompanyDetails) return false;

    return (
      id === "orders" ||
      id === "driversCompany" ||
      id === "driversList" ||
      (!id && !hotelID && !airlineID && !driversCompanyID && !orderId)
    );
  }, [
    id,
    hotelID,
    airlineID,
    driversCompanyID,
    orderId,
    isOrderDetails,
    isCompanyDetails,
  ]);

  const handleTabSelect = (index) => {
    if (index === 0) navigate("/orders");
    if (index === 1) navigate("/driversCompany");
    if (index === 2) navigate("/driversList");
  };

  // ✅ теперь можно return’ить — хуки уже вызваны
  if (isOrderDetails) {
    return (
      <Suspense fallback={<MUILoader fullHeight={"100%"} />}>
        <TransferOrder user={user} />
      </Suspense>
    );
  }

  if (isCompanyDetails) {
    return (
      <Suspense fallback={<MUILoader fullHeight={"100%"} />}>
        <DriversCompanyPage id={driversCompanyID} user={user} />
      </Suspense>
    );
  }

  if (!shouldShowTabs) return null;

  return (
    <div className={classes.section}>
      <div className={classes.header}>
        <Header>
          <div className={classes.titleHeader}>
            {/* <Link {...backProps} className={classes.backButton}>
            <img src="/arrow.png" alt="" />
          </Link> */}
            Трансфер
          </div>
        </Header>
      </div>
      <Tabs
        className={classes.tabs}
        selectedIndex={selectedTab}
        onSelect={handleTabSelect}
        forceRenderTabPanel={false}
      >
        <TabList className={classes.tabList}>
          <Tab className={classes.tab}>Заказы</Tab>
          <Tab className={classes.tab}>Организации</Tab>
          <Tab className={classes.tab}>Водители</Tab>
        </TabList>

        <TabPanel className={classes.tabPanel} forceRender={false}>
          <Suspense fallback={<MUILoader fullHeight={"100%"} />}>
            <TransferOrders user={user} disAdmin={true} />
          </Suspense>
        </TabPanel>

        <TabPanel className={classes.tabPanel} forceRender={false}>
          <Suspense fallback={<MUILoader fullHeight={"100%"} />}>
            <DriversCompanyList user={user} disAdmin={true} />
          </Suspense>
        </TabPanel>

        <TabPanel className={classes.tabPanel} forceRender={false}>
          <Suspense fallback={<MUILoader fullHeight={"100%"} />}>
            <DriversList user={user} disAdmin={true}/>
          </Suspense>
        </TabPanel>
      </Tabs>
    </div>
  );
};

export default DisAdminTransferContent;
