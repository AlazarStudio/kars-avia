import React, { useState, useRef, useEffect, useCallback } from "react";
import classes from "./CreateRequestHotel.module.css";
import Button from "../../Standart/Button/Button";
import Sidebar from "../Sidebar/Sidebar";
import {
  CREATE_HOTEL,
  GET_AIRPORTS_RELAY,
  GET_CITIES,
  getCookie,
} from "../../../../graphQL_requests";
import { useMutation, useQuery } from "@apollo/client";
import DropDownList from "../DropDownList/DropDownList";
import MUILoader from "../MUILoader/MUILoader";
import MUIAutocomplete from "../MUIAutocomplete/MUIAutocomplete";
import MUIAutocompleteColor from "../MUIAutocompleteColor/MUIAutocompleteColor";
import StarRatingFilter from "../StarRatingFilter/StarRatingFilter";
import CloseIcon from "../../../shared/icons/CloseIcon";
import { useDialog } from "../../../contexts/DialogContext";
import { useToast } from "../../../contexts/ToastContext";
import useRequiredFields from "../../../hooks/useRequiredFields.js";

function CreateRequestHotel({ show, onClose, addHotel }) {
  const token = getCookie("token");
  const { confirm, showAlert, isDialogOpen } = useDialog();
  const { success } = useToast();

  const [isEdited, setIsEdited] = useState(false); // Флаг, указывающий, были ли изменения в форме
  const [formData, setFormData] = useState({
    name: "",
    city: "",
    address: "",
    stars: "",
    usStars: "",
    airportId: "",
    airportDistance: "",
    images: "",
    capacity: "",
  });

  const sidebarRef = useRef();
  const formBodyRef = useRef(null);

  const requiredKeys = [
    "name",
    "city",
    "airportId",
    "address",
    "capacity",
    "stars",
    "usStars",
    "images",
  ];
  const {
    invalid,
    validate,
    reset: resetRequired,
  } = useRequiredFields(formData, requiredKeys, formBodyRef);

  const resetForm = useCallback(() => {
    resetRequired();
    setFormData({
      name: "",
      city: "",
      address: "",
      stars: "",
      usStars: "",
      airportId: "",
      airportDistance: "",
      images: "",
      capacity: "",
    });
    setIsEdited(false); // Сброс флага изменений
  }, [resetRequired]);

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
  }, [isEdited, resetForm, onClose, confirm, isDialogOpen]);

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
    if (file && file.size > maxSizeInBytes) {
      showAlert("Размер файла не должен превышать 8 МБ!");
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

  const [uploadFile, { data, loading, error }] = useMutation(CREATE_HOTEL, {
    context: {
      headers: {
        Authorization: `Bearer ${token}`,
        "Apollo-Require-Preflight": "true",
      },
    },
  });

  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    if (!validate()) {
      setIsLoading(false);
      return;
    }

    try {
      let response_create_hotel = await uploadFile({
        variables: {
          input: {
            name: formData.name,
            capacity: parseInt(formData.capacity),
            information: {
              city: formData.city,
              address: formData.address,
            },
            stars: formData.stars,
            usStars: formData.usStars,
            airportId: formData.airportId,
            airportDistance: formData.airportDistance,
          },
          images: formData.images,
        },
      });

      if (response_create_hotel) {
        addHotel(response_create_hotel.data.createHotel);
        resetForm();
        onClose();
        success("Гостиница создана успешно.");
      }
    } catch (e) {
      console.error("Ошибка при загрузке файла:", e);
    } finally {
      // resetForm();
      // onClose();
      setIsLoading(false);
      onClose();
      // addNotification("Гостиница создана успешно.", "success");
    }
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isDialogOpen) return;
      if (event.target.closest(".MuiSnackbar-root")) return;

      if (sidebarRef.current && !sidebarRef.current.contains(event.target)) {
        closeButton();
      }
    };

    if (show) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [show, closeButton, isDialogOpen]);

  let infoCities = useQuery(GET_CITIES, {
    context: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  });
  let infoAirports = useQuery(GET_AIRPORTS_RELAY, {
    context: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  });
  const [cities, setCities] = useState([]);
  const [airports, setAirports] = useState([]);

  useEffect(() => {
    if (infoCities.data) {
      // Преобразуем данные в объекты с полями label и value
      const mappedCities =
        infoCities.data?.citys.map((item) => ({
          label: `${item.city}, ${item.region}`,
          value: item.city,
        })) || [];
      setCities(infoCities.data?.citys);
    }
  }, [infoCities]);

  useEffect(() => {
    if (infoAirports.data) {
      const mappedAirports =
        infoAirports.data?.airports.map((item) => ({
          label: `${item.code} ${item.name}, город: ${item.city}  `,
          value: item.id,
        })) || [];
      setAirports(infoAirports.data?.airports);
    }
  }, [infoAirports]);

  return (
    <Sidebar show={show} sidebarRef={sidebarRef}>
      <div className={classes.requestTitle}>
        <div className={classes.requestTitle_name}>Добавить гостиницу</div>
        <div className={classes.requestTitle_close} onClick={closeButton}>
          <CloseIcon />
        </div>
      </div>

      {isLoading ? (
        <MUILoader loadSize={"50px"} fullHeight={"80vh"} />
      ) : (
        <>
          <div className={classes.requestMiddle} ref={formBodyRef}>
            <div className={classes.requestData}>
              <span className={classes.hint}>* — обязательные поля</span>
              <label
                className={`${classes.required} ${invalid("name") ? "fieldInvalid" : ""
                  }`}
              >
                Название
              </label>
              <input
                type="text"
                name="name"
                className={invalid("name") ? "inputInvalid" : undefined}
                value={formData.name}
                placeholder="Гостиница Славянка"
                onChange={handleChange}
              />

              <label
                className={`${classes.required} ${invalid("city") ? "fieldInvalid" : ""
                  }`}
              >
                Город
              </label>
              <MUIAutocompleteColor
                dropdownWidth={"100%"}
                label={"Выберите город"}
                error={invalid("city")}
                options={cities}
                getOptionLabel={(option) =>
                  option ? `${option.city} ${option.region}`.trim() : ""
                }
                renderOption={(optionProps, option) => {
                  // Формируем строку для отображения
                  const labelText = `${option.city} ${option.region}`.trim();
                  // Разбиваем строку по пробелам
                  const words = labelText.split(" ");
                  return (
                    <li {...optionProps} key={option.id}>
                      {words.map((word, index) => (
                        <span
                          key={index}
                          style={{
                            color: index === 0 ? "black" : "gray",
                            marginRight: "4px",
                          }}
                        >
                          {word}
                        </span>
                      ))}
                    </li>
                  );
                }}
                value={
                  cities.find((option) => option.city === formData.city) || null
                }
                onChange={(e, newValue) => {
                  setFormData((prevFormData) => ({
                    ...prevFormData,
                    city: newValue?.city || "",
                  }));
                  setIsEdited(true);
                }}
              />

              <label
                className={`${classes.required} ${invalid("airportId") ? "fieldInvalid" : ""
                  }`}
              >
                Аэропорт
              </label>
              <MUIAutocompleteColor
                dropdownWidth={"100%"}
                label={"Выберите аэропорт"}
                error={invalid("airportId")}
                options={airports}
                getOptionLabel={(option) =>
                  option
                    ? `${option.code} ${option.name}, город: ${option.city}`.trim()
                    : ""
                }
                renderOption={(optionProps, option) => {
                  // Формируем строку для отображения
                  const labelText =
                    `${option.code} ${option.name}, город: ${option.city}`.trim();
                  // Разбиваем строку по пробелам
                  const words = labelText.split(" ");
                  return (
                    <li {...optionProps} key={option.id}>
                      {words.map((word, index) => (
                        <span
                          key={index}
                          style={{
                            color: index === 0 ? "black" : "gray",
                            marginRight: "4px",
                          }}
                        >
                          {word}
                        </span>
                      ))}
                    </li>
                  );
                }}
                value={
                  airports.find((option) => option.id === formData.airportId) ||
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

              <label
                className={`${classes.required} ${invalid("address") ? "fieldInvalid" : ""
                  }`}
              >
                Адрес
              </label>
              <input
                type="text"
                name="address"
                className={invalid("address") ? "inputInvalid" : undefined}
                value={formData.address}
                placeholder="ул. Лесная  147"
                onChange={handleChange}
              />

              <label
                className={`${classes.required} ${invalid("capacity") ? "fieldInvalid" : ""
                  }`}
              >
                Мощность
              </label>
              <input
                type="number"
                name="capacity"
                className={invalid("capacity") ? "inputInvalid" : undefined}
                value={formData.capacity}
                placeholder="Например: 5"
                onChange={handleChange}
              />

              <label
                className={`${classes.required} ${invalid("stars") ? "fieldInvalid" : ""
                  }`}
              >
                Оценка
              </label>
              <StarRatingFilter
                integer
                value={formData.stars}
                onChange={(val) =>
                  handleChange({ target: { name: "stars", value: val } })
                }
              />

              <label
                className={`${classes.required} ${invalid("usStars") ? "fieldInvalid" : ""
                  }`}
              >
                Звёздность
              </label>
              <StarRatingFilter
                integer
                value={formData.usStars}
                onChange={(val) =>
                  handleChange({ target: { name: "usStars", value: val } })
                }
              />

              <label>Удалённость от аэропорта (мин)</label>
              <input
                type="number"
                name="airportDistance"
                step={0.1}
                value={formData.airportDistance}
                placeholder="20 мин"
                onChange={handleChange}
              />

              <label
                className={`${classes.required} ${invalid("images") ? "fieldInvalid" : ""
                  }`}
              >
                Картинка
              </label>
              <input
                type="file"
                name="images"
                onChange={handleFileChange}
                ref={fileInputRef}
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

export default CreateRequestHotel;
