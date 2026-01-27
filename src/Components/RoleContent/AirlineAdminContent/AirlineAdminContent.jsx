import React, { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";

import AirlinePage from "../../Blocks/AirlinePage/AirlinePage";
import Estafeta from "../../Blocks/Estafeta/Estafeta";
import HotelPage from "../../Blocks/HotelPage/HotelPage";
import HotelsList from "../../Blocks/HotelsList/HotelsList";
import Reserve from "../../Blocks/Reserve/Reserve";
import Reports from "../../Blocks/Reports/Reports";
import UpdatesList from "../../Blocks/UpdatesList/UpdatesList";
import DocumentationList from "../../Blocks/DocumentationList/DocumentationList";
import Analytics from "../../Pages/AnalyticsForAvia/Analytics/Analytics";
import TransferOrders from "../../Blocks/TransferOrders/TransferOrders";
import TransferOrder from "../../Blocks/TransferOrder/TransferOrder";

import { hasAccessMenu, safeAccessMenu as getSafeAccessMenu } from "../../../utils/access";
import AccessSettings from "../../Blocks/AccessSettings/AccessSettings";
import { useQuery, useSubscription } from "@apollo/client";
import { GET_AIRLINE_DEPARTMENT, GET_AIRLINES_UPDATE_SUBSCRIPTION, getCookie } from "../../../../graphQL_requests";
import NotificationsSettings from "../../Blocks/NotificationsSettings/NotificationsSettings";

// Универсальная заглушка «нет доступа» (по желанию — замени на свой экран)
const NoAccess = () => 
  <div 
    style={{ 
      height:"100vh", 
      width: "100%", 
      display:'flex', 
      justifyContent:'center', 
      alignItems:'center', 
      fontSize:"40px",
      color:"var(--main-gray)"
    }}
  > 
    {/* 404 Не найдено */}
  </div>;

const AirlineAdminContent = ({ user, accessMenu }) => {
  const { id, hotelID, airlineID, orderId } = useParams();
  const safeAccessMenu = getSafeAccessMenu(accessMenu);

  // 1) Мапа «секция → какой компонент и какое право нужно»
  // guardKey === null => доступ открыт без проверки
  const CONFIG = useMemo(
    () => ([
      { ids: ["relay"],               guardKey: "requestMenu",   Comp: Estafeta,    props: () => ({ user, accessMenu: safeAccessMenu }) },
      { ids: ["reserve"],             guardKey: "reserveMenu",   Comp: Reserve,     props: () => ({ user, accessMenu: safeAccessMenu }) },
      { ids: ["orders"],              guardKey: "transferMenu",  Comp: TransferOrders, props: () => ({ user, accessMenu: safeAccessMenu, disAdmin: false }) },
      { ids: ["hotels"],              guardKey: null,            Comp: HotelsList,  props: () => ({ user }) },

      { ids: ["analytics"],           guardKey: "analyticsMenu", Comp: Analytics,   props: () => ({ user, accessMenu: safeAccessMenu }) },

      { ids: ["reports"],             guardKey: "reportMenu",    Comp: Reports,               props: () => ({ user, accessMenu: safeAccessMenu }) },
      { ids: ["access"],              guardKey: "userUpdate",    Comp: AccessSettings,        props: () => ({ }) },
      // { ids: ["notifications"],       guardKey: "userUpdate",    Comp: NotificationsSettings, props: () => ({ }) },
      { ids: ["updates"],             guardKey: null,            Comp: UpdatesList,           props: () => ({ user }) },
      { ids: ["documentation"],       guardKey: null,            Comp: DocumentationList,     props: () => ({ user }) },

      // Группа страниц авиакомпании — одно право
      { ids: ["airlineCompany"],
        guardKey: "userMenu",
        Comp: AirlinePage,
        props: () => ({ id: user.airlineId, user, accessMenu:safeAccessMenu })
      },
      { ids: ["airlineStaff"],
        guardKey: "personalMenu",
        Comp: AirlinePage,
        props: () => ({ id: user.airlineId, user, accessMenu:safeAccessMenu })
      },
      { ids: ["airlineAbout"],
        guardKey: "airlineMenu",
        Comp: AirlinePage,
        props: () => ({ id: user.airlineId, user, accessMenu:safeAccessMenu })
      },
      { ids: ["airlineRegisterOfContracts"],
        guardKey: "contracts",
        Comp: AirlinePage,
        props: () => ({ id: user.airlineId, user })
      },
    ]),
    [user, safeAccessMenu]
  );

  // 2) Спец-случаи по URL (item-страницы), до общих правил
  // Детальная страница трансфера
  if (orderId) {
    return <TransferOrder user={user} accessMenu={safeAccessMenu} />;
  }
  
  if (!id && hotelID)   return <HotelPage id={hotelID} user={user} />;
  if (!id && airlineID) return <AirlinePage id={airlineID} user={user} accessMenu={safeAccessMenu} />;

  // 3) Главная (когда нет id/hotelID/airlineID): показываем Estafeta, если есть requestMenu, иначе Reserve
  if (!id && !hotelID && !airlineID) {
    return hasAccessMenu(accessMenu, "requestMenu") ? (
      <Estafeta user={user} accessMenu={safeAccessMenu} />
    ) : hasAccessMenu(accessMenu, "reserveMenu") ? (
      <Reserve user={user} accessMenu={safeAccessMenu} />
    ) : (
      <HotelsList user={user} />
    );
  }

  // 4) По id — ищем правило и проверяем доступ
  if (id) {
    const rule = CONFIG?.find(r => r.ids.includes(id));
    if (!rule) return <NoAccess />;

    const allowed = hasAccessMenu(accessMenu, rule?.guardKey);
    const Comp = allowed ? rule.Comp : NoAccess;
    return <Comp {...(rule.props ? rule.props() : { user })} />;
  }

  // На всякий
  return null;
};

export default AirlineAdminContent;


// import React from "react";
// import { useParams } from "react-router-dom";

// import AirlinePage from "../../Blocks/AirlinePage/AirlinePage";
// import Estafeta from "../../Blocks/Estafeta/Estafeta";
// import HotelPage from "../../Blocks/HotelPage/HotelPage";
// import HotelsList from "../../Blocks/HotelsList/HotelsList";
// import Reserve from "../../Blocks/Reserve/Reserve";
// import Reports from "../../Blocks/Reports/Reports";
// import UpdatesList from "../../Blocks/UpdatesList/UpdatesList";
// import DocumentationList from "../../Blocks/DocumentationList/DocumentationList";
// import { menuAccess } from "../../../roles";

// const AirlineAdminContent = ({ user }) => {
//   const { id, hotelID, airlineID } = useParams();
//   // console.log(user);
  

//   return (
//     <>
//       {((id === "relay" || (!id && !hotelID && !airlineID)) && menuAccess.requestMenu) && (
//         <Estafeta user={user} />
//       )}
//       {(id === "reserve" || (!id && menuAccess.requestMenu === false)) && <Reserve user={user} />}
//       {id === "hotels" && <HotelsList user={user} />}
//       {(id === "airlineCompany" ||
//         id === "airlineStaff" ||
//         id === "airlineAbout" ||
//         id === "airlineRegisterOfContracts"
//       ) && (
//         <AirlinePage id={user.airlineId} user={user} />
//       )}
//       {id === "updates" && <UpdatesList user={user} />}
//       {id === "documentation" && <DocumentationList user={user} />}
//       {!id && hotelID && <HotelPage id={hotelID} user={user} />}
//       {!id && airlineID && <AirlinePage id={airlineID} user={user} />}
//       {id === "reports" && <Reports user={user} />}
//     </>
//   );
// };

// export default AirlineAdminContent;
