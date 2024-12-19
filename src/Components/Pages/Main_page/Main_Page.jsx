import React, { useMemo } from "react";
import classes from "./Main_Page.module.css";
import MenuDispetcher from "../../Blocks/MenuDispetcher/MenuDispetcher";
import Estafeta from "../../Blocks/Estafeta/Estafeta";
import { useParams } from "react-router-dom";
import Reserve from "../../Blocks/Reserve/Reserve";
import Сompany from "../../Blocks/Сompany/Сompany";
import HotelsList from "../../Blocks/HotelsList/HotelsList";
import HotelPage from "../../Blocks/HotelPage/HotelPage";
import AirlinesList from "../../Blocks/AirlinesList/AirlinesList";
import AirlinePage from "../../Blocks/AirlinePage/AirlinePage";
import Reports from "../../Blocks/Reports/Reports";
import Login from "../Login/Login";
import { getCookie } from "../../../../graphQL_requests.js";
import AllRoles from "../../RoleContent/AllRoles.jsx";

function Main_Page({ user }) {
  // Получаем параметры из URL
  const { id, hotelID, airlineID } = useParams();

  // Вычисляем текущую страницу на основе параметров
  const pageClicked = useMemo(
    () => (hotelID ? "hotels" : airlineID ? "airlines" : ""),
    [hotelID, airlineID]
  );

  // console.log(user)

  return (
    <div className={classes.main}>
      {/* Меню диспетчера, которое отображается на всех страницах */}
      <MenuDispetcher id={id || pageClicked} user={user} />

      <AllRoles user={user} />
    </div>
  );
}

export default Main_Page;
