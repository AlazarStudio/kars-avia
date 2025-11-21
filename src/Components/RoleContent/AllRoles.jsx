import { roles } from '../../roles.js'

import AirlineAdminContent from './AirlineAdminContent/AirlineAdminContent'
import HotelAdminContent from './HotelAdminContent/HotelAdminContent'
import DispatcherAdminContent from './DispatcherAdminContent/DispatcherAdminContent.jsx'
import SuperAdminContent from './SuperAdminContent/SuperAdminContent'
import RepresentativeAdminContent from './RepresentativeAdminContent/RepresentativeAdminContent.jsx'

const AllRoles = ({ user, accessMenu }) => {
	const roleComponents = {
		[roles.hotelAdmin]: <HotelAdminContent user={user} />,
		[roles.airlineAdmin]: <AirlineAdminContent user={user} accessMenu={accessMenu} />,
		[roles.superAdmin]: <SuperAdminContent user={user} />,
		// [roles.dispatcerAdmin]: <RepresentativeAdminContent user={user} />
		[roles.dispatcerAdmin]: <DispatcherAdminContent user={user} />
	}

	return roleComponents[user?.role] || null
}

export default AllRoles
