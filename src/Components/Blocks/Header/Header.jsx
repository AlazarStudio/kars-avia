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

function Header({ children }) {
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
    skip: !user?.userId,
  });

  const [logoutMutation] = useMutation(LOGOUT);

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

  const { data: notifySubscriptionData } = useSubscription(
    NOTIFICATIONS_SUBSCRIPTION
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
    skip: userData?.role !== roles.superAdmin ? false : true,
  });


  const { data: unreadMessagesCount, refetch: unreadRefetch } = useQuery(
    UNREAD_MESSAGES_COUNT,
    {
      context: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
      variables: { chatId: tsChatData?.userSupportChat?.id, userId: user?.userId },
    }
  );

  const { data: unreadMessagesSubscription } = useSubscription(
    MESSAGE_SENT_SUBSCRIPTION,
    {
      context: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
      // variables: { chatId: tsChatData?.userSupportChat?.id },
      onData: () => {
        unreadRefetch();
      },
    }
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
      document.cookie = "token=; Max-Age=0; Path=/;";
      document.cookie = "refreshToken=; Max-Age=0; Path=/;";
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

        {!loading && !error && (
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
                <img src="/support.png" alt="Поддержка" />
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
              <img
                src="/notify.png"
                alt="Уведомления"
                style={{ userSelect: "none" }}
              />
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
              prev.filter((notif) => notif.id !== n.id)
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
        onOpenSettings={() => {
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
        onClose={toggleRequestSidebar}
        user={userData}
        updateUser={handleUpdateUser}
        openDeleteComponent={null}
        deleteComponentRef={null}
        addNotification={addNotification}
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
