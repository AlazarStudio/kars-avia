import React, { useState, useRef, useEffect, useCallback } from "react";
import classes from "./ConfirmDriver.module.css";
import Button from "../../Standart/Button/Button";
import Sidebar from "../Sidebar/Sidebar";
import {
  decodeJWT,
  getCookie,
  server,
  UPDATE_DISPATCHER_USER,
} from "../../../../graphQL_requests";
import { useMutation } from "@apollo/client";
import DropDownList from "../DropDownList/DropDownList";
import { roles, rolesObject } from "../../../roles";
import MUILoader from "../MUILoader/MUILoader";
import MUIAutocomplete from "../MUIAutocomplete/MUIAutocomplete";

function ConfirmDriver({
  show,
  onClose,
  chooseObject,
  updateDispatcher,
  openDeleteComponent,
  filterList,
  positions,
  addNotification,
}) {
  const token = getCookie("token");
  const user = decodeJWT(token);

  const [uploadFile, { data, loading, error }] = useMutation(
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

  const [isEdited, setIsEdited] = useState(false); // Флаг, указывающий, были ли изменения в форме
  const [formData, setFormData] = useState({
    id: chooseObject?.id || "",
    name: chooseObject?.name || "",
    email: chooseObject?.email || "",
    number: chooseObject?.number || "",
    vehicleNumber: chooseObject?.vehicleNumber || "",
    car: chooseObject?.car || "",
    driverLicenseNumber: chooseObject?.driverLicenseNumber || "",
  });

  const sidebarRef = useRef();

  const [index, setIndex] = useState(null);
  const [showIMG, setShowIMG] = useState();

  useEffect(() => {
    if (chooseObject) {
      setFormData({
        id: chooseObject.id || "",
        name: chooseObject.name || "",
        email: chooseObject.email || "",
        number: chooseObject?.number || "",
        vehicleNumber: chooseObject?.vehicleNumber || "",
        car: chooseObject?.car || "",
        driverLicenseNumber: chooseObject?.driverLicenseNumber || "",
      });
      setShowIMG(chooseObject?.documents?.driverPhoto);
      setIndex(chooseObject.index);
    }
  }, [chooseObject]);

  const resetForm = useCallback(() => {
    setFormData({
      id: chooseObject?.id || "",
      name: chooseObject?.name || "",
      email: chooseObject?.email || "",
      number: chooseObject?.number || "",
      vehicleNumber: chooseObject?.vehicleNumber || "",
      car: chooseObject?.car || "",
      driverLicenseNumber: chooseObject?.driverLicenseNumber || "",
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
      setIsLoading(true);
      // Проверяем обязательные поля
      // const requiredFields = ["name", "email",];
      // const emptyFields = requiredFields.filter(
      //   (field) => !formData[field]?.trim()
      // );

      // if (emptyFields.length > 0) {
      //   alert("Пожалуйста, заполните все обязательные поля.");
      //   setIsLoading(false);
      //   return;
      // }
      // const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      // if (!emailRegex.test(formData.email)) {
      //   alert("Введите корректный email.");
      //   setIsLoading(false);
      //   return;
      // }
      // if (formData.password !== "" && formData.password.length < 8) {
      //   alert("Новый пароль должен содержать минимум 8 символов.");
      //   setIsLoading(false);
      //   return;
      // }
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
            },
          },
        });

        if (response_update_user) {
          // updateDispatcher(response_update_user.data.updateUser, index);
          resetForm();
          onClose();
          setIsLoading(false);
          addNotification(
            "Редактирование диспетчера прошло успешно.",
            "success"
          );
        }
      } catch (error) {
        console.error("Ошибка обновления пользователя:", error);
      } finally {
        resetForm();
        // onClose();
        setIsLoading(false); // Сбрасываем isLoading после завершения запроса
        // addNotification("Редактирование диспетчера прошло успешно.", "success");
        setShowOldPassword(false);
        setShowNewPassword(false);
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

  // console.log(user);

  return (
    <Sidebar show={show} sidebarRef={sidebarRef}>
      <div className={classes.requestTitle}>
        <div className={classes.requestTitle_name}>Водитель</div>
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
                    style={{ userSelect: "none" }}
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
                  type="email"
                  name="email"
                  placeholder="example@mail.ru"
                  value={formData.email}
                  onChange={handleChange}
                  disabled={!isEditing}
                />
              </div>

              <div className={classes.requestDataInfo}>
                <div className={classes.requestDataInfo_title}>Номер</div>
                <input
                  type="text"
                  name="number"
                  // placeholder="example@mail.ru"
                  value={formData.number}
                  onChange={handleChange}
                  disabled={!isEditing}
                />
              </div>

              <div className={classes.requestDataInfo}>
                <div className={classes.requestDataInfo_title}>
                  Номер водительских прав
                </div>
                <input
                  type="text"
                  name="vehicleNumber"
                  placeholder="example@mail.ru"
                  value={formData.vehicleNumber}
                  onChange={handleChange}
                  disabled={!isEditing}
                />
              </div>

              <div className={classes.requestDataInfo}>
                <div className={classes.requestDataInfo_title}>Машина</div>
                <input
                  type="text"
                  name="car"
                  // placeholder="example@mail.ru"
                  value={formData.car}
                  onChange={handleChange}
                  disabled={!isEditing}
                />
              </div>

              <div className={classes.requestDataInfo}>
                <div className={classes.requestDataInfo_title}>
                  Номер машины
                </div>
                <input
                  type="text"
                  name="driverLicenseNumber"
                  // placeholder="example@mail.ru"
                  value={formData.driverLicenseNumber}
                  onChange={handleChange}
                  disabled={!isEditing}
                />
              </div>

              <div className={classes.requestDataInfo}>
                <div className={classes.requestDataInfo_title}>
                  Дополнительное оборудование
                </div>
                <input
                  type="text"
                  name="driverLicenseNumber"
                  // placeholder="example@mail.ru"
                  value={formData.driverLicenseNumber}
                  onChange={handleChange}
                  disabled={!isEditing}
                />
              </div>

              <div className={classes.imageList}>
                {chooseObject?.documents?.carPhotos?.map((image, index) => {
                  return (
                    <div
                      key={`${image}-${index}`}
                      className={`${classes.imageItem}`}
                    >
                      <img
                        src={`${server}${image}`}
                        alt={`Image ${index + 1}`}
                      />
                    </div>
                  );
                })}
              </div>

              <div className={classes.imageList}>
                {chooseObject?.documents?.stsPhoto?.map((image, index) => {
                  return (
                    <div
                      key={`${image}-${index}`}
                      className={`${classes.imageItem}`}
                    >
                      <img
                        src={`${server}${image}`}
                        alt={`Image ${index + 1}`}
                      />
                    </div>
                  );
                })}
              </div>

              <div className={classes.imageList}>
                {chooseObject?.documents?.ptsPhoto?.map((image, index) => {
                  return (
                    <div
                      key={`${image}-${index}`}
                      className={`${classes.imageItem}`}
                    >
                      <img
                        src={`${server}${image}`}
                        alt={`Image ${index + 1}`}
                      />
                    </div>
                  );
                })}
              </div>

              <div className={classes.imageList}>
                {chooseObject?.documents?.osagoPhoto?.map((image, index) => {
                  return (
                    <div
                      key={`${image}-${index}`}
                      className={`${classes.imageItem}`}
                    >
                      <img
                        src={`${server}${image}`}
                        alt={`Image ${index + 1}`}
                      />
                    </div>
                  );
                })}
              </div>

              <div className={classes.imageList}>
                {chooseObject?.documents?.licensePhoto?.map((image, index) => {
                  return (
                    <div
                      key={`${image}-${index}`}
                      className={`${classes.imageItem}`}
                    >
                      <img
                        src={`${server}${image}`}
                        alt={`Image ${index + 1}`}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* <div className={classes.requestButton}>
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
          </div> */}
        </>
      )}
    </Sidebar>
  );
}

export default ConfirmDriver;
