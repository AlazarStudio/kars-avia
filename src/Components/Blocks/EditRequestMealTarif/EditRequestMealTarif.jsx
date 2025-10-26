import React, { useState, useRef, useEffect, useCallback } from "react";
import classes from "./EditRequestMealTarif.module.css";
import Button from "../../Standart/Button/Button.jsx";
import Sidebar from "../Sidebar/Sidebar.jsx";
import {
  getCookie,
  UPDATE_AIRLINE_MEAL_TARIF,
  UPDATE_HOTEL_MEAL_TARIF,
} from "../../../../graphQL_requests.js";
import { useMutation } from "@apollo/client";
import MUILoader from "../MUILoader/MUILoader.jsx";

function EditRequestMealTarif({
  show,
  user,
  onClose,
  mealPrices,
  mealPricesAirline,
  onSubmit,
  id,
  isHotel,
  addNotification,
}) {
  const token = getCookie("token");

  const [isEdited, setIsEdited] = useState(false); // Флаг, указывающий, были ли изменения в форме
  const [formData, setFormData] = useState({
    breakfast: "",
    lunch: "",
    dinner: "",
    breakfastForAirline: "",
    lunchForAirline: "",
    dinnerForAirline: "",
  });

  const resetForm = useCallback(() => {
    setFormData({
      breakfast: mealPrices?.breakfast || "",
      lunch: mealPrices?.lunch || "",
      dinner: mealPrices?.dinner || "",
      breakfastForAirline: mealPricesAirline?.breakfast || "",
      lunchForAirline: mealPricesAirline?.lunch || "",
      dinnerForAirline: mealPricesAirline?.dinner || "",
    });
    setIsEdited(false); // Сброс флага изменений
  }, []);

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
    if (show && mealPrices && mealPricesAirline) {
      setFormData({
        breakfast: mealPrices.breakfast || "",
        lunch: mealPrices.lunch || "",
        dinner: mealPrices.dinner || "",
        breakfastForAirline: mealPricesAirline?.breakfast || "",
        lunchForAirline: mealPricesAirline?.lunch || "",
        dinnerForAirline: mealPricesAirline?.dinner || "",
      });
    }
  }, [show, mealPrices, mealPricesAirline]);

  const [isEditing, setIsEditing] = useState(false);

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
  }, [isEdited, onClose]);

  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    setIsEdited(true); // Устанавливаем флаг изменений при любом изменении
    setFormData((prevState) => ({
      ...prevState,
      [name]: value,
    }));
  }, []);

  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    if (isEditing) {
      e.preventDefault();
      setIsLoading(true);

      if (
        !String(formData.breakfast).trim() ||
        !String(formData.lunch).trim() ||
        !String(formData.dinner).trim() ||
        !String(formData.breakfastForAirline).trim() ||
        !String(formData.lunchForAirline).trim() ||
        !String(formData.dinnerForAirline).trim()
      ) {
        alert("Пожалуйста, заполните все поля!");
        setIsLoading(false);
        return;
      }

      try {
        const dataSend = {
          mealPrice: {
            breakfast: Number(formData.breakfast),
            lunch: Number(formData.lunch),
            dinner: Number(formData.dinner),
          },
          mealPriceForAir: {
            breakfast: Number(formData.breakfastForAirline),
            lunch: Number(formData.lunchForAirline),
            dinner: Number(formData.dinnerForAirline),
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
              ? response_update_meal_tarif.data.updateHotel.mealPrice
              : response_update_meal_tarif.data.updateAirline.mealPrice
          );
          resetForm();
          onClose();
          setIsLoading(false);
          addNotification("Редактирование прошло успешно.", "success");
        }
      } catch (error) {
        console.error("Catch: ", error);
        setIsLoading(false);
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
        <div className={classes.requestTitle_name}>
          Редактировать цены на питание
        </div>
        <div className={classes.requestTitle_close} onClick={closeButton}>
          <img src="/close.png" alt="" />
        </div>
      </div>

      {isLoading ? (
        <MUILoader loadSize={"50px"} fullHeight={"85vh"} />
      ) : (
        <>
          <div className={classes.requestMiddle}>
            <div className={classes.requestData}>
              <label>Цены по договору</label>

              <div className={classes.requestDataInputs}>
                <div className={classes.inputWrapper}>
                  <label>Завтрак</label>
                  <input
                    type="number"
                    name="breakfast"
                    value={formData.breakfast}
                    onChange={handleChange}
                    disabled={!isEditing}
                  />
                </div>
                <div className={classes.inputWrapper}>
                  <label>Обед</label>
                  <input
                    type="number"
                    name="lunch"
                    value={formData.lunch}
                    onChange={handleChange}
                    disabled={!isEditing}
                  />
                </div>
                <div className={classes.inputWrapper}>
                  <label>Ужин</label>
                  <input
                    type="number"
                    name="dinner"
                    value={formData.dinner}
                    onChange={handleChange}
                    disabled={!isEditing}
                  />
                </div>
              </div>

              {user?.hotelId ? null : (
                <>
                  <label>Цены для АК</label>
                  <div className={classes.requestDataInputs}>
                    <div className={classes.inputWrapper}>
                      <label>Завтрак</label>
                      <input
                        type="number"
                        name="breakfastForAirline"
                        value={formData.breakfastForAirline}
                        onChange={handleChange}
                        disabled={!isEditing}
                      />
                    </div>
                    <div className={classes.inputWrapper}>
                      <label>Обед</label>
                      <input
                        type="number"
                        name="lunchForAirline"
                        value={formData.lunchForAirline}
                        onChange={handleChange}
                        disabled={!isEditing}
                      />
                    </div>
                    <div className={classes.inputWrapper}>
                      <label>Ужин</label>
                      <input
                        type="number"
                        name="dinnerForAirline"
                        value={formData.dinnerForAirline}
                        onChange={handleChange}
                        disabled={!isEditing}
                      />
                    </div>
                  </div>
                </>
              )}
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

export default EditRequestMealTarif;
