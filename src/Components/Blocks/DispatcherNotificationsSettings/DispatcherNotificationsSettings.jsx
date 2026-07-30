import React, { useState, useEffect, useRef, useMemo } from "react";
import classes from "./DispatcherNotificationsSettings.module.css";
import Header from "../Header/Header";
import {
  GET_DISPATCHER_DEPARTMENTS,
  UPDATE_DISPATCHER_DEPARTMENT,
  getCookie,
} from "../../../../graphQL_requests";
import MUILoader from "../MUILoader/MUILoader";
import { useLocation, useNavigate } from "react-router-dom";
import { useMutation, useQuery } from "@apollo/client";
import { fullNotifyTime } from "../../../roles";
import Notification from "../../Notification/Notification";
import Button from "../../Standart/Button/Button";
import NotificationsPermissionsPanel from "../SettingsSidebar/NotificationsPermissionsPanel";
import { buildNotificationPayload } from "../../../utils/notificationPayload";

export default function DispatcherNotificationsSettings() {
  const token = getCookie("token");
  const location = useLocation();
  const navigate = useNavigate();

  const departmentId = location?.state?.departmentId;

  const [isLoading, setIsLoading] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [isEditing, setIsEditing] = useState(false);

  const [notificationMenu, setNotificationMenu] = useState();

  const { loading, error, data, refetch } = useQuery(
    GET_DISPATCHER_DEPARTMENTS,
    {
      context: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
      skip: !departmentId,
      variables: {
        pagination: { all: true },
      },
    }
  );

  const department = useMemo(() => {
    return data?.dispatcherDepartments?.departments?.find(
      (item) => item.id === departmentId
    );
  }, [data, departmentId]);

  const [updateDispatcherDepartment] = useMutation(UPDATE_DISPATCHER_DEPARTMENT, {
    context: {
      headers: {
        Authorization: `Bearer ${token}`,
        "Apollo-Require-Preflight": true,
      },
    },
  });

  useEffect(() => {
    if (department) {
      setNotificationMenu(department.notificationMenu);
    }
  }, [department]);

  const localStateRef = useRef(null);

  const addNotification = (text, status = "success") => {
    const id = Date.now();
    setNotifications((prev) => [...prev, { id, text, status }]);
    setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    }, fullNotifyTime);
  };

  const handleSubmit = async () => {
    if (!isEditing) {
      setIsEditing(true);
      return;
    }

    if (!department) {
      addNotification("Отдел не найден.", "error");
      return;
    }

    try {
      setIsLoading(true);
      const current = localStateRef.current;
      const notificationPayload = buildNotificationPayload(current);

      await updateDispatcherDepartment({
        variables: {
          updateDispatcherDepartmentId: department.id,
          input: {
            notificationMenu: notificationPayload,
          },
        },
      });
      refetch();
      addNotification("Изменения сохранены.", "success");
    } catch (err) {
      console.error("Ошибка при сохранении настроек уведомлений:", err);
      addNotification("Ошибка при сохранении. Попробуйте позже.", "error");
    } finally {
      setIsLoading(false);
      setIsEditing(false);
    }
  };

  if (!departmentId) {
    return <div className={classes.emptyState}>Отдел не найден.</div>;
  }

  return (
    <>
      <div className={classes.section}>
        <Header>
          <div className={classes.titleHeader}>
            <button
              type="button"
              className={classes.backButton}
              onClick={() => navigate("/company")}
            >
              <img src="/arrow.png" alt="" />
            </button>
            Настройки уведомлений{" "}
            {department?.name ? `"${department.name}"` : ""}
          </div>
        </Header>

        <div className={classes.segmented}>
          <button className={`${classes.segment} ${classes.segmentActive}`}>
            Уведомления
          </button>
          <button
            className={classes.segment}
            onClick={() => {
              navigate("/dispatcherAccess", { state: location?.state });
            }}
          >
            Доступ
          </button>
          <div className={classes.saveBar}>
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

        {loading && <MUILoader fullHeight={"60vh"} />}
        {error && <p>Error: {error.message}</p>}

        {!loading && !error && (
          <NotificationsPermissionsPanel
            notificationMenu={notificationMenu || {}}
            stateRef={localStateRef}
            isEditing={isEditing}
            styles={classes}
            showBulkToggle={false}
          />
        )}

        {notifications.map((n, index) => (
          <Notification
            key={n.id}
            text={n.text}
            status={n.status}
            index={index}
            time={fullNotifyTime}
            onClose={() => {
              setNotifications((prev) =>
                prev.filter((notif) => notif.id !== n.id)
              );
            }}
          />
        ))}
      </div>
    </>
  );
}

