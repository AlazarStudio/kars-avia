import React, { useEffect, useMemo, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useSubscription } from "@apollo/client";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import classes from "../ReservePlacementRepresentative/ReservePlacementRepresentative.module.css";
import MenuDispetcher from "../../Blocks/MenuDispetcher/MenuDispetcher";
import Header from "../../Blocks/Header/Header";
import { useCookies } from "../../../hooks/useCookies";
import CookiesNotice from "../../Blocks/CookiesNotice/CookiesNotice";
import {
  GET_PASSENGER_REQUEST,
  GET_AIRLINE_DEPARTMENT,
  GET_DISPATCHER_DEPARTMENTS,
  getCookie,
  CREATE_EXTERNAL_AUTH_LINK,
  PASSENGER_REQUEST_UPDATED_SUBSCRIPTION,
} from "../../../../graphQL_requests";
import MUILoader from "../../Blocks/MUILoader/MUILoader";
import MUITextField from "../../Blocks/MUITextField/MUITextField";
import RepresentativeHotelDetail, { HotelDetailToolbar } from "../../Blocks/RepresentativeHotelDetail/RepresentativeHotelDetail";
import Message from "../../Blocks/Message/Message";
import Notification from "../../Notification/Notification";
import Button from "../../Standart/Button/Button";
import {
  isExternalPassengerRequestUser,
  isAirlineRole as isAirlineRoleCheck,
  isDispatcherRole as isDispatcherRoleCheck,
} from "../../../utils/access";
import { getExternalAuthErrorMessage } from "../../../constants/externalAuthErrors";

const ACCESS_TYPE_CRM = "CRM";
const ACCESS_TYPE_PWA = "PWA";
const ISSUE_LINK_COOLDOWN_MS = 60000;

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

  useSubscription(PASSENGER_REQUEST_UPDATED_SUBSCRIPTION, {
    onData: ({ data: subData }) => {
      if (subData?.data?.passengerRequestUpdated?.id === idRequest) {
        refetch();
      }
    },
  });

  const request = data?.passengerRequest ?? null;
  const decodedHotelId = hotelId ? decodeURIComponent(hotelId) : "";

  const [accessMenu, setAccessMenu] = useState({});
  const isDispatcherRole = isDispatcherRoleCheck(user);
  const isAirlineRole = isAirlineRoleCheck(user);
  const dispatcherDepartmentId = user?.dispatcherDepartmentId;

  const { data: airlineDepartmentData } = useQuery(GET_AIRLINE_DEPARTMENT, {
    context: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
    variables: {
      airlineDepartmentId: user?.airlineDepartmentId,
    },
    skip: !isAirlineRole || !user?.airlineDepartmentId,
  });

  const { data: dispatcherDepartmentsData } = useQuery(GET_DISPATCHER_DEPARTMENTS, {
    context: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
    variables: {
      pagination: { all: true },
    },
  });

  useEffect(() => {
    if (isDispatcherRole) {
      const department =
        dispatcherDepartmentsData?.dispatcherDepartments?.departments?.find(
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
  }, [
    isDispatcherRole,
    isAirlineRole,
    dispatcherDepartmentId,
    dispatcherDepartmentsData,
    airlineDepartmentData,
  ]);

  const { hotel, hotelIndex } = useMemo(() => {
    const hotels = request?.livingService?.hotels ?? [];
    const byMatch = hotels.findIndex(
      (h, i) =>
        h != null &&
        (String(h.hotelId) === decodedHotelId ||
          (h.name != null && h.name === decodedHotelId) ||
          String(i) === decodedHotelId)
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

  const isExternalUser = isExternalPassengerRequestUser(user);
  const externalHotelId = user?.scope === "HOTEL" ? user?.hotelId : null;

  useEffect(() => {
    if (!request || !isExternalUser) return;
    if (user?.scope === "HOTEL" && externalHotelId) {
      const allowedHotel = (request?.livingService?.hotels ?? []).find(
        (h) => h != null && String(h.hotelId) === String(externalHotelId)
      );
      if (!allowedHotel) {
        navigate(`/${id}/representativeRequestsPlacement/${idRequest}`, { replace: true, state: { tab: "habitation" } });
        return;
      }
      if (hotel?.hotelId != null && String(hotel.hotelId) !== String(externalHotelId)) {
        const hotelIdEnc = encodeURIComponent(allowedHotel.hotelId ?? allowedHotel.name ?? "");
        navigate(`/${id}/representativeRequestsPlacement/${idRequest}/hotel/${hotelIdEnc}`, { replace: true });
      }
    }
  }, [request, isExternalUser, externalHotelId, hotel?.hotelId, id, idRequest, navigate, user?.scope]);

  const [showAddBooking, setShowAddBooking] = useState(false);
  const [showIssueLinkModal, setShowIssueLinkModal] = useState(false);
  const [issueLinkAccessType, setIssueLinkAccessType] = useState(ACCESS_TYPE_CRM);
  const [issueLinkEmail, setIssueLinkEmail] = useState("");
  const [issueLinkName, setIssueLinkName] = useState("");
  const [issueLinkResult, setIssueLinkResult] = useState(null);
  const [issueLinkCooldownUntil, setIssueLinkCooldownUntil] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const fullNotifyTime = 4000;
  const addNotification = (text, status) => {
    const id = Date.now();
    setNotifications((prev) => [...prev, { id, text, status }]);
    setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    }, fullNotifyTime);
  };

  const [createExternalAuthLink, { loading: issueLinkLoading }] = useMutation(
    CREATE_EXTERNAL_AUTH_LINK,
    {
      context: { headers: { Authorization: `Bearer ${token}` } },
    }
  );

  const handleIssueLink = async () => {
    const email = issueLinkEmail?.trim() || null;
    if (!email) {
      addNotification("Укажите email (обязательно).", "error");
      return;
    }
    if (!hotel?.hotelId) {
      addNotification("Не удалось определить отель. Обновите страницу.", "error");
      return;
    }
    try {
      const res = await createExternalAuthLink({
        variables: {
          input: {
            scope: "HOTEL",
            accessType: issueLinkAccessType,
            email,
            name: issueLinkName?.trim() || null,
            hotelId: hotel.hotelId,
            ...(issueLinkAccessType === "PWA" && request?.id && { passengerRequestId: request.id }),
          },
        },
      });
      const data = res?.data?.createExternalAuthLink;
      if (data?.success) {
        if (data.emailed) {
          addNotification("Ссылка отправлена на email.", "success");
        } else {
          addNotification("Ссылка сформирована.", "success");
        }
        if (data.link) {
          setIssueLinkResult(data.link);
        } else {
          setShowIssueLinkModal(false);
          resetIssueLinkModal();
        }
      }
    } catch (err) {
      const msg = err?.graphQLErrors?.[0]?.message || "";
      if (msg === "Magic link issue limit exceeded") {
        setIssueLinkCooldownUntil(Date.now() + ISSUE_LINK_COOLDOWN_MS);
      }
      addNotification(
        getExternalAuthErrorMessage(err, "Ошибка при выдаче ссылки."),
        "error"
      );
    }
  };

  const resetIssueLinkModal = () => {
    setIssueLinkEmail("");
    setIssueLinkName("");
    setIssueLinkResult(null);
    setIssueLinkAccessType(ACCESS_TYPE_CRM);
  };

  const handleCloseIssueLinkModal = () => {
    if (!issueLinkLoading) {
      setShowIssueLinkModal(false);
      resetIssueLinkModal();
    }
  };

  const handleCopyIssueLink = async () => {
    if (!issueLinkResult) return;
    try {
      await navigator.clipboard.writeText(issueLinkResult);
      addNotification("Ссылка скопирована в буфер обмена.", "success");
    } catch (_) {
      addNotification("Не удалось скопировать ссылку.", "error");
    }
  };

  const [cooldownTick, setCooldownTick] = useState(0);
  useEffect(() => {
    if (issueLinkCooldownUntil <= Date.now()) return;
    const t = setInterval(() => setCooldownTick((n) => n + 1), 1000);
    return () => clearInterval(t);
  }, [issueLinkCooldownUntil]);
  const issueLinkCooldownRemaining = Math.max(0, Math.ceil((issueLinkCooldownUntil - Date.now()) / 1000));
  const issueLinkDisabledByCooldown = issueLinkCooldownRemaining > 0;

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
        <MenuDispetcher id="representativeRequests" accessMenu={accessMenu} />
        <div className={classes.section}>
          <MUILoader />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={classes.main}>
        {!isExternalUser && <MenuDispetcher id="representativeRequests" accessMenu={accessMenu} />}
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
      {!isExternalUser && <MenuDispetcher id="representativeRequests" accessMenu={accessMenu} />}
      {isInitialized && !cookiesAccepted && (
        <CookiesNotice onAccept={acceptCookies} />
      )}
      <div className={classes.section}>
        <Header isExternalUser={isExternalUser}>
          <div className={classes.titleHeader}>
            {!isExternalUser && (
              <Link to={backUrl} state={backState} className={classes.backButton}>
                <img src="/arrow.png" alt="" />
              </Link>
            )}
            Заявка {request.flightNumber}
          </div>
        </Header>
        <HotelDetailToolbar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onAddBooking={() => setShowAddBooking(true)}
          onGenerateReport={() =>
            navigate(
              `/${id}/representativeRequestsPlacement/${idRequest}/hotel/${encodeURIComponent(hotelId)}/report`
            )
          }
          onIssueLink={undefined}
          className={classes.section_searchAndFilter}
          showAddBookingButton={
            hotel == null ||
            hotel.peopleCount == null ||
            (hotel.people?.length ?? 0) < hotel.peopleCount
          }
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
              isExternalUser={isExternalUser}
            />
          </div>
          <div className={classes.chatWrapper}>
            <Message
              activeTab="Комментарий"
              setIsHaveTwoChats={() => { }}
              setHotelChats={() => { }}
              passengerRequestId={request.id}
              filteredPlacement={[]}
              token={token}
              user={user}
              chatPadding="0"
              chatHeight={"calc(100vh - 295px)"}
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

        <Dialog
          open={showIssueLinkModal}
          onClose={handleCloseIssueLinkModal}
          PaperProps={{ sx: { borderRadius: "15px" } }}
        >
          <DialogTitle>Выдать ссылку для гостиницы</DialogTitle>
          <DialogContent>
            {issueLinkResult ? (
              <>
                <p style={{ marginBottom: 12 }}>
                  Ссылка сформирована. Передайте её пользователю или скопируйте.
                </p>
                <MUITextField
                  label="Ссылка"
                  value={issueLinkResult}
                  fullWidth
                  multiline
                  minRows={2}
                  InputProps={{ readOnly: true }}
                  style={{ marginBottom: 12 }}
                />
                <Button onClick={handleCopyIssueLink} style={{ marginBottom: 8 }}>
                  Копировать ссылку
                </Button>
              </>
            ) : (
              <>
                <p style={{ marginBottom: 8 }}>
                  Ссылка позволит пользователю без аккаунта войти и вносить данные по броням и отчёту по этой гостинице. Для CRM письмо отправится на email; для PVA email необязателен.
                </p>
                <div style={{ marginBottom: 12 }}>
                  <label style={{ display: "block", marginBottom: 6, fontSize: 14, color: "var(--main-gray)" }}>Тип учётной записи *</label>
                  <div style={{ display: "flex", gap: 16 }}>
                    <label style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer" }}>
                      <input
                        type="radio"
                        name="accessType"
                        checked={issueLinkAccessType === ACCESS_TYPE_CRM}
                        onChange={() => setIssueLinkAccessType(ACCESS_TYPE_CRM)}
                      />
                      CRM
                    </label>
                    <label style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer" }}>
                      <input
                        type="radio"
                        name="accessType"
                        checked={issueLinkAccessType === ACCESS_TYPE_PWA}
                        onChange={() => setIssueLinkAccessType(ACCESS_TYPE_PWA)}
                      />
                      PWA
                    </label>
                  </div>
                </div>
                <MUITextField
                  label="Email *"
                  value={issueLinkEmail}
                  onChange={(e) => setIssueLinkEmail(e.target.value)}
                  placeholder="email@example.com"
                  fullWidth
                  style={{ marginBottom: 12 }}
                />
                <MUITextField
                  label="Имя (необязательно)"
                  value={issueLinkName}
                  onChange={(e) => setIssueLinkName(e.target.value)}
                  placeholder="Имя получателя"
                  fullWidth
                />
                {issueLinkDisabledByCooldown && (
                  <p style={{ marginTop: 12, fontSize: 13, color: "var(--main-gray)" }}>
                    Повторная выдача ссылки возможна через {issueLinkCooldownRemaining} с.
                  </p>
                )}
              </>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseIssueLinkModal} disabled={issueLinkLoading}>
              {issueLinkResult ? "Закрыть" : "Отмена"}
            </Button>
            {!issueLinkResult && (
              <Button
                onClick={handleIssueLink}
                disabled={issueLinkLoading || issueLinkDisabledByCooldown}
              >
                {issueLinkLoading ? "Отправка…" : issueLinkDisabledByCooldown ? `Повторить через ${issueLinkCooldownRemaining} с` : "Выдать ссылку"}
              </Button>
            )}
          </DialogActions>
        </Dialog>
      </div>
    </div>
  );
}

export default RepresentativeHotelDetailPage;
