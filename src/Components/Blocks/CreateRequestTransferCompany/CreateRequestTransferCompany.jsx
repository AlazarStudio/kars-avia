import React, { useState, useRef, useEffect, useCallback } from "react";
import classes from "./CreateRequestTransferCompany.module.css";
import Button from "../../Standart/Button/Button";
import Sidebar from "../Sidebar/Sidebar";
import {
  CREATE_DISPATCHER_USER,
  getCookie,
} from "../../../../graphQL_requests";
import { useMutation } from "@apollo/client";
import DropDownList from "../DropDownList/DropDownList";
import MUILoader from "../MUILoader/MUILoader";
import MUIAutocomplete from "../MUIAutocomplete/MUIAutocomplete";
import { rolesObject } from "../../../roles";
import CloseIcon from "../../../shared/icons/CloseIcon";
import useRequiredFields from "../../../hooks/useRequiredFields.js";

function CreateRequestTransferCompany({
  show,
  onClose,
  addDispatcher,
  addNotification,
  positions,
}) {
  const token = getCookie("token");

  const [isEdited, setIsEdited] = useState(false); // Флаг, указывающий, были ли изменения в форме
  const [formData, setFormData] = useState({
    images: null,
    name: "",
    email: "",
    role: "",
    position: "",
    login: "",
    password: "",
  });

  const sidebarRef = useRef();
  const formBodyRef = useRef(null);

  const requiredKeys = ["name", "email", "role", "position", "login", "password"];
  const {
    invalid,
    validate,
    reset: resetRequired,
  } = useRequiredFields(formData, requiredKeys, formBodyRef);

  const resetForm = useCallback(() => {
    resetRequired();
    setFormData({
      images: null,
      name: "",
      email: "",
      role: "",
      position: "",
      login: "",
      password: "",
    });
    setIsEdited(false); // Сброс флага изменений
  }, [resetRequired]);

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

  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    setIsLoading(true);

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      alert("Введите корректный email.");
      setIsLoading(false);
      return;
    }

    if (formData.password.length < 8) {
      alert("Пароль должен содержать минимум 8 символов.");
      setIsLoading(false);
      return;
    }

    // if (!formData.images) {
    //   alert("Пожалуйста, выберите файл для загрузки");
    //   return;
    // }

    try {
      const selectedPosition = positions.find(
        (position) => position.name === formData.position
      );
      let response_create_user = await uploadFile({
        variables: {
          input: {
            name: formData.name,
            email: formData.email,
            role: formData.role,
            positionId: selectedPosition?.id,
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
        addNotification("Аккаунт диспетчера создан успешно.", "success");
      }
    } catch (e) {
      console.error("Ошибка при загрузке файла:", e);
      if (
        String(e).startsWith(
          "ApolloError: Пользователь с таким логином уже существует"
        )
      ) {
        alert("Пользователь с таким логином уже существует");
      } else if (
        String(e).startsWith(
          "ApolloError: Пользователь с таким email уже существует"
        )
      ) {
        alert("Пользователь с такой почтой уже существует");
      } else if (
        String(e).startsWith(
          "ApolloError: Пользователь с таким email и логином уже существует"
        )
      ) {
        alert("Пользователь с такой почтой и логином уже существует");
      }
    } finally {
      // onClose();
      // resetForm();
      setIsLoading(false);
      // addNotification("Аккаунт диспетчера создан успешно.", "success")
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

  // const positions = [
  //   "Руководитель службы размещения",
  //   "Суточный диспетчер",
  //   "Дневной диспетчер",
  //   "Коммерческий директор",
  //   "Региональный руководитель",
  // ];

  // const roles = [
  //   { label: "Администратор", value: "DISPATCHERADMIN" }
  // ];

  return (
    <Sidebar show={show} sidebarRef={sidebarRef}>
      <div className={classes.requestTitle}>
        <div className={classes.requestTitle_name}>Добавить диспетчера</div>
        <div className={classes.requestTitle_close} onClick={closeButton}>
          <CloseIcon />
        </div>
      </div>

      {isLoading ? (
        <MUILoader loadSize={"50px"} fullHeight={"80vh"} />
      ) : (
        <>
          <div className={classes.requestMiddle} ref={formBodyRef}>
            <div className={classes.requestData}>
              <span className={classes.hint}>* — обязательные поля</span>
              <label
                className={`${classes.required} ${invalid("name") ? "fieldInvalid" : ""}`}
              >
                ФИО
              </label>
              <input
                type="text"
                name="name"
                className={invalid("name") ? "inputInvalid" : undefined}
                placeholder="Иванов Иван Иванович"
                value={formData.name}
                onChange={handleChange}
                autoComplete="new-password"
              />

              <label
                className={`${classes.required} ${invalid("email") ? "fieldInvalid" : ""}`}
              >
                Почта
              </label>
              <input
                type="email"
                name="email"
                className={invalid("email") ? "inputInvalid" : undefined}
                placeholder="example@mail.ru"
                value={formData.email}
                onChange={handleChange}
                autoComplete="new-password"
              />

              <label
                className={`${classes.required} ${invalid("role") ? "fieldInvalid" : ""}`}
              >
                Роль
              </label>
              <MUIAutocomplete
                dropdownWidth={"100%"}
                label={"Выберите роль"}
                error={invalid("role")}
                options={rolesObject.dispatcher}
                value={
                  rolesObject.dispatcher.find(
                    (option) => option.value === formData.role
                  ) || null
                }
                onChange={(event, newValue) => {
                  setIsEdited(true);
                  // Если выбрана опция, сохраняем её value, иначе очищаем поле
                  setFormData((prevData) => ({
                    ...prevData,
                    role: newValue ? newValue.value : "",
                  }));
                }}
              />

              <label
                className={`${classes.required} ${invalid("position") ? "fieldInvalid" : ""}`}
              >
                Должность
              </label>
              <MUIAutocomplete
                dropdownWidth={"100%"}
                label={"Выберите должность"}
                error={invalid("position")}
                options={positions.map((position) => position.name)}
                value={formData.position}
                onChange={(event, newValue) => {
                  setIsEdited(true);
                  setFormData((prevData) => ({
                    ...prevData,
                    position: newValue,
                  }));
                }}
              />

              <label
                className={`${classes.required} ${invalid("login") ? "fieldInvalid" : ""}`}
              >
                Логин
              </label>
              <input
                type="text"
                name="login"
                className={invalid("login") ? "inputInvalid" : undefined}
                placeholder="Логин"
                value={formData.login}
                onChange={handleChange}
                autoComplete="new-password"
              />

              <label
                className={`${classes.required} ${invalid("password") ? "fieldInvalid" : ""}`}
              >
                Пароль
              </label>
              <input
                type="password"
                name="password"
                className={invalid("password") ? "inputInvalid" : undefined}
                placeholder="Пароль"
                value={formData.password}
                onChange={handleChange}
                autoComplete="new-password"
              />

              <label>Аватар</label>
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

export default CreateRequestTransferCompany;

