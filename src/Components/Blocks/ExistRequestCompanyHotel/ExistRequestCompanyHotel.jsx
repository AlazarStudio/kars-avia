import React, { useState, useRef, useEffect, useCallback } from "react";
import classes from "./ExistRequestCompanyHotel.module.css";
import Button from "../../Standart/Button/Button";
import Sidebar from "../Sidebar/Sidebar";

import {
  getCookie,
  server,
  UPDATE_HOTEL_USER,
} from "../../../../graphQL_requests.js";
import { useMutation, useQuery } from "@apollo/client";
import DropDownList from "../DropDownList/DropDownList.jsx";

function ExistRequestCompanyHotel({
  show,
  onClose,
  chooseObject,
  updateDispatcher,
  openDeleteComponent,
  filterList,
  id,
}) {
  const token = getCookie("token");

  const [uploadFile, { data, loading, error }] = useMutation(
    UPDATE_HOTEL_USER,
    {
      context: {
        headers: {
          Authorization: `Bearer ${token}`,
          "Apollo-Require-Preflight": "true",
        },
      },
    }
  );

  const [isEdited, setIsEdited] = useState(false); // Флаг, указывающий, были ли изменения в форме
  const [formData, setFormData] = useState({
    id: chooseObject?.id || "",
    images: null,
    name: chooseObject?.name || "",
    email: chooseObject?.email || "",
    role: chooseObject?.role || "",
    position: chooseObject?.position || "",
    login: chooseObject?.login || "",
    password: chooseObject?.password || "",
  });

  const sidebarRef = useRef();

  const [index, setIndex] = useState(null);
  const [showIMG, setShowIMG] = useState();

  useEffect(() => {
    if (chooseObject) {
      setFormData({
        id: chooseObject.id || "",
        images: null,
        name: chooseObject.name || "",
        email: chooseObject.email || "",
        role: chooseObject.role || "",
        position: chooseObject.position || "",
        login: chooseObject.login || "",
        password: chooseObject.password || "",
      });
      setShowIMG(chooseObject.images);
      setIndex(chooseObject.index);
    }
  }, [chooseObject]);

  const resetForm = useCallback(() => {
    setFormData({
      id: chooseObject?.id || "",
      images: null,
      name: chooseObject?.name || "",
      email: chooseObject?.email || "",
      role: chooseObject?.role || "",
      position: chooseObject?.position || "",
      login: chooseObject?.login || "",
      password: chooseObject?.password || "",
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
  }, [isEdited, onClose]);

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
        images: file,
      }));
    }
  };

  const handleUpdate = async () => {
    let response_update_user = await uploadFile({
      variables: {
        input: {
          id: formData.id,
          name: formData.name,
          email: formData.email,
          role: formData.role,
          position: formData.position,
          login: formData.login,
          password: formData.password,
          hotelId: id,
        },
        images: formData.images,
      },
    });

    if (response_update_user) {
      updateDispatcher(response_update_user.data.updateUser, index);
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
        <div className={classes.requestTitle_name}>Пользователь</div>
        <div className={classes.requestTitle_close} onClick={closeButton}>
          <img src="/close.png" alt="Close" />
        </div>
      </div>

      <div className={classes.requestMiddle}>
        <div className={classes.requestData}>
          <div className={classes.requestDataInfo_img}>
            <div className={classes.requestDataInfo_img_imgBlock}>
              <img src={`${server}${showIMG}`} alt="" />
            </div>
          </div>

          <div className={classes.requestDataInfo}>
            <div className={classes.requestDataInfo_title}>ФИО</div>
            <input
              type="text"
              name="name"
              placeholder="Иванов Иван Иванович"
              value={formData.name}
              onChange={handleChange}
            />
          </div>
          <div className={classes.requestDataInfo}>
            <div className={classes.requestDataInfo_title}>Почта</div>
            <input
              type="text"
              name="email"
              placeholder="example@mail.ru"
              value={formData.email}
              onChange={handleChange}
            />
          </div>
          <div className={classes.requestDataInfo}>
            <div className={classes.requestDataInfo_title}>Роль</div>
            <div className={classes.dropdown}>
              <DropDownList
                placeholder="Выберите роль"
                options={["HOTELADMIN"]} // Роли
                initialValue={formData.role}
                onSelect={(value) => {
                  setIsEdited(true);
                  setFormData((prevData) => ({
                    ...prevData,
                    role: value,
                  }));
                }}
              />
            </div>

            {/* <select name="role" value={formData.role} onChange={handleChange}>
              <option value="HOTELADMIN">HOTELADMIN</option>
            </select> */}
          </div>
          <div className={classes.requestDataInfo}>
            <div className={classes.requestDataInfo_title}>Должность</div>
            <div className={classes.dropdown}>
              <DropDownList
                placeholder="Выберите должность"
                options={["Модератор", "Администратор"]} // Должности
                initialValue={formData.position}
                onSelect={(value) => {
                  setIsEdited(true);
                  setFormData((prevData) => ({
                    ...prevData,
                    position: value,
                  }));
                }}
              />
            </div>
            {/* <select
              name="position"
              value={formData.position}
              onChange={handleChange}
            >
              <option value="Модератор">Модератор</option>
              <option value="Администратор">Администратор</option>
            </select> */}
          </div>
          <div className={classes.requestDataInfo}>
            <div className={classes.requestDataInfo_title}>Логин</div>
            <input
              type="text"
              name="login"
              placeholder="Логин"
              value={formData.login}
              onChange={handleChange}
            />
          </div>
          <div className={classes.requestDataInfo}>
            <div className={classes.requestDataInfo_title}>Пароль</div>
            <input
              type="text"
              name="password"
              placeholder="Пароль"
              value={formData.password}
              onChange={handleChange}
            />
          </div>
          <div className={classes.requestDataInfo}>
            <div className={classes.requestDataInfo_title}>Аватар</div>
            <input type="file" name="images" onChange={handleFileChange} />
          </div>
        </div>
      </div>

      <div className={classes.requestButton}>
        <Button
          onClick={() => openDeleteComponent(index, formData.id)}
          backgroundcolor={"#FF9C9C"}
        >
          Удалить <img src="/delete.png" alt="" />
        </Button>
        <Button
          onClick={handleUpdate}
          backgroundcolor={"#3CBC6726"}
          color={"#3B6C54"}
        >
          Изменить <img src="/editDispetcher.png" alt="" />
        </Button>
      </div>
    </Sidebar>
  );
}

export default ExistRequestCompanyHotel;
