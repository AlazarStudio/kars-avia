import { useState, useEffect, useRef } from 'react'
import SearchRoundedIcon from '@mui/icons-material/SearchRounded'
import { 
  LinkIcon, 
  ButtonIcon, 
  HighlightIcon, 
  DashedIcon, 
  NoUnderlineIcon, 
  ColoredIcon,
  AddIcon 
} from './icons'

const linkStyles = [
  { 
    id: 'default', 
    label: 'Стандартная', 
    icon: 'link',
    description: 'Обычная синяя ссылка'
  },
]

const renderLinkIcon = (iconType, size = 20) => {
  switch (iconType) {
    case 'link':
      return <LinkIcon size={size} />
    case 'button':
      return <ButtonIcon size={size} />
    case 'highlight':
      return <HighlightIcon size={size} />
    case 'dashed':
      return <DashedIcon size={size} />
    case 'no-underline':
      return <NoUnderlineIcon size={size} />
    case 'colored':
      return <ColoredIcon size={size} />
    default:
      return <LinkIcon size={size} />
  }
}

const getLinkStylePreviewStyle = (styleItem) => {
  if (!styleItem) return undefined
  const styleId = String(styleItem.id || '')
  if (styleId.startsWith('custom_')) {
    const previewStyle = {
      textUnderlineOffset: '2px',
    }
    if (styleItem.color) {
      previewStyle.color = styleItem.color
    }
    if (styleItem.bgColor && styleItem.bgColor !== 'transparent') {
      previewStyle.backgroundColor = styleItem.bgColor
    }
    if (styleItem.underline !== false) {
      const underlineStyle = styleItem.underlineStyle || 'solid'
      const underlineColor = styleItem.color || '#3b82f6'
      previewStyle.textDecoration = `underline ${underlineStyle} ${underlineColor}`
    } else {
      previewStyle.textDecoration = 'none'
    }
    if (styleItem.bold) {
      previewStyle.fontWeight = '700'
    }
    if (styleItem.italic) {
      previewStyle.fontStyle = 'italic'
    }
    return previewStyle
  }
  switch (styleId) {
    case 'button':
      return {
        color: '#ffffff',
        backgroundColor: '#2563eb',
        textDecoration: 'none',
        fontWeight: '600',
      }
    case 'highlighted':
      return {
        color: '#1f2937',
        backgroundColor: '#fef3c7',
        textDecoration: 'none',
      }
    case 'dashed':
      return {
        color: '#2563eb',
        textDecoration: 'underline dashed #2563eb',
        textUnderlineOffset: '2px',
      }
    case 'no-underline':
      return {
        color: '#2563eb',
        textDecoration: 'none',
        fontWeight: '700',
      }
    case 'colored':
      return {
        color: '#0369a1',
        backgroundColor: '#e0f2fe',
        textDecoration: 'none',
      }
    default:
      return {
        color: '#2563eb',
        textDecoration: 'underline',
        textUnderlineOffset: '2px',
      }
  }
}

export default function LinkModal({
  editor,
  onClose,
  position,
  isDragging,
  onMouseDown,
  blockClose,
  setBlockClose,
  customLinkStyles,
  removeCustomStyle,
  onOpenCustomStyleModal,
  applyLinkStyle,
  fetchLinkPreview,
  onEditStyle,
  initialStyleId = 'default',
  focusUrlInput = false,
}) {
  const [url, setUrl] = useState('')
  const [style, setStyle] = useState(initialStyleId || 'default')
  const [linkPreview, setLinkPreview] = useState(null)
  const [isLinkLoading, setIsLinkLoading] = useState(false)
  const [notification, setNotification] = useState(null)
  const urlInputRef = useRef(null)
  
  useEffect(() => {
    const { from, to } = editor.state.selection
    
    // Проверяем, есть ли выделенный текст при открытии модалки
    if (from === to) {
      setNotification({
        type: 'warning',
        message: 'Выделите текст для создания ссылки'
      })
    } else {
      const currentLink = editor.getAttributes('link')
      if (currentLink.href) {
        setUrl(currentLink.href)
      }
    }
  }, [editor])

  useEffect(() => {
    if (!initialStyleId) return
    setStyle(initialStyleId)
  }, [initialStyleId])

  useEffect(() => {
    if (!focusUrlInput) return
    const frame = requestAnimationFrame(() => {
      const input = urlInputRef.current
      if (!input) return
      input.focus({ preventScroll: true })
      const length = typeof input.value === 'string' ? input.value.length : 0
      input.setSelectionRange(length, length)
    })

    return () => cancelAnimationFrame(frame)
  }, [focusUrlInput])
  
  // Автоматическое скрытие уведомления через 3 секунды
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => {
        setNotification(null)
      }, 3000)
      
      return () => clearTimeout(timer)
    }
  }, [notification])
  
  const handleUrlChange = (e) => {
    setUrl(e.target.value)
  }
  
  const handleStyleSelect = (styleId) => {
    setStyle(styleId)
  }
  
  const handleEditStyleClick = (style, e) => {
    e.stopPropagation()
    e.preventDefault()
    onEditStyle(style)
  }
  
  const handleApply = (e) => {
    e.preventDefault()
    e.stopPropagation()
    
    if (!url.trim()) {
      setNotification({
        type: 'warning',
        message: 'Введите URL ссылки'
      })
      return
    }
    
    const { from, to } = editor.state.selection
    if (from === to) {
      setNotification({
        type: 'warning',
        message: 'Выделите текст для создания ссылки'
      })
      return
    }
    
    // Устанавливаем ссылку
    editor.chain()
      .focus()
      .setLink({ href: url.trim() })
      .run()
    
    // Применяем стиль
    applyLinkStyle(style)
    
    onClose()
  }
  
  const handleRemove = (e) => {
    e.preventDefault()
    e.stopPropagation()
    
    editor.chain()
      .focus()
      .unsetLink()
      .run()
    
    onClose()
  }
  
  const handleValidate = async (e) => {
    e.preventDefault()
    e.stopPropagation()
    
    if (!url.trim()) return
    
    try {
      setIsLinkLoading(true)
      const urlObj = new URL(url)
      const domain = urlObj.hostname
      
      setLinkPreview({
        title: domain,
        description: `Ссылка на ${domain}`,
        favicon: `https://www.google.com/s2/favicons?domain=${domain}&sz=64`,
        url: url
      })
    } catch (error) {
      setLinkPreview(null)
    } finally {
      setIsLinkLoading(false)
    }
  }

  return (
    <div
      className="link-modal"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="link-modal-content">
        <div 
          className="link-modal-header"
          onMouseDown={onMouseDown}
        >
          <div className="modal-drag-handle">
            Добавить ссылку
          </div>
          <button 
            className="close-modal-btn"
            onClick={onClose}
            title="Закрыть"
          >
            ×
          </button>
        </div>
        
        {/* Уведомление */}
        {notification && (
          <div className={`link-notification ${notification.type}`}>
            <span className="notification-icon">
              {notification.type === 'warning' ? '⚠️' : 'ℹ️'}
            </span>
            <span className="notification-message">{notification.message}</span>
            <button 
              className="notification-close"
              onClick={() => setNotification(null)}
              title="Закрыть"
            >
              ×
            </button>
          </div>
        )}
        
        <div className="link-modal-section">
          <h4>URL ссылки:</h4>
          <div className="link-input-container">
            <input
              ref={urlInputRef}
              type="url"
              value={url}
              onChange={handleUrlChange}
              placeholder="https://example.com"
              className="link-url-input"
              onFocus={() => setBlockClose(true)}
              onBlur={() => setBlockClose(false)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleApply(e)
                }
              }}
            />
            <button
              className="link-validate-btn"
              onClick={handleValidate}
              disabled={!url.trim() || isLinkLoading}
              title="Проверить ссылку"
            >
              {isLinkLoading ? '...' : (
                <>
                  {/* Legacy SVG icon:
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="11" cy="11" r="8"/>
                    <path d="m21 21-4.35-4.35"/>
                  </svg>
                  */}
                  <SearchRoundedIcon
                    aria-hidden="true"
                    fontSize="inherit"
                    style={{ width: 16, height: 16, fontSize: 16 }}
                  />
                </>
              )}
            </button>
          </div>
          
          {url && !url.startsWith('http') && !url.startsWith('https') && (
            <div className="link-warning">
              ⚠️ Добавьте протокол (http:// или https://)
            </div>
          )}
        </div>
        
        <div className="link-modal-section">
          <h4>Стиль ссылки:</h4>
          <div className="link-styles-grid">
            {linkStyles.map((linkStyleItem) => (
              <div 
                key={linkStyleItem.id}
                className={`link-style-container ${style === linkStyleItem.id ? 'active' : ''}`}
              >
                <button
                  className="link-style-btn"
                  onClick={() => handleStyleSelect(linkStyleItem.id)}
                  title={linkStyleItem.description}
                >
                  <span className="link-style-icon">
                    {renderLinkIcon(linkStyleItem.icon, 20)}
                  </span>
                  <span className="link-style-label" style={getLinkStylePreviewStyle(linkStyleItem)}>{linkStyleItem.label}</span>
                </button>
                <button 
                  className="edit-style-btn"
                  onClick={(e) => handleEditStyleClick(linkStyleItem, e)}
                  title="Редактировать стиль (создаст новый кастомный)"
                >
                  ✎
                </button>
              </div>
            ))}
            
            {customLinkStyles.map((customStyle, index) => (
              <div 
                key={customStyle.id}
                className={`link-style-container ${style === customStyle.id ? 'active' : ''}`}
              >
                <button
                  className="link-style-btn"
                  onClick={() => handleStyleSelect(customStyle.id)}
                  title={customStyle.name}
                >
                  <span className="link-style-icon">
                    {renderLinkIcon(customStyle.icon || 'link', 20)}
                  </span>
                  <span className="link-style-label" style={getLinkStylePreviewStyle(customStyle)}>{customStyle.name}</span>
                </button>
                <div className="style-actions">
                  <button 
                    className="edit-style-btn"
                    onClick={(e) => handleEditStyleClick(customStyle, e)}
                    title="Редактировать стиль"
                  >
                    ✎
                  </button>
                  <button 
                    className="remove-custom-style-btn"
                    onClick={(e) => {
                      e.stopPropagation()
                      e.preventDefault()
                      removeCustomStyle(index, e)
                    }}
                    title="Удалить стиль"
                  >
                    ×
                  </button>
                </div>
              </div>
            ))}
            
            <button
              className="link-style-btn add-custom-style-btn"
              onClick={onOpenCustomStyleModal}
              title="Создать свой стиль"
            >
              <span className="link-style-icon">
                <AddIcon size={20} />
              </span>
              <span className="link-style-label">Свой стиль</span>
            </button>
          </div>
        </div>
        
        {linkPreview && (
          <div className="link-modal-section">
            <h4>Предпросмотр:</h4>
            <div className="link-preview">
              <div className="link-preview-header">
                {linkPreview.favicon && (
                  <img 
                    src={linkPreview.favicon} 
                    alt=""
                    className="link-preview-favicon"
                  />
                )}
                <div className="link-preview-info">
                  <div className="link-preview-title">
                    {linkPreview.title}
                  </div>
                  <div className="link-preview-url">
                    {linkPreview.url}
                  </div>
                </div>
              </div>
              {linkPreview.description && (
                <div className="link-preview-description">
                  {linkPreview.description}
                </div>
              )}
            </div>
          </div>
        )}
        
        <div className="link-modal-actions">
          <button 
            className="modal-btn primary"
            onClick={handleApply}
            disabled={!url.trim()}
          >
            Применить ссылку
          </button>
          
          {editor.isActive('link') && (
            <button 
              className="modal-btn danger"
              onClick={handleRemove}
            >
              Удалить ссылку
            </button>
          )}
          
          <button 
            className="modal-btn secondary"
            onClick={onClose}
          >
            Отмена
          </button>
        </div>
      </div>
    </div>
  )
}
