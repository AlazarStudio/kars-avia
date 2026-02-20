import React, { useEffect, useState } from "react";
import classes from "./DriversCompanyPage.module.css";
import Header from "../Header/Header";
import { Link, useParams } from "react-router-dom";

import { roles } from "../../../roles";
import { GET_AIRLINE, GET_ORGANIZATION, getCookie } from "../../../../graphQL_requests";
import { useQuery } from "@apollo/client";
import SuperAdminAirlineContent from "../../RoleContent/SuperAdminContent/SuperAdminAirlineContent/SuperAdminAirlineContent";
import DisAdminAirlineContent from "../../RoleContent/DispatcherAdminContent/DisAdminAirlineContent/DisAdminAirlineContent";
import AirlineAdminAirlineContent from "../../RoleContent/AirlineAdminContent/AirlineAdminAirlineContent/AirlineAdminAirlineContent";
import TransferAdminDriversContent from "../../RoleContent/TransferAdminContent/TransferAdminDriversContent/TransferAdminDriversContent";

function DriversCompanyPage({ children, id, user, accessMenu, ...props }) {
  let params = useParams();
  const token = getCookie("token");

  const [selectedTab, setSelectedTab] = useState(0);

  const { loading, error, data } = useQuery(GET_ORGANIZATION, {
    context: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
    variables: { organizationId: id },
    skip: !id,
  });

  useEffect(() => {
    const savedTab = localStorage.getItem("selectedDriversCompanyTab");
    if (savedTab !== null) {
      setSelectedTab(parseInt(savedTab, 10));
    }
  }, []);

  const handleTabSelect = (index) => {
    setSelectedTab(index);
    localStorage.setItem("selectedDriversCompanyTab", index);
  };

  const getTitle = () => {
    if (user.role === roles.airlineAdmin) {
      switch (params.id) {
        case "driversCompany":
          return "Водители";
        case "driversCompanyAbout":
          return "Об организации";
        case "driversCompanyRegisterOfContracts":
          return "Реестр договоров";
        default:
          return "Пользователи";
      }
    } else {
      // return "Организация";
      return data?.organization?.name;
    }
  };
  return (
    <>
      <div className={classes.section}>
        <Header>
          <div className={classes.titleHeader}>
            {(user.role === roles.superAdmin ||
              user.role === roles.dispatcerAdmin) && (
              <Link to={"/driversCompany"} className={classes.backButton}>
                <img src="/arrow.png" alt="" />
              </Link>
            )}
            {getTitle()}
            {/* {data && data.airline.name} */}
          </div>
        </Header>

        {user.role === roles.superAdmin && (
          <>
            <TransferAdminDriversContent
              id={id}
              user={user}
              accessMenu={accessMenu}
              selectedTab={selectedTab}
              handleTabSelect={handleTabSelect}
            />
          </>
        )}

        {user.role === roles.dispatcerAdmin && (
          <>
            <TransferAdminDriversContent
              id={id}
              user={user}
              accessMenu={accessMenu}
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

export default DriversCompanyPage;
