import React, { useState, useRef, useEffect, useCallback } from "react";
import classes from "./CreateRequestHotel.module.css";
import Button from "../../Standart/Button/Button";
import Sidebar from "../Sidebar/Sidebar";
import {
  CREATE_HOTEL,
  GET_AIRPORTS_RELAY,
  getCookie,
} from "../../../../graphQL_requests";
import { useMutation, useQuery } from "@apollo/client";
import Swal from "sweetalert2";
import DropDownList from "../DropDownList/DropDownList";

function CreateRequestHotel({ show, onClose, addHotel }) {
  const token = getCookie("token");

  const [isEdited, setIsEdited] = useState(false); // Флаг, указывающий, были ли изменения в форме
  const [formData, setFormData] = useState({
    name: "",
    city: "",
    address: "",
    stars: "",
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

    Swal.fire({
      title: "Вы уверены?",
      text: "Все несохраненные данные будут удалены.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Да",
      cancelButtonText: "Нет",
      allowOutsideClick: false,
      allowEscapeKey: false,
      customClass: {
        confirmButton: "swal_confirm",
        cancelButton: "swal_cancel",
      },
    }).then((result) => {
      if (result.isConfirmed) {
        resetForm();
        onClose();
      }
    });
  }, [isEdited, resetForm, onClose]);

  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    setIsEdited(true); // Устанавливаем флаг изменений при любом изменении
    setFormData((prevState) => ({
      ...prevState,
      [name]: value,
    }));
  }, []);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
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

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Проверяем, заполнены ли все поля
    if (
      !formData.name.trim() ||
      !formData.city.trim() ||
      !formData.address.trim() ||
      !formData.stars.trim() ||
      !formData.airportDistance.trim() ||
      !formData.images
    ) {
      //   alert("Пожалуйста, заполните все поля!");
      Swal.fire({
        title: "Ошибка!",
        text: "Пожалуйста, заполните все поля.",
        icon: "error",
        confirmButtonText: "Ок",
        customClass: {
          confirmButton: "swal_confirm",
        },
      });
      return;
    }

    if (!formData.images) {
      //   alert("Пожалуйста, выберите файл для загрузки");
      Swal.fire({
        title: "Ошибка!",
        text: "Пожалуйста, выберите файл для загрузки.",
        icon: "error",
        confirmButtonText: "Ок",
        customClass: {
          confirmButton: "swal_confirm",
        },
      });
      return;
    }

    try {
      let response_create_hotel = await uploadFile({
        variables: {
          input: {
            name: formData.name,
            city: formData.city,
            address: formData.address,
            stars: formData.stars,
            airportDistance: formData.airportDistance,
          },
          images: formData.images,
        },
      });

      if (response_create_hotel) {
        addHotel(response_create_hotel.data.createHotel);
        resetForm();
        onClose();
      }
    } catch (e) {
      console.error("Ошибка при загрузке файла:", e);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        document.querySelector(".swal2-container")?.contains(event.target) || // Клик в SweetAlert2
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

  let infoAirports = useQuery(GET_AIRPORTS_RELAY);
  const [airports, setAirports] = useState([]);

  useEffect(() => {
    if (infoAirports.data) {
      setAirports(infoAirports.data?.airports || []);
    }
  }, [infoAirports]);

  const uniqueCities = [
    ...new Set(airports.map((airport) => airport.city.trim())),
  ].sort((a, b) => a.localeCompare(b));

  return (
    <Sidebar show={show} sidebarRef={sidebarRef}>
      <div className={classes.requestTitle}>
        <div className={classes.requestTitle_name}>Добавить гостиницу</div>
        <div className={classes.requestTitle_close} onClick={closeButton}>
          <img src="/close.png" alt="" />
        </div>
      </div>

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
          <DropDownList
            placeholder="Выберите город"
            searchable={false}
            options={uniqueCities}
            initialValue={formData.city}
            onSelect={(value) => {
              setIsEdited(true);
              setFormData((prevData) => ({
                ...prevData,
                city: value,
              }));
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

          <label>Рейтинг (количество звезд)</label>
          <input
            type="text"
            name="stars"
            value={formData.stars}
            placeholder="от 1 до 5"
            onChange={handleChange}
          />

          <label>Расстояние до аэропорта</label>
          <input
            type="text"
            name="airportDistance"
            value={formData.airportDistance}
            placeholder="2 км"
            onChange={handleChange}
          />

          <label>Картинка</label>
          <input type="file" name="images" onChange={handleFileChange} />
        </div>
      </div>

      <div className={classes.requestButton}>
        <Button type="submit" onClick={handleSubmit}>
          Добавить
        </Button>
      </div>
    </Sidebar>
  );
}

export default CreateRequestHotel;
