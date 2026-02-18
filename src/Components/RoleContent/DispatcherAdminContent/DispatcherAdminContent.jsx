import { useMemo } from "react";
import { useParams } from "react-router-dom";

import AirlinePage from "../../Blocks/AirlinePage/AirlinePage";
import AirlinesList from "../../Blocks/AirlinesList/AirlinesList";
import Estafeta from "../../Blocks/Estafeta/Estafeta";
import HotelPage from "../../Blocks/HotelPage/HotelPage";
import HotelsList from "../../Blocks/HotelsList/HotelsList";
import Reports from "../../Blocks/Reports/Reports";
import Reserve from "../../Blocks/Reserve/Reserve";
import Company from "../../Blocks/Сompany/Сompany";
import DocumentationList from "../../Blocks/DocumentationList/DocumentationList";
import PatchNotesList from "../../Blocks/PatchNotesList/PatchNotesList";
import UpdatesList from "../../Blocks/UpdatesList/UpdatesList";
import RegisterOfContracts from "../../Blocks/RegisterOfContracts/RegisterOfContracts";
import MyCompany from "../../Blocks/MyCompany/MyCompany";
import Analytics from "../../Pages/AnalyticsForAvia/Analytics/Analytics";
import AccessSettings from "../../Blocks/AccessSettings/AccessSettings";
import NotificationsSettings from "../../Blocks/NotificationsSettings/NotificationsSettings";
import DisAdminTransferContent from "./DisAdminTransferContent/DisAdminTransferContent";
import DispatcherAccessSettings from "../../Blocks/DispatcherAccessSettings/DispatcherAccessSettings";
import DispatcherNotificationsSettings from "../../Blocks/DispatcherNotificationsSettings/DispatcherNotificationsSettings";
import { canAccessMenu, safeAccessMenu as getSafeAccessMenu } from "../../../utils/access";

const NoAccess = () => (
  <div
    style={{
      height: "100vh",
      width: "100%",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      fontSize: "40px",
      color: "var(--main-gray)",
    }}
  />
);

const DispatcherAdminContent = ({ user, accessMenu }) => {
  const { id, orderId, driversCompanyID, hotelID, airlineID } = useParams();
  const safeAccessMenu = getSafeAccessMenu(accessMenu);
  // console.log(safeAccessMenu)

  const isTransfer =
    id === "orders" ||
    id === "driversCompany" ||
    id === "driversList" ||
    id === "transerDispatchers" ||
    !!orderId ||
    (!!driversCompanyID && !id) 
    // ||
    // (!id && !hotelID && !airlineID && !orderId && !driversCompanyID); // если хочешь “заказы” по умолчанию

  const CONFIG = useMemo(
    () => [
      {
        ids: ["relay"],
        guardKey: "requestMenu",
        Comp: Estafeta,
        props: () => ({ user, accessMenu: safeAccessMenu }),
      },
      {
        ids: ["reserve"],
        guardKey: "reserveMenu",
        Comp: Reserve,
        props: () => ({ user, accessMenu: safeAccessMenu }),
      },
      {
        ids: ["company"],
        guardKey: "userMenu",
        Comp: Company,
        props: () => ({ user, accessMenu: safeAccessMenu }),
      },
      {
        ids: ["registerOfContracts"],
        guardKey: "contracts",
        Comp: RegisterOfContracts,
        props: () => ({ user }),
      },
      {
        ids: ["reports"],
        guardKey: "reportMenu",
        Comp: Reports,
        props: () => ({ user, accessMenu: safeAccessMenu }),
      },
      {
        ids: ["analytics"],
        guardKey: "analyticsMenu",
        Comp: Analytics,
        props: () => ({ user, accessMenu: safeAccessMenu }),
      },
      {
        ids: ["airlineAccess"],
        guardKey: "userUpdate",
        Comp: AccessSettings,
        props: () => ({ user }),
      },
      {
        ids: ["airlineNotifications"],
        guardKey: "userUpdate",
        Comp: NotificationsSettings,
        props: () => ({ user }),
      },
      {
        ids: ["dispatcherAccess"],
        guardKey: "userUpdate",
        Comp: DispatcherAccessSettings,
        props: () => ({}),
      },
      {
        ids: ["dispatcherNotifications"],
        guardKey: "userUpdate",
        Comp: DispatcherNotificationsSettings,
        props: () => ({}),
      },
      { ids: ["hotels"], guardKey: null, Comp: HotelsList, props: () => ({ user }) },
      {
        ids: ["airlines"],
        guardKey: null,
        Comp: AirlinesList,
        props: () => ({ user }),
      },
      {
        ids: ["documentation"],
        guardKey: null,
        Comp: DocumentationList,
        props: () => ({ user }),
      },
      { ids: ["updates"], guardKey: null, Comp: UpdatesList, props: () => ({ user }) },
      { ids: ["myCompany"], guardKey: null, Comp: MyCompany, props: () => ({ user }) },
      {
        ids: ["patchNotes"],
        guardKey: null,
        Comp: PatchNotesList,
        props: () => ({ user }),
      },
    ],
    [safeAccessMenu, user]
  );

  if (isTransfer) {
    if (!canAccessMenu(accessMenu, "transferMenu", user)) {
      return <NoAccess />;
    }
    return <DisAdminTransferContent user={user} accessMenu={safeAccessMenu} />;
  }

  if (!id && hotelID) return <HotelPage id={hotelID} user={user} accessMenu={safeAccessMenu} />;
  if (!id && airlineID) return <AirlinePage id={airlineID} user={user} />;

  if (!id && !hotelID && !airlineID && !orderId && !driversCompanyID) {
    if (canAccessMenu(accessMenu, "requestMenu", user)) {
      return <Estafeta user={user} accessMenu={safeAccessMenu} />;
    }
    if (canAccessMenu(accessMenu, "reserveMenu", user)) {
      return <Reserve user={user} accessMenu={safeAccessMenu} />;
    }
    return <HotelsList user={user} />;
  }

  if (id) {
    const rule = CONFIG.find((item) => item.ids.includes(id));
    if (!rule) return <NoAccess />;

    const allowed = canAccessMenu(accessMenu, rule.guardKey, user);
    const Comp = allowed ? rule.Comp : NoAccess;
    return <Comp {...(rule.props ? rule.props() : { user })} />;
  }

  return null;
};

export default DispatcherAdminContent;
