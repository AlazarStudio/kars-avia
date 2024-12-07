import React, { useState, useRef, useEffect, useCallback } from "react";
import classes from "./CreateRequestAirlineStaff.module.css";
import Button from "../../Standart/Button/Button";
import Sidebar from "../Sidebar/Sidebar";
import {
  CREATE_AIRLINE_STAFF,
  decodeJWT,
  getCookie,
} from "../../../../graphQL_requests";
import { useMutation } from "@apollo/client";
import Swal from "sweetalert2";
import DropDownList from "../DropDownList/DropDownList";

function CreateRequestAirlineStaff({
  show,
  onClose,
  id,
  addTarif,
  setAddTarif,
}) {
  const [userRole, setUserRole] = useState();
  const [isEdited, setIsEdited] = useState(false);
  const token = getCookie("token");

  useEffect(() => {
    setUserRole(decodeJWT(token).role);
  }, [token]);

  const [formData, setFormData] = useState({
    name: "",
    number: "",
    position: "",
    gender: "",
  });

  const sidebarRef = useRef();

  const resetForm = useCallback(() => {
    setFormData({
      name: "",
      number: "",
      position: "",
      gender: "",
    });
    setIsEdited(false); // Сбрасываем флаг изменений
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

  const [createAirlineStaff] = useMutation(CREATE_AIRLINE_STAFF, {
    context: {
      headers: {
        Authorization: `Bearer ${token}`,
        "Apollo-Require-Preflight": "true",
      },
    },
  });

  const isFormValid = () => {
    return (
      formData.name && formData.number && formData.position && formData.gender
    );
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

    // Проверка на заполненность полей
    // const requiredFields = ["name", "number", "position", "gender"];
    // const emptyFields = requiredFields.filter(
    //   (field) => !formData[field]?.trim()
    // );

    // if (emptyFields.length > 0) {
    //   alert("Пожалуйста, заполните все обязательные поля.");
    //   return;
    // }

    try {
      let request = await createAirlineStaff({
        variables: {
          updateAirlineId: id,
          input: {
            staff: [
              {
                name: formData.name,
                number: formData.number,
                position: formData.position,
                gender: formData.gender,
              },
            ],
          },
        },
      });

      if (request) {
        setAddTarif(
          request.data.updateAirline.staff.sort((a, b) =>
            a.name.localeCompare(b.name)
          )
        );

        resetForm();
        onClose();
      }
    } catch (err) {
      alert("Произошла ошибка при сохранении данных");
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

  let positions = [
    "КЭ (Капитан Эскадрильи)",
    "КВС (Командир воздушного судна)",
    "ВП (Второй пилот)",
    "СПБ ( Старший бортпроводник)",
    "ИБП ( Инструктор-бортпроводник)",
    "БП (бортпроводник)",
    "КЭ ( Капитан Эскадрильи)",
    "Инженер",
  ];

  const genders = ["Мужской", "Женский"];

  return (
    <Sidebar show={show} sidebarRef={sidebarRef}>
      <div className={classes.requestTitle}>
        <div className={classes.requestTitle_name}>Добавить сотрудника</div>
        <div className={classes.requestTitle_close} onClick={closeButton}>
          <img src="/close.png" alt="" />
        </div>
      </div>

      <div className={classes.requestMiddle}>
        <div className={classes.requestData}>
          <label>ФИО</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="Пример: Иванов Иван Иванович"
          />

          <label>Номер телефона</label>
          <input
            type="text"
            name="number"
            value={formData.number}
            onChange={handleChange}
            placeholder="Пример: 89283521345"
          />

          <label>Должность</label>
          <DropDownList
            placeholder="Выберите должность"
            searchable={false}
            options={positions}
            initialValue={formData.position}
            onSelect={(value) => {
              setFormData((prevFormData) => ({
                ...prevFormData,
                position: value,
              }));
              setIsEdited(true);
            }}
          />

          <label>Пол</label>
          <DropDownList
            placeholder="Выберите пол"
            searchable={false}
            options={["Мужской", "Женский"]}
            initialValue={formData.gender}
            onSelect={(value) => {
              setFormData((prevFormData) => ({
                ...prevFormData,
                gender: value,
              }));
              setIsEdited(true);
            }}
          />
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

export default CreateRequestAirlineStaff;
