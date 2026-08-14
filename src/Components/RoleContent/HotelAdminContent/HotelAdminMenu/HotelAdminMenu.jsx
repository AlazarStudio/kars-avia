import { Link } from "react-router-dom";

import classes from "./HotelAdminMenu.module.css";
import DelayedText from "../../../Blocks/DelayedText/DelayedText";
import MenuNavIcons from "../../../../shared/icons/menuNavIcons";

const HotelAdminMenu = ({ id, menuOpen }) => {
  const isDefault = id == undefined || !id;

  const groups = [
    {
      title: "Заявки",
      items: [
        { label: "ФАП", to: "/far", icon: MenuNavIcons.fapShield, active: id == "far" },
      ],
    },
    {
      title: "Размещение",
      items: [
        { label: "Шахматка", to: "/hotelChess", icon: MenuNavIcons.chess, active: id == "hotelChess" || isDefault },
        { label: "Тарифы", to: "/hotelTarifs", icon: MenuNavIcons.tarifs, active: id == "hotelTarifs" },
        { label: "Номерной фонд", to: "/hotelRooms", icon: MenuNavIcons.rooms, active: id == "hotelRooms" },
      ],
    },
    {
      title: "Компания",
      items: [
        { label: "Пользователи", to: "/hotelCompany", icon: MenuNavIcons.users, active: id == "hotelCompany" },
        { label: "О гостинице", to: "/hotelAbout", icon: MenuNavIcons.hotels, active: id == "hotelAbout" },
        { label: "Настройки", to: "/hotelSettings", icon: MenuNavIcons.hotels, active: id == "hotelSettings" },
      ],
    },
    {
      title: "Документы",
      items: [
        { label: "Реестр договоров", to: "/hotelRegisterOfContracts", icon: MenuNavIcons.contracts, active: id == "hotelRegisterOfContracts" },
        { label: "Отчеты", to: "/reports", icon: MenuNavIcons.reports, active: id == "reports" },
      ],
    },
    {
      title: "Сервис",
      items: [
        { label: "Помощь", to: "/documentation", icon: MenuNavIcons.help, active: id == "documentation" },
      ],
    },
  ];

  return (
    <div className={classes.menuContainer}>
      <div className={classes.menuMain}>
        {groups.map((group, gi) => (
          <div className={classes.group} key={group.title}>
            {menuOpen ? (
              <div className={classes.groupHeader}>{group.title}</div>
            ) : (
              gi > 0 && <div className={classes.groupDivider} />
            )}
            {group.items.map((it) => (
              <Link
                key={it.to}
                to={it.to}
                className={`${classes.menu_items__elem} ${!menuOpen ? classes.jcc : ""} ${it.active ? classes.menu_items__activeElem : ""}`}
              >
                <div className={classes.svgWrapper}>{it.icon}</div>
                <DelayedText show={menuOpen} delay={200}>
                  {it.label}
                </DelayedText>
                {!menuOpen && <span className={classes.tooltip}>{it.label}</span>}
              </Link>
            ))}
          </div>
        ))}
      </div>
      <div
        className={classes.bottomMenu}
        style={menuOpen ? {} : { display: "flex", flexDirection: "column", flex: 1, justifyContent: "flex-end" }}
      >
        <Link
          className={`${classes.alazar} ${!menuOpen ? classes.jcc : ""} ${id == "patchNotes" ? classes.menu_items__activeElem___bottom : ""} ${classes.menuLink}`}
          style={menuOpen ? {} : { padding: 0 }}
        >
          ver 4.3.0
        </Link>
        <div
          className={classes.alazar}
          style={menuOpen ? {} : { display: "none", padding: 0, flexWrap: "wrap", fontSize: "12px" }}
        >
          Powered by{" "}
          <a rel="noreferrer" className={classes.menuLink}>Alazar studio</a>
        </div>
      </div>
    </div>
  );
};

export default HotelAdminMenu;
