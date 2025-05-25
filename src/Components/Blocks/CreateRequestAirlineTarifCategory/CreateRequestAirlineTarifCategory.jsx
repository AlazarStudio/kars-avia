import React, { useState, useRef, useEffect } from "react";
import classes from "./CreateRequestAirlineTarifCategory.module.css";
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
function CreateRequestAirlineTarifCategory({
  show,
  id,
  onClose,
  addTarif,
  setAddTarif,
  user,
  type,
  addNotification,
}) {
  const token = getCookie("token");
  const infoAirports = useQuery(GET_AIRPORTS_RELAY);

  const [formData, setFormData] = useState({
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
    label: `${airport.code} ${airport.name} ${airport.city}`,
    id: airport.id,
    city: airport.city,
    // можно добавить и другие свойства, если понадобится
  }));

  // console.log(airportOptions);

  const [tarifNames, setTarifNames] = useState([]);
  const sidebarRef = useRef();

  const resetForm = () => {
    setFormData({
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
      priceApartment: 0,
      priceStudio: 0,
      breakfast: 0,
      dinner: 0,
      lunch: 0,
    });
  };

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
    e.preventDefault();
    setIsLoading(true);

    try {
      let response_update_tariff = await updateAirlineTariff({
        variables: {
          updateAirlineId: id,
          input: {
            prices: [
              {
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
      resetForm();
      onClose();
      setIsLoading(false);
      addNotification("Добавление договора прошло успешно.", "success");
    } catch (error) {
      setIsLoading(false);
      alert("Произошло ошибка при добавлении тарифа.");
      console.error("Произошла ошибка при выполнении запроса:", error);
    }
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

  // console.log(formData)

  return (
    <Sidebar show={show} sidebarRef={sidebarRef}>
      <div className={classes.requestTitle}>
        <div className={classes.requestTitle_name}>Добавить тариф</div>
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
              <MultiSelectAutocomplete
                isMultiple={true}
                dropdownWidth={"100%"}
                label={"Выберите аэропорты"}
                options={airportOptions}
                value={airportOptions.filter((option) =>
                  formData.airportIds?.includes(option.id)
                )}
                onChange={(event, newValue) => {
                  setFormData((prevFormData) => ({
                    ...prevFormData,
                    airportIds: newValue.map((option) => option.id),
                    // city: newValue.length > 0 ? newValue[0].city : "",
                  }));
                  // setIsEdited(true);
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
              <label>Стоимость люкса</label>
              <input
                type="number"
                name="priceEightCategory"
                value={formData.priceLuxe}
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
