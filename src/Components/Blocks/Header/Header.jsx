import React, { useEffect, useState, useMemo, useRef } from "react";
import classes from "./Header.module.css";
import Notifications from "../Notifications/Notifications";
import {
  CANCEL_REQUEST,
  decodeJWT,
  GET_DISPATCHER,
  GET_DISPATCHERS_SUBSCRIPTION,
  GET_USER_SUPPORT_CHAT,
  getCookie,
  LOGOUT,
  MESSAGE_SENT_SUBSCRIPTION,
  NEW_UNREAD_MESSAGE_SUBSCRIPTION,
  NOTIFICATIONS_SUBSCRIPTION,
  REQUEST_MESSAGES_SUBSCRIPTION,
  getMediaUrl,
  UNREAD_MESSAGES_COUNT,
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
import NotificationsSidebar from "../NotificationsSidebar/NotificationsSidebar";
import ProfileSidebar from "../ProfileSidebar/ProfileSidebar";
import NotifyIcon from "../../../shared/icons/NotifyIcon";

function Header({ children, isExternalUser = false }) {
  const token = getCookie("token");
  const user = decodeJWT(token);

  const navigate = useNavigate();
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
  const [showProfileSidebar, setShowProfileSidebar] = useState(false);
  const [profileEditMode, setProfileEditMode] = useState(null);

  const toggleRequestSidebar = () => {
    setShowRequestSidebar(!showRequestSidebar);
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
    } else {
      setIsNotificationsOpen(false);
      setTimeout(() => setIsNotificationsFullyVisible(false), 300);
    }
  };

  const { loading, error, data, refetch } = useQuery(GET_DISPATCHER, {
    context: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
    variables: { userId: user?.userId },
    skip: !user?.userId || isExternalUser,
  });

  const [logoutMutation] = useMutation(LOGOUT);

  const { data: dataSubscription } = useSubscription(
    GET_DISPATCHERS_SUBSCRIPTION,
    {
      skip: isExternalUser,
      onData: () => {
        refetch();
      },
    },
  );

  useEffect(() => {
    if (data?.user) {
      setUserData(data.user); // Сохраняем данные пользователя в state
    }
  }, [data]);

  const { data: notifySubscriptionData } = useSubscription(
    NOTIFICATIONS_SUBSCRIPTION,
    { skip: isExternalUser },
  );

  const { data: tsChatData } = useQuery(GET_USER_SUPPORT_CHAT, {
    context: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
    variables: {
      userId: user?.userId,
    },
    skip:
      isExternalUser || (userData?.role !== roles.superAdmin ? false : true),
  });

  const { data: unreadMessagesCount, refetch: unreadRefetch } = useQuery(
    UNREAD_MESSAGES_COUNT,
    {
      context: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
      variables: {
        chatId: tsChatData?.userSupportChat?.id,
        userId: user?.userId,
      },
      skip: isExternalUser,
    },
  );

  const { data: unreadMessagesSubscription } = useSubscription(
    MESSAGE_SENT_SUBSCRIPTION,
    {
      skip: isExternalUser,
      context: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
      // variables: { chatId: tsChatData?.userSupportChat?.id },
      onData: () => {
        unreadRefetch();
      },
    },
  );

  const logout = async () => {
    let result = confirm("Вы уверены что хотите выйти?");
    const { data } = await logoutMutation({
      context: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    });

    if (result && data) {
      document.cookie = "token=; Max-Age=0; Path=/";
      document.cookie = "refreshToken=; Max-Age=0; Path=/";
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

  // useEffect(() => {
  //   const handleClickOutside = (event) => {
  //     if (
  //       dropdownRef.current &&
  //       !dropdownRef.current.contains(event.target) && // когда вернуться оповещения поставить &&
  //       notificationsRef.current &&
  //       !notificationsRef.current.contains(event.target) &&
  //       !event.target.closest(`.${classes.notify_dropdown}`)
  //     ) {
  //       setIsDropdownOpen(false);
  //       setTimeout(() => setIsFullyVisible(false), 300);
  //       setIsNotificationsOpen(false);
  //       setTimeout(() => setIsNotificationsFullyVisible(false), 300);
  //     }
  //   };

  //   document.addEventListener("mousedown", handleClickOutside);
  //   return () => {
  //     document.removeEventListener("mousedown", handleClickOutside);
  //   };
  // }, []);

  const handleProfileClick = () => {
    setShowProfileSidebar(true);
    setIsNotificationsFullyVisible(false);
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

  return (
    <>
      <div className={classes.section_top}>
        <div className={classes.section_top_title}>{children}</div>
        {loading && <MUILoader loadSize={"30px"} />}
        {error && <p>Ошибка: {error.message}</p>}

        {!loading && !error && !isExternalUser && (
          <div className={classes.section_top_elems}>
            {userData?.role !== roles.superAdmin ? (
              <div
                className={classes.section_top_elems_support}
                onClick={toggleSupportSidebar}
              >
                {unreadMessagesCount?.unreadMessagesCount ? (
                  <div className={classes.section_top_elems_unread_red}>
                    {unreadMessagesCount?.unreadMessagesCount}
                  </div>
                ) : null}
                <svg
                  width="22"
                  height="22"
                  viewBox="0 0 22 22"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="M11.7305 20.4141H10.2695C9.46787 20.4141 8.98561 19.3372 9.60116 18.6715C10.0258 18.2122 10.8711 18.3516 11.6875 18.3516C12.5291 18.3516 13.0176 19.4274 12.4068 20.1021C12.2829 20.2389 11.9803 20.4141 11.7305 20.4141ZM22 10.1875V12.0003C21.9724 12.4079 21.9062 12.7931 21.7613 13.1285C21.6662 13.3485 21.3846 13.7697 21.2148 13.914C20.7182 14.336 20.1572 14.6133 19.25 14.6133C18.0034 14.6133 17.8281 14.706 17.8319 13.84L17.832 9.92971C17.832 7.9559 17.9335 6.60524 17.3599 5.15963C16.8607 3.90133 16.1107 2.94255 15.1009 2.17643C13.9068 1.2704 12.5996 0.820332 10.7852 0.820332C8.54199 0.820332 6.40992 2.17103 5.2929 3.87885C4.03192 5.80677 4.16798 7.42337 4.16798 9.92971C4.16798 10.8034 4.16798 11.6771 4.16798 12.5508C4.16798 14.3279 4.38348 14.6133 3.39454 14.6133C3.39454 17.1176 5.44887 18.9961 7.94923 18.9961C8.70517 18.9961 8.53193 19.0436 8.65503 18.7136C8.94712 17.9306 9.69962 17.5352 10.5274 17.5352C11.6486 17.5352 12.7476 17.419 13.3066 18.6231C13.6627 19.3899 13.4482 20.18 12.9246 20.7059C12.6457 20.9859 12.1487 21.2305 11.6016 21.2305C10.5356 21.2305 9.39992 21.3945 8.79418 20.3426C8.59966 20.0048 8.62226 19.9185 8.55079 19.7696C7.41707 19.7696 6.89282 19.7769 6.05308 19.4743C4.81271 19.0273 3.64725 18.0221 3.11163 16.8298C2.82445 16.1905 2.57813 15.3346 2.57813 14.6133C2.22471 14.6133 1.77293 14.5043 1.51767 14.3847C0.8737 14.0828 0.530227 13.739 0.228609 13.0956C0.101757 12.825 0 12.4161 0 12.0352V10.1431C0.0523161 9.48707 0.223997 8.9071 0.719498 8.41483C1.58912 7.55086 2.29619 7.65237 3.39454 7.65237V7.22268C3.39454 5.21427 4.70537 2.82124 6.23629 1.68552C6.40984 1.55679 6.5739 1.41809 6.75383 1.30073C9.65471 -0.591343 13.0803 -0.392328 15.8129 1.72229C16.3035 2.10194 16.784 2.63394 17.1513 3.1339C18.0991 4.42426 18.6055 5.90097 18.6055 7.65237H19.5938C20.8213 7.65237 22 8.78158 22 10.1875ZM19.5078 13.7969H18.6055V8.55471C18.6055 8.37136 18.7704 8.42581 19.1641 8.42581C19.83 8.42581 20.176 8.52596 20.5646 8.82991C20.8659 9.06552 21.1836 9.54477 21.1836 10.0586V12.2071C21.1836 12.5881 21.001 12.9442 20.7681 13.2095L20.6641 13.3204C20.3936 13.5802 20.0323 13.7969 19.5078 13.7969ZM0.816415 12.2071V10.0586C0.816415 9.55368 1.12474 9.0799 1.41112 8.84864C1.98223 8.38746 2.46779 8.42581 3.26563 8.42581C3.36464 8.42581 3.39454 8.45569 3.39454 8.55471V13.7969H2.49219C1.6242 13.7969 0.816415 13.0578 0.816415 12.2071Z"
                    fill="#545873"
                  />
                </svg>
              </div>
            ) : null}
            <div
              className={classes.section_top_elems_notify}
              onClick={toggleNotifications}
              ref={notificationsRef}
            >
              {notifySubscriptionData ? (
                <div className={classes.section_top_elems_notify_red}></div>
              ) : null}
              {/* <img
                src="/notify.png"
                alt="Уведомления"
                style={{ userSelect: "none" }}
              /> */}
              <NotifyIcon />
            </div>

            {/* {isNotificationsFullyVisible && (
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
                src={getMediaUrl(userData?.images?.[0]) ?? "/no-avatar.png"}
                alt="Профиль пользователя"
                style={{ userSelect: "none" }}
              />
            </div>
          </div>
        )}
        {!loading && !error && isExternalUser && (
          <div className={classes.section_top_elems}>
            <div className={classes.section_top_elems_date}>
              <div>{formattedDate}</div>
            </div>
          </div>
        )}
      </div>

      {notifications.map((n, index) => (
        <Notification
          key={n.id}
          text={n.text}
          status={n.status}
          index={index}
          time={notifyTime}
          onClose={() => {
            setNotifications((prev) =>
              prev.filter((notif) => notif.id !== n.id),
            );
          }}
        />
      ))}

      {/* {isNotificationsFullyVisible && (
        <div
          className={`${classes.notify_dropdown} ${
            isNotificationsOpen ? classes.open : classes.closed
          }`}
          onClick={(e) => e.stopPropagation()}
        >
        </div>
      )} */}
      <NotificationsSidebar
        onRequestClick={handleNotificationClick}
        user={data?.user}
        token={token}
        isNotificationsFullyVisible={isNotificationsFullyVisible}
        show={isNotificationsOpen}
        onClose={() => {
          setIsNotificationsOpen(false);
        }}
      />

      <ProfileSidebar
        show={showProfileSidebar}
        onClose={() => setShowProfileSidebar(false)}
        user={userData}
        positionName={data?.user?.position?.name}
        onOpenSettings={(section) => {
          setProfileEditMode(section);
          setShowProfileSidebar(false);
          setShowRequestSidebar(true);
        }}
        onOpenNotifications={() => {
          setShowProfileSidebar(false);
          setIsNotificationsFullyVisible(true);
          setTimeout(() => setIsNotificationsOpen(true), 0);
        }}
        onOpenSupport={() => {
          setShowProfileSidebar(false);
          setShowSupportSidebar(true);
        }}
        onLogout={logout}
      />

      <ExistRequestProfile
        show={showRequestSidebar}
        onClose={() => {
          setProfileEditMode(null);
          setShowRequestSidebar(false);
        }}
        user={userData}
        updateUser={handleUpdateUser}
        openDeleteComponent={null}
        deleteComponentRef={null}
        addNotification={addNotification}
        mode={profileEditMode}
      />

      {data?.user?.role !== roles.superAdmin && showSupportSidebar ? (
        <Support
          show={showSupportSidebar}
          onClose={toggleSupportSidebar}
          user={data?.user}
          supportRefetch={unreadRefetch}
        />
      ) : null}

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
    </>
  );
}

export default Header;
