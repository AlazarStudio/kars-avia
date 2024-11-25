import { roles } from "../../roles";
import AirlineAdminContent from "./AirlineAdminContent/AirlineAdminContent";
import HotelAdminContent from "./HotelAdminContent/HotelAdminContent";
import DispatcherAdminContent from "./SuperAdminContent/DispatcherAdminContent";
import SuperAdminContent from "./SuperAdminContent/SuperAdminContent";

const AllRoles = ({ user }) => {
  const roleComponents = {
    [roles.hotelAdmin]: <HotelAdminContent user={user} />,
    [roles.airlineAdmin]: <AirlineAdminContent user={user} />,
    [roles.superAdmin]: <SuperAdminContent user={user} />,
    [roles.dispatcerAdmin]: <DispatcherAdminContent user={user} />,
  };

  return roleComponents[user?.role] || null;
};

export default AllRoles;
