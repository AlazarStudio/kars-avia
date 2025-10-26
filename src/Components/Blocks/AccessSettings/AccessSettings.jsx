import React, { useState, useEffect, useRef, useMemo } from "react";
import classes from "./AccessSettings.module.css";
import Header from "../Header/Header";
import {
  GET_AIRLINE_COMPANY,
  GET_AIRLINE_POSITIONS,
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
import MultiSelectAutocomplete from "../MultiSelectAutocomplete/MultiSelectAutocomplete";

export default function AccessSettings() {
  const token = getCookie("token");
  const location = useLocation();
  const navigate = useNavigate();

  const [isLoading, setIsLoading] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [isEditing, setIsEditing] = useState(false);

  const [accessMenu, setAccessMenu] = useState();
  const [airlinePositions, setAirlinePositions] = useState([]);
  // const [department, setDepartment] = useState();
  // const accessMenuFromRoute = location?.state?.item?.accessMenu || {};
  const airlineId = location?.state?.airlineId;
  const [positionIds, setPositionIds] = useState([]);

  const { loading, error, data, refetch } = useQuery(GET_AIRLINE_COMPANY, {
    context: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
    skip: !airlineId,
    variables: { airlineId: airlineId },
  });

  const { data: airlinePositionsData } = useQuery(GET_AIRLINE_POSITIONS, {
    context: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
    skip: !airlineId,
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
      // console.log(sortedDepartment);

      setAccessMenu(sortedDepartment.accessMenu);
      setPositionIds(sortedDepartment?.position?.map((i) => String(i.id)));
      // setDepartment(sortedDepartment);
    }
    if (airlinePositionsData) {
      setAirlinePositions(airlinePositionsData?.getAirlinePositions);
    }
  }, [data, airlinePositionsData, airlineId]);

  const positionOptions = airlinePositions.map((i) => ({
    value: String(i.id), // используем value вместо id
    label: `${i.name}`,
  }));

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

    contracts: !!s?.contracts?.access,

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
      // console.log(department);

      await updateAirline({
        variables: {
          updateAirlineId: airlineId,
          input: {
            department: [
              {
                id: location?.state?.item?.id,
                accessMenu: department,
                positionIds: positionIds,
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
            Настройки доступа{" "}
            {location?.state?.item?.name ? `"${location.state.item.name}"` : ""}
          </div>
        </Header>

        <div className={classes.segmented}>
          <button
            className={classes.segment}
            onClick={() => {
              navigate("/notifications", { state: location?.state });
            }}
          >
            Уведомления
          </button>
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
              positionOptions={positionOptions}
              positionIds={positionIds}
              setPositionIds={setPositionIds}
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

function AccessPermissionsPanel({ accessMenu = {}, positionOptions, positionIds, setPositionIds, stateRef, isEditing }) {
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
      contracts: {
        access: b(accessMenu.contracts)
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
      <SectionCard title="Должности">
        <MultiSelectAutocomplete
          isDisabled={!isEditing}
          isMultiple={true}
          dropdownWidth={"32.5%"}
          label={"Выберите должности"}
          options={positionOptions}
          // Фильтруем options, используя значение поля value (которое совпадает с id)
          value={positionOptions.filter((option) =>
            positionIds?.includes(option.value)
          )}
          onChange={(event, newValue) => {
            setPositionIds(newValue.map((option) => option.value));
          }}
        />
      </SectionCard>
      <div className={classes.accessGrid}>
        {/* Эскадрилья */}
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

        {/* Пассажиры */}
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

        {/* Пользователи */}
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

        {/* Сотрудники */}
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

        <SectionCard title="Договоры">
          <RowSwitch
            label="Доступ к разделу"
            checked={state.contracts.access}
            onChange={(v) => set("contracts", "access", v)}
            disabled={!isEditing}
          />
        </SectionCard>

        {/* Аналитика */}
        <SectionCard title="Аналитика">
          <RowSwitch
            label="Доступ к разделу"
            checked={state.analytics.access}
            onChange={(v) => set("analytics", "access", v)}
            disabled={!isEditing}
          />
          {/* <RowSwitch
            label="Выгрузка аналитики"
            checked={state.analytics.export}
            onChange={(v) => set("analytics", "export", v)}
            disabled={!isEditing || !state.analytics.access}
          /> */}
        </SectionCard>

        {/* Об авиакомпании */}
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

        {/* Отчёты */}
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

// Вспомогательные UI-элементы
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
