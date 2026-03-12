import React, { useState, useEffect, useRef } from "react";
import classes from "./TransferPriceSidebarForm.module.css";
import Sidebar from "../Sidebar/Sidebar.jsx";
import CloseIcon from "../../../shared/icons/CloseIcon.jsx";
import MultiSelectAutocomplete from "../MultiSelectAutocomplete/MultiSelectAutocomplete.jsx";
import Button from "../../Standart/Button/Button.jsx";
import { createEmptyTransferPriceInput, DEFAULT_TRANSFER_PRICES } from "../../../utils/transferPrices.js";

function TransferPriceSidebarForm({
  show,
  onClose,
  mode,
  initialValue,
  airports = [],
  cities = [],
  onSubmit,
}) {
  const sidebarRef = useRef(null);
  const [formData, setFormData] = useState(createEmptyTransferPriceInput());
  const [isEditing, setIsEditing] = useState(false);

  const isEditMode = mode === "edit";
  const canEdit = !isEditMode || isEditing;

  useEffect(() => {
    if (show) {
      setFormData(
        isEditMode && initialValue
          ? {
            id: initialValue.id,
            prices: {
              threeSeater: initialValue.prices?.threeSeater ? { ...initialValue.prices.threeSeater } : { ...DEFAULT_TRANSFER_PRICES.threeSeater },
              fiveSeater: initialValue.prices?.fiveSeater ? { ...initialValue.prices.fiveSeater } : { ...DEFAULT_TRANSFER_PRICES.fiveSeater },
              sevenSeater: initialValue.prices?.sevenSeater ? { ...initialValue.prices.sevenSeater } : { ...DEFAULT_TRANSFER_PRICES.sevenSeater },
            },
            airportIds: initialValue.airportIds ? [...initialValue.airportIds] : [],
            cityIds: initialValue.cityIds ? [...initialValue.cityIds] : [],
          }
          : createEmptyTransferPriceInput()
      );
      if (isEditMode) setIsEditing(false);
    }
  }, [show, mode, initialValue]);

  useEffect(() => {
    if (show && sidebarRef.current) {
      const handleClickOutside = (e) => {
        if (sidebarRef.current && !sidebarRef.current.contains(e.target)) {
          closeButton();
        }
      };
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [show, onClose]);

  const closeButton = () => {
    const needConfirm = isEditMode && isEditing;
    if (needConfirm) {
      const success = window.confirm(
        "Вы уверены, все несохраненные данные будут удалены?"
      );
      if (!success) return;
    }
    onClose();
  };

  const updatePrice = (seatKey, routeKey, value) => {
    setFormData((prev) => ({
      ...prev,
      prices: {
        ...prev.prices,
        [seatKey]: {
          ...(prev.prices?.[seatKey] || {}),
          [routeKey]: value === "" ? null : Number(value),
        },
      },
    }));
  };

  const airportOptions = airports.map((a) => ({
    id: a.id,
    label: [a.code, a.name, a.city].filter(Boolean).join(" — "),
  }));
  const cityOptions = cities.map((c) => ({
    id: c.id,
    label: [c.city, c.region].filter(Boolean).join(", "),
  }));
  const selectedAirports = airportOptions.filter((o) => formData.airportIds?.includes(o.id));
  const selectedCities = cityOptions.filter((o) => formData.cityIds?.includes(o.id));

  const handleSubmit = (e) => {
    e?.preventDefault?.();
    if (isEditMode) {
      if (isEditing) {
        onSubmit(formData);
        onClose();
      } else {
        setIsEditing(true);
      }
    } else {
      onSubmit(formData);
      onClose();
    }
  };

  return (
    <Sidebar show={show} sidebarRef={sidebarRef}>
      <div className={classes.requestTitle}>
        <div className={classes.requestTitle_name}>
          {isEditMode ? "Изменить договор" : "Добавить договор"}
        </div>
        <div className={classes.requestTitle_close} onClick={closeButton}>
          <CloseIcon />
        </div>
      </div>

      <>
        <div className={classes.requestMiddle}>
          <div className={classes.requestData}>
            <label>Межгород (3-местный), ₽</label>
            <input
              type="number"
              min={0}
              step={100}
              value={formData.prices?.threeSeater?.intercity ?? ""}
              onChange={(e) => updatePrice("threeSeater", "intercity", e.target.value)}
              placeholder="Введите стоимость"
              disabled={!canEdit}
            />

            <label>Город (3-местный), ₽</label>
            <input
              type="number"
              min={0}
              step={100}
              value={formData.prices?.threeSeater?.city ?? ""}
              onChange={(e) => updatePrice("threeSeater", "city", e.target.value)}
              placeholder="Введите стоимость"
              disabled={!canEdit}
            />

            <label>Межгород (5-местный), ₽</label>
            <input
              type="number"
              min={0}
              step={100}
              value={formData.prices?.fiveSeater?.intercity ?? ""}
              onChange={(e) => updatePrice("fiveSeater", "intercity", e.target.value)}
              placeholder="Введите стоимость"
              disabled={!canEdit}
            />

            <label>Город (5-местный), ₽</label>
            <input
              type="number"
              min={0}
              step={100}
              value={formData.prices?.fiveSeater?.city ?? ""}
              onChange={(e) => updatePrice("fiveSeater", "city", e.target.value)}
              placeholder="Введите стоимость"
              disabled={!canEdit}
            />

            <label>Межгород (7-местный), ₽</label>
            <input
              type="number"
              min={0}
              step={100}
              value={formData.prices?.sevenSeater?.intercity ?? ""}
              onChange={(e) => updatePrice("sevenSeater", "intercity", e.target.value)}
              placeholder="Введите стоимость"
              disabled={!canEdit}
            />

            <label>Город (7-местный), ₽</label>
            <input
              type="number"
              min={0}
              step={100}
              value={formData.prices?.sevenSeater?.city ?? ""}
              onChange={(e) => updatePrice("sevenSeater", "city", e.target.value)}
              placeholder="Введите стоимость"
              disabled={!canEdit}
            />

            {airportOptions.length > 0 && (
              <>
                <label>Аэропорты</label>
                <MultiSelectAutocomplete
                  isMultiple={true}
                  showSelectAll={true}
                  dropdownWidth="100%"
                  label="Выберите аэропорты"
                  options={airportOptions}
                  value={selectedAirports}
                  onChange={(_, newValue) =>
                    setFormData((prev) => ({
                      ...prev,
                      airportIds: (newValue || []).map((o) => o.id),
                    }))
                  }
                  isDisabled={!canEdit}
                />
              </>
            )}

            {cityOptions.length > 0 && (
              <>
                <label>Города</label>
                <MultiSelectAutocomplete
                  isMultiple={true}
                  showSelectAll={true}
                  dropdownWidth="100%"
                  label="Выберите города"
                  options={cityOptions}
                  value={selectedCities}
                  onChange={(_, newValue) =>
                    setFormData((prev) => ({
                      ...prev,
                      cityIds: (newValue || []).map((o) => o.id),
                    }))
                  }
                  isDisabled={!canEdit}
                />
              </>
            )}
          </div>
        </div>
        <div className={classes.requestButton}>
          {isEditMode && isEditing && (
            <Button
              type="button"
              onClick={() => setIsEditing(false)}
              backgroundcolor="var(--hover-gray)"
              color="#000"
            >
              Отмена
            </Button>
          )}
          <Button
            type="submit"
            onClick={handleSubmit}
            backgroundcolor={isEditMode && !isEditing ? "#3CBC6726" : "#0057C3"}
            color={isEditMode && !isEditing ? "#3B6C54" : "#fff"}
          >
            {isEditMode ? (
              isEditing ? (
                <>
                  Сохранить <img src="/saveDispatcher.png" alt="" />
                </>
              ) : (
                <>
                  Изменить <img src="/editDispetcher.png" alt="" />
                </>
              )
            ) : (
              "Добавить договор"
            )}
          </Button>
        </div>
      </>
    </Sidebar>
  );
}

export default TransferPriceSidebarForm;
