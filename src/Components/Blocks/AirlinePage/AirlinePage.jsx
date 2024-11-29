import React, { useEffect, useState } from "react";
import classes from "./AirlinePage.module.css";
import Header from "../Header/Header";
import { Link, useParams } from "react-router-dom";

import { roles } from "../../../roles";
import { GET_AIRLINE } from "../../../../graphQL_requests";
import { useQuery } from "@apollo/client";
import SuperAdminAirlineContent from "../../RoleContent/SuperAdminContent/SuperAdminAirlineContent/SuperAdminAirlineContent";
import DisAdminAirlineContent from "../../RoleContent/DispatcherAdminContent/DisAdminAirlineContent/DisAdminAirlineContent";
import AirlineAdminAirlineContent from "../../RoleContent/AirlineAdminContent/AirlineAdminAirlineContent/AirlineAdminAirlineContent";

function AirlinePage({ children, id, user, ...props }) {
  let params = useParams();

  const [selectedTab, setSelectedTab] = useState(0);

  const { loading, error, data } = useQuery(GET_AIRLINE, {
    variables: { airlineId: id },
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
            {(user.role === roles.superAdmin ||
              user.role === roles.dispatcerAdmin) && (
              <Link to={`/airlines`} className={classes.backButton}>
                <img src="/arrow.png" alt="" />
              </Link>
            )}
            {data && data.airline.name}
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
              selectedTab={selectedTab}
              handleTabSelect={handleTabSelect}
            />
          </>
        )}
        {user.role == roles.airlineAdmin && (
          <AirlineAdminAirlineContent id={id} />
        )}
      </div>
    </>
  );
}

export default AirlinePage;
