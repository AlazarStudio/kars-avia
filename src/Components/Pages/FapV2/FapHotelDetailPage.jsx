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
import FapHotelPage from "../../Blocks/FapV2/FapHotelPage/FapHotelPage";
import FapChat from "../../Blocks/FapV2/FapChat/FapChat";
import {
  isAirlineRole as isAirlineRoleCheck,
  isExternalUser,
  canAccessMenu,
  canSeeExternalLinks,
  isHotelScoped,
  scopedHotelId,
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

  // Прямой адрес чужой гостиницы (`.../living/hotel/3`) открывался у любой
  // гостиничной роли, минуя фильтр списка. Уводим на свою гостиницу, а если её
  // в заявке нет — на список проживания (он для такого пользователя пуст).
  const hotelScoped = isHotelScoped(user);
  const ownHotelId = scopedHotelId(user);
  React.useEffect(() => {
    if (!request || !hotelScoped) return;
    const hotels = request?.livingService?.hotels ?? [];
    const current = hotels[Number(hotelIndex)];
    if (current && String(current.hotelId) === String(ownHotelId)) return;
    const ownIdx = hotels.findIndex(
      (h) => String(h?.hotelId) === String(ownHotelId)
    );
    navigate(
      ownIdx >= 0
        ? `/far/${requestId}/service/living/hotel/${ownIdx}`
        : `/far/${requestId}/service/living`,
      { replace: true }
    );
  }, [request, hotelScoped, ownHotelId, hotelIndex, requestId, navigate]);

  // Отмена заявки закрывает правку и гостинице по магик-линку: услуга у неё
  // осталась «в работе», а заявки уже нет. Завершение запирает её так же:
  // право «править завершённую» внешнему пользователю выдать нечем, у него
  // нет accessMenu. Оба правила живут в isRequestEditLocked.
  const canEdit =
    !isRequestEditLocked(request, accessMenu, user) &&
    ((canAccessMenu(accessMenu, "reserveUpdate", user) && !isAirlineRole) ||
      (isExternalUser(user) && user?.scope === "HOTEL"));

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

      <FapCancelledBanner request={request} />

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
              showLinks={canSeeExternalLinks(user)}
              isExtHotel={isExtHotel}
              showTariffs={!isAirlineRole}
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
