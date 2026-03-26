import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import ExpandMoreRoundedIcon from '@mui/icons-material/ExpandMoreRounded'
import CheckRoundedIcon from '@mui/icons-material/CheckRounded'
import { clampFixedModalPosition, MODAL_VIEWPORT_MARGIN } from '../utils/modalViewportClamp'

const SINGLE_MODAL_EVENT = 'doclist-single-modal-open'
const FONT_SIZE_MODAL_SOURCE = 'font-size-select'
const FONT_SIZE_MODAL_ESTIMATED_SIZE = { width: 280, height: 400 }

const fontSizeOptions = [
  '8','9','10','11','12','14','16','18','20','22','24','26','28','36','48','72'
]

const MIN = 6
const MAX = 200

export default function FontSizeSelect({ editor, selectedFontSize, setSelectedFontSize }) {
  const [isOpen, setIsOpen] = useState(false)
  const [inputValue, setInputValue] = useState(selectedFontSize || '16')
  const [dragging, setDragging] = useState(false)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const [clickPosition, setClickPosition] = useState({ x: 0, y: 0 })
  
  const selectRef = useRef(null)
  const modalRef = useRef(null)
  const inputRef = useRef(null)
  const triggerRef = useRef(null)
  const modalPortalTarget = typeof document !== 'undefined' ? document.body : null
  const renderModalPortal = (node) => {
    if (!node) return null
    return modalPortalTarget ? createPortal(node, modalPortalTarget) : node
  }

  const announceModalOpen = () => {
    try {
      window.dispatchEvent(
        new CustomEvent(SINGLE_MODAL_EVENT, {
          detail: { source: FONT_SIZE_MODAL_SOURCE },
        })
      )
    } catch {
      // ignore
    }
  }

  /* ================= APPLY ================= */

  const HEAD_BASE = { 1: 32, 2: 24, 3: 20, 4: 18, 5: 16, 6: 14 }

const getBaselineSize = () => {
  for (let lvl = 1; lvl <= 6; lvl++) {
    if (editor.isActive('heading', { level: lvl })) return HEAD_BASE[lvl]
  }
  return 16 // РѕР±С‹С‡РЅС‹Р№ С‚РµРєСЃС‚
}

const applyFontSize = (value) => {
  const size = Math.min(MAX, Math.max(MIN, Number(value)))
  const baseline = getBaselineSize()

  setSelectedFontSize(String(size))
  setInputValue(String(size))

  // вњ… РЈР±РёСЂР°РµРј fontSize-mark С‚РѕР»СЊРєРѕ РµСЃР»Рё СЂР°Р·РјРµСЂ СЂР°РІРµРЅ Р±Р°Р·РѕРІРѕРјСѓ РґР»СЏ С‚РµРєСѓС‰РµРіРѕ Р±Р»РѕРєР°
  if (size === baseline) {
    editor.chain().focus().unsetFontSize().run()
  } else {
    editor.chain().focus().setFontSize(size).run()
  }
}



  /* ================= STEP ================= */

  const step = (delta) => {
    const next = Number(inputValue || selectedFontSize || 16) + delta
    applyFontSize(next)
  }

  /* ================= INPUT ================= */

  const handleInputChange = (e) => {
    const v = e.target.value.replace(/\D/g, '')
    setInputValue(v)
  }

  const commitInput = () => {
  // РµСЃР»Рё РїСѓСЃС‚Рѕ вЂ” РЅРёС‡РµРіРѕ РЅРµ РїСЂРёРјРµРЅСЏРµРј (РЅРµ С‚СЂРѕРіР°РµРј marks)
  if (!inputValue) return

  // рџ”Ґ РµСЃР»Рё Р·РЅР°С‡РµРЅРёРµ РЅРµ РјРµРЅСЏР»РѕСЃСЊ вЂ” РќР• РїСЂРёРјРµРЅСЏС‚СЊ Р·Р°РЅРѕРІРѕ (СѓР±РёСЂР°РµС‚ вЂњР»РёРїРєРѕСЃС‚СЊвЂќ)
  if (String(inputValue) === String(selectedFontSize)) return

  applyFontSize(inputValue)
}


  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      commitInput()
      inputRef.current.blur()
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault()
      step(1)
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      step(-1)
    }
  }

  /* ================= OPEN MODAL ================= */

  const handleOpenModal = (e) => {
    e.stopPropagation()
    
    // РЎРѕС…СЂР°РЅСЏРµРј РїРѕР·РёС†РёСЋ РєР»РёРєР° РґР»СЏ РѕС‚РєСЂС‹С‚РёСЏ РјРѕРґР°Р»РєРё
    setClickPosition({
      x: e.clientX,
      y: e.clientY
    })

    if (!isOpen) {
      announceModalOpen()
    }
    setIsOpen(prev => !prev)
  }

  /* ================= DRAG AND DROP ================= */

  const handleDragStart = (e) => {
    if (!modalRef.current) return
    
    const modalRect = modalRef.current.getBoundingClientRect()
    setDragging(true)
    setDragOffset({
      x: e.clientX - modalRect.left,
      y: e.clientY - modalRect.top
    })
    
    e.preventDefault()
  }

  const handleDrag = (e) => {
    if (!dragging) return
    
    const newX = e.clientX - dragOffset.x
    const newY = e.clientY - dragOffset.y
    
    const modalSize = {
      width: modalRef.current?.offsetWidth || FONT_SIZE_MODAL_ESTIMATED_SIZE.width,
      height: modalRef.current?.offsetHeight || FONT_SIZE_MODAL_ESTIMATED_SIZE.height,
    }

    setPosition(
      clampFixedModalPosition(
        { x: newX, y: newY },
        modalSize,
        MODAL_VIEWPORT_MARGIN
      )
    )
  }

  const handleDragEnd = () => {
    setDragging(false)
  }

    /* ================= POSITION MODAL ================= */

  useEffect(() => {
    if (isOpen && modalRef.current) {
      const rect = modalRef.current.getBoundingClientRect()
      setPosition(
        clampFixedModalPosition(
          { x: clickPosition.x + 10, y: clickPosition.y + 10 },
          {
            width: rect?.width || FONT_SIZE_MODAL_ESTIMATED_SIZE.width,
            height: rect?.height || FONT_SIZE_MODAL_ESTIMATED_SIZE.height,
          },
          MODAL_VIEWPORT_MARGIN
        )
      )
    }
  }, [isOpen, clickPosition])

  useEffect(() => {
    if (!isOpen) return

    const clampModalToViewport = () => {
      const rect = modalRef.current?.getBoundingClientRect?.()
      if (!rect) return
      setPosition(prev => {
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
  }, [isOpen])

  /* ================= OUTSIDE CLICK ================= */

  useEffect(() => {
    const onClick = (e) => {
      const clickedInsideSelect = selectRef.current && selectRef.current.contains(e.target)
      const clickedInsideModal = modalRef.current && modalRef.current.contains(e.target)

      if (!clickedInsideSelect && !clickedInsideModal) {
        setIsOpen(false)
        commitInput()
      }
    }
    document.addEventListener('click', onClick)
    return () => document.removeEventListener('click', onClick)
  }, [inputValue])

  /* ================= SYNC FROM OUTSIDE ================= */

  useEffect(() => {
    setInputValue(selectedFontSize || '16')
  }, [selectedFontSize])

  useEffect(() => {
    const onExternalModalOpen = (event) => {
      if (event?.detail?.source === FONT_SIZE_MODAL_SOURCE) return
      if (!isOpen) return
      setIsOpen(false)
      commitInput()
    }

    window.addEventListener(SINGLE_MODAL_EVENT, onExternalModalOpen)
    return () => {
      window.removeEventListener(SINGLE_MODAL_EVENT, onExternalModalOpen)
    }
  }, [isOpen, inputValue, selectedFontSize])

  /* ================= DRAG EVENT LISTENERS ================= */

  useEffect(() => {
    if (dragging) {
      document.addEventListener('mousemove', handleDrag)
      document.addEventListener('mouseup', handleDragEnd)
      
      return () => {
        document.removeEventListener('mousemove', handleDrag)
        document.removeEventListener('mouseup', handleDragEnd)
      }
    }
  }, [dragging, dragOffset])

  /* ================= RENDER ================= */

  return (
    <div className="custom-select-container" ref={selectRef}>
      
      {/* ===== INPUT + STEPPER ===== */}
      <div className="toolbar-group">

        <div className="font-size-input-wrapper">
          <input
            ref={inputRef}
            value={inputValue}
            onChange={handleInputChange}
            onBlur={commitInput}
            onKeyDown={handleKeyDown}
            inputMode="numeric"
            className="font-size-input"
          />
          <span className="font-size-unit">px</span>
        </div>


        <button
          ref={triggerRef}
          className="color-select-btn"
          onClick={handleOpenModal}
          title="Р’С‹Р±СЂР°С‚СЊ СЂР°Р·РјРµСЂ РёР· СЃРїРёСЃРєР°"
        >
          <>
            {/* Legacy SVG icon:
            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
              <path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z"/>
            </svg>
            */}
            <ExpandMoreRoundedIcon
              aria-hidden="true"
              fontSize="inherit"
              style={{ width: 12, height: 12, fontSize: 12 }}
            />
          </>
        </button>
        <div className="font-input-size-controls">
          <button 
            onClick={() => step(1)} 
            className="size-controls-btn-left"
            title="РЈРІРµР»РёС‡РёС‚СЊ СЂР°Р·РјРµСЂ С€СЂРёС„С‚Р°"
          >
            +
          </button>
          <button 
            onClick={() => step(-1)} 
            className="size-controls-btn-right"
            title="РЈРјРµРЅСЊС€РёС‚СЊ СЂР°Р·РјРµСЂ С€СЂРёС„С‚Р°"
          >
            -
          </button>
        </div>

      </div>

      {/* ===== DROPDOWN MODAL ===== */}
      {isOpen && renderModalPortal(
        
          <div 
            ref={modalRef}
            className={`modal font-size-modal ${dragging ? 'dragging' : ''}`}
            style={{
              position: 'fixed',
              left: `${position.x}px`,
              top: `${position.y}px`,
              cursor: dragging ? 'grabbing' : 'default',
              zIndex: 2147483000,
              animation: 'fadeIn 0.2s ease-out'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div 
              className="modal-drag-handle"
              onMouseDown={handleDragStart}
              style={{ 
                cursor: dragging ? 'grabbing' : 'grab',
                userSelect: 'none'
              }}
            >
              <div className="modal-header">
                <span>Р Р°Р·РјРµСЂ С€СЂРёС„С‚Р°</span>
                <button 
                  className="close-modal-btn"
                  onClick={(e) => {
                    e.stopPropagation()
                    setIsOpen(false)
                  }}
                >
                  Г—
                </button>
              </div>
            </div>
            
            <div className="modal-content">
              <div className="dropdown-content">
                {fontSizeOptions.map((size) => (
                  <div
                    key={size}
                    className={`dropdown-item ${
                      selectedFontSize === size ? 'selected' : ''
                    }`}
                    style={{
                      animationDelay: `${fontSizeOptions.indexOf(size) * 20}ms`,
                      animationName: 'slideInUp',
                      animationDuration: '300ms',
                      animationFillMode: 'both',
                      animationTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)'
                    }}
                    onClick={(e) => {
                      e.stopPropagation()
                      applyFontSize(size)
                      setIsOpen(false)
                    }}
                  >
                    <div 
                      className="option-preview" 
                      style={{ fontSize: `${size}px` }}
                    >
                      Aa
                    </div>
                    <div className="option-details">
                      <span className="option-label">{size}px</span>
                      <span className="option-value">{size}px</span>
                    </div>
                    {selectedFontSize === size && (
                      <div className="checkmark">
                        <>
                          {/* Legacy SVG icon:
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                          </svg>
                          */}
                          <CheckRoundedIcon
                            aria-hidden="true"
                            fontSize="inherit"
                            style={{ width: 16, height: 16, fontSize: 16 }}
                          />
                        </>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
            
            <div className="modal-footer">
              <button 
                className="reset-btn"
                onClick={(e) => {
                  e.stopPropagation()
                  
                  // РџСЂРѕРІРµСЂСЏРµРј, Р°РєС‚РёРІРµРЅ Р»Рё Р·Р°РіРѕР»РѕРІРѕРє
                  const isHeading = editor.isActive('heading', { level: 1 }) ||
                                    editor.isActive('heading', { level: 2 }) ||
                                    editor.isActive('heading', { level: 3 }) ||
                                    editor.isActive('heading', { level: 4 }) ||
                                    editor.isActive('heading', { level: 5 }) ||
                                    editor.isActive('heading', { level: 6 });
                  
                  if (isHeading) {
                    // Р”Р»СЏ Р·Р°РіРѕР»РѕРІРєРѕРІ СЃР±СЂР°СЃС‹РІР°РµРј Рє СЂР°Р·РјРµСЂСѓ РїРѕ СѓРјРѕР»С‡Р°РЅРёСЋ РґР»СЏ СЌС‚РѕРіРѕ СѓСЂРѕРІРЅСЏ
                    let fontSize = '16';
                    if (editor.isActive('heading', { level: 1 })) fontSize = '32';
                    else if (editor.isActive('heading', { level: 2 })) fontSize = '24';
                    else if (editor.isActive('heading', { level: 3 })) fontSize = '20';
                    else if (editor.isActive('heading', { level: 4 })) fontSize = '18';
                    else if (editor.isActive('heading', { level: 5 })) fontSize = '16';
                    else if (editor.isActive('heading', { level: 6 })) fontSize = '14';
                    
                    editor.chain().focus().setFontSize(parseInt(fontSize)).run()
                    applyFontSize(fontSize)
                  } else {
                    // Р”Р»СЏ РѕР±С‹С‡РЅРѕРіРѕ С‚РµРєСЃС‚Р° СЃР±СЂР°СЃС‹РІР°РµРј СЂР°Р·РјРµСЂ
                    editor.chain().focus().unsetFontSize().run()
                    applyFontSize(16)
                  }
                  
                  setIsOpen(false)
                }}
              >
                РЎР±СЂРѕСЃРёС‚СЊ Рє СЃС‚Р°РЅРґР°СЂС‚РЅРѕРјСѓ
              </button>
            </div>
          </div>
        
      )}
    </div>
  )
}

