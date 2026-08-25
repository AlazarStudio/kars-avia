import React from "react";
import { useNavigate, useParams, useOutletContext } from "react-router-dom";
import { useQuery, useSubscription } from "@apollo/client";
import {
  GET_PASSENGER_REQUEST,
  PASSENGER_REQUEST_UPDATED_SUBSCRIPTION,
  getCookie,
} from "../../../../graphQL_requests";
import MUILoader from "../../Blocks/MUILoader/MUILoader";
import Header from "../../Blocks/Header/Header";
import { isRequestEditLocked } from "../../Blocks/FapV2/fapEditAccess";
import FapCancelledBanner from "../../Blocks/FapV2/FapCancelledBanner/FapCancelledBanner";
import FapBaggageTripPage from "../../Blocks/FapV2/FapBaggageTripPage/FapBaggageTripPage";
import FapChat from "../../Blocks/FapV2/FapChat/FapChat";
import {
  isAirlineRole as isAirlineRoleCheck,
  isExternalUser,
  canAccessMenu,
  canSeeExternalLinks,
} from "../../../utils/access";
import { useHotelServiceVisibility } from "../../Blocks/FapV2/useHotelServiceVisibility";
import classes from "./FapServicePage.module.css";

export default function FapBaggageTripDetailPage({ user }) {
  const navigate = useNavigate();
  const { requestId, driverIndex } = useParams();
  const { accessMenu } = useOutletContext();
  const token = getCookie("token");

  const isAirlineRole = isAirlineRoleCheck(user);

  const { loading, data, refetch } = useQuery(GET_PASSENGER_REQUEST, {
    context: { headers: { Authorization: `Bearer ${token}` } },
    variables: { passengerRequestId: requestId },
  });

  useSubscription(PASSENGER_REQUEST_UPDATED_SUBSCRIPTION, {
    onData: () => refetch(),
  });

  // Поездка багажа — то же правило, что у страницы услуги и водителя: гостинице
  // без своего трансфера сюда нельзя и по прямой ссылке (см.
  // fapServiceVisibility). Уводим только когда ответ о ценах уже пришёл
  // (`ready`), иначе редирект выкинул бы и гостиницу-перевозчика.
  const { ready: serviceGateReady, isHidden } =
    useHotelServiceVisibility(user);
  const serviceHidden = isHidden("baggage");
  React.useEffect(() => {
    if (!serviceHidden || !serviceGateReady) return;
    navigate(`/far/${requestId}`, { replace: true });
  }, [serviceHidden, serviceGateReady, requestId, navigate]);

  const request = data?.passengerRequest;
  const canEdit =
    canAccessMenu(accessMenu, "reserveUpdate", user) &&
    !isAirlineRole &&
    !isRequestEditLocked(request, accessMenu, user);

  return (
    <div className={classes.page}>
      <Header isExternalUser={isExternalUser(user)}>
        <div className={classes.headerNav}>
          <button
            className={classes.backBtn}
            onClick={() => navigate(`/far/${requestId}/service/baggage`)}
            aria-label="Назад"
          >
            <img src="/arrow.png" alt="" />
          </button>
          <span className={classes.headerNavTitle}>
            {request
              ? `Заявка ${request.requestNumber || request.flightNumber || ""}`
              : ""}
          </span>
        </div>
      </Header>

      <FapCancelledBanner request={request} />

      {loading || !serviceGateReady || serviceHidden ? (
        <div className={classes.loader}>
          <MUILoader />
        </div>
      ) : (
        <div className={classes.contentRow}>
          <div className={classes.content}>
            <FapBaggageTripPage
              request={request}
              driverIndex={driverIndex}
              onRefetch={refetch}
              canEdit={canEdit}
              showLinks={canSeeExternalLinks(user)}
              user={user}
            />
          </div>
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
