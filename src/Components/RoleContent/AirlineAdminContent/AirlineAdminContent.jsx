import React from 'react'
import { useParams } from 'react-router-dom'

import AirlinePage from '../../Blocks/AirlinePage/AirlinePage'
import Estafeta from '../../Blocks/Estafeta/Estafeta'
import HotelPage from '../../Blocks/HotelPage/HotelPage'
import HotelsList from '../../Blocks/HotelsList/HotelsList'
import Reserve from '../../Blocks/Reserve/Reserve'

const AirlineAdminContent = ({ user }) => {
	const { id, hotelID, airlineID } = useParams()

	return (
		<>
			{(id === 'relay' || (!id && !hotelID && !airlineID)) && (
				<Estafeta user={user} />
			)}
			{id === 'reserve' && <Reserve user={user} />}
			{id === 'hotels' && <HotelsList user={user} />}
			{(id === 'airlineCompany' ||
				id === 'airlineStaff' ||
				id === 'airlineAbout') && (
				<AirlinePage id={user.airlineId} user={user} />
			)}
			{!id && hotelID && <HotelPage id={hotelID} user={user} />}
			{!id && airlineID && <AirlinePage id={airlineID} user={user} />}
		</>
	)
}

export default AirlineAdminContent
