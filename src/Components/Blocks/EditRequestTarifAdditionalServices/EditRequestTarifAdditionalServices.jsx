import React, { useState, useRef, useEffect, useCallback } from "react";
import classes from "./EditRequestTarifAdditionalServices.module.css";
import Button from "../../Standart/Button/Button.jsx";
import Sidebar from "../Sidebar/Sidebar.jsx";

import { getCookie, UPDATE_HOTEL_TARIF } from "../../../../graphQL_requests.js";
import { useMutation, useQuery } from "@apollo/client";
import MUILoader from "../MUILoader/MUILoader.jsx";
import { useDialog } from "../../../contexts/DialogContext";
import { useToast } from "../../../contexts/ToastContext";

function EditRequestTarifAdditionalServices({
  show,
  onClose,
  tarif,
  id,
  user,
  type,
}) {
  const token = getCookie("token");
  const { confirm, isDialogOpen } = useDialog();
  const { success, error: notifyError } = useToast();

  const [formData, setFormData] = useState({
    images: null,
  });

  const sidebarRef = useRef();

  const [updateHotelTarif] = useMutation(UPDATE_HOTEL_TARIF, {
    context: {
      headers: {
        Authorization: `Bearer ${token}`,
        "Apollo-Require-Preflight": "true",
      },
    },
  });

  const [isEditing, setIsEditing] = useState(false);
  const [isEdited, setIsEdited] = useState(false);

  useEffect(() => {
    if (show && tarif) {
      setFormData({ ...tarif, images: null });
      setIsEdited(false);
      setIsEditing(false);
    }
  }, [show, tarif]);

  const resetForm = useCallback(() => {
    if (tarif) {
      setFormData({ ...tarif, images: null });
    }
    setIsEdited(false);
  }, [tarif]);

  const closeButton = useCallback(async () => {
    if (isDialogOpen) return;

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
  }, [confirm, isDialogOpen, isEdited, onClose, resetForm]);

  const handleChange = (e) => {
    if (!isEditing) return;
    const { name, value } = e.target;
    setIsEdited(true);
    setFormData((prevState) => ({
      ...prevState,
      [name]: value,
    }));
  };

  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    if (isEditing) {
      e.preventDefault();
      setIsLoading(true);

      try {
        const response_update_tarif = await updateHotelTarif({
          variables: {
            updateHotelId: id,
            input: {
              additionalServices: [
                {
                  id: formData.id,
                  name: formData.name,
                  price: parseFloat(formData.price),
                  priceForAirline: parseFloat(formData.priceForAirline),
                },
              ],
            },
          },
        });

        // Сброс состояний после успешного обновления
        onClose();
        // refetch();
        setIsLoading(false);
        setFormData((prev) => ({ ...prev, images: null }));
        success("Редактирование доп. услуги прошло успешно.");
      } catch (error) {
        setIsLoading(false);
        console.error("Ошибка при обновлении тарифа:", error);
        notifyError("Не удалось обновить доп. услугу.");
      }
    }
    setIsEditing(!isEditing);
  };

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
        <div className={classes.requestTitle_name}>Редактировать доп услугу</div>
        <div className={classes.requestTitle_close} onClick={closeButton}>
          <img src="/close.png" alt="close" />
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
                value={formData.name || ""}
                onChange={handleChange}
                placeholder=""
                disabled={!isEditing}
              />

              <label>Стоимость</label>
              <input
                type="number"
                name="price"
                value={formData.price || 0}
                onChange={handleChange}
                placeholder="Введите стоимость"
                disabled={!isEditing}
              />
              {!user?.hotelId && (
                <>
                  <label>Стоимость для авиакомпании</label>
                  <input
                    type="number"
                    name="priceForAirline"
                    value={formData.priceForAirline || 0}
                    onChange={handleChange}
                    placeholder="Введите стоимость"
                    disabled={!isEditing}
                  />
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

export default EditRequestTarifAdditionalServices;
