import { useState } from 'react'

const textColors = [
  '#000000', '#434343', '#666666', '#999999', '#B7B7B7', '#CCCCCC', 
  '#D9D9D9', '#EFEFEF', '#F3F3F3', '#FFFFFF', '#980000', '#FF0000', 
  '#FF9900', '#FFFF00', '#00FF00', '#00FFFF', '#4A86E8', '#0000FF', 
  '#9900FF', '#FF00FF'
]

const bgColors = [
  '#FFFFFF', '#CCCCCC', '#999999', '#666666', '#434343', '#000000',
  '#F4CCCC', '#FCE5CD', '#FFF2CC', '#D9EAD3', '#D0E0E3', '#CFE2F3',
  '#D9D2E9', '#EAD1DC', '#EA9999', '#F9CB9C', '#FFE599', '#B6D7A8',
  '#A2C4C9', '#9FC5E8', '#B4A7D6', '#D5A6BD'
]

export default function ColorModal({ 
  type, // 'text' или 'bg'
  currentColor,
  customColors,
  onApplyColor,
  onSaveCustomColor,
  onRemoveCustomColor,
  onClose,
  position,
  isDragging,
  onMouseDown,
  blockClose,
  setBlockClose
}) {
  const [customColor, setCustomColor] = useState(currentColor)
  const [colorInput, setColorInput] = useState(currentColor)
  
  const handleApplyColor = (color) => {
    onApplyColor(color)
    onClose()
  }
  
  const handleSaveCustomColor = () => {
    onSaveCustomColor(customColor, type === 'text')
  }
  
  const handleColorInputChange = (e) => {
    const value = e.target.value
    setColorInput(value)
    if (/^#[0-9A-Fa-f]{6}$/.test(value)) {
      setCustomColor(value)
    }
  }
  
  const handleColorPickerChange = (e) => {
    const value = e.target.value
    setCustomColor(value)
    setColorInput(value)
  }

  const colors = type === 'text' ? textColors : bgColors
  const title = type === 'text' ? 'Выбор цвета текста' : 'Выбор цвета фона'

  return (
    <div
      className={`modal color-modal ${isDragging ? 'dragging' : ''}`}
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="modal-content">
        <div 
          className="modal-header"
          onMouseDown={onMouseDown}
        >
          <div className="modal-drag-handle">
            {title}
          </div>
          <button 
            className="close-modal-btn"
            onClick={(e) => {
              e.stopPropagation()
              onClose()
            }}
            title="Закрыть"
          >
            ×
          </button>
        </div>
        
        <div className="modal-section">
          <h4>Стандартные цвета:</h4>
          <div className="color-grid-large">
            {colors.map((color, index) => (
              <button
                key={index}
                className="color-swatch-large"
                style={{ backgroundColor: color }}
                onClick={(e) => {
                  e.stopPropagation()
                  handleApplyColor(color)
                }}
                title={color}
              />
            ))}
          </div>
        </div>
        
        <div className="modal-section">
          <h4>Пользовательские цвета:</h4>
          <div className="color-grid-custom">
            {customColors.map((color, index) => (
              <div key={index} className="custom-color-item">
                {color ? (
                  <>
                    <button
                      className="color-swatch-large"
                      style={{ backgroundColor: color }}
                      onClick={(e) => {
                        e.stopPropagation()
                        handleApplyColor(color)
                      }}
                      title={color}
                    />
                    <button
                      className="remove-color-btn"
                      onClick={(e) => onRemoveCustomColor(index, type === 'text', e)}
                      title="Удалить цвет"
                    >
                      ×
                    </button>
                  </>
                ) : (
                  <div className="empty-color-slot">
                    <span>Пусто</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
        
        <div className="modal-section">
          <h4>Выбрать свой цвет:</h4>
          <div className="custom-color-picker">
            <input
              type="color"
              value={customColor}
              onChange={handleColorPickerChange}
              className="color-picker-input"
              onFocus={() => setBlockClose(true)}
              onBlur={() => setBlockClose(false)}
            />
            <input
              type="text"
              value={colorInput}
              onChange={handleColorInputChange}
              placeholder="#000000"
              className="color-text-input"
              onFocus={() => setBlockClose(true)}
              onBlur={() => setBlockClose(false)}
            />
          </div>
          <div className="modal-actions">
            <button 
              className="modal-btn primary"
              onClick={(e) => {
                e.stopPropagation()
                handleApplyColor(customColor)
              }}
            >
              Применить
            </button>
            <button 
              className="modal-btn secondary"
              onClick={(e) => {
                e.stopPropagation()
                handleSaveCustomColor()
              }}
            >
              Сохранить
            </button>
            <button 
              className="modal-btn secondary"
              onClick={(e) => {
                e.stopPropagation()
                onClose()
              }}
            >
              Отмена
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
