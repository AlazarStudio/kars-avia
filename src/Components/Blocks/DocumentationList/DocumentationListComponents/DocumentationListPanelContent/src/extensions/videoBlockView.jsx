// src/extensions/videoBlockView.jsx
import { NodeViewWrapper } from '@tiptap/react'
import { useEffect, useRef, useState } from 'react'
import './imageBlockModal.css'
import './videoBlock.css'
import './fileEmpty.css'
import './blockResize.css'
import { blobFromDataUrl, blobFromUrl, getFileRecord, saveBlobAsFile, saveFile } from '../storage/fileStore'
import { parseVideoUrl } from '../utils/videoEmbedParser'
import { useDocumentationUpload } from '../DocumentationUploadContext'

const SINGLE_MODAL_EVENT = 'doclist-single-modal-open'

export default function VideoBlockView({ editor, node, updateAttributes, getPos }) {
  const {
    fileId,
    src,
    width = 520,
    height = 293,
    caption = '',
    textAlign = 'left',
  } = node.attrs

  const docUpload = useDocumentationUpload()
  const { uploadFile: docUploadFile, getMediaUrl } = docUpload || {}

  const videoRef = useRef(null)
  const [open, setOpen] = useState(false)
  const [tab, setTab] = useState('upload')
  const [url, setUrl] = useState('')
  const [objectUrl, setObjectUrl] = useState(null)
  const migrationRef = useRef({ running: false, doneFor: null })

  const modalRef = useRef(null)
  const modalSourceRef = useRef(`video-block-${Math.random().toString(36).slice(2)}`)
  const [modalPos, setModalPos] = useState({ x: 0, y: 0 })
  const dragOffset = useRef({ x: 0, y: 0 })

  const announceModalOpen = () => {
    try {
      window.dispatchEvent(
        new CustomEvent(SINGLE_MODAL_EVENT, {
          detail: { source: modalSourceRef.current },
        })
      )
    } catch {
      // ignore
    }
  }

  const parsedRemote = !objectUrl && typeof src === 'string' ? parseVideoUrl(src) : null
  const embedUrl =
    !objectUrl && parsedRemote?.type === 'embed' && parsedRemote?.embedUrl
      ? parsedRemote.embedUrl
      : null
  const videoUrl = objectUrl || (embedUrl ? null : src)
  const displayVideoSrc = objectUrl || (src && getMediaUrl ? getMediaUrl(src) : src)
  const hasVideo = Boolean(videoUrl || embedUrl)

  const alignMargins =
    textAlign === 'center'
      ? { marginLeft: 'auto', marginRight: 'auto' }
      : textAlign === 'right'
        ? { marginLeft: 'auto', marginRight: 0 }
        : { marginLeft: 0, marginRight: 'auto' }

  const safeSetNodeSelectionHere = e => {
    if (e?.button != null && e.button !== 0) return

    const t = e?.target
    if (t instanceof Element && t.closest('input, textarea, select')) return

    const pos = typeof getPos === 'function' ? getPos() : null
    if (typeof pos === 'number' && editor?.commands?.setNodeSelection) {
      editor.commands.setNodeSelection(pos)
    }
  }

  const clamp = (value, min, max) => Math.min(max, Math.max(min, value))

  /* ================= OPEN MODAL ================= */

  const openAtEvent = e => {
    e.stopPropagation()
    setModalPos({
      x: e.clientX + 10,
      y: e.clientY - 10,
    })
    announceModalOpen()
    setOpen(true)
  }

  useEffect(() => {
    const onExternalModalOpen = event => {
      if (event?.detail?.source === modalSourceRef.current) return
      setOpen(false)
    }

    window.addEventListener(SINGLE_MODAL_EVENT, onExternalModalOpen)
    return () => {
      window.removeEventListener(SINGLE_MODAL_EVENT, onExternalModalOpen)
    }
  }, [])

  /* ================= CLOSE MODAL ================= */

  useEffect(() => {
    if (!open) return
    const close = e => {
      if (modalRef.current && !modalRef.current.contains(e.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [open])

  /* ================= DRAG MODAL ================= */

  const startDragModal = e => {
    e.preventDefault()
    dragOffset.current = {
      x: e.clientX - modalPos.x,
      y: e.clientY - modalPos.y,
    }
    document.addEventListener('mousemove', onDragModal)
    document.addEventListener('mouseup', stopDragModal)
  }

  const onDragModal = e => {
    setModalPos({
      x: e.clientX - dragOffset.current.x,
      y: e.clientY - dragOffset.current.y,
    })
  }

  const stopDragModal = () => {
    document.removeEventListener('mousemove', onDragModal)
    document.removeEventListener('mouseup', stopDragModal)
  }

  /* ================= SET VIDEO ================= */

  const setVideo = videoSrc => {
    const clean = String(videoSrc || '').trim()
    if (!clean) return

    const parsed = parseVideoUrl(clean)
    if (parsed?.type === 'embed' && parsed?.platform !== 'embed' && !parsed?.embedUrl) {
      alert('Эта платформа не поддерживает встраивание видео по ссылке.')
      return
    }

    const normalizedSrc =
      parsed?.type === 'embed'
        ? parsed.embedUrl || parsed.url
        : parsed?.type === 'direct'
          ? parsed.url
          : clean

    updateAttributes({ src: normalizedSrc, fileId: null })
    setOpen(false)
    setUrl('')
  }

  const onUpload = file => {
    if (!file || !file.type.startsWith('video/')) return
    ;(async () => {
      try {
        if (docUploadFile) {
          const path = await docUploadFile(file)
          if (path) {
            updateAttributes({ src: path, fileId: null })
          }
        } else {
          const saved = await saveFile(file)
          updateAttributes({ fileId: saved.id, src: null })
        }
      } catch {
        // ignore
      } finally {
        setOpen(false)
        setUrl('')
      }
    })()
  }

  /* ================= DROP (EMPTY) ================= */

  const handleDrop = e => {
    e.preventDefault()
    e.currentTarget.classList.remove('drag-over')

    const dt = e.dataTransfer
    if (dt.files && dt.files.length) {
      const file = dt.files[0]
      if (!file.type.startsWith('video/')) return
      onUpload(file)
    }
  }

  /* ================= RESOLVE LOCAL FILE ================= */

  useEffect(() => {
    let cancelled = false
    let urlToRevoke = null

    ;(async () => {
      if (!fileId) {
        setObjectUrl(null)
        return
      }

      try {
        const record = await getFileRecord(fileId)
        if (!record?.blob) {
          if (!cancelled) setObjectUrl(null)
          return
        }
        const nextUrl = URL.createObjectURL(record.blob)
        urlToRevoke = nextUrl
        if (!cancelled) setObjectUrl(nextUrl)
      } catch {
        if (!cancelled) setObjectUrl(null)
      }
    })()

    return () => {
      cancelled = true
      if (urlToRevoke) URL.revokeObjectURL(urlToRevoke)
    }
  }, [fileId])

  /* ================= MIGRATE data:/blob: ================= */

  useEffect(() => {
    if (fileId) return
    if (!src || typeof src !== 'string') return
    if (!src.startsWith('data:') && !src.startsWith('blob:')) return

    if (migrationRef.current.running) return
    if (migrationRef.current.doneFor === src) return

    migrationRef.current.running = true
    migrationRef.current.doneFor = src

    ;(async () => {
      try {
        const blob = src.startsWith('data:')
          ? await blobFromDataUrl(src)
          : await blobFromUrl(src)
        if (docUploadFile) {
          const file = new File([blob], 'video', { type: blob.type })
          const path = await docUploadFile(file)
          if (path) {
            updateAttributes({ src: path, fileId: null })
            migrationRef.current.running = false
            return
          }
        }
        const id = await saveBlobAsFile({ blob, mimeType: blob.type })
        updateAttributes({ fileId: id, src: null })
      } catch {
        // ignore
      } finally {
        migrationRef.current.running = false
      }
    })()
  }, [fileId, src, updateAttributes, docUploadFile])

  /* ================= RESIZE ================= */

  const startResize = (e, side, shiftKey = false) => {
    e.preventDefault()
    e.stopPropagation()

    const startX = e.clientX
    const startY = e.clientY
    const startWidth = width
    const startHeight = height
    const ratio = startWidth > 0 && startHeight > 0 ? startWidth / startHeight : 16 / 9
    const minWidth = 200
    const wrapperEl = e.currentTarget?.closest?.('[data-node-view-wrapper]')
    const proseMirrorEl = wrapperEl?.closest?.('.ProseMirror') || wrapperEl?.parentElement

    const proseStyles = proseMirrorEl ? window.getComputedStyle(proseMirrorEl) : null
    const paddingLeft = proseStyles ? parseFloat(proseStyles.paddingLeft) || 0 : 0
    const paddingRight = proseStyles ? parseFloat(proseStyles.paddingRight) || 0 : 0
    const viewportWidth = typeof window !== 'undefined' ? window.innerWidth : null
    const baseWidth = proseMirrorEl?.clientWidth || viewportWidth || 800
    const maxWidth = Math.max(200, Math.floor(baseWidth - paddingLeft - paddingRight - 24))

    const move = ev => {
      let deltaX = 0
      let deltaY = 0

      if (side.includes('right')) deltaX = ev.clientX - startX
      if (side.includes('left')) deltaX = startX - ev.clientX
      if (side.includes('bottom')) deltaY = ev.clientY - startY
      if (side.includes('top')) deltaY = startY - ev.clientY

      let newWidth = clamp(startWidth + deltaX, minWidth, maxWidth)
      let newHeight = clamp(startHeight + deltaY, 150, 600)

      // Если зажат Shift - сохраняем пропорции
      if (shiftKey || ev.shiftKey) {
        if (side.includes('right') || side.includes('left')) {
          newHeight = clamp(newWidth / ratio, 150, 600)
          newWidth = clamp(newHeight * ratio, minWidth, maxWidth)
          newHeight = newWidth / ratio
        } else if (side.includes('bottom') || side.includes('top')) {
          newWidth = clamp(newHeight * ratio, minWidth, maxWidth)
          newHeight = clamp(newWidth / ratio, 150, 600)
          newWidth = clamp(newHeight * ratio, minWidth, maxWidth)
          newHeight = newWidth / ratio
        }
      }

      updateAttributes({
        width: Math.round(newWidth),
        height: Math.round(newHeight),
      })
    }

    const up = () => {
      document.removeEventListener('mousemove', move)
      document.removeEventListener('mouseup', up)
    }

    document.addEventListener('mousemove', move)
    document.addEventListener('mouseup', up)
  }

  return (
    <>
      <NodeViewWrapper
        className="video-block-wrapper block-resizable"
        onMouseDown={safeSetNodeSelectionHere}
        style={{ width, maxWidth: '100%', ...alignMargins }}
      >
        {/* RESIZE HANDLES */}
        <div className="block-resize left" contentEditable={false} onMouseDown={e => startResize(e, 'left', e.shiftKey)} />
        <div className="block-resize right" contentEditable={false} onMouseDown={e => startResize(e, 'right', e.shiftKey)} />
        {hasVideo && (
          <>
            <div className="block-resize top" contentEditable={false} onMouseDown={e => startResize(e, 'top', e.shiftKey)} />
            <div className="block-resize bottom" contentEditable={false} onMouseDown={e => startResize(e, 'bottom', e.shiftKey)} />
          </>
        )}

        {/* EMPTY STATE */}
        {!hasVideo && (
          <div
            className="file-empty"
            onClick={openAtEvent}
            onDragOver={e => {
              e.preventDefault()
              e.currentTarget.classList.add('drag-over')
            }}
            onDragLeave={e =>
              e.currentTarget.classList.remove('drag-over')
            }
            onDrop={handleDrop}
          >
            + Добавить видео
          </div>
        )}

        {/* VIDEO PREVIEW */}
        {hasVideo && (
          <div
            className="video-preview"
            style={{ width: '100%', height }}
          >
            {embedUrl ? (
              <iframe
                src={embedUrl}
                title="Встроенное видео"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                referrerPolicy="strict-origin-when-cross-origin"
                style={{
                  width: '100%',
                  height: '100%',
                  border: 'none',
                  borderRadius: '8px',
                  backgroundColor: '#000',
                }}
              />
            ) : (
              <video
                ref={videoRef}
                src={displayVideoSrc}
                controls
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'contain',
                  borderRadius: '8px',
                  backgroundColor: '#000',
                }}
              />
            )}

            <button
              className="video-settings-btn"
              onClick={openAtEvent}
              title="Настройки видео"
              aria-label="Настройки видео"
            >
              •
            </button>
          </div>
        )}

        {/* CAPTION */}
        {hasVideo && caption && (
          <input
            className="video-caption"
            placeholder="Подпись"
            value={caption}
            onChange={e =>
              updateAttributes({ caption: e.target.value })
            }
          />
        )}

        {/* MODAL */}
        {open && (
          <div
            ref={modalRef}
            className="image-modal"
            style={{
              top: modalPos.y,
              left: modalPos.x,
            }}
          >
            <div
              className="image-modal-header"
              onMouseDown={startDragModal}
            />

            <div className="image-modal-tabs">
              <button
                className={tab === 'upload' ? 'active' : ''}
                onClick={() => setTab('upload')}
              >
                Загрузить
              </button>
              <button
                className={tab === 'url' ? 'active' : ''}
                onClick={() => setTab('url')}
              >
                Ссылка
              </button>
            </div>

            <div className="image-modal-content">
              {tab === 'upload' && (
                <label className="image-upload-btn">
                  Выбрать видео
                  <input
                    type="file"
                    accept="video/*"
                    hidden
                    onChange={e =>
                      onUpload(e.target.files[0])
                    }
                  />
                </label>
              )}

              {hasVideo && (
                <button
                  className="image-delete-btn"
                  onClick={() => {
                    updateAttributes({ src: null, fileId: null })
                    setOpen(false)
                  }}
                >
                  Удалить
                </button>
              )}

              {tab === 'url' && (
                <>
                  <input
                    placeholder="https://..."
                    value={url}
                    onChange={e => setUrl(e.target.value)}
                  />
                  <button onClick={() => url && setVideo(url)}>
                    Вставить
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </NodeViewWrapper>

    </>
  )
}
