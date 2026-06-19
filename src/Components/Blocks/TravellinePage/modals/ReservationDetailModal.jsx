import React, { useEffect, useMemo, useState } from "react"
import { useLazyQuery, useMutation } from "@apollo/client"

import { AMEND_TL_RESERVATION, TL_EXTRA_STAYS_FOR_AMEND } from "../../../../../graphQL_requests"
import classes from "../TravellinePage.module.css"
import { Btn, StarRow } from "../shared/ui"
import { fmtCancellationPolicy, fmtDateTime, nightWord, tlImg, tzLabel } from "../shared/helpers"

// ─── Amend sub-modal ──────────────────────────────────────────────────────────

function AmendModal({ r, onClose, onSuccess }) {
  const rawBooking = useMemo(() => {
    try { return JSON.parse(r.raw ?? "{}") } catch { return {} }
  }, [r.raw])
  const existingStay = rawBooking?.roomStays?.[0] ?? rawBooking?.booking?.roomStays?.[0] ?? {}
  const checkInDefault = existingStay?.stayDates?.arrivalDateTime?.slice(11, 16) ?? "15:00"
  const checkOutDefault = existingStay?.stayDates?.departureDateTime?.slice(11, 16) ?? "11:00"
  const existingPlacements = existingStay?.roomType?.placements?.map((p) => p.code) ?? []

  const [form, setForm] = useState({
    arrival: r.arrival?.slice(0, 10) ?? "",
    departure: r.departure?.slice(0, 10) ?? "",
    comment: r.comment ?? ""
  })
  const [selectedEarly, setSelectedEarly] = useState(null)
  const [selectedLate, setSelectedLate] = useState(null)
  const [extraStays, setExtraStays] = useState(null)
  const [extraError, setExtraError] = useState("")
  const [error, setError] = useState("")

  const [doAmend, { loading: amending }] = useMutation(AMEND_TL_RESERVATION)
  const [fetchExtra, { loading: extraLoading }] = useLazyQuery(TL_EXTRA_STAYS_FOR_AMEND)

  const datesValid = form.arrival && form.departure && form.arrival < form.departure

  const loadExtraStays = (arrival, departure) => {
    if (!arrival || !departure || arrival >= departure) return
    setExtraError("")
    fetchExtra({
      variables: {
        propertyId: r.propertyId,
        input: {
          arrivalDateTime: `${arrival}T${checkInDefault}`,
          departureDateTime: `${departure}T${checkOutDefault}`,
          roomTypeId: r.roomTypeId,
          ratePlanId: r.ratePlanId,
          roomTypePlacements: existingPlacements,
          adults: r.adults ?? 1,
          childAges: [],
          corporateId: r.corporateId ?? null
        }
      }
    }).then((res) => {
      const es = res.data?.tlExtraStays
      if (es && (es.earlyCheckIn.length > 0 || es.lateCheckOut.length > 0)) {
        setExtraStays(es)
        // Preserve current selection by matching time; on initial load pre-select from booking
        setSelectedEarly((prev) => {
          const timeToMatch = prev
            ? prev.dateTimeLocal.slice(11, 16)
            : r.earlyCheckInDateTime?.slice(11, 16)
          if (!timeToMatch) return null
          return es.earlyCheckIn.find((o) => o.dateTimeLocal.slice(11, 16) === timeToMatch) ?? null
        })
        setSelectedLate((prev) => {
          const timeToMatch = prev
            ? prev.dateTimeLocal.slice(11, 16)
            : r.lateCheckOutDateTime?.slice(11, 16)
          if (!timeToMatch) return null
          return es.lateCheckOut.find((o) => o.dateTimeLocal.slice(11, 16) === timeToMatch) ?? null
        })
      } else {
        setExtraStays(null)
        setSelectedEarly(null)
        setSelectedLate(null)
      }
    }).catch((err) => {
      setExtraError(err.message)
    })
  }

  // Load on mount with current dates
  useEffect(() => {
    loadExtraStays(form.arrival, form.departure)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Reload when dates change
  useEffect(() => {
    if (!datesValid) { setExtraStays(null); setSelectedEarly(null); setSelectedLate(null); return }
    loadExtraStays(form.arrival, form.departure)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.arrival, form.departure])

  const effectiveCheckIn = selectedEarly
    ? selectedEarly.dateTimeLocal
    : (form.arrival ? `${form.arrival}T${checkInDefault}` : null)

  const effectiveCheckOut = selectedLate
    ? selectedLate.dateTimeLocal
    : (form.departure ? `${form.departure}T${checkOutDefault}` : null)

  const extraCost = (selectedEarly?.price ?? 0) + (selectedLate?.price ?? 0)

  const handleSubmit = async () => {
    setError("")
    if (!datesValid) { setError("Укажите корректные даты"); return }
    try {
      const res = await doAmend({
        variables: {
          input: {
            bookingId: r.id,
            arrival: form.arrival,
            departure: form.departure,
            checkInTime: checkInDefault,
            checkOutTime: checkOutDefault,
            comment: form.comment || null,
            corporateId: r.corporateId ?? null,
            earlyCheckInDateTime: selectedEarly?.dateTimeLocal ?? null,
            lateCheckOutDateTime: selectedLate?.dateTimeLocal ?? null
          }
        }
      })
      onSuccess(res.data?.tlAmendReservation)
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <div className={classes.modalOverlay} style={{ zIndex: 800 }}>
      <div className={classes.modalBackdrop} onClick={onClose} />
      <div style={{
        position: "relative",
        zIndex: 801,
        background: "#fff",
        borderRadius: 16,
        width: "100%",
        maxWidth: 480,
        maxHeight: "90vh",
        overflowY: "auto",
        boxShadow: "0 20px 60px rgba(0,0,0,0.25)"
      }}>
        {/* Header */}
        <div style={{
          background: "linear-gradient(135deg, #1e293b 0%, #334155 100%)",
          padding: "18px 20px 16px",
          borderRadius: "16px 16px 0 0",
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between"
        }}>
          <div>
            <p style={{ fontSize: 10, color: "rgba(255,255,255,0.5)", margin: "0 0 4px", fontWeight: 600, letterSpacing: 1 }}>
              ИЗМЕНЕНИЕ БРОНИ
            </p>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: "#fff", margin: 0 }}>
              {r.propertyName ?? r.propertyId}
            </h3>
            <p style={{ fontSize: 11, color: "rgba(255,255,255,0.55)", margin: "3px 0 0", fontFamily: "monospace" }}>
              {r.id}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{ background: "rgba(255,255,255,0.1)", border: "none", color: "#fff", borderRadius: 8, width: 30, height: 30, cursor: "pointer", fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center" }}
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: "20px" }}>

          {/* Dates */}
          <div className={classes.gridForm2} style={{ marginBottom: 16 }}>
            <div className={classes.fieldGroup}>
              <label className={classes.fieldLabel}>Заезд</label>
              <input
                type="date"
                value={form.arrival}
                onChange={(e) => setForm((f) => ({ ...f, arrival: e.target.value }))}
                className={classes.input}
              />
            </div>
            <div className={classes.fieldGroup}>
              <label className={classes.fieldLabel}>Выезд</label>
              <input
                type="date"
                value={form.departure}
                onChange={(e) => setForm((f) => ({ ...f, departure: e.target.value }))}
                className={classes.input}
              />
            </div>
          </div>

          {/* РЗПВ */}
          {extraLoading && (
            <p style={{ fontSize: 12, color: "#94a3b8", marginBottom: 12 }}>Загрузка опций раннего заезда / позднего выезда...</p>
          )}
          {extraError && !extraLoading && (
            <p style={{ fontSize: 11, color: "#dc2626", marginBottom: 12 }}>⚠ РЗПВ недоступно: {extraError}</p>
          )}

          {(extraStays?.earlyCheckIn?.length > 0 || extraStays?.lateCheckOut?.length > 0) && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 12, marginBottom: 16, alignItems: "start" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {extraStays.earlyCheckIn.length > 0 && (
                  <div>
                    <p className={classes.fieldLabel} style={{ marginBottom: 4 }}>Ранний заезд</p>
                    <select
                      value={selectedEarly ? extraStays.earlyCheckIn.indexOf(selectedEarly) : ""}
                      onChange={(e) => setSelectedEarly(e.target.value === "" ? null : extraStays.earlyCheckIn[Number(e.target.value)])}
                      className={classes.input}
                    >
                      <option value="">— не выбрано (стандартный {checkInDefault})</option>
                      {extraStays.earlyCheckIn.map((opt, i) => (
                        <option key={i} value={i}>
                          с {opt.dateTimeLocal.slice(11, 16)} — +{opt.price.toLocaleString("ru-RU")} {opt.currency}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                {extraStays.lateCheckOut.length > 0 && (
                  <div>
                    <p className={classes.fieldLabel} style={{ marginBottom: 4 }}>Поздний выезд</p>
                    <select
                      value={selectedLate ? extraStays.lateCheckOut.indexOf(selectedLate) : ""}
                      onChange={(e) => setSelectedLate(e.target.value === "" ? null : extraStays.lateCheckOut[Number(e.target.value)])}
                      className={classes.input}
                    >
                      <option value="">— не выбрано (стандартный {checkOutDefault})</option>
                      {extraStays.lateCheckOut.map((opt, i) => (
                        <option key={i} value={i}>
                          до {opt.dateTimeLocal.slice(11, 16)} — +{opt.price.toLocaleString("ru-RU")} {opt.currency}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {/* Summary panel */}
              <div style={{
                background: "#f8fafc",
                border: "1px solid #e2e8f0",
                borderRadius: 10,
                padding: "10px 14px",
                minWidth: 150,
                display: "flex",
                flexDirection: "column",
                gap: 10
              }}>
                <div>
                  <p style={{ fontSize: 10, color: "#64748b", margin: "0 0 2px", fontWeight: 600 }}>ЗАЕЗД</p>
                  <p style={{ margin: 0, fontWeight: 700, fontSize: 13, color: selectedEarly ? "#d97706" : "#0f172a" }}>
                    {effectiveCheckIn ? effectiveCheckIn.slice(0, 10).split("-").reverse().join(".") : "—"}
                  </p>
                  <p style={{ margin: 0, fontWeight: 700, fontSize: 13, color: selectedEarly ? "#d97706" : "#0f172a" }}>
                    {effectiveCheckIn ? effectiveCheckIn.slice(11, 16) : "—"}
                  </p>
                  {selectedEarly && (
                    <p style={{ margin: "2px 0 0", fontSize: 10, color: "#d97706" }}>
                      ранний +{selectedEarly.price.toLocaleString("ru-RU")} {selectedEarly.currency}
                    </p>
                  )}
                </div>
                <div>
                  <p style={{ fontSize: 10, color: "#64748b", margin: "0 0 2px", fontWeight: 600 }}>ВЫЕЗД</p>
                  <p style={{ margin: 0, fontWeight: 700, fontSize: 13, color: selectedLate ? "#d97706" : "#0f172a" }}>
                    {effectiveCheckOut ? effectiveCheckOut.slice(0, 10).split("-").reverse().join(".") : "—"}
                  </p>
                  <p style={{ margin: 0, fontWeight: 700, fontSize: 13, color: selectedLate ? "#d97706" : "#0f172a" }}>
                    {effectiveCheckOut ? effectiveCheckOut.slice(11, 16) : "—"}
                  </p>
                  {selectedLate && (
                    <p style={{ margin: "2px 0 0", fontSize: 10, color: "#d97706" }}>
                      поздний +{selectedLate.price.toLocaleString("ru-RU")} {selectedLate.currency}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {(selectedEarly || selectedLate) && (
            <p style={{ fontSize: 11, color: "#c2410c", margin: "6px 0 0" }}>
              ⚠ Ранний заезд / поздний выезд увеличивает размер штрафа за отмену.
            </p>
          )}

          {/* Extra cost */}
          {extraCost > 0 && (
            <div style={{
              display: "flex", justifyContent: "space-between", alignItems: "center",
              background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 8,
              padding: "8px 12px", marginBottom: 16, fontSize: 13
            }}>
              <span style={{ color: "#92400e" }}>Доп. услуги (РЗПВ)</span>
              <strong style={{ color: "#d97706" }}>+{extraCost.toLocaleString("ru-RU")} {r.currency}</strong>
            </div>
          )}

          {/* Comment */}
          <div className={classes.fieldGroup} style={{ marginBottom: 20 }}>
            <label className={classes.fieldLabel}>Комментарий к брони</label>
            <textarea
              value={form.comment}
              onChange={(e) => setForm((f) => ({ ...f, comment: e.target.value }))}
              placeholder="Пожелания, особые условия..."
              rows={3}
              className={classes.consoleBody}
              style={{ marginBottom: 0 }}
            />
          </div>

          {error && (
            <p className={classes.statusWarn} style={{ marginBottom: 12, fontSize: 12 }}>{error}</p>
          )}

          <div style={{ display: "flex", gap: 8 }}>
            <Btn onClick={handleSubmit} loading={amending} disabled={!datesValid}>
              Применить изменения
            </Btn>
            <Btn variant="secondary" onClick={onClose}>Отмена</Btn>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Main modal ───────────────────────────────────────────────────────────────

export default function ReservationDetailModal({
  reservation: r,
  allProperties,
  roomTypesData,
  ratePlansData,
  onClose,
  onStartCancel,
  onAmended
}) {
  const [showAmend, setShowAmend] = useState(false)
  const [amendResult, setAmendResult] = useState(null)
  const [amended, setAmended] = useState(false)

  const isCancelled = r.status === "cancelled" || r.status === "canceled"

  const currentR = amended
    ? { ...r, arrival: amendResult?.newArrival ?? r.arrival, departure: amendResult?.newDeparture ?? r.departure }
    : r

  const raw = useMemo(() => {
    try { return JSON.parse(currentR.raw ?? r.raw ?? "{}") } catch { return {} }
  }, [currentR.raw, r.raw])

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
    try { return r.cancellationPoliciesJson ? JSON.parse(r.cancellationPoliciesJson) : null } catch { return null }
  }, [r.cancellationPoliciesJson])

  const effectiveCancPolicy = savedPolicies?.[0] ?? roomStayRaw?.cancellationPolicy ?? raw?.cancellationPolicy
  const cancPenalty = Number(effectiveCancPolicy?.amount ?? effectiveCancPolicy?.penaltyAmount ?? 0)
  const cancDeadline = effectiveCancPolicy?.deadline ?? effectiveCancPolicy?.freeCancellationDeadlineLocal

  const hotelContent = allProperties.find((p) => p.id === r.propertyId)
  const hotelName = hotelContent?.name ?? r.propertyName ?? r.propertyId
  const hotelAddr = hotelContent?.address
  const hotelStars = parseInt(hotelContent?.stars ?? "0") || 0
  const hotelPhoto = hotelContent?.photos?.[0]

  const arrDate = currentR.arrival ? new Date(currentR.arrival) : null
  const depDate = currentR.departure ? new Date(currentR.departure) : null
  const nights = arrDate && depDate ? Math.round((depDate.getTime() - arrDate.getTime()) / 86400000) : null

  const arrHasTime = typeof currentR.arrival === "string" && currentR.arrival.includes("T")
  const depHasTime = typeof currentR.departure === "string" && currentR.departure.includes("T")

  const guestInitials = ((r.guest?.firstName?.[0] ?? "") + (r.guest?.lastName?.[0] ?? "")).toUpperCase() || "?"
  const guestName = [r.guest?.firstName, r.guest?.lastName].filter(Boolean).join(" ") || "—"
  const guestContacts = [r.guest?.email, r.guest?.phone].filter(Boolean).join(" · ")
  const fullAddr = [hotelAddr?.street, hotelAddr?.city, hotelAddr?.country].filter(Boolean).join(", ")

  const handleAmendSuccess = (result) => {
    setAmendResult(result)
    setAmended(true)
    setShowAmend(false)
    onAmended?.()
  }

  return (
    <div className={classes.modalOverlay} style={{ zIndex: 700 }}>
      <div className={classes.modalBackdrop} onClick={onClose} />
      <div className={classes.resvModalBox}>

        {/* Header */}
        <div className={classes.resvHeader} style={{ background: isCancelled ? "#fef2f2" : "linear-gradient(135deg, #1e293b 0%, #334155 100%)" }}>
          <div>
            <div className={classes.resvHeaderEyebrow} style={{ color: isCancelled ? "#fca5a5" : "rgba(255,255,255,0.5)" }}>
              KARS AVIA · БРОНИРОВАНИЕ
            </div>
            <h2 className={classes.resvHeaderTitle} style={{ color: isCancelled ? "#991b1b" : "#fff" }}>
              Подтверждение брони
            </h2>
            <div className={classes.resvHeaderBadges}>
              <span className={classes.resvHeaderId} style={{ background: isCancelled ? "#fee2e2" : "rgba(255,255,255,0.1)", color: isCancelled ? "#dc2626" : "rgba(255,255,255,0.85)" }}>
                {r.id}
              </span>
              <span className={classes.resvHeaderStatus} style={{ background: isCancelled ? "#fee2e2" : "rgba(34,197,94,0.2)", color: isCancelled ? "#b91c1c" : "#86efac", borderColor: isCancelled ? "transparent" : "rgba(34,197,94,0.3)" }}>
                {isCancelled ? "✕ Отменено" : amended ? "✎ Изменено" : "✓ Подтверждено"}
              </span>
              {r.corporateId && (
                <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 4, background: "rgba(34,197,94,0.15)", color: "#86efac", border: "1px solid rgba(34,197,94,0.3)" }}>
                  Корпоративный
                </span>
              )}
            </div>
          </div>
          <button type="button" onClick={onClose} className={classes.resvCloseBtn}>✕</button>
        </div>

        {/* Hotel banner */}
        <div className={classes.resvHotel} style={{ minHeight: hotelPhoto ? 120 : "auto" }}>
          {hotelPhoto && (<><img src={tlImg(hotelPhoto)} alt={hotelName} className={classes.resvHotelImg} /><div className={classes.resvHotelOverlay} /></>)}
          <div className={classes.resvHotelBody} style={hotelPhoto ? { position: "absolute", bottom: 0, left: 0, right: 0 } : undefined}>
            <div className={classes.resvHotelIcon} style={{ background: hotelPhoto ? "rgba(255,255,255,0.2)" : "#e2e8f0" }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={hotelPhoto ? "#fff" : "#64748b"} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="M3 21V6a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v15" /><path d="M3 21h18" /><path d="M9 8h2" /><path d="M13 8h2" /><path d="M9 12h2" /><path d="M13 12h2" /><path d="M9 16h6" />
              </svg>
            </div>
            <div style={{ minWidth: 0, flex: 1 }}>
              <p className={classes.resvHotelName} style={{ color: hotelPhoto ? "#fff" : "#0f172a" }}>{hotelName}</p>
              {hotelStars > 0 && <div style={{ marginTop: 2 }}><StarRow count={hotelStars} /></div>}
              {fullAddr && <p className={classes.resvHotelAddr} style={{ color: hotelPhoto ? "rgba(255,255,255,0.85)" : "#64748b" }}>📍 {fullAddr}</p>}
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
              <p className={classes.resvDateTime}>{arrDate.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })} ({tzLabel(effectiveCancPolicy?.timezone)})</p>
            )}
            {(r.earlyCheckInDateTime ?? amendResult?.earlyCheckInDateTime) && (
              <p style={{ margin: "3px 0 0", fontSize: 10, fontWeight: 600, color: "#d97706" }}>
                ранний {(r.earlyCheckInDateTime ?? amendResult?.earlyCheckInDateTime).slice(11, 16)}
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
              <p className={classes.resvDateTime}>{depDate.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })} ({tzLabel(effectiveCancPolicy?.timezone)})</p>
            )}
            {(r.lateCheckOutDateTime ?? amendResult?.lateCheckOutDateTime) && (
              <p style={{ margin: "3px 0 0", fontSize: 10, fontWeight: 600, color: "#d97706" }}>
                поздний {(r.lateCheckOutDateTime ?? amendResult?.lateCheckOutDateTime).slice(11, 16)}
              </p>
            )}
          </div>
        </div>

        {/* Body */}
        <div className={classes.resvBody}>
          <div className={classes.resvGrid}>
            {[
              { label: "Тип номера", value: roomTypeName },
              { label: "Тарифный план", value: ratePlanName },
              { label: "Питание", value: mealPlan || "Без питания" },
              { label: "Гостей", value: `${r.adults} взр.${r.children > 0 ? ` · ${r.children} дет.` : ""}` }
            ].filter((x) => x.value).map(({ label, value }) => (
              <div key={label} className={classes.resvDetailCard}>
                <p className={classes.resvDetailLbl}>{label}</p>
                <p className={classes.resvDetailVal}>{value}</p>
              </div>
            ))}
          </div>

          <div className={classes.resvGuestCard}>
            <div className={classes.resvAvatar}>{guestInitials}</div>
            <div style={{ minWidth: 0, flex: 1 }}>
              <p className={classes.resvGuestName}>{guestName}</p>
              <p className={classes.resvGuestSub}>{guestContacts || "Контакты не указаны"}</p>
            </div>
            <span className={classes.resvGuestIcon} aria-hidden>👥</span>
          </div>

          {comment && (
            <div className={classes.resvDetailCard} style={{ width: "100%" }}>
              <p className={classes.resvDetailLbl}>Комментарий к брони</p>
              <p style={{ fontSize: 13, color: "#0f172a", margin: "4px 0 0" }}>{comment}</p>
            </div>
          )}

          <div className={classes.resvPriceBlock}>
            {totalRaw?.priceBeforeTax != null && (
              <div className={classes.resvPriceRow}>
                <span>Стоимость проживания</span>
                <span style={{ fontWeight: 500 }}>{Number(totalRaw.priceBeforeTax).toLocaleString("ru-RU")} {r.currency}</span>
              </div>
            )}
            {totalRaw?.taxAmount > 0 && (
              <div className={classes.resvPriceRow}>
                <span style={{ color: "#22c55e" }}>Налог (оплачивается в отеле)</span>
                <span>{Number(totalRaw.taxAmount).toLocaleString("ru-RU")} {r.currency}</span>
              </div>
            )}
            {amended && amendResult?.newTotalPrice != null && (
              <div className={classes.resvPriceRow} style={{ color: "#0284c7" }}>
                <span>Новая стоимость (после изменения)</span>
                <span style={{ fontWeight: 600 }}>{amendResult.newTotalPrice.toLocaleString("ru-RU")} {r.currency}</span>
              </div>
            )}
            <div className={classes.resvPriceTotal}>
              <span>Итого</span>
              <span className={classes.resvPriceTotalVal}>
                {(amended && amendResult?.newTotalPrice != null ? amendResult.newTotalPrice : r.totalPrice)?.toLocaleString("ru-RU")} {r.currency}
              </span>
            </div>
          </div>

          {cancPenalty > 0 ? (
            <div className={classes.resvCancPaid}>
              <p className={classes.resvCancPaidTitle}>Условия отмены</p>
              <p className={classes.resvCancPaidText}>
                {fmtCancellationPolicy(
                  { amount: cancPenalty, deadline: cancDeadline, deadlineUtc: effectiveCancPolicy?.deadlineUtc ?? null, timezone: effectiveCancPolicy?.timezone ?? null },
                  r.currency
                )}
              </p>
            </div>
          ) : (
            <div className={classes.resvCancFree}>✓ Бесплатная отмена</div>
          )}

          {cancellation && (
            <div className={classes.resvCancelled}>
              <p className={classes.resvCancelledTitle}>Бронирование отменено</p>
              {cancellation.cancelledUtc && <p className={classes.resvCancelledLine}>Дата: {fmtDateTime(cancellation.cancelledUtc)}</p>}
              {cancellation.penaltyAmount > 0 && (
                <p className={classes.resvCancelledLine}>Штраф: {Number(cancellation.penaltyAmount).toLocaleString("ru-RU")} {r.currency}</p>
              )}
            </div>
          )}

          {amended && (
            <div style={{ background: "#f0fdf4", border: "1px solid #86efac", borderRadius: 10, padding: "10px 14px" }}>
              <p style={{ fontSize: 12, fontWeight: 700, color: "#15803d", margin: 0 }}>✓ Бронь изменена</p>
            </div>
          )}

          <p className={classes.resvFooterNote}>
            Создано {fmtDateTime(r.createdAt)} · ID объекта: {r.propertyId}
          </p>
        </div>

        {/* Actions */}
        <div className={classes.resvActions}>
          {!isCancelled && !amended && (
            <>
              <button type="button" className={classes.resvCancelBtn} onClick={() => setShowAmend(true)}>
                Изменить бронь
              </button>
              <button type="button" className={classes.resvCancelBtn} onClick={() => onStartCancel(r.id, r)}>
                Отменить бронь
              </button>
            </>
          )}
          <button type="button" className={classes.resvCloseDarkBtn} onClick={onClose}>
            Закрыть
          </button>
        </div>
      </div>

      {showAmend && (
        <AmendModal
          r={currentR}
          onClose={() => setShowAmend(false)}
          onSuccess={handleAmendSuccess}
        />
      )}
    </div>
  )
}
