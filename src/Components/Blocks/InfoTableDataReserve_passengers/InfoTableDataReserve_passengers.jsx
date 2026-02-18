import React, { useState, useRef, useEffect } from "react";
import classes from "./InfoTableDataReserve_passengers.module.css";
import InfoTable from "../InfoTable/InfoTable";
import Button from "../../Standart/Button/Button";
import {
  ADD_PASSENGER_TO_HOTEL,
  ADD_PERSON_TO_HOTEL,
  GET_AIRLINES_RELAY,
  GET_HOTEL_ROOMS,
  GET_HOTELS_UPDATE_SUBSCRIPTION,
  GET_RESERVE_LOGS,
  GET_RESERVE_REQUEST_HOTELS_SUBSCRIPTION,
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

function InfoTableDataReserve_passengers({
  placement,
  allHotelPlacement,
  setPlacement,
  toggleUpdateSidebar,
  setIdPassangerForUpdate,
  openDeletecomponent,
  toggleChooseHotel,
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

  // console.log(request);

  // const [newPersonData, setNewPersonData] = useState({
  //   name: "",
  //   gender: "",
  //   number: "",
  //   type: "Сотрудник",
  //   order: "",
  //   id: "",
  // });
  const [currentHotelIndex, setCurrentHotelIndex] = useState(null);

  // console.log(currentHotelID);

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

  // console.log(hotelRooms);

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
        // 'Apollo-Require-Preflight': 'true',
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
      // refetch();
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

  // console.log(request?.id);

  // const handleAddNewPassenger = async () => {
  //   if (
  //     !newPassengerData.name ||
  //     !newPassengerData.number ||
  //     !newPassengerData.gender
  //   ) {
  //     alert("Введите все данные пассажира.");
  //     return;
  //   }
  //   try {
  //     // if (currentHotelIndex === null) return;

  //     let reserverAddHotelPassenger = await createRequestPassenger({
  //       variables: {
  //         hotelId: currentHotelID,
  //         input: {
  //           name: newPassengerData.name,
  //           number: newPassengerData.number,
  //           gender: newPassengerData.gender,
  //         },
  //         reservationId: request.id,
  //       },
  //     });
  //     await createPassengerList(request.id);

  //     if (reserverAddHotelPassenger.data) {
  //       setIsAddingNewPassenger(false);
  //       setNewPassengerData({
  //         name: "",
  //         gender: "",
  //         number: "",
  //         type: "Пассажир",
  //         order: "",
  //       });

  //       setCurrentHotelIndex(null);
  //     }
  //   } catch (e) {
  //     console.error(e);
  //   }
  // };

  // Функция для добавления пассажира из модального окна

  // console.log(newPassengerData);

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
      // console.log(reserveReport);
      // console.log(reserverAddHotelPassenger.data.addPassengerToReserve.id);
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
        // console.log(updateHotelResponse);
        // console.log(bookingInput);

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

  // const startAddingNewPassenger = (hotelIndex, hotelID) => {
  //   setIsAddingNewPassenger(true);
  //   setIsAddingNewPerson(false);
  //   setCurrentHotelIndex(hotelIndex);
  //   setCurrentHotelID(hotelID);

  //   setTimeout(() => {
  //     newGuestRef.current?.scrollIntoView({
  //       behavior: "smooth",
  //       block: "end", // было center
  //     });
  //   }, 100);
  // };

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
      // ...hotel.person.map((person) => ({
      //   ...person,
      //   type: "Сотрудник",
      // })),
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

  // Получаем имена сотрудников, которые уже добавлены в текущем отеле
  // const addedStaffNames = placement.flatMap((item) =>
  //   item.hotel.person.map((person) => person.name)
  // );

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
  // const [messageCount, setMessageCount] = useState([]);
  const messageCount = request?.chat;
  // useEffect(() => {
  //   setMessageCount(request.chat)
  // }, [request.chat])

  // console.log(messageCount);

  return (
    // Сделать отдельную компоненту для чата
    <div style={{ display: "flex", gap: "20px", height: "100%" }}>
      <InfoTable>
        <div className={classes.InfoTable_title}>
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
          {/* <div className={`${classes.InfoTable_title_elem} ${classes.w10}`}>
            Тип
          </div> */}
          <div className={`${classes.InfoTable_title_elem} ${classes.w20}`}>
            Комната
          </div>
          {/* <div className={`${classes.InfoTable_title_elem} ${classes.w15}`}>
            Статус
          </div> */}
          <div className={`${classes.InfoTable_title_elem} ${classes.w10}`}>
            Действия
          </div>
        </div>

        <div
          className={classes.bottom}
          style={{
            height: user.role == roles.hotelAdmin && "calc(100vh - 280px)",
          }}
        >
          {filteredPlacement.map((item, hotelIndex) => {
            const currentHotelMessageCount = messageCount?.find(
              (count) => count.hotelId === item.hotel.id
            );
            // console.log(currentHotelMessageCount);

            return (
              <React.Fragment key={hotelIndex}>
                <div
                  className={`${classes.InfoTable_data} ${classes.stickyHeader}`}
                >
                  <div
                    className={`${classes.InfoTable_data_elem} ${classes.w100}`}
                  >
                    <div className={classes.blockInfoShow}>
                      <b>{item.hotel.name}</b>
                      {getAllGuests(item.hotel).length} гостей из{" "}
                      {item.hotel.passengersCount}
                      {/* {console.log(item)} */}
                    </div>

                    <div className={classes.blockInfoShow}>
                      {user?.airlineId ? null : (
                        <Link
                          to={`/hotels/${item.hotel.id}/${item.hotel.requestId}`}
                          onClick={() => localStorage.setItem("selectedTab", 0)}
                          className={`${classes.chatButton} ${classes.active}`}
                        >
                          {"Шахматка"}
                          <img src="/table.png" alt="" />
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
                          {/* {orgName === item.hotel.name
                            ? "Этот чат открыт"
                            : "Открыть чат"} */}
                          Чат
                          <img
                            src="/chatReserve.png"
                            style={{
                              width: "fit-content",
                              height: "fit-content",
                            }}
                            alt=""
                          />
                          {currentHotelMessageCount &&
                            currentHotelMessageCount.unreadMessagesCount >
                              0 && (
                              <div className={classes.messageCount}>
                                {currentHotelMessageCount.unreadMessagesCount}
                              </div>
                            )}
                        </button>
                      ) : null}
                      {/* {console.log(request)} */}
                      {/* {request.reserveForPerson == false && */}
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
                      {/* } */}
                      {/* {request.reserveForPerson == true &&
                        getAllGuests(item.hotel).length <
                          item.hotel.passengersCount && (
                          <Button
                            onClick={() =>
                              startAddingNewPerson(hotelIndex, item.hotel.id)
                            }
                          >
                            <img src="/plus.png" alt="" /> Сотрудник
                          </Button>
                        )} */}
                    </div>
                  </div>
                </div>
                {getAllGuests(item.hotel)
                  .sort((a, b) => a.order - b.order)
                  .map((guest, index) => (
                    <div className={classes.InfoTable_data} key={guest.id}>
                      <div
                        className={`${classes.InfoTable_data_elem} ${classes.w5}`}
                      >
                        {index + 1}
                      </div>
                      <div
                        className={`${classes.InfoTable_data_elem} ${classes.w30}`}
                      >
                        {editingId === guest.id ? (
                          guest.type === "Сотрудник" ? (
                            <select
                              value={editedData.name || ""}
                              onChange={(e) =>
                                handleChangePerson(
                                  hotelIndex,
                                  guest.id,
                                  e.target.value
                                )
                              }
                            >
                              <option value="">Выберите сотрудника</option>
                              {selectedAirline.map((staff) => (
                                <option
                                  key={staff.id}
                                  value={staff.name}
                                  disabled={addedStaffNames.includes(
                                    staff.name
                                  )}
                                >
                                  {staff.name}{" "}
                                  {addedStaffNames.includes(staff.name)
                                    ? "(уже добавлен)"
                                    : ""}
                                </option>
                              ))}
                            </select>
                          ) : (
                            <input
                              type="text"
                              value={editedData.name || ""}
                              onChange={(e) =>
                                handleChange("name", e.target.value)
                              }
                            />
                          )
                        ) : (
                          guest.name
                        )}
                      </div>
                      <div
                        className={`${classes.InfoTable_data_elem} ${classes.w25}`}
                      >
                        {editingId === guest.id ? (
                          <input
                            type="text"
                            value={editedData.number || ""}
                            onChange={(e) =>
                              handleChange("number", e.target.value)
                            }
                            disabled
                          />
                        ) : (
                          guest.number || "-"
                        )}
                      </div>
                      <div
                        className={`${classes.InfoTable_data_elem} ${classes.w15}`}
                      >
                        {editingId === guest.id ? (
                          <select
                            value={editedData.gender || ""}
                            onChange={(e) =>
                              handleChange("gender", e.target.value)
                            }
                            disabled
                          >
                            <option value="">Выберите пол</option>
                            <option value="Мужской">Мужской</option>
                            <option value="Женский">Женский</option>
                          </select>
                        ) : (
                          guest.gender || "-"
                        )}
                      </div>

                      {/* <div
                        className={`${classes.InfoTable_data_elem} ${classes.w10}`}
                      >
                        {guest.type}
                      </div> */}
                      <div
                        className={`${classes.InfoTable_data_elem} ${classes.w20}`}
                      >
                        {guest.room?.name}
                      </div>
                      {/* <div
                        className={`${classes.InfoTable_data_elem} ${classes.w15}`}
                      >
                        {statusLabels[guest.status]}
                      </div> */}
                      <div
                        className={`${classes.InfoTable_data_elem} ${classes.w10}`}
                      >
                        {editingId === guest.id ? (
                          <Button onClick={() => handleSave(hotelIndex)}>
                            Сохранить
                          </Button>
                        ) : (
                          <>
                            {/* {request.reserveForPerson == false && <img src="/editPassenger.png" alt="" onClick={() => handleEdit(guest.id, guest)} />} */}
                            <img
                              src="/deletePassenger.png"
                              alt=""
                              onClick={() => openDeletecomponent(guest, item)}
                            />
                          </>
                        )}
                      </div>
                    </div>
                  ))}

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
                      {/* <input
                        type="text"
                        placeholder="Номер телефона"
                        value={newPassengerData.number}
                        onChange={(e) =>
                          setNewPassengerData({
                            ...newPassengerData,
                            number: e.target.value,
                          })
                        }
                      /> */}
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
                      {/* <select
                        value={newPassengerData.gender}
                        onChange={(e) =>
                          setNewPassengerData({
                            ...newPassengerData,
                            gender: e.target.value,
                          })
                        }
                      >
                        <option value="">Выберите пол</option>
                        <option value="Мужской">Мужской</option>
                        <option value="Женский">Женский</option>
                      </select> */}
                    </div>
                    <div
                      className={`${classes.InfoTable_data_elem} ${classes.w20}`}
                    >
                      <Button onClick={handleAddNewPassenger}>Добавить</Button>
                    </div>
                  </div>
                )}
                {/* {isAddingNewPerson && currentHotelIndex === hotelIndex && (
                  <div className={classes.InfoTable_data} ref={newGuestRef}>
                    <div
                      className={`${classes.InfoTable_data_elem} ${classes.w5}`}
                    ></div>
                    <div
                      className={`${classes.InfoTable_data_elem} ${classes.w35}`}
                    >
                      <select
                        value={newPersonData.name}
                        onChange={(e) => {
                          const selectedName = e.target.value;
                          const selectedStaff = selectedAirline.find(
                            (staff) => staff.name === selectedName
                          );

                          setNewPersonData({
                            ...newPersonData,
                            name: selectedName,
                            gender: selectedStaff?.gender || "",
                            number: selectedStaff?.number || "",
                            id: selectedStaff?.id || "",
                          });
                        }}
                      >
                        <option value="">Выберите сотрудника</option>
                        {selectedAirline.map((staff) => (
                          <option
                            key={staff.id}
                            value={staff.name}
                            disabled={addedStaffNames.includes(staff.name)}
                          >
                            {staff.name}{" "}
                            {addedStaffNames.includes(staff.name)
                              ? "(уже добавлен)"
                              : ""}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div
                      className={`${classes.InfoTable_data_elem} ${classes.w20}`}
                    >
                      <select
                        value={newPersonData.gender}
                        onChange={(e) =>
                          setNewPersonData({
                            ...newPersonData,
                            gender: e.target.value,
                          })
                        }
                      >
                        <option value="">Выберите пол</option>
                        <option value="Мужской">Мужской</option>
                        <option value="Женский">Женский</option>
                      </select>
                    </div>
                    <div
                      className={`${classes.InfoTable_data_elem} ${classes.w20}`}
                    >
                      <input
                        type="text"
                        placeholder="Номер телефона"
                        value={newPersonData.number}
                        onChange={(e) =>
                          setNewPersonData({
                            ...newPersonData,
                            number: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div
                      className={`${classes.InfoTable_data_elem} ${classes.w20}`}
                    >
                      <Button onClick={handleAddNewPerson}>
                        Добавить сотрудника
                      </Button>
                    </div>
                  </div>
                )} */}
              </React.Fragment>
            );
          })}
        </div>

        {user.role !== roles.hotelAdmin && (
          <div className={classes.counting}>
            <div className={classes.hotelAbout_info__filters}>
              <button onClick={toggleLogsSidebar}>История</button>
              {/* <button className={classes.updateReserveDate}>Редактировать даты заезда и выезда</button> */}
              {/* {(user.role === roles.dispatcerAdmin || user.role === roles.superAdmin) ? ( */}
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
              {/* {!showButton && <div>Все гости успешно размещены</div>} */}
              {!showButton && <div>Все заселены</div>}
              {getTotalGuests() == request.passengerCount &&
                request.status == "done" && (
                  // <div>Все гости успешно размещены</div>
                  <div>Все заселены</div>
                )}
            </div>
          </div>
        )}
      </InfoTable>

      {/* {user.role != roles.hotelAdmin && ( */}
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
                {/* {console.log(orgName)} */}
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
      {/* Модальное окно для добавления пассажира */}
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

export default InfoTableDataReserve_passengers;

// import React, { useState, useRef, useEffect } from "react";
// import classes from "./InfoTableDataReserve_passengers.module.css";
// import InfoTable from "../InfoTable/InfoTable";
// import Button from "../../Standart/Button/Button";
// import {
//   ADD_PASSENGER_TO_HOTEL,
//   ADD_PERSON_TO_HOTEL,
//   GET_AIRLINES_RELAY,
//   GET_RESERVE_LOGS,
//   GET_RESERVE_REQUEST_HOTELS_SUBSCRIPTION,
//   getCookie,
//   UPDATE_RESERVE,
// } from "../../../../graphQL_requests";
// import { useMutation, useQuery, useSubscription } from "@apollo/client";
// import Message from "../Message/Message";
// import { Link, useNavigate } from "react-router-dom";
// import { roles } from "../../../roles";
// import Logs from "../LogsHistory/Logs";
// import EditReserveDate from "../../PlacementDND/EditReserveDate/EditReserveDate";
// import { InputMask } from "@react-input/mask";
// import MUIAutocomplete from "../MUIAutocomplete/MUIAutocomplete";

// function InfoTableDataReserve_passengers({
//   placement,
//   allHotelPlacement,
//   setPlacement,
//   toggleUpdateSidebar,
//   setIdPassangerForUpdate,
//   openDeletecomponent,
//   toggleChooseHotel,
//   user,
//   request,
//   airline,
//   manifest,
//   addNotification,
//   setFile,
//   refetch,
//   refetchHotel,
//   createPassengerList
// }) {
//   const token = getCookie("token");

//   const [editingId, setEditingId] = useState(null);
//   const [editedData, setEditedData] = useState({});
//   const [isAddingNewPassenger, setIsAddingNewPassenger] = useState(false);
//   const [isAddingNewPerson, setIsAddingNewPerson] = useState(false);
//   const [currentHotelID, setCurrentHotelID] = useState(null);
//   const [newPassengerData, setNewPassengerData] = useState({
//     name: "",
//     gender: "",
//     number: "",
//     type: "Пассажир",
//     order: "",
//   });
//   // const [newPersonData, setNewPersonData] = useState({
//   //   name: "",
//   //   gender: "",
//   //   number: "",
//   //   type: "Сотрудник",
//   //   order: "",
//   //   id: "",
//   // });
//   const [currentHotelIndex, setCurrentHotelIndex] = useState(null);

//   const [showLogsSidebar, setShowLogsSidebar] = useState(false);

//   const toggleLogsSidebar = () => setShowLogsSidebar(!showLogsSidebar);

//   const [isEditDateModalOpen, setIsEditDateModalOpen] = useState(false);

//   const handleOpenEditDateModal = () => {
//     setIsEditDateModalOpen(true);
//   };

//   const handleCloseEditDateModal = () => {
//     setIsEditDateModalOpen(false);
//   };

//   const newGuestRef = useRef(null);

//   const handleUpdate = (id) => {
//     toggleUpdateSidebar();
//     setIdPassangerForUpdate(id);
//   };

//   const handleEdit = (id, guest) => {
//     setEditingId(id);
//     setEditedData(guest);
//   };

//   const handleChange = (field, value) => {
//     setEditedData((prev) => ({
//       ...prev,
//       [field]: value,
//     }));
//   };

//   const handleSave = (hotelIndex) => {
//     setPlacement((prevPlacement) => {
//       const updatedPlacement = prevPlacement.map((item, index) =>
//         index === hotelIndex
//           ? {
//               ...item,
//               hotel: {
//                 ...item.hotel,
//                 passengers: item.hotel.passengers.map((name) =>
//                   name.id === editingId ? { ...name, ...editedData } : name
//                 ),
//               },
//             }
//           : item
//       );

//       const hotel = updatedPlacement[hotelIndex];

//       if (editedData.type === "Пассажир") {
//         hotel.hotel.passengers = hotel.hotel.passengers.map((name) =>
//           name.id === editingId ? { ...name, ...editedData } : name
//         );
//       } else {
//         hotel.hotel.person = hotel.hotel.person.map((person) =>
//           person.id === editingId ? { ...person, ...editedData } : person
//         );
//       }

//       return updatedPlacement;
//     });

//     setEditingId(null);
//     setEditedData({});
//   };

//   const [createRequestPassenger] = useMutation(ADD_PASSENGER_TO_HOTEL, {
//     context: {
//       headers: {
//         Authorization: `Bearer ${token}`,
//         // 'Apollo-Require-Preflight': 'true',
//       },
//     },
//   });

//   const [updateReserve] = useMutation(UPDATE_RESERVE, {
//     context: {
//       headers: {
//         Authorization: `Bearer ${token}`,
//         "Apollo-Require-Preflight": "true",
//       },
//     },
//   });

//   const navigate = useNavigate();

//   const [showButton, setShowButton] = useState(true);

//   const handleUpdateReserve = async () => {
//     try {
//       let reserverUpdateReserve = await updateReserve({
//         variables: {
//           updateReserveId: request.id,
//           input: {
//             status: "done",
//           },
//         },
//       });

//       setShowButton(false);
//     } catch (e) {
//       console.error(e);
//     }

//     navigate("/reserve");
//   };

//   const handleSaveEditedDates = async (updatedRequest) => {
//     try {
//       // Отправляем данные на сервер
//       await updateReserve({
//         variables: {
//           updateReserveId: request.id,
//           input: {
//             arrival: updatedRequest.arrival,
//             departure: updatedRequest.departure,
//           },
//         },
//       });

//       // Обновляем локальное состояние
//       setPlacement((prevPlacement) =>
//         prevPlacement.map((item) =>
//           item.hotel.id === updatedRequest.hotelId
//             ? {
//                 ...item,
//                 hotel: {
//                   ...item.hotel,
//                   arrival: updatedRequest.arrival,
//                   departure: updatedRequest.departure,
//                 },
//               }
//             : item
//         )
//       );

//       // Закрываем модалку после успешного сохранения
//       setIsEditDateModalOpen(false);
//       addNotification(
//         user?.airlineId
//           ? "Запрос на изменение даты отправлен в чат успешно."
//           : "Редактирование даты прошло успешно.",
//         "success"
//       );
//       // refetch();
//     } catch (error) {
//       console.error("Ошибка при обновлении бронирования:", error);
//     }
//   };

//   // console.log(request);

//   useEffect(() => {
//     const uploadManifest = async () => {
//       if (manifest) {
//         try {
//           await updateReserve({
//             variables: {
//               updateReserveId: request.id,
//               input: {
//                 status: request?.status,
//               },
//               files: manifest,
//             },
//           });
//           refetch();
//           refetchHotel();
//           addNotification("Манифест добавлен успешно.", "success");
//           setFile(null);
//         } catch (error) {
//           console.error("Ошибка при загрузке манифеста:", error);
//           alert("Ошибка при загрузке манифеста");
//         } finally {
//           setFile(null);
//         }
//       }
//     };

//     uploadManifest();
//   }, [manifest]);

//   // console.log(manifest)

//   const handleAddNewPassenger = async () => {
//     if (
//       !newPassengerData.name ||
//       !newPassengerData.number ||
//       !newPassengerData.gender
//     ) {
//       alert("Введите все данные пассажира.");
//       return;
//     }
//     try {
//       // if (currentHotelIndex === null) return;

//       let reserverAddHotelPassenger = await createRequestPassenger({
//         variables: {
//           hotelId: currentHotelID,
//           input: {
//             name: newPassengerData.name,
//             number: newPassengerData.number,
//             gender: newPassengerData.gender,
//           },
//           reservationId: request.id,
//         },
//       });
//       await createPassengerList(request.id);

//       if (reserverAddHotelPassenger.data) {
//         setIsAddingNewPassenger(false);
//         setNewPassengerData({
//           name: "",
//           gender: "",
//           number: "",
//           type: "Пассажир",
//           order: "",
//         });

//         setCurrentHotelIndex(null);
//       }
//     } catch (e) {
//       console.error(e);
//     }
//   };

//   const [createRequest] = useMutation(ADD_PERSON_TO_HOTEL, {
//     context: {
//       headers: {
//         Authorization: `Bearer ${token}`,
//       },
//     },
//   });

//   const handleAddNewPerson = async () => {
//     try {
//       if (currentHotelIndex === null) return;

//       let reserverAddHotel = await createRequest({
//         variables: {
//           input: {
//             hotelId: currentHotelID,
//             personId: newPersonData.id,
//             reservationId: request.id,
//           },
//         },
//       });

//       if (reserverAddHotel.data) {
//         setIsAddingNewPerson(false);
//         setNewPersonData({
//           name: "",
//           gender: "",
//           number: "",
//           type: "Сотрудник",
//           order: "",
//           id: "",
//         });
//         setCurrentHotelIndex(null);
//       }
//     } catch (e) {
//       console.error(e);
//     }
//   };

//   const startAddingNewPassenger = (hotelIndex, hotelID) => {
//     setIsAddingNewPassenger(true);
//     setIsAddingNewPerson(false);
//     setCurrentHotelIndex(hotelIndex);
//     setCurrentHotelID(hotelID);

//     setTimeout(() => {
//       newGuestRef.current?.scrollIntoView({
//         behavior: "smooth",
//         block: "end", // было center
//       });
//     }, 100);
//   };

//   const startAddingNewPerson = (hotelIndex, hotelID) => {
//     setIsAddingNewPerson(true);
//     setIsAddingNewPassenger(false);
//     setCurrentHotelIndex(hotelIndex);
//     setCurrentHotelID(hotelID);

//     setTimeout(() => {
//       newGuestRef.current?.scrollIntoView({
//         behavior: "smooth",
//         block: "center",
//       });
//     }, 100);
//   };

//   const getAllGuests = (hotel) => {
//     return [
//       ...hotel.passengers.map((name) => ({
//         ...name,
//         type: "Пассажир",
//       })),
//       // ...hotel.person.map((person) => ({
//       //   ...person,
//       //   type: "Сотрудник",
//       // })),
//     ];
//   };

//   const getTotalGuests = () => {
//     return placement.reduce((total, item) => {
//       return total + getAllGuests(item.hotel).length;
//     }, 0);
//   };

//   const [selectedAirline, setSelectedAirline] = useState(null);
//   const { loading, error, data } = useQuery(GET_AIRLINES_RELAY);

//   useEffect(() => {
//     if (data && airline) {
//       const selectedAirlineData = data.airlines.airlines.find(
//         (item) => item.id === airline.id
//       );
//       if (selectedAirlineData) {
//         setSelectedAirline(selectedAirlineData.staff);
//       }
//     }
//   }, [data, airline]);

//   // Получаем имена сотрудников, которые уже добавлены в текущем отеле
//   // const addedStaffNames = placement.flatMap((item) =>
//   //   item.hotel.person.map((person) => person.name)
//   // );

//   const handleChangePerson = (field, value, selectedName) => {
//     const selectedStaff = selectedAirline.find(
//       (staff) => staff.name === selectedName
//     );

//     setEditedData((prev) => ({
//       ...prev,
//       name: selectedStaff.name,
//       gender: selectedStaff.gender,
//       number: selectedStaff.number,
//     }));
//   };

//   // Получаем список отелей для отображения
//   const filteredPlacement = user.hotelId
//     ? placement.filter((item) => item.hotel.id === user.hotelId)
//     : placement;

//   const hotelPlacement = allHotelPlacement.filter(
//     (item) => item.hotel.id === user.hotelId
//   );

//   const statusLabels = {
//     created: "Создан",
//     opened: "В обработке",
//     extended: "Продлен",
//     reduced: "Сокращен",
//     transferred: "Перенесен",
//     earlyStart: "Ранний заезд",
//     canceled: "Отменен",
//     archiving: "Готов к архиву",
//     archived: "Архив",
//     done: "Размещен",
//     waiting: "Ожидает",
//   };

//   const [separator, setSeparator] = useState("airline");
//   const [isHaveTwoChats, setIsHaveTwoChats] = useState();

//   const [hotelChats, setHotelChats] = useState();
//   const [selectedHotelChatId, setSelectedHotelChatId] = useState(null);

//   const handleSelectHotelChat = (hotelId) => {
//     setSelectedHotelChatId(hotelId);
//     setSeparator("hotel"); // Автоматически переключаемся на вкладку "Гостиница"
//   };

//   const [orgName, setOrgName] = useState("");
//   // const [messageCount, setMessageCount] = useState([]);
//   const messageCount = request?.chat;
//   // useEffect(() => {
//   //   setMessageCount(request.chat)
//   // }, [request.chat])

//   // console.log(messageCount);

//   return (
//     // Сделать отдельную компоненту для чата
//     <div style={{ display: "flex", gap: "20px", height: "100%" }}>
//       <InfoTable>
//         <div className={classes.InfoTable_title}>
//           <div className={`${classes.InfoTable_title_elem} ${classes.w5}`}>
//             №
//           </div>
//           <div className={`${classes.InfoTable_title_elem} ${classes.w30}`}>
//             ФИО
//           </div>
//           <div className={`${classes.InfoTable_title_elem} ${classes.w15}`}>
//             Номер телефона
//           </div>
//           <div className={`${classes.InfoTable_title_elem} ${classes.w15}`}>
//             Пол
//           </div>
//           {/* <div className={`${classes.InfoTable_title_elem} ${classes.w10}`}>
//             Тип
//           </div> */}
//           <div className={`${classes.InfoTable_title_elem} ${classes.w10}`}>
//             Комната
//           </div>
//           <div className={`${classes.InfoTable_title_elem} ${classes.w15}`}>
//             Статус
//           </div>
//           <div className={`${classes.InfoTable_title_elem} ${classes.w10}`}>
//             Действия
//           </div>
//         </div>

//         <div
//           className={classes.bottom}
//           style={{
//             height: user.role == roles.hotelAdmin && "calc(100vh - 280px)",
//           }}
//         >
//           {filteredPlacement.map((item, hotelIndex) => {
//             const currentHotelMessageCount = messageCount?.find(
//               (count) => count.hotelId === item.hotel.id
//             );
//             // console.log(currentHotelMessageCount);

//             return (
//               <React.Fragment key={hotelIndex}>
//                 <div
//                   className={`${classes.InfoTable_data} ${classes.stickyHeader}`}
//                 >
//                   <div
//                     className={`${classes.InfoTable_data_elem} ${classes.w100}`}
//                   >
//                     <div className={classes.blockInfoShow}>
//                       <b>{item.hotel.name}</b>
//                       {getAllGuests(item.hotel).length} гостей из{" "}
//                       {item.hotel.passengersCount}
//                       {/* {console.log(item)} */}
//                     </div>

//                     <div className={classes.blockInfoShow}>
//                       {user?.airlineId ? null : (
//                         <Link
//                           to={`/hotels/${item.hotel.id}/${item.hotel.requestId}`}
//                           onClick={() => localStorage.setItem("selectedTab", 0)}
//                           className={`${classes.chatButton} ${classes.active}`}
//                         >
//                           {"Шахматка"}
//                           <img src="/placement_icon.png" alt="" />
//                         </Link>
//                       )}
//                       {user.role !== roles.hotelAdmin &&
//                       user.role !== roles.airlineAdmin ? (
//                         <button
//                           className={`${classes.chatButton} ${
//                             orgName === item.hotel.name ? classes.active : ""
//                           }`}
//                           onClick={() => handleSelectHotelChat(item.hotel.id)}
//                         >
//                           {/* {orgName === item.hotel.name
//                             ? "Этот чат открыт"
//                             : "Открыть чат"} */}
//                           Чат
//                           <img
//                             src="/chatReserve.png"
//                             style={{
//                               width: "fit-content",
//                               height: "fit-content",
//                             }}
//                             alt=""
//                           />
//                           {currentHotelMessageCount &&
//                             currentHotelMessageCount.unreadMessagesCount > 0 && (
//                               <div className={classes.messageCount}>
//                                 {currentHotelMessageCount.unreadMessagesCount}
//                               </div>
//                             )}
//                         </button>
//                       ) : null}
//                       {/* {console.log(request)} */}
//                       {/* {request.reserveForPerson == false && */}
//                       {getAllGuests(item.hotel).length <
//                         item.hotel.passengersCount && (
//                         <Button
//                           onClick={() =>
//                             startAddingNewPassenger(hotelIndex, item.hotel.id)
//                           }
//                         >
//                           <img src="/plus.png" alt="" /> Пассажир
//                         </Button>
//                       )}
//                       {/* } */}
//                       {/* {request.reserveForPerson == true &&
//                         getAllGuests(item.hotel).length <
//                           item.hotel.passengersCount && (
//                           <Button
//                             onClick={() =>
//                               startAddingNewPerson(hotelIndex, item.hotel.id)
//                             }
//                           >
//                             <img src="/plus.png" alt="" /> Сотрудник
//                           </Button>
//                         )} */}
//                     </div>
//                   </div>
//                 </div>
//                 {getAllGuests(item.hotel)
//                   .sort((a, b) => a.order - b.order)
//                   .map((guest, index) => (
//                     <div className={classes.InfoTable_data} key={guest.id}>
//                       <div
//                         className={`${classes.InfoTable_data_elem} ${classes.w5}`}
//                       >
//                         {index + 1}
//                       </div>
//                       <div
//                         className={`${classes.InfoTable_data_elem} ${classes.w30}`}
//                       >
//                         {editingId === guest.id ? (
//                           guest.type === "Сотрудник" ? (
//                             <select
//                               value={editedData.name || ""}
//                               onChange={(e) =>
//                                 handleChangePerson(
//                                   hotelIndex,
//                                   guest.id,
//                                   e.target.value
//                                 )
//                               }
//                             >
//                               <option value="">Выберите сотрудника</option>
//                               {selectedAirline.map((staff) => (
//                                 <option
//                                   key={staff.id}
//                                   value={staff.name}
//                                   disabled={addedStaffNames.includes(
//                                     staff.name
//                                   )}
//                                 >
//                                   {staff.name}{" "}
//                                   {addedStaffNames.includes(staff.name)
//                                     ? "(уже добавлен)"
//                                     : ""}
//                                 </option>
//                               ))}
//                             </select>
//                           ) : (
//                             <input
//                               type="text"
//                               value={editedData.name || ""}
//                               onChange={(e) =>
//                                 handleChange("name", e.target.value)
//                               }
//                             />
//                           )
//                         ) : (
//                           guest.name
//                         )}
//                       </div>
//                       <div
//                         className={`${classes.InfoTable_data_elem} ${classes.w15}`}
//                       >
//                         {editingId === guest.id ? (
//                           <input
//                             type="text"
//                             value={editedData.number || ""}
//                             onChange={(e) =>
//                               handleChange("number", e.target.value)
//                             }
//                             disabled
//                           />
//                         ) : (
//                           guest.number || "-"
//                         )}
//                       </div>
//                       <div
//                         className={`${classes.InfoTable_data_elem} ${classes.w15}`}
//                       >
//                         {editingId === guest.id ? (
//                           <select
//                             value={editedData.gender || ""}
//                             onChange={(e) =>
//                               handleChange("gender", e.target.value)
//                             }
//                             disabled
//                           >
//                             <option value="">Выберите пол</option>
//                             <option value="Мужской">Мужской</option>
//                             <option value="Женский">Женский</option>
//                           </select>
//                         ) : (
//                           guest.gender || "-"
//                         )}
//                       </div>

//                       {/* <div
//                         className={`${classes.InfoTable_data_elem} ${classes.w10}`}
//                       >
//                         {guest.type}
//                       </div> */}
//                       <div
//                         className={`${classes.InfoTable_data_elem} ${classes.w10}`}
//                       >
//                         {guest.room?.name}
//                       </div>
//                       <div
//                         className={`${classes.InfoTable_data_elem} ${classes.w15}`}
//                       >
//                         {statusLabels[guest.status]}
//                       </div>
//                       <div
//                         className={`${classes.InfoTable_data_elem} ${classes.w10}`}
//                       >
//                         {editingId === guest.id ? (
//                           <Button onClick={() => handleSave(hotelIndex)}>
//                             Сохранить
//                           </Button>
//                         ) : (
//                           <>
//                             {/* {request.reserveForPerson == false && <img src="/editPassenger.png" alt="" onClick={() => handleEdit(guest.id, guest)} />} */}
//                             <img
//                               src="/deletePassenger.png"
//                               alt=""
//                               onClick={() => openDeletecomponent(guest, item)}
//                             />
//                           </>
//                         )}
//                       </div>
//                     </div>
//                   ))}

//                 {isAddingNewPassenger && currentHotelIndex === hotelIndex && (
//                   <div className={classes.InfoTable_data} ref={newGuestRef}>
//                     <div
//                       className={`${classes.InfoTable_data_elem} ${classes.w5}`}
//                     ></div>
//                     <div
//                       className={`${classes.InfoTable_data_elem} ${classes.w35}`}
//                     >
//                       <input
//                         type="text"
//                         placeholder="ФИО пассажира"
//                         value={newPassengerData.name}
//                         onChange={(e) =>
//                           setNewPassengerData({
//                             ...newPassengerData,
//                             name: e.target.value,
//                           })
//                         }
//                       />
//                     </div>
//                     <div
//                       className={`${classes.InfoTable_data_elem} ${classes.w20}`}
//                     >
//                       <InputMask
//                         type="text"
//                         mask="+7 (___) ___-__-__"
//                         replacement={{ _: /\d/ }}
//                         name="number"
//                         value={newPassengerData.number}
//                         onChange={(e) =>
//                           setNewPassengerData({
//                             ...newPassengerData,
//                             number: e.target.value,
//                           })
//                         }
//                         placeholder="Номер телефона"
//                         autoComplete="new-password"
//                       />
//                       {/* <input
//                         type="text"
//                         placeholder="Номер телефона"
//                         value={newPassengerData.number}
//                         onChange={(e) =>
//                           setNewPassengerData({
//                             ...newPassengerData,
//                             number: e.target.value,
//                           })
//                         }
//                       /> */}
//                     </div>
//                     <div
//                       className={`${classes.InfoTable_data_elem} ${classes.w20}`}
//                     >
//                       <MUIAutocomplete
//                         dropdownWidth={"100%"}
//                         label={"Выберите пол"}
//                         options={["Мужской", "Женский"]}
//                         value={newPassengerData.gender}
//                         onChange={(event, newValue) => {
//                           setNewPassengerData({
//                             ...newPassengerData,
//                             gender: newValue,
//                           });
//                         }}
//                       />
//                       {/* <select
//                         value={newPassengerData.gender}
//                         onChange={(e) =>
//                           setNewPassengerData({
//                             ...newPassengerData,
//                             gender: e.target.value,
//                           })
//                         }
//                       >
//                         <option value="">Выберите пол</option>
//                         <option value="Мужской">Мужской</option>
//                         <option value="Женский">Женский</option>
//                       </select> */}
//                     </div>
//                     <div
//                       className={`${classes.InfoTable_data_elem} ${classes.w20}`}
//                     >
//                       <Button onClick={handleAddNewPassenger}>Добавить</Button>
//                     </div>
//                   </div>
//                 )}
//                 {/* {isAddingNewPerson && currentHotelIndex === hotelIndex && (
//                   <div className={classes.InfoTable_data} ref={newGuestRef}>
//                     <div
//                       className={`${classes.InfoTable_data_elem} ${classes.w5}`}
//                     ></div>
//                     <div
//                       className={`${classes.InfoTable_data_elem} ${classes.w35}`}
//                     >
//                       <select
//                         value={newPersonData.name}
//                         onChange={(e) => {
//                           const selectedName = e.target.value;
//                           const selectedStaff = selectedAirline.find(
//                             (staff) => staff.name === selectedName
//                           );

//                           setNewPersonData({
//                             ...newPersonData,
//                             name: selectedName,
//                             gender: selectedStaff?.gender || "",
//                             number: selectedStaff?.number || "",
//                             id: selectedStaff?.id || "",
//                           });
//                         }}
//                       >
//                         <option value="">Выберите сотрудника</option>
//                         {selectedAirline.map((staff) => (
//                           <option
//                             key={staff.id}
//                             value={staff.name}
//                             disabled={addedStaffNames.includes(staff.name)}
//                           >
//                             {staff.name}{" "}
//                             {addedStaffNames.includes(staff.name)
//                               ? "(уже добавлен)"
//                               : ""}
//                           </option>
//                         ))}
//                       </select>
//                     </div>
//                     <div
//                       className={`${classes.InfoTable_data_elem} ${classes.w20}`}
//                     >
//                       <select
//                         value={newPersonData.gender}
//                         onChange={(e) =>
//                           setNewPersonData({
//                             ...newPersonData,
//                             gender: e.target.value,
//                           })
//                         }
//                       >
//                         <option value="">Выберите пол</option>
//                         <option value="Мужской">Мужской</option>
//                         <option value="Женский">Женский</option>
//                       </select>
//                     </div>
//                     <div
//                       className={`${classes.InfoTable_data_elem} ${classes.w20}`}
//                     >
//                       <input
//                         type="text"
//                         placeholder="Номер телефона"
//                         value={newPersonData.number}
//                         onChange={(e) =>
//                           setNewPersonData({
//                             ...newPersonData,
//                             number: e.target.value,
//                           })
//                         }
//                       />
//                     </div>
//                     <div
//                       className={`${classes.InfoTable_data_elem} ${classes.w20}`}
//                     >
//                       <Button onClick={handleAddNewPerson}>
//                         Добавить сотрудника
//                       </Button>
//                     </div>
//                   </div>
//                 )} */}
//               </React.Fragment>
//             );
//           })}
//         </div>

//         {user.role !== roles.hotelAdmin && (
//           <div className={classes.counting}>
//             <div className={classes.hotelAbout_info__filters}>
//               <button onClick={toggleLogsSidebar}>История</button>
//               {/* <button className={classes.updateReserveDate}>Редактировать даты заезда и выезда</button> */}
//               {/* {(user.role === roles.dispatcerAdmin || user.role === roles.superAdmin) ? ( */}
//               <Button onClick={handleOpenEditDateModal}>
//                 {!user?.airlineId
//                   ? "Редактировать даты"
//                   : "Запрос на изменение даты"}
//               </Button>
//               {/* ) : null } */}
//             </div>
//             <div className={classes.countingPeople}>
//               <img src="/peopleCount.png" alt="" />
//               {placement.length} отелей, {getTotalGuests()} из{" "}
//               {request.passengerCount} гостей
//               {getTotalGuests() == request.passengerCount &&
//                 request.status != "done" &&
//                 showButton && (
//                   <Button onClick={handleUpdateReserve}>
//                     Все гости размещены
//                   </Button>
//                 )}
//               {/* {!showButton && <div>Все гости успешно размещены</div>} */}
//               {!showButton && <div>Все заселены</div>}
//               {getTotalGuests() == request.passengerCount &&
//                 request.status == "done" && (
//                   // <div>Все гости успешно размещены</div>
//                   <div>Все заселены</div>
//                 )}
//             </div>
//           </div>
//         )}
//       </InfoTable>

//       {/* {user.role != roles.hotelAdmin && ( */}
//       {filteredPlacement.length === 0 && user?.hotelId ? null : (
//         <>
//           <div className={classes.chatWrapper}>
//             {user.role !== roles.superAdmin &&
//             user.role !== roles.dispatcerAdmin ? null : (
//               <div className={classes.separatorWrapper}>
//                 {isHaveTwoChats === false ? (
//                   <button
//                     onClick={() => setSeparator("airline")} // Установить separator как 'airline'
//                     className={separator === "airline" ? classes.active : null}
//                   >
//                     Авиакомпания
//                   </button>
//                 ) : (
//                   <>
//                     <button
//                       onClick={() => setSeparator("airline")} // Установить separator как 'airline'
//                       className={
//                         separator === "airline" ? classes.active : null
//                       }
//                     >
//                       Авиакомпания
//                     </button>
//                     <button
//                       onClick={() => setSeparator("hotel")} // Установить separator как 'hotel'
//                       className={separator === "hotel" ? classes.active : null}
//                     >
//                       Гостиница
//                     </button>
//                   </>
//                 )}
//               </div>
//             )}
//             {user.role !== roles.hotelAdmin &&
//             user.role !== roles.airlineAdmin ? (
//               <p className={classes.chatName}>
//                 {separator === "airline" ? "" : orgName}
//                 {/* {console.log(orgName)} */}
//               </p>
//             ) : null}

//             <Message
//               activeTab={"Комментарий"}
//               setIsHaveTwoChats={setIsHaveTwoChats}
//               setHotelChats={setHotelChats}
//               setTitle={setOrgName}
//               // setMessageCount={setMessageCount}
//               chooseRequestID={""}
//               chooseReserveID={request.id}
//               filteredPlacement={filteredPlacement}
//               token={token}
//               user={user}
//               chatPadding={"0"}
//               chatHeight={
//                 user.role !== roles.hotelAdmin &&
//                 user.role !== roles.airlineAdmin
//                   ? "calc(100vh - 360px)"
//                   : "calc(100vh - 280px)"
//               }
//               separator={separator}
//               hotelChatId={selectedHotelChatId}
//             />
//           </div>
//         </>
//       )}
//       {/* )} */}
//       <Logs
//         type={"reserve"}
//         queryLog={GET_RESERVE_LOGS}
//         queryID={"reserveId"}
//         id={request.id}
//         show={showLogsSidebar}
//         onClose={toggleLogsSidebar}
//         name={request.reserveNumber}
//       />
//       <EditReserveDate
//         isOpen={isEditDateModalOpen}
//         onClose={handleCloseEditDateModal}
//         onSave={handleSaveEditedDates}
//         request={request}
//       />
//     </div>
//   );
// }

// export default InfoTableDataReserve_passengers;
