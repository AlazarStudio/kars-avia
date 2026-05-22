import React, { useState } from "react"
import { useLazyQuery, useMutation } from "@apollo/client"

import { TL_CREATE_CORPORATE, TL_GET_CORPORATE, TL_CORPORATES } from "../../../../../graphQL_requests"
import classes from "../TravellinePage.module.css"
import { Btn, SectionCard } from "../shared/ui"

const QA_CORPORATE_IDS = [
  { id: "109", note: "тарифы 450787, 450799" },
  { id: "110", note: "тарифы 450787, 450800" },
  { id: "118", note: "тарифы 450787, 450799" },
  { id: "119", note: "тарифы 450787, 450800" }
]

export default function CorporatesTab() {
  const [form, setForm] = useState({ inn: "", kpp: "" })
  const [createError, setCreateError] = useState("")
  const [created, setCreated] = useState(null)

  const [lookupId, setLookupId] = useState("")
  const [lookupResult, setLookupResult] = useState(null)
  const [lookupError, setLookupError] = useState("")

  const [corporatesList, setCorporatesList] = useState(null)
  const [listError, setListError] = useState("")

  const [createCorporate, { loading: creating }] = useMutation(TL_CREATE_CORPORATE)
  const [getCorporate, { loading: looking }] = useLazyQuery(TL_GET_CORPORATE)
  const [listCorporates, { loading: listing }] = useLazyQuery(TL_CORPORATES, { fetchPolicy: "network-only" })

  const handleCreate = async () => {
    setCreateError("")
    setCreated(null)
    const inn = form.inn.trim()
    const kpp = form.kpp.trim()
    if (!inn || !kpp) {
      setCreateError("ИНН и КПП обязательны")
      return
    }
    if (!/^\d+$/.test(inn)) {
      setCreateError("ИНН должен содержать только цифры")
      return
    }
    if (!/^\d{9}$/.test(kpp)) {
      setCreateError("КПП должен содержать ровно 9 цифр")
      return
    }
    try {
      const res = await createCorporate({
        variables: { input: { inn, kpp } }
      })
      setCreated(res.data?.tlCreateCorporate)
      setForm({ inn: "", kpp: "" })
    } catch (err) {
      setCreateError(err.message)
    }
  }

  const handleList = async () => {
    setListError("")
    setCorporatesList(null)
    try {
      const res = await listCorporates()
      const items = res.data?.tlCorporates ?? []
      setCorporatesList(items)
      if (items.length === 0) setListError("Нет созданных клиентов. Создайте нового или используйте тестовые ID ниже.")
    } catch (err) {
      setListError(err.message)
    }
  }

  const handleLookup = async () => {
    setLookupError("")
    setLookupResult(null)
    if (!lookupId.trim()) return
    try {
      const res = await getCorporate({ variables: { id: lookupId.trim() } })
      setLookupResult(res.data?.tlCorporate)
      if (!res.data?.tlCorporate) setLookupError("Корпоративный клиент не найден")
    } catch (err) {
      setLookupError(err.message)
    }
  }

  return (
    <div className={classes.flexCol} style={{ gap: 20 }}>

      <SectionCard title="Тестовые корп. клиенты QA (уже готовы к использованию)">
        <p style={{ fontSize: 13, color: "#475569", marginBottom: 12, lineHeight: 1.5 }}>
          В QA-среде TravelLine уже есть корпоративные клиенты, привязанные к тарифам отеля <strong>13090</strong>.
          Используйте их ID прямо сейчас — создавать ничего не нужно.
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {QA_CORPORATE_IDS.map((c) => (
            <div key={c.id} style={{
              background: "#f0fdf4", border: "1px solid #86efac", borderRadius: 8,
              padding: "8px 14px", display: "flex", alignItems: "center", gap: 12
            }}>
              <div>
                <p style={{ fontSize: 11, color: "#64748b", margin: 0 }}>Corporate ID</p>
                <code style={{ fontSize: 15, fontWeight: 700, color: "#0f172a" }}>{c.id}</code>
                <p style={{ fontSize: 11, color: "#64748b", margin: "2px 0 0" }}>{c.note}</p>
              </div>
              <button
                type="button"
                onClick={() => navigator.clipboard.writeText(c.id)}
                style={{ padding: "4px 10px", border: "1px solid #d1fae5", borderRadius: 6, background: "#fff", fontSize: 12, cursor: "pointer", color: "#475569" }}
              >
                Копировать
              </button>
            </div>
          ))}
        </div>
        <p style={{ fontSize: 12, color: "#64748b", marginTop: 12, lineHeight: 1.5 }}>
          Вкладка «Поиск и бронирование» → выберите даты → откройте отель <strong>13090</strong> → «Бронировать» →
          выберите корп. клиента → нажмите <strong>«Обновить тарифы»</strong>.
        </p>
      </SectionCard>

      <SectionCard title="Мои корпоративные клиенты">
        <p style={{ fontSize: 13, color: "#475569", marginBottom: 12, lineHeight: 1.5 }}>
          Клиенты, созданные через эту систему. TravelLine не предоставляет API для получения полного списка,
          поэтому здесь отображаются только те, что были созданы здесь.
        </p>
        <Btn variant="secondary" onClick={handleList} loading={listing}>
          Загрузить список
        </Btn>

        {listError && (
          <p className={classes.statusWarn} style={{ marginTop: 12 }}>{listError}</p>
        )}

        {corporatesList && corporatesList.length > 0 && (
          <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 8 }}>
            {corporatesList.map((c) => (
              <div key={c.id} style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 8, padding: "10px 14px", display: "flex", flexWrap: "wrap", gap: 16, alignItems: "center" }}>
                <div>
                  <p style={{ fontSize: 11, color: "#64748b", margin: 0 }}>Corporate ID</p>
                  <code style={{ fontSize: 13, fontFamily: "monospace", color: "#0f172a" }}>{c.id}</code>
                </div>
                {c.legalName && (
                  <div>
                    <p style={{ fontSize: 11, color: "#64748b", margin: 0 }}>Название</p>
                    <span style={{ fontSize: 13 }}>{c.legalName}</span>
                  </div>
                )}
                {c.inn && (
                  <div>
                    <p style={{ fontSize: 11, color: "#64748b", margin: 0 }}>ИНН</p>
                    <span style={{ fontSize: 13 }}>{c.inn}</span>
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => navigator.clipboard.writeText(c.id)}
                  style={{ marginLeft: "auto", padding: "4px 10px", border: "1px solid #e2e8f0", borderRadius: 6, background: "#fff", fontSize: 12, cursor: "pointer", color: "#475569" }}
                >
                  Копировать ID
                </button>
              </div>
            ))}
          </div>
        )}
      </SectionCard>

      <SectionCard title="Создать нового корпоративного клиента">
        <p style={{ fontSize: 13, color: "#475569", marginBottom: 16, lineHeight: 1.5 }}>
          TravelLine создаёт корп. клиента по ИНН+КПП — проверяет их по реестру ФНС и возвращает <strong>Corporate ID</strong>.
          Нужны реальные ИНН и КПП существующей организации.
        </p>

        <div className={classes.gridForm2} style={{ marginBottom: 12 }}>
          <div className={classes.fieldGroup}>
            <label className={classes.fieldLabel}>ИНН *</label>
            <input
              type="text"
              value={form.inn}
              onChange={(e) => setForm({ ...form, inn: e.target.value })}
              placeholder="7704935811"
              className={classes.input}
            />
          </div>
          <div className={classes.fieldGroup}>
            <label className={classes.fieldLabel}>КПП * (9 цифр)</label>
            <input
              type="text"
              value={form.kpp}
              onChange={(e) => setForm({ ...form, kpp: e.target.value })}
              placeholder="771401001"
              className={classes.input}
            />
          </div>
        </div>

        {createError && (
          <p className={classes.statusWarn} style={{ marginBottom: 12 }}>{createError}</p>
        )}

        <Btn onClick={handleCreate} loading={creating} disabled={!form.inn.trim() || !form.kpp.trim()}>
          Создать в TravelLine
        </Btn>

        {created && (
          <div style={{
            marginTop: 16, background: "#f0fdf4", border: "1px solid #86efac",
            borderRadius: 10, padding: 16, display: "flex", flexDirection: "column", gap: 8
          }}>
            <p style={{ fontSize: 13, fontWeight: 700, color: "#15803d", margin: 0 }}>✓ Корпоративный клиент создан</p>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div>
                <p style={{ fontSize: 11, color: "#64748b", margin: 0 }}>Corporate ID</p>
                <code style={{ fontSize: 16, fontWeight: 700, fontFamily: "monospace", color: "#0f172a", background: "#fff", padding: "4px 10px", borderRadius: 6, border: "1px solid #d1fae5", display: "inline-block", marginTop: 2 }}>
                  {created.id}
                </code>
              </div>
              <button
                type="button"
                onClick={() => navigator.clipboard.writeText(created.id)}
                style={{ marginTop: 16, padding: "4px 10px", border: "1px solid #e2e8f0", borderRadius: 6, background: "#fff", fontSize: 12, cursor: "pointer", color: "#475569" }}
              >
                Копировать
              </button>
            </div>
            {created.legalName && (
              <p style={{ fontSize: 12, color: "#166534", margin: 0 }}>{created.legalName}</p>
            )}
          </div>
        )}
      </SectionCard>

      <SectionCard title="Найти клиента по ID">
        <div style={{ display: "flex", gap: 8, alignItems: "flex-end" }}>
          <div className={classes.fieldGroup} style={{ flex: 1 }}>
            <label className={classes.fieldLabel}>Corporate ID</label>
            <input
              type="text"
              value={lookupId}
              onChange={(e) => setLookupId(e.target.value)}
              placeholder="109"
              className={classes.input}
              onKeyDown={(e) => e.key === "Enter" && handleLookup()}
            />
          </div>
          <Btn variant="secondary" onClick={handleLookup} loading={looking} disabled={!lookupId.trim()}>
            Найти
          </Btn>
        </div>

        {lookupError && (
          <p className={classes.statusWarn} style={{ marginTop: 12 }}>{lookupError}</p>
        )}

        {lookupResult && (
          <div style={{ marginTop: 16, background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 10, padding: 14 }}>
            <div className={classes.kvRow}>
              <span className={classes.kvKey}>ID</span>
              <code style={{ fontFamily: "monospace", fontSize: 13 }}>{lookupResult.id}</code>
            </div>
            {lookupResult.legalName && (
              <div className={classes.kvRow}>
                <span className={classes.kvKey}>Название</span>
                <span className={classes.kvVal}>{lookupResult.legalName}</span>
              </div>
            )}
            {lookupResult.inn && (
              <div className={classes.kvRow}>
                <span className={classes.kvKey}>ИНН</span>
                <span className={classes.kvVal}>{lookupResult.inn}</span>
              </div>
            )}
            {lookupResult.kpp && (
              <div className={classes.kvRow}>
                <span className={classes.kvKey}>КПП</span>
                <span className={classes.kvVal}>{lookupResult.kpp}</span>
              </div>
            )}
          </div>
        )}
      </SectionCard>

    </div>
  )
}
