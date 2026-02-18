import React, { useState, useRef, useEffect } from "react";
import classes from "./CreateRequestAdditionalServices.module.css";
import Button from "../../Standart/Button/Button.jsx";
import Sidebar from "../Sidebar/Sidebar.jsx";

import { getCookie, UPDATE_HOTEL_TARIF } from "../../../../graphQL_requests.js";
import { useMutation, useQuery } from "@apollo/client";
import MUIAutocomplete from "../MUIAutocomplete/MUIAutocomplete.jsx";
import MUILoader from "../MUILoader/MUILoader.jsx";
import TextEditor from "../TextEditor/TextEditor.jsx";
import CloseIcon from "../../../shared/icons/CloseIcon.jsx";
function CreateRequestAdditionalServices({
  show,
  id,
  onClose,
  user,
  addNotification,
}) {
  const token = getCookie("token");

  const [formData, setFormData] = useState({
    name: "",
    price: "",
    priceForAirline: "",
  });

  const [updateHotelTarif] = useMutation(UPDATE_HOTEL_TARIF, {
    context: {
      headers: {
        Authorization: `Bearer ${token}`,
        "Apollo-Require-Preflight": "true",
      },
    },
  });

  const sidebarRef = useRef();

  const resetForm = () => {
    setFormData({
      name: "",
      price: "",
      priceForAirline: "",
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


  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      let response_update_tarif = await updateHotelTarif({
        variables: {
          updateHotelId: id,
          input: {
            additionalServices: [
              {
                name: formData.name,
                price: parseFloat(formData.price),
                priceForAirline: parseFloat(formData.priceForAirline),
              },
            ],
          },
        },
      });
      resetForm();
      onClose();
      setIsLoading(false);
      addNotification("Добавление доп услуги прошло успешно.", "success");
    } catch (error) {
      setIsLoading(false);
      alert("Произошло ошибка при добавлении доп услуги.");
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

  return (
    <Sidebar show={show} sidebarRef={sidebarRef}>
      <div className={classes.requestTitle}>
        <div className={classes.requestTitle_name}>Добавить доп услугу</div>
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
              <label>Название доп услуги</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder=""
              />

              <label>Стоимость</label>
              <input
                type="number"
                name="price"
                value={formData.price}
                onChange={handleChange}
                placeholder="Введите стоимость"
              />
              {!user?.hotelId && (
                <>
                  <label>Стоимость для авиакомпании</label>
                  <input
                    type="number"
                    name="priceForAirline"
                    value={formData.priceForAirline}
                    onChange={handleChange}
                    placeholder="Введите стоимость для авиакомпании"
                  />
                </>
              )}

            </div>
          </div>
          <div className={classes.requestButton}>
            <Button type="submit" onClick={handleSubmit}>
              Добавить доп услугу
            </Button>
          </div>
        </>
      )}
    </Sidebar>
  );
}

export default CreateRequestAdditionalServices;