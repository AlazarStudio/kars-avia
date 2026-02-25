import React, { useEffect, useMemo, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@apollo/client";
import classes from "../ReservePlacementRepresentative/ReservePlacementRepresentative.module.css";
import MenuDispetcher from "../../Blocks/MenuDispetcher/MenuDispetcher";
import Header from "../../Blocks/Header/Header";
import { useCookies } from "../../../hooks/useCookies";
import CookiesNotice from "../../Blocks/CookiesNotice/CookiesNotice";
import { GET_PASSENGER_REQUEST, getCookie } from "../../../../graphQL_requests";
import MUILoader from "../../Blocks/MUILoader/MUILoader";
import RepresentativeHotelDetail, { HotelDetailToolbar } from "../../Blocks/RepresentativeHotelDetail/RepresentativeHotelDetail";
import Message from "../../Blocks/Message/Message";
import Notification from "../../Notification/Notification";

function RepresentativeHotelDetailPage({ user }) {
  const token = getCookie("token");
  const { id, idRequest, hotelId } = useParams();
  const navigate = useNavigate();
  const { cookiesAccepted, acceptCookies, isInitialized } = useCookies();

  const { loading, error, data, refetch } = useQuery(GET_PASSENGER_REQUEST, {
    context: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
    variables: { passengerRequestId: idRequest },
  });

  const request = data?.passengerRequest ?? null;
  const decodedHotelId = hotelId ? decodeURIComponent(hotelId) : "";

  const { hotel, hotelIndex } = useMemo(() => {
    const hotels = request?.livingService?.hotels ?? [];
    const byMatch = hotels.findIndex(
      (h, i) =>
        String(h.hotelId) === decodedHotelId ||
        h.name === decodedHotelId ||
        String(i) === decodedHotelId
    );
    const byNum =
      decodedHotelId !== "" && !Number.isNaN(Number(decodedHotelId))
        ? Number(decodedHotelId)
        : -1;
    const idx =
      byMatch >= 0 ? byMatch : (byNum >= 0 && byNum < hotels.length ? byNum : -1);
    const found = idx >= 0 ? hotels[idx] : null;
    return { hotel: found ?? null, hotelIndex: idx >= 0 ? idx : 0 };
  }, [request?.livingService?.hotels, decodedHotelId]);

  const [showAddBooking, setShowAddBooking] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const fullNotifyTime = 4000;
  const addNotification = (text, status) => {
    const id = Date.now();
    setNotifications((prev) => [...prev, { id, text, status }]);
    setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    }, fullNotifyTime);
  };

  const backUrl = `/${id}/representativeRequestsPlacement/${idRequest}`;
  const backState = { tab: "habitation" };
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (!loading && request && !hotel) {
      navigate(`/${id}/representativeRequestsPlacement/${idRequest}`, {
        state: { tab: "habitation" },
      });
    }
  }, [loading, request, hotel, id, idRequest, navigate]);

  if (loading || !request) {
    return (
      <div className={classes.main}>
        <MenuDispetcher id="reserve" accessMenu={{}} />
        <div className={classes.section}>
          <MUILoader />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={classes.main}>
        <MenuDispetcher id="reserve" accessMenu={{}} />
        <div className={classes.section}>
          <p>Error: {error.message}</p>
        </div>
      </div>
    );
  }

  if (!hotel) {
    return null;
  }

  return (
    <div className={classes.main}>
      <MenuDispetcher id="reserve" accessMenu={{}} />
      {isInitialized && !cookiesAccepted && (
        <CookiesNotice onAccept={acceptCookies} />
      )}
      <div className={classes.section}>
        <Header>
          <div className={classes.titleHeader}>
            <Link to={backUrl} state={backState} className={classes.backButton}>
              <img src="/arrow.png" alt="" />
            </Link>
            Заявка {request.flightNumber}
          </div>
        </Header>
        <HotelDetailToolbar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onAddBooking={() => setShowAddBooking(true)}
          className={classes.section_searchAndFilter}
        />
        <div className={classes.contentWithChat}>
          <div className={classes.tabContent}>
            <RepresentativeHotelDetail
              request={request}
              hotel={hotel}
              hotelIndex={hotelIndex}
              onRefetch={refetch}
              addNotification={addNotification}
              showAddBooking={showAddBooking}
              onCloseAddBooking={() => setShowAddBooking(false)}
              hidePageTitle
              hideToolbar
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
            />
          </div>
          <div className={classes.chatWrapper}>
            <Message
              activeTab="Комментарий"
              setIsHaveTwoChats={() => { }}
              setHotelChats={() => { }}
              chooseRequestID=""
              chooseReserveID={request.id}
              filteredPlacement={[]}
              token={token}
              user={user}
              chatPadding="0"
              chatHeight={"calc(100vh - 295px)"}
              separator="airline"
              hotelChatId={null}
            />
          </div>
        </div>
        {notifications.map((n, index) => (
          <Notification
            key={n.id}
            text={n.text}
            status={n.status}
            index={index}
            time={fullNotifyTime}
            onClose={() => {
              setNotifications((prev) =>
                prev.filter((notif) => notif.id !== n.id)
              );
            }}
          />
        ))}
      </div>
    </div>
  );
}

export default RepresentativeHotelDetailPage;
