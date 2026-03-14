import React, { useState, useRef, useEffect, useCallback } from "react";
import classes from "./ExistRequestProfile.module.css";
import Button from "../../Standart/Button/Button";
import Sidebar from "../Sidebar/Sidebar";
import AdditionalMenu from "../../Standart/AdditionalMenu/AdditionalMenu";
import { getCookie, getMediaUrl, UPDATE_USER } from "../../../../graphQL_requests";
import { useMutation } from "@apollo/client";
import MUILoader from "../MUILoader/MUILoader";
import CloseIcon from "../../../shared/icons/CloseIcon";

function ExistRequestProfile({
  show,
  onClose,
  user,
  updateUser,
  openDeleteComponent,
  addNotification,
  mode = null,
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

  const getInitialFormData = useCallback(
    () => ({
      id: user?.id || "",
      images: null,
      name: user?.name || "",
      email: user?.email || "",
      login: user?.login || "",
      oldPassword: "",
      password: "",
    }),
    [user]
  );

  const [isEdited, setIsEdited] = useState(false);
  const [formData, setFormData] = useState(() => ({
    id: "",
    images: null,
    name: "",
    email: "",
    login: "",
    oldPassword: "",
    password: "",
  }));

  const sidebarRef = useRef();
  const menuRef = useRef(null);
  const [anchorEl, setAnchorEl] = useState(null);
  const [index, setIndex] = useState(null);
  const [showIMG, setShowIMG] = useState();
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  useEffect(() => {
    if (show && user) {
      setFormData(getInitialFormData());
      setShowIMG(user?.images?.[0] ? user.images[0] : []);
      setIndex(user?.index);
      setIsEdited(false);
    }
  }, [show, user, getInitialFormData]);

  const resetForm = useCallback(() => {
    setFormData(getInitialFormData());
    setIsEdited(false);
    setShowOldPassword(false);
    setShowNewPassword(false);
  }, [getInitialFormData]);

  const closeButton = useCallback(() => {
    setAnchorEl(null);
    if (!isEdited) {
      onClose();
      setIsEditing(false);
      return;
    }
    if (window.confirm("Вы уверены? Все несохраненные данные будут удалены.")) {
      resetForm();
      onClose();
      setIsEditing(false);
    }
  }, [isEdited, onClose, resetForm]);

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

  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    setIsEdited(true);
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

      const isProfileMode = mode === "profile";
      const isSecurityMode = mode === "security";

      if (isSecurityMode) {
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
      }

      try {
        let input = { id: formData.id };
        let images = null;

        if (isProfileMode) {
          input.name = formData.name;
          images = formData.images;
        } else if (isSecurityMode) {
          input.email = formData.email;
          input.login = formData.login;
          input.oldPassword = formData.oldPassword;
          input.password = formData.password;
        } else {
          input = {
            id: formData.id,
            name: formData.name,
            email: formData.email,
            login: formData.login,
            oldPassword: formData.oldPassword,
            password: formData.password,
          };
          images = formData.images;
        }

        let response_update_user = await uploadFile({
          variables: {
            input,
            images,
          },
        });

        if (response_update_user) {
          updateUser(response_update_user.data.updateUser);
        }
        resetForm();
        onClose();
        setIsEditing(false);
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
          password: "",
          oldPassword: "",
        }));
      }
    }
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (anchorEl && menuRef.current?.contains(event.target)) return;
      if (sidebarRef.current?.contains(event.target)) return;
      closeButton();
    };
    if (show) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [show, closeButton, anchorEl]);

  const eyeIconStyle = {
    width: "20px",
    height: "20px",
    objectFit: "contain",
    position: "absolute",
    right: "10px",
    top: "10px",
    cursor: "pointer",
  };

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
              {(mode === "profile" || mode === null) && (
                <>
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
                </>
              )}

              {(mode === "security" || mode === null) && (
                <>
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
                  <div className={classes.requestDataInfo}>
                    <div className={classes.requestDataInfo_title}>
                      Старый пароль
                    </div>
                    {isEditing ? (
                      <div className={classes.requestDataInfo_inputWrap}>
                        <input
                          type={showOldPassword ? "text" : "password"}
                          name="oldPassword"
                          placeholder="Старый пароль"
                          value={formData.oldPassword}
                          onChange={handleChange}
                          autoComplete="off"
                        />
                        <img
                          src={
                            showOldPassword ? "/eyeOpen.png" : "/eyeClose.png"
                          }
                          style={eyeIconStyle}
                          onClick={() => setShowOldPassword((prev) => !prev)}
                          alt=""
                        />
                      </div>
                    ) : (
                      <div className={classes.requestDataInfo_desc}>—</div>
                    )}
                  </div>
                  <div className={classes.requestDataInfo}>
                    <div className={classes.requestDataInfo_title}>
                      Новый пароль
                    </div>
                    {isEditing ? (
                      <div className={classes.requestDataInfo_inputWrap}>
                        <input
                          type={showNewPassword ? "text" : "password"}
                          name="password"
                          placeholder="Новый пароль"
                          value={formData.password}
                          onChange={handleChange}
                          autoComplete="off"
                        />
                        <img
                          src={
                            showNewPassword ? "/eyeOpen.png" : "/eyeClose.png"
                          }
                          style={eyeIconStyle}
                          onClick={() => setShowNewPassword((prev) => !prev)}
                          alt=""
                        />
                      </div>
                    ) : (
                      <div className={classes.requestDataInfo_desc}>—</div>
                    )}
                  </div>
                </>
              )}

              {(mode === "profile" || mode === null) && isEditing && (
                <div className={classes.requestDataInfo}>
                  <div className={classes.requestDataInfo_title}>Аватар</div>
                  <input
                    type="file"
                    name="images"
                    onChange={handleFileChange}
                  />
                </div>
              )}
            </div>
          </div>

          {isEditing && (
            <div className={classes.requestButton}>
              <Button
                type="button"
                onClick={handleCancelEdit}
                backgroundcolor="var(--hover-gray)"
                color="#000"
              >
                Отмена
              </Button>
              <Button
                type="button"
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

export default ExistRequestProfile;
