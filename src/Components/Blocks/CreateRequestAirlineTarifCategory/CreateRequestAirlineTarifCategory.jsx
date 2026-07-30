import React, { useState, useRef, useEffect, useCallback, useMemo } from "react";
import classes from "./CreateRequestAirlineTarifCategory.module.css";
import Button from "../../Standart/Button/Button.jsx";
import Sidebar from "../Sidebar/Sidebar.jsx";

import {
  GET_AIRPORTS_RELAY,
  GET_ALL_TARIFFS,
  getCookie,
  UPDATE_HOTEL_TARIF,
} from "../../../../graphQL_requests.js";
import { useQuery } from "@apollo/client";
import MUIAutocomplete from "../MUIAutocomplete/MUIAutocomplete.jsx";
import MultiSelectAutocomplete from "../MultiSelectAutocomplete/MultiSelectAutocomplete.jsx";
import TariffGeographyList from "../TariffGeographyList/TariffGeographyList.jsx";
import ContractTypeToggle from "../ContractTypeToggle/ContractTypeToggle.jsx";
import { rowsToGeographyInput, findDuplicateGeoRow } from "../../../utils/airlineTariffGeography.js";
import { createEmptyTariffInput, tariffInputToPayload, tariffFormToDisplayItem, PRICE_APPLIES_TO_OPTIONS, DEFAULT_APPLIES_TO, collectUsedLocations, pruneUsedSelections } from "../../../utils/airlineTariffPrices.js";
import CloseIcon from "../../../shared/icons/CloseIcon.jsx";
import { useDialog } from "../../../contexts/DialogContext";


function CreateRequestAirlineTarifCategory({
  show,
  id,
  onClose,
  onSubmit,
  addTarif,
  selectedContract,
  refetchAllCategories,
  setAddTarif,
  user,
  type,
}) {
  const token = getCookie("token");
  const { confirm, showAlert, isDialogOpen } = useDialog();
  const infoAirports = useQuery(GET_AIRPORTS_RELAY, {
    context: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
    skip: !show,
  });

  // console.log(show);

  const [formData, setFormData] = useState(() => createEmptyTariffInput());

  const [airports, setAirports] = useState([]); // Список аэропортов

  const [contractType, setContractType] = useState("individual");

  const [appliesTo, setAppliesTo] = useState(DEFAULT_APPLIES_TO);

  useEffect(() => {
    if (infoAirports.data) {
      setAirports(infoAirports.data.airports || []);
    }
  }, [infoAirports.data]);

  const airportOptions = airports.map((airport) => ({
    label: `${airport.code} ${airport.name}, город: ${airport.city}`,
    id: airport.id,
    code: airport.code,
    city: airport.city,
  }));

  const usedLocations = useMemo(
    () => collectUsedLocations(addTarif, appliesTo),
    [addTarif, appliesTo],
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

    const used = collectUsedLocations(addTarif, nextAppliesTo);
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

  // console.log(airportOptions);

  const [tarifNames, setTarifNames] = useState([]);
  const [isEdited, setIsEdited] = useState(false);
  const sidebarRef = useRef();

  const resetForm = useCallback(() => {
    setFormData(createEmptyTariffInput());
    setIsEdited(false);
    setSkippedAirports([]);
    setRemovedByAppliesTo(null);
    setContractType("individual");
    setAppliesTo(DEFAULT_APPLIES_TO);
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

  const handleFileChange = (e) => {
    const files = e.target.files;
    if (!files?.length) return;

    if (files.length > 8) {
      showAlert("Вы можете загрузить не более 8 изображений.");
      e.target.value = null;
      return;
    }

    const fileArray = Array.from(files);
    setIsEdited(true);
    setFormData((prevState) => ({
      ...prevState,
      images: fileArray,
    }));
  };

  // console.log(selectedContract?.id);
  // console.log(id);

  // Форма презентационная: валидирует и отдаёт готовую запись родителю (onSubmit).
  // Мутацию/refetch/тосты/закрытие выполняет родитель (AirlineTarifs_tabComponent).
  const handleSubmit = (e) => {
    e.preventDefault();

    if (!formData.name?.trim()) {
      showAlert("Пожалуйста, укажите название договора.");
      return;
    }

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
      coerceZero: true,
      appliesTo,
    });
    const displayItem = tariffFormToDisplayItem(formData, contractType, airports, {
      appliesTo,
    });
    onSubmit?.(record, displayItem);
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


  const categories = [
    {
      value: "onePlace",
      label: "Одноместный",
    },
    {
      value: "twoPlace",
      label: "Двухместный",
    },
    {
      value: "threePlace",
      label: "Трехместный",
    },
    {
      value: "fourPlace",
      label: "Четырехместный",
    },
    {
      value: "fivePlace",
      label: "Пятиместный",
    },
    {
      value: "sixPlace",
      label: "Шестиместный",
    },
    {
      value: "sevenPlace",
      label: "Семиместный",
    },
    {
      value: "eightPlace",
      label: "Восьмиместный",
    },
  ];

  const apartmentCategories = [
    {
      value: "apartment",
      label: "Апартаменты",
    },
    {
      value: "studio",
      label: "Студия",
    },
  ];

  const useCategories = type === "apartment" ? apartmentCategories : categories;

  const geoHasData = rowsToGeographyInput(formData.geography).length > 0;
  const airportsHasData = (formData.airportIds?.length || 0) > 0;
  const inactiveHasData = contractType === "individual" ? geoHasData : airportsHasData;
  const switchHint =
    contractType === "individual"
      ? "При сохранении договор станет только по аэропортам; регионы и города будут очищены."
      : "При сохранении договор станет только по регионам/городам; аэропорты будут очищены.";

  const allAirportsUsed =
    airportOptions.length > 0 &&
    airportOptions.every((o) => usedAirportIds.has(String(o.id)));

  // console.log(formData)

  return (
    <Sidebar show={show} sidebarRef={sidebarRef}>
      <div className={classes.requestTitle}>
        <div className={classes.requestTitle_name}>Добавить договор</div>
        <div className={classes.requestTitle_close} onClick={closeButton}>
          <CloseIcon />
        </div>
      </div>

      {(
        <>
          <div className={classes.requestMiddle}>
            <div className={classes.requestData}>
              {/* <label>Выберите категорию</label>
              <MUIAutocomplete
                dropdownWidth={"100%"}
                label={"Выберите категорию"}
                options={useCategories.map((category) => category.label)}
                value={
                  useCategories.find(
                    (category) => category.value === formData.category
                  ) || ""
                }
                onChange={(event, newValue) => {
                  const selectedCategory = useCategories.find(
                    (category) => category.label === newValue
                  );
                  setFormData((prevFormData) => ({
                    ...prevFormData,
                    category: selectedCategory.value,
                  }));
                  //   setIsEdited(true);
                }}
              /> */}

              <span className={classes.hint}>* — обязательные поля</span>
              <label className={classes.required}>Название договора</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Например: Договор №1"
              />

              <label>Применяется к</label>
              <ContractTypeToggle
                value={appliesTo}
                options={PRICE_APPLIES_TO_OPTIONS}
                onChange={handleAppliesToChange}
              />
              {appliesTo === "all" && (
                <div className={classes.airportHint}>
                  Локации этого ценника станут недоступны для ценников «Эскадрилья» и «ФАП».
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

              <label>Тип договора</label>
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

              {contractType === "individual" ? (
                <>
                  <label className={classes.required}>Аэропорты</label>
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
                    getOptionDisabled={(opt) => usedAirportIds.has(String(opt.id))}
                    value={airportOptions.filter((option) =>
                      formData.airportIds?.includes(option.id)
                    )}
                    onChange={(event, newValue, reason, details) => {
                      setIsEdited(true);
                      setRemovedByAppliesTo(null);
                      setFormData((prevFormData) => ({
                        ...prevFormData,
                        airportIds: newValue.map((option) => option.id),
                      }));
                      if (details?.option?.isSelectAll && newValue.length > 0) {
                        setSkippedAirports(
                          airportOptions.filter((o) =>
                            usedAirportIds.has(String(o.id))
                          )
                        );
                      } else {
                        setSkippedAirports([]);
                      }
                    }}
                  />
                </>
              ) : (
                <TariffGeographyList
                  value={formData.geography}
                  usedRegionIds={usedGeo.regionIds}
                  usedCityIds={usedGeo.cityIds}
                  onChange={(rows) => {
                    setIsEdited(true);
                    setRemovedByAppliesTo(null);
                    setFormData((prev) => ({ ...prev, geography: rows }));
                  }}
                />
              )}

              <label>Стоимость одноместного</label>
              <input
                type="number"
                name="priceOneCategory"
                value={formData.priceOneCategory}
                onChange={handleChange}
                placeholder="Введите стоимость"
              />

              <label>Стоимость двухместного</label>
              <input
                type="number"
                name="priceTwoCategory"
                value={formData.priceTwoCategory}
                onChange={handleChange}
                placeholder="Введите стоимость"
              />

              <label>Стоимость трехместного</label>
              <input
                type="number"
                name="priceThreeCategory"
                value={formData.priceThreeCategory}
                onChange={handleChange}
                placeholder="Введите стоимость"
              />
              <label>Стоимость четырехместного</label>
              <input
                type="number"
                name="priceFourCategory"
                value={formData.priceFourCategory}
                onChange={handleChange}
                placeholder="Введите стоимость"
              />
              <label>Стоимость пятиместного</label>
              <input
                type="number"
                name="priceFiveCategory"
                value={formData.priceFiveCategory}
                onChange={handleChange}
                placeholder="Введите стоимость"
              />
              <label>Стоимость шестиместного</label>
              <input
                type="number"
                name="priceSixCategory"
                value={formData.priceSixCategory}
                onChange={handleChange}
                placeholder="Введите стоимость"
              />
              <label>Стоимость семиместного</label>
              <input
                type="number"
                name="priceSevenCategory"
                value={formData.priceSevenCategory}
                onChange={handleChange}
                placeholder="Введите стоимость"
              />
              <label>Стоимость восьмиместного</label>
              <input
                type="number"
                name="priceEightCategory"
                value={formData.priceEightCategory}
                onChange={handleChange}
                placeholder="Введите стоимость"
              />
              <label>Стоимость девятиместного</label>
              <input
                type="number"
                name="priceNineCategory"
                value={formData.priceNineCategory}
                onChange={handleChange}
                placeholder="Введите стоимость"
              />
              <label>Стоимость десятиместного</label>
              <input
                type="number"
                name="priceTenCategory"
                value={formData.priceTenCategory}
                onChange={handleChange}
                placeholder="Введите стоимость"
              />
              <label>Стоимость люкса</label>
              <input
                type="number"
                name="priceLuxe"
                value={formData.priceLuxe}
                onChange={handleChange}
                placeholder="Введите стоимость"
              />
              <label>Стоимость комфорт</label>
              <input
                type="number"
                name="priceComfort"
                value={formData.priceComfort}
                onChange={handleChange}
                placeholder="Введите стоимость"
              />
              <label>Стоимость улучшенный комфорт</label>
              <input
                type="number"
                name="priceImprovedComfort"
                value={formData.priceImprovedComfort}
                onChange={handleChange}
                placeholder="Введите стоимость"
              />
              <label>Стоимость апартаментов</label>
              <input
                type="number"
                name="priceApartment"
                value={formData.priceApartment}
                onChange={handleChange}
                placeholder="Введите стоимость"
              />
              <label>Стоимость студии</label>
              <input
                type="number"
                name="priceStudio"
                value={formData.priceStudio}
                onChange={handleChange}
                placeholder="Введите стоимость"
              />
              <label>Завтрак</label>
              <input
                type="number"
                name="breakfast"
                value={formData.breakfast}
                onChange={handleChange}
                placeholder="Завтрак"
              />
              <label>Обед</label>
              <input
                type="number"
                name="lunch"
                value={formData.lunch}
                onChange={handleChange}
                placeholder="Обед"
              />
              <label>Ужин</label>
              <input
                type="number"
                name="dinner"
                value={formData.dinner}
                onChange={handleChange}
                placeholder="Ужин"
              />
            </div>
          </div>
          <div className={classes.requestButton}>
            <Button type="submit" onClick={handleSubmit}>
              Добавить договор
            </Button>
          </div>
        </>
      )}
    </Sidebar>
  );
}

export default CreateRequestAirlineTarifCategory;
