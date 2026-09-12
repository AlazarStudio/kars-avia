import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import MenuDispetcher from "../../Blocks/MenuDispetcher/MenuDispetcher";
import MUILoader from "../../Blocks/MUILoader/MUILoader";
import FapRegistries from "../../Blocks/FapV2/FapRegistries/FapRegistries";
import { isExternalUser, isHotelScoped } from "../../../utils/access";
import { useEffectiveAccessMenu } from "../../../hooks/useEffectiveAccessMenu";
import classes from "../Main_page/Main_Page.module.css";

// Раскладка — как FapLayout: меню + содержимое. Гостиничному и внешнему субъекту
// реестры недоступны (багаж от гостиницы скрыт целиком, воду и питание она не
// оказывает): редирект + рендер-гейт, чтобы ничего не мелькнуло до navigate.
export default function FapRegistriesPage({ user }) {
  const navigate = useNavigate();
  const accessMenu = useEffectiveAccessMenu(user);
  const denied = isHotelScoped(user) || isExternalUser(user);

  useEffect(() => {
    if (denied) navigate("/far", { replace: true });
  }, [denied, navigate]);

  return (
    <div className={classes.main}>
      {!isExternalUser(user) && (
        <MenuDispetcher id="far" user={user} accessMenu={accessMenu} />
      )}
      {denied ? <MUILoader /> : <FapRegistries user={user} accessMenu={accessMenu} />}
    </div>
  );
}
