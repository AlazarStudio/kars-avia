import React, { useState, useRef, useEffect } from "react";
import classes from "./EditRequestAirlineTarifCategory.module.css";
import Button from "../../Standart/Button/Button.jsx";
import Sidebar from "../Sidebar/Sidebar.jsx";

import {
  GET_AIRPORTS_RELAY,
  getCookie,
  UPDATE_AIRLINE_TARIF,
  UPDATE_HOTEL_TARIF,
} from "../../../../graphQL_requests.js";
import { useMutation, useQuery } from "@apollo/client";
import MUIAutocomplete from "../MUIAutocomplete/MUIAutocomplete.jsx";
import MUILoader from "../MUILoader/MUILoader.jsx";
import MultiSelectAutocomplete from "../MultiSelectAutocomplete/MultiSelectAutocomplete.jsx";

function EditRequestAirlineTarifCategory({
  show,
  onClose,
  tarif,
  onSubmit,
  addTarif,
  id,
  setAddTarif,
  user,
  type,
  addNotification,
}) {
  const token = getCookie("token");
  const infoAirports = useQuery(GET_AIRPORTS_RELAY);

  // console.log(tarif);

  const [formData, setFormData] = useState({
    name: tarif?.name || "",
    // В tarif.airports обычно лежит массив объектов вида { id, airport: { ... } }
    // Но иногда бывает, что сам ID хранится внутри. Уточните структуру, если нужно.
    airportIds: tarif?.airports?.map((a) => String(a.airport.id)) || [],
    // Если цены хранятся внутри tarif.prices, берём оттуда
    priceOneCategory: tarif?.prices?.priceOneCategory ?? 0,
    priceTwoCategory: tarif?.prices?.priceTwoCategory ?? 0,
    priceThreeCategory: tarif?.prices?.priceThreeCategory ?? 0,
    priceFourCategory: tarif?.prices?.priceFourCategory ?? 0,
    priceFiveCategory: tarif?.prices?.priceFiveCategory ?? 0,
    priceSixCategory: tarif?.prices?.priceSixCategory ?? 0,
    priceSevenCategory: tarif?.prices?.priceSevenCategory ?? 0,
    priceEightCategory: tarif?.prices?.priceEightCategory ?? 0,
    priceApartment: tarif?.prices?.priceApartment ?? 0,
    priceStudio: tarif?.prices?.priceStudio ?? 0,
    breakfast: tarif?.mealPrice?.breakfast ?? 0,
    dinner: tarif?.mealPrice?.dinner ?? 0,
    lunch: tarif?.mealPrice?.lunch ?? 0,
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
    value: String(airport.id), // используем value вместо id
    label: `${airport.code} ${airport.name} ${airport.city}`,
    city: airport.city,
  }));

  const [tarifNames, setTarifNames] = useState([]);
  const sidebarRef = useRef();

  const resetForm = () => {
    setFormData({
      name: tarif?.name || "",
      // В tarif.airports обычно лежит массив объектов вида { id, airport: { ... } }
      // Но иногда бывает, что сам ID хранится внутри. Уточните структуру, если нужно.
      airportIds: tarif?.airports?.map((a) => String(a.airport.id)) || [],
      // Если цены хранятся внутри tarif.prices, берём оттуда
      priceOneCategory: tarif?.prices?.priceOneCategory ?? 0,
      priceTwoCategory: tarif?.prices?.priceTwoCategory ?? 0,
      priceThreeCategory: tarif?.prices?.priceThreeCategory ?? 0,
      priceFourCategory: tarif?.prices?.priceFourCategory ?? 0,
      priceFiveCategory: tarif?.prices?.priceFiveCategory ?? 0,
      priceSixCategory: tarif?.prices?.priceSixCategory ?? 0,
      priceSevenCategory: tarif?.prices?.priceSevenCategory ?? 0,
      priceEightCategory: tarif?.prices?.priceEightCategory ?? 0,
      priceApartment: tarif?.prices?.priceApartment ?? 0,
      priceStudio: tarif?.prices?.priceStudio ?? 0,
      breakfast: tarif?.mealPrice?.breakfast ?? 0,
      dinner: tarif?.mealPrice?.dinner ?? 0,
      lunch: tarif?.mealPrice?.lunch ?? 0,
    });
  };

  const [isEditing, setIsEditing] = useState(false);

  const closeButton = () => {
    let success = confirm(
      "Вы уверены, все несохраненные данные будут удалены?"
    );
    if (success) {
      resetForm();
      onClose();
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevState) => ({
      ...prevState,
      [name]: value,
    }));
  };

  const handleFileChange = (e) => {
    const files = e.target.files;
    if (files.length > 8) {
      alert("Вы можете загрузить не более 8 изображений.");
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
        resetForm();
        onClose();
        setIsLoading(false);
        addNotification("Добавление договора прошло успешно.", "success");
      } catch (error) {
        setIsLoading(false);
        alert("Произошло ошибка при добавлении тарифа.");
        console.error("Произошла ошибка при выполнении запроса:", error);
      }
    }
    setIsEditing(!isEditing);
  };

  useEffect(() => {
    if (show) {
      resetForm();
      const handleClickOutside = (event) => {
        if (sidebarRef.current && !sidebarRef.current.contains(event.target)) {
          closeButton();
        }
      };
      document.addEventListener("mousedown", handleClickOutside);

      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }
  }, [show]);

  useEffect(() => {
    const names = addTarif.map((tarif) => ({
      id: tarif.id,
      name: tarif.name,
    }));
    setTarifNames(names);
  }, [addTarif]);

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

  // console.log("formData.airportIds:", formData.airportIds);
  // console.log("airportOptions:", airportOptions);
  // console.log("Фильтрация:", airportOptions.filter((option) =>
  //   formData.airportIds.includes(option.value)
  // ));

  return (
    <Sidebar show={show} sidebarRef={sidebarRef}>
      <div className={classes.requestTitle}>
        <div className={classes.requestTitle_name}>Изменить договор</div>
        <div className={classes.requestTitle_close} onClick={closeButton}>
          <img src="/close.png" alt="" />
        </div>
      </div>

      {isLoading ? (
        <MUILoader loadSize={"50px"} fullHeight={"90vh"} />
      ) : (
        <>
          <div className={classes.requestMiddle}>
            <div className={classes.requestData}>
              <label>Название договора</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Например: Договор №1"
                disabled={!isEditing}
              />

              <label>Аэропорты</label>
              <MultiSelectAutocomplete
                isDisabled={!isEditing}
                isMultiple={true}
                dropdownWidth={"100%"}
                label={"Выберите аэропорты"}
                options={airportOptions}
                // Фильтруем options, используя значение поля value (которое совпадает с id)
                value={airportOptions.filter((option) =>
                  formData.airportIds.includes(option.value)
                )}
                onChange={(event, newValue) => {
                  setFormData((prevState) => ({
                    ...prevState,
                    airportIds: newValue.map((option) => option.value),
                  }));
                }}
              />

              <label>Стоимость одноместного</label>
              <input
                type="number"
                name="priceOneCategory"
                value={formData.priceOneCategory}
                onChange={handleChange}
                placeholder="Введите стоимость"
                disabled={!isEditing}
              />

              <label>Стоимость двухместного</label>
              <input
                type="number"
                name="priceTwoCategory"
                value={formData.priceTwoCategory}
                onChange={handleChange}
                placeholder="Введите стоимость"
                disabled={!isEditing}
              />

              <label>Стоимость трехместного</label>
              <input
                type="number"
                name="priceThreeCategory"
                value={formData.priceThreeCategory}
                onChange={handleChange}
                placeholder="Введите стоимость"
                disabled={!isEditing}
              />
              <label>Стоимость четырехместного</label>
              <input
                type="number"
                name="priceFourCategory"
                value={formData.priceFourCategory}
                onChange={handleChange}
                placeholder="Введите стоимость"
                disabled={!isEditing}
              />
              <label>Стоимость пятиместного</label>
              <input
                type="number"
                name="priceFiveCategory"
                value={formData.priceFiveCategory}
                onChange={handleChange}
                placeholder="Введите стоимость"
                disabled={!isEditing}
              />
              <label>Стоимость шестиместного</label>
              <input
                type="number"
                name="priceSixCategory"
                value={formData.priceSixCategory}
                onChange={handleChange}
                placeholder="Введите стоимость"
                disabled={!isEditing}
              />
              <label>Стоимость семиместного</label>
              <input
                type="number"
                name="priceSevenCategory"
                value={formData.priceSevenCategory}
                onChange={handleChange}
                placeholder="Введите стоимость"
                disabled={!isEditing}
              />
              <label>Стоимость восьмиместного</label>
              <input
                type="number"
                name="priceEightCategory"
                value={formData.priceEightCategory}
                onChange={handleChange}
                placeholder="Введите стоимость"
                disabled={!isEditing}
              />
              <label>Стоимость апартаментов</label>
              <input
                type="number"
                name="priceApartment"
                value={formData.priceApartment}
                onChange={handleChange}
                placeholder="Введите стоимость"
                disabled={!isEditing}
              />
              <label>Стоимость студии</label>
              <input
                type="number"
                name="priceStudio"
                value={formData.priceStudio}
                onChange={handleChange}
                placeholder="Введите стоимость"
                disabled={!isEditing}
              />
              <label>Завтрак</label>
              <input
                type="number"
                name="breakfast"
                value={formData.breakfast}
                onChange={handleChange}
                placeholder="Завтрак"
                disabled={!isEditing}
              />
              <label>Обед</label>
              <input
                type="number"
                name="lunch"
                value={formData.lunch}
                onChange={handleChange}
                placeholder="Обед"
                disabled={!isEditing}
              />
              <label>Ужин</label>
              <input
                type="number"
                name="dinner"
                value={formData.dinner}
                onChange={handleChange}
                placeholder="Ужин"
                disabled={!isEditing}
              />
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

export default EditRequestAirlineTarifCategory;
