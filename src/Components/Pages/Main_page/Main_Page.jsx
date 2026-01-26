import React, { useEffect, useMemo, useState } from "react";
import classes from "./Main_Page.module.css";
import MenuDispetcher from "../../Blocks/MenuDispetcher/MenuDispetcher";
import { useParams } from "react-router-dom";
import AllRoles from "../../RoleContent/AllRoles.jsx";
import {
  GET_AIRLINE_DEPARTMENT,
  GET_AIRLINES_UPDATE_SUBSCRIPTION,
  GET_DISPATCHER_DEPARTMENTS,
  getCookie,
} from "../../../../graphQL_requests.js";
import { useQuery, useSubscription } from "@apollo/client";
import { useCookies } from "../../../hooks/useCookies.jsx";
import CookiesNotice from "../../Blocks/CookiesNotice/CookiesNotice.jsx";
import { roles } from "../../../roles.js";

function Main_Page({ user }) {
  // Получаем параметры из URL
  const { id, hotelID, airlineID, driversCompanyID, orderId } = useParams();
  // Вычисляем текущую страницу на основе параметров
  const pageClicked = useMemo(
    () => (hotelID ? "hotels" : airlineID ? "airlines" : driversCompanyID ? "driversCompany" : orderId ? "orders" : ""),
    [hotelID, airlineID, driversCompanyID, orderId]
  );

  const [accessMenu, setAccessMenu] = useState({});
  const token = getCookie("token");
  const isDispatcherRole =
    user?.role === roles.dispatcerAdmin ||
    user?.role === roles.dispatcherModerator;
  const isAirlineRole =
    user?.role === roles.airlineAdmin || user?.role === roles.airlineModerator;
  const dispatcherDepartmentId = user?.dispatcherDepartmentId;
  

  const { cookiesAccepted, acceptCookies, isInitialized } = useCookies()

  // console.log(user);
  const { data: airlineDepartmentData, refetch: refetchAirlineDepartment } =
    useQuery(GET_AIRLINE_DEPARTMENT, {
      context: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
      variables: {
        airlineDepartmentId: user?.departmentId,
      },
      skip: !isAirlineRole || !user?.departmentId,
    });

  const { data: dispatcherDepartmentsData } = useQuery(
    GET_DISPATCHER_DEPARTMENTS,
    {
      context: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
      variables: {
        pagination: { all: true },
      },
      // skip: !isDispatcherRole || !dispatcherDepartmentId,
    }
  );

//   console.log(user);
//   console.log(isDispatcherRole)
// console.log(isAirlineRole)
// console.log(dispatcherDepartmentId)
console.log()
  useSubscription(GET_AIRLINES_UPDATE_SUBSCRIPTION, {
    context: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
    skip: !isAirlineRole || !user?.departmentId,
    onData: () => {
      refetchAirlineDepartment();
    },
  });

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
  }, [
    isDispatcherRole,
    isAirlineRole,
    dispatcherDepartmentId,
    dispatcherDepartmentsData,
    airlineDepartmentData,
  ]);



  return (
    <div className={classes.main}>
      {/* Меню диспетчера, которое отображается на всех страницах */}
      <MenuDispetcher id={id || pageClicked} user={user} accessMenu={accessMenu} />

      <AllRoles user={user} accessMenu={accessMenu} />
      {/* Показываем уведомление только если cookies не приняты */}
      {isInitialized && !cookiesAccepted  && (
        <CookiesNotice onAccept={acceptCookies} />
      )}
    </div>
  );
}

export default Main_Page;
