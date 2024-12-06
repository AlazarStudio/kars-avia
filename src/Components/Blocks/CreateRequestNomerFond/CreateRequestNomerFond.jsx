import React, { useState, useRef, useEffect, useCallback } from "react";
import classes from "./CreateRequestNomerFond.module.css";
import Button from "../../Standart/Button/Button";
import Sidebar from "../Sidebar/Sidebar";

import { getCookie, UPDATE_HOTEL } from "../../../../graphQL_requests.js";
import { useMutation, useQuery } from "@apollo/client";
import Swal from "sweetalert2";

function CreateRequestNomerFond({
  show,
  onClose,
  addTarif,
  id,
  setAddTarif,
  uniqueCategories,
  tarifs,
}) {
  const token = getCookie("token");
  const [isEdited, setIsEdited] = useState(false); // Флаг, указывающий, были ли изменения в форме

  const [formData, setFormData] = useState({
    nomerName: "",
    category: "",
    reserve: "",
  });

  const [updateHotel] = useMutation(UPDATE_HOTEL, {
    context: {
      headers: {
        Authorization: `Bearer ${token}`,
        "Apollo-Require-Preflight": "true",
      },
    },
  });

  const sidebarRef = useRef();

  const resetForm = useCallback(() => {
    setFormData({
      nomerName: "",
      category: "",
      reserve: "",
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
    setIsEdited(true);
    setFormData((prevState) => ({
      ...prevState,
      [name]: value,
    }));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.nomerName.trim() || !formData.category || !formData.reserve) {
      // alert("Пожалуйста, заполните все поля формы перед отправкой.");
      Swal.fire({
        title: "Ошибка!",
        text: "Пожалуйста, заполните все поля формы перед отправкой.",
        icon: "error",
        confirmButtonText: "Ок",
        customClass: {
          confirmButton: "swal_confirm",
        },
      });
      return;
    }

    const nomerName = formData.nomerName.startsWith("№")
      ? formData.nomerName
      : `№ ${formData.nomerName}`;

    // Преобразование reserve в булево значение
    const reserveBoolean = formData.reserve === "true";

    let response_update_room = await updateHotel({
      variables: {
        updateHotelId: id,
        input: {
          rooms: [
            {
              name: nomerName,
              category: formData.category,
              reserve: reserveBoolean,
            },
          ],
        },
      },
    });

    if (response_update_room) {
      const sortedTarifs = Object.values(
        response_update_room.data.updateHotel.rooms.reduce((acc, room) => {
          if (!acc[room.category]) {
            acc[room.category] = {
              name:
                room.category === "onePlace"
                  ? "Одноместный"
                  : room.category === "twoPlace"
                  ? "Двухместный"
                  : "",
              origName: room.category,
              rooms: [],
            };
          }
          acc[room.category].rooms.push(room);
          return acc;
        }, {})
      );

      sortedTarifs.forEach((category) => {
        category.rooms.sort((a, b) => a.name.localeCompare(b.name));
      });

      setAddTarif(sortedTarifs);
      resetForm();
      onClose();
    }
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      // Проверяем, был ли клик внутри боковой панели или SweetAlert2
      if (
        document.querySelector(".swal2-container")?.contains(event.target) || // Клик в SweetAlert2
        sidebarRef.current?.contains(event.target) // Клик в боковой панели
      ) {
        return; // Если клик внутри, ничего не делаем
      }

      // Если клик был вне боковой панели, то закрываем её
      closeButton();
    };

    if (show) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }

    // Очистка эффекта при демонтировании компонента
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [show, closeButton]);

  return (
    <Sidebar show={show} sidebarRef={sidebarRef}>
      <div className={classes.requestTitle}>
        <div className={classes.requestTitle_name}>Добавить номер</div>
        <div className={classes.requestTitle_close} onClick={closeButton}>
          <img src="/close.png" alt="" />
        </div>
      </div>

      <div className={classes.requestMiddle}>
        <div className={classes.requestData}>
          <label>Название номера</label>
          <input
            type="text"
            name="nomerName"
            value={formData.nomerName}
            onChange={handleChange}
            placeholder="Пример: № 151"
          />

          <label>Категория</label>
          <select
            name="category"
            value={formData.category}
            onChange={handleChange}
          >
            {/* {uniqueCategories.map(category => ( */}
            <option value={""} disabled>
              Выберите категорию
            </option>
            <option value={"onePlace"}>Одноместный</option>
            <option value={"twoPlace"}>Двухместный</option>
            {/* ))} */}
          </select>

          <label>Квота или резерв</label>
          <select
            name="reserve"
            id="reserve"
            value={formData.reserve}
            onChange={handleChange}
          >
            <option value="" disabled>
              Выберите тип
            </option>
            <option value={false}>Квота</option>
            <option value={true}>Резерв</option>
          </select>
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

export default CreateRequestNomerFond;
