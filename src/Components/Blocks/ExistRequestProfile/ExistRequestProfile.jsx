import React, { useState, useRef, useEffect, useCallback } from "react";
import classes from "./ExistRequestProfile.module.css";
import Button from "../../Standart/Button/Button";
import Sidebar from "../Sidebar/Sidebar";
import { getCookie, server, UPDATE_USER } from "../../../../graphQL_requests";
import { useMutation } from "@apollo/client";
import MUILoader from "../MUILoader/MUILoader";

function ExistRequestProfile({
  show,
  onClose,
  user,
  updateUser,
  openDeleteComponent,
  addNotification,
}) {
  const token = getCookie("token");

  const [uploadFile, { data, loading, error }] = useMutation(UPDATE_USER, {
    context: {
      headers: {
        Authorization: `Bearer ${token}`,
        "Apollo-Require-Preflight": "true",
      },
    },
  });

  const [isEdited, setIsEdited] = useState(false); // Флаг, указывающий, были ли изменения в форме
  const [formData, setFormData] = useState({
    id: user?.id || "",
    images: null,
    name: user?.name || "",
    email: user?.email || "",
    login: user?.login || "",
    oldPassword: "",
    password: user?.password || "",
  });

  const sidebarRef = useRef();

  const [index, setIndex] = useState(null);
  const [showIMG, setShowIMG] = useState();

  useEffect(() => {
    if (show && user) {
      setFormData({
        id: user?.id || "",
        images: null,
        name: user?.name || "",
        email: user?.email || "",
        login: user?.login || "",
        oldPassword: "",
        password: user?.password || "",
      });
      setShowIMG(user?.images[0] ? user?.images[0] : []);
      setIndex(user?.index);
    }
  }, [show, user]);

  const resetForm = useCallback(() => {
    setFormData({
      id: "",
      images: null,
      name: "",
      email: "",
      login: "",
      oldPassword: "",
      password: "",
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

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData((prevState) => ({
        ...prevState,
        images: file,
      }));
    }
  };

  const handleUpdate = async () => {
    if (isEditing) {
      setIsLoading(true);
      try {
        let response_update_user = await uploadFile({
          variables: {
            input: {
              id: formData.id,
              name: formData.name,
              email: formData.email,
              login: formData.login,
              oldPassword: formData.oldPassword,
              password: formData.password,
            },
            images: formData.images,
          },
        });

        if (response_update_user) {
          updateUser(response_update_user.data.updateUser);
        }
        resetForm();
        onClose();
        addNotification("Редактирование профиля прошло успешно.", "success");
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
        setIsLoading(false);
        // addNotification("Редактирование профиля прошло успешно.", "success");
        setShowOldPassword(false);
        setShowNewPassword(false);
        setFormData((prevData) => ({
          ...prevData,
          password:  "",
          oldPassword: "",
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
                    height:"20px",
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
                    height:"20px",
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
                  disabled={!isEditing}
                />
              </div>
            </div>
          </div>

          <div className={classes.requestButton}>
            {/* <Button
          onClick={() => openDeleteComponent(index, formData.id)}
          backgroundcolor={"#FF9C9C"}
        >
          Удалить{" "}
          <img
            style={{ width: "fit-content", height: "fit-content" }}
            src="/delete.png"
            alt=""
          />
        </Button> */}
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

export default ExistRequestProfile;
