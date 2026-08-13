import React from "react";
import { useNavigate, useParams, useOutletContext } from "react-router-dom";
import { useQuery, useSubscription } from "@apollo/client";
import {
  GET_PASSENGER_REQUEST,
  PASSENGER_REQUEST_UPDATED_SUBSCRIPTION,
  getCookie,
} from "../../../../graphQL_requests";
import { SERVICE_CONFIG, isRequestCancelled } from "../../Blocks/FapV2/fapConstants";
import FapCancelledBanner from "../../Blocks/FapV2/FapCancelledBanner/FapCancelledBanner";
import MUILoader from "../../Blocks/MUILoader/MUILoader";
import Header from "../../Blocks/Header/Header";
import FapWaterMealPage from "../../Blocks/FapV2/FapWaterMealPage/FapWaterMealPage";
import { useRepresentativeLink } from "../../Blocks/FapV2/hooks/useRepresentativeLink";
import FapLivingPage from "../../Blocks/FapV2/FapLivingPage/FapLivingPage";
import FapTransferPage from "../../Blocks/FapV2/FapTransferPage/FapTransferPage";
import FapBaggagePage from "../../Blocks/FapV2/FapBaggagePage/FapBaggagePage";
import {
  isAirlineRole as isAirlineRoleCheck,
  isExternalUser,
  canAccessMenu,
  canSeeExternalLinks,
} from "../../../utils/access";
import { authService } from "../../../services/authService";
import CopyIcon from "../../../shared/icons/CopyIcon";
import LinkIcon from "../../../shared/icons/LinkIcon";
import FapChat from "../../Blocks/FapV2/FapChat/FapChat";
import classes from "./FapServicePage.module.css";

export default function FapServicePage({ user }) {
  const { requestId, serviceKey } = useParams();
  const { accessMenu } = useOutletContext();
  const navigate = useNavigate();
  const token = getCookie("token");

  const isAirlineRole = isAirlineRoleCheck(user);
  // Ссылки-входы участников — только диспетчеру: см. canSeeExternalLinks.
  const showExternalLinks = canSeeExternalLinks(user);

  const { loading, data, refetch } = useQuery(GET_PASSENGER_REQUEST, {
    context: { headers: { Authorization: `Bearer ${token}` } },
    variables: { passengerRequestId: requestId },
  });

  useSubscription(PASSENGER_REQUEST_UPDATED_SUBSCRIPTION, {
    onData: ({ data }) => {
      if (
        String(data?.data?.passengerRequestUpdated?.id) === String(requestId)
      ) {
        refetch();
      }
    },
  });

  const request = data?.passengerRequest;
  const cfg = SERVICE_CONFIG[serviceKey];

  const {
    canCopy: canCopyRepresentativeLink,
    copy: handleCopyRepresentativeLink,
  } = useRepresentativeLink(user, request);

  // Статус ЗАЯВКИ спрашиваем здесь: внутри экраны услуг смотрят только на статус
  // своей услуги, а отмена его не меняет — см. isRequestCancelled.
  const canEdit =
    canAccessMenu(accessMenu, "reserveUpdate", user) &&
    !isAirlineRole &&
    !isRequestCancelled(request);

  const handleExternalLogout = () => {
    document.cookie = "externalUserContext=; Max-Age=0; Path=/";
    authService.clear();
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
            user={user}
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
            user={user}
          />
        );
      case "living":
        return (
          <FapLivingPage
            service={request.livingService}
            request={request}
            onRefetch={refetch}
            canEdit={canEdit}
            showLinks={showExternalLinks}
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
            showLinks={showExternalLinks}
            user={user}
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
            showLinks={showExternalLinks}
            user={user}
          />
        );
      case "baggage":
        return (
          <FapBaggagePage
            service={request.baggageDeliveryService}
            request={request}
            onRefetch={refetch}
            canEdit={canEdit}
            showLinks={showExternalLinks}
            user={user}
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
            onClick={() => navigate(`/far/${requestId}`)}
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
              <LinkIcon /> Ссылка <CopyIcon />
            </button>
          )}
        </div>
      </Header>

      <FapCancelledBanner request={request} />

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

