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
import { useDialog } from "../../../contexts/DialogContext.jsx";
import { useToast } from "../../../contexts/ToastContext.jsx";

function AddRepresentativeHotel({ show, onClose, request }) {
  const token = getCookie("token");
  const { showAlert, confirm, isDialogOpen } = useDialog();
  const { success, error: notifyError } = useToast();
  const [isEdited, setIsEdited] = useState(false);
  const sidebarRef = useRef();
  const [selectedHotel, setSelectedHotel] = useState(null);
  const [showQuickCreate, setShowQuickCreate] = useState(false);
  const [quickCreate, setQuickCreate] = useState({
    name: "",
    city: "",
    // Новый блок справочника: пишется в location.cityId
    locationCityId: null,
    locationRegion: null,
    locationAddress: "",
    locationCountry: "",
  });

  const [formData, setFormData] = useState({
    name: "",
    peopleCount: "",
    address: "",
    hotelId: "",
  });

  // Правило «сумма мест по гостиницам ≤ план услуги» снято сознательно (см. бэк:
  // резолвер updatePassengerRequestHotel и FapLivingPage) — фактическое заселение
  // может превышать заказанное количество, и диспетчер должен иметь возможность
  // привести цифры к факту и завести дополнительную гостиницу под перебор.
  // remainingServicePeople ниже используется только для информационной подсказки,
  // а не для валидации или ограничения ввода — может быть и отрицательным (перебор).
  const totalServicePeople = request?.livingService?.plan?.peopleCount ?? null;
  const usedServicePeople =
    request?.livingService?.hotels?.reduce(
      (sum, h) => sum + (Number(h.peopleCount) || 0),
      0
    ) ?? 0;
  const remainingServicePeople =
    typeof totalServicePeople === "number"
      ? totalServicePeople - usedServicePeople
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
    setQuickCreate({
      name: "",
      city: "",
      locationCityId: null,
      locationRegion: null,
      locationAddress: "",
      locationCountry: "",
    });
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

  const handleChange = useCallback(
    (e) => {
      const { name, value } = e.target;
      setIsEdited(true);

      if (name === "peopleCount") {
        // Клампинг по остатку плана убран: гостиница может заселить больше,
        // чем заказано, ввод ограничен только форматом (целое положительное число).
        const next = value.replace(/\D/g, "");
        setFormData((prev) => ({ ...prev, peopleCount: next }));
        return;
      }

      setFormData((prev) => ({ ...prev, [name]: value }));
    },
    []
  );

  const isFormValid = () => {
    // Остаток по плану услуги (remainingServicePeople) здесь намеренно не проверяется —
    // превышение плана допустимо.
    return (
      formData.name?.trim() &&
      formData.peopleCount !== "" &&
      Number(formData.peopleCount) > 0
    );
  };

  const handleQuickCreate = async () => {
    if (creatingHotel) return;
    const name = quickCreate.name?.trim();
    if (!name) {
      notifyError("Укажите название гостиницы.");
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
            ...(quickCreate.locationCityId
              ? {
                  location: {
                    cityId: quickCreate.locationCityId,
                    address: quickCreate.locationAddress?.trim() || null,
                    country: quickCreate.locationCountry?.trim() || null,
                  },
                }
              : {}),
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
        setQuickCreate({
          name: "",
          city: "",
          locationCityId: null,
          locationRegion: null,
          locationAddress: "",
          locationCountry: "",
        });
        await refetchHotels();
        success("Гостиница создана.");
      }
    } catch (err) {
      console.error(err);
      notifyError(err?.message || "Ошибка при создании гостиницы");
    }
  };

  const handleSubmit = async () => {
    if (!isFormValid()) {
      // Блокировки по остатку плана услуги здесь больше нет — сабмит не зависит
      // от remainingServicePeople, остаются только базовые проверки формы.
      showAlert(
        "Выберите гостиницу из списка (или создайте новую) и укажите корректное количество мест."
      );
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
      success("Гостиница добавлена.");
    } catch (error) {
      console.error(error);
      showAlert("Ошибка при добавлении гостиницы");
    }
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
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
                    address: newValue?.information?.address ?? prev.address,
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
                      renderOption={(optionProps, option) => {
                        const labelText = `${option.city}${option.region ? `, ${option.region}` : ""}`.trim();
                        const words = labelText.split(", ");
                        return (
                          <li {...optionProps} key={option.id ?? labelText}>
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
                      value={citiesList.find((c) => c.city === quickCreate.city) || null}
                      onChange={(e, newValue) =>
                        setQuickCreate((p) => ({ ...p, city: newValue?.city ?? "" }))
                      }
                    />
                    <input
                      type="text"
                      placeholder="Улица"
                      value={quickCreate.locationAddress}
                      className={classes.quickCreateInput}
                      onChange={(e) => {
                        setIsEdited(true);
                        setQuickCreate((prev) => ({
                          ...prev,
                          locationAddress: e.target.value,
                        }));
                      }}
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
                value={formData.peopleCount}
                onChange={handleChange}
                placeholder="Количество мест"
              />
              {typeof totalServicePeople === "number" && (
                <p style={{ fontSize: 12, color: "#545873" }}>
                  Для услуги проживания указано{" "}
                  <b>{totalServicePeople}</b> мест, уже распределено{" "}
                  <b>{usedServicePeople}</b>
                  {remainingServicePeople >= 0 ? (
                    <>
                      , осталось <b>{remainingServicePeople}</b>.
                    </>
                  ) : (
                    <>
                      , перебор на <b>{Math.abs(remainingServicePeople)}</b> (заселено
                      больше плана — это допустимо).
                    </>
                  )}
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
