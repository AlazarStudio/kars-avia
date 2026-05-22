import React, { useEffect, useRef, useState } from "react"
import { useMutation, useQuery } from "@apollo/client"

import {
  GET_AIRLINE_DEPARTMENT,
  GET_DISPATCHER_DEPARTMENTS,
  GET_TL_CONFIG,
  TL_SYNC_CATALOG,
  TL_SYNC_STATUS,
  getCookie
} from "../../../../graphQL_requests"
import SyncProgressModal from "./modals/SyncProgressModal"
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
  { id: "hotels", label: "Все отели" },
  { id: "booking", label: "Поиск и бронирование" }
]

export default function TravellinePage() {
  const [tab, setTab] = useState("hotels")
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

  // ─── Sync state: проверка первого захода и polling ───────────────────────
  const [syncStatus, setSyncStatus] = useState(null)
  const [showSyncModal, setShowSyncModal] = useState(false)
  const pollRef = useRef(null)

  const { data: syncStatusData, refetch: refetchSyncStatus } = useQuery(
    TL_SYNC_STATUS,
    {
      context: { headers: { Authorization: `Bearer ${token}` } },
      skip: !user || !isConfigured,
      fetchPolicy: "network-only"
    }
  )
  const [runSync] = useMutation(TL_SYNC_CATALOG, {
    context: { headers: { Authorization: `Bearer ${token}` } }
  })

  useEffect(() => {
    if (!syncStatusData?.tlSyncStatus) return
    setSyncStatus(syncStatusData.tlSyncStatus)
    const st = syncStatusData.tlSyncStatus
    // Первый заход — каталог никогда не синкался
    if (!st.lastSyncAt && !st.running) {
      setShowSyncModal(true)
      runSync({ variables: { countryCode: "RUS" } }).then((res) =>
        setSyncStatus(res?.data?.tlSyncCatalog)
      )
    }
    // Если уже идёт фоном — показать модалку и поллить
    if (st.running) {
      setShowSyncModal(true)
    }
  }, [syncStatusData, runSync])

  // Поллинг пока running
  useEffect(() => {
    if (!showSyncModal) return
    if (pollRef.current) clearInterval(pollRef.current)
    pollRef.current = setInterval(async () => {
      const r = await refetchSyncStatus()
      const st = r?.data?.tlSyncStatus
      if (st) setSyncStatus(st)
      if (st && !st.running) {
        clearInterval(pollRef.current)
        pollRef.current = null
      }
    }, 1500)
    return () => {
      if (pollRef.current) {
        clearInterval(pollRef.current)
        pollRef.current = null
      }
    }
  }, [showSyncModal, refetchSyncStatus])

  const handleResync = async () => {
    setShowSyncModal(true)
    const r = await runSync({ variables: { countryCode: "RUS" } })
    setSyncStatus(r?.data?.tlSyncCatalog)
  }

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
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              {isSuperAdmin(user) && (
                <>
                  {isConfigured ? (
                    <Badge color="green">API настроен</Badge>
                  ) : (
                    <Badge color="gray">Требует настройки</Badge>
                  )}
                </>
              )}
              {isSuperAdmin(user) && (<>
              <button
                type="button"
                className={classes.iconBtn}
                title="Настройки"
                onClick={() => setTab("settings")}
                aria-pressed={tab === "settings"}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <circle cx="12" cy="12" r="3" />
                  <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1A1.7 1.7 0 0 0 9 19.4a1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1A1.7 1.7 0 0 0 4.6 9a1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1A1.7 1.7 0 0 0 15 4.6a1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" />
                </svg>
              </button>
              <button
                type="button"
                className={classes.iconBtn}
                title="API Console"
                onClick={() => setTab("console")}
                aria-pressed={tab === "console"}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <polyline points="4 17 10 11 4 5" />
                  <line x1="12" y1="19" x2="20" y2="19" />
                </svg>
              </button>
              </>)}
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

          {tab === "settings" && (
            <SettingsTab
              onResync={handleResync}
              lastSyncAt={syncStatus?.lastSyncAt}
              syncing={!!syncStatus?.running}
              autoSyncHours={syncStatus?.autoSyncHours}
              onAutoSyncSaved={() => refetchSyncStatus()}
            />
          )}
          {tab === "hotels" && <HotelsTab />}
          {tab === "booking" && <SearchBookingTab />}
          {tab === "console" && <RawConsoleTab />}
        </div>
      </div>

      {showSyncModal && (
        <SyncProgressModal
          status={syncStatus}
          canClose={!syncStatus?.running}
          onClose={() => setShowSyncModal(false)}
        />
      )}
    </div>
  )
}
