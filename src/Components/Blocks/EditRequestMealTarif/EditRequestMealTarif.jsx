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
  mealPriceForAirReq = false,
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
    lunchbox: "",
    breakfastForAirline: "",
    lunchForAirline: "",
    dinnerForAirline: "",
    lunchboxForAirline: "",
    mealPriceForAirReq: false,
  });

  const sidebarRef = useRef();
  const menuRef = useRef(null);
  const [anchorEl, setAnchorEl] = useState(null);

  const resetForm = useCallback(() => {
    setFormData({
      breakfast: mealPrices?.breakfast ?? "",
      lunch: mealPrices?.lunch ?? "",
      dinner: mealPrices?.dinner ?? "",
      lunchbox: mealPrices?.lunchbox ?? "",
      breakfastForAirline: mealPricesAirline?.breakfast ?? "",
      lunchForAirline: mealPricesAirline?.lunch ?? "",
      dinnerForAirline: mealPricesAirline?.dinner ?? "",
      lunchboxForAirline: mealPricesAirline?.lunchbox ?? "",
      mealPriceForAirReq: Boolean(mealPriceForAirReq),
    });
    setIsEdited(false);
  }, [mealPrices, mealPricesAirline, mealPriceForAirReq]);

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
        lunchbox: mealPrices?.lunchbox ?? "",
        breakfastForAirline: mealPricesAirline?.breakfast ?? "",
        lunchForAirline: mealPricesAirline?.lunch ?? "",
        dinnerForAirline: mealPricesAirline?.dinner ?? "",
        lunchboxForAirline: mealPricesAirline?.lunchbox ?? "",
        mealPriceForAirReq: Boolean(mealPriceForAirReq),
      });
      setIsEdited(false);
      setIsEditing(true);
    }
  }, [show, mealPrices, mealPricesAirline, mealPriceForAirReq]);

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
      const byReq = Boolean(formData.mealPriceForAirReq);
      const dataSend = {
        mealPrice: {
          breakfast: Number(formData.breakfast) || 0,
          lunch: Number(formData.lunch) || 0,
          dinner: Number(formData.dinner) || 0,
          lunchbox: Number(formData.lunchbox) || 0,
        },
        ...(isHotel
          ? {
              mealPriceForAir: byReq
                ? { breakfast: 0, lunch: 0, dinner: 0, lunchbox: 0 }
                : {
                    breakfast: Number(formData.breakfastForAirline) || 0,
                    lunch: Number(formData.lunchForAirline) || 0,
                    dinner: Number(formData.dinnerForAirline) || 0,
                    lunchbox: Number(formData.lunchboxForAirline) || 0,
                  },
              mealPriceForAirReq: byReq,
            }
          : {
              mealPriceForAir: {
                breakfast: Number(formData.breakfastForAirline) || 0,
                lunch: Number(formData.lunchForAirline) || 0,
                dinner: Number(formData.dinnerForAirline) || 0,
                lunchbox: Number(formData.lunchboxForAirline) || 0,
              },
            }),
      };

      const updateId = isHotel ? "updateHotelId" : "updateAirlineId";

      const response = await updateHotelMealTarif({
        variables: {
          [updateId]: id,
          input: dataSend,
        },
      });

      if (response) {
        if (isHotel) {
          onSubmit({
            mealPrice: response.data.updateHotel.mealPrice,
            mealPriceForAir: response.data.updateHotel.mealPriceForAir,
            mealPriceForAirReq:
              response.data.updateHotel.mealPriceForAirReq ?? byReq,
          });
        } else {
          onSubmit(response.data.updateAirline.mealPrice);
        }
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

  const renderRow = (label, name, value, opts = {}) => (
    <div className={classes.requestDataInfo}>
      <div className={classes.requestDataInfo_title}>{label}</div>
      {isEditing ? (
        <input
          type="number"
          name={name}
          value={value}
          onChange={handleChange}
          disabled={Boolean(opts.disabled)}
        />
      ) : (
        <div className={classes.requestDataInfo_desc}>
          {opts.byRequest
            ? "По запросу"
            : value !== "" && value != null
              ? value
              : "—"}
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
                {renderRow("Ланчбокс", "lunchbox", formData.lunchbox)}
              </div>

              {user?.hotelId ? null : (
                <div className={classes.groupBlock}>
                  <div className={classes.groupTitle}>Цены для АК</div>
                  {renderRow(
                    "Завтрак",
                    "breakfastForAirline",
                    formData.breakfastForAirline,
                    {
                      disabled: formData.mealPriceForAirReq,
                      byRequest: formData.mealPriceForAirReq,
                    }
                  )}
                  {renderRow(
                    "Обед",
                    "lunchForAirline",
                    formData.lunchForAirline,
                    {
                      disabled: formData.mealPriceForAirReq,
                      byRequest: formData.mealPriceForAirReq,
                    }
                  )}
                  {renderRow(
                    "Ужин",
                    "dinnerForAirline",
                    formData.dinnerForAirline,
                    {
                      disabled: formData.mealPriceForAirReq,
                      byRequest: formData.mealPriceForAirReq,
                    }
                  )}
                  {renderRow(
                    "Ланчбокс",
                    "lunchboxForAirline",
                    formData.lunchboxForAirline,
                    {
                      disabled: formData.mealPriceForAirReq,
                      byRequest: formData.mealPriceForAirReq,
                    }
                  )}
                  {isHotel && isEditing && (
                    <div className={classes.requestDataInfo}>
                      <div className={classes.requestDataInfo_title}>
                        Стоимость по запросу
                      </div>
                      <input
                        type="checkbox"
                        checked={Boolean(formData.mealPriceForAirReq)}
                        onChange={(e) => {
                          setIsEdited(true);
                          setFormData((prev) => ({
                            ...prev,
                            mealPriceForAirReq: e.target.checked,
                          }));
                        }}
                      />
                    </div>
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
