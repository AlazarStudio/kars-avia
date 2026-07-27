import React, { useState, useRef, useEffect, useCallback } from "react";
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

function AddRepresentativeBaggageDriver({ show, onClose, request }) {
  const token = getCookie("token");
  const { confirm, isDialogOpen, showAlert } = useDialog();
  const { success, error: notifyError } = useToast();
  const [isEdited, setIsEdited] = useState(false);
  const sidebarRef = useRef();
  const [selectedDriver, setSelectedDriver] = useState(null);
  const [showQuickCreate, setShowQuickCreate] = useState(false);
  const [quickCreate, setQuickCreate] = useState({
    name: "",
    number: "",
    email: "",
    password: "",
  });

  const [formData, setFormData] = useState({
    peopleCount: "",
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
    setFormData({
      peopleCount: "",
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

  // Количество — целое: сырой ввод чистим от всего, кроме цифр, чтобы «e», минус
  // и точка из type="number" не доехали до мутации.
  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    setIsEdited(true);
    if (name === "peopleCount") {
      const digits = value.replace(/\D/g, "");
      setFormData((prev) => ({ ...prev, peopleCount: digits }));
      return;
    }
    setFormData((prev) => ({ ...prev, [name]: value }));
  }, []);

  // Адрес отправления не обязателен: отправление всегда аэропорт, в реестре его нет.
  // Конкретных пассажиров здесь не выбирают — на этом шаге известно только
  // сколько их ожидается; сами пассажиры добавляются из реестра на странице
  // поездки вместе со своими адресами, бирками и ценами.
  const isFormValid = () => {
    return Boolean(
      formData.fullName?.trim() &&
        formData.peopleCount !== "" &&
        Number(formData.peopleCount) >= 1
    );
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
    // Поездка заводится пустой: ожидаемое количество пишем в peopleCount, а сам
    // список наполняется из реестра на странице поездки — там же у пассажира
    // появляются адрес доставки, бирки и цена.
    const driver = {
      fullName: formData.fullName.trim(),
      phone: formData.phone?.trim() || null,
      peopleCount: Number(formData.peopleCount),
      link: formData.link?.trim() || null,
      addressFrom: formData.addressFrom?.trim() || null,
      description: formData.description?.trim() || null,
      people: [],
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
              <label>Количество пассажиров *</label>
              <input
                type="number"
                name="peopleCount"
                min={1}
                step={1}
                value={formData.peopleCount}
                onChange={handleChange}
                placeholder="Сколько пассажиров ожидается"
              />

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
