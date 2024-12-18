import React, { useState, useRef, useEffect, useCallback } from "react";
import classes from "./UpdateRequestAirlineStaff.module.css";
import Button from "../../Standart/Button/Button";
import Sidebar from "../Sidebar/Sidebar";
import {
  decodeJWT,
  getCookie,
  UPDATE_AIRLINE_STAFF,
} from "../../../../graphQL_requests";
import { useMutation } from "@apollo/client";
import DropDownList from "../DropDownList/DropDownList";

function UpdateRequestAirlineStaff({
  show,
  onClose,
  id,
  selectedStaff,
  setAddTarif,
  setShowDelete,
  setDeleteIndex,
}) {
  const [userRole, setUserRole] = useState();
  const token = getCookie("token");

  useEffect(() => {
    setUserRole(decodeJWT(token).role);
  }, [token]);

  const [isEdited, setIsEdited] = useState(false); // Флаг, указывающий, были ли изменения в форме
  const [formData, setFormData] = useState({
    id: selectedStaff?.id || "",
    name: selectedStaff?.name || "",
    number: selectedStaff?.number || "",
    position: selectedStaff?.position || "",
    gender: selectedStaff?.gender || "",
  });

  const sidebarRef = useRef();

  useEffect(() => {
    if (show && selectedStaff) {
      setFormData({
        id: selectedStaff.id,
        name: selectedStaff.name,
        number: selectedStaff.number,
        position: selectedStaff.position,
        gender: selectedStaff.gender,
      });
    }
  }, [show, selectedStaff]);

  const resetForm = useCallback(() => {
    setFormData({
      id: selectedStaff?.id || "",
      name: selectedStaff?.name || "",
      number: selectedStaff?.number || "",
      position: selectedStaff?.position || "",
      gender: selectedStaff?.gender || "",
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

  const [updateAirlineStaff] = useMutation(UPDATE_AIRLINE_STAFF, {
    context: {
      headers: {
        Authorization: `Bearer ${token}`,
        "Apollo-Require-Preflight": "true",
      },
    },
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      let request = await updateAirlineStaff({
        variables: {
          updateAirlineId: id,
          input: {
            staff: [
              {
                id: formData.id,
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

  return (
    <Sidebar show={show} sidebarRef={sidebarRef}>
      <div className={classes.requestTitle}>
        <div className={classes.requestTitle_name}>Изменить сотрудника</div>
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
            placeholder={"Выберите должность"}
            searchable={false}
            options={positions}
            initialValue={formData.position}
            onSelect={(value) => {
              setIsEdited(true);
              setFormData((prevData) => ({
                ...prevData,
                position: value,
              }));
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
        <Button
          type="submit"
          style={{ "background-color": "#ff5151" }}
          onClick={() => {
            setDeleteIndex(selectedStaff);
            setShowDelete(true);
            onClose();
          }}
        >
          Удалить
        </Button>
        <Button type="submit" onClick={handleSubmit}>
          Изменить
        </Button>
      </div>
    </Sidebar>
  );
}

export default UpdateRequestAirlineStaff;
