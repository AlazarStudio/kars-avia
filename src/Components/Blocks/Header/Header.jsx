import React, { useEffect, useState, useMemo, useRef } from "react";
import classes from "./Header.module.css";
import Notifications from "../Notifications/Notifications";
import {
  decodeJWT,
  GET_DISPATCHER,
  getCookie,
  server,
} from "../../../../graphQL_requests";
import { useQuery } from "@apollo/client";
import { useNavigate } from "react-router-dom";
import ExistRequestProfile from "../ExistRequestProfile/ExistRequestProfile";
import Support from "../Support/Support";
import { roles } from "../../../roles";
import ExistRequest from "../ExistRequest/ExistRequest";

function Header({ children }) {
  const token = getCookie("token");
  const navigate = useNavigate();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isFullyVisible, setIsFullyVisible] = useState(false); // Управляет полным отображением профиля
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false); // Управляет отображением уведомлений
  const [isNotificationsFullyVisible, setIsNotificationsFullyVisible] =
    useState(false); // Полное отображение уведомлений
  const dropdownRef = useRef(null);
  const notificationsRef = useRef(null);
  const [userData, setUserData] = useState(null); // Храним данные пользователя в state

  const [showRequestSidebar, setShowRequestSidebar] = useState(false);
  const [showSupportSidebar, setShowSupportSidebar] = useState(false);
  const [existRequestData, setExistRequestData] = useState(null); // Для хранения данных выбранной заявки
  const [showERequestSidebar, setShowERequestSidebar] = useState(false);

  const toggleRequestSidebar = () => {
    setShowRequestSidebar(!showRequestSidebar);
    setIsDropdownOpen(false);
    setIsFullyVisible(false);
  };

  const toggleSupportSidebar = () => {
    setShowSupportSidebar(!showSupportSidebar);
  };

  const handleOpenRequest = (id) => {
    setExistRequestData(id); // Сохраняем ID заявки
    setShowERequestSidebar(true); // Открываем боковую панель
    setIsNotificationsOpen(false);
  };

  const toggleNotifications = () => {
    if (!isNotificationsOpen) {
      setIsNotificationsFullyVisible(true);
      setTimeout(() => setIsNotificationsOpen(true), 0);
      setIsFullyVisible(false);
    } else {
      setIsNotificationsOpen(false);
      setTimeout(() => setIsNotificationsFullyVisible(false), 300);
      setIsFullyVisible(false);
    }
  };

  const userID = useMemo(
    () => (token ? decodeJWT(token).userId : null),
    [token]
  );

  const { loading, error, data } = useQuery(GET_DISPATCHER, {
    variables: { userId: userID },
    skip: !userID,
  });

  useEffect(() => {
    if (data?.user) {
      setUserData(data.user); // Сохраняем данные пользователя в state
    }
  }, [data]);

  const logout = () => {
    let result = confirm("Вы уверены что хотите выйти?");
    if (result) {
      document.cookie = "token=; Max-Age=0; Path=/;";
      localStorage.removeItem("isAirline");
      navigate("/");
      window.location.reload();
    }
  };

  const formattedDate = useMemo(() => {
    const daysOfWeek = ["Вс", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"];
    const months = [
      "Января",
      "Февраля",
      "Марта",
      "Апреля",
      "Мая",
      "Июня",
      "Июля",
      "Августа",
      "Сентября",
      "Октября",
      "Ноября",
      "Декабря",
    ];
    const currentDate = new Date();

    return `${daysOfWeek[currentDate.getDay()]}, ${currentDate.getDate()} ${
      months[currentDate.getMonth()]
    }`;
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target) || // когда вернуться оповещения поставить &&
        notificationsRef.current &&
        !notificationsRef.current.contains(event.target) &&
        !event.target.closest(`.${classes.notify_dropdown}`)
      ) {
        setIsDropdownOpen(false);
        setTimeout(() => setIsFullyVisible(false), 300);
        setIsNotificationsOpen(false);
        setTimeout(() => setIsNotificationsFullyVisible(false), 300);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleProfileClick = () => {
    if (!isDropdownOpen) {
      setIsFullyVisible(true); // Показать блок
      setTimeout(() => setIsDropdownOpen(true), 0); // Включить видимость
      setIsNotificationsFullyVisible(false);
    } else {
      setIsDropdownOpen(false);
      setTimeout(() => setIsFullyVisible(false), 300); // Убираем через 300ms
      setIsNotificationsFullyVisible(false);
    }
  };

  const handleUpdateUser = (updatedUser) => {
    setUserData(updatedUser); // Обновляем данные пользователя в родительском компоненте
  };

  return (
    <div className={classes.section_top}>
      <div className={classes.section_top_title}>{children}</div>
      {loading && <p>Загрузка...</p>}
      {error && <p>Ошибка: {error.message}</p>}

      {!loading && !error && (
        <div className={classes.section_top_elems}>
          {/* <div
            className={classes.section_top_elems_notify}
            onClick={toggleNotifications}
            ref={notificationsRef}
          >
            <div className={classes.section_top_elems_notify_red}></div>
            <img src="/notify.png" alt="Уведомления" />
          </div> */}

          {/* {isNotificationsFullyVisible && (
            <div
              className={`${classes.notify_dropdown} ${
                isNotificationsOpen ? classes.open : classes.closed
              }`}
              onClick={(e) => e.stopPropagation()}
            >
              <Notifications onRequestClick={handleOpenRequest} />
            </div>
          )} */}

          <div className={classes.section_top_elems_date}>
            <div>{formattedDate}</div>
          </div>

          <div
            className={classes.section_top_elems_profile}
            onClick={handleProfileClick}
            ref={dropdownRef}
          >
            <img
              src={
                data?.user?.images?.[0]
                  ? `${server}${userData?.images[0]}`
                  : "/no-avatar.png"
              }
              alt="Профиль пользователя"
            />

            {isFullyVisible && (
              <div
                className={`${classes.profile_dropdown} ${
                  isDropdownOpen ? classes.open : classes.closed
                }`}
                onClick={(e) => e.stopPropagation()}
              >
                <div className={classes.dropdown_info}>
                  <img
                    src={
                      userData?.images?.[0]
                        ? `${server}${userData?.images[0]}`
                        : "/no-avatar.png"
                    }
                    alt=""
                  />
                  <div className={classes.text_info}>
                    <p>{userData?.name}</p>
                    <p>{data?.user?.position}</p>
                  </div>
                </div>
                <div>
                  <div
                    className={classes.settings_item}
                    onClick={toggleRequestSidebar}
                  >
                    <div className={classes.settings_item__img}>
                      <img src="/settings.png" alt="" />
                    </div>
                    <p>Настройки</p>
                  </div>
                  <a className={classes.settings_item} onClick={logout}>
                    <div
                      className={`${classes.settings_item__img} ${classes.img_padding}`}
                    >
                      <img src="/exit.png" alt="" />
                    </div>
                    <p>Выход</p>
                  </a>
                </div>
              </div>
            )}

            <ExistRequestProfile
              show={showRequestSidebar}
              onClose={toggleRequestSidebar}
              user={userData}
              updateUser={handleUpdateUser}
              openDeleteComponent={null}
              deleteComponentRef={null}
            />

            <ExistRequest
              show={showERequestSidebar}
              onClose={() => {
                setShowERequestSidebar(false);
              }}
              chooseRequestID={existRequestData}
              user={data?.user}
            />

            <Support
              show={showSupportSidebar}
              onClose={toggleSupportSidebar}
              user={data?.user}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default Header;
