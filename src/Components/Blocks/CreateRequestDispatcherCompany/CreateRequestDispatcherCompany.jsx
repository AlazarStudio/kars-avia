import React, { useState, useRef, useEffect, useCallback, useMemo } from "react";
import classes from "./CreateRequestDispatcherCompany.module.css";
import Button from "../../Standart/Button/Button";
import Sidebar from "../Sidebar/Sidebar";
import {
  CREATE_DISPATCHER_USER,
  getCookie,
} from "../../../../graphQL_requests";
import { useMutation } from "@apollo/client";
import MUILoader from "../MUILoader/MUILoader";
import MUIAutocomplete from "../MUIAutocomplete/MUIAutocomplete";
import { rolesObject } from "../../../roles";

function CreateRequestDispatcherCompany({
  show,
  onClose,
  onCreated,
  addNotification,
  positions,
  departments,
}) {
  const token = getCookie("token");

  const [isEdited, setIsEdited] = useState(false);
  const [formData, setFormData] = useState({
    images: null,
    name: "",
    email: "",
    role: "",
    position: "",
    login: "",
    password: "",
    departmentId: "",
  });

  const sidebarRef = useRef();

  const resetForm = useCallback(() => {
    setFormData({
      images: null,
      name: "",
      email: "",
      role: "",
      position: "",
      login: "",
      password: "",
      departmentId: "",
    });
    setIsEdited(false);
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
    setIsEdited(true);
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
        fileInputRef.current.value = "";
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

  const [uploadFile] = useMutation(CREATE_DISPATCHER_USER, {
    context: {
      headers: {
        Authorization: `Bearer ${token}`,
        "Apollo-Require-Preflight": "true",
      },
    },
  });

  const [isLoading, setIsLoading] = useState(false);

  const departmentOptions = useMemo(
    () => [
      { label: "Без отдела", value: "" },
      ...(departments || []).map((department) => ({
        label: department.name,
        value: department.id,
      })),
    ],
    [departments]
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

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
      alert("Пожалуйста, заполните все обязательные поля.");
      setIsLoading(false);
      return;
    }

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

    try {
      const selectedPosition = positions.find(
        (position) => position.name === formData.position
      );
      const response = await uploadFile({
        variables: {
          input: {
            name: formData.name,
            email: formData.email,
            role: formData.role,
            positionId: selectedPosition?.id,
            login: formData.login,
            password: formData.password,
            dispatcher: true,
            dispatcherDepartmentId: formData.departmentId || null,
          },
          images: formData.images,
        },
      });

      if (response) {
        onCreated?.(response.data.registerUser);
        resetForm();
        onClose();
        addNotification?.("Аккаунт диспетчера создан успешно.", "success");
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
          "ApolloError: Пользователь с такой почтой уже существует"
        )
      ) {
        alert("Пользователь с такой почтой уже существует");
      } else if (
        String(e).startsWith(
          "ApolloError: Пользователь с такой почтой и логином уже существует"
        )
      ) {
        alert("Пользователь с такой почтой и логином уже существует");
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (sidebarRef.current?.contains(event.target)) {
        return;
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
        <div className={classes.requestTitle_name}>Добавить диспетчера</div>
        <div className={classes.requestTitle_close} onClick={closeButton}>
          <img src="/close.png" alt="" />
        </div>
      </div>

      {isLoading ? (
        <MUILoader loadSize={"50px"} fullHeight={"80vh"} />
      ) : (
        <>
          <div className={classes.requestMiddle}>
            <div className={classes.requestData}>
              <label>ФИО</label>
              <input
                type="text"
                name="name"
                placeholder="Иванов Иван Иванович"
                value={formData.name}
                onChange={handleChange}
                autoComplete="new-password"
              />

              <label>Почта</label>
              <input
                type="email"
                name="email"
                placeholder="example@mail.ru"
                value={formData.email}
                onChange={handleChange}
                autoComplete="new-password"
              />

              <label>Роль</label>
              <MUIAutocomplete
                dropdownWidth={"100%"}
                label={"Выберите роль"}
                options={rolesObject.dispatcher}
                value={
                  rolesObject.dispatcher.find(
                    (option) => option.value === formData.role
                  ) || null
                }
                onChange={(event, newValue) => {
                  setIsEdited(true);
                  setFormData((prevData) => ({
                    ...prevData,
                    role: newValue ? newValue.value : "",
                  }));
                }}
              />

              <label>Отдел</label>
              <MUIAutocomplete
                dropdownWidth={"100%"}
                label={"Выберите отдел"}
                options={departmentOptions}
                value={
                  departmentOptions.find(
                    (option) => option.value === formData.departmentId
                  ) || null
                }
                onChange={(event, newValue) => {
                  setIsEdited(true);
                  setFormData((prevData) => ({
                    ...prevData,
                    departmentId: newValue ? newValue.value : "",
                  }));
                }}
              />

              <label>Должность</label>
              <MUIAutocomplete
                dropdownWidth={"100%"}
                label={"Выберите должность"}
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

              <label>Логин</label>
              <input
                type="text"
                name="login"
                placeholder="Логин"
                value={formData.login}
                onChange={handleChange}
                autoComplete="new-password"
              />

              <label>Пароль</label>
              <input
                type="password"
                name="password"
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

export default CreateRequestDispatcherCompany;
