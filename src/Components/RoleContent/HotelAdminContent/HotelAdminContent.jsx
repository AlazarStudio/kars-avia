import React from "react";
import { useParams } from "react-router-dom";

import HotelPage from "../../Blocks/HotelPage/HotelPage";
import Reserve from "../../Blocks/Reserve/Reserve";
import Reports from "../../Blocks/Reports/Reports";
// import HotelTarifs_tabComponent from "../../Blocks/HotelTarifs_tabComponent/HotelTarifs_tabComponent";

const HotelAdminContent = ({ user }) => {
  const { id } = useParams();

  return id === "reserveRequests" ? (
    <Reserve user={user} idHotel={user.hotelId} />
  ) : id === "reports" ? (
    <Reports user={user} />
  ) 
  // :
  // id === "hotelTarifs" ? (
  //   <HotelTarifs_tabComponent id={user.hotelId} user={user} />
  // )
  :(
    <HotelPage id={user.hotelId} user={user} />
  );
};

export default HotelAdminContent;
