import React, {
  useState,
  useRef,
  useEffect,
  useCallback,
  useMemo,
} from "react";
import { useMutation, useQuery, useSubscription } from "@apollo/client";
import classes from "./CreateTransferRequest.module.css";
import Button from "../../Standart/Button/Button.jsx";
import Sidebar from "../Sidebar/Sidebar.jsx";
import {
  CREATE_TRANSFER_REQUEST_MUTATION,
  decodeJWT,
  GET_AIRLINES_RELAY,
  GET_AIRLINES_SUBSCRIPTION,
  GET_AIRLINES_UPDATE_SUBSCRIPTION,
  getCookie,
} from "../../../../graphQL_requests.js";
import MUIAutocomplete from "../MUIAutocomplete/MUIAutocomplete.jsx";
import MUILoader from "../MUILoader/MUILoader.jsx";
import MUIAutocompleteColor from "../MUIAutocompleteColor/MUIAutocompleteColor.jsx";
import { AddressField } from "../AddressField/AddressField.jsx";

// Компонент для создания новой заявки
function CreateTransferRequest({ show, onClose, user, addNotification }) {
  const token = getCookie("token");
  const [userID, setUserID] = useState();
  const [isEdited, setIsEdited] = useState(false); // Флаг, указывающий, были ли изменения в форме
  const [airlines, setAirlines] = useState([]); // Список авиакомпаний
  const [selectedAirline, setSelectedAirline] = useState(null); // Выбранная авиакомпания
  const [newStaffId, setNewStaffId] = useState(null);
  const sidebarRef = useRef();
  const [disableAutocomplete, setDisableAutocomplete] = useState(false);

  // Запрос данных авиакомпаний и аэропортов
  const { data, refetch } = useQuery(GET_AIRLINES_RELAY, {
    context: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
    skip: !show,
  });
  const today = new Date().toISOString().split("T")[0];

  // Состояние активной вкладки и данных формы
  const [activeTab, setActiveTab] = useState("Общая");
  const [formData, setFormData] = useState({
    airlineId: selectedAirline?.id || "",
    senderId: "",
    fromAddress: "",
    toAddress: "",
    personsId: [],
    scheduledPickupAt: today || "",
    scheduledPickupAtTime: "",
    passengersCount: 0,
    description: "",
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
  const [createRequest] = useMutation(CREATE_TRANSFER_REQUEST_MUTATION, {
    context: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  });

  const airlineForAirlineAdmin = data?.airlines?.airlines.find(
    (airline) => airline.id === user?.airlineId
  );

  // Сброс формы к начальному состоянию
  const resetForm = useCallback(() => {
    setActiveTab("Общая");
    setSelectedAirline(user?.airlineId ? airlineForAirlineAdmin : null);
    setFormData({
      airlineId: selectedAirline?.id || "",
      fromAddress: "",
      toAddress: "",
      personsId: [],
      scheduledPickupAt: today || "",
      passengersCount: 0,
      description: "",
    });
    setIsEdited(false); // Сбрасываем флаг, что форма не изменена
    setDisableAutocomplete(false);
  }, [userID]);

  // Закрытие формы с проверкой на несохраненные изменения
  const closeButton = useCallback(() => {
    if (!isEdited) {
      resetForm();
      onClose();
      setNewStaffId(null);
      return;
    }

    if (window.confirm("Вы уверены? Все несохраненные данные будут удалены.")) {
      resetForm();
      onClose();
      setNewStaffId(null);
    }
  }, [isEdited, resetForm, onClose]);

  // Рассчитываем минимальную дату прибытия как дату, начиная с месяца назад
  const minArrivalDate = useMemo(() => {
    const date = new Date();
    date.setMonth(date.getMonth() - 1);
    return date.toISOString().split("T")[0];
  }, []);

  // Обработчик изменений в полях формы
  const handleChange = useCallback((e) => {
    const { name, value, type, checked } = e.target;

    // Обновляем флаг, что данные были изменены
    setIsEdited(true);

    setFormData((prevState) => ({
      ...prevState,
      [name]: value,
    }));
  }, []);

  // Обработчик переключения вкладок
  const handleTabChange = useCallback((tab) => setActiveTab(tab), []);

  const isFormValid = () => {
    return formData.airlineId && formData.scheduledPickupAt;
  };

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

    if (formData.scheduledPickupAt < today) {
      alert("Дата прибытия не может быть раньше сегодняшнего дня.");
      setFormData((prevFormData) => ({
        ...prevFormData,
        arrivalDate: "", // Очищаем дату прибытия
      }));
      return;
    }

    const input = {
      dispatcherId: formData.senderId,
      airlineId: formData.airlineId,
      fromAddress: formData.fromAddress,
      toAddress: formData.toAddress,
      personsId: formData.personsId,
      scheduledPickupAt: `${formData.scheduledPickupAt}T${formData.scheduledPickupAtTime}:00+00:00`,
      passengersCount: formData.personsId.length,
      description: formData.description,
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
      alert("Ошибка при создании заявки");
    } finally {
      // resetForm();
      setIsLoading(false);
    }
  };

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

  useEffect(() => {
    if (newStaffId && !disableAutocomplete) {
      setFormData((prevFormData) => ({
        ...prevFormData,
        personId: newStaffId,
      }));
    }
  }, [newStaffId, disableAutocomplete]);

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
                    </>
                  )}

                  {/* Подача */}
                  <AddressField
                    label="Адрес отправления"
                    placeholder="г. Черкесск, Ленина, 57Б"
                    value={formData.fromAddress}
                    onChange={(addr) => {
                      setFormData((prev) => ({ ...prev, fromAddress: addr }));
                      setIsEdited(true);
                    }}
                  />

                  {/* Куда ехать */}
                  <AddressField
                    label="Адрес прибытия"
                    placeholder="г. Минеральные Воды, Ленина, 10К1"
                    value={formData.toAddress}
                    onChange={(addr) => {
                      setFormData((prev) => ({
                        ...prev,
                        toAddress: addr,
                      }));
                      setIsEdited(true);
                    }}
                  />

                  {selectedAirline && (
                    <>
                      <label>Сотрудник авиакомпании</label>
                      <MUIAutocompleteColor
                        isDisabled={disableAutocomplete}
                        dropdownWidth="100%"
                        label="Введите сотрудника"
                        // Передаём исходный массив объектов сотрудников
                        options={selectedAirline.staff}
                        // getOptionLabel правильно формирует строку, даже если option – объект
                        getOptionLabel={(option) =>
                          option
                            ? `${option.name || ""} ${option.position?.name} ${
                                option.gender
                              }`.trim()
                            : ""
                        }
                        // Если нужно кастомное раскрашивание, используйте renderOption (с isColor)
                        renderOption={(optionProps, option) => {
                          // Формируем строку для отображения
                          const labelText = `${option.name || ""} ${
                            option.position?.name
                          } ${option.gender}`.trim();
                          // Разбиваем строку по пробелам
                          const words = labelText.split(". ");
                          return (
                            <li {...optionProps} key={option.id}>
                              {words.map((word, index) => (
                                <span
                                  key={index}
                                  style={{
                                    color:
                                      index === 0
                                        ? "black"
                                        : index === 1
                                        ? "gray"
                                        : "gray",
                                    marginRight: "4px",
                                  }}
                                >
                                  {word}
                                </span>
                              ))}
                            </li>
                          );
                        }}
                        // Значение контролируется объектом; если person не найден, возвращаем null
                        value={
                          selectedAirline.staff.find(
                            (person) => person.id === formData.personId
                          ) || null
                        }
                        onChange={(event, newValue) => {
                          setFormData((prevFormData) => ({
                            ...prevFormData,
                            personsId: [newValue?.id] || [],
                          }));
                          setIsEdited(true);
                        }}
                      />
                    </>
                  )}

                  <label>Дата и время заказа</label>
                  <div className={classes.reis_info}>
                    <input
                      type="date"
                      name="scheduledPickupAt"
                      value={formData.scheduledPickupAt || today}
                      min={today}
                      // min={minArrivalDate}
                      onChange={handleChange}
                      placeholder="Дата"
                    />
                    <input
                      type="time"
                      name="scheduledPickupAtTime"
                      value={formData.scheduledPickupAtTime}
                      onChange={handleChange}
                      placeholder="Время"
                    />
                  </div>

                  <label>Комментарий</label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    placeholder="Введите комментарий"
                  />
                </div>
              )}

              {/* Вкладка "Доп. услуги" */}
              {activeTab === "Доп. услуги" && (
                <div className={classes.requestData}></div>
              )}
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

export default CreateTransferRequest;
