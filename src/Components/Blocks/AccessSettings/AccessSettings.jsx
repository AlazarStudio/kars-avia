import React, { useState, useEffect, useRef } from "react";
import classes from "./AccessSettings.module.css";
import Header from "../Header/Header";
import {
  GET_AIRLINE_COMPANY,
  getCookie,
  UPDATE_AIRLINE,
} from "../../../../graphQL_requests";
import MUILoader from "../MUILoader/MUILoader";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useMutation, useQuery } from "@apollo/client";
import { fullNotifyTime } from "../../../roles";
import Notification from "../../Notification/Notification";
import Button from "../../Standart/Button/Button";
import { isDispatcherRole, isAirlineRole } from "../../../utils/access";
import { buildAccessPayload } from "../../../utils/accessPayload";
import AccessPermissionsPanel from "../SettingsSidebar/AccessPermissionsPanel";
import { LEGACY_SECTION_KEYS } from "../SettingsSidebar/accessSections";

export default function AccessSettings({ user }) {
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
      // console.log(sortedDepartment);

      setAccessMenu(sortedDepartment?.accessMenu);
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
            <Link
              to={isAirlineRole(user) ? "/airlineCompany" : `/airlines/${airlineId}`}
              className={classes.backButton}
            >
              <img src="/arrow.png" alt="" />
            </Link>
            Настройки доступа{" "}
            {location?.state?.item?.name ? `"${location.state.item.name}"` : ""}
          </div>
        </Header>

        <div className={classes.segmented}>
          {/* <button
            className={classes.segment}
            onClick={() => {
              const notificationsPath = isDispatcherRole(user) ? "/airlineNotifications" : "/notifications";
              navigate(notificationsPath, { state: location?.state });
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
              granularity="detailed"
              styles={classes}
              sections={LEGACY_SECTION_KEYS}
              showBulkToggle={false}
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
