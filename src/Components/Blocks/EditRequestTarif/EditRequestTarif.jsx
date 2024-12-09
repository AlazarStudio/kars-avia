import React, { useState, useRef, useEffect } from "react";
import classes from "./EditRequestTarif.module.css";
import Button from "../../Standart/Button/Button";
import Sidebar from "../Sidebar/Sidebar";

import {
  getCookie,
  UPDATE_AIRLINE_TARIF,
  UPDATE_HOTEL_TARIF,
} from "../../../../graphQL_requests.js";
import { useMutation, useQuery } from "@apollo/client";

function EditRequestTarif({
  show,
  onClose,
  tarif,
  onSubmit,
  id,
  setAddTarif,
  isHotel,
}) {
  const token = getCookie("token");

  const [formData, setFormData] = useState({
    name: "",
    price: "",
    type: "",
  });

  const resetForm = () => {
    setFormData({
      name: "",
      price: "",
      type: "",
    });
  };

  const [updateHotelTarif] = useMutation(
    isHotel ? UPDATE_HOTEL_TARIF : UPDATE_AIRLINE_TARIF,
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
    if (show && tarif) {
      setFormData({
        ...formData,
        name: tarif.name,
        price: tarif.price,
        type: tarif.type,
      });
    }
  }, [show, tarif]);

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

    console.log(formData);
    // Проверяем, заполнены ли все поля
    if (!formData.name.trim() || !formData.price.trim() || !formData.type) {
      alert("Пожалуйста, заполните все поля!");
      return;
    }

    let dataSend;

    if (formData.type == 1) {
      dataSend = {
        priceOneCategory: Number(formData.price),
      };
    }

    if (formData.type == 2) {
      dataSend = {
        priceTwoCategory: Number(formData.price),
      };
    }

    let updateId = isHotel ? "updateHotelId" : "updateAirlineId";

    let response_update_tarif = await updateHotelTarif({
      variables: {
        [updateId]: id,
        input: dataSend,
      },
    });


    if (response_update_tarif) {
      onSubmit([
        {
          name: "Одноместный",
          price: isHotel
            ? response_update_tarif.data.updateHotel.priceOneCategory
            : response_update_tarif.data.updateAirline.priceOneCategory,
          type: 1,
        },
        {
          name: "Двухместный",
          price: isHotel
            ? response_update_tarif.data.updateHotel.priceTwoCategory
            : response_update_tarif.data.updateAirline.priceTwoCategory,
          type: 2,
        },
      ]);
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
        <div className={classes.requestTitle_name}>Редактировать тариф</div>
        <div className={classes.requestTitle_close} onClick={closeButton}>
          <img src="/close.png" alt="" />
        </div>
      </div>

      <div className={classes.requestMiddle}>
        <div className={classes.requestData}>
          <label>Название категории</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            disabled
          />
          <label>Цена категории</label>
          <input
            type="text"
            name="price"
            value={formData.price}
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

export default EditRequestTarif;
