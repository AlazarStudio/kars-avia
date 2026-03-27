import React, { useState, useRef, useEffect, useCallback, useMemo } from "react";
import classes from "./CreateRequestDispatcherCompany.module.css";
import Button from "../../Standart/Button/Button";
import Sidebar from "../Sidebar/Sidebar";
import {
  CREATE_POSITION,
  CREATE_DISPATCHER_USER,
  getCookie,
} from "../../../../graphQL_requests";
import { useMutation } from "@apollo/client";
import MUILoader from "../MUILoader/MUILoader";
import MUIAutocomplete from "../MUIAutocomplete/MUIAutocomplete";
import { rolesObject } from "../../../roles";
import CloseIcon from "../../../shared/icons/CloseIcon";
import { useDialog } from "../../../contexts/DialogContext";
import { useToast } from "../../../contexts/ToastContext";

function CreateRequestDispatcherCompany({
  show,
  onClose,
  onCreated,
  onPositionCreated,
  positions,
  departments,
}) {
  const token = getCookie("token");
  const { confirm, showAlert, isDialogOpen } = useDialog();
  const { success, error: notifyError } = useToast();

  const [isEdited, setIsEdited] = useState(false);
  const [isCreatingPosition, setIsCreatingPosition] = useState(false);
  const [newPositionName, setNewPositionName] = useState("");
  const [localPositions, setLocalPositions] = useState(positions || []);
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
    setIsCreatingPosition(false);
    setNewPositionName("");
  }, []);

  const closeButton = useCallback(async () => {
    if (isDialogOpen) return;

    if (!isEdited) {
      resetForm();
      onClose();
      return;
    }

    const isConfirmed = await confirm(
      "Вы уверены? Все несохраненные данные будут удалены."
    );
    if (isConfirmed) {
      resetForm();
      onClose();
    }
  }, [isEdited, resetForm, onClose, confirm, isDialogOpen]);

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

  const [createPosition] = useMutation(CREATE_POSITION, {
    context: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  });

  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setLocalPositions(positions || []);
  }, [positions]);

  const handleCreatePosition = useCallback(async () => {
    const trimmedName = newPositionName.trim();
    if (!trimmedName) {
      showAlert("Введите название должности.");
      return;
    }

    const isDuplicate = (localPositions || []).some(
      (position) =>
        String(position?.name || "").trim().toLowerCase() ===
        trimmedName.toLowerCase()
    );
    if (isDuplicate) {
      showAlert("Такая должность уже существует.");
      return;
    }

    try {
      const response = await createPosition({
        variables: {
          input: {
            name: trimmedName,
            separator: "dispatcher",
          },
        },
      });

      const createdPosition = response?.data?.createPosition;
      if (!createdPosition) {
        throw new Error("Пустой ответ createPosition");
      }

      setLocalPositions((prev) =>
        [...(prev || []), createdPosition].sort((a, b) =>
          String(a?.name || "").localeCompare(String(b?.name || ""))
        )
      );
      setFormData((prevData) => ({
        ...prevData,
        position: createdPosition.name,
      }));
      setIsEdited(true);
      setNewPositionName("");
      setIsCreatingPosition(false);
      onPositionCreated?.(createdPosition);
      success("Должность добавлена успешно.");
    } catch (error) {
      console.error("Ошибка при создании должности:", error);
      notifyError("Не удалось создать должность.");
    }
  }, [
    newPositionName,
    localPositions,
    createPosition,
    onPositionCreated,
    showAlert,
    success,
    notifyError,
  ]);

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
      "position",
      "login",
      "password",
    ];
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

    if (formData.password.length < 8) {
      showAlert("Пароль должен содержать минимум 8 символов.");
      setIsLoading(false);
      return;
    }

    try {
      const selectedPosition = localPositions.find(
        (position) => position.name === formData.position
      );
      const response = await uploadFile({
        variables: {
          input: {
            name: formData.name,
            email: formData.email,
            role: "DISPATCHERADMIN",
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
        success("Аккаунт диспетчера создан успешно.");
      }
    } catch (e) {
      console.error("Ошибка при загрузке файла:", e);
      if (
        String(e).startsWith(
          "ApolloError: Пользователь с таким логином уже существует"
        )
      ) {
        showAlert("Пользователь с таким логином уже существует");
      } else if (
        String(e).startsWith(
          "ApolloError: Пользователь с такой почтой уже существует"
        )
      ) {
        showAlert("Пользователь с такой почтой уже существует");
      } else if (
        String(e).startsWith(
          "ApolloError: Пользователь с такой почтой и логином уже существует"
        )
      ) {
        showAlert("Пользователь с такой почтой и логином уже существует");
      }
    } finally {
      setIsLoading(false);
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
        <div className={classes.requestTitle_name}>Добавить диспетчера</div>
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

              {/* <label>Роль</label>
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
              /> */}

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

              <div className={classes.fieldHeader}>
                <label>Должность</label>
                <div
                  className={classes.addPosition}
                  onClick={() => setIsCreatingPosition((prev) => !prev)}
                  title="Добавить должность"
                >
                  <img src="/plus.png" alt="Добавить должность" />
                </div>
              </div>
              <MUIAutocomplete
                dropdownWidth={"100%"}
                label={"Выберите должность"}
                options={localPositions.map((position) => position.name)}
                value={formData.position}
                onChange={(event, newValue) => {
                  setIsEdited(true);
                  setFormData((prevData) => ({
                    ...prevData,
                    position: newValue,
                  }));
                }}
              />
              {isCreatingPosition && (
                <div className={classes.inlineCreateRow}>
                  <input
                    type="text"
                    value={newPositionName}
                    placeholder="Введите должность"
                    onChange={(e) => setNewPositionName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleCreatePosition();
                      }
                    }}
                  />
                  <Button type="button" onClick={handleCreatePosition}>
                    {/* Добавить должность */}
                    +
                  </Button>
                </div>
              )}

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
