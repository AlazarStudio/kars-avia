import React, { useState, useRef, useEffect, useCallback, useMemo } from "react";
import classes from "./ExistRequest.module.css";
import Button from "../../Standart/Button/Button";
import Sidebar from "../Sidebar/Sidebar";
import { useMutation, useQuery, useSubscription } from "@apollo/client";
import {
  CANCEL_REQUEST,
  CHANGE_TO_ARCHIVE,
  convertToDate,
  EXTEND_REQUEST_NOTIFICATION_SUBSCRIPTION,
  GET_AIRLINE,
  GET_AIRLINE_POSITIONS,
  GET_AIRPORTS_RELAY,
  GET_REQUEST,
  GET_HOTELS_RELAY,
  GET_HOTEL_ROOMS,
  getCookie,
  REQUEST_UPDATED_SUBSCRIPTION,
  SAVE_HANDLE_EXTEND_MUTATION,
  SAVE_MEALS_MUTATION,
  UPDATE_REQUEST_RELAY,
  getMediaUrl,
} from "../../../../graphQL_requests";
import Message from "../Message/Message";
import {
  hasAccessMenu,
  isAirlineAdmin,
  isDispatcherAdmin,
  isSuperAdmin,
} from "../../../utils/access";
import { Link } from "react-router-dom";
import ReactPaginate from "react-paginate";
import CreateRequestAirlineStaff from "../CreateRequestAirlineStaff/CreateRequestAirlineStaff";
import MUILoader from "../MUILoader/MUILoader";
import MUIAutocomplete from "../MUIAutocomplete/MUIAutocomplete";
import MUIAutocompleteColor from "../MUIAutocompleteColor/MUIAutocompleteColor";
import DeleteComponent from "../DeleteComponent/DeleteComponent";
import CloseIcon from "../../../shared/icons/CloseIcon";
import ExistRequestAdditionalMenu from "./ExistRequestAdditionalMenu";
import ExistRequestEditForm from "./ExistRequestEditForm";
import { roles, roleLabels } from "../../../roles";

function ExistRequest({
  show,
  onClose,
  setShowChooseHotel,
  chooseRequestID,
  // handleCancelRequest,
  accessMenu,
  dispatcherCanChat,
  dispatcherCanUpdate,
  user,
  setChooseRequestID,
  totalMeals,
  setChooseCityRequest,
  // openDeleteComponent,
  setRequestId,
}) {
  const token = getCookie("token");
  const [totalPages, setTotalPages] = useState(1);
  const currentPageRelay = 0;

  // Состояние для хранения информации о странице (для пагинации)
  const [pageInfo, setPageInfo] = useState({
    skip: currentPageRelay,
    take: 50,
  });

  // Запросы данных о заявке и логе
  const { data, error, refetch } = useQuery(GET_REQUEST, {
    context: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
    variables: {
      requestId: chooseRequestID,
      pagination: {
        skip: pageInfo.skip,
        take: pageInfo.take,
      },
    },
    skip: !chooseRequestID,
  });

  // console.log(data);

  useEffect(() => {
    if (chooseRequestID && setRequestId) {
      setRequestId(chooseRequestID);
    }
  }, [chooseRequestID]); // Срабатывает только при изменении chooseRequestID

  // const { data: subscriptionData } = useSubscription(
  //   EXTEND_REQUEST_NOTIFICATION_SUBSCRIPTION,
  //   {
  //     onData: () => {
  //       refetch();
  //     },
  //   }
  // );

  // Функция для разделения даты и времени
  const parseDateTime = (dateTime) => {
    if (!dateTime) return { date: "", time: "" };
    const dateObj = new Date(dateTime);
    return {
      date: dateObj.toISOString().split("T")[0], // YYYY-MM-DD
      time: dateObj.toISOString().split("T")[1].slice(0, 5), // HH:MM
    };
  };
  const [activeTab, setActiveTab] = useState("Общая");
  const [formData, setFormData] = useState(null);
  const [logsData, setLogsData] = useState(null);
  const [formDataExtend, setFormDataExtend] = useState({
    departureName: "",
    departureDate: "",
    departureTime: "",
    arrivalDate: "",
    arrivalTime: "",
  });
  const [isEditing, setIsEditing] = useState(false);

  // Состояние для изменения гостиницы и номера
  const [hotels, setHotels] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [selectedHotelId, setSelectedHotelId] = useState(null);
  const [selectedRoomId, setSelectedRoomId] = useState(null);
  const [selectedPlace, setSelectedPlace] = useState(null);

  const canChatTab =
    dispatcherCanChat ??
    (!user?.airlineId || hasAccessMenu(accessMenu, "requestChat"));
  const canUpdateActions =
    dispatcherCanUpdate ??
    (!user?.airlineId || hasAccessMenu(accessMenu, "requestUpdate"));

  const [showDelete, setShowDelete] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);

  const openDeleteComponent = () => {
    setShowDelete(true);
  };

  const closeDeleteComponent = () => {
    setShowDelete(false);
    closeButton();
  };

  const sidebarRef = useRef();
  const menuRef = useRef();

  const { data: subscriptionUpdateData } = useSubscription(
    REQUEST_UPDATED_SUBSCRIPTION,
    {
      onData: () => {
        refetch();
      },
    }
  );

  // Обновление состояния при изменении данных запроса
  useEffect(() => {
    if (data && data.request) {
      setFormData(data?.request);
      setLogsData(data?.request);
      setTotalPages(data?.request?.logs?.totalPages);
    }
  }, [data, show]);

  // console.log(data);

  // Обработчик смены страницы в ReactPaginate
  const handlePageClick = (event) => {
    const newPageIndex = event.selected; // нумерация с 0
    // Вычисляем skip (например, newPageIndex * take)
    setPageInfo((prev) => ({
      ...prev,
      skip: newPageIndex * prev.take,
    }));
  };

  // Группировка истории по датам (как в уведомлениях)
  const dayKey = (s) => {
    const d = new Date(s);
    d.setHours(0, 0, 0, 0);
    return d.getTime();
  };
  const fmtDay = (ts) =>
    new Date(ts).toLocaleDateString("ru-RU", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  const groupedHistory = useMemo(() => {
    const list = logsData?.logs?.logs ?? [];
    const sorted = [...list].sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
    );
    const m = new Map();
    for (const log of sorted) {
      const k = dayKey(log.createdAt);
      if (!m.has(k)) m.set(k, []);
      m.get(k).push(log);
    }
    return Array.from(m.entries()).sort((a, b) => b[0] - a[0]);
  }, [logsData?.logs?.logs]);

  useEffect(() => {
    if (formData) {
      setFormDataExtend({
        departureDate: formData.departure
          ? parseDateTime(formData.departure).date
          : "",
        departureTime: formData.departure
          ? parseDateTime(formData.departure).time
          : "",
        arrivalDate: formData.arrival
          ? parseDateTime(formData.arrival).date
          : "",
        arrivalTime: formData.arrival
          ? parseDateTime(formData.arrival).time
          : "",
      });
    }
  }, [formData, show]); // Следим за изменением formData

  // Функция закрытия формы
  const closeButton = useCallback(() => {
    setAnchorEl(null);
    resetForm();
    onClose();
    setChooseRequestID("");
    setMealData([]);
    setFormDataExtend((prev) => ({
      ...prev,
      departureDate: "",
      departureTime: "",
      arrivalDate: "",
      arrivalTime: "",
    }));
    setSelectedEmployee(null);
    setNewStaffId(null);
    setIsEditing(false);
    // Сброс состояния гостиницы, номера и аэропорта
    setSelectedHotelId(null);
    setSelectedRoomId(null);
    setSelectedPlace(null);
    setSelectedAirportId(null);
    setSelectedReserve(null);
  }, [onClose, setChooseRequestID]);

  const resetForm = useCallback(() => setActiveTab("Общая"), []);

  // Обработчик для изменения вкладок
  const handleTabChange = useCallback((tab) => setActiveTab(tab), []);

  // Обработчик изменений в форме

  // const handleChange = useCallback(
  //   (e) => {
  //     const { name, value, type, checked } = e.target;
  //     setFormData((prevState) => ({
  //       ...prevState,
  //       meals:
  //         name === "included"
  //           ? { ...prevState.meals, included: value }
  //           : prevState.meals,
  //       [name]: type === "checkbox" ? checked : value,
  //     }));

  //     if (formData?.meals.included === "Не включено") {
  //       setFormData((prevState) => ({
  //         ...prevState,
  //         meals: { breakfast: false, lunch: false, dinner: false },
  //       }));
  //     }
  //   },
  //   [formData]
  // );

  // Обработчик для продления бронирования

  const handleExtendChange = useCallback((e) => {
    const { name, value } = e.target;
    setFormDataExtend((prevState) => ({ ...prevState, [name]: value }));
  }, []);

  const [updateRequestRelay] = useMutation(UPDATE_REQUEST_RELAY, {
    context: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  });

  const [cancelRequestMutation] = useMutation(CANCEL_REQUEST, {
    context: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  });

  const handleCancelRequest = async () => {
    try {
      // Отправка запроса с правильным ID заявки
      const response = await cancelRequestMutation({
        variables: {
          cancelRequestId: chooseRequestID,
        },
      });
      // console.log("Заявка успешно отменена", response);
    } catch (error) {
      console.error("Ошибка при отмене заявки:", JSON.stringify(error));
    }
  };
  // console.log(formData);

  // const [handleExtend] = useMutation(SAVE_HANDLE_EXTEND_MUTATION, {
  //   context: {
  //     headers: {
  //       Authorization: `Bearer ${token}`,
  //     },
  //   },
  // });

  const formatDateTime = (date, time) => {
    if (!date || !time) {
      // console.error("Некорректные данные для даты или времени:", {
      //   date,
      //   time,
      // });
      return null;
    }
    return new Date(`${date}T${time}:00+00:00`);
  };

  const departureTime = formatDateTime(
    formDataExtend?.departureDate,
    formDataExtend?.departureTime
  );
  const arrivalTime = formatDateTime(
    formDataExtend?.arrivalDate,
    formDataExtend?.arrivalTime
  );

  // console.log("departureTime:", departureTime);
  // console.log("arrivalTime:", arrivalTime);
  // console.log("formData.arrival:", formData?.arrival);
  // console.log("formData.departure:", formData?.departure);

  const newStatus =
    formData?.departure && new Date(formData.departure) < departureTime
      ? "extended"
      : formData?.departure && new Date(formData.departure) > departureTime
        ? "reduced"
        : formData?.arrival && new Date(formData.arrival) > arrivalTime
          ? "earlyStart"
          : formData?.arrival && new Date(formData.arrival) < arrivalTime
            ? "reduced"
            : formData?.status;

  // console.log("newStatus:", newStatus);
  const [isLoading, setIsLoading] = useState(false);

  const handleExtendChangeRequest = async () => {
    const canSave =
      isEditing ||
      formData.status === "created" ||
      formData.status === "opened";
    if (canSave) {
      setIsLoading(true);
      try {
        // Определяем, что изменилось
        const hotelIdChanged = canChangeHotel && selectedHotelId && selectedHotelId !== formData.hotelId;
        const roomOrPlaceChanged = canChangeHotel &&
          selectedRoomId &&
          (selectedRoomId !== formData.hotelChess?.room?.id ||
            selectedPlace !== formData.hotelChess?.place);
        const hotelRoomChangeAllowed = canChangeHotel && selectedHotelId && selectedRoomId && !user?.airlineId;
        const reserveChanged = selectedReserve !== undefined && selectedReserve !== null && selectedReserve !== formData.reserve;
        const mealPlanChanged =
          mealPlanIncluded !== formData?.mealPlan?.included ||
          mealPlanBreakfastEnabled !== (formData?.mealPlan?.breakfastEnabled ?? true) ||
          mealPlanLunchEnabled !== (formData?.mealPlan?.lunchEnabled ?? true) ||
          mealPlanDinnerEnabled !== (formData?.mealPlan?.dinnerEnabled ?? true);
        const effectivePersonId = selectedEmployee?.id ?? formData?.person?.id;
        const personIdChanged =
          !user?.hotelId &&
          effectivePersonId &&
          effectivePersonId !== formData?.person?.id;

        // Подготовка input для UPDATE_REQUEST_RELAY
        const requestInput = {
          arrival: `${formDataExtend.arrivalDate}T${formDataExtend.arrivalTime}:00+00:00`,
          departure: `${formDataExtend.departureDate}T${formDataExtend.departureTime}:00+00:00`,
          status:
            formData.status === "opened" || formData.status === "created"
              ? formData.status
              : newStatus,
        };

        if (reserveChanged) {
          requestInput.reserve = selectedReserve;
        }
        if (personIdChanged) {
          requestInput.personId = effectivePersonId;
        }
        if (mealPlanChanged && formData?.mealPlan) {
          requestInput.mealPlan = {
            included: mealPlanIncluded,
            breakfastEnabled: mealPlanBreakfastEnabled,
            lunchEnabled: mealPlanLunchEnabled,
            dinnerEnabled: mealPlanDinnerEnabled,
          };
        }

        // Добавляем изменения гостиницы/номера/места только при валидном выборе
        if (hotelRoomChangeAllowed && (hotelIdChanged || roomOrPlaceChanged)) {
          if (!canChangeHotel) {
            alert("Невозможно сохранить изменения: дата заезда уже наступила.");
            setIsLoading(false);
            return;
          }

          if (hotelIdChanged) {
            requestInput.hotelId = selectedHotelId;
          }

          if (roomOrPlaceChanged) {
            const selectedRoom = rooms.find((room) => room.id === selectedRoomId);
            requestInput.roomId = selectedRoomId;
            // requestInput.place = selectedRoom?.places > 1 ? Number(selectedPlace) : null;
          }

          if (formData?.person?.id) {
            requestInput.personId = formData.person.id;
          }
        }

        // console.log(requestInput)

        // Сохранение изменений дат и hotelId (если изменился)
        await updateRequestRelay({
          variables: {
            updateRequestId: chooseRequestID,
            input: requestInput,
          },
        });

        alert(
          user?.airlineId && formData.status !== "created"
            ? "Запрос отправлен, можете посмотреть в комментариях."
            : "Изменения сохранены"
        );
        setFormDataExtend((prev) => ({
          ...prev,
          departureDate:
            user?.airlineId && formData.status !== "created"
              ? parseDateTime(formData.departure).date
              : "",
          departureTime:
            user?.airlineId && formData.status !== "created"
              ? parseDateTime(formData.departure).time
              : "",
          arrivalDate:
            user?.airlineId && formData.status !== "created"
              ? parseDateTime(formData.arrival).date
              : "",
          arrivalTime:
            user?.airlineId && formData.status !== "created"
              ? parseDateTime(formData.arrival).time
              : "",
        }));
        await refetch(); // Обновляем данные после изменения
      } catch (error) {
        console.error("Ошибка при сохранении:", error);
        if (
          String(error).startsWith(
            "ApolloError: Невозможно разместить заявку: пересечение с заявкой"
          )
        ) {
          alert("Невозможно разместить заявку: пересечение с другой заявкой");
          setFormDataExtend((prev) => ({
            departureDate: formData.departure
              ? parseDateTime(formData.departure).date
              : "",
            departureTime: formData.departure
              ? parseDateTime(formData.departure).time
              : "",
            arrivalDate: formData.arrival
              ? parseDateTime(formData.arrival).date
              : "",
            arrivalTime: formData.arrival
              ? parseDateTime(formData.arrival).time
              : "",
          }));
        } else if (
          String(error).startsWith(
            "ApolloError: Error: Невозможно разместить заявку: свободных мест нет"
          )
        ) {
          alert("Свободных мест в этом номере нет");
        }
      } finally {
        setIsLoading(false);
      }
    }
  };

  // Обработчики для изменения гостиницы и номера
  const handleHotelChange = useCallback((event, newValue) => {
    if (newValue) {
      // newValue теперь объект гостиницы, а не строка
      setSelectedHotelId(newValue.id);
      setSelectedRoomId(null);
      setSelectedPlace(null);
    } else {
      setSelectedHotelId(null);
      setSelectedRoomId(null);
      setSelectedPlace(null);
    }
  }, []);

  const handleAirportChange = useCallback((event, newValue) => {
    if (newValue) {
      setSelectedAirportId(newValue.id);
      setSelectedHotelId(null);
      setSelectedRoomId(null);
      setSelectedPlace(null);
    } else {
      setSelectedAirportId(null);
    }
  }, []);

  const handleRoomChange = useCallback((event, newValue) => {
    if (newValue) {
      // newValue теперь объект номера, а не строка
      setSelectedRoomId(newValue.id);
      // Если номер двухместный (type === 2), нужно выбрать место
      if (newValue.type === 2 && !selectedPlace) {
        setSelectedPlace(1); // По умолчанию место 1
      } else if (newValue.type !== 2) {
        setSelectedPlace(null);
      }
    } else {
      setSelectedRoomId(null);
      setSelectedPlace(null);
    }
  }, [selectedPlace]);

  // console.log(formDataExtend);

  // Клик вне боковой панели закрывает её
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showDelete) return;
      // Клик по меню или его backdrop — закрываем только меню, не сайдбар
      if (anchorEl && menuRef.current?.contains(event.target)) {
        setAnchorEl(null);
        return;
      }
      if (sidebarRef.current && !sidebarRef.current.contains(event.target)) {
        closeButton();
      }
    };

    if (show) document.addEventListener("mousedown", handleClickOutside);
    else document.removeEventListener("mousedown", handleClickOutside);

    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [show, closeButton, showDelete, anchorEl]);

  // Вспомогательные функции для преобразования данных
  // const getJsonParce = (data) => JSON.parse(data);
  // const formatDate = (dateString) => dateString.split("-").reverse().join(".");

  // Функция для генерации HTML-описания для логов
  // function getLogDescription(log, logsData) {
  //   switch (log.action) {
  //     case "create_request":
  //       return log.description
  //     case "updateHotelChess":
  //       return `
  //               Пользователь <span>${log.user.name}</span>
  //               создал бронь в отель <span>${logsData.hotel.name}</span>
  //               для <span>${logsData.person.position} ${logsData.person.name
  //         }</span>
  //               в номер <span>${getJsonParce(log.newData).room}</span>
  //               место <span>${getJsonParce(log.newData).place}</span>
  //               c <span>${formatDate(getJsonParce(log.newData).start)}</span>
  //               по <span>${formatDate(getJsonParce(log.newData).end)}</span>
  //           `;
  //     case "open_request":
  //       return `
  //               Пользователь <span>${log.user.name}</span>
  //               первый открыл заявку <br /> <span>№${getJsonParce(log.description).requestNumber
  //         }</span>
  //           `;
  //     default:
  //       return "Неизвестное действие";
  //   }
  // }
  // Инициализируем mealData с пустым массивом

  const [mealData, setMealData] = useState([]);

  // Обновляем mealData, когда formData меняется и данные mealPlan доступны
  useEffect(() => {
    if (formData?.mealPlan?.dailyMeals) {
      setMealData(formData?.mealPlan?.dailyMeals);
    }
  }, [formData, show]);

  // console.log(mealData)
  // console.log(formData?.mealPlan?.dailyMeals)
  // console.log(mealData === formData?.mealPlan?.dailyMeals)

  // Изменение в питании
  const handleMealChange = (index, mealType, value) => {
    setMealData((prevMeals) => {
      const updatedMeals = [...prevMeals];
      updatedMeals[index] = {
        ...updatedMeals[index],
        [mealType]: Number(value),
      };
      return updatedMeals;
    });
  };

  // Сохранение изменений в питании
  const [saveMeals] = useMutation(SAVE_MEALS_MUTATION, {
    context: {
      headers: {
        Authorization: `Bearer ${token}`,
        "Apollo-Require-Preflight": "true",
      },
    },
  });

  const cleanedMealData = mealData.map(({ __typename, ...rest }) => rest);

  const handleSaveMeals = async (mealsOverride, options = {}) => {
    const { suppressAlert = false } = options;
    const mealsToUse =
      mealsOverride != null
        ? mealsOverride.map((m) =>
          m && typeof m === "object" && "__typename" in m
            ? (() => {
              const { __typename, ...rest } = m;
              return rest;
            })()
            : m
        )
        : cleanedMealData;
    if (isEditing || mealsOverride != null) {
      setIsLoading(true);
      try {
        await saveMeals({
          variables: {
            input: {
              requestId: chooseRequestID,
              dailyMeals: mealsToUse,
            },
          },
        });
        await refetch();
        if (!suppressAlert) {
          alert("Изменения сохранены");
        }
      } catch (error) {
        console.error("Ошибка при сохранении:", error);
        alert("Ошибка при сохранении");
      } finally {
        setIsLoading(false);
      }
    }
  };

  // Изменение архивного
  const [changeToArchive] = useMutation(CHANGE_TO_ARCHIVE, {
    context: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  });

  const handleСhangeToArchive = async () => {
    setIsLoading(true);

    try {
      await changeToArchive({
        variables: {
          archivingRequstId: chooseRequestID,
        },
      });
      alert("Изменения сохранены");
      await refetch();
      onClose();
    } catch (error) {
      console.error("Ошибка при сохранении:", error);
      alert("Ошибка при сохранении");
    } finally {
      setIsLoading(false);
    }
  };

  const [airports, setAirports] = useState([]);
  const [selectedAirportId, setSelectedAirportId] = useState(null);
  const [selectedReserve, setSelectedReserve] = useState(null);
  const [mealPlanIncluded, setMealPlanIncluded] = useState(true);
  const [mealPlanBreakfastEnabled, setMealPlanBreakfastEnabled] = useState(true);
  const [mealPlanLunchEnabled, setMealPlanLunchEnabled] = useState(true);
  const [mealPlanDinnerEnabled, setMealPlanDinnerEnabled] = useState(true);

  const mealOptions = [
    { title: "Включено", value: true },
    { title: "Не включено", value: false },
  ];

  const effectiveAirlineId = formData?.airline?.id;
  const { data: airlineData, refetch: airlineRefetch } = useQuery(GET_AIRLINE, {
    context: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
    variables: { airlineId: effectiveAirlineId },
    skip: !effectiveAirlineId,
  });

  const { data: airportsData } = useQuery(GET_AIRPORTS_RELAY, {
    context: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
    skip: !chooseRequestID,
  });

  useEffect(() => {
    if (airportsData?.airports) {
      setAirports(airportsData.airports);
    }
  }, [airportsData]);

  // Запрос для получения списка гостиниц
  const { data: hotelsData, loading: hotelsLoading } = useQuery(
    GET_HOTELS_RELAY,
    {
      context: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    }
  );

  // Запрос для получения номеров выбранной гостиницы
  const {
    data: roomsData,
    loading: roomsLoading,
    refetch: refetchRooms,
  } = useQuery(GET_HOTEL_ROOMS, {
    context: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
    variables: { hotelId: selectedHotelId },
    skip: !selectedHotelId,
    fetchPolicy: "network-only",
  });

  const {
    loading: airlinePositionsLoading,
    error: airlinePositionsError,
    data: airlinePositionsData,
  } = useQuery(GET_AIRLINE_POSITIONS, {
    context: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  });

  const [positions, setPositions] = useState([]);

  const [airlineStaff, setAirlineStaff] = useState();
  const [selectedEmployee, setSelectedEmployee] = useState(null);

  useEffect(() => {
    if (airlineData) {
      setAirlineStaff(airlineData?.airline?.staff);
    }
  }, [airlineData]);

  useEffect(() => {
    if (airlinePositionsData) {
      setPositions(airlinePositionsData?.getAirlinePositions);
    }
  }, [airlinePositionsData]);

  // Инициализация списка гостиниц (по городу аэропорта)
  const cityForHotels = selectedAirportId
    ? airports.find((a) => a.id === selectedAirportId)?.city
    : formData?.airport?.city;
  useEffect(() => {
    if (hotelsData && hotelsData.hotels?.hotels && cityForHotels) {
      const filteredHotels = hotelsData.hotels.hotels.filter(
        (h) => h.information?.city?.trim() === cityForHotels?.trim()
      );
      setHotels(filteredHotels);
    } else if (hotelsData && hotelsData.hotels?.hotels && !cityForHotels) {
      setHotels([]);
    }
  }, [hotelsData, formData, cityForHotels]);

  // Инициализация списка номеров при выборе гостиницы
  useEffect(() => {
    if (roomsData && roomsData.hotel?.rooms) {
      setRooms(roomsData.hotel.rooms);
    } else {
      setRooms([]);
    }
  }, [roomsData, selectedHotelId]);


  // Инициализация значений гостиницы, номера и аэропорта при загрузке заявки
  useEffect(() => {
    if (formData && show) {
      if (formData.hotel?.id) {
        setSelectedHotelId(formData.hotel.id);
      }
      if (formData.hotelChess?.room?.id) {
        setSelectedRoomId(formData.hotelChess.room.id);
        setSelectedPlace(formData.hotelChess.place || null);
      }
      if (formData.airport?.id) {
        setSelectedAirportId(formData.airport.id);
      }
      if (formData.reserve !== undefined && formData.reserve !== null) {
        setSelectedReserve(formData.reserve);
      }
      if (formData?.mealPlan?.included !== undefined) {
        setMealPlanIncluded(formData.mealPlan.included);
      }
      if (formData?.mealPlan?.breakfastEnabled !== undefined) {
        setMealPlanBreakfastEnabled(formData.mealPlan.breakfastEnabled);
      }
      if (formData?.mealPlan?.lunchEnabled !== undefined) {
        setMealPlanLunchEnabled(formData.mealPlan.lunchEnabled);
      }
      if (formData?.mealPlan?.dinnerEnabled !== undefined) {
        setMealPlanDinnerEnabled(formData.mealPlan.dinnerEnabled);
      }
    }
  }, [formData, show]);

  // Проверка, можно ли изменять гостиницу и номер (дата заезда еще не наступила)
  const canChangeHotel = useMemo(() => {
    if (!formData?.arrival) return false;
    const arrivalDate = new Date(formData.arrival);
    const now = new Date();
    return arrivalDate > now;
  }, [formData?.arrival]);

  // Динамические опции для выбора места в номере на основе количества мест
  const placeOptions = useMemo(() => {
    const selectedRoom = rooms.find((r) => r.id === selectedRoomId);
    if (!selectedRoom || !selectedRoom.places || selectedRoom.places <= 1) {
      return [];
    }
    return Array.from({ length: selectedRoom.places }, (_, i) => String(i + 1));
  }, [rooms, selectedRoomId]);

  const handleSaveChanges = () => {
    setIsLoading(true);

    const personToSave = selectedEmployee ?? formData?.person;
    if (!chooseRequestID || !personToSave) {
      alert("Пожалуйста, выберите сотрудника.");
      setIsLoading(false);
      return;
    }
    console.log(personToSave);

    updateRequestRelay({
      variables: {
        updateRequestId: chooseRequestID,
        input: {
          personId: personToSave.id,
        },
      },
    })
      .then((res) => {
        // console.log("Request updated:", res);
        alert("Изменения сохранены");
        setSelectedEmployee(null);
        setNewStaffId(null);
        // При необходимости можно выполнить refetch() или обновить локальные данные
        refetch();
        setIsLoading(false);
      })
      .catch((err) => {
        console.error("Ошибка обновления заявки:", err);
        // console.log(selectedEmployee);

        alert("Ошибка обновления заявки");
        setSelectedEmployee(null);
        setNewStaffId(null);
        setIsLoading(false);
      });
  };

  const handleUpdateRequest = async () => {
    if (isEditing) {
      await handleExtendChangeRequest();
    } else {
      setActiveTab("Общая");
    }
    setIsEditing(!isEditing);
  };

  const handlePlaceClick = () => {
    const hasPendingEmployeeSelection =
      Boolean(selectedEmployee?.id) &&
      selectedEmployee.id !== formData?.person?.id;

    if (hasPendingEmployeeSelection) {
      alert("Подтвердите выбор сотрудника.");
      return;
    }

    onClose();
    setShowChooseHotel(true);
    setChooseCityRequest(formData?.airport?.city);
    localStorage.setItem("selectedTab", 0);
  };

  const [newStaffId, setNewStaffId] = useState(null);
  const [showAddStaff, setShowAddStaff] = useState(false);
  const toggleAddStaff = () => setShowAddStaff((prev) => !prev);

  useEffect(() => {
    if (newStaffId) {
      const staffObj = typeof newStaffId === "object" ? newStaffId : { id: newStaffId };
      setSelectedEmployee(staffObj);
      setAirlineStaff((prev) => {
        const list = prev || [];
        if (!list.some((p) => p.id === staffObj.id)) {
          return [...list, staffObj];
        }
        return list;
      });
    }
  }, [newStaffId]);

  const [separator, setSeparator] = useState("airline");
  const [isHaveTwoChats, setIsHaveTwoChats] = useState();

  const handleMenuOpen = (event) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => setAnchorEl(null);

  useEffect(() => {
    setSeparator("airline");
  }, [show]);

  // console.log(formData);

  return (
    <>
      {formData && (
        <Sidebar show={show} sidebarRef={sidebarRef}>
          <div className={classes.requestTitle}>
            <div className={classes.requestTitle_name}>
              {formData.requestNumber}
              {/* {(formData.status == "done" ||
                formData.status == "extended" ||
                formData.status == "reduced" ||
                formData.status == "transferred" ||
                formData.status == "earlyStart") &&
                // handleCancelRequest &&
                !user?.airlineId && (
                  <button
                    className={classes.canceledButton}
                    onClick={() => {
                      // onClose();
                      openDeleteComponent();
                      // handleCancelRequest(chooseRequestID);
                    }}
                  >
                    Отменить
                  </button>
                )} */}
            </div>
            <div className={classes.requestTitle_close}>
              {formData.status !== 'canceled' && formData.status !== "archived" && formData.status !== "created" && formData.status !== "opened" && (
                <ExistRequestAdditionalMenu
                  anchorEl={anchorEl}
                  onOpen={handleMenuOpen}
                  onClose={handleMenuClose}
                  menuRef={menuRef}
                  formData={formData}
                  user={user}
                  canUpdateActions={canUpdateActions}
                  activeTab={activeTab}
                  onEdit={handleUpdateRequest}
                  onCancelRequest={openDeleteComponent}
                  onCloseSidebar={closeButton}
                />
              )}
              <div onClick={closeButton} className={classes.closeIconWrapper}>
                <CloseIcon />
              </div>
            </div>
          </div>

          {isLoading ? (
            <MUILoader loadSize={"50px"} fullHeight={"75vh"} />
          ) : (
            <>
              <div className={classes.tabs}>
                <div
                  className={`${classes.tab} ${activeTab === "Общая" ? classes.activeTab : ""
                    }`}
                  onClick={() => handleTabChange("Общая")}
                >
                  Общая
                </div>
                {formData.status !== "created" &&
                  formData.status !== "opened" &&
                  (user?.airlineId ? !isEditing : true) && (
                    <div
                      className={`${classes.tab} ${activeTab === "Питание" ? classes.activeTab : ""
                        }`}
                      onClick={() => handleTabChange("Питание")}
                    >
                      Питание
                    </div>
                  )}
                {!isEditing && canChatTab && (
                  <div
                    className={`${classes.tab} ${activeTab === "Комментарии" ? classes.activeTab : ""
                      }`}
                    style={{ position: "relative" }}
                    onClick={() => handleTabChange("Комментарии")}
                  >
                    Комментарии
                    {formData?.chat?.some(
                      (chat) =>
                        chat.unreadMessagesCount > 0 &&
                        ((user.hotelId && chat.hotelId === user.hotelId) ||
                          (user.airlineId &&
                            chat.airlineId === user.airlineId) ||
                          (!user.hotelId && !user.airlineId))
                    ) && <div className={classes.unreadMessages}></div>}
                    {/* {console.log(formData?.chat)} */}
                  </div>
                )}
                {!isEditing && (
                  <div
                    className={`${classes.tab} ${activeTab === "История" ? classes.activeTab : ""
                      }`}
                    onClick={() => handleTabChange("История")}
                  >
                    История
                  </div>
                )}
              </div>

              <div
                className={classes.requestMiddle}
                style={{
                  height: (isEditing) ? "calc(100vh - 198px)" : "calc(100vh - 120px)"
                  // (activeTab !== "Комментарии" &&
                  //   activeTab !== "История" &&
                  //   formData.status !== "created" &&
                  //   formData.status !== "canceled" &&
                  //   formData.status !== "archived" &&
                  //   (accessMenu
                  //     ? user?.airlineId &&
                  //     hasAccessMenu(accessMenu, "requestUpdate")
                  //     : true))
                  //   ? "calc(100vh - 120px)"
                  //   :
                  //   (activeTab !== "Комментарии" &&
                  //     activeTab !== "История" &&
                  //     formData.status !== "created" &&
                  //     formData.status !== "canceled" &&
                  //     formData.status !== "archived" &&
                  //     (accessMenu
                  //       ? !user?.airlineId &&
                  //       (dispatcherCanUpdate ??
                  //         hasAccessMenu(accessMenu, "requestUpdate"))
                  //       : true))
                  //     ? "calc(100vh - 120px)"
                  //     : null,
                }}
              >
                {/* Вкладка "Общая" */}
                {activeTab === "Общая" && (
                  <div className={classes.requestData}>
                    {/* Информация о сотруднике */}
                    <div className={classes.requestDataTitle}>
                      Информация о сотруднике
                    </div>
                    {(isEditing || ((formData.status === "created" || formData.status === "opened") && !formData.person)) && !(formData.person && (formData.status === "created" || formData.status === "opened")) && (!user?.hotelId && !user?.airlineId) ? (
                      <>
                        <div className={classes.requestDataInfo}>
                          <div className={classes.requestDataInfo_title}>
                            Авиакомпания
                          </div>
                          <div className={classes.requestDataInfo_desc}>
                            {formData.airline?.name || "—"}
                          </div>
                        </div>
                        <div className={classes.requestDataInfo}>
                          <div
                            className={classes.requestDataInfo_title}
                            style={{ display: "flex", alignItems: "center", gap: "10px" }}
                          >
                            Сотрудник
                            <div
                              className={classes.addStaff}
                              onClick={toggleAddStaff}
                            >
                              <img src="/plus.png" alt="" />
                            </div>
                          </div>
                          <MUIAutocompleteColor
                            dropdownWidth="60%"
                            label="Выберите сотрудника"
                            options={airlineStaff || []}
                            getOptionLabel={(option) =>
                              option
                                ? `${option.name || ""} ${option.position?.name || ""} ${option.gender || ""}`.trim()
                                : ""
                            }
                            renderOption={(optionProps, option) => {
                              const labelText = `${option.name || ""} ${option.position?.name || ""} ${option.gender || ""}`.trim();
                              const words = labelText.split(". ");
                              return (
                                <li {...optionProps} key={option.id}>
                                  {words.map((word, index) => (
                                    <span
                                      key={index}
                                      style={{
                                        color:
                                          index === 0 ? "black" : "gray",
                                        marginRight: "4px",
                                      }}
                                    >
                                      {word}
                                    </span>
                                  ))}
                                </li>
                              );
                            }}
                            value={
                              airlineStaff?.find(
                                (person) =>
                                  person.id ===
                                  (selectedEmployee?.id ?? formData?.person?.id)
                              ) || null
                            }
                            onChange={(event, newValue) => {
                              setSelectedEmployee(newValue);
                            }}
                          />
                        </div>
                        {(formData.status === "created" || formData.status === "opened") && (
                          <Button onClick={handleSaveChanges}>
                            Подтвердите выбор сотрудника
                          </Button>
                        )}
                      </>
                    ) : formData.person ? (
                      <>
                        <div className={classes.requestDataInfo}>
                          <div className={classes.requestDataInfo_title}>
                            Авиакомпания
                          </div>
                          <div className={classes.requestDataInfo_desc}>
                            {formData.airline.name}
                          </div>
                        </div>
                        <div className={classes.requestDataInfo}>
                          <div className={classes.requestDataInfo_title}>
                            ФИО
                          </div>
                          <div className={classes.requestDataInfo_desc}>
                            {formData?.person?.name}
                          </div>
                        </div>
                        <div className={classes.requestDataInfo}>
                          <div className={classes.requestDataInfo_title}>
                            Должность
                          </div>
                          <div className={classes.requestDataInfo_desc}>
                            {formData?.person?.position?.name}
                          </div>
                        </div>
                        <div className={classes.requestDataInfo}>
                          <div className={classes.requestDataInfo_title}>
                            Пол
                          </div>
                          <div className={classes.requestDataInfo_desc}>
                            {formData?.person?.gender || "—"}
                          </div>
                        </div>
                        <div className={classes.requestDataInfo}>
                          <div className={classes.requestDataInfo_title}>
                            Номер телефона
                          </div>
                          <div className={classes.requestDataInfo_desc}>
                            {formData?.person?.number}
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className={classes.requestDataInfo}>
                        <div className={classes.requestDataInfo_title}>
                          Сотрудник
                        </div>
                        <div className={classes.requestDataInfo_desc}>
                          Сотрудник не назначен
                        </div>
                      </div>
                    )}

                    {/* Информация о питании */}
                    <div className={classes.requestDataTitle}>Питание</div>
                    <div className={classes.requestDataInfo} style={{ flexWrap: "wrap" }}>
                      <div className={classes.requestDataInfo_title}>
                        Питание
                      </div>
                      {isEditing && !user?.airlineId &&
                        formData.status !== "created" &&
                        formData.status !== "opened" ? (
                        <>
                          <MUIAutocomplete
                            dropdownWidth="60%"
                            options={mealOptions.map((m) => m.title)}
                            value={
                              mealPlanIncluded ? "Включено" : "Не включено"
                            }
                            onChange={(event, newValue) => {
                              const isIncluded = newValue === "Включено";
                              setMealPlanIncluded(isIncluded);
                              setMealPlanBreakfastEnabled(isIncluded);
                              setMealPlanLunchEnabled(isIncluded);
                              setMealPlanDinnerEnabled(isIncluded);
                            }}
                          />
                          <div
                            className={classes.checks}
                            style={{
                              width: "100%",
                              display: mealPlanIncluded ? "flex" : "none",
                              marginTop: 15,
                              justifyContent: "space-between"
                            }}
                          >
                            <label>
                              <input
                                type="checkbox"
                                checked={mealPlanBreakfastEnabled}
                                onChange={(e) => {
                                  const checked = e.target.checked;
                                  setMealPlanBreakfastEnabled(checked);
                                  const any =
                                    checked ||
                                    mealPlanLunchEnabled ||
                                    mealPlanDinnerEnabled;
                                  setMealPlanIncluded(any);
                                }}
                              />
                              Завтрак
                            </label>
                            <label>
                              <input
                                type="checkbox"
                                checked={mealPlanLunchEnabled}
                                onChange={(e) => {
                                  const checked = e.target.checked;
                                  setMealPlanLunchEnabled(checked);
                                  const any =
                                    mealPlanBreakfastEnabled ||
                                    checked ||
                                    mealPlanDinnerEnabled;
                                  setMealPlanIncluded(any);
                                }}
                              />
                              Обед
                            </label>
                            <label>
                              <input
                                type="checkbox"
                                checked={mealPlanDinnerEnabled}
                                onChange={(e) => {
                                  const checked = e.target.checked;
                                  setMealPlanDinnerEnabled(checked);
                                  const any =
                                    mealPlanBreakfastEnabled ||
                                    mealPlanLunchEnabled ||
                                    checked;
                                  setMealPlanIncluded(any);
                                }}
                              />
                              Ужин
                            </label>
                          </div>
                        </>
                      ) : (
                        <div className={classes.requestDataInfo_desc}>
                          {formData?.mealPlan?.included
                            ? "Включено"
                            : "Не включено"}
                        </div>
                      )}
                    </div>

                    {formData?.mealPlan?.included &&
                      formData.status !== "created" &&
                      formData.status !== "opened" &&
                      !isEditing && (
                        <>
                          <div className={classes.requestDataInfo}>
                            <div className={classes.requestDataInfo_title}>
                              Завтрак
                            </div>
                            <div className={classes.requestDataInfo_desc}>
                              {formData.mealPlan.breakfast || "—"}
                            </div>
                          </div>
                          <div className={classes.requestDataInfo}>
                            <div className={classes.requestDataInfo_title}>
                              Обед
                            </div>
                            <div className={classes.requestDataInfo_desc}>
                              {formData.mealPlan.lunch || "—"}
                            </div>
                          </div>
                          <div className={classes.requestDataInfo}>
                            <div className={classes.requestDataInfo_title}>
                              Ужин
                            </div>
                            <div className={classes.requestDataInfo_desc}>
                              {formData.mealPlan.dinner || "—"}
                            </div>
                          </div>
                        </>
                      )}

                    {/* Информация о заявке */}
                    {formData.status !== "created" &&
                      formData.status !== "opened" && (
                        <ExistRequestEditForm
                          formData={formData}
                          isEditing={isEditing}
                          user={user}
                          canChangeHotel={canChangeHotel}
                          selectedHotelId={selectedHotelId}
                          selectedRoomId={selectedRoomId}
                          selectedReserve={selectedReserve}
                          hotels={hotels}
                          rooms={rooms}
                          roomsLoading={roomsLoading}
                          onHotelChange={handleHotelChange}
                          onRoomChange={handleRoomChange}
                          onReserveChange={setSelectedReserve}
                          formDataExtend={formDataExtend}
                          onExtendChange={handleExtendChange}
                        />
                      )}

                    {/* Продление / Изменение даты — только для created и opened */}
                    {(formData.status === "created" ||
                      formData.status === "opened") && (
                        // !user?.hotelId &&
                        // formData.status !== "archiving" &&
                        <>
                          <div className={classes.requestDataTitle}>
                            {user?.airlineId &&
                              (formData.status !== "created" ||
                                formData.status === "opened")
                              ? "Запрос на изменение даты"
                              : "Изменение даты"}
                          </div>
                          <label>Заезд</label>
                          <div className={classes.reis_info}>
                            <input
                              type="date"
                              name="arrivalDate"
                              value={formDataExtend.arrivalDate}
                              onChange={handleExtendChange}
                              placeholder="Дата"
                              disabled={
                                formData.status === "created" ||
                                  formData.status === "opened"
                                  ? false
                                  : !isEditing
                              }
                            />
                            <input
                              type="time"
                              name="arrivalTime"
                              value={formDataExtend.arrivalTime}
                              onChange={handleExtendChange}
                              placeholder="Время"
                              disabled={
                                formData.status === "created" ||
                                  formData.status === "opened"
                                  ? false
                                  : !isEditing
                              }
                            />
                          </div>
                          <label>Выезд</label>
                          <div className={classes.reis_info}>
                            {/* <input
                          type="text"
                          name="departureName"
                          value={formDataExtend.departureName}
                          onChange={handleExtendChange}
                          placeholder="Номер рейса"
                        /> */}
                            <input
                              type="date"
                              name="departureDate"
                              value={formDataExtend.departureDate}
                              onChange={handleExtendChange}
                              placeholder="Дата"
                              disabled={
                                formData.status === "created" ||
                                  formData.status === "opened"
                                  ? false
                                  : !isEditing
                              }
                            />
                            <input
                              type="time"
                              name="departureTime"
                              value={formDataExtend.departureTime}
                              onChange={handleExtendChange}
                              placeholder="Время"
                              disabled={
                                formData.status === "created" ||
                                  formData.status === "opened"
                                  ? false
                                  : !isEditing
                              }
                            />
                          </div>
                          {(formData.status === "created" ||
                            formData.status === "opened") && (
                              <Button onClick={handleExtendChangeRequest}>
                                Изменить даты
                              </Button>
                            )}
                        </>
                      )}

                    {/* Продление */}
                    {formData.status == "archiving" &&
                      formData.status !== "opened" &&
                      isDispatcherAdmin(user) && isEditing && (
                        <Button onClick={handleСhangeToArchive}>
                          Отправить в архив
                        </Button>
                      )}
                  </div>
                )}
                {/* Вкладка "Питание" */}
                {activeTab === "Питание" &&
                  formData.status !== "created" &&
                  formData.status !== "opened" && (
                    <div className={classes.requestData}>
                      {mealData.length === 0 ? (
                        <div className={classes.requestDataTitle}>
                          Питание отсутствует
                        </div>
                      ) : (
                        <>
                          <div className={classes.requestDataTitle}>
                            Питание сотрудника
                          </div>

                          {/* Шапка */}
                          <div
                            className={
                              classes.mealRow + " " + classes.mealHeader
                            }
                          >
                            <div /> {/* под дату */}
                            <div style={{ color: "var(--text)" }}>З</div>
                            <div style={{ color: "var(--text)" }}>О</div>
                            <div style={{ color: "var(--text)" }}>У</div>
                          </div>

                          {/* Строки с данными */}
                          {mealData.map((dailyMeal, index) => (
                            <div key={index} className={classes.mealRow}>
                              <div className={classes.mealInfoDate}>
                                {convertToDate(dailyMeal.date)}
                              </div>

                              <input
                                type="number"
                                min={0}
                                value={dailyMeal.breakfast}
                                disabled={
                                  formData.status === "archived" ||
                                  formData.status === "canceled" ||
                                  !isEditing
                                }
                                onChange={(e) =>
                                  handleMealChange(
                                    index,
                                    "breakfast",
                                    e.target.value
                                  )
                                }
                              />
                              <input
                                type="number"
                                min={0}
                                value={dailyMeal.lunch}
                                disabled={
                                  formData.status === "archived" ||
                                  formData.status === "canceled" ||
                                  !isEditing
                                }
                                onChange={(e) =>
                                  handleMealChange(
                                    index,
                                    "lunch",
                                    e.target.value
                                  )
                                }
                              />
                              <input
                                type="number"
                                min={0}
                                value={dailyMeal.dinner}
                                disabled={
                                  formData.status === "archived" ||
                                  formData.status === "canceled" ||
                                  !isEditing
                                }
                                onChange={(e) =>
                                  handleMealChange(
                                    index,
                                    "dinner",
                                    e.target.value
                                  )
                                }
                              />
                            </div>
                          ))}
                        </>
                      )}

                      {formData.status !== "archived" &&
                        formData.status !== "canceled" &&
                        isEditing && (
                          <Button
                            onClick={() => handleSaveMeals()}
                          >
                            Сохранить питание
                          </Button>
                        )}
                    </div>
                    // <div className={classes.requestData}>
                    //   <div className={classes.requestDataTitle}>
                    //     Питание сотрудника
                    //   </div>

                    //   {mealData.map((dailyMeal, index) => (
                    //     <div key={index} className={classes.mealInfo}>
                    //       <div className={classes.mealInfoDate}>
                    //         {convertToDate(dailyMeal.date)}
                    //       </div>
                    //       <div className={classes.requestDataInfo}>
                    //         <div className={classes.requestDataInfo_title}>
                    //           Завтрак
                    //         </div>
                    //         <input
                    //           type="number"
                    //           min={0}
                    //           name="breakfastCount"
                    //           placeholder="Количество"
                    //           value={dailyMeal.breakfast}
                    //           disabled={
                    //             (formData.status === "archived" ||
                    //               formData.status === "canceled") &&
                    //             true
                    //           }
                    //           onChange={(e) =>
                    //             handleMealChange(
                    //               index,
                    //               "breakfast",
                    //               e.target.value
                    //             )
                    //           }
                    //         />
                    //       </div>
                    //       <div className={classes.requestDataInfo}>
                    //         <div className={classes.requestDataInfo_title}>
                    //           Обед
                    //         </div>
                    //         <input
                    //           type="number"
                    //           min={0}
                    //           name="lunchCount"
                    //           placeholder="Количество"
                    //           value={dailyMeal.lunch}
                    //           disabled={
                    //             (formData.status === "archived" ||
                    //               formData.status === "canceled") &&
                    //             true
                    //           }
                    //           onChange={(e) =>
                    //             handleMealChange(index, "lunch", e.target.value)
                    //           }
                    //         />
                    //       </div>
                    //       <div className={classes.requestDataInfo}>
                    //         <div className={classes.requestDataInfo_title}>
                    //           Ужин
                    //         </div>
                    //         <input
                    //           type="number"
                    //           min={0}
                    //           name="dinnerCount"
                    //           placeholder="Количество"
                    //           value={dailyMeal.dinner}
                    //           disabled={
                    //             (formData.status === "archived" ||
                    //               formData.status === "canceled") &&
                    //             true
                    //           }
                    //           onChange={(e) =>
                    //             handleMealChange(
                    //               index,
                    //               "dinner",
                    //               e.target.value
                    //             )
                    //           }
                    //         />
                    //       </div>
                    //     </div>
                    //   ))}
                    //   {formData.status !== "archived" &&
                    //     formData.status !== "canceled" && (
                    //       <Button onClick={handleSaveMeals}>Сохранить</Button>
                    //     )}
                    // </div>
                  )}
                {/* Вкладка "Комментарии" */}
                {activeTab === "Комментарии" && (
                  <>
                    {!isSuperAdmin(user) && !isDispatcherAdmin(user) ? null : (
                      <div className={classes.separatorWrapper}>
                        {isHaveTwoChats === false ? (
                          <button
                            onClick={() => setSeparator("airline")} // Установить separator как 'airline'
                            className={
                              separator === "airline" ? classes.active : null
                            }
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
                              className={
                                separator === "hotel" ? classes.active : null
                              }
                            >
                              Гостиница
                            </button>
                          </>
                        )}
                      </div>
                    )}
                    <Message
                      key={`${chooseRequestID ? chooseRequestID : chooseReserveID
                        }-${activeTab}`}
                      activeTab={activeTab}
                      show={show}
                      setIsHaveTwoChats={setIsHaveTwoChats}
                      chooseRequestID={chooseRequestID}
                      chooseReserveID={""}
                      formData={formData}
                      token={token}
                      user={user}
                      separator={separator}
                      chatHeight={
                        user?.airlineId || user?.hotelId
                          ? "calc(100vh - 202px)"
                          : "calc(100vh - 260px)"
                      }
                    />
                  </>
                )}
                {/* Вкладка "История" */}
                {activeTab === "История" && logsData && (
                  <div
                    className={classes.requestData}
                    style={{ paddingBottom: totalPages > 1 ? "60px" : "20px" }}
                  >
                    <div className={classes.logs}>
                      {groupedHistory.map(([dayTs, dayLogs]) => (
                        <div
                          className={classes.historySection}
                          key={dayTs}
                        >
                          <div className={classes.historyDate}>
                            {fmtDay(dayTs)}
                          </div>
                          {/* {console.log(dayLogs)} */}
                          {dayLogs.map((log, idx) => (
                            <div className={classes.logText}>
                              <div className={classes.logInfo}>
                                <span className='historyLogTime'>{convertToDate(
                                  log.createdAt,
                                  true
                                )}</span>
                                <div
                                  key={log.id ?? `${dayTs}-${idx}`}
                                  className={classes.historyLog}
                                  dangerouslySetInnerHTML={{
                                    __html: `${log.description}`,
                                  }}
                                />
                              </div>
                              <div
                                className={classes.logImg}
                                title={
                                  log.user
                                    ? [log.user.name, roleLabels[log.user.role] ?? roleLabels[log.user.role?.toUpperCase()] ?? log.user.role]
                                        .filter(Boolean)
                                        .join(", ") || undefined
                                    : undefined
                                }
                              >
                                <img src={log.user?.images[0] ? getMediaUrl(log.user?.images[0]) : "/no-avatar.png"} alt="" />
                              </div>
                            </div>
                          ))}
                        </div>
                      ))}
                    </div>
                    {totalPages > 1 && (
                      <div className={classes.pagination}>
                        <ReactPaginate
                          previousLabel={"←"}
                          nextLabel={"→"}
                          breakLabel={"..."}
                          pageCount={totalPages}
                          marginPagesDisplayed={2}
                          pageRangeDisplayed={5}
                          onPageChange={handlePageClick}
                          // forcePage={validCurrentPage}
                          containerClassName={classes.pagination}
                          activeClassName={classes.activePaginationNumber}
                          pageLinkClassName={classes.paginationNumber}
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Кнопки для неразмещённой заявки: отмена и размещение */}
              {(formData.status === "created" ||
                formData.status === "opened") &&
                activeTab === "Общая" &&
                canUpdateActions && (
                  <div className={classes.requestButton}>
                    <button
                      onClick={() => {
                        // onClose();
                        // handleCancelRequest(chooseRequestID);
                        openDeleteComponent();
                      }}
                    >
                      {user?.airlineId && formData.status === "opened"
                        ? "Запрос на отмену"
                        : "Отменить"}
                      {/* <img src="/user-check.png" alt="" /> */}
                    </button>
                    {((isSuperAdmin(user) || isDispatcherAdmin(user)) &&
                      !formData.hotelId) && (
                        <Button
                          onClick={handlePlaceClick}
                        >
                          {/* {console.log(formData)} */}
                          Разместить
                          <img
                            style={{
                              width: "fit-content",
                              height: "fit-content",
                            }}
                            src="/user-check.png"
                            alt=""
                          />
                        </Button>
                      )}
                  </div>
                )}
              {formData.status !== "created" &&
                formData.status !== "opened" &&
                formData.status !== "canceled" &&
                formData.status !== "archived" &&
                activeTab !== "Комментарии" &&
                activeTab !== "История" &&
                canUpdateActions &&
                isEditing && (
                  <div className={classes.requestButton}>
                    <Button
                      onClick={() => setIsEditing(false)}
                      backgroundcolor="var(--hover-gray)"
                      color="#000"
                    >
                      Отмена
                    </Button>
                    <Button
                      onClick={handleUpdateRequest}
                      backgroundcolor="#0057C3"
                      color="#fff"
                    >
                      Сохранить
                    </Button>
                  </div>
                )}
            </>
          )}
          <CreateRequestAirlineStaff
            id={formData?.airline?.id}
            show={showAddStaff}
            onClose={toggleAddStaff}
            isExist={true}
            positions={positions}
            setNewStaffId={setNewStaffId}
            airlineRefetch={airlineRefetch}
          />
        </Sidebar>
      )}
      {showDelete && (
        <DeleteComponent
          remove={() => {
            handleCancelRequest();
            closeDeleteComponent();
            // setShowRequestSidebar(false);
          }}
          index={chooseRequestID}
          close={closeDeleteComponent}
          title={`Вы действительно хотите отменить заявку? `}
          isCancel={true}
        />
      )}
    </>
  );
}

export default ExistRequest;


// import React, { useState, useRef, useEffect, useCallback, useMemo } from "react";
// import classes from "./ExistRequest.module.css";
// import Button from "../../Standart/Button/Button";
// import Sidebar from "../Sidebar/Sidebar";
// import { useMutation, useQuery, useSubscription } from "@apollo/client";
// import {
//   CANCEL_REQUEST,
//   CHANGE_TO_ARCHIVE,
//   convertToDate,
//   EXTEND_REQUEST_NOTIFICATION_SUBSCRIPTION,
//   GET_AIRLINE,
//   GET_AIRLINE_POSITIONS,
//   GET_REQUEST,
//   GET_HOTELS_RELAY,
//   GET_HOTEL_ROOMS,
//   getCookie,
//   REQUEST_UPDATED_SUBSCRIPTION,
//   SAVE_HANDLE_EXTEND_MUTATION,
//   SAVE_MEALS_MUTATION,
//   UPDATE_REQUEST_RELAY,
// } from "../../../../graphQL_requests";
// import Message from "../Message/Message";
// import {
//   hasAccessMenu,
//   isAirlineAdmin,
//   isDispatcherAdmin,
//   isSuperAdmin,
// } from "../../../utils/access";
// import { Link } from "react-router-dom";
// import ReactPaginate from "react-paginate";
// import MUIAutocomplete from "../MUIAutocomplete/MUIAutocomplete";
// import CreateRequestAirlineStaff from "../CreateRequestAirlineStaff/CreateRequestAirlineStaff";
// import MUILoader from "../MUILoader/MUILoader";
// import MUIAutocompleteColor from "../MUIAutocompleteColor/MUIAutocompleteColor";
// import DeleteComponent from "../DeleteComponent/DeleteComponent";
// import CloseIcon from "../../../shared/icons/CloseIcon";
// import AdditionalMenuIcon from "../../../shared/icons/AdditionalMenuIcon";

// function ExistRequest({
//   show,
//   onClose,
//   setShowChooseHotel,
//   chooseRequestID,
//   // handleCancelRequest,
//   accessMenu,
//   dispatcherCanChat,
//   dispatcherCanUpdate,
//   user,
//   setChooseRequestID,
//   totalMeals,
//   setChooseCityRequest,
//   // openDeleteComponent,
//   setRequestId,
// }) {
//   const token = getCookie("token");
//   const [totalPages, setTotalPages] = useState(1);
//   const currentPageRelay = 0;

//   // Состояние для хранения информации о странице (для пагинации)
//   const [pageInfo, setPageInfo] = useState({
//     skip: currentPageRelay,
//     take: 50,
//   });

//   // Запросы данных о заявке и логе
//   const { data, error, refetch } = useQuery(GET_REQUEST, {
//     context: {
//       headers: {
//         Authorization: `Bearer ${token}`,
//       },
//     },
//     variables: {
//       requestId: chooseRequestID,
//       pagination: {
//         skip: pageInfo.skip,
//         take: pageInfo.take,
//       },
//     },
//     skip: !chooseRequestID,
//   });

//   // console.log(data);

//   useEffect(() => {
//     if (chooseRequestID && setRequestId) {
//       setRequestId(chooseRequestID);
//     }
//   }, [chooseRequestID]); // Срабатывает только при изменении chooseRequestID

//   // const { data: subscriptionData } = useSubscription(
//   //   EXTEND_REQUEST_NOTIFICATION_SUBSCRIPTION,
//   //   {
//   //     onData: () => {
//   //       refetch();
//   //     },
//   //   }
//   // );

//   // Функция для разделения даты и времени
//   const parseDateTime = (dateTime) => {
//     if (!dateTime) return { date: "", time: "" };
//     const dateObj = new Date(dateTime);
//     return {
//       date: dateObj.toISOString().split("T")[0], // YYYY-MM-DD
//       time: dateObj.toISOString().split("T")[1].slice(0, 5), // HH:MM
//     };
//   };
//   const [activeTab, setActiveTab] = useState("Общая");
//   const [formData, setFormData] = useState(null);
//   const [logsData, setLogsData] = useState(null);
//   const [formDataExtend, setFormDataExtend] = useState({
//     departureName: "",
//     departureDate: "",
//     departureTime: "",
//     arrivalDate: "",
//     arrivalTime: "",
//   });
//   const [isEditing, setIsEditing] = useState(false);
//   const [isEditing2, setIsEditing2] = useState(false);

//   // Состояние для изменения гостиницы и номера
//   const [hotels, setHotels] = useState([]);
//   const [rooms, setRooms] = useState([]);
//   const [selectedHotelId, setSelectedHotelId] = useState(null);
//   const [selectedRoomId, setSelectedRoomId] = useState(null);
//   const [selectedPlace, setSelectedPlace] = useState(null);

//   const canChatTab =
//     dispatcherCanChat ??
//     (!user?.airlineId || hasAccessMenu(accessMenu, "requestChat"));
//   const canUpdateActions =
//     dispatcherCanUpdate ??
//     (!user?.airlineId || hasAccessMenu(accessMenu, "requestUpdate"));

//   const [showDelete, setShowDelete] = useState(false);

//   const openDeleteComponent = () => {
//     setShowDelete(true);
//   };

//   const closeDeleteComponent = () => {
//     setShowDelete(false);
//     closeButton();
//   };

//   const sidebarRef = useRef();

//   const { data: subscriptionUpdateData } = useSubscription(
//     REQUEST_UPDATED_SUBSCRIPTION,
//     {
//       onData: () => {
//         refetch();
//       },
//     }
//   );

//   // Обновление состояния при изменении данных запроса
//   useEffect(() => {
//     if (data && data.request) {
//       setFormData(data?.request);
//       setLogsData(data?.request);
//       setTotalPages(data?.request?.logs?.totalPages);
//     }
//   }, [data, show]);

//   // console.log(data);

//   // Обработчик смены страницы в ReactPaginate
//   const handlePageClick = (event) => {
//     const newPageIndex = event.selected; // нумерация с 0
//     // Вычисляем skip (например, newPageIndex * take)
//     setPageInfo((prev) => ({
//       ...prev,
//       skip: newPageIndex * prev.take,
//     }));
//   };

//   useEffect(() => {
//     if (formData) {
//       setFormDataExtend({
//         departureDate: formData.departure
//           ? parseDateTime(formData.departure).date
//           : "",
//         departureTime: formData.departure
//           ? parseDateTime(formData.departure).time
//           : "",
//         arrivalDate: formData.arrival
//           ? parseDateTime(formData.arrival).date
//           : "",
//         arrivalTime: formData.arrival
//           ? parseDateTime(formData.arrival).time
//           : "",
//       });
//     }
//   }, [formData, show]); // Следим за изменением formData

//   // Функция закрытия формы
//   const closeButton = useCallback(() => {
//     resetForm();
//     onClose();
//     setChooseRequestID("");
//     setMealData([]);
//     setFormDataExtend((prev) => ({
//       ...prev,
//       departureDate: "",
//       departureTime: "",
//       arrivalDate: "",
//       arrivalTime: "",
//     }));
//     setSelectedEmployee(null);
//     setNewStaffId(null);
//     setIsEditing(false);
//     setIsEditing2(false);
//     // Сброс состояния гостиницы и номера
//     setSelectedHotelId(null);
//     setSelectedRoomId(null);
//     setSelectedPlace(null);
//   }, [onClose, setChooseRequestID]);

//   const resetForm = useCallback(() => setActiveTab("Общая"), []);

//   // Обработчик для изменения вкладок
//   const handleTabChange = useCallback((tab) => setActiveTab(tab), []);

//   // Обработчик изменений в форме

//   // const handleChange = useCallback(
//   //   (e) => {
//   //     const { name, value, type, checked } = e.target;
//   //     setFormData((prevState) => ({
//   //       ...prevState,
//   //       meals:
//   //         name === "included"
//   //           ? { ...prevState.meals, included: value }
//   //           : prevState.meals,
//   //       [name]: type === "checkbox" ? checked : value,
//   //     }));

//   //     if (formData?.meals.included === "Не включено") {
//   //       setFormData((prevState) => ({
//   //         ...prevState,
//   //         meals: { breakfast: false, lunch: false, dinner: false },
//   //       }));
//   //     }
//   //   },
//   //   [formData]
//   // );

//   // Обработчик для продления бронирования

//   const handleExtendChange = useCallback((e) => {
//     const { name, value } = e.target;
//     setFormDataExtend((prevState) => ({ ...prevState, [name]: value }));
//   }, []);

//   const [updateRequestRelay] = useMutation(UPDATE_REQUEST_RELAY, {
//     context: {
//       headers: {
//         Authorization: `Bearer ${token}`,
//       },
//     },
//   });

//   const [cancelRequestMutation] = useMutation(CANCEL_REQUEST, {
//     context: {
//       headers: {
//         Authorization: `Bearer ${token}`,
//       },
//     },
//   });

//   const handleCancelRequest = async () => {
//     try {
//       // Отправка запроса с правильным ID заявки
//       const response = await cancelRequestMutation({
//         variables: {
//           cancelRequestId: chooseRequestID,
//         },
//       });
//       // console.log("Заявка успешно отменена", response);
//     } catch (error) {
//       console.error("Ошибка при отмене заявки:", JSON.stringify(error));
//     }
//   };
//   // console.log(formData);

//   // const [handleExtend] = useMutation(SAVE_HANDLE_EXTEND_MUTATION, {
//   //   context: {
//   //     headers: {
//   //       Authorization: `Bearer ${token}`,
//   //     },
//   //   },
//   // });

//   const formatDateTime = (date, time) => {
//     if (!date || !time) {
//       // console.error("Некорректные данные для даты или времени:", {
//       //   date,
//       //   time,
//       // });
//       return null;
//     }
//     return new Date(`${date}T${time}:00+00:00`);
//   };

//   const departureTime = formatDateTime(
//     formDataExtend?.departureDate,
//     formDataExtend?.departureTime
//   );
//   const arrivalTime = formatDateTime(
//     formDataExtend?.arrivalDate,
//     formDataExtend?.arrivalTime
//   );

//   // console.log("departureTime:", departureTime);
//   // console.log("arrivalTime:", arrivalTime);
//   // console.log("formData.arrival:", formData?.arrival);
//   // console.log("formData.departure:", formData?.departure);

//   const newStatus =
//     formData?.departure && new Date(formData.departure) < departureTime
//       ? "extended"
//       : formData?.departure && new Date(formData.departure) > departureTime
//         ? "reduced"
//         : formData?.arrival && new Date(formData.arrival) > arrivalTime
//           ? "earlyStart"
//           : formData?.arrival && new Date(formData.arrival) < arrivalTime
//             ? "reduced"
//             : formData?.status;

//   // console.log("newStatus:", newStatus);
//   const [isLoading, setIsLoading] = useState(false);

//   const handleExtendChangeRequest = async () => {
//     if (isEditing) {
//       setIsLoading(true);
//       try {
//         // Определяем, что изменилось
//         const hotelIdChanged = canChangeHotel && selectedHotelId && selectedHotelId !== formData.hotelId;
//         const roomOrPlaceChanged = canChangeHotel &&
//           selectedRoomId &&
//           (selectedRoomId !== formData.hotelChess?.room?.id ||
//             selectedPlace !== formData.hotelChess?.place);
//         const hotelRoomChangeAllowed = canChangeHotel && selectedHotelId && selectedRoomId;

//         // Подготовка input для UPDATE_REQUEST_RELAY
//         const requestInput = {
//           arrival: `${formDataExtend.arrivalDate}T${formDataExtend.arrivalTime}:00+00:00`,
//           departure: `${formDataExtend.departureDate}T${formDataExtend.departureTime}:00+00:00`,
//           status:
//             formData.status === "opened" || formData.status === "created"
//               ? formData.status
//               : newStatus,
//         };

//         // Добавляем изменения гостиницы/номера/места только при валидном выборе
//         if (hotelRoomChangeAllowed && (hotelIdChanged || roomOrPlaceChanged)) {
//           if (!canChangeHotel) {
//             alert("Невозможно сохранить изменения: дата заезда уже наступила.");
//             setIsLoading(false);
//             return;
//           }

//           if (hotelIdChanged) {
//             requestInput.hotelId = selectedHotelId;
//           }

//           if (roomOrPlaceChanged) {
//             const selectedRoom = rooms.find((room) => room.id === selectedRoomId);
//             requestInput.roomId = selectedRoomId;
//             // requestInput.place = selectedRoom?.places > 1 ? Number(selectedPlace) : null;
//           }

//           if (formData?.person?.id) {
//             requestInput.personId = formData.person.id;
//           }
//         }

//         // Сохранение изменений дат и hotelId (если изменился)
//         await updateRequestRelay({
//           variables: {
//             updateRequestId: chooseRequestID,
//             input: requestInput,
//           },
//         });

//         alert(
//           user?.airlineId && formData.status !== "created"
//             ? "Запрос отправлен, можете посмотреть в комментариях."
//             : "Изменения сохранены"
//         );
//         setFormDataExtend((prev) => ({
//           ...prev,
//           departureDate:
//             user?.airlineId && formData.status !== "created"
//               ? parseDateTime(formData.departure).date
//               : "",
//           departureTime:
//             user?.airlineId && formData.status !== "created"
//               ? parseDateTime(formData.departure).time
//               : "",
//           arrivalDate:
//             user?.airlineId && formData.status !== "created"
//               ? parseDateTime(formData.arrival).date
//               : "",
//           arrivalTime:
//             user?.airlineId && formData.status !== "created"
//               ? parseDateTime(formData.arrival).time
//               : "",
//         }));
//         await refetch(); // Обновляем данные после изменения
//       } catch (error) {
//         console.error("Ошибка при сохранении:", error);
//         if (
//           String(error).startsWith(
//             "ApolloError: Невозможно разместить заявку: пересечение с заявкой"
//           )
//         ) {
//           alert("Невозможно разместить заявку: пересечение с другой заявкой");
//           setFormDataExtend((prev) => ({
//             departureDate: formData.departure
//               ? parseDateTime(formData.departure).date
//               : "",
//             departureTime: formData.departure
//               ? parseDateTime(formData.departure).time
//               : "",
//             arrivalDate: formData.arrival
//               ? parseDateTime(formData.arrival).date
//               : "",
//             arrivalTime: formData.arrival
//               ? parseDateTime(formData.arrival).time
//               : "",
//           }));
//         } else if (
//           String(error).startsWith(
//             "ApolloError: Error: Невозможно разместить заявку: свободных мест нет"
//           )
//         ) {
//           alert("Свободных мест в этом номере нет");
//         }
//       } finally {
//         setIsLoading(false);
//       }
//     }
//     setIsEditing(!isEditing);
//   };

//   // Обработчики для изменения гостиницы и номера
//   const handleHotelChange = useCallback((event, newValue) => {
//     if (newValue) {
//       // newValue теперь объект гостиницы, а не строка
//       setSelectedHotelId(newValue.id);
//       setSelectedRoomId(null);
//       setSelectedPlace(null);
//     } else {
//       setSelectedHotelId(null);
//       setSelectedRoomId(null);
//       setSelectedPlace(null);
//     }
//   }, []);

//   const handleRoomChange = useCallback((event, newValue) => {
//     if (newValue) {
//       // newValue теперь объект номера, а не строка
//       setSelectedRoomId(newValue.id);
//       // Если номер двухместный (type === 2), нужно выбрать место
//       if (newValue.type === 2 && !selectedPlace) {
//         setSelectedPlace(1); // По умолчанию место 1
//       } else if (newValue.type !== 2) {
//         setSelectedPlace(null);
//       }
//     } else {
//       setSelectedRoomId(null);
//       setSelectedPlace(null);
//     }
//   }, [selectedPlace]);

//   // console.log(formDataExtend);

//   // Клик вне боковой панели закрывает её
//   useEffect(() => {
//     const handleClickOutside = (event) => {
//       if (showDelete) return;
//       if (sidebarRef.current && !sidebarRef.current.contains(event.target)) {
//         closeButton();
//       }
//     };

//     if (show) document.addEventListener("mousedown", handleClickOutside);
//     else document.removeEventListener("mousedown", handleClickOutside);

//     return () => document.removeEventListener("mousedown", handleClickOutside);
//   }, [show, closeButton, showDelete]);

//   // Вспомогательные функции для преобразования данных
//   // const getJsonParce = (data) => JSON.parse(data);
//   // const formatDate = (dateString) => dateString.split("-").reverse().join(".");

//   // Функция для генерации HTML-описания для логов
//   // function getLogDescription(log, logsData) {
//   //   switch (log.action) {
//   //     case "create_request":
//   //       return log.description
//   //     case "updateHotelChess":
//   //       return `
//   //               Пользователь <span>${log.user.name}</span>
//   //               создал бронь в отель <span>${logsData.hotel.name}</span>
//   //               для <span>${logsData.person.position} ${logsData.person.name
//   //         }</span>
//   //               в номер <span>${getJsonParce(log.newData).room}</span>
//   //               место <span>${getJsonParce(log.newData).place}</span>
//   //               c <span>${formatDate(getJsonParce(log.newData).start)}</span>
//   //               по <span>${formatDate(getJsonParce(log.newData).end)}</span>
//   //           `;
//   //     case "open_request":
//   //       return `
//   //               Пользователь <span>${log.user.name}</span>
//   //               первый открыл заявку <br /> <span>№${getJsonParce(log.description).requestNumber
//   //         }</span>
//   //           `;
//   //     default:
//   //       return "Неизвестное действие";
//   //   }
//   // }
//   // Инициализируем mealData с пустым массивом

//   const [mealData, setMealData] = useState([]);

//   // Обновляем mealData, когда formData меняется и данные mealPlan доступны
//   useEffect(() => {
//     if (formData?.mealPlan?.dailyMeals) {
//       setMealData(formData?.mealPlan?.dailyMeals);
//     }
//   }, [formData, show]);

//   // console.log(mealData)
//   // console.log(formData?.mealPlan?.dailyMeals)
//   // console.log(mealData === formData?.mealPlan?.dailyMeals)

//   // Изменение в питании
//   const handleMealChange = (index, mealType, value) => {
//     setMealData((prevMeals) => {
//       const updatedMeals = [...prevMeals];
//       updatedMeals[index] = {
//         ...updatedMeals[index],
//         [mealType]: Number(value),
//       };
//       return updatedMeals;
//     });
//   };

//   // Сохранение изменений в питании
//   const [saveMeals] = useMutation(SAVE_MEALS_MUTATION, {
//     context: {
//       headers: {
//         Authorization: `Bearer ${token}`,
//         "Apollo-Require-Preflight": "true",
//       },
//     },
//   });

//   const cleanedMealData = mealData.map(({ __typename, ...rest }) => rest);

//   const handleSaveMeals = async () => {
//     if (isEditing2) {
//       setIsLoading(true);
//       try {
//         await saveMeals({
//           variables: {
//             input: {
//               requestId: chooseRequestID,
//               dailyMeals: cleanedMealData,
//             },
//           },
//         });
//         await refetch(); // Обновляем данные после сохранения изменений в питании
//         alert("Изменения сохранены");
//       } catch (error) {
//         console.error("Ошибка при сохранении:", error);
//         alert("Ошибка при сохранении");
//       } finally {
//         setIsLoading(false);
//       }
//     }
//     setIsEditing2(!isEditing2);
//   };

//   // Изменение архивного
//   const [changeToArchive] = useMutation(CHANGE_TO_ARCHIVE, {
//     context: {
//       headers: {
//         Authorization: `Bearer ${token}`,
//       },
//     },
//   });

//   const handleСhangeToArchive = async () => {
//     setIsLoading(true);

//     try {
//       await changeToArchive({
//         variables: {
//           archivingRequstId: chooseRequestID,
//         },
//       });
//       alert("Изменения сохранены");
//       await refetch();
//       onClose();
//     } catch (error) {
//       console.error("Ошибка при сохранении:", error);
//       alert("Ошибка при сохранении");
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   const { data: airlineData, refetch: airlineRefetch } = useQuery(GET_AIRLINE, {
//     context: {
//       headers: {
//         Authorization: `Bearer ${token}`,
//       },
//     },
//     variables: { airlineId: formData?.airline?.id },
//   });

//   // Запрос для получения списка гостиниц
//   const { data: hotelsData, loading: hotelsLoading } = useQuery(
//     GET_HOTELS_RELAY,
//     {
//       context: {
//         headers: {
//           Authorization: `Bearer ${token}`,
//         },
//       },
//     }
//   );

//   // Запрос для получения номеров выбранной гостиницы
//   const {
//     data: roomsData,
//     loading: roomsLoading,
//     refetch: refetchRooms,
//   } = useQuery(GET_HOTEL_ROOMS, {
//     context: {
//       headers: {
//         Authorization: `Bearer ${token}`,
//       },
//     },
//     variables: { hotelId: selectedHotelId },
//     skip: !selectedHotelId,
//     fetchPolicy: "network-only",
//   });

//   const {
//     loading: airlinePositionsLoading,
//     error: airlinePositionsError,
//     data: airlinePositionsData,
//   } = useQuery(GET_AIRLINE_POSITIONS, {
//     context: {
//       headers: {
//         Authorization: `Bearer ${token}`,
//       },
//     },
//   });

//   const [positions, setPositions] = useState([]);

//   const [airlineStaff, setAirlineStaff] = useState();
//   const [selectedEmployee, setSelectedEmployee] = useState(null);

//   useEffect(() => {
//     if (airlineData) {
//       setAirlineStaff(airlineData?.airline?.staff);
//     }
//   }, [airlineData]);

//   useEffect(() => {
//     if (airlinePositionsData) {
//       setPositions(airlinePositionsData?.getAirlinePositions);
//     }
//   }, [airlinePositionsData]);

//   // Инициализация списка гостиниц
//   useEffect(() => {
//     if (hotelsData && hotelsData.hotels?.hotels) {
//       const filteredHotels = hotelsData.hotels.hotels.filter(
//         (h) => h.information?.city?.trim() === formData?.airport?.city?.trim()
//       )
//       setHotels(filteredHotels);
//     }
//   }, [hotelsData, formData]);

//   // Инициализация списка номеров при выборе гостиницы
//   useEffect(() => {
//     if (roomsData && roomsData.hotel?.rooms) {
//       setRooms(roomsData.hotel.rooms);
//     } else {
//       setRooms([]);
//     }
//   }, [roomsData, selectedHotelId]);


//   // Инициализация значений гостиницы и номера при загрузке заявки
//   useEffect(() => {
//     if (formData && show) {
//       if (formData.hotel?.id) {
//         setSelectedHotelId(formData.hotel.id);
//       }
//       if (formData.hotelChess?.room?.id) {
//         setSelectedRoomId(formData.hotelChess.room.id);
//         setSelectedPlace(formData.hotelChess.place || null);
//       }
//     }
//   }, [formData, show]);

//   // Проверка, можно ли изменять гостиницу и номер (дата заезда еще не наступила)
//   const canChangeHotel = useMemo(() => {
//     if (!formData?.arrival) return false;
//     const arrivalDate = new Date(formData.arrival);
//     const now = new Date();
//     return arrivalDate > now;
//   }, [formData?.arrival]);

//   // Динамические опции для выбора места в номере на основе количества мест
//   const placeOptions = useMemo(() => {
//     const selectedRoom = rooms.find((r) => r.id === selectedRoomId);
//     if (!selectedRoom || !selectedRoom.places || selectedRoom.places <= 1) {
//       return [];
//     }
//     return Array.from({ length: selectedRoom.places }, (_, i) => String(i + 1));
//   }, [rooms, selectedRoomId]);

//   const handleSaveChanges = () => {
//     setIsLoading(true);

//     if (!chooseRequestID || selectedEmployee === null) {
//       alert("Пожалуйста, выберите сотрудника.");
//       return;
//     }

//     updateRequestRelay({
//       variables: {
//         updateRequestId: chooseRequestID,
//         input: {
//           personId: selectedEmployee?.id,
//         },
//       },
//     })
//       .then((res) => {
//         // console.log("Request updated:", res);
//         alert("Изменения сохранены");
//         setSelectedEmployee(null);
//         setNewStaffId(null);
//         // При необходимости можно выполнить refetch() или обновить локальные данные
//         refetch();
//         setIsLoading(false);
//       })
//       .catch((err) => {
//         console.error("Ошибка обновления заявки:", err);
//         // console.log(selectedEmployee);

//         alert("Ошибка обновления заявки");
//         setSelectedEmployee(null);
//         setNewStaffId(null);
//         setIsLoading(false);
//       });
//   };

//   const handleUpdateRequest = async () => {
//     // Проверяем, можно ли редактировать гостиницу/номер при включении режима редактирования
//     if (!isEditing && !canChangeHotel) {
//       alert("Невозможно изменить гостиницу и номер: дата заезда уже наступила.");
//       return;
//     }

//     if (isEditing) {
//       await handleExtendChangeRequest();
//       await refetch();
//       await handleSaveMeals();
//       await refetch();
//     }
//     setIsEditing(!isEditing);
//   };

//   const [newStaffId, setNewStaffId] = useState(null);
//   const [showAddStaff, setShowAddStaff] = useState(false);
//   const toggleAddStaff = () => setShowAddStaff((prev) => !prev);

//   useEffect(() => {
//     if (newStaffId) {
//       setSelectedEmployee(newStaffId);
//     }
//   }, [newStaffId]);

//   const [separator, setSeparator] = useState("airline");
//   const [isHaveTwoChats, setIsHaveTwoChats] = useState();

//   useEffect(() => {
//     setSeparator("airline");
//   }, [show]);

//   // console.log(newStaffId);

//   return (
//     <>
//       {formData && (
//         <Sidebar show={show} sidebarRef={sidebarRef}>
//           <div className={classes.requestTitle}>
//             <div className={classes.requestTitle_name}>
//               {formData.requestNumber}
//               {/* {(formData.status == "done" ||
//                 formData.status == "extended" ||
//                 formData.status == "reduced" ||
//                 formData.status == "transferred" ||
//                 formData.status == "earlyStart") &&
//                 // handleCancelRequest &&
//                 !user?.airlineId && (
//                   <button
//                     className={classes.canceledButton}
//                     onClick={() => {
//                       // onClose();
//                       openDeleteComponent();
//                       // handleCancelRequest(chooseRequestID);
//                     }}
//                   >
//                     Отменить
//                   </button>
//                 )} */}
//             </div>
//             <div className={classes.requestTitle_close} onClick={closeButton}>
//               <AdditionalMenuIcon />
//               <CloseIcon />
//             </div>
//           </div>
//           {isLoading ? (
//             <MUILoader loadSize={"50px"} fullHeight={"75vh"} />
//           ) : (
//             <>
//               <div className={classes.tabs}>
//                 <div
//                   className={`${classes.tab} ${activeTab === "Общая" ? classes.activeTab : ""
//                     }`}
//                   onClick={() => handleTabChange("Общая")}
//                 >
//                   Общая
//                 </div>
//                 {formData.status !== "created" &&
//                   formData.status !== "opened" && (
//                     <div
//                       className={`${classes.tab} ${activeTab === "Питание" ? classes.activeTab : ""
//                         }`}
//                       onClick={() => handleTabChange("Питание")}
//                     >
//                       Питание
//                     </div>
//                   )}
//                 {canChatTab && (
//                   <div
//                     className={`${classes.tab} ${activeTab === "Комментарии" ? classes.activeTab : ""
//                       }`}
//                     style={{ position: "relative" }}
//                     onClick={() => handleTabChange("Комментарии")}
//                   >
//                     Комментарии
//                     {formData?.chat?.some(
//                       (chat) =>
//                         chat.unreadMessagesCount > 0 &&
//                         ((user.hotelId && chat.hotelId === user.hotelId) ||
//                           (user.airlineId &&
//                             chat.airlineId === user.airlineId) ||
//                           (!user.hotelId && !user.airlineId))
//                     ) && <div className={classes.unreadMessages}></div>}
//                     {/* {console.log(formData?.chat)} */}
//                   </div>
//                 )}
//                 <div
//                   className={`${classes.tab} ${activeTab === "История" ? classes.activeTab : ""
//                     }`}
//                   onClick={() => handleTabChange("История")}
//                 >
//                   История
//                 </div>

//                 {!isAirlineAdmin(user)
//                   ? // && handleCancelRequest
//                   formData.status !== "created" &&
//                   formData.status !== "opened" &&
//                   formData.status !== "canceled" && (
//                     <div className={classes.shahmatka_icon}>
//                       <Link
//                         to={`/hotels/${formData.hotelId}/${formData.id}`}
//                         onClick={() => {
//                           localStorage.setItem("selectedTab", 0);
//                           closeButton();
//                         }}
//                         title="Шахматка"
//                       >
//                         <img src="/table.png" alt="" />
//                       </Link>
//                     </div>
//                   )
//                   : null}
//               </div>

//               <div
//                 className={classes.requestMiddle}
//                 style={{
//                   height:
//                     (activeTab !== "Комментарии" &&
//                       activeTab !== "История" &&
//                       formData.status !== "created" &&
//                       formData.status !== "canceled" &&
//                       // formData.status !== "archiving" &&
//                       formData.status !== "archived" &&
//                       (accessMenu
//                         ? user?.airlineId &&
//                         hasAccessMenu(accessMenu, "requestUpdate")
//                         : true))
//                       ? "calc(100vh - 227px)"
//                       :
//                       (activeTab !== "Комментарии" &&
//                         activeTab !== "История" &&
//                         formData.status !== "created" &&
//                         formData.status !== "canceled" &&
//                         // formData.status !== "archiving" &&
//                         formData.status !== "archived" &&
//                         (accessMenu
//                           ? !user?.airlineId &&
//                           (dispatcherCanUpdate ??
//                             hasAccessMenu(accessMenu, "requestUpdate"))
//                           : true))
//                         ? "calc(100vh - 230px)"
//                         : null,
//                 }}
//               >
//                 {/* Вкладка "Общая" */}
//                 {activeTab === "Общая" && (
//                   <div className={classes.requestData}>
//                     {/* Информация о сотруднике */}
//                     {formData.person ? (
//                       <>
//                         <div className={classes.requestDataTitle}>
//                           Информация о сотруднике
//                         </div>
//                         <div className={classes.requestDataInfo}>
//                           <div className={classes.requestDataInfo_title}>
//                             Авиакомпания
//                           </div>
//                           <div className={classes.requestDataInfo_desc}>
//                             {formData.airline.name}
//                           </div>
//                         </div>
//                         <div className={classes.requestDataInfo}>
//                           <div className={classes.requestDataInfo_title}>
//                             ФИО
//                           </div>
//                           <div className={classes.requestDataInfo_desc}>
//                             {formData?.person?.name}
//                           </div>
//                         </div>
//                         <div className={classes.requestDataInfo}>
//                           <div className={classes.requestDataInfo_title}>
//                             Должность
//                           </div>
//                           <div className={classes.requestDataInfo_desc}>
//                             {formData?.person?.position?.name}
//                           </div>
//                         </div>
//                         <div className={classes.requestDataInfo}>
//                           <div className={classes.requestDataInfo_title}>
//                             Пол
//                           </div>
//                           <div className={classes.requestDataInfo_desc}>
//                             {formData?.person?.gender || "—"}
//                           </div>
//                         </div>
//                         <div className={classes.requestDataInfo}>
//                           <div className={classes.requestDataInfo_title}>
//                             Номер телефона
//                           </div>
//                           <div className={classes.requestDataInfo_desc}>
//                             {formData?.person?.number}
//                           </div>
//                         </div>
//                       </>
//                     ) : !user?.hotelId && formData.status !== "canceled" ? (
//                       <>
//                         {/* Если сотрудник не задан, предлагаем выбрать */}
//                         <div className={classes.staffWrapper}>
//                           <label>Добавьте сотрудника авиакомпании</label>
//                           <div
//                             className={classes.addStaff}
//                             onClick={toggleAddStaff}
//                           >
//                             <img src="/plus.png" alt="" />
//                           </div>
//                         </div>
//                         <MUIAutocompleteColor
//                           dropdownWidth="100%"
//                           label="Введите сотрудника"
//                           // Передаём исходный массив объектов сотрудников
//                           options={airlineStaff}
//                           // getOptionLabel правильно формирует строку, даже если option – объект
//                           getOptionLabel={(option) =>
//                             option
//                               ? `${option.name || ""} ${option.position?.name
//                                 } ${option.gender}`.trim()
//                               : ""
//                           }
//                           // Если нужно кастомное раскрашивание, используйте renderOption (с isColor)
//                           renderOption={(optionProps, option) => {
//                             // Формируем строку для отображения
//                             const labelText = `${option.name || ""} ${option.position?.name
//                               } ${option.gender}`.trim();
//                             // Разбиваем строку по пробелам
//                             const words = labelText.split(". ");
//                             return (
//                               <li {...optionProps} key={option.id}>
//                                 {words.map((word, index) => (
//                                   <span
//                                     key={index}
//                                     style={{
//                                       color:
//                                         index === 0
//                                           ? "black"
//                                           : index === 1
//                                             ? "gray"
//                                             : "gray",
//                                       marginRight: "4px",
//                                     }}
//                                   >
//                                     {word}
//                                   </span>
//                                 ))}
//                               </li>
//                             );
//                           }}
//                           // Значение контролируется объектом; если person не найден, возвращаем null
//                           value={
//                             airlineStaff?.find(
//                               (person) => person.id === selectedEmployee?.id
//                             ) || null
//                           }
//                           onChange={(event, newValue) => {
//                             setSelectedEmployee(newValue);
//                             // setFormData((prevFormData) => ({
//                             //   ...prevFormData,
//                             //   personId: newValue?.id || "",
//                             // }));
//                             // setIsEdited(true);
//                           }}
//                         />
//                         <Button onClick={handleSaveChanges}>
//                           Добавить сотрудника
//                         </Button>
//                       </>
//                     ) : null}

//                     {/* Информация о питании */}
//                     <div className={classes.requestDataTitle}>Питание</div>
//                     <div className={classes.requestDataInfo}>
//                       <div className={classes.requestDataInfo_title}>
//                         Питание
//                       </div>
//                       <div className={classes.requestDataInfo_desc}>
//                         {formData?.mealPlan?.included
//                           ? "Включено"
//                           : "Не включено"}
//                       </div>
//                     </div>

//                     {formData?.mealPlan?.included &&
//                       formData.status !== "created" &&
//                       formData.status !== "opened" && (
//                         <>
//                           <div className={classes.requestDataInfo}>
//                             <div className={classes.requestDataInfo_title}>
//                               Завтрак
//                             </div>
//                             <div className={classes.requestDataInfo_desc}>
//                               {formData.mealPlan.breakfast || "—"}
//                             </div>
//                           </div>
//                           <div className={classes.requestDataInfo}>
//                             <div className={classes.requestDataInfo_title}>
//                               Обед
//                             </div>
//                             <div className={classes.requestDataInfo_desc}>
//                               {formData.mealPlan.lunch || "—"}
//                             </div>
//                           </div>
//                           <div className={classes.requestDataInfo}>
//                             <div className={classes.requestDataInfo_title}>
//                               Ужин
//                             </div>
//                             <div className={classes.requestDataInfo_desc}>
//                               {formData.mealPlan.dinner || "—"}
//                             </div>
//                           </div>
//                         </>
//                       )}

//                     {/* Информация о заявке */}
//                     {formData.status !== "created" &&
//                       formData.status !== "opened" && (
//                         <>
//                           <div className={classes.requestDataTitle}>
//                             Информация о заявке
//                           </div>
//                           <div className={classes.requestDataInfo}>
//                             <div className={classes.requestDataInfo_title}>
//                               Номер заявки
//                             </div>
//                             <div className={classes.requestDataInfo_desc}>
//                               {formData.requestNumber}
//                             </div>
//                           </div>
//                           <div className={classes.requestDataInfo}>
//                             <div className={classes.requestDataInfo_title}>
//                               Город
//                             </div>
//                             <div className={classes.requestDataInfo_desc}>
//                               {formData?.airport?.city}
//                             </div>
//                           </div>
//                           {isEditing && canChangeHotel ? (
//                             <>
//                               <div className={classes.requestDataInfo}>
//                                 <div className={classes.requestDataInfo_title}>
//                                   Гостиница
//                                 </div>
//                                 <MUIAutocompleteColor
//                                   dropdownWidth="60%"
//                                   label="Введите гостиницу"
//                                   options={hotels}
//                                   getOptionLabel={(option) =>
//                                     option
//                                       ? `${option.name}, город: ${option?.information?.city || "не указан"}`.trim()
//                                       : ""
//                                   }
//                                   renderOption={(optionProps, option) => {
//                                     const cityPart = `, город: ${option?.information?.city || "не указан"}`;
//                                     const labelText = `${option.name}${cityPart}`.trim();
//                                     const words = labelText.split(", ");
//                                     return (
//                                       <li {...optionProps} key={option.id}>
//                                         {words.map((word, index) => (
//                                           <span
//                                             key={index}
//                                             style={{
//                                               color: index === 0 ? "black" : "gray",
//                                               marginRight: 4,
//                                             }}
//                                           >
//                                             {word}
//                                           </span>
//                                         ))}
//                                       </li>
//                                     );
//                                   }}
//                                   value={
//                                     hotels.find((h) => h.id === selectedHotelId) || null
//                                   }
//                                   onChange={handleHotelChange}
//                                   isDisabled={!isEditing}
//                                 />
//                               </div>
//                               {selectedHotelId && (
//                                 <>
//                                   <div className={classes.requestDataInfo}>
//                                     <div className={classes.requestDataInfo_title}>
//                                       Номер
//                                     </div>
//                                     {roomsLoading ? (
//                                       <MUILoader loadSize={"20px"} />
//                                     ) : (
//                                       <MUIAutocompleteColor
//                                         dropdownWidth="60%"
//                                         label="Введите номер"
//                                         options={rooms}
//                                         getOptionLabel={(option) =>
//                                           option
//                                             ? `${option.name}${option.roomKind?.name ? `, ${option.roomKind.name}` : ""}`.trim()
//                                             : ""
//                                         }
//                                         renderOption={(optionProps, option) => {
//                                           const kindPart = option.roomKind?.name ? `, ${option.roomKind.name}` : "";
//                                           const labelText = `${option.name}${kindPart}`.trim();
//                                           const words = labelText.split(", ");
//                                           return (
//                                             <li {...optionProps} key={option.id}>
//                                               {words.map((word, index) => (
//                                                 <span
//                                                   key={index}
//                                                   style={{
//                                                     color: index === 0 ? "black" : "gray",
//                                                     marginRight: 4,
//                                                   }}
//                                                 >
//                                                   {word}
//                                                 </span>
//                                               ))}
//                                             </li>
//                                           );
//                                         }}
//                                         value={
//                                           rooms.find((r) => r.id === selectedRoomId) || null
//                                         }
//                                         onChange={handleRoomChange}
//                                         isDisabled={!isEditing}
//                                       />
//                                     )}
//                                   </div>
//                                   {/* {selectedRoomId && (
//                                     <>
//                                       {rooms.find((r) => r.id === selectedRoomId)
//                                         ?.places > 1 && (
//                                         <>
//                                           <div className={classes.requestDataInfo}>
//                                             <div className={classes.requestDataInfo_title}>
//                                               Место в номере
//                                             </div>
//                                             <MUIAutocomplete
//                                               dropdownWidth="60%"
//                                               label="Выберите место"
//                                               options={placeOptions}
//                                               value={selectedPlace ? String(selectedPlace) : ""}
//                                               onChange={(event, newValue) => {
//                                                 setSelectedPlace(newValue ? parseInt(newValue) : null);
//                                               }}
//                                               disabled={!isEditing}
//                                             />
//                                           </div>
//                                         </>
//                                       )}
//                                     </>
//                                   )} */}
//                                 </>
//                               )}
//                             </>
//                           ) : (
//                             <>
//                               <div className={classes.requestDataInfo}>
//                                 <div className={classes.requestDataInfo_title}>
//                                   Гостиница
//                                 </div>
//                                 <div className={classes.requestDataInfo_desc}>
//                                   {formData.hotel?.name || "—"}
//                                 </div>
//                               </div>
//                               <div className={classes.requestDataInfo}>
//                                 <div className={classes.requestDataInfo_title}>
//                                   Номер комнаты
//                                 </div>
//                                 <div className={classes.requestDataInfo_desc}>
//                                   {formData.hotelChess?.room?.name || "—"}
//                                 </div>
//                               </div>
//                             </>
//                           )}
//                           <div className={classes.requestDataInfo}>
//                             <div className={classes.requestDataInfo_title}>
//                               Заезд
//                             </div>
//                             <div className={classes.requestDataInfo_desc}>
//                               {convertToDate(formData.arrival)} -{" "}
//                               {convertToDate(formData.arrival, true)}
//                             </div>
//                           </div>
//                           <div className={classes.requestDataInfo}>
//                             <div className={classes.requestDataInfo_title}>
//                               Выезд
//                             </div>
//                             <div className={classes.requestDataInfo_desc}>
//                               {convertToDate(formData.departure)} -{" "}
//                               {convertToDate(formData.departure, true)}
//                             </div>
//                           </div>
//                         </>
//                       )}

//                     {/* Продление */}
//                     {formData.status !== "archived" &&
//                       // formData.status !== "created" &&
//                       // formData.status !== "opened" &&
//                       formData.status !== "canceled" && (
//                         // !user?.hotelId &&
//                         // formData.status !== "archiving" &&
//                         <>
//                           <div className={classes.requestDataTitle}>
//                             {user?.airlineId &&
//                               (formData.status !== "created" ||
//                                 formData.status === "opened")
//                               ? "Запрос на изменение даты"
//                               : "Изменение даты"}
//                           </div>
//                           <label>Заезд</label>
//                           <div className={classes.reis_info}>
//                             <input
//                               type="date"
//                               name="arrivalDate"
//                               value={formDataExtend.arrivalDate}
//                               onChange={handleExtendChange}
//                               placeholder="Дата"
//                               disabled={
//                                 formData.status === "created" ||
//                                   formData.status === "opened"
//                                   ? false
//                                   : !isEditing
//                               }
//                             />
//                             <input
//                               type="time"
//                               name="arrivalTime"
//                               value={formDataExtend.arrivalTime}
//                               onChange={handleExtendChange}
//                               placeholder="Время"
//                               disabled={
//                                 formData.status === "created" ||
//                                   formData.status === "opened"
//                                   ? false
//                                   : !isEditing
//                               }
//                             />
//                           </div>
//                           <label>Выезд</label>
//                           <div className={classes.reis_info}>
//                             {/* <input
//                           type="text"
//                           name="departureName"
//                           value={formDataExtend.departureName}
//                           onChange={handleExtendChange}
//                           placeholder="Номер рейса"
//                         /> */}
//                             <input
//                               type="date"
//                               name="departureDate"
//                               value={formDataExtend.departureDate}
//                               onChange={handleExtendChange}
//                               placeholder="Дата"
//                               disabled={
//                                 formData.status === "created" ||
//                                   formData.status === "opened"
//                                   ? false
//                                   : !isEditing
//                               }
//                             />
//                             <input
//                               type="time"
//                               name="departureTime"
//                               value={formDataExtend.departureTime}
//                               onChange={handleExtendChange}
//                               placeholder="Время"
//                               disabled={
//                                 formData.status === "created" ||
//                                   formData.status === "opened"
//                                   ? false
//                                   : !isEditing
//                               }
//                             />
//                           </div>
//                           {(formData.status === "created" ||
//                             formData.status === "opened") && (
//                               <Button onClick={handleExtendChangeRequest}>
//                                 Изменить даты
//                               </Button>
//                             )}
//                         </>
//                       )}

//                     {/* Продление */}
//                     {formData.status == "archiving" &&
//                       formData.status !== "opened" &&
//                       isDispatcherAdmin(user) && isEditing && (
//                         <Button onClick={handleСhangeToArchive}>
//                           Отправить в архив
//                         </Button>
//                       )}
//                   </div>
//                 )}
//                 {/* Вкладка "Питание" */}
//                 {activeTab === "Питание" &&
//                   formData.status !== "created" &&
//                   formData.status !== "opened" && (
//                     <div className={classes.requestData}>
//                       {mealData.length === 0 ? (
//                         <div className={classes.requestDataTitle}>
//                           Питание отсутствует
//                         </div>
//                       ) : (
//                         <>
//                           <div className={classes.requestDataTitle}>
//                             Питание сотрудника
//                           </div>

//                           {/* Шапка */}
//                           <div
//                             className={
//                               classes.mealRow + " " + classes.mealHeader
//                             }
//                           >
//                             <div /> {/* под дату */}
//                             <div>З</div>
//                             <div>О</div>
//                             <div>У</div>
//                           </div>

//                           {/* Строки с данными */}
//                           {mealData.map((dailyMeal, index) => (
//                             <div key={index} className={classes.mealRow}>
//                               <div className={classes.mealInfoDate}>
//                                 {convertToDate(dailyMeal.date)}
//                               </div>

//                               <input
//                                 type="number"
//                                 min={0}
//                                 value={dailyMeal.breakfast}
//                                 disabled={
//                                   formData.status === "archived" ||
//                                   formData.status === "canceled" ||
//                                   !isEditing2
//                                 }
//                                 onChange={(e) =>
//                                   handleMealChange(
//                                     index,
//                                     "breakfast",
//                                     e.target.value
//                                   )
//                                 }
//                               />
//                               <input
//                                 type="number"
//                                 min={0}
//                                 value={dailyMeal.lunch}
//                                 disabled={
//                                   formData.status === "archived" ||
//                                   formData.status === "canceled" ||
//                                   !isEditing2
//                                 }
//                                 onChange={(e) =>
//                                   handleMealChange(
//                                     index,
//                                     "lunch",
//                                     e.target.value
//                                   )
//                                 }
//                               />
//                               <input
//                                 type="number"
//                                 min={0}
//                                 value={dailyMeal.dinner}
//                                 disabled={
//                                   formData.status === "archived" ||
//                                   formData.status === "canceled" ||
//                                   !isEditing2
//                                 }
//                                 onChange={(e) =>
//                                   handleMealChange(
//                                     index,
//                                     "dinner",
//                                     e.target.value
//                                   )
//                                 }
//                               />
//                             </div>
//                           ))}
//                         </>
//                       )}

//                       {/* {formData.status !== "archived" &&
//                         formData.status !== "canceled" && (
//                           <Button onClick={handleSaveMeals}>Сохранить</Button>
//                         )} */}
//                     </div>
//                     // <div className={classes.requestData}>
//                     //   <div className={classes.requestDataTitle}>
//                     //     Питание сотрудника
//                     //   </div>

//                     //   {mealData.map((dailyMeal, index) => (
//                     //     <div key={index} className={classes.mealInfo}>
//                     //       <div className={classes.mealInfoDate}>
//                     //         {convertToDate(dailyMeal.date)}
//                     //       </div>
//                     //       <div className={classes.requestDataInfo}>
//                     //         <div className={classes.requestDataInfo_title}>
//                     //           Завтрак
//                     //         </div>
//                     //         <input
//                     //           type="number"
//                     //           min={0}
//                     //           name="breakfastCount"
//                     //           placeholder="Количество"
//                     //           value={dailyMeal.breakfast}
//                     //           disabled={
//                     //             (formData.status === "archived" ||
//                     //               formData.status === "canceled") &&
//                     //             true
//                     //           }
//                     //           onChange={(e) =>
//                     //             handleMealChange(
//                     //               index,
//                     //               "breakfast",
//                     //               e.target.value
//                     //             )
//                     //           }
//                     //         />
//                     //       </div>
//                     //       <div className={classes.requestDataInfo}>
//                     //         <div className={classes.requestDataInfo_title}>
//                     //           Обед
//                     //         </div>
//                     //         <input
//                     //           type="number"
//                     //           min={0}
//                     //           name="lunchCount"
//                     //           placeholder="Количество"
//                     //           value={dailyMeal.lunch}
//                     //           disabled={
//                     //             (formData.status === "archived" ||
//                     //               formData.status === "canceled") &&
//                     //             true
//                     //           }
//                     //           onChange={(e) =>
//                     //             handleMealChange(index, "lunch", e.target.value)
//                     //           }
//                     //         />
//                     //       </div>
//                     //       <div className={classes.requestDataInfo}>
//                     //         <div className={classes.requestDataInfo_title}>
//                     //           Ужин
//                     //         </div>
//                     //         <input
//                     //           type="number"
//                     //           min={0}
//                     //           name="dinnerCount"
//                     //           placeholder="Количество"
//                     //           value={dailyMeal.dinner}
//                     //           disabled={
//                     //             (formData.status === "archived" ||
//                     //               formData.status === "canceled") &&
//                     //             true
//                     //           }
//                     //           onChange={(e) =>
//                     //             handleMealChange(
//                     //               index,
//                     //               "dinner",
//                     //               e.target.value
//                     //             )
//                     //           }
//                     //         />
//                     //       </div>
//                     //     </div>
//                     //   ))}
//                     //   {formData.status !== "archived" &&
//                     //     formData.status !== "canceled" && (
//                     //       <Button onClick={handleSaveMeals}>Сохранить</Button>
//                     //     )}
//                     // </div>
//                   )}
//                 {/* Вкладка "Комментарии" */}
//                 {activeTab === "Комментарии" && (
//                   <>
//                     {!isSuperAdmin(user) && !isDispatcherAdmin(user) ? null : (
//                       <div className={classes.separatorWrapper}>
//                         {isHaveTwoChats === false ? (
//                           <button
//                             onClick={() => setSeparator("airline")} // Установить separator как 'airline'
//                             className={
//                               separator === "airline" ? classes.active : null
//                             }
//                           >
//                             Авиакомпания
//                           </button>
//                         ) : (
//                           <>
//                             <button
//                               onClick={() => setSeparator("airline")} // Установить separator как 'airline'
//                               className={
//                                 separator === "airline" ? classes.active : null
//                               }
//                             >
//                               Авиакомпания
//                             </button>
//                             <button
//                               onClick={() => setSeparator("hotel")} // Установить separator как 'hotel'
//                               className={
//                                 separator === "hotel" ? classes.active : null
//                               }
//                             >
//                               Гостиница
//                             </button>
//                           </>
//                         )}
//                       </div>
//                     )}
//                     <Message
//                       key={`${chooseRequestID ? chooseRequestID : chooseReserveID
//                         }-${activeTab}`}
//                       activeTab={activeTab}
//                       show={show}
//                       setIsHaveTwoChats={setIsHaveTwoChats}
//                       chooseRequestID={chooseRequestID}
//                       chooseReserveID={""}
//                       formData={formData}
//                       token={token}
//                       user={user}
//                       separator={separator}
//                       chatHeight={
//                         user?.airlineId || user?.hotelId
//                           ? "calc(100vh - 228px)"
//                           : "calc(100vh - 287px)"
//                       }
//                     />
//                   </>
//                 )}
//                 {/* Вкладка "История" */}
//                 {activeTab === "История" && logsData && (
//                   <div
//                     className={classes.requestData}
//                     style={{ paddingBottom: totalPages > 1 ? "60px" : "20px" }}
//                   >
//                     <div className={classes.logs}>
//                       {[...logsData.logs.logs].map((log, index) => (
//                         <>
//                           <div className={classes.historyDate} key={index}>
//                             {new Date(log.createdAt).toLocaleDateString(
//                               "ru-RU",
//                               {
//                                 day: "numeric",
//                                 month: "long",
//                                 year: "numeric",
//                               }
//                             )}
//                             {/* {convertToDate(log.createdAt)}{" "}
//                         {convertToDate(log.createdAt, true)} */}
//                           </div>
//                           <div
//                             className={classes.historyLog}
//                             dangerouslySetInnerHTML={{
//                               __html: `<span class='historyLogTime'>${convertToDate(
//                                 log.createdAt,
//                                 true
//                               )}</span> ${log.description}`,
//                             }}
//                           >
//                             {/* {log.description} */}
//                           </div>
//                         </>
//                       ))}
//                     </div>
//                     {totalPages > 1 && (
//                       <div className={classes.pagination}>
//                         <ReactPaginate
//                           previousLabel={"←"}
//                           nextLabel={"→"}
//                           breakLabel={"..."}
//                           pageCount={totalPages}
//                           marginPagesDisplayed={2}
//                           pageRangeDisplayed={5}
//                           onPageChange={handlePageClick}
//                           // forcePage={validCurrentPage}
//                           containerClassName={classes.pagination}
//                           activeClassName={classes.activePaginationNumber}
//                           pageLinkClassName={classes.paginationNumber}
//                         />
//                       </div>
//                     )}
//                   </div>
//                 )}
//               </div>

//               {/* Кнопка для размещения заявки */}
//               {formData.status !== "archived" &&
//                 formData.status !== "done" &&
//                 formData.status !== "archiving" &&
//                 formData.status !== "extended" &&
//                 formData.status !== "reduced" &&
//                 formData.status !== "transferred" &&
//                 formData.status !== "earlyStart" &&
//                 formData.status !== "canceled" &&
//                 activeTab === "Общая" && (
//                   <div className={classes.requestButton}>
//                     <button
//                       onClick={() => {
//                         // onClose();
//                         // handleCancelRequest(chooseRequestID);
//                         openDeleteComponent();
//                       }}
//                     >
//                       {user?.airlineId && formData.status === "opened"
//                         ? "Запрос на отмену"
//                         : "Отменить"}
//                       {/* <img src="/user-check.png" alt="" /> */}
//                     </button>
//                     {((isSuperAdmin(user) || isDispatcherAdmin(user)) &&
//                       !formData.hotelId) && (
//                         <Button
//                           onClick={() => {
//                             onClose();
//                             setShowChooseHotel(true);
//                             setChooseCityRequest(formData?.airport?.city);
//                             localStorage.setItem("selectedTab", 0);
//                           }}
//                         >
//                           {/* {console.log(formData)} */}
//                           Разместить
//                           <img
//                             style={{
//                               width: "fit-content",
//                               height: "fit-content",
//                             }}
//                             src="/user-check.png"
//                             alt=""
//                           />
//                         </Button>
//                       )}
//                   </div>
//                 )}
//               {formData.status !== "created" &&
//                 formData.status !== "opened" &&
//                 formData.status !== "canceled" &&
//                 // formData.status !== "archiving" &&
//                 formData.status !== "archived" &&
//                 activeTab !== "Комментарии" &&
//                 activeTab !== "История" &&
//                 canUpdateActions && (
//                   <div className={classes.requestButton}>
//                     <button
//                       onClick={() => {
//                         openDeleteComponent();
//                       }}
//                     >
//                       {user?.airlineId &&
//                         formData.status !== "archived" &&
//                         formData.status !== "archiving"
//                         ? "Запрос на отмену"
//                         : "Отменить"}
//                       {/* <img src="/user-check.png" alt="" /> */}
//                     </button>
//                     {activeTab === "Общая" ? (
//                       <Button
//                         onClick={handleExtendChangeRequest}
//                         backgroundcolor={!isEditing ? "#3CBC6726" : "#0057C3"}
//                         color={!isEditing ? "#3B6C54" : "#fff"}
//                       >
//                         {isEditing ? (
//                           <>
//                             {user?.airlineId && formData.status !== "created"
//                               ? "Сохранить"
//                               : "Сохранить"}{" "}
//                             {/* <img src="/saveDispatcher.png" alt="" /> */}
//                           </>
//                         ) : (
//                           <>
//                             {user?.airlineId && formData.status !== "created"
//                               ? "Изменить"
//                               : "Изменить"}{" "}
//                             {/* <img src="/editDispetcher.png" alt="" /> */}
//                           </>
//                         )}
//                       </Button>
//                     ) : (
//                       <Button
//                         onClick={handleSaveMeals}
//                         backgroundcolor={!isEditing2 ? "#3CBC6726" : "#0057C3"}
//                         color={!isEditing2 ? "#3B6C54" : "#fff"}
//                       >
//                         {isEditing2 ? (
//                           <>
//                             {user?.airlineId && formData.status !== "created"
//                               ? "Сохранить"
//                               : "Сохранить"}{" "}
//                             {/* <img src="/saveDispatcher.png" alt="" /> */}
//                           </>
//                         ) : (
//                           <>
//                             {user?.airlineId && formData.status !== "created"
//                               ? "Изменить"
//                               : "Изменить"}{" "}
//                             {/* <img src="/editDispetcher.png" alt="" /> */}
//                           </>
//                         )}
//                       </Button>
//                     )}
//                   </div>
//                 )}
//             </>
//           )}
//           <CreateRequestAirlineStaff
//             id={formData?.airline?.id} // Или любое другое значение, нужное для вашего компонента
//             show={showAddStaff}
//             onClose={toggleAddStaff}
//             isExist={true}
//             positions={positions}
//             setNewStaffId={setNewStaffId}
//           // setSelectedAirline={setSelectedAirline}
//           />
//         </Sidebar>
//       )}
//       {showDelete && (
//         <DeleteComponent
//           remove={() => {
//             handleCancelRequest();
//             closeDeleteComponent();
//             // setShowRequestSidebar(false);
//           }}
//           index={chooseRequestID}
//           close={closeDeleteComponent}
//           title={`Вы действительно хотите отменить заявку? `}
//           isCancel={true}
//         />
//       )}
//     </>
//   );
// }

// export default ExistRequest;
