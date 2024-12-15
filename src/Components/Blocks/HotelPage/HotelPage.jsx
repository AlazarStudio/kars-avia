import { useQuery } from "@apollo/client";
import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

import { GET_HOTEL_NAME } from "../../../../graphQL_requests.js";
import { roles } from "../../../roles.js";
import HotelAdminHotelContent from "../../RoleContent/HotelAdminContent/HotelAdminHotelContent/HotelAdminHotelContent.jsx";
import SDAdminHotelContent from "../../RoleContent/SuperAdminContent/SuperAdminHotelContent/SuperAdminHotelContent.jsx";
import Header from "../Header/Header";
import HotelAbout_tabComponent from "../HotelAbout_tabComponent/HotelAbout_tabComponent";

import classes from "./HotelPage.module.css";
import SuperAdminHotelContent from "../../RoleContent/SuperAdminContent/SuperAdminHotelContent/SuperAdminHotelContent.jsx";
import DisAdminHotelContent from "../../RoleContent/DispatcherAdminContent/DisAdminHotelContent/DisAdminHotelContent.jsx";
import AirlineAdminHotelContent from "../../RoleContent/AirlineAdminContent/AirlineAdminHotelContent/AirlineAdminHotelContent.jsx";

function HotelPage({ children, id, user, ...props }) {
  let params = useParams();

  const [selectedTab, setSelectedTab] = useState(0);

  const { loading, error, data } = useQuery(GET_HOTEL_NAME, {
    variables: { hotelId: id },
  });

  useEffect(() => {
    const savedTab = localStorage.getItem("selectedTab");
    if (savedTab !== null) {
      setSelectedTab(parseInt(savedTab, 10));
    }
  }, []);

  const handleTabSelect = (index) => {
    setSelectedTab(index);
    localStorage.setItem("selectedTab", index);
  };
  return (
    <>
      <div className={classes.section}>
        <Header>
          <div className={classes.titleHeader}>
            {(user.role == roles.superAdmin ||
              user.role == roles.airlineAdmin ||
              user.role == roles.dispatcerAdmin) && (
                <Link to={params.requestId ? `/relay` : `/hotels`} className={classes.backButton}>
                  <img src="/arrow.png" alt="" />
                </Link>
              )}
            {data && data.hotel.name}
          </div>
        </Header>

        {user.role == roles.superAdmin && (
          <>
            <SuperAdminHotelContent
              id={id}
              user={user}
              selectedTab={selectedTab}
              handleTabSelect={handleTabSelect}
            />
          </>
        )}
        {user.role == roles.dispatcerAdmin && (
          <>
            <DisAdminHotelContent
              id={id}
              user={user}
              selectedTab={selectedTab}
              handleTabSelect={handleTabSelect}
            />
          </>
        )}
        {user.role == roles.hotelAdmin && (
          <HotelAdminHotelContent id={id} user={user} />
        )}
        {user.role == roles.airlineAdmin && (
          <>
            <AirlineAdminHotelContent id={id} />
          </>
        )}
      </div>
    </>
  );
}

export default HotelPage;
