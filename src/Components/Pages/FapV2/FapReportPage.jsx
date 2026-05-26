import React from "react";
import { useParams, useOutletContext } from "react-router-dom";
import { useQuery } from "@apollo/client";
import FapReport from "../../Blocks/FapV2/FapReport/FapReport";
import { GET_PASSENGER_REQUEST, getCookie } from "../../../../graphQL_requests";
import MUILoader from "../../Blocks/MUILoader/MUILoader";
import { canAccessMenu, isExternalUser } from "../../../utils/access";

export default function FapReportPage({ user }) {
  const { requestId, hotelIndex: hotelIndexParam } = useParams();
  const { accessMenu } = useOutletContext();
  const token = getCookie("token");

  const { loading, data } = useQuery(GET_PASSENGER_REQUEST, {
    context: { headers: { Authorization: `Bearer ${token}` } },
    variables: { passengerRequestId: requestId },
  });

  const request = data?.passengerRequest;
  const hotelIndex = parseInt(hotelIndexParam, 10);
  const hotel = request?.livingService?.hotels?.[hotelIndex];

  if (loading) {
    return (
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <MUILoader />
      </div>
    );
  }

  if (!request || !hotel) {
    return (
      <div style={{ flex: 1, padding: 30, color: "#94A3B8" }}>
        Отчёт не найден
      </div>
    );
  }

  return (
    <FapReport
      request={request}
      hotelIndex={hotelIndex}
      hotelName={hotel.name || "Отель"}
      canEdit={
        canAccessMenu(accessMenu, "reserveUpdate", user) ||
        (isExternalUser(user) && user?.scope === "HOTEL")
      }
      user={user}
    />
  );
}
