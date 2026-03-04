import React, { useState, useRef, useEffect, useCallback } from "react";
import classes from "./ExistRequestMyCompany.module.css";
import Button from "../../Standart/Button/Button";
import Sidebar from "../Sidebar/Sidebar";
import {
  decodeJWT,
  GET_CITIES,
  GET_COMPANY,
  getCookie,
  server,
  UPDATE_COMPANY,
  UPDATE_DISPATCHER_USER,
} from "../../../../graphQL_requests";
import { useMutation, useQuery } from "@apollo/client";
import DropDownList from "../DropDownList/DropDownList";
import { roles, rolesObject } from "../../../roles";
import MUILoader from "../MUILoader/MUILoader";
import MUIAutocomplete from "../MUIAutocomplete/MUIAutocomplete";
import MUIAutocompleteColor from "../MUIAutocompleteColor/MUIAutocompleteColor";
import CloseIcon from "../../../shared/icons/CloseIcon";
import AdditionalMenu from "../../Standart/AdditionalMenu/AdditionalMenu";

function ExistRequestMyCompany({
  show,
  onClose,
  chooseObject,
  updateDispatcher,
  addNotification,
}) {
  const token = getCookie("token");
  const user = decodeJWT(token);

  const { data: companyData, refetch } = useQuery(GET_COMPANY, {
    context: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
    variables: {
      getCompanyId: chooseObject?.id,
    },
    skip: !chooseObject?.id,
  });
  let infoCities = useQuery(GET_CITIES, {
    context: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  });

  const [uploadFile, { data, loading, error }] = useMutation(UPDATE_COMPANY, {
    context: {
      headers: {
        Authorization: `Bearer ${token}`,
        "Apollo-Require-Preflight": "true",
      },
    },
  });

  const [isEdited, setIsEdited] = useState(false); // Флаг, указывающий, были ли изменения в форме
  const [formData, setFormData] = useState({
    id: "",
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
  const menuRef = useRef(null);
  const [anchorEl, setAnchorEl] = useState(null);

  // console.log(companyData);

  useEffect(() => {
    if (companyData) {
      setFormData({
        id: companyData.getCompany.id || "",
        name: companyData.getCompany.name || "",
        description: companyData.getCompany?.information?.description || "",
        country: companyData.getCompany?.information?.country || "",
        city: companyData.getCompany?.information?.city || "",
        email: companyData.getCompany?.information?.email || "",
        inn: companyData.getCompany?.information?.inn || "",
        ogrn: companyData.getCompany?.information?.ogrn || "",
        bik: companyData.getCompany?.information?.bik || "",
        rs: companyData.getCompany?.information?.rs || "",
        bank: companyData.getCompany?.information?.bank || "",
        index: companyData.getCompany?.information?.index || "",
      });
    }
  }, [companyData, show]);

  const resetForm = useCallback(() => {
    const company = companyData?.getCompany;
    setFormData({
      id: company?.id || "",
      name: company?.name || "",
      description: company?.information?.description || "",
      country: company?.information?.country || "",
      city: company?.information?.city || "",
      email: company?.information?.email || "",
      inn: company?.information?.inn || "",
      ogrn: company?.information?.ogrn || "",
      bik: company?.information?.bik || "",
      rs: company?.information?.rs || "",
      bank: company?.information?.bank || "",
      index: company?.information?.index || "",
    });
    setIsEdited(false);
  }, [companyData]);

  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleMenuOpen = (e) => setAnchorEl(e.currentTarget);
  const handleMenuClose = () => setAnchorEl(null);
  const handleEditFromMenu = () => setIsEditing(true);
  const handleCancelEdit = () => {
    resetForm();
    setIsEditing(false);
  };

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
  //       images: null,
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

  const handleSubmit = async (e) => {
    e?.preventDefault?.();
    setIsLoading(true);
    const requiredFields = ["name"];
    const emptyFields = requiredFields.filter(
      (field) => !formData[field]?.trim()
    );

    if (emptyFields.length > 0) {
      alert("Пожалуйста, заполните все обязательные поля.");
      setIsLoading(false);
      return;
    }

    try {
      let response_update_user = await uploadFile({
        variables: {
          input: {
            id: formData.id,
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

      if (response_update_user) {
        updateDispatcher();
        setIsEditing(false);
        addNotification("Редактирование компании прошло успешно.", "success");
      }
    } catch (error) {
      console.error("Ошибка обновления пользователя:", error);
    } finally {
      setIsLoading(false);
    }
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

  // console.log(user);

  return (
    <Sidebar show={show} sidebarRef={sidebarRef}>
      <div className={classes.requestTitle}>
        <div className={classes.requestTitle_name}>Редактировать компанию</div>
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
          <div className={classes.requestMiddle} style={isEditing ? { height: "calc(100vh - 161px)" } : { height: "calc(100vh - 80px)" }}>
            <div className={classes.requestData}>
              <label>Название</label>
              <input
                type="text"
                name="name"
                placeholder=""
                value={formData.name}
                onChange={handleChange}
                autoComplete="new-password"
                disabled={!isEditing}
              />

              <label>Описание</label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                disabled={!isEditing}
              ></textarea>

              <label>Страна</label>
              <input
                type="text"
                name="country"
                placeholder=""
                value={formData.country}
                onChange={handleChange}
                autoComplete="new-password"
                disabled={!isEditing}
              />

              <label>Город</label>
              <MUIAutocompleteColor
                dropdownWidth="100%"
                listboxHeight={"300px"}
                isDisabled={!isEditing}
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
                disabled={!isEditing}
              />

              <label>ИНН</label>
              <input
                type="text"
                name="inn"
                placeholder=""
                value={formData.inn}
                onChange={handleChange}
                autoComplete="new-password"
                disabled={!isEditing}
              />

              <label>ОГРН</label>
              <input
                type="text"
                name="ogrn"
                placeholder=""
                value={formData.ogrn}
                onChange={handleChange}
                autoComplete="new-password"
                disabled={!isEditing}
              />

              <label>БИК</label>
              <input
                type="text"
                name="bik"
                placeholder=""
                value={formData.bik}
                onChange={handleChange}
                autoComplete="new-password"
                disabled={!isEditing}
              />

              <label>Р/С</label>
              <input
                type="text"
                name="rs"
                placeholder=""
                value={formData.rs}
                onChange={handleChange}
                autoComplete="new-password"
                disabled={!isEditing}
              />

              <label>В БАНКЕ</label>
              <input
                type="text"
                name="bank"
                placeholder=""
                value={formData.bank}
                onChange={handleChange}
                autoComplete="new-password"
                disabled={!isEditing}
              />

              <label>Индекс</label>
              <input
                type="text"
                name="index"
                placeholder=""
                value={formData.index}
                onChange={handleChange}
                autoComplete="new-password"
                disabled={!isEditing}
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

export default ExistRequestMyCompany;
