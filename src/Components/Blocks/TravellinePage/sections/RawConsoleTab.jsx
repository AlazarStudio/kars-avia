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
    label: "Доступность отеля (РЗПВ: 8616)",
    method: "GET",
    path: "/api/search/v1/properties/8616/room-stays?arrivalDate=2026-07-01&departureDate=2026-07-03&adults=1",
    body: ""
  },
  {
    label: "Доступность (корп.: 13090)",
    method: "GET",
    path: "/api/search/v1/properties/13090/room-stays?arrivalDate=2026-06-01&departureDate=2026-06-03&adults=1&include=roomTypeShortContent%7CratePlanShortContent",
    body: ""
  },
  {
    label: "Корп. тарифы с corporateId",
    method: "GET",
    path: "/api/search/v1/properties/13090/room-stays?arrivalDate=2026-06-01&departureDate=2026-06-03&adults=1&corporateIds=1&include=roomTypeShortContent%7CratePlanShortContent",
    body: ""
  },
  {
    label: "РЗПВ extra-stays (8616)",
    method: "POST",
    path: "/api/search/v1/properties/8616/extra-stays",
    body: JSON.stringify({
      stayDates: {
        arrivalDateTime: "2026-07-01T15:00",
        departureDateTime: "2026-07-03T11:00"
      },
      roomType: {
        id: "355411",
        placements: [{ code: "AdultBed-1" }]
      },
      ratePlan: { id: "353410" },
      guestCount: { adultCount: 1, childAges: [] }
    }, null, 2)
  },
  {
    label: "Поиск доступности POST",
    method: "POST",
    path: "/api/search/v1/properties/room-stays/search",
    body: JSON.stringify(
      {
        propertyIds: ["13090"],
        arrivalDate: "2026-07-01",
        departureDate: "2026-07-03",
        adults: 1,
        include: "roomTypeShortContent|ratePlanShortContent"
      },
      null,
      2
    )
  },
  { label: "Корп. клиенты (список)", method: "GET", path: "/api/reference-data/corporates", body: "" },
  {
    label: "Создать корп. клиента",
    method: "POST",
    path: "/api/reference-data/corporates",
    body: JSON.stringify({ taxpayerIdentificationNumber: "770493581", registrationReasonCode: "771401001" }, null, 2)
  },
  { label: "Reference-data Swagger", method: "GET", path: "/api/reference-data/swagger/v1/swagger.json", body: "" },
  { label: "Search Swagger", method: "GET", path: "/api/search/swagger/v1/swagger.json", body: "" },
  { label: "Reservation Swagger", method: "GET", path: "/api/reservation/swagger/v1/swagger.json", body: "" },
  {
    label: "Изменить бронь /modify (подставь номер, version, checksum)",
    method: "POST",
    path: "/api/reservation/v1/bookings/{bookingNumber}/modify",
    body: JSON.stringify({
      booking: {
        version: 1,
        roomStays: [{
          checksum: "{checksum}",
          stayDates: {
            arrivalDateTime: "2026-07-01T15:00",
            departureDateTime: "2026-07-03T11:00"
          }
        }],
        bookingComments: ["Тестовое изменение"]
      }
    }, null, 2)
  },
  { label: "Список броней", method: "GET", path: "/api/reservation/v1/bookings", body: "" },
  { label: "Корп. тарифы отеля 13090", method: "GET", path: "/api/search/v1/properties/13090/room-stays?arrivalDate=2026-07-01&departureDate=2026-07-03&adults=1&corporateIds=1&include=roomTypeShortContent%7CratePlanShortContent", body: "" },
  {
    label: "Verify бронь с РЗПВ (8616)",
    method: "POST",
    path: "/api/reservation/v1/bookings/verify",
    body: JSON.stringify({
      booking: {
        propertyId: "8616",
        roomStays: [{
          roomType: { id: "355411", placements: [{ code: "AdultBed-1" }] },
          ratePlan: { id: "353410" },
          stayDates: { arrivalDateTime: "2026-07-01T15:00", departureDateTime: "2026-07-03T11:00" },
          guestCount: { adultCount: 1 },
          guests: [{ firstName: "Test", lastName: "Guest" }],
          additionalServices: [{ type: "EarlyCheckIn", dateTimeLocal: "2026-07-01T08:00" }]
        }],
        customer: { firstName: "Test", lastName: "Guest", contacts: { phones: [], emails: [] } }
      }
    }, null, 2)
  }
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
