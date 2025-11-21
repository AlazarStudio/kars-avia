import React, {
  useState,
  useRef,
  useEffect,
  useCallback,
  useMemo,
} from "react";
import { useMutation, useQuery, useSubscription } from "@apollo/client";
import classes from "./CreateRepresentativeRequest.module.css";
import Button from "../../Standart/Button/Button.jsx";
import Sidebar from "../Sidebar/Sidebar.jsx";
import {
  CREATE_REQUEST_MUTATION,
  decodeJWT,
  GET_AIRLINES_RELAY,
  GET_AIRLINES_SUBSCRIPTION,
  GET_AIRLINES_UPDATE_SUBSCRIPTION,
  GET_AIRPORTS_RELAY,
  getCookie,
} from "../../../../graphQL_requests.js";
import MUIAutocomplete from "../MUIAutocomplete/MUIAutocomplete.jsx";
import MUILoader from "../MUILoader/MUILoader.jsx";
import MUIAutocompleteColor from "../MUIAutocompleteColor/MUIAutocompleteColor.jsx";

// Компонент для создания новой заявки
function CreateRepresentativeRequest({
  show,
  onClose,
  onMatchFound,
  user,
  addNotification,
}) {
  const token = getCookie("token");
  const [userID, setUserID] = useState();
  const [isEdited, setIsEdited] = useState(false); // Флаг, указывающий, были ли изменения в форме
  const [airlines, setAirlines] = useState([]); // Список авиакомпаний
  const [selectedAirline, setSelectedAirline] = useState(null); // Выбранная авиакомпания
  const sidebarRef = useRef();

  // Запрос данных авиакомпаний и аэропортов
  const { data, refetch } = useQuery(GET_AIRLINES_RELAY, {
    context: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
    skip: !show,
  });
  const infoAirports = useQuery(GET_AIRPORTS_RELAY, {
    context: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
    skip: !show,
  });

  const [airports, setAirports] = useState([]); // Список аэропортов

  // Состояние активной вкладки и данных формы
  const [formData, setFormData] = useState({
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
    habitation: false,
    transferHabitation: false,
    waterSupply: false,
    foodSupply: false,
    city: "",
  });

  const { data: dataSubscription } = useSubscription(
    GET_AIRLINES_SUBSCRIPTION,
    {
      onData: () => {
        refetch();
      },
      skip: !show,
    }
  );
  const { data: dataSubscriptionUpd } = useSubscription(
    GET_AIRLINES_UPDATE_SUBSCRIPTION,
    {
      onData: () => {
        refetch();
      },
      skip: !show,
    }
  );

  const [warningMessage, setWarningMessage] = useState(""); // Предупреждение при пересечении бронирования
  const [matchingRequest, setMatchingRequest] = useState(null);

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
    if (show) {
      refetch();
    }
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
  }, [token, data, user, dataSubscriptionUpd]);

  // console.log(dataSubscriptionUpd);

  useEffect(() => {
    if (dataSubscriptionUpd && !user?.airlineId) {
      const updatedAirline = data.airlines.airlines.find(
        (airline) => airline?.id === selectedAirline?.id
      );
      if (updatedAirline) {
        setSelectedAirline(updatedAirline);
      }
    }
  }, [data, selectedAirline, dataSubscriptionUpd]);

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
    (airline) => airline.id === user?.airlineId
  );

  // Сброс формы к начальному состоянию
  const resetForm = useCallback(() => {
    setSelectedAirline(user?.airlineId ? airlineForAirlineAdmin : null);
    setFormData({
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
      waterSupply: false,
      foodSupply: false,
      city: "",
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
  const today = new Date().toISOString().split("T")[0];

  // Рассчитываем минимальную дату прибытия как дату, начиная с месяца назад
  const minArrivalDate = useMemo(() => {
    const date = new Date();
    date.setMonth(date.getMonth() - 1);
    return date.toISOString().split("T")[0];
  }, []);

  const MEAL_KEYS = new Set([
    "breakfastEnabled",
    "lunchEnabled",
    "dinnerEnabled",
    "included",
  ]);

  const TOP_LEVEL_CHECKBOX_KEYS = new Set([
    "waterSupply",
    "foodSupply",
    "habitation",
    "transferHabitation",
  ]);

  const handleChange = useCallback((e) => {
    const { name, type, checked, value } = e.target;

    setIsEdited(true);

    if (type === "checkbox") {
      // --- чекбоксы питания (mealPlan) ---
      if (MEAL_KEYS.has(name)) {
        setFormData((prev) => {
          // master-переключатель: включить/выключить все при изменении included
          if (name === "included") {
            return {
              ...prev,
              mealPlan: {
                ...prev.mealPlan,
                included: checked,
                breakfastEnabled: checked,
                lunchEnabled: checked,
                dinnerEnabled: checked,
              },
            };
          }
          // отдельные флажки breakfast/lunch/dinner
          const nextMeal = { ...prev.mealPlan, [name]: checked };
          const isAny =
            nextMeal.breakfastEnabled ||
            nextMeal.lunchEnabled ||
            nextMeal.dinnerEnabled;

          return {
            ...prev,
            mealPlan: {
              ...nextMeal,
              included: isAny, // true если выбран хотя бы один прием пищи
            },
          };
        });
        return;
      }

      // --- чекбоксы верхнего уровня ---
      if (TOP_LEVEL_CHECKBOX_KEYS.has(name)) {
        setFormData((prev) => ({ ...prev, [name]: checked }));
        return;
      }

      // на всякий случай: любые прочие чекбоксы как булевы поля на верхнем уровне
      setFormData((prev) => ({ ...prev, [name]: checked }));
      return;
    }

    // все остальные input'ы (text/number/date/time и т.д.)
    setFormData((prev) => ({ ...prev, [name]: value }));
  }, []);

  const isFormValid = () => {
    return (
      formData.airportId &&
      formData.airlineId &&
      // formData.arrivalRoute &&
      formData.arrivalDate &&
      formData.arrivalTime &&
      // formData.departureRoute &&
      formData.departureDate &&
      formData.departureTime
    );
  };

  const [isLoading, setIsLoading] = useState(false);

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
    };

    try {
      const response = await createRequest({ variables: { input } });
      resetForm();
      onClose();
      addNotification
        ? addNotification(
            "Создание заявки для экипажа прошло успешно.",
            "success"
          )
        : null;
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

  // Состояние и функция для показа/скрытия окна добавления сотрудника

  useEffect(() => {
    setMatchingRequest(null);
  }, [formData]);

  // console.log(formData);

  return (
    <>
      <Sidebar show={show} sidebarRef={sidebarRef}>
        <div className={classes.requestTitle}>
          <div className={classes.requestTitle_name}>Создать заявку</div>
          <div className={classes.requestTitle_close} onClick={closeButton}>
            <img src="/close.png" alt="" />
          </div>
        </div>

        {isLoading ? (
          <MUILoader loadSize={"50px"} fullHeight={"75vh"} />
        ) : (
          <>
            <div className={classes.requestMiddle}>
              {/* Вкладка "Общая" */}
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

                <label>Введите авиакомпанию</label>
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

                <label>Выберите аэропорт</label>
                <MUIAutocompleteColor
                  dropdownWidth="100%"
                  label={"Введите аэропорт"}
                  options={airports}
                  getOptionLabel={(option) => {
                    if (!option) return "";
                    const cityPart =
                      option.city && option.city !== option.name
                        ? `, город: ${option.city}`
                        : "";
                    return `${option.code} ${option.name}${cityPart}`.trim();
                  }}
                  renderOption={(optionProps, option) => {
                    const cityPart =
                      option.city && option.city !== option.name
                        ? `, город: ${option.city}`
                        : "";
                    const labelText =
                      `${option.code} ${option.name}${cityPart}`.trim();
                    const words = labelText.split(" ");

                    return (
                      <li {...optionProps} key={option.id}>
                        {words.map((word, index) => (
                          <span
                            key={index}
                            style={{
                              color: index === 0 ? "black" : "gray",
                              marginRight: 4,
                            }}
                          >
                            {word}
                          </span>
                        ))}
                      </li>
                    );
                  }}
                  value={
                    airports.find((o) => o.id === formData.airportId) || null
                  }
                  onChange={(e, newValue) => {
                    setFormData((prev) => ({
                      ...prev,
                      airportId: newValue?.id || "",
                      city: newValue?.city,
                    }));
                    setIsEdited(true);
                  }}
                />

                <label>Выберите рейс</label>
                <input
                  type="text"
                  name="arrivalRoute"
                  placeholder="Рейс"
                  value={formData.arrivalRoute}
                  onChange={handleChange}
                />
                {/* <label>Прибытие</label> */}
                {/* <div className={classes.reis_info}>
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
                </div> */}

                <div className={classes.typeServices}>Вид услуг</div>

                <label className={classes.checkBoxWrapper}>
                  <input
                    type="checkbox"
                    name="waterSupply"
                    checked={formData.waterSupply}
                    onChange={handleChange}
                  />
                  Поставка питьевой воды
                </label>

                {formData.waterSupply && (
                  <>
                    <label>Введите количество человек</label>
                    <input
                      type="number"
                      name="arrivalRoute"
                      value={formData.arrivalRoute}
                      onChange={handleChange}
                    />

                    <label>Введите время</label>
                    <input
                      type="time"
                      name="arrivalTime"
                      value={formData.arrivalTime}
                      onChange={handleChange}
                      placeholder="Время"
                    />
                  </>
                )}

                <label className={classes.checkBoxWrapper}>
                  <input
                    type="checkbox"
                    name="foodSupply"
                    checked={formData.foodSupply}
                    onChange={handleChange}
                  />
                  Поставка питания
                </label>

                {formData.foodSupply && (
                  <>
                    <label>Введите количество человек</label>
                    <input
                      type="number"
                      name="arrivalRoute"
                      value={formData.arrivalRoute}
                      onChange={handleChange}
                    />

                    <label>Введите время</label>
                    <input
                      type="time"
                      name="arrivalTime"
                      value={formData.arrivalTime}
                      onChange={handleChange}
                      placeholder="Время"
                    />
                  </>
                )}

                {/* <label>Питание</label>

                <MUIAutocomplete
                  dropdownWidth={"100%"}
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
                /> */}

                <label className={classes.checkBoxWrapper}>
                  <input
                    type="checkbox"
                    name="habitation"
                    checked={formData.habitation}
                    onChange={handleChange}
                  />
                  Проживание
                </label>
                <label className={classes.checkBoxWrapper}>
                  <input
                    type="checkbox"
                    name="transferHabitation"
                    checked={formData.transferHabitation}
                    onChange={handleChange}
                  />
                  Трансфер+Проживание
                </label>

                {/* <div
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
                </div> */}
              </div>
            </div>

            <div className={classes.requestButton}>
              <Button onClick={handleSubmit}>Создать заявку</Button>
            </div>
          </>
        )}
      </Sidebar>
    </>
  );
}

export default CreateRepresentativeRequest;
