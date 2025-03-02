import React, { useState, useRef, useEffect, useCallback } from "react";
import classes from "./ExistRequest.module.css";
import Button from "../../Standart/Button/Button";
import Sidebar from "../Sidebar/Sidebar";
import { useMutation, useQuery, useSubscription } from "@apollo/client";
import {
  CHANGE_TO_ARCHIVE,
  convertToDate,
  EXTEND_REQUEST_NOTIFICATION_SUBSCRIPTION,
  GET_REQUEST,
  getCookie,
  REQUEST_UPDATED_SUBSCRIPTION,
  SAVE_HANDLE_EXTEND_MUTATION,
  SAVE_MEALS_MUTATION,
} from "../../../../graphQL_requests";
import Message from "../Message/Message";
import { roles } from "../../../roles";
import { Link } from "react-router-dom";

function ExistRequest({
  show,
  onClose,
  setShowChooseHotel,
  chooseRequestID,
  handleCancelRequest,
  user,
  setChooseRequestID,
  totalMeals,
  setChooseCityRequest,
  openDeleteComponent,
  setRequestId,
}) {
  const token = getCookie("token");

  // Запросы данных о заявке и логе
  const { data, error, refetch } = useQuery(GET_REQUEST, {
    context: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
    variables: { requestId: chooseRequestID },
  });

  useEffect(() => {
    if (chooseRequestID && setRequestId) {
      setRequestId(chooseRequestID);
    }
  }, [chooseRequestID]); // Срабатывает только при изменении chooseRequestID

  const { data: subscriptionData } = useSubscription(
    EXTEND_REQUEST_NOTIFICATION_SUBSCRIPTION,
    {
      onData: () => {
        refetch();
      },
    }
  );

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
  const sidebarRef = useRef();

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
    }
  }, [data, show]);

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

  const [handleExtend] = useMutation(SAVE_HANDLE_EXTEND_MUTATION, {
    context: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  });

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

  const handleExtendChangeRequest = async () => {
    try {
      const response = await handleExtend({
        variables: {
          input: {
            requestId: chooseRequestID,
            newStart: `${formDataExtend.arrivalDate}T${formDataExtend.arrivalTime}:00+00:00`,
            newEnd: `${formDataExtend.departureDate}T${formDataExtend.departureTime}:00+00:00`,
            status:
              formData.status === "opened" || formData.status === "created"
                ? formData.status
                : newStatus,
            // newEndName: formDataExtend.departureName,
          },
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
      alert("Ошибка при сохранении");
    }
  };

  // console.log(formDataExtend);

  // Клик вне боковой панели закрывает её
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (sidebarRef.current && !sidebarRef.current.contains(event.target)) {
        closeButton();
      }
    };

    if (show) document.addEventListener("mousedown", handleClickOutside);
    else document.removeEventListener("mousedown", handleClickOutside);

    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [show, closeButton]);

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

  const handleSaveMeals = async () => {
    try {
      await saveMeals({
        variables: {
          input: {
            requestId: chooseRequestID,
            dailyMeals: cleanedMealData,
          },
        },
      });
      alert("Изменения сохранены");
      await refetch(); // Обновляем данные после сохранения изменений в питании
    } catch (error) {
      console.error("Ошибка при сохранении:", error);
      alert("Ошибка при сохранении");
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
    }
  };

  const [separator, setSeparator] = useState("airline");
  const [isHaveTwoChats, setIsHaveTwoChats] = useState();

  return (
    <>
      {formData && (
        <Sidebar show={show} sidebarRef={sidebarRef}>
          <div className={classes.requestTitle}>
            <div className={classes.requestTitle_name}>
              {formData.requestNumber}
              {(formData.status == "done" ||
                formData.status == "extended" ||
                formData.status == "reduced" ||
                formData.status == "transferred" ||
                formData.status == "earlyStart") &&
                handleCancelRequest &&
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
                    {/* <img src="/user-check.png" alt="" /> */}
                  </button>
                )}
            </div>
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
            {formData.status !== "created" && formData.status !== "opened" && (
              <div
                className={`${classes.tab} ${
                  activeTab === "Питание" ? classes.activeTab : ""
                }`}
                onClick={() => handleTabChange("Питание")}
              >
                Питание
              </div>
            )}
            <div
              className={`${classes.tab} ${
                activeTab === "Комментарии" ? classes.activeTab : ""
              }`}
              onClick={() => handleTabChange("Комментарии")}
            >
              Комментарии
            </div>
            <div
              className={`${classes.tab} ${
                activeTab === "История" ? classes.activeTab : ""
              }`}
              onClick={() => handleTabChange("История")}
            >
              История
            </div>

            {user.role !== roles.airlineAdmin && handleCancelRequest
              ? formData.status !== "created" &&
                formData.status !== "opened" &&
                formData.status !== "canceled" && (
                  <div className={classes.shahmatka_icon}>
                    <Link
                      to={`/hotels/${formData.hotelId}/${formData.id}`}
                      onClick={() => localStorage.setItem("selectedTab", 0)}
                    >
                      <img src="/placement_icon.png" alt="" />
                    </Link>
                  </div>
                )
              : null}
          </div>

          <div
            className={classes.requestMiddle}
            style={{
              height:
                (activeTab === "Комментарии" ||
                  formData.status !== "created") &&
                "calc(100vh - 79px - 67px)",
            }}
          >
            {/* Вкладка "Общая" */}
            {activeTab === "Общая" && (
              <div className={classes.requestData}>
                {/* Информация о сотруднике */}
                <div className={classes.requestDataTitle}>
                  Информация о сотруднике
                </div>
                <div className={classes.requestDataInfo}>
                  <div className={classes.requestDataInfo_title}>ФИО</div>
                  <div className={classes.requestDataInfo_desc}>
                    {formData.person.name}
                  </div>
                </div>
                <div className={classes.requestDataInfo}>
                  <div className={classes.requestDataInfo_title}>Должность</div>
                  <div className={classes.requestDataInfo_desc}>
                    {formData.person.position}
                  </div>
                </div>
                <div className={classes.requestDataInfo}>
                  <div className={classes.requestDataInfo_title}>Пол</div>
                  <div className={classes.requestDataInfo_desc}>
                    {formData.person.gender}
                  </div>
                </div>
                <div className={classes.requestDataInfo}>
                  <div className={classes.requestDataInfo_title}>
                    Номер телефона
                  </div>
                  <div className={classes.requestDataInfo_desc}>
                    {formData.person.number}
                  </div>
                </div>

                {/* Информация о питании */}
                <div className={classes.requestDataTitle}>Питание</div>
                <div className={classes.requestDataInfo}>
                  <div className={classes.requestDataInfo_title}>Питание</div>
                  <div className={classes.requestDataInfo_desc}>
                    {formData?.mealPlan?.included ? "Включено" : "Не включено"}
                  </div>
                </div>

                {formData?.mealPlan?.included &&
                  formData.status !== "created" &&
                  formData.status !== "opened" && (
                    <>
                      <div className={classes.requestDataInfo}>
                        <div className={classes.requestDataInfo_title}>
                          Завтрак
                        </div>
                        <div className={classes.requestDataInfo_desc}>
                          {formData.mealPlan.breakfast}
                        </div>
                      </div>
                      <div className={classes.requestDataInfo}>
                        <div className={classes.requestDataInfo_title}>
                          Обед
                        </div>
                        <div className={classes.requestDataInfo_desc}>
                          {formData.mealPlan.lunch}
                        </div>
                      </div>
                      <div className={classes.requestDataInfo}>
                        <div className={classes.requestDataInfo_title}>
                          Ужин
                        </div>
                        <div className={classes.requestDataInfo_desc}>
                          {formData.mealPlan.dinner}
                        </div>
                      </div>
                    </>
                  )}

                {/* Информация о заявке */}
                {formData.status !== "created" &&
                  formData.status !== "opened" && (
                    <>
                      <div className={classes.requestDataTitle}>
                        Информация о заявке
                      </div>
                      <div className={classes.requestDataInfo}>
                        <div className={classes.requestDataInfo_title}>
                          Номер заявки
                        </div>
                        <div className={classes.requestDataInfo_desc}>
                          {formData.requestNumber}
                        </div>
                      </div>
                      <div className={classes.requestDataInfo}>
                        <div className={classes.requestDataInfo_title}>
                          Город
                        </div>
                        <div className={classes.requestDataInfo_desc}>
                          {formData?.airport?.city}
                        </div>
                      </div>
                      <div className={classes.requestDataInfo}>
                        <div className={classes.requestDataInfo_title}>
                          Гостиница
                        </div>
                        <div className={classes.requestDataInfo_desc}>
                          {formData.hotel?.name}
                        </div>
                      </div>
                      <div className={classes.requestDataInfo}>
                        <div className={classes.requestDataInfo_title}>
                          Номер комнаты
                        </div>
                        <div className={classes.requestDataInfo_desc}>
                          {formData.hotelChess?.room?.name}
                        </div>
                      </div>
                      <div className={classes.requestDataInfo}>
                        <div className={classes.requestDataInfo_title}>
                          Заезд
                        </div>
                        <div className={classes.requestDataInfo_desc}>
                          {convertToDate(formData.arrival)} -{" "}
                          {convertToDate(formData.arrival, true)}
                        </div>
                      </div>
                      <div className={classes.requestDataInfo}>
                        <div className={classes.requestDataInfo_title}>
                          Выезд
                        </div>
                        <div className={classes.requestDataInfo_desc}>
                          {convertToDate(formData.departure)} -{" "}
                          {convertToDate(formData.departure, true)}
                        </div>
                      </div>
                    </>
                  )}

                {/* Продление */}
                {formData.status !== "archived" &&
                  // formData.status !== "created" &&
                  // formData.status !== "opened" &&
                  formData.status !== "canceled" &&
                  !user?.hotelId && (
                    // formData.status !== "archiving" &&
                    <>
                      <div className={classes.requestDataTitle}>
                        Изменение даты
                      </div>
                      <label>Заезд</label>
                      <div className={classes.reis_info}>
                        <input
                          type="date"
                          name="arrivalDate"
                          value={formDataExtend.arrivalDate}
                          onChange={handleExtendChange}
                          placeholder="Дата"
                        />
                        <input
                          type="time"
                          name="arrivalTime"
                          value={formDataExtend.arrivalTime}
                          onChange={handleExtendChange}
                          placeholder="Время"
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
                        />
                        <input
                          type="time"
                          name="departureTime"
                          value={formDataExtend.departureTime}
                          onChange={handleExtendChange}
                          placeholder="Время"
                        />
                      </div>
                      <Button onClick={handleExtendChangeRequest}>
                        {user?.airlineId && formData.status !== "created"
                          ? "Отправить запрос"
                          : "Изменить даты"}
                      </Button>
                    </>
                  )}

                {/* Продление */}
                {formData.status == "archiving" &&
                  formData.status !== "opened" &&
                  user?.role === roles.dispatcerAdmin && (
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
                  <div className={classes.requestDataTitle}>
                    Питание сотрудника
                  </div>

                  {mealData.map((dailyMeal, index) => (
                    <div key={index} className={classes.mealInfo}>
                      <div className={classes.mealInfoDate}>
                        {convertToDate(dailyMeal.date)}
                      </div>
                      <div className={classes.requestDataInfo}>
                        <div className={classes.requestDataInfo_title}>
                          Завтрак
                        </div>
                        <input
                          type="number"
                          min={0}
                          name="breakfastCount"
                          placeholder="Количество"
                          value={dailyMeal.breakfast}
                          // disabled={formData.status !== 'archived' && true}
                          onChange={(e) =>
                            handleMealChange(index, "breakfast", e.target.value)
                          }
                        />
                      </div>
                      <div className={classes.requestDataInfo}>
                        <div className={classes.requestDataInfo_title}>
                          Обед
                        </div>
                        <input
                          type="number"
                          min={0}
                          name="lunchCount"
                          placeholder="Количество"
                          value={dailyMeal.lunch}
                          // disabled={formData.status !== 'archived' && true}
                          onChange={(e) =>
                            handleMealChange(index, "lunch", e.target.value)
                          }
                        />
                      </div>
                      <div className={classes.requestDataInfo}>
                        <div className={classes.requestDataInfo_title}>
                          Ужин
                        </div>
                        <input
                          type="number"
                          min={0}
                          name="dinnerCount"
                          placeholder="Количество"
                          value={dailyMeal.dinner}
                          // disabled={formData.status !== 'archived' && true}
                          onChange={(e) =>
                            handleMealChange(index, "dinner", e.target.value)
                          }
                        />
                      </div>
                    </div>
                  ))}
                  {formData.status !== "archived" && (
                    <Button onClick={handleSaveMeals}>Сохранить</Button>
                  )}
                </div>
              )}

            {/* Вкладка "Комментарии" */}
            {activeTab === "Комментарии" && (
              <>
                {user.role !== roles.superAdmin &&
                user.role !== roles.dispatcerAdmin ? null : (
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
                  activeTab={activeTab}
                  setIsHaveTwoChats={setIsHaveTwoChats}
                  chooseRequestID={chooseRequestID}
                  chooseReserveID={""}
                  formData={formData}
                  token={token}
                  user={user}
                  separator={separator}
                  chatHeight={
                    (user?.airlineId || user?.hotelId)
                      ? "calc(100vh - 225px)"
                      : "calc(100vh - 275px)"
                  }
                />
              </>
            )}

            {/* Вкладка "История" */}
            {activeTab === "История" && logsData && (
              <div className={classes.requestData}>
                <div className={classes.logs}>
                  {[...logsData.logs].reverse().map((log, index) => (
                    <>
                      <div className={classes.historyDate} key={index}>
                        {new Date(log.createdAt).toLocaleDateString("ru-RU", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })}
                        {/* {convertToDate(log.createdAt)}{" "}
                        {convertToDate(log.createdAt, true)} */}
                      </div>
                      <div
                        className={classes.historyLog}
                        dangerouslySetInnerHTML={{
                          __html: `<span class='historyLogTime'>${convertToDate(
                            log.createdAt,
                            true
                          )}</span> ${log.description}`,
                        }}
                      >
                        {/* {log.description} */}
                      </div>
                    </>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Кнопка для размещения заявки */}
          {formData.status !== "archived" &&
            formData.status !== "done" &&
            formData.status !== "archiving" &&
            formData.status !== "extended" &&
            formData.status !== "reduced" &&
            formData.status !== "transferred" &&
            formData.status !== "earlyStart" &&
            formData.status !== "canceled" &&
            activeTab === "Общая" && (
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
                {user.role === roles.superAdmin ||
                  (user.role === roles.dispatcerAdmin && (
                    <Button
                      onClick={() => {
                        onClose();
                        setShowChooseHotel(true);
                        setChooseCityRequest(formData?.airport?.city);
                        localStorage.setItem("selectedTab", 0);
                      }}
                    >
                      {/* {console.log(formData)} */}
                      Разместить
                      <img
                        style={{ width: "fit-content", height: "fit-content" }}
                        src="/user-check.png"
                        alt=""
                      />
                    </Button>
                  ))}
              </div>
            )}
        </Sidebar>
      )}
    </>
  );
}

export default ExistRequest;
