import React, { useEffect, useState, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Message from "../../Blocks/Message/Message";
import { useQuery, useSubscription } from "@apollo/client";
import {
  GET_PASSENGER_REQUEST,
  GET_AIRLINE_DEPARTMENT,
  GET_DISPATCHER_DEPARTMENTS,
  PASSENGER_REQUEST_UPDATED_SUBSCRIPTION,
  getCookie,
} from "../../../../graphQL_requests";
import { SERVICE_CONFIG } from "../../Blocks/FapV2/fapConstants";
import MUILoader from "../../Blocks/MUILoader/MUILoader";
import Header from "../../Blocks/Header/Header";
import MenuDispetcher from "../../Blocks/MenuDispetcher/MenuDispetcher";
import FapWaterMealSection from "../../Blocks/FapV2/FapWaterMealSection/FapWaterMealSection";
import FapLivingSection from "../../Blocks/FapV2/FapLivingSection/FapLivingSection";
import FapTransferSection from "../../Blocks/FapV2/FapTransferSection/FapTransferSection";
import FapBaggageSection from "../../Blocks/FapV2/FapBaggageSection/FapBaggageSection";
import {
  isAirlineRole as isAirlineRoleCheck,
  isDispatcherRole as isDispatcherRoleCheck,
  isExternalUser,
  canAccessMenu,
} from "../../../utils/access";
import { authService } from "../../../services/authService";
import CopyIcon from "../../../shared/icons/CopyIcon";
import { useToast } from "../../../contexts/ToastContext";
import mainClasses from "../../Pages/Main_page/Main_Page.module.css";
import classes from "./FapServicePage.module.css";

export default function FapServicePage({ user }) {
  const { requestId, serviceKey } = useParams();
  const navigate = useNavigate();
  const token = getCookie("token");
  const { success, error: notifyError } = useToast();

  const [accessMenu, setAccessMenu] = useState({});
  const [showChat, setShowChat] = useState(false);
  const isDispatcherRole = isDispatcherRoleCheck(user);
  const isAirlineRole = isAirlineRoleCheck(user);
  const dispatcherDepartmentId = user?.dispatcherDepartmentId;

  const { data: airlineDepartmentData } = useQuery(GET_AIRLINE_DEPARTMENT, {
    context: { headers: { Authorization: `Bearer ${token}` } },
    variables: { airlineDepartmentId: user?.airlineDepartmentId },
    skip: !isAirlineRole || !user?.airlineDepartmentId,
  });

  const { data: dispatcherDepartmentsData } = useQuery(GET_DISPATCHER_DEPARTMENTS, {
    context: { headers: { Authorization: `Bearer ${token}` } },
    variables: { pagination: { all: true } },
    skip: !isDispatcherRole,
  });

  useEffect(() => {
    if (isDispatcherRole) {
      const department = dispatcherDepartmentsData?.dispatcherDepartments?.departments?.find(
        (item) => item.id === dispatcherDepartmentId
      );
      setAccessMenu(department?.accessMenu || {});
      return;
    }
    if (isAirlineRole) {
      setAccessMenu(airlineDepartmentData?.airlineDepartment?.accessMenu || {});
      return;
    }
    setAccessMenu({});
  }, [isDispatcherRole, isAirlineRole, dispatcherDepartmentId, dispatcherDepartmentsData, airlineDepartmentData]);

  const { loading, data, refetch } = useQuery(GET_PASSENGER_REQUEST, {
    context: { headers: { Authorization: `Bearer ${token}` } },
    variables: { passengerRequestId: requestId },
  });

  useSubscription(PASSENGER_REQUEST_UPDATED_SUBSCRIPTION, {
    onData: () => refetch(),
  });

  const request = data?.passengerRequest;
  const cfg = SERVICE_CONFIG[serviceKey];
  const noop = () => {};

  const representativePwaLink = useMemo(() => {
    const links = request?.representativeLinks || [];
    if (!Array.isArray(links) || links.length === 0) return "";
    const byDepartment = user?.representativeDepartmentId
      ? links.find(
          (item) =>
            String(item?.representativeDepartmentId) ===
              String(user.representativeDepartmentId) && item?.linkPWA
        )
      : null;
    if (byDepartment?.linkPWA) return byDepartment.linkPWA;
    const firstWithPwa = links.find((item) => item?.linkPWA);
    return firstWithPwa?.linkPWA || "";
  }, [request?.representativeLinks, user?.representativeDepartmentId]);

  const canEdit = canAccessMenu(accessMenu, "reserveUpdate", user);

  const handleExternalLogout = () => {
    document.cookie = "externalUserContext=; Max-Age=0; Path=/";
    authService.clear();
  };
  
  const canCopyRepresentativeLink = !isExternalUser(user) && Boolean(representativePwaLink);

  const handleCopyRepresentativeLink = async () => {
    try {
      await navigator.clipboard.writeText(representativePwaLink);
      success("Ссылка представительства скопирована");
    } catch {
      notifyError("Не удалось скопировать ссылку");
    }
  };

  const renderSection = () => {
    if (!request || !cfg) return null;

    switch (serviceKey) {
      case "water":
        return (
          <FapWaterMealSection
            service={request.waterService}
            serviceKind="WATER"
            label={cfg.label}
            color={cfg.color}
            requestId={request.id}
            onRefetch={refetch}
            isOpen={true}
            onToggle={noop}
            isPage
            canEdit={canEdit}
          />
        );
      case "meal":
        return (
          <FapWaterMealSection
            service={request.mealService}
            serviceKind="MEAL"
            label={cfg.label}
            color={cfg.color}
            requestId={request.id}
            onRefetch={refetch}
            isOpen={true}
            onToggle={noop}
            isPage
            canEdit={canEdit}
          />
        );
      case "living":
        return (
          <FapLivingSection
            service={request.livingService}
            color={cfg.color}
            request={request}
            onRefetch={refetch}
            isOpen={true}
            onToggle={noop}
            isPage
            canEdit={canEdit}
            showLinks={!isAirlineRole}
            user={user}
          />
        );
      case "transfer":
        return (
          <FapTransferSection
            service={request.transferService}
            color={cfg.color}
            request={request}
            onRefetch={refetch}
            isOpen={true}
            onToggle={noop}
            isPage
            canEdit={canEdit}
            showLinks={!isAirlineRole}
          />
        );
      case "baggage":
        return (
          <FapBaggageSection
            service={request.baggageDeliveryService}
            color={cfg.color}
            request={request}
            onRefetch={refetch}
            isOpen={true}
            onToggle={noop}
            isPage
            canEdit={canEdit}
            showLinks={!isAirlineRole}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className={mainClasses.main}>
      {!isExternalUser(user) && <MenuDispetcher id="fapv2" user={user} accessMenu={accessMenu} />}

      <div className={classes.page}>
        <Header>
          <div className={classes.headerNav}>
            <button
              className={classes.backBtn}
              onClick={() => navigate(`/fapv2/${requestId}`)}
            >
              <img src="/arrow.png" alt="" />
            </button>
            <span className={classes.headerNavTitle}>
              {request
                ? `${request.flightNumber} — ${cfg?.label ?? serviceKey}`
                : cfg?.label ?? serviceKey}
            </span>
            {canCopyRepresentativeLink && (
              <button
                type="button"
                className={classes.representativeLinkBtn}
                onClick={handleCopyRepresentativeLink}
                title="Скопировать ссылку для представительства"
              >
                Ссылка <CopyIcon />
              </button>
            )}
            <button
              className={classes.chatBtn}
              style={{ background: showChat ? "var(--dark-blue)" : "#F6F7FB", color: showChat ? "#fff" : "#545873" }}
              onClick={() => setShowChat((v) => !v)}
            >
              Чат
            </button>
            {isExternalUser(user) && (
              <button className={classes.logoutBtn} onClick={handleExternalLogout}>
                Выйти
              </button>
            )}
          </div>
        </Header>

        {loading ? (
          <div className={classes.loader}>
            <MUILoader />
          </div>
        ) : (
          <div className={classes.contentRow}>
            <div className={classes.content}>{renderSection()}</div>
            {showChat && (
              <div className={classes.chatPane}>
                <div className={classes.chatPaneHeader}>
                  <span className={classes.chatPaneTitle}>Чат</span>
                  <button className={classes.chatPaneClose} onClick={() => setShowChat(false)}>✕</button>
                </div>
                <div className={classes.chatPaneBody}>
                  <Message
                    activeTab="Комментарий"
                    passengerRequestId={requestId}
                    token={token}
                    user={user}
                    chatPadding="0"
                    chatHeight="calc(100vh - 160px)"
                  />
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
