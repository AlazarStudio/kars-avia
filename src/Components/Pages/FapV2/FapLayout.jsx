import React from "react";
import { Outlet } from "react-router-dom";
import MenuDispetcher from "../../Blocks/MenuDispetcher/MenuDispetcher";
import { isExternalUser } from "../../../utils/access";
import { useEffectiveAccessMenu } from "../../../hooks/useEffectiveAccessMenu";
import classes from "../../Pages/Main_page/Main_Page.module.css";

// Общий layout для всех страниц ФАП v2 (деталь / услуга / отчёт).
// Меню рендерится один раз, при навигации меняется только Outlet —
// раскладка не перемонтируется, нет моргания при переходах.
export default function FapLayout({ user }) {
  const accessMenu = useEffectiveAccessMenu(user);

  return (
    <div className={classes.main}>
      {!isExternalUser(user) && (
        <MenuDispetcher id="far" user={user} accessMenu={accessMenu} />
      )}
      <Outlet context={{ user, accessMenu }} />
    </div>
  );
}
