import React, { useEffect, useState, useMemo, useRef } from "react";
import classes from "./Header.module.css";
import {
  decodeJWT,
  GET_DISPATCHER,
  getCookie,
  server,
} from "../../../../graphQL_requests";
import { useQuery } from "@apollo/client";
import { useNavigate } from "react-router-dom";
import ExistRequestProfile from "../ExistRequestProfile/ExistRequestProfile";
import Swal from "sweetalert2";

function Header({ children }) {
  const token = getCookie("token");
  const navigate = useNavigate();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isFullyVisible, setIsFullyVisible] = useState(false); // Управляет полным отображением
  const dropdownRef = useRef(null);
  const [userData, setUserData] = useState(null); // Храним данные пользователя в state

  const [showRequestSidebar, setShowRequestSidebar] = useState(false);

  const toggleRequestSidebar = () => {
    setShowRequestSidebar(!showRequestSidebar);
    setIsDropdownOpen(false);
    setIsFullyVisible(false);
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

  // const logout = () => {
  //   let result = confirm("Вы уверены что хотите выйти?");
  //   if (result) {
  //     document.cookie = "token=; Max-Age=0; Path=/;";
  //     navigate("/");
  //     window.location.reload();
  //   }
  // };

  const logout = () => {
    Swal.fire({
      title: "Вы уверены?",
      text: "Вы действительно хотите выйти?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Да, выйти",
      cancelButtonText: "Отмена",
      allowOutsideClick: true,
      allowEscapeKey: false,
      customClass: {
        confirmButton: "swal_confirm",
        cancelButton: "swal_cancel",
      },
    }).then((result) => {
      if (result.isConfirmed) {
        // Удаляем токен из cookie
        document.cookie = "token=; Max-Age=0; Path=/;";
        // Перенаправляем на главную страницу
        navigate("/");
        // Перезагружаем страницу
        window.location.reload();
      }
    });
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
        document.querySelector(".swal2-container")?.contains(event.target) ||
        (dropdownRef.current && !dropdownRef.current.contains(event.target))
      ) {
        setIsDropdownOpen(false);
        setTimeout(() => setIsFullyVisible(false), 300); // Убираем из DOM через 300ms
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
    } else {
      setIsDropdownOpen(false);
      setTimeout(() => setIsFullyVisible(false), 300); // Убираем через 300ms
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
          <div className={classes.section_top_elems_notify}>
            <div className={classes.section_top_elems_notify_red}></div>
            <img src="/notify.png" alt="Уведомления" />
          </div>

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
          </div>
        </div>
      )}
    </div>
  );
}

export default Header;
