import React, { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { useMutation, useQuery } from "@apollo/client";
import classes from "../AddRepresentativeDriver/AddRepresentativeDriver.module.css";
import Sidebar from "../Sidebar/Sidebar.jsx";
import {
  ADD_PASSENGER_REQUEST_BAGGAGE_DRIVER,
  CREATE_DRIVER_MUTATION,
  DRIVERS_QUERY,
  GET_PASSENGER_REQUEST,
  getCookie,
} from "../../../../graphQL_requests.js";
import MUILoader from "../MUILoader/MUILoader.jsx";
import CloseIcon from "../../../shared/icons/CloseIcon.jsx";
import Button from "../../Standart/Button/Button.jsx";
import MUIAutocompleteColor from "../MUIAutocompleteColor/MUIAutocompleteColor.jsx";
import { AddressField } from "../AddressField/AddressField.jsx";
import { useDialog } from "../../../contexts/DialogContext.jsx";
import { useToast } from "../../../contexts/ToastContext.jsx";

// Идентичность пассажира в списке: personId для реестра, нормализованное ФИО
// для ручного ввода (у него personId нет). Один и тот же ключ = дубль.
const normalizeName = (name) =>
  String(name ?? "")
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase();

function AddRepresentativeBaggageDriver({ show, onClose, request }) {
  const token = getCookie("token");
  const { confirm, isDialogOpen, showAlert } = useDialog();
  const { success, error: notifyError } = useToast();
  const [isEdited, setIsEdited] = useState(false);
  const sidebarRef = useRef();
  const [selectedDriver, setSelectedDriver] = useState(null);
  const [people, setPeople] = useState([]);
  const [manualPassenger, setManualPassenger] = useState("");
  const [showManualPassenger, setShowManualPassenger] = useState(false);
  const [showQuickCreate, setShowQuickCreate] = useState(false);
  const [quickCreate, setQuickCreate] = useState({
    name: "",
    number: "",
    email: "",
    password: "",
  });

  const savedPassengers = request?.savedPassengers || [];

  const [formData, setFormData] = useState({
    fullName: "",
    phone: "",
    addressFrom: "",
    link: "",
    description: "",
  });

  const { data: driversData, refetch: refetchDrivers } = useQuery(DRIVERS_QUERY, {
    context: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
    variables: { pagination: { all: true } },
    skip: !show,
  });

  const drivers = driversData?.drivers?.drivers ?? [];

  const [createDriverMutation, { loading: creatingDriver }] = useMutation(
    CREATE_DRIVER_MUTATION,
    {
      context: {
        headers: {
          Authorization: `Bearer ${token}`,
          "Apollo-Require-Preflight": "true",
        },
      },
    }
  );

  const [addBaggageDriver, { loading }] = useMutation(ADD_PASSENGER_REQUEST_BAGGAGE_DRIVER, {
    context: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
    refetchQueries: [
      {
        query: GET_PASSENGER_REQUEST,
        variables: { passengerRequestId: request?.id },
      },
    ],
    awaitRefetchQueries: true,
  });

  const resetForm = useCallback(() => {
    setSelectedDriver(null);
    setPeople([]);
    setManualPassenger("");
    setShowManualPassenger(false);
    setFormData({
      fullName: "",
      phone: "",
      addressFrom: "",
      link: "",
      description: "",
    });
    setShowQuickCreate(false);
    setQuickCreate({ name: "", number: "", email: "", password: "" });
    setIsEdited(false);
  }, []);

  const closeButton = useCallback(async () => {
    if (isDialogOpen) return;

    if (!isEdited) {
      resetForm();
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
  }, [isEdited, resetForm, onClose, isDialogOpen, confirm]);

  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    setIsEdited(true);
    setFormData((prev) => ({ ...prev, [name]: value }));
  }, []);

  // Ручной ввод — доп. путь для тех, кого нет в реестре, не исключает автокомплит:
  // оба пути пополняют один и тот же список пассажиров поездки.
  const togglePassengerManual = () => {
    setShowManualPassenger((prev) => {
      const next = !prev;
      if (!next) setManualPassenger("");
      return next;
    });
  };

  const addPerson = useCallback((entry) => {
    setIsEdited(true);
    setPeople((prev) =>
      prev.some((p) => p.key === entry.key) ? prev : [...prev, entry]
    );
  }, []);

  const removePerson = useCallback((key) => {
    setIsEdited(true);
    setPeople((prev) => prev.filter((p) => p.key !== key));
  }, []);

  const handleAddManualPassenger = () => {
    const fullName = manualPassenger.trim();
    if (!fullName) return;
    addPerson({
      key: normalizeName(fullName),
      personId: null,
      fullName,
      phone: null,
      personType: "PASSENGER",
      personCategory: null,
      airlinePersonalId: null,
    });
    setManualPassenger("");
  };

  const handleManualPassengerKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddManualPassenger();
    }
  };

  // Уже добавленных (по реестровому personId либо по совпавшему ФИО, если
  // человека уже вписали вручную) убираем из выдачи, чтобы не выбрать дважды.
  const availablePassengers = useMemo(() => {
    const usedKeys = new Set(people.map((p) => p.key));
    const usedNames = new Set(people.map((p) => normalizeName(p.fullName)));
    return savedPassengers.filter((option) => {
      if (usedKeys.has(option.personId)) return false;
      if (usedNames.has(normalizeName(option.fullName))) return false;
      return true;
    });
  }, [savedPassengers, people]);

  // Адрес отправления не обязателен: отправление всегда аэропорт, в реестре его нет.
  // Пассажиры обязательны — хотя бы один; бирки и адрес доставки теперь их личные
  // поля и заполняются позже в карточке, здесь они не нужны для сохранения.
  const isFormValid = () => {
    return Boolean(formData.fullName?.trim() && people.length > 0);
  };

  const handleQuickCreate = async () => {
    if (creatingDriver) return;
    const name = quickCreate.name?.trim();
    const number = quickCreate.number?.trim();
    const email = quickCreate.email?.trim();
    const password = quickCreate.password?.trim();
    if (!name || !number || !email || !password) {
      notifyError("Заполните имя, телефон, email и пароль.");
      return;
    }
    try {
      const res = await createDriverMutation({
        variables: {
          input: {
            name,
            number,
            email,
            password,
          },
        },
      });
      const created = res?.data?.createDriver;
      if (created) {
        const driverOption = {
          id: created.id,
          name,
          number,
        };
        setSelectedDriver(driverOption);
        setFormData((prev) => ({
          ...prev,
          fullName: name,
          phone: number,
        }));
        setShowQuickCreate(false);
        setQuickCreate({ name: "", number: "", email: "", password: "" });
        await refetchDrivers();
        success("Водитель создан.");
      }
    } catch (err) {
      notifyError(err?.message || "Ошибка при создании водителя");
    }
  };

  const handleSubmit = async () => {
    if (!isFormValid()) {
      showAlert("Пожалуйста, заполните все обязательные поля.");
      return;
    }
    // Категорию не подставляем сами — передаём то, что реально знаем.
    // Бэк (ensureDriverPerson → normalizePersonCategory) всё равно приведёт
    // отсутствующее значение к "ADULT", так что угадывать её на фронте незачем.
    // Бирки, цену и адрес доставки на этом шаге не задаём — они личные поля
    // пассажира и заполняются позже в карточке поездки.
    const peoplePayload = people.map((p) => ({
      personId: p.personId ?? null,
      fullName: p.fullName,
      phone: p.phone ?? null,
      personType: p.personType ?? "PASSENGER",
      personCategory: p.personCategory ?? null,
      airlinePersonalId: p.airlinePersonalId ?? null,
    }));

    const driver = {
      fullName: formData.fullName.trim(),
      phone: formData.phone?.trim() || null,
      link: formData.link?.trim() || null,
      addressFrom: formData.addressFrom?.trim() || null,
      description: formData.description?.trim() || null,
      people: peoplePayload,
    };
    try {
      await addBaggageDriver({
        variables: {
          requestId: request?.id,
          driver,
        },
      });
      resetForm();
      onClose();
      success("Заявка на трансфер багажа добавлена.");
    } catch (err) {
      notifyError(
        err?.graphQLErrors?.[0]?.message ||
          err?.message ||
          "Ошибка при добавлении заявки"
      );
    }
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (event.target.closest?.("[data-script-runner-control]")) return;
      if (document.body.dataset.scriptRunnerPickMode === "true") return;
      if (isDialogOpen) return;
      if (event.target.closest(".MuiSnackbar-root")) return;
      if (sidebarRef.current?.contains(event.target)) return;
      closeButton();
    };
    if (show) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [show, closeButton, isDialogOpen]);

  return (
    <Sidebar show={show} sidebarRef={sidebarRef}>
      <div className={classes.requestTitle}>
        <div className={classes.requestTitle_name}>Создать заявку</div>
        <div className={classes.requestTitle_close} onClick={closeButton}>
          <CloseIcon />
        </div>
      </div>

      {loading ? (
        <MUILoader loadSize={"50px"} fullHeight={"75vh"} />
      ) : (
        <>
          <div className={classes.requestMiddle}>
            <div className={classes.requestData}>
              <label>Пассажиры *</label>
              <MUIAutocompleteColor
                dropdownWidth="100%"
                label="Добавить пассажира из реестра"
                options={availablePassengers}
                getOptionLabel={(option) =>
                  option
                    ? `${option.fullName ?? ""}${option.phone ? `, ${option.phone}` : ""}`.trim()
                    : ""
                }
                renderOption={(optionProps, option) => {
                  const labelText = `${option?.fullName ?? ""}${
                    option?.phone ? `, ${option.phone}` : ""
                  }`.trim();
                  const words = labelText.split(", ");
                  return (
                    <li
                      {...optionProps}
                      key={option?.personId ?? labelText}
                    >
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
                isOptionEqualToValue={(option, selected) =>
                  option?.personId
                    ? option.personId === selected?.personId
                    : option === selected
                }
                value={null}
                onChange={(event, newValue) => {
                  if (!newValue) return;
                  addPerson({
                    key: newValue.personId,
                    personId: newValue.personId ?? null,
                    fullName: newValue.fullName,
                    phone: newValue.phone ?? null,
                    personType: newValue.personType ?? "PASSENGER",
                    personCategory: newValue.personCategory ?? null,
                    airlinePersonalId: newValue.airlinePersonalId ?? null,
                  });
                }}
              />
              <div className={classes.quickCreateWrap}>
                <button
                  type="button"
                  className={classes.quickCreateLink}
                  onClick={togglePassengerManual}
                >
                  {showManualPassenger
                    ? "Скрыть ручной ввод"
                    : "Нет в реестре? Ввести вручную"}
                </button>
                {showManualPassenger && (
                  <div className={classes.quickCreateForm}>
                    <input
                      type="text"
                      placeholder="ФИО пассажира"
                      value={manualPassenger}
                      onChange={(e) => {
                        setIsEdited(true);
                        setManualPassenger(e.target.value);
                      }}
                      onKeyDown={handleManualPassengerKeyDown}
                      className={classes.quickCreateInput}
                    />
                    <Button
                      onClick={handleAddManualPassenger}
                      disabled={!manualPassenger.trim()}
                    >
                      Добавить пассажира
                    </Button>
                  </div>
                )}
              </div>

              {people.length > 0 && (
                <div className={classes.passengerList}>
                  {people.map((p) => (
                    <div key={p.key} className={classes.passengerRow}>
                      <span className={classes.passengerName}>
                        {p.fullName}
                        {p.phone ? `, ${p.phone}` : ""}
                      </span>
                      <button
                        type="button"
                        className={classes.passengerRemove}
                        onClick={() => removePerson(p.key)}
                        aria-label={`Убрать ${p.fullName}`}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <label>Водитель *</label>
              <MUIAutocompleteColor
                dropdownWidth="100%"
                label="Выберите водителя"
                options={drivers}
                getOptionLabel={(option) =>
                  option
                    ? `${option.name ?? ""}${option.number ? `, ${option.number}` : ""}`.trim()
                    : ""
                }
                value={selectedDriver || null}
                onChange={(event, newValue) => {
                  setIsEdited(true);
                  setSelectedDriver(newValue || null);
                  setFormData((prev) => ({
                    ...prev,
                    fullName: newValue?.name ?? "",
                    phone: newValue?.number ?? "",
                  }));
                }}
              />
              <div className={classes.quickCreateWrap}>
                <button
                  type="button"
                  className={classes.quickCreateLink}
                  onClick={() => setShowQuickCreate((v) => !v)}
                >
                  {showQuickCreate ? "Отмена" : "Нет в списке? Создать водителя"}
                </button>
                {showQuickCreate && (
                  <div className={classes.quickCreateForm}>
                    <input
                      type="text"
                      placeholder="ФИО *"
                      value={quickCreate.name}
                      onChange={(e) =>
                        setQuickCreate((p) => ({ ...p, name: e.target.value }))
                      }
                      className={classes.quickCreateInput}
                    />
                    <input
                      type="text"
                      placeholder="Телефон *"
                      value={quickCreate.number}
                      onChange={(e) =>
                        setQuickCreate((p) => ({ ...p, number: e.target.value }))
                      }
                      className={classes.quickCreateInput}
                    />
                    <input
                      type="email"
                      placeholder="Email *"
                      value={quickCreate.email}
                      onChange={(e) =>
                        setQuickCreate((p) => ({ ...p, email: e.target.value }))
                      }
                      className={classes.quickCreateInput}
                    />
                    <input
                      type="password"
                      placeholder="Пароль *"
                      value={quickCreate.password}
                      onChange={(e) =>
                        setQuickCreate((p) => ({ ...p, password: e.target.value }))
                      }
                      className={classes.quickCreateInput}
                    />
                    <Button
                      onClick={handleQuickCreate}
                      disabled={creatingDriver}
                    >
                      {creatingDriver ? "Создание…" : "Создать и выбрать"}
                    </Button>
                  </div>
                )}
              </div>

              <AddressField
                label="Адрес отправления"
                placeholder="г. Черкесск, Ленина, 57Б"
                value={formData.addressFrom}
                onChange={(addr) => {
                  setFormData((prev) => ({ ...prev, addressFrom: addr }));
                  setIsEdited(true);
                }}
              />

              <label>Описание</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Описание заявки на трансфер багажа"
                rows={3}
                style={{
                  width: "100%",
                  padding: "8px 10px",
                  outline: "none",
                  resize: "vertical",
                  border: "1px solid #ddd",
                  borderRadius: "4px",
                }}
              />

            </div>
          </div>

          <div className={classes.requestButton}>
            <Button onClick={handleSubmit} disabled={loading}>
              Создать заявку
            </Button>
          </div>
        </>
      )}
    </Sidebar>
  );
}

export default AddRepresentativeBaggageDriver;
