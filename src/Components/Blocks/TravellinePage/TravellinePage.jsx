import React, { useEffect, useState } from "react"
import { useQuery } from "@apollo/client"

import {
  GET_AIRLINE_DEPARTMENT,
  GET_DISPATCHER_DEPARTMENTS,
  GET_TL_CONFIG,
  getCookie
} from "../../../../graphQL_requests"
import { useAuth } from "../../../AuthContext"
import {
  isAirlineRole as isAirlineRoleCheck,
  isDispatcherAdmin,
  isDispatcherRole as isDispatcherRoleCheck,
  isSuperAdmin
} from "../../../utils/access"
import MenuDispetcher from "../MenuDispetcher/MenuDispetcher"
import classes from "./TravellinePage.module.css"
import { Badge } from "./shared/ui"
import { cn } from "./shared/helpers"

import SettingsTab from "./sections/SettingsTab"
import HotelsTab from "./sections/HotelsTab"
import SearchBookingTab from "./sections/SearchBookingTab"
import RawConsoleTab from "./sections/RawConsoleTab"

const TABS = [
  { id: "settings", label: "Настройки" },
  { id: "hotels", label: "Все отели" },
  { id: "booking", label: "Поиск и бронирование" },
  { id: "console", label: "Console" }
]

export default function TravellinePage() {
  const [tab, setTab] = useState("settings")
  const { user } = useAuth()
  const token = getCookie("token")

  const isDispatcherRole = isDispatcherRoleCheck(user)
  const isAirlineRole = isAirlineRoleCheck(user)

  const { data: airlineDepartmentData } = useQuery(GET_AIRLINE_DEPARTMENT, {
    context: { headers: { Authorization: `Bearer ${token}` } },
    variables: { airlineDepartmentId: user?.airlineDepartmentId },
    skip: !isAirlineRole || !user?.airlineDepartmentId
  })

  const { data: dispatcherDepartmentsData } = useQuery(GET_DISPATCHER_DEPARTMENTS, {
    context: { headers: { Authorization: `Bearer ${token}` } },
    variables: { pagination: { all: true } }
  })

  const [accessMenu, setAccessMenu] = useState({})

  useEffect(() => {
    if (isDispatcherRole) {
      const department =
        dispatcherDepartmentsData?.dispatcherDepartments?.departments?.find(
          (item) => item.id === user?.dispatcherDepartmentId
        )
      setAccessMenu(department?.accessMenu || {})
      return
    }
    if (isAirlineRole) {
      setAccessMenu(airlineDepartmentData?.airlineDepartment?.accessMenu || {})
      return
    }
    setAccessMenu({})
  }, [
    isDispatcherRole,
    isAirlineRole,
    user?.dispatcherDepartmentId,
    dispatcherDepartmentsData,
    airlineDepartmentData
  ])

  const { data } = useQuery(GET_TL_CONFIG, { skip: !user })
  const isConfigured = data?.tlConfig?.isConfigured

  if (!user || (!isSuperAdmin(user) && !isDispatcherAdmin(user))) {
    return (
      <div className={classes.layout}>
        <MenuDispetcher id="travelline" user={user} accessMenu={accessMenu} />
        <div className={classes.root}>
          <p>Доступ запрещён.</p>
        </div>
      </div>
    )
  }

  return (
    <div className={classes.layout}>
      <MenuDispetcher id="travelline" user={user} accessMenu={accessMenu} />
      <div className={classes.scrollArea}>
        <div className={classes.root}>
          <div className={classes.headerRow}>
            <div>
              <h1>TravelLine Integration</h1>
              <p className={classes.subtitle}>
                Интеграция с Channel Manager TravelLine — получение цен и бронирование номеров
              </p>
            </div>
            <div>
              {isConfigured ? (
                <Badge color="green">API настроен</Badge>
              ) : (
                <Badge color="gray">Требует настройки</Badge>
              )}
            </div>
          </div>

          <div className={classes.tabs}>
            {TABS.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                className={cn(classes.tab, tab === t.id && classes.tabActive)}
              >
                {t.label}
              </button>
            ))}
          </div>

          {tab === "settings" && <SettingsTab />}
          {tab === "hotels" && <HotelsTab />}
          {tab === "booking" && <SearchBookingTab />}
          {tab === "console" && <RawConsoleTab />}
        </div>
      </div>
    </div>
  )
}
