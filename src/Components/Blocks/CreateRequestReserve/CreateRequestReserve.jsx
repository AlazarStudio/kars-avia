import React, { useState, useRef, useEffect } from "react";
import classes from "./CreateRequestReserve.module.css";
import Button from "../../Standart/Button/Button";
import Sidebar from "../Sidebar/Sidebar";
import {
  CREATE_REQUEST_RESERVE_MUTATION,
  decodeJWT,
  GET_AIRLINES_RELAY,
  GET_AIRPORTS_RELAY,
  getCookie,
} from "../../../../graphQL_requests";
import { useMutation, useQuery } from "@apollo/client";
import DropDownList from "../DropDownList/DropDownList";
import { roles } from "../../../roles";
import MUIAutocomplete from "../MUIAutocomplete/MUIAutocomplete";
import MUILoader from "../MUILoader/MUILoader";

function CreateRequestReserve({ show, onClose, user, addNotification }) {
  const token = getCookie("token");
  const [userID, setUserID] = useState();

  const [formData, setFormData] = useState({
    // reserveForPerson: '',
    airlineId: "",
    city: "",
    airportId: "",
    route: "",
    arrivalDate: "",
    arrivalTime: "",
    departureDate: "",
    departureTime: "",
    passengerCount: "",
    mealPlan: {
      included: false,
      breakfast: false,
      lunch: false,
      dinner: false,
    },
    senderId: "",
    files: null,
  });

  useEffect(() => {
    if (token) {
      setUserID(decodeJWT(token).userId);
      setFormData((prevFormData) => ({
        ...prevFormData,
        senderId: decodeJWT(token).userId,
        airlineId: user?.airlineId || prevFormData.airlineId, // Если есть user.airlineId, задаем его
      }));
    }
  }, [token, userID]);

  const sidebarRef = useRef();

  const resetForm = () => {
    setFormData({
      // reserveForPerson: '',
      airlineId: user?.airlineId ? user?.airlineId : "",
      city: "",
      airportId: "",
      route: "",
      arrivalDate: "",
      arrivalTime: "",
      departureDate: "",
      departureTime: "",
      passengerCount: "",
      mealPlan: {
        included: false,
        breakfast: false,
        lunch: false,
        dinner: false,
      },
      senderId: userID,
    });
  };

  const closeButton = () => {
    let success = confirm("Вы уверены, все несохраненные данные будут удалены");
    if (success) {
      resetForm();
      onClose();
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    // if (name === 'reserveForPerson') {
    //     setFormData(prevState => ({
    //         ...prevState,
    //         [name]: value === 'true' // Преобразуем строку в boolean
    //     }));
    // } else
    if (type === "checkbox") {
      setFormData((prevState) => ({
        ...prevState,
        mealPlan: {
          ...prevState.mealPlan,
          [name]: checked, // Используем значение checked для чекбоксов
        },
      }));
    } else if (name === "included") {
      const included = value === "true"; // Убедитесь, что значение 'true' передается корректно
      setFormData((prevState) => ({
        ...prevState,
        mealPlan: {
          ...prevState.mealPlan,
          included,
          ...(included
            ? {}
            : { breakfast: false, lunch: false, dinner: false }), // Если не включено, сбрасываем
        },
      }));
    } else if (name === "city") {
      setFormData((prevState) => ({
        ...prevState,
        [name]: value,
        airportId: "", // Сброс аэропорта при изменении города
      }));
    } else {
      setFormData((prevState) => ({
        ...prevState,
        [name]: value, // Все остальные текстовые поля
      }));
    }
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (sidebarRef.current && !sidebarRef.current.contains(event.target)) {
        closeButton();
      }
    };

    if (show) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [show, onClose]);

  let infoAirports = useQuery(GET_AIRPORTS_RELAY);

  const { loading, error, data } = useQuery(GET_AIRLINES_RELAY);
  const [airlines, setAirlines] = useState([]);

  const [airports, setAirports] = useState([]);

  useEffect(() => {
    if (infoAirports.data) {
      setAirports(infoAirports.data?.airports || []);
    }
    if (data && data.airlines) {
      setAirlines(data.airlines.airlines);
    }
  }, [infoAirports, data]);

  const uniqueCities = [
    ...new Set(airports.map((airport) => airport.city.trim())),
  ].sort((a, b) => a.localeCompare(b));
  // console.log(airports);

  const filteredAirports = formData.city
    ? airports.filter((airport) => airport.city.trim() === formData.city.trim())
    : [];

  const [createRequest] = useMutation(CREATE_REQUEST_RESERVE_MUTATION, {
    context: {
      headers: {
        Authorization: `Bearer ${token}`,
        "Apollo-Require-Preflight": "true",
      },
    },
  });

  const isFormValid = () => {
    return (
      formData.airportId &&
      // formData.route &&
      formData.arrivalDate &&
      formData.arrivalTime &&
      formData.departureDate &&
      formData.departureTime &&
      formData.passengerCount && // Убедиться, что количество пассажиров указано
      formData.senderId &&
      formData.airlineId
    );
  };

  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async () => {
    setIsLoading(true);
    if (!isFormValid()) {
      alert("Пожалуйста, заполните все обязательные поля.");
      setIsLoading(false);
      return;
    }

    const input = {
      airportId: formData.airportId,
      arrival: `${formData.arrivalDate}T${formData.arrivalTime}:00+00:00`,
      departure: `${formData.departureDate}T${formData.departureTime}:00+00:00`,
      mealPlan: {
        included: formData.mealPlan.included,
        // breakfast: formData.mealPlan.breakfast,
        // lunch: formData.mealPlan.lunch,
        // dinner: formData.mealPlan.dinner,
      },
      senderId: formData.senderId,
      airlineId: formData.airlineId,
      passengerCount: Number(formData.passengerCount),
      // reserveForPerson: formData.reserveForPerson
    };

    try {
      await createRequest({ variables: { input, files: formData.files } });
      resetForm();
      onClose();
      setIsLoading(false);
      addNotification(
        "Создание заявки для пассажиров прошло успешно.",
        "success"
      );
    } catch (e) {
      console.error(e);
      setIsLoading(false);
    }
    // resetForm();
    // onClose();
  };

  // console.log(formData);

  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const file = e.target.files[0];

    if (file) {
      setFormData((prevState) => ({
        ...prevState,
        files: file,
      }));
      // if (fileInputRef.current) {
      //   fileInputRef.current.value = ""; // Сброс значения в DOM-элементе
      // }
      // return;
    }
  };

  return (
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
            <div className={classes.requestData}>
              {/* <label>Тип заявки</label>
                    <DropDownList
                        placeholder="Выберите тип"
                        searchable={false}
                        options={["Заявка для экипажа", "Заявка для пассажиров"]}
                        initialValue={formData.reserveForPerson === true ? 'Заявка для экипажа' : formData.reserveForPerson === false ?'Заявка для пассажиров' : ''}
                        onSelect={(value) => {
                        const pass = value === "Заявка для экипажа" ? true : false;
                        setFormData((prevFormData) => ({
                            ...prevFormData,
                            reserveForPerson: pass
                        }));
                        // setIsEdited(true);
                        }}
                    /> */}
              {/* <select name="reserveForPerson" value={formData.reserveForPerson} onChange={handleChange}>
                        <option value="" disabled>Выберите тип</option>
                        <option value={true}>Заявка для экипажа</option>
                        <option value={false}>Заявка для пассажиров</option>
                    </select> */}

              {user?.role === roles.airlineAdmin ? null : (
                <>
                  <label>Авиакомпания</label>
                  <MUIAutocomplete
                    dropdownWidth={"100%"}
                    label={"Введите авиакомпанию"}
                    options={airlines?.map((airline) => airline.name)}
                    value={
                      airlines.find(
                        (airline) => airline.id === formData.airlineId
                      )?.name || ""
                    }
                    onChange={(event, newValue) => {
                      const selectedAirline = airlines.find(
                        (airline) => airline.name === newValue
                      );
                      setFormData((prevFormData) => ({
                        ...prevFormData,
                        airlineId: selectedAirline?.id || "",
                      }));
                      // setIsEdited(true);
                    }}
                  />
                  {/* <DropDownList
                                placeholder="Введите авиакомпанию"
                                searchable={false}
                                options={airlines?.map((airline) => airline.name)}
                                initialValue={airlines.find(airline => airline.id === formData.airlineId)?.name || ""}
                                onSelect={(value) => {
                                const selectedAirline = airlines.find(
                                    (airline) => airline.name === value
                                );
                                setFormData((prevFormData) => ({
                                    ...prevFormData,
                                    airlineId: selectedAirline?.id || "",
                                }));
                                // setIsEdited(true);
                                }}
                            /> */}
                </>
              )}

              {/* <select name="airlineId" value={formData.airlineId} onChange={handleChange}>
                        <option value="" disabled>Выберите авиакомпанию</option>
                        {airlines.map(airline => (
                            <option key={airline.id} value={airline.id}>
                                {airline.name}
                            </option>
                        ))}
                    </select> */}

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
                  //   setIsEdited(true);
                }}
              />
              {/* <DropDownList
            placeholder="Введите город"
            options={uniqueCities}
            initialValue={formData.city}
            onSelect={(value) => {
              setFormData((prevFormData) => ({
                ...prevFormData,
                city: value,
                airportId: "",
              }));
              // setIsEdited(true);
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
                      // setIsEdited(true);
                    }}
                  />
                  {/* <DropDownList
                placeholder="Введите аэропорт"
                options={filteredAirports.map((airport) => airport.name)}
                initialValue={
                  filteredAirports.find(
                    (airport) => airport.id === formData.airportId
                  )?.name || ""
                }
                onSelect={(value) => {
                  const selectedAirport = filteredAirports.find(
                    (airport) => airport.name === value
                  );
                  setFormData((prevFormData) => ({
                    ...prevFormData,
                    airportId: selectedAirport?.id || "",
                  }));
                  // setIsEdited(true);
                }}
              /> */}
                  {/* <select name="airportId" value={formData.airportId} onChange={handleChange} disabled={!formData.city}>
                                <option value="" disabled>Выберите аэропорт</option>
                                {filteredAirports.map(airport => (
                                    <option key={airport.id} value={airport.id}>
                                        {airport.name}
                                    </option>
                                ))}
                            </select> */}
                </>
              )}

              <label>Количество людей на заселение</label>
              <input
                type="number"
                name="passengerCount"
                placeholder="100"
                value={formData.passengerCount}
                onChange={handleChange}
              />

              {/* <label>Рейс</label>
                    <input type="text" name="route" placeholder="Рейс" value={formData.route} onChange={handleChange} /> */}

              <label>Прибытие</label>
              <div className={classes.reis_info}>
                <input
                  type="date"
                  name="arrivalDate"
                  value={formData.arrivalDate}
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

              <label>Манифест</label>
              <input
                type="file"
                name="files"
                onChange={handleFileChange}
                ref={fileInputRef}
              />

              {/* <label>Питание</label>
                    <select name="included" value={formData.mealPlan.included} onChange={handleChange}>
                        <option value={true}>Включено</option>
                        <option value={false}>Не включено</option>
                    </select>

                    {formData.mealPlan.included && (
                        <div className={classes.checks}>
                            <label>
                                <input type="checkbox" name="breakfast" checked={formData.mealPlan.breakfast} onChange={handleChange} />
                                Завтрак
                            </label>
                            <label>
                                <input type="checkbox" name="lunch" checked={formData.mealPlan.lunch} onChange={handleChange} />
                                Обед
                            </label>
                            <label>
                                <input type="checkbox" name="dinner" checked={formData.mealPlan.dinner} onChange={handleChange} />
                                Ужин
                            </label>
                        </div>
                    )} */}
            </div>
          </div>

          <div className={classes.requestButton}>
            <Button onClick={handleSubmit}>Создать заявку</Button>
          </div>
        </>
      )}
    </Sidebar>
  );
}

export default CreateRequestReserve;
