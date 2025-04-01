import React, { useMemo } from "react";
import classes from "./Main_Page.module.css";
import MenuDispetcher from "../../Blocks/MenuDispetcher/MenuDispetcher";
import { useParams } from "react-router-dom";
import AllRoles from "../../RoleContent/AllRoles.jsx";

function Main_Page({ user }) {
  // Получаем параметры из URL
  const { id, hotelID, airlineID } = useParams();

  // Вычисляем текущую страницу на основе параметров
  const pageClicked = useMemo(
    () => (hotelID ? "hotels" : airlineID ? "airlines" : ""),
    [hotelID, airlineID]
  );

  return (
    <div className={classes.main}>
      {/* Меню диспетчера, которое отображается на всех страницах */}
      <MenuDispetcher id={id || pageClicked} user={user} />

      <AllRoles user={user} />
    </div>
  );
}

export default Main_Page;
