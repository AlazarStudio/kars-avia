import { useParams } from 'react-router-dom'

import AirlinePage from '../../Blocks/AirlinePage/AirlinePage'
import AirlinesList from '../../Blocks/AirlinesList/AirlinesList'
import Estafeta from '../../Blocks/Estafeta/Estafeta'
import HotelPage from '../../Blocks/HotelPage/HotelPage'
import HotelsList from '../../Blocks/HotelsList/HotelsList'
import Reports from '../../Blocks/Reports/Reports'
import Reserve from '../../Blocks/Reserve/Reserve'
import Company from '../../Blocks/Сompany/Сompany'

const SuperAdminContent = ({ user }) => {
	const { id, hotelID, airlineID } = useParams()

	return (
		<>
			{(id === 'relay' || (!id && !hotelID && !airlineID)) && (
				<Estafeta user={user} />
			)}
			{id === 'reserve' && <Reserve user={user} />}
			{id === 'company' && <Company user={user} />}
			{id === 'hotels' && <HotelsList user={user} />}
			{id === 'airlines' && <AirlinesList user={user} />}
			{id === 'reports' && <Reports user={user} />}
			{!id && hotelID && <HotelPage id={hotelID} user={user} />}
			{!id && airlineID && <AirlinePage id={airlineID} user={user} />}
		</>
	)
}

export default SuperAdminContent
