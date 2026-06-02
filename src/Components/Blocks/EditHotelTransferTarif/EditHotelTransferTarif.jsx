import React, { useState, useRef, useEffect, useCallback } from "react";
import classes from "./EditHotelTransferTarif.module.css";
import Button from "../../Standart/Button/Button.jsx";
import Sidebar from "../Sidebar/Sidebar.jsx";
import CloseIcon from "../../../shared/icons/CloseIcon.jsx";
import AdditionalMenu from "../../Standart/AdditionalMenu/AdditionalMenu.jsx";
import {
  getCookie,
  UPDATE_HOTEL_TRANSFER_TARIF,
} from "../../../../graphQL_requests.js";
import { useMutation } from "@apollo/client";
import MUILoader from "../MUILoader/MUILoader.jsx";
import { useDialog } from "../../../contexts/DialogContext";
import { useToast } from "../../../contexts/ToastContext";

function EditHotelTransferTarif({
  show,
  user,
  onClose,
  transferPrices,
  transferPricesAirline,
  transferPriceForAirReq = false,
  onSubmit,
  id,
}) {
  const token = getCookie("token");
  const { confirm, isDialogOpen } = useDialog();
  const { success, error: notifyError } = useToast();

  const [isEditing, setIsEditing] = useState(false);
  const [isEdited, setIsEdited] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [formData, setFormData] = useState({
    arrival: "",
    departure: "",
    arrivalForAirline: "",
    departureForAirline: "",
    transferPriceForAirReq: false,
  });

  const sidebarRef = useRef();
  const menuRef = useRef(null);
  const [anchorEl, setAnchorEl] = useState(null);

  const resetForm = useCallback(() => {
    setFormData({
      arrival: transferPrices?.arrival ?? "",
      departure: transferPrices?.departure ?? "",
      arrivalForAirline: transferPricesAirline?.arrival ?? "",
      departureForAirline: transferPricesAirline?.departure ?? "",
      transferPriceForAirReq: Boolean(transferPriceForAirReq),
    });
    setIsEdited(false);
  }, [transferPrices, transferPricesAirline, transferPriceForAirReq]);

  const [updateHotelTransferTarif] = useMutation(UPDATE_HOTEL_TRANSFER_TARIF, {
    context: {
      headers: {
        Authorization: `Bearer ${token}`,
        "Apollo-Require-Preflight": "true",
      },
    },
  });

  useEffect(() => {
    if (show) {
      setFormData({
        arrival: transferPrices?.arrival ?? "",
        departure: transferPrices?.departure ?? "",
        arrivalForAirline: transferPricesAirline?.arrival ?? "",
        departureForAirline: transferPricesAirline?.departure ?? "",
        transferPriceForAirReq: Boolean(transferPriceForAirReq),
      });
      setIsEdited(false);
      setIsEditing(true);
    }
  }, [show, transferPrices, transferPricesAirline, transferPriceForAirReq]);

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
      const byReq = Boolean(formData.transferPriceForAirReq);
      const dataSend = {
        transferPrice: {
          arrival: Number(formData.arrival) || 0,
          departure: Number(formData.departure) || 0,
        },
        transferPriceForAir: byReq
          ? { arrival: 0, departure: 0 }
          : {
              arrival: Number(formData.arrivalForAirline) || 0,
              departure: Number(formData.departureForAirline) || 0,
            },
        transferPriceForAirReq: byReq,
      };

      const response = await updateHotelTransferTarif({
        variables: {
          updateHotelId: id,
          input: dataSend,
        },
      });

      if (response) {
        onSubmit({
          transferPrice: response.data.updateHotel.transferPrice,
          transferPriceForAir: response.data.updateHotel.transferPriceForAir,
          transferPriceForAirReq:
            response.data.updateHotel.transferPriceForAirReq ?? byReq,
        });
        resetForm();
        onClose();
        setIsLoading(false);
        setIsEditing(false);
        success("Редактирование прошло успешно.");
      }
    } catch (error) {
      console.error("Catch: ", error);
      setIsLoading(false);
      notifyError("Не удалось сохранить цены на трансфер.");
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
          Редактировать цены на трансфер
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
                {renderRow("Аэропорт → гостиница", "arrival", formData.arrival)}
                {renderRow(
                  "Гостиница → аэропорт",
                  "departure",
                  formData.departure
                )}
              </div>

              {user?.hotelId ? null : (
                <div className={classes.groupBlock}>
                  <div className={classes.groupTitle}>Цены для АК</div>
                  {renderRow(
                    "Аэропорт → гостиница",
                    "arrivalForAirline",
                    formData.arrivalForAirline,
                    {
                      disabled: formData.transferPriceForAirReq,
                      byRequest: formData.transferPriceForAirReq,
                    }
                  )}
                  {renderRow(
                    "Гостиница → аэропорт",
                    "departureForAirline",
                    formData.departureForAirline,
                    {
                      disabled: formData.transferPriceForAirReq,
                      byRequest: formData.transferPriceForAirReq,
                    }
                  )}
                  {isEditing && (
                    <div className={classes.requestDataInfo}>
                      <div className={classes.requestDataInfo_title}>
                        Стоимость по запросу
                      </div>
                      <input
                        type="checkbox"
                        checked={Boolean(formData.transferPriceForAirReq)}
                        onChange={(e) => {
                          setIsEdited(true);
                          setFormData((prev) => ({
                            ...prev,
                            transferPriceForAirReq: e.target.checked,
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

export default EditHotelTransferTarif;
