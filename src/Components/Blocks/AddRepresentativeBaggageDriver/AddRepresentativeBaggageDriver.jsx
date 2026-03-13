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

function AddRepresentativeBaggageDriver({ show, onClose, request, addNotification }) {
  const token = getCookie("token");
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
    fullName: "",
    phone: "",
    addressFrom: "",
    addressTo: "",
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
      fullName: "",
      phone: "",
      addressFrom: "",
      addressTo: "",
      link: "",
      description: "",
    });
    setShowQuickCreate(false);
    setQuickCreate({ name: "", number: "", email: "", password: "" });
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

  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    setIsEdited(true);
    setFormData((prev) => ({ ...prev, [name]: value }));
  }, []);

  const isFormValid = () => {
    return (
      formData.fullName?.trim() &&
      formData.addressFrom?.trim() &&
      formData.addressTo?.trim()
    );
  };

  const handleQuickCreate = async () => {
    if (creatingDriver) return;
    const name = quickCreate.name?.trim();
    const number = quickCreate.number?.trim();
    const email = quickCreate.email?.trim();
    const password = quickCreate.password?.trim();
    if (!name || !number || !email || !password) {
      addNotification?.("Заполните имя, телефон, email и пароль.", "error");
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
        addNotification?.("Водитель создан.", "success");
      }
    } catch (err) {
      addNotification?.(err?.message || "Ошибка при создании водителя", "error");
    }
  };

  const handleSubmit = async () => {
    if (!isFormValid()) {
      addNotification?.("Заполните водителя и адреса отправления и прибытия.", "error");
      return;
    }
    const driver = {
      fullName: formData.fullName.trim(),
      phone: formData.phone?.trim() || null,
      peopleCount: 0,
      pickupAt: null,
      link: formData.link?.trim() || null,
      addressFrom: formData.addressFrom?.trim() || null,
      addressTo: formData.addressTo?.trim() || null,
      description: formData.description?.trim() || null,
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
      addNotification?.("Заявка на трансфер багажа добавлена.", "success");
    } catch (err) {
      addNotification?.(
        err?.graphQLErrors?.[0]?.message || err?.message || "Ошибка при добавлении заявки",
        "error"
      );
    }
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (sidebarRef.current?.contains(event.target)) return;
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
              <label>Водитель</label>
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
                label="Адрес отправления *"
                placeholder="г. Черкесск, Ленина, 57Б"
                value={formData.addressFrom}
                onChange={(addr) => {
                  setFormData((prev) => ({ ...prev, addressFrom: addr }));
                  setIsEdited(true);
                }}
              />

              <AddressField
                label="Адрес прибытия *"
                placeholder="г. Минеральные Воды, Ленина, 10К1"
                value={formData.addressTo}
                onChange={(addr) => {
                  setFormData((prev) => ({ ...prev, addressTo: addr }));
                  setIsEdited(true);
                }}
              />

              <label>Описание (необязательно)</label>
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

              <label>Ссылка (необязательно)</label>
              <input
                type="url"
                name="link"
                value={formData.link}
                onChange={handleChange}
                placeholder="https://..."
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
