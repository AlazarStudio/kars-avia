import React, { useState, useRef, useEffect, useCallback, useMemo } from "react";
import classes from "./ExistRequestCompany.module.css";
import Button from "../../Standart/Button/Button";
import Sidebar from "../Sidebar/Sidebar";
import { InputMask } from "@react-input/mask";
import {
  decodeJWT,
  getCookie,
  getMediaUrl,
  UPDATE_DISPATCHER_USER,
  CREATE_POSITION,
} from "../../../../graphQL_requests";
import { useMutation } from "@apollo/client";
import DropDownList from "../DropDownList/DropDownList";
import { roles, rolesObject } from "../../../roles";
import { isDispatcherModerator } from "../../../utils/access";
import MUILoader from "../MUILoader/MUILoader";
import MUIAutocomplete from "../MUIAutocomplete/MUIAutocomplete";
import AvatarUpload from "../AvatarUpload/AvatarUpload";
import CloseIcon from "../../../shared/icons/CloseIcon";
import AdditionalMenu from "../../Standart/AdditionalMenu/AdditionalMenu";
import { useDialog } from "../../../contexts/DialogContext";
import { useToast } from "../../../contexts/ToastContext";

function ExistRequestCompany({
  show,
  onClose,
  chooseObject,
  departments,
  updateDispatcher,
  openDeleteComponent,
  filterList,
  positions,
  initialEditMode = false,
  accessMenu,
  onPositionCreated,
}) {
  const token = getCookie("token");
  const user = decodeJWT(token);
  const { confirm, showAlert, isDialogOpen } = useDialog();
  const { success, error: notifyError } = useToast();

  const [uploadFile] = useMutation(
    UPDATE_DISPATCHER_USER,
    {
      context: {
        headers: {
          Authorization: `Bearer ${token}`,
          "Apollo-Require-Preflight": "true",
        },
      },
    }
  );

  const [createPosition] = useMutation(CREATE_POSITION, {
    context: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  });

  const [isEdited, setIsEdited] = useState(false);
  const [isCreatingPosition, setIsCreatingPosition] = useState(false);
  const [newPositionName, setNewPositionName] = useState("");
  const [localPositions, setLocalPositions] = useState(positions || []);
  const [formData, setFormData] = useState({
    id: chooseObject?.id || "",
    images: null,
    name: chooseObject?.name || "",
    email: chooseObject?.email || "",
    number: chooseObject?.number || "",
    role: chooseObject?.role || "",
    position: chooseObject?.position?.name || "",
    login: chooseObject?.login || "",
    oldPassword: "",
    password: chooseObject?.password || "",
    departmentId: chooseObject?.dispatcherDepartmentId || "",
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
        number: chooseObject.number || "",
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

  useEffect(() => {
    setLocalPositions(positions || []);
  }, [positions]);

  const resetForm = useCallback(() => {
    setFormData({
      id: chooseObject?.id || "",
      images: null,
      name: chooseObject?.name || "",
      email: chooseObject?.email || "",
      number: chooseObject?.number || "",
      role: chooseObject?.role || "",
      position: chooseObject?.position?.name || "",
      login: chooseObject?.login || "",
      oldPassword: "",
      password: chooseObject?.password || "",
      departmentId: chooseObject?.dispatcherDepartmentId || "",
    });
    setIsEdited(false);
    setIsCreatingPosition(false);
    setNewPositionName("");
    setShowOldPassword(false);
    setShowNewPassword(false);
    if (chooseObject?.images) setShowIMG(chooseObject.images);
  }, [chooseObject]);

  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (show) setIsEditing(initialEditMode);
  }, [show]);
  const [isLoading, setIsLoading] = useState(false);
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  const closeButton = useCallback(async () => {
    if (isDialogOpen) return;

    setAnchorEl(null);
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

  const handleAvatarChange = (file) => {
    setIsEdited(true);
    setFormData((prevState) => ({
      ...prevState,
      images: file,
    }));
  };

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

  const handleUpdate = async () => {
    if (isEditing) {
      setIsLoading(true);
      // Проверяем обязательные поля
      const requiredFields = ["name", "email", "role", "login"];
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
        const selectedPosition = localPositions.find(
          (position) => position.name === formData.position
        );
        let response_update_user = await uploadFile({
          variables: {
            input: {
              id: formData.id,
              name: formData.name,
              email: formData.email,
              number: formData.number,
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

        if (response_update_user) {
          // updateDispatcher(response_update_user.data.updateUser, index);
          resetForm();
          onClose();
          setIsLoading(false);
          success("Редактирование диспетчера прошло успешно.");
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
        // resetForm();
        // onClose();
        setIsLoading(false); // Сбрасываем isLoading после завершения запроса
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
      if (isDialogOpen) return;
      if (event.target.closest(".MuiSnackbar-root")) return;

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
  }, [show, closeButton, anchorEl, isDialogOpen]);

  // console.log(accessMenu, "\n", user);

  return (
    <Sidebar show={show} sidebarRef={sidebarRef}>
      <div className={classes.requestTitle}>
        <div className={classes.requestTitle_name}>Диспетчер</div>
        <div className={classes.requestTitle_close}>
          {user.role !== roles.superAdmin && accessMenu?.userUpdate ? (
            <AdditionalMenu
              anchorEl={anchorEl}
              onOpen={handleMenuOpen}
              onClose={handleMenuClose}
              menuRef={menuRef}
              onEdit={handleEditFromMenu}
              onDelete={handleDeleteFromMenu}
            />
          ) : null}
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
                    style={{ userSelect: "none" }}
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

              <div className={classes.requestDataInfo}>
                <div className={classes.requestDataInfo_title}>Телефон</div>
                {isEditing ? (
                  <InputMask
                    type="text"
                    mask="+7 (___) ___-__-__"
                    replacement={{ _: /\d/ }}
                    name="number"
                    value={formData.number}
                    onChange={handleChange}
                    placeholder="+7 (___) ___-__-__"
                  />
                ) : (
                  <div className={classes.requestDataInfo_desc}>
                    {formData.number || "—"}
                  </div>
                )}
              </div>

              <div className={classes.requestDataInfo}>
                <div className={classes.requestDataInfo_title}>Отдел</div>
                {isEditing ? (
                  <MUIAutocomplete
                    dropdownWidth={"60%"}
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
                    isDisabled={false}
                  />
                ) : (
                  <div className={classes.requestDataInfo_desc}>
                    {departmentOptions.find(
                      (o) => o.value === formData.departmentId
                    )?.label || "—"}
                  </div>
                )}
              </div>
              {isDispatcherModerator(user) ? null : (
                <>
                  <div className={classes.requestDataInfo}>
                    <div className={classes.requestDataInfo_title}>Роль</div>
                    {isEditing ? (
                      <div className={classes.dropdown}>
                        <MUIAutocomplete
                          dropdownWidth={"100%"}
                          isDisabled={false}
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
                      </div>
                    ) : (
                      <div className={classes.requestDataInfo_desc}>
                        {rolesObject.dispatcher.find(
                          (o) => o.value === formData.role
                        )?.label || formData.role || "—"}
                      </div>
                    )}
                  </div>
                </>
              )}

              <div className={classes.requestDataInfo}>
                <div className={classes.fieldHeader}>
                  <div className={classes.requestDataInfo_title}>Должность</div>
                  {isEditing && (
                    <div
                      className={classes.addPosition}
                      onClick={() => setIsCreatingPosition((prev) => !prev)}
                      title="Добавить должность"
                    >
                      <img src="/plus.png" alt="Добавить должность" />
                    </div>
                  )}
                </div>
                {isEditing ? (
                  <div className={classes.dropdown}>
                    <MUIAutocomplete
                      dropdownWidth={"100%"}
                      isDisabled={false}
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
                  </div>
                ) : (
                  <div className={classes.requestDataInfo_desc}>
                    {formData.position || "—"}
                  </div>
                )}
              </div>
              {isEditing && isCreatingPosition && (
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
                    +
                  </Button>
                </div>
              )}
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
                  <div className={`${classes.requestDataInfo} ${classes.avatarField}`}>
                    <div className={classes.requestDataInfo_title}>Аватар</div>
                    <AvatarUpload
                      value={formData.images}
                      onChange={handleAvatarChange}
                      onError={showAlert}
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

export default ExistRequestCompany;
