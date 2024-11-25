import React from 'react'
import { useParams } from 'react-router-dom'

import HotelPage from '../../Blocks/HotelPage/HotelPage'
import Reserve from '../../Blocks/Reserve/Reserve'

const HotelAdminContent = ({ user }) => {
	const { id } = useParams()

	return id === 'reserveRequests' ? (
		<Reserve user={user} idHotel={user.hotelId} />
	) : (
		<HotelPage id={user.hotelId} user={user} />
	)
}

export default HotelAdminContent
