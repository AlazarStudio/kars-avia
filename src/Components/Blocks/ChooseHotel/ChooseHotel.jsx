import React, {
  useState,
  useRef,
  useEffect,
  useCallback,
  useMemo,
} from "react";
import classes from "./ChooseHotel.module.css";
import Button from "../../Standart/Button/Button";
import Sidebar from "../Sidebar/Sidebar";
import { useLazyQuery, useMutation, useQuery } from "@apollo/client";
import {
  GET_HOTELS_RELAY,
  GET_HOTEL_OPTIONS_FOR_PLACEMENT,
  GET_REQUEST,
  TL_PROPERTIES_AVAILABILITY,
  getCookie,
  mediaSrc,
  UPDATE_REQUEST_RELAY,
} from "../../../../graphQL_requests";
import MUIAutocomplete from "../MUIAutocomplete/MUIAutocomplete";
import MUILoader from "../MUILoader/MUILoader";
import CloseIcon from "../../../shared/icons/CloseIcon";
import TravellineRoomsSidebar from "../TravellineRoomsSidebar/TravellineRoomsSidebar";
import { useNavigate } from "react-router-dom";

// chooseObject is an array of { start, startTime, end, endTime, client, requestId, ... }
// Normalize it into shape expected by TravellineRoomsSidebar
function buildTlRequest(chooseObject, chooseRequestID) {
  const obj = Array.isArray(chooseObject) ? chooseObject[0] : chooseObject;
  if (!obj) return null;
  const start = obj.start || null;
  const end = obj.end || null;
  return {
    id: obj.requestId || chooseRequestID,
    arrival: start ? `${start}T${obj.startTime || "14:00"}` : null,
    departure: end ? `${end}T${obj.endTime || "12:00"}` : null,
    person: { name: obj.client || "" },
    note: obj.note || "",
  };
}

function ChooseHotel({
  show,
  onClose,
  chooseObject,
  id,
  chooseRequestID,
  chooseCityRequest,
  defaultTimesUsed,
  onBackToRequest,
}) {
  const [isEdited, setIsEdited] = useState(false);
  const [timeWarningDismissed, setTimeWarningDismissed] = useState(false);
  const [selectedCity, setSelectedCity] = useState("");
  const [tlProperty, setTlProperty] = useState(null); // selected TL option for booking sidebar
  const sidebarRef = useRef();
  const token = getCookie("token");
  const navigate = useNavigate();

  // Все локальные отели — нужен только для построения списка уникальных городов
  const { data: hotelsData } = useQuery(GET_HOTELS_RELAY, {
    context: { headers: { Authorization: `Bearer ${token}` } },
  });
  const allHotels = hotelsData?.hotels?.hotels ?? [];

  const uniqueCities = useMemo(
    () =>
      [
        ...new Set(
          allHotels.map((h) => h.information?.city?.trim()).filter(Boolean)
        ),
      ].sort(),
    [allHotels]
  );

  // Загрузка опций (local + travelline) по выбранному городу
  const [
    fetchOptions,
    { data: optionsData, loading: optionsLoading, error: optionsError },
  ] = useLazyQuery(GET_HOTEL_OPTIONS_FOR_PLACEMENT, {
    context: { headers: { Authorization: `Bearer ${token}` } },
    fetchPolicy: "network-only",
  });

  // При первом открытии — подставляем город из заявки и грузим опции
  useEffect(() => {
    if (chooseCityRequest && show) {
      setSelectedCity(chooseCityRequest);
      fetchOptions({ variables: { city: chooseCityRequest } });
    }
  }, [chooseCityRequest, show, fetchOptions]);

  const handleCitySelect = (value) => {
    setIsEdited(true);
    setSelectedCity(value);
    if (value) fetchOptions({ variables: { city: value } });
  };

  const rawOptions = optionsData?.hotelOptionsForPlacement ?? [];

  // Подтягиваем заявку (за датами) для проверки доступности TL-отелей
  const { data: reqData } = useQuery(GET_REQUEST, {
    context: { headers: { Authorization: `Bearer ${token}` } },
    variables: {
      requestId: chooseRequestID,
      pagination: { skip: 0, take: 10 },
    },
    skip: !chooseRequestID,
    fetchPolicy: "network-only",
  });
  const requestArrival = reqData?.request?.arrival || null;
  const requestDeparture = reqData?.request?.departure || null;
  const requestMealPlan = reqData?.request?.mealPlan || null;
  const mealRequirement = useMemo(() => {
    if (!requestMealPlan?.included) return null;
    return {
      breakfast: !!requestMealPlan.breakfastEnabled,
      lunch: !!requestMealPlan.lunchEnabled,
      dinner: !!requestMealPlan.dinnerEnabled,
    };
  }, [requestMealPlan]);

  const tlPropertyIds = useMemo(
    () => rawOptions.filter((o) => o.source === "travelline").map((o) => o.id),
    [rawOptions]
  );

  const [
    fetchTlAvail,
    { data: tlAvailData, loading: tlAvailLoading },
  ] = useLazyQuery(TL_PROPERTIES_AVAILABILITY, {
    context: { headers: { Authorization: `Bearer ${token}` } },
    fetchPolicy: "network-only",
  });

  useEffect(() => {
    if (
      tlPropertyIds.length > 0 &&
      requestArrival &&
      requestDeparture
    ) {
      fetchTlAvail({
        variables: {
          input: {
            arrival: requestArrival,
            departure: requestDeparture,
            adults: 1,
            propertyIds: tlPropertyIds,
            mealRequirement: mealRequirement || null,
          },
        },
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    tlPropertyIds.join(","),
    requestArrival,
    requestDeparture,
    mealRequirement?.breakfast,
    mealRequirement?.lunch,
    mealRequirement?.dinner,
    fetchTlAvail,
  ]);

  const tlAvailMap = useMemo(() => {
    const map = new Map();
    (tlAvailData?.tlPropertiesAvailability ?? []).forEach((s) => map.set(s.propertyId, s));
    return map;
  }, [tlAvailData]);

  // Все отели остаются в списке. У TL без свободных номеров и у локальных без
  // номерного фонда — кнопка «Выбрать» будет заблокирована.
  const options = rawOptions;

  const resetForm = useCallback(() => {
    setSelectedCity("");
    setIsEdited(false);
    setTimeWarningDismissed(false);
    setTlProperty(null);
  }, []);

  const closeButton = useCallback(() => {
    if (
      !isEdited ||
      window.confirm("Все несохранённые данные будут утеряны. Закрыть?")
    ) {
      resetForm();
      onClose();
    }
  }, [isEdited, onClose, resetForm]);

  const [updateRequest, { loading: placingLocal }] = useMutation(
    UPDATE_REQUEST_RELAY,
    {
      context: { headers: { Authorization: `Bearer ${token}` } },
      onCompleted: () => {
        resetForm();
        onClose();
      },
      onError: (err) => {
        console.error("Ошибка размещения:", err);
        alert("Не удалось разместить заявку у отеля.");
      },
    }
  );

  const handleSelectOption = (opt) => {
    if (opt.source === "local") {
      if (opt.access) {
        // саморазмещение — обновляем заявку
        updateRequest({
          variables: {
            updateRequestId: chooseRequestID,
            input: { hotelId: opt.id },
          },
        });
      } else {
        // обычный flow — редирект на диспетчерскую страницу
        onClose();
        navigate(`/hotels/${opt.id}/${chooseRequestID}`);
      }
    } else if (opt.source === "travelline") {
      // открываем sidebar бронирования TravelLine
      setTlProperty(opt);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      // если открыт TL sidebar — игнорируем (он сам управляет закрытием)
      if (tlProperty) return;
      if (sidebarRef.current?.contains(event.target)) return;
      closeButton();
    };

    if (show) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [show, closeButton, tlProperty]);

  return (
    <>
      <Sidebar show={show} sidebarRef={sidebarRef}>
        <div className={classes.requestTitle}>
          <div className={classes.requestTitle_name}>Выбрать гостиницу</div>
          <div className={classes.requestTitle_close} onClick={closeButton}>
            <CloseIcon />
          </div>
        </div>

        {defaultTimesUsed && !timeWarningDismissed ? (
          <div className={classes.timeWarning}>
            <div className={classes.timeWarning_icon}>⏱</div>
            <div className={classes.timeWarning_title}>Время заезда и выезда не указано</div>
            <div className={classes.timeWarning_text}>
              При создании заявки время не было задано. Установлены значения по умолчанию:
            </div>
            <div className={classes.timeWarning_defaults}>
              <div className={classes.timeWarning_row}>
                <span>Заезд</span>
                <span className={classes.timeWarning_value}>14:00</span>
              </div>
              <div className={classes.timeWarning_row}>
                <span>Выезд</span>
                <span className={classes.timeWarning_value}>12:00</span>
              </div>
            </div>
            <div className={classes.timeWarning_actions}>
              <button
                className={classes.timeWarning_btnBack}
                onClick={onBackToRequest}
              >
                Вернуться к заявке
              </button>
              <button
                className={classes.timeWarning_btnContinue}
                onClick={() => setTimeWarningDismissed(true)}
              >
                Продолжить
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className={classes.requestMiddle}>
              <div className={classes.requestData}>
                <label>Город</label>
                {show && (
                  <MUIAutocomplete
                    dropdownWidth={"100%"}
                    label={"Введите город"}
                    options={uniqueCities}
                    value={selectedCity}
                    onChange={(_, newValue) => handleCitySelect(newValue)}
                  />
                )}

                <label style={{ marginTop: 12 }}>Гостиницы</label>

                {!selectedCity ? (
                  <p className={classes.hotelListEmpty}>
                    Выберите город, чтобы увидеть доступные гостиницы
                  </p>
                ) : optionsLoading ? (
                  <div className={classes.hotelListLoader}>
                    <MUILoader loadSize={"32px"} color={"#0057C3"} />
                  </div>
                ) : optionsError ? (
                  <p className={classes.hotelListEmpty}>
                    Не удалось загрузить список: {optionsError.message}
                  </p>
                ) : options.length === 0 ? (
                  <p className={classes.hotelListEmpty}>
                    В этом городе нет доступных гостиниц
                  </p>
                ) : (
                  <div className={classes.hotelList}>
                    {options.map((opt) => (
                      <HotelOptionCard
                        key={`${opt.source}-${opt.id}`}
                        option={opt}
                        disabled={placingLocal}
                        onSelect={() => handleSelectOption(opt)}
                        tlAvailability={
                          opt.source === "travelline" ? tlAvailMap.get(opt.id) : null
                        }
                        tlAvailLoading={
                          opt.source === "travelline" && tlAvailLoading && !tlAvailMap.has(opt.id)
                        }
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </Sidebar>

      {tlProperty && (
        <TravellineRoomsSidebar
          show={!!tlProperty}
          property={tlProperty}
          request={buildTlRequest(chooseObject, chooseRequestID)}
          onClose={() => setTlProperty(null)}
          onBooked={() => {
            setTlProperty(null);
            resetForm();
            onClose();
          }}
        />
      )}
    </>
  );
}

function HotelOptionCard({ option, onSelect, disabled, tlAvailability, tlAvailLoading }) {
  const isTl = option.source === "travelline";

  let availabilityHint = null;
  if (isTl) {
    if (tlAvailability) {
      if (tlAvailability.hasAvailability) {
        const price = tlAvailability.minPricePerNight;
        const cur = tlAvailability.currency || "RUB";
        availabilityHint = (
          <div className={`${classes.hotelCard_avail} ${classes.hotelCard_availOk}`}>
            ✓ Можно разместить{price ? ` · от ${Number(price).toLocaleString("ru-RU")} ${cur}/ночь` : ""}
          </div>
        );
      } else if (tlAvailability.reason === "no_meal_match") {
        availabilityHint = (
          <div className={`${classes.hotelCard_avail} ${classes.hotelCard_availNone}`}>
            ✕ Нельзя разместить: нет номеров с подходящим питанием
          </div>
        );
      } else {
        availabilityHint = (
          <div className={`${classes.hotelCard_avail} ${classes.hotelCard_availNone}`}>
            ✕ Нельзя разместить: нет свободных номеров на эти даты
          </div>
        );
      }
    } else if (tlAvailLoading) {
      availabilityHint = (
        <div className={classes.hotelCard_avail}>Проверяем доступность…</div>
      );
    } else {
      availabilityHint = (
        <div className={classes.hotelCard_avail}>
          Доступность будет проверена при выборе
        </div>
      );
    }
  } else if (option.hasRooms === false) {
    availabilityHint = (
      <div className={`${classes.hotelCard_avail} ${classes.hotelCard_availNone}`}>
        ✕ Номерной фонд не добавлен
      </div>
    );
  }

  return (
    <div className={classes.hotelCard}>
      <div className={classes.hotelCard_photo}>
        {option.photo ? (
          <img src={mediaSrc(option.photo)} alt={option.name} />
        ) : (
          <div className={classes.hotelCard_photoPlaceholder}>🏨</div>
        )}
      </div>
      <div className={classes.hotelCard_body}>
        <div className={classes.hotelCard_titleRow}>
          <span className={classes.hotelCard_name}>{option.name}</span>
          {isTl ? (
            <span className={classes.hotelCard_tlBadge}>TravelLine</span>
          ) : (
            <span className={classes.hotelCard_karsBadge}>Kars Avia</span>
          )}
        </div>
        {option.stars && (
          <div className={classes.hotelCard_stars}>
            {"★".repeat(Math.min(parseInt(option.stars) || 0, 5))}
          </div>
        )}
        {(option.city || option.address) && (
          <div className={classes.hotelCard_addr}>
            📍 {[option.address, option.city].filter(Boolean).join(", ")}
          </div>
        )}
        {availabilityHint}
      </div>
      <div className={classes.hotelCard_action}>
        <button
          type="button"
          className={classes.hotelCard_btn}
          disabled={
            disabled ||
            (!isTl && option.hasRooms === false) ||
            (isTl && tlAvailability && tlAvailability.hasAnyRate === false)
          }
          onClick={onSelect}
        >
          Выбрать
        </button>
      </div>
    </div>
  );
}

export default ChooseHotel;
