import { useEffect, useRef, useState } from 'react'

const EXPORT_FORMATS = [
  {
    id: 'json',
    label: 'JSON (рекомендуется)',
    ext: 'json',
    hint: 'Лучше всего подходит для последующего импорта и сохранения структуры.',
  },
  {
    id: 'doc',
    label: 'DOC (Word)',
    ext: 'doc',
    hint: 'Открывается в Word. Основано на HTML, форматирование может отличаться.',
  },
  {
    id: 'docx',
    label: 'DOCX',
    ext: 'docx',
    hint: 'Экспортируется только текст (без форматирования).',
  },
  {
    id: 'pdf',
    label: 'PDF',
    ext: 'pdf',
    hint: 'Откроется окно печати — выберите «Сохранить как PDF».',
  },
  {
    id: 'xls',
    label: 'XLS (Excel)',
    ext: 'xls',
    hint: 'Таблицы лучше всего; основано на HTML, может отличаться от XLSX.',
  },
  {
    id: 'html',
    label: 'HTML',
    ext: 'html',
    hint: 'Удобно для публикации/копирования, но не гарантирует полный round-trip.',
  },
  {
    id: 'txt',
    label: 'TXT',
    ext: 'txt',
    hint: 'Чистый текст без форматирования.',
  },
]

export default function ExportModal({
  onClose,
  position,
  isDragging,
  onMouseDown,
  setBlockClose,
  onExport,
}) {
  const [fileBaseName, setFileBaseName] = useState('document')
  const [format, setFormat] = useState('json')
  const nameInputRef = useRef(null)

  useEffect(() => {
    const t = setTimeout(() => {
      nameInputRef.current?.focus()
      nameInputRef.current?.select?.()
    }, 0)
    return () => clearTimeout(t)
  }, [])

  const current = EXPORT_FORMATS.find(f => f.id === format) || EXPORT_FORMATS[0]

  const download = e => {
    e?.preventDefault?.()
    e?.stopPropagation?.()

    onExport?.({
      format,
      fileBaseName,
    })
    onClose?.()
  }

  const baseForPreview =
    ((fileBaseName || 'document').trim() || 'document').replace(
      /\.(json|html|htm|txt|md|doc|docx|pdf|xls|xlsx)$/i,
      ''
    ) || 'document'

  return (
    <div
      className={`modal doc-io-modal ${isDragging ? 'dragging' : ''}`}
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
      }}
      onClick={e => e.stopPropagation()}
    >
      <div className="doc-io-modal-content">
        <div className="modal-header" onMouseDown={onMouseDown}>
          <div className="modal-drag-handle">Экспорт</div>
          <button
            className="close-modal-btn"
            onMouseDown={e => {
              e.preventDefault()
              e.stopPropagation()
            }}
            onClick={e => {
              e.preventDefault()
              e.stopPropagation()
              onClose?.()
            }}
            title="Закрыть"
          >
            ×
          </button>
        </div>

        <div className="modal-section">
          <h4>Имя файла:</h4>
          <input
            ref={nameInputRef}
            className="doc-io-input"
            value={fileBaseName}
            onChange={e => setFileBaseName(e.target.value)}
            placeholder="document"
            onFocus={() => setBlockClose?.(true)}
            onBlur={() => setBlockClose?.(false)}
            onKeyDown={e => {
              if (e.key === 'Enter') download(e)
              if (e.key === 'Escape') {
                e.preventDefault()
                onClose?.()
              }
            }}
          />
          <div className="doc-io-filename-preview">
            Будет скачан файл: <span>{`${baseForPreview}.${current.ext}`}</span>
          </div>
        </div>

        <div className="modal-section">
          <h4>Формат:</h4>
          <div className="doc-io-format-grid">
            {EXPORT_FORMATS.map(f => (
              <button
                key={f.id}
                type="button"
                className={`doc-io-format-btn ${format === f.id ? 'active' : ''}`}
                onMouseDown={e => e.preventDefault()}
                onClick={e => {
                  e.preventDefault()
                  e.stopPropagation()
                  setFormat(f.id)
                }}
                title={f.label}
              >
                .{f.ext}
              </button>
            ))}
          </div>
          <div className="doc-io-hint">{current.hint}</div>
        </div>

        <div className="modal-actions">
          <button className="modal-btn primary" onClick={download}>
            Скачать
          </button>
          <button
            className="modal-btn secondary"
            onClick={e => {
              e.preventDefault()
              e.stopPropagation()
              onClose?.()
            }}
          >
            Отмена
          </button>
        </div>
      </div>
    </div>
  )
}
