import React, { useState, useEffect, useRef, useMemo } from "react";
import classes from "./DispatcherNotificationsSettings.module.css";
import Header from "../Header/Header";
import {
  GET_DISPATCHER_DEPARTMENTS,
  UPDATE_DISPATCHER_DEPARTMENT,
  getCookie,
} from "../../../../graphQL_requests";
import MUISwitch from "../MUISwitch/MUISwitch";
import MUILoader from "../MUILoader/MUILoader";
import { useLocation, useNavigate } from "react-router-dom";
import { useMutation, useQuery } from "@apollo/client";
import { fullNotifyTime } from "../../../roles";
import Notification from "../../Notification/Notification";
import Button from "../../Standart/Button/Button";

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
          <NotificationsPanel
            notificationMenu={notificationMenu || {}}
            stateRef={localStateRef}
            isEditing={isEditing}
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

function NotificationsPanel({ notificationMenu = {}, stateRef, isEditing }) {
  const b = (v) => !!v;

  const initial = useMemo(
    () => ({
      requestCreate: b(notificationMenu?.requestCreate),
      requestDatesChange: b(notificationMenu?.requestDatesChange),
      requestPlacementChange: b(notificationMenu?.requestPlacementChange),
      requestCancel: b(notificationMenu?.requestCancel),
      reserveCreate: b(notificationMenu?.reserveCreate),
      reserveDatesChange: b(notificationMenu?.reserveDatesChange),
      reserveUpdate: b(notificationMenu?.reserveUpdate),
      reservePlacementChange: b(notificationMenu?.reservePlacementChange),
      newMessage: b(notificationMenu?.newMessage),
    }),
    [notificationMenu]
  );

  const [state, setState] = useState(initial);

  useEffect(() => setState(initial), [initial]);

  useEffect(() => {
    if (stateRef) stateRef.current = state;
  }, [state, stateRef]);

  const set = (key, value) => setState((s) => ({ ...s, [key]: value }));

  return (
    <div className={classes.accessPanel}>
      <div className={classes.accessGrid}>
        <SectionCard title="Заявки">
          <RowSwitch
            label="Создание заявки"
            checked={state.requestCreate}
            onChange={(v) => set("requestCreate", v)}
            disabled={!isEditing}
          />
          <RowSwitch
            label="Изменение дат заявки"
            checked={state.requestDatesChange}
            onChange={(v) => set("requestDatesChange", v)}
            disabled={!isEditing}
          />
          <RowSwitch
            label="Смена размещения заявки"
            checked={state.requestPlacementChange}
            onChange={(v) => set("requestPlacementChange", v)}
            disabled={!isEditing}
          />
          <RowSwitch
            label="Отмена заявки"
            checked={state.requestCancel}
            onChange={(v) => set("requestCancel", v)}
            disabled={!isEditing}
          />
        </SectionCard>

        <SectionCard title="Брони">
          <RowSwitch
            label="Создание брони"
            checked={state.reserveCreate}
            onChange={(v) => set("reserveCreate", v)}
            disabled={!isEditing}
          />
          <RowSwitch
            label="Запрос на изменение дат брони"
            checked={state.reserveDatesChange}
            onChange={(v) => set("reserveDatesChange", v)}
            disabled={!isEditing}
          />
          <RowSwitch
            label="Обновление брони"
            checked={state.reserveUpdate}
            onChange={(v) => set("reserveUpdate", v)}
            disabled={!isEditing}
          />
          <RowSwitch
            label="Смена размещения брони"
            checked={state.reservePlacementChange}
            onChange={(v) => set("reservePlacementChange", v)}
            disabled={!isEditing}
          />
        </SectionCard>

        <SectionCard title="Сообщения">
          <RowSwitch
            label="Новое сообщение в чате"
            checked={state.newMessage}
            onChange={(v) => set("newMessage", v)}
            disabled={!isEditing}
          />
        </SectionCard>
      </div>
    </div>
  );
}

function SectionCard({ title, children }) {
  return (
    <div className={classes.card}>
      <div className={classes.cardTitle}>
        <span className={classes.title}>{title}</span>{" "}
        <span className={classes.mail}>на почту</span>{" "}
        <span className={classes.browser}>уведомление в браузере</span>
      </div>
      <div className={classes.cardBody}>{children}</div>
    </div>
  );
}

function RowSwitch({ label, checked, onChange, disabled }) {
  return (
    <div className={`${classes.row} ${disabled ? classes.rowDisabled : ""}`}>
      <div className={classes.rowLabel}>{label}</div>
      <div className={classes.rowControl}>
        <MUISwitch
          label=""
          checked={!!checked}
          onChange={(e) => onChange(e.target.checked)}
          disabled={!!disabled}
        />
        <input type="checkbox" name="" id="" disabled={!!disabled} />
        <input type="checkbox" name="" id="" disabled={!!disabled} />
      </div>
    </div>
  );
}
