import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useQuery } from "@apollo/client";
import FapReport from "../../Blocks/FapV2/FapReport/FapReport";
import MenuDispetcher from "../../Blocks/MenuDispetcher/MenuDispetcher";
import {
  GET_PASSENGER_REQUEST,
  GET_AIRLINE_DEPARTMENT,
  GET_DISPATCHER_DEPARTMENTS,
  getCookie,
} from "../../../../graphQL_requests";
import MUILoader from "../../Blocks/MUILoader/MUILoader";
import {
  isAirlineRole as isAirlineRoleCheck,
  isDispatcherRole as isDispatcherRoleCheck,
} from "../../../utils/access";
import classes from "../../Pages/Main_page/Main_Page.module.css";

export default function FapReportPage({ user }) {
  const { requestId, hotelIndex: hotelIndexParam } = useParams();
  const token = getCookie("token");
  const [accessMenu, setAccessMenu] = useState({});
  const isDispatcherRole = isDispatcherRoleCheck(user);
  const isAirlineRole = isAirlineRoleCheck(user);
  const dispatcherDepartmentId = user?.dispatcherDepartmentId;

  const { loading, data } = useQuery(GET_PASSENGER_REQUEST, {
    context: { headers: { Authorization: `Bearer ${token}` } },
    variables: { passengerRequestId: requestId },
  });

  const { data: airlineDepartmentData } = useQuery(GET_AIRLINE_DEPARTMENT, {
    context: { headers: { Authorization: `Bearer ${token}` } },
    variables: { airlineDepartmentId: user?.airlineDepartmentId },
    skip: !isAirlineRole || !user?.airlineDepartmentId,
  });

  const { data: dispatcherDepartmentsData } = useQuery(
    GET_DISPATCHER_DEPARTMENTS,
    {
      context: { headers: { Authorization: `Bearer ${token}` } },
      variables: { pagination: { all: true } },
      skip: !isDispatcherRole,
    }
  );

  useEffect(() => {
    if (isDispatcherRole) {
      const department =
        dispatcherDepartmentsData?.dispatcherDepartments?.departments?.find(
          (item) => item.id === dispatcherDepartmentId
        );
      setAccessMenu(department?.accessMenu || {});
      return;
    }
    if (isAirlineRole) {
      setAccessMenu(airlineDepartmentData?.airlineDepartment?.accessMenu || {});
      return;
    }
    setAccessMenu({});
  }, [isDispatcherRole, isAirlineRole, dispatcherDepartmentId, dispatcherDepartmentsData, airlineDepartmentData]);

  const request = data?.passengerRequest;

  const hotelIndex = parseInt(hotelIndexParam, 10);
  const hotel = request?.livingService?.hotels?.[hotelIndex];

  if (loading) {
    return (
      <div className={classes.main}>
        <MenuDispetcher id="fapv2" user={user} accessMenu={accessMenu} />
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <MUILoader />
        </div>
      </div>
    );
  }

  if (!request || !hotel) {
    return (
      <div className={classes.main}>
        <MenuDispetcher id="fapv2" user={user} accessMenu={accessMenu} />
        <div style={{ flex: 1, padding: 30, color: "#94A3B8" }}>
          Отчёт не найден
        </div>
      </div>
    );
  }

  return (
    <div className={classes.main}>
      <MenuDispetcher id="fapv2" user={user} accessMenu={accessMenu} />
      <FapReport request={request} hotelIndex={hotelIndex} hotelName={hotel.name || "Отель"} />
    </div>
  );
}
