import React, { useMemo } from "react";
import { useNavigate, useParams, useOutletContext } from "react-router-dom";
import { useQuery, useSubscription } from "@apollo/client";
import {
  GET_PASSENGER_REQUEST,
  PASSENGER_REQUEST_UPDATED_SUBSCRIPTION,
  getCookie,
} from "../../../../graphQL_requests";
import { SERVICE_CONFIG } from "../../Blocks/FapV2/fapConstants";
import MUILoader from "../../Blocks/MUILoader/MUILoader";
import Header from "../../Blocks/Header/Header";
import FapWaterMealPage from "../../Blocks/FapV2/FapWaterMealPage/FapWaterMealPage";
import FapLivingPage from "../../Blocks/FapV2/FapLivingPage/FapLivingPage";
import FapTransferPage from "../../Blocks/FapV2/FapTransferPage/FapTransferPage";
import FapBaggageSection from "../../Blocks/FapV2/FapBaggageSection/FapBaggageSection";
import {
  isAirlineRole as isAirlineRoleCheck,
  isExternalUser,
  canAccessMenu,
} from "../../../utils/access";
import { authService } from "../../../services/authService";
import CopyIcon from "../../../shared/icons/CopyIcon";
import FapChat from "../../Blocks/FapV2/FapChat/FapChat";
import { useToast } from "../../../contexts/ToastContext";
import classes from "./FapServicePage.module.css";

export default function FapServicePage({ user }) {
  const { requestId, serviceKey } = useParams();
  const { accessMenu } = useOutletContext();
  const navigate = useNavigate();
  const token = getCookie("token");
  const { success, error: notifyError } = useToast();

  const isAirlineRole = isAirlineRoleCheck(user);

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
          <FapWaterMealPage
            service={request.waterService}
            serviceKind="WATER"
            label={cfg.label}
            color={cfg.color}
            bg={cfg.bg}
            request={request}
            onRefetch={refetch}
            canEdit={canEdit}
          />
        );
      case "meal":
        return (
          <FapWaterMealPage
            service={request.mealService}
            serviceKind="MEAL"
            label={cfg.label}
            color={cfg.color}
            bg={cfg.bg}
            request={request}
            onRefetch={refetch}
            canEdit={canEdit}
          />
        );
      case "living":
        return (
          <FapLivingPage
            service={request.livingService}
            request={request}
            onRefetch={refetch}
            canEdit={canEdit}
            showLinks={!isAirlineRole}
            user={user}
          />
        );
      case "transfer":
        return (
          <FapTransferPage
            service={request.transferService}
            request={request}
            direction="ARRIVAL"
            onRefetch={refetch}
            canEdit={canEdit}
            showLinks={!isAirlineRole}
          />
        );
      case "transferDeparture":
        return (
          <FapTransferPage
            service={request.departureTransferService}
            request={request}
            direction="DEPARTURE"
            onRefetch={refetch}
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
    <div className={classes.page}>
      <Header isExternalUser={isExternalUser(user)}>
        <div className={classes.headerNav}>
          <button
            className={classes.backBtn}
            onClick={() => navigate(`/fapv2/${requestId}`)}
          >
            <img src="/arrow.png" alt="" />
          </button>
          <span className={classes.headerNavTitle}>
            {request
              ? `Заявка ${request.requestNumber || request.flightNumber || ""}`
              : ""}
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
        </div>
      </Header>

      {loading ? (
        <div className={classes.loader}>
          <MUILoader />
        </div>
      ) : (
        <div className={classes.contentRow}>
          <div className={classes.content}>{renderSection()}</div>
        </div>
      )}

      <FapChat
        passengerRequestId={requestId}
        token={token}
        user={user}
        flightNumber={request?.flightNumber}
        requestNumber={request?.requestNumber}
      />
    </div>
  );
}

