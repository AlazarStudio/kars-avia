import React, { useState, useRef, useEffect, useCallback } from "react";
import classes from "./EditRequestAirlineCompany.module.css";
import Button from "../../Standart/Button/Button";
import Sidebar from "../Sidebar/Sidebar";
import { InputMask } from "@react-input/mask";
import {
  getCookie,
  getMediaUrl,
  UPDATE_AIRLINE_USER,
  CREATE_POSITION,
} from "../../../../graphQL_requests";
import { useMutation } from "@apollo/client";
import DropDownList from "../DropDownList/DropDownList";
import MUILoader from "../MUILoader/MUILoader";
import MUIAutocomplete from "../MUIAutocomplete/MUIAutocomplete";
import AvatarUpload from "../AvatarUpload/AvatarUpload";
import { roles, rolesObject } from "../../../roles";
import CloseIcon from "../../../shared/icons/CloseIcon";
import AdditionalMenu from "../../Standart/AdditionalMenu/AdditionalMenu";
import { useDialog } from "../../../contexts/DialogContext";
import { useToast } from "../../../contexts/ToastContext";

function EditRequestAirlineCompany({
  show,
  onClose,
  user,
  representative,
  selectedUser,
  accessMenu,
  department,
  onSubmit,
  addTarif,
  id,
  positions,
  onPositionCreated,
  openDeleteComponent,
  initialEditMode = false,
}) {
  const token = getCookie("token");
  const { confirm, showAlert, isDialogOpen } = useDialog();
  const { success, error: notifyError } = useToast();

  const [isCreatingPosition, setIsCreatingPosition] = useState(false);
  const [newPositionName, setNewPositionName] = useState("");
  const [localPositions, setLocalPositions] = useState(positions || []);

  useEffect(() => {
    setLocalPositions(positions || []);
  }, [positions]);

  const [uploadFile, { data, loading, error }] = useMutation(
    UPDATE_AIRLINE_USER,
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

  const handleCreatePosition = useCallback(async () => {
    const trimmedName = newPositionName.trim();
    if (!trimmedName) {
      showAlert("Введите название должности.");
      return;
    }

    const isDuplicate = (localPositions || []).some(
      (p) => String(p?.name || "").trim().toLowerCase() === trimmedName.toLowerCase()
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
            separator: "airlineUser",
            airlineId: id,
          },
        },
      });

      const createdPosition = response?.data?.createPosition;
      if (!createdPosition) throw new Error("Пустой ответ createPosition");

      setLocalPositions((prev) =>
        [...(prev || []), createdPosition].sort((a, b) =>
          String(a?.name || "").localeCompare(String(b?.name || ""))
        )
      );
      setFormData((prevData) => ({ ...prevData, position: createdPosition.name }));
      setNewPositionName("");
      setIsCreatingPosition(false);
      onPositionCreated?.(createdPosition);
      success("Должность добавлена успешно.");
    } catch (err) {
      console.error("Ошибка при создании должности:", err);
      notifyError("Не удалось создать должность.");
    }
  }, [newPositionName, localPositions, createPosition, id, onPositionCreated, showAlert, success, notifyError]);

  const [isEdited, setIsEdited] = useState(false);
  const [formData, setFormData] = useState({
    images: null,
    name: selectedUser?.name || "",
    email: selectedUser?.email || "",
    number: selectedUser?.number || "",
    role: selectedUser?.role || "",
    position: selectedUser?.position?.name || "",
    login: selectedUser?.login || "",
    oldPassword: "",
    password: "",
    department: department || "",
  });

  const sidebarRef = useRef();
  const menuRef = useRef(null);
  const [anchorEl, setAnchorEl] = useState(null);

  const [showIMG, setShowIMG] = useState();

  useEffect(() => {
    if (show && selectedUser && department) {
      setFormData({
        images: null,
        name: selectedUser?.name || "",
        email: selectedUser?.email || "",
        number: selectedUser?.number || "",
        role: selectedUser?.role || "",
        position: selectedUser?.position?.name || "",
        login: selectedUser?.login || "",
        oldPassword: "",
        password: "",
        department: department || "",
      });
      setShowIMG(selectedUser.images);
      setIsEditing(initialEditMode);
    }
  }, [show, department, selectedUser]);

  const resetForm = useCallback(() => {
    setFormData({
      images: null,
      name: selectedUser?.name || "",
      email: selectedUser?.email || "",
      number: selectedUser?.number || "",
      role: selectedUser?.role || "",
      position: selectedUser?.position?.name || "",
      login: selectedUser?.login || "",
      oldPassword: "",
      password: "",
      department: department || "",
    });
    setIsEdited(false);
    setShowOldPassword(false);
    setShowNewPassword(false);
    setIsCreatingPosition(false);
    setNewPositionName("");
    if (selectedUser?.images) setShowIMG(selectedUser.images);
  }, [selectedUser, department]);

  const [isEditing, setIsEditing] = useState(false);
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
  }, [isEdited, onClose, resetForm, confirm, isDialogOpen]);

  const handleMenuOpen = (e) => setAnchorEl(e.currentTarget);
  const handleMenuClose = () => setAnchorEl(null);
  const handleEditFromMenu = () => {
    handleMenuClose();
    setIsEditing(true);
  };
  const handleCancelEdit = () => {
    resetForm();
    setIsEditing(false);
  };
  const handleDeleteFromMenu = () => {
    handleMenuClose();
    if (openDeleteComponent && selectedUser) {
      openDeleteComponent(selectedUser, formData.department);
      onClose();
    }
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

  const isFormValid = () => {
    return (
      formData.name &&
      formData.email &&
      formData.role &&
      formData.position &&
      formData.login &&
      formData.department
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isEditing) {
      if (!isFormValid()) {
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

      setIsLoading(true);
      if (formData.password !== "" && formData.password.length < 8) {
        showAlert("Новый пароль должен содержать минимум 8 символов.");
        setIsLoading(false);
        return;
      }
      try {
        const selectedDepartment = addTarif.find(
          (dept) => dept.name === formData.department
        );

        const selectedPosition = localPositions.find(
          (position) => position.name === formData.position
        );
        let response_update_user = await uploadFile({
          variables: {
            input: {
              id: selectedUser.id,
              name: formData.name,
              email: formData.email,
              number: formData.number,
              role: formData.role,
              positionId: selectedPosition?.id,
              login: formData.login,
              oldPassword: formData.oldPassword,
              password: formData.password,
              airlineId: id,
              airlineDepartmentId: selectedDepartment?.id,
            },
            images: formData.images,
          },
        });

        // console.log("Response from uploadFile:", response_update_user);

        if (response_update_user) {
          // const updatedUser = response_update_user.data.updateUser;

          // const updatedTarif = addTarif.map((department) => {
          //   // Если пользователь находится в этом отделе
          //   if (department.users.some((u) => u.id === selectedUser.id)) {
          //     // Если это старый отдел и отдел изменился, удаляем пользователя
          //     if (department.name !== formData.department) {
          //       return {
          //         ...department,
          //         users: department.users.filter((u) => u.id !== selectedUser.id),
          //       };
          //     } else {
          //       // Если отдел не изменился, просто обновляем данные пользователя
          //       return {
          //         ...department,
          //         users: department.users.map((u) =>
          //           u.id === updatedUser.id ? { ...u, ...updatedUser } : u
          //         ),
          //       };
          //     }
          //   }

          //   // Если это новый отдел, добавляем пользователя
          //   if (department.name === formData.department) {
          //     return {
          //       ...department,
          //       users: [...department.users, { ...selectedUser, ...updatedUser }].sort(
          //         (a, b) => a.name.localeCompare(b.name)
          //       ),
          //     };
          //   }

          //   // Если отдел не связан с изменениями, возвращаем как есть
          //   return department;
          // });

          // console.log("Updated Tarif:", updatedTarif);

          // onSubmit(updatedTarif); // Обновляем состояние в родительском компоненте
          resetForm();
          onClose();
          setIsLoading(false);
          success("Редактирование аккаунта прошло успешно.");
        }
      } catch (err) {
        setIsLoading(false);
        console.error("Ошибка обновления пользователя:", err);
        if (String(err).startsWith("ApolloError: Указан неверный пароль.")) {
          showAlert("Указан неверный старый пароль.");
        } else if (
          String(err).startsWith(
            "ApolloError: Для обновления пароля необходимо указать предыдущий пароль."
          )
        ) {
          showAlert("Для обновления пароля необходимо указать предыдущий пароль.");
        } else {
          showAlert("Ошибка обновления пользователя.");
        }
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

  // const positions = ["Директор", "Заместитель директора", "Сотрудник"];

  return (
    <Sidebar show={show} sidebarRef={sidebarRef}>
      <div className={classes.requestTitle}>
        <div className={classes.requestTitle_name}>Редактировать</div>
        <div className={classes.requestTitle_close}>
        {(!user?.airlineId || accessMenu.userUpdate) && (
          <AdditionalMenu
            anchorEl={anchorEl}
            onOpen={handleMenuOpen}
            onClose={handleMenuClose}
            menuRef={menuRef}
            onEdit={handleEditFromMenu}
            onDelete={openDeleteComponent ? handleDeleteFromMenu : undefined}
          />)}
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
              <div className={classes.hint}>* — обязательные поля</div>
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
                <div className={`${classes.requestDataInfo_title} ${classes.required}`}>ФИО</div>
                {isEditing ? (
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Введите ФИО"
                  />
                ) : (
                  <div className={classes.requestDataInfo_desc}>
                    {formData.name || "—"}
                  </div>
                )}
              </div>

              {!representative && (
                <>
                  <div className={classes.requestDataInfo}>
                    <div className={`${classes.requestDataInfo_title} ${classes.required}`}>Почта</div>
                    {isEditing ? (
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="Введите email"
                      />
                    ) : (
                      <div className={classes.requestDataInfo_desc}>
                        {formData.email || "—"}
                      </div>
                    )}
                  </div>

                  {user?.role === roles.airlineModerator ? null : (
                    <div className={classes.requestDataInfo}>
                      <div className={`${classes.requestDataInfo_title} ${classes.required}`}>Роль</div>
                      {isEditing ? (
                        <div className={classes.dropdown}>
                          <MUIAutocomplete
                            dropdownWidth={"100%"}
                            isDisabled={false}
                            label={"Выберите роль"}
                            options={rolesObject.airline}
                            value={
                              rolesObject.airline.find(
                                (option) => option.value === formData.role
                              ) || null
                            }
                            onChange={(event, newValue) => {
                              setFormData((prevFormData) => ({
                                ...prevFormData,
                                role: newValue ? newValue.value : "",
                              }));
                              setIsEdited(true);
                            }}
                          />
                        </div>
                      ) : (
                        <div className={classes.requestDataInfo_desc}>
                          {rolesObject.airline.find(
                            (o) => o.value === formData.role
                          )?.label || formData.role || "—"}
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}

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
                {isEditing ? (
                  <>
                    <div className={`${classes.fieldHeader} ${classes.positionTitleArea}`}>
                      <div className={`${classes.requestDataInfo_title} ${classes.required}`}>Должность</div>
                      <div
                        className={classes.addPosition}
                        onClick={() => setIsCreatingPosition((prev) => !prev)}
                        title="Добавить должность"
                      >
                        <img src="/plus.png" alt="Добавить должность" />
                      </div>
                    </div>
                    <div className={classes.positionEditArea}>
                      <div className={classes.dropdown}>
                        <MUIAutocomplete
                          dropdownWidth={"100%"}
                          isDisabled={false}
                          label={"Выберите должность"}
                          options={localPositions.map((position) => position.name)}
                          value={formData.position}
                          onChange={(event, newValue) => {
                            setFormData((prevFormData) => ({
                              ...prevFormData,
                              position: newValue,
                            }));
                            setIsEdited(true);
                          }}
                        />
                      </div>
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
                          <Button type="button" onClick={handleCreatePosition}>+</Button>
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  <>
                    <div className={`${classes.requestDataInfo_title} ${classes.required}`}>Должность</div>
                    <div className={classes.requestDataInfo_desc}>
                      {formData.position || "—"}
                    </div>
                  </>
                )}
              </div>

              <div className={classes.requestDataInfo}>
                <div className={`${classes.requestDataInfo_title} ${classes.required}`}>Отдел</div>
                {isEditing ? (
                  <div className={classes.dropdown}>
                    <MUIAutocomplete
                      dropdownWidth={"100%"}
                      isDisabled={false}
                      label={"Выберите отдел"}
                      options={addTarif.map((department) => department.name)}
                      value={formData.department}
                      onChange={(event, newValue) => {
                        setIsEdited(true);
                        setFormData((prevData) => ({
                          ...prevData,
                          department: newValue,
                        }));
                      }}
                    />
                  </div>
                ) : (
                  <div className={classes.requestDataInfo_desc}>
                    {formData.department || "—"}
                  </div>
                )}
              </div>

              <div className={classes.requestDataInfo}>
                <div className={`${classes.requestDataInfo_title} ${classes.required}`}>Логин</div>
                {isEditing ? (
                  <input
                    type="text"
                    name="login"
                    value={formData.login}
                    onChange={handleChange}
                    placeholder="Введите логин"
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
                        value={formData.oldPassword}
                        onChange={handleChange}
                        placeholder="Старый пароль"
                        style={{ width: "100%" }}
                      />
                      <img
                        src={
                          showOldPassword ? "/eyeOpen.png" : "/eyeClose.png"
                        }
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
                        value={formData.password}
                        onChange={handleChange}
                        placeholder="Новый пароль"
                        style={{ width: "100%" }}
                      />
                      <img
                        src={
                          showNewPassword ? "/eyeOpen.png" : "/eyeClose.png"
                        }
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
                    <div className={classes.requestDataInfo_title}>
                      Аватар
                    </div>
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

          {(!user?.airlineId || accessMenu.userUpdate) && isEditing && (
            <div className={classes.requestButton}>
              <Button
                onClick={handleCancelEdit}
                backgroundcolor="var(--hover-gray)"
                color="#000"
              >
                Отмена
              </Button>
              <Button
                type="submit"
                onClick={handleSubmit}
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

export default EditRequestAirlineCompany;
