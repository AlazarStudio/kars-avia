import React, { useState, useRef, useEffect, useCallback } from "react";
import classes from "./EditRequestAirlineCompany.module.css";
import Button from "../../Standart/Button/Button";
import Sidebar from "../Sidebar/Sidebar";
import {
  getCookie,
  server,
  UPDATE_AIRLINE_USER,
} from "../../../../graphQL_requests";
import { useMutation } from "@apollo/client";
import DropDownList from "../DropDownList/DropDownList";
import MUILoader from "../MUILoader/MUILoader";
import MUIAutocomplete from "../MUIAutocomplete/MUIAutocomplete";
import { roles } from "../../../roles";

function EditRequestAirlineCompany({
  show,
  onClose,
  user,
  department,
  onSubmit,
  addTarif,
  id,
  addNotification,
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
    name: user?.name || "",
    email: user?.email || "",
    role: user?.role || "",
    position: user?.position || "",
    login: user?.login || "",
    oldPassword: "",
    password: "",
    department: department || "",
  });

  const sidebarRef = useRef();

  const [showIMG, setShowIMG] = useState();

  useEffect(() => {
    if (show && user && department) {
      setFormData({
        images: null,
        name: user?.name || "",
        email: user?.email || "",
        role: user?.role || "",
        position: user?.position || "",
        login: user?.login || "",
        oldPassword: "",
        password: "",
        department: department || "",
      });
      setShowIMG(user.images);
    }
  }, [show, department, user]);

  const resetForm = useCallback(() => {
    setFormData({
      images: null,
      name: user?.name || "",
      email: user?.email || "",
      role: user?.role || "",
      position: user?.position || "",
      login: user?.login || "",
      oldPassword: "",
      password: "",
      department: department || "",
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isEditing) {
      setIsLoading(true);

      try {
        const selectedDepartment = addTarif.find(
          (dept) => dept.name === formData.department
        );

        let response_update_user = await uploadFile({
          variables: {
            input: {
              id: user.id,
              name: formData.name,
              email: formData.email,
              role: formData.role,
              position: formData.position,
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
          const updatedUser = response_update_user.data.updateUser;

          const updatedTarif = addTarif.map((department) => {
            // Если пользователь находится в этом отделе
            if (department.users.some((u) => u.id === user.id)) {
              // Если это старый отдел и отдел изменился, удаляем пользователя
              if (department.name !== formData.department) {
                return {
                  ...department,
                  users: department.users.filter((u) => u.id !== user.id),
                };
              } else {
                // Если отдел не изменился, просто обновляем данные пользователя
                return {
                  ...department,
                  users: department.users.map((u) =>
                    u.id === updatedUser.id ? { ...u, ...updatedUser } : u
                  ),
                };
              }
            }

            // Если это новый отдел, добавляем пользователя
            if (department.name === formData.department) {
              return {
                ...department,
                users: [...department.users, { ...user, ...updatedUser }].sort(
                  (a, b) => a.name.localeCompare(b.name)
                ),
              };
            }

            // Если отдел не связан с изменениями, возвращаем как есть
            return department;
          });

          // console.log("Updated Tarif:", updatedTarif);

          onSubmit(updatedTarif); // Обновляем состояние в родительском компоненте
          resetForm();
          onClose();
          setIsLoading(false);
          addNotification("Редактирование аккаунта прошло успешно.", "success");
        }
      } catch (err) {
        setIsLoading(false);
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

  const positions = ["Директор", "Заместитель директора", "Сотрудник"];

  return (
    <Sidebar show={show} sidebarRef={sidebarRef}>
      <div className={classes.requestTitle}>
        <div className={classes.requestTitle_name}>Редактировать</div>
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
                <label>ФИО</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Введите ФИО"
                  disabled={!isEditing}
                />
              </div>

              <div className={classes.requestDataInfo}>
                <label>Почта</label>
                <input
                  type="text"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Введите email"
                  disabled={!isEditing}
                />
              </div>

              {user?.role === roles.airlineModerator ? null : (
                <>
                  <div className={classes.requestDataInfo}>
                    <label>Роль</label>
                    <div className={classes.dropdown}>
                      <MUIAutocomplete
                        dropdownWidth={"100%"}
                        isDisabled={!isEditing}
                        label={"Выберите роль"}
                        options={["AIRLINEADMIN"]}
                        value={formData.role}
                        onChange={(event, newValue) => {
                          setFormData((prevFormData) => ({
                            ...prevFormData,
                            role: newValue,
                          }));
                          setIsEdited(true);
                        }}
                      />
                    </div>
                  </div>
                  {/* <DropDownList
                placeholder="Выберите роль"
                searchable={false}
                options={["AIRLINEADMIN"]}
                initialValue={formData.role}
                onSelect={(value) => {
                  setFormData((prevFormData) => ({
                    ...prevFormData,
                    role: value,
                  }));
                  setIsEdited(true);
                }}
              /> */}
                </>
              )}

              <div className={classes.requestDataInfo}>
                <label>Должность</label>
                <div className={classes.dropdown}>
                  <MUIAutocomplete
                    dropdownWidth={"100%"}
                    isDisabled={!isEditing}
                    label={"Выберите должность"}
                    options={positions}
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
              </div>
              {/* <DropDownList
                placeholder="Выберите должность"
                searchable={false}
                options={positions}
                initialValue={formData.position}
                onSelect={(value) => {
                  setFormData((prevFormData) => ({
                    ...prevFormData,
                    position: value,
                  }));
                  setIsEdited(true);
                }}
              /> */}

              <div className={classes.requestDataInfo}>
                <label>Отдел</label>
                <div className={classes.dropdown}>
                  <MUIAutocomplete
                    dropdownWidth={"100%"}
                    isDisabled={!isEditing}
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
              </div>
              {/* <select
                name="department"
                value={formData.department}
                onChange={handleChange}
              >
                {addTarif.map((department, index) => (
                  <option key={index} value={department.name}>
                    {department.name}
                  </option>
                ))}
              </select> */}

              <div className={classes.requestDataInfo}>
                <label>Логин</label>
                <input
                  type="text"
                  name="login"
                  value={formData.login}
                  onChange={handleChange}
                  placeholder="Введите логин"
                  disabled={!isEditing}
                />
              </div>

              <div className={classes.requestDataInfo}>
                <label>Старый пароль</label>
                <input
                  type={showOldPassword ? "text" : "password"}
                  name="oldPassword"
                  value={formData.oldPassword}
                  onChange={handleChange}
                  placeholder="Старый пароль"
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
                <label>Новый пароль</label>
                <input
                  type={showNewPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Новый пароль"
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
          </div>

          <div className={classes.requestButton}>
            <Button
              type="submit"
              onClick={handleSubmit}
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

export default EditRequestAirlineCompany;
