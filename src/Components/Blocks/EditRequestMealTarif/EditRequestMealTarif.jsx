import React, { useState, useRef, useEffect, useCallback } from "react";
import classes from "./EditRequestMealTarif.module.css";
import Button from "../../Standart/Button/Button.jsx";
import Sidebar from "../Sidebar/Sidebar.jsx";
import CloseIcon from "../../../shared/icons/CloseIcon.jsx";
import AdditionalMenu from "../../Standart/AdditionalMenu/AdditionalMenu.jsx";
import {
  getCookie,
  UPDATE_AIRLINE_MEAL_TARIF,
  UPDATE_HOTEL_MEAL_TARIF,
} from "../../../../graphQL_requests.js";
import { useMutation } from "@apollo/client";
import MUILoader from "../MUILoader/MUILoader.jsx";
import { useDialog } from "../../../contexts/DialogContext";
import { useToast } from "../../../contexts/ToastContext";

function EditRequestMealTarif({
  show,
  user,
  onClose,
  mealPrices,
  mealPricesAirline,
  onSubmit,
  id,
  isHotel,
}) {
  const token = getCookie("token");
  const { confirm, isDialogOpen } = useDialog();
  const { success, error: notifyError } = useToast();

  const [isEditing, setIsEditing] = useState(false);
  const [isEdited, setIsEdited] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [formData, setFormData] = useState({
    breakfast: "",
    lunch: "",
    dinner: "",
    breakfastForAirline: "",
    lunchForAirline: "",
    dinnerForAirline: "",
  });

  const sidebarRef = useRef();
  const menuRef = useRef(null);
  const [anchorEl, setAnchorEl] = useState(null);

  const resetForm = useCallback(() => {
    setFormData({
      breakfast: mealPrices?.breakfast ?? "",
      lunch: mealPrices?.lunch ?? "",
      dinner: mealPrices?.dinner ?? "",
      breakfastForAirline: mealPricesAirline?.breakfast ?? "",
      lunchForAirline: mealPricesAirline?.lunch ?? "",
      dinnerForAirline: mealPricesAirline?.dinner ?? "",
    });
    setIsEdited(false);
  }, [mealPrices, mealPricesAirline]);

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

  useEffect(() => {
    if (show) {
      setFormData({
        breakfast: mealPrices?.breakfast ?? "",
        lunch: mealPrices?.lunch ?? "",
        dinner: mealPrices?.dinner ?? "",
        breakfastForAirline: mealPricesAirline?.breakfast ?? "",
        lunchForAirline: mealPricesAirline?.lunch ?? "",
        dinnerForAirline: mealPricesAirline?.dinner ?? "",
      });
      setIsEdited(false);
      setIsEditing(true);
    }
  }, [show, mealPrices, mealPricesAirline]);

  const closeButton = useCallback(async () => {
    if (isDialogOpen) return;
    setAnchorEl(null);

    if (!isEdited) {
      resetForm();
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

  const handleMenuOpen = (e) => setAnchorEl(e.currentTarget);
  const handleMenuClose = () => setAnchorEl(null);
  const handleEditFromMenu = () => {
    handleMenuClose();
    setIsEditing(true);
  };
  const handleCancelEdit = () => {
    resetForm();
    setIsEditing(false);
  };

  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    setIsEdited(true);
    setFormData((prevState) => ({
      ...prevState,
      [name]: value,
    }));
  }, []);

  const handleSubmit = async (e) => {
    if (!isEditing) return;
    e.preventDefault();
    setIsLoading(true);

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

      const updateId = isHotel ? "updateHotelId" : "updateAirlineId";

      const response = await updateHotelMealTarif({
        variables: {
          [updateId]: id,
          input: dataSend,
        },
      });

      if (response) {
        onSubmit(
          isHotel
            ? response.data.updateHotel.mealPrice
            : response.data.updateAirline.mealPrice
        );
        resetForm();
        onClose();
        setIsLoading(false);
        setIsEditing(false);
        success("Редактирование прошло успешно.");
      }
    } catch (error) {
      console.error("Catch: ", error);
      setIsLoading(false);
      notifyError("Не удалось сохранить цены на питание.");
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

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [show, closeButton, anchorEl, isDialogOpen]);

  const renderRow = (label, name, value) => (
    <div className={classes.requestDataInfo}>
      <div className={classes.requestDataInfo_title}>{label}</div>
      {isEditing ? (
        <input
          type="number"
          name={name}
          value={value}
          onChange={handleChange}
        />
      ) : (
        <div className={classes.requestDataInfo_desc}>
          {value !== "" && value != null ? value : "—"}
        </div>
      )}
    </div>
  );

  return (
    <Sidebar show={show} sidebarRef={sidebarRef}>
      <div className={classes.requestTitle}>
        <div className={classes.requestTitle_name}>
          Редактировать цены на питание
        </div>
        <div className={classes.requestTitle_close}>
          <AdditionalMenu
            anchorEl={anchorEl}
            onOpen={handleMenuOpen}
            onClose={handleMenuClose}
            menuRef={menuRef}
            onEdit={handleEditFromMenu}
          />
          <div className={classes.closeIconWrapper} onClick={closeButton}>
            <CloseIcon />
          </div>
        </div>
      </div>

      {isLoading ? (
        <MUILoader loadSize={"50px"} fullHeight={"85vh"} />
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
              <div className={classes.groupBlock}>
                <div className={classes.groupTitle}>Цены по договору</div>
                {renderRow("Завтрак", "breakfast", formData.breakfast)}
                {renderRow("Обед", "lunch", formData.lunch)}
                {renderRow("Ужин", "dinner", formData.dinner)}
              </div>

              {user?.hotelId ? null : (
                <div className={classes.groupBlock}>
                  <div className={classes.groupTitle}>Цены для АК</div>
                  {renderRow(
                    "Завтрак",
                    "breakfastForAirline",
                    formData.breakfastForAirline
                  )}
                  {renderRow(
                    "Обед",
                    "lunchForAirline",
                    formData.lunchForAirline
                  )}
                  {renderRow(
                    "Ужин",
                    "dinnerForAirline",
                    formData.dinnerForAirline
                  )}
                </div>
              )}
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

export default EditRequestMealTarif;
