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
import FapChat from "../../Blocks/FapV2/FapChat/FapChat";
import FapRegistry from "../../Blocks/FapV2/FapRegistry/FapRegistry";
import {
  isAirlineRole as isAirlineRoleCheck,
  isExternalUser,
  canAccessMenu,
} from "../../../utils/access";
import classes from "./FapRegistryPage.module.css";

export default function FapRegistryPage({ user }) {
  const { requestId } = useParams();
  const { accessMenu } = useOutletContext();
  const navigate = useNavigate();
  const token = getCookie("token");

  const isAirlineRole = isAirlineRoleCheck(user);

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
            onClick={() => navigate(`/far/${requestId}`)}
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

      {loading ? (
        <div className={classes.loader}>
          <MUILoader />
        </div>
      ) : (
        <div className={classes.contentRow}>
          <div className={classes.content}>
            {request && (
              <FapRegistry
                request={request}
                user={user}
                canEdit={canEdit}
                onRefetch={refetch}
              />
            )}
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
