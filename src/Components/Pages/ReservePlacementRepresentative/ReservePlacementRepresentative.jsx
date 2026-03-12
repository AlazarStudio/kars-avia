import React, { useEffect, useMemo, useState } from "react";
import classes from "./ReservePlacementRepresentative.module.css";
import { Link, useParams, useNavigate, useLocation } from "react-router-dom";
import MenuDispetcher from "../../Blocks/MenuDispetcher/MenuDispetcher";
import Header from "../../Blocks/Header/Header";
import Filter from "../../Blocks/Filter/Filter";
import Button from "../../Standart/Button/Button";
import InfoTableDataReserve_passengers from "../../Blocks/InfoTableDataReserve_passengers/InfoTableDataReserve_passengers";

import { requestsReserve } from "../../../requests";
import AddNewPassenger from "../../Blocks/AddNewPassenger/AddNewPassenger";
import UpdatePassanger from "../../Blocks/UpdatePassanger/UpdatePassanger";
import DeleteComponent from "../../Blocks/DeleteComponent/DeleteComponent";
import ChooseHotel from "../../Blocks/ChooseHotel/ChooseHotel";
import { useMutation, useQuery, useSubscription } from "@apollo/client";
import {
  COMPLETE_PASSENGER_REQUEST_EARLY,
  CREATE_RESERVE_REPORT,
  DELETE_PASSENGER_FROM_HOTEL,
  DELETE_PERSON_FROM_HOTEL,
  GET_AIRLINE_DEPARTMENT,
  GET_AIRLINES_UPDATE_SUBSCRIPTION,
  GET_DISPATCHER_DEPARTMENTS,
  GET_HOTELS_RELAY,
  GET_PASSENGER_REQUEST,
  GET_RESERVE_REQUEST,
  GET_RESERVE_REQUEST_HOTELS,
  GET_RESERVE_REQUEST_HOTELS_SUBSCRIPTION,
  GET_RESERVE_REQUEST_HOTELS_SUBSCRIPTION_PERSONS,
  getCookie,
  PASSENGER_REQUEST_UPDATED_SUBSCRIPTION,
} from "../../../../graphQL_requests";
import {
  isAirlineRole as isAirlineRoleCheck,
  isDispatcherRole as isDispatcherRoleCheck,
  isExternalPassengerRequestUser,
} from "../../../utils/access";
import CreateRequestHotel from "../../Blocks/CreateRequestHotel/CreateRequestHotel";
import CreateRequestHotelReserve from "../../Blocks/CreateRequestHotelReserve/CreateRequestHotelReserve";
import MUILoader from "../../Blocks/MUILoader/MUILoader";
import Notification from "../../Notification/Notification";
import { fullNotifyTime, notifyTime, roles } from "../../../roles";
import MUITextField from "../../Blocks/MUITextField/MUITextField";
import ManifestModal from "../../Blocks/ManifestModal/ManifestModal";
import ManifestDropdown from "../../Blocks/ManifestDropdown/ManifestDropdown";
import InfoTableDataReserveRepresentative from "../../Blocks/InfoTableDataReserveRepresentative/InfoTableDataReserveRepresentative";
import ChatPanel from "./ChatPanel";
import WaterSupplyTab from "../../Blocks/WaterSupplyTab/WaterSupplyTab";
import PowerSupplyTab from "../../Blocks/PowerSupplyTab/PowerSupplyTab";
import TransferAccommodationTab from "../../Blocks/TransferAccommodationTab/TransferAccommodationTab";
import BaggageDeliveryTab from "../../Blocks/BaggageDeliveryTab/BaggageDeliveryTab";
import HabitationTab from "../../Blocks/HabitationTab/HabitationTab";
import Message from "../../Blocks/Message/Message";
import CookiesNotice from "../../Blocks/CookiesNotice/CookiesNotice";
import { useCookies } from "../../../hooks/useCookies";
import AddRepresentativeService from "../../Blocks/AddRepresentativeService/AddRepresentativeService";
import AddRepresentativeHotel from "../../Blocks/AddRepresentativeHotel/AddRepresentativeHotel";
import AddRepresentativeDriver from "../../Blocks/AddRepresentativeDriver/AddRepresentativeDriver";
import PassengerRequestLogs from "../../Blocks/LogsHistory/PassengerRequestLogs";
import * as XLSX from "xlsx";
import DownloadIcon from "../../../shared/icons/DownloadIcon";

function ReservePlacementRepresentative({ children, user, ...props }) {
  const token = getCookie("token");
  const navigate = useNavigate();
  const location = useLocation();
  const { id, idRequest } = useParams();
  const [request, setRequest] = useState([]);
  const [placement, setPlacement] = useState([]);
  const [filter, setFilter] = useState("waterSupply");

  const [isHaveTwoChats, setIsHaveTwoChats] = useState();
  const [separator, setSeparator] = useState("airline");
  const [hotelChats, setHotelChats] = useState();
  const [selectedHotelChatId, setSelectedHotelChatId] = useState(null);

  const getAvailableFilters = (currentRequest) => {
    return [
      {
        key: "waterSupply",
        label: "Поставка воды",
        enabled: currentRequest.waterService?.plan?.enabled,
      },
      {
        key: "powerSupply",
        label: "Поставка питания",
        enabled: currentRequest.mealService?.plan?.enabled,
      },
      {
        key: "transferAccommodation",
        label: "Трансфер",
        enabled: currentRequest.transferService?.plan?.enabled,
      },
      {
        key: "baggageDelivery",
        label: "Доставка багажа",
        enabled: currentRequest.baggageDeliveryService?.plan?.enabled,
      },
      {
        key: "habitation",
        label: "Проживание",
        enabled: currentRequest.livingService?.plan?.enabled,
      },
    ].filter((f) => f.enabled);
  };

  // Используем useMemo для filters чтобы избежать лишних ререндеров
  const filters = useMemo(() => getAvailableFilters(request), [request]);

  const [showCreateSidebarHotel, setShowCreateSidebarHotel] = useState(false);
  const [showEarlyCompleteModal, setShowEarlyCompleteModal] = useState(false);
  const [earlyCompleteReason, setEarlyCompleteReason] = useState("");
  const [showHistoryPanel, setShowHistoryPanel] = useState(false);

  const { loading, error, data, refetch } = useQuery(GET_PASSENGER_REQUEST, {
    context: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
    variables: { passengerRequestId: idRequest },
  });

  // console.log(data);
  

  const {
    loading: loadingHotel,
    error: errorHotel,
    data: dataHotel,
    refetch: refetchHotel,
  } = useQuery(GET_RESERVE_REQUEST_HOTELS, {
    context: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
    variables: { reservationHotelsId: idRequest },
  });

  const { data: subscriptionData } = useSubscription(
    GET_RESERVE_REQUEST_HOTELS_SUBSCRIPTION,
    {
      context: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
      onData: () => {
        refetch();
        refetchHotel();
      },
    }
  );

  const { data: subscriptionDataPerson } = useSubscription(
    GET_RESERVE_REQUEST_HOTELS_SUBSCRIPTION_PERSONS,
    {
      context: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
      onData: () => {
        refetch();
        refetchHotel();
      },
    }
  );

  useSubscription(PASSENGER_REQUEST_UPDATED_SUBSCRIPTION, {
    context: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
    onData: () => {
      refetch();
      refetchHotel();
    },
  });

  const [completeEarly, { loading: completingEarly }] = useMutation(
    COMPLETE_PASSENGER_REQUEST_EARLY,
    {
      context: { headers: { Authorization: `Bearer ${token}` } },
      refetchQueries: [
        { query: GET_PASSENGER_REQUEST, variables: { passengerRequestId: idRequest } },
      ],
      awaitRefetchQueries: true,
    }
  );

  // Досрочное завершение всей заявки временно скрыто; доступно досрочное завершение услуг (вода, питание) в подвале каждой вкладки
  const canCompleteEarly = false;

  const handleEarlyComplete = async () => {
    const reason = (earlyCompleteReason || "").trim();
    if (!reason) {
      addNotification("Укажите причину досрочного завершения.", "error");
      return;
    }
    try {
      await completeEarly({
        variables: { id: request.id, reason },
      });
      setShowEarlyCompleteModal(false);
      setEarlyCompleteReason("");
      addNotification("Заявка досрочно завершена.", "success");
      refetch();
    } catch (err) {
      addNotification(
        err?.graphQLErrors?.[0]?.message || err?.message || "Ошибка при завершении.",
        "error"
      );
    }
  };

  const [accessMenu, setAccessMenu] = useState({});

  const isDispatcherRole = isDispatcherRoleCheck(user);
  const isAirlineRole = isAirlineRoleCheck(user);
  const isExternalUser = isExternalPassengerRequestUser(user);
  const restrictedToHotelItemId = user?.passengerServiceHotelItemId;
  const dispatcherDepartmentId = user?.dispatcherDepartmentId;

  const habitationRequest = useMemo(() => {
    if (!request || !isExternalUser || !restrictedToHotelItemId) return request;
    const hotels = request.livingService?.hotels ?? [];
    const allowed = hotels.filter((h) => h.itemId === restrictedToHotelItemId);
    if (allowed.length === 0) return request;
    return { ...request, livingService: { ...request.livingService, hotels: allowed } };
  }, [request, isExternalUser, restrictedToHotelItemId]);

  const { data: airlineDepartmentData, refetch: refetchAirlineDepartment } =
    useQuery(GET_AIRLINE_DEPARTMENT, {
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

  const { data: dispatcherDepartmentsData } = useQuery(
    GET_DISPATCHER_DEPARTMENTS,
    {
      context: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
      variables: {
        pagination: { all: true },
      },
      // skip: !isDispatcherRole || !dispatcherDepartmentId,
    }
  );

  //   console.log(user);
  //   console.log(isDispatcherRole)
  // console.log(isAirlineRole)
  // console.log(dispatcherDepartmentId)
  useSubscription(GET_AIRLINES_UPDATE_SUBSCRIPTION, {
    context: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
    skip: !isAirlineRole || !user?.airlineDepartmentId,
    onData: () => {
      refetchAirlineDepartment();
    },
  });

  useEffect(() => {
    if (location.state?.tab === "habitation") {
      setFilter("habitation");
    }
    if (location.state?.tab === "transferAccommodation") {
      setFilter("transferAccommodation");
    }
  }, [location.state?.tab]);

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

  useEffect(() => {
    if (!request || !isExternalUser) return;
    if (user?.passengerRequestId && request.id !== user.passengerRequestId) {
      navigate(`/${id}/representativeRequestsPlacement/${user.passengerRequestId}`, { replace: true });
      return;
    }
    if (!restrictedToHotelItemId) return;
    if (location.pathname.includes("/hotel/")) return;
    const hotels = request.livingService?.hotels ?? [];
    const allowed = hotels.find((h) => h.itemId === restrictedToHotelItemId);
    if (!allowed) return;
    const hotelId = allowed.hotelId ?? allowed.name ?? String(hotels.findIndex((h) => h.itemId === restrictedToHotelItemId));
    navigate(`/${id}/representativeRequestsPlacement/${idRequest}/hotel/${encodeURIComponent(hotelId)}`, { replace: true });
  }, [request, isExternalUser, restrictedToHotelItemId, user?.passengerRequestId, location.pathname, id, idRequest, navigate]);

  // console.log(dataHotel);

  // Всегда обновлять request из данных заявки ФАП (в т.ч. после refetch при «Вода доставлена» / «Питание доставлено»)
  useEffect(() => {
    if (data?.passengerRequest) {
      setRequest(data.passengerRequest);
      const availableFilters = getAvailableFilters(data.passengerRequest);
      if (
        availableFilters.length > 0 &&
        !availableFilters.some((f) => f.key === filter)
      ) {
        setFilter(availableFilters[0].key);
      }
    }
  }, [data]);

  useEffect(() => {
    if (data && data.passengerRequest && dataHotel?.reservationHotels) {
      const getClientInfo = (client, hotelChess, isPassenger) => {
        const clientInfo = isPassenger
          ? hotelChess.find((entry) => entry.passenger?.id === client)
          : hotelChess.find((entry) => entry.client?.id === client);
        return clientInfo;
      };

      const transformedData = dataHotel.reservationHotels.map((item) => ({
        hotel: {
          reservationHotelId: item.id,
          id: item.hotel?.id,
          name: item.hotel?.name,
          passengersCount: item.capacity?.toString?.() ?? "0",
          city: item.hotel?.city,
          requestId: item.reserve?.id,
          passengers: (item.passengers ?? []).map((passenger, index) => ({
            status: getClientInfo(passenger.id, item.hotelChess, true)
              ? getClientInfo(passenger.id, item.hotelChess, true).status
              : "waiting",
            room: getClientInfo(passenger.id, item.hotelChess, true)
              ? getClientInfo(passenger.id, item.hotelChess, true).room
              : "-",
            name: passenger?.name || "не указано",
            gender: passenger?.gender || "не указано",
            number: passenger?.number || "не указано",
            type: passenger?.type || "не указано",
            order: index + 1,
            id: passenger?.id || `id-${index}`,
          })),
        },
      }));

      setPlacement(transformedData);
    }
  }, [data, dataHotel, subscriptionData, subscriptionDataPerson]);

  const [showCreateSidebar, setShowCreateSidebar] = useState(false);
  const [showServiceSidebar, setShowServiceSidebar] = useState(false);
  const [showAddHotelSidebar, setShowAddHotelSidebar] = useState(false);

  const toggleCreateSidebar = () => {
    setShowCreateSidebar(!showCreateSidebar);
  };

  const toggleServiceSidebar = () => {
    setShowServiceSidebar(!showServiceSidebar);
  };

  const toggleAddHotelSidebar = () => {
    setShowAddHotelSidebar((prev) => !prev);
  };

  const [showAddDriverSidebar, setShowAddDriverSidebar] = useState(false);
  const toggleAddDriverSidebar = () => {
    setShowAddDriverSidebar((prev) => !prev);
  };

  const handleRasselenieExport = () => {
    const hotels = request?.livingService?.hotels ?? [];
    const rows = [];
    const subHeaders = ["ФИО", "Номер комнаты", "Телефон", "Пол"];
    for (const hotel of hotels) {
      rows.push([hotel.name ?? ""]);
      rows.push(subHeaders);
      const people = hotel.people ?? [];
      for (const person of people) {
        rows.push([
          person.fullName ?? "",
          person.roomNumber ?? "",
          person.phone ?? "",
          person.gender ?? "",
        ]);
      }
      rows.push([]);
    }
    const aoa = rows;
    const ws = XLSX.utils.aoa_to_sheet(aoa);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Расселение");
    const safe = (s) => String(s).replace(/[/\\?*\[\]:]/g, "_").slice(0, 100);
    const dateStr = new Date().toISOString().slice(0, 10);
    const fileName = `rasselenie_${safe(request?.flightNumber ?? "")}_${dateStr}.xlsx`;
    XLSX.writeFile(wb, fileName);
  };

  const [showChooseHotel, setShowChooseHotel] = useState(false);
  const toggleChooseHotel = () => {
    setShowChooseHotel(!showChooseHotel);
  };

  const [notifications, setNotifications] = useState([]);

  const addNotification = (text, status) => {
    const id = Date.now(); // Уникальный ID
    setNotifications((prev) => [...prev, { id, text, status }]);

    setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    }, fullNotifyTime);
  };

  const [searchQuery, setSearchQuery] = useState("");
  const [habitationSearchQuery, setHabitationSearchQuery] = useState("");
  const handleSearch = (e) => {
    setSearchQuery(e.target.value);
  };

  const filteredPlacement = placement
    .map((item) => {
      const filteredPassengers = item.hotel.passengers.filter((passenger) =>
        passenger.name.toLowerCase().includes(searchQuery.toLowerCase())
      );

      // console.log(filteredPassengers);

      // const filteredPersons = item.hotel.person.filter((person) =>
      //     person.name.toLowerCase().includes(searchQuery.toLowerCase())
      // );

      const isHotelMatch = item.hotel.name
        .toLowerCase()
        .includes(searchQuery.toLowerCase());

      if (filteredPassengers.length > 0 || isHotelMatch) {
        return {
          ...item,
          hotel: {
            ...item.hotel,
            passengers: filteredPassengers,
            // person: filteredPersons,
          },
        };
      }

      return null;
    })
    .filter((item) => item !== null);

  const toggleCreateSidebarHotel = () => {
    setShowCreateSidebarHotel(!showCreateSidebarHotel);
  };

  const [showChooseHotels, setShowChooseHotels] = useState(0);

  useEffect(() => {
    const totalPassengers = placement.reduce(
      (acc, item) => acc + Number(item.hotel.passengersCount),
      0
    );
    setShowChooseHotels(totalPassengers);
  }, [placement]);

  const [file, setFile] = useState(null);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
    }
  };

  const [openManifestModal, setOpenManifestModal] = useState(false);

  const { cookiesAccepted, acceptCookies, isInitialized } = useCookies();
  // console.log(filters.length);

  return (
    <div className={classes.main}>
      <MenuDispetcher id={"representativeRequests"} accessMenu={accessMenu} />
      {isInitialized && !cookiesAccepted && (
        <CookiesNotice onAccept={acceptCookies} />
      )}
      <div className={classes.section}>
        <Header>
          <div className={classes.titleHeader}>
            <Link to={`/representativeRequests`} className={classes.backButton}>
              <img src="/arrow.png" alt="" />
            </Link>
            Заявка {request.flightNumber}
          </div>
        </Header>
        <div className={classes.tabsRowWrapper}>
          <div
            className={classes.filter_wrapper}
            role="tablist"
            aria-label="Фильтры услуги"
          >
            {filters.map((i) => (
              <button
                key={i.key}
                role="tab"
                aria-selected={filter === i.key}
                aria-controls={`panel-${i.key}`}
                tabIndex={filter === i.key ? 0 : -1}
                onClick={() => setFilter(i.key)}
                className={filter === i.key ? classes.activeButton : undefined}
              >
                {i.label}
              </button>
            ))}
          </div>
          <div className={classes.tabsRowActions}>
            {!isExternalUser && (
              <button
                className={classes.historyButton}
                onClick={() => setShowHistoryPanel(true)}
                title="История изменений заявки"
              >
                История <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M7.5 15C3.35786 15 0 11.6421 0 7.5C0 3.35786 3.35786 0 7.5 0C11.6421 0 15 3.35786 15 7.5C14.9955 11.6403 11.6403 14.9955 7.5 15ZM7.5 1.5C4.18629 1.5 1.5 4.18629 1.5 7.5C1.5 10.8137 4.18629 13.5 7.5 13.5C10.8137 13.5 13.5 10.8137 13.5 7.5C13.4963 4.18783 10.8122 1.50372 7.5 1.5ZM11.25 8.25H6.75V3.75H8.25V6.75H11.25V8.25Z" fill="#545873" />
                </svg>
              </button>
            )}
            {!isExternalUser && filters.length < 5 && (
              <Button onClick={toggleServiceSidebar}>Добавить услугу</Button>
            )}
          </div>
        </div>

        <div className={classes.section_searchAndFilter}>
          {filter !== "habitation" && (
            <MUITextField
              className={classes.mainSearch}
              label={"Поиск"}
              value={searchQuery}
              onChange={handleSearch}
            />
          )}

          {filter === "habitation" && (
            <MUITextField
              className={classes.mainSearch}
              label="Поиск"
              value={habitationSearchQuery}
              onChange={(e) => setHabitationSearchQuery(e.target.value)}
            />
          )}

          <div className={classes.downloadsButtonsWrapper}>
            {/* {request?.files && request?.files.length !== 0 ? (
              <>
                <ManifestDropdown
                  request={request}
                  server={server}
                  handleFileChange={handleFileChange}
                  file={file}
                  user={user}
                />
              </>
            ) : !request?.files ? (
              <MUILoader loadSize={"35px"} />
            ) : (
              <>
                {user?.hotelId ? null : (
                  <>
                    <input
                      type="file"
                      id="fileUpload"
                      style={{ display: "none" }}
                      onChange={handleFileChange}
                    />

                    <label
                      htmlFor="fileUpload"
                      className={classes.downloadsButton}
                      style={{ width: "130px" }}
                    >
                      <img
                        src="/plus.png"
                        alt=""
                        style={{
                          width: "15px",
                          objectFit: "contain",
                          filter: "invert(100%)",
                        }}
                      />
                      Манифест
                    </label>
                  </>
                )}
              </>
            )} */}
            {/* {request?.passengerList?.length !== 0 ? (
              <a
                href={`${server}${request?.passengerList}`}
                target="_blank"
                className={classes.downloadsButton}
              >
                Расселение
                <img src="/downloadManifest.png" alt="" />
              </a>
            ) : null} */}
            {/* {user?.airlineId ? null : (
              <div className={classes.btnsReserve}>
                {user.role != "HOTELADMIN" && (
                  <Button onClick={toggleCreateSidebarHotel}>
                    Создать гостиницу
                  </Button>
                )}
                {exists &&
                request.passengerCount === showChooseHotels ? null : (
                  <Button onClick={toggleCreateSidebar}>
                    {user.role == "HOTELADMIN"
                      ? "Выбрать количество пассажиров"
                      : "Добавить гостиницу"}
                  </Button>
                )}
              </div>
            )} */}

            {filter === "habitation" && (
              <>
                <button
                  type="button"
                  className={classes.rasselenieBtn}
                  onClick={handleRasselenieExport}
                >
                  Расселение
                  <DownloadIcon />
                </button>
                {!isExternalUser && (
                  <Button onClick={toggleAddHotelSidebar}>Добавить гостиницу</Button>
                )}
              </>
            )}
            {filter === "transferAccommodation" &&
              request?.transferService?.plan?.enabled &&
              !isExternalUser && (
                <Button onClick={toggleAddDriverSidebar}>Добавить водителя</Button>
              )}
            {canCompleteEarly && (
              <Button
                onClick={() => setShowEarlyCompleteModal(true)}
                disabled={completingEarly}
              >
                Досрочно завершить
              </Button>
            )}
          </div>
        </div>
        <PassengerRequestLogs
          show={showHistoryPanel}
          onClose={() => setShowHistoryPanel(false)}
          passengerRequestId={idRequest}
        />
        {showEarlyCompleteModal && (
          <div className={classes.modalOverlay} onClick={() => !completingEarly && setShowEarlyCompleteModal(false)}>
            <div className={classes.modalContent} onClick={(e) => e.stopPropagation()}>
              <h3>Досрочно завершить заявку</h3>
              <p>Укажите причину досрочного завершения (обязательно):</p>
              <MUITextField
                multiline
                minRows={3}
                label="Причина"
                value={earlyCompleteReason}
                onChange={(e) => setEarlyCompleteReason(e.target.value)}
                fullWidth
                className={classes.modalReasonInput}
              />
              <div className={classes.modalActions}>
                <Button
                  onClick={() => {
                    setShowEarlyCompleteModal(false);
                    setEarlyCompleteReason("");
                  }}
                  disabled={completingEarly}
                >
                  Отмена
                </Button>
                <Button onClick={handleEarlyComplete} disabled={completingEarly}>
                  {completingEarly ? "Сохранение…" : "Завершить"}
                </Button>
              </div>
            </div>
          </div>
        )}
        {loading && <MUILoader />}
        {error && <p>Error: {error.message}</p>}

        {!loading && !error && request && (
          <>
            {/* Контент вкладок */}
            <div className={classes.contentWithChat}>
              <div className={classes.tabContent}>
                {filter === "waterSupply" &&
                  request.waterService?.plan.enabled && (
                    <WaterSupplyTab
                      id="panel-waterSupply"
                      request={request}
                      onStatusChanged={() => refetch()}
                      addNotification={addNotification}
                      token={token}
                    />
                  )}
                {filter === "powerSupply" &&
                  request.mealService?.plan.enabled && (
                    <PowerSupplyTab
                      id="panel-powerSupply"
                      request={request}
                      onStatusChanged={() => refetch()}
                      addNotification={addNotification}
                      token={token}
                    />
                  )}
                {filter === "transferAccommodation" &&
                  request.transferService?.plan?.enabled && (
                    <TransferAccommodationTab
                      id="panel-transferAccommodation"
                      request={request}
                      onStatusChanged={() => {
                        refetch();
                        refetchHotel();
                      }}
                      addNotification={addNotification}
                      onDriverSelect={(d, idx) =>
                        navigate(
                          `/${id}/representativeRequestsPlacement/${idRequest}/driver/${idx}`
                        )
                      }
                    />
                  )}
                {filter === "baggageDelivery" &&
                  request.baggageDeliveryService?.plan?.enabled && (
                    <BaggageDeliveryTab
                      id="panel-baggageDelivery"
                      request={request}
                      onStatusChanged={() => {
                        refetch();
                        refetchHotel();
                      }}
                      addNotification={addNotification}
                    />
                  )}
                {filter === "habitation" &&
                  request.livingService?.plan?.enabled && (
                    <HabitationTab
                      id="panel-habitation"
                      request={habitationRequest}
                      searchQuery={habitationSearchQuery}
                      addNotification={addNotification}
                      onHotelSelect={(h, i) => {
                        const hotelId = h.hotelId ?? h.name ?? String(i);
                        navigate(`/${id}/representativeRequestsPlacement/${idRequest}/hotel/${encodeURIComponent(hotelId)}`);
                      }}
                    />
                  )}
              </div>

              {/* Правый столбец с чатом и "Добавить услугу" — всегда */}
              {filteredPlacement.length === 0 && user?.hotelId ? null : (
                <>
                  <div className={classes.chatWrapper}>
                    <Message
                      activeTab={"Комментарий"}
                      setIsHaveTwoChats={setIsHaveTwoChats}
                      setHotelChats={setHotelChats}
                      // setTitle={setOrgName}
                      // setMessageCount={setMessageCount}
                      chooseRequestID={""}
                      chooseReserveID={request.id}
                      filteredPlacement={filteredPlacement}
                      token={token}
                      user={user}
                      chatPadding={"0"}
                      chatHeight={
                        user.role !== roles.hotelAdmin &&
                          user.role !== roles.airlineAdmin
                          ? "calc(100vh - 364px)"
                          : "calc(100vh - 280px)"
                      }
                      separator={separator}
                      hotelChatId={selectedHotelChatId}
                    />
                  </div>
                </>
              )}
            </div>

            <CreateRequestHotelReserve
              show={showCreateSidebarHotel}
              onClose={toggleCreateSidebarHotel}
            />

            <AddRepresentativeService
              show={showServiceSidebar}
              onClose={toggleServiceSidebar}
              request={request}
              user={user}
              addNotification={addNotification}
            />

            <AddRepresentativeHotel
              show={showAddHotelSidebar}
              onClose={toggleAddHotelSidebar}
              request={request}
              addNotification={addNotification}
            />

            <AddRepresentativeDriver
              show={showAddDriverSidebar}
              onClose={toggleAddDriverSidebar}
              request={request}
              addNotification={addNotification}
            />

            <AddNewPassenger
              show={showCreateSidebar}
              onClose={toggleCreateSidebar}
              request={request}
              placement={placement ? placement : []}
              setPlacement={setPlacement}
              user={user}
              showChooseHotels={showChooseHotels}
              setShowChooseHotels={setShowChooseHotels}
            />

            <ChooseHotel
              show={showChooseHotel}
              onClose={toggleChooseHotel}
              chooseObject={placement}
              id={"reserve"}
            />

            <ManifestModal
              user={user}
              open={openManifestModal}
              onClose={() => setOpenManifestModal(false)}
              handleFileChange={handleFileChange}
              file={file}
              request={request}
              classes={classes}
            />

            {notifications.map((n, index) => (
              <Notification
                key={n.id}
                text={n.text}
                status={n.status}
                index={index}
                time={notifyTime}
                onClose={() => {
                  setNotifications((prev) =>
                    prev.filter((notif) => notif.id !== n.id)
                  );
                }}
              />
            ))}
          </>
        )}
      </div>
    </div>
  );
}

export default ReservePlacementRepresentative;
