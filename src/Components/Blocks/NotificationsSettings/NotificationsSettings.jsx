import React, { useState, useEffect, useRef, useMemo } from "react";
import classes from "./NotificationsSettings.module.css";
import Header from "../Header/Header";
import {
  GET_AIRLINE_COMPANY,
  getCookie,
  UPDATE_AIRLINE,
} from "../../../../graphQL_requests";
import MUISwitch from "../MUISwitch/MUISwitch";
import MUILoader from "../MUILoader/MUILoader";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useMutation, useQuery } from "@apollo/client";
import { fullNotifyTime } from "../../../roles";
import Notification from "../../Notification/Notification";
import Button from "../../Standart/Button/Button";
import { isDispatcherRole } from "../../../utils/access";

export default function NotificationsSettings({ user }) {
  const token = getCookie("token");
  const location = useLocation();
  const navigate = useNavigate();

  const [isLoading, setIsLoading] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [isEditing, setIsEditing] = useState(false);

  const [notificationMenu, setNotificationMenu] = useState();
  const airlineId = location?.state?.airlineId;

  const { loading, error, data, refetch } = useQuery(GET_AIRLINE_COMPANY, {
    context: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
    skip: !airlineId,
    variables: { airlineId: airlineId },
  });

  const [updateAirline] = useMutation(UPDATE_AIRLINE, {
    context: {
      headers: {
        Authorization: `Bearer ${token}`,
        "Apollo-Require-Preflight": true,
      },
    },
  });

  useEffect(() => {
    if (data && airlineId) {
      const sortedDepartment = data.airline.department.find(
        (i) => i.id === location.state.item?.id
      );
      setNotificationMenu(sortedDepartment?.notificationMenu);
    }
  }, [data, airlineId]);

  // реф, чтобы при сабмите забрать актуальный локальный стейт из дочерней панели
  const localStateRef = useRef(null);

  const addNotification = (text, status = "success") => {
    const id = Date.now();
    setNotifications((prev) => [...prev, { id, text, status }]);
    setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    }, fullNotifyTime);
  };

  // сборка payload для notificationMenu
  const buildNotificationPayload = (s) => ({
    requestCreate: !!s?.requestCreate,
    requestDatesChange: !!s?.requestDatesChange,
    requestPlacementChange: !!s?.requestPlacementChange,
    requestCancel: !!s?.requestCancel,
    passengerRequestCreate: !!s?.passengerRequestCreate,
    passengerRequestDatesChange: !!s?.passengerRequestDatesChange,
    passengerRequestUpdate: !!s?.passengerRequestUpdate,
    passengerRequestPlacementChange: !!s?.passengerRequestPlacementChange,
    passengerRequestCancel: !!s?.passengerRequestCancel,
    newMessage: !!s?.newMessage,
  });

  const handleSubmit = async () => {
    if (!isEditing) {
      setIsEditing(true);
      return;
    }

    try {
      setIsLoading(true);
      const current = localStateRef.current;
      const notificationPayload = buildNotificationPayload(current);

      await updateAirline({
        variables: {
          updateAirlineId: airlineId,
          input: {
            department: [
              {
                id: location?.state?.item?.id,
                notificationMenu: notificationPayload,
              },
            ],
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

  return (
    <>
      <div className={classes.section}>
        <Header>
          <div className={classes.titleHeader}>
            <Link to={`/airlines/${airlineId}`} className={classes.backButton}>
              <img src="/arrow.png" alt="" />
            </Link>
            Настройки уведомлений{" "}
            {location?.state?.item?.name ? `"${location.state.item.name}"` : ""}
          </div>
        </Header>

        <div className={classes.segmented}>
          <button className={`${classes.segment} ${classes.segmentActive}`}>
            Уведомления
          </button>
          <button
            className={classes.segment}
            onClick={() => {
              const accessPath = isDispatcherRole(user) ? "/airlineAccess" : "/access";
              navigate(accessPath, { state: location?.state });
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
            {/* <button
              className={classes.saveBtn}
              onClick={handleSubmit}
              disabled={isLoading}
            >
            </button> */}
          </div>
        </div>

        {!isLoading && !loading && (
          <>
            <NotificationsPanel
              notificationMenu={notificationMenu}
              stateRef={localStateRef}
              isEditing={isEditing}
            />
          </>
        )}
        {(isLoading || loading) && <MUILoader fullHeight={"70vh"} />}
      </div>

      {notifications.map((n, index) => (
        <Notification
          key={n.id}
          text={n.text}
          status={n.status}
          index={index}
          onClose={() => {
            setNotifications((prev) =>
              prev.filter((notif) => notif.id !== n.id)
            );
          }}
        />
      ))}
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
      passengerRequestCreate: b(notificationMenu?.passengerRequestCreate),
      passengerRequestDatesChange: b(
        notificationMenu?.passengerRequestDatesChange
      ),
      passengerRequestUpdate: b(notificationMenu?.passengerRequestUpdate),
      passengerRequestPlacementChange: b(
        notificationMenu?.passengerRequestPlacementChange
      ),
      passengerRequestCancel: b(notificationMenu?.passengerRequestCancel),
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

        <SectionCard title="ФАП">
          <RowSwitch
            label="Создание"
            checked={state.passengerRequestCreate}
            onChange={(v) => set("passengerRequestCreate", v)}
            disabled={!isEditing}
          />
          <RowSwitch
            label="Запрос на изменение дат"
            checked={state.passengerRequestDatesChange}
            onChange={(v) => set("passengerRequestDatesChange", v)}
            disabled={!isEditing}
          />
          <RowSwitch
            label="Обновление"
            checked={state.passengerRequestUpdate}
            onChange={(v) => set("passengerRequestUpdate", v)}
            disabled={!isEditing}
          />
          <RowSwitch
            label="Смена размещения"
            checked={state.passengerRequestPlacementChange}
            onChange={(v) => set("passengerRequestPlacementChange", v)}
            disabled={!isEditing}
          />
          <RowSwitch
            label="Отмена"
            checked={state.passengerRequestCancel}
            onChange={(v) => set("passengerRequestCancel", v)}
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

// Вспомогательные UI-элементы
function SectionCard({ title, children, mailBrowser }) {
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
