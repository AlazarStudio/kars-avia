import { useQuery } from "@apollo/client";
import React, { useEffect, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";

import { GET_HOTEL_NAME, GET_HOTEL_USERS, getCookie } from "../../../../graphQL_requests.js";
import { roles } from "../../../roles.js";
import {
  isAirlineAdmin,
  isDispatcherAdmin,
  isSuperAdmin,
} from "../../../utils/access";
import HotelAdminHotelContent from "../../RoleContent/HotelAdminContent/HotelAdminHotelContent/HotelAdminHotelContent.jsx";
import SDAdminHotelContent from "../../RoleContent/SuperAdminContent/SuperAdminHotelContent/SuperAdminHotelContent.jsx";
import Header from "../Header/Header";
import HotelAbout_tabComponent from "../HotelAbout_tabComponent/HotelAbout_tabComponent";

import classes from "./HotelPage.module.css";
import SuperAdminHotelContent from "../../RoleContent/SuperAdminContent/SuperAdminHotelContent/SuperAdminHotelContent.jsx";
import DisAdminHotelContent from "../../RoleContent/DispatcherAdminContent/DisAdminHotelContent/DisAdminHotelContent.jsx";
import AirlineAdminHotelContent from "../../RoleContent/AirlineAdminContent/AirlineAdminHotelContent/AirlineAdminHotelContent.jsx";
import HotelReadinessIndicator from "../HotelReadinessIndicator/HotelReadinessIndicator";

function HotelPage({ children, id, user, accessMenu = {}, ...props }) {
  const params = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const token = getCookie("token");

  const [selectedTab, setSelectedTab] = useState(0);

  const { loading, error, data } = useQuery(GET_HOTEL_NAME, {
    context: { headers: { Authorization: `Bearer ${token}` } },
    variables: { hotelId: id },
    skip: !id,
  });

  const { data: usersData } = useQuery(GET_HOTEL_USERS, {
    context: { headers: { Authorization: `Bearer ${token}` } },
    variables: { hotelId: id },
    skip: !id || (!isSuperAdmin(user) && !isDispatcherAdmin(user)),
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

  // Функция для определения заголовка
  const getTitle = () => {
    if (user.role === roles.hotelAdmin) {
      switch (params.id) {
        case "hotelChess":
          return "Шахматка";
        case "hotelRooms":
          return "Номерной фонд";
        case "hotelCompany":
          return "Пользователи";
        case "hotelAbout":
          return "О гостинице";
        case "hotelTarifs":
          return "Тарифы";
        case "hotelRegisterOfContracts":
          return "Реестр договоров";
        case "hotelSettings":
          return "Настройки гостиницы";
        default:
          return "Шахматка";
      }
    } else {
      return data?.hotel?.name;
    }
  };

  const handleBack = (e) => {
    if (params.requestId) return; // обычный Link на /relay со state
    e.preventDefault();
    // Если в этой сессии есть история навигации внутри SPA — идём назад,
    // чтобы сохранились URL-параметры фильтра из списка гостиниц.
    if (location.key !== "default") {
      navigate(-1);
    } else {
      navigate("/hotels");
    }
  };

  const backProps = params.requestId
    ? { to: "/relay", state: { requestId: params.requestId } }
    : { to: "/hotels", onClick: handleBack };

  return (
    <>
      <div className={classes.section}>
        <Header>
          <div className={classes.titleHeader}>
            {(isSuperAdmin(user) ||
              isAirlineAdmin(user) ||
              // user.role == roles.hotelAdmin ||
              isDispatcherAdmin(user)) && (
              // <Link to={params.requestId ? `/relay` : `/hotels`} className={classes.backButton}>
              //   <img src="/arrow.png" alt="" />
              // </Link>
              <Link {...backProps} className={classes.backButton}>
                <img src="/arrow.png" alt="" />
              </Link>
            )}
            {getTitle()}
            {data?.hotel && (isSuperAdmin(user) || isDispatcherAdmin(user)) && (
              <HotelReadinessIndicator hotel={{ ...data.hotel, _users: usersData?.hotelUsers?.users }} />
            )}
          </div>
        </Header>

        {isSuperAdmin(user) && (
          <>
            <SuperAdminHotelContent
              id={id}
              user={user}
              selectedTab={selectedTab}
              handleTabSelect={handleTabSelect}
            />
          </>
        )}
        {isDispatcherAdmin(user) && (
          <>
            <DisAdminHotelContent
              id={id}
              user={user}
              selectedTab={selectedTab}
              handleTabSelect={handleTabSelect}
              type={data?.hotel?.type}
              accessMenu={accessMenu}
            />
          </>
        )}
        {user.role == roles.hotelAdmin && (
          <HotelAdminHotelContent id={id} user={user} />
        )}
        {isAirlineAdmin(user) && (
          <>
            <AirlineAdminHotelContent id={id} />
          </>
        )}
      </div>
    </>
  );
}

export default HotelPage;
