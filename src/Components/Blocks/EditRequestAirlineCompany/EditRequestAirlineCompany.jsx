import React, { useState, useRef, useEffect, useCallback } from "react";
import classes from "./EditRequestAirlineCompany.module.css";
import Button from "../../Standart/Button/Button";
import Sidebar from "../Sidebar/Sidebar";
import {
  getCookie,
  getMediaUrl,
  UPDATE_AIRLINE_USER,
} from "../../../../graphQL_requests";
import { useMutation } from "@apollo/client";
import DropDownList from "../DropDownList/DropDownList";
import MUILoader from "../MUILoader/MUILoader";
import MUIAutocomplete from "../MUIAutocomplete/MUIAutocomplete";
import { roles, rolesObject } from "../../../roles";
import CloseIcon from "../../../shared/icons/CloseIcon";
import AdditionalMenu from "../../Standart/AdditionalMenu/AdditionalMenu";

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
  addNotification,
  positions,
  openDeleteComponent,
}) {
  const token = getCookie("token");

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

  const [isEdited, setIsEdited] = useState(false); // Флаг, указывающий, были ли изменения в форме
  const [formData, setFormData] = useState({
    images: null,
    name: selectedUser?.name || "",
    email: selectedUser?.email || "",
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
        role: selectedUser?.role || "",
        position: selectedUser?.position?.name || "",
        login: selectedUser?.login || "",
        oldPassword: "",
        password: "",
        department: department || "",
      });
      setShowIMG(selectedUser.images);
    }
  }, [show, department, selectedUser]);

  const resetForm = useCallback(() => {
    setFormData({
      images: null,
      name: selectedUser?.name || "",
      email: selectedUser?.email || "",
      role: selectedUser?.role || "",
      position: selectedUser?.position?.name || "",
      login: selectedUser?.login || "",
      oldPassword: "",
      password: "",
      department: department || "",
    });
    setIsEdited(false); // Сброс флага изменений
    setShowOldPassword(false);
    setShowNewPassword(false);
    if (selectedUser?.images) setShowIMG(selectedUser.images);
  }, [selectedUser, department]);

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

      setIsLoading(true);
      if (formData.password !== "" && formData.password.length < 8) {
        alert("Новый пароль должен содержать минимум 8 символов.");
        setIsLoading(false);
        return;
      }
      try {
        const selectedDepartment = addTarif.find(
          (dept) => dept.name === formData.department
        );

        const selectedPosition = positions.find(
          (position) => position.name === formData.position
        );
        let response_update_user = await uploadFile({
          variables: {
            input: {
              id: selectedUser.id,
              name: formData.name,
              email: formData.email,
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
          addNotification("Редактирование аккаунта прошло успешно.", "success");
        }
      } catch (err) {
        setIsLoading(false);
        console.error("Ошибка обновления пользователя:", err);
        if (String(err).startsWith("ApolloError: Указан неверный пароль.")) {
          alert("Указан неверный старый пароль.");
        } else if (
          String(err).startsWith(
            "ApolloError: Для обновления пароля необходимо указать предыдущий пароль."
          )
        ) {
          alert("Для обновления пароля необходимо указать предыдущий пароль.");
        } else {
          alert("Ошибка обновления пользователя.");
        }
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

  // const positions = ["Директор", "Заместитель директора", "Сотрудник"];

  return (
    <Sidebar show={show} sidebarRef={sidebarRef}>
      <div className={classes.requestTitle}>
        <div className={classes.requestTitle_name}>Редактировать</div>
        <div className={classes.requestTitle_close}>
          <AdditionalMenu
            anchorEl={anchorEl}
            onOpen={handleMenuOpen}
            onClose={handleMenuClose}
            menuRef={menuRef}
            onEdit={handleEditFromMenu}
            onDelete={openDeleteComponent ? handleDeleteFromMenu : undefined}
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
                    <div className={classes.requestDataInfo_title}>Почта</div>
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
                      <div className={classes.requestDataInfo_title}>Роль</div>
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
                <div className={classes.requestDataInfo_title}>Должность</div>
                {isEditing ? (
                  <div className={classes.dropdown}>
                    <MUIAutocomplete
                      dropdownWidth={"100%"}
                      isDisabled={false}
                      label={"Выберите должность"}
                      options={positions.map((position) => position.name)}
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
                ) : (
                  <div className={classes.requestDataInfo_desc}>
                    {formData.position || "—"}
                  </div>
                )}
              </div>

              <div className={classes.requestDataInfo}>
                <div className={classes.requestDataInfo_title}>Отдел</div>
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
                <div className={classes.requestDataInfo_title}>Логин</div>
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
                  <div className={classes.requestDataInfo}>
                    <div className={classes.requestDataInfo_title}>
                      Аватар
                    </div>
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
