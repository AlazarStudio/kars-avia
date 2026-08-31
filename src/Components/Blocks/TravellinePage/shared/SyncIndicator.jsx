import React from "react"
import classes from "../TravellinePage.module.css"
import { Badge } from "./ui"

const shortTime = (iso) =>
  new Date(iso).toLocaleString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  })

// Состояние каталога TravelLine в шапке раздела + ручной запуск.
// Автосинхронизация идёт в фоне на сервере и модалку не открывает —
// здесь она видна только как смена статуса.
export default function SyncIndicator({ status, onResync, canResync }) {
  if (!status) return null

  const { running, done, total, error, lastSyncAt } = status

  const badge = running ? (
    <Badge color="blue">Синхронизация{total ? ` ${done}/${total}` : "…"}</Badge>
  ) : error ? (
    <Badge color="red">Ошибка синхронизации</Badge>
  ) : lastSyncAt ? (
    <Badge color="green">Синхронизирован</Badge>
  ) : (
    <Badge color="gray">Не синхронизирован</Badge>
  )

  const title = error
    ? `Ошибка синхронизации: ${error}`
    : running
    ? `Идёт синхронизация каталога${total ? `: ${done} из ${total}` : ""}`
    : lastSyncAt
    ? `Последняя синхронизация: ${new Date(lastSyncAt).toLocaleString("ru-RU")}`
    : "Каталог ещё не синхронизировался"

  return (
    <span className={classes.syncIndicator} title={title}>
      {badge}
      {lastSyncAt && !running && (
        <span className={classes.syncTime}>{shortTime(lastSyncAt)}</span>
      )}
      {canResync && (
        <button
          type="button"
          className={classes.iconBtn}
          title={running ? "Синхронизация уже идёт" : "Синхронизировать каталог"}
          onClick={onResync}
          disabled={running}
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={running ? classes.iconSpin : undefined}
            aria-hidden
          >
            <path d="M21 12a9 9 0 1 1-2.64-6.36" />
            <polyline points="21 3 21 9 15 9" />
          </svg>
        </button>
      )}
    </span>
  )
}
