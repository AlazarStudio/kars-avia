import React, { useState, useRef, useEffect, useCallback } from "react";
import classes from "./CreateRequestAdditionalServices.module.css";
import Button from "../../Standart/Button/Button.jsx";
import Sidebar from "../Sidebar/Sidebar.jsx";

import { getCookie, UPDATE_HOTEL_TARIF } from "../../../../graphQL_requests.js";
import { useMutation, useQuery } from "@apollo/client";
import MUIAutocomplete from "../MUIAutocomplete/MUIAutocomplete.jsx";
import MUILoader from "../MUILoader/MUILoader.jsx";
import TextEditor from "../TextEditor/TextEditor.jsx";
import CloseIcon from "../../../shared/icons/CloseIcon.jsx";
import { useDialog } from "../../../contexts/DialogContext";
import { useToast } from "../../../contexts/ToastContext";

const REQUIRED_FIELDS_MESSAGE =
  "Пожалуйста, заполните все обязательные поля.";

function CreateRequestAdditionalServices({
  show,
  id,
  onClose,
  user,
}) {
  const token = getCookie("token");
  const { confirm, showAlert, isDialogOpen } = useDialog();
  const { success, error: notifyError } = useToast();

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
  const [isEdited, setIsEdited] = useState(false);

  const resetForm = useCallback(() => {
    setFormData({
      name: "",
      price: "",
      priceForAirline: "",
    });
    setIsEdited(false);
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


  const [isLoading, setIsLoading] = useState(false);

  const isFormValid = () => {
    const nameTrim = String(formData.name ?? "").trim();
    if (!nameTrim) return false;

    const priceNum = parseFloat(formData.price);
    if (
      formData.price === "" ||
      formData.price === null ||
      Number.isNaN(priceNum)
    ) {
      return false;
    }

    if (!user?.hotelId) {
      const airlineNum = parseFloat(formData.priceForAirline);
      if (
        formData.priceForAirline === "" ||
        formData.priceForAirline === null ||
        Number.isNaN(airlineNum)
      ) {
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!isFormValid()) {
      showAlert(REQUIRED_FIELDS_MESSAGE);
      return;
    }

    const nameTrim = String(formData.name ?? "").trim();
    const priceNum = parseFloat(formData.price);
    const priceForAirlineNum = parseFloat(formData.priceForAirline);

    setIsLoading(true);

    try {
      let response_update_tarif = await updateHotelTarif({
        variables: {
          updateHotelId: id,
          input: {
            additionalServices: [
              {
                name: nameTrim,
                price: priceNum,
                priceForAirline: priceForAirlineNum,
              },
            ],
          },
        },
      });
      resetForm();
      onClose();
      setIsLoading(false);
      success("Добавление доп услуги прошло успешно.");
    } catch (error) {
      setIsLoading(false);
      notifyError("Произошла ошибка при добавлении доп услуги.");
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