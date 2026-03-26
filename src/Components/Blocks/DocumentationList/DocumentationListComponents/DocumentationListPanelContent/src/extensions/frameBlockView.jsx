// src/extensions/frameBlockView.jsx
import { NodeViewWrapper, NodeViewContent } from '@tiptap/react'
import { useEffect, useId, useRef, useState } from 'react'
import EmojiPicker from 'emoji-picker-react'
import PaletteOutlinedIcon from '@mui/icons-material/PaletteOutlined'
import './frameBlock.css'
import './blockResize.css'

const SINGLE_MODAL_EVENT = 'doclist-single-modal-open'

function hexToRgb(hex) {
  if (!hex) return null
  let h = hex.replace('#', '').trim()
  if (h.length === 3) h = h.split('').map(c => c + c).join('')
  if (h.length !== 6) return null
  const r = parseInt(h.slice(0, 2), 16)
  const g = parseInt(h.slice(2, 4), 16)
  const b = parseInt(h.slice(4, 6), 16)
  if ([r, g, b].some(n => Number.isNaN(n))) return null
  return { r, g, b }
}

function rgbToHex(r, g, b) {
  return '#' + [r, g, b].map(x => {
    const hex = x.toString(16)
    return hex.length === 1 ? '0' + hex : hex
  }).join('')
}

export default function FrameBlockView({ editor, node, updateAttributes }) {
  const canEdit = editor?.isEditable ?? false
  const emoji = node.attrs.emoji || '💡'
  const bgColor = node.attrs.bgColor || null
  const width = typeof node.attrs.width === 'number' ? node.attrs.width : 520
  const height = typeof node.attrs.height === 'number' ? node.attrs.height : null
  const textAlign = node.attrs.textAlign || 'left'

  const alignMargins =
    textAlign === 'center'
      ? { marginLeft: 'auto', marginRight: 'auto' }
      : textAlign === 'right'
        ? { marginLeft: 'auto', marginRight: 0 }
        : { marginLeft: 0, marginRight: 'auto' }

  const [emojiOpen, setEmojiOpen] = useState(false)
  const [colorOpen, setColorOpen] = useState(false)
  const [customColor, setCustomColor] = useState(bgColor || '#F9FAFB')

  const pickerRef = useRef(null)
  const colorRef = useRef(null)
  const modalSourceId = useId()
  const modalSource = `frame-block-${modalSourceId}`

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

  // draggable positions for modals
  const [pickerPos, setPickerPos] = useState({ x: 120, y: 120 })
  const [colorPos, setColorPos] = useState({ x: 0, y: 60 })

  const bg = bgColor || '#F9FAFB'
  const border = 'rgba(0, 0, 0, 0.15)'

  /* ================= CLOSE ON OUTSIDE ================= */
  useEffect(() => {
    const close = e => {
      const t = e.target
      if (!(t instanceof Element)) return

      // Не закрываем если кликнули на кнопку закрытия
      if (t.closest('.color-close-btn') || t.closest('.emoji-close-btn')) {
        return
      }

      if (emojiOpen && pickerRef.current && !pickerRef.current.contains(t)) {
        setEmojiOpen(false)
      }
      if (colorOpen && colorRef.current && !colorRef.current.contains(t)) {
        setColorOpen(false)
      }
    }

    if (emojiOpen || colorOpen) {
      document.addEventListener('mousedown', close)
      return () => document.removeEventListener('mousedown', close)
    }
  }, [emojiOpen, colorOpen])

  useEffect(() => {
    const onExternalModalOpen = event => {
      if (event?.detail?.source === modalSource) return
      setEmojiOpen(false)
      setColorOpen(false)
    }

    window.addEventListener(SINGLE_MODAL_EVENT, onExternalModalOpen)
    return () => {
      window.removeEventListener(SINGLE_MODAL_EVENT, onExternalModalOpen)
    }
  }, [modalSource])

  // Обновляем кастомный цвет при изменении bgColor
  useEffect(() => {
    if (bgColor && bgColor !== customColor) {
      setCustomColor(bgColor)
    }
  }, [bgColor])

  /* ================= DRAG HANDLERS ================= */
  const createDragHandler = (modalRef, setPosition, dragClass) => (e) => {
    e.preventDefault()
    e.stopPropagation()

    const el = modalRef.current
    if (!el) return

    const rect = el.getBoundingClientRect()
    const offsetX = e.clientX - rect.left
    const offsetY = e.clientY - rect.top

    el.classList.add(dragClass)
    document.body.classList.add('dragging-modal')

    const preventSelect = ev => ev.preventDefault()
    document.addEventListener('selectstart', preventSelect, true)

    const onDrag = ev => {
      ev.preventDefault()
      const x = ev.clientX - offsetX
      const y = ev.clientY - offsetY
      
      // Keep modal within viewport
      const maxX = window.innerWidth - rect.width
      const maxY = window.innerHeight - rect.height
      
      setPosition({
        x: Math.max(0, Math.min(x, maxX)),
        y: Math.max(0, Math.min(y, maxY))
      })
    }

    const stopDrag = () => {
      el.classList.remove(dragClass)
      document.body.classList.remove('dragging-modal')
      document.removeEventListener('mousemove', onDrag)
      document.removeEventListener('mouseup', stopDrag)
      document.removeEventListener('selectstart', preventSelect, true)
    }

    document.addEventListener('mousemove', onDrag)
    document.addEventListener('mouseup', stopDrag)
  }

  const startEmojiDrag = createDragHandler(pickerRef, setPickerPos, 'dragging')
  const startColorDrag = createDragHandler(colorRef, setColorPos, 'dragging')

  /* ================= OPEN EMOJI PICKER ================= */
  const openEmojiPickerAt = e => {
    e.preventDefault()
    e.stopPropagation()
    if (!canEdit) return

    const rect = e.currentTarget.getBoundingClientRect()
    const margin = 12
    const modalW = 420
    const modalH = 380

    let x = rect.left
    let y = rect.bottom + 8

    const maxX = window.innerWidth - modalW - margin
    const maxY = window.innerHeight - modalH - margin

    x = Math.max(margin, Math.min(x, maxX))
    y = Math.max(margin, Math.min(y, maxY))

    setPickerPos({ x, y })
    if (!emojiOpen) announceModalOpen()
    setEmojiOpen(v => !v)
    setColorOpen(false)
  }

  /* ================= COLOR PICKER ================= */
  const toggleColor = e => {
    e.preventDefault()
    e.stopPropagation()
    if (!canEdit) return
    
    if (!colorOpen) {
      // Position color palette relative to button
      const rect = e.currentTarget.getBoundingClientRect()
      const margin = 12
      const modalW = 360
      const modalH = 400

      let x = rect.left
      let y = rect.bottom + 8

      const maxX = window.innerWidth - modalW - margin
      const maxY = window.innerHeight - modalH - margin

      x = Math.max(margin, Math.min(x, maxX))
      y = Math.max(margin, Math.min(y, maxY))

      setColorPos({ x, y })
    }
    
    if (!colorOpen) announceModalOpen()
    setColorOpen(v => !v)
    setEmojiOpen(false)
  }

  const handleColorChange = (e) => {
    const color = e.target.value
    setCustomColor(color)
    updateAttributes({ bgColor: color })
  }

  const handleColorInput = (e) => {
    const value = e.target.value
    if (value === '' || /^#[0-9A-F]{6}$/i.test(value)) {
      setCustomColor(value || '#F9FAFB')
    }
  }

  const handleBlur = () => {
    if (!/^#[0-9A-F]{6}$/i.test(customColor)) {
      setCustomColor(bgColor || '#F9FAFB')
    }
  }

  const resetColor = e => {
    e.preventDefault()
    e.stopPropagation()
    updateAttributes({ bgColor: null })
    setCustomColor('#F9FAFB')
  }

  // Предустановленные цвета для быстрого выбора
  const presetColors = [
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
    '#22D3EE', '#06B6D4', '#0891B2', '#0E7490'
  ]

  const applyPresetColor = (color) => {
    setCustomColor(color)
    updateAttributes({ bgColor: color })
  }

  const stopEditorEventPropagation = (e) => {
    e.stopPropagation()
  }

  /* ================= RESIZE ================= */

  const clamp = (value, min, max) => Math.min(max, Math.max(min, value))

  const startResize = (e, side) => {
    e.preventDefault()
    e.stopPropagation()
    if (!canEdit) return

    const startX = e.clientX
    const startY = e.clientY

    const wrapperEl = e.currentTarget?.closest?.('[data-node-view-wrapper]')
    const proseMirrorEl = wrapperEl?.closest?.('.ProseMirror') || wrapperEl?.parentElement
    const maxWidth = Math.max(280, Math.floor(proseMirrorEl?.clientWidth || 700))

    const startRect = wrapperEl?.getBoundingClientRect?.()
    const startWidth = width
    const startHeight = typeof height === 'number' ? height : Math.round(startRect?.height || 80)
    const isLeft = side.includes('left')
    const isRight = side.includes('right')
    const isTop = side.includes('top')
    const isBottom = side.includes('bottom')

    const move = ev => {
      let deltaX = 0
      let deltaY = 0

      if (isRight) deltaX = ev.clientX - startX
      if (isLeft) deltaX = startX - ev.clientX
      if (isBottom) deltaY = ev.clientY - startY
      if (isTop) deltaY = startY - ev.clientY

      const nextWidth = clamp(startWidth + deltaX, 280, maxWidth)
      const nextHeight = clamp(startHeight + deltaY, 60, 900)

      const nextAttrs = {}
      if (isLeft || isRight) nextAttrs.width = Math.round(nextWidth)
      if (isTop || isBottom) nextAttrs.height = Math.round(nextHeight)
      updateAttributes(nextAttrs)
    }

    const up = () => {
      document.removeEventListener('mousemove', move)
      document.removeEventListener('mouseup', up)
    }

    document.addEventListener('mousemove', move)
    document.addEventListener('mouseup', up)
  }

  return (
    <NodeViewWrapper
      className="frame-block block-resizable"
      data-frame-block="true"
      style={{ 
        backgroundColor: bg, 
        borderColor: border,
        borderWidth: '2px',
        borderStyle: 'solid',
        width,
        ...alignMargins,
        minHeight: typeof height === 'number' ? height : undefined,
      }}
    >
      {/* RESIZE HANDLES - только для суперадмина */}
      {canEdit && (
        <>
          <div className="block-resize left" contentEditable={false} onMouseDown={e => startResize(e, 'left')} />
          <div className="block-resize right" contentEditable={false} onMouseDown={e => startResize(e, 'right')} />
          <div className="block-resize top" contentEditable={false} onMouseDown={e => startResize(e, 'top')} />
          <div className="block-resize bottom" contentEditable={false} onMouseDown={e => startResize(e, 'bottom')} />
          <div className="block-resize corner top-left" contentEditable={false} onMouseDown={e => startResize(e, 'top-left')} />
          <div className="block-resize corner top-right" contentEditable={false} onMouseDown={e => startResize(e, 'top-right')} />
          <div className="block-resize corner bottom-left" contentEditable={false} onMouseDown={e => startResize(e, 'bottom-left')} />
          <div className="block-resize corner bottom-right" contentEditable={false} onMouseDown={e => startResize(e, 'bottom-right')} />
        </>
      )}

      <div className="frame-left">
        <button
          className="emoji-btn"
          onMouseDown={e => e.preventDefault()}
          onClick={openEmojiPickerAt}
          title={canEdit ? "Изменить эмодзи" : undefined}
        >
          {emoji}
        </button>

        {canEdit && (
        <div className="frame-controls">
          <button
            className="control-btn"
            onMouseDown={e => e.preventDefault()}
            onClick={toggleColor}
            title="Цвет фона"
          >
            <>
              {/* Legacy SVG icon:
              <svg 
                width="20" 
                height="20" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round"
              >
                <circle cx="13.5" cy="6.5" r=".5" />
                <circle cx="17.5" cy="10.5" r=".5" />
                <circle cx="8.5" cy="7.5" r=".5" />
                <circle cx="6.5" cy="12.5" r=".5" />
                <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z" />
              </svg>
              */}
              <PaletteOutlinedIcon
                aria-hidden="true"
                fontSize="inherit"
                style={{ width: 20, height: 20, fontSize: 20 }}
              />
            </>
          </button>
        </div>
        )}
      </div>

      {colorOpen && (
        <div 
          ref={colorRef} 
          className="color-palette-modal"
          onMouseDown={stopEditorEventPropagation}
          onKeyDown={stopEditorEventPropagation}
          style={{ 
            top: `${colorPos.y}px`, 
            left: `${colorPos.x}px`,
            position: 'fixed'
          }}
        >
          <div 
            className="color-header"
            onMouseDown={startColorDrag}
          >
            <span className="color-title">Выберите цвет фона</span>
            <button
              className="color-close-btn"
              onMouseDown={e => {
                e.preventDefault()
                e.stopPropagation()
              }}
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                setColorOpen(false)
              }}
              title="Закрыть"
            >
              ×
            </button>
          </div>
          
          <div className="color-preview-section">
            <div className="color-input-group">
              <input
                type="color"
                className="color-picker-input"
                value={customColor}
                onChange={handleColorChange}
                title="Выберите цвет"
              />
              <input
                type="text"
                className="color-hex-input"
                value={customColor}
                onChange={handleColorInput}
                onBlur={handleBlur}
                placeholder="#RRGGBB"
                maxLength={7}
              />
            </div>
          </div>

          <div className="color-presets-section">
            <div className="color-presets-grid">
              {presetColors.map((color, index) => (
                <button
                  key={index}
                  className={`color-preset ${bgColor === color ? 'active' : ''}`}
                  onMouseDown={e => e.preventDefault()}
                  onClick={() => applyPresetColor(color)}
                  title={color}
                  style={{ backgroundColor: color }}
                >
                  {bgColor === color && (
                    <div className="color-check">✓</div>
                  )}
                </button>
              ))}
            </div>
          </div>

          <div className="color-actions">
            <button
              className="color-reset-btn"
              onMouseDown={e => e.preventDefault()}
              onClick={resetColor}
              title="Вернуть цвет по умолчанию"
            >
              По умолчанию
            </button>
          </div>
        </div>
      )}

      <div className="frame-content">
        <NodeViewContent />
      </div>

      {emojiOpen && (
        <div
          ref={pickerRef}
          className="emoji-picker-modal"
          onMouseDown={stopEditorEventPropagation}
          onKeyDown={stopEditorEventPropagation}
          style={{ 
            top: `${pickerPos.y}px`, 
            left: `${pickerPos.x}px`,
            position: 'fixed'
          }}
        >
          <div 
            className="emoji-picker-header" 
            onMouseDown={startEmojiDrag}
          >
            <span>Выберите эмодзи</span>
            <button
              className="emoji-close-btn"
              onMouseDown={e => {
                e.preventDefault()
                e.stopPropagation()
              }}
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                setEmojiOpen(false)
              }}
              title="Закрыть"
            >
              ×
            </button>
          </div>

          <div className="emoji-picker-scroll">
            <EmojiPicker
              onEmojiClick={e => {
                updateAttributes({ emoji: e.emoji })
                setEmojiOpen(false)
              }}
              theme="light"
              previewConfig={{ showPreview: false }}
              height="100%"
              width="100%"
            />
          </div>
        </div>
      )}
    </NodeViewWrapper>
  )
}
