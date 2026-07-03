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
import FapHotelPage from "../../Blocks/FapV2/FapHotelPage/FapHotelPage";
import FapChat from "../../Blocks/FapV2/FapChat/FapChat";
import {
  isAirlineRole as isAirlineRoleCheck,
  isExternalUser,
  canAccessMenu,
} from "../../../utils/access";
import { authService } from "../../../services/authService";
import classes from "./FapServicePage.module.css";

export default function FapHotelDetailPage({ user }) {
  const navigate = useNavigate();
  const { requestId, hotelIndex } = useParams();
  const { accessMenu } = useOutletContext();
  const token = getCookie("token");

  const isAirlineRole = isAirlineRoleCheck(user);
  const isExtHotel = isExternalUser(user) && user?.scope === "HOTEL";

  const { loading, data, refetch } = useQuery(GET_PASSENGER_REQUEST, {
    context: { headers: { Authorization: `Bearer ${token}` } },
    variables: { passengerRequestId: requestId },
  });

  useSubscription(PASSENGER_REQUEST_UPDATED_SUBSCRIPTION, {
    onData: () => refetch(),
  });

  const request = data?.passengerRequest;

  const canEdit =
    (canAccessMenu(accessMenu, "reserveUpdate", user) && !isAirlineRole) ||
    (isExternalUser(user) && user?.scope === "HOTEL");

  const handleExternalLogout = () => {
    document.cookie = "externalUserContext=; Max-Age=0; Path=/";
    authService.clear();
  };

  return (
    <div className={classes.page}>
      <Header isExternalUser={isExternalUser(user)}>
        <div className={classes.headerNav}>
          <button
            className={classes.backBtn}
            onClick={() => navigate(`/far/${requestId}/service/living`)}
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

      {loading ? (
        <div className={classes.loader}>
          <MUILoader />
        </div>
      ) : (
        <div className={classes.contentRow}>
          <div className={classes.content}>
            <FapHotelPage
              request={request}
              hotelIndex={hotelIndex}
              onRefetch={refetch}
              canEdit={canEdit}
              showLinks={!isAirlineRole && !isExtHotel}
              isExtHotel={isExtHotel}
              showTariffs={!isAirlineRole}
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
