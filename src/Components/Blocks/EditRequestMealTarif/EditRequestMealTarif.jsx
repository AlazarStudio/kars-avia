import React, { useState, useRef, useEffect } from "react";
import classes from "./EditRequestMealTarif.module.css";
import Button from "../../Standart/Button/Button.jsx";
import Sidebar from "../Sidebar/Sidebar.jsx";
import {
  getCookie,
  UPDATE_AIRLINE_MEAL_TARIF,
  UPDATE_HOTEL_MEAL_TARIF,
} from "../../../../graphQL_requests.js";
import { useMutation } from "@apollo/client";

function EditRequestMealTarif({
  show,
  onClose,
  mealPrices,
  onSubmit,
  id,
  isHotel,
}) {
  const token = getCookie("token");

  const [formData, setFormData] = useState({
    breakfast: "",
    lunch: "",
    dinner: "",
  });

  const resetForm = () => {
    setFormData({
      breakfast: "",
      lunch: "",
      dinner: "",
    });
  };

  const [updateHotelMealTarif] = useMutation(
    isHotel ? UPDATE_HOTEL_MEAL_TARIF : UPDATE_AIRLINE_MEAL_TARIF,
    {
      context: {
        headers: {
          Authorization: `Bearer ${token}`,
          "Apollo-Require-Preflight": "true",
        },
      },
    }
  );

  const sidebarRef = useRef();

  useEffect(() => {
    if (show && mealPrices) {
      setFormData({
        breakfast: mealPrices.breakfast || "",
        lunch: mealPrices.lunch || "",
        dinner: mealPrices.dinner || "",
      });
    }
  }, [show, mealPrices]);

  const closeButton = () => {
    let success = confirm("Вы уверены, все несохраненные данные будут удалены");
    if (success) {
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

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (
      !String(formData.breakfast).trim() ||
      !String(formData.lunch).trim() ||
      !String(formData.dinner).trim()
    ) {
      alert("Пожалуйста, заполните все поля!");
      return;
    }

    const dataSend = {
      MealPrice: {
        breakfast: Number(formData.breakfast),
        lunch: Number(formData.lunch),
        dinner: Number(formData.dinner),
      },
    };

    let updateId = isHotel ? "updateHotelId" : "updateAirlineId";

    let response_update_meal_tarif = await updateHotelMealTarif({
      variables: {
        [updateId]: id,
        input: dataSend, // передаем MealPrice
      },
    });

    if (response_update_meal_tarif) {
      onSubmit(
        isHotel
          ? response_update_meal_tarif.data.updateHotel.MealPrice
          : response_update_meal_tarif.data.updateAirline.MealPrice
      );
      resetForm();
      onClose();
    }
  };

  useEffect(() => {
    if (show) {
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

  return (
    <Sidebar show={show} sidebarRef={sidebarRef}>
      <div className={classes.requestTitle}>
        <div className={classes.requestTitle_name}>
          Редактировать цены на питание
        </div>
        <div className={classes.requestTitle_close} onClick={closeButton}>
          <img src="/close.png" alt="" />
        </div>
      </div>

      <div className={classes.requestMiddle}>
        <div className={classes.requestData}>
          <label>Цена завтрака</label>
          <input
            type="number"
            name="breakfast"
            value={formData.breakfast}
            onChange={handleChange}
          />
          <label>Цена обеда</label>
          <input
            type="number"
            name="lunch"
            value={formData.lunch}
            onChange={handleChange}
          />
          <label>Цена ужина</label>
          <input
            type="number"
            name="dinner"
            value={formData.dinner}
            onChange={handleChange}
          />
        </div>
      </div>

      <div className={classes.requestButton}>
        <Button type="submit" onClick={handleSubmit}>
          Изменить
        </Button>
      </div>
    </Sidebar>
  );
}

export default EditRequestMealTarif;
