import { useMemo } from "react";
import { useParams } from "react-router-dom";

import AirlinePage from "../../Blocks/AirlinePage/AirlinePage";
import AirlinesList from "../../Blocks/AirlinesList/AirlinesList";
import Estafeta from "../../Blocks/Estafeta/Estafeta";
import HotelPage from "../../Blocks/HotelPage/HotelPage";
import HotelsList from "../../Blocks/HotelsList/HotelsList";
import ReportsV2 from "../../Blocks/ReportsV2/ReportsV2";
import Reserve from "../../Blocks/Reserve/Reserve";
import Company from "../../Blocks/Company/Company";
import DocumentationList from "../../Blocks/DocumentationList/DocumentationList";
import PatchNotesList from "../../Blocks/PatchNotesList/PatchNotesList";
import UpdatesList from "../../Blocks/UpdatesList/UpdatesList";
import RegisterOfContracts from "../../Blocks/RegisterOfContracts/RegisterOfContracts";
import MyCompany from "../../Blocks/MyCompany/MyCompany";
import Analytics from "../../Pages/AnalyticsForAvia/Analytics/Analytics";
import DisAdminTransferContent from "./DisAdminTransferContent/DisAdminTransferContent";
import DisAdminAutoparkContent from "./DisAdminAutoparkContent/DisAdminAutoparkContent";
import PositionAccessPage from "../../Blocks/PositionAccessPage/PositionAccessPage";
import {
  canAccessMenu,
  canManageAirlineAccess,
  safeAccessMenu as getSafeAccessMenu,
} from "../../../utils/access";
import RepresentativeRequests from "../../Blocks/RepresentativeRequests/RepresentativeRequests";
import FapV2 from "../../Pages/FapV2/FapV2";
import SupportPage from "../../Blocks/SupportPage/SupportPage";

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
    id === "orders" || !!orderId;

  const isAutopark =
    id === "driversCompany" ||
    id === "driversList" ||
    (!!driversCompanyID && !id); 

  const CONFIG = useMemo(
    () => [
      {
        ids: ["relay"],
        guardKey: "requestMenu",
        Comp: Estafeta,
        props: () => ({ user, accessMenu: safeAccessMenu }),
      },
      {
        ids: ["representativeRequests"],
        guardKey: "reserveMenu",
        Comp: RepresentativeRequests,
        // Comp: Reserve,
        props: () => ({ user, accessMenu: safeAccessMenu }),
      },
      {
        ids: ["far"],
        guardKey: "reserveMenu",
        Comp: FapV2,
        props: () => ({ user, accessMenu: safeAccessMenu }),
      },
      {
        ids: ["support"],
        guardKey: null,
        Comp: SupportPage,
        props: () => ({ user }),
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
        props: () => ({ user, accessMenu: safeAccessMenu }),
      },
      {
        ids: ["reports", "reportsV2"],
        guardKey: "reportMenu",
        Comp: ReportsV2,
        props: () => ({ user, accessMenu: safeAccessMenu }),
      },
      {
        ids: ["analytics"],
        guardKey: "analyticsMenu",
        Comp: Analytics,
        props: () => ({ user, accessMenu: safeAccessMenu }),
      },
      {
        ids: ["positions"],
        // Редактор доступов должностей: диспетчер-админ проходит по роли (АК-
        // контекст), страница внутри гейтит dispatcher-тип прежним ключом.
        guard: canManageAirlineAccess,
        Comp: PositionAccessPage,
        props: () => ({ user, accessMenu: safeAccessMenu }),
      },
      { ids: ["hotels"], guardKey: null, Comp: HotelsList, props: () => ({ user }) },
      {
        ids: ["airlines"],
        guardKey: "airlineMenu",
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

  if (isAutopark) {
    if (!canAccessMenu(accessMenu, "organizationMenu", user)) {
      return <NoAccess />;
    }
    return <DisAdminAutoparkContent user={user} accessMenu={safeAccessMenu} />;
  }

  if (!id && hotelID) return <HotelPage id={hotelID} user={user} accessMenu={safeAccessMenu} />;
  if (!id && airlineID) {
    if (!canAccessMenu(accessMenu, "airlineMenu", user)) return <NoAccess />;
    return <AirlinePage id={airlineID} user={user} accessMenu={safeAccessMenu} />;
  }

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

    const allowed = rule.guard
      ? rule.guard(accessMenu, user)
      : canAccessMenu(accessMenu, rule.guardKey, user);
    const Comp = allowed ? rule.Comp : NoAccess;
    return <Comp {...(rule.props ? rule.props() : { user })} />;
  }

  return null;
};

export default DispatcherAdminContent;
