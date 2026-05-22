import React, { useState, useRef, useEffect, useCallback } from "react";
import classes from "./CreateRequestMyCompany.module.css";
import Button from "../../Standart/Button/Button";
import Sidebar from "../Sidebar/Sidebar";
import {
  CREATE_COMPANY,
  CREATE_DISPATCHER_USER,
  GET_CITIES,
  getCookie,
} from "../../../../graphQL_requests";
import { useMutation, useQuery } from "@apollo/client";
import DropDownList from "../DropDownList/DropDownList";
import MUILoader from "../MUILoader/MUILoader";
import MUIAutocomplete from "../MUIAutocomplete/MUIAutocomplete";
import { rolesObject } from "../../../roles";
import MUIAutocompleteColor from "../MUIAutocompleteColor/MUIAutocompleteColor";
import CloseIcon from "../../../shared/icons/CloseIcon";
import { useDialog } from "../../../contexts/DialogContext";
import { useToast } from "../../../contexts/ToastContext";

function CreateRequestMyCompany({
  show,
  onClose,
  addDispatcher,
  positions,
}) {
  const token = getCookie("token");
  const { confirm, showAlert, isDialogOpen } = useDialog();
  const { success } = useToast();

  let infoCities = useQuery(GET_CITIES, {
    context: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  });

  const [isEdited, setIsEdited] = useState(false); // Флаг, указывающий, были ли изменения в форме
  const [formData, setFormData] = useState({
    // images: null,
    name: "",
    description: "",
    country: "",
    city: "",
    email: "",
    inn: "",
    ogrn: "",
    bik: "",
    rs: "",
    bank: "",
    index: "",
  });

  const [cities, setCities] = useState([]);
  useEffect(() => {
    if (infoCities.data) {
      const mappedCities =
        infoCities.data?.citys.map((item) => ({
          label: `${item.city}, ${item.region}`,
          value: item.city,
        })) || [];
      setCities(infoCities.data?.citys);
    }
  }, [infoCities]);

  const sidebarRef = useRef();

  const resetForm = useCallback(() => {
    setFormData({
      // images: null,
      name: "",
      description: "",
      country: "",
      city: "",
      email: "",
      inn: "",
      ogrn: "",
      bik: "",
      rs: "",
      bank: "",
      index: "",
    });
    setIsEdited(false); // Сброс флага изменений
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
    setIsEdited(true); // Устанавливаем флаг изменений при любом изменении
    setFormData((prevState) => ({
      ...prevState,
      [name]: value,
    }));
  }, []);

  // const fileInputRef = useRef(null);

  // const handleFileChange = (e) => {
  //   const file = e.target.files[0];
  //   const maxSizeInBytes = 8 * 1024 * 1024; // 8 MB
  //   if (file.size > maxSizeInBytes) {
  //     alert("Размер файла не должен превышать 8 МБ!");
  //     setFormData((prevState) => ({
  //       ...prevState,
  //       images: "",
  //     }));
  //     if (fileInputRef.current) {
  //       fileInputRef.current.value = ""; // Сброс значения в DOM-элементе
  //     }
  //     return;
  //   }

  //   if (file) {
  //     setFormData((prevState) => ({
  //       ...prevState,
  //       images: file,
  //     }));
  //   }
  // };

  const [uploadFile, { data, loading, error }] = useMutation(CREATE_COMPANY, {
    context: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  });

  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    // Проверяем обязательные поля
    const requiredFields = ["name"];
    const emptyFields = requiredFields.filter(
      (field) => !formData[field]?.trim()
    );

    if (emptyFields.length > 0) {
      showAlert("Пожалуйста, заполните все обязательные поля.");
      setIsLoading(false);
      return;
    }

    // const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    // if (!emailRegex.test(formData.email)) {
    //   alert("Введите корректный email.");
    //   setIsLoading(false);
    //   return;
    // }

    try {
      let response_create_user = await uploadFile({
        variables: {
          input: {
            name: formData.name,
            information: {
              description: formData.description,
              country: formData.country,
              city: formData.city,
              email: formData.email,
              inn: formData.inn,
              ogrn: formData.ogrn,
              bik: formData.bik,
              rs: formData.rs,
              bank: formData.bank,
              index: formData.index,
            },
          },
        },
      });

      if (response_create_user) {
        // console.log(response_create_user);

        addDispatcher(response_create_user.data.createCompany);
        resetForm();
        onClose();
        success("Компания создана успешно.");
      }
    } catch (e) {
      console.error("Ошибка при создании компании:", e);
    } finally {
      // onClose();
      // resetForm();
      setIsLoading(false);
      // addNotification("Аккаунт диспетчера создан успешно.", "success")
    }
    // addDispatcher({
    //     ...formData,
    //     id: Date.now().toString()  // Generate a unique id for the new dispatcher
    // });
    // resetForm();
    // onClose();
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isDialogOpen) return;
      if (event.target.closest(".MuiSnackbar-root")) return;

      if (
        sidebarRef.current?.contains(event.target) // Клик в боковой панели
      ) {
        return; // Если клик внутри, ничего не делаем
      }

      // Если клик был вне боковой панели, то закрываем её
      closeButton();
    };

    if (show) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }

    // Очистка эффекта при демонтировании компонента
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [show, closeButton, isDialogOpen]);

  return (
    <Sidebar show={show} sidebarRef={sidebarRef}>
      <div className={classes.requestTitle}>
        <div className={classes.requestTitle_name}>Добавить компанию</div>
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
              <label>Название</label>
              <input
                type="text"
                name="name"
                placeholder=""
                value={formData.name}
                onChange={handleChange}
                autoComplete="new-password"
              />

              <label>Описание</label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
              ></textarea>

              <label>Страна</label>
              <input
                type="text"
                name="country"
                placeholder=""
                value={formData.country}
                onChange={handleChange}
                autoComplete="new-password"
              />

              {/* <label>Город</label>
              <input
                type="text"
                name="city"
                placeholder=""
                value={formData.city}
                onChange={handleChange}
                autoComplete="new-password"
              /> */}
              <label>Город</label>
              <MUIAutocompleteColor
                dropdownWidth="100%"
                listboxHeight={"300px"}
                // isDisabled={!isEditing}
                options={cities}
                getOptionLabel={(option) =>
                  option ? `${option.city} ${option.region}`.trim() : ""
                }
                renderOption={(optionProps, option) => {
                  // Формируем строку для отображения
                  const labelText = `${option.city} ${option.region}`.trim();
                  // Разбиваем строку по пробелам
                  const words = labelText.split(" ");
                  return (
                    <li {...optionProps} key={option.id}>
                      {words.map((word, index) => (
                        <span
                          key={index}
                          style={{
                            color: index === 0 ? "black" : "gray",
                            marginRight: "4px",
                          }}
                        >
                          {word}
                        </span>
                      ))}
                    </li>
                  );
                }}
                value={
                  cities.find((option) => option.city === formData.city) || null
                }
                onChange={(e, newValue) => {
                  setFormData((prev) => ({
                    ...prev,
                    city: newValue.city || "",
                  }));
                }}
              />

              <label>E-mail</label>
              <input
                type="text"
                name="email"
                placeholder=""
                value={formData.email}
                onChange={handleChange}
                autoComplete="new-password"
              />

              <label>ИНН</label>
              <input
                type="text"
                name="inn"
                placeholder=""
                value={formData.inn}
                onChange={handleChange}
                autoComplete="new-password"
              />

              <label>ОГРН</label>
              <input
                type="text"
                name="ogrn"
                placeholder=""
                value={formData.ogrn}
                onChange={handleChange}
                autoComplete="new-password"
              />

              <label>БИК</label>
              <input
                type="text"
                name="bik"
                placeholder=""
                value={formData.bik}
                onChange={handleChange}
                autoComplete="new-password"
              />

              <label>Р/С</label>
              <input
                type="text"
                name="rs"
                placeholder=""
                value={formData.rs}
                onChange={handleChange}
                autoComplete="new-password"
              />

              <label>В БАНКЕ</label>
              <input
                type="text"
                name="bank"
                placeholder=""
                value={formData.bank}
                onChange={handleChange}
                autoComplete="new-password"
              />

              <label>Индекс</label>
              <input
                type="text"
                name="index"
                placeholder=""
                value={formData.index}
                onChange={handleChange}
                autoComplete="new-password"
              />

              {/* <label>Аватар</label>
              <input
                type="file"
                name="images"
                onChange={handleFileChange}
                ref={fileInputRef}
              /> */}
            </div>
          </div>

          <div className={classes.requestButton}>
            <Button type="submit" onClick={handleSubmit}>
              Добавить компанию
            </Button>
          </div>
        </>
      )}
    </Sidebar>
  );
}

export default CreateRequestMyCompany;
