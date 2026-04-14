import React, { useState, useRef, useEffect, useCallback } from "react";
import classes from "./EditRequestAirlineTarifCategory.module.css";
import Button from "../../Standart/Button/Button.jsx";
import Sidebar from "../Sidebar/Sidebar.jsx";
import AdditionalMenu from "../../Standart/AdditionalMenu/AdditionalMenu.jsx";

import {
  GET_AIRPORTS_RELAY,
  getCookie,
  UPDATE_AIRLINE_TARIF,
  UPDATE_HOTEL_TARIF,
  UPDATE_PRICE_TARIFFS,
} from "../../../../graphQL_requests.js";
import { useMutation, useQuery } from "@apollo/client";
import MUIAutocomplete from "../MUIAutocomplete/MUIAutocomplete.jsx";
import MUILoader from "../MUILoader/MUILoader.jsx";
import MultiSelectAutocomplete from "../MultiSelectAutocomplete/MultiSelectAutocomplete.jsx";
import CloseIcon from "../../../shared/icons/CloseIcon.jsx";
import { useDialog } from "../../../contexts/DialogContext";
import { useToast } from "../../../contexts/ToastContext";

function EditRequestAirlineTarifCategory({
  show,
  onClose,
  tarif,
  onSubmit,
  addTarif,
  refetchAllCategories,
  id,
  selectedContract,
  setAddTarif,
  user,
  type,
  onDelete,
  initialEditMode = false,
}) {
  const token = getCookie("token");
  const { confirm, showAlert, isDialogOpen } = useDialog();
  const { success, error: notifyError } = useToast();
  const infoAirports = useQuery(GET_AIRPORTS_RELAY, {
    context: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  });

  // console.log(tarif);

  const getInitialFormData = useCallback(() => {
    const airportIds = Array.isArray(tarif?.airports)
      ? tarif.airports
        .map((a) => String(a?.airport?.id ?? a?.id ?? a))
        .filter(Boolean)
      : [];
    return {
      name: tarif?.name || "",
      airportIds,
      priceOneCategory: tarif?.prices?.priceOneCategory ?? 0,
      priceTwoCategory: tarif?.prices?.priceTwoCategory ?? 0,
      priceThreeCategory: tarif?.prices?.priceThreeCategory ?? 0,
      priceFourCategory: tarif?.prices?.priceFourCategory ?? 0,
      priceFiveCategory: tarif?.prices?.priceFiveCategory ?? 0,
      priceSixCategory: tarif?.prices?.priceSixCategory ?? 0,
      priceSevenCategory: tarif?.prices?.priceSevenCategory ?? 0,
      priceEightCategory: tarif?.prices?.priceEightCategory ?? 0,
      priceLuxe: tarif?.prices?.priceLuxe ?? 0,
      priceApartment: tarif?.prices?.priceApartment ?? 0,
      priceStudio: tarif?.prices?.priceStudio ?? 0,
      breakfast: tarif?.mealPrice?.breakfast ?? 0,
      dinner: tarif?.mealPrice?.dinner ?? 0,
      lunch: tarif?.mealPrice?.lunch ?? 0,
    };
  }, [tarif]);

  const [formData, setFormData] = useState(() => ({
    name: "",
    airportIds: [],
    priceOneCategory: 0,
    priceTwoCategory: 0,
    priceThreeCategory: 0,
    priceFourCategory: 0,
    priceFiveCategory: 0,
    priceSixCategory: 0,
    priceSevenCategory: 0,
    priceEightCategory: 0,
    priceLuxe: 0,
    priceApartment: 0,
    priceStudio: 0,
    breakfast: 0,
    dinner: 0,
    lunch: 0,
  }));
  const [isEdited, setIsEdited] = useState(false);

  const [airports, setAirports] = useState([]); // Список аэропортов
  const sidebarRef = useRef();
  const menuRef = useRef(null);
  const [anchorEl, setAnchorEl] = useState(null);

  const [updateAirlineTariff] = useMutation(UPDATE_AIRLINE_TARIF, {
    context: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  });

  const [updateTariffCategory] = useMutation(UPDATE_PRICE_TARIFFS, {
    context: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  });

  useEffect(() => {
    if (infoAirports.data) {
      setAirports(infoAirports.data.airports || []);
    }
  }, [infoAirports.data]);

  const airportOptions = airports.map((airport) => ({
    value: String(airport.id), // используем value вместо id
    label: `${airport.code} ${airport.name}, город: ${airport.city}`,
    city: airport.city,
  }));

  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (show && tarif) {
      setFormData(getInitialFormData());
      setIsEdited(false);
      setIsEditing(initialEditMode);
    }
  }, [show, tarif?.id, getInitialFormData]);

  const resetForm = useCallback(() => {
    setFormData(getInitialFormData());
    setIsEdited(false);
  }, [getInitialFormData]);

  const closeButton = useCallback(async () => {
    if (isDialogOpen) return;

    setAnchorEl(null);
    if (!isEdited) {
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
  const handleDeleteFromMenu = () => {
    handleMenuClose();
    if (onDelete && tarif?.id) {
      onClose();
      onDelete(tarif);
    }
  };
  const handleCancelEdit = () => {
    resetForm();
    setIsEditing(false);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setIsEdited(true);
    setFormData((prevState) => ({
      ...prevState,
      [name]: value,
    }));
  };

  const handleFileChange = (e) => {
    const files = e.target.files;
    if (files && files.length > 8) {
      showAlert("Вы можете загрузить не более 8 изображений.");
      e.target.value = null;
      return;
    }

    // Преобразуем файлы в массив
    const fileArray = Array.from(files);

    setFormData((prevState) => ({
      ...prevState,
      images: fileArray, // Сохраняем массив файлов
    }));
  };

  const [isLoading, setIsLoading] = useState(false);
  // console.log(selectedContract?.id);

  const handleSubmit = async (e) => {
    if (isEditing) {
      e.preventDefault();
      setIsLoading(true);

      try {
        let response_update_tariff = await updateAirlineTariff({
          variables: {
            updateAirlineId: id,
            input: {
              prices: [
                {
                  id: tarif?.id,
                  name: formData.name,
                  airportIds: formData.airportIds,
                  prices: {
                    priceOneCategory: parseFloat(formData.priceOneCategory),
                    priceTwoCategory: parseFloat(formData.priceTwoCategory),
                    priceThreeCategory: parseFloat(formData.priceThreeCategory),
                    priceFourCategory: parseFloat(formData.priceFourCategory),
                    priceFiveCategory: parseFloat(formData.priceFiveCategory),
                    priceSixCategory: parseFloat(formData.priceSixCategory),
                    priceSevenCategory: parseFloat(formData.priceSevenCategory),
                    priceEightCategory: parseFloat(formData.priceEightCategory),
                    priceLuxe: parseFloat(formData.priceLuxe),
                    priceApartment: parseFloat(formData.priceApartment),
                    priceStudio: parseFloat(formData.priceStudio),
                  },
                  mealPrice: {
                    breakfast: parseFloat(formData.breakfast),
                    dinner: parseFloat(formData.dinner),
                    lunch: parseFloat(formData.lunch),
                  },
                },
              ],
            },
          },
        });

        // await updateTariffCategory({
        //   variables: {
        //     input: {
        //       id: selectedContract.id,
        //     },
        //   },
        // });
        // onSubmit();
        resetForm();
        onClose();
        setIsLoading(false);
        setIsEditing(false);
        success("Изменение соглашения прошло успешно.");
      } catch (error) {
        setIsLoading(false);
        notifyError("Произошла ошибка при изменении соглашения.");
        console.error("Произошла ошибка при выполнении запроса:", error);
      }
    }
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isDialogOpen) return;
      if (event.target.closest(".MuiSnackbar-root")) return;

      if (anchorEl && menuRef.current?.contains(event.target)) return;
      if (sidebarRef.current?.contains(event.target)) return;
      closeButton();
    };
    if (show) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [show, closeButton, anchorEl, isDialogOpen]);

  // useEffect(() => {
  //   const names = addTarif.map((tarif) => ({
  //     id: tarif.id,
  //     name: tarif.name,
  //   }));
  //   setTarifNames(names);
  // }, [addTarif]);

  // const categories = [
  //   {
  //     value: "onePlace",
  //     label: "Одноместный",
  //   },
  //   {
  //     value: "twoPlace",
  //     label: "Двухместный",
  //   },
  //   {
  //     value: "threePlace",
  //     label: "Трехместный",
  //   },
  //   {
  //     value: "fourPlace",
  //     label: "Четырехместный",
  //   },
  //   {
  //     value: "fivePlace",
  //     label: "Пятиместный",
  //   },
  //   {
  //     value: "sixPlace",
  //     label: "Шестиместный",
  //   },
  //   {
  //     value: "sevenPlace",
  //     label: "Семиместный",
  //   },
  //   {
  //     value: "eightPlace",
  //     label: "Восьмиместный",
  //   },
  // ];

  // const apartmentCategories = [
  //   {
  //     value: "apartment",
  //     label: "Апартаменты",
  //   },
  //   {
  //     value: "studio",
  //     label: "Студия",
  //   },
  // ];

  // const useCategories = type === "apartment" ? apartmentCategories : categories;

  // console.log("formData.airportIds:", formData.airportIds);
  // console.log("airportOptions:", airportOptions);
  // console.log("Фильтрация:", airportOptions.filter((option) =>
  //   formData.airportIds.includes(option.value)
  // ));

  return (
    <Sidebar show={show} sidebarRef={sidebarRef}>
      <div className={classes.requestTitle}>
        <div className={classes.requestTitle_name}>Изменить договор</div>
        <div className={classes.requestTitle_close}>
          <AdditionalMenu
            anchorEl={anchorEl}
            onOpen={handleMenuOpen}
            onClose={handleMenuClose}
            menuRef={menuRef}
            onEdit={handleEditFromMenu}
            onDelete={onDelete ? handleDeleteFromMenu : undefined}
          />
          <div className={classes.closeIconWrapper} onClick={closeButton}>
            <CloseIcon />
          </div>
        </div>
      </div>

      {isLoading ? (
        <MUILoader loadSize={"50px"} fullHeight={"90vh"} />
      ) : (
        <>
          <div
            className={classes.requestMiddle}
            style={
              isEditing
                ? { height: "calc(100vh - 161px)" }
                : { height: "calc(100vh - 81px)" }
            }
          >
            <div className={classes.requestData}>
              <div className={classes.requestDataInfo}>
                <div className={classes.requestDataInfo_title}>
                  Название договора
                </div>
                {isEditing ? (
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Например: Договор №1"
                  />
                ) : (
                  <div className={classes.requestDataInfo_desc}>
                    {formData.name || "—"}
                  </div>
                )}
              </div>

              <div className={classes.requestDataInfo_block}>
                <div className={classes.requestDataInfo_title}>Аэропорты</div>
                {isEditing ? (
                  <div className={classes.dropdown}>
                    <MultiSelectAutocomplete
                      isMultiple={true}
                      showSelectAll={true}
                      dropdownWidth={"100%"}
                      label={"Выберите аэропорты"}
                      options={airportOptions}
                      value={airportOptions.filter((opt) =>
                        formData.airportIds.includes(opt.value),
                      )}
                      onChange={(event, newValue) => {
                        setIsEdited(true);
                        setFormData((prev) => ({
                          ...prev,
                          airportIds: (newValue || []).map((opt) => opt.value),
                        }));
                      }}
                    />
                  </div>
                ) : (
                  <div className={classes.requestDataInfo_descBlock}>
                    {airportOptions.filter((opt) =>
                      formData.airportIds.includes(opt.value),
                    ).length ? (
                      <div className={classes.requestDataInfo_airportList}>
                        {airportOptions
                          .filter((opt) =>
                            formData.airportIds.includes(opt.value),
                          )
                          .map((opt) => (
                            <div key={opt.value}>{opt.label}</div>
                          ))}
                      </div>
                    ) : (
                      "—"
                    )}
                  </div>
                )}
              </div>

              {[
                { key: "priceOneCategory", title: "Стоимость одноместного" },
                { key: "priceTwoCategory", title: "Стоимость двухместного" },
                { key: "priceThreeCategory", title: "Стоимость трехместного" },
                {
                  key: "priceFourCategory",
                  title: "Стоимость четырехместного",
                },
                { key: "priceFiveCategory", title: "Стоимость пятиместного" },
                { key: "priceSixCategory", title: "Стоимость шестиместного" },
                { key: "priceSevenCategory", title: "Стоимость семиместного" },
                {
                  key: "priceEightCategory",
                  title: "Стоимость восьмиместного",
                },
                { key: "priceLuxe", title: "Стоимость люкса" },
                { key: "priceApartment", title: "Стоимость апартаментов" },
                { key: "priceStudio", title: "Стоимость студии" },
                { key: "breakfast", title: "Завтрак" },
                { key: "lunch", title: "Обед" },
                { key: "dinner", title: "Ужин" },
              ].map(({ key, title }) => (
                <div key={key} className={classes.requestDataInfo}>
                  <div className={classes.requestDataInfo_title}>{title}</div>
                  {isEditing ? (
                    <input
                      type="number"
                      name={key}
                      value={formData[key] ?? ""}
                      onChange={handleChange}
                      placeholder="Введите стоимость"
                    />
                  ) : (
                    <div className={classes.requestDataInfo_desc}>
                      {formData[key] != null && formData[key] !== ""
                        ? formData[key]
                        : "—"}
                    </div>
                  )}
                </div>
              ))}
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

export default EditRequestAirlineTarifCategory;
