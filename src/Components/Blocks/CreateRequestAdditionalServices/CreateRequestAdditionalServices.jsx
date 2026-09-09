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
import useRequiredFields from "../../../hooks/useRequiredFields.js";

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
    priceForAirReq: false,
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
  const formBodyRef = useRef(null);
  const [isEdited, setIsEdited] = useState(false);

  const showAirlineField = !user?.hotelId;
  const priceForAirlineRequired = showAirlineField && !formData.priceForAirReq;
  const requiredKeys = [
    "name",
    "price",
    ...(priceForAirlineRequired ? ["priceForAirline"] : []),
  ];
  const {
    invalid,
    validate,
    reset: resetRequired,
  } = useRequiredFields(formData, requiredKeys, formBodyRef);

  const resetForm = useCallback(() => {
    resetRequired();
    setFormData({
      name: "",
      price: "",
      priceForAirline: "",
      priceForAirReq: false,
    });
    setIsEdited(false);
  }, [resetRequired]);

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

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    const priceNum = parseFloat(formData.price);
    const airlineNum = parseFloat(formData.priceForAirline);

    if (
      Number.isNaN(priceNum) ||
      (priceForAirlineRequired && Number.isNaN(airlineNum))
    ) {
      showAlert("Введите корректную стоимость.");
      return;
    }

    const nameTrim = String(formData.name ?? "").trim();

    setIsLoading(true);

    try {
      const hasAirlinePrice =
        showAirlineField &&
        !formData.priceForAirReq &&
        !Number.isNaN(airlineNum);
      await updateHotelTarif({
        variables: {
          updateHotelId: id,
          input: {
            additionalServices: [
              {
                name: nameTrim,
                price: priceNum,
                ...(hasAirlinePrice && { priceForAirline: airlineNum }),
                ...(showAirlineField && {
                  priceForAirReq: Boolean(formData.priceForAirReq),
                }),
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
          <div className={classes.requestMiddle} ref={formBodyRef}>
            <div className={classes.requestData}>
              <span className={classes.hint}>* — обязательные поля</span>
              <label
                className={`${classes.required} ${invalid("name") ? "fieldInvalid" : ""}`}
              >
                Название доп услуги
              </label>
              <input
                type="text"
                name="name"
                className={invalid("name") ? "inputInvalid" : undefined}
                value={formData.name}
                onChange={handleChange}
                placeholder=""
              />

              <label
                className={`${classes.required} ${invalid("price") ? "fieldInvalid" : ""}`}
              >
                Стоимость
              </label>
              <input
                type="number"
                name="price"
                className={invalid("price") ? "inputInvalid" : undefined}
                value={formData.price}
                onChange={handleChange}
                placeholder="Введите стоимость"
              />
              {showAirlineField && (
                <>
                  <label
                    className={`${priceForAirlineRequired ? classes.required : ""} ${invalid("priceForAirline") ? "fieldInvalid" : ""
                      }`}
                  >
                    Стоимость для авиакомпании
                  </label>
                  <input
                    type="number"
                    name="priceForAirline"
                    className={
                      invalid("priceForAirline") ? "inputInvalid" : undefined
                    }
                    value={formData.priceForAirline}
                    onChange={handleChange}
                    placeholder="Введите стоимость для авиакомпании"
                    disabled={Boolean(formData.priceForAirReq)}
                  />
                  <label className={classes.checkboxLabel}>
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
                    <span style={{ marginLeft: 8 }}>Стоимость по запросу</span>
                  </label>
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