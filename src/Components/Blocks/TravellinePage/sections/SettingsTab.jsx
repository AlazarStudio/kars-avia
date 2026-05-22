import React, { useEffect, useState } from "react"
import { useMutation, useQuery } from "@apollo/client"

import {
  GET_TL_CONFIG,
  SET_TL_CONFIG,
  TL_SET_AUTO_SYNC_HOURS
} from "../../../../../graphQL_requests"
import classes from "../TravellinePage.module.css"
import { Badge, Btn, Field, SectionCard, Spinner } from "../shared/ui"

const DOC_LINKS = [
  ["Процесс бронирования (обзор)", "https://partner.qatl.ru/docs/booking-process/"],
  ["Content API", "https://www.travelline.ru/support/knowledge-base/content-api-opisanie-obektov-razmeshcheniya/"],
  ["Search API", "https://www.travelline.ru/support/knowledge-base/search-api-poisk-dostupnykh-razmeshcheniy/"],
  ["Чек-лист тестирования", "https://www.travelline.ru/support/knowledge-base/kak-podklyuchit-partner-api/"]
]

export default function SettingsTab({ onResync, lastSyncAt, syncing, autoSyncHours, onAutoSyncSaved }) {
  const { data, loading, refetch } = useQuery(GET_TL_CONFIG)
  const [setConfig, { loading: saving }] = useMutation(SET_TL_CONFIG)

  const config = data?.tlConfig
  const [clientId, setClientId] = useState("")
  const [clientSecret, setClientSecret] = useState("")
  const [baseUrl, setBaseUrl] = useState("https://partner.qatl.ru")
  const [error, setError] = useState("")
  const [info, setInfo] = useState("")

  useEffect(() => {
    if (config) {
      setClientId(config.clientId ?? "")
      setBaseUrl(config.baseUrl ?? "https://partner.qatl.ru")
    }
  }, [config])

  const save = async () => {
    setError("")
    setInfo("")
    if (!clientId.trim()) return setError("Укажите Client ID")
    if (!clientSecret.trim()) return setError("Укажите Client Secret")
    try {
      await setConfig({
        variables: {
          input: {
            clientId: clientId.trim(),
            clientSecret: clientSecret.trim(),
            baseUrl: baseUrl.trim()
          }
        }
      })
      setInfo("Настройки сохранены")
      refetch()
    } catch (err) {
      setError(err.message)
    }
  }

  if (loading) return <Spinner />

  return (
    <div className={classes.settingsCol}>
      <SectionCard title="Статус подключения">
        <div className={classes.flexRow}>
          {config?.isConfigured ? (
            <>
              <Badge color="green">✓ Готово</Badge>
              <span className={classes.statusOk}>Credentials настроены — можно работать с API</span>
            </>
          ) : (
            <>
              <Badge color="gray">Не настроено</Badge>
              <span className={classes.statusWarn}>Credentials не указаны — API недоступен</span>
            </>
          )}
        </div>
      </SectionCard>

      <SectionCard title="OAuth2 Credentials">
        <div className={classes.flexCol} style={{ gap: 16 }}>
          <div className={classes.infoBox}>
            TravelLine использует OAuth2 (client_credentials). Введите clientId и clientSecret — система автоматически получит и обновит access token.
          </div>
          <Field label="Client ID" value={clientId} onChange={setClientId} placeholder="bapi_qa0" required />
          <Field
            label="Client Secret"
            value={clientSecret}
            onChange={setClientSecret}
            type="password"
            placeholder="Ваш clientSecret"
            required
          />
          <Field label="Base URL" value={baseUrl} onChange={setBaseUrl} placeholder="https://partner.qatl.ru" required />
          {error && <div className={classes.statusWarn} style={{ fontSize: 12 }}>{error}</div>}
          {info && <div className={classes.statusOk} style={{ fontSize: 12 }}>{info}</div>}
          <div>
            <Btn onClick={save} loading={saving}>Сохранить</Btn>
          </div>
        </div>
      </SectionCard>

      <SectionCard title="Каталог отелей">
        <CatalogSyncSection
          onResync={onResync}
          syncing={syncing}
          lastSyncAt={lastSyncAt}
          autoSyncHours={autoSyncHours}
          onAutoSyncSaved={onAutoSyncSaved}
        />
      </SectionCard>

      <SectionCard title="Как получить токен">
        <ol style={{ display: "flex", flexDirection: "column", gap: 8, paddingLeft: 20, margin: 0, fontSize: 13, color: "#475569" }}>
          <li>Направьте в TravelLine: название проекта, сайт, ФИО, email и телефон ответственного за разработку</li>
          <li>TravelLine выдаст токен к тестовой среде <code>partner.qatl.ru</code></li>
          <li>Вставьте токен выше и сохраните</li>
          <li>Протестируйте интеграцию по всем вкладкам (Content → Search → Reservations)</li>
          <li>После прохождения чек-листа — заключите договор с TravelLine</li>
        </ol>
        <div style={{ marginTop: 16, paddingTop: 12, borderTop: "1px solid #e2e8f0" }}>
          <p className={classes.muted} style={{ marginBottom: 8 }}>Документация:</p>
          <div className={classes.linkList}>
            {DOC_LINKS.map(([label, url]) => (
              <a key={url} href={url} target="_blank" rel="noopener noreferrer" className={classes.extLink}>
                ↗ {label}
              </a>
            ))}
          </div>
        </div>
      </SectionCard>
    </div>
  )
}

function CatalogSyncSection({ onResync, syncing, lastSyncAt, autoSyncHours, onAutoSyncSaved }) {
  const [hours, setHours] = useState(String(autoSyncHours ?? 24))
  const [savedInfo, setSavedInfo] = useState("")
  const [saveErr, setSaveErr] = useState("")
  const [setHoursMutation, { loading: savingHours }] = useMutation(TL_SET_AUTO_SYNC_HOURS)

  useEffect(() => {
    setHours(String(autoSyncHours ?? 24))
  }, [autoSyncHours])

  const saveHours = async () => {
    setSavedInfo("")
    setSaveErr("")
    const num = Math.max(1, Math.min(168, parseInt(hours) || 24))
    try {
      const res = await setHoursMutation({ variables: { hours: num } })
      setSavedInfo(`Интервал сохранён: каждые ${res?.data?.tlSetAutoSyncHours} ч.`)
      onAutoSyncSaved && onAutoSyncSaved(res?.data?.tlSetAutoSyncHours)
    } catch (err) {
      setSaveErr(err.message)
    }
  }

  return (
    <div className={classes.flexCol} style={{ gap: 16 }}>
      <p className={classes.muted} style={{ fontSize: 13 }}>
        Все отели TravelLine синхронизируются в локальную базу: фотографии, описания и
        контент хранятся у нас, в выдаче подгружаются мгновенно.
      </p>
      <p className={classes.muted}>
        Последняя синхронизация:{" "}
        <strong>
          {lastSyncAt
            ? new Date(lastSyncAt).toLocaleString("ru-RU")
            : "ещё не выполнялась"}
        </strong>
      </p>
      <div>
        <Btn onClick={onResync} loading={!!syncing} disabled={!onResync}>
          {syncing ? "Синхронизируем…" : "Пересинхронизировать сейчас"}
        </Btn>
      </div>

      <div
        style={{
          borderTop: "1px solid #e2e8f0",
          paddingTop: 12,
          display: "flex",
          flexDirection: "column",
          gap: 8,
        }}
      >
        <p className={classes.muted} style={{ fontSize: 13 }}>
          Автоматическая синхронизация — задайте интервал в часах (1–168).
        </p>
        <div style={{ display: "flex", alignItems: "flex-end", gap: 8 }}>
          <Field
            label="Каждые N часов"
            value={hours}
            onChange={setHours}
            type="number"
            placeholder="24"
          />
          <div style={{ paddingBottom: 0 }}>
            <Btn onClick={saveHours} loading={savingHours}>
              Сохранить
            </Btn>
          </div>
        </div>
        {savedInfo && <span className={classes.statusOk} style={{ fontSize: 12 }}>{savedInfo}</span>}
        {saveErr && <span className={classes.statusWarn} style={{ fontSize: 12 }}>{saveErr}</span>}
      </div>
    </div>
  )
}
