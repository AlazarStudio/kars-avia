import React, { useState, useEffect, useRef, useMemo } from "react";
import classes from "./DispatcherAccessSettings.module.css";
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

export default function DispatcherAccessSettings() {
  const token = getCookie("token");
  const location = useLocation();
  const navigate = useNavigate();

  const departmentId = location?.state?.departmentId;

  const [isLoading, setIsLoading] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [isEditing, setIsEditing] = useState(false);

  const [accessMenu, setAccessMenu] = useState();

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
      setAccessMenu(department.accessMenu);
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
    contractCreate: !!s?.contracts?.create,
    contractUpdate: !!s?.contracts?.edit,

    analyticsMenu: !!s?.analytics?.access,
    analyticsUpload: !!s?.analytics?.export,

    airlineMenu: !!s?.aboutAirlines?.access,
    airlineUpdate: !!s?.aboutAirlines?.edit,

    reportMenu: !!s?.reports?.access,
    reportCreate: !!s?.reports?.create,

    organizationMenu: !!s?.organization?.access,
    organizationCreate: !!s?.organization?.create,
    organizationUpdate: !!s?.organization?.edit,
    organizationAddDrivers: !!s?.organization?.addDrivers,
    organizationAcceptDrivers: !!s?.organization?.acceptDrivers,
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
      const accessPayload = buildAccessPayload(current);

      await updateDispatcherDepartment({
        variables: {
          updateDispatcherDepartmentId: department.id,
          input: {
            // name: department.name,
            // email: department.email || null,
            // active: department.active ?? true,
            accessMenu: accessPayload,
            // notificationMenu: department.notificationMenu || {},
            // dispatcherIds:
            //   department.dispatchers?.map((dispatcher) => dispatcher.id) || [],
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
            Настройки доступа{" "}
            {department?.name ? `"${department.name}"` : ""}
          </div>
        </Header>

        <div className={classes.segmented}>
          {/* <button
            className={classes.segment}
            onClick={() => {
              navigate("/dispatcherNotifications", { state: location?.state });
            }}
          >
            Уведомления
          </button> */}
          <button className={`${classes.segment} ${classes.segmentActive}`}>
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
          <AccessPermissionsPanel
            accessMenu={accessMenu || {}}
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

function AccessPermissionsPanel({ accessMenu = {}, stateRef, isEditing }) {
  const b = (v) => !!v;

  const initial = useMemo(
    () => ({
      squadron: {
        access: b(accessMenu?.requestMenu),
        create: b(accessMenu?.requestCreate),
        chat: b(accessMenu?.requestChat),
        edit: b(accessMenu?.requestUpdate),
      },
      transfer: {
        access: b(accessMenu?.transferMenu),
        create: b(accessMenu?.transferCreate),
        edit: b(accessMenu?.transferUpdate),
        chat: b(accessMenu?.transferChat),
      },
      passengers: {
        access: b(accessMenu?.reserveMenu),
        create: b(accessMenu?.reserveCreate),
        edit: b(accessMenu?.reserveUpdate),
      },
      users: {
        access: b(accessMenu?.userMenu),
        add: b(accessMenu?.userCreate),
        edit: b(accessMenu?.userUpdate),
      },
      employees: {
        access: b(accessMenu?.personalMenu),
        add: b(accessMenu?.personalCreate),
        edit: b(accessMenu?.personalUpdate),
      },
      contracts: {
        access: b(accessMenu?.contracts),
        create: b(accessMenu?.contractCreate),
        edit: b(accessMenu?.contractUpdate),
      },
      analytics: {
        access: b(accessMenu?.analyticsMenu),
        export: b(accessMenu?.analyticsUpload),
      },
      aboutAirlines: {
        access: b(accessMenu?.airlineMenu),
        edit: b(accessMenu?.airlineUpdate),
      },
      reports: {
        access: b(accessMenu?.reportMenu),
        create: b(accessMenu?.reportCreate),
      },
      organization: {
        access: b(accessMenu?.organizationMenu),
        create: b(accessMenu?.organizationCreate),
        edit: b(accessMenu?.organizationUpdate),
        addDrivers: b(accessMenu?.organizationAddDrivers),
        acceptDrivers: b(accessMenu?.organizationAcceptDrivers),
      },
    }),
    [accessMenu]
  );

  const [state, setState] = useState(initial);

  useEffect(() => setState(initial), [initial]);

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
            label="Доступ к разделу"
            checked={state.squadron.access}
            onChange={(v) => set("squadron", "access", v)}
            disabled={!isEditing}
          />
          <RowSwitch
            label="Создание заявки"
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
          <RowSwitch
            label="Редактирование заявки"
            checked={state.squadron.edit}
            onChange={(v) => set("squadron", "edit", v)}
            disabled={!isEditing || !state.squadron.access}
          />
        </SectionCard>

        <SectionCard title="Автопарк">
          <RowSwitch
            label="Доступ к разделу"
            checked={state.organization.access}
            onChange={(v) => set("organization", "access", v)}
            disabled={!isEditing}
          />
          <RowSwitch
            label="Создание организаций"
            checked={state.organization.create}
            onChange={(v) => set("organization", "create", v)}
            disabled={!isEditing || !state.organization.access}
          />
          <RowSwitch
            label="Редактирование организаций"
            checked={state.organization.edit}
            onChange={(v) => set("organization", "edit", v)}
            disabled={!isEditing || !state.organization.access}
          />
          <RowSwitch
            label="Добавление водителей"
            checked={state.organization.addDrivers}
            onChange={(v) => set("organization", "addDrivers", v)}
            disabled={!isEditing || !state.organization.access}
          />
          <RowSwitch
            label="Приём водителей"
            checked={state.organization.acceptDrivers}
            onChange={(v) => set("organization", "acceptDrivers", v)}
            disabled={!isEditing || !state.organization.access}
          />
        </SectionCard>

        <SectionCard title="Трансфер">
          <RowSwitch
            label="Доступ к разделу"
            checked={state.transfer.access}
            onChange={(v) => set("transfer", "access", v)}
            disabled={!isEditing}
          />
          <RowSwitch
            label="Создание заявки"
            checked={state.transfer.create}
            onChange={(v) => set("transfer", "create", v)}
            disabled={!isEditing || !state.transfer.access}
          />
          <RowSwitch
            label="Сообщение в чате заявки"
            checked={state.transfer.chat}
            onChange={(v) => set("transfer", "chat", v)}
            disabled={!isEditing || !state.transfer.access}
          />
          <RowSwitch
            label="Редактирование заявки"
            checked={state.transfer.edit}
            onChange={(v) => set("transfer", "edit", v)}
            disabled={!isEditing || !state.transfer.access}
          />
        </SectionCard>

        <SectionCard title="Пассажиры">
          <RowSwitch
            label="Доступ к разделу"
            checked={state.passengers.access}
            onChange={(v) => set("passengers", "access", v)}
            disabled={!isEditing}
          />
          <RowSwitch
            label="Создание заявки"
            checked={state.passengers.create}
            onChange={(v) => set("passengers", "create", v)}
            disabled={!isEditing || !state.passengers.access}
          />
          <RowSwitch
            label="Редактирование заявки"
            checked={state.passengers.edit}
            onChange={(v) => set("passengers", "edit", v)}
            disabled={!isEditing || !state.passengers.access}
          />
        </SectionCard>

        <SectionCard title="Пользователи">
          <RowSwitch
            label="Доступ к разделу"
            checked={state.users.access}
            onChange={(v) => set("users", "access", v)}
            disabled={!isEditing}
          />
          <RowSwitch
            label="Добавление пользователей"
            checked={state.users.add}
            onChange={(v) => set("users", "add", v)}
            disabled={!isEditing || !state.users.access}
          />
          <RowSwitch
            label="Редактирование"
            checked={state.users.edit}
            onChange={(v) => set("users", "edit", v)}
            disabled={!isEditing || !state.users.access}
          />
        </SectionCard>

        <SectionCard title="Сотрудники">
          <RowSwitch
            label="Доступ к разделу"
            checked={state.employees.access}
            onChange={(v) => set("employees", "access", v)}
            disabled={!isEditing}
          />
          <RowSwitch
            label="Добавление сотрудников"
            checked={state.employees.add}
            onChange={(v) => set("employees", "add", v)}
            disabled={!isEditing || !state.employees.access}
          />
          <RowSwitch
            label="Редактирование"
            checked={state.employees.edit}
            onChange={(v) => set("employees", "edit", v)}
            disabled={!isEditing || !state.employees.access}
          />
        </SectionCard>

        <SectionCard title="Реестр договоров">
          <RowSwitch
            label="Доступ к разделу"
            checked={state.contracts.access}
            onChange={(v) => set("contracts", "access", v)}
            disabled={!isEditing}
          />
          <RowSwitch
            label="Создание договоров"
            checked={state.contracts.create}
            onChange={(v) => set("contracts", "create", v)}
            disabled={!isEditing || !state.contracts.access}
          />
          <RowSwitch
            label="Редактирование"
            checked={state.contracts.edit}
            onChange={(v) => set("contracts", "edit", v)}
            disabled={!isEditing || !state.contracts.access}
          />
        </SectionCard>

        <SectionCard title="Аналитика">
          <RowSwitch
            label="Доступ к разделу"
            checked={state.analytics.access}
            onChange={(v) => set("analytics", "access", v)}
            disabled={!isEditing}
          />
        </SectionCard>

        <SectionCard title="Об авиакомпании">
          <RowSwitch
            label="Доступ к разделу"
            checked={state.aboutAirlines.access}
            onChange={(v) => set("aboutAirlines", "access", v)}
            disabled={!isEditing}
          />
          <RowSwitch
            label="Редактирование"
            checked={state.aboutAirlines.edit}
            onChange={(v) => set("aboutAirlines", "edit", v)}
            disabled={!isEditing || !state.aboutAirlines.access}
          />
        </SectionCard>

        <SectionCard title="Отчёты">
          <RowSwitch
            label="Доступ к разделу"
            checked={state.reports.access}
            onChange={(v) => set("reports", "access", v)}
            disabled={!isEditing}
          />
          <RowSwitch
            label="Создание"
            checked={state.reports.create}
            onChange={(v) => set("reports", "create", v)}
            disabled={!isEditing || !state.reports.access}
          />
        </SectionCard>
      </div>
    </div>
  );
}

function SectionCard({ title, children }) {
  return (
    <div className={classes.card}>
      <div className={classes.cardTitle}>{title}</div>
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
      </div>
    </div>
  );
}
