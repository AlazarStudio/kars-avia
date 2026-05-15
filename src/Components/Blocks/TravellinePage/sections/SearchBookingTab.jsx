import React, { useEffect, useMemo, useRef, useState } from "react"
import { useLazyQuery, useMutation, useQuery } from "@apollo/client"
import { DateRangePicker } from "react-date-range"
import { ru } from "date-fns/locale"
import { format, isValid, parseISO } from "date-fns"

import {
  CANCEL_TL_RESERVATION,
  GET_TL_RATE_PLANS,
  GET_TL_RESERVATIONS,
  GET_TL_ROOM_TYPES,
  TL_LOCAL_PROPERTIES,
  TL_CANCELLATION_PENALTY,
  TL_PROPERTIES_AVAILABILITY
} from "../../../../../graphQL_requests"
import classes from "../TravellinePage.module.css"
import { Badge, Btn, SectionCard, Spinner, StarRow, EmptyState } from "../shared/ui"
import { cn, fmtDateTime, nightWord, nightsBetween, tlImg } from "../shared/helpers"
import PropertyModal from "../modals/PropertyModal"
import ReservationDetailModal from "../modals/ReservationDetailModal"

export default function SearchBookingTab() {
  const [subTab, setSubTab] = useState("search")

  const [arrival, setArrival] = useState("")
  const [departure, setDeparture] = useState("")
  const [adults, setAdults] = useState("1")
  const [childrenCount, setChildrenCount] = useState("0")
  const [childAges, setChildAges] = useState([])
  const [searchCity, setSearchCity] = useState("")
  const [nameSearch, setNameSearch] = useState("")
  const [starsFilter, setStarsFilter] = useState("")
  const [sortBy, setSortBy] = useState("availability")
  const [searched, setSearched] = useState(false)
  const [guestOpen, setGuestOpen] = useState(false)
  const [dateOpen, setDateOpen] = useState(false)
  const [cityOpen, setCityOpen] = useState(false)
  const [modalProperty, setModalProperty] = useState(null)
  const [modalSearchDates, setModalSearchDates] = useState(null)

  const guestDropRef = useRef(null)
  const dateDropRef = useRef(null)
  const cityDropRef = useRef(null)

  useEffect(() => {
    const handler = (e) => {
      if (guestOpen && guestDropRef.current && !guestDropRef.current.contains(e.target)) setGuestOpen(false)
      if (dateOpen && dateDropRef.current && !dateDropRef.current.contains(e.target)) setDateOpen(false)
      if (cityOpen && cityDropRef.current && !cityDropRef.current.contains(e.target)) setCityOpen(false)
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [guestOpen, dateOpen, cityOpen])

  const rangeStart = arrival && isValid(parseISO(arrival)) ? parseISO(arrival) : new Date()
  const rangeEnd = departure && isValid(parseISO(departure)) ? parseISO(departure) : new Date()
  const dateLabel =
    arrival && departure
      ? `${format(parseISO(arrival), "d MMM", { locale: ru })} — ${format(parseISO(departure), "d MMM", { locale: ru })}`
      : "Выберите даты"

  const handleChildrenChange = (delta) => {
    const next = Math.max(0, Math.min(6, parseInt(childrenCount) + delta))
    setChildrenCount(String(next))
    setChildAges((prev) => {
      if (next > prev.length) return [...prev, ...Array(next - prev.length).fill(7)]
      return prev.slice(0, next)
    })
  }

  const updateChildAge = (i, age) => setChildAges((prev) => prev.map((a, idx) => (idx === i ? age : a)))

  const datesReady = !!(arrival && departure && arrival < departure)

  const { data, refetch: refetchLocalProperties } = useQuery(TL_LOCAL_PROPERTIES, {
    variables: { filter: {} },
    fetchPolicy: "cache-and-network"
  })
  const allProperties = data?.tlLocalProperties?.items ?? []

  const cityOptions = useMemo(() => {
    const set = new Set()
    allProperties.forEach((p) => p.address?.city && set.add(p.address.city))
    return Array.from(set).sort()
  }, [allProperties])

  const starsOptions = useMemo(() => {
    const set = new Set()
    allProperties.forEach((p) => p.stars && set.add(p.stars))
    return Array.from(set).sort((a, b) => Number(b) - Number(a))
  }, [allProperties])

  const [searchAvail, { data: availData, loading: availLoading, error: availError }] = useLazyQuery(
    TL_PROPERTIES_AVAILABILITY
  )

  const handleSearch = () => {
    if (!datesReady) return
    setSearched(true)
    const contentPropertyIds = allProperties.map((p) => p.id).filter(Boolean)
    searchAvail({
      variables: {
        input: {
          arrival,
          departure,
          adults: parseInt(adults) || 1,
          children: parseInt(childrenCount) || 0,
          childAges: childAges.length > 0 ? childAges : null,
          propertyIds: contentPropertyIds.length > 0 ? contentPropertyIds : null
        }
      }
    }).then(() => {
      // Бэк мог дозалить новые отели в БД — обновим локальный список
      refetchLocalProperties()
    })
  }

  const clearSearch = () => {
    setSearched(false)
    setArrival("")
    setDeparture("")
    setSearchCity("")
  }

  const priceMap = useMemo(() => {
    const map = new Map()
    ;(availData?.tlPropertiesAvailability ?? []).forEach((s) => map.set(s.propertyId, s))
    return map
  }, [availData])

  const nights = datesReady ? nightsBetween(arrival, departure) : 0

  const searchMatchesContent = useMemo(() => {
    if (!searched || priceMap.size === 0) return true
    return allProperties.some((p) => priceMap.has(p.id))
  }, [searched, priceMap, allProperties])

  const searchOnlyList = useMemo(() => {
    if (!searched || searchMatchesContent) return []
    return Array.from(priceMap.values())
      .filter((s) => s.hasAvailability)
      .map((s) => ({
        id: s.propertyId,
        name: s.propertyName ?? `Отель ${s.propertyId}`,
        address: null,
        stars: null,
        photos: [],
        raw: "{}",
        _fromSearch: true
      }))
  }, [searched, searchMatchesContent, priceMap])

  const filtered = useMemo(() => {
    const q = nameSearch.trim().toLowerCase()
    const baseList = !searched || searchMatchesContent ? allProperties : searchOnlyList
    let list = baseList.filter((p) => {
      if (!p._fromSearch) {
        if (searchCity && p.address?.city !== searchCity) return false
        if (starsFilter && p.stars !== starsFilter) return false
        if (q && !p.name?.toLowerCase().includes(q) && !p.address?.city?.toLowerCase().includes(q)) return false
        if (searched && searchMatchesContent) {
          const s = priceMap.get(p.id)
          if (!s || !s.hasAvailability) return false
        }
      }
      return true
    })
    list = [...list].sort((a, b) => {
      if (sortBy === "availability" && searched) {
        const pa = priceMap.get(a.id)?.minTotalPrice ?? Infinity
        const pb = priceMap.get(b.id)?.minTotalPrice ?? Infinity
        return pa - pb
      }
      if (sortBy === "stars") return (Number(b.stars) || 0) - (Number(a.stars) || 0)
      if (sortBy === "alpha") return (a.name ?? "").localeCompare(b.name ?? "", "ru")
      return 0
    })
    return list
  }, [allProperties, searchOnlyList, nameSearch, starsFilter, searchCity, searched, searchMatchesContent, priceMap, sortBy])

  const openModal = (p) => {
    setModalProperty(p)
    setModalSearchDates(
      searched && datesReady
        ? {
            arrival,
            departure,
            adults: parseInt(adults) || 1,
            children: parseInt(childrenCount) || 0,
            childAges: childAges.length > 0 ? childAges : null
          }
        : null
    )
  }

  // Reservations
  const { data: listData, loading: listLoading, refetch } = useQuery(GET_TL_RESERVATIONS)
  const [cancelReservation, { loading: cancelling }] = useMutation(CANCEL_TL_RESERVATION)
  const [penaltyBookingId, setPenaltyBookingId] = useState(null)
  const [penaltyFromPolicy, setPenaltyFromPolicy] = useState(null)
  const [getPenalty, { data: penaltyData, loading: penaltyLoading }] = useLazyQuery(TL_CANCELLATION_PENALTY)
  const penalty = penaltyData?.tlCancellationPenalty
  const reservations = listData?.tlReservations ?? []
  const [detailReservation, setDetailReservation] = useState(null)
  const [cancelError, setCancelError] = useState("")
  const [cancelInfo, setCancelInfo] = useState("")

  const [getRoomTypes, { data: roomTypesData }] = useLazyQuery(GET_TL_ROOM_TYPES, {
    fetchPolicy: "cache-first"
  })
  const [getRatePlans, { data: ratePlansData }] = useLazyQuery(GET_TL_RATE_PLANS, {
    fetchPolicy: "cache-first"
  })

  const openDetail = (r) => {
    setDetailReservation(r)
    getRoomTypes({ variables: { propertyId: r.propertyId } })
    getRatePlans({ variables: { propertyId: r.propertyId } })
  }

  const startCancel = (id, reservation) => {
    setPenaltyBookingId(id)
    setCancelError("")
    setCancelInfo("")
    getPenalty({ variables: { bookingId: id } })
    if (reservation?.cancellationPoliciesJson) {
      try {
        const policies = JSON.parse(reservation.cancellationPoliciesJson)
        const p = policies?.[0]
        const amount = Number(p?.amount ?? p?.penaltyAmount ?? 0)
        if (amount > 0) setPenaltyFromPolicy({ amount, currency: reservation.currency ?? "RUB" })
        else setPenaltyFromPolicy(null)
      } catch {
        setPenaltyFromPolicy(null)
      }
    } else {
      setPenaltyFromPolicy(null)
    }
  }

  const confirmCancel = async () => {
    if (!penaltyBookingId) return
    try {
      await cancelReservation({ variables: { id: penaltyBookingId } })
      setCancelInfo("Бронирование отменено")
      setPenaltyBookingId(null)
      refetch()
    } catch (err) {
      setCancelError(err.message)
    }
  }

  const statusColor = (s) => {
    if (s === "confirmed" || s === "active") return "green"
    if (s === "cancelled" || s === "canceled") return "red"
    return "gray"
  }

  return (
    <div className={classes.flexCol} style={{ gap: 16 }}>
      {penaltyBookingId && (
        <div className={classes.dialogOverlay}>
          <div className={classes.dialogBox}>
            <div>
              <p style={{ fontSize: 15, fontWeight: 600, margin: 0 }}>Отмена бронирования</p>
              <p className={classes.smallText} style={{ fontFamily: "monospace", marginTop: 4 }}>{penaltyBookingId}</p>
            </div>
            {penaltyLoading ? (
              <p className={classes.muted}>Рассчитываем штраф за отмену…</p>
            ) : penalty ? (
              <div
                style={{
                  padding: 12,
                  borderRadius: 8,
                  border: `1px solid ${penalty.penalty > 0 ? "#fca5a5" : "#86efac"}`,
                  background: penalty.penalty > 0 ? "#fff1f2" : "#f0fdf4"
                }}
              >
                {penalty.penalty > 0 ? (
                  <>
                    <p style={{ color: "#b91c1c", fontWeight: 600, margin: 0 }}>
                      Штраф за отмену: {penalty.penalty.toLocaleString("ru-RU")} {penalty.currency}
                    </p>
                    {penalty.penaltyType && <p style={{ color: "#dc2626", fontSize: 12 }}>Тип: {penalty.penaltyType}</p>}
                    {penalty.description && <p style={{ fontSize: 12, color: "#94a3b8" }}>{penalty.description}</p>}
                  </>
                ) : (
                  <p style={{ color: "#15803d", fontWeight: 600, margin: 0 }}>Бесплатная отмена</p>
                )}
              </div>
            ) : (
              <p>Подтвердите отмену бронирования.</p>
            )}
            {penaltyFromPolicy && penalty?.penalty === 0 && penaltyFromPolicy.amount > 0 && (
              <div style={{ borderRadius: 8, border: "1px solid #fdba74", background: "#fff7ed", padding: 12, fontSize: 12, color: "#9a3412" }}>
                ⚠ По условиям тарифа при бронировании был указан штраф {penaltyFromPolicy.amount.toLocaleString("ru-RU")} {penaltyFromPolicy.currency}. Уточните у отеля перед отменой.
              </div>
            )}
            {cancelError && <p className={classes.statusWarn} style={{ fontSize: 12 }}>{cancelError}</p>}
            <div className={classes.flexRow} style={{ gap: 8 }}>
              <Btn variant="danger" onClick={confirmCancel} loading={cancelling}>Подтвердить отмену</Btn>
              <Btn variant="secondary" onClick={() => setPenaltyBookingId(null)}>Назад</Btn>
            </div>
          </div>
        </div>
      )}

      <div className={classes.tabs} style={{ marginBottom: 0 }}>
        {[
          { id: "search", label: "Поиск" },
          { id: "reservations", label: `Бронирования${reservations.length ? ` (${reservations.length})` : ""}` }
        ].map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setSubTab(t.id)}
            className={cn(classes.tab, subTab === t.id && classes.tabActive)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {subTab === "search" && (
        <>
          <div className={classes.searchBar}>
            <div ref={cityDropRef} className={cn(classes.searchCol, classes.relative)}>
              <button type="button" onClick={() => setCityOpen(!cityOpen)} className={classes.searchSelectBtn}>
                <div className={classes.searchColLabel}>Куда</div>
                <div className={classes.searchColValue}>{searchCity || "Все города"}</div>
              </button>
              {cityOpen && (
                <div className={classes.dropdownPanel}>
                  {["", ...cityOptions].map((c) => (
                    <button
                      key={c || "__all"}
                      type="button"
                      onClick={() => {
                        setSearchCity(c)
                        setCityOpen(false)
                      }}
                      className={cn(classes.dropdownItem, searchCity === c && classes.dropdownActive)}
                    >
                      {c || "Все города"}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div ref={dateDropRef} className={cn(classes.searchCol, classes.relative)} style={{ flex: 1.5 }}>
              <button type="button" onClick={() => setDateOpen(!dateOpen)} className={classes.searchSelectBtn}>
                <div className={classes.searchColLabel}>Даты</div>
                <div className={classes.searchColValue}>{dateLabel}</div>
              </button>
              {dateOpen && (
                <div className={classes.dateDropdown}>
                  <DateRangePicker
                    ranges={[{ startDate: rangeStart, endDate: rangeEnd, key: "selection" }]}
                    onChange={(item) => {
                      const { startDate, endDate } = item.selection
                      const start = format(startDate, "yyyy-MM-dd")
                      const end = format(endDate, "yyyy-MM-dd")
                      setArrival(start)
                      setDeparture(end)
                      if (start !== end) setDateOpen(false)
                    }}
                    months={2}
                    direction="horizontal"
                    locale={ru}
                    minDate={new Date()}
                    showSelectionPreview
                    moveRangeOnFirstSelection={false}
                    showDateDisplay={false}
                    inputRanges={[]}
                    staticRanges={[]}
                  />
                  <div className={classes.dateActions}>
                    <Btn
                      variant="secondary"
                      onClick={() => {
                        setArrival("")
                        setDeparture("")
                        setDateOpen(false)
                      }}
                    >
                      Сбросить
                    </Btn>
                    <Btn onClick={() => setDateOpen(false)}>Применить</Btn>
                  </div>
                </div>
              )}
            </div>

            <div ref={guestDropRef} className={cn(classes.searchCol, classes.relative)}>
              <button type="button" onClick={() => setGuestOpen(!guestOpen)} className={classes.searchSelectBtn}>
                <div className={classes.searchColLabel}>Гости</div>
                <div className={classes.searchColValue}>
                  {adults} взр.{parseInt(childrenCount) > 0 ? ` · ${childrenCount} дет.` : ""}
                </div>
              </button>
              {guestOpen && (
                <div className={classes.dropdownPanel} style={{ padding: 16, width: 300 }}>
                  <div className={classes.counterRow}>
                    <div>
                      <p style={{ fontSize: 14, margin: 0, fontWeight: 500 }}>Взрослые</p>
                      <p className={classes.muted}>от 18 лет</p>
                    </div>
                    <div className={classes.flexRow} style={{ gap: 12 }}>
                      <button
                        type="button"
                        className={classes.counterBtn}
                        onClick={() => setAdults((v) => String(Math.max(1, parseInt(v) - 1)))}
                        disabled={parseInt(adults) <= 1}
                      >
                        −
                      </button>
                      <span style={{ width: 20, textAlign: "center", fontWeight: 600 }}>{adults}</span>
                      <button
                        type="button"
                        className={classes.counterBtn}
                        onClick={() => setAdults((v) => String(Math.min(10, parseInt(v) + 1)))}
                      >
                        +
                      </button>
                    </div>
                  </div>
                  <div className={classes.counterRow}>
                    <div>
                      <p style={{ fontSize: 14, margin: 0, fontWeight: 500 }}>Дети</p>
                      <p className={classes.muted}>до 17 лет</p>
                    </div>
                    <div className={classes.flexRow} style={{ gap: 12 }}>
                      <button
                        type="button"
                        className={classes.counterBtn}
                        onClick={() => handleChildrenChange(-1)}
                        disabled={parseInt(childrenCount) <= 0}
                      >
                        −
                      </button>
                      <span style={{ width: 20, textAlign: "center", fontWeight: 600 }}>{childrenCount}</span>
                      <button type="button" className={classes.counterBtn} onClick={() => handleChildrenChange(1)}>
                        +
                      </button>
                    </div>
                  </div>
                  {parseInt(childrenCount) > 0 && (
                    <div style={{ borderTop: "1px solid #e2e8f0", paddingTop: 12 }}>
                      <p style={{ fontSize: 12, fontWeight: 600 }}>Возраст детей на дату заезда</p>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 8 }}>
                        {childAges.map((age, i) => (
                          <div key={i} className={classes.fieldGroup}>
                            <span className={classes.smallText}>Ребёнок {i + 1}</span>
                            <select
                              value={age}
                              onChange={(e) => updateChildAge(i, parseInt(e.target.value))}
                              className={classes.miniInput}
                            >
                              {Array.from({ length: 18 }, (_, n) => (
                                <option key={n} value={n}>
                                  {n} лет
                                </option>
                              ))}
                            </select>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  <Btn onClick={() => setGuestOpen(false)}>Готово</Btn>
                </div>
              )}
            </div>

            <div style={{ paddingTop: 12 }}>
              <Btn onClick={handleSearch} loading={availLoading} disabled={!datesReady}>
                Найти
              </Btn>
            </div>
          </div>

          {searched && (
            <div className={classes.flexBetween} style={{ fontSize: 12 }}>
              {availLoading ? (
                <span style={{ color: "var(--light-blue)" }}>Проверяем доступность отелей...</span>
              ) : (
                <span className={classes.statusOk}>
                  ✓ Найдено {filtered.length} {filtered.length === 1 ? "отель" : filtered.length < 5 ? "отеля" : "отелей"} · {nights} {nightWord(nights)}
                  {searchCity ? ` · ${searchCity}` : ""}
                </span>
              )}
              <button type="button" onClick={clearSearch} style={{ background: "none", border: "none", color: "#94a3b8", cursor: "pointer" }}>
                ✕ Сбросить
              </button>
            </div>
          )}

          <div className={classes.filtersRow}>
            <input
              type="text"
              value={nameSearch}
              onChange={(e) => setNameSearch(e.target.value)}
              placeholder="Поиск по названию..."
              className={classes.input}
              style={{ width: 220 }}
            />
            {starsOptions.length > 0 && (
              <select value={starsFilter} onChange={(e) => setStarsFilter(e.target.value)} className={classes.input}>
                <option value="">Все звёзды</option>
                {starsOptions.map((s) => (
                  <option key={s} value={s}>{s} ★</option>
                ))}
              </select>
            )}
            {(nameSearch || starsFilter) && (
              <button
                type="button"
                onClick={() => {
                  setNameSearch("")
                  setStarsFilter("")
                }}
                className={`${classes.btn} ${classes.btnSecondary}`}
              >
                Сбросить
              </button>
            )}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className={classes.input}
              style={{ marginLeft: "auto" }}
            >
              <option value="availability">По наличию</option>
              <option value="stars">По звёздности</option>
              <option value="alpha">По алфавиту</option>
            </select>
          </div>

          {availError && (
            <div style={{ padding: 12, borderRadius: 8, background: "#fef2f2", border: "1px solid #fecaca", color: "#b91c1c", fontSize: 12 }}>
              Ошибка поиска: {availError.message}
            </div>
          )}

          {!searched ? (
            <EmptyState>
              <p>Выберите даты заезда и выезда, затем нажмите «Найти»</p>
            </EmptyState>
          ) : filtered.length === 0 && !availLoading ? (
            <EmptyState>
              <p>Нет свободных отелей на выбранные даты</p>
              <button type="button" onClick={clearSearch} className={classes.extLink} style={{ background: "none", border: "none", cursor: "pointer" }}>
                Показать все отели
              </button>
            </EmptyState>
          ) : (
            <div className={classes.gridCards}>
              {filtered.map((p, i) => {
                const price = priceMap.get(p.id)
                return (
                  <div key={`${p.id}-${i}`} onClick={() => openModal(p)} className={classes.hotelCard}>
                    <div className={classes.hotelCardImgWrap}>
                      {p.photos?.[0] ? (
                        <img src={tlImg(p.photos[0])} alt="" className={classes.hotelCardImg} />
                      ) : (
                        <div className={classes.hotelCardImgPlaceholder}>🏨</div>
                      )}
                      {!availLoading && price?.hasAvailability && price.minTotalPrice && (
                        <div className={classes.hotelCardPriceTag}>
                          от {price.minTotalPrice.toLocaleString("ru-RU")} ₽
                        </div>
                      )}
                    </div>
                    <div className={classes.hotelCardBody}>
                      <p className={classes.hotelCardName}>{p.name || "—"}</p>
                      {p.address?.city && <p className={classes.hotelCardCity}>📍 {p.address.city}</p>}
                      <div className={classes.hotelCardFooter}>
                        {p.stars ? <StarRow count={parseInt(p.stars) || 0} /> : <span />}
                        {!availLoading && price?.hasAvailability && price.minPricePerNight && (
                          <span className={classes.smallText}>
                            {price.minPricePerNight.toLocaleString("ru-RU")} ₽/ночь
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </>
      )}

      {subTab === "reservations" && (
        <SectionCard title="Бронирования">
          <div className={classes.flexBetween} style={{ marginBottom: 12 }}>
            <span className={classes.muted}>{reservations.length} записей</span>
            <button
              type="button"
              onClick={() => refetch()}
              style={{ background: "none", border: "none", color: "#475569", cursor: "pointer", fontSize: 12 }}
            >
              ↻ Обновить
            </button>
          </div>
          {cancelInfo && <p className={classes.statusOk} style={{ marginBottom: 12 }}>{cancelInfo}</p>}
          {listLoading ? (
            <Spinner />
          ) : reservations.length === 0 ? (
            <p className={classes.muted} style={{ textAlign: "center", padding: 30 }}>Нет бронирований</p>
          ) : (
            <div className={classes.resvList}>
              {reservations.map((r) => (
                <div key={r.id} className={classes.resvItem} onClick={() => openDetail(r)}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className={classes.flexRow} style={{ flexWrap: "wrap", marginBottom: 4 }}>
                      <span style={{ fontWeight: 500 }}>
                        {r.guest?.firstName} {r.guest?.lastName}
                      </span>
                      <Badge color={statusColor(r.status)}>
                        {r.status === "confirmed" || r.status === "active"
                          ? "Подтверждено"
                          : r.status === "cancelled" || r.status === "canceled"
                          ? "Отменено"
                          : r.status}
                      </Badge>
                    </div>
                    <p style={{ fontSize: 12, color: "#475569", fontWeight: 500, margin: 0 }}>
                      {r.propertyName ?? r.propertyId}
                    </p>
                    <p className={classes.smallText} style={{ marginTop: 4 }}>
                      {fmtDateTime(r.arrival)} → {fmtDateTime(r.departure)}
                      {r.adults > 0 && <span style={{ marginLeft: 8 }}>{r.adults} взр.{r.children > 0 ? ` · ${r.children} дет.` : ""}</span>}
                    </p>
                  </div>
                  <div style={{ textAlign: "right", flexShrink: 0, display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
                    <p style={{ fontSize: 15, fontWeight: 600, margin: 0 }}>
                      {r.totalPrice?.toLocaleString("ru-RU")} {r.currency}
                    </p>
                    {r.status !== "cancelled" && r.status !== "canceled" && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          startCancel(r.id, r)
                        }}
                        disabled={cancelling}
                        style={{ background: "none", border: "none", color: "#dc2626", cursor: "pointer", fontSize: 11 }}
                      >
                        Отменить
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </SectionCard>
      )}

      {modalProperty && (
        <PropertyModal
          property={modalProperty}
          searchDates={modalSearchDates}
          onClose={() => {
            setModalProperty(null)
            setModalSearchDates(null)
          }}
          onBookingCreated={() => {
            refetch()
            setModalProperty(null)
            setModalSearchDates(null)
            setSubTab("reservations")
          }}
        />
      )}

      {detailReservation && (
        <ReservationDetailModal
          reservation={detailReservation}
          allProperties={allProperties}
          roomTypesData={roomTypesData}
          ratePlansData={ratePlansData}
          onClose={() => setDetailReservation(null)}
          onStartCancel={(id, r) => {
            setDetailReservation(null)
            startCancel(id, r)
          }}
        />
      )}
    </div>
  )
}
