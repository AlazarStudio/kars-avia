import React from "react";
import { useParams } from "react-router-dom";

import HotelPage from "../../Blocks/HotelPage/HotelPage";
import Reserve from "../../Blocks/Reserve/Reserve";
import Reports from "../../Blocks/Reports/Reports";

const HotelAdminContent = ({ user }) => {
  const { id } = useParams();

  return id === "reserveRequests" ? (
    <Reserve user={user} idHotel={user.hotelId} />
  ) : id === "reports" ? (
    <Reports user={user} />
  ) : (
    <HotelPage id={user.hotelId} user={user} />
  );
};

export default HotelAdminContent;
