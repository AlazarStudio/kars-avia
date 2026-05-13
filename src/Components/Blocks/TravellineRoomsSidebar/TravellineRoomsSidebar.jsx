import React, { useEffect, useMemo, useRef, useState } from "react";
import { useApolloClient, useLazyQuery, useMutation } from "@apollo/client";

import {
  CREATE_TL_RESERVATION,
  GET_REQUEST,
  TL_AVAILABILITY,
  TL_VERIFY_BOOKING,
  getCookie,
} from "../../../../graphQL_requests";
import Sidebar from "../Sidebar/Sidebar";
import MUILoader from "../MUILoader/MUILoader";
import CloseIcon from "../../../shared/icons/CloseIcon";
import classes from "./TravellineRoomsSidebar.module.css";

function formatDate(value) {
  if (!value) return "—";
  const d = new Date(value);
  if (isNaN(d.getTime())) return value;
  return d.toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function nightsBetween(arrival, departure) {
  if (!arrival || !departure) return 0;
  const a = new Date(arrival).getTime();
  const d = new Date(departure).getTime();
  return Math.max(1, Math.round((d - a) / 86400000));
}

function nightWord(n) {
  if (!n) return "";
  if (n === 1) return "ночь";
  if (n < 5) return "ночи";
  return "ночей";
}

// Parse "Фамилия Имя Отчество" → { firstName, lastName }
function parsePersonName(fullName) {
  if (!fullName || typeof fullName !== "string") return { firstName: "", lastName: "" };
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return { firstName: "", lastName: "" };
  if (parts.length === 1) return { firstName: parts[0], lastName: "" };
  return { firstName: parts[1], lastName: parts[0] };
}

function TravellineRoomsSidebar({ show, property, request, onClose, onBooked }) {
  const sidebarRef = useRef();
  const token = getCookie("token");

  // Подтягиваем заявку напрямую — пропс может быть с битой структурой
  const requestId = request?.id || null;
  const apolloClient = useApolloClient();
  const [liveRequest, setLiveRequest] = useState(null);
  const [requestFetchError, setRequestFetchError] = useState("");

  useEffect(() => {
    if (!show || !requestId) return;
    let cancelled = false;
    apolloClient
      .query({
        query: GET_REQUEST,
        variables: {
          requestId,
          pagination: { skip: 0, take: 10 },
        },
        context: { headers: { Authorization: `Bearer ${token}` } },
        fetchPolicy: "network-only",
      })
      .then((res) => {
        if (cancelled) return;
        setLiveRequest(res?.data?.request ?? null);
      })
      .catch((err) => {
        if (cancelled) return;
        setRequestFetchError(err?.message || String(err));
        console.error("[TL Sidebar] GET_REQUEST failed:", err);
      });
    return () => {
      cancelled = true;
    };
  }, [show, requestId, apolloClient, token]);

  const arrival = liveRequest?.arrival || request?.arrival || null;
  const departure = liveRequest?.departure || request?.departure || null;
  const personName = liveRequest?.person?.name || request?.person?.name || "";
  const personEmail = liveRequest?.person?.email || request?.person?.email || "";
  const personNumber = liveRequest?.person?.number || request?.person?.number || "";
  const note = liveRequest?.note || request?.note || "";

  const nights = nightsBetween(arrival, departure);

  const initialGuest = useMemo(() => {
    const { firstName, lastName } = parsePersonName(personName);
    return {
      firstName,
      lastName,
      email: personEmail,
      phone: personNumber,
      // Комментарий — это просьба гостя отелю (не примечание авиакомпании).
      // Оставляем пустым по умолчанию.
      comment: "",
    };
  }, [personName, personEmail, personNumber]);

  const [selectedRate, setSelectedRate] = useState(null);
  const [guest, setGuest] = useState(initialGuest);
  const [conditionChange, setConditionChange] = useState(null);
  const [pendingChecksum, setPendingChecksum] = useState(undefined);
  const [bookError, setBookError] = useState("");
  const [bookResult, setBookResult] = useState(null);

  useEffect(() => setGuest(initialGuest), [initialGuest]);

  const [
    fetchAvail,
    { data: availData, loading: availLoading, error: availError },
  ] = useLazyQuery(TL_AVAILABILITY, {
    context: { headers: { Authorization: `Bearer ${token}` } },
    fetchPolicy: "network-only",
  });

  useEffect(() => {
    if (show && property?.id && arrival && departure) {
      fetchAvail({
        variables: {
          input: {
            propertyId: property.id,
            arrival,
            departure,
            adults: 1,
            childAges: [],
          },
        },
      });
    }
  }, [show, property?.id, arrival, departure, fetchAvail]);

  const allRates = availData?.tlAvailability?.rates ?? [];

  // Питание из заявки (что требуется)
  const requiredMeal = useMemo(() => {
    const mp = liveRequest?.mealPlan;
    if (!mp?.included) return { breakfast: false, lunch: false, dinner: false, none: true };
    return {
      breakfast: !!mp.breakfastEnabled,
      lunch: !!mp.lunchEnabled,
      dinner: !!mp.dinnerEnabled,
      none: false,
    };
  }, [liveRequest]);

  // Что покрывает mealType от TL
  const mealCoverage = (code) => {
    const c = String(code || "").toLowerCase();
    if (!c) return { b: false, l: false, d: false };
    if (c.includes("allinclusive") || c.includes("ai")) return { b: true, l: true, d: true };
    if (c.includes("fullboard") || c.includes("fb")) return { b: true, l: true, d: true };
    if (c.includes("halfboard") || c.includes("hb")) return { b: true, l: false, d: true };
    if (c.includes("breakfast") || c.includes("bb")) return { b: true, l: false, d: false };
    return { b: false, l: false, d: false }; // RoomOnly / RO
  };

  const rateCoversRequest = (rate) => {
    if (requiredMeal.none) return true; // в заявке без питания — подходит любой
    const cov = mealCoverage(rate.mealType);
    if (requiredMeal.breakfast && !cov.b) return false;
    if (requiredMeal.lunch && !cov.l) return false;
    if (requiredMeal.dinner && !cov.d) return false;
    return true;
  };

  const [showAllMeals, setShowAllMeals] = useState(false);
  const filteredRates = useMemo(
    () => (showAllMeals ? allRates : allRates.filter(rateCoversRequest)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [allRates, showAllMeals, requiredMeal.breakfast, requiredMeal.lunch, requiredMeal.dinner, requiredMeal.none]
  );
  const hiddenCount = allRates.length - filteredRates.length;
  const rates = filteredRates;

  const [verifyBooking, { loading: verifying }] = useMutation(TL_VERIFY_BOOKING, {
    context: { headers: { Authorization: `Bearer ${token}` } },
  });
  const [createReservation, { loading: creating }] = useMutation(
    CREATE_TL_RESERVATION,
    {
      context: { headers: { Authorization: `Bearer ${token}` } },
    }
  );

  const handlePickRate = (rate) => {
    setSelectedRate(rate);
    setPendingChecksum(rate.checksum);
    setConditionChange(null);
    setBookError("");
    setBookResult(null);
  };

  const submitBooking = async () => {
    if (!selectedRate || !arrival || !departure) return;
    setBookError("");
    // verify первым шагом — на случай изменения условий
    try {
      const vRes = await verifyBooking({
        variables: {
          input: {
            propertyId: property.id,
            roomTypeId: selectedRate.roomTypeId,
            ratePlanId: selectedRate.ratePlanId,
            arrival,
            departure,
            adults: 1,
            childAges: [],
            checksum: pendingChecksum,
            roomTypePlacements: selectedRate.roomTypePlacements,
            checkInTime: selectedRate.checkInTime,
            checkOutTime: selectedRate.checkOutTime,
          },
        },
      });
      const vData = vRes.data?.tlVerifyBooking;
      if (vData?.conditionChange) {
        setConditionChange({
          newPriceBeforeTax: vData.newPriceBeforeTax,
          newTotalPrice: vData.newTotalPrice,
          newTax: vData.newTax,
          newChecksum: vData.newChecksum,
          message: vData.message,
        });
        setPendingChecksum(vData.newChecksum);
        return;
      }
    } catch {
      /* verify не критичен — продолжаем */
    }
    await doCreate();
  };

  const doCreate = async () => {
    if (!selectedRate || !arrival || !departure) return;
    try {
      const res = await createReservation({
        variables: {
          input: {
            propertyId: property.id,
            roomTypeId: selectedRate.roomTypeId,
            ratePlanId: selectedRate.ratePlanId,
            arrival,
            departure,
            adults: 1,
            children: 0,
            childAges: [],
            guest: {
              firstName: guest.firstName,
              lastName: guest.lastName,
              email: guest.email || null,
              phone: guest.phone || null,
            },
            comment: guest.comment || null,
            checksum: pendingChecksum,
            roomTypePlacements: selectedRate.roomTypePlacements,
            checkInTime: selectedRate.checkInTime,
            checkOutTime: selectedRate.checkOutTime,
            roomTypeName: selectedRate.roomTypeName || null,
            ratePlanName: selectedRate.ratePlanName || null,
            cancellationPoliciesJson: selectedRate.cancellationPolicies?.length
              ? JSON.stringify(selectedRate.cancellationPolicies)
              : null,
            requestId: request?.id,
            mealPlanCode: selectedRate.mealType || null,
          },
        },
      });
      const created = res.data?.tlCreateReservation;
      setBookResult(created);
      setSelectedRate(null);
      setConditionChange(null);
    } catch (err) {
      setBookError(err.message);
    }
  };

  const submitDisabled =
    !guest.firstName?.trim() || !guest.lastName?.trim() || verifying || creating;

  return (
    <Sidebar show={show} sidebarRef={sidebarRef}>
      <div className={classes.title}>
        <div className={classes.titleName}>Бронирование TravelLine</div>
        <div className={classes.titleClose} onClick={onClose}>
          <CloseIcon />
        </div>
      </div>

      <div className={classes.body}>
        {/* Hotel block */}
        <div className={classes.hotelBlock}>
          {property?.photo && (
            <div className={classes.hotelPhoto}>
              <img src={property.photo} alt={property?.name} />
            </div>
          )}
          <div className={classes.hotelMeta}>
            <div className={classes.hotelName}>{property?.name}</div>
            {property?.stars && (
              <div className={classes.hotelStars}>
                {"★".repeat(Math.min(parseInt(property.stars) || 0, 5))}
              </div>
            )}
            {(property?.city || property?.address) && (
              <div className={classes.hotelAddr}>
                📍 {[property?.address, property?.city].filter(Boolean).join(", ")}
              </div>
            )}
          </div>
        </div>

        {/* Trip info from request */}
        <div className={classes.tripInfo}>
          <div className={classes.tripRow}>
            <span className={classes.tripLbl}>Заезд</span>
            <span className={classes.tripVal}>{formatDate(arrival)}</span>
          </div>
          <div className={classes.tripDivider} />
          <div className={classes.tripRow}>
            <span className={classes.tripLbl}>Выезд</span>
            <span className={classes.tripVal}>{formatDate(departure)}</span>
          </div>
          <div className={classes.tripDivider} />
          <div className={classes.tripRow}>
            <span className={classes.tripLbl}>Ночей</span>
            <span className={classes.tripVal}>{nights || "—"}</span>
          </div>
          <div className={classes.tripDivider} />
          <div className={classes.tripRow}>
            <span className={classes.tripLbl}>Гость</span>
            <span className={classes.tripVal}>
              {personName || "—"}
            </span>
          </div>
        </div>

        {bookResult && (
          <div className={classes.successBlock}>
            <div className={classes.successTitle}>✓ Бронирование создано</div>
            <div className={classes.successId}>
              Номер брони: <code>{bookResult.id}</code>
            </div>
            <button
              type="button"
              className={classes.btnPrimary}
              onClick={() => onBooked && onBooked(bookResult)}
            >
              Готово
            </button>
          </div>
        )}

        {!bookResult && (
          <>
            {/* Loading / error / list */}
            {availLoading ? (
              <div className={classes.loader}>
                <MUILoader loadSize="32px" color="#0057C3" />
              </div>
            ) : availError ? (
              <p className={classes.error}>
                {/^.*in the past.*$/i.test(availError.message)
                  ? "Дата заезда в прошлом — бронирование через TravelLine невозможно."
                  : `Ошибка получения номеров: ${availError.message}`}
              </p>
            ) : allRates.length === 0 ? (
              <p className={classes.empty}>
                Нет свободных номеров на выбранные даты
              </p>
            ) : selectedRate ? (
              <div className={classes.ratesList}>
                <button
                  type="button"
                  className={classes.btnSecondary}
                  style={{ alignSelf: "flex-start" }}
                  onClick={() => {
                    setSelectedRate(null);
                    setConditionChange(null);
                    setBookError("");
                  }}
                >
                  ← Назад к списку номеров
                </button>
                <RateCard rate={selectedRate} nights={nights} selected />
              </div>
            ) : (
              <div className={classes.ratesList}>
                <div className={classes.sectionTitle}>Доступные номера</div>
                {!requiredMeal.none && (
                  <div className={classes.mealFilter}>
                    <div className={classes.mealFilterText}>
                      Фильтр по питанию заявки:{" "}
                      <strong>
                        {[
                          requiredMeal.breakfast && "Завтрак",
                          requiredMeal.lunch && "Обед",
                          requiredMeal.dinner && "Ужин",
                        ]
                          .filter(Boolean)
                          .join(" + ")}
                      </strong>
                      {hiddenCount > 0 && !showAllMeals && (
                        <span className={classes.mealHidden}>
                          {" "}· скрыто: {hiddenCount}
                        </span>
                      )}
                    </div>
                    {hiddenCount > 0 && (
                      <button
                        type="button"
                        className={classes.mealToggle}
                        onClick={() => setShowAllMeals((v) => !v)}
                      >
                        {showAllMeals ? "Только подходящие" : "Показать все"}
                      </button>
                    )}
                  </div>
                )}
                {rates.length === 0 ? (
                  <p className={classes.empty}>
                    Нет номеров, удовлетворяющих требованию по питанию.
                  </p>
                ) : (
                  rates.map((rate, i) => (
                    <RateCard
                      key={`${rate.roomTypeId}-${rate.ratePlanId}-${i}`}
                      rate={rate}
                      nights={nights}
                      onPick={() => handlePickRate(rate)}
                    />
                  ))
                )}
              </div>
            )}

            {/* Booking form */}
            {selectedRate && (
              <div className={classes.bookingForm}>
                <div className={classes.sectionTitle}>Данные гостя</div>

                {conditionChange && (
                  <div className={classes.conditionChange}>
                    <div className={classes.conditionChangeTitle}>
                      ⚠ Условия проживания изменились
                    </div>
                    <div className={classes.conditionChangeText}>
                      {conditionChange.message ||
                        "Отель обновил условия. Актуальная стоимость:"}
                    </div>
                    {conditionChange.newPriceBeforeTax != null && (
                      <div className={classes.conditionChangePrice}>
                        <span>Итого</span>
                        <strong>
                          {(conditionChange.newTotalPrice ?? 0).toLocaleString(
                            "ru-RU"
                          )}{" "}
                          {selectedRate?.currency}
                        </strong>
                      </div>
                    )}
                    <div className={classes.conditionChangeActions}>
                      <button
                        type="button"
                        className={classes.btnPrimary}
                        onClick={doCreate}
                        disabled={creating}
                      >
                        Принять и забронировать
                      </button>
                      <button
                        type="button"
                        className={classes.btnSecondary}
                        onClick={() => {
                          setConditionChange(null);
                          setSelectedRate(null);
                        }}
                      >
                        Отмена
                      </button>
                    </div>
                  </div>
                )}

                {!conditionChange && (
                  <>
                    {note && (
                      <div className={classes.noteBlock}>
                        <div className={classes.noteLabel}>Примечание авиакомпании</div>
                        <div className={classes.noteText}>{note}</div>
                      </div>
                    )}
                    <div className={classes.formRow}>
                      <FormField
                        label="Имя *"
                        value={guest.firstName}
                        onChange={(v) => setGuest({ ...guest, firstName: v })}
                      />
                      <FormField
                        label="Фамилия *"
                        value={guest.lastName}
                        onChange={(v) => setGuest({ ...guest, lastName: v })}
                      />
                    </div>
                    <div className={classes.formRow}>
                      <FormField
                        label="Email"
                        value={guest.email}
                        onChange={(v) => setGuest({ ...guest, email: v })}
                      />
                      <FormField
                        label="Телефон"
                        value={guest.phone}
                        onChange={(v) => setGuest({ ...guest, phone: v })}
                      />
                    </div>
                    <FormField
                      label="Комментарий для отеля"
                      placeholder="Пожелания гостя (тихий этаж, поздний заезд и т.п.)"
                      value={guest.comment}
                      onChange={(v) => setGuest({ ...guest, comment: v })}
                    />
                    {bookError && (
                      <p className={classes.error}>{bookError}</p>
                    )}
                    <button
                      type="button"
                      className={classes.btnPrimary}
                      style={{ marginTop: 12, width: "100%" }}
                      disabled={submitDisabled}
                      onClick={submitBooking}
                    >
                      {verifying || creating
                        ? "Бронируем…"
                        : "Подтвердить бронирование"}
                    </button>
                  </>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </Sidebar>
  );
}

function FormField({ label, value, onChange, placeholder }) {
  return (
    <label className={classes.field}>
      <span className={classes.fieldLabel}>{label}</span>
      <input
        type="text"
        value={value || ""}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className={classes.fieldInput}
      />
    </label>
  );
}

function RateCard({ rate, nights, selected, onPick }) {
  const total = (rate.priceBeforeTax || 0) * nights;
  return (
    <div className={`${classes.rate} ${selected ? classes.rateSelected : ""}`}>
      <div className={classes.rateInfo}>
        <div className={classes.rateName}>{rate.roomTypeName || "Номер"}</div>
        <div className={classes.rateSub}>{rate.ratePlanName}</div>
        {rate.cancellationPolicies?.length > 0 ? (
          <div className={classes.rateCancel}>
            {rate.cancellationPolicies.map((cp, ci) => (
              <div key={ci}>
                {cp.deadline
                  ? `Штраф ${cp.amount?.toLocaleString("ru-RU")} ${rate.currency} при отмене после ${formatDate(cp.deadline)}`
                  : `Безвозвратный — штраф ${cp.amount?.toLocaleString("ru-RU")} ${rate.currency}`}
              </div>
            ))}
          </div>
        ) : (
          <div className={classes.rateCancelFree}>Бесплатная отмена</div>
        )}
      </div>
      <div className={classes.rateRight}>
        <div className={classes.ratePrice}>
          {total.toLocaleString("ru-RU")} {rate.currency}
        </div>
        <div className={classes.ratePricePer}>
          {rate.priceBeforeTax?.toLocaleString("ru-RU")} / ночь
        </div>
        {!selected && onPick && (
          <button type="button" className={classes.btnPrimary} onClick={onPick}>
            Выбрать
          </button>
        )}
      </div>
    </div>
  );
}

export default TravellineRoomsSidebar;
