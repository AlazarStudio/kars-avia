import React, { useState, useRef, useEffect, useCallback } from "react";
import classes from "./CreateRequestReport.module.css";
import Button from "../../Standart/Button/Button";
import Sidebar from "../Sidebar/Sidebar";
import { useMutation, useQuery } from "@apollo/client";
import {
  CREATE_HOTEL_REPORT,
  CREATE_REPORT,
  decodeJWT,
  GET_AIRLINES_RELAY,
  GET_HOTELS_RELAY,
  getCookie,
} from "../../../../graphQL_requests";
import MUILoader from "../MUILoader/MUILoader";
import MUIAutocomplete from "../MUIAutocomplete/MUIAutocomplete";
import MUIAutocompleteColor from "../MUIAutocompleteColor/MUIAutocompleteColor";

function CreateRequestReport({
  show,
  onClose,
  addNotification,
  positions,
  airports,
}) {
  const token = getCookie("token");
  const user = decodeJWT(token);

  const [isEdited, setIsEdited] = useState(false);
  const [formData, setFormData] = useState({
    startDate: "",
    endDate: "",
    airlineId: user.airlineId ? user.airlineId : "",
    hotelId: user.hotelId ? user.hotelId : "",
    personId: "",
    airportId: "",
    position: "",
    meal: true,
    living: true,
  });

  const categories = [
    { id: "squadron", name: "Эскадрилья" },
    { id: "engineers", name: "Инженеры" },
    { id: "all", name: "Все" },
  ];

  const [category, setCategory] = useState(categories[0]);

  // Определяем, для чего создаётся отчёт: для авиакомпании или для гостиницы
  const [airOrHotel, setAirOrHotel] = useState(
    user?.airlineId ? "airline" : user?.hotelId ? "hotel" : "airline"
  );

  // Состояние для списка авиакомпаний / гостиниц
  const [airlines, setAirlines] = useState([]);
  const [hotels, setHotels] = useState([]);
  // Состояние для выбранной авиакомпании/гостиницы
  const [selectedAirline, setSelectedAirline] = useState(null);
  const [selectedHotel, setSelectedHotel] = useState(null);

  const sidebarRef = useRef();
  const [isLoading, setIsLoading] = useState(false);

  // При открытии сайдбара снова определяем, что выбранно (авиакомпания/гостиница)
  useEffect(() => {
    setAirOrHotel(user?.airlineId ? "airline" : user?.hotelId ? "hotel" : "");
  }, [show, user?.airlineId, user?.hotelId]);

  // Готовим запрос в зависимости от того, что нужно: авиакомпании или гостиницы
  // const { data } = useQuery(
  //   airOrHotel === "airline" ? GET_AIRLINES_RELAY : GET_HOTELS_RELAY,
  //   {
  //     context: {
  //       headers: {
  //         Authorization: `Bearer ${token}`,
  //       },
  //     },
  //   }
  // );

  const { data } = useQuery(GET_AIRLINES_RELAY, {
    context: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  });

  const { data: hotelsData } = useQuery(GET_HOTELS_RELAY, {
    context: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  });

  // Массив авиакомпаний или гостиниц
  // const selectData =
  //   airOrHotel === "airline" ? data?.airlines?.airlines : data?.hotels?.hotels;

  // // Когда данные загрузились, сохраняем их во внутреннем состоянии
  // useEffect(() => {
  //   setAirlines(selectData || []);
  // }, [selectData]);

  useEffect(() => {
    setAirlines(data?.airlines?.airlines || []);
    setHotels(hotelsData?.hotels?.hotels || []);
  }, [data, hotelsData]);

  // Если у пользователя есть airlineId и мы работаем с "airline",
  // то автоматически устанавливаем выбранную авиакомпанию
  useEffect(() => {
    if (airOrHotel === "airline" && user.airlineId && airlines?.length) {
      const matchedAirline = airlines.find(
        (airline) => airline.id === user.airlineId
      );
      if (matchedAirline) {
        setSelectedAirline(matchedAirline);
        setFormData((prev) => ({
          ...prev,
          airlineId: matchedAirline.id,
          personId: "", // Сбросим сотрудника, если вдруг был выбран
        }));
      }
      setCategory(categories[0]);
    }
    if (airOrHotel === "hotel" && user.hotelId && hotels?.length) {
      const matchedAirline = hotels.find(
        (airline) => airline.id === user.hotelId
      );
      if (matchedAirline) {
        setSelectedAirline(matchedAirline);
        setFormData((prev) => ({
          ...prev,
          hotelId: matchedAirline.id,
        }));
      }
    }
  }, [airOrHotel, user.airlineId, user.hotelId, airlines, hotels]);

  const specialPositions =
    category.id === "squadron"
      ? positions.filter((position) => position.category === "squadron")
      : category.id === "engineers"
      ? positions.filter((position) => position.category === "engineers")
      : positions;

  // Мутация для создания отчёта
  const [createReport] = useMutation(
    airOrHotel === "airline" ? CREATE_REPORT : CREATE_HOTEL_REPORT,
    {
      context: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    }
  );

  // Сброс формы
  const resetForm = useCallback(() => {
    setFormData({
      startDate: "",
      endDate: "",
      airlineId: user.airlineId ? user.airlineId : "",
      hotelId: user.hotelId ? user.hotelId : "",
      personId: "",
      airportId: "",
      position: "",
      meal: true,
      living: true,
    });
    setSelectedAirline(null);
    setAirOrHotel("");
    setCategory(categories[0]);
    setIsEdited(false);
  }, [user.airlineId, user.hotelId]);

  // Закрытие формы с проверкой изменений
  const closeButton = useCallback(() => {
    if (!isEdited) {
      resetForm();
      onClose();
      return;
    }
    if (window.confirm("Вы уверены? Все несохраненные данные будут удалены.")) {
      resetForm();
      onClose();
    }
  }, [isEdited, resetForm, onClose]);

  // Следим за кликом вне сайдбара
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (sidebarRef.current?.contains(event.target)) return;
      closeButton();
    };

    if (show) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [show, closeButton]);

  // Поля формы меняются
  const handleChange = useCallback((e) => {
    const { name, value, type, checked } = e.target;
    setIsEdited(true);

    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  }, []);

  // Проверка валидности
  const isFormValid = () => {
    return (
      formData.startDate &&
      formData.endDate &&
      category &&
      // formData.airportId &&
      (formData.airlineId || formData.hotelId) &&
      (formData.living || formData.meal)
    );
  };

  // Обработчик отправки формы
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    if (!isFormValid()) {
      alert("Пожалуйста, заполните все обязательные поля.");
      setIsLoading(false);
      return;
    }
    if (formData.endDate < formData.startDate) {
      alert("Конечная дата не может быть раньше начальной.");
      setFormData((prev) => ({ ...prev, endDate: "" }));
      setIsLoading(false);
      return;
    }

    // const selectedAirport = airports.find(
    //   (airport) =>
    //     `${airport.code} ${airport.name}, город: ${airport.city}` ===
    //     formData.airport
    // );

    const selectedPosition = positions.find(
      (position) => position.name === formData.position
    );

    const input = {
      filter: {
        startDate: `${formData.startDate}T00:10:00`,
        endDate: `${formData.endDate}T23:50:00`,
        ...(airOrHotel === "airline" && {
          airportId: formData.airportId,
          positionId: selectedPosition?.id || "",
          position: category.id,
          personId: formData.personId,
        }),
        airlineId: formData.airlineId,
        hotelId: formData.hotelId,
        // ...(airOrHotel === "hotel" && {
        // }),
      },
      format: "xlsx",
    };

    const createFilterInput = {
      living: formData.living,
      meal: formData.meal,
    };

    try {
      await createReport({
        variables: { input, createFilterInput },
      });
      resetForm();
      onClose();
      addNotification(
        `Отчет ${
          formData.personId !== "" ? "по сотруднику" : ""
        } создан успешно.`,
        "success"
      );
    } catch (error) {
      console.error("Catch: ", error);
      // console.log(input);
    } finally {
      setIsLoading(false);
    }
  };
  // console.log(formData);
  // console.log(category);
  // console.log(airOrHotel);

  // console.log(`${formData.startDate}T00:10:00`);
  // console.log(`${formData.endDate}T23:50:00`);

  return (
    <Sidebar show={show} sidebarRef={sidebarRef}>
      <div className={classes.requestTitle}>
        <div className={classes.requestTitle_name}>Добавить отчет</div>
        <div className={classes.requestTitle_close} onClick={closeButton}>
          <img src="/close.png" alt="" />
        </div>
      </div>

      {isLoading ? (
        <MUILoader loadSize={"50px"} fullHeight={"80vh"} />
      ) : (
        <>
          <div className={classes.requestMiddle}>
            <div className={classes.requestData}>
              {!user.airlineId && !user.hotelId && (
                <>
                  <label>Авиакомпания или гостиница</label>
                  <MUIAutocomplete
                    dropdownWidth={"100%"}
                    label={"Выберите тип отчета"}
                    options={["Авиакомпания", "Гостиница"]}
                    value={
                      airOrHotel
                        ? airOrHotel === "airline"
                          ? "Авиакомпания"
                          : "Гостиница"
                        : ""
                    }
                    onChange={(event, newValue) => {
                      setAirOrHotel(
                        newValue === "Авиакомпания" ? "airline" : "hotel"
                      );
                      setIsEdited(true);
                    }}
                  />
                </>
              )}

              {airOrHotel === "airline" && !user.airlineId && (
                <>
                  <label>Авиакомпания</label>
                  <MUIAutocomplete
                    dropdownWidth={"100%"}
                    label={"Выберите авиакомпанию"}
                    options={airlines?.map((airline) => airline.name)}
                    value={selectedAirline?.name || ""}
                    onChange={(event, newValue) => {
                      const matched = airlines.find(
                        (airline) => airline.name === newValue
                      );
                      setSelectedAirline(matched || null);
                      setFormData((prevFormData) => ({
                        ...prevFormData,
                        airlineId: matched?.id || "",
                        personId: "",
                      }));
                      setIsEdited(true);
                    }}
                  />
                  <label>Гостиница</label>
                  <MUIAutocompleteColor
                    dropdownWidth="100%"
                    label={"Выберите гостиницу"}
                    options={hotels}
                    getOptionLabel={(option) =>
                      option
                        ? `${option.name}, город: ${option?.information?.city}`.trim()
                        : ""
                    }
                    renderOption={(optionProps, option) => {
                      const cityPart = `,, город: ${option?.information?.city}`;
                      const labelText = `${option.name}${cityPart}`.trim();
                      const words = labelText.split(", ");

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
                    value={selectedHotel ? selectedHotel : ""}
                    onChange={(event, newValue) => {
                      const matched = hotels.find(
                        (hotel) => hotel === newValue
                      );
                      setSelectedHotel(matched || null);
                      setFormData((prevFormData) => ({
                        ...prevFormData,
                        hotelId: matched?.id || "",
                      }));
                      setIsEdited(true);
                    }}
                  />
                </>
              )}

              {airOrHotel === "hotel" && !user.hotelId && (
                <>
                  <label>Гостиница</label>
                  <MUIAutocompleteColor
                    dropdownWidth="100%"
                    label={"Выберите гостиницу"}
                    options={hotels}
                    getOptionLabel={(option) =>
                      option
                        ? `${option.name}, город: ${option?.information?.city}`.trim()
                        : ""
                    }
                    renderOption={(optionProps, option) => {
                      const cityPart = `,, город: ${option?.information?.city}`;
                      const labelText = `${option.name}${cityPart}`.trim();
                      const words = labelText.split(", ");

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
                    value={selectedHotel ? selectedHotel : ""}
                    onChange={(event, newValue) => {
                      const matched = hotels.find(
                        (hotel) => hotel === newValue
                      );
                      setSelectedHotel(matched || null);
                      setFormData((prevFormData) => ({
                        ...prevFormData,
                        hotelId: matched?.id || "",
                      }));
                      setIsEdited(true);
                    }}
                  />
                  <label>Авиакомпания</label>
                  <MUIAutocomplete
                    dropdownWidth={"100%"}
                    label={"Выберите авиакомпанию"}
                    options={airlines?.map((airline) => airline.name)}
                    value={selectedAirline?.name || ""}
                    onChange={(event, newValue) => {
                      const matched = airlines.find(
                        (airline) => airline.name === newValue
                      );
                      setSelectedAirline(matched || null);
                      setFormData((prevFormData) => ({
                        ...prevFormData,
                        airlineId: matched?.id || "",
                        personId: "",
                      }));
                      setIsEdited(true);
                    }}
                  />
                </>
              )}

              {/* Если выбрана авиакомпания (или у user есть airlineId), 
                  и у выбранной авиакомпании есть staff, то показываем выбор сотрудника */}
              {airOrHotel === "airline" &&
                (selectedAirline?.staff || user.airlineId) && (
                  <>
                    <label>Аэропорт</label>
                    <MUIAutocompleteColor
                      dropdownWidth="100%"
                      label={"Выберите аэропорт"}
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
                        airports.find((o) => o.id === formData.airportId) ||
                        null
                      }
                      onChange={(e, newValue) => {
                        setFormData((prevFormData) => ({
                          ...prevFormData,
                          airportId: newValue?.id || "",
                        }));
                        setIsEdited(true);
                      }}
                    />

                    <label>Категория</label>
                    <MUIAutocomplete
                      dropdownWidth={"100%"}
                      label={"Выберите категорию"}
                      // labelOnFocus={"Выберите должность"}
                      // options={["По всем должностям", ...positions.map((position) => position.name)]}
                      options={categories.map((i) => i.name)}
                      value={
                        categories?.find((i) => i.id === category.id).name ||
                        categories[0].name
                      }
                      onChange={(event, newValue) => {
                        const matches =
                          categories.find((i) => i.name === newValue) ||
                          categories[0];
                        setCategory(matches);
                        setIsEdited(true);
                      }}
                    />
                    {/* {console.log(category)} */}
                    {category && (
                      <>
                        <label>Должность</label>
                        <MUIAutocomplete
                          dropdownWidth={"100%"}
                          label={"По всем должностям"}
                          labelOnFocus={"Выберите должность"}
                          // options={["По всем должностям", ...positions.map((position) => position.name)]}
                          options={specialPositions?.map(
                            (position) => position.name
                          )}
                          value={formData.position}
                          onChange={(event, newValue) => {
                            setFormData((prevFormData) => ({
                              ...prevFormData,
                              position:
                                newValue === "По всем должностям"
                                  ? ""
                                  : newValue,
                            }));
                            setIsEdited(true);
                          }}
                        />
                        <label>Сотрудник авиакомпании</label>
                        <MUIAutocompleteColor
                          dropdownWidth="100%"
                          listboxHeight={"300px"}
                          label={"По всем сотрудникам"}
                          labelOnFocus={"Введите сотрудника"}
                          // Фильтрация сотрудников по должности
                          options={(selectedAirline?.staff || []).filter(
                            (person) =>
                              formData.position
                                ? person?.position?.name === formData.position
                                : true
                          )}
                          getOptionLabel={(option) =>
                            option
                              ? `${option.name || ""} ${
                                  option?.position?.name
                                } ${option.gender}`.trim()
                              : ""
                          }
                          renderOption={(optionProps, option) => {
                            // Формируем строку для отображения
                            const labelText = `${option.name || ""} ${
                              option?.position?.name
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
                          value={selectedAirline?.staff.find(
                            (person) => person.id === formData.personId
                          )}
                          onChange={(event, newValue) => {
                            setFormData((prevFormData) => ({
                              ...prevFormData,
                              personId: newValue?.id || "",
                            }));
                            setIsEdited(true);
                          }}
                        />
                      </>
                    )}
                  </>
                )}

              <label>
                <input
                  type="checkbox"
                  name="living"
                  checked={formData.living}
                  onChange={handleChange}
                />
                Проживание
              </label>

              <label>
                <input
                  type="checkbox"
                  name="meal"
                  checked={formData.meal}
                  onChange={handleChange}
                />
                Питание
              </label>

              <label>Начальная дата</label>
              <input
                type="date"
                name="startDate"
                placeholder="Начальная дата"
                value={formData.startDate}
                onChange={handleChange}
              />

              <label>Конечная дата</label>
              <input
                type="date"
                name="endDate"
                min={formData.startDate}
                placeholder="Конечная дата"
                value={formData.endDate}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className={classes.requestButton}>
            <Button type="submit" onClick={handleSubmit}>
              Добавить
            </Button>
          </div>
        </>
      )}
    </Sidebar>
  );
}

export default CreateRequestReport;
