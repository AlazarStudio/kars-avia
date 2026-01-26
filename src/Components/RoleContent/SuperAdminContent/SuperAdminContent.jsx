import { useParams } from 'react-router-dom'

import AirlinePage from '../../Blocks/AirlinePage/AirlinePage'
import AirlinesList from '../../Blocks/AirlinesList/AirlinesList'
import Estafeta from '../../Blocks/Estafeta/Estafeta'
import HotelPage from '../../Blocks/HotelPage/HotelPage'
import HotelsList from '../../Blocks/HotelsList/HotelsList'
import Reports from '../../Blocks/Reports/Reports'
import Reserve from '../../Blocks/Reserve/Reserve'
import Company from '../../Blocks/Сompany/Сompany'
import SupportPage from '../../Blocks/SupportPage/SupportPage'
import PatchNotesList from '../../Blocks/PatchNotesList/PatchNotesList'
import DocumentationList from '../../Blocks/DocumentationList/DocumentationList'
import UpdatesList from '../../Blocks/UpdatesList/UpdatesList'
import MyCompany from '../../Blocks/MyCompany/MyCompany'
import Analytics from '../../Pages/AnalyticsForAvia/Analytics/Analytics'
import RegisterOfContracts from '../../Blocks/RegisterOfContracts/RegisterOfContracts'
import AccessSettings from '../../Blocks/AccessSettings/AccessSettings'
import DisAdminTransferContent from '../DispatcherAdminContent/DisAdminTransferContent/DisAdminTransferContent'
import DispatcherAccessSettings from '../../Blocks/DispatcherAccessSettings/DispatcherAccessSettings'

const SuperAdminContent = ({ user }) => {
  const { id, hotelID, airlineID, orderId, driversCompanyID } = useParams()

  const isTransfer =
    id === 'orders' ||
    id === 'driversCompany' ||
    id === 'driversList' ||
    id === 'transerDispatchers' ||
    !!orderId ||
    (!!driversCompanyID && !id)

  return (
    <>
      {(id === 'relay' || (!id && !hotelID && !airlineID && !orderId && !driversCompanyID)) && (
        <Estafeta user={user} />
      )}
      {id === 'reserve' && <Reserve user={user} />}
      {id === 'company' && <Company user={user} />}
      {id === 'hotels' && <HotelsList user={user} />}
      {id === 'airlines' && <AirlinesList user={user} />}
      {id === 'reports' && <Reports user={user} />}
      {id === 'analytics' && <Analytics user={user} />}
      {id === 'support' && <SupportPage user={user} />}
      {id === 'documentation' && <DocumentationList user={user} />}
      {id === 'updates' && <UpdatesList user={user} />}
      {id === 'registerOfContracts' && <RegisterOfContracts user={user} />}
      {id === 'access' && <AccessSettings user={user} />}
      {id === 'dispatcherAccess' && <DispatcherAccessSettings user={user} />}
      {id === 'myCompany' && <MyCompany user={user} />}
      {id === 'patchNotes' && <PatchNotesList user={user} />}
      {!id && hotelID && <HotelPage id={hotelID} user={user} />}
      {!id && airlineID && <AirlinePage id={airlineID} user={user} />}
      {isTransfer && <DisAdminTransferContent user={user} />}
    </>
  )
}

export default SuperAdminContent
