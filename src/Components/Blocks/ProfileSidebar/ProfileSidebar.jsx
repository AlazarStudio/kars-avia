import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import classes from "./ProfileSidebar.module.css";
import Sidebar from "../Sidebar/Sidebar";
import { getMediaUrl } from "../../../../graphQL_requests";
import CloseIcon from "../../../shared/icons/CloseIcon";
import HomeIcon from "../../../shared/icons/HomeIcon";
import SettingsIcon from "../../../shared/icons/SettingsIcon";
import ExitIcon from "../../../shared/icons/ExitIcon";
import ProfileHomeIcon from "../../../shared/icons/ProfileHomeIcon";
import SecurityIcon from "../../../shared/icons/SecurityIcon";
import NotificationIcon from "../../../shared/icons/NotificationIcon";

const THEME_KEY = "appTheme";

function LockIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M5.83333 8.33333V6.66667C5.83333 4.82572 7.32572 3.33333 9.16667 3.33333C11.0076 3.33333 12.5 4.82572 12.5 6.66667V8.33333" stroke="#545873" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="3.33334" y="8.33333" width="13.3333" height="8.33333" rx="1.66667" stroke="#545873" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function BellIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M10 3.33333C6.3181 3.33333 3.33333 6.3181 3.33333 10V14.1667L1.66667 15.8333V16.6667H18.3333V15.8333L16.6667 14.1667V10C16.6667 6.3181 13.6819 3.33333 10 3.33333Z" stroke="#545873" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M7.5 16.6667H12.5" stroke="#545873" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function HelpIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 26 26" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M11.8052 15.6561V15.0341C11.8052 14.5469 11.8612 14.1224 11.9731 13.7603C12.085 13.3983 12.2726 13.0592 12.5359 12.7433C12.7992 12.4207 13.1547 12.085 13.6023 11.7361C14.0631 11.3741 14.4285 11.0614 14.6984 10.7981C14.9748 10.5348 15.1723 10.2714 15.2908 10.0081C15.4159 9.73825 15.4784 9.42556 15.4784 9.0701C15.4784 8.51056 15.2875 8.08597 14.9057 7.79633C14.5305 7.50011 14.0006 7.352 13.316 7.352C12.7104 7.352 12.141 7.43757 11.6077 7.60872C11.0745 7.77988 10.5479 7.99382 10.0279 8.25054L9.20833 6.5127C9.80736 6.18356 10.4558 5.92025 11.1535 5.72276C11.8579 5.5187 12.6314 5.41667 13.474 5.41667C14.8168 5.41667 15.8536 5.74251 16.5843 6.39421C17.3216 7.0459 17.6902 7.90495 17.6902 8.97135C17.6902 9.55722 17.5981 10.0608 17.4137 10.4821C17.2294 10.8968 16.9562 11.2819 16.5942 11.6374C16.2387 11.9863 15.8075 12.3549 15.3007 12.7433C14.886 13.0724 14.5667 13.3588 14.3429 13.6023C14.1257 13.8393 13.9742 14.0796 13.8887 14.3231C13.8097 14.5667 13.7702 14.8596 13.7702 15.2019V15.6561H11.8052ZM11.43 18.8356C11.43 18.2958 11.5683 17.9173 11.8447 17.7001C12.1278 17.4763 12.4734 17.3644 12.8815 17.3644C13.2765 17.3644 13.6155 17.4763 13.8985 17.7001C14.1816 17.9173 14.3231 18.2958 14.3231 18.8356C14.3231 19.3622 14.1816 19.744 13.8985 19.981C13.6155 20.2114 13.2765 20.3266 12.8815 20.3266C12.4734 20.3266 12.1278 20.2114 11.8447 19.981C11.5683 19.744 11.43 19.3622 11.43 18.8356Z" fill="#545873" />
      <path d="M24.375 13C24.375 6.71776 19.2822 1.625 13 1.625C6.71776 1.625 1.625 6.71776 1.625 13C1.625 19.2822 6.71776 24.375 13 24.375C19.2822 24.375 24.375 19.2822 24.375 13ZM26 13C26 20.1797 20.1797 26 13 26C5.8203 26 0 20.1797 0 13C0 5.8203 5.8203 0 13 0C20.1797 0 26 5.8203 26 13Z" fill="#545873" />
    </svg>

  );
}

function SupportIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M25.6666 11.6668V15.1668C25.6666 19.8335 23.3333 22.1668 18.6666 22.1668H18.0833C17.7216 22.1668 17.3716 22.3418 17.1499 22.6335L15.3999 24.9668C14.6299 25.9935 13.3699 25.9935 12.5999 24.9668L10.8499 22.6335C10.6633 22.3768 10.2316 22.1668 9.91659 22.1668H9.33325C4.66659 22.1668 2.33325 21.0002 2.33325 15.1668V9.3335C2.33325 4.66683 4.66659 2.3335 9.33325 2.3335H16.3333" stroke="#545873" strokeWidth="1.5" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M22.7499 8.16683C24.3607 8.16683 25.6666 6.86099 25.6666 5.25016C25.6666 3.63933 24.3607 2.3335 22.7499 2.3335C21.1391 2.3335 19.8333 3.63933 19.8333 5.25016C19.8333 6.86099 21.1391 8.16683 22.7499 8.16683Z" stroke="#545873" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M18.6626 12.8333H18.6731" stroke="#545873" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M13.9946 12.8333H14.0051" stroke="#545873" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M9.32693 12.8333H9.3374" stroke="#545873" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ThemeLightIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="10" cy="10" r="4.16667" stroke="#545873" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M10 2.5V4.16667" stroke="#545873" strokeWidth="1.25" strokeLinecap="round" />
      <path d="M10 15.8333V17.5" stroke="#545873" strokeWidth="1.25" strokeLinecap="round" />
      <path d="M17.5 10H15.8333" stroke="#545873" strokeWidth="1.25" strokeLinecap="round" />
      <path d="M4.16667 10H2.5" stroke="#545873" strokeWidth="1.25" strokeLinecap="round" />
      <path d="M15.3033 4.69667L14.1667 5.83333" stroke="#545873" strokeWidth="1.25" strokeLinecap="round" />
      <path d="M5.83333 14.1667L4.69667 15.3033" stroke="#545873" strokeWidth="1.25" strokeLinecap="round" />
      <path d="M15.3033 15.3033L14.1667 14.1667" stroke="#545873" strokeWidth="1.25" strokeLinecap="round" />
      <path d="M5.83333 5.83333L4.69667 4.69667" stroke="#545873" strokeWidth="1.25" strokeLinecap="round" />
    </svg>
  );
}

function ThemeDarkIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M17.5 10.6583C17.3528 12.0768 16.7652 13.415 15.8125 14.4817C14.8598 15.5483 13.5862 16.2962 12.1783 16.6208C10.7705 16.9454 9.29889 16.8312 7.94622 16.2917C6.59355 15.7521 5.42472 14.8118 4.6025 13.5883C3.78028 12.3649 3.3425 10.915 3.34167 9.43333C3.34083 7.95167 3.77695 6.50115 4.59778 5.27704C5.41861 4.05293 6.58627 3.11157 7.938 2.57083C9.28973 2.03009 10.7608 1.91458 12.1683 2.23792C13.5758 2.56125 14.8495 3.308 15.8025 4.37333C16.7555 5.43867 17.3435 6.77583 17.5 8.19167" stroke="#545873" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ThemeMixIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="10" cy="10" r="6.66667" stroke="#545873" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M10 3.33333C10 3.33333 6.66667 6.66667 6.66667 10C6.66667 13.3333 10 16.6667 10 16.6667" stroke="#545873" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M10 16.6667C10 16.6667 13.3333 13.3333 13.3333 10C13.3333 6.66667 10 3.33333 10 3.33333" stroke="#545873" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

const MENU_ITEMS = [
  { id: "profile", title: "Мой профиль", subtitle: "ФИО, аватар", Icon: ProfileHomeIcon },
  { id: "security", title: "Вход и безопасность", subtitle: "Пароли, телефон, e-mail", Icon: SecurityIcon },
  // { id: "notifications", title: "Уведомления", subtitle: "На почту, в браузере", Icon: NotificationIcon },
  { id: "help", title: "Помощь", subtitle: "Инструкции по работе в системе", Icon: HelpIcon },
  { id: "support", title: "Техподдержка", subtitle: "Написать в техподдержку", Icon: SupportIcon },
  { id: "theme", title: "Тема", subtitle: "Оформление системы", Icon: ThemeLightIcon, isThemeSection: true },
];

function ProfileSidebar({
  show,
  onClose,
  user,
  positionName,
  onOpenSettings,
  onOpenNotifications,
  onOpenSupport,
  onLogout,
}) {
  const navigate = useNavigate();
  const sidebarRef = useRef(null);
  const [theme, setTheme] = useState(() => {
    try {
      return localStorage.getItem(THEME_KEY) || "light";
    } catch {
      return "light";
    }
  });

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (sidebarRef.current && !sidebarRef.current.contains(event.target)) {
        onClose();
      }
    };
    if (show) document.addEventListener("mousedown", handleClickOutside);
    else document.removeEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [show, onClose]);

  const handleThemeChange = (value) => {
    setTheme(value);
    try {
      localStorage.setItem(THEME_KEY, value);
      document.documentElement.setAttribute("data-theme", value);
    } catch (_) { }
  };

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  const handleMenuClick = (id) => {
    if (id === "profile") {
      onClose();
      onOpenSettings?.("profile");
    } else if (id === "security") {
      onClose();
      onOpenSettings?.("security");
    } else if (id === "notifications") {
      onClose();
      onOpenNotifications?.();
    } else if (id === "support") {
      onClose();
      onOpenSupport?.();
    } else if (id === "help") {
      onClose();
      navigate("/documentation");
    }
  };
  // console.log(user);


  return (
    <Sidebar show={show} sidebarRef={sidebarRef}>
      <div className={classes.wrapper}>
        <div className={classes.header}>
          {/* <h2 className={classes.title}>Профиль</h2> */}
          <button
            type="button"
            className={classes.userBlock}
            onClick={() => {
              onClose();
              onOpenSettings?.("profile");
            }}
          >
            <img
              src={getMediaUrl(user?.images?.[0]) ?? "/no-avatar.png"}
              alt=""
              className={classes.avatar}
            />
            <div className={classes.userInfo}>
              <p className={classes.userName}>{user?.name ?? ""}</p>
              <p className={classes.userPosition}>{user?.position?.name ?? ""}</p>
            </div>
          </button>

          <div className={classes.headerButtons}>
            <button type="button" className={classes.closeBtn} onClick={onLogout}>
              <ExitIcon />
            </button>
            <button type="button" className={classes.closeBtn} onClick={onClose} aria-label="Закрыть">
              <CloseIcon />
            </button>
          </div>
        </div>

        <nav className={classes.menu}>
          {MENU_ITEMS.filter((item) => !item.isThemeSection && item.id !== "notifications").map((item) => {
            const Icon = item.Icon;
            return (
              <button
                key={item.id}
                type="button"
                className={classes.menuItem}
                onClick={() => handleMenuClick(item.id)}
              >
                <span className={classes.menuIcon}>
                  <Icon />
                </span>
                <span className={classes.menuText}>
                  <span className={classes.menuTitle}>{item.title}</span>
                  <span className={classes.menuSubtitle}>{item.subtitle}</span>
                </span>
              </button>
            );
          })}
        </nav>

        {/* <div className={classes.themeBlock}>
          <p className={classes.themeLabel}>Тема оформления</p>
          <div className={classes.themeButtons}>
            <button
              type="button"
              className={theme === "light" ? `${classes.themeBtn} ${classes.themeBtnActive}` : classes.themeBtn}
              onClick={() => handleThemeChange("light")}
            >
              <ThemeLightIcon />
              <span>Светлая</span>
            </button>
            <button
              type="button"
              className={theme === "mix" ? `${classes.themeBtn} ${classes.themeBtnActive}` : classes.themeBtn}
              onClick={() => handleThemeChange("mix")}
            >
              <ThemeMixIcon />
              <span>Микс</span>
            </button>
            <button
              type="button"
              className={theme === "dark" ? `${classes.themeBtn} ${classes.themeBtnActive}` : classes.themeBtn}
              onClick={() => handleThemeChange("dark")}
            >
              <ThemeDarkIcon />
              <span>Темная</span>
            </button>
          </div>
        </div> */}

        {/* <div className={classes.footer}>
          <button type="button" className={classes.logoutBtn} onClick={onLogout}>
            <span className={classes.menuIcon}>
              <ExitIcon />
            </span>
            <span>Выход</span>
          </button>
        </div> */}
      </div>
    </Sidebar>
  );
}

export default ProfileSidebar;
