import React, { useState, useRef, useEffect, useCallback } from "react";
import { useMutation, useQuery, useSubscription } from "@apollo/client";
import classes from "./CreateRepresentativeRequest.module.css";
import Button from "../../Standart/Button/Button.jsx";
import Sidebar from "../Sidebar/Sidebar.jsx";
import {
  ADD_PASSENGER_REQUEST_FILES,
  ADD_PASSENGER_REQUEST_SAVED_PEOPLE,
  CREATE_PASSENGER_REQUEST,
  CREATE_REQUEST_MUTATION,
  GET_AIRLINE_POSITIONS,
  GET_AIRLINES_RELAY,
  GET_AIRLINES_SUBSCRIPTION,
  GET_AIRLINES_UPDATE_SUBSCRIPTION,
  GET_AIRPORTS_RELAY,
  GET_PASSENGER_REQUESTS,
  getCookie,
} from "../../../../graphQL_requests.js";
import MUIAutocomplete from "../MUIAutocomplete/MUIAutocomplete.jsx";
import MUILoader from "../MUILoader/MUILoader.jsx";
import MUIAutocompleteColor from "../MUIAutocompleteColor/MUIAutocompleteColor.jsx";
import MultiSelectAutocomplete from "../MultiSelectAutocomplete/MultiSelectAutocomplete.jsx";
import CreateRequestAirlineStaff from "../CreateRequestAirlineStaff/CreateRequestAirlineStaff.jsx";
import CloseIcon from "../../../shared/icons/CloseIcon.jsx";
import ManifestUploadField from "../FapV2/ManifestUploadField/ManifestUploadField.jsx";
import { buildManifestUpload } from "../FapV2/fapManifestFiles.js";
import { useDialog } from "../../../contexts/DialogContext.jsx";
import { useToast } from "../../../contexts/ToastContext.jsx";

// Компонент для создания новой заявки
function CreateRepresentativeRequest({
  show,
  onClose,
  onMatchFound,
  user,
}) {
  const token = getCookie("token");
  const { showAlert, confirm, isDialogOpen } = useDialog();
  const { success, error: toastError } = useToast();
  const [isEdited, setIsEdited] = useState(false); // Флаг изменений формы
  const [airlines, setAirlines] = useState([]); // Список авиакомпаний
  const [selectedAirline, setSelectedAirline] = useState(null); // Выбранная авиакомпания
  const sidebarRef = useRef();

  const [airports, setAirports] = useState([]); // Список аэропортов
  const [selectedCrew, setSelectedCrew] = useState([]); // Выбранный экипаж (опции стаффа)
  const [positions, setPositions] = useState([]); // Должности для формы создания сотрудника
  const [showAddStaff, setShowAddStaff] = useState(false); // Видимость сайдбара добавления сотрудника
  const [newStaffData, setNewStaffData] = useState(null); // Только что созданный сотрудник (полный объект)

  // Новая структура состояния под новый input
  const [formData, setFormData] = useState({
    airlineId: user?.airlineId || "",
    airportId: "",
    flightNumber: "",
    flightDate: "",
    includesCrew: false,
    includesPassengers: true,
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
    // трансфер: аэропорт → гостиница
    transferArrival: false,
    transferArrivalPeopleCount: "",
    transferArrivalPlannedDate: "",
    transferArrivalPlannedAt: "",
    // трансфер: гостиница → аэропорт
    transferDeparture: false,
    transferDeparturePeopleCount: "",
    transferDeparturePlannedDate: "",
    transferDeparturePlannedAt: "",
    baggageDelivery: false,
    baggageDeliveryPlannedDate: "",
    baggageDeliveryPlannedAt: "",
    city: "",
  });

  // Распарсенный манифест: { people, flightNumber, fileName } | null
  const [manifest, setManifest] = useState(null);

  // Опции экипажа из staff выбранной авиакомпании
  const crewOptions = (selectedAirline?.staff || []).map((s) => ({
    id: s.id,
    name: s.name || "",
    positionName: s.position?.name || "",
    gender: s.gender || "",
    number: s.number || "",
    label: [s.name, s.position?.name, s.gender].filter(Boolean).join(", "),
  }));

  // Запрос данных авиакомпаний и аэропортов
  const { data, refetch } = useQuery(GET_AIRLINES_RELAY, {
    context: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
    skip: !show,
  });

  const infoAirports = useQuery(GET_AIRPORTS_RELAY, {
    context: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
    skip: !show,
  });

  const { data: airlinePositionsData } = useQuery(GET_AIRLINE_POSITIONS, {
    context: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
    skip: !show,
  });

  const { data: dataSubscription } = useSubscription(
    GET_AIRLINES_SUBSCRIPTION,
    {
      context: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
      onData: () => {
        refetch();
      },
      skip: !show,
    }
  );

  const { data: dataSubscriptionUpd } = useSubscription(
    GET_AIRLINES_UPDATE_SUBSCRIPTION,
    {
      context: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
      onData: () => {
        refetch();
      },
      skip: !show,
    }
  );

  const [warningMessage, setWarningMessage] = useState("");
  const [matchingRequest, setMatchingRequest] = useState(null);

  // Обновление списка аэропортов
  useEffect(() => {
    if (infoAirports.data) {
      setAirports(infoAirports.data.airports || []);
    }
  }, [infoAirports.data]);

  // Обновление списка должностей
  useEffect(() => {
    if (airlinePositionsData) {
      setPositions(airlinePositionsData.getAirlinePositions || []);
    }
  }, [airlinePositionsData]);

  // Toggle для сайдбара добавления сотрудника
  const toggleAddStaff = useCallback(() => {
    setShowAddStaff((prev) => !prev);
  }, []);

  // Авто-добавление только что созданного сотрудника в выбранный экипаж
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
    setFormData((prev) =>
      prev.includesCrew ? prev : { ...prev, includesCrew: true }
    );
    setIsEdited(true);
    setNewStaffData(null);
  }, [newStaffData]);

  // Обновление списка авиакомпаний и выбранной авиакомпании
  useEffect(() => {
    if (!data) return;

    const allAirlines = data?.airlines?.airlines || [];
    setAirlines(allAirlines);

    if (user?.airlineId) {
      const airline = allAirlines.find((a) => a.id === user.airlineId);
      setSelectedAirline(airline || null);
      setFormData((prev) => ({
        ...prev,
        airlineId: airline?.id || prev.airlineId,
      }));
    }
  }, [data, user]);

  // При открытии формы — обновить авиакомпании
  useEffect(() => {
    if (show) {
      refetch();
    }
  }, [show, refetch]);

  // Обновление выбранной авиакомпании при изменениях через подписку
  useEffect(() => {
    if (dataSubscriptionUpd && !user?.airlineId && data?.airlines?.airlines) {
      const updatedAirline = data.airlines.airlines.find(
        (airline) => airline?.id === selectedAirline?.id
      );
      if (updatedAirline) {
        setSelectedAirline(updatedAirline);
      }
    }
  }, [dataSubscriptionUpd, data, selectedAirline, user]);

  // Мутация для создания заявки
  const [createRequest] = useMutation(CREATE_PASSENGER_REQUEST, {
    context: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
    // refetchQueries: [GET_PASSENGER_REQUESTS],
    // awaitRefetchQueries: false,
  });

  const [addSavedPeople] = useMutation(ADD_PASSENGER_REQUEST_SAVED_PEOPLE, {
    context: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  });

  // Исходный файл манифеста во вложения заявки — чтобы диспетчер и АК могли
  // его скачать из детальной.
  const [addFiles] = useMutation(ADD_PASSENGER_REQUEST_FILES, {
    context: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  });

  const airlineForAirlineAdmin = data?.airlines?.airlines.find(
    (airline) => airline.id === user?.airlineId
  );

  // Сброс формы
  const resetForm = useCallback(() => {
    const baseAirline = user?.airlineId ? airlineForAirlineAdmin : null;

    setSelectedAirline(baseAirline || null);
    setSelectedCrew([]);
    setFormData({
      airlineId: user?.airlineId || "",
      airportId: "",
      flightNumber: "",
      flightDate: "",
      includesCrew: false,
      includesPassengers: true,
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
      city: "",
    });
    setManifest(null);
    setIsEdited(false);
    setWarningMessage("");
  }, [user, airlineForAirlineAdmin]);

  const handleManifestParsed = useCallback((result) => {
    setManifest(result);
    setIsEdited(true);
    // № рейса из шапки манифеста — только в пустое поле
    if (result.flightNumber) {
      setFormData((prev) =>
        prev.flightNumber.trim()
          ? prev
          : { ...prev, flightNumber: result.flightNumber }
      );
    }
  }, []);

  const handleManifestClear = useCallback(() => setManifest(null), []);

  // Закрытие формы с проверкой несохранённых изменений
  const closeButton = useCallback(async () => {
    if (isDialogOpen) return;

    if (!isEdited) {
      resetForm();
      setMatchingRequest(null);
      onClose();
      return;
    }

    const isConfirmed = await confirm(
      "Вы уверены? Все несохраненные данные будут удалены."
    );
    if (isConfirmed) {
      resetForm();
      setMatchingRequest(null);
      onClose();
    }
  }, [isEdited, resetForm, onClose, isDialogOpen, confirm]);

  // const handleChange = useCallback((e) => {
  //   const { name, type, checked, value } = e.target;
  //   setIsEdited(true);

  //   if (type === "checkbox") {
  //     setFormData((prev) => {
  //       // взаимоисключающие флаги
  //       if (name === "habitation") {
  //         return {
  //           ...prev,
  //           habitation: checked,
  //           // если включили проживание — выключаем трансфер+проживание
  //           transferHabitation: checked ? false : prev.transferHabitation,
  //         };
  //       }

  //       if (name === "transferHabitation") {
  //         return {
  //           ...prev,
  //           transferHabitation: checked,
  //           // если включили трансфер+проживание — выключаем просто проживание
  //           habitation: checked ? false : prev.habitation,
  //         };
  //       }

  //       // остальные чекбоксы как раньше
  //       return {
  //         ...prev,
  //         [name]: checked,
  //       };
  //     });
  //   } else {
  //     setFormData((prev) => ({ ...prev, [name]: value }));
  //   }
  // }, []);

  const handleChange = useCallback((e) => {
    const { name, type, checked, value } = e.target;
    setIsEdited(true);

    if (type === "checkbox") {
      if (name === "includesCrew" && !checked) {
        setSelectedCrew([]);
      }
      if (name === "includesPassengers" && !checked) {
        setManifest(null);
      }
      setFormData((prev) => {
        // независимые чекбоксы: при снятии сбрасываем только свои поля
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

        if (name === "transferHabitation") {
          return {
            ...prev,
            transferHabitation: checked,
            transferHabitationPeopleCount: checked
              ? prev.transferHabitationPeopleCount
              : "",
            transferHabitationPlannedAt: checked
              ? prev.transferHabitationPlannedAt
              : "",
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
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  }, []);

  const buildPlannedFromTo = (dateStr, timeStr) => {
    if (!dateStr || !timeStr) return null;
    const [hours, minutes] = timeStr.split(":").map(Number);
    const [y, m, d] = dateStr.split("-").map(Number);
    const date = new Date(y, m - 1, d, hours, minutes, 0, 0);
    return date.toISOString();
  };

  const isFormValid = () => {
    const hasAnyService =
      formData.habitation ||
      formData.transferArrival ||
      formData.transferDeparture ||
      formData.baggageDelivery ||
      formData.foodSupply ||
      formData.waterSupply;

    if (
      !formData.airportId ||
      !formData.airlineId ||
      !formData.flightNumber ||
      !hasAnyService
    ) {
      return false;
    }

    // должен быть включён хотя бы экипаж или пассажиры
    if (!formData.includesCrew && !formData.includesPassengers) return false;

    // для каждой выбранной услуги — количество человек, дата и время
    if (formData.waterSupply && (!formData.waterPeopleCount || !formData.waterPlannedDate || !formData.waterPlannedAt))
      return false;
    if (formData.foodSupply && (!formData.foodPeopleCount || !formData.foodPlannedDate || !formData.foodPlannedAt))
      return false;
    if (formData.habitation && (!formData.habitationPeopleCount || !formData.habitationPlannedFromDate || !formData.habitationPlannedFromTime || !formData.habitationPlannedToDate || !formData.habitationPlannedToTime))
      return false;
    if (formData.transferArrival && (!formData.transferArrivalPeopleCount || !formData.transferArrivalPlannedDate || !formData.transferArrivalPlannedAt))
      return false;
    if (formData.transferDeparture && (!formData.transferDeparturePeopleCount || !formData.transferDeparturePlannedDate || !formData.transferDeparturePlannedAt))
      return false;
    if (formData.baggageDelivery && (!formData.baggageDeliveryPlannedDate || !formData.baggageDeliveryPlannedAt))
      return false;

    return true;
  };

  const [isLoading, setIsLoading] = useState(false);

  // Отправка формы на сервер (новый input)
  const handleSubmit = async () => {
    setIsLoading(true);

    if (!isFormValid()) {
      showAlert("Пожалуйста, заполните все обязательные поля.");
      setIsLoading(false);
      return;
    }

    const input = {
      airlineId: formData.airlineId,
      flightNumber: formData.flightNumber.trim(),
      flightDate: formData.flightDate
        ? new Date(`${formData.flightDate}T00:00:00`).toISOString()
        : undefined,
      airportId: formData.airportId || null,
      includesCrew: formData.includesCrew,
      includesPassengers: formData.includesPassengers,
      crewMembers: formData.includesCrew
        ? selectedCrew.map((c) => ({
            airlinePersonalId: c.id,
            fullName: c.name,
            position: c.positionName || null,
            gender: c.gender || null,
            phone: c.number || null,
          }))
        : [],
      waterService: formData.waterSupply
        ? {
            plan: {
              enabled: true,
              peopleCount: Number(formData.waterPeopleCount),
              plannedAt: buildPlannedFromTo(formData.waterPlannedDate, formData.waterPlannedAt),
            },
          }
        : undefined,
      mealService: formData.foodSupply
        ? {
            plan: {
              enabled: true,
              peopleCount: Number(formData.foodPeopleCount),
              plannedAt: buildPlannedFromTo(formData.foodPlannedDate, formData.foodPlannedAt),
            },
          }
        : undefined,
      livingService: formData.habitation
        ? {
            plan: {
              enabled: true,
              peopleCount: Number(formData.habitationPeopleCount),
              plannedFromAt: buildPlannedFromTo(formData.habitationPlannedFromDate, formData.habitationPlannedFromTime),
              plannedToAt: buildPlannedFromTo(formData.habitationPlannedToDate, formData.habitationPlannedToTime),
            },
          }
        : undefined,
      transferService: formData.transferArrival
        ? {
            plan: {
              enabled: true,
              peopleCount: Number(formData.transferArrivalPeopleCount),
              plannedAt: buildPlannedFromTo(formData.transferArrivalPlannedDate, formData.transferArrivalPlannedAt),
            },
          }
        : undefined,
      departureTransferService: formData.transferDeparture
        ? {
            plan: {
              enabled: true,
              peopleCount: Number(formData.transferDeparturePeopleCount),
              plannedAt: buildPlannedFromTo(formData.transferDeparturePlannedDate, formData.transferDeparturePlannedAt),
            },
          }
        : undefined,
      baggageDeliveryService: formData.baggageDelivery
        ? {
            plan: {
              enabled: true,
              plannedAt: buildPlannedFromTo(formData.baggageDeliveryPlannedDate, formData.baggageDeliveryPlannedAt),
            },
          }
        : undefined,
    };

    // console.log(input);

    try {
      const response = await createRequest({ variables: { input } });
      const newRequestId = response?.data?.createPassengerRequest?.id;

      if (formData.includesPassengers && manifest?.people?.length && newRequestId) {
        try {
          await addSavedPeople({
            variables: {
              requestId: newRequestId,
              people: manifest.people.map((p) => ({
                fullName: p.fullName,
                seat: p.seat,
                personCategory: p.personCategory,
                personType: "PASSENGER",
              })),
            },
          });
          success(`Реестр: добавлено ${manifest.people.length} пассажиров из манифеста.`);

          // Реестр — главное, файл — приложение: своя обработка ошибки, чтобы
          // неудачная загрузка не выглядела провалом импорта людей.
          if (manifest.file) {
            try {
              await addFiles({
                variables: {
                  requestId: newRequestId,
                  files: [
                    buildManifestUpload(
                      manifest.file,
                      manifest.flightNumber || formData.flightNumber
                    ),
                  ],
                },
              });
            } catch (fileError) {
              console.error(fileError);
              toastError(
                "Реестр импортирован, но файл манифеста не сохранён — загрузите его снова через «Редактировать»"
              );
            }
          }
        } catch (importError) {
          console.error(importError);
          toastError(
            "Заявка создана, но манифест не импортирован — откройте «Редактировать» и загрузите файл снова."
          );
        }
      }

      resetForm();
      onClose();
      success("Создание заявки для экипажа прошло успешно.");
    } catch (error) {
      console.error(error);
      if (error.message.startsWith("Request already exists with id:")) {
        const match = error.message.match(
          /Request already exists with id:\s*([a-zA-Z0-9]+)/
        );
        if (match) {
          const requestId = match[1];
          setMatchingRequest(requestId);
        }
      } else {
        showAlert("Ошибка при создании заявки");
      }
    } finally {
      setIsLoading(false);
    }
  };

  // console.log(formData);

  // Клик вне боковой панели закрывает её
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (event.target.closest?.("[data-script-runner-control]")) {
        return;
      }
      if (document.body.dataset.scriptRunnerPickMode === "true") {
        return;
      }
      if (isDialogOpen) return;

      if (event.target.closest(".MuiSnackbar-root")) {
        return;
      }

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
  }, [show, closeButton, isDialogOpen]);

  useEffect(() => {
    setMatchingRequest(null);
  }, [formData]);

  return (
    <>
      <Sidebar show={show} sidebarRef={sidebarRef}>
        <div className={classes.requestTitle}>
          <div className={classes.requestTitle_name}>Создать заявку</div>
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
                <span className={classes.hint}>* — обязательные поля</span>
                {warningMessage && (
                  <div className={classes.warningMessage}>{warningMessage}</div>
                )}
                {matchingRequest ? (
                  <div className={classes.matchingRequest}>
                    Заявка с такими же параметрами уже существует.{" "}
                    <span
                      onClick={() => {
                        onMatchFound(matchingRequest);
                        setMatchingRequest(null);
                        resetForm();
                        onClose();
                      }}
                    >
                      Перейти к заявке
                    </span>
                  </div>
                ) : null}

                {!user?.airlineId && (
                  <>
                    <label className={classes.required}>Введите авиакомпанию</label>
                    <MUIAutocomplete
                      dropdownWidth={"100%"}
                      label={"Введите авиакомпанию"}
                      options={airlines?.map((airline) => airline.name)}
                      value={selectedAirline ? selectedAirline?.name : ""}
                      onChange={(event, newValue) => {
                        const selected = airlines.find(
                          (airline) => airline.name === newValue
                        );
                        setSelectedAirline(selected || null);
                        setSelectedCrew([]);
                        setFormData((prevFormData) => ({
                          ...prevFormData,
                          airlineId: selected?.id || "",
                        }));
                        setIsEdited(true);
                      }}
                    />
                  </>
                )}

                <label className={classes.required}>Выберите аэропорт</label>
                <MUIAutocompleteColor
                  dropdownWidth="100%"
                  label={"Введите аэропорт"}
                  options={airports}
                  getOptionLabel={(option) => {
                    if (!option) return "";
                    const cityPart =
                      option.city && option.city !== option.name
                        ? `, город: ${option.city}`
                        : "";
                    return `${option.code} ${option.name}${cityPart}`.trim();
                  }}
                  renderOption={(optionProps, option) => {
                    const cityPart =
                      option.city && option.city !== option.name
                        ? `, город: ${option.city}`
                        : "";
                    const labelText =
                      `${option.code} ${option.name}${cityPart}`.trim();
                    const words = labelText.split(" ");

                    return (
                      <li {...optionProps} key={option.id}>
                        {words.map((word, index) => (
                          <span
                            key={index}
                            style={{
                              color: index === 0 ? "black" : "gray",
                              marginRight: 4,
                            }}
                          >
                            {word}
                          </span>
                        ))}
                      </li>
                    );
                  }}
                  value={
                    airports.find((o) => o.id === formData.airportId) || null
                  }
                  onChange={(e, newValue) => {
                    setFormData((prev) => ({
                      ...prev,
                      airportId: newValue?.id || "",
                      city: newValue?.city || "",
                    }));
                    setIsEdited(true);
                  }}
                />

                <label className={classes.required}>Введите рейс</label>
                <input
                  type="text"
                  name="flightNumber"
                  placeholder="Рейс"
                  value={formData.flightNumber}
                  onChange={handleChange}
                />

                <label>Дата рейса</label>
                <input
                  type="date"
                  name="flightDate"
                  value={formData.flightDate}
                  onChange={handleChange}
                />

                <div className={`${classes.typeServices} ${classes.required}`}>Состав заявки</div>
                <span className={classes.hintCenter}>хотя бы один вариант</span>

                <label className={classes.checkBoxWrapper}>
                  <input
                    type="checkbox"
                    name="includesPassengers"
                    checked={formData.includesPassengers}
                    onChange={handleChange}
                  />
                  Пассажиры
                </label>

                <label
                  className={classes.checkBoxWrapper}
                  style={!formData.airlineId ? { opacity: 0.55 } : undefined}
                >
                  <input
                    type="checkbox"
                    name="includesCrew"
                    checked={formData.includesCrew}
                    onChange={handleChange}
                    disabled={!formData.airlineId}
                  />
                  Экипаж
                </label>

                {!formData.airlineId && (
                  <div style={{ fontSize: 13, color: "var(--main-gray)", marginTop: -4 }}>
                    Сначала выберите авиакомпанию, чтобы добавить экипаж
                  </div>
                )}

                {formData.includesCrew && formData.airlineId && (
                  <>
                    <div className={classes.staffWrapper}>
                      <label>Выберите сотрудников экипажа</label>
                      <div
                        className={classes.addStaff}
                        onClick={toggleAddStaff}
                      >
                        <img src="/plus.png" alt="" />
                      </div>
                    </div>
                    <MultiSelectAutocomplete
                      dropdownWidth="100%"
                      label="Сотрудники экипажа"
                      isMultiple
                      showSelectAll
                      options={crewOptions}
                      value={selectedCrew}
                      onChange={(event, newValue) => {
                        setSelectedCrew(newValue || []);
                        setIsEdited(true);
                      }}
                    />
                  </>
                )}

                {formData.includesPassengers && (
                  <>
                    <div className={classes.typeServices}>Манифест</div>
                    <ManifestUploadField
                      parsed={manifest}
                      onParsed={handleManifestParsed}
                      onClear={handleManifestClear}
                    />
                  </>
                )}

                <div className={`${classes.typeServices} ${classes.required}`}>Вид услуг</div>
                <span className={classes.hintCenter}>хотя бы одна услуга</span>

                <label className={classes.checkBoxWrapper}>
                  <input
                    type="checkbox"
                    name="waterSupply"
                    checked={formData.waterSupply}
                    onChange={handleChange}
                  />
                  Поставка питьевой воды
                </label>

                {formData.waterSupply && (
                  <>
                    <label className={classes.required}>Введите количество человек</label>
                    <input
                      type="number"
                      name="waterPeopleCount"
                      value={formData.waterPeopleCount}
                      onChange={handleChange}
                    />

                    <label className={classes.required}>Дата и время подачи в аэропорт</label>
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

                <label className={classes.checkBoxWrapper}>
                  <input
                    type="checkbox"
                    name="foodSupply"
                    checked={formData.foodSupply}
                    onChange={handleChange}
                  />
                  Поставка питания
                </label>

                {formData.foodSupply && (
                  <>
                    <label className={classes.required}>Введите количество человек</label>
                    <input
                      type="number"
                      name="foodPeopleCount"
                      value={formData.foodPeopleCount}
                      onChange={handleChange}
                    />

                    <label className={classes.required}>Дата и время подачи в аэропорт</label>
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

                <label className={classes.checkBoxWrapper}>
                  <input
                    type="checkbox"
                    name="habitation"
                    checked={formData.habitation}
                    onChange={handleChange}
                  />
                  Проживание
                </label>

                {formData.habitation && (
                  <>
                    <label className={classes.required}>Введите количество человек</label>
                    <input
                      type="number"
                      name="habitationPeopleCount"
                      value={formData.habitationPeopleCount}
                      onChange={handleChange}
                    />

                    <label className={classes.required}>Дата и время заезда</label>
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

                    <label className={classes.required}>Дата и время выезда</label>
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

                <label className={classes.checkBoxWrapper}>
                  <input
                    type="checkbox"
                    name="transferArrival"
                    checked={formData.transferArrival}
                    onChange={handleChange}
                  />
                  Трансфер с аэропорта до гостиницы
                </label>

                {formData.transferArrival && (
                  <>
                    <label className={classes.required}>Введите количество человек</label>
                    <input
                      type="number"
                      name="transferArrivalPeopleCount"
                      value={formData.transferArrivalPeopleCount}
                      onChange={handleChange}
                    />

                    <label className={classes.required}>Дата и время подачи в аэропорт</label>
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

                <label className={classes.checkBoxWrapper}>
                  <input
                    type="checkbox"
                    name="transferDeparture"
                    checked={formData.transferDeparture}
                    onChange={handleChange}
                  />
                  Трансфер с гостиницы до аэропорта
                </label>

                {formData.transferDeparture && (
                  <>
                    <label className={classes.required}>Введите количество человек</label>
                    <input
                      type="number"
                      name="transferDeparturePeopleCount"
                      value={formData.transferDeparturePeopleCount}
                      onChange={handleChange}
                    />

                    <label className={classes.required}>Дата и время прибытия пассажиров в аэропорт</label>
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

                <label className={classes.checkBoxWrapper}>
                  <input
                    type="checkbox"
                    name="baggageDelivery"
                    checked={formData.baggageDelivery}
                    onChange={handleChange}
                  />
                  Доставка багажа
                </label>

                {formData.baggageDelivery && (
                  <>
                    <label className={classes.required}>Дата и время</label>
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
              <Button onClick={handleSubmit}>Создать заявку</Button>
            </div>
          </>
        )}
        {selectedAirline && (
          <CreateRequestAirlineStaff
            id={selectedAirline.id}
            show={showAddStaff}
            onClose={toggleAddStaff}
            airlineRefetch={refetch}
            setNewStaffId={setNewStaffData}
            positions={positions}
            isExist={true}
          />
        )}
      </Sidebar>
    </>
  );
}

export default CreateRepresentativeRequest;
