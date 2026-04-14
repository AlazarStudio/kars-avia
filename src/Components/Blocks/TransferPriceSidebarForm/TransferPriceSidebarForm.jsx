import React, { useState, useEffect, useRef, useCallback } from "react";
import classes from "./TransferPriceSidebarForm.module.css";
import Sidebar from "../Sidebar/Sidebar.jsx";
import CloseIcon from "../../../shared/icons/CloseIcon.jsx";
import AdditionalMenu from "../../Standart/AdditionalMenu/AdditionalMenu.jsx";
import MultiSelectAutocomplete from "../MultiSelectAutocomplete/MultiSelectAutocomplete.jsx";
import Button from "../../Standart/Button/Button.jsx";
import { createEmptyTransferPriceInput, DEFAULT_TRANSFER_PRICES } from "../../../utils/transferPrices.js";
import { useDialog } from "../../../contexts/DialogContext";

function TransferPriceSidebarForm({
  show,
  onClose,
  mode,
  initialValue,
  airports = [],
  cities = [],
  onSubmit,
  onDelete,
  initialEditMode = false,
}) {
  const { confirm, showAlert, isDialogOpen } = useDialog();
  const sidebarRef = useRef(null);
  const menuRef = useRef(null);
  const [formData, setFormData] = useState(createEmptyTransferPriceInput());
  const [isEditing, setIsEditing] = useState(false);
  const [isEdited, setIsEdited] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);

  const isEditMode = mode === "edit";

  const getInitialFormData = useCallback(() => {
    if (!isEditMode || !initialValue) return createEmptyTransferPriceInput();
    return {
      id: initialValue.id,
      name: initialValue.name ?? '',
      prices: {
        threeSeater: initialValue.prices?.threeSeater ? { ...initialValue.prices.threeSeater } : { ...DEFAULT_TRANSFER_PRICES.threeSeater },
        fiveSeater: initialValue.prices?.fiveSeater ? { ...initialValue.prices.fiveSeater } : { ...DEFAULT_TRANSFER_PRICES.fiveSeater },
        sevenSeater: initialValue.prices?.sevenSeater ? { ...initialValue.prices.sevenSeater } : { ...DEFAULT_TRANSFER_PRICES.sevenSeater },
      },
      airportIds: initialValue.airportIds ? [...initialValue.airportIds] : [],
      cityIds: initialValue.cityIds ? [...initialValue.cityIds] : [],
    };
  }, [isEditMode, initialValue]);

  useEffect(() => {
    if (show) {
      setFormData(getInitialFormData());
      setIsEdited(false);
      if (isEditMode) {
        setIsEditing(initialEditMode);
      }
    }
  }, [show, isEditMode, getInitialFormData]);

  const resetForm = useCallback(() => {
    setFormData(getInitialFormData());
    setIsEdited(false);
  }, [getInitialFormData]);

  const closeButton = useCallback(async () => {
    if (isDialogOpen) return;

    setAnchorEl(null);
    if (!isEdited) {
      onClose();
      if (isEditMode) setIsEditing(false);
      return;
    }

    const isConfirmed = await confirm(
      "Вы уверены? Все несохраненные данные будут удалены."
    );
    if (isConfirmed) {
      resetForm();
      onClose();
      if (isEditMode) setIsEditing(false);
    }
  }, [confirm, isDialogOpen, isEdited, isEditMode, onClose, resetForm]);

  const handleMenuOpen = (e) => setAnchorEl(e.currentTarget);
  const handleMenuClose = () => setAnchorEl(null);
  const handleEditFromMenu = () => {
    handleMenuClose();
    setIsEditing(true);
  };
  const handleDeleteFromMenu = () => {
    handleMenuClose();
    if (onDelete && (initialValue?.id || formData?.id)) {
      onClose();
      onDelete(initialValue ?? formData);
    }
  };
  const handleCancelEdit = () => {
    resetForm();
    setIsEditing(false);
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (isDialogOpen) return;
      if (e.target.closest(".MuiSnackbar-root")) return;
      if (anchorEl && menuRef.current?.contains(e.target)) return;
      if (sidebarRef.current?.contains(e.target)) return;
      closeButton();
    };
    if (show) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [show, closeButton, anchorEl, isDialogOpen]);

  const updatePrice = (seatKey, routeKey, value) => {
    setIsEdited(true);
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
    if (isEditMode && !isEditing) return;

    if (!formData.name?.trim()) {
      showAlert("Пожалуйста, укажите название договора.");
      return;
    }

    if (isEditMode) {
      onSubmit(formData);
      onClose();
      setIsEditing(false);
    } else {
      onSubmit(formData);
      onClose();
    }
  };

  const priceFields = [
    { seatKey: "threeSeater", routeKey: "intercity", title: "Межгород (3-местный), ₽" },
    { seatKey: "threeSeater", routeKey: "city", title: "Город (3-местный), ₽" },
    { seatKey: "fiveSeater", routeKey: "intercity", title: "Межгород (5-местный), ₽" },
    { seatKey: "fiveSeater", routeKey: "city", title: "Город (5-местный), ₽" },
    { seatKey: "sevenSeater", routeKey: "intercity", title: "Межгород (7-местный), ₽" },
    { seatKey: "sevenSeater", routeKey: "city", title: "Город (7-местный), ₽" },
  ];

  const canEdit = !isEditMode || isEditing;

  return (
    <Sidebar show={show} sidebarRef={sidebarRef}>
      <div className={classes.requestTitle}>
        <div className={classes.requestTitle_name}>
          {isEditMode ? "Изменить договор" : "Добавить договор"}
        </div>
        <div className={classes.requestTitle_close}>
          {isEditMode && (
            <AdditionalMenu
              anchorEl={anchorEl}
              onOpen={handleMenuOpen}
              onClose={handleMenuClose}
              menuRef={menuRef}
              onEdit={handleEditFromMenu}
              onDelete={onDelete ? handleDeleteFromMenu : undefined}
            />
          )}
          <div className={classes.closeIconWrapper} onClick={closeButton}>
            <CloseIcon />
          </div>
        </div>
      </div>

      <>
        <div className={classes.requestMiddle}>
          <div className={classes.requestData}>
            <div className={classes.requestDataInfo}>
              <div className={classes.requestDataInfo_title}>Название</div>
              {canEdit ? (
                <input
                  type="text"
                  value={formData.name ?? ''}
                  onChange={(e) => {
                    setIsEdited(true);
                    setFormData((prev) => ({ ...prev, name: e.target.value }));
                  }}
                  placeholder="Введите название договора"
                />
              ) : (
                <div className={classes.requestDataInfo_desc}>{formData.name || "—"}</div>
              )}
            </div>

            {priceFields.map(({ seatKey, routeKey, title }) => {
              const val = formData.prices?.[seatKey]?.[routeKey];
              const displayVal = val != null && val !== "" ? val : "—";
              return (
                <div key={`${seatKey}-${routeKey}`} className={classes.requestDataInfo}>
                  <div className={classes.requestDataInfo_title}>{title}</div>
                  {canEdit ? (
                    <input
                      type="number"
                      min={0}
                      step={100}
                      value={val ?? ""}
                      onChange={(e) => updatePrice(seatKey, routeKey, e.target.value)}
                      placeholder="Введите стоимость"
                    />
                  ) : (
                    <div className={classes.requestDataInfo_desc}>{displayVal}</div>
                  )}
                </div>
              );
            })}

            {airportOptions.length > 0 && (
              <div className={classes.requestDataInfo_block}>
                <div className={classes.requestDataInfo_title}>Аэропорты</div>
                {canEdit ? (
                  <div className={classes.dropdown}>
                    <MultiSelectAutocomplete
                      isMultiple={true}
                      showSelectAll={true}
                      dropdownWidth="100%"
                      label="Выберите аэропорты"
                      options={airportOptions}
                      value={selectedAirports}
                      onChange={(_, newValue) => {
                        setIsEdited(true);
                        setFormData((prev) => ({
                          ...prev,
                          airportIds: (newValue || []).map((o) => o.id),
                        }));
                      }}
                    />
                  </div>
                ) : (
                  <div className={classes.requestDataInfo_descBlock}>
                    {selectedAirports.length ? (
                      <div className={classes.requestDataInfo_airportList}>
                        {selectedAirports.map((o) => (
                          <div key={o.id}>{o.label}</div>
                        ))}
                      </div>
                    ) : (
                      "—"
                    )}
                  </div>
                )}
              </div>
            )}

            {cityOptions.length > 0 && (
              <div className={classes.requestDataInfo_block}>
                <div className={classes.requestDataInfo_title}>Города</div>
                {canEdit ? (
                  <div className={classes.dropdown}>
                    <MultiSelectAutocomplete
                      isMultiple={true}
                      showSelectAll={true}
                      dropdownWidth="100%"
                      label="Выберите города"
                      options={cityOptions}
                      value={selectedCities}
                      onChange={(_, newValue) => {
                        setIsEdited(true);
                        setFormData((prev) => ({
                          ...prev,
                          cityIds: (newValue || []).map((o) => o.id),
                        }));
                      }}
                    />
                  </div>
                ) : (
                  <div className={classes.requestDataInfo_descBlock}>
                    {selectedCities.length ? (
                      <div className={classes.requestDataInfo_airportList}>
                        {selectedCities.map((o) => (
                          <div key={o.id}>{o.label}</div>
                        ))}
                      </div>
                    ) : (
                      "—"
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {isEditMode ? (
          isEditing && (
            <div className={classes.requestButton}>
              <Button
                type="button"
                onClick={handleCancelEdit}
                backgroundcolor="var(--hover-gray)"
                color="#000"
              >
                Отмена
              </Button>
              <Button type="submit" onClick={handleSubmit} backgroundcolor="#0057C3" color="#fff">
                Сохранить <img src="/saveDispatcher.png" alt="" />
              </Button>
            </div>
          )
        ) : (
          <div className={classes.requestButton}>
            <Button type="submit" onClick={handleSubmit} backgroundcolor="#0057C3" color="#fff">
              Добавить договор
            </Button>
          </div>
        )}
      </>
    </Sidebar>
  );
}

export default TransferPriceSidebarForm;
