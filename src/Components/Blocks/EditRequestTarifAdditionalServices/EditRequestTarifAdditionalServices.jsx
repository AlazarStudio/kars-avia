import React, { useState, useRef, useEffect, useCallback } from "react";
import classes from "./EditRequestTarifAdditionalServices.module.css";
import Button from "../../Standart/Button/Button.jsx";
import Sidebar from "../Sidebar/Sidebar.jsx";
import CloseIcon from "../../../shared/icons/CloseIcon.jsx";
import AdditionalMenu from "../../Standart/AdditionalMenu/AdditionalMenu.jsx";

import { getCookie, UPDATE_HOTEL_TARIF } from "../../../../graphQL_requests.js";
import { useMutation } from "@apollo/client";
import MUILoader from "../MUILoader/MUILoader.jsx";
import { useDialog } from "../../../contexts/DialogContext";
import { useToast } from "../../../contexts/ToastContext";

function EditRequestTarifAdditionalServices({
  show,
  onClose,
  tarif,
  id,
  user,
  openDelete,
}) {
  const token = getCookie("token");
  const { confirm, isDialogOpen } = useDialog();
  const { success, error: notifyError } = useToast();

  const [formData, setFormData] = useState({});
  const [isEditing, setIsEditing] = useState(false);
  const [isEdited, setIsEdited] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const sidebarRef = useRef();
  const menuRef = useRef(null);
  const [anchorEl, setAnchorEl] = useState(null);

  const [updateHotelTarif] = useMutation(UPDATE_HOTEL_TARIF, {
    context: {
      headers: {
        Authorization: `Bearer ${token}`,
        "Apollo-Require-Preflight": "true",
      },
    },
  });

  useEffect(() => {
    if (show && tarif && !isEditing) {
      setFormData({ ...tarif });
      setIsEdited(false);
    }
  }, [show, tarif, isEditing]);

  const resetForm = useCallback(() => {
    if (tarif) setFormData({ ...tarif });
    setIsEdited(false);
  }, [tarif]);

  const closeButton = useCallback(async () => {
    if (isDialogOpen) return;
    setAnchorEl(null);

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

  const handleMenuOpen = (e) => setAnchorEl(e.currentTarget);
  const handleMenuClose = () => setAnchorEl(null);
  const handleEditFromMenu = () => {
    handleMenuClose();
    setIsEditing(true);
  };
  const handleDeleteFromMenu = () => {
    handleMenuClose();
    if (formData?.id) {
      openDelete?.(formData.id);
    }
  };
  const handleCancelEdit = () => {
    resetForm();
    setIsEditing(false);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setIsEdited(true);
    setFormData((prevState) => ({
      ...prevState,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    if (!isEditing) return;
    e.preventDefault();
    setIsLoading(true);

    try {
      const airlineNum = parseFloat(formData.priceForAirline);
      const hasAirlinePrice =
        !user?.hotelId &&
        !formData.priceForAirReq &&
        !Number.isNaN(airlineNum);
      await updateHotelTarif({
        variables: {
          updateHotelId: id,
          input: {
            additionalServices: [
              {
                id: formData.id,
                name: formData.name,
                price: parseFloat(formData.price),
                ...(hasAirlinePrice && { priceForAirline: airlineNum }),
                ...(!user?.hotelId && {
                  priceForAirReq: Boolean(formData.priceForAirReq),
                }),
              },
            ],
          },
        },
      });

      onClose();
      setIsLoading(false);
      setIsEditing(false);
      setIsEdited(false);
      success("Редактирование доп. услуги прошло успешно.");
    } catch (error) {
      setIsLoading(false);
      console.error("Ошибка при обновлении тарифа:", error);
      notifyError("Не удалось обновить доп. услугу.");
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

  return (
    <Sidebar show={show} sidebarRef={sidebarRef}>
      <div className={classes.requestTitle}>
        <div className={classes.requestTitle_name}>
          Редактировать доп услугу
        </div>
        <div className={classes.requestTitle_close}>
          <AdditionalMenu
            anchorEl={anchorEl}
            onOpen={handleMenuOpen}
            onClose={handleMenuClose}
            menuRef={menuRef}
            onEdit={handleEditFromMenu}
            onDelete={openDelete ? handleDeleteFromMenu : undefined}
          />
          <div className={classes.closeIconWrapper} onClick={closeButton}>
            <CloseIcon />
          </div>
        </div>
      </div>

      {isLoading ? (
        <MUILoader loadSize={"50px"} fullHeight={"90vh"} />
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
              <div className={classes.hint}>* — обязательные поля</div>
              <div className={classes.requestDataInfo}>
                <div className={`${classes.requestDataInfo_title} ${classes.required}`}>
                  Название доп услуги
                </div>
                {isEditing ? (
                  <input
                    type="text"
                    name="name"
                    value={formData.name || ""}
                    onChange={handleChange}
                    placeholder=""
                  />
                ) : (
                  <div className={classes.requestDataInfo_desc}>
                    {formData.name || "—"}
                  </div>
                )}
              </div>

              <div className={classes.requestDataInfo}>
                <div className={`${classes.requestDataInfo_title} ${classes.required}`}>Стоимость</div>
                {isEditing ? (
                  <input
                    type="number"
                    name="price"
                    value={formData.price ?? ""}
                    onChange={handleChange}
                    placeholder="Введите стоимость"
                  />
                ) : (
                  <div className={classes.requestDataInfo_desc}>
                    {formData.price != null && formData.price !== ""
                      ? formData.price
                      : "—"}
                  </div>
                )}
              </div>

              {!user?.hotelId && (
                <>
                  <div className={classes.requestDataInfo}>
                    <div className={`${classes.requestDataInfo_title} ${!formData.priceForAirReq ? classes.required : ""}`}>
                      Стоимость для авиакомпании
                    </div>
                    {isEditing ? (
                      <input
                        type="number"
                        name="priceForAirline"
                        value={formData.priceForAirline ?? ""}
                        onChange={handleChange}
                        placeholder="Введите стоимость"
                        disabled={Boolean(formData.priceForAirReq)}
                      />
                    ) : (
                      <div className={classes.requestDataInfo_desc}>
                        {formData.priceForAirReq
                          ? "По запросу"
                          : formData.priceForAirline != null &&
                              formData.priceForAirline !== ""
                            ? formData.priceForAirline
                            : "—"}
                      </div>
                    )}
                  </div>
                  <div className={classes.requestDataInfo}>
                    <div className={classes.requestDataInfo_title}>
                      Стоимость по запросу
                    </div>
                    {isEditing ? (
                      <input
                        type="checkbox"
                        checked={Boolean(formData.priceForAirReq)}
                        onChange={(e) => {
                          setIsEdited(true);
                          setFormData((prev) => ({
                            ...prev,
                            priceForAirReq: e.target.checked,
                          }));
                        }}
                      />
                    ) : (
                      <div className={classes.requestDataInfo_desc}>
                        {formData.priceForAirReq ? "Да" : "Нет"}
                      </div>
                    )}
                  </div>
                </>
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

export default EditRequestTarifAdditionalServices;
