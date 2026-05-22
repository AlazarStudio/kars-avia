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
import CloseIcon from "../../../shared/icons/CloseIcon";
import { useDialog } from "../../../contexts/DialogContext";
import { useToast } from "../../../contexts/ToastContext";

const categories = [
  { id: "squadron", name: "Эскадрилья" },
  { id: "engineers", name: "Инженеры" },
  { id: "all", name: "Все" },
];

function CreateRequestReport({ show, onClose, positions, airports, isAirline }) {
  const token = getCookie("token");
  const user = decodeJWT(token);
  const { confirm, showAlert, isDialogOpen } = useDialog();
  const { success } = useToast();

  const getDefaultAirOrHotel = useCallback(() => {
    if (user?.airlineId) return "airline";
    if (user?.hotelId) return "hotel";
    return isAirline ? "airline" : "hotel";
  }, [user?.airlineId, user?.hotelId, isAirline]);

  const [isEdited, setIsEdited] = useState(false);
  const [airOrHotel, setAirOrHotel] = useState(getDefaultAirOrHotel);
  const [category, setCategory] = useState(categories[0]);
  const [airlines, setAirlines] = useState([]);
  const [hotels, setHotels] = useState([]);
  const [selectedAirline, setSelectedAirline] = useState(null);
  const [selectedHotel, setSelectedHotel] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const [formData, setFormData] = useState({
    startDate: "",
    endDate: "",
    airlineId: user.airlineId || "",
    hotelId: user.hotelId || "",
    personId: "",
    airportId: "",
    position: "",
    meal: true,
    living: true,
  });

  const sidebarRef = useRef();

  const { data } = useQuery(GET_AIRLINES_RELAY, {
    context: { headers: { Authorization: `Bearer ${token}` } },
  });

  const { data: hotelsData } = useQuery(GET_HOTELS_RELAY, {
    context: { headers: { Authorization: `Bearer ${token}` } },
  });

  useEffect(() => {
    setAirlines(data?.airlines?.airlines || []);
    setHotels(hotelsData?.hotels?.hotels || []);
  }, [data, hotelsData]);

  // Сброс формы
  const resetForm = useCallback(() => {
    setFormData({
      startDate: "",
      endDate: "",
      airlineId: user.airlineId || "",
      hotelId: user.hotelId || "",
      personId: "",
      airportId: "",
      position: "",
      meal: true,
      living: true,
    });
    setSelectedAirline(null);
    setSelectedHotel(null);
    setAirOrHotel(getDefaultAirOrHotel());
    setCategory(categories[0]);
    setIsEdited(false);
  }, [user.airlineId, user.hotelId, getDefaultAirOrHotel]);

  // При открытии сайдбара — полный сброс с правильным начальным типом
  useEffect(() => {
    if (show) resetForm();
  }, [show]); // eslint-disable-line react-hooks/exhaustive-deps

  // Автоподстановка авиакомпании/гостиницы привязанной к пользователю
  useEffect(() => {
    if (airOrHotel === "airline" && user.airlineId && airlines.length) {
      const matched = airlines.find((a) => a.id === user.airlineId);
      if (matched) {
        setSelectedAirline(matched);
        setFormData((prev) => ({ ...prev, airlineId: matched.id, personId: "" }));
      }
    }
    if (airOrHotel === "hotel" && user.hotelId && hotels.length) {
      const matched = hotels.find((h) => h.id === user.hotelId);
      if (matched) {
        setSelectedHotel(matched);
        setFormData((prev) => ({ ...prev, hotelId: matched.id }));
      }
    }
  }, [airOrHotel, user.airlineId, user.hotelId, airlines, hotels]);

  const specialPositions =
    category.id === "squadron"
      ? positions.filter((p) => p.category === "squadron")
      : category.id === "engineers"
      ? positions.filter((p) => p.category === "engineers")
      : positions;

  const [createReport] = useMutation(
    airOrHotel === "airline" ? CREATE_REPORT : CREATE_HOTEL_REPORT,
    { context: { headers: { Authorization: `Bearer ${token}` } } }
  );

  // Закрытие с проверкой изменений
  const closeButton = useCallback(async () => {
    if (isDialogOpen) return;
    if (!isEdited) {
      resetForm();
      onClose();
      return;
    }
    const isConfirmed = await confirm(
      "Вы уверены? Все несохраненные данные будут удалены."
    );
    if (isConfirmed) {
      resetForm();
      onClose();
    }
  }, [isEdited, resetForm, onClose, isDialogOpen, confirm]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isDialogOpen) return;
      if (event.target.closest(".MuiSnackbar-root")) return;
      if (sidebarRef.current?.contains(event.target)) return;
      closeButton();
    };

    if (show) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [show, closeButton, isDialogOpen]);

  const handleChange = useCallback((e) => {
    const { name, value, type, checked } = e.target;
    setIsEdited(true);
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  }, []);

  const isFormValid = () => {
    if (airOrHotel === "airline") {
      return (
        formData.startDate &&
        formData.endDate &&
        formData.airlineId &&
        formData.airportId &&
        (formData.living || formData.meal)
      );
    }
    return (
      formData.startDate &&
      formData.endDate &&
      formData.hotelId &&
      (formData.living || formData.meal)
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    if (!isFormValid()) {
      showAlert("Пожалуйста, заполните все обязательные поля.");
      setIsLoading(false);
      return;
    }
    if (formData.endDate < formData.startDate) {
      showAlert("Конечная дата не может быть раньше начальной.");
      setFormData((prev) => ({ ...prev, endDate: "" }));
      setIsLoading(false);
      return;
    }

    const selectedPosition = positions.find((p) => p.name === formData.position);

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
      },
      format: "xlsx",
    };

    const createFilterInput = {
      living: formData.living,
      meal: formData.meal,
    };

    try {
      await createReport({ variables: { input, createFilterInput } });
      resetForm();
      onClose();
      success(
        `Отчет ${formData.personId !== "" ? "по сотруднику" : ""} создан успешно.`
      );
    } catch (error) {
      if (error.message.startsWith("Airline has no prices")) {
        showAlert("У авиакомпании нет цен по выбранному аэропорту.");
      }
      console.error("Catch: ", error);
    } finally {
      setIsLoading(false);
    }
  };

  const hotelAutocomplete = (
    <MUIAutocompleteColor
      dropdownWidth="100%"
      label={"Выберите гостиницу"}
      options={hotels}
      getOptionLabel={(option) =>
        option ? `${option.name}, город: ${option?.information?.city}`.trim() : ""
      }
      renderOption={(optionProps, option) => {
        const words = `${option.name}, город: ${option?.information?.city}`
          .trim()
          .split(", ");
        return (
          <li {...optionProps} key={option.id}>
            {words.map((word, index) => (
              <span key={index} style={{ color: index === 0 ? "black" : "gray", marginRight: 4 }}>
                {word}
              </span>
            ))}
          </li>
        );
      }}
      value={selectedHotel || ""}
      onChange={(event, newValue) => {
        const matched = hotels.find((h) => h === newValue);
        setSelectedHotel(matched || null);
        setFormData((prev) => ({ ...prev, hotelId: matched?.id || "" }));
        setIsEdited(true);
      }}
    />
  );

  const airlineAutocomplete = (
    <MUIAutocomplete
      dropdownWidth={"100%"}
      label={"Выберите авиакомпанию"}
      options={airlines?.map((a) => a.name)}
      value={selectedAirline?.name || ""}
      onChange={(event, newValue) => {
        const matched = airlines.find((a) => a.name === newValue);
        setSelectedAirline(matched || null);
        setFormData((prev) => ({ ...prev, airlineId: matched?.id || "", personId: "" }));
        setIsEdited(true);
      }}
    />
  );

  return (
    <Sidebar show={show} sidebarRef={sidebarRef}>
      <div className={classes.requestTitle}>
        <div className={classes.requestTitle_name}>Добавить отчет</div>
        <div className={classes.requestTitle_close} onClick={closeButton}>
          <CloseIcon />
        </div>
      </div>

      {isLoading ? (
        <MUILoader loadSize={"50px"} fullHeight={"80vh"} />
      ) : (
        <>
          <div className={classes.requestMiddle}>
            <div className={classes.requestData}>

              {/* Тип отчёта — только для диспетчеров без привязки */}
              {!user.airlineId && !user.hotelId && (
                <>
                  <label className={classes.required}>Тип отчёта</label>
                  <MUIAutocomplete
                    dropdownWidth={"100%"}
                    label={"Авиакомпания или гостиница"}
                    options={["Авиакомпания", "Гостиница"]}
                    value={airOrHotel === "airline" ? "Авиакомпания" : "Гостиница"}
                    onChange={(event, newValue) => {
                      const next = newValue === "Авиакомпания" ? "airline" : "hotel";
                      setAirOrHotel(next);
                      setSelectedAirline(null);
                      setSelectedHotel(null);
                      setFormData((prev) => ({ ...prev, airlineId: "", hotelId: "", personId: "", airportId: "" }));
                      setIsEdited(true);
                    }}
                  />
                </>
              )}

              {/* Авиакомпания */}
              {airOrHotel === "airline" && (
                <>
                  {!user.airlineId && (
                    <>
                      <label className={classes.required}>Авиакомпания</label>
                      {airlineAutocomplete}
                    </>
                  )}

                  <label>Гостиница</label>
                  {hotelAutocomplete}

                  {(selectedAirline?.staff || user.airlineId) && (
                    <>
                      <label className={classes.required}>Аэропорт</label>
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
                          const words = `${option.code} ${option.name}${cityPart}`.trim().split(" ");
                          return (
                            <li {...optionProps} key={option.id}>
                              {words.map((word, index) => (
                                <span key={index} style={{ color: index === 0 ? "black" : "gray", marginRight: 4 }}>
                                  {word}
                                </span>
                              ))}
                            </li>
                          );
                        }}
                        value={airports.find((o) => o.id === formData.airportId) || null}
                        onChange={(e, newValue) => {
                          setFormData((prev) => ({ ...prev, airportId: newValue?.id || "" }));
                          setIsEdited(true);
                        }}
                      />

                      <label>Категория</label>
                      <MUIAutocomplete
                        dropdownWidth={"100%"}
                        label={"Выберите категорию"}
                        options={categories.map((i) => i.name)}
                        value={categories.find((i) => i.id === category.id)?.name || categories[0].name}
                        onChange={(event, newValue) => {
                          setCategory(categories.find((i) => i.name === newValue) || categories[0]);
                          setIsEdited(true);
                        }}
                      />

                      <label>Должность</label>
                      <MUIAutocomplete
                        dropdownWidth={"100%"}
                        label={"По всем должностям"}
                        labelOnFocus={"Выберите должность"}
                        options={specialPositions?.map((p) => p.name)}
                        value={formData.position}
                        onChange={(event, newValue) => {
                          setFormData((prev) => ({ ...prev, position: newValue || "" }));
                          setIsEdited(true);
                        }}
                      />

                      <label>Сотрудник авиакомпании</label>
                      <MUIAutocompleteColor
                        dropdownWidth="100%"
                        listboxHeight={"300px"}
                        label={"По всем сотрудникам"}
                        labelOnFocus={"Введите сотрудника"}
                        options={(selectedAirline?.staff || []).filter((person) =>
                          formData.position ? person?.position?.name === formData.position : true
                        )}
                        getOptionLabel={(option) =>
                          option
                            ? `${option.name || ""} ${option?.position?.name} ${option.gender}`.trim()
                            : ""
                        }
                        renderOption={(optionProps, option) => {
                          const words = `${option.name || ""} ${option?.position?.name} ${option.gender}`.trim().split(". ");
                          return (
                            <li {...optionProps} key={option.id}>
                              {words.map((word, index) => (
                                <span key={index} style={{ color: index === 0 ? "black" : "gray", marginRight: "4px" }}>
                                  {word}
                                </span>
                              ))}
                            </li>
                          );
                        }}
                        value={selectedAirline?.staff?.find((p) => p.id === formData.personId) || null}
                        onChange={(event, newValue) => {
                          setFormData((prev) => ({ ...prev, personId: newValue?.id || "" }));
                          setIsEdited(true);
                        }}
                      />
                    </>
                  )}
                </>
              )}

              {/* Гостиница */}
              {airOrHotel === "hotel" && (
                <>
                  {!user.hotelId && (
                    <>
                      <label className={classes.required}>Гостиница</label>
                      {hotelAutocomplete}
                    </>
                  )}

                  <label>Авиакомпания</label>
                  {airlineAutocomplete}
                </>
              )}

              <label className={classes.required} style={{ marginBottom: -8 }}>
                Включить в отчёт
              </label>
              <span className={classes.hint}>хотя бы один из вариантов</span>

              <label>
                <input type="checkbox" name="living" checked={formData.living} onChange={handleChange} />
                Проживание
              </label>

              <label>
                <input type="checkbox" name="meal" checked={formData.meal} onChange={handleChange} />
                Питание
              </label>

              <label className={classes.required}>Начальная дата</label>
              <input
                type="date"
                name="startDate"
                value={formData.startDate}
                onChange={handleChange}
              />

              <label className={classes.required}>Конечная дата</label>
              <input
                type="date"
                name="endDate"
                min={formData.startDate}
                value={formData.endDate}
                onChange={handleChange}
              />

              <span className={classes.hint}>* — обязательные поля</span>
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
