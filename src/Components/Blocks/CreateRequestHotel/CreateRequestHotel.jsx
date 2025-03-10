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

function CreateRequestHotel({ show, onClose, addHotel, addNotification }) {
  const token = getCookie("token");

  const [isEdited, setIsEdited] = useState(false); // Флаг, указывающий, были ли изменения в форме
  const [formData, setFormData] = useState({
    name: "",
    city: "",
    address: "",
    stars: "",
    usStars: "",
    airportDistance: "",
    images: "",
  });

  const sidebarRef = useRef();

  const resetForm = useCallback(() => {
    setFormData({
      name: "",
      city: "",
      address: "",
      stars: "",
      usStars: "",
      airportDistance: "",
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
      !formData.images
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
            information: {
              city: formData.city,
              address: formData.address,
            },
            stars: formData.stars,
            usStars: formData.usStars,
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

  // let infoCities = useQuery(GET_AIRPORTS_RELAY);
  let infoCities = useQuery(GET_CITIES);
  const [cities, setCities] = useState([]);

  // useEffect(() => {
  //   if (infoCities.data) {
  //     setCities(
  //       infoCities.data?.citys.map(
  //         // (item) => `${item.city}, регион: ${item.region}`
  //         (item) => item.city
  //       ) || []
  //     );
  //   }
  // }, [infoCities]);

  useEffect(() => {
    if (infoCities.data) {
      // Преобразуем данные в объекты с полями label и value
      const mappedCities =
        infoCities.data?.citys.map((item) => ({
          label: `${item.city}, ${item.region}`,
          value: item.city,
        })) || [];
      setCities(mappedCities);
    }
  }, [infoCities]);

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
              <MUIAutocomplete
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
              />

              {/* <select name="city" value={formData.city} onChange={handleChange}>
            <option value="" disabled>
              Выберите город
            </option>
            {uniqueCities.map((city) => (
              <option key={city} value={city}>
                {city}
              </option>
            ))}
          </select> */}
              {/* <DropDownList
                placeholder="Выберите город"
                searchable={true}
                options={cities}
                initialValue={formData.city}
                onSelect={(value) => {
                  setIsEdited(true);
                  setFormData((prevData) => ({
                    ...prevData,
                    city: value,
                  }));
                }}
              /> */}

              <label>Адрес</label>
              <input
                type="text"
                name="address"
                value={formData.address}
                placeholder="ул. Лесная  147"
                onChange={handleChange}
              />

              <label>Рейтинг</label>
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

              <label>Расстояние до аэропорта (км)</label>
              <input
                type="number"
                name="airportDistance"
                step={0.1}
                value={formData.airportDistance}
                placeholder="2 км"
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
