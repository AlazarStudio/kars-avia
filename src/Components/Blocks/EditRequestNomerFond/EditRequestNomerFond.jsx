import React, { useState, useRef, useEffect, useCallback } from "react";
import classes from "./EditRequestNomerFond.module.css";
import Button from "../../Standart/Button/Button";
import Sidebar from "../Sidebar/Sidebar";

import { getCookie, UPDATE_HOTEL } from "../../../../graphQL_requests.js";
import { useMutation, useQuery } from "@apollo/client";

function EditRequestNomerFond({
  show,
  id,
  onClose,
  nomer,
  places,
  category,
  reserve,
  active,
  onSubmit,
  uniqueCategories,
  tarifs,
  addTarif,
  setAddTarif,
  selectedNomer,
  filter
}) {
  const token = getCookie("token");
  // console.log(category);

  const [isEdited, setIsEdited] = useState(false); // Флаг, указывающий, были ли изменения в форме
  const [formData, setFormData] = useState({
    nomerName: (nomer && nomer.name) || "",
    category: category?.origName || "",
    reserve: nomer?.reserve || "",
    active: nomer?.active || "",
    description: nomer?.description || "",
    roomImages: null,
  });

  const sidebarRef = useRef();

  const resetForm = useCallback(() => {
    setIsEdited(false); // Сброс флага изменений
  }, []);

  useEffect(() => {
    if (show) {
      setFormData({
        nomerName: nomer?.name || "",
        category: category.origName || nomer?.category || "",
        reserve: typeof nomer?.reserve === "boolean" ? nomer?.reserve : false, // Установить false, если undefined
        active: typeof nomer?.active === "boolean" ? nomer?.active : false, // Установить false, если undefined
        description: nomer?.description || "",
        roomImages: null,
      });
    }
  }, [show, nomer, category, reserve, active]);

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

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData((prevState) => ({
        ...prevState,
        roomImages: file, // Сохраняем файл напрямую
      }));
    }
  };

  const [updateHotel] = useMutation(UPDATE_HOTEL, {
    context: {
      headers: {
        Authorization: `Bearer ${token}`,
        "Apollo-Require-Preflight": "true",
      },
    },
  });

  const handleSubmit = async (e) => {
    e.preventDefault();

    const nomerName =
      filter == 'quote' ? formData.nomerName :
        filter == 'reserve' && formData.nomerName.includes('резерв') ? formData.nomerName : `${formData.nomerName} (резерв)`;

    let response_update_room = await updateHotel({
      variables: {
        updateHotelId: id,
        input: {
          rooms: [
            {
              id: nomer.id,
              name: nomerName,
              category: formData.category,
              reserve: formData.reserve,
              active: formData.active,
              description: formData.description,
            },
          ],
        },
        roomImages: formData.roomImages,
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
                    : room.category === "threePlace"
                      ? "Трехместный"
                      : room.category === "fourPlace"
                        ? "Четырехместный"
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
      onSubmit(nomerName, nomer, formData.category);
      resetForm();
      onClose();
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
        <div className={classes.requestTitle_name}>Редактировать номер</div>
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
            value={formData.nomerName.includes('резерв') ? formData.nomerName.split(' (резерв)')[0] : `${formData.nomerName}`}
            onChange={handleChange}
            placeholder="Пример: № 151"
          />

          <label>Категория</label>
          <select
            name="category"
            value={formData.category}
            onChange={handleChange}
          >
            <option value={"onePlace"}>Одноместный</option>
            <option value={"twoPlace"}>Двухместный</option>
            <option value={"threePlace"}>Трехместный</option>
            <option value={"fourPlace"}>Четырехместный</option>
            {/* {uniqueCategories.map(category => (
                            <option key={category} value={category}>{category == 'onePlace' ? 'Одноместный' : category == 'twoPlace' ? 'Двухместный' : ''}</option>
                        ))} */}
          </select>

          <label>Тип</label>
          <select
            name="reserve"
            value={
              formData.reserve === true
                ? "true"
                : formData.reserve === false
                  ? "false"
                  : ""
            }
            onChange={(e) => {
              const value = e.target.value === "true"; // Преобразование строки в булевое значение
              setIsEdited(true);
              setFormData((prevState) => ({
                ...prevState,
                reserve: value,
              }));
            }}
          >
            <option value="" disabled>
              Выберите тип
            </option>
            <option value="false">Квота</option>
            <option value="true">Резерв</option>
          </select>

          <label>Состояние</label>
          <select
            name="active"
            value={
              formData.active === true
                ? "true"
                : formData.active === false
                  ? "false"
                  : ""
            }
            onChange={(e) => {
              const value = e.target.value === "true";
              setIsEdited(true);
              setFormData((prevState) => ({
                ...prevState,
                active: value,
              }));
            }}
          >
            <option value="" disabled>
              Выберите состояние
            </option>
            <option value="false">Не работает</option>
            <option value="true">Работает</option>
          </select>

          <label>Описание</label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
          ></textarea>

          <label>Изображение</label>
          <input type="file" name="roomImages" onChange={handleFileChange} />
        </div>
      </div>

      <div className={classes.requestButton}>
        <Button type="submit" onClick={handleSubmit}>
          Сохранить изменения
        </Button>
      </div>
    </Sidebar>
  );
}

export default EditRequestNomerFond;
