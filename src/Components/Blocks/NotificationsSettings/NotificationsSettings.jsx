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

export default function NotificationsSettings() {
  const token = getCookie("token");
  const location = useLocation();
  const navigate = useNavigate();

  const [isLoading, setIsLoading] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [isEditing, setIsEditing] = useState(false);

  const [accessMenu, setAccessMenu] = useState();
  // const [department, setDepartment] = useState();
  // const accessMenuFromRoute = location?.state?.item?.accessMenu || {};
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
      setAccessMenu(sortedDepartment.accessMenu);
      // setDepartment(sortedDepartment);
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

  // сборка payload (строго boolean; null/undefined → false)
  const buildAccessPayload = (s) => ({
    requestMenu: !!s?.squadron?.access,
    requestCreate: !!s?.squadron?.create,
    requestChat: !!s?.squadron?.chat,
    requestUpdate: !!s?.squadron?.edit,

    reserveMenu: !!s?.passengers?.access,
    reserveCreate: !!s?.passengers?.create,
    reserveUpdate: !!s?.passengers?.edit,

    userMenu: !!s?.users?.access,
    userCreate: !!s?.users?.add,
    userUpdate: !!s?.users?.edit,

    personalMenu: !!s?.employees?.access,
    personalCreate: !!s?.employees?.add,
    personalUpdate: !!s?.employees?.edit,

    analyticsMenu: !!s?.analytics?.access,
    analyticsUpload: !!s?.analytics?.export,

    airlineMenu: !!s?.aboutAirlines?.access,
    airlineUpdate: !!s?.aboutAirlines?.edit,

    reportMenu: !!s?.reports?.access,
    reportCreate: !!s?.reports?.create,
  });

  const handleSubmit = async () => {
    if (!isEditing) {
      setIsEditing(true);
      return;
    }

    try {
      setIsLoading(true);
      const current = localStateRef.current; // актуальный UI-стейт
      const department = buildAccessPayload(current);
      console.log(department);

      await updateAirline({
        variables: {
          updateAirlineId: airlineId,
          input: {
            department: [
              {
                accessMenu: department,
                id: location?.state?.item?.id,
              },
            ],
          },
        },
      });
      refetch();
      addNotification("Изменения сохранены.", "success");
    } catch (err) {
      console.error("Ошибка при сохранении прав:", err);
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
              navigate("/access", { state: location?.state });
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
            <AccessPermissionsPanel
              accessMenu={accessMenu}
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

function AccessPermissionsPanel({ accessMenu = {}, stateRef, isEditing }) {
  // безопасный boolean
  const b = (v) => !!v;

  const initial = useMemo(
    () => ({
      squadron: {
        access: b(accessMenu.requestMenu),
        create: b(accessMenu.requestCreate),
        chat: b(accessMenu.requestChat),
        edit: b(accessMenu.requestUpdate),
      },
      passengers: {
        access: b(accessMenu.reserveMenu),
        create: b(accessMenu.reserveCreate),
        edit: b(accessMenu.reserveUpdate),
      },
      users: {
        access: b(accessMenu.userMenu),
        add: b(accessMenu.userCreate),
        edit: b(accessMenu.userUpdate),
      },
      employees: {
        access: b(accessMenu.personalMenu),
        add: b(accessMenu.personalCreate),
        edit: b(accessMenu.personalUpdate),
      },
      analytics: {
        access: b(accessMenu.analyticsMenu),
        export: b(accessMenu.analyticsUpload),
      },
      aboutAirlines: {
        access: b(accessMenu.airlineMenu),
        edit: b(accessMenu.airlineUpdate),
      },
      reports: {
        access: b(accessMenu.reportMenu),
        create: b(accessMenu.reportCreate),
      },
    }),
    [accessMenu]
  );

  const [state, setState] = useState(initial);

  // если пришли новые пропсы (другая компания) — синхронизируем
  useEffect(() => setState(initial), [initial]);

  // отдаём родителю актуальное значение через ref
  useEffect(() => {
    if (stateRef) stateRef.current = state;
  }, [state, stateRef]);

  const set = (section, key, value) =>
    setState((s) => ({ ...s, [section]: { ...s[section], [key]: value } }));

  return (
    <div className={classes.accessPanel}>
      <div className={classes.accessGrid}>
        <SectionCard title="Эскадрилья">
          <RowSwitch
            label="Смена статуса заявки"
            checked={state.squadron.access}
            onChange={(v) => set("squadron", "access", v)}
            disabled={!isEditing}
          />
          <RowSwitch
            label="Изменения в заявке"
            checked={state.squadron.create}
            onChange={(v) => set("squadron", "create", v)}
            disabled={!isEditing || !state.squadron.access}
          />
          <RowSwitch
            label="Сообщение в чате заявки"
            checked={state.squadron.chat}
            onChange={(v) => set("squadron", "chat", v)}
            disabled={!isEditing || !state.squadron.access}
          />
          {/* <RowSwitch
            label="Редактирование заявки"
            checked={state.squadron.edit}
            onChange={(v) => set("squadron", "edit", v)}
            disabled={!isEditing || !state.squadron.access}
          /> */}
        </SectionCard>

        <SectionCard title="Пассажиры">
          <RowSwitch
            label="Смена статуса заявки"
            checked={state.passengers.access}
            onChange={(v) => set("passengers", "access", v)}
            disabled={!isEditing}
          />
          <RowSwitch
            label="Изменения в заявке"
            checked={state.passengers.create}
            onChange={(v) => set("passengers", "create", v)}
            disabled={!isEditing || !state.passengers.access}
          />
          <RowSwitch
            label="Сообщение в чате заявки "
            checked={state.passengers.edit}
            onChange={(v) => set("passengers", "edit", v)}
            disabled={!isEditing || !state.passengers.access}
          />
        </SectionCard>

        <SectionCard title="Техподдержка">
          <RowSwitch
            label="Сообщение от техподдержки"
            checked={state.employees.access}
            onChange={(v) => set("employees", "access", v)}
            disabled={!isEditing}
          />
        </SectionCard>

        {/* Аналитика */}
        <SectionCard title="Обновления">
          <RowSwitch
            label="Сообщение об обновлениях системы"
            checked={state.analytics.access}
            onChange={(v) => set("analytics", "access", v)}
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
