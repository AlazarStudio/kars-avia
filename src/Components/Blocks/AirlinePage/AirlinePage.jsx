import React, { useEffect, useState } from "react";
import classes from "./AirlinePage.module.css";
import Header from "../Header/Header";
import { Link, useParams } from "react-router-dom";

import { roles } from "../../../roles";
import { GET_AIRLINE, getCookie } from "../../../../graphQL_requests";
import { useQuery } from "@apollo/client";
import SuperAdminAirlineContent from "../../RoleContent/SuperAdminContent/SuperAdminAirlineContent/SuperAdminAirlineContent";
import DisAdminAirlineContent from "../../RoleContent/DispatcherAdminContent/DisAdminAirlineContent/DisAdminAirlineContent";
import AirlineAdminAirlineContent from "../../RoleContent/AirlineAdminContent/AirlineAdminAirlineContent/AirlineAdminAirlineContent";

function AirlinePage({ children, id, user, accessMenu, ...props }) {
  let params = useParams();
  const token = getCookie("token");

  const [selectedTab, setSelectedTab] = useState(0);

  const { loading, error, data } = useQuery(GET_AIRLINE, {
    context: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
    variables: { airlineId: id },
    skip: !id,
  });

  useEffect(() => {
    const savedTab = localStorage.getItem("selectedAirlineTab");
    if (savedTab !== null) {
      setSelectedTab(parseInt(savedTab, 10));
    }
  }, []);

  const handleTabSelect = (index) => {
    setSelectedTab(index);
    localStorage.setItem("selectedAirlineTab", index);
  };

  const getTitle = () => {
    if (user.role === roles.airlineAdmin) {
      switch (params.id) {
        case "airlineStaff":
          return "Сотрудники";
        case "airlineCompany":
          return "Пользователи";
        case "airlineAbout":
          return "Об авиакомпании";
        case "airlineRegisterOfContracts":
          return "Реестр договоров";
        default:
          return "Пользователи";
      }
    } else {
      return data?.airline?.name;
    }
  };

  return (
    <>
      <div className={classes.section}>
        <Header>
          <div className={classes.titleHeader}>
            {(user.role === roles.superAdmin ||
              user.role === roles.dispatcerAdmin) && (
              <Link to={"/airlines"} className={classes.backButton}>
                <img src="/arrow.png" alt="" />
              </Link>
            )}
            {getTitle()}
            {/* {data && data.airline.name} */}
          </div>
        </Header>

        {user.role === roles.superAdmin && (
          <>
            <SuperAdminAirlineContent
              id={id}
              selectedTab={selectedTab}
              handleTabSelect={handleTabSelect}
            />
          </>
        )}

        {user.role === roles.dispatcerAdmin && (
          <>
            <DisAdminAirlineContent
              id={id}
              user={user}
              selectedTab={selectedTab}
              handleTabSelect={handleTabSelect}
            />
          </>
        )}
        {user.role == roles.airlineAdmin && (
          <AirlineAdminAirlineContent id={id} user={user} accessMenu={accessMenu} />
        )}
      </div>
    </>
  );
}

export default AirlinePage;
