import { lazy, Suspense } from "react";
import { useParams } from "react-router-dom";

import AirlinePage from "../../Blocks/AirlinePage/AirlinePage";
import AirlinesList from "../../Blocks/AirlinesList/AirlinesList";
import HotelPage from "../../Blocks/HotelPage/HotelPage";
import HotelsList from "../../Blocks/HotelsList/HotelsList";
import Reports from "../../Blocks/Reports/Reports";
import DocumentationList from "../../Blocks/DocumentationList/DocumentationList";
import PatchNotesList from "../../Blocks/PatchNotesList/PatchNotesList";
import UpdatesList from "../../Blocks/UpdatesList/UpdatesList";
import RegisterOfContracts from "../../Blocks/RegisterOfContracts/RegisterOfContracts";
import MyCompany from "../../Blocks/MyCompany/MyCompany";
import Analytics from "../../Pages/AnalyticsForAvia/Analytics/Analytics";
import AccessSettings from "../../Blocks/AccessSettings/AccessSettings";
import NotificationsSettings from "../../Blocks/NotificationsSettings/NotificationsSettings";
import DriversCompanyList from "../../Blocks/DriversCompanyList/DriversCompanyList";
import DriversCompanyPage from "../../Blocks/DriversCompanyPage/DriversCompanyPage";
import DriversList from "../../Blocks/DriversList/DriversList";
import MUILoader from "../../Blocks/MUILoader/MUILoader";

const TransferOrders = lazy(() =>
  import("../../Blocks/TransferOrders/TransferOrders")
);
const TransferOrder = lazy(() =>
  import("../../Blocks/TransferOrder/TransferOrder")
);

const TransferAdminContent = ({ user }) => {
  const { id, hotelID, airlineID, orderId, driversCompanyID } = useParams();

  return (
    <>
      {(id === "orders" || (!id && !hotelID && !airlineID && !orderId && !driversCompanyID)) && (
        <Suspense fallback={<MUILoader fullHeight="100vh" />}>
          <TransferOrders user={user} />
        </Suspense>
      )}

      {/* детальная страница заказа */}
      {orderId && (
        <Suspense fallback={<MUILoader fullHeight="100vh" />}>
          <TransferOrder user={user} />
        </Suspense>
      )}

      {id === "driversCompany" && <DriversCompanyList user={user} />}
      {id === "driversList" && <DriversList user={user} />}
      {/* {id === "drivers" && <DriversCompany user={user} />} */}
      {/* {id === "hotels" && <HotelsList user={user} />}
      {id === "airlines" && <AirlinesList user={user} />}
      {id === "registerOfContracts" && <RegisterOfContracts user={user} />} */}
      {id === "reports" && <Reports user={user} />}
      {id === "analytics" && <Analytics user={user} />}
      {/* {id === "documentation" && <DocumentationList user={user} />} */}
      {/* {id === "updates" && <UpdatesList user={user} />} */}
      {/* {id === "myCompany" && <MyCompany user={user} />} */}
      {/* {id === "patchNotes" && <PatchNotesList user={user} />} */}
      {/* {id === "access" && <AccessSettings user={user} />} */}
      {/* {id === "notifications" && <NotificationsSettings user={user} />} */}
      {/* {!id && hotelID && <HotelPage id={hotelID} user={user} />} */}
      {/* {!id && airlineID && <AirlinePage id={airlineID} user={user} />} */}
      {!id && driversCompanyID && <DriversCompanyPage id={driversCompanyID} user={user} />}
    </>
  );
};

export default TransferAdminContent;
