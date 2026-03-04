import React, { useState, useRef, useEffect, useCallback } from "react";
import classes from "./ExistRequestCompanyHotel.module.css";
import Button from "../../Standart/Button/Button";
import Sidebar from "../Sidebar/Sidebar";

import {
  decodeJWT,
  getCookie,
  getMediaUrl,
  UPDATE_HOTEL_USER,
} from "../../../../graphQL_requests.js";
import { useMutation, useQuery } from "@apollo/client";
import DropDownList from "../DropDownList/DropDownList.jsx";
import MUILoader from "../MUILoader/MUILoader.jsx";
import MUIAutocomplete from "../MUIAutocomplete/MUIAutocomplete.jsx";
import { roles, rolesObject } from "../../../roles.js";
import CloseIcon from "../../../shared/icons/CloseIcon.jsx";
import AdditionalMenu from "../../Standart/AdditionalMenu/AdditionalMenu";

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
    position: chooseObject?.position?.name || "",
    login: chooseObject?.login || "",
    oldPassword: "",
    password: chooseObject?.password || "",
  });

  const sidebarRef = useRef();
  const menuRef = useRef(null);
  const [anchorEl, setAnchorEl] = useState(null);

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
        position: chooseObject.position?.name || "",
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
      position: chooseObject?.position?.name || "",
      login: chooseObject?.login || "",
      oldPassword: "",
      password: chooseObject?.password || "",
    });
    setIsEdited(false); // Сброс флага изменений
    setShowOldPassword(false);
    setShowNewPassword(false);
    if (chooseObject?.images) setShowIMG(chooseObject.images);
  }, [chooseObject]);

  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  const closeButton = useCallback(() => {
    setAnchorEl(null);
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
  }, [isEdited, isEditing, onClose, resetForm]);

  const handleMenuOpen = (e) => setAnchorEl(e.currentTarget);
  const handleMenuClose = () => setAnchorEl(null);
  const handleEditFromMenu = () => {
    handleMenuClose();
    setIsEditing(true);
  };
  const handleDeleteFromMenu = () => {
    handleMenuClose();
    openDeleteComponent(index, formData.id);
  };
  const handleCancelEdit = () => {
    resetForm();
    setIsEditing(false);
  };

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
      const requiredFields = ["name", "email", "role", "position", "login"];
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
      if (anchorEl && menuRef.current?.contains(event.target)) {
        setAnchorEl(null);
        return;
      }
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
  }, [show, closeButton, anchorEl]);

  // console.log(isLoading);

  return (
    <Sidebar show={show} sidebarRef={sidebarRef}>
      <div className={classes.requestTitle}>
        <div className={classes.requestTitle_name}>Пользователь</div>
        <div className={classes.requestTitle_close}>
          <AdditionalMenu
            anchorEl={anchorEl}
            onOpen={handleMenuOpen}
            onClose={handleMenuClose}
            menuRef={menuRef}
            onEdit={handleEditFromMenu}
            onDelete={handleDeleteFromMenu}
          />
          <div className={classes.closeIconWrapper} onClick={closeButton}>
            <CloseIcon />
          </div>
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
                        ? getMediaUrl(showIMG)
                        : "/no-avatar.png"
                    }
                    alt=""
                  />
                </div>
              </div>

              <div className={classes.requestDataInfo}>
                <div className={classes.requestDataInfo_title}>ФИО</div>
                {isEditing ? (
                  <input
                    type="text"
                    name="name"
                    placeholder="Иванов Иван Иванович"
                    value={formData.name}
                    onChange={handleChange}
                  />
                ) : (
                  <div className={classes.requestDataInfo_desc}>
                    {formData.name || "—"}
                  </div>
                )}
              </div>
              <div className={classes.requestDataInfo}>
                <div className={classes.requestDataInfo_title}>Почта</div>
                {isEditing ? (
                  <input
                    type="email"
                    name="email"
                    placeholder="example@mail.ru"
                    value={formData.email}
                    onChange={handleChange}
                  />
                ) : (
                  <div className={classes.requestDataInfo_desc}>
                    {formData.email || "—"}
                  </div>
                )}
              </div>
              {user?.role === roles.hotelModerator ? null : (
                <div className={classes.requestDataInfo}>
                  <div className={classes.requestDataInfo_title}>Роль</div>
                  {isEditing ? (
                    <div className={classes.dropdown}>
                      <MUIAutocomplete
                        dropdownWidth={"100%"}
                        isDisabled={false}
                        label={"Выберите роль"}
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
                  ) : (
                    <div className={classes.requestDataInfo_desc}>
                      {rolesObject.hotel.find(
                        (o) => o.value === formData.role
                      )?.label || formData.role || "—"}
                    </div>
                  )}
                </div>
              )}

              <div className={classes.requestDataInfo}>
                <div className={classes.requestDataInfo_title}>Должность</div>
                {isEditing ? (
                  <div className={classes.dropdown}>
                    <MUIAutocomplete
                      dropdownWidth={"100%"}
                      isDisabled={false}
                      label={"Выберите должность"}
                      options={positions?.map((position) => position.name) || []}
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
                ) : (
                  <div className={classes.requestDataInfo_desc}>
                    {formData.position || "—"}
                  </div>
                )}
              </div>
              <div className={classes.requestDataInfo}>
                <div className={classes.requestDataInfo_title}>Логин</div>
                {isEditing ? (
                  <input
                    type="text"
                    name="login"
                    placeholder="Логин"
                    value={formData.login}
                    onChange={handleChange}
                  />
                ) : (
                  <div className={classes.requestDataInfo_desc}>
                    {formData.login || "—"}
                  </div>
                )}
              </div>
              {isEditing && (
                <>
                  <div className={classes.requestDataInfo}>
                    <div className={classes.requestDataInfo_title}>
                      Старый пароль
                    </div>
                    <div style={{ position: "relative", width: "60%" }}>
                      <input
                        type={showOldPassword ? "text" : "password"}
                        name="oldPassword"
                        placeholder="Старый пароль"
                        value={formData.oldPassword}
                        onChange={handleChange}
                        style={{ width: "100%" }}
                      />
                      <img
                        src={showOldPassword ? "/eyeOpen.png" : "/eyeClose.png"}
                        style={{
                          width: "20px",
                          objectFit: "contain",
                          position: "absolute",
                          right: "10px",
                          top: "10px",
                          cursor: "pointer",
                        }}
                        onClick={() => setShowOldPassword((prev) => !prev)}
                        alt=""
                      />
                    </div>
                  </div>
                  <div className={classes.requestDataInfo}>
                    <div className={classes.requestDataInfo_title}>
                      Новый пароль
                    </div>
                    <div style={{ position: "relative", width: "60%" }}>
                      <input
                        type={showNewPassword ? "text" : "password"}
                        name="password"
                        placeholder="Новый пароль"
                        value={formData.password}
                        onChange={handleChange}
                        style={{ width: "100%" }}
                      />
                      <img
                        src={showNewPassword ? "/eyeOpen.png" : "/eyeClose.png"}
                        style={{
                          width: "20px",
                          objectFit: "contain",
                          position: "absolute",
                          right: "10px",
                          top: "10px",
                          cursor: "pointer",
                        }}
                        onClick={() => setShowNewPassword((prev) => !prev)}
                        alt=""
                      />
                    </div>
                  </div>
                  <div className={classes.requestDataInfo}>
                    <div className={classes.requestDataInfo_title}>Аватар</div>
                    <input
                      type="file"
                      name="images"
                      onChange={handleFileChange}
                      ref={fileInputRef}
                    />
                  </div>
                </>
              )}
            </div>
          </div>

          {isEditing && (
            <div className={classes.requestButton}>
              <Button
                onClick={handleCancelEdit}
                backgroundcolor="var(--hover-gray)"
                color="#000"
              >
                Отмена
              </Button>
              <Button
                onClick={handleUpdate}
                backgroundcolor="#0057C3"
                color="#fff"
              >
                Сохранить <img src="/saveDispatcher.png" alt="" />
              </Button>
            </div>
          )}
        </>
      )}
    </Sidebar>
  );
}

export default ExistRequestCompanyHotel;
