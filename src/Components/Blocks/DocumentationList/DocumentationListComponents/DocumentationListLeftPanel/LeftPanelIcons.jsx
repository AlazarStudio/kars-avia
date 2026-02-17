import React from 'react'

function StrokeIcon({ size = 16, className, children, ...props }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      className={className}
      style={{ display: 'block' }}
      {...props}
    >
      {children}
    </svg>
  )
}

function FillIcon({ size = 16, className, children, ...props }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      focusable="false"
      className={className}
      style={{ display: 'block' }}
      {...props}
    >
      {children}
    </svg>
  )
}

export function IconSearch(props) {
  return (
    <StrokeIcon {...props}>
      <circle cx="11" cy="11" r="7" />
      <path d="M21 21l-4.3-4.3" />
    </StrokeIcon>
  )
}

export function IconX(props) {
  return (
    <StrokeIcon {...props}>
      <path d="M18 6 6 18" />
      <path d="M6 6l12 12" />
    </StrokeIcon>
  )
}

export function IconFolder(props) {
  return (
    <StrokeIcon {...props}>
      <path d="M3 7a2 2 0 0 1 2-2h5l2 2h9a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7z" />
    </StrokeIcon>
  )
}

export function IconFile(props) {
  return (
    <StrokeIcon {...props}>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <path d="M14 2v6h6" />
    </StrokeIcon>
  )
}

export function IconCopy(props) {
  return (
    <StrokeIcon {...props}>
      <rect x="9" y="9" width="13" height="13" rx="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </StrokeIcon>
  )
}

export function IconPencil(props) {
  return (
    <StrokeIcon {...props}>
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z" />
    </StrokeIcon>
  )
}

export function IconTrash(props) {
  return (
    <StrokeIcon {...props}>
      <path d="M3 6h18" />
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
      <path d="M10 11v6" />
      <path d="M14 11v6" />
      <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
    </StrokeIcon>
  )
}

export function IconChevronDown(props) {
  return (
    <StrokeIcon {...props}>
      <path d="m6 9 6 6 6-6" />
    </StrokeIcon>
  )
}

export function IconChevronUp(props) {
  return (
    <StrokeIcon {...props}>
      <path d="m6 15 6-6 6 6" />
    </StrokeIcon>
  )
}

export function IconChevronLeft(props) {
  return (
    <StrokeIcon {...props}>
      <path d="m15 18-6-6 6-6" />
    </StrokeIcon>
  )
}

export function IconPlus(props) {
  return (
    <StrokeIcon {...props}>
      <path d="M12 5v14" />
      <path d="M5 12h14" />
    </StrokeIcon>
  )
}

export function IconEllipsis(props) {
  return (
    <FillIcon {...props}>
      <circle cx="7" cy="12" r="1.6" />
      <circle cx="12" cy="12" r="1.6" />
      <circle cx="17" cy="12" r="1.6" />
    </FillIcon>
  )
}

export function IconGripVertical(props) {
  return (
    <FillIcon {...props}>
      <circle cx="9" cy="5" r="1.2" />
      <circle cx="15" cy="5" r="1.2" />
      <circle cx="9" cy="12" r="1.2" />
      <circle cx="15" cy="12" r="1.2" />
      <circle cx="9" cy="19" r="1.2" />
      <circle cx="15" cy="19" r="1.2" />
    </FillIcon>
  )
}

