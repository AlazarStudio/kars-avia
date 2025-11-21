import React, { useState, useRef, useEffect, useCallback } from "react";
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
  GET_REQUEST,
  getCookie,
  REQUEST_UPDATED_SUBSCRIPTION,
  SAVE_HANDLE_EXTEND_MUTATION,
  SAVE_MEALS_MUTATION,
  UPDATE_REQUEST_RELAY,
} from "../../../../graphQL_requests";
import Message from "../Message/Message";
import { menuAccess, roles } from "../../../roles";
import { Link } from "react-router-dom";
import ReactPaginate from "react-paginate";
import MUIAutocomplete from "../MUIAutocomplete/MUIAutocomplete";
import CreateRequestAirlineStaff from "../CreateRequestAirlineStaff/CreateRequestAirlineStaff";
import MUILoader from "../MUILoader/MUILoader";
import MUIAutocompleteColor from "../MUIAutocompleteColor/MUIAutocompleteColor";
import DeleteComponent from "../DeleteComponent/DeleteComponent";

function ExistRequest({
  show,
  onClose,
  setShowChooseHotel,
  chooseRequestID,
  // handleCancelRequest,
  accessMenu,
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
  const [isEditing2, setIsEditing2] = useState(false);

  const [showDelete, setShowDelete] = useState(false);

  const openDeleteComponent = () => {
    setShowDelete(true);
  };

  const closeDeleteComponent = () => {
    setShowDelete(false);
    closeButton();
  };

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
    setSelectedEmployee(null);
    setNewStaffId(null);
    setIsEditing(false);
    setIsEditing2(false);
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
    if (isEditing) {
      setIsLoading(true);
      try {
        const response = await updateRequestRelay({
          variables: {
            updateRequestId: chooseRequestID,
            input: {
              // requestId: chooseRequestID,
              arrival: `${formDataExtend.arrivalDate}T${formDataExtend.arrivalTime}:00+00:00`,
              departure: `${formDataExtend.departureDate}T${formDataExtend.departureTime}:00+00:00`,
              status:
                formData.status === "opened" || formData.status === "created"
                  ? formData.status
                  : newStatus,
              // newEndName: formDataExtend.departureName,
            },
          },
        });
        // console.log(response);

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
        // await refetch(); // Обновляем данные после изменения
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
        } else {
          // alert("Ошибка при сохранении");
        }
      } finally {
        setIsLoading(false);
      }
    }
    setIsEditing(!isEditing);
  };

  // console.log(formDataExtend);

  // Клик вне боковой панели закрывает её
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showDelete) return;
      if (sidebarRef.current && !sidebarRef.current.contains(event.target)) {
        closeButton();
      }
    };

    if (show) document.addEventListener("mousedown", handleClickOutside);
    else document.removeEventListener("mousedown", handleClickOutside);

    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [show, closeButton, showDelete]);

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

  const handleSaveMeals = async () => {
    if (isEditing2) {
      setIsLoading(true);
      try {
        await saveMeals({
          variables: {
            input: {
              requestId: chooseRequestID,
              dailyMeals: cleanedMealData,
            },
          },
        });
        await refetch(); // Обновляем данные после сохранения изменений в питании
        alert("Изменения сохранены");
      } catch (error) {
        console.error("Ошибка при сохранении:", error);
        alert("Ошибка при сохранении");
      } finally {
        setIsLoading(false);
      }
    }
    setIsEditing2(!isEditing2);
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

  const { data: airlineData, refetch: airlineRefetch } = useQuery(GET_AIRLINE, {
    context: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
    variables: { airlineId: formData?.airline?.id },
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

  const handleSaveChanges = () => {
    setIsLoading(true);

    if (!chooseRequestID || selectedEmployee === null) {
      alert("Пожалуйста, выберите сотрудника.");
      return;
    }

    updateRequestRelay({
      variables: {
        updateRequestId: chooseRequestID,
        input: {
          personId: selectedEmployee?.id,
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
      await refetch();
      await handleSaveMeals();
      await refetch();
    }
    setIsEditing(!isEditing);
  };

  const [newStaffId, setNewStaffId] = useState(null);
  const [showAddStaff, setShowAddStaff] = useState(false);
  const toggleAddStaff = () => setShowAddStaff((prev) => !prev);

  useEffect(() => {
    if (newStaffId) {
      setSelectedEmployee(newStaffId);
    }
  }, [newStaffId]);

  const [separator, setSeparator] = useState("airline");
  const [isHaveTwoChats, setIsHaveTwoChats] = useState();

  useEffect(() => {
    setSeparator("airline");
  }, [show]);

  // console.log(newStaffId);

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
            <div className={classes.requestTitle_close} onClick={closeButton}>
              <img src="/close.png" alt="" />
            </div>
          </div>
          {isLoading ? (
            <MUILoader loadSize={"50px"} fullHeight={"75vh"} />
          ) : (
            <>
              <div className={classes.tabs}>
                <div
                  className={`${classes.tab} ${
                    activeTab === "Общая" ? classes.activeTab : ""
                  }`}
                  onClick={() => handleTabChange("Общая")}
                >
                  Общая
                </div>
                {formData.status !== "created" &&
                  formData.status !== "opened" && (
                    <div
                      className={`${classes.tab} ${
                        activeTab === "Питание" ? classes.activeTab : ""
                      }`}
                      onClick={() => handleTabChange("Питание")}
                    >
                      Питание
                    </div>
                  )}
                {(!user?.airlineId || accessMenu.requestChat) && (
                  <div
                    className={`${classes.tab} ${
                      activeTab === "Комментарии" ? classes.activeTab : ""
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
                <div
                  className={`${classes.tab} ${
                    activeTab === "История" ? classes.activeTab : ""
                  }`}
                  onClick={() => handleTabChange("История")}
                >
                  История
                </div>

                {user?.role !== roles.airlineAdmin
                  ? // && handleCancelRequest
                    formData.status !== "created" &&
                    formData.status !== "opened" &&
                    formData.status !== "canceled" && (
                      <div className={classes.shahmatka_icon}>
                        <Link
                          to={`/hotels/${formData.hotelId}/${formData.id}`}
                          onClick={() => {
                            localStorage.setItem("selectedTab", 0);
                            closeButton();
                          }}
                          title="Шахматка"
                        >
                          <img src="/table.png" alt="" />
                        </Link>
                      </div>
                    )
                  : null}
              </div>

              <div
                className={classes.requestMiddle}
                style={{
                  height:
                   (activeTab !== "Комментарии" &&
                    activeTab !== "История" &&
                    formData.status !== "created" &&
                    formData.status !== "canceled" &&
                    // formData.status !== "archiving" &&
                    formData.status !== "archived" && (accessMenu ? (user?.airlineId && accessMenu?.requestUpdate) : true) )
                    ? "calc(100vh - 227px)" 
                    : 
                    (activeTab !== "Комментарии" &&
                    activeTab !== "История" &&
                    formData.status !== "created" &&
                    formData.status !== "canceled" &&
                    // formData.status !== "archiving" &&
                    formData.status !== "archived" && (accessMenu ? (!user?.airlineId && accessMenu?.requestUpdate) : true)) 
                    ? "calc(100vh - 230px)" 
                    : null,
                }}
              >
                {/* Вкладка "Общая" */}
                {activeTab === "Общая" && (
                  <div className={classes.requestData}>
                    {/* Информация о сотруднике */}
                    {formData.person ? (
                      <>
                        <div className={classes.requestDataTitle}>
                          Информация о сотруднике
                        </div>
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
                    ) : !user?.hotelId && formData.status !== "canceled" ? (
                      <>
                        {/* Если сотрудник не задан, предлагаем выбрать */}
                        <div className={classes.staffWrapper}>
                          <label>Добавьте сотрудника авиакомпании</label>
                          <div
                            className={classes.addStaff}
                            onClick={toggleAddStaff}
                          >
                            <img src="/plus.png" alt="" />
                          </div>
                        </div>
                        <MUIAutocompleteColor
                          dropdownWidth="100%"
                          label="Введите сотрудника"
                          // Передаём исходный массив объектов сотрудников
                          options={airlineStaff}
                          // getOptionLabel правильно формирует строку, даже если option – объект
                          getOptionLabel={(option) =>
                            option
                              ? `${option.name || ""} ${
                                  option.position?.name
                                } ${option.gender}`.trim()
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
                            airlineStaff?.find(
                              (person) => person.id === selectedEmployee?.id
                            ) || null
                          }
                          onChange={(event, newValue) => {
                            setSelectedEmployee(newValue);
                            // setFormData((prevFormData) => ({
                            //   ...prevFormData,
                            //   personId: newValue?.id || "",
                            // }));
                            // setIsEdited(true);
                          }}
                        />
                        <Button onClick={handleSaveChanges}>
                          Добавить сотрудника
                        </Button>
                      </>
                    ) : null}

                    {/* Информация о питании */}
                    <div className={classes.requestDataTitle}>Питание</div>
                    <div className={classes.requestDataInfo}>
                      <div className={classes.requestDataInfo_title}>
                        Питание
                      </div>
                      <div className={classes.requestDataInfo_desc}>
                        {formData?.mealPlan?.included
                          ? "Включено"
                          : "Не включено"}
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
                              {formData.hotel?.name || "—"}
                            </div>
                          </div>
                          <div className={classes.requestDataInfo}>
                            <div className={classes.requestDataInfo_title}>
                              Номер комнаты
                            </div>
                            <div className={classes.requestDataInfo_desc}>
                              {formData.hotelChess?.room?.name || "—"}
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
                      formData.status !== "canceled" && (
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
                      user?.role === roles.dispatcerAdmin && isEditing && (
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
                            <div>З</div>
                            <div>О</div>
                            <div>У</div>
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
                                  !isEditing2
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
                                  !isEditing2
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
                                  !isEditing2
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

                      {/* {formData.status !== "archived" &&
                        formData.status !== "canceled" && (
                          <Button onClick={handleSaveMeals}>Сохранить</Button>
                        )} */}
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
                    {user?.role !== roles.superAdmin &&
                    user?.role !== roles.dispatcerAdmin ? null : (
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
                      key={`${
                        chooseRequestID ? chooseRequestID : chooseReserveID
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
                          ? "calc(100vh - 225px)"
                          : "calc(100vh - 275px)"
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
                      {[...logsData.logs.logs].map((log, index) => (
                        <>
                          <div className={classes.historyDate} key={index}>
                            {new Date(log.createdAt).toLocaleDateString(
                              "ru-RU",
                              {
                                day: "numeric",
                                month: "long",
                                year: "numeric",
                              }
                            )}
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
                    {((user.role === roles.superAdmin ||
                      user.role === roles.dispatcerAdmin) &&
                        !formData.hotelId) && (
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
                // formData.status !== "archiving" &&
                formData.status !== "archived" &&
                activeTab !== "Комментарии" &&
                activeTab !== "История" &&
                (!user?.airlineId || accessMenu.requestUpdate) && (
                  <div className={classes.requestButton}>
                    <button
                      onClick={() => {
                        openDeleteComponent();
                      }}
                    >
                      {user?.airlineId &&
                      formData.status !== "archived" &&
                      formData.status !== "archiving"
                        ? "Запрос на отмену"
                        : "Отменить"}
                      {/* <img src="/user-check.png" alt="" /> */}
                    </button>
                    {activeTab === "Общая" ? (
                      <Button
                        onClick={handleExtendChangeRequest}
                        backgroundcolor={!isEditing ? "#3CBC6726" : "#0057C3"}
                        color={!isEditing ? "#3B6C54" : "#fff"}
                      >
                        {isEditing ? (
                          <>
                            {user?.airlineId && formData.status !== "created"
                              ? "Сохранить"
                              : "Сохранить"}{" "}
                            {/* <img src="/saveDispatcher.png" alt="" /> */}
                          </>
                        ) : (
                          <>
                            {user?.airlineId && formData.status !== "created"
                              ? "Изменить"
                              : "Изменить"}{" "}
                            {/* <img src="/editDispetcher.png" alt="" /> */}
                          </>
                        )}
                      </Button>
                    ) : (
                      <Button
                        onClick={handleSaveMeals}
                        backgroundcolor={!isEditing2 ? "#3CBC6726" : "#0057C3"}
                        color={!isEditing2 ? "#3B6C54" : "#fff"}
                      >
                        {isEditing2 ? (
                          <>
                            {user?.airlineId && formData.status !== "created"
                              ? "Сохранить"
                              : "Сохранить"}{" "}
                            {/* <img src="/saveDispatcher.png" alt="" /> */}
                          </>
                        ) : (
                          <>
                            {user?.airlineId && formData.status !== "created"
                              ? "Изменить"
                              : "Изменить"}{" "}
                            {/* <img src="/editDispetcher.png" alt="" /> */}
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                )}
            </>
          )}
          <CreateRequestAirlineStaff
            id={formData?.airline?.id} // Или любое другое значение, нужное для вашего компонента
            show={showAddStaff}
            onClose={toggleAddStaff}
            isExist={true}
            positions={positions}
            setNewStaffId={setNewStaffId}
            // setSelectedAirline={setSelectedAirline}
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

// import React, { useState, useRef, useEffect, useCallback } from "react";
// import classes from "./ExistRequest.module.css";
// import Button from "../../Standart/Button/Button";
// import Sidebar from "../Sidebar/Sidebar";
// import { useMutation, useQuery, useSubscription } from "@apollo/client";
// import {
//   CHANGE_TO_ARCHIVE,
//   convertToDate,
//   EXTEND_REQUEST_NOTIFICATION_SUBSCRIPTION,
//   GET_AIRLINE,
//   GET_AIRLINE_POSITIONS,
//   GET_REQUEST,
//   getCookie,
//   REQUEST_UPDATED_SUBSCRIPTION,
//   SAVE_HANDLE_EXTEND_MUTATION,
//   SAVE_MEALS_MUTATION,
//   UPDATE_REQUEST_RELAY,
// } from "../../../../graphQL_requests";
// import Message from "../Message/Message";
// import { menuAccess, roles } from "../../../roles";
// import { Link } from "react-router-dom";
// import ReactPaginate from "react-paginate";
// import MUIAutocomplete from "../MUIAutocomplete/MUIAutocomplete";
// import CreateRequestAirlineStaff from "../CreateRequestAirlineStaff/CreateRequestAirlineStaff";
// import MUILoader from "../MUILoader/MUILoader";
// import MUIAutocompleteColor from "../MUIAutocompleteColor/MUIAutocompleteColor";

// function ExistRequest({
//   show,
//   onClose,
//   setShowChooseHotel,
//   chooseRequestID,
//   handleCancelRequest,
//   user,
//   setChooseRequestID,
//   totalMeals,
//   setChooseCityRequest,
//   openDeleteComponent,
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
//       ? "reduced"
//       : formData?.arrival && new Date(formData.arrival) > arrivalTime
//       ? "earlyStart"
//       : formData?.arrival && new Date(formData.arrival) < arrivalTime
//       ? "reduced"
//       : formData?.status;

//   // console.log("newStatus:", newStatus);
//   const [isLoading, setIsLoading] = useState(false);

//   const handleExtendChangeRequest = async () => {
//     setIsLoading(true);
//     try {
//       const response = await updateRequestRelay({
//         variables: {
//           updateRequestId: chooseRequestID,
//           input: {
//             // requestId: chooseRequestID,
//             arrival: `${formDataExtend.arrivalDate}T${formDataExtend.arrivalTime}:00+00:00`,
//             departure: `${formDataExtend.departureDate}T${formDataExtend.departureTime}:00+00:00`,
//             status:
//               formData.status === "opened" || formData.status === "created"
//                 ? formData.status
//                 : newStatus,
//             // newEndName: formDataExtend.departureName,
//           },
//         },
//       });
//       // console.log(response);

//       alert(
//         user?.airlineId && formData.status !== "created"
//           ? "Запрос отправлен, можете посмотреть в комментариях."
//           : "Изменения сохранены"
//       );
//       setFormDataExtend((prev) => ({
//         ...prev,
//         departureDate:
//           user?.airlineId && formData.status !== "created"
//             ? parseDateTime(formData.departure).date
//             : "",
//         departureTime:
//           user?.airlineId && formData.status !== "created"
//             ? parseDateTime(formData.departure).time
//             : "",
//         arrivalDate:
//           user?.airlineId && formData.status !== "created"
//             ? parseDateTime(formData.arrival).date
//             : "",
//         arrivalTime:
//           user?.airlineId && formData.status !== "created"
//             ? parseDateTime(formData.arrival).time
//             : "",
//       }));
//       await refetch(); // Обновляем данные после изменения
//     } catch (error) {
//       console.error("Ошибка при сохранении:", error);
//       if (
//         String(error).startsWith(
//           "ApolloError: Невозможно разместить заявку: пересечение с заявкой"
//         )
//       ) {
//         alert("Невозможно разместить заявку: пересечение с другой заявкой");
//         setFormDataExtend((prev) => ({
//           departureDate: formData.departure
//             ? parseDateTime(formData.departure).date
//             : "",
//           departureTime: formData.departure
//             ? parseDateTime(formData.departure).time
//             : "",
//           arrivalDate: formData.arrival
//             ? parseDateTime(formData.arrival).date
//             : "",
//           arrivalTime: formData.arrival
//             ? parseDateTime(formData.arrival).time
//             : "",
//         }));
//       } else {
//         alert("Ошибка при сохранении");
//       }
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   // console.log(formDataExtend);

//   // Клик вне боковой панели закрывает её
//   useEffect(() => {
//     const handleClickOutside = (event) => {
//       if (sidebarRef.current && !sidebarRef.current.contains(event.target)) {
//         closeButton();
//       }
//     };

//     if (show) document.addEventListener("mousedown", handleClickOutside);
//     else document.removeEventListener("mousedown", handleClickOutside);

//     return () => document.removeEventListener("mousedown", handleClickOutside);
//   }, [show, closeButton]);

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
//     try {
//       await saveMeals({
//         variables: {
//           input: {
//             requestId: chooseRequestID,
//             dailyMeals: cleanedMealData,
//           },
//         },
//       });
//       alert("Изменения сохранены");
//       await refetch(); // Обновляем данные после сохранения изменений в питании
//     } catch (error) {
//       console.error("Ошибка при сохранении:", error);
//       alert("Ошибка при сохранении");
//     }
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
//               {(formData.status == "done" ||
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
//                     {/* <img src="/user-check.png" alt="" /> */}
//                   </button>
//                 )}
//             </div>
//             <div className={classes.requestTitle_close} onClick={closeButton}>
//               <img src="/close.png" alt="" />
//             </div>
//           </div>
//           {isLoading ? (
//             <MUILoader loadSize={"50px"} fullHeight={"75vh"} />
//           ) : (
//             <>
//               <div className={classes.tabs}>
//                 <div
//                   className={`${classes.tab} ${
//                     activeTab === "Общая" ? classes.activeTab : ""
//                   }`}
//                   onClick={() => handleTabChange("Общая")}
//                 >
//                   Общая
//                 </div>
//                 {formData.status !== "created" &&
//                   formData.status !== "opened" && (
//                     <div
//                       className={`${classes.tab} ${
//                         activeTab === "Питание" ? classes.activeTab : ""
//                       }`}
//                       onClick={() => handleTabChange("Питание")}
//                     >
//                       Питание
//                     </div>
//                   )}
//                 {(!user?.airlineId || menuAccess.requestChat) && (
//                 <div
//                   className={`${classes.tab} ${
//                     activeTab === "Комментарии" ? classes.activeTab : ""
//                   }`}
//                   style={{ position: "relative" }}
//                   onClick={() => handleTabChange("Комментарии")}
//                 >
//                   Комментарии
//                   {formData?.chat?.some(
//                     (chat) =>
//                       chat.unreadMessagesCount > 0 &&
//                       ((user.hotelId && chat.hotelId === user.hotelId) ||
//                         (user.airlineId && chat.airlineId === user.airlineId) ||
//                         (!user.hotelId && !user.airlineId))
//                   ) && <div className={classes.unreadMessages}></div>}
//                 </div>
//                 )}
//                 <div
//                   className={`${classes.tab} ${
//                     activeTab === "История" ? classes.activeTab : ""
//                   }`}
//                   onClick={() => handleTabChange("История")}
//                 >
//                   История
//                 </div>

//                 {user?.role !== roles.airlineAdmin
//                   ? // && handleCancelRequest
//                     formData.status !== "created" &&
//                     formData.status !== "opened" &&
//                     formData.status !== "canceled" && (
//                       <div className={classes.shahmatka_icon}>
//                         <Link
//                           to={`/hotels/${formData.hotelId}/${formData.id}`}
//                           onClick={() => {
//                             localStorage.setItem("selectedTab", 0);
//                             closeButton();
//                           }}
//                           title="Шахматка"
//                         >
//                           <img src="/table.png" alt="" />
//                         </Link>
//                       </div>
//                     )
//                   : null}
//               </div>

//               <div
//                 className={classes.requestMiddle}
//                 style={{
//                   height:
//                     (activeTab === "Комментарии" ||
//                       formData.status !== "created") &&
//                     "calc(100vh - 79px - 67px)",
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
//                             {formData?.person?.gender}
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
//                               ? `${option.name || ""} ${
//                                   option.position?.name
//                                 } ${option.gender}`.trim()
//                               : ""
//                           }
//                           // Если нужно кастомное раскрашивание, используйте renderOption (с isColor)
//                           renderOption={(optionProps, option) => {
//                             // Формируем строку для отображения
//                             const labelText = `${option.name || ""} ${
//                               option.position?.name
//                             } ${option.gender}`.trim();
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
//                                           ? "gray"
//                                           : "gray",
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
//                               {formData.mealPlan.breakfast}
//                             </div>
//                           </div>
//                           <div className={classes.requestDataInfo}>
//                             <div className={classes.requestDataInfo_title}>
//                               Обед
//                             </div>
//                             <div className={classes.requestDataInfo_desc}>
//                               {formData.mealPlan.lunch}
//                             </div>
//                           </div>
//                           <div className={classes.requestDataInfo}>
//                             <div className={classes.requestDataInfo_title}>
//                               Ужин
//                             </div>
//                             <div className={classes.requestDataInfo_desc}>
//                               {formData.mealPlan.dinner}
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
//                           <div className={classes.requestDataInfo}>
//                             <div className={classes.requestDataInfo_title}>
//                               Гостиница
//                             </div>
//                             <div className={classes.requestDataInfo_desc}>
//                               {formData.hotel?.name}
//                             </div>
//                           </div>
//                           <div className={classes.requestDataInfo}>
//                             <div className={classes.requestDataInfo_title}>
//                               Номер комнаты
//                             </div>
//                             <div className={classes.requestDataInfo_desc}>
//                               {formData.hotelChess?.room?.name}
//                             </div>
//                           </div>
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
//                             Изменение даты
//                           </div>
//                           <label>Заезд</label>
//                           <div className={classes.reis_info}>
//                             <input
//                               type="date"
//                               name="arrivalDate"
//                               value={formDataExtend.arrivalDate}
//                               onChange={handleExtendChange}
//                               placeholder="Дата"
//                             />
//                             <input
//                               type="time"
//                               name="arrivalTime"
//                               value={formDataExtend.arrivalTime}
//                               onChange={handleExtendChange}
//                               placeholder="Время"
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
//                             />
//                             <input
//                               type="time"
//                               name="departureTime"
//                               value={formDataExtend.departureTime}
//                               onChange={handleExtendChange}
//                               placeholder="Время"
//                             />
//                           </div>
//                           <Button onClick={handleExtendChangeRequest}>
//                             {user?.airlineId && formData.status !== "created"
//                               ? "Отправить запрос"
//                               : "Изменить даты"}
//                           </Button>
//                         </>
//                       )}

//                     {/* Продление */}
//                     {formData.status == "archiving" &&
//                       formData.status !== "opened" &&
//                       user?.role === roles.dispatcerAdmin && (
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
//                       <div className={classes.requestDataTitle}>
//                         Питание сотрудника
//                       </div>

//                       {/* Шапка */}
//                       <div
//                         className={classes.mealRow + " " + classes.mealHeader}
//                       >
//                         <div /> {/* под дату */}
//                         <div>З</div>
//                         <div>О</div>
//                         <div>У</div>
//                       </div>

//                       {/* Строки с данными */}
//                       {mealData.map((dailyMeal, index) => (
//                         <div key={index} className={classes.mealRow}>
//                           <div className={classes.mealInfoDate}>
//                             {convertToDate(dailyMeal.date)}
//                           </div>

//                           <input
//                             type="number"
//                             min={0}
//                             value={dailyMeal.breakfast}
//                             disabled={
//                               formData.status === "archived" ||
//                               formData.status === "canceled"
//                             }
//                             onChange={(e) =>
//                               handleMealChange(
//                                 index,
//                                 "breakfast",
//                                 e.target.value
//                               )
//                             }
//                           />
//                           <input
//                             type="number"
//                             min={0}
//                             value={dailyMeal.lunch}
//                             disabled={
//                               formData.status === "archived" ||
//                               formData.status === "canceled"
//                             }
//                             onChange={(e) =>
//                               handleMealChange(index, "lunch", e.target.value)
//                             }
//                           />
//                           <input
//                             type="number"
//                             min={0}
//                             value={dailyMeal.dinner}
//                             disabled={
//                               formData.status === "archived" ||
//                               formData.status === "canceled"
//                             }
//                             onChange={(e) =>
//                               handleMealChange(index, "dinner", e.target.value)
//                             }
//                           />
//                         </div>
//                       ))}

//                       {formData.status !== "archived" &&
//                         formData.status !== "canceled" && (
//                           <Button onClick={handleSaveMeals}>Сохранить</Button>
//                         )}
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
//                     {user?.role !== roles.superAdmin &&
//                     user?.role !== roles.dispatcerAdmin ? null : (
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
//                       key={`${
//                         chooseRequestID ? chooseRequestID : chooseReserveID
//                       }-${activeTab}`}
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
//                           ? "calc(100vh - 225px)"
//                           : "calc(100vh - 275px)"
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
//                     {user.role === roles.superAdmin ||
//                       (user.role === roles.dispatcerAdmin &&
//                         !formData.hotelId && (
//                           <Button
//                             onClick={() => {
//                               onClose();
//                               setShowChooseHotel(true);
//                               setChooseCityRequest(formData?.airport?.city);
//                               localStorage.setItem("selectedTab", 0);
//                             }}
//                           >
//                             {/* {console.log(formData)} */}
//                             Разместить
//                             <img
//                               style={{
//                                 width: "fit-content",
//                                 height: "fit-content",
//                               }}
//                               src="/user-check.png"
//                               alt=""
//                             />
//                           </Button>
//                         ))}
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
//             // setSelectedAirline={setSelectedAirline}
//           />
//         </Sidebar>
//       )}
//     </>
//   );
// }

// export default ExistRequest;
