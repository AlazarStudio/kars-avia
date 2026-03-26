import React, { useState, useRef, useEffect, useCallback } from "react";
import { useMutation, useQuery } from "@apollo/client";
import classes from "./AddRepresentativeHotel.module.css";
import Sidebar from "../Sidebar/Sidebar.jsx";
import {
  ADD_PASSENGER_REQUEST_HOTEL,
  CREATE_HOTEL,
  GET_CITIES,
  GET_HOTELS_RELAY,
  GET_PASSENGER_REQUEST,
  getCookie,
} from "../../../../graphQL_requests.js";
import MUILoader from "../MUILoader/MUILoader.jsx";
import CloseIcon from "../../../shared/icons/CloseIcon.jsx";
import Button from "../../Standart/Button/Button.jsx";
import MUIAutocompleteColor from "../MUIAutocompleteColor/MUIAutocompleteColor.jsx";

function AddRepresentativeHotel({ show, onClose, request, addNotification }) {
  const token = getCookie("token");
  const [isEdited, setIsEdited] = useState(false);
  const sidebarRef = useRef();
  const [selectedHotel, setSelectedHotel] = useState(null);
  const [showQuickCreate, setShowQuickCreate] = useState(false);
  const [quickCreate, setQuickCreate] = useState({ name: "", city: "" });

  const [formData, setFormData] = useState({
    name: "",
    peopleCount: "",
    address: "",
    hotelId: "",
  });

  const totalServicePeople = request?.livingService?.plan?.peopleCount ?? null;
  const usedServicePeople =
    request?.livingService?.hotels?.reduce(
      (sum, h) => sum + (Number(h.peopleCount) || 0),
      0
    ) ?? 0;
  const remainingServicePeople =
    typeof totalServicePeople === "number"
      ? Math.max(totalServicePeople - usedServicePeople, 0)
      : null;

  const { data: hotelsData, refetch: refetchHotels } = useQuery(GET_HOTELS_RELAY, {
    context: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
    skip: !show,
  });

  const hotels = hotelsData?.hotels?.hotels ?? [];

  const { data: citiesData } = useQuery(GET_CITIES, {
    context: { headers: { Authorization: `Bearer ${token}` } },
    skip: !show,
  });
  const citiesList = citiesData?.citys ?? [];

  const [createHotelMutation, { loading: creatingHotel }] = useMutation(CREATE_HOTEL, {
    context: {
      headers: {
        Authorization: `Bearer ${token}`,
        "Apollo-Require-Preflight": "true",
      },
    },
  });

  const [addHotel, { loading }] = useMutation(ADD_PASSENGER_REQUEST_HOTEL, {
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
    setSelectedHotel(null);
    setFormData({
      name: "",
      peopleCount: "",
      address: "",
      hotelId: "",
    });
    setShowQuickCreate(false);
    setQuickCreate({ name: "", city: "" });
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

  const handleChange = useCallback(
    (e) => {
      const { name, value } = e.target;
      setIsEdited(true);

      if (name === "peopleCount") {
        let next = value.replace(/\D/g, "");
        if (next === "") {
          setFormData((prev) => ({ ...prev, peopleCount: "" }));
          return;
        }
        let numeric = Number(next);
        if (
          typeof remainingServicePeople === "number" &&
          remainingServicePeople >= 0 &&
          numeric > remainingServicePeople
        ) {
          numeric = remainingServicePeople;
          if (remainingServicePeople === 0) {
            addNotification?.(
              "Все места по услуге проживания уже распределены.",
              "error"
            );
          } else {
            addNotification?.(
              `Нельзя указать больше, чем осталось по услуге: ${remainingServicePeople}.`,
              "error"
            );
          }
        }
        setFormData((prev) => ({
          ...prev,
          peopleCount: String(numeric),
        }));
        return;
      }

      setFormData((prev) => ({ ...prev, [name]: value }));
    },
    [addNotification, remainingServicePeople]
  );

  const isFormValid = () => {
    return (
      formData.name?.trim() &&
      formData.peopleCount !== "" &&
      Number(formData.peopleCount) > 0 &&
      (typeof remainingServicePeople !== "number" ||
        Number(formData.peopleCount) <= remainingServicePeople)
    );
  };

  const handleQuickCreate = async () => {
    if (creatingHotel) return;
    const name = quickCreate.name?.trim();
    if (!name) {
      addNotification?.("Укажите название гостиницы.", "error");
      return;
    }
    try {
      const res = await createHotelMutation({
        variables: {
          input: {
            name,
            information: {
              city: quickCreate.city?.trim() || undefined,
            },
          },
          images: [],
        },
      });
      const created = res?.data?.createHotel;
      if (created) {
        const hotelOption = {
          id: created.id,
          name: created.name,
          information: created.information ?? {},
        };
        setSelectedHotel(hotelOption);
        setFormData((prev) => ({
          ...prev,
          hotelId: created.id,
          name: created.name,
        }));
        setShowQuickCreate(false);
        setQuickCreate({ name: "", city: "" });
        await refetchHotels();
        addNotification?.("Гостиница создана.", "success");
      }
    } catch (err) {
      console.error(err);
      addNotification?.(err?.message || "Ошибка при создании гостиницы", "error");
    }
  };

  const handleSubmit = async () => {
    if (!isFormValid()) {
      if (
        typeof remainingServicePeople === "number" &&
        remainingServicePeople <= 0
      ) {
        alert(
          "Нельзя добавить новую гостиницу: все места по услуге проживания уже распределены."
        );
      } else if (
        typeof remainingServicePeople === "number" &&
        Number(formData.peopleCount) > remainingServicePeople
      ) {
        alert(
          `Количество мест превышает доступное по услуге (${remainingServicePeople}).`
        );
      } else {
        alert(
          "Выберите гостиницу из списка (или создайте новую) и укажите корректное количество мест."
        );
      }
      return;
    }

    const hotel = {
      name: formData.name.trim(),
      peopleCount: Number(formData.peopleCount),
      address: formData.address?.trim() || null,
      link: null,
      hotelId: formData.hotelId?.trim() || null,
    };

    try {
      await addHotel({
        variables: {
          requestId: request?.id,
          hotel,
        },
      });
      resetForm();
      onClose();
      if (addNotification) {
        addNotification("Гостиница добавлена.", "success");
      }
    } catch (error) {
      console.error(error);
      alert("Ошибка при добавлении гостиницы");
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
        <div className={classes.requestTitle_name}>Добавить гостиницу</div>
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
              <label>Гостиница</label>
              <MUIAutocompleteColor
                dropdownWidth="100%"
                label="Выберите гостиницу"
                options={hotels}
                getOptionLabel={(option) =>
                  option
                    ? `${option.name}, город: ${option?.information?.city ?? "не указан"}`.trim()
                    : ""
                }
                renderOption={(optionProps, option) => {
                  const cityPart = option?.information?.city
                    ? `, город: ${option.information.city}`
                    : "";
                  const labelText = `${option.name}${cityPart}`.trim();
                  const words = labelText.split(", ");
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
                value={selectedHotel || null}
                onChange={(event, newValue) => {
                  setIsEdited(true);
                  setSelectedHotel(newValue || null);
                  setFormData((prev) => ({
                    ...prev,
                    hotelId: newValue?.id ?? "",
                    name: newValue?.name ?? "",
                  }));
                }}
              />
              <div className={classes.quickCreateWrap}>
                <button
                  type="button"
                  className={classes.quickCreateLink}
                  onClick={() => setShowQuickCreate((v) => !v)}
                >
                  {showQuickCreate ? "Отмена" : "Нет в списке? Создать гостиницу"}
                </button>
                {showQuickCreate && (
                  <div className={classes.quickCreateForm}>
                    <input
                      type="text"
                      placeholder="Название гостиницы *"
                      value={quickCreate.name}
                      onChange={(e) => setQuickCreate((p) => ({ ...p, name: e.target.value }))}
                      className={classes.quickCreateInput}
                    />
                    <MUIAutocompleteColor
                      dropdownWidth="100%"
                      label="Город"
                      options={citiesList}
                      getOptionLabel={(option) =>
                        option ? `${option.city}${option.region ? `, ${option.region}` : ""}`.trim() : ""
                      }
                      value={citiesList.find((c) => c.city === quickCreate.city) || null}
                      onChange={(e, newValue) =>
                        setQuickCreate((p) => ({ ...p, city: newValue?.city ?? "" }))
                      }
                    />
                    <Button onClick={handleQuickCreate} disabled={creatingHotel}>
                      {creatingHotel ? "Создание…" : "Создать и выбрать"}
                    </Button>
                  </div>
                )}
              </div>

              <label>Количество мест</label>
              <input
                type="number"
                name="peopleCount"
                min={1}
                max={
                  typeof remainingServicePeople === "number"
                    ? Math.max(remainingServicePeople, 1)
                    : undefined
                }
                value={formData.peopleCount}
                onChange={handleChange}
                placeholder="Количество мест"
              />
              {typeof totalServicePeople === "number" && (
                <p style={{ fontSize: 12, color: "#545873" }}>
                  Для услуги проживания указано{" "}
                  <b>{totalServicePeople}</b> мест, уже распределено{" "}
                  <b>{usedServicePeople}</b>, осталось{" "}
                  <b>{Math.max(remainingServicePeople ?? 0, 0)}</b>.
                </p>
              )}

              <label>Адрес</label>
              <input
                type="text"
                name="address"
                value={formData.address}
                onChange={handleChange}
                placeholder="Адрес"
              />

              {/*               <p className={classes.linkHint}>
                Ссылка для входа по External Login (вид: …/external-login?kind=…&token=…) формируется на сервере при добавлении гостиницы. Если бэкенд поддерживает автогенерацию, она появится в таблице после сохранения.
              </p> */}
            </div>
          </div>

          <div className={classes.requestButton}>
            <Button onClick={handleSubmit} disabled={loading}>
              Добавить гостиницу
            </Button>
          </div>
        </>
      )}
    </Sidebar>
  );
}

export default AddRepresentativeHotel;
