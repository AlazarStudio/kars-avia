import React, { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { useMutation, useQuery } from "@apollo/client";
import classes from "./AddRepresentativeService.module.css";
import Button from "../../Standart/Button/Button.jsx";
import Sidebar from "../Sidebar/Sidebar.jsx";
import {
  ADD_PASSENGER_REQUEST_SAVED_PEOPLE,
  CREATE_PASSENGER_REQUEST,
  GET_AIRLINE_POSITIONS,
  GET_AIRLINES_RELAY,
  GET_PASSENGER_REQUEST,
  GET_PASSENGER_REQUESTS,
  getCookie,
  UPDATE_PASSENGER_REQUEST,
} from "../../../../graphQL_requests.js";
import MUILoader from "../MUILoader/MUILoader.jsx";
import MultiSelectAutocomplete from "../MultiSelectAutocomplete/MultiSelectAutocomplete.jsx";
import CreateRequestAirlineStaff from "../CreateRequestAirlineStaff/CreateRequestAirlineStaff.jsx";
import CloseIcon from "../../../shared/icons/CloseIcon.jsx";
import ManifestUploadField from "../FapV2/ManifestUploadField/ManifestUploadField.jsx";
import { manifestNameKey, isSameFlight } from "../../../utils/parseManifestXlsx.js";
import { useDialog } from "../../../contexts/DialogContext";

function AddRepresentativeService({
  show,
  onClose,
  user,
  request,
  addNotification,
}) {
  const token = getCookie("token");
  const { confirm } = useDialog();
  const [isEdited, setIsEdited] = useState(false);
  const sidebarRef = useRef();

  // Экипаж заявки
  const airlineId = request?.airline?.id ?? request?.airlineId;
  const [selectedCrew, setSelectedCrew] = useState([]);
  const [positions, setPositions] = useState([]);
  const [showAddStaff, setShowAddStaff] = useState(false);
  const [newStaffData, setNewStaffData] = useState(null);

  // Распарсенный манифест: { people, flightNumber, fileName } | null
  const [manifest, setManifest] = useState(null);

  const { data: airlinesData, refetch: refetchAirlines } = useQuery(GET_AIRLINES_RELAY, {
    context: { headers: { Authorization: `Bearer ${token}` } },
    skip: !show,
  });

  const { data: airlinePositionsData } = useQuery(GET_AIRLINE_POSITIONS, {
    context: { headers: { Authorization: `Bearer ${token}` } },
    skip: !show,
  });

  useEffect(() => {
    if (airlinePositionsData) {
      setPositions(airlinePositionsData.getAirlinePositions || []);
    }
  }, [airlinePositionsData]);

  const toggleAddStaff = useCallback(() => {
    setShowAddStaff((prev) => !prev);
  }, []);

  useEffect(() => {
    if (!newStaffData) return;
    const newOption = {
      id: newStaffData.id,
      name: newStaffData.name || "",
      positionName: newStaffData.position?.name || "",
      gender: newStaffData.gender || "",
      number: newStaffData.number || "",
      label: [newStaffData.name, newStaffData.position?.name, newStaffData.gender]
        .filter(Boolean)
        .join(", "),
    };
    setSelectedCrew((prev) =>
      prev.some((c) => c.id === newOption.id) ? prev : [...prev, newOption]
    );
    setIsEdited(true);
    setNewStaffData(null);
  }, [newStaffData]);

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

  // Инициализация выбранного экипажа из ростера заявки —
  // один раз на открытие/смену заявки, иначе авто-выбор нового сотрудника
  // затирался бы рефетчем airlines после добавления через "+"
  const crewInitKeyRef = useRef(null);
  useEffect(() => {
    if (!show) {
      crewInitKeyRef.current = null;
      return;
    }
    const key = request?.id || "empty";
    if (crewInitKeyRef.current === key) return;
    // ждём загрузки crewOptions, если в заявке уже есть сотрудники
    if ((request?.crewMembers?.length || 0) > 0 && crewOptions.length === 0) return;

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
    crewInitKeyRef.current = key;
  }, [show, request?.id, request?.crewMembers, crewOptions]);

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

  // Дата рейса: ISO из request → значение для <input type="date">
  const [flightDate, setFlightDate] = useState("");
  useEffect(() => {
    if (!show) return;
    setFlightDate(isoToDate(request?.flightDate));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [show, request?.id]);

  // Инициализируем форму
  const [formData, setFormData] = useState({
    waterSupply: false,
    waterPeopleCount: "",
    waterPlannedDate: "",
    waterPlannedAt: "",
    foodSupply: false,
    foodPeopleCount: "",
    foodPlannedDate: "",
    foodPlannedAt: "",
    habitation: false,
    habitationPeopleCount: "",
    habitationPlannedFromDate: "",
    habitationPlannedFromTime: "",
    habitationPlannedToDate: "",
    habitationPlannedToTime: "",
    transferArrival: false,
    transferArrivalPeopleCount: "",
    transferArrivalPlannedDate: "",
    transferArrivalPlannedAt: "",
    transferDeparture: false,
    transferDeparturePeopleCount: "",
    transferDeparturePlannedDate: "",
    transferDeparturePlannedAt: "",
    baggageDelivery: false,
    baggageDeliveryPlannedDate: "",
    baggageDeliveryPlannedAt: "",
  });

  // Префилл формы из существующих сервисов при открытии
  useEffect(() => {
    if (!show) return;
    setFormData({
      waterSupply: hasWaterService,
      waterPeopleCount: request?.waterService?.plan?.peopleCount?.toString() ?? "",
      waterPlannedDate: isoToDate(request?.waterService?.plan?.plannedAt),
      waterPlannedAt: isoToTime(request?.waterService?.plan?.plannedAt),

      foodSupply: hasMealService,
      foodPeopleCount: request?.mealService?.plan?.peopleCount?.toString() ?? "",
      foodPlannedDate: isoToDate(request?.mealService?.plan?.plannedAt),
      foodPlannedAt: isoToTime(request?.mealService?.plan?.plannedAt),

      habitation: hasLivingService,
      habitationPeopleCount: request?.livingService?.plan?.peopleCount?.toString() ?? "",
      habitationPlannedFromDate: isoToDate(request?.livingService?.plan?.plannedFromAt),
      habitationPlannedFromTime: isoToTime(request?.livingService?.plan?.plannedFromAt),
      habitationPlannedToDate: isoToDate(request?.livingService?.plan?.plannedToAt),
      habitationPlannedToTime: isoToTime(request?.livingService?.plan?.plannedToAt),

      transferArrival: hasArrivalTransferService,
      transferArrivalPeopleCount: request?.transferService?.plan?.peopleCount?.toString() ?? "",
      transferArrivalPlannedDate: isoToDate(request?.transferService?.plan?.plannedAt),
      transferArrivalPlannedAt: isoToTime(request?.transferService?.plan?.plannedAt),

      transferDeparture: hasDepartureTransferService,
      transferDeparturePeopleCount: request?.departureTransferService?.plan?.peopleCount?.toString() ?? "",
      transferDeparturePlannedDate: isoToDate(request?.departureTransferService?.plan?.plannedAt),
      transferDeparturePlannedAt: isoToTime(request?.departureTransferService?.plan?.plannedAt),

      baggageDelivery: hasBaggageDeliveryService,
      baggageDeliveryPlannedDate: isoToDate(request?.baggageDeliveryService?.plan?.plannedAt),
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

  const [addSavedPeople] = useMutation(ADD_PASSENGER_REQUEST_SAVED_PEOPLE, {
    context: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
    refetchQueries: [{ query: GET_PASSENGER_REQUEST, variables: { passengerRequestId: request?.id } }],
    awaitRefetchQueries: true,
  });

  // Локальный подсчёт «добавлено/пропущено» — зеркалит жадный 1:1 матчинг бэка
  // (mergeManifestPeopleIntoRoster) по manifestNameKey
  const countManifestImport = (people, roster) => {
    const consumed = new Set();
    let added = 0;
    for (const p of people) {
      const key = manifestNameKey(p.fullName);
      const index = (roster || []).findIndex(
        (item, i) => !consumed.has(i) && manifestNameKey(item?.fullName) === key
      );
      if (index === -1) added += 1;
      else consumed.add(index);
    }
    return { added, skipped: people.length - added };
  };

  const resetForm = useCallback(() => {
    setFormData({
      waterSupply: false,
      waterPeopleCount: "",
      waterPlannedDate: "",
      waterPlannedAt: "",
      foodSupply: false,
      foodPeopleCount: "",
      foodPlannedDate: "",
      foodPlannedAt: "",
      habitation: false,
      habitationPeopleCount: "",
      habitationPlannedFromDate: "",
      habitationPlannedFromTime: "",
      habitationPlannedToDate: "",
      habitationPlannedToTime: "",
      transferArrival: false,
      transferArrivalPeopleCount: "",
      transferArrivalPlannedDate: "",
      transferArrivalPlannedAt: "",
      transferDeparture: false,
      transferDeparturePeopleCount: "",
      transferDeparturePlannedDate: "",
      transferDeparturePlannedAt: "",
      baggageDelivery: false,
      baggageDeliveryPlannedDate: "",
      baggageDeliveryPlannedAt: "",
    });
    setFlightDate("");
    setManifest(null);
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
            transferArrivalPlannedDate: checked ? prev.transferArrivalPlannedDate : "",
            transferArrivalPlannedAt: checked ? prev.transferArrivalPlannedAt : "",
          };
        }

        if (name === "transferDeparture") {
          return {
            ...prev,
            transferDeparture: checked,
            transferDeparturePeopleCount: checked ? prev.transferDeparturePeopleCount : "",
            transferDeparturePlannedDate: checked ? prev.transferDeparturePlannedDate : "",
            transferDeparturePlannedAt: checked ? prev.transferDeparturePlannedAt : "",
          };
        }

        if (name === "baggageDelivery") {
          return {
            ...prev,
            baggageDelivery: checked,
            baggageDeliveryPlannedDate: checked ? prev.baggageDeliveryPlannedDate : "",
            baggageDeliveryPlannedAt: checked ? prev.baggageDeliveryPlannedAt : "",
          };
        }

        if (name === "waterSupply") {
          return {
            ...prev,
            waterSupply: checked,
            waterPeopleCount: checked ? prev.waterPeopleCount : "",
            waterPlannedDate: checked ? prev.waterPlannedDate : "",
            waterPlannedAt: checked ? prev.waterPlannedAt : "",
          };
        }

        if (name === "foodSupply") {
          return {
            ...prev,
            foodSupply: checked,
            foodPeopleCount: checked ? prev.foodPeopleCount : "",
            foodPlannedDate: checked ? prev.foodPlannedDate : "",
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
          plannedAt: buildPlannedFromTo(formData.waterPlannedDate, formData.waterPlannedAt),
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
          plannedAt: buildPlannedFromTo(formData.foodPlannedDate, formData.foodPlannedAt),
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
          plannedAt: buildPlannedFromTo(formData.transferArrivalPlannedDate, formData.transferArrivalPlannedAt),
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
          plannedAt: buildPlannedFromTo(formData.transferDeparturePlannedDate, formData.transferDeparturePlannedAt),
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
          plannedAt: buildPlannedFromTo(formData.baggageDeliveryPlannedDate, formData.baggageDeliveryPlannedAt),
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

    // Дата рейса — только если реально изменилась
    const requestFlightDateInput = isoToDate(request?.flightDate);
    if (flightDate !== requestFlightDateInput) {
      input.flightDate = flightDate
        ? new Date(`${flightDate}T00:00:00`).toISOString()
        : null;
    }

    const hasManifest = !!manifest?.people?.length;

    // Если нет изменений
    if (Object.keys(input).length === 0 && !hasManifest) {
      alert("Нет изменений для сохранения.");
      setIsLoading(false);
      return;
    }

    if (hasManifest && !isSameFlight(manifest.flightNumber, request?.flightNumber)) {
      const ok = await confirm({
        message: `Рейс в манифесте (${manifest.flightNumber}) не совпадает с рейсом заявки (${request?.flightNumber}). Импортировать всё равно?`,
        confirmText: "Импортировать",
        cancelText: "Отмена",
      });
      if (!ok) {
        setIsLoading(false);
        return;
      }
    }

    try {
      if (Object.keys(input).length > 0) {
        await updatePassengerRequest({
          variables: { updatePassengerRequestId: request?.id, input },
        });
      }

      if (hasManifest) {
        const { added, skipped } = countManifestImport(
          manifest.people,
          request?.savedPassengers
        );
        await addSavedPeople({
          variables: {
            requestId: request?.id,
            people: manifest.people.map((p) => ({
              fullName: p.fullName,
              seat: p.seat,
              personCategory: p.personCategory,
              personType: "PASSENGER",
            })),
          },
        });
        if (addNotification) {
          addNotification(
            skipped > 0
              ? `Реестр: добавлено ${added}, пропущено ${skipped} (уже в реестре).`
              : `Реестр: добавлено ${added} пассажиров из манифеста.`,
            "success"
          );
        }
      }

      resetForm();
      onClose();
      if (Object.keys(input).length > 0 && addNotification) {
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
                <label>Дата рейса</label>
                <input
                  type="date"
                  value={flightDate}
                  onChange={(e) => {
                    setFlightDate(e.target.value);
                    setIsEdited(true);
                  }}
                />

                <div className={classes.typeServices}>Экипаж</div>
                <div className={classes.staffWrapper}>
                  <label>Сотрудники экипажа</label>
                  {airlineId && (
                    <div className={classes.addStaff} onClick={toggleAddStaff}>
                      <img src="/plus.png" alt="" />
                    </div>
                  )}
                </div>
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

                {request?.includesPassengers && (
                  <>
                    <div className={classes.typeServices}>Манифест</div>
                    <ManifestUploadField
                      parsed={manifest}
                      onParsed={(result) => {
                        setManifest(result);
                        setIsEdited(true);
                      }}
                      onClear={() => setManifest(null)}
                      expectedFlightNumber={request?.flightNumber}
                    />
                  </>
                )}

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
                    <label>Дата и время подачи в аэропорт</label>
                    <div className={classes.reis_info}>
                      <input
                        type="date"
                        name="waterPlannedDate"
                        value={formData.waterPlannedDate}
                        onChange={handleChange}
                      />
                      <input
                        type="time"
                        name="waterPlannedAt"
                        value={formData.waterPlannedAt}
                        onChange={handleChange}
                        placeholder="Время"
                      />
                    </div>
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
                    <label>Дата и время подачи в аэропорт</label>
                    <div className={classes.reis_info}>
                      <input
                        type="date"
                        name="foodPlannedDate"
                        value={formData.foodPlannedDate}
                        onChange={handleChange}
                      />
                      <input
                        type="time"
                        name="foodPlannedAt"
                        value={formData.foodPlannedAt}
                        onChange={handleChange}
                        placeholder="Время"
                      />
                    </div>
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
                    <label>Дата и время подачи в аэропорт</label>
                    <div className={classes.reis_info}>
                      <input
                        type="date"
                        name="transferArrivalPlannedDate"
                        value={formData.transferArrivalPlannedDate}
                        onChange={handleChange}
                      />
                      <input
                        type="time"
                        name="transferArrivalPlannedAt"
                        value={formData.transferArrivalPlannedAt}
                        onChange={handleChange}
                        placeholder="Время"
                      />
                    </div>
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
                    <label>Дата и время прибытия пассажиров в аэропорт</label>
                    <div className={classes.reis_info}>
                      <input
                        type="date"
                        name="transferDeparturePlannedDate"
                        value={formData.transferDeparturePlannedDate}
                        onChange={handleChange}
                      />
                      <input
                        type="time"
                        name="transferDeparturePlannedAt"
                        value={formData.transferDeparturePlannedAt}
                        onChange={handleChange}
                        placeholder="Время"
                      />
                    </div>
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
                    <label>Дата и время</label>
                    <div className={classes.reis_info}>
                      <input
                        type="date"
                        name="baggageDeliveryPlannedDate"
                        value={formData.baggageDeliveryPlannedDate}
                        onChange={handleChange}
                      />
                      <input
                        type="time"
                        name="baggageDeliveryPlannedAt"
                        value={formData.baggageDeliveryPlannedAt}
                        onChange={handleChange}
                        placeholder="Время"
                      />
                    </div>
                  </>
                )}
              </div>
            </div>

            <div className={classes.requestButton}>
              <Button onClick={handleSubmit}>Сохранить</Button>
            </div>
          </>
        )}
        {airlineId && (
          <CreateRequestAirlineStaff
            id={airlineId}
            show={showAddStaff}
            onClose={toggleAddStaff}
            airlineRefetch={refetchAirlines}
            setNewStaffId={setNewStaffData}
            positions={positions}
            isExist={true}
          />
        )}
      </Sidebar>
    </>
  );
}

export default AddRepresentativeService;