import React, { useMemo } from "react"

import classes from "../TravellinePage.module.css"
import { StarRow } from "../shared/ui"
import { fmtDateTime, nightWord, tlImg } from "../shared/helpers"

export default function ReservationDetailModal({
  reservation: r,
  allProperties,
  roomTypesData,
  ratePlansData,
  onClose,
  onStartCancel
}) {
  const isCancelled = r.status === "cancelled" || r.status === "canceled"

  const raw = useMemo(() => {
    try {
      return JSON.parse(r.raw ?? "{}")
    } catch {
      return {}
    }
  }, [r.raw])

  const roomStayRaw = raw?.roomStays?.[0] ?? raw?.placements?.[0] ?? {}
  const mealPlan = roomStayRaw?.mealPlanCode ?? roomStayRaw?.mealPlan?.name
  const totalRaw = raw?.total
  const cancellation = raw?.cancellation
  const comment = r.comment ?? raw?.bookingComments?.[0] ?? raw?.comment ?? raw?.specialRequest ?? raw?.guestComment

  const roomTypesList = roomTypesData?.tlRoomTypes ?? []
  const ratePlansList = ratePlansData?.tlRatePlans ?? []

  const roomTypeName =
    r.roomTypeName ??
    roomTypesList.find((rt) => rt.id === r.roomTypeId)?.name ??
    roomStayRaw?.roomType?.name ??
    roomStayRaw?.fullPlacementsName ??
    r.roomTypeId

  const ratePlanName =
    r.ratePlanName ??
    ratePlansList.find((rp) => rp.id === r.ratePlanId)?.name ??
    roomStayRaw?.ratePlan?.name ??
    r.ratePlanId

  const savedPolicies = useMemo(() => {
    try {
      return r.cancellationPoliciesJson ? JSON.parse(r.cancellationPoliciesJson) : null
    } catch {
      return null
    }
  }, [r.cancellationPoliciesJson])

  const effectiveCancPolicy = savedPolicies?.[0] ?? roomStayRaw?.cancellationPolicy ?? raw?.cancellationPolicy
  const cancPenalty = Number(effectiveCancPolicy?.amount ?? effectiveCancPolicy?.penaltyAmount ?? 0)
  const cancDeadline = effectiveCancPolicy?.deadline ?? effectiveCancPolicy?.freeCancellationDeadlineLocal

  const hotelContent = allProperties.find((p) => p.id === r.propertyId)
  const hotelName = hotelContent?.name ?? r.propertyName ?? r.propertyId
  const hotelAddr = hotelContent?.address
  const hotelStars = parseInt(hotelContent?.stars ?? "0") || 0
  const hotelPhoto = hotelContent?.photos?.[0]

  const arrDate = r.arrival ? new Date(r.arrival) : null
  const depDate = r.departure ? new Date(r.departure) : null
  const nights = arrDate && depDate ? Math.round((depDate.getTime() - arrDate.getTime()) / 86400000) : null

  const arrHasTime = typeof r.arrival === "string" && r.arrival.includes("T")
  const depHasTime = typeof r.departure === "string" && r.departure.includes("T")

  const guestInitials =
    ((r.guest?.firstName?.[0] ?? "") + (r.guest?.lastName?.[0] ?? "")).toUpperCase() || "?"
  const guestName = [r.guest?.firstName, r.guest?.lastName].filter(Boolean).join(" ") || "—"
  const guestContacts = [r.guest?.email, r.guest?.phone].filter(Boolean).join(" · ")

  const fullAddr = [hotelAddr?.street, hotelAddr?.city, hotelAddr?.country].filter(Boolean).join(", ")

  return (
    <div className={classes.modalOverlay} style={{ zIndex: 700 }}>
      <div className={classes.modalBackdrop} onClick={onClose} />
      <div className={classes.resvModalBox}>
        {/* Header */}
        <div
          className={classes.resvHeader}
          style={{
            background: isCancelled ? "#fef2f2" : "linear-gradient(135deg, #1e293b 0%, #334155 100%)"
          }}
        >
          <div>
            <div
              className={classes.resvHeaderEyebrow}
              style={{ color: isCancelled ? "#fca5a5" : "rgba(255,255,255,0.5)" }}
            >
              KARS AVIA · БРОНИРОВАНИЕ
            </div>
            <h2
              className={classes.resvHeaderTitle}
              style={{ color: isCancelled ? "#991b1b" : "#fff" }}
            >
              Подтверждение брони
            </h2>
            <div className={classes.resvHeaderBadges}>
              <span
                className={classes.resvHeaderId}
                style={{
                  background: isCancelled ? "#fee2e2" : "rgba(255,255,255,0.1)",
                  color: isCancelled ? "#dc2626" : "rgba(255,255,255,0.85)"
                }}
              >
                {r.id}
              </span>
              <span
                className={classes.resvHeaderStatus}
                style={{
                  background: isCancelled ? "#fee2e2" : "rgba(34,197,94,0.2)",
                  color: isCancelled ? "#b91c1c" : "#86efac",
                  borderColor: isCancelled ? "transparent" : "rgba(34,197,94,0.3)"
                }}
              >
                {isCancelled ? "✕ Отменено" : "✓ Подтверждено"}
              </span>
            </div>
          </div>
          <button type="button" onClick={onClose} className={classes.resvCloseBtn}>
            ✕
          </button>
        </div>

        {/* Hotel banner */}
        <div className={classes.resvHotel} style={{ minHeight: hotelPhoto ? 120 : "auto" }}>
          {hotelPhoto && (
            <>
              <img src={tlImg(hotelPhoto)} alt={hotelName} className={classes.resvHotelImg} />
              <div className={classes.resvHotelOverlay} />
            </>
          )}
          <div
            className={classes.resvHotelBody}
            style={
              hotelPhoto
                ? { position: "absolute", bottom: 0, left: 0, right: 0 }
                : undefined
            }
          >
            <div
              className={classes.resvHotelIcon}
              style={{ background: hotelPhoto ? "rgba(255,255,255,0.2)" : "#e2e8f0" }}
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke={hotelPhoto ? "#fff" : "#64748b"}
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden
              >
                <path d="M3 21V6a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v15" />
                <path d="M3 21h18" />
                <path d="M9 8h2" />
                <path d="M13 8h2" />
                <path d="M9 12h2" />
                <path d="M13 12h2" />
                <path d="M9 16h6" />
              </svg>
            </div>
            <div style={{ minWidth: 0, flex: 1 }}>
              <p className={classes.resvHotelName} style={{ color: hotelPhoto ? "#fff" : "#0f172a" }}>
                {hotelName}
              </p>
              {hotelStars > 0 && (
                <div style={{ marginTop: 2 }}>
                  <StarRow count={hotelStars} />
                </div>
              )}
              {fullAddr && (
                <p
                  className={classes.resvHotelAddr}
                  style={{ color: hotelPhoto ? "rgba(255,255,255,0.85)" : "#64748b" }}
                >
                  📍 {fullAddr}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Dates bar */}
        <div className={classes.resvDates}>
          <div className={classes.resvDateCell}>
            <p className={classes.resvDateLbl}>Заезд</p>
            <p className={classes.resvDateVal}>
              {arrDate ? arrDate.toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit", year: "numeric" }) : "—"}
            </p>
            {arrDate && arrHasTime && (
              <p className={classes.resvDateTime}>
                {arrDate.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })}
              </p>
            )}
          </div>
          <div className={classes.resvNightsCell}>
            <p className={classes.resvNightsNum}>{nights ?? "—"}</p>
            <p className={classes.resvNightsLbl}>{nightWord(nights)}</p>
          </div>
          <div className={classes.resvDateCell}>
            <p className={classes.resvDateLbl}>Выезд</p>
            <p className={classes.resvDateVal}>
              {depDate ? depDate.toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit", year: "numeric" }) : "—"}
            </p>
            {depDate && depHasTime && (
              <p className={classes.resvDateTime}>
                {depDate.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })}
              </p>
            )}
          </div>
        </div>

        {/* Body */}
        <div className={classes.resvBody}>
          {/* Details 2x2 */}
          <div className={classes.resvGrid}>
            {[
              { label: "Тип номера", value: roomTypeName },
              { label: "Тарифный план", value: ratePlanName },
              { label: "Питание", value: mealPlan || "Без питания" },
              { label: "Гостей", value: `${r.adults} взр.${r.children > 0 ? ` · ${r.children} дет.` : ""}` }
            ]
              .filter((x) => x.value)
              .map(({ label, value }) => (
                <div key={label} className={classes.resvDetailCard}>
                  <p className={classes.resvDetailLbl}>{label}</p>
                  <p className={classes.resvDetailVal}>{value}</p>
                </div>
              ))}
          </div>

          {/* Guest */}
          <div className={classes.resvGuestCard}>
            <div className={classes.resvAvatar}>{guestInitials}</div>
            <div style={{ minWidth: 0, flex: 1 }}>
              <p className={classes.resvGuestName}>{guestName}</p>
              <p className={classes.resvGuestSub}>{guestContacts || "Контакты не указаны"}</p>
            </div>
            <span className={classes.resvGuestIcon} aria-hidden>👥</span>
          </div>

          {/* Comment */}
          {comment && (
            <div className={classes.resvDetailCard} style={{ width: "100%" }}>
              <p className={classes.resvDetailLbl}>Комментарий к брони</p>
              <p style={{ fontSize: 13, color: "#0f172a", margin: "4px 0 0" }}>{comment}</p>
            </div>
          )}

          {/* Price */}
          <div className={classes.resvPriceBlock}>
            {totalRaw?.priceBeforeTax != null && (
              <div className={classes.resvPriceRow}>
                <span>Стоимость проживания</span>
                <span style={{ fontWeight: 500 }}>
                  {Number(totalRaw.priceBeforeTax).toLocaleString("ru-RU")} {r.currency}
                </span>
              </div>
            )}
            {totalRaw?.taxAmount > 0 && (
              <div className={classes.resvPriceRow}>
                <span style={{ color: "#22c55e" }}>Налог (оплачивается в отеле)</span>
                <span>{Number(totalRaw.taxAmount).toLocaleString("ru-RU")} {r.currency}</span>
              </div>
            )}
            <div className={classes.resvPriceTotal}>
              <span>Итого</span>
              <span className={classes.resvPriceTotalVal}>
                {r.totalPrice?.toLocaleString("ru-RU")} {r.currency}
              </span>
            </div>
          </div>

          {/* Cancellation conditions */}
          {cancPenalty > 0 ? (
            <div className={classes.resvCancPaid}>
              <p className={classes.resvCancPaidTitle}>Условия отмены</p>
              <p className={classes.resvCancPaidText}>
                {cancDeadline
                  ? `Штраф ${cancPenalty.toLocaleString("ru-RU")} ${r.currency} при отмене после ${fmtDateTime(cancDeadline)}`
                  : `Безвозвратный тариф — штраф ${cancPenalty.toLocaleString("ru-RU")} ${r.currency}`}
              </p>
            </div>
          ) : (
            <div className={classes.resvCancFree}>✓ Бесплатная отмена</div>
          )}

          {cancellation && (
            <div className={classes.resvCancelled}>
              <p className={classes.resvCancelledTitle}>Бронирование отменено</p>
              {cancellation.cancelledUtc && (
                <p className={classes.resvCancelledLine}>Дата: {fmtDateTime(cancellation.cancelledUtc)}</p>
              )}
              {cancellation.penaltyAmount > 0 && (
                <p className={classes.resvCancelledLine}>
                  Штраф: {Number(cancellation.penaltyAmount).toLocaleString("ru-RU")} {r.currency}
                </p>
              )}
            </div>
          )}

          <p className={classes.resvFooterNote}>
            Создано {fmtDateTime(r.createdAt)} · ID объекта: {r.propertyId}
          </p>
        </div>

        {/* Actions */}
        <div className={classes.resvActions}>
          {!isCancelled && (
            <button type="button" className={classes.resvCancelBtn} onClick={() => onStartCancel(r.id, r)}>
              Отменить бронь
            </button>
          )}
          <button type="button" className={classes.resvCloseDarkBtn} onClick={onClose}>
            Закрыть
          </button>
        </div>
      </div>
    </div>
  )
}
