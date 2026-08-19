import React from "react";
import { useNavigate, useParams, useOutletContext } from "react-router-dom";
import { useQuery, useSubscription } from "@apollo/client";
import {
  GET_PASSENGER_REQUEST,
  GET_HOTEL_TRANSFER_PRICE,
  PASSENGER_REQUEST_UPDATED_SUBSCRIPTION,
  getCookie,
} from "../../../../graphQL_requests";
import MUILoader from "../../Blocks/MUILoader/MUILoader";
import Header from "../../Blocks/Header/Header";
import { isRequestEditLocked } from "../../Blocks/FapV2/fapEditAccess";
import FapCancelledBanner from "../../Blocks/FapV2/FapCancelledBanner/FapCancelledBanner";
import FapDriverPage from "../../Blocks/FapV2/FapDriverPage/FapDriverPage";
import FapChat from "../../Blocks/FapV2/FapChat/FapChat";
import {
  isAirlineRole as isAirlineRoleCheck,
  isExternalUser,
  canAccessMenu,
  canSeeExternalLinks,
  isHotelScoped,
  scopedHotelId,
} from "../../../utils/access";
import { hotelProvidesTransfer } from "../../../utils/hotelTransfer";
import { isServiceHiddenForUser } from "../../Blocks/FapV2/fapServiceVisibility";
import classes from "./FapServicePage.module.css";

export default function FapDriverDetailPage({ user }) {
  const navigate = useNavigate();
  const { requestId, serviceKey, driverIndex } = useParams();
  const { accessMenu } = useOutletContext();
  const token = getCookie("token");

  const isAirlineRole = isAirlineRoleCheck(user);
  const direction = serviceKey === "transferDeparture" ? "DEPARTURE" : "ARRIVAL";
  const backKey = direction === "DEPARTURE" ? "transferDeparture" : "transfer";

  const { loading, data, refetch } = useQuery(GET_PASSENGER_REQUEST, {
    context: { headers: { Authorization: `Bearer ${token}` } },
    variables: { passengerRequestId: requestId },
  });

  useSubscription(PASSENGER_REQUEST_UPDATED_SUBSCRIPTION, {
    onData: () => refetch(),
  });

  // Страница водителя всегда трансферная: гостинице без своего трансфера
  // сюда нельзя и по прямой ссылке — правило то же, что в FapServicePage.
  const hotelScoped = isHotelScoped(user);
  const ownHotelId = scopedHotelId(user);
  const { data: transferPriceData, loading: transferPriceLoading } = useQuery(
    GET_HOTEL_TRANSFER_PRICE,
    {
      context: { headers: { Authorization: `Bearer ${token}` } },
      variables: { hotelId: ownHotelId },
      skip: !hotelScoped || !ownHotelId,
    }
  );
  const serviceHidden = isServiceHiddenForUser(
    backKey,
    user,
    !transferPriceLoading &&
      hotelProvidesTransfer(transferPriceData?.hotel?.transferPrice)
  );
  const transferGateReady = !hotelScoped || !transferPriceLoading;
  React.useEffect(() => {
    if (!serviceHidden || !transferGateReady) return;
    navigate(`/far/${requestId}`, { replace: true });
  }, [serviceHidden, transferGateReady, requestId, navigate]);

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
            onClick={() => navigate(`/far/${requestId}/service/${backKey}`)}
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

      {loading || !transferGateReady || serviceHidden ? (
        <div className={classes.loader}>
          <MUILoader />
        </div>
      ) : (
        <div className={classes.contentRow}>
          <div className={classes.content}>
            <FapDriverPage
              request={request}
              driverIndex={driverIndex}
              direction={direction}
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
