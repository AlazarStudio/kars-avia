import React, { useState, useRef, useEffect, useCallback } from "react";
import classes from "./CreateRequestAirline.module.css";
import Button from "../../Standart/Button/Button";
import Sidebar from "../Sidebar/Sidebar";
import { CREATE_AIRLINE, getCookie } from "../../../../graphQL_requests";
import { useMutation } from "@apollo/client";
import Swal from "sweetalert2";

function CreateRequestAirline({ show, onClose, addHotel }) {
  const token = getCookie("token");

  const [isEdited, setIsEdited] = useState(false); // Флаг, указывающий, были ли изменения в форме
  const [formData, setFormData] = useState({
    name: "",
    images: "",
  });

  const sidebarRef = useRef();

  const resetForm = useCallback(() => {
    setFormData({
      name: "",
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

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!isFormValid()) {
      Swal.fire({
        title: "Ошибка!",
        text: "Пожалуйста, заполните все обязательные поля.",
        icon: "error",
        confirmButtonText: "Ок",
        customClass: {
          confirmButton: "swal_confirm",
        },
      });
      return;
    }

    // // Проверка на заполненность полей
    // if (!formData.name.trim()) {
    //     alert('Пожалуйста, введите название авиакомпании.');
    //     return;
    // }

    // if (!formData.images) {
    //     alert('Пожалуйста, выберите файл для загрузки.');
    //     return;
    // }

    // if (!formData.images) {
    //     alert('Пожалуйста, выберите файл для загрузки');
    //     return;
    // }

    try {
      let response_create_airline = await uploadFile({
        variables: {
          input: {
            name: formData.name,
          },
          images: formData.images,
        },
      });

      if (response_create_airline) {
        addHotel(response_create_airline.data.createAirline);
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

  return (
    <Sidebar show={show} sidebarRef={sidebarRef}>
      <div className={classes.requestTitle}>
        <div className={classes.requestTitle_name}>Добавить авиакомпанию</div>
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
            placeholder="Авиакомпания Азимут"
            value={formData.name}
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

export default CreateRequestAirline;
