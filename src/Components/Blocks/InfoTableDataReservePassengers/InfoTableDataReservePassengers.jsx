import React, { useState, useRef, useEffect } from "react";
import classes from "./InfoTableDataReservePassengers.module.css";
import InfoTable from "../InfoTable/InfoTable";
import Button from "../../Standart/Button/Button";
import {
  ADD_PASSENGER_TO_HOTEL,
  ADD_PERSON_TO_HOTEL,
  GET_AIRLINES_RELAY,
  GET_HOTEL_ROOMS,
  GET_HOTELS_UPDATE_SUBSCRIPTION,
  GET_RESERVE_LOGS,
  getCookie,
  UPDATE_HOTEL_BRON,
  UPDATE_RESERVE,
} from "../../../../graphQL_requests";
import { useMutation, useQuery, useSubscription } from "@apollo/client";
import Message from "../Message/Message";
import { Link, useNavigate } from "react-router-dom";
import { roles } from "../../../roles";
import Logs from "../LogsHistory/Logs";
import EditReserveDate from "../../PlacementDND/EditReserveDate/EditReserveDate";
import { InputMask } from "@react-input/mask";
import MUIAutocomplete from "../MUIAutocomplete/MUIAutocomplete";
import AddPassengerModal from "../AddPassengerModal/AddPassengerModal";

function InfoTableDataReservePassengers({
  placement,
  allHotelPlacement,
  setPlacement,
  toggleUpdateSidebar,
  setIdPassangerForUpdate,
  openDeletecomponent,
  user,
  request,
  airline,
  manifest,
  addNotification,
  setFile,
  refetch,
  refetchHotel,
  createPassengerList,
}) {
  const token = getCookie("token");

  const [editingId, setEditingId] = useState(null);
  const [editedData, setEditedData] = useState({});
  const [isAddingNewPassenger, setIsAddingNewPassenger] = useState(false);
  const [isAddingNewPerson, setIsAddingNewPerson] = useState(false);
  const [currentHotelID, setCurrentHotelID] = useState(null);
  const [hotelRooms, setHotelRooms] = useState();
  // Новый стейт для открытия/закрытия модального окна
  const [openAddPassengerModal, setOpenAddPassengerModal] = useState(false);
  const [newPassengerData, setNewPassengerData] = useState({
    name: "",
    gender: "",
    number: "",
    roomId: "",
    place: null,
    hotelId: currentHotelID || "",
    reserveId: request?.id,
    type: "Пассажир",
    order: "",
  });

  const [currentHotelIndex, setCurrentHotelIndex] = useState(null);

  const { data: hotelRoomsData, refetch: hotelRoomsRefetch } = useQuery(
    GET_HOTEL_ROOMS,
    {
      context: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
      variables: { hotelId: currentHotelID },
    }
  );
  const { data: dataSubscriptionUpd } = useSubscription(
    GET_HOTELS_UPDATE_SUBSCRIPTION,
    {
      context: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
      onData: () => {
        hotelRoomsRefetch();
      },
    }
  );

  useEffect(() => {
    setHotelRooms(hotelRoomsData?.hotel?.rooms);
  }, [hotelRoomsData]);

  const [showLogsSidebar, setShowLogsSidebar] = useState(false);

  const toggleLogsSidebar = () => setShowLogsSidebar(!showLogsSidebar);

  const [isEditDateModalOpen, setIsEditDateModalOpen] = useState(false);

  const handleOpenEditDateModal = () => {
    setIsEditDateModalOpen(true);
  };

  const handleCloseEditDateModal = () => {
    setIsEditDateModalOpen(false);
  };

  const newGuestRef = useRef(null);

  const handleUpdate = (id) => {
    toggleUpdateSidebar();
    setIdPassangerForUpdate(id);
  };

  const handleEdit = (id, guest) => {
    setEditingId(id);
    setEditedData(guest);
  };

  const handleChange = (field, value) => {
    setEditedData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSave = (hotelIndex) => {
    setPlacement((prevPlacement) => {
      const updatedPlacement = prevPlacement.map((item, index) =>
        index === hotelIndex
          ? {
              ...item,
              hotel: {
                ...item.hotel,
                passengers: item.hotel.passengers.map((name) =>
                  name.id === editingId ? { ...name, ...editedData } : name
                ),
              },
            }
          : item
      );

      const hotel = updatedPlacement[hotelIndex];

      if (editedData.type === "Пассажир") {
        hotel.hotel.passengers = hotel.hotel.passengers.map((name) =>
          name.id === editingId ? { ...name, ...editedData } : name
        );
      } else {
        hotel.hotel.person = hotel.hotel.person.map((person) =>
          person.id === editingId ? { ...person, ...editedData } : person
        );
      }

      return updatedPlacement;
    });

    setEditingId(null);
    setEditedData({});
  };

  const [createRequestPassenger] = useMutation(ADD_PASSENGER_TO_HOTEL, {
    context: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  });

  const [updateReserve] = useMutation(UPDATE_RESERVE, {
    context: {
      headers: {
        Authorization: `Bearer ${token}`,
        "Apollo-Require-Preflight": "true",
      },
    },
  });

  const [updateHotelBron] = useMutation(UPDATE_HOTEL_BRON, {
    context: {
      headers: {
        Authorization: `Bearer ${token}`,
        // 'Apollo-Require-Preflight': 'true',
      },
    },
    onCompleted: () => {},
  });

  const navigate = useNavigate();

  const [showButton, setShowButton] = useState(true);

  const handleUpdateReserve = async () => {
    try {
      let reserverUpdateReserve = await updateReserve({
        variables: {
          updateReserveId: request.id,
          input: {
            status: "done",
          },
        },
      });

      setShowButton(false);
    } catch (e) {
      console.error(e);
    }

    navigate("/reserve");
  };

  const handleSaveEditedDates = async (updatedRequest) => {
    try {
      // Отправляем данные на сервер
      await updateReserve({
        variables: {
          updateReserveId: request.id,
          input: {
            arrival: updatedRequest.arrival,
            departure: updatedRequest.departure,
          },
        },
      });

      // Обновляем локальное состояние
      setPlacement((prevPlacement) =>
        prevPlacement.map((item) =>
          item.hotel.id === updatedRequest.hotelId
            ? {
                ...item,
                hotel: {
                  ...item.hotel,
                  arrival: updatedRequest.arrival,
                  departure: updatedRequest.departure,
                },
              }
            : item
        )
      );

      // Закрываем модалку после успешного сохранения
      setIsEditDateModalOpen(false);
      addNotification(
        user?.airlineId
          ? "Запрос на изменение даты отправлен в чат успешно."
          : "Редактирование даты прошло успешно.",
        "success"
      );
    } catch (error) {
      console.error("Ошибка при обновлении бронирования:", error);
    }
  };

  useEffect(() => {
    const uploadManifest = async () => {
      if (manifest) {
        try {
          await updateReserve({
            variables: {
              updateReserveId: request.id,
              input: {
                status: request?.status,
              },
              files: manifest,
            },
          });
          refetch();
          refetchHotel();
          addNotification("Манифест добавлен успешно.", "success");
          setFile(null);
        } catch (error) {
          console.error("Ошибка при загрузке манифеста:", error);
          alert("Ошибка при загрузке манифеста");
        } finally {
          setFile(null);
        }
      }
    };

    uploadManifest();
  }, [manifest]);

  const handleAddNewPassenger = async () => {
    if (
      !newPassengerData.name ||
      !newPassengerData.number ||
      !newPassengerData.gender
    ) {
      alert("Введите все данные пассажира.");
      return;
    }
    try {
      const reserverAddHotelPassenger = await createRequestPassenger({
        variables: {
          hotelId: currentHotelID,
          input: {
            name: newPassengerData.name,
            number: newPassengerData.number,
            gender: newPassengerData.gender,
          },
          reservationId: request.id,
        },
      });
      const reserveReport = await createPassengerList(request.id);
      if (reserverAddHotelPassenger.data) {
        const bookingInput = {
          hotelChesses: [
            {
              start: request?.arrival,
              end: request?.departure,
              clientId: reserverAddHotelPassenger.data.addPassengerToReserve.id,
              status: "done",
              hotelId: currentHotelID,
              reserveId: request?.id,
              roomId: newPassengerData.roomId,
              place: Number(newPassengerData.place),
            },
          ],
        };

        const updateHotelResponse = await updateHotelBron({
          variables: {
            updateHotelId: currentHotelID,
            input: bookingInput,
          },
        });

        setOpenAddPassengerModal(false);
        setNewPassengerData({
          name: "",
          gender: "",
          number: "",
          roomId: "",
          place: null,
          hotelId: currentHotelID || "",
          reserveId: request?.id,
          type: "Пассажир",
          order: "",
        });
        setCurrentHotelIndex(null);
        setCurrentHotelID(null);
        setTimeout(() => {
          newGuestRef.current?.scrollIntoView({
            behavior: "smooth",
            block: "end", // было center
          });
        }, 100);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const [createRequest] = useMutation(ADD_PERSON_TO_HOTEL, {
    context: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  });

  const handleAddNewPerson = async () => {
    try {
      if (currentHotelIndex === null) return;

      let reserverAddHotel = await createRequest({
        variables: {
          input: {
            hotelId: currentHotelID,
            personId: newPersonData.id,
            reservationId: request.id,
          },
        },
      });

      if (reserverAddHotel.data) {
        setIsAddingNewPerson(false);
        setNewPersonData({
          name: "",
          gender: "",
          number: "",
          type: "Сотрудник",
          order: "",
          id: "",
        });
        setCurrentHotelIndex(null);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const startAddingNewPassenger = (hotelIndex, hotelID) => {
    setCurrentHotelIndex(hotelIndex);
    setCurrentHotelID(hotelID);
    setOpenAddPassengerModal(true);
  };

  const startAddingNewPerson = (hotelIndex, hotelID) => {
    setIsAddingNewPerson(true);
    setIsAddingNewPassenger(false);
    setCurrentHotelIndex(hotelIndex);
    setCurrentHotelID(hotelID);

    setTimeout(() => {
      newGuestRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }, 100);
  };

  const getAllGuests = (hotel) => {
    return [
      ...hotel.passengers.map((name) => ({
        ...name,
        type: "Пассажир",
      })),
    ];
  };

  const getTotalGuests = () => {
    return placement.reduce((total, item) => {
      return total + getAllGuests(item.hotel).length;
    }, 0);
  };

  const [selectedAirline, setSelectedAirline] = useState(null);
  const { loading, error, data } = useQuery(GET_AIRLINES_RELAY, {
    context: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
    skip: !request,
  });

  useEffect(() => {
    if (data && airline) {
      const selectedAirlineData = data.airlines.airlines.find(
        (item) => item.id === airline.id
      );
      if (selectedAirlineData) {
        setSelectedAirline(selectedAirlineData.staff);
      }
    }
  }, [data, airline]);

  const handleChangePerson = (field, value, selectedName) => {
    const selectedStaff = selectedAirline.find(
      (staff) => staff.name === selectedName
    );

    setEditedData((prev) => ({
      ...prev,
      name: selectedStaff.name,
      gender: selectedStaff.gender,
      number: selectedStaff.number,
    }));
  };

  // Получаем список отелей для отображения
  const filteredPlacement = user.hotelId
    ? placement.filter((item) => item.hotel.id === user.hotelId)
    : placement;

  const hotelPlacement = allHotelPlacement.filter(
    (item) => item.hotel.id === user.hotelId
  );

  const statusLabels = {
    created: "Создан",
    opened: "В обработке",
    extended: "Продлен",
    reduced: "Сокращен",
    transferred: "Перенесен",
    earlyStart: "Ранний заезд",
    canceled: "Отменен",
    archiving: "Готов к архиву",
    archived: "Архив",
    done: "Размещен",
    waiting: "Ожидает",
  };

  const [separator, setSeparator] = useState("airline");
  const [isHaveTwoChats, setIsHaveTwoChats] = useState();

  const [hotelChats, setHotelChats] = useState();
  const [selectedHotelChatId, setSelectedHotelChatId] = useState(null);

  const handleSelectHotelChat = (hotelId) => {
    setSelectedHotelChatId(hotelId);
    setSeparator("hotel"); // Автоматически переключаемся на вкладку "Гостиница"
  };

  const [orgName, setOrgName] = useState("");
  const messageCount = request?.chat;

  return (
    // Сделать отдельную компоненту для чата
    <div style={{ display: "flex", gap: "20px", height: "100%" }}>
      <InfoTable>
        {/* <div className={classes.InfoTable_title}>
          <div className={`${classes.InfoTable_title_elem} ${classes.w5}`}>
            №
          </div>
          <div className={`${classes.InfoTable_title_elem} ${classes.w30}`}>
            ФИО
          </div>
          <div className={`${classes.InfoTable_title_elem} ${classes.w25}`}>
            Номер телефона
          </div>
          <div className={`${classes.InfoTable_title_elem} ${classes.w15}`}>
            Пол
          </div>
          <div className={`${classes.InfoTable_title_elem} ${classes.w20}`}>
            Комната
          </div>
          <div className={`${classes.InfoTable_title_elem} ${classes.w10}`}>
            Действия
          </div>
        </div> */}

        <div
          className={classes.bottom}
          style={{
            height: user.role == roles.hotelAdmin && "calc(100vh - 200px)",
          }}
        >
          {filteredPlacement.map((item, hotelIndex) => {
            const currentHotelMessageCount = messageCount?.find(
              (count) => count.hotelId === item.hotel.id
            );
            return (
              <React.Fragment key={hotelIndex}>
                <div
                  className={`${classes.InfoTable_data} ${classes.stickyHeader}`}
                >
                  <div
                    className={`${classes.InfoTable_data_elem} ${classes.w100}`}
                  >
                    <div className={classes.blockInfoShow}>
                      <span>{item.hotel.name}</span>
                      {getAllGuests(item.hotel).length} гостей из{" "}
                      {item.hotel.passengersCount}
                    </div>

                    <div className={classes.blockInfoShow}>
                      {user?.airlineId ? null : (
                        <Link
                          to={`/hotels/${item.hotel.id}/${item.hotel.requestId}`}
                          onClick={() => localStorage.setItem("selectedTab", 0)}
                          className={`${classes.chatButton}`}
                        >
                          <img src="/table.png" alt="" />
                          {"Шахматка"}
                        </Link>
                      )}
                      {user.role !== roles.hotelAdmin &&
                      user.role !== roles.airlineAdmin ? (
                        <button
                          className={`${classes.chatButton} ${
                            orgName === item.hotel.name ? classes.active : ""
                          }`}
                          onClick={() => handleSelectHotelChat(item.hotel.id)}
                        >
                          <img
                            src="/chatReserve.png"
                            style={{
                              width: "fit-content",
                              height: "fit-content",
                            }}
                            alt=""
                          />
                          Чат
                          {currentHotelMessageCount &&
                            currentHotelMessageCount.unreadMessagesCount >
                              0 && (
                              <div className={classes.messageCount}>
                                {currentHotelMessageCount.unreadMessagesCount}
                              </div>
                            )}
                        </button>
                      ) : null}
                      {getAllGuests(item.hotel).length <
                        item.hotel.passengersCount && (
                        <Button
                          onClick={() =>
                            startAddingNewPassenger(hotelIndex, item.hotel.id)
                          }
                        >
                          <img src="/plus.png" alt="" /> Пассажир
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
                <div className={classes.InfoTableWrapper}>
                  {getAllGuests(item.hotel)
                    .sort((a, b) => a.order - b.order)
                    .map((guest, index) => (
                      <div
                        className={`${classes.InfoTable_data} ${classes.InfoTableElemWrapper}`}
                        key={guest.id}
                      >
                        <div
                          className={`${classes.InfoTableDataElem} ${classes.w15}`}
                        >
                          <span className={classes.blueText}>{index + 1}</span>
                        </div>
                        <div
                          className={`${classes.InfoTableDataElem} ${classes.left} ${classes.w45}`}
                        >
                          <div className={classes.infoContainer}>
                            <p>
                              {guest.name}{" "}
                              <span className={classes.blueText}>
                                {guest.gender === "Мужской" ? "М" : "Ж"}
                              </span>
                            </p>
                            <p>{guest.number}</p>
                          </div>
                        </div>
                        <div
                          className={`${classes.InfoTableDataElem} ${classes.w30} ${classes.left}`}
                        >
                          <span
                            className={classes.blueText}
                            style={{ textAlign: "left" }}
                          >
                            <span style={{ color: "var(--main-gray)" }}>
                              Комната
                            </span>{" "}
                            {guest.room?.name}
                          </span>
                        </div>
                        <div
                          className={`${classes.InfoTableDataElem} ${classes.w10}`}
                        >
                          {editingId === guest.id ? (
                            <Button onClick={() => handleSave(hotelIndex)}>
                              Сохранить
                            </Button>
                          ) : (
                            <>
                              <img
                                src="/deletePassenger.png"
                                alt=""
                                style={{ cursor: "pointer" }}
                                onClick={() => openDeletecomponent(guest, item)}
                              />
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                </div>

                {isAddingNewPassenger && currentHotelIndex === hotelIndex && (
                  <div className={classes.InfoTable_data} ref={newGuestRef}>
                    <div
                      className={`${classes.InfoTable_data_elem} ${classes.w5}`}
                    ></div>
                    <div
                      className={`${classes.InfoTable_data_elem} ${classes.w35}`}
                    >
                      <input
                        type="text"
                        placeholder="ФИО пассажира"
                        value={newPassengerData.name}
                        onChange={(e) =>
                          setNewPassengerData({
                            ...newPassengerData,
                            name: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div
                      className={`${classes.InfoTable_data_elem} ${classes.w20}`}
                    >
                      <InputMask
                        type="text"
                        mask="+7 (___) ___-__-__"
                        replacement={{ _: /\d/ }}
                        name="number"
                        value={newPassengerData.number}
                        onChange={(e) =>
                          setNewPassengerData({
                            ...newPassengerData,
                            number: e.target.value,
                          })
                        }
                        placeholder="Номер телефона"
                        autoComplete="new-password"
                      />
                    </div>
                    <div
                      className={`${classes.InfoTable_data_elem} ${classes.w20}`}
                    >
                      <MUIAutocomplete
                        dropdownWidth={"100%"}
                        label={"Выберите пол"}
                        options={["Мужской", "Женский"]}
                        value={newPassengerData.gender}
                        onChange={(event, newValue) => {
                          setNewPassengerData({
                            ...newPassengerData,
                            gender: newValue,
                          });
                        }}
                      />
                    </div>
                    <div
                      className={`${classes.InfoTable_data_elem} ${classes.w20}`}
                    >
                      <Button onClick={handleAddNewPassenger}>Добавить</Button>
                    </div>
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>

        {user.role !== roles.hotelAdmin && (
          <div className={classes.counting}>
            <div className={classes.hotelAbout_info__filters}>
              <button onClick={toggleLogsSidebar}>
                <img src="/historyLog.png" alt="" /> История
              </button>
              <Button onClick={handleOpenEditDateModal}>
                {!user?.airlineId
                  ? "Редактировать даты"
                  : "Запрос на изменение даты"}
              </Button>
              {/* ) : null } */}
            </div>
            <div className={classes.countingPeople}>
              <img src="/peopleCount.png" alt="" />
              {placement.length} отелей, {getTotalGuests()} из{" "}
              {request.passengerCount} гостей
              {getTotalGuests() == request.passengerCount &&
                request.status != "done" &&
                showButton && (
                  <Button onClick={handleUpdateReserve}>
                    Все гости размещены
                  </Button>
                )}
              {!showButton && <div>Все заселены</div>}
              {getTotalGuests() == request.passengerCount &&
                request.status == "done" && <div>Все заселены</div>}
            </div>
          </div>
        )}
      </InfoTable>

      {filteredPlacement.length === 0 && user?.hotelId ? null : (
        <>
          <div className={classes.chatWrapper}>
            {user.role !== roles.superAdmin &&
            user.role !== roles.dispatcerAdmin ? null : (
              <div className={classes.separatorWrapper}>
                {isHaveTwoChats === false ? (
                  <button
                    onClick={() => setSeparator("airline")} // Установить separator как 'airline'
                    className={separator === "airline" ? classes.active : null}
                  >
                    Авиакомпания
                  </button>
                ) : (
                  <>
                    <button
                      onClick={() => setSeparator("airline")} // Установить separator как 'airline'
                      className={
                        separator === "airline" ? classes.active : null
                      }
                    >
                      Авиакомпания
                    </button>
                    <button
                      onClick={() => setSeparator("hotel")} // Установить separator как 'hotel'
                      className={separator === "hotel" ? classes.active : null}
                    >
                      Гостиница
                    </button>
                  </>
                )}
              </div>
            )}
            {user.role !== roles.hotelAdmin &&
            user.role !== roles.airlineAdmin ? (
              <p className={classes.chatName}>
                {separator === "airline" ? "" : orgName}
              </p>
            ) : null}

            <Message
              activeTab={"Комментарий"}
              setIsHaveTwoChats={setIsHaveTwoChats}
              setHotelChats={setHotelChats}
              setTitle={setOrgName}
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
                  ? "calc(100vh - 360px)"
                  : "calc(100vh - 280px)"
              }
              separator={separator}
              hotelChatId={selectedHotelChatId}
            />
          </div>
        </>
      )}
      {/* )} */}
      <Logs
        type={"reserve"}
        queryLog={GET_RESERVE_LOGS}
        queryID={"reserveId"}
        id={request.id}
        show={showLogsSidebar}
        onClose={toggleLogsSidebar}
        name={request.reserveNumber}
      />
      <EditReserveDate
        isOpen={isEditDateModalOpen}
        onClose={handleCloseEditDateModal}
        onSave={handleSaveEditedDates}
        request={request}
      />
      <AddPassengerModal
        user={user}
        open={openAddPassengerModal}
        onClose={() => {
          setOpenAddPassengerModal(false);
          setCurrentHotelID(null);
          setNewPassengerData({
            name: "",
            gender: "",
            number: "",
            roomId: "",
            place: null,
            hotelId: currentHotelID || "",
            reserveId: request?.id,
            type: "Пассажир",
            order: "",
          });
        }}
        newPassengerData={newPassengerData}
        setNewPassengerData={setNewPassengerData}
        onAdd={handleAddNewPassenger}
        currentHotelID={currentHotelID}
        hotelRooms={hotelRooms}
      />
    </div>
  );
}

export default InfoTableDataReservePassengers;
