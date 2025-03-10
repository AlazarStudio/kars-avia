import React, {
  useState,
  useRef,
  useEffect,
  useCallback,
  useMemo,
} from "react";
import { gql, useMutation, useQuery, useSubscription } from "@apollo/client";
import classes from "./CreateRequest.module.css";
import Button from "../../Standart/Button/Button";
import Sidebar from "../Sidebar/Sidebar";
import {
  CREATE_REQUEST_MUTATION,
  decodeJWT,
  GET_AIRLINES_RELAY,
  GET_AIRLINES_SUBSCRIPTION,
  GET_AIRLINES_UPDATE_SUBSCRIPTION,
  GET_AIRPORTS_RELAY,
  GET_USER_BRONS,
  getCookie,
} from "../../../../graphQL_requests";
import DropDownList from "../DropDownList/DropDownList";
import MUIAutocomplete from "../MUIAutocomplete/MUIAutocomplete";
import { Box, CircularProgress } from "@mui/material";
import MUILoader from "../MUILoader/MUILoader";

// Компонент для создания новой заявки
function CreateRequest({ show, onClose, onMatchFound, user, addNotification }) {
  const token = getCookie("token");
  const [userID, setUserID] = useState();
  const [isEdited, setIsEdited] = useState(false); // Флаг, указывающий, были ли изменения в форме
  const [airlines, setAirlines] = useState([]); // Список авиакомпаний
  const [selectedAirline, setSelectedAirline] = useState(null); // Выбранная авиакомпания
  const sidebarRef = useRef();

  // Запрос данных авиакомпаний и аэропортов
  const { data, refetch } = useQuery(GET_AIRLINES_RELAY);
  const infoAirports = useQuery(GET_AIRPORTS_RELAY);
  const [airports, setAirports] = useState([]); // Список аэропортов

  const { data: dataSubscription } = useSubscription(GET_AIRLINES_SUBSCRIPTION);
  const { data: dataSubscriptionUpd } = useSubscription(
    GET_AIRLINES_UPDATE_SUBSCRIPTION
  );

  // Состояние активной вкладки и данных формы
  const [activeTab, setActiveTab] = useState("Общая");
  const [formData, setFormData] = useState({
    personId: "",
    airportId: "",
    arrivalRoute: "",
    arrivalDate: "",
    arrivalTime: "",
    departureRoute: "",
    departureDate: "",
    departureTime: "",
    senderId: "",
    airlineId: selectedAirline?.id || "",
    mealPlan: {
      included: true,
      breakfastEnabled: true,
      lunchEnabled: true,
      dinnerEnabled: true,
    },
    city: "",
    reserve: false,
  });

  const [warningMessage, setWarningMessage] = useState(""); // Предупреждение при пересечении бронирования
  const [hotelBronsInfo, setHotelBronsInfo] = useState([]); // Информация о бронировании пользователя
  const [matchingRequest, setMatchingRequest] = useState(null);

  // Запрос данных о бронированиях пользователя
  const { data: bronData } = useQuery(GET_USER_BRONS, {
    variables: { airlineStaffId: formData.personId },
    skip: !formData.personId,
  });

  // Вычисляем уникальные города из списка аэропортов, используя memo
  const uniqueCities = useMemo(
    () => [...new Set(airports.map((airport) => airport.city.trim()))].sort(),
    [airports]
  );

  // Обновление списка аэропортов при изменении данных
  useEffect(() => {
    if (infoAirports.data) {
      setAirports(infoAirports.data.airports || []);
    }
  }, [infoAirports.data]);

  useEffect(() => {
    setAirlines(data?.airlines?.airlines);
    if (user?.airlineId) {
      const selectedAirline = data?.airlines?.airlines.find(
        (airline) => airline.id === user.airlineId
      );
      setSelectedAirline(selectedAirline);
    }
    refetch();
  }, [show, dataSubscription, dataSubscriptionUpd, refetch]);

  // console.log(dataSubscriptionUpd);

  // Обновление ID пользователя и других начальных данных при наличии токена и данных
  useEffect(() => {
    if (token && data) {
      const userId = decodeJWT(token).userId;
      setUserID(userId);
      setFormData((prevFormData) => ({
        ...prevFormData,
        senderId: userId,
        airlineId: user?.airlineId || prevFormData.airlineId,
      }));
      setAirlines(data.airlines.airlines);

      if (user?.airlineId) {
        const selectedAirline = data.airlines.airlines.find(
          (airline) => airline.id === user.airlineId
        );
        setSelectedAirline(selectedAirline);
      }
    }
  }, [token, data, user]);

  // Обновление информации о бронировании при изменении ID сотрудника
  useEffect(() => {
    if (formData.personId && bronData) {
      setHotelBronsInfo(bronData.airlineStaff.hotelChess);
    }
  }, [bronData, formData.personId]);

  // Мутация для создания новой заявки
  const [createRequest] = useMutation(CREATE_REQUEST_MUTATION, {
    context: {
      headers: {
        Authorization: `Bearer ${token}`,
        // 'Apollo-Require-Preflight': 'true',
      },
    },
  });

  const airlineForAirlineAdmin = data?.airlines?.airlines.find(
    (airline) => airline.id === user.airlineId
  );

  // Сброс формы к начальному состоянию
  const resetForm = useCallback(() => {
    setActiveTab("Общая");
    setSelectedAirline(user?.airlineId ? airlineForAirlineAdmin : null);
    setFormData({
      personId: "",
      airportId: "",
      arrivalRoute: "",
      arrivalDate: "",
      arrivalTime: "",
      departureRoute: "",
      departureDate: "",
      departureTime: "",
      senderId: userID,
      airlineId: selectedAirline?.id || "",
      mealPlan: {
        included: true,
        breakfastEnabled: true,
        lunchEnabled: true,
        dinnerEnabled: true,
      },
      city: "",
      reserve: false,
    });
    setIsEdited(false); // Сбрасываем флаг, что форма не изменена
    setWarningMessage("");
  }, [userID]);

  // Закрытие формы с проверкой на несохраненные изменения
  const closeButton = useCallback(() => {
    if (!isEdited) {
      resetForm();
      setMatchingRequest(null);
      onClose();
      return;
    }

    if (window.confirm("Вы уверены? Все несохраненные данные будут удалены.")) {
      resetForm();
      setMatchingRequest(null);
      onClose();
    }
  }, [isEdited, resetForm, setMatchingRequest, onClose]);

  // Обработчик изменений в полях формы
  const handleChange = useCallback((e) => {
    const { name, value, type, checked } = e.target;

    // Обновляем флаг, что данные были изменены
    setIsEdited(true);

    if (type === "checkbox") {
      // Обработка изменений для чекбоксов mealPlan
      setFormData((prevState) => {
        const updatedMealPlan = {
          ...prevState.mealPlan,
          [name]: checked,
        };

        // Если не выбран ни один чекбокс, устанавливаем mealPlan.included в false
        const isAnyMealSelected =
          updatedMealPlan.breakfastEnabled ||
          updatedMealPlan.lunchEnabled ||
          updatedMealPlan.dinnerEnabled;

        return {
          ...prevState,
          mealPlan: {
            ...updatedMealPlan,
            included: isAnyMealSelected, // Устанавливаем included в true, если хотя бы один чекбокс выбран
          },
        };
      });
    } else {
      setFormData((prevState) => ({
        ...prevState,
        [name]: value,
        mealPlan:
          name === "included"
            ? { ...prevState.mealPlan, included: value === "true" }
            : prevState.mealPlan,
      }));
    }
  }, []);

  // Обработчик переключения вкладок
  const handleTabChange = useCallback((tab) => setActiveTab(tab), []);

  const isFormValid = () => {
    return (
      formData.personId &&
      formData.airportId &&
      // formData.arrivalRoute &&
      formData.arrivalDate &&
      formData.arrivalTime &&
      // formData.departureRoute &&
      formData.departureDate &&
      formData.departureTime
    );
  };

  const today = new Date().toISOString().split("T")[0];

  // Рассчитываем минимальную дату прибытия как дату, начиная с месяца назад
  const minArrivalDate = useMemo(() => {
    const date = new Date();
    date.setMonth(date.getMonth() - 1);
    return date.toISOString().split("T")[0];
  }, []);

  const [isLoading, setIsLoading] = useState(false);

  // console.log(formData);

  // Отправка формы на сервер
  const handleSubmit = async () => {
    setIsLoading(true);

    if (!isFormValid()) {
      alert("Пожалуйста, заполните все обязательные поля.");
      setIsLoading(false);
      return;
    }

    // Проверка на дату прибытия: она не может быть меньше сегодняшней
    // if (formData.arrivalDate < today) {
    //     alert('Дата прибытия не может быть раньше сегодняшнего дня.')
    //     setFormData(prevFormData => ({
    //         ...prevFormData,
    //         arrivalDate: ""  // Очищаем дату прибытия
    //     }));
    //     return;
    // }

    if (formData.arrivalDate < minArrivalDate) {
      alert("Дата прибытия не может быть больше месяца назад.");
      setFormData((prevFormData) => ({
        ...prevFormData,
        arrivalDate: "", // Очищаем дату прибытия
      }));
      return;
    }

    // Проверка на дату отъезда: она не может быть раньше даты прибытия
    if (formData.departureDate < formData.arrivalDate) {
      alert("Дата отъезда не может быть раньше даты прибытия.");
      setFormData((prevFormData) => ({
        ...prevFormData,
        departureDate: "", // Очищаем дату отъезда
      }));
      return;
    }

    if (
      formData.departureDate === formData.arrivalDate &&
      formData.departureTime <= formData.arrivalTime
    ) {
      alert("Время отъезда должно быть позже времени прибытия.");
      // Очищаем значения для времени прибытия и отъезда
      setFormData((prevFormData) => ({
        ...prevFormData,
        departureTime: "",
      }));
      return;
    }

    const input = {
      personId: formData.personId,
      airportId: formData.airportId,
      arrival: `${formData.arrivalDate}T${formData.arrivalTime}:00+00:00`,
      departure: `${formData.departureDate}T${formData.departureTime}:00+00:00`,
      mealPlan: {
        included: formData.mealPlan.included,
        breakfastEnabled: formData.mealPlan.breakfastEnabled,
        lunchEnabled: formData.mealPlan.lunchEnabled,
        dinnerEnabled: formData.mealPlan.dinnerEnabled,
      },
      senderId: formData.senderId,
      airlineId: formData.airlineId,
      reserve: formData.reserve,
    };

    try {
      const response = await createRequest({ variables: { input } });
      resetForm();
      onClose();
      addNotification("Создание заявки для экипажа прошло успешно.", "success");
      // console.log(response);
    } catch (error) {
      console.error(error);
      if (error.message.startsWith("Request already exists with id:")) {
        const match = error.message.match(
          /Request already exists with id:\s*([a-zA-Z0-9]+)/
        );
        if (match) {
          const requestId = match[1];
          setMatchingRequest(requestId);
        }
      } else {
        alert("Ошибка при создании заявки");
      }
    } finally {
      // resetForm();
      setIsLoading(false);
    }
  };

  // console.log(formData);
  // Проверка на пересечение бронирований
  const checkBookingOverlap = useCallback(
    (arrivalDate, arrivalTime, departureDate, departureTime, bronList) => {
      const arrivalDateTime = new Date(`${arrivalDate}T${arrivalTime}`);
      const departureDateTime = new Date(`${departureDate}T${departureTime}`);
      let existBronList;

      return (
        bronList.some((bron) => {
          const bronStart = new Date(`${bron.start}T${bron.startTime}`);
          const bronEnd = new Date(`${bron.end}T${bron.endTime}`);
          if (arrivalDateTime < bronEnd && bronStart < departureDateTime) {
            existBronList = bron;
          }
          return arrivalDateTime < bronEnd && bronStart < departureDateTime;
        }),
        existBronList
      );
    },
    []
  );

  const convertToDate_Date = (timestamp) =>
    new Date(timestamp).toLocaleDateString();

  // Обновление предупреждения при изменении дат и времени
  useEffect(() => {
    if (
      formData.arrivalDate &&
      formData.arrivalTime &&
      formData.departureDate &&
      formData.departureTime
    ) {
      const overlap = checkBookingOverlap(
        formData.arrivalDate,
        formData.arrivalTime,
        formData.departureDate,
        formData.departureTime,
        hotelBronsInfo
      );
      setWarningMessage(
        overlap
          ? ` В это время сотрудник уже забронирован в отеле "${
              overlap.hotel.name
            }" с ${convertToDate_Date(overlap.start)} ${
              overlap.startTime
            } по ${convertToDate_Date(overlap.end)} ${overlap.endTime};`
          : ""
      );
    }
  }, [
    formData.arrivalDate,
    formData.arrivalTime,
    formData.departureDate,
    formData.departureTime,
    hotelBronsInfo,
    checkBookingOverlap,
  ]);

  // Клик вне боковой панели закрывает её
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        sidebarRef.current?.contains(event.target) // Клик в боковой панели
      ) {
        return; // Если клик внутри, ничего не делаем
      }

      // Если клик был вне боковой панели, то закрываем её
      closeButton();
    };

    if (show) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }

    // Очистка эффекта при демонтировании компонента
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [show, closeButton]);

  const meal = [
    {
      title: "Включено",
      value: true,
    },
    {
      title: "Не включено",
      value: false,
    },
  ];

  const airlineOptions = user?.airlineId ? [] : "";

  return (
    <Sidebar show={show} sidebarRef={sidebarRef}>
      <div className={classes.requestTitle}>
        <div className={classes.requestTitle_name}>Создать заявку</div>
        <div className={classes.requestTitle_close} onClick={closeButton}>
          <img src="/close.png" alt="" />
        </div>
      </div>

      <div className={classes.tabs}>
        <div
          className={`${classes.tab} ${
            activeTab === "Общая" ? classes.activeTab : ""
          }`}
          onClick={() => handleTabChange("Общая")}
        >
          Общая
        </div>
        {/* <div className={`${classes.tab} ${activeTab === 'Доп. услуги' ? classes.activeTab : ''}`} onClick={() => handleTabChange('Доп. услуги')}>Доп. услуги</div> */}
      </div>

      {isLoading ? (
        <MUILoader loadSize={"50px"} fullHeight={"75vh"} />
      ) : (
        <>
          <div className={classes.requestMiddle}>
            {/* Вкладка "Общая" */}
            {activeTab === "Общая" && (
              <div className={classes.requestData}>
                {warningMessage && (
                  <div className={classes.warningMessage}>{warningMessage}</div>
                )}
                {matchingRequest ? (
                  <div className={classes.matchingRequest}>
                    Заявка с такими же параметрами уже существует.{" "}
                    <span
                      onClick={() => {
                        onMatchFound(matchingRequest);
                        setMatchingRequest(null);
                        resetForm();
                        onClose();
                      }}
                    >
                      Перейти к заявке
                    </span>
                  </div>
                ) : null}
                <MUIAutocomplete
                  dropdownWidth={"100%"}
                  label={"Выберите тип"}
                  options={["Квота", "Резерв"]}
                  value={formData.reserve ? "Резерв" : "Квота"}
                  onChange={(event, newValue) => {
                    setFormData((prevFormData) => ({
                      ...prevFormData,
                      reserve: newValue === "Резерв",
                    }));
                    setIsEdited(true);
                  }}
                />

                {user?.airlineId ? null : (
                  <>
                    <label>Авиакомпания</label>
                    <MUIAutocomplete
                      dropdownWidth={"100%"}
                      label={"Введите авиакомпанию"}
                      options={airlines?.map((airline) => airline.name)}
                      value={selectedAirline ? selectedAirline?.name : ""}
                      onChange={(event, newValue) => {
                        const selectedAirline = airlines.find(
                          (airline) => airline.name === newValue
                        );
                        setSelectedAirline(selectedAirline);
                        setFormData((prevFormData) => ({
                          ...prevFormData,
                          airlineId: selectedAirline?.id || "",
                        }));
                        setIsEdited(true);
                      }}
                    />
                    {/* <DropDownList
                                    placeholder="Введите авиакомпанию"
                                    options={airlines?.map(airline => airline.name)}
                                    initialValue={selectedAirline?.name || ""}
                                    onSelect={(value) => {
                                        const selectedAirline = airlines.find(airline => airline.name === value);
                                        setSelectedAirline(selectedAirline);
                                        setFormData(prevFormData => ({
                                            ...prevFormData,
                                            airlineId: selectedAirline?.id || ""
                                        }));
                                        setIsEdited(true);
                                    }}
                                /> */}
                  </>
                )}

                {selectedAirline && (
                  <>
                    <label>Сотрудник авиакомпании</label>
                    <MUIAutocomplete
                      dropdownWidth={"100%"}
                      label={"Введите сотрудника"}
                      options={selectedAirline.staff.map(
                        (person) => person.name
                      )}
                      value={
                        selectedAirline.staff.find(
                          (person) => person.id === formData.personId
                        )?.name || ""
                      }
                      onChange={(event, newValue) => {
                        const selectedPerson = selectedAirline.staff.find(
                          (person) => person.name === newValue
                        );
                        setFormData((prevFormData) => ({
                          ...prevFormData,
                          personId: selectedPerson?.id || "",
                        }));
                        setIsEdited(true);
                      }}
                    />
                    {/* <DropDownList
                                    placeholder="Введите сотрудника"
                                    options={selectedAirline.staff.map(person => person.name)}
                                    initialValue={selectedAirline.staff.find(person => person.id === formData.personId)?.name || ""}
                                    onSelect={(value) => {
                                        const selectedPerson = selectedAirline.staff.find(person => person.name === value);
                                        setFormData(prevFormData => ({
                                            ...prevFormData,
                                            personId: selectedPerson?.id || ""
                                        }));
                                        setIsEdited(true);
                                    }}
                                /> */}
                  </>
                )}

                <label>Город</label>
                <MUIAutocomplete
                  dropdownWidth={"100%"}
                  label={"Введите город"}
                  options={uniqueCities}
                  value={formData.city}
                  onChange={(event, newValue) => {
                    setFormData((prevFormData) => ({
                      ...prevFormData,
                      city: newValue,
                      airportId: "",
                    }));
                    setIsEdited(true);
                  }}
                />
                {/* <DropDownList
                            placeholder="Введите город"
                            options={uniqueCities}
                            initialValue={formData.city}
                            onSelect={(value) => {
                                setFormData(prevFormData => ({
                                    ...prevFormData,
                                    city: value,
                                    airportId: ""
                                }));
                                setIsEdited(true);
                            }}
                        /> */}

                {formData.city && (
                  <>
                    <label>Аэропорт</label>
                    <MUIAutocomplete
                      dropdownWidth={"100%"}
                      label={"Введите аэропорт"}
                      options={airports
                        .filter(
                          (airport) =>
                            airport.city.trim() === formData.city.trim()
                        )
                        .map((airport) => `${airport.name} ${airport.code}`)}
                      value={
                        airports.find(
                          (airport) => airport.id === formData.airportId
                        )
                          ? `${
                              airports.find(
                                (airport) => airport.id === formData.airportId
                              )?.name
                            } (${
                              airports.find(
                                (airport) => airport.id === formData.airportId
                              )?.code
                            })`
                          : ""
                      }
                      onChange={(event, newValue) => {
                        const selectedAirport = airports.find(
                          (airport) =>
                            `${airport.name} ${airport.code}` === newValue
                        );
                        setFormData((prevFormData) => ({
                          ...prevFormData,
                          airportId: selectedAirport?.id || "",
                        }));
                        setIsEdited(true);
                      }}
                    />
                    {/* <DropDownList
                                    placeholder="Введите аэропорт"
                                    options={airports.filter(airport => airport.city.trim() === formData.city.trim()).map(airport => airport.name)}
                                    initialValue={airports.find(airport => airport.id === formData.airportId)?.name || ""}
                                    onSelect={(value) => {
                                        const selectedAirport = airports.find(airport => airport.name === value);
                                        setFormData(prevFormData => ({
                                            ...prevFormData,
                                            airportId: selectedAirport?.id || ""
                                        }));
                                        setIsEdited(true);
                                    }}
                                /> */}
                  </>
                )}

                <label>Прибытие</label>
                {/* <input type="text" name="arrivalRoute" placeholder="Рейс" value={formData.arrivalRoute} onChange={handleChange} /> */}
                <div className={classes.reis_info}>
                  {/* <input type="date" name="arrivalDate" value={formData.arrivalDate} min={today} onChange={handleChange} placeholder="Дата" /> */}
                  <input
                    type="date"
                    name="arrivalDate"
                    value={formData.arrivalDate}
                    min={minArrivalDate}
                    onChange={handleChange}
                    placeholder="Дата"
                  />
                  <input
                    type="time"
                    name="arrivalTime"
                    value={formData.arrivalTime}
                    onChange={handleChange}
                    placeholder="Время"
                  />
                </div>

                <label>Отъезд</label>
                {/* <input type="text" name="departureRoute" placeholder="Рейс" value={formData.departureRoute} onChange={handleChange} /> */}
                <div className={classes.reis_info}>
                  <input
                    type="date"
                    name="departureDate"
                    value={formData.departureDate}
                    min={formData.arrivalDate}
                    onChange={handleChange}
                    placeholder="Дата"
                  />
                  <input
                    type="time"
                    name="departureTime"
                    value={formData.departureTime}
                    onChange={handleChange}
                    placeholder="Время"
                  />
                </div>

                <label>Питание</label>
                {/* <select name="included" value={formData.mealPlan.included} onChange={handleChange}>
                            <option value={true}>Включено</option>
                            <option value={false}>Не включено</option>
                        </select> */}

                <MUIAutocomplete
                  dropdownWidth={"100%"}
                  // label={"Питание"}
                  options={meal.map((name) => name.title)}
                  value={
                    formData.mealPlan.included ? "Включено" : "Не включено"
                  }
                  onChange={(event, newValue) => {
                    const isIncluded = newValue === "Включено";
                    setFormData((prevFormData) => ({
                      ...prevFormData,
                      mealPlan: {
                        ...prevFormData.mealPlan,
                        included: isIncluded,
                        breakfastEnabled: isIncluded,
                        lunchEnabled: isIncluded,
                        dinnerEnabled: isIncluded,
                      },
                    }));
                    setIsEdited(true);
                  }}
                />

                {/* <DropDownList
                  placeholder="Питание"
                  options={meal.map((name) => name.title)}
                  initialValue={
                    formData.mealPlan.included ? "Включено" : "Не включено"
                  }
                  onSelect={(value) => {
                    const isIncluded = value === "Включено";
                    setFormData((prevFormData) => ({
                      ...prevFormData,
                      mealPlan: {
                        ...prevFormData.mealPlan,
                        included: isIncluded,
                      },
                    }));
                    setIsEdited(true);
                  }}
                /> */}

                <div
                  className={classes.checks}
                  style={{
                    display: formData.mealPlan.included ? "flex" : "none",
                  }}
                >
                  <label>
                    <input
                      type="checkbox"
                      name="breakfastEnabled"
                      checked={formData.mealPlan.breakfastEnabled}
                      onChange={handleChange}
                    />
                    Завтрак
                  </label>
                  <label>
                    <input
                      type="checkbox"
                      name="lunchEnabled"
                      checked={formData.mealPlan.lunchEnabled}
                      onChange={handleChange}
                    />
                    Обед
                  </label>
                  <label>
                    <input
                      type="checkbox"
                      name="dinnerEnabled"
                      checked={formData.mealPlan.dinnerEnabled}
                      onChange={handleChange}
                    />
                    Ужин
                  </label>
                </div>

                {/* <label style={{ alignItems: "center" }}>
                  <input
                    type="checkbox"
                    name="reserve"
                    checked={formData.reserve}
                    onChange={(e) =>
                      setFormData((prevState) => ({
                        ...prevState,
                        reserve: e.target.checked, // ✅ Записываем булево значение
                      }))
                    }
                  />
                  Резерв
                </label> */}
              </div>
            )}

            {/* Вкладка "Доп. услуги" */}
            {activeTab === "Доп. услуги" && (
              <div className={classes.requestData}></div>
            )}
          </div>

          <div className={classes.requestButton}>
            {/* {isLoading ? (
        //   <Box
        //     sx={{
        //       position: "fixed",
        //       top: 0,
        //       left: 0,
        //       width: "100vw",
        //       height: "100vh",
        //       backgroundColor: "rgba(0, 0, 0, 0.5)", // Затемнённый фон
        //       display: "flex",
        //       alignItems: "center",
        //       justifyContent: "center",
        //       zIndex: 1300, // Выше других элементов
        //     }}
        //   >
        //     <CircularProgress
        //       sx={{
        //         width: "80px !important",
        //         height: "80px !important",
        //         color: "#fff",
        //       }}
        //     />
        //   </Box>
        <MUILoader/>
        ) : ( */}
            <Button onClick={handleSubmit}>Создать заявку</Button>
            {/* )} */}
          </div>
        </>
      )}
    </Sidebar>
  );
}

export default CreateRequest;
