import { useState, useEffect } from 'react'
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
  onEditStyle
}) {
  const [url, setUrl] = useState('')
  const [style, setStyle] = useState('default')
  const [linkPreview, setLinkPreview] = useState(null)
  const [isLinkLoading, setIsLinkLoading] = useState(false)
  const [notification, setNotification] = useState(null)
  
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
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="8"/>
                  <path d="m21 21-4.35-4.35"/>
                </svg>
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
                  <span className="link-style-label">{linkStyleItem.label}</span>
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
                  <span className="link-style-label">{customStyle.name}</span>
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