import React, { useState, useEffect, useRef, useMemo } from "react";
import classes from "./SettingsSidebar.module.css";
import Sidebar from "../Sidebar/Sidebar";
import { useMutation, useQuery } from "@apollo/client";
import {
  GET_AIRLINE_COMPANY,
  GET_DISPATCHER_DEPARTMENTS,
  GET_AIRLINE_POSITIONS,
  UPDATE_AIRLINE,
  UPDATE_DISPATCHER_DEPARTMENT,
  getCookie,
} from "../../../../graphQL_requests";
import MUILoader from "../MUILoader/MUILoader";
import Notification from "../../Notification/Notification";
import { fullNotifyTime } from "../../../roles";
import AccessPermissionsPanel from "./AccessPermissionsPanel";
import NotificationsPermissionsPanel from "./NotificationsPermissionsPanel";
import Button from "../../Standart/Button/Button";
import CloseIcon from "../../../shared/icons/CloseIcon";

export default function SettingsSidebar({
  show,
  sidebarRef,
  onClose,
  user,
  departmentId,
  airlineId,
  departmentItem,
  type = "dispatcher", // "dispatcher" или "airline"
}) {
  const token = getCookie("token");
  const [activeTab, setActiveTab] = useState("access");
  const [isLoading, setIsLoading] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [isEditing, setIsEditing] = useState(false);

  const [accessMenu, setAccessMenu] = useState({});
  const [notificationMenu, setNotificationMenu] = useState({});
  const [airlinePositions, setAirlinePositions] = useState([]);
  const [positionIds, setPositionIds] = useState([]);

  const accessStateRef = useRef(null);
  const notificationsStateRef = useRef(null);

  // Запрос для авиакомпаний
  const { loading: airlineLoading, data: airlineData, refetch: refetchAirline } = useQuery(
    GET_AIRLINE_COMPANY,
    {
      context: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
      skip: type !== "airline" || !airlineId,
      variables: { airlineId: airlineId },
    }
  );

  // Запрос для диспетчеров
  const { loading: dispatcherLoading, data: dispatcherData, refetch: refetchDispatcher } = useQuery(
    GET_DISPATCHER_DEPARTMENTS,
    {
      context: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
      skip: type !== "dispatcher" || !departmentId,
      variables: {
        pagination: { all: true },
      },
    }
  );

  // Запрос должностей для авиакомпаний
  const { data: airlinePositionsData } = useQuery(GET_AIRLINE_POSITIONS, {
    context: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
    skip: type !== "airline" || !airlineId,
  });

  const [updateAirline] = useMutation(UPDATE_AIRLINE, {
    context: {
      headers: {
        Authorization: `Bearer ${token}`,
        "Apollo-Require-Preflight": true,
      },
    },
  });

  const [updateDispatcherDepartment] = useMutation(UPDATE_DISPATCHER_DEPARTMENT, {
    context: {
      headers: {
        Authorization: `Bearer ${token}`,
        "Apollo-Require-Preflight": true,
      },
    },
  });

  // Получаем текущий департамент
  const currentDepartment = useMemo(() => {
    if (type === "airline" && airlineData && departmentItem) {
      return airlineData.airline?.department?.find((d) => d.id === departmentItem.id);
    }
    if (type === "dispatcher" && dispatcherData && departmentId) {
      return dispatcherData.dispatcherDepartments?.departments?.find(
        (d) => d.id === departmentId
      );
    }
    return departmentItem;
  }, [type, airlineData, dispatcherData, departmentItem, departmentId]);

  // Загружаем данные при открытии
  useEffect(() => {
    if (show && currentDepartment) {
      setAccessMenu(currentDepartment.accessMenu || {});
      setNotificationMenu(currentDepartment.notificationMenu || {});

      if (type === "airline" && currentDepartment.position) {
        setPositionIds(currentDepartment.position.map((p) => String(p.id)));
      }
    }
  }, [show, currentDepartment, type]);

  useEffect(() => {
    if (airlinePositionsData) {
      setAirlinePositions(airlinePositionsData.getAirlinePositions || []);
    }
  }, [airlinePositionsData]);

  const addNotification = (text, status = "success") => {
    const id = Date.now();
    setNotifications((prev) => [...prev, { id, text, status }]);
    setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    }, fullNotifyTime);
  };

  const buildAccessPayload = (s) => ({
    requestMenu: !!s?.squadron?.access,
    requestCreate: !!s?.squadron?.create,
    requestChat: !!s?.squadron?.chat,
    requestUpdate: !!s?.squadron?.edit,

    transferMenu: !!s?.transfer?.access,
    transferCreate: !!s?.transfer?.create,
    transferUpdate: !!s?.transfer?.edit,
    transferChat: !!s?.transfer?.chat,

    reserveMenu: !!s?.passengers?.access,
    reserveCreate: !!s?.passengers?.create,
    reserveUpdate: !!s?.passengers?.edit,

    userMenu: !!s?.users?.access,
    userCreate: !!s?.users?.add,
    userUpdate: !!s?.users?.edit,

    personalMenu: !!s?.employees?.access,
    personalCreate: !!s?.employees?.add,
    personalUpdate: !!s?.employees?.edit,

    contracts: !!s?.contracts?.access,

    analyticsMenu: !!s?.analytics?.access,
    analyticsUpload: !!s?.analytics?.export,

    airlineMenu: !!s?.aboutAirlines?.access,
    airlineUpdate: !!s?.aboutAirlines?.edit,

    reportMenu: !!s?.reports?.access,
    reportCreate: !!s?.reports?.create,
  });

  const buildNotificationPayload = (s) => ({
    requestCreate: !!s?.requestCreate,
    requestDatesChange: !!s?.requestDatesChange,
    requestPlacementChange: !!s?.requestPlacementChange,
    requestCancel: !!s?.requestCancel,
    reserveCreate: !!s?.reserveCreate,
    reserveDatesChange: !!s?.reserveDatesChange,
    reserveUpdate: !!s?.reserveUpdate,
    reservePlacementChange: !!s?.reservePlacementChange,
    newMessage: !!s?.newMessage,
  });

  const handleSubmit = async () => {
    if (!isEditing) {
      setIsEditing(true);
      return;
    }

    try {
      setIsLoading(true);
      const accessPayload = buildAccessPayload(accessStateRef.current);
      const notificationPayload = buildNotificationPayload(notificationsStateRef.current);

      if (type === "airline" && airlineId && currentDepartment) {
        await updateAirline({
          variables: {
            updateAirlineId: airlineId,
            input: {
              department: [
                {
                  id: currentDepartment.id,
                  accessMenu: accessPayload,
                  notificationMenu: notificationPayload,
                  positionIds: positionIds,
                },
              ],
            },
          },
        });
        refetchAirline();
      } else if (type === "dispatcher" && departmentId) {
        await updateDispatcherDepartment({
          variables: {
            updateDispatcherDepartmentId: departmentId,
            input: {
              accessMenu: accessPayload,
              notificationMenu: notificationPayload,
            },
          },
        });
        refetchDispatcher();
      }

      addNotification("Изменения сохранены.", "success");
      setIsEditing(false);
    } catch (err) {
      console.error("Ошибка при сохранении настроек:", err);
      addNotification("Ошибка при сохранении. Попробуйте позже.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setIsEditing(false);
    setActiveTab("access");
    onClose();
  };

  const positionOptions = airlinePositions.map((i) => ({
    value: String(i.id),
    label: `${i.name}`,
  }));

  const loading = type === "airline" ? airlineLoading : dispatcherLoading;

  // Клик вне боковой панели закрывает её
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (sidebarRef.current && !sidebarRef.current.contains(event.target)) {
        handleClose();
      }
    };

    if (show) document.addEventListener("mousedown", handleClickOutside);
    else document.removeEventListener("mousedown", handleClickOutside);

    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [show, handleClose]);

  return (
    <Sidebar show={show} sidebarRef={sidebarRef}>
      <div className={classes.sidebarContent}>
        <div className={classes.header}>
          <div className={classes.headerLeft}>
            <h2 className={classes.title}>
              Настройки {currentDepartment?.name ? `"${currentDepartment.name}"` : ""}
            </h2>
          </div>
          <button className={classes.closeButton} onClick={handleClose}>
            <CloseIcon />
          </button>
        </div>

        <div className={classes.tabs}>
          <button
            className={`${classes.tab} ${activeTab === "access" ? classes.tabActive : ""}`}
            onClick={() => setActiveTab("access")}
          >
            Доступ
          </button>
          <button
            className={`${classes.tab} ${activeTab === "notifications" ? classes.tabActive : ""}`}
            onClick={() => setActiveTab("notifications")}
          >
            Уведомления
          </button>
        </div>

        <div className={classes.content}>
          {loading ? (
            <div className={classes.loaderContainer}>
              <MUILoader />
            </div>
          ) : (
            <>
              {activeTab === "access" && (
                <AccessPermissionsPanel
                  accessMenu={accessMenu}
                  stateRef={accessStateRef}
                  isEditing={isEditing}
                  type={type}
                  positionOptions={positionOptions}
                  positionIds={positionIds}
                  setPositionIds={setPositionIds}
                />
              )}
              {activeTab === "notifications" && (
                <NotificationsPermissionsPanel
                  notificationMenu={notificationMenu}
                  stateRef={notificationsStateRef}
                  isEditing={isEditing}
                />
              )}
            </>
          )}
        </div>

        <div className={classes.footer}>
          <button className={classes.cancelButton} onClick={handleClose}>
            Отмена
          </button>
          <Button
            onClick={handleSubmit}
            backgroundcolor={!isEditing ? "#3CBC6726" : "#0057C3"}
            color={!isEditing ? "#3B6C54" : "#fff"}
          >
            {isEditing ? (
              <>
                Сохранить <img src="/saveDispatcher.png" alt="" />
              </>
            ) : (
              <>
                Изменить <img src="/editDispetcher.png" alt="" />
              </>
            )}
          </Button>
        </div>
      </div>

      {notifications.map((n, index) => (
        <Notification
          key={n.id}
          text={n.text}
          status={n.status}
          index={index}
          onClose={() => {
            setNotifications((prev) => prev.filter((notif) => notif.id !== n.id));
          }}
        />
      ))}
    </Sidebar>
  );
}
