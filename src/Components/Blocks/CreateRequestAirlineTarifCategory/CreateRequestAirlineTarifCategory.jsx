import React, { useState, useRef, useEffect, useCallback, useMemo } from "react";
import classes from "./CreateRequestAirlineTarifCategory.module.css";
import Button from "../../Standart/Button/Button.jsx";
import Sidebar from "../Sidebar/Sidebar.jsx";

import {
  GET_AIRPORTS_RELAY,
  GET_ALL_TARIFFS,
  getCookie,
  UPDATE_AIRLINE_TARIF,
  UPDATE_HOTEL_TARIF,
} from "../../../../graphQL_requests.js";
import { useMutation, useQuery } from "@apollo/client";
import MUIAutocomplete from "../MUIAutocomplete/MUIAutocomplete.jsx";
import MUILoader from "../MUILoader/MUILoader.jsx";
import MultiSelectAutocomplete from "../MultiSelectAutocomplete/MultiSelectAutocomplete.jsx";
import TariffGeographyList from "../TariffGeographyList/TariffGeographyList.jsx";
import { rowsToGeographyInput, findDuplicateGeoRow } from "../../../utils/airlineTariffGeography.js";
import CloseIcon from "../../../shared/icons/CloseIcon.jsx";
import { useDialog } from "../../../contexts/DialogContext";
import { useToast } from "../../../contexts/ToastContext";


function CreateRequestAirlineTarifCategory({
  show,
  id,
  onClose,
  addTarif,
  selectedContract,
  refetchAllCategories,
  setAddTarif,
  user,
  type,
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
    skip: !show,
  });

  // console.log(show);

  const [formData, setFormData] = useState({
    name: "",
    airportIds: [],
    geography: [],
    priceOneCategory: null,
    priceTwoCategory: null,
    priceThreeCategory: null,
    priceFourCategory: null,
    priceFiveCategory: null,
    priceSixCategory: null,
    priceSevenCategory: null,
    priceEightCategory: null,
    priceLuxe: null,
    priceApartment: null,
    priceStudio: null,
    priceComfort: null,
    priceImprovedComfort: null,
    priceNineCategory: null,
    priceTenCategory: null,
    breakfast: null,
    dinner: null,
    lunch: null,
  });

  const [airports, setAirports] = useState([]); // Список аэропортов

  const [updateAirlineTariff] = useMutation(UPDATE_AIRLINE_TARIF, {
    context: {
      headers: {
        Authorization: `Bearer ${token}`,
        // "Apollo-Require-Preflight": "true",
      },
    },
  });

  useEffect(() => {
    if (infoAirports.data) {
      setAirports(infoAirports.data.airports || []);
    }
  }, [infoAirports.data]);

  const airportOptions = airports.map((airport) => ({
    label: `${airport.code} ${airport.name}, город: ${airport.city}`,
    id: airport.id,
    code: airport.code,
    city: airport.city,
  }));

  const usedAirportIds = useMemo(() => {
    const set = new Set();
    (addTarif || []).forEach((contract) => {
      (contract?.airports || []).forEach((a) => {
        const airportId = a?.airport?.id ?? a?.id;
        if (airportId != null) set.add(String(airportId));
      });
    });
    return set;
  }, [addTarif]);

  const [skippedAirports, setSkippedAirports] = useState([]);

  // console.log(airportOptions);

  const [tarifNames, setTarifNames] = useState([]);
  const [isEdited, setIsEdited] = useState(false);
  const sidebarRef = useRef();

  const resetForm = useCallback(() => {
    setFormData({
      name: "",
      airportIds: [],
      geography: [],
      priceOneCategory: null,
      priceTwoCategory: null,
      priceThreeCategory: null,
      priceFourCategory: null,
      priceFiveCategory: null,
      priceSixCategory: null,
      priceSevenCategory: null,
      priceEightCategory: null,
      priceLuxe: null,
      priceApartment: null,
      priceStudio: null,
      priceComfort: null,
      priceImprovedComfort: null,
      priceNineCategory: null,
      priceTenCategory: null,
      breakfast: null,
      dinner: null,
      lunch: null,
    });
    setIsEdited(false);
    setSkippedAirports([]);
  }, []);

  const closeButton = useCallback(async () => {
    if (isDialogOpen) return;

    if (!isEdited) {
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
  }, [confirm, isDialogOpen, isEdited, onClose, resetForm]);

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
    if (!files?.length) return;

    if (files.length > 8) {
      showAlert("Вы можете загрузить не более 8 изображений.");
      e.target.value = null;
      return;
    }

    const fileArray = Array.from(files);
    setIsEdited(true);
    setFormData((prevState) => ({
      ...prevState,
      images: fileArray,
    }));
  };

  const [isLoading, setIsLoading] = useState(false);

  // console.log(selectedContract?.id);
  // console.log(id);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name?.trim()) {
      showAlert("Пожалуйста, укажите название договора.");
      return;
    }

    const geographyInput = rowsToGeographyInput(formData.geography);
    if (geographyInput.length === 0 && (formData.airportIds?.length || 0) === 0) {
      showAlert("Укажите хотя бы один город/регион или аэропорт — иначе тариф не будет применяться.");
      return;
    }

    const duplicateGeo = findDuplicateGeoRow(formData.geography);
    if (duplicateGeo) {
      const what = duplicateGeo.kind === "city" ? "Город" : "Регион";
      showAlert(
        duplicateGeo.label
          ? `${what} «${duplicateGeo.label}» уже добавлен в тариф.`
          : `${what} уже добавлен в тариф.`
      );
      return;
    }

    setIsLoading(true);

    try {
      await updateAirlineTariff({
        variables: {
          updateAirlineId: id,
          input: {
            prices: [
              {
                name: formData.name,
                airportIds: formData.airportIds,
                geography: geographyInput,
                prices: {
                  priceOneCategory: parseFloat(formData.priceOneCategory) || 0,
                  priceTwoCategory: parseFloat(formData.priceTwoCategory) || 0,
                  priceThreeCategory: parseFloat(formData.priceThreeCategory) || 0,
                  priceFourCategory: parseFloat(formData.priceFourCategory) || 0,
                  priceFiveCategory: parseFloat(formData.priceFiveCategory) || 0,
                  priceSixCategory: parseFloat(formData.priceSixCategory) || 0,
                  priceSevenCategory: parseFloat(formData.priceSevenCategory) || 0,
                  priceEightCategory: parseFloat(formData.priceEightCategory) || 0,
                  priceLuxe: parseFloat(formData.priceLuxe) || 0,
                  priceApartment: parseFloat(formData.priceApartment) || 0,
                  priceStudio: parseFloat(formData.priceStudio) || 0,
                  priceComfort: parseFloat(formData.priceComfort) || 0,
                  priceImprovedComfort: parseFloat(formData.priceImprovedComfort) || 0,
                  priceNineCategory: parseFloat(formData.priceNineCategory) || 0,
                  priceTenCategory: parseFloat(formData.priceTenCategory) || 0,
                },
                mealPrice: {
                  breakfast: parseFloat(formData.breakfast) || 0,
                  dinner: parseFloat(formData.dinner) || 0,
                  lunch: parseFloat(formData.lunch) || 0,
                },
              },
            ],
          },
        },
      });

      resetForm();
      onClose();
      setIsLoading(false);
      success("Добавление договора прошло успешно.");
    } catch (error) {
      setIsLoading(false);
      notifyError("Произошла ошибка при добавлении тарифа.");
      console.error("Произошла ошибка при выполнении запроса:", error);
    }
  };

  useEffect(() => {
    if (show) {
      resetForm();
    }
  }, [show, resetForm]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isDialogOpen) return;
      if (event.target.closest(".MuiSnackbar-root")) return;
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
  }, [show, closeButton, isDialogOpen]);

  // useEffect(() => {
  //   const names = addTarif.map((tarif) => ({
  //     id: tarif.id,
  //     name: tarif.name,
  //   }));
  //   setTarifNames(names);
  // }, [addTarif]);

  const categories = [
    {
      value: "onePlace",
      label: "Одноместный",
    },
    {
      value: "twoPlace",
      label: "Двухместный",
    },
    {
      value: "threePlace",
      label: "Трехместный",
    },
    {
      value: "fourPlace",
      label: "Четырехместный",
    },
    {
      value: "fivePlace",
      label: "Пятиместный",
    },
    {
      value: "sixPlace",
      label: "Шестиместный",
    },
    {
      value: "sevenPlace",
      label: "Семиместный",
    },
    {
      value: "eightPlace",
      label: "Восьмиместный",
    },
  ];

  const apartmentCategories = [
    {
      value: "apartment",
      label: "Апартаменты",
    },
    {
      value: "studio",
      label: "Студия",
    },
  ];

  const useCategories = type === "apartment" ? apartmentCategories : categories;

  // console.log(formData)

  return (
    <Sidebar show={show} sidebarRef={sidebarRef}>
      <div className={classes.requestTitle}>
        <div className={classes.requestTitle_name}>Добавить договор</div>
        <div className={classes.requestTitle_close} onClick={closeButton}>
          <CloseIcon />
        </div>
      </div>

      {isLoading ? (
        <MUILoader loadSize={"50px"} fullHeight={"90vh"} />
      ) : (
        <>
          <div className={classes.requestMiddle}>
            <div className={classes.requestData}>
              {/* <label>Выберите категорию</label>
              <MUIAutocomplete
                dropdownWidth={"100%"}
                label={"Выберите категорию"}
                options={useCategories.map((category) => category.label)}
                value={
                  useCategories.find(
                    (category) => category.value === formData.category
                  ) || ""
                }
                onChange={(event, newValue) => {
                  const selectedCategory = useCategories.find(
                    (category) => category.label === newValue
                  );
                  setFormData((prevFormData) => ({
                    ...prevFormData,
                    category: selectedCategory.value,
                  }));
                  //   setIsEdited(true);
                }}
              /> */}

              <label>Название договора</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Например: Договор №1"
              />

              <label>Аэропорты</label>
              {skippedAirports.length > 0 && (
                <div className={classes.airportHint}>
                  Не выбраны:{" "}
                  {skippedAirports
                    .map((a) => `${a.code} ${a.city}`)
                    .join(", ")}{" "}
                  — уже используются в других договорах
                </div>
              )}
              <MultiSelectAutocomplete
                isMultiple={true}
                showSelectAll={true}
                dropdownWidth={"100%"}
                label={"Выберите аэропорты"}
                options={airportOptions}
                getOptionDisabled={(opt) => usedAirportIds.has(String(opt.id))}
                value={airportOptions.filter((option) =>
                  formData.airportIds?.includes(option.id)
                )}
                onChange={(event, newValue, reason, details) => {
                  setIsEdited(true);
                  setFormData((prevFormData) => ({
                    ...prevFormData,
                    airportIds: newValue.map((option) => option.id),
                  }));
                  if (details?.option?.isSelectAll && newValue.length > 0) {
                    setSkippedAirports(
                      airportOptions.filter((o) =>
                        usedAirportIds.has(String(o.id))
                      )
                    );
                  } else {
                    setSkippedAirports([]);
                  }
                }}
              />
              <TariffGeographyList
                value={formData.geography}
                onChange={(rows) => {
                  setIsEdited(true);
                  setFormData((prev) => ({ ...prev, geography: rows }));
                }}
              />

              <label>Стоимость одноместного</label>
              <input
                type="number"
                name="priceOneCategory"
                value={formData.priceOneCategory}
                onChange={handleChange}
                placeholder="Введите стоимость"
              />

              <label>Стоимость двухместного</label>
              <input
                type="number"
                name="priceTwoCategory"
                value={formData.priceTwoCategory}
                onChange={handleChange}
                placeholder="Введите стоимость"
              />

              <label>Стоимость трехместного</label>
              <input
                type="number"
                name="priceThreeCategory"
                value={formData.priceThreeCategory}
                onChange={handleChange}
                placeholder="Введите стоимость"
              />
              <label>Стоимость четырехместного</label>
              <input
                type="number"
                name="priceFourCategory"
                value={formData.priceFourCategory}
                onChange={handleChange}
                placeholder="Введите стоимость"
              />
              <label>Стоимость пятиместного</label>
              <input
                type="number"
                name="priceFiveCategory"
                value={formData.priceFiveCategory}
                onChange={handleChange}
                placeholder="Введите стоимость"
              />
              <label>Стоимость шестиместного</label>
              <input
                type="number"
                name="priceSixCategory"
                value={formData.priceSixCategory}
                onChange={handleChange}
                placeholder="Введите стоимость"
              />
              <label>Стоимость семиместного</label>
              <input
                type="number"
                name="priceSevenCategory"
                value={formData.priceSevenCategory}
                onChange={handleChange}
                placeholder="Введите стоимость"
              />
              <label>Стоимость восьмиместного</label>
              <input
                type="number"
                name="priceEightCategory"
                value={formData.priceEightCategory}
                onChange={handleChange}
                placeholder="Введите стоимость"
              />
              <label>Стоимость девятиместного</label>
              <input
                type="number"
                name="priceNineCategory"
                value={formData.priceNineCategory}
                onChange={handleChange}
                placeholder="Введите стоимость"
              />
              <label>Стоимость десятиместного</label>
              <input
                type="number"
                name="priceTenCategory"
                value={formData.priceTenCategory}
                onChange={handleChange}
                placeholder="Введите стоимость"
              />
              <label>Стоимость люкса</label>
              <input
                type="number"
                name="priceLuxe"
                value={formData.priceLuxe}
                onChange={handleChange}
                placeholder="Введите стоимость"
              />
              <label>Стоимость комфорт</label>
              <input
                type="number"
                name="priceComfort"
                value={formData.priceComfort}
                onChange={handleChange}
                placeholder="Введите стоимость"
              />
              <label>Стоимость улучшенный комфорт</label>
              <input
                type="number"
                name="priceImprovedComfort"
                value={formData.priceImprovedComfort}
                onChange={handleChange}
                placeholder="Введите стоимость"
              />
              <label>Стоимость апартаментов</label>
              <input
                type="number"
                name="priceApartment"
                value={formData.priceApartment}
                onChange={handleChange}
                placeholder="Введите стоимость"
              />
              <label>Стоимость студии</label>
              <input
                type="number"
                name="priceStudio"
                value={formData.priceStudio}
                onChange={handleChange}
                placeholder="Введите стоимость"
              />
              <label>Завтрак</label>
              <input
                type="number"
                name="breakfast"
                value={formData.breakfast}
                onChange={handleChange}
                placeholder="Завтрак"
              />
              <label>Обед</label>
              <input
                type="number"
                name="lunch"
                value={formData.lunch}
                onChange={handleChange}
                placeholder="Обед"
              />
              <label>Ужин</label>
              <input
                type="number"
                name="dinner"
                value={formData.dinner}
                onChange={handleChange}
                placeholder="Ужин"
              />
            </div>
          </div>
          <div className={classes.requestButton}>
            <Button type="submit" onClick={handleSubmit}>
              Добавить договор
            </Button>
          </div>
        </>
      )}
    </Sidebar>
  );
}

export default CreateRequestAirlineTarifCategory;
