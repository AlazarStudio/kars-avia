import React, { useState, useRef, useEffect, useCallback } from "react";
import classes from "./CreateRequestAirline.module.css";
import Button from "../../Standart/Button/Button";
import Sidebar from "../Sidebar/Sidebar";
import { CREATE_AIRLINE, getCookie } from "../../../../graphQL_requests";
import { useMutation } from "@apollo/client";
import MUILoader from "../MUILoader/MUILoader";
import MUIAutocomplete from "../MUIAutocomplete/MUIAutocomplete";
import MUIAutocompleteColor from "../MUIAutocompleteColor/MUIAutocompleteColor";
import CloseIcon from "../../../shared/icons/CloseIcon";

function CreateRequestAirline({
  show,
  onClose,
  representative,
  airlines,
  airports,
  cities,
  addHotel,
  addNotification,
}) {
  const token = getCookie("token");

  const [isEdited, setIsEdited] = useState(false); // Флаг, указывающий, были ли изменения в форме
  const [formData, setFormData] = useState({
    name: "",
    nameFull: "",
    airlineId: "",
    airportId: "",
    cityId: "",
    images: "",
  });
  const [selectedAirline, setSelectedAirline] = useState(null); // Выбранная авиакомпания

  const sidebarRef = useRef();

  const resetForm = useCallback(() => {
    setFormData({
      name: "",
      nameFull: "",
      airlineId: "",
      airportId: "",
      cityId: "",
      images: "",
    });
    setIsEdited(false); // Сброс флага изменений
  }, []);

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

  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    setIsEdited(true); // Устанавливаем флаг изменений при любом изменении
    setFormData((prevState) => ({
      ...prevState,
      [name]: value,
    }));
  }, []);

  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    const maxSizeInBytes = 8 * 1024 * 1024; // 8 MB
    if (file.size > maxSizeInBytes) {
      alert("Размер файла не должен превышать 8 МБ!");
      setFormData((prevState) => ({
        ...prevState,
        images: "",
      }));
      if (fileInputRef.current) {
        fileInputRef.current.value = ""; // Сброс значения в DOM-элементе
      }
      return;
    }

    if (file) {
      setFormData((prevState) => ({
        ...prevState,
        images: file, // Сохраняем файл напрямую
      }));
    }
  };

  const [uploadFile, { data, loading, error }] = useMutation(CREATE_AIRLINE, {
    context: {
      headers: {
        Authorization: `Bearer ${token}`,
        "Apollo-Require-Preflight": "true",
      },
    },
  });

  const isFormValid = () => {
    return formData.name && formData.images;
  };

  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    if (!isFormValid()) {
      alert("Пожалуйста, заполните все обязательные поля.");
      setIsLoading(false);
      return;
    }

    try {
      let response_create_airline = await uploadFile({
        variables: {
          input: {
            name: formData.name,
            // nameFull: formData.nameFull,
          },
          images: formData.images,
        },
      });

      if (response_create_airline) {
        addHotel(response_create_airline.data.createAirline);
        resetForm();
        onClose();
        addNotification("Авиакомпания создана успешно.", "success");
      }
    } catch (e) {
      console.error("Ошибка при загрузке файла:", e);
    } finally {
      // resetForm();
      onClose();
      setIsLoading(false);
      // addNotification("Авиакомпания создана успешно.", "success");
    }
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        sidebarRef.current?.contains(event.target) // Клик в боковой панели
      ) {
        return; // Если клик внутри, ничего не делаем
      }

      closeButton();
    };

    if (show) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [show, closeButton]);

  return (
    <Sidebar show={show} sidebarRef={sidebarRef}>
      <div className={classes.requestTitle}>
        <div className={classes.requestTitle_name}>Добавить авиакомпанию</div>
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
              {representative ? (
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
                    }}
                  />
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
                      airports.find((o) => o.id === formData.airportId) || null
                    }
                    onChange={(e, newValue) => {
                      setFormData((prev) => ({
                        ...prev,
                        airportId: newValue?.id || "",
                        // city: newValue?.city,
                      }));
                    }}
                  />
                  <label>Город</label>
                  <MUIAutocompleteColor
                    dropdownWidth="100%"
                    label={"Выберите город"}
                    options={cities}
                    getOptionLabel={(option) => {
                      if (!option) return "";
                      const cityPart =
                        option.city && option.city !== option.region
                          ? `, регион: ${option.region}`
                          : "";
                      return `${option.city}${cityPart}`.trim();
                    }}
                    renderOption={(optionProps, option) => {
                      const cityPart =
                        option.city && option.city !== option.name
                          ? `, регион: ${option.region}`
                          : "";
                      const labelText = `${option.city}${cityPart}`.trim();
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
                    value={cities.find((o) => o.id === formData.cityId) || null}
                    onChange={(e, newValue) => {
                      setFormData((prev) => ({
                        ...prev,
                        cityId: newValue?.id,
                      }));
                    }}
                  />
                </>
              ) : (
                <>
                  <label>Название</label>
                  <input
                    type="text"
                    name="name"
                    placeholder="Авиакомпания Азимут"
                    value={formData.name}
                    onChange={handleChange}
                  />

                  {/* <label>Наименование</label>
              <input
                type="text"
                name="nameFull"
                placeholder="Азимут"
                value={formData.nameFull}
                onChange={handleChange}
              /> */}

                  <label>Картинка</label>
                  <input
                    type="file"
                    name="images"
                    onChange={handleFileChange}
                    ref={fileInputRef}
                  />
                </>
              )}
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

export default CreateRequestAirline;
