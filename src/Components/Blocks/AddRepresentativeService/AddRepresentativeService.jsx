import React, { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { useMutation, useQuery } from "@apollo/client";
import classes from "./AddRepresentativeService.module.css";
import Button from "../../Standart/Button/Button.jsx";
import Sidebar from "../Sidebar/Sidebar.jsx";
import {
  CREATE_PASSENGER_REQUEST,
  GET_AIRLINES_RELAY,
  GET_PASSENGER_REQUEST,
  GET_PASSENGER_REQUESTS,
  getCookie,
  UPDATE_PASSENGER_REQUEST,
} from "../../../../graphQL_requests.js";
import MUILoader from "../MUILoader/MUILoader.jsx";
import MultiSelectAutocomplete from "../MultiSelectAutocomplete/MultiSelectAutocomplete.jsx";
import CloseIcon from "../../../shared/icons/CloseIcon.jsx";

function AddRepresentativeService({
  show,
  onClose,
  user,
  request,
  addNotification,
}) {
  const token = getCookie("token");
  const [isEdited, setIsEdited] = useState(false);
  const sidebarRef = useRef();

  // Экипаж заявки
  const airlineId = request?.airline?.id ?? request?.airlineId;
  const [selectedCrew, setSelectedCrew] = useState([]);

  const { data: airlinesData } = useQuery(GET_AIRLINES_RELAY, {
    context: { headers: { Authorization: `Bearer ${token}` } },
    skip: !show,
  });

  const crewOptions = useMemo(() => {
    const airlines = airlinesData?.airlines?.airlines || [];
    const airline = airlines.find((a) => a.id === airlineId);
    return (airline?.staff || []).map((s) => ({
      id: s.id,
      name: s.name || "",
      positionName: s.position?.name || "",
      gender: s.gender || "",
      number: s.number || "",
      label: [s.name, s.position?.name, s.gender].filter(Boolean).join(", "),
    }));
  }, [airlinesData, airlineId]);

  // Инициализация выбранного экипажа из ростера заявки
  useEffect(() => {
    if (!show) return;
    const existing = request?.crewMembers || [];
    const mapped = existing.map((m) => {
      const opt = crewOptions.find((o) => o.id === m.airlinePersonalId);
      return (
        opt || {
          id: m.airlinePersonalId || m.fullName,
          name: m.fullName || "",
          positionName: m.position || "",
          gender: m.gender || "",
          number: m.phone || "",
          label: [m.fullName, m.position, m.gender].filter(Boolean).join(", "),
        }
      );
    });
    setSelectedCrew(mapped);
  }, [show, request?.crewMembers, crewOptions]);

  // Определяем, какие услуги уже есть в заявке
  const hasWaterService = !!request?.waterService?.plan?.enabled;
  const hasMealService = !!request?.mealService?.plan?.enabled;
  const hasLivingService = !!request?.livingService?.plan?.enabled;
  const hasArrivalTransferService = !!request?.transferService?.plan?.enabled;
  const hasDepartureTransferService = !!request?.departureTransferService?.plan?.enabled;
  const hasBaggageDeliveryService = !!request?.baggageDeliveryService?.plan?.enabled;

  // Helpers: ISO → "HH:MM" и "YYYY-MM-DD"
  const isoToTime = (iso) => {
    if (!iso) return "";
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "";
    return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  };
  const isoToDate = (iso) => {
    if (!iso) return "";
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "";
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  };

  // Счётчики уже добавленных данных — для confirm-предупреждения при отключении услуги
  const waterCount = request?.waterService?.people?.length ?? 0;
  const mealCount = request?.mealService?.people?.length ?? 0;
  const livingHotelsCount = request?.livingService?.hotels?.length ?? 0;
  const arrivalDriversCount = request?.transferService?.drivers?.length ?? 0;
  const departureDriversCount = request?.departureTransferService?.drivers?.length ?? 0;
  const baggageDriversCount = request?.baggageDeliveryService?.drivers?.length ?? 0;

  // Инициализируем форму
  const [formData, setFormData] = useState({
    waterSupply: false,
    waterPeopleCount: "",
    waterPlannedAt: "",
    foodSupply: false,
    foodPeopleCount: "",
    foodPlannedAt: "",
    habitation: false,
    habitationPeopleCount: "",
    habitationPlannedFromDate: "",
    habitationPlannedFromTime: "",
    habitationPlannedToDate: "",
    habitationPlannedToTime: "",
    transferArrival: false,
    transferArrivalPeopleCount: "",
    transferArrivalPlannedAt: "",
    transferDeparture: false,
    transferDeparturePeopleCount: "",
    transferDeparturePlannedAt: "",
    baggageDelivery: false,
    baggageDeliveryPlannedAt: "",
  });

  // Префилл формы из существующих сервисов при открытии
  useEffect(() => {
    if (!show) return;
    setFormData({
      waterSupply: hasWaterService,
      waterPeopleCount: request?.waterService?.plan?.peopleCount?.toString() ?? "",
      waterPlannedAt: isoToTime(request?.waterService?.plan?.plannedAt),

      foodSupply: hasMealService,
      foodPeopleCount: request?.mealService?.plan?.peopleCount?.toString() ?? "",
      foodPlannedAt: isoToTime(request?.mealService?.plan?.plannedAt),

      habitation: hasLivingService,
      habitationPeopleCount: request?.livingService?.plan?.peopleCount?.toString() ?? "",
      habitationPlannedFromDate: isoToDate(request?.livingService?.plan?.plannedFromAt),
      habitationPlannedFromTime: isoToTime(request?.livingService?.plan?.plannedFromAt),
      habitationPlannedToDate: isoToDate(request?.livingService?.plan?.plannedToAt),
      habitationPlannedToTime: isoToTime(request?.livingService?.plan?.plannedToAt),

      transferArrival: hasArrivalTransferService,
      transferArrivalPeopleCount: request?.transferService?.plan?.peopleCount?.toString() ?? "",
      transferArrivalPlannedAt: isoToTime(request?.transferService?.plan?.plannedAt),

      transferDeparture: hasDepartureTransferService,
      transferDeparturePeopleCount: request?.departureTransferService?.plan?.peopleCount?.toString() ?? "",
      transferDeparturePlannedAt: isoToTime(request?.departureTransferService?.plan?.plannedAt),

      baggageDelivery: hasBaggageDeliveryService,
      baggageDeliveryPlannedAt: isoToTime(request?.baggageDeliveryService?.plan?.plannedAt),
    });
    setIsEdited(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [show, request?.id]);

  const [updatePassengerRequest] = useMutation(UPDATE_PASSENGER_REQUEST, {
    context: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
    refetchQueries: [{ query: GET_PASSENGER_REQUEST, variables: { passengerRequestId: request?.id } }],
    awaitRefetchQueries: true,
  });

  const resetForm = useCallback(() => {
    setFormData({
      waterSupply: false,
      waterPeopleCount: "",
      waterPlannedAt: "",
      foodSupply: false,
      foodPeopleCount: "",
      foodPlannedAt: "",
      habitation: false,
      habitationPeopleCount: "",
      habitationPlannedFromDate: "",
      habitationPlannedFromTime: "",
      habitationPlannedToDate: "",
      habitationPlannedToTime: "",
      transferArrival: false,
      transferArrivalPeopleCount: "",
      transferArrivalPlannedAt: "",
      transferDeparture: false,
      transferDeparturePeopleCount: "",
      transferDeparturePlannedAt: "",
      baggageDelivery: false,
      baggageDeliveryPlannedAt: "",
    });
    setIsEdited(false);
  }, []);

  const closeButton = useCallback(() => {
    if (!isEdited) {
      resetForm();
      onClose();
      return;
    }

    if (window.confirm("Вы уверены? Все несохраненные данные будут удалены.")) {
      resetForm();
      onClose();
    }
  }, [isEdited, resetForm, onClose]);

  const confirmDisable = (was, dataCount, label) => {
    if (!was || dataCount === 0) return true;
    return window.confirm(
      `Услуга «${label}» будет отключена. К ней привязаны данные (${dataCount}). Сохранённые данные не удаляются — услугу можно включить снова. Продолжить?`
    );
  };

  const handleChange = useCallback((e) => {
    const { name, type, checked, value } = e.target;

    if (type === "checkbox") {
      // Подтверждение отключения услуги с данными
      if (!checked) {
        if (name === "waterSupply" && !confirmDisable(hasWaterService, waterCount, "Поставка воды")) return;
        if (name === "foodSupply" && !confirmDisable(hasMealService, mealCount, "Поставка питания")) return;
        if (name === "habitation" && !confirmDisable(hasLivingService, livingHotelsCount, "Проживание")) return;
        if (name === "transferArrival" && !confirmDisable(hasArrivalTransferService, arrivalDriversCount, "Трансфер с аэропорта до гостиницы")) return;
        if (name === "transferDeparture" && !confirmDisable(hasDepartureTransferService, departureDriversCount, "Трансфер с гостиницы до аэропорта")) return;
        if (name === "baggageDelivery" && !confirmDisable(hasBaggageDeliveryService, baggageDriversCount, "Доставка багажа")) return;
      }
      setIsEdited(true);

      setFormData((prev) => {
        if (name === "habitation") {
          return {
            ...prev,
            habitation: checked,
            habitationPeopleCount: checked ? prev.habitationPeopleCount : "",
            habitationPlannedFromDate: checked ? prev.habitationPlannedFromDate : "",
            habitationPlannedFromTime: checked ? prev.habitationPlannedFromTime : "",
            habitationPlannedToDate: checked ? prev.habitationPlannedToDate : "",
            habitationPlannedToTime: checked ? prev.habitationPlannedToTime : "",
          };
        }

        if (name === "transferArrival") {
          return {
            ...prev,
            transferArrival: checked,
            transferArrivalPeopleCount: checked ? prev.transferArrivalPeopleCount : "",
            transferArrivalPlannedAt: checked ? prev.transferArrivalPlannedAt : "",
          };
        }

        if (name === "transferDeparture") {
          return {
            ...prev,
            transferDeparture: checked,
            transferDeparturePeopleCount: checked ? prev.transferDeparturePeopleCount : "",
            transferDeparturePlannedAt: checked ? prev.transferDeparturePlannedAt : "",
          };
        }

        if (name === "baggageDelivery") {
          return {
            ...prev,
            baggageDelivery: checked,
            baggageDeliveryPlannedAt: checked ? prev.baggageDeliveryPlannedAt : "",
          };
        }

        if (name === "waterSupply") {
          return {
            ...prev,
            waterSupply: checked,
            waterPeopleCount: checked ? prev.waterPeopleCount : "",
            waterPlannedAt: checked ? prev.waterPlannedAt : "",
          };
        }

        if (name === "foodSupply") {
          return {
            ...prev,
            foodSupply: checked,
            foodPeopleCount: checked ? prev.foodPeopleCount : "",
            foodPlannedAt: checked ? prev.foodPlannedAt : "",
          };
        }

        return {
          ...prev,
          [name]: checked,
        };
      });
    } else {
      setIsEdited(true);
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasWaterService, hasMealService, hasLivingService, hasArrivalTransferService, hasDepartureTransferService, hasBaggageDeliveryService, waterCount, mealCount, livingHotelsCount, arrivalDriversCount, departureDriversCount, baggageDriversCount]);

  const buildPlannedAt = (timeStr) => {
    if (!timeStr) return null;
    const [hours, minutes] = timeStr.split(":").map(Number);
    const d = new Date();
    d.setHours(hours, minutes, 0, 0);
    return d.toISOString();
  };

  const buildPlannedFromTo = (dateStr, timeStr) => {
    if (!dateStr || !timeStr) return null;
    const [hours, minutes] = timeStr.split(":").map(Number);
    const [y, m, d] = dateStr.split("-").map(Number);
    const date = new Date(y, m - 1, d, hours, minutes, 0, 0);
    return date.toISOString();
  };

  const isFormValid = () => {
    // const hasAnyNewService =
    //   (!hasWaterService && formData.waterSupply) ||
    //   (!hasMealService && formData.foodSupply) ||
    //   (!hasLivingService && formData.habitation) ||
    //   (!hasTransferService && formData.transferHabitation);

    // if (!hasAnyNewService) return false;

    // if (!hasWaterService && formData.waterSupply) {
    //   if (!formData.waterPeopleCount || !formData.waterPlannedAt) return false;
    // }
    // if (!hasMealService && formData.foodSupply) {
    //   if (!formData.foodPeopleCount || !formData.foodPlannedAt) return false;
    // }
    // if (!hasLivingService && formData.habitation) {
    //   if (!formData.habitationPeopleCount || !formData.habitationPlannedAt) return false;
    // }
    // if (!hasTransferService && formData.transferHabitation) {
    //   if (!formData.transferHabitationPeopleCount || !formData.transferHabitationPlannedAt) return false;
    // }

    return true;
  };

  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async () => {
    setIsLoading(true);

    if (!isFormValid()) {
      alert("Пожалуйста, заполните все обязательные поля для выбранных услуг.");
      setIsLoading(false);
      return;
    }

    const input = {};

    // Вода
    if (formData.waterSupply) {
      input.waterService = {
        plan: {
          enabled: true,
          peopleCount: Number(formData.waterPeopleCount),
          plannedAt: buildPlannedAt(formData.waterPlannedAt),
        },
      };
    } else if (hasWaterService) {
      input.waterService = { plan: { enabled: false } };
    }

    // Питание
    if (formData.foodSupply) {
      input.mealService = {
        plan: {
          enabled: true,
          peopleCount: Number(formData.foodPeopleCount),
          plannedAt: buildPlannedAt(formData.foodPlannedAt),
        },
      };
    } else if (hasMealService) {
      input.mealService = { plan: { enabled: false } };
    }

    // Проживание
    if (formData.habitation) {
      input.livingService = {
        plan: {
          enabled: true,
          peopleCount: Number(formData.habitationPeopleCount),
          plannedFromAt: buildPlannedFromTo(formData.habitationPlannedFromDate, formData.habitationPlannedFromTime),
          plannedToAt: buildPlannedFromTo(formData.habitationPlannedToDate, formData.habitationPlannedToTime),
        },
      };
    } else if (hasLivingService) {
      input.livingService = { plan: { enabled: false } };
    }

    // Трансфер аэропорт → гостиница
    if (formData.transferArrival) {
      input.transferService = {
        plan: {
          enabled: true,
          peopleCount: Number(formData.transferArrivalPeopleCount),
          plannedAt: buildPlannedAt(formData.transferArrivalPlannedAt),
        },
      };
    } else if (hasArrivalTransferService) {
      input.transferService = { plan: { enabled: false } };
    }

    // Трансфер гостиница → аэропорт
    if (formData.transferDeparture) {
      input.departureTransferService = {
        plan: {
          enabled: true,
          peopleCount: Number(formData.transferDeparturePeopleCount),
          plannedAt: buildPlannedAt(formData.transferDeparturePlannedAt),
        },
      };
    } else if (hasDepartureTransferService) {
      input.departureTransferService = { plan: { enabled: false } };
    }

    // Доставка багажа
    if (formData.baggageDelivery) {
      input.baggageDeliveryService = {
        plan: {
          enabled: true,
          plannedAt: buildPlannedAt(formData.baggageDeliveryPlannedAt),
        },
      };
    } else if (hasBaggageDeliveryService) {
      input.baggageDeliveryService = { plan: { enabled: false } };
    }

    // Экипаж: ростер + флаг включения
    const crewMembers = selectedCrew.map((c) => ({
      airlinePersonalId: c.id,
      fullName: c.name,
      position: c.positionName || null,
      gender: c.gender || null,
      phone: c.number || null,
    }));
    const crewChanged =
      JSON.stringify((request?.crewMembers || []).map((m) => m.airlinePersonalId)) !==
      JSON.stringify(crewMembers.map((m) => m.airlinePersonalId));
    if (crewChanged) {
      input.crewMembers = crewMembers;
      input.includesCrew = crewMembers.length > 0;
    }

    // Если нет изменений
    if (Object.keys(input).length === 0) {
      alert("Нет изменений для сохранения.");
      setIsLoading(false);
      return;
    }

    try {
      await updatePassengerRequest({
        variables: { updatePassengerRequestId: request?.id, input },
      });
      resetForm();
      onClose();
      if (addNotification) {
        addNotification("Заявка обновлена.", "success");
      }
    } catch (error) {
      console.error(error);
      alert("Ошибка при сохранении заявки");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
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

    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [show, closeButton]);

  return (
    <>
      <Sidebar show={show} sidebarRef={sidebarRef}>
        <div className={classes.requestTitle}>
          <div className={classes.requestTitle_name}>Редактировать заявку</div>
          <div className={classes.requestTitle_close} onClick={closeButton}>
            <CloseIcon />
          </div>
        </div>

        {isLoading ? (
          <MUILoader loadSize={"50px"} fullHeight={"75vh"} />
        ) : (
          <>
            <div className={classes.requestMiddle}>
              <div className={classes.requestData}>
                <div className={classes.typeServices}>Экипаж</div>
                <label>Сотрудники экипажа</label>
                <MultiSelectAutocomplete
                  dropdownWidth="100%"
                  label="Выберите сотрудников"
                  isMultiple
                  showSelectAll
                  listboxHeight="220px"
                  options={crewOptions}
                  value={selectedCrew}
                  onChange={(event, newValue) => {
                    setSelectedCrew(newValue || []);
                    setIsEdited(true);
                  }}
                />

                <div className={classes.typeServices}>Вид услуг</div>

                {/* Поставка воды */}
                <label className={classes.checkBoxWrapper}>
                  <input
                    type="checkbox"
                    name="waterSupply"
                    checked={formData.waterSupply}
                    onChange={handleChange}
                  />
                  Поставка питьевой воды
                  {hasWaterService && waterCount > 0 && (
                    <span className={classes.serviceMeta}>выдано: {waterCount}</span>
                  )}
                </label>
                {formData.waterSupply && (
                  <>
                    <label>Введите количество человек</label>
                    <input
                      type="number"
                      name="waterPeopleCount"
                      value={formData.waterPeopleCount}
                      onChange={handleChange}
                    />
                    <label>Введите время подачи в аэропорт</label>
                    <input
                      type="time"
                      name="waterPlannedAt"
                      value={formData.waterPlannedAt}
                      onChange={handleChange}
                      placeholder="Время"
                    />
                  </>
                )}

                {/* Поставка питания */}
                <label className={classes.checkBoxWrapper}>
                  <input
                    type="checkbox"
                    name="foodSupply"
                    checked={formData.foodSupply}
                    onChange={handleChange}
                  />
                  Поставка питания
                  {hasMealService && mealCount > 0 && (
                    <span className={classes.serviceMeta}>выдано: {mealCount}</span>
                  )}
                </label>
                {formData.foodSupply && (
                  <>
                    <label>Введите количество человек</label>
                    <input
                      type="number"
                      name="foodPeopleCount"
                      value={formData.foodPeopleCount}
                      onChange={handleChange}
                    />
                    <label>Введите время подачи в аэропорт</label>
                    <input
                      type="time"
                      name="foodPlannedAt"
                      value={formData.foodPlannedAt}
                      onChange={handleChange}
                      placeholder="Время"
                    />
                  </>
                )}

                {/* Проживание */}
                <label className={classes.checkBoxWrapper}>
                  <input
                    type="checkbox"
                    name="habitation"
                    checked={formData.habitation}
                    onChange={handleChange}
                  />
                  Проживание
                  {hasLivingService && livingHotelsCount > 0 && (
                    <span className={classes.serviceMeta}>отелей: {livingHotelsCount}</span>
                  )}
                </label>
                {formData.habitation && (
                  <>
                    <label>Введите количество человек</label>
                    <input
                      type="number"
                      name="habitationPeopleCount"
                      value={formData.habitationPeopleCount}
                      onChange={handleChange}
                    />
                    <label>Дата и время заезда</label>
                    <input
                      type="date"
                      name="habitationPlannedFromDate"
                      value={formData.habitationPlannedFromDate}
                      onChange={handleChange}
                    />
                    <input
                      type="time"
                      name="habitationPlannedFromTime"
                      value={formData.habitationPlannedFromTime}
                      onChange={handleChange}
                    />
                    <label>Дата и время выезда</label>
                    <input
                      type="date"
                      name="habitationPlannedToDate"
                      value={formData.habitationPlannedToDate}
                      onChange={handleChange}
                    />
                    <input
                      type="time"
                      name="habitationPlannedToTime"
                      value={formData.habitationPlannedToTime}
                      onChange={handleChange}
                    />
                  </>
                )}

                {/* Трансфер: аэропорт → гостиница */}
                <label className={classes.checkBoxWrapper}>
                  <input
                    type="checkbox"
                    name="transferArrival"
                    checked={formData.transferArrival}
                    onChange={handleChange}
                  />
                  Трансфер с аэропорта до гостиницы
                  {hasArrivalTransferService && arrivalDriversCount > 0 && (
                    <span className={classes.serviceMeta}>водителей: {arrivalDriversCount}</span>
                  )}
                </label>
                {formData.transferArrival && (
                  <>
                    <label>Введите количество человек</label>
                    <input
                      type="number"
                      name="transferArrivalPeopleCount"
                      value={formData.transferArrivalPeopleCount}
                      onChange={handleChange}
                    />
                    <label>Введите время подачи в аэропорт</label>
                    <input
                      type="time"
                      name="transferArrivalPlannedAt"
                      value={formData.transferArrivalPlannedAt}
                      onChange={handleChange}
                      placeholder="Время"
                    />
                  </>
                )}

                {/* Трансфер: гостиница → аэропорт */}
                <label className={classes.checkBoxWrapper}>
                  <input
                    type="checkbox"
                    name="transferDeparture"
                    checked={formData.transferDeparture}
                    onChange={handleChange}
                  />
                  Трансфер с гостиницы до аэропорта
                  {hasDepartureTransferService && departureDriversCount > 0 && (
                    <span className={classes.serviceMeta}>водителей: {departureDriversCount}</span>
                  )}
                </label>
                {formData.transferDeparture && (
                  <>
                    <label>Введите количество человек</label>
                    <input
                      type="number"
                      name="transferDeparturePeopleCount"
                      value={formData.transferDeparturePeopleCount}
                      onChange={handleChange}
                    />
                    <label>Введите время подачи к гостинице</label>
                    <input
                      type="time"
                      name="transferDeparturePlannedAt"
                      value={formData.transferDeparturePlannedAt}
                      onChange={handleChange}
                      placeholder="Время"
                    />
                  </>
                )}

                {/* Доставка багажа */}
                <label className={classes.checkBoxWrapper}>
                  <input
                    type="checkbox"
                    name="baggageDelivery"
                    checked={formData.baggageDelivery}
                    onChange={handleChange}
                  />
                  Доставка багажа
                  {hasBaggageDeliveryService && baggageDriversCount > 0 && (
                    <span className={classes.serviceMeta}>водителей: {baggageDriversCount}</span>
                  )}
                </label>
                {formData.baggageDelivery && (
                  <>
                    <label>Введите время</label>
                    <input
                      type="time"
                      name="baggageDeliveryPlannedAt"
                      value={formData.baggageDeliveryPlannedAt}
                      onChange={handleChange}
                      placeholder="Время"
                    />
                  </>
                )}
              </div>
            </div>

            <div className={classes.requestButton}>
              <Button onClick={handleSubmit}>Сохранить</Button>
            </div>
          </>
        )}
      </Sidebar>
    </>
  );
}

export default AddRepresentativeService;