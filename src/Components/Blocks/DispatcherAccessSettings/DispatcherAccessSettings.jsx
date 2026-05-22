import React, { useState, useEffect, useRef, useMemo } from "react";
import classes from "./DispatcherAccessSettings.module.css";
import Header from "../Header/Header";
import {
  GET_DISPATCHER_DEPARTMENTS,
  UPDATE_DISPATCHER_DEPARTMENT,
  getCookie,
} from "../../../../graphQL_requests";
import MUILoader from "../MUILoader/MUILoader";
import AccessPermissionsPanel from "../SettingsSidebar/AccessPermissionsPanel";
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
            type="dispatcher"
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

