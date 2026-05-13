import React, { useState } from "react"
import classes from "../TravellinePage.module.css"
import { cn } from "./helpers"

export function Badge({ children, color = "gray" }) {
  const colorClass =
    color === "green"
      ? classes.badgeGreen
      : color === "red"
      ? classes.badgeRed
      : color === "blue"
      ? classes.badgeBlue
      : classes.badgeGray
  return <span className={cn(classes.badge, colorClass)}>{children}</span>
}

export function SectionCard({ title, children }) {
  return (
    <div className={classes.card}>
      {title && <div className={classes.cardHeader}>{title}</div>}
      <div className={classes.cardBody}>{children}</div>
    </div>
  )
}

export function JsonViewer({ data }) {
  const [copied, setCopied] = useState(false)
  let pretty = data
  try {
    pretty = JSON.stringify(JSON.parse(data), null, 2)
  } catch {
    /* ignore */
  }
  const copy = () => {
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(pretty)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    }
  }
  return (
    <div className={classes.jsonViewerWrap}>
      <button type="button" onClick={copy} className={classes.jsonCopyBtn}>
        {copied ? "Скопировано" : "Копировать"}
      </button>
      <pre className={classes.jsonViewer}>{pretty}</pre>
    </div>
  )
}

export function Field({ label, value, onChange, type = "text", placeholder, required }) {
  return (
    <div className={classes.fieldGroup}>
      <label className={classes.fieldLabel}>
        {label}
        {required && <span className={classes.required}>*</span>}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={classes.input}
      />
    </div>
  )
}

export function Btn({ onClick, loading, disabled, children, variant = "primary", type = "button" }) {
  const variantClass =
    variant === "secondary"
      ? classes.btnSecondary
      : variant === "danger"
      ? classes.btnDanger
      : classes.btnPrimary
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={cn(classes.btn, variantClass)}
    >
      {loading ? <span className={classes.spinner} style={{ width: 14, height: 14 }} /> : null}
      {children}
    </button>
  )
}

export function StarRow({ count }) {
  const n = Math.min(count, 5)
  return (
    <span className={classes.starRow}>
      {Array.from({ length: n }).map((_, i) => (
        <span key={i} className={classes.star}>
          ★
        </span>
      ))}
    </span>
  )
}

export function Spinner() {
  return (
    <div className={classes.spinnerWrap}>
      <div className={classes.spinner} />
    </div>
  )
}

export function EmptyState({ children }) {
  return <div className={classes.emptyState}>{children}</div>
}
