export { mediaSrc as tlImg } from "../../../../../graphQL_requests"

export const cn = (...args) => args.filter(Boolean).join(" ")

export function fmtDateTime(value) {
  if (!value) return "—"
  const d = new Date(value)
  if (isNaN(d.getTime())) return value
  const date = d.toLocaleDateString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  })
  const time = d.toLocaleTimeString("ru-RU", {
    hour: "2-digit",
    minute: "2-digit"
  })
  return String(value).includes("T") ? `${date} ${time}` : date
}

export function nightsBetween(arrival, departure) {
  if (!arrival || !departure) return 0
  const a = new Date(arrival).getTime()
  const d = new Date(departure).getTime()
  return Math.max(1, Math.round((d - a) / 86400000))
}

export function nightWord(n) {
  if (!n) return ""
  if (n === 1) return "ночь"
  if (n < 5) return "ночи"
  return "ночей"
}
