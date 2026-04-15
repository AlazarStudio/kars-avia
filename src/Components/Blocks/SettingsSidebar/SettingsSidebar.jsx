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
import { useToast } from "../../../contexts/ToastContext";
import AccessPermissionsPanel from "./AccessPermissionsPanel";
import NotificationsPermissionsPanel from "./NotificationsPermissionsPanel";
import Button from "../../Standart/Button/Button";
import CloseIcon from "../../../shared/icons/CloseIcon";
import AdditionalMenu from "../../Standart/AdditionalMenu/AdditionalMenu";

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
  const { success, error: notifyError } = useToast();
  const [activeTab, setActiveTab] = useState("access");
  const [isLoading, setIsLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);

  const [accessMenu, setAccessMenu] = useState({});
  const [notificationMenu, setNotificationMenu] = useState({});
  const [airlinePositions, setAirlinePositions] = useState([]);
  // { [positionId]: { requestMenu, transferMenu, personalMenu } }
  const [positionAccessMenusByPosId, setPositionAccessMenusByPosId] = useState({});

  const accessStateRef = useRef(null);
  const notificationsStateRef = useRef(null);
  const menuRef = useRef(null);

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

      if (type === "airline") {
        const byPosId = {};
        currentDepartment.positionAccessMenus?.forEach((pam) => {
          byPosId[pam.positionId] = {
            requestMenu: !!pam.accessMenu?.requestMenu,
            transferMenu: !!pam.accessMenu?.transferMenu,
            personalMenu: !!pam.accessMenu?.personalMenu,
          };
        });
        setPositionAccessMenusByPosId(byPosId);
      }
    }
  }, [show, currentDepartment, type]);

  useEffect(() => {
    if (airlinePositionsData) {
      setAirlinePositions(airlinePositionsData.getAirlinePositions || []);
    }
  }, [airlinePositionsData]);

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

  const buildNotificationPayload = (s) => ({
    requestCreate: !!s?.requestCreate,
    emailRequestCreate: !!s?.requestCreate && !!s?.emailRequestCreate,
    sitePushRequestCreate: !!s?.requestCreate && !!s?.sitePushRequestCreate,
    requestDatesChange: !!s?.requestDatesChange,
    emailRequestDatesChange: !!s?.requestDatesChange && !!s?.emailRequestDatesChange,
    sitePushRequestDatesChange: !!s?.requestDatesChange && !!s?.sitePushRequestDatesChange,
    requestPlacementChange: !!s?.requestPlacementChange,
    emailRequestPlacementChange:
      !!s?.requestPlacementChange && !!s?.emailRequestPlacementChange,
    sitePushRequestPlacementChange:
      !!s?.requestPlacementChange && !!s?.sitePushRequestPlacementChange,
    requestCancel: !!s?.requestCancel,
    emailRequestCancel: !!s?.requestCancel && !!s?.emailRequestCancel,
    sitePushRequestCancel: !!s?.requestCancel && !!s?.sitePushRequestCancel,
    passengerRequestCreate: !!s?.passengerRequestCreate,
    emailPassengerRequestCreate:
      !!s?.passengerRequestCreate && !!s?.emailPassengerRequestCreate,
    sitePushPassengerRequestCreate:
      !!s?.passengerRequestCreate && !!s?.sitePushPassengerRequestCreate,
    passengerRequestDatesChange: !!s?.passengerRequestDatesChange,
    emailPassengerRequestDatesChange:
      !!s?.passengerRequestDatesChange &&
      !!s?.emailPassengerRequestDatesChange,
    sitePushPassengerRequestDatesChange:
      !!s?.passengerRequestDatesChange &&
      !!s?.sitePushPassengerRequestDatesChange,
    passengerRequestUpdate: !!s?.passengerRequestUpdate,
    emailPassengerRequestUpdate:
      !!s?.passengerRequestUpdate && !!s?.emailPassengerRequestUpdate,
    sitePushPassengerRequestUpdate:
      !!s?.passengerRequestUpdate && !!s?.sitePushPassengerRequestUpdate,
    passengerRequestPlacementChange: !!s?.passengerRequestPlacementChange,
    emailPassengerRequestPlacementChange:
      !!s?.passengerRequestPlacementChange &&
      !!s?.emailPassengerRequestPlacementChange,
    sitePushPassengerRequestPlacementChange:
      !!s?.passengerRequestPlacementChange &&
      !!s?.sitePushPassengerRequestPlacementChange,
    passengerRequestCancel: !!s?.passengerRequestCancel,
    emailPassengerRequestCancel:
      !!s?.passengerRequestCancel && !!s?.emailPassengerRequestCancel,
    sitePushPassengerRequestCancel:
      !!s?.passengerRequestCancel && !!s?.sitePushPassengerRequestCancel,
    newMessage: !!s?.newMessage,
    emailNewMessage: !!s?.newMessage && !!s?.emailNewMessage,
    sitePushNewMessage: !!s?.newMessage && !!s?.sitePushNewMessage,
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
        const positionIds = Object.keys(positionAccessMenusByPosId);
        const positionPayloads = Object.entries(positionAccessMenusByPosId).map(
          ([posId, access]) => ({ positionId: posId, accessMenu: access })
        );
        await updateAirline({
          variables: {
            updateAirlineId: airlineId,
            input: {
              department: [
                {
                  id: currentDepartment.id,
                  accessMenu: accessPayload,
                  notificationMenu: notificationPayload,
                  positionIds,
                  positionAccessMenus: positionPayloads,
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

      success("Изменения сохранены.");
      setIsEditing(false);
    } catch (err) {
      console.error("Ошибка при сохранении настроек:", err);
      notifyError("Ошибка при сохранении. Попробуйте позже.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleMenuOpen = (event) => setAnchorEl(event.currentTarget);
  const handleMenuClose = () => setAnchorEl(null);
  const handleEditFromMenu = () => {
    handleMenuClose();
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    if (currentDepartment) {
      setAccessMenu(currentDepartment.accessMenu || {});
      setNotificationMenu(currentDepartment.notificationMenu || {});
      if (type === "airline") {
        const byPosId = {};
        currentDepartment.positionAccessMenus?.forEach((pam) => {
          byPosId[pam.positionId] = {
            requestMenu: !!pam.accessMenu?.requestMenu,
            transferMenu: !!pam.accessMenu?.transferMenu,
            personalMenu: !!pam.accessMenu?.personalMenu,
          };
        });
        setPositionAccessMenusByPosId(byPosId);
      }
    }
    setIsEditing(false);
  };

  const handleClose = () => {
    setAnchorEl(null);
    setIsEditing(false);
    setActiveTab("access");
    onClose();
  };

  const positionOptions = airlinePositions.map((i) => ({
    value: String(i.id),
    label: `${i.name}`,
  }));

  const loading = type === "airline" ? airlineLoading : dispatcherLoading;

  // Клик вне боковой панели закрывает её; клик вне при открытом меню — только закрыть меню
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (anchorEl && menuRef.current?.contains(event.target)) {
        setAnchorEl(null);
        return;
      }
      if (sidebarRef.current && !sidebarRef.current.contains(event.target)) {
        handleClose();
      }
    };

    if (show) document.addEventListener("mousedown", handleClickOutside);
    else document.removeEventListener("mousedown", handleClickOutside);

    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [show, handleClose, anchorEl]);

  return (
    <Sidebar show={show} sidebarRef={sidebarRef}>
      <div className={classes.sidebarContent}>
        <div className={classes.header}>
          <div className={classes.headerLeft}>
            <h2 className={classes.title}>
              Настройки {currentDepartment?.name ? `"${currentDepartment.name}"` : ""}
            </h2>
          </div>
          <div className={classes.headerActions}>
            <AdditionalMenu
              anchorEl={anchorEl}
              onOpen={handleMenuOpen}
              onClose={handleMenuClose}
              menuRef={menuRef}
              onEdit={handleEditFromMenu}
            />
            <button className={classes.closeButton} onClick={handleClose}>
              <CloseIcon />
            </button>
          </div>
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
                  positionAccessMenusByPosId={positionAccessMenusByPosId}
                  setPositionAccessMenusByPosId={setPositionAccessMenusByPosId}
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

        {isEditing && (
          <div className={classes.footer}>
            {/* <button className={classes.cancelButton} onClick={handleCancelEdit}>
              Отмена
            </button> */}
            <Button
              onClick={handleCancelEdit}
              backgroundcolor="var(--hover-gray)"
              color="#000"
            >
              Отмена
            </Button>
            <Button onClick={handleSubmit} backgroundcolor="#0057C3" color="#fff">
              Сохранить <img src="/saveDispatcher.png" alt="" />
            </Button>
          </div>
        )}
      </div>

    </Sidebar>
  );
}
