import { useEffect, useState, useRef } from 'react'
import { createPortal } from 'react-dom'
import './ImageViewer.css'

const wrapIndex = (value, length) => {
  if (!Number.isFinite(length) || length <= 0) return 0
  const mod = value % length
  return mod < 0 ? mod + length : mod
}

export default function ImageViewer({
  images = [],
  index = 0,
  onClose,
}) {
  const [current, setCurrent] = useState(() => wrapIndex(index, images.length))
  const [scale, setScale] = useState(1)
  const [rotate, setRotate] = useState(0)
  const [copied, setCopied] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const imageRef = useRef(null)
  const containerRef = useRef(null)
  const backdropRef = useRef(null)

  const src = images[current]
  const isGallery = images.length > 1
  const rotateNormalized = ((rotate % 360) + 360) % 360
  const isDefaultScale = scale === 1 && rotateNormalized === 0 && position.x === 0 && position.y === 0
  const canDrag = scale > 1 // Можно перетаскивать только при увеличении
  

  useEffect(() => {
    setCurrent(wrapIndex(index, images.length))
  }, [index, images.length])

  useEffect(() => {
    const onKey = e => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowRight' && isGallery)
        setCurrent(v => wrapIndex(v + 1, images.length))
      if (e.key === 'ArrowLeft' && isGallery)
        setCurrent(v => wrapIndex(v - 1, images.length))
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [images.length, onClose, isGallery])

  useEffect(() => {
    if (backdropRef.current) {
      backdropRef.current.focus()
    }
  }, [])

  // Сброс позиции при смене картинки
  useEffect(() => {
    setPosition({ x: 0, y: 0 })
    setScale(1)
    setRotate(0)
  }, [current])

  const download = () => {
    const a = document.createElement('a')
    a.href = src
    a.download = 'image'
    a.click()
  }

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(src)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Ошибка копирования:', err)
      const textArea = document.createElement('textarea')
      textArea.value = src
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const resetTransform = () => {
    if (isDefaultScale) return
    setScale(1)
    setPosition({ x: 0, y: 0 })
    setRotate(r => 360 * Math.round(r / 360))
  }

  const zoomIn = () => {
    if (scale >= 5) return // Максимальный масштаб 5x
    setScale(s => Math.min(5, s + 0.5)) // Увеличиваем на 50%
    // При сильном увеличении сбрасываем позицию к центру
    if (scale >= 2) {
      setPosition({ x: 0, y: 0 })
    }
  }

  const zoomOut = () => {
    if (scale <= 0.1) return // Минимальный масштаб 0.1x
    setScale(s => Math.max(0.1, s - 0.5)) // Уменьшаем на 50%
    // При уменьшении до 100% или меньше сбрасываем позицию
    if (scale <= 1) {
      setPosition({ x: 0, y: 0 })
    }
  }

  // Обработчики для перетаскивания
  const handleMouseDown = (e) => {
    if (!canDrag) return
    
    e.preventDefault()
    setIsDragging(true)
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y
    })
    
    // Меняем курсор на "захваченный"
    if (imageRef.current) {
      imageRef.current.style.cursor = 'grabbing'
    }
  }

  const handleMouseMove = (e) => {
    if (!isDragging || !canDrag) return
    
    const newX = e.clientX - dragStart.x
    const newY = e.clientY - dragStart.y
    
    // Ограничиваем перемещение границами изображения
    if (imageRef.current && containerRef.current) {
      const imgRect = imageRef.current.getBoundingClientRect()
      const containerRect = containerRef.current.getBoundingClientRect()
      
      // Максимальное смещение, чтобы картинка не уходила за границы
      const maxX = Math.max(0, (imgRect.width - containerRect.width) / 2)
      const maxY = Math.max(0, (imgRect.height - containerRect.height) / 2)
      
      setPosition({
        x: Math.max(-maxX, Math.min(maxX, newX)),
        y: Math.max(-maxY, Math.min(maxY, newY))
      })
    } else {
      setPosition({ x: newX, y: newY })
    }
  }

  const handleMouseUp = () => {
    setIsDragging(false)
    if (imageRef.current) {
      imageRef.current.style.cursor = canDrag ? 'grab' : 'default'
    }
  }

  // Добавляем обработчики для перетаскивания
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      return () => {
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
      }
    }
  }, [isDragging, dragStart])

  // Обработчик клика на картинку для сброса позиции при double click
  const handleImageDoubleClick = (e) => {
    e.stopPropagation()
    if (scale > 1) {
      // Если увеличен - сбрасываем к 100%
      resetTransform()
    } else {
      // Если 100% - увеличиваем до 200%
      setScale(2)
    }
  }

  return createPortal(
    <div
      ref={backdropRef}
      className="viewer-backdrop"
      tabIndex={-1}
      onClick={onClose}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
    >
      {/* Информация об изображении */}
      {isGallery && (
        <div className="viewer-info">
          {current + 1} / {images.length}
        </div>
      )}

      {/* Основная область с изображением */}
      <div 
        ref={containerRef}
        className="viewer-main" 
        onClick={e => e.stopPropagation()}
        style={{
          cursor: canDrag ? (isDragging ? 'grabbing' : 'grab') : 'default',
          overflow: 'hidden'
        }}
      >
        {/* Изображение */}
        <img
          ref={imageRef}
          src={src}
          style={{
            transform: `scale(${scale}) rotate(${rotate}deg) translate(${position.x}px, ${position.y}px)`,
            cursor: canDrag ? (isDragging ? 'grabbing' : 'grab') : 'default',
            transition: isDragging ? 'none' : 'transform 0.2s ease'
          }}
          className="viewer-image"
          onClick={e => e.stopPropagation()}
          onDoubleClick={handleImageDoubleClick}
          onMouseDown={handleMouseDown}
        />

        {/* Кнопки навигации для галереи */}
        {isGallery && (
          <>
            <button
              className="viewer-nav left"
              data-viewer-icon="chevron-left"
              onClick={e => {
                e.stopPropagation()
                setCurrent(v => wrapIndex(v - 1, images.length))
              }}
            >
              ‹
            </button>
            <button
              className="viewer-nav right"
              data-viewer-icon="chevron-right"
              onClick={e => {
                e.stopPropagation()
                setCurrent(v => wrapIndex(v + 1, images.length))
              }}
            >
              ›
            </button>
          </>
        )}

        {/* Индикатор для галереи */}
        {isGallery && (
          <div className="viewer-indicator">
            {images.map((_, i) => (
              <div
                key={i}
                className={`viewer-indicator-dot ${i === current ? 'active' : ''}`}
                onClick={e => {
                  e.stopPropagation()
                  setCurrent(i)
                }}
              />
            ))}
          </div>
        )}

        {/* Индикатор масштаба и позиции */}
        <div className="scale-indicator">
          {Math.round(scale * 100)}%
          {position.x !== 0 || position.y !== 0 ? ' • ПАН' : ''}
        </div>
      </div>

      {/* Панель кнопок ПРИКРЕПЛЕНА К НИЗУ экрана */}
      <div className="viewer-toolbar" onClick={e => e.stopPropagation()}>
        <button 
          data-viewer-icon="plus"
          onClick={zoomIn} 
          title="Приблизить (50%)"
          disabled={scale >= 5}
        >
          <span style={{ fontSize: '24px' }}>+</span>
          {/* <span style={{ fontSize: '12px', opacity: 0.8 }}>Увеличить</span> */}
        </button>
        <button 
          data-viewer-icon="minus"
          onClick={zoomOut} 
          title="Отдалить (50%)"
          disabled={scale <= 0.1}
        >
          <span style={{ fontSize: '24px' }}>−</span>
          {/* <span style={{ fontSize: '12px', opacity: 0.8 }}>Уменьшить</span> */}
        </button>
        
        
        <button 
          data-viewer-icon="rotate-left"
          onClick={() => setRotate(r => r - 90)} 
          title="Повернуть влево"
        >
          <span style={{ fontSize: '20px' }}>↺</span>
          {/* <span style={{ fontSize: '12px', opacity: 0.8 }}>Влево</span> */}
        </button>
        
        <button 
          data-viewer-icon="rotate-right"
          onClick={() => setRotate(r => r + 90)} 
          title="Повернуть вправо"
        >
          <span style={{ fontSize: '20px' }}>↻</span>
          {/* <span style={{ fontSize: '12px', opacity: 0.8 }}>Вправо</span> */}
        </button>
        
        <button 
          data-viewer-icon="reset"
          onClick={resetTransform} 
          title="Сбросить масштаб и поворот"
          disabled={isDefaultScale}
          className={isDefaultScale ? 'disabled-btn' : ''}
        >
          <span style={{ fontSize: '20px' }}>⟳</span>
          {/* <span style={{ fontSize: '12px', opacity: 0.8 }}>Сброс</span> */}
        </button>
        
        <div style={{ width: '1px', height: '24px', background: 'rgba(255,255,255,0.3)', margin: '0 8px' }} />
        
        <button 
          data-viewer-icon="download"
          onClick={download} 
          title="Скачать"
        >
          <span style={{ fontSize: '20px' }}>⬇</span>
          {/* <span style={{ fontSize: '12px', opacity: 0.8 }}>Скачать</span> */}
        </button>
        
        <button 
          data-viewer-icon={copied ? 'check' : 'link'}
          onClick={copy} 
          title={copied ? "Скопировано!" : "Скопировать URL"}
          style={{ 
            background: copied ? 'rgba(34, 197, 94, 0.3)' : 'rgba(255, 255, 255, 0.15)',
            color: copied ? '#4ade80' : 'white'
          }}
        >
          <span style={{ fontSize: '20px' }}>{copied ? '✓' : '🔗'}</span>
          <span style={{ fontSize: '12px', opacity: 0.8, marginLeft:'-8px'}}>
            {copied ? 'Скопировано' : ''
            // 'Ссылка'
            }
          </span>
        </button>
        
        <div style={{ width: '1px', height: '24px', background: 'rgba(255,255,255,0.3)', margin: '0 8px' }} />
        
        <button 
          data-viewer-icon="close"
          onClick={onClose} 
          title="Закрыть (ESC)"
          style={{ background: 'rgba(220, 38, 38, 0.3)' }}
        >
          <span style={{ fontSize: '20px' }}>✕</span>
          {/* <span style={{ fontSize: '12px', opacity: 0.8 }}>Закрыть</span> */}
        </button>
      </div>

      {/* Подсказки по управлению */}
      <div className="shortcuts-hint" onClick={e => e.stopPropagation()}>
        <span style={{ opacity: 0.7, fontSize: '12px' }}>
          {canDrag ? 'ЗАХВАТИТЕ и ПЕРЕТАЩИТЕ картинку' : 'Кликните по картинке для увеличения'}
        </span>
      </div>
    </div>,
    document.body
  )
}
