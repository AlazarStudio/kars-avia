import React, { useEffect, useState, useMemo, useRef } from "react";
import classes from "./Header.module.css";
import Notifications from "../Notifications/Notifications";
import {
  CANCEL_REQUEST,
  decodeJWT,
  GET_DISPATCHER,
  GET_DISPATCHERS_SUBSCRIPTION,
  getCookie,
  NOTIFICATIONS_SUBSCRIPTION,
  server,
} from "../../../../graphQL_requests";
import { useMutation, useQuery, useSubscription } from "@apollo/client";
import { useNavigate } from "react-router-dom";
import ExistRequestProfile from "../ExistRequestProfile/ExistRequestProfile";
import Support from "../Support/Support";
import { fullNotifyTime, notifyTime, roles } from "../../../roles";
import ExistRequest from "../ExistRequest/ExistRequest";
import ChooseHotel from "../ChooseHotel/ChooseHotel";
import Notification from "../../Notification/Notification";
import MUILoader from "../MUILoader/MUILoader";

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
  const [existRequestData, setExistRequestData] = useState(); // Для хранения данных выбранной заявки
  const [showERequestSidebar, setShowERequestSidebar] = useState(false);
  const [showChooseHotel, setShowChooseHotel] = useState(false);

  const toggleRequestSidebar = () => {
    setShowRequestSidebar(!showRequestSidebar);
    setIsDropdownOpen(false);
    setIsFullyVisible(false);
  };

  const toggleSupportSidebar = () => {
    setShowSupportSidebar(!showSupportSidebar);
  };

  // const handleOpenRequest = (id) => {
  //   setExistRequestData(id); // Сохраняем ID заявки
  //   setShowERequestSidebar(true); // Открываем боковую панель
  //   setIsNotificationsOpen(false);
  // };

  const toggleChooseHotel = () => setShowChooseHotel(!showChooseHotel);

  const handleNotificationClick = (notificationData) => {
    // Создаем `chooseObject` на основе пришедших данных
    // console.log(notificationData);
    const newChooseObject = [
      {
        client: notificationData.request?.person?.name,
        clientId: notificationData.request?.person?.id,
        end: undefined, // Всегда `undefined`
        endTime: undefined, // Всегда `undefined`
        hotelId: "", // Всегда пустая строка
        place: "", // Всегда пустая строка
        public: false, // Всегда `false`
        requestId: notificationData.requestId,
        requestNumber: notificationData.request?.requestNumber,
        room: "", // Всегда пустая строка
        start: undefined, // Всегда `undefined`
        startTime: undefined, // Всегда `undefined`
      },
    ];

    // console.log(newChooseObject);

    setChooseObject(newChooseObject);
    setChooseCityRequest(notificationData.chooseCityRequest || "");
    setExistRequestData(notificationData.requestId); // Устанавливаем ID заявки
    setShowERequestSidebar(true); // Открываем боковую панель заявки
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

  const { loading, error, data, refetch } = useQuery(GET_DISPATCHER, {
    variables: { userId: userID },
    skip: !userID,
  });

  const { data: dataSubscription } = useSubscription(
    GET_DISPATCHERS_SUBSCRIPTION,
    {
      onData: () => {
        refetch();
      },
    }
  );

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
        !dropdownRef.current.contains(event.target) && // когда вернуться оповещения поставить &&
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

  const [notifications, setNotifications] = useState([]);

  const addNotification = (text, status) => {
    const id = Date.now(); // Уникальный ID
    setNotifications((prev) => [...prev, { id, text, status }]);

    setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    }, fullNotifyTime);
  };

  const handleUpdateUser = (updatedUser) => {
    setUserData(updatedUser); // Обновляем данные пользователя в родительском компоненте
  };

  // Запрос на отмену созданной, но не размещенной заявки
  const [cancelRequestMutation] = useMutation(CANCEL_REQUEST, {
    context: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  });

  const handleCancelRequest = async (id) => {
    try {
      // Отправка запроса с правильным ID заявки
      const response = await cancelRequestMutation({
        variables: {
          cancelRequestId: id,
        },
      });
      // console.log("Заявка успешно отменена", response);
    } catch (error) {
      console.error("Ошибка при отмене заявки:", JSON.stringify(error));
    }
  };

  // const chooseObject = [
  //   {
  //     client: "Петров П.П.",
  //     clientId: "67444ca096ee539bb5c14666",
  //     end: undefined,
  //     endTime: undefined,
  //     hotelId: "",
  //     place: "",
  //     public: false,
  //     requestId: '679b6f61178473d1c88d2ebd',
  //     requestNumber: '0190-ABA-30.01.2025',
  //     room: "",
  //     start: undefined,
  //     startTime: undefined,
  //   },
  // ];

  // const chooseCityRequest = "Абакан";
  // const [chooseCityRequest, setChooseCityRequest] = useState("Абакан");
  const [chooseObject, setChooseObject] = useState([]);
  const [chooseCityRequest, setChooseCityRequest] = useState("");

  // console.log(chooseCityRequest);

  const { data: notifySubscriptionData } = useSubscription(
    NOTIFICATIONS_SUBSCRIPTION
  );

  return (
    <div className={classes.section_top}>
      <div className={classes.section_top_title}>{children}</div>
      {loading && <MUILoader loadSize={"30px"} />}
      {error && <p>Ошибка: {error.message}</p>}

      {!loading && !error && (
        <div className={classes.section_top_elems}>
          <div
            className={classes.section_top_elems_notify}
            onClick={toggleNotifications}
            ref={notificationsRef}
          >
            {notifySubscriptionData ? <div className={classes.section_top_elems_notify_red}></div> : null}
            <img src="/notify.png" alt="Уведомления" />
          </div>

          {isNotificationsFullyVisible && (
            <div
              className={`${classes.notify_dropdown} ${
                isNotificationsOpen ? classes.open : classes.closed
              }`}
              onClick={(e) => e.stopPropagation()}
            >
              <Notifications
                onRequestClick={handleNotificationClick}
                user={data?.user}
                token={token}
                isNotificationsFullyVisible={isNotificationsFullyVisible}
              />
            </div>
          )}

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
              addNotification={addNotification}
            />

            <ExistRequest
              show={showERequestSidebar}
              onClose={() => {
                setShowERequestSidebar(false);
              }}
              setShowChooseHotel={setShowChooseHotel}
              chooseRequestID={existRequestData}
              setChooseRequestID={setExistRequestData}
              setChooseCityRequest={setChooseCityRequest}
              handleCancelRequest={handleCancelRequest}
              user={data?.user}
            />

            <ChooseHotel
              chooseCityRequest={chooseCityRequest}
              show={showChooseHotel}
              onClose={toggleChooseHotel}
              chooseObject={chooseObject}
              chooseRequestID={existRequestData}
              id={"relay"}
            />

            <Support
              show={showSupportSidebar}
              onClose={toggleSupportSidebar}
              user={data?.user}
            />

            {notifications.map((n, index) => (
              <Notification
                key={n.id}
                text={n.text}
                status={n.status}
                index={index}
                time={notifyTime}
                onClose={() => {
                  setNotifications((prev) =>
                    prev.filter((notif) => notif.id !== n.id)
                  );
                }}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default Header;
