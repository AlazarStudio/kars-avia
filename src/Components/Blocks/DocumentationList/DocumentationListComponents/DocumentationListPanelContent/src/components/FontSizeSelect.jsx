import { useState, useRef, useEffect } from 'react'


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

  /* ================= APPLY ================= */

  const HEAD_BASE = { 1: 32, 2: 24, 3: 20, 4: 18, 5: 16, 6: 14 }

const getBaselineSize = () => {
  for (let lvl = 1; lvl <= 6; lvl++) {
    if (editor.isActive('heading', { level: lvl })) return HEAD_BASE[lvl]
  }
  return 16 // обычный текст
}

const applyFontSize = (value) => {
  const size = Math.min(MAX, Math.max(MIN, Number(value)))
  const baseline = getBaselineSize()

  setSelectedFontSize(String(size))
  setInputValue(String(size))

  // ✅ Убираем fontSize-mark только если размер равен базовому для текущего блока
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
  // если пусто — ничего не применяем (не трогаем marks)
  if (!inputValue) return

  // 🔥 если значение не менялось — НЕ применять заново (убирает “липкость”)
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
    
    // Сохраняем позицию клика для открытия модалки
    setClickPosition({
      x: e.clientX,
      y: e.clientY
    })
    
    setIsOpen(!isOpen)
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
    
    const modalWidth = modalRef.current?.offsetWidth || 280
    const modalHeight = modalRef.current?.offsetHeight || 400
    const viewportWidth = window.innerWidth
    const viewportHeight = window.innerHeight
    
    const boundedX = Math.max(0, Math.min(newX, viewportWidth - modalWidth))
    const boundedY = Math.max(0, Math.min(newY, viewportHeight - modalHeight))
    
    setPosition({ x: boundedX, y: boundedY })
  }

  const handleDragEnd = () => {
    setDragging(false)
  }

  /* ================= POSITION MODAL ================= */

  useEffect(() => {
    if (isOpen && modalRef.current) {
      const modalWidth = 280 // примерная ширина модалки
      const modalHeight = 400 // примерная высота модалки
      const viewportWidth = window.innerWidth
      const viewportHeight = window.innerHeight
      
      // Позиционируем модалку рядом с курсором
      let x = clickPosition.x + 10
      let y = clickPosition.y + 10
      
      // Проверяем, не выходит ли модалка за пределы экрана
      if (x + modalWidth > viewportWidth) {
        x = viewportWidth - modalWidth - 10
      }
      if (y + modalHeight > viewportHeight) {
        y = viewportHeight - modalHeight - 10
      }
      
      // Обеспечиваем минимальные отступы от краев
      x = Math.max(10, x)
      y = Math.max(10, y)
      
      setPosition({ x, y })
    }
  }, [isOpen, clickPosition])

  /* ================= OUTSIDE CLICK ================= */

  useEffect(() => {
    const onClick = (e) => {
      if (selectRef.current && !selectRef.current.contains(e.target)) {
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
          title="Выбрать размер из списка"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
            <path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z"/>
          </svg>
        </button>
        <div className="font-input-size-controls">
          <button 
            onClick={() => step(1)} 
            className="size-controls-btn-left"
            title="Увеличить размер шрифта"
          >
            +
          </button>
          <button 
            onClick={() => step(-1)} 
            className="size-controls-btn-right"
            title="Уменьшить размер шрифта"
          >
            −
          </button>
        </div>

      </div>

      {/* ===== DROPDOWN MODAL ===== */}
      {isOpen && (
        
          <div 
            ref={modalRef}
            className={`modal font-size-modal ${dragging ? 'dragging' : ''}`}
            style={{
              position: 'fixed',
              left: `${position.x}px`,
              top: `${position.y}px`,
              cursor: dragging ? 'grabbing' : 'default',
              zIndex: 9,
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
                <span>Размер шрифта</span>
                <button 
                  className="close-modal-btn"
                  onClick={(e) => {
                    e.stopPropagation()
                    setIsOpen(false)
                  }}
                >
                  ×
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
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                        </svg>
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
                  
                  // Проверяем, активен ли заголовок
                  const isHeading = editor.isActive('heading', { level: 1 }) ||
                                    editor.isActive('heading', { level: 2 }) ||
                                    editor.isActive('heading', { level: 3 }) ||
                                    editor.isActive('heading', { level: 4 }) ||
                                    editor.isActive('heading', { level: 5 }) ||
                                    editor.isActive('heading', { level: 6 });
                  
                  if (isHeading) {
                    // Для заголовков сбрасываем к размеру по умолчанию для этого уровня
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
                    // Для обычного текста сбрасываем размер
                    editor.chain().focus().unsetFontSize().run()
                    applyFontSize(16)
                  }
                  
                  setIsOpen(false)
                }}
              >
                Сбросить к стандартному
              </button>
            </div>
          </div>
        
      )}
    </div>
  )
}
