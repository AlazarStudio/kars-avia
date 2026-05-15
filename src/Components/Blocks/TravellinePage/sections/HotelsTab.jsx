import React, { useMemo, useState } from "react"
import { useQuery } from "@apollo/client"

import { TL_LOCAL_PROPERTIES } from "../../../../../graphQL_requests"
import classes from "../TravellinePage.module.css"
import { EmptyState, Spinner, StarRow } from "../shared/ui"
import { tlImg } from "../shared/helpers"
import PropertyModal from "../modals/PropertyModal"

export default function HotelsTab() {
  const [nameSearch, setNameSearch] = useState("")
  const [cityFilter, setCityFilter] = useState("")
  const [starsFilter, setStarsFilter] = useState("")
  const [sortBy, setSortBy] = useState("alpha")
  const [modalProperty, setModalProperty] = useState(null)

  const { data, loading, error } = useQuery(TL_LOCAL_PROPERTIES, {
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

  const filtered = useMemo(() => {
    const q = nameSearch.trim().toLowerCase()
    let list = allProperties.filter((p) => {
      if (cityFilter && p.address?.city !== cityFilter) return false
      if (starsFilter && p.stars !== starsFilter) return false
      if (q && !p.name?.toLowerCase().includes(q) && !p.address?.city?.toLowerCase().includes(q)) return false
      return true
    })
    list = [...list].sort((a, b) => {
      if (sortBy === "stars") return (Number(b.stars) || 0) - (Number(a.stars) || 0)
      return (a.name ?? "").localeCompare(b.name ?? "", "ru")
    })
    return list
  }, [allProperties, nameSearch, cityFilter, starsFilter, sortBy])

  return (
    <div className={classes.flexCol} style={{ gap: 16 }}>
      <div className={classes.filtersRow}>
        <input
          type="text"
          value={nameSearch}
          onChange={(e) => setNameSearch(e.target.value)}
          placeholder="Поиск по названию..."
          className={classes.input}
          style={{ width: 220 }}
        />
        <select value={cityFilter} onChange={(e) => setCityFilter(e.target.value)} className={classes.input}>
          <option value="">Все города</option>
          {cityOptions.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        {starsOptions.length > 0 && (
          <select value={starsFilter} onChange={(e) => setStarsFilter(e.target.value)} className={classes.input}>
            <option value="">Все звёзды</option>
            {starsOptions.map((s) => (
              <option key={s} value={s}>{s} ★</option>
            ))}
          </select>
        )}
        {(nameSearch || cityFilter || starsFilter) && (
          <button
            type="button"
            onClick={() => {
              setNameSearch("")
              setCityFilter("")
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
          <option value="alpha">По алфавиту</option>
          <option value="stars">По звёздности</option>
        </select>
        <span className={classes.muted}>
          {loading ? "Загрузка..." : `${filtered.length} из ${allProperties.length}`}
        </span>
      </div>

      {error && (
        <div style={{ padding: 12, borderRadius: 8, background: "#fef2f2", border: "1px solid #fecaca", color: "#b91c1c", fontSize: 12 }}>
          {error.message}
        </div>
      )}

      {loading ? (
        <Spinner />
      ) : filtered.length === 0 ? (
        <EmptyState>
          <p>{allProperties.length === 0 ? "Нет данных — проверьте настройки API" : "Ничего не найдено"}</p>
        </EmptyState>
      ) : (
        <div className={classes.gridCards}>
          {filtered.map((p, i) => (
            <div
              key={`${p.id}-${i}`}
              onClick={() => setModalProperty(p)}
              className={classes.hotelCard}
            >
              <div className={classes.hotelCardImgWrap}>
                {p.photos?.[0] ? (
                  <img src={tlImg(p.photos[0])} alt="" className={classes.hotelCardImg} />
                ) : (
                  <div className={classes.hotelCardImgPlaceholder}>🏨</div>
                )}
              </div>
              <div className={classes.hotelCardBody}>
                <p className={classes.hotelCardName}>{p.name || "—"}</p>
                {p.address?.city && (
                  <p className={classes.hotelCardCity}>📍 {p.address.city}</p>
                )}
                <div className={classes.hotelCardFooter}>
                  {p.stars ? <StarRow count={parseInt(p.stars) || 0} /> : <span />}
                  <span className={classes.hotelCardId}>ID: {p.id}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {modalProperty && (
        <PropertyModal property={modalProperty} searchDates={null} onClose={() => setModalProperty(null)} />
      )}
    </div>
  )
}
