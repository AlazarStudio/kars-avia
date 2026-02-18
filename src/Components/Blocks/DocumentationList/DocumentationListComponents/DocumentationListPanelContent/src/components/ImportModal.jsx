import { useEffect, useRef, useState } from 'react'

export default function ImportModal({
  onClose,
  position,
  isDragging,
  onMouseDown,
  setBlockClose,
  onImportFile,
  onImportUrl,
}) {
  const [tab, setTab] = useState('file') // 'file' | 'url'
  const [url, setUrl] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)

  const fileInputRef = useRef(null)
  const urlInputRef = useRef(null)

  useEffect(() => {
    if (tab !== 'url') return
    const t = setTimeout(() => urlInputRef.current?.focus(), 0)
    return () => clearTimeout(t)
  }, [tab])

  const pickFile = e => {
    e?.preventDefault?.()
    e?.stopPropagation?.()
    setError(null)
    fileInputRef.current?.click?.()
  }

  const handleFileChange = async e => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return

    setBusy(true)
    setError(null)
    try {
      await onImportFile?.(file)
      onClose?.()
    } catch (err) {
      setError(err?.message || 'Не удалось импортировать файл')
    } finally {
      setBusy(false)
    }
  }

  const handleImportUrl = async e => {
    e?.preventDefault?.()
    e?.stopPropagation?.()

    const nextUrl = url.trim()
    if (!nextUrl) return

    setBusy(true)
    setError(null)
    try {
      await onImportUrl?.(nextUrl)
      onClose?.()
    } catch (err) {
      setError(err?.message || 'Не удалось импортировать по ссылке')
    } finally {
      setBusy(false)
    }
  }

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
          <div className="modal-drag-handle">Импорт</div>
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

        <div className="doc-io-tabs" role="tablist" aria-label="Импорт">
          <button
            type="button"
            className={`doc-io-tab ${tab === 'file' ? 'active' : ''}`}
            onMouseDown={e => e.preventDefault()}
            onClick={e => {
              e.preventDefault()
              e.stopPropagation()
              setTab('file')
            }}
            role="tab"
            aria-selected={tab === 'file'}
          >
            Файл
          </button>
          <button
            type="button"
            className={`doc-io-tab ${tab === 'url' ? 'active' : ''}`}
            onMouseDown={e => e.preventDefault()}
            onClick={e => {
              e.preventDefault()
              e.stopPropagation()
              setTab('url')
            }}
            role="tab"
            aria-selected={tab === 'url'}
          >
            Ссылка
          </button>
        </div>

        {tab === 'file' && (
          <div className="modal-section">
            <h4>Выберите файл для импорта:</h4>
            <button
              type="button"
              className="modal-btn primary"
              onClick={pickFile}
              disabled={busy}
              style={{ width: '100%', justifyContent: 'center' }}
            >
              {busy ? 'Импорт...' : 'Выбрать файл'}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json,.txt,.html,.htm,.md,.doc,.docx,.pdf,.xls,.xlsx,application/json,text/plain,text/html,application/pdf,application/msword,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
              hidden
              onChange={handleFileChange}
            />
            <div className="doc-io-hint">
              Поддерживаются: <b>.json</b> (рекомендуется), <b>.txt</b>/<b>.html</b>, <b>.doc</b>/<b>.docx</b>, <b>.pdf</b>, <b>.xls</b>/<b>.xlsx</b>.
              <br />
              <b>DOCX</b> импортируется в редактор с базовым форматированием (жирный/курсив/размер/выравнивание). <b>PDF/XLSX</b> прикрепляются как файл.
              <br />
              Импорт заменяет текущий документ.
            </div>
          </div>
        )}

        {tab === 'url' && (
          <div className="modal-section">
            <h4>Ссылка на файл:</h4>
            <input
              ref={urlInputRef}
              className="doc-io-input"
              value={url}
              onChange={e => setUrl(e.target.value)}
              placeholder="https://example.com/document.json"
              onFocus={() => setBlockClose?.(true)}
              onBlur={() => setBlockClose?.(false)}
              onKeyDown={e => {
                if (e.key === 'Enter') handleImportUrl(e)
                if (e.key === 'Escape') {
                  e.preventDefault()
                  onClose?.()
                }
              }}
              disabled={busy}
            />
            <div className="doc-io-hint">
              URL должен отдавать содержимое файла (CORS может помешать). Импорт заменяет текущий документ.
            </div>
          </div>
        )}

        {error && <div className="doc-io-error">⚠ {error}</div>}

        <div className="modal-actions">
          {tab === 'url' ? (
            <button
              className="modal-btn primary"
              onClick={handleImportUrl}
              disabled={busy || !url.trim()}
            >
              {busy ? 'Импорт...' : 'Импортировать'}
            </button>
          ) : (
            <button className="modal-btn secondary" onClick={onClose} disabled={busy}>
              Закрыть
            </button>
          )}
          {tab === 'url' && (
            <button className="modal-btn secondary" onClick={onClose} disabled={busy}>
              Отмена
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
