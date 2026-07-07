import { Link } from "react-router-dom";

import classes from "./DisAdminMenu.module.css";
import DelayedText from "../../../Blocks/DelayedText/DelayedText";
import { canAccessMenu } from "../../../../utils/access";
import MenuNavIcons from "../../../../shared/icons/menuNavIcons";

const DisAdminMenu = ({
  id,
  allCreatedRequests,
  fapCreatedCount = 0,
  transferPendingCount = 0,
  activeSupportCount = 0,
  isSupportAgent = false,
  menuOpen,
  accessMenu,
  user,
}) => {
  const isDefault = id == undefined || !id;

  const groups = [
    {
      title: "Заявки",
      items: [
        canAccessMenu(accessMenu, "requestMenu", user) && {
          label: "Эскадрилья", to: "/relay?page=1", icon: MenuNavIcons.relay,
          badge: allCreatedRequests, active: id == "relay" || isDefault,
        },
        canAccessMenu(accessMenu, "reserveMenu", user) && {
          label: "ФАП", to: "/far", icon: MenuNavIcons.fapShield,
          badge: fapCreatedCount, active: id == "far",
        },
        canAccessMenu(accessMenu, "transferMenu", user) && {
          label: "Трансфер", to: "/orders", icon: MenuNavIcons.transfer,
          badge: transferPendingCount, active: id == "orders",
        },
      ],
    },
    {
      title: "Организации",
      items: [
        canAccessMenu(accessMenu, "airlineMenu", user) && {
          label: "Авиакомпании", to: "/airlines", icon: MenuNavIcons.airlines,
          active: id == "airlines" || id == "airlineAccess" || id == "airlineNotifications",
        },
        { label: "Гостиницы", to: "/hotels", icon: MenuNavIcons.hotels, active: id == "hotels" },
        canAccessMenu(accessMenu, "organizationMenu", user) && {
          label: "Автопарк", to: "/driversCompany", icon: MenuNavIcons.drivers, fill: true,
          active: id == "driversCompany" || id == "driversList",
        },
      ],
    },
    {
      title: "Управление",
      items: [
        canAccessMenu(accessMenu, "userMenu", user) && {
          label: "Пользователи", to: "/company", icon: MenuNavIcons.users,
          active: id == "company" || id == "dispatcherAccess" || id == "dispatcherNotifications",
        },
        { label: "ГК Карс", to: "/myCompany", icon: MenuNavIcons.myCompany, fill: true, active: id == "myCompany" },
        canAccessMenu(accessMenu, "contracts", user) && {
          label: "Реестр договоров", to: "/registerOfContracts", icon: MenuNavIcons.contracts,
          active: id == "registerOfContracts",
        },
      ],
    },
    {
      title: "Аналитика",
      items: [
        canAccessMenu(accessMenu, "reportMenu", user) && {
          label: "Отчеты", to: "/reports", icon: MenuNavIcons.reports, active: id == "reports",
        },
        canAccessMenu(accessMenu, "analyticsMenu", user) && {
          label: "Аналитика", to: "/analytics", icon: MenuNavIcons.analytics, fill: true, active: id == "analytics",
        },
      ],
    },
    {
      title: "Сервис",
      items: [
        isSupportAgent && {
          label: "Поддержка", to: "/support", icon: MenuNavIcons.support,
          badge: activeSupportCount, active: id == "support",
        },
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
          to={"/patchNotes"}
          className={`${classes.alazar} ${!menuOpen ? classes.jcc : ""} ${id == "patchNotes" ? classes.menu_items__activeElem___bottom : ""} ${classes.menuLink}`}
          style={menuOpen ? {} : { padding: 0 }}
        >
          ver 4.1.3
        </Link>
        <div className={classes.alazar} style={menuOpen ? {} : { display: "none", padding: 0, flexWrap: "wrap", fontSize: "12px" }}>
          Powered by{" "}
          <a className={`${classes.menuLink}`}>Alazar studio</a>
        </div>
      </div>
    </div>
  );
};

export default DisAdminMenu;
