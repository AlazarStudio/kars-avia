import { useState, useEffect } from 'react'
import { AddIcon } from './icons'

export default function CustomStyleModal({
  onClose,
  position,
  onMouseDown,
  blockClose,
  setBlockClose,
  onCreateCustomStyle,
  onUpdateCustomStyle,
  editingStyle, // объект стиля для редактирования или null для создания нового
  standardStyles, // массив стандартных стилей для проверки
}) {
  const [name, setName] = useState('')
  const [color, setColor] = useState('#3b82f6')
  const [bgColor, setBgColor] = useState('transparent')
  const [underline, setUnderline] = useState(true)
  const [underlineStyle, setUnderlineStyle] = useState('solid')
  const [bold, setBold] = useState(false)
  const [italic, setItalic] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  
  // Инициализация формы при открытии
  useEffect(() => {
    if (editingStyle) {
      setIsEditing(true)
      setName(editingStyle.name || '')
      setColor(editingStyle.color || '#3b82f6')
      setBgColor(editingStyle.bgColor || 'transparent')
      setUnderline(editingStyle.underline !== false) // по умолчанию true
      setUnderlineStyle(editingStyle.underlineStyle || 'solid')
      setBold(editingStyle.bold || false)
      setItalic(editingStyle.italic || false)
    } else {
      setIsEditing(false)
      setName('')
      setColor('#3b82f6')
      setBgColor('transparent')
      setUnderline(true)
      setUnderlineStyle('solid')
      setBold(false)
      setItalic(false)
    }
  }, [editingStyle])
  
  // Проверяем, является ли стиль стандартным
  const isStandardStyle = () => {
    if (!editingStyle || !standardStyles) return false
    return standardStyles.some(style => style.id === editingStyle.id)
  }
  
  const handleSave = (e) => {
    e.preventDefault()
    e.stopPropagation()
    
    if (!name.trim()) {
      alert('Введите название стиля')
      return
    }
    
    if (isEditing) {
      if (isStandardStyle()) {
        // Для стандартного стиля создаем новый кастомный
        const newStyle = {
          id: `custom_${Date.now()}`,
          name: name.trim(),
          color: color,
          bgColor: bgColor,
          underline: underline,
          underlineStyle: underlineStyle,
          bold: bold,
          italic: italic,
          icon: 'custom'
        }
        onCreateCustomStyle(newStyle)
      } else {
        // Для существующего кастомного стиля обновляем
        const updatedStyle = {
          ...editingStyle,
          name: name.trim(),
          color: color,
          bgColor: bgColor,
          underline: underline,
          underlineStyle: underlineStyle,
          bold: bold,
          italic: italic,
        }
        onUpdateCustomStyle(updatedStyle)
      }
    } else {
      // Создание нового стиля
      const newStyle = {
        id: `custom_${Date.now()}`,
        name: name.trim(),
        color: color,
        bgColor: bgColor,
        underline: underline,
        underlineStyle: underlineStyle,
        bold: bold,
        italic: italic,
        icon: 'custom'
      }
      onCreateCustomStyle(newStyle)
    }
    
    onClose()
  }
  
  const handleClose = (e) => {
    e.preventDefault()
    e.stopPropagation()
    onClose()
  }

  const modalTitle = isEditing 
    ? (isStandardStyle() ? 'Создать стиль на основе стандартного' : 'Редактировать стиль')
    : 'Создать свой стиль ссылки'

  return (
    <div
      className="custom-style-modal"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="custom-style-modal-content">
        <div 
          className="custom-style-modal-header"
          onMouseDown={onMouseDown}
        >
          <div className="modal-drag-handle">
            {modalTitle}
          </div>
          <button 
            className="close-modal-btn"
            onClick={handleClose}
            title="Закрыть"
          >
            ×
          </button>
        </div>
        
        {isEditing && isStandardStyle() && (
          <div className="link-notification warning" style={{ marginBottom: '12px' }}>
            <span className="notification-icon">ℹ️</span>
            <span className="notification-message">
              Стандартный стиль нельзя редактировать. Будет создан новый кастомный стиль.
            </span>
          </div>
        )}
        
        <div className="custom-style-section">
          <h4>Название стиля:</h4>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Мой стиль ссылки"
            className="custom-style-input"
            onFocus={() => setBlockClose(true)}
            onBlur={() => setBlockClose(false)}
          />
        </div>
        
        <div className="custom-style-section">
          <h4>Настройки стиля:</h4>
          <div className="style-settings-grid">
            <div className="style-setting">
              <label>Цвет текста:</label>
              <div className="style-color-picker">
                <input
                  type="color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="style-color-input"
                  onFocus={() => setBlockClose(true)}
                  onBlur={() => setBlockClose(false)}
                />
                <input
                  type="text"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="style-color-text"
                  onFocus={() => setBlockClose(true)}
                  onBlur={() => setBlockClose(false)}
                />
              </div>
            </div>
            
            <div className="style-setting">
              <label>Цвет фона:</label>
              <div className="style-color-picker">
                <input
                  type="color"
                  value={bgColor === 'transparent' ? '#ffffff' : bgColor}
                  onChange={(e) => setBgColor(e.target.value)}
                  className="style-color-input"
                  onFocus={() => setBlockClose(true)}
                  onBlur={() => setBlockClose(false)}
                />
                <select
                  value={bgColor}
                  onChange={(e) => setBgColor(e.target.value)}
                  className="style-bg-select"
                  onFocus={() => setBlockClose(true)}
                  onBlur={() => setBlockClose(false)}
                >
                  <option value="transparent">Прозрачный</option>
                  <option value="#e0f2fe">Голубой</option>
                  <option value="#fef3c7">Желтый</option>
                  <option value="#f3f4f6">Серый</option>
                  <option value="#dbeafe">Синий</option>
                  <option value="#fce7f3">Розовый</option>
                </select>
              </div>
            </div>
            
            <div className="style-setting">
              <label className="style-checkbox">
                <input
                  type="checkbox"
                  checked={underline}
                  onChange={(e) => setUnderline(e.target.checked)}
                  onFocus={() => setBlockClose(true)}
                  onBlur={() => setBlockClose(false)}
                />
                <span>Подчеркивание</span>
              </label>
              
              {underline && (
                <select
                  value={underlineStyle}
                  onChange={(e) => setUnderlineStyle(e.target.value)}
                  className="style-underline-select"
                  onFocus={() => setBlockClose(true)}
                  onBlur={() => setBlockClose(false)}
                >
                  <option value="solid">Сплошная</option>
                  <option value="dashed">Пунктирная</option>
                  <option value="dotted">Точечная</option>
                  <option value="double">Двойная</option>
                </select>
              )}
            </div>
            
            <div className="style-setting">
              <label className="style-checkbox">
                <input
                  type="checkbox"
                  checked={bold}
                  onChange={(e) => setBold(e.target.checked)}
                  onFocus={() => setBlockClose(true)}
                  onBlur={() => setBlockClose(false)}
                />
                <span>Жирный</span>
              </label>
              
              <label className="style-checkbox">
                <input
                  type="checkbox"
                  checked={italic}
                  onChange={(e) => setItalic(e.target.checked)}
                  onFocus={() => setBlockClose(true)}
                  onBlur={() => setBlockClose(false)}
                />
                <span>Курсив</span>
              </label>
            </div>
          </div>
        </div>
        
        <div className="custom-style-section">
          <h4>Предпросмотр:</h4>
          <div className="style-preview">
            <div 
              className="style-preview-text"
              style={{
                color: color,
                backgroundColor: bgColor,
                textDecoration: underline ? 
                  `underline ${underlineStyle}` : 'none',
                fontWeight: bold ? 'bold' : 'normal',
                fontStyle: italic ? 'italic' : 'normal',
                padding: '8px 12px',
                borderRadius: '4px',
                border: '1px solid #e5e7eb',
                display: 'inline-block'
              }}
            >
              Пример ссылки
            </div>
          </div>
        </div>
        
        <div className="custom-style-actions">
          <button 
            className="modal-btn primary"
            onClick={handleSave}
            disabled={!name.trim()}
          >
            {isEditing 
              ? (isStandardStyle() ? 'Создать новый стиль' : 'Сохранить изменения')
              : 'Создать стиль'}
          </button>
          
          <button 
            className="modal-btn secondary"
            onClick={handleClose}
          >
            Отмена
          </button>
        </div>
      </div>
    </div>
  )
}