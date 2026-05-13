import React, { useState } from "react"
import { useMutation } from "@apollo/client"

import { TL_RAW_REQUEST } from "../../../../../graphQL_requests"
import classes from "../TravellinePage.module.css"
import { Badge, Btn, JsonViewer, SectionCard } from "../shared/ui"

const EXAMPLES = [
  { label: "Список отелей", method: "GET", path: "/api/content/v1/properties", body: "" },
  { label: "Детали отеля", method: "GET", path: "/api/content/v1/properties/{id}", body: "" },
  { label: "Категории номеров", method: "GET", path: "/api/content/v1/room-type-categories", body: "" },
  { label: "Meal plans", method: "GET", path: "/api/content/v1/meal-plans", body: "" },
  {
    label: "Поиск доступности",
    method: "POST",
    path: "/api/search/v1/properties/room-stays/search",
    body: JSON.stringify(
      {
        propertyIds: ["ID"],
        arrivalDate: "2025-09-01",
        departureDate: "2025-09-03",
        adults: 1,
        include: "roomTypeShortContent|ratePlanShortContent"
      },
      null,
      2
    )
  },
  { label: "Список броней", method: "GET", path: "/api/reservation/v1/bookings", body: "" }
]

const METHODS = ["GET", "POST", "PUT", "DELETE", "PATCH"]

export default function RawConsoleTab() {
  const [method, setMethod] = useState("GET")
  const [path, setPath] = useState("/api/content/v1/properties")
  const [body, setBody] = useState("")
  const [result, setResult] = useState(null)
  const [error, setError] = useState("")

  const [rawRequest, { loading }] = useMutation(TL_RAW_REQUEST)

  const send = async () => {
    setError("")
    try {
      const res = await rawRequest({
        variables: {
          input: {
            method,
            path,
            body: body || null
          }
        }
      })
      setResult(res.data?.tlRawRequest)
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <div className={classes.flexCol} style={{ gap: 20 }}>
      <SectionCard title="API Console — прямой запрос к TravelLine">
        <div className={classes.consoleExamples}>
          {EXAMPLES.map((ex) => (
            <button
              key={ex.label}
              type="button"
              className={classes.consoleExample}
              onClick={() => {
                setMethod(ex.method)
                setPath(ex.path)
                setBody(ex.body)
              }}
            >
              {ex.method} {ex.label}
            </button>
          ))}
        </div>

        <div className={classes.consoleRow}>
          <select
            value={method}
            onChange={(e) => setMethod(e.target.value)}
            className={classes.consoleSelect}
          >
            {METHODS.map((m) => (
              <option key={m}>{m}</option>
            ))}
          </select>
          <input
            value={path}
            onChange={(e) => setPath(e.target.value)}
            placeholder="/api/content/v1/properties"
            className={`${classes.input} ${classes.consolePath}`}
          />
          <Btn onClick={send} loading={loading} disabled={!path}>
            Отправить
          </Btn>
        </div>

        {(method === "POST" || method === "PUT" || method === "PATCH") && (
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder={'{\n  "key": "value"\n}'}
            rows={6}
            className={classes.consoleBody}
          />
        )}

        {error && (
          <div style={{ marginTop: 12 }} className={classes.statusWarn}>
            {error}
          </div>
        )}
      </SectionCard>

      {result && (
        <SectionCard title={`Ответ — ${result.status} ${result.ok ? "OK" : "ERROR"}`}>
          <div style={{ marginBottom: 12 }}>
            {result.ok ? (
              <Badge color="green">{result.status} OK</Badge>
            ) : (
              <Badge color="red">{result.status} Error</Badge>
            )}
          </div>
          <JsonViewer data={result.body} />
        </SectionCard>
      )}
    </div>
  )
}
