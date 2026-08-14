import React, { useState, useRef, useEffect, useCallback, useMemo } from "react";
import classes from "./EditRequestAirlineTarifCategory.module.css";
import Button from "../../Standart/Button/Button.jsx";
import Sidebar from "../Sidebar/Sidebar.jsx";
import AdditionalMenu from "../../Standart/AdditionalMenu/AdditionalMenu.jsx";

import {
  GET_AIRPORTS_RELAY,
  getCookie,
  UPDATE_HOTEL_TARIF,
} from "../../../../graphQL_requests.js";
import { useQuery } from "@apollo/client";
import MUIAutocomplete from "../MUIAutocomplete/MUIAutocomplete.jsx";
import TariffGeographyList from "../TariffGeographyList/TariffGeographyList.jsx";
import ContractTypeToggle from "../ContractTypeToggle/ContractTypeToggle.jsx";
import { rowsToGeographyInput, findDuplicateGeoRow, getContractType } from "../../../utils/airlineTariffGeography.js";
import { airlineTariffToInput, tariffInputToPayload, tariffFormToDisplayItem, PRICE_APPLIES_TO_OPTIONS, DEFAULT_APPLIES_TO, normalizeAppliesTo, appliesToLabel, collectUsedLocations, pruneUsedSelections, PRICE_FIELDS, MEAL_ROWS } from "../../../utils/airlineTariffPrices.js";
import { AIRLINE_PRICE_ROWS } from "../../../utils/roomCategories.js";
import MultiSelectAutocomplete from "../MultiSelectAutocomplete/MultiSelectAutocomplete.jsx";
import CloseIcon from "../../../shared/icons/CloseIcon.jsx";
import { useDialog } from "../../../contexts/DialogContext";

function EditRequestAirlineTarifCategory({
  show,
  onClose,
  tarif,
  onSubmit,
  addTarif,
  refetchAllCategories,
  id,
  selectedContract,
  setAddTarif,
  user,
  type,
  onDelete,
  initialEditMode = false,
}) {
  const token = getCookie("token");
  const { confirm, showAlert, isDialogOpen } = useDialog();
  const infoAirports = useQuery(GET_AIRPORTS_RELAY, {
    context: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  });

  // console.log(tarif);

  const getInitialFormData = useCallback(() => airlineTariffToInput(tarif), [tarif]);

  const [formData, setFormData] = useState(() => ({
    name: "",
    airportIds: [],
    geography: [],
    ...Object.fromEntries(PRICE_FIELDS.map((field) => [field, 0])),
    breakfast: 0,
    dinner: 0,
    lunch: 0,
  }));
  const [isEdited, setIsEdited] = useState(false);

  const [contractType, setContractType] = useState("individual");
  const [appliesTo, setAppliesTo] = useState(DEFAULT_APPLIES_TO);

  const [airports, setAirports] = useState([]); // Список аэропортов
  const sidebarRef = useRef();
  const menuRef = useRef(null);
  const [anchorEl, setAnchorEl] = useState(null);

  useEffect(() => {
    if (infoAirports.data) {
      setAirports(infoAirports.data.airports || []);
    }
  }, [infoAirports.data]);

  const airportOptions = airports.map((airport) => ({
    value: String(airport.id), // используем value вместо id
    label: `${airport.code} ${airport.name}, город: ${airport.city}`,
    code: airport.code,
    city: airport.city,
  }));

  // свой договор (tarif.id) не блокирует сам себя
  const usedLocations = useMemo(
    () => collectUsedLocations(addTarif, appliesTo, tarif?.id),
    [addTarif, tarif?.id, appliesTo],
  );

  const usedAirportIds = usedLocations.airportIds;

  const usedGeo = useMemo(
    () => ({
      regionIds: [...usedLocations.regionIds],
      cityIds: [...usedLocations.cityIds],
    }),
    [usedLocations],
  );

  const [skippedAirports, setSkippedAirports] = useState([]);
  // Что сняли из выбора при смене «Применяется к» (подсказка пользователю)
  const [removedByAppliesTo, setRemovedByAppliesTo] = useState(null);

  // Смена вида заявок меняет набор занятых локаций: то, что стало
  // конфликтным, убираем из формы, иначе бэкенд отклонит сохранение.
  const handleAppliesToChange = (nextAppliesTo) => {
    setIsEdited(true);
    setAppliesTo(nextAppliesTo);
    setSkippedAirports([]);

    const used = collectUsedLocations(addTarif, nextAppliesTo, tarif?.id);
    const pruned = pruneUsedSelections(formData, used);

    if (!pruned.removedAirportIds.length && !pruned.removedGeoLabels.length) {
      setRemovedByAppliesTo(null);
      return;
    }

    setFormData((prev) => ({
      ...prev,
      airportIds: pruned.airportIds,
      geography: pruned.geography,
    }));
    setRemovedByAppliesTo({
      airports: pruned.removedAirportIds.map((airportId) => {
        const a = airports.find((item) => String(item.id) === airportId);
        return a ? `${a.code} ${a.city}` : airportId;
      }),
      geo: pruned.removedGeoLabels,
    });
  };

  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (show && tarif) {
      setFormData(getInitialFormData());
      setContractType(getContractType(tarif));
      setAppliesTo(normalizeAppliesTo(tarif?.contractType));
      setIsEdited(false);
      setIsEditing(initialEditMode);
      setSkippedAirports([]);
      setRemovedByAppliesTo(null);
    }
  }, [show, tarif?.id, getInitialFormData]);

  const resetForm = useCallback(() => {
    setFormData(getInitialFormData());
    setContractType(getContractType(tarif));
    setAppliesTo(normalizeAppliesTo(tarif?.contractType));
    setIsEdited(false);
    setSkippedAirports([]);
    setRemovedByAppliesTo(null);
  }, [getInitialFormData, tarif]);

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
  }, [isEdited, onClose, resetForm, confirm, isDialogOpen]);

  const handleMenuOpen = (e) => setAnchorEl(e.currentTarget);
  const handleMenuClose = () => setAnchorEl(null);
  const handleEditFromMenu = () => {
    handleMenuClose();
    setIsEditing(true);
  };
  const handleDeleteFromMenu = () => {
    handleMenuClose();
    if (onDelete && tarif?.id) {
      onClose();
      onDelete(tarif);
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

  const handleFileChange = (e) => {
    const files = e.target.files;
    if (files && files.length > 8) {
      showAlert("Вы можете загрузить не более 8 изображений.");
      e.target.value = null;
      return;
    }

    // Преобразуем файлы в массив
    const fileArray = Array.from(files);

    setFormData((prevState) => ({
      ...prevState,
      images: fileArray, // Сохраняем массив файлов
    }));
  };

  // console.log(selectedContract?.id);

  // Форма презентационная: валидирует и отдаёт готовую запись родителю (onSubmit).
  // Мутацию/refetch/тосты/закрытие выполняет родитель (AirlineTarifs_tabComponent).
  const handleSubmit = (e) => {
    if (!isEditing) return;
    e.preventDefault();

    const geographyInput = rowsToGeographyInput(formData.geography);
    const isIndividual = contractType === "individual";

    if (isIndividual) {
      if ((formData.airportIds?.length || 0) === 0) {
        showAlert("Выберите хотя бы один аэропорт.");
        return;
      }
    } else {
      if (geographyInput.length === 0) {
        showAlert("Выберите хотя бы один регион или город.");
        return;
      }
      const duplicateGeo = findDuplicateGeoRow(formData.geography);
      if (duplicateGeo) {
        const what = duplicateGeo.kind === "city" ? "Город" : "Регион";
        showAlert(
          duplicateGeo.label
            ? `${what} «${duplicateGeo.label}» уже добавлен в тариф.`
            : `${what} уже добавлен в тариф.`
        );
        return;
      }
    }

    const record = tariffInputToPayload(formData, contractType, {
      id: tarif?.id,
      appliesTo,
    });
    const displayItem = tariffFormToDisplayItem(formData, contractType, airports, {
      id: tarif?.id,
      prevCategory: tarif?.category || [],
      appliesTo,
    });
    onSubmit?.(record, displayItem);
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
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [show, closeButton, anchorEl, isDialogOpen]);

  // console.log("formData.airportIds:", formData.airportIds);
  // console.log("airportOptions:", airportOptions);
  // console.log("Фильтрация:", airportOptions.filter((option) =>
  //   formData.airportIds.includes(option.value)
  // ));

  const geoHasData = rowsToGeographyInput(formData.geography).length > 0;
  const airportsHasData = (formData.airportIds?.length || 0) > 0;
  const inactiveHasData = contractType === "individual" ? geoHasData : airportsHasData;
  const switchHint =
    contractType === "individual"
      ? "При сохранении договор станет только по аэропортам; регионы и города будут очищены."
      : "При сохранении договор станет только по регионам/городам; аэропорты будут очищены.";

  const allAirportsUsed =
    airportOptions.length > 0 &&
    airportOptions.every((o) => usedAirportIds.has(String(o.value)));

  return (
    <Sidebar show={show} sidebarRef={sidebarRef}>
      <div className={classes.requestTitle}>
        <div className={classes.requestTitle_name}>Изменить договор</div>
        <div className={classes.requestTitle_close}>
          <AdditionalMenu
            anchorEl={anchorEl}
            onOpen={handleMenuOpen}
            onClose={handleMenuClose}
            menuRef={menuRef}
            onEdit={handleEditFromMenu}
            onDelete={onDelete ? handleDeleteFromMenu : undefined}
          />
          <div className={classes.closeIconWrapper} onClick={closeButton}>
            <CloseIcon />
          </div>
        </div>
      </div>

      {(
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
              <div className={classes.requestDataInfo}>
                <div className={classes.requestDataInfo_title}>
                  Название договора
                </div>
                {isEditing ? (
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Например: Договор №1"
                  />
                ) : (
                  <div className={classes.requestDataInfo_desc}>
                    {formData.name || "—"}
                  </div>
                )}
              </div>

              {isEditing ? (
                <div className={classes.requestDataInfo_block}>
                  <div className={classes.requestDataInfo_title}>Применяется к</div>
                  <ContractTypeToggle
                    value={appliesTo}
                    options={PRICE_APPLIES_TO_OPTIONS}
                    onChange={handleAppliesToChange}
                  />
                  {appliesTo === "all" && (
                    <div className={classes.airportHint}>
                      Локации этого ценника станут недоступны для ценников «Эскадрилья»
                      и «ФАП».
                    </div>
                  )}
                  {removedByAppliesTo?.airports?.length > 0 && (
                    <div className={classes.airportHint}>
                      Сняты аэропорты: {removedByAppliesTo.airports.join(", ")} — уже
                      используются в других договорах этого типа
                    </div>
                  )}
                  {removedByAppliesTo?.geo?.length > 0 && (
                    <div className={classes.airportHint}>
                      Сняты регионы и города: {removedByAppliesTo.geo.join(", ")} — уже
                      используются в других договорах этого типа
                    </div>
                  )}
                </div>
              ) : (
                <div className={classes.requestDataInfo}>
                  <div className={classes.requestDataInfo_title}>Применяется к</div>
                  <div className={classes.requestDataInfo_desc}>
                    {appliesToLabel(appliesTo)}
                  </div>
                </div>
              )}

              {isEditing ? (
                <div className={classes.requestDataInfo_block}>
                  <div className={classes.requestDataInfo_title}>Тип договора</div>
                  <ContractTypeToggle
                    value={contractType}
                    onChange={(t) => {
                      setIsEdited(true);
                      setContractType(t);
                    }}
                  />
                  {inactiveHasData && (
                    <div className={classes.airportHint}>{switchHint}</div>
                  )}
                </div>
              ) : (
                <div className={classes.requestDataInfo}>
                  <div className={classes.requestDataInfo_title}>Тип договора</div>
                  <div className={classes.requestDataInfo_desc}>
                    {contractType === "individual"
                      ? "Индивидуальный (по аэропортам)"
                      : "Общий (регионы и города)"}
                  </div>
                </div>
              )}

              {contractType === "individual" && (
              <div className={classes.requestDataInfo_block}>
                <div className={classes.requestDataInfo_title}>Аэропорты</div>
                {isEditing ? (
                  <div className={classes.dropdown}>
                    {allAirportsUsed && (
                      <div className={classes.airportHint}>
                        Все аэропорты уже используются в других договорах — свободных нет.
                      </div>
                    )}
                    {skippedAirports.length > 0 && (
                      <div className={classes.airportHint}>
                        Не выбраны:{" "}
                        {skippedAirports
                          .map((a) => `${a.code} ${a.city}`)
                          .join(", ")}{" "}
                        — уже используются в других договорах
                      </div>
                    )}
                    <MultiSelectAutocomplete
                      isMultiple={true}
                      showSelectAll={true}
                      dropdownWidth={"100%"}
                      label={"Выберите аэропорты"}
                      options={airportOptions}
                      getOptionDisabled={(opt) =>
                        usedAirportIds.has(String(opt.value))
                      }
                      value={airportOptions.filter((opt) =>
                        formData.airportIds.includes(opt.value),
                      )}
                      onChange={(event, newValue, reason, details) => {
                        setIsEdited(true);
                        setRemovedByAppliesTo(null);
                        setFormData((prev) => ({
                          ...prev,
                          airportIds: (newValue || []).map((opt) => opt.value),
                        }));
                        if (
                          details?.option?.isSelectAll &&
                          (newValue || []).length > 0
                        ) {
                          setSkippedAirports(
                            airportOptions.filter((o) =>
                              usedAirportIds.has(String(o.value))
                            )
                          );
                        } else {
                          setSkippedAirports([]);
                        }
                      }}
                    />
                  </div>
                ) : (
                  <div className={classes.requestDataInfo_descBlock}>
                    {airportOptions.filter((opt) =>
                      formData.airportIds.includes(opt.value),
                    ).length ? (
                      <div className={classes.requestDataInfo_airportList}>
                        {airportOptions
                          .filter((opt) =>
                            formData.airportIds.includes(opt.value),
                          )
                          .map((opt) => (
                            <div key={opt.value}>{opt.label}</div>
                          ))}
                      </div>
                    ) : (
                      "—"
                    )}
                  </div>
                )}
              </div>
              )}

              {contractType === "shared" && (
                <TariffGeographyList
                  value={formData.geography}
                  disabled={!isEditing}
                  usedRegionIds={usedGeo.regionIds}
                  usedCityIds={usedGeo.cityIds}
                  onChange={(rows) => {
                    setIsEdited(true);
                    setRemovedByAppliesTo(null);
                    setFormData((prev) => ({ ...prev, geography: rows }));
                  }}
                />
              )}

              {[...AIRLINE_PRICE_ROWS, ...MEAL_ROWS].map(({ key, title }) => (
                <div key={key} className={classes.requestDataInfo}>
                  <div className={classes.requestDataInfo_title}>{title}</div>
                  {isEditing ? (
                    <input
                      type="number"
                      name={key}
                      value={formData[key] ?? ""}
                      onChange={handleChange}
                      placeholder="Введите стоимость"
                    />
                  ) : (
                    <div className={classes.requestDataInfo_desc}>
                      {formData[key] != null && formData[key] !== ""
                        ? formData[key]
                        : "—"}
                    </div>
                  )}
                </div>
              ))}
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

export default EditRequestAirlineTarifCategory;
