import React, { useState, useRef, useEffect, useCallback, useMemo } from "react";
import classes from "./ExistRequestDispatcherCompany.module.css";
import Button from "../../Standart/Button/Button";
import Sidebar from "../Sidebar/Sidebar";
import {
  decodeJWT,
  getCookie,
  getMediaUrl,
  UPDATE_DISPATCHER_USER,
} from "../../../../graphQL_requests";
import { useMutation } from "@apollo/client";
import { rolesObject } from "../../../roles";
import MUILoader from "../MUILoader/MUILoader";
import MUIAutocomplete from "../MUIAutocomplete/MUIAutocomplete";
import CloseIcon from "../../../shared/icons/CloseIcon";
import { useDialog } from "../../../contexts/DialogContext";
import { useToast } from "../../../contexts/ToastContext";

function ExistRequestDispatcherCompany({
  show,
  onClose,
  chooseObject,
  updateDispatcher,
  openDeleteComponent,
  positions,
  onUpdated,
  departments,
}) {
  const token = getCookie("token");
  decodeJWT(token);
  const { confirm, showAlert, isDialogOpen } = useDialog();
  const { success } = useToast();

  const [uploadFile] = useMutation(UPDATE_DISPATCHER_USER, {
    context: {
      headers: {
        Authorization: `Bearer ${token}`,
        "Apollo-Require-Preflight": "true",
      },
    },
  });

  const [isEdited, setIsEdited] = useState(false);
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
    departmentId: chooseObject?.dispatcherDepartmentId || "",
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
        position: chooseObject?.position?.name || "",
        login: chooseObject.login || "",
        oldPassword: "",
        password: chooseObject.password || "",
        departmentId: chooseObject?.dispatcherDepartmentId || "",
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
      departmentId: chooseObject?.dispatcherDepartmentId || "",
    });
    setIsEdited(false);
    setShowOldPassword(false);
    setShowNewPassword(false);
  }, [chooseObject]);

  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  const closeButton = useCallback(async () => {
    if (isDialogOpen) return;

    if (!isEdited) {
      resetForm();
      onClose();
      setIsEditing(false);
      return;
    }

    const isConfirmed = await confirm(
      "Вы уверены? Все несохраненные данные будут удалены."
    );
    if (isConfirmed) {
      resetForm();
      onClose();
      setIsEditing(false);
    }
  }, [isEdited, onClose, resetForm, isDialogOpen, confirm]);

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
    if (file && file.size > maxSizeInBytes) {
      showAlert("Размер файла не должен превышать 8 МБ!");
      setFormData((prevState) => ({
        ...prevState,
        images: null,
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

  const handleUpdate = async () => {
    if (!isEditing) {
      setIsEditing(true);
      return;
    }
    setIsLoading(true);
    const requiredFields = ["name", "email", "role", "position", "login"];
    const emptyFields = requiredFields.filter(
      (field) => !formData[field]?.trim()
    );

    if (emptyFields.length > 0) {
      showAlert("Пожалуйста, заполните все обязательные поля.");
      setIsLoading(false);
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      showAlert("Введите корректный email.");
      setIsLoading(false);
      return;
    }
    if (formData.password !== "" && formData.password.length < 8) {
      showAlert("Новый пароль должен содержать минимум 8 символов.");
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
            id: formData.id,
            name: formData.name,
            email: formData.email,
            role: formData.role,
            positionId: selectedPosition?.id,
            login: formData.login,
            password: formData.password,
            oldPassword: formData.oldPassword,
            dispatcherDepartmentId: formData.departmentId || null,
          },
          images: formData.images,
        },
      });

      if (response) {
        updateDispatcher?.(response.data.updateUser, index);
        resetForm();
        onClose();
        setIsLoading(false);
        success("Редактирование диспетчера прошло успешно.");
        onUpdated?.(response.data.updateUser);
      }
    } catch (error) {
      console.error("Ошибка обновления пользователя:", error);
      if (String(error).startsWith("ApolloError: Указан неверный пароль.")) {
        showAlert("Указан неверный старый пароль.");
      } else if (
        String(error).startsWith(
          "ApolloError: Для обновления пароля необходимо указать предыдущий пароль."
        )
      ) {
        showAlert("Для обновления пароля необходимо указать предыдущий пароль.");
      } else {
        showAlert("Ошибка обновления пользователя.");
      }
    } finally {
      setIsLoading(false);
      setIsEditing(false);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isDialogOpen) return;
      if (event.target.closest(".MuiSnackbar-root")) return;

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
  }, [show, closeButton, isDialogOpen]);

  return (
    <Sidebar show={show} sidebarRef={sidebarRef}>
      <div className={classes.requestTitle}>
        <div className={classes.requestTitle_name}>Диспетчер</div>
        <div className={classes.requestTitle_close} onClick={closeButton}>
          <CloseIcon />
        </div>
      </div>

      {isLoading ? (
        <MUILoader loadSize={"50px"} fullHeight={"80vh"} />
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
                    style={{ userSelect: "none" }}
                  />
                </div>
              </div>
              <label>ФИО</label>
              <input
                type="text"
                name="name"
                placeholder="Иванов Иван Иванович"
                value={formData.name}
                onChange={handleChange}
                autoComplete="new-password"
                disabled={!isEditing}
              />

              <label>Почта</label>
              <input
                type="email"
                name="email"
                placeholder="example@mail.ru"
                value={formData.email}
                onChange={handleChange}
                autoComplete="new-password"
                disabled={!isEditing}
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
                isDisabled={!isEditing}
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
                isDisabled={!isEditing}
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
                isDisabled={!isEditing}
              />

              <label>Логин</label>
              <input
                type="text"
                name="login"
                placeholder="Логин"
                value={formData.login}
                onChange={handleChange}
                autoComplete="new-password"
                disabled={!isEditing}
              />

              <label>Старый пароль</label>
              <input
                type={showOldPassword ? "text" : "password"}
                name="oldPassword"
                placeholder="Старый пароль"
                value={formData.oldPassword}
                onChange={handleChange}
                autoComplete="new-password"
                disabled={!isEditing}
              />
              {isEditing && (
                <label className={classes.checkboxLabel}>
                  <input
                    type="checkbox"
                    checked={showOldPassword}
                    onChange={() => setShowOldPassword(!showOldPassword)}
                  />
                  Показать пароль
                </label>
              )}

              <label>Новый пароль</label>
              <input
                type={showNewPassword ? "text" : "password"}
                name="password"
                placeholder="Новый пароль"
                value={formData.password}
                onChange={handleChange}
                autoComplete="new-password"
                disabled={!isEditing}
              />
              {isEditing && (
                <label className={classes.checkboxLabel}>
                  <input
                    type="checkbox"
                    checked={showNewPassword}
                    onChange={() => setShowNewPassword(!showNewPassword)}
                  />
                  Показать пароль
                </label>
              )}

              <label>Аватар</label>
              <input
                type="file"
                name="images"
                onChange={handleFileChange}
                ref={fileInputRef}
                disabled={!isEditing}
              />
            </div>
          </div>

          <div className={classes.requestButton}>
            <Button
              onClick={() => openDeleteComponent?.(index, formData.id)}
              backgroundcolor={"var(--red)"}
              color={"#fff"}
            >
              Удалить
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

export default ExistRequestDispatcherCompany;
