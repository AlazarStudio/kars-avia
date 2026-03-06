import React, { useState, useRef, useEffect, useCallback } from "react";
import { useMutation, useQuery, useSubscription } from "@apollo/client";
import classes from "./CreateRepresentativeRequest.module.css";
import Button from "../../Standart/Button/Button.jsx";
import Sidebar from "../Sidebar/Sidebar.jsx";
import {
  CREATE_PASSENGER_REQUEST,
  CREATE_REQUEST_MUTATION,
  GET_AIRLINES_RELAY,
  GET_AIRLINES_SUBSCRIPTION,
  GET_AIRLINES_UPDATE_SUBSCRIPTION,
  GET_AIRPORTS_RELAY,
  GET_PASSENGER_REQUESTS,
  getCookie,
} from "../../../../graphQL_requests.js";
import MUIAutocomplete from "../MUIAutocomplete/MUIAutocomplete.jsx";
import MUILoader from "../MUILoader/MUILoader.jsx";
import MUIAutocompleteColor from "../MUIAutocompleteColor/MUIAutocompleteColor.jsx";
import CloseIcon from "../../../shared/icons/CloseIcon.jsx";

// Компонент для создания новой заявки
function CreateRepresentativeRequest({
  show,
  onClose,
  onMatchFound,
  user,
  addNotification,
}) {
  const token = getCookie("token");
  const [isEdited, setIsEdited] = useState(false); // Флаг изменений формы
  const [airlines, setAirlines] = useState([]); // Список авиакомпаний
  const [selectedAirline, setSelectedAirline] = useState(null); // Выбранная авиакомпания
  const sidebarRef = useRef();

  const [airports, setAirports] = useState([]); // Список аэропортов

  // Новая структура состояния под новый input
  const [formData, setFormData] = useState({
    airlineId: user?.airlineId || "",
    airportId: "",
    flightNumber: "",
    waterSupply: false,
    waterPeopleCount: "",
    waterPlannedAt: "",
    foodSupply: false,
    foodPeopleCount: "",
    foodPlannedAt: "",
    habitation: false,
    habitationPeopleCount: "",
    habitationPlannedFromDate: "",
    habitationPlannedFromTime: "",
    habitationPlannedToDate: "",
    habitationPlannedToTime: "",
    transferHabitation: false,
    transferHabitationPeopleCount: "",
    transferHabitationPlannedAt: "",
    baggageDelivery: false,
    baggageDeliveryPeopleCount: "",
    baggageDeliveryPlannedAt: "",
    city: "",
  });

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

  const { data: dataSubscription } = useSubscription(
    GET_AIRLINES_SUBSCRIPTION,
    {
      context: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
      onData: () => {
        refetch();
      },
      skip: !show,
    }
  );

  const { data: dataSubscriptionUpd } = useSubscription(
    GET_AIRLINES_UPDATE_SUBSCRIPTION,
    {
      context: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
      onData: () => {
        refetch();
      },
      skip: !show,
    }
  );

  const [warningMessage, setWarningMessage] = useState("");
  const [matchingRequest, setMatchingRequest] = useState(null);

  // Обновление списка аэропортов
  useEffect(() => {
    if (infoAirports.data) {
      setAirports(infoAirports.data.airports || []);
    }
  }, [infoAirports.data]);

  // Обновление списка авиакомпаний и выбранной авиакомпании
  useEffect(() => {
    if (!data) return;

    const allAirlines = data?.airlines?.airlines || [];
    setAirlines(allAirlines);

    if (user?.airlineId) {
      const airline = allAirlines.find((a) => a.id === user.airlineId);
      setSelectedAirline(airline || null);
      setFormData((prev) => ({
        ...prev,
        airlineId: airline?.id || prev.airlineId,
      }));
    }
  }, [data, user]);

  // При открытии формы — обновить авиакомпании
  useEffect(() => {
    if (show) {
      refetch();
    }
  }, [show, refetch]);

  // Обновление выбранной авиакомпании при изменениях через подписку
  useEffect(() => {
    if (dataSubscriptionUpd && !user?.airlineId && data?.airlines?.airlines) {
      const updatedAirline = data.airlines.airlines.find(
        (airline) => airline?.id === selectedAirline?.id
      );
      if (updatedAirline) {
        setSelectedAirline(updatedAirline);
      }
    }
  }, [dataSubscriptionUpd, data, selectedAirline, user]);

  // Мутация для создания заявки
  const [createRequest] = useMutation(CREATE_PASSENGER_REQUEST, {
    context: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
    refetchQueries: [GET_PASSENGER_REQUESTS],
    awaitRefetchQueries: true,
  });

  const airlineForAirlineAdmin = data?.airlines?.airlines.find(
    (airline) => airline.id === user?.airlineId
  );

  // Сброс формы
  const resetForm = useCallback(() => {
    const baseAirline = user?.airlineId ? airlineForAirlineAdmin : null;

    setSelectedAirline(baseAirline || null);
    setFormData({
      airlineId: user?.airlineId || "",
      airportId: "",
      flightNumber: "",
      waterSupply: false,
      waterPeopleCount: "",
      waterPlannedAt: "",
      foodSupply: false,
      foodPeopleCount: "",
      foodPlannedAt: "",
      habitation: false,
      habitationPeopleCount: "",
      habitationPlannedFromDate: "",
      habitationPlannedFromTime: "",
      habitationPlannedToDate: "",
      habitationPlannedToTime: "",
      transferHabitation: false,
      transferHabitationPeopleCount: "",
      transferHabitationPlannedAt: "",
      baggageDelivery: false,
      baggageDeliveryPeopleCount: "",
      baggageDeliveryPlannedAt: "",
      city: "",
    });
    setIsEdited(false);
    setWarningMessage("");
  }, [user, airlineForAirlineAdmin]);

  // Закрытие формы с проверкой несохранённых изменений
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
  }, [isEdited, resetForm, onClose]);

  // const handleChange = useCallback((e) => {
  //   const { name, type, checked, value } = e.target;
  //   setIsEdited(true);

  //   if (type === "checkbox") {
  //     setFormData((prev) => {
  //       // взаимоисключающие флаги
  //       if (name === "habitation") {
  //         return {
  //           ...prev,
  //           habitation: checked,
  //           // если включили проживание — выключаем трансфер+проживание
  //           transferHabitation: checked ? false : prev.transferHabitation,
  //         };
  //       }

  //       if (name === "transferHabitation") {
  //         return {
  //           ...prev,
  //           transferHabitation: checked,
  //           // если включили трансфер+проживание — выключаем просто проживание
  //           habitation: checked ? false : prev.habitation,
  //         };
  //       }

  //       // остальные чекбоксы как раньше
  //       return {
  //         ...prev,
  //         [name]: checked,
  //       };
  //     });
  //   } else {
  //     setFormData((prev) => ({ ...prev, [name]: value }));
  //   }
  // }, []);

  const handleChange = useCallback((e) => {
    const { name, type, checked, value } = e.target;
    setIsEdited(true);

    if (type === "checkbox") {
      setFormData((prev) => {
        // независимые чекбоксы: при снятии сбрасываем только свои поля
        if (name === "habitation") {
          return {
            ...prev,
            habitation: checked,
            habitationPeopleCount: checked ? prev.habitationPeopleCount : "",
            habitationPlannedFromDate: checked ? prev.habitationPlannedFromDate : "",
            habitationPlannedFromTime: checked ? prev.habitationPlannedFromTime : "",
            habitationPlannedToDate: checked ? prev.habitationPlannedToDate : "",
            habitationPlannedToTime: checked ? prev.habitationPlannedToTime : "",
          };
        }

        if (name === "transferHabitation") {
          return {
            ...prev,
            transferHabitation: checked,
            transferHabitationPeopleCount: checked
              ? prev.transferHabitationPeopleCount
              : "",
            transferHabitationPlannedAt: checked
              ? prev.transferHabitationPlannedAt
              : "",
          };
        }

        if (name === "baggageDelivery") {
          return {
            ...prev,
            baggageDelivery: checked,
            baggageDeliveryPeopleCount: checked ? prev.baggageDeliveryPeopleCount : "",
            baggageDeliveryPlannedAt: checked ? prev.baggageDeliveryPlannedAt : "",
          };
        }

        if (name === "waterSupply") {
          return {
            ...prev,
            waterSupply: checked,
            waterPeopleCount: checked ? prev.waterPeopleCount : "",
            waterPlannedAt: checked ? prev.waterPlannedAt : "",
          };
        }

        if (name === "foodSupply") {
          return {
            ...prev,
            foodSupply: checked,
            foodPeopleCount: checked ? prev.foodPeopleCount : "",
            foodPlannedAt: checked ? prev.foodPlannedAt : "",
          };
        }

        return {
          ...prev,
          [name]: checked,
        };
      });
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  }, []);

  const buildPlannedAt = (timeStr) => {
    if (!timeStr) return null;
    const [hours, minutes] = timeStr.split(":").map(Number);
    const d = new Date();
    d.setHours(hours, minutes, 0, 0);
    return d.toISOString();
  };

  const buildPlannedFromTo = (dateStr, timeStr) => {
    if (!dateStr || !timeStr) return null;
    const [hours, minutes] = timeStr.split(":").map(Number);
    const [y, m, d] = dateStr.split("-").map(Number);
    const date = new Date(y, m - 1, d, hours, minutes, 0, 0);
    return date.toISOString();
  };

  const isFormValid = () => {
    const hasAnyService =
      formData.habitation ||
      formData.transferHabitation ||
      formData.baggageDelivery ||
      formData.foodSupply ||
      formData.waterSupply;

    if (
      !formData.airportId ||
      !formData.airlineId ||
      !formData.flightNumber ||
      !hasAnyService
    ) {
      return false;
    }

    // для каждой выбранной услуги — количество человек и время
    if (formData.waterSupply && (!formData.waterPeopleCount || !formData.waterPlannedAt))
      return false;
    if (formData.foodSupply && (!formData.foodPeopleCount || !formData.foodPlannedAt))
      return false;
    if (formData.habitation && (!formData.habitationPeopleCount || !formData.habitationPlannedFromDate || !formData.habitationPlannedFromTime || !formData.habitationPlannedToDate || !formData.habitationPlannedToTime))
      return false;
    if (formData.transferHabitation && (!formData.transferHabitationPeopleCount || !formData.transferHabitationPlannedAt))
      return false;
    if (formData.baggageDelivery && (!formData.baggageDeliveryPeopleCount || !formData.baggageDeliveryPlannedAt))
      return false;

    return true;
  };

  const [isLoading, setIsLoading] = useState(false);

  // Отправка формы на сервер (новый input)
  const handleSubmit = async () => {
    setIsLoading(true);

    if (!isFormValid()) {
      alert("Пожалуйста, заполните все обязательные поля.");
      setIsLoading(false);
      return;
    }

    const input = {
      airlineId: formData.airlineId,
      flightNumber: formData.flightNumber.trim(),
      airportId: formData.airportId || null,
      waterService: formData.waterSupply
        ? {
            plan: {
              enabled: true,
              peopleCount: Number(formData.waterPeopleCount),
              plannedAt: buildPlannedAt(formData.waterPlannedAt),
            },
          }
        : undefined,
      mealService: formData.foodSupply
        ? {
            plan: {
              enabled: true,
              peopleCount: Number(formData.foodPeopleCount),
              plannedAt: buildPlannedAt(formData.foodPlannedAt),
            },
          }
        : undefined,
      livingService: formData.habitation
        ? {
            plan: {
              enabled: true,
              peopleCount: Number(formData.habitationPeopleCount),
              plannedFromAt: buildPlannedFromTo(formData.habitationPlannedFromDate, formData.habitationPlannedFromTime),
              plannedToAt: buildPlannedFromTo(formData.habitationPlannedToDate, formData.habitationPlannedToTime),
            },
          }
        : undefined,
      transferService: formData.transferHabitation
        ? {
            plan: {
              enabled: true,
              peopleCount: Number(formData.transferHabitationPeopleCount),
              plannedAt: buildPlannedAt(formData.transferHabitationPlannedAt),
            },
          }
        : undefined,
      baggageDeliveryService: formData.baggageDelivery
        ? {
            plan: {
              enabled: true,
              peopleCount: Number(formData.baggageDeliveryPeopleCount),
              plannedAt: buildPlannedAt(formData.baggageDeliveryPlannedAt),
            },
          }
        : undefined,
    };

    console.log(input);

    try {
      const response = await createRequest({ variables: { input } });
      resetForm();
      onClose();
      if (addNotification) {
        addNotification(
          "Создание заявки для экипажа прошло успешно.",
          "success"
        );
      }
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
      setIsLoading(false);
    }
  };

  // console.log(formData);

  // Клик вне боковой панели закрывает её
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (sidebarRef.current?.contains(event.target)) {
        return;
      }
      closeButton();
    };

    if (show) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }

    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [show, closeButton]);

  useEffect(() => {
    setMatchingRequest(null);
  }, [formData]);

  return (
    <>
      <Sidebar show={show} sidebarRef={sidebarRef}>
        <div className={classes.requestTitle}>
          <div className={classes.requestTitle_name}>Создать заявку</div>
          <div className={classes.requestTitle_close} onClick={closeButton}>
            <CloseIcon />
          </div>
        </div>

        {isLoading ? (
          <MUILoader loadSize={"50px"} fullHeight={"75vh"} />
        ) : (
          <>
            <div className={classes.requestMiddle}>
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
                    const selected = airlines.find(
                      (airline) => airline.name === newValue
                    );
                    setSelectedAirline(selected || null);
                    setFormData((prevFormData) => ({
                      ...prevFormData,
                      airlineId: selected?.id || "",
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
                      city: newValue?.city || "",
                    }));
                    setIsEdited(true);
                  }}
                />

                <label>Введите рейс</label>
                <input
                  type="text"
                  name="flightNumber"
                  placeholder="Рейс"
                  value={formData.flightNumber}
                  onChange={handleChange}
                />

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
                      name="waterPeopleCount"
                      value={formData.waterPeopleCount}
                      onChange={handleChange}
                    />

                    <label>Введите время</label>
                    <input
                      type="time"
                      name="waterPlannedAt"
                      value={formData.waterPlannedAt}
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
                      name="foodPeopleCount"
                      value={formData.foodPeopleCount}
                      onChange={handleChange}
                    />

                    <label>Введите время</label>
                    <input
                      type="time"
                      name="foodPlannedAt"
                      value={formData.foodPlannedAt}
                      onChange={handleChange}
                      placeholder="Время"
                    />
                  </>
                )}

                <label className={classes.checkBoxWrapper}>
                  <input
                    type="checkbox"
                    name="habitation"
                    checked={formData.habitation}
                    onChange={handleChange}
                  />
                  Проживание
                </label>

                {formData.habitation && (
                  <>
                    <label>Введите количество человек</label>
                    <input
                      type="number"
                      name="habitationPeopleCount"
                      value={formData.habitationPeopleCount}
                      onChange={handleChange}
                    />

                    <label>Дата и время заезда</label>
                    <input
                      type="date"
                      name="habitationPlannedFromDate"
                      value={formData.habitationPlannedFromDate}
                      onChange={handleChange}
                    />
                    <input
                      type="time"
                      name="habitationPlannedFromTime"
                      value={formData.habitationPlannedFromTime}
                      onChange={handleChange}
                    />

                    <label>Дата и время выезда</label>
                    <input
                      type="date"
                      name="habitationPlannedToDate"
                      value={formData.habitationPlannedToDate}
                      onChange={handleChange}
                    />
                    <input
                      type="time"
                      name="habitationPlannedToTime"
                      value={formData.habitationPlannedToTime}
                      onChange={handleChange}
                    />
                  </>
                )}

                <label className={classes.checkBoxWrapper}>
                  <input
                    type="checkbox"
                    name="transferHabitation"
                    checked={formData.transferHabitation}
                    onChange={handleChange}
                  />
                  Трансфер
                </label>

                {formData.transferHabitation && (
                  <>
                    <label>Введите количество человек</label>
                    <input
                      type="number"
                      name="transferHabitationPeopleCount"
                      value={formData.transferHabitationPeopleCount}
                      onChange={handleChange}
                    />

                    <label>Введите время</label>
                    <input
                      type="time"
                      name="transferHabitationPlannedAt"
                      value={formData.transferHabitationPlannedAt}
                      onChange={handleChange}
                      placeholder="Время"
                    />
                  </>
                )}

                <label className={classes.checkBoxWrapper}>
                  <input
                    type="checkbox"
                    name="baggageDelivery"
                    checked={formData.baggageDelivery}
                    onChange={handleChange}
                  />
                  Доставка багажа
                </label>

                {formData.baggageDelivery && (
                  <>
                    <label>Введите количество человек</label>
                    <input
                      type="number"
                      name="baggageDeliveryPeopleCount"
                      value={formData.baggageDeliveryPeopleCount}
                      onChange={handleChange}
                    />

                    <label>Введите время</label>
                    <input
                      type="time"
                      name="baggageDeliveryPlannedAt"
                      value={formData.baggageDeliveryPlannedAt}
                      onChange={handleChange}
                      placeholder="Время"
                    />
                  </>
                )}
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
