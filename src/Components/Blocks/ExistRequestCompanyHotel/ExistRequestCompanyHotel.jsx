import React, { useState, useRef, useEffect, useCallback } from "react";
import classes from "./ExistRequestCompanyHotel.module.css";
import Button from "../../Standart/Button/Button";
import Sidebar from "../Sidebar/Sidebar";

import {
  decodeJWT,
  getCookie,
  server,
  UPDATE_HOTEL_USER,
} from "../../../../graphQL_requests.js";
import { useMutation, useQuery } from "@apollo/client";
import DropDownList from "../DropDownList/DropDownList.jsx";
import MUILoader from "../MUILoader/MUILoader.jsx";
import MUIAutocomplete from "../MUIAutocomplete/MUIAutocomplete.jsx";
import { roles, rolesObject } from "../../../roles.js";

function ExistRequestCompanyHotel({
  show,
  onClose,
  chooseObject,
  updateDispatcher,
  openDeleteComponent,
  filterList,
  addNotification,
  positions,
  id,
}) {
  const token = getCookie("token");
  const user = decodeJWT(token);

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
    oldPassword: "",
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
        oldPassword: "",
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
      oldPassword: "",
      password: chooseObject?.password || "",
    });
    setIsEdited(false); // Сброс флага изменений
    setShowOldPassword(false);
    setShowNewPassword(false);
  }, []);

  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  const closeButton = useCallback(() => {
    if (!isEdited) {
      resetForm();
      onClose();
      setIsEditing(false);
      return;
    }

    if (window.confirm("Вы уверены? Все несохраненные данные будут удалены.")) {
      resetForm();
      onClose();
      setIsEditing(false);
    }
  }, [isEdited, isEditing, onClose]);

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
        images: null,
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

  const handleUpdate = async () => {
    if (isEditing) {
      setIsLoading(true); // Устанавливаем isLoading перед началом загрузки
      // Проверяем обязательные поля
      const requiredFields = [
        "name",
        "email",
        "role",
        "position",
        "login",
      ];
      const emptyFields = requiredFields.filter(
        (field) => !formData[field]?.trim()
      );

      if (emptyFields.length > 0) {
        alert("Пожалуйста, заполните все обязательные поля.");
        setIsLoading(false);
        return;
      }
      if (formData.password !== "" && formData.password.length < 8) {
        alert("Новый пароль должен содержать минимум 8 символов.");
        setIsLoading(false);
        return;
      }
      try {
        const selectedPosition = positions.find(
          (position) => position.name === formData.position
        );

        let response_update_user = await uploadFile({
          variables: {
            input: {
              id: formData.id,
              name: formData.name,
              email: formData.email,
              role: formData.role,
              positionId: selectedPosition?.id,
              login: formData.login,
              password: formData.password,
              oldPassword: formData.oldPassword,
              hotelId: id,
            },
            images: formData.images,
          },
        });

        if (response_update_user) {
          updateDispatcher(response_update_user.data.updateUser, index);
          resetForm();
          onClose();
          addNotification("Редактирование аккаунта прошло успешно.", "success");
        }
      } catch (error) {
        console.error("Ошибка обновления пользователя:", error);
        if (String(error).startsWith("ApolloError: Указан неверный пароль.")) {
          alert("Указан неверный старый пароль.");
        } else if (
          String(error).startsWith(
            "ApolloError: Для обновления пароля необходимо указать предыдущий пароль."
          )
        ) {
          alert("Для обновления пароля необходимо указать предыдущий пароль.");
        } else {
          alert("Ошибка обновления пользователя.");
        }
      } finally {
        // resetForm();
        // onClose();
        setIsLoading(false); // Сбрасываем isLoading после завершения запроса
        // addNotification("Редактирование аккаунта прошло успешно.", "success");
        setShowOldPassword(false);
        setShowNewPassword(false);
        setFormData((prevData) => ({
          ...prevData,
          oldPassword: "",
          password: chooseObject?.password || "",
        }));
      }
    }
    setIsEditing(!isEditing);
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

  // console.log(isLoading);

  return (
    <Sidebar show={show} sidebarRef={sidebarRef}>
      <div className={classes.requestTitle}>
        <div className={classes.requestTitle_name}>Пользователь</div>
        <div className={classes.requestTitle_close} onClick={closeButton}>
          <img src="/close.png" alt="Close" />
        </div>
      </div>

      {isLoading ? (
        <MUILoader loadSize={"50px"} fullHeight={"85vh"} />
      ) : (
        <>
          <div className={classes.requestMiddle}>
            <div className={classes.requestData}>
              <div className={classes.requestDataInfo_img}>
                <div className={classes.requestDataInfo_img_imgBlock}>
                  <img
                    src={
                      showIMG?.length !== 0
                        ? `${server}${showIMG}`
                        : "/no-avatar.png"
                    }
                    alt=""
                  />
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
                  disabled={!isEditing}
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
                  disabled={!isEditing}
                />
              </div>
              {user?.role === roles.hotelModerator ? null : (
                <>
                  <div className={classes.requestDataInfo}>
                    <div className={classes.requestDataInfo_title}>Роль</div>
                    <div className={classes.dropdown}>
                      <MUIAutocomplete
                        dropdownWidth={"100%"}
                        isDisabled={!isEditing}
                        label={"Выберите должность"}
                        options={rolesObject.hotel}
                        value={
                          rolesObject.hotel.find(
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
                    </div>
                  </div>
                </>
              )}

              <div className={classes.requestDataInfo}>
                <div className={classes.requestDataInfo_title}>Должность</div>
                <div className={classes.dropdown}>
                  <MUIAutocomplete
                    dropdownWidth={"100%"}
                    isDisabled={!isEditing}
                    label={"Выберите должность"}
                    options={positions?.map((position) => position.name)}
                    value={formData.position}
                    onChange={(event, newValue) => {
                      setIsEdited(true);
                      setFormData((prevData) => ({
                        ...prevData,
                        position: newValue,
                      }));
                    }}
                  />
                </div>
              </div>
              <div className={classes.requestDataInfo}>
                <div className={classes.requestDataInfo_title}>Логин</div>
                <input
                  type="text"
                  name="login"
                  placeholder="Логин"
                  value={formData.login}
                  onChange={handleChange}
                  disabled={!isEditing}
                />
              </div>
              <div className={classes.requestDataInfo}>
                <div className={classes.requestDataInfo_title}>
                  Старый пароль
                </div>
                <input
                  type={showOldPassword ? "text" : "password"}
                  name="oldPassword"
                  placeholder="Старый пароль"
                  value={formData.oldPassword}
                  onChange={handleChange}
                  disabled={!isEditing}
                />
                <img
                  src={showOldPassword ? "/eyeOpen.png" : "/eyeClose.png"}
                  style={{
                    width: "20px",
                    objectFit: "contain",
                    position: "absolute",
                    right: "40px",
                    cursor: "pointer",
                  }}
                  onClick={() =>
                    isEditing ? setShowOldPassword((prev) => !prev) : null
                  }
                  alt=""
                />
              </div>
              <div className={classes.requestDataInfo}>
                <div className={classes.requestDataInfo_title}>
                  Новый пароль
                </div>
                <input
                  type={showNewPassword ? "text" : "password"}
                  name="password"
                  placeholder="Новый пароль"
                  value={formData.password}
                  onChange={handleChange}
                  disabled={!isEditing}
                />
                <img
                  src={showNewPassword ? "/eyeOpen.png" : "/eyeClose.png"}
                  style={{
                    width: "20px",
                    objectFit: "contain",
                    position: "absolute",
                    right: "40px",
                    cursor: "pointer",
                  }}
                  onClick={() =>
                    isEditing ? setShowNewPassword((prev) => !prev) : null
                  }
                  alt=""
                />
              </div>
              <div className={classes.requestDataInfo}>
                <div className={classes.requestDataInfo_title}>Аватар</div>
                <input
                  type="file"
                  name="images"
                  onChange={handleFileChange}
                  ref={fileInputRef}
                  disabled={!isEditing}
                />
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
              backgroundcolor={!isEditing ? "#3CBC6726" : "#0057C3"}
              color={!isEditing ? "#3B6C54" : "#fff"}
            >
              {isEditing ? (
                <>
                  Сохранить <img src="/saveDispatcher.png" alt="" />
                </>
              ) : (
                <>
                  Изменить <img src="/editDispetcher.png" alt="" />
                </>
              )}
            </Button>
          </div>
        </>
      )}
    </Sidebar>
  );
}

export default ExistRequestCompanyHotel;
