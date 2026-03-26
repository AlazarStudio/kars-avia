import { NodeViewContent, NodeViewWrapper } from '@tiptap/react'
import { useEffect, useId, useRef, useState } from 'react'
import PaletteOutlinedIcon from '@mui/icons-material/PaletteOutlined'
import './quoteBlock.css'
import './frameBlock.css'
import './blockResize.css'
import { clampFixedModalPosition, MODAL_VIEWPORT_MARGIN } from '../utils/modalViewportClamp'
import { decodeJWT, getCookie } from '../../../../../../../../graphQL_requests'

const SINGLE_MODAL_EVENT = 'doclist-single-modal-open'
const QUOTE_MODAL_ESTIMATED_SIZE = { width: 360, height: 400 }
const QUOTE_MIN_WIDTH = 220

const DEFAULT_QUOTE_BG = '#F3F4F6'
const SUPER_ADMIN_ROLE = 'SUPERADMIN'

const PRESET_COLORS = [
  '#F9FAFB', '#F3F4F6', '#E5E7EB', '#D1D5DB',
  '#9CA3AF', '#6B7280', '#4B5563', '#374151',
  '#EFF6FF', '#DBEAFE', '#BFDBFE', '#93C5FD',
  '#60A5FA', '#3B82F6', '#2563EB', '#1D4ED8',
  '#ECFDF5', '#D1FAE5', '#A7F3D0', '#6EE7B7',
  '#34D399', '#10B981', '#059669', '#047857',
  '#FFFBEB', '#FEF3C7', '#FDE68A', '#FCD34D',
  '#FBBF24', '#F59E0B', '#D97706', '#B45309',
  '#FEF2F2', '#FEE2E2', '#FECACA', '#FCA5A5',
  '#F87171', '#EF4444', '#DC2626', '#B91C1C',
  '#FAF5FF', '#F3E8FF', '#E9D5FF', '#D8B4FE',
  '#C084FC', '#A855F7', '#9333EA', '#7C3AED',
  '#FDF2F8', '#FCE7F3', '#FBCFE8', '#F9A8D4',
  '#F472B6', '#EC4899', '#DB2777', '#BE185D',
  '#ECFEFF', '#CFFAFE', '#A5F3FC', '#67E8F9',
  '#22D3EE', '#06B6D4', '#0891B2', '#0E7490',
]

function hexToRgb(hex) {
  if (!hex) return null
  let value = hex.replace('#', '').trim()
  if (value.length === 3) {
    value = value
      .split('')
      .map(char => char + char)
      .join('')
  }
  if (value.length !== 6) return null

  const r = Number.parseInt(value.slice(0, 2), 16)
  const g = Number.parseInt(value.slice(2, 4), 16)
  const b = Number.parseInt(value.slice(4, 6), 16)
  if ([r, g, b].some(channel => Number.isNaN(channel))) return null
  return { r, g, b }
}

function toQuoteBorderColor(bgColor) {
  const rgb = hexToRgb(bgColor)
  if (!rgb) return '#D1D5DB'
  const darken = channel => Math.round(channel * 0.72)
  return `rgba(${darken(rgb.r)}, ${darken(rgb.g)}, ${darken(rgb.b)}, 0.55)`
}

function toQuoteAccentColor(bgColor) {
  const rgb = hexToRgb(bgColor)
  if (!rgb) return 'rgba(255, 255, 255, 0.35)'
  const luminance = (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b) / 255
  if (luminance > 0.62) {
    const darken = channel => Math.round(channel * 0.52)
    return `rgba(${darken(rgb.r)}, ${darken(rgb.g)}, ${darken(rgb.b)}, 0.62)`
  }
  const lift = channel => Math.round(channel + (255 - channel) * 0.52)
  return `rgba(${lift(rgb.r)}, ${lift(rgb.g)}, ${lift(rgb.b)}, 0.94)`
}

function toQuoteButtonColor(bgColor) {
  const rgb = hexToRgb(bgColor)
  if (!rgb) return '#111827'
  const luminance = (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b) / 255
  return luminance > 0.62 ? '#111827' : '#F9FAFB'
}

function toQuoteTextColor(bgColor) {
  const rgb = hexToRgb(bgColor)
  if (!rgb) return '#D9ECFF'
  const luminance = (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b) / 255
  return luminance > 0.62 ? '#1F2A37' : '#D9ECFF'
}

export default function QuoteBlockView({ editor, node, updateAttributes }) {
  const canEdit = editor?.isEditable ?? false
  let canChangeQuoteColor = false
  if (canEdit) {
    try {
      const token = getCookie('token')
      const user = token ? decodeJWT(token) : null
      canChangeQuoteColor = user?.role === SUPER_ADMIN_ROLE
    } catch {
      canChangeQuoteColor = false
    }
  }
  const bgColor = node.attrs.bgColor || null
  const width = typeof node.attrs.width === 'number' ? node.attrs.width : null
  const textAlign = node.attrs.textAlign || 'left'
  const alignMargins =
    textAlign === 'center'
      ? { marginLeft: 'auto', marginRight: 'auto' }
      : textAlign === 'right'
        ? { marginLeft: 'auto', marginRight: 0 }
        : { marginLeft: 0, marginRight: 'auto' }
  const bg = bgColor || DEFAULT_QUOTE_BG
  const borderColor = toQuoteBorderColor(bg)
  const accentColor = toQuoteAccentColor(bg)
  const buttonColor = toQuoteButtonColor(bg)
  const textColor = toQuoteTextColor(bg)

  const [colorOpen, setColorOpen] = useState(false)
  const [customColor, setCustomColor] = useState(bgColor || DEFAULT_QUOTE_BG)
  const [colorPos, setColorPos] = useState({ x: 0, y: 0 })

  const colorRef = useRef(null)
  const modalSourceId = useId()
  const modalSource = `quote-block-${modalSourceId}`
  const dragOffset = useRef({ x: 0, y: 0 })

  const announceModalOpen = () => {
    try {
      window.dispatchEvent(
        new CustomEvent(SINGLE_MODAL_EVENT, {
          detail: { source: modalSource },
        })
      )
    } catch {
      // ignore
    }
  }

  useEffect(() => {
    if (bgColor && bgColor !== customColor) {
      setCustomColor(bgColor)
    }
    if (!bgColor && customColor !== DEFAULT_QUOTE_BG) {
      setCustomColor(DEFAULT_QUOTE_BG)
    }
  }, [bgColor, customColor])

  useEffect(() => {
    if (!colorOpen) return

    const close = event => {
      const target = event.target
      if (!(target instanceof Element)) return
      if (target.closest('.color-close-btn')) return
      if (colorRef.current && !colorRef.current.contains(target)) {
        setColorOpen(false)
      }
    }

    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [colorOpen])

  useEffect(() => {
    const onExternalModalOpen = event => {
      if (event?.detail?.source === modalSource) return
      setColorOpen(false)
    }

    window.addEventListener(SINGLE_MODAL_EVENT, onExternalModalOpen)
    return () => {
      window.removeEventListener(SINGLE_MODAL_EVENT, onExternalModalOpen)
    }
  }, [modalSource])

  useEffect(() => {
    if (!colorOpen) return

    const clampModalToViewport = () => {
      const rect = colorRef.current?.getBoundingClientRect?.()
      if (!rect) return
      setColorPos(prev => {
        const next = clampFixedModalPosition(prev, rect, MODAL_VIEWPORT_MARGIN)
        if (next.x === prev.x && next.y === prev.y) return prev
        return next
      })
    }

    const rafId = window.requestAnimationFrame(clampModalToViewport)
    window.addEventListener('resize', clampModalToViewport)
    return () => {
      window.cancelAnimationFrame(rafId)
      window.removeEventListener('resize', clampModalToViewport)
    }
  }, [colorOpen])

  const openColorPickerAt = e => {
    if (!canChangeQuoteColor) return
    e.preventDefault()
    e.stopPropagation()

    const rect = e.currentTarget.getBoundingClientRect()
    setColorPos(
      clampFixedModalPosition(
        { x: rect.left, y: rect.bottom + 8 },
        QUOTE_MODAL_ESTIMATED_SIZE,
        MODAL_VIEWPORT_MARGIN
      )
    )

    if (!colorOpen) announceModalOpen()
    setColorOpen(prev => !prev)
  }

  const applyColor = color => {
    if (!canChangeQuoteColor) return
    setCustomColor(color)
    updateAttributes({ bgColor: color })
  }

  const handleColorChange = e => {
    const color = e.target.value
    applyColor(color)
  }

  const handleColorInput = e => {
    const value = e.target.value
    if (value === '' || /^#[0-9A-F]{6}$/i.test(value)) {
      setCustomColor(value || DEFAULT_QUOTE_BG)
    }
  }

  const handleColorInputBlur = () => {
    if (!/^#[0-9A-F]{6}$/i.test(customColor)) {
      setCustomColor(bgColor || DEFAULT_QUOTE_BG)
      return
    }
    applyColor(customColor)
  }

  const resetColor = e => {
    if (!canChangeQuoteColor) return
    e.preventDefault()
    e.stopPropagation()
    updateAttributes({ bgColor: null })
    setCustomColor(DEFAULT_QUOTE_BG)
  }

  const startModalDrag = e => {
    e.preventDefault()
    e.stopPropagation()

    const rect = colorRef.current?.getBoundingClientRect?.()
    if (!rect) return

    dragOffset.current = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    }

    colorRef.current?.classList.add('dragging')
    document.body.classList.add('dragging-modal')

    const onDrag = event => {
      const modalRect = colorRef.current?.getBoundingClientRect?.()
      setColorPos(
        clampFixedModalPosition(
          {
            x: event.clientX - dragOffset.current.x,
            y: event.clientY - dragOffset.current.y,
          },
          modalRect || QUOTE_MODAL_ESTIMATED_SIZE,
          MODAL_VIEWPORT_MARGIN
        )
      )
    }

    const stopDrag = () => {
      colorRef.current?.classList.remove('dragging')
      document.body.classList.remove('dragging-modal')
      document.removeEventListener('mousemove', onDrag)
      document.removeEventListener('mouseup', stopDrag)
    }

    document.addEventListener('mousemove', onDrag)
    document.addEventListener('mouseup', stopDrag)
  }

  const clamp = (value, min, max) => Math.min(max, Math.max(min, value))

  const startResize = (e, side) => {
    if (!canEdit) return
    e.preventDefault()
    e.stopPropagation()

    const startX = e.clientX
    const wrapperEl = e.currentTarget?.closest?.('[data-node-view-wrapper]')
    if (!(wrapperEl instanceof HTMLElement)) return

    const proseMirrorEl = wrapperEl.closest('.ProseMirror') || wrapperEl.parentElement
    const maxWidth = Math.max(
      QUOTE_MIN_WIDTH,
      Math.floor(proseMirrorEl?.clientWidth || wrapperEl.clientWidth || 700)
    )

    const startRect = wrapperEl.getBoundingClientRect?.()
    const startWidth =
      typeof width === 'number' ? width : Math.round(startRect?.width || QUOTE_MIN_WIDTH)

    const move = event => {
      const deltaX = side === 'right' ? event.clientX - startX : startX - event.clientX
      const nextWidth = clamp(startWidth + deltaX, QUOTE_MIN_WIDTH, maxWidth)
      updateAttributes({ width: Math.round(nextWidth) })
    }

    const up = () => {
      document.removeEventListener('mousemove', move)
      document.removeEventListener('mouseup', up)
    }

    document.addEventListener('mousemove', move)
    document.addEventListener('mouseup', up)
  }

  const stopEditorEventPropagation = e => {
    e.stopPropagation()
  }

  return (
    <NodeViewWrapper
      as="blockquote"
      className={`quote-block block-resizable${canChangeQuoteColor ? ' quote-block--color-editable' : ''}`}
      style={{
        '--quote-bg-color': bg,
        '--quote-border-color': borderColor,
        '--quote-accent-color': accentColor,
        '--quote-button-fg': buttonColor,
        '--quote-text-color': textColor,
        '--quote-mark-color': textColor,
        backgroundColor: bg,
        borderColor,
        maxWidth: '100%',
        boxSizing: 'border-box',
        ...alignMargins,
        ...(typeof width === 'number' ? { width: Math.round(width) } : {}),
      }}
    >
      {canEdit && (
        <>
          <div className="block-resize left" contentEditable={false} onMouseDown={e => startResize(e, 'left')} />
          <div className="block-resize right" contentEditable={false} onMouseDown={e => startResize(e, 'right')} />
        </>
      )}

      {canChangeQuoteColor && (
        <button
          type="button"
          className="quote-color-btn"
          contentEditable={false}
          onMouseDown={e => {
            e.preventDefault()
            e.stopPropagation()
          }}
          onClick={openColorPickerAt}
          title="\u0426\u0432\u0435\u0442 \u0446\u0438\u0442\u0430\u0442\u044b"
          aria-label="\u0426\u0432\u0435\u0442 \u0446\u0438\u0442\u0430\u0442\u044b"
        >
          <PaletteOutlinedIcon
            aria-hidden="true"
            fontSize="inherit"
            style={{ width: 18, height: 18, fontSize: 18 }}
          />
        </button>
      )}

      <NodeViewContent className="quote-block-content" />

      {canChangeQuoteColor && colorOpen && (
        <div
          ref={colorRef}
          className="color-palette-modal"
          style={{
            top: `${colorPos.y}px`,
            left: `${colorPos.x}px`,
          }}
          onMouseDown={stopEditorEventPropagation}
          onKeyDown={stopEditorEventPropagation}
        >
          <div className="color-header" onMouseDown={startModalDrag}>
            <span className="color-title">{'\u0426\u0432\u0435\u0442 \u0446\u0438\u0442\u0430\u0442\u044b'}</span>
            <button
              className="color-close-btn"
              onMouseDown={e => {
                e.preventDefault()
                e.stopPropagation()
              }}
              onClick={e => {
                e.preventDefault()
                e.stopPropagation()
                setColorOpen(false)
              }}
              title="\u0417\u0430\u043a\u0440\u044b\u0442\u044c"
              type="button"
            >
              x
            </button>
          </div>

          <div className="color-preview-section">
            <div className="color-input-group">
              <input
                type="color"
                className="color-picker-input"
                value={customColor}
                onChange={handleColorChange}
                title="\u0412\u044b\u0431\u0440\u0430\u0442\u044c \u0446\u0432\u0435\u0442"
              />
              <input
                type="text"
                className="color-hex-input"
                value={customColor}
                onChange={handleColorInput}
                onBlur={handleColorInputBlur}
                placeholder="#RRGGBB"
                maxLength={7}
              />
            </div>
          </div>

          <div className="color-presets-section">
            <div className="color-presets-grid">
              {PRESET_COLORS.map(color => (
                <button
                  key={color}
                  type="button"
                  className={`color-preset${bgColor === color ? ' active' : ''}`}
                  style={{ backgroundColor: color }}
                  title={color}
                  onMouseDown={e => {
                    e.preventDefault()
                    e.stopPropagation()
                  }}
                  onClick={() => applyColor(color)}
                >
                  {bgColor === color ? <span className="color-check">v</span> : null}
                </button>
              ))}
            </div>
          </div>

          <div className="color-actions">
            <button
              type="button"
              className="color-reset-btn"
              onMouseDown={e => {
                e.preventDefault()
                e.stopPropagation()
              }}
              onClick={resetColor}
              title="\u041f\u043e \u0443\u043c\u043e\u043b\u0447\u0430\u043d\u0438\u044e"
            >
              {'\u041f\u043e \u0443\u043c\u043e\u043b\u0447\u0430\u043d\u0438\u044e'}
            </button>
          </div>
        </div>
      )}
    </NodeViewWrapper>
  )
}
