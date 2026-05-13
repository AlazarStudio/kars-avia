import React, { useEffect, useMemo, useState } from "react"
import { useLazyQuery, useMutation } from "@apollo/client"

import {
  CREATE_TL_RESERVATION,
  TL_AVAILABILITY,
  TL_PROPERTY_CALENDAR,
  TL_VERIFY_BOOKING
} from "../../../../../graphQL_requests"
import classes from "../TravellinePage.module.css"
import { Badge, Btn, JsonViewer, Spinner, StarRow } from "../shared/ui"
import { cn, fmtDateTime, nightWord, nightsBetween } from "../shared/helpers"

export default function PropertyModal({ property, onClose, searchDates, onBookingCreated }) {
  const [tab, setTab] = useState(searchDates ? "book" : "overview")
  const [photoIdx, setPhotoIdx] = useState(0)

  const raw = useMemo(() => {
    try {
      return JSON.parse(property.raw)
    } catch {
      return {}
    }
  }, [property.raw])

  const photos = useMemo(() => {
    const imgs = raw?.images ?? raw?.photos ?? []
    return imgs.map((i) => (typeof i === "string" ? i : i.url ?? i.src ?? "")).filter(Boolean)
  }, [raw])

  const amenities = useMemo(() => {
    const list = raw?.amenities ?? raw?.facilities ?? raw?.services ?? raw?.hotelAmenities ?? []
    return Array.isArray(list) ? list : []
  }, [raw])

  const rooms = useMemo(() => {
    const list = raw?.roomTypes ?? raw?.roomCategories ?? raw?.rooms ?? raw?.roomTypeCategories ?? []
    return Array.isArray(list) ? list : []
  }, [raw])

  const policies = raw?.policies ?? raw?.hotelPolicies ?? raw?.policy ?? null

  const starsCount =
    parseInt(raw?.stars ?? raw?.starRating ?? raw?.category ?? property.stars ?? "0") || 0

  const [getAvail, { data: availData, loading: availLoading }] = useLazyQuery(TL_AVAILABILITY)
  const [verifyBooking, { loading: verifying }] = useMutation(TL_VERIFY_BOOKING)
  const [createRes, { loading: creating }] = useMutation(CREATE_TL_RESERVATION)

  const [bookingRate, setBookingRate] = useState(null)
  const [bookForm, setBookForm] = useState({ firstName: "", lastName: "", email: "", phone: "", comment: "" })
  const [bookerForm, setBookerForm] = useState({ firstName: "", lastName: "", email: "", phone: "" })
  const [differentBooker, setDifferentBooker] = useState(false)
  const [bookResult, setBookResult] = useState(null)
  const [conditionChange, setConditionChange] = useState(null)
  const [pendingChecksum, setPendingChecksum] = useState(undefined)
  const [bookError, setBookError] = useState("")

  useEffect(() => {
    if (tab === "book" && searchDates) {
      getAvail({
        variables: {
          input: {
            propertyId: property.id,
            arrival: searchDates.arrival,
            departure: searchDates.departure,
            adults: searchDates.adults,
            children: searchDates.children ?? 0,
            childAges: searchDates.childAges ?? []
          }
        }
      })
    }
  }, [tab, property.id, searchDates, getAvail])

  const availRates = availData?.tlAvailability?.rates ?? []
  const nights = searchDates ? nightsBetween(searchDates.arrival, searchDates.departure) : 0

  const handleSelectRate = (rate) => {
    setBookingRate(rate)
    setConditionChange(null)
    setPendingChecksum(rate.checksum)
    setBookResult(null)
    setBookError("")
  }

  const submitBooking = async () => {
    if (!bookingRate || !searchDates) return
    setBookError("")
    try {
      const vRes = await verifyBooking({
        variables: {
          input: {
            propertyId: property.id,
            roomTypeId: bookingRate.roomTypeId,
            ratePlanId: bookingRate.ratePlanId,
            arrival: searchDates.arrival,
            departure: searchDates.departure,
            adults: searchDates.adults,
            childAges: searchDates.childAges ?? [],
            checksum: pendingChecksum,
            roomTypePlacements: bookingRate.roomTypePlacements,
            checkInTime: bookingRate.checkInTime,
            checkOutTime: bookingRate.checkOutTime
          }
        }
      })
      const vData = vRes.data?.tlVerifyBooking
      if (vData?.conditionChange) {
        setConditionChange({
          newPriceBeforeTax: vData.newPriceBeforeTax,
          newTotalPrice: vData.newTotalPrice,
          newTax: vData.newTax,
          newChecksum: vData.newChecksum,
          message: vData.message
        })
        setPendingChecksum(vData.newChecksum)
        return
      }
    } catch {
      // verify не критичен — продолжаем
    }
    await doCreate()
  }

  const doCreate = async () => {
    if (!bookingRate || !searchDates) return
    try {
      const guest = {
        firstName: bookForm.firstName,
        lastName: bookForm.lastName,
        email: bookForm.email || null,
        phone: bookForm.phone || null
      }
      const booker = differentBooker
        ? {
            firstName: bookerForm.firstName,
            lastName: bookerForm.lastName,
            email: bookerForm.email || null,
            phone: bookerForm.phone || null
          }
        : null
      const res = await createRes({
        variables: {
          input: {
            propertyId: property.id,
            roomTypeId: bookingRate.roomTypeId,
            ratePlanId: bookingRate.ratePlanId,
            arrival: searchDates.arrival,
            departure: searchDates.departure,
            adults: searchDates.adults,
            children: searchDates.children ?? 0,
            childAges: searchDates.childAges ?? [],
            guest,
            booker,
            comment: bookForm.comment || null,
            checksum: pendingChecksum,
            roomTypePlacements: bookingRate.roomTypePlacements,
            checkInTime: bookingRate.checkInTime,
            checkOutTime: bookingRate.checkOutTime,
            roomTypeName: bookingRate.roomTypeName || null,
            ratePlanName: bookingRate.ratePlanName || null,
            cancellationPoliciesJson: bookingRate.cancellationPolicies?.length
              ? JSON.stringify(bookingRate.cancellationPolicies)
              : null
          }
        }
      })
      const created = res.data?.tlCreateReservation
      setBookResult(created)
      setBookingRate(null)
      setConditionChange(null)
      onBookingCreated?.()
    } catch (err) {
      setBookError(err.message)
    }
  }

  const calendarFrom = searchDates?.arrival ?? new Date().toISOString().slice(0, 10)
  const [getCalendar, { data: calData, loading: calLoading }] = useLazyQuery(TL_PROPERTY_CALENDAR)

  useEffect(() => {
    if (tab === "calendar") {
      getCalendar({ variables: { input: { propertyId: property.id, from: calendarFrom, days: 21 } } })
    }
  }, [tab, property.id, calendarFrom, getCalendar])

  const calCells = calData?.tlPropertyCalendar ?? []

  const { calDates, calRooms, calMatrix } = useMemo(() => {
    const dateSet = new Set()
    const roomMap = new Map()
    calCells.forEach((c) => {
      if (c.roomTypeId !== "_none") {
        dateSet.add(c.date)
        roomMap.set(c.roomTypeId, c.roomTypeName || c.roomTypeId)
      }
    })
    const calDates = Array.from(dateSet).sort()
    const calRooms = Array.from(roomMap.entries()).map(([id, name]) => ({ id, name }))
    const calMatrix = new Map()
    calRooms.forEach((r) => calMatrix.set(r.id, new Map()))
    calCells.forEach((c) => {
      if (c.roomTypeId !== "_none") calMatrix.get(c.roomTypeId)?.set(c.date, c)
    })
    return { calDates, calRooms, calMatrix }
  }, [calCells])

  useEffect(() => {
    document.body.style.overflow = "hidden"
    return () => {
      document.body.style.overflow = ""
    }
  }, [])

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") onClose()
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [onClose])

  const TABS = [
    { id: "overview", label: "Обзор" },
    { id: "photos", label: "Фото", count: photos.length },
    { id: "amenities", label: "Удобства", count: amenities.length },
    { id: "rooms", label: "Номера", count: rooms.length || undefined },
    ...(searchDates ? [{ id: "book", label: "Бронировать", dot: true }] : []),
    ...(searchDates ? [{ id: "calendar", label: "Шахматка" }] : []),
    { id: "policies", label: "Политики" },
    { id: "json", label: "JSON" }
  ]

  const coverPhoto = photos[0] ?? null

  return (
    <div className={classes.modalOverlay}>
      <div className={classes.modalBackdrop} onClick={onClose} />
      <div className={classes.modalBox}>
        {/* Hero */}
        <div className={classes.modalHero}>
          {coverPhoto && <img src={coverPhoto} alt={property.name} className={classes.modalHeroImg} />}
          {coverPhoto && <div className={classes.modalHeroOverlay} />}
          <button type="button" onClick={onClose} className={classes.modalCloseBtn}>
            ✕
          </button>
          <div className={classes.modalHeroTitle}>
            <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0, lineHeight: 1.2 }}>{property.name}</h2>
            <div className={classes.flexRow} style={{ marginTop: 4, gap: 12 }}>
              {starsCount > 0 && <StarRow count={starsCount} />}
              {property.address?.city && (
                <span style={{ fontSize: 12, color: "rgba(255,255,255,0.8)" }}>📍 {property.address.city}</span>
              )}
              <span className={classes.mlAuto} style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", fontFamily: "monospace" }}>
                ID: {property.id}
              </span>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className={classes.modalTabs}>
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={cn(classes.modalTab, tab === t.id && classes.modalTabActive)}
            >
              {t.label}
              {t.dot && <span style={{ width: 6, height: 6, borderRadius: 999, background: "#22c55e" }} />}
              {t.count != null && t.count > 0 && (
                <span style={{ padding: "1px 6px", borderRadius: 999, fontSize: 10, background: "rgba(33,150,243,0.1)", color: "#1d4ed8" }}>
                  {t.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Body */}
        <div className={classes.modalBody}>
          {tab === "overview" && <OverviewView property={property} raw={raw} starsCount={starsCount} />}
          {tab === "photos" && (
            <PhotosView photos={photos} photoIdx={photoIdx} setPhotoIdx={setPhotoIdx} />
          )}
          {tab === "amenities" && <AmenitiesView amenities={amenities} />}
          {tab === "rooms" && <RoomsView rooms={rooms} />}
          {tab === "book" && searchDates && (
            <BookView
              availLoading={availLoading}
              availRates={availRates}
              nights={nights}
              searchDates={searchDates}
              bookingRate={bookingRate}
              bookForm={bookForm}
              setBookForm={setBookForm}
              bookerForm={bookerForm}
              setBookerForm={setBookerForm}
              differentBooker={differentBooker}
              setDifferentBooker={setDifferentBooker}
              bookResult={bookResult}
              conditionChange={conditionChange}
              setConditionChange={setConditionChange}
              setBookingRate={setBookingRate}
              setBookResult={setBookResult}
              handleSelectRate={handleSelectRate}
              submitBooking={submitBooking}
              doCreate={doCreate}
              verifying={verifying}
              creating={creating}
              bookError={bookError}
              onClose={onClose}
              onBookingCreated={onBookingCreated}
            />
          )}
          {tab === "calendar" && searchDates && (
            <CalendarView
              calLoading={calLoading}
              calRooms={calRooms}
              calDates={calDates}
              calMatrix={calMatrix}
              searchDates={searchDates}
              calendarFrom={calendarFrom}
            />
          )}
          {tab === "policies" && <PoliciesView raw={raw} policies={policies} />}
          {tab === "json" && <JsonViewer data={property.raw} />}
        </div>
      </div>
    </div>
  )
}

function InfoRow({ label, value }) {
  return (
    <div className={classes.kvRow}>
      <span className={classes.kvKey}>{label}</span>
      <span className={classes.kvVal}>{value}</span>
    </div>
  )
}

function OverviewView({ property, raw, starsCount }) {
  const location = {
    lat: raw?.location?.latitude ?? raw?.coordinates?.latitude ?? raw?.latitude ?? property.latitude,
    lng: raw?.location?.longitude ?? raw?.coordinates?.longitude ?? raw?.longitude ?? property.longitude
  }
  return (
    <div className={classes.flexCol} style={{ gap: 20 }}>
      {property.description && (
        <div>
          <p className={classes.label}>Описание</p>
          <p style={{ fontSize: 13, color: "#475569", lineHeight: 1.5, margin: "8px 0 0" }}>{property.description}</p>
        </div>
      )}
      <div>
        <p className={classes.label}>Контакты и адрес</p>
        <div className={classes.card} style={{ marginTop: 6 }}>
          <div className={classes.cardBody}>
            {property.address?.street && (
              <InfoRow
                label="Адрес"
                value={[property.address.street, property.address.city, property.address.zip, property.address.country]
                  .filter(Boolean)
                  .join(", ")}
              />
            )}
            {!property.address?.street && property.address?.city && (
              <InfoRow
                label="Город"
                value={[property.address.city, property.address.country].filter(Boolean).join(", ")}
              />
            )}
            {property.phone && <InfoRow label="Телефон" value={property.phone} />}
            {property.email && <InfoRow label="Email" value={property.email} />}
            {starsCount > 0 && <InfoRow label="Звёзды" value={<StarRow count={starsCount} />} />}
            {location.lat && (
              <InfoRow
                label="Координаты"
                value={
                  <a
                    href={`https://maps.google.com/?q=${location.lat},${location.lng}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={classes.extLink}
                  >
                    {Number(location.lat).toFixed(5)}, {Number(location.lng).toFixed(5)} ↗
                  </a>
                }
              />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function PhotosView({ photos, photoIdx, setPhotoIdx }) {
  if (photos.length === 0) {
    return <p className={classes.muted} style={{ textAlign: "center", padding: 30 }}>Нет фотографий</p>
  }
  return (
    <div>
      <div style={{ position: "relative", borderRadius: 10, overflow: "hidden", marginBottom: 12, aspectRatio: "16/7", background: "#f1f5f9" }}>
        <img src={photos[photoIdx]} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        <div style={{ position: "absolute", bottom: 12, right: 12, background: "rgba(0,0,0,0.5)", color: "#fff", fontSize: 12, padding: "4px 8px", borderRadius: 6 }}>
          {photoIdx + 1} / {photos.length}
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(80px, 1fr))", gap: 6 }}>
        {photos.map((url, i) => (
          <div
            key={i}
            onClick={() => setPhotoIdx(i)}
            style={{
              aspectRatio: "1/1",
              borderRadius: 6,
              overflow: "hidden",
              cursor: "pointer",
              border: i === photoIdx ? "2px solid #2196F3" : "2px solid transparent"
            }}
          >
            <img src={url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          </div>
        ))}
      </div>
    </div>
  )
}

function AmenitiesView({ amenities }) {
  if (amenities.length === 0) {
    return <p className={classes.muted} style={{ textAlign: "center", padding: 30 }}>Нет данных об удобствах</p>
  }
  const groups = new Map()
  amenities.forEach((a) => {
    const group = a.groupName ?? a.group ?? a.category ?? "Общее"
    if (!groups.has(group)) groups.set(group, [])
    groups.get(group).push(a)
  })
  return (
    <div className={classes.flexCol} style={{ gap: 20 }}>
      {Array.from(groups.entries()).map(([group, items]) => (
        <div key={group}>
          <p className={classes.label}>{group}</p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 8 }}>
            {items.map((a, i) => (
              <span
                key={i}
                style={{
                  padding: "4px 10px",
                  borderRadius: 999,
                  fontSize: 12,
                  background: "#f1f5f9",
                  border: "1px solid #e2e8f0",
                  color: "#475569"
                }}
              >
                {a.name ?? a.title ?? a.code ?? JSON.stringify(a)}
              </span>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

function RoomsView({ rooms }) {
  if (rooms.length === 0) {
    return <p className={classes.muted} style={{ textAlign: "center", padding: 30 }}>Нет данных о номерах</p>
  }
  return (
    <div className={classes.flexCol} style={{ gap: 12 }}>
      {rooms.map((r, i) => {
        const rPhotos = (r.images ?? r.photos ?? []).map((img) => img.url ?? img).filter(Boolean)
        const name = r.name ?? r.title ?? r.roomTypeName ?? "—"
        const desc = r.description ?? r.shortDescription ?? null
        const occupancy = r.maxOccupancy ?? r.maxAdults ?? r.capacity ?? null
        const area = r.area ?? r.roomArea ?? r.squareMeters ?? null
        return (
          <div key={r.id ?? i} className={classes.card}>
            <div style={{ display: "flex" }}>
              {rPhotos[0] && <img src={rPhotos[0]} alt="" style={{ width: 112, height: 112, objectFit: "cover", flexShrink: 0 }} />}
              <div style={{ padding: 12, flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 13, fontWeight: 600, margin: 0 }}>{name}</p>
                {desc && <p style={{ fontSize: 11, color: "#475569", margin: "4px 0 0" }}>{desc}</p>}
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 8 }}>
                  {occupancy && <Badge color="gray">{occupancy} чел.</Badge>}
                  {area && <Badge color="gray">{area} м²</Badge>}
                  <span className={classes.mlAuto} style={{ fontSize: 10, color: "#94a3b8", fontFamily: "monospace" }}>
                    ID: {r.id}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

function PoliciesView({ raw, policies }) {
  const rows = []
  const p = policies ?? {}
  const checkIn = raw?.checkInTime ?? p?.checkIn ?? p?.checkInTime ?? p?.checkInFrom
  const checkOut = raw?.checkOutTime ?? p?.checkOut ?? p?.checkOutTime ?? p?.checkOutBefore
  if (checkIn) rows.push(["Заезд с", fmtDateTime(checkIn)])
  if (checkOut) rows.push(["Выезд до", fmtDateTime(checkOut)])
  const cancel = p?.cancellationPolicy ?? p?.cancellation ?? raw?.cancellationPolicy
  if (cancel) rows.push(["Отмена", typeof cancel === "string" ? cancel : JSON.stringify(cancel)])
  const payment = raw?.paymentMethods ?? p?.paymentMethods
  if (payment) rows.push(["Оплата", Array.isArray(payment) ? payment.map((m) => m.name ?? m).join(", ") : String(payment)])
  const pets = raw?.petsAllowed ?? p?.petsAllowed
  if (pets != null) rows.push(["Животные", pets ? "Разрешены" : "Запрещены"])
  const smoking = raw?.smokingAllowed ?? p?.smokingAllowed
  if (smoking != null) rows.push(["Курение", smoking ? "Разрешено" : "Запрещено"])
  const minAge = raw?.minGuestAge ?? p?.minGuestAge
  if (minAge != null) rows.push(["Мин. возраст", String(minAge) + " лет"])

  if (rows.length === 0) {
    return <p className={classes.muted} style={{ textAlign: "center", padding: 30 }}>Нет данных о политиках</p>
  }
  return (
    <div className={classes.card}>
      <div className={classes.cardBody}>
        {rows.map(([label, value]) => (
          <InfoRow key={label} label={label} value={value} />
        ))}
      </div>
    </div>
  )
}

function CalendarView({ calLoading, calRooms, calDates, calMatrix, searchDates }) {
  if (calLoading) return <Spinner />
  if (calRooms.length === 0) {
    return <p className={classes.muted} style={{ textAlign: "center", padding: 30 }}>Нет данных о номерах</p>
  }
  return (
    <div style={{ overflowX: "auto" }}>
      <p className={classes.smallText} style={{ marginBottom: 12 }}>
        🟢 — свободно &nbsp;·&nbsp; 🔴 — занято &nbsp;·&nbsp; — нет данных
      </p>
      <table className={classes.calTable}>
        <thead>
          <tr>
            <th className={classes.calRoomCell}>Номер</th>
            {calDates.map((d) => {
              const dt = new Date(d)
              const isWeekend = dt.getDay() === 0 || dt.getDay() === 6
              const isSearch = d === searchDates.arrival
              return (
                <th
                  key={d}
                  className={cn(isWeekend && classes.weekend)}
                  style={{ minWidth: 36, background: isSearch ? "#dcfce7" : undefined }}
                >
                  <div>{dt.getDate()}</div>
                  <div style={{ fontSize: 9, opacity: 0.6 }}>{dt.toLocaleDateString("ru-RU", { month: "short" }).replace(".", "")}</div>
                </th>
              )
            })}
          </tr>
        </thead>
        <tbody>
          {calRooms.map((room) => (
            <tr key={room.id}>
              <td className={classes.calRoomCell} title={room.name}>{room.name}</td>
              {calDates.map((d) => {
                const cell = calMatrix.get(room.id)?.get(d)
                const cls = cell?.available ? classes.calAvail : cell ? classes.calBusy : classes.calNone
                return (
                  <td
                    key={d}
                    className={cls}
                    title={cell?.available && cell.minPrice ? `${cell.minPrice.toLocaleString("ru-RU")} ${cell.currency}/ночь` : undefined}
                  >
                    {cell?.available && cell.minPrice ? (
                      <span className={classes.calPrice}>{(cell.minPrice / 1000).toFixed(0)}к</span>
                    ) : cell?.available ? (
                      <span style={{ display: "inline-block", width: 6, height: 6, borderRadius: "50%", background: "#22c55e" }} />
                    ) : cell ? (
                      <span style={{ display: "inline-block", width: 6, height: 6, borderRadius: "50%", background: "#f87171" }} />
                    ) : null}
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function BookView({
  availLoading,
  availRates,
  nights,
  searchDates,
  bookingRate,
  bookForm,
  setBookForm,
  bookerForm,
  setBookerForm,
  differentBooker,
  setDifferentBooker,
  bookResult,
  conditionChange,
  setConditionChange,
  setBookingRate,
  setBookResult,
  handleSelectRate,
  submitBooking,
  doCreate,
  verifying,
  creating,
  bookError,
  onClose,
  onBookingCreated
}) {
  return (
    <div className={classes.flexCol} style={{ gap: 16 }}>
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 12,
          padding: 12,
          borderRadius: 8,
          background: "#f1f5f9",
          border: "1px solid #e2e8f0",
          fontSize: 12,
          color: "#475569"
        }}
      >
        <span>📅 {fmtDateTime(searchDates.arrival)} → {fmtDateTime(searchDates.departure)}</span>
        <span>·</span>
        <span>
          👤 {searchDates.adults} взр.
          {(searchDates.children ?? 0) > 0 ? ` · ${searchDates.children} дет.` : ""}
        </span>
        <span>·</span>
        <span style={{ fontWeight: 500, color: "#0f172a" }}>
          {nights} {nightWord(nights)}
        </span>
      </div>

      {conditionChange && (
        <div className={classes.conditionChangeBox}>
          <p style={{ color: "#c2410c", fontWeight: 700, margin: 0 }}>⚠ Условия проживания изменились</p>
          <p style={{ color: "#9a3412", fontSize: 12, marginTop: 6 }}>
            {conditionChange.message ?? "Отель обновил условия. Актуальная стоимость:"}
          </p>
          {conditionChange.newPriceBeforeTax != null && (
            <div className={classes.flexCol} style={{ gap: 4, marginTop: 8 }}>
              <div className={classes.flexBetween}>
                <span style={{ fontSize: 12, color: "#475569" }}>Стоимость проживания</span>
                <span style={{ fontWeight: 600 }}>
                  {(conditionChange.newPriceBeforeTax * nights).toLocaleString("ru-RU")} {bookingRate?.currency}
                </span>
              </div>
              {conditionChange.newTax != null && conditionChange.newTax > 0 && (
                <div className={classes.flexBetween}>
                  <span style={{ fontSize: 11, color: "#94a3b8" }}>Налог (оплачивается в отеле)</span>
                  <span style={{ fontSize: 11, color: "#94a3b8" }}>
                    + {conditionChange.newTax.toLocaleString("ru-RU")} {bookingRate?.currency}
                  </span>
                </div>
              )}
              <div className={classes.flexBetween} style={{ borderTop: "1px solid #fed7aa", paddingTop: 4, marginTop: 4, fontWeight: 700 }}>
                <span>Итого</span>
                <span>
                  {(conditionChange.newTotalPrice ?? 0).toLocaleString("ru-RU")} {bookingRate?.currency}
                </span>
              </div>
            </div>
          )}
          <div className={classes.flexRow} style={{ gap: 8, marginTop: 12 }}>
            <Btn onClick={doCreate} loading={creating}>Принять и забронировать</Btn>
            <Btn
              variant="secondary"
              onClick={() => {
                setConditionChange(null)
                setBookingRate(null)
              }}
            >
              Отмена
            </Btn>
          </div>
        </div>
      )}

      {bookingRate && !bookResult && !conditionChange && (
        <div style={{ border: "1px solid #2196F3", borderRadius: 10, padding: 16, background: "rgba(33,150,243,0.04)" }}>
          <div className={classes.flexBetween} style={{ marginBottom: 12 }}>
            <div>
              <p style={{ fontSize: 13, fontWeight: 600, margin: 0 }}>{bookingRate.roomTypeName}</p>
              <p style={{ fontSize: 12, color: "#475569", margin: 0 }}>{bookingRate.ratePlanName}</p>
              <p style={{ fontSize: 15, fontWeight: 700, marginTop: 6 }}>
                {(bookingRate.priceBeforeTax * nights).toLocaleString("ru-RU")} {bookingRate.currency}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setBookingRate(null)}
              style={{ background: "none", border: "none", color: "#94a3b8", cursor: "pointer", fontSize: 16 }}
            >
              ✕
            </button>
          </div>

          <p className={classes.label}>Данные гостя</p>
          <div className={classes.gridForm2} style={{ marginTop: 8, marginBottom: 12 }}>
            {["firstName", "lastName", "email", "phone"].map((k) => {
              const labels = { firstName: "Имя *", lastName: "Фамилия *", email: "Email", phone: "Телефон" }
              return (
                <div key={k} className={classes.fieldGroup}>
                  <label style={{ fontSize: 11, color: "#94a3b8" }}>{labels[k]}</label>
                  <input
                    type="text"
                    value={bookForm[k]}
                    onChange={(e) => setBookForm({ ...bookForm, [k]: e.target.value })}
                    className={classes.miniInput}
                  />
                </div>
              )
            })}
          </div>

          <label className={classes.flexRow} style={{ marginBottom: 12, cursor: "pointer" }}>
            <input
              type="checkbox"
              checked={differentBooker}
              onChange={(e) => setDifferentBooker(e.target.checked)}
            />
            <span style={{ fontSize: 12, color: "#475569" }}>Заказчик отличается от гостя</span>
          </label>

          {differentBooker && (
            <>
              <p className={classes.label}>Данные заказчика</p>
              <div className={classes.gridForm2} style={{ marginTop: 8, marginBottom: 12 }}>
                {["firstName", "lastName", "email", "phone"].map((k) => {
                  const labels = { firstName: "Имя *", lastName: "Фамилия *", email: "Email", phone: "Телефон" }
                  return (
                    <div key={k} className={classes.fieldGroup}>
                      <label style={{ fontSize: 11, color: "#94a3b8" }}>{labels[k]}</label>
                      <input
                        type="text"
                        value={bookerForm[k]}
                        onChange={(e) => setBookerForm({ ...bookerForm, [k]: e.target.value })}
                        className={classes.miniInput}
                      />
                    </div>
                  )
                })}
              </div>
            </>
          )}

          <input
            type="text"
            value={bookForm.comment}
            onChange={(e) => setBookForm({ ...bookForm, comment: e.target.value })}
            placeholder="Комментарий (необязательно)"
            className={classes.miniInput}
            style={{ width: "100%", marginBottom: 12 }}
          />
          {bookError && <p className={classes.statusWarn} style={{ fontSize: 12 }}>{bookError}</p>}
          <Btn
            onClick={submitBooking}
            loading={verifying || creating}
            disabled={
              !bookForm.firstName.trim() ||
              !bookForm.lastName.trim() ||
              (differentBooker && (!bookerForm.firstName.trim() || !bookerForm.lastName.trim()))
            }
          >
            Подтвердить бронирование
          </Btn>
        </div>
      )}

      {bookResult && (
        <div className={classes.success}>
          <p className={classes.successTitle}>✓ Бронирование подтверждено</p>
          <div className={classes.card} style={{ marginTop: 12 }}>
            <div className={classes.cardBody}>
              <InfoRow label="Номер брони" value={<code>{bookResult.id}</code>} />
              <InfoRow label="Статус" value={bookResult.status} />
              <InfoRow label="Отель" value={bookResult.propertyName ?? bookResult.propertyId} />
              <InfoRow label="Заезд / Выезд" value={`${bookResult.arrival} → ${bookResult.departure}`} />
              <InfoRow label="Гость" value={`${bookResult.guest?.firstName} ${bookResult.guest?.lastName}`} />
              <InfoRow label="Сумма" value={`${bookResult.totalPrice?.toLocaleString("ru-RU")} ${bookResult.currency}`} />
            </div>
          </div>
          <div className={classes.flexRow} style={{ gap: 8, marginTop: 12 }}>
            <Btn onClick={() => { onClose(); onBookingCreated?.() }}>Перейти к бронированиям</Btn>
            <Btn variant="secondary" onClick={() => setBookResult(null)}>Ещё одно</Btn>
          </div>
        </div>
      )}

      {availLoading ? (
        <Spinner />
      ) : availRates.length === 0 ? (
        <p className={classes.muted} style={{ textAlign: "center", padding: 30 }}>Нет свободных номеров на выбранные даты</p>
      ) : (
        <div className={classes.flexCol} style={{ gap: 12 }}>
          {availRates.map((rate, i) => {
            const priceTotal = rate.priceBeforeTax * nights
            const isSelected = bookingRate === rate
            return (
              <div key={i} className={cn(classes.rateItem, isSelected && classes.rateItemSelected)}>
                <div className={classes.rateInfo}>
                  <div className={classes.flexRow} style={{ gap: 8, flexWrap: "wrap" }}>
                    <p style={{ fontSize: 13, fontWeight: 600, margin: 0 }}>{rate.roomTypeName || "Номер"}</p>
                    {rate.maxOccupancy && <span className={classes.smallText}>до {rate.maxOccupancy} чел.</span>}
                  </div>
                  <p style={{ fontSize: 12, color: "#475569", margin: "4px 0 0" }}>{rate.ratePlanName}</p>
                  <div className={classes.flexRow} style={{ flexWrap: "wrap", gap: 6, marginTop: 6 }}>
                    {rate.availableRooms != null && (
                      <Badge color={rate.availableRooms > 0 ? "green" : "red"}>
                        {rate.availableRooms > 0 ? `${rate.availableRooms} св.` : "Нет мест"}
                      </Badge>
                    )}
                    {rate.mealType && <Badge color="blue">{rate.mealType}</Badge>}
                  </div>
                  {rate.cancellationPolicies && rate.cancellationPolicies.length > 0 && (
                    <div style={{ marginTop: 8 }}>
                      {rate.cancellationPolicies.map((cp, ci) => (
                        <p key={ci} style={{ fontSize: 11, color: "#c2410c", margin: 0 }}>
                          {cp.deadline
                            ? `Штраф ${cp.amount?.toLocaleString("ru-RU")} ${rate.currency} при отмене после ${fmtDateTime(cp.deadline)}`
                            : `Безвозвратный тариф — штраф ${cp.amount?.toLocaleString("ru-RU")} ${rate.currency}`}
                        </p>
                      ))}
                    </div>
                  )}
                  {rate.cancellationPolicies?.length === 0 && (
                    <p style={{ fontSize: 11, color: "#15803d", marginTop: 4 }}>Бесплатная отмена</p>
                  )}
                </div>
                <div className={classes.rateRight}>
                  <p className={classes.ratePrice}>{priceTotal.toLocaleString("ru-RU")} {rate.currency}</p>
                  <p className={classes.smallText}>{rate.priceBeforeTax?.toLocaleString("ru-RU")} / ночь</p>
                  {rate.tax != null && rate.tax > 0 && (
                    <p className={classes.smallText}>+ {rate.tax.toLocaleString("ru-RU")} налог</p>
                  )}
                  <p className={classes.smallText} style={{ marginBottom: 8 }}>за {nights} {nightWord(nights)}</p>
                  {rate.availableRooms !== 0 && (
                    <Btn
                      variant={isSelected ? "secondary" : "primary"}
                      onClick={() => {
                        if (isSelected) {
                          setBookingRate(null)
                        } else {
                          handleSelectRate(rate)
                          setBookResult(null)
                        }
                      }}
                    >
                      {isSelected ? "Отмена" : "Забронировать"}
                    </Btn>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
