import { useParams } from 'react-router-dom'

import AirlinePage from '../../Blocks/AirlinePage/AirlinePage'
import AirlinesList from '../../Blocks/AirlinesList/AirlinesList'
import Estafeta from '../../Blocks/Estafeta/Estafeta'
import HotelPage from '../../Blocks/HotelPage/HotelPage'
import HotelsList from '../../Blocks/HotelsList/HotelsList'
import Reports from '../../Blocks/Reports/Reports'
import ReportsV2 from '../../Blocks/ReportsV2/ReportsV2'
import Reserve from '../../Blocks/Reserve/Reserve'
import RepresentativeRequests from "../../Blocks/RepresentativeRequests/RepresentativeRequests";
import FapV2 from "../../Pages/FapV2/FapV2";
import Company from '../../Blocks/Company/Company'
import SupportPage from '../../Blocks/SupportPage/SupportPage'
import PatchNotesList from '../../Blocks/PatchNotesList/PatchNotesList'
import DocumentationList from '../../Blocks/DocumentationList/DocumentationList'
import UpdatesList from '../../Blocks/UpdatesList/UpdatesList'
import MyCompany from '../../Blocks/MyCompany/MyCompany'
import Analytics from '../../Pages/AnalyticsForAvia/Analytics/Analytics'
import RegisterOfContracts from '../../Blocks/RegisterOfContracts/RegisterOfContracts'
import DisAdminTransferContent from '../DispatcherAdminContent/DisAdminTransferContent/DisAdminTransferContent'
import DisAdminAutoparkContent from '../DispatcherAdminContent/DisAdminAutoparkContent/DisAdminAutoparkContent'
import PositionAccessPage from '../../Blocks/PositionAccessPage/PositionAccessPage'
import SystemNotificationsSettings from '../../Blocks/SystemUpdate/SystemNotificationsSettings'

const SuperAdminContent = ({ user }) => {
  const { id, hotelID, airlineID, orderId, driversCompanyID } = useParams()

  const isTransfer =
    id === 'orders' || !!orderId;

  const isAutopark =
    id === 'driversCompany' ||
    id === 'driversList' ||
    (!!driversCompanyID && !id);

  return (
    <>
      {(id === 'relay' || (!id && !hotelID && !airlineID && !orderId && !driversCompanyID)) && (
        <Estafeta user={user} />
      )}
      {id === 'representativeRequests' && <RepresentativeRequests user={user} />}
      {id === 'far' && <FapV2 user={user} />}
      {/* {id === 'reserve' && <Reserve user={user} />} */}
      {id === 'company' && <Company user={user} />}
      {id === 'hotels' && <HotelsList user={user} />}
      {id === 'airlines' && <AirlinesList user={user} />}
      {id === 'reports' && <Reports user={user} />}
      {id === 'reportsV2' && <ReportsV2 user={user} />}
      {id === 'analytics' && <Analytics user={user} />}
      {id === 'support' && <SupportPage user={user} />}
      {id === 'documentation' && <DocumentationList user={user} />}
      {id === 'updates' && <UpdatesList user={user} />}
      {id === 'registerOfContracts' && <RegisterOfContracts user={user} />}
      {id === 'positions' && <PositionAccessPage user={user} />}
      {id === 'myCompany' && <MyCompany user={user} />}
      {id === 'patchNotes' && <PatchNotesList user={user} />}
      {id === 'systemNotifications' && <SystemNotificationsSettings user={user} />}
      {!id && hotelID && <HotelPage id={hotelID} user={user} />}
      {!id && airlineID && <AirlinePage id={airlineID} user={user} />}
      {isTransfer && <DisAdminTransferContent user={user} />}
      {isAutopark && <DisAdminAutoparkContent user={user} />}
    </>
  )
}

export default SuperAdminContent
