import React, { useState, useRef, useEffect, useCallback } from "react";
import classes from "./CreateRequestAirlineOtdel.module.css";
import Button from "../../Standart/Button/Button";
import Sidebar from "../Sidebar/Sidebar";
import {
  CREATE_AIRLINE_DEPARTMERT,
  decodeJWT,
  getCookie,
} from "../../../../graphQL_requests";
import { useMutation } from "@apollo/client";

function CreateRequestAirlineOtdel({
  show,
  onClose,
  id,
  addTarif,
  setAddTarif,
}) {
  const [userRole, setUserRole] = useState();
  const [isEdited, setIsEdited] = useState(false); // Флаг, указывающий, были ли изменения в форме
  const token = getCookie("token");

  useEffect(() => {
    setUserRole(decodeJWT(token).role);
  }, [token]);

  const [formData, setFormData] = useState({
    category: "",
  });

  const sidebarRef = useRef();

  const resetForm = useCallback(() => {
    setFormData({
      category: "",
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

  const [createAirlineDepartment] = useMutation(CREATE_AIRLINE_DEPARTMERT, {
    context: {
      headers: {
        Authorization: `Bearer ${token}`,
        "Apollo-Require-Preflight": "true",
      },
    },
  });

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Проверка на заполненность поля
    if (!formData.category.trim()) {
      alert("Пожалуйста, введите название отдела.");
      return;
    }

    try {
      let request = await createAirlineDepartment({
        variables: {
          updateAirlineId: id,
          input: {
            department: [
              {
                name: formData.category,
              },
            ],
          },
        },
      });

      if (request) {
        setAddTarif(
          request.data.updateAirline.department.sort((a, b) =>
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

  return (
    <Sidebar show={show} sidebarRef={sidebarRef}>
      <div className={classes.requestTitle}>
        <div className={classes.requestTitle_name}>Добавить отдел</div>
        <div className={classes.requestTitle_close} onClick={closeButton}>
          <img src="/close.png" alt="" />
        </div>
      </div>

      <div className={classes.requestMiddle}>
        <div className={classes.requestData}>
          <label>Название</label>
          <input
            type="text"
            name="category"
            value={formData.category}
            onChange={handleChange}
            placeholder="Пример: Отдел продаж"
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

export default CreateRequestAirlineOtdel;
