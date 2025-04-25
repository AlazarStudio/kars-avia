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

function CreateRequestHotel({ show, onClose, addHotel, addNotification }) {
  const token = getCookie("token");

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

  const resetForm = useCallback(() => {
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

    // Проверяем, заполнены ли все поля
    if (
      !formData.name.trim() ||
      !formData.city.trim() ||
      !formData.address.trim() ||
      !formData.stars.trim() ||
      !formData.usStars.trim() ||
      !formData.airportDistance.trim() ||
      !formData.images ||
      !formData.airportId ||
      !formData.capacity
    ) {
      alert("Пожалуйста, заполните все поля!");
      setIsLoading(false);
      return;
    }

    if (!formData.images) {
      alert("Пожалуйста, выберите файл для загрузки");
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
        addNotification("Гостиница создана успешно.", "success");
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

  // useEffect(() => {
  //   const handleClickOutside = (event) => {
  //     if (
  //       sidebarRef.current?.contains(event.target) // Клик в боковой панели
  //     ) {
  //       return; // Если клик внутри, ничего не делаем
  //     }

  //     closeButton();
  //   };

  //   if (show) {
  //     document.addEventListener("mousedown", handleClickOutside);
  //   } else {
  //     document.removeEventListener("mousedown", handleClickOutside);
  //   }

  //   return () => {
  //     document.removeEventListener("mousedown", handleClickOutside);
  //   };
  // }, [show, closeButton]);

  useEffect(() => {
    const handleClickOutside = (event) => {
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
  }, [show, closeButton]);

  let infoCities = useQuery(GET_CITIES);
  let infoAirports = useQuery(GET_AIRPORTS_RELAY);
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
          <img src="/close.png" alt="" />
        </div>
      </div>

      {isLoading ? (
        <MUILoader loadSize={"50px"} fullHeight={"80vh"} />
      ) : (
        <>
          <div className={classes.requestMiddle}>
            <div className={classes.requestData}>
              <label>Название</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                placeholder="Гостиница Славянка"
                onChange={handleChange}
              />

              <label>Город</label>
              {/* <MUIAutocomplete
                dropdownWidth={"100%"}
                label={"Выберите город"}
                options={cities}
                getOptionLabel={(option) => option.label} // показываем label (город и регион)
                value={
                  cities.find((option) => option.value === formData.city) ||
                  null
                }
                onChange={(event, newValue) => {
                  setIsEdited(true);
                  setFormData((prevData) => ({
                    ...prevData,
                    city: newValue ? newValue.value : "",
                  }));
                }}
              /> */}

              <MUIAutocompleteColor
                dropdownWidth={"100%"}
                label={"Выберите город"}
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
                  cities.find((option) => option.city === formData.city) ||
                  null
                }
                onChange={(e, newValue) => {
                  setFormData((prevFormData) => ({
                    ...prevFormData,
                    city: newValue?.city || "",
                  }));
                  setIsEdited(true);
                }}
              />

              <label>Адрес</label>
              <input
                type="text"
                name="address"
                value={formData.address}
                placeholder="ул. Лесная  147"
                onChange={handleChange}
              />

              <label>Мощность</label>
              <input
                type="number"
                name="capacity"
                value={formData.capacity}
                placeholder="Например: 5"
                onChange={handleChange}
              />

              <label>Оценка</label>
              <input
                type="text"
                name="stars"
                value={formData.stars}
                placeholder="от 1 до 5"
                onChange={handleChange}
              />

              <label>Звёздность</label>
              <input
                type="text"
                name="usStars"
                value={formData.usStars}
                placeholder="от 1 до 5"
                onChange={handleChange}
              />

              <label>Аэропорт</label>
              <MUIAutocompleteColor
                dropdownWidth={"100%"}
                label={"Выберите аэропорт"}
                options={airports}
                getOptionLabel={(option) =>
                  option ? `${option.code} ${option.name}`.trim() : ""
                }
                renderOption={(optionProps, option) => {
                  // Формируем строку для отображения
                  const labelText = `${option.code} ${option.name}`.trim();
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

              <label>Удалённость от аэропорта (мин)</label>
              <input
                type="number"
                name="airportDistance"
                step={0.1}
                value={formData.airportDistance}
                placeholder="20 мин"
                onChange={handleChange}
              />

              <label>Картинка</label>
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
