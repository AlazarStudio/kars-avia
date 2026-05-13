import React, { useEffect, useState } from "react"
import { useMutation, useQuery } from "@apollo/client"

import { GET_TL_CONFIG, SET_TL_CONFIG } from "../../../../../graphQL_requests"
import classes from "../TravellinePage.module.css"
import { Badge, Btn, Field, SectionCard, Spinner } from "../shared/ui"

const DOC_LINKS = [
  ["Процесс бронирования (обзор)", "https://partner.qatl.ru/docs/booking-process/"],
  ["Content API", "https://www.travelline.ru/support/knowledge-base/content-api-opisanie-obektov-razmeshcheniya/"],
  ["Search API", "https://www.travelline.ru/support/knowledge-base/search-api-poisk-dostupnykh-razmeshcheniy/"],
  ["Чек-лист тестирования", "https://www.travelline.ru/support/knowledge-base/kak-podklyuchit-partner-api/"]
]

export default function SettingsTab() {
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
