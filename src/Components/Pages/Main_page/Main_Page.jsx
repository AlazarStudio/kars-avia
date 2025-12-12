import React, { useEffect, useMemo, useState } from "react";
import classes from "./Main_Page.module.css";
import MenuDispetcher from "../../Blocks/MenuDispetcher/MenuDispetcher";
import { useParams } from "react-router-dom";
import AllRoles from "../../RoleContent/AllRoles.jsx";
import { GET_AIRLINE_DEPARTMENT, GET_AIRLINES_UPDATE_SUBSCRIPTION, getCookie } from "../../../../graphQL_requests.js";
import { useQuery, useSubscription } from "@apollo/client";
import { useCookies } from "../../../hooks/useCookies.jsx";
import CookiesNotice from "../../Blocks/CookiesNotice/CookiesNotice.jsx";

function Main_Page({ user }) {
  // Получаем параметры из URL
  const { id, hotelID, airlineID, driversCompanyID } = useParams();

  // Вычисляем текущую страницу на основе параметров
  const pageClicked = useMemo(
    () => (hotelID ? "hotels" : airlineID ? "airlines" : driversCompanyID ? "driversCompany" : ""),
    [hotelID, airlineID, driversCompanyID]
  );

  const [accessMenu, setAccessMenu] = useState({})
  const token = getCookie("token");

  const { cookiesAccepted, acceptCookies, isInitialized } = useCookies()

  // console.log(user);
  const { loading, error, data, refetch } = useQuery(GET_AIRLINE_DEPARTMENT, {
    context: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
    variables: {
      airlineDepartmentId: user?.departmentId
    },
    skip: !user?.departmentId
	});

  const { data: dataSubscriptionUpd } = useSubscription(
    GET_AIRLINES_UPDATE_SUBSCRIPTION,
    {
      context: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
      onData: () => {
        refetch();
      },
    }
  );

  useEffect(() => {
    if (data && data.airlineDepartment.accessMenu) {
      setAccessMenu(data?.airlineDepartment?.accessMenu)
    }
  }, [data, dataSubscriptionUpd])



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
