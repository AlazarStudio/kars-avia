import React, { useMemo } from "react";
import classes from "./Main_Page.module.css";
import MenuDispetcher from "../../Blocks/MenuDispetcher/MenuDispetcher";
import { useParams } from "react-router-dom";
import AllRoles from "../../RoleContent/AllRoles.jsx";
import { useCookies } from "../../../hooks/useCookies.jsx";
import CookiesNotice from "../../Blocks/CookiesNotice/CookiesNotice.jsx";
import { useEffectiveAccessMenu } from "../../../hooks/useEffectiveAccessMenu";

function Main_Page({ user }) {
  // Получаем параметры из URL
  const { id, hotelID, airlineID, driversCompanyID, orderId } = useParams();
  // Вычисляем текущую страницу на основе параметров
  const pageClicked = useMemo(
    () => (hotelID ? "hotels" : airlineID ? "airlines" : driversCompanyID ? "driversCompany" : orderId ? "orders" : ""),
    [hotelID, airlineID, driversCompanyID, orderId]
  );

  const accessMenu = useEffectiveAccessMenu(user);

  const { cookiesAccepted, acceptCookies, isInitialized } = useCookies()

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
