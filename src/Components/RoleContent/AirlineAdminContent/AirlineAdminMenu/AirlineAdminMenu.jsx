import { Link } from "react-router-dom";

import classes from "./AirlineAdminMenu.module.css";
import DelayedText from "../../../Blocks/DelayedText/DelayedText";
import {
  hasAccessMenu,
  safeAccessMenu as getSafeAccessMenu,
} from "../../../../utils/access";
import MenuNavIcons from "../../../../shared/icons/menuNavIcons";

const AirlineAdminMenu = ({
  id,
  allCreatedRequests,
  fapCreatedCount = 0,
  transferPendingCount = 0,
  menuOpen,
  accessMenu,
  user,
}) => {
  const safeAccessMenu = getSafeAccessMenu(accessMenu);
  const isDefault = id == undefined || !id;

  const groups = [
    {
      title: "Заявки",
      items: [
        hasAccessMenu(accessMenu, "requestMenu") && {
          label: "Эскадрилья", to: "/relay", icon: MenuNavIcons.relay,
          badge: allCreatedRequests, active: id == "relay" || isDefault,
        },
        hasAccessMenu(accessMenu, "reserveMenu") && {
          label: "ФАП", to: "/far", icon: MenuNavIcons.fapShield,
          badge: fapCreatedCount,
          active: id == "far" || (isDefault && safeAccessMenu.requestMenu === false),
        },
        hasAccessMenu(accessMenu, "transferMenu") && {
          label: "Трансфер", to: "/orders", icon: MenuNavIcons.transfer,
          badge: transferPendingCount, active: id == "orders",
        },
      ],
    },
    {
      title: "Размещение",
      items: [
        { label: "Гостиницы", to: "/hotels", icon: MenuNavIcons.hotels, active: id == "hotels" },
      ],
    },
    {
      title: "Моя компания",
      items: [
        hasAccessMenu(accessMenu, "userMenu") && {
          label: "Пользователи", to: "/airlineCompany", icon: MenuNavIcons.users,
          active: id == "airlineCompany" || id == "access" || id == "notifications",
        },
        hasAccessMenu(accessMenu, "personalMenu") && {
          label: "Сотрудники", to: "/airlineStaff", icon: MenuNavIcons.staff,
          active: id == "airlineStaff",
        },
        hasAccessMenu(accessMenu, "airlineMenu") && {
          label: "Об авиакомпании", to: "/airlineAbout", icon: MenuNavIcons.airlines,
          active: id == "airlineAbout",
        },
      ],
    },
    {
      title: "Аналитика",
      items: [
        hasAccessMenu(accessMenu, "reportMenu") && {
          label: "Отчеты", to: "/reports", icon: MenuNavIcons.reports, active: id == "reports",
        },
        hasAccessMenu(accessMenu, "analyticsMenu") && {
          label: "Аналитика", to: "/analytics", icon: MenuNavIcons.analytics, fill: true, active: id == "analytics",
        },
      ],
    },
    {
      title: "Сервис",
      items: [
        { label: "Помощь", to: "/documentation", icon: MenuNavIcons.help, active: id == "documentation" },
      ],
    },
  ]
    .map((g) => ({ ...g, items: g.items.filter(Boolean) }))
    .filter((g) => g.items.length > 0);

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
            {group.items.map((it) => {
              const elemClass = it.fill ? classes.menu_items__elem___fill : classes.menu_items__elem;
              const activeClass = it.fill ? classes.menu_items__activeElem___fill : classes.menu_items__activeElem;
              return (
                <Link
                  key={it.to}
                  to={it.to}
                  className={`${elemClass} ${!menuOpen ? classes.jcc : ""} ${it.active ? activeClass : ""}`}
                >
                  <div className={classes.svgWrapper}>{it.icon}</div>
                  <DelayedText show={menuOpen} delay={200}>
                    {it.label}
                  </DelayedText>
                  {it.badge > 0 && (
                    <div className={`${classes.countRequests} ${!menuOpen ? classes.countRequestsMini : ""}`}>
                      {it.badge}
                    </div>
                  )}
                  {!menuOpen && <span className={classes.tooltip}>{it.label}</span>}
                </Link>
              );
            })}
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
          ver 4.1.3
        </Link>
        <div className={classes.alazar} style={menuOpen ? {} : { display: "none", padding: 0, flexWrap: "wrap", fontSize: "12px" }}>
          Powered by{" "}
          <a rel="noreferrer" className={classes.menuLink}>Alazar studio</a>
        </div>
      </div>
    </div>
  );
};

export default AirlineAdminMenu;
