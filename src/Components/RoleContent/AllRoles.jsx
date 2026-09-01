import { roles } from "../../roles.js";
import { isAirlineAdmin, isDispatcherAdmin } from "../../utils/access";

import AirlineAdminContent from './AirlineAdminContent/AirlineAdminContent'
import HotelAdminContent from './HotelAdminContent/HotelAdminContent'
import DispatcherAdminContent from './DispatcherAdminContent/DispatcherAdminContent.jsx'
import SuperAdminContent from './SuperAdminContent/SuperAdminContent'

const AllRoles = ({ user, accessMenu }) => {
  if (!user?.role) return null;

  if (user.role === roles.hotelAdmin) {
    return <HotelAdminContent user={user} />;
  }

  if (isAirlineAdmin(user)) {
    return <AirlineAdminContent user={user} accessMenu={accessMenu} />;
  }

  if (user.role === roles.superAdmin) {
    return <SuperAdminContent user={user} />;
  }

  if (isDispatcherAdmin(user)) {
    return <DispatcherAdminContent user={user} accessMenu={accessMenu} />;
  }

  return null;
};

export default AllRoles;
