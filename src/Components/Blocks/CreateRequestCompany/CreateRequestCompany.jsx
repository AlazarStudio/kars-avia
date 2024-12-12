import React, { useState, useRef, useEffect, useCallback } from "react";
import classes from "./CreateRequestCompany.module.css";
import Button from "../../Standart/Button/Button";
import Sidebar from "../Sidebar/Sidebar";
import {
  CREATE_DISPATCHER_USER,
  getCookie,
} from "../../../../graphQL_requests";
import { useMutation } from "@apollo/client";
import DropDownList from "../DropDownList/DropDownList";

function CreateRequestCompany({ show, onClose, addDispatcher }) {
  const token = getCookie("token");

  const [isEdited, setIsEdited] = useState(false); // Флаг, указывающий, были ли изменения в форме
  const [formData, setFormData] = useState({
    images: "",
    name: "",
    email: "",
    role: "",
    position: "",
    login: "",
    password: "",
  });

  const sidebarRef = useRef();

  const resetForm = useCallback(() => {
    setFormData({
      images: "",
      name: "",
      email: "",
      role: "",
      position: "",
      login: "",
      password: "",
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

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData((prevState) => ({
        ...prevState,
        images: file,
      }));
    }
  };

  const [uploadFile, { data, loading, error }] = useMutation(
    CREATE_DISPATCHER_USER,
    {
      context: {
        headers: {
          Authorization: `Bearer ${token}`,
          "Apollo-Require-Preflight": "true",
        },
      },
    }
  );

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Проверяем обязательные поля
    const requiredFields = [
      "name",
      "email",
      "role",
      "position",
      "login",
      "password",
    ];
    const emptyFields = requiredFields.filter(
      (field) => !formData[field]?.trim()
    );

    if (emptyFields.length > 0) {
      alert('Пожалуйста, заполните все обязательные поля.')
      return;
    }

    if (!formData.images) {
      alert("Пожалуйста, выберите файл для загрузки");
      return;
    }

    try {
      let response_create_user = await uploadFile({
        variables: {
          input: {
            name: formData.name,
            email: formData.email,
            role: formData.role,
            position: formData.position,
            login: formData.login,
            password: formData.password,
            dispatcher: true,
          },
          images: formData.images,
        },
      });

      if (response_create_user) {
        addDispatcher(response_create_user.data.registerUser);
        resetForm();
        onClose();
      }
    } catch (e) {
      console.error("Ошибка при загрузке файла:", e);
    }
    // addDispatcher({
    //     ...formData,
    //     id: Date.now().toString()  // Generate a unique id for the new dispatcher
    // });
    // resetForm();
    // onClose();
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
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

  const positions = [
    "Руководитель службы размещения",
    "Суточный диспетчер",
    "Дневной диспетчер",
    "Коммерческий директор",
    "Региональный руководитель",
  ];

  return (
    <Sidebar show={show} sidebarRef={sidebarRef}>
      <div className={classes.requestTitle}>
        <div className={classes.requestTitle_name}>Добавить диспетчера</div>
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
            placeholder="Иванов Иван Иванович"
            value={formData.name}
            onChange={handleChange}
          />

          <label>Почта</label>
          <input
            type="text"
            name="email"
            placeholder="example@mail.ru"
            value={formData.email}
            onChange={handleChange}
          />

          <label>Роль</label>
          <DropDownList
            placeholder="Выберите роль"
            searchable={false}
            options={["DISPATCHERADMIN"]}
            initialValue={formData.role}
            onSelect={(value) => {
              setIsEdited(true);
              setFormData((prevData) => ({
                ...prevData,
                role: value,
              }));
            }}
          />
          {/* <select name="role" value={formData.role} onChange={handleChange}>
            <option value="" disabled>
              Выберите роль
            </option>
            <option value="Модератор">Модератор</option>
            <option value="DISPATCHERADMIN">DISPATCHERADMIN</option>
          </select> */}

          <label>Должность</label>
          <DropDownList
            placeholder="Выберите должность"
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
          {/* <select
            name="position"
            value={formData.position}
            onChange={handleChange}
          >
            <option value="" disabled>
              Выберите должность
            </option>
            <option value="Руководитель службы размещения">
              Руководитель службы размещения{" "}
            </option>
            <option value="Суточный диспетчер">Суточный диспетчер</option>
            <option value="Дневной диспетчер">Дневной диспетчер</option>
            <option value="Коммерческий директор">Коммерческий директор</option>
            <option value="Региональный руководитель">
              Региональный руководитель
            </option>
          </select> */}

          <label>Логин</label>
          <input
            type="text"
            name="login"
            placeholder="Логин"
            value={formData.login}
            onChange={handleChange}
          />

          <label>Пароль</label>
          <input
            type="text"
            name="password"
            placeholder="Пароль"
            value={formData.password}
            onChange={handleChange}
          />

          <label>Аватар</label>
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

export default CreateRequestCompany;
