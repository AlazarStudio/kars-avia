import { NodeViewWrapper } from '@tiptap/react'
import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import './imageBlockModal.css'
import './fileEmpty.css'
import './blockResize.css'
import { blobFromDataUrl, blobFromUrl, getFileRecord, saveBlobAsFile, saveFile } from '../storage/fileStore'
import { useDocumentationUpload } from '../DocumentationUploadContext'

const SINGLE_MODAL_EVENT = 'doclist-single-modal-open'
const IMAGE_MIN_WIDTH = 200
const IMAGE_FILE_URL_CACHE = new Map()

export default function ImageBlockView({ editor, node, updateAttributes, getPos }) {
  const {
    fileId,
    src,
    caption,
    width = 520,
    height = null,
    showCaption,
    textAlign = 'left',
  } = node.attrs

  const docUpload = useDocumentationUpload()
  const { uploadImage: docUploadImage, getMediaUrl } = docUpload || {}
  const canEdit = editor?.isEditable !== false

  const alignMargins =
    textAlign === 'center'
      ? { marginLeft: 'auto', marginRight: 'auto' }
      : textAlign === 'right'
        ? { marginLeft: 'auto', marginRight: 0 }
        : { marginLeft: 0, marginRight: 'auto' }

  const [open, setOpen] = useState(false)
  const [tab, setTab] = useState('upload')
  const [url, setUrl] = useState('')
  const [objectUrl, setObjectUrl] = useState(() => {
    if (!fileId) return null
    return IMAGE_FILE_URL_CACHE.get(fileId) || null
  })

  const hasImage = Boolean(objectUrl || src)
  const displaySrc = objectUrl || (src && getMediaUrl ? getMediaUrl(src) : src)

  const migrationRef = useRef({ running: false, doneFor: null })

  const modalRef = useRef(null)
  const modalSourceRef = useRef(`image-block-${Math.random().toString(36).slice(2)}`)
  const [modalPos, setModalPos] = useState({ x: 0, y: 0 })
  const dragOffset = useRef({ x: 0, y: 0 })
  const modalPortalTarget = typeof document !== 'undefined' ? document.body : null
  const renderModalPortal = (node) => {
    if (!node) return null
    return modalPortalTarget ? createPortal(node, modalPortalTarget) : node
  }

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

  const safeSetNodeSelectionHere = e => {
    if (e?.button != null && e.button !== 0) return

    const t = e?.target
    if (t instanceof Element && t.closest('input, textarea, select')) return

    const pos = typeof getPos === 'function' ? getPos() : null
    if (typeof pos === 'number' && editor?.commands?.setNodeSelection) {
      editor.commands.setNodeSelection(pos)
    }
  }

  /* ================= OPEN MODAL ================= */

  const openAtEvent = e => {
    if (!canEdit) return
    e.stopPropagation()
    // Позиция рядом с курсором мыши
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

  /* ================= CLOSE ================= */

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

  /* ================= SET IMAGE ================= */

  const setImage = nextSrc => {
    updateAttributes({ src: nextSrc, fileId: null })
    setOpen(false)
    setUrl('')
  }

  const onUpload = file => {
    if (!file || !file.type.startsWith('image/')) return
    ;(async () => {
      try {
        if (docUploadImage) {
          const path = await docUploadImage(file)
          if (path) {
            updateAttributes({ src: path, fileId: null })
          } else {
            const saved = await saveFile(file)
            updateAttributes({ fileId: saved.id, src: null })
          }
        } else {
          const saved = await saveFile(file)
          updateAttributes({ fileId: saved.id, src: null })
        }
      } catch {
        const blobUrl = URL.createObjectURL(file)
        updateAttributes({ src: blobUrl, fileId: null })
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
      if (!file.type.startsWith('image/')) return
      onUpload(file)
      return
    }

    const url =
      dt.getData('text/uri-list') ||
      dt.getData('text/plain')

    if (!url) return

    if (url.startsWith('data:')) {
      ;(async () => {
        try {
          const blob = await blobFromDataUrl(url)
          if (docUploadImage) {
            const file = new File([blob], 'image', { type: blob.type })
            const path = await docUploadImage(file)
            if (path) {
              updateAttributes({ src: path, fileId: null })
              return
            }
          }
          const id = await saveBlobAsFile({ blob, mimeType: blob.type })
          updateAttributes({ fileId: id, src: null })
        } catch {
          setImage(url)
        }
      })()
      return
    }

    if (url.startsWith('blob:')) {
      ;(async () => {
        try {
          const blob = await blobFromUrl(url)
          if (docUploadImage) {
            const file = new File([blob], 'image', { type: blob.type })
            const path = await docUploadImage(file)
            if (path) {
              updateAttributes({ src: path, fileId: null })
              return
            }
          }
          const id = await saveBlobAsFile({ blob, mimeType: blob.type })
          updateAttributes({ fileId: id, src: null })
        } catch {
          setImage(url)
        }
      })()
      return
    }

    setImage(url)
  }

  /* ================= RESOLVE LOCAL FILE ================= */

  useEffect(() => {
    let cancelled = false

    ;(async () => {
      if (!fileId) {
        setObjectUrl(null)
        return
      }

      const cached = IMAGE_FILE_URL_CACHE.get(fileId)
      if (cached) {
        setObjectUrl(cached)
        return
      }

      try {
        const record = await getFileRecord(fileId)
        if (!record?.blob) {
          if (!cancelled) setObjectUrl(null)
          return
        }
        const nextUrl = URL.createObjectURL(record.blob)
        IMAGE_FILE_URL_CACHE.set(fileId, nextUrl)
        if (!cancelled) setObjectUrl(nextUrl)
      } catch {
        if (!cancelled) setObjectUrl(null)
      }
    })()

    return () => {
      cancelled = true
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

        if (docUploadImage) {
          const file = new File([blob], 'image', { type: blob.type })
          const path = await docUploadImage(file)
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
  }, [fileId, src, updateAttributes, docUploadImage])

  // Legacy image blocks could keep fixed height from old resize logic.
  // Drop it once to restore natural aspect-ratio rendering.
  useEffect(() => {
    if (!hasImage) return
    if (typeof height !== 'number') return
    updateAttributes({ height: null })
  }, [hasImage, height, updateAttributes])

  /* ================= RESIZE ================= */

  const clamp = (value, min, max) => Math.min(max, Math.max(min, value))

  const startResize = (e, side) => {
    if (!canEdit) return
    e.preventDefault()
    e.stopPropagation()

    const startX = e.clientX
    const startY = e.clientY
    const minWidth = IMAGE_MIN_WIDTH

    const wrapperEl = e.currentTarget?.closest?.('[data-node-view-wrapper]')
    const proseMirrorEl = wrapperEl?.closest?.('.ProseMirror') || wrapperEl?.parentElement

    const proseStyles = proseMirrorEl ? window.getComputedStyle(proseMirrorEl) : null
    const paddingLeft = proseStyles ? parseFloat(proseStyles.paddingLeft) || 0 : 0
    const paddingRight = proseStyles ? parseFloat(proseStyles.paddingRight) || 0 : 0
    const maxWidth = Math.max(IMAGE_MIN_WIDTH, Math.floor((proseMirrorEl?.clientWidth || 700) - paddingLeft - paddingRight))

    const imgEl = wrapperEl?.querySelector?.('.image-preview img')
    const imgRect = imgEl?.getBoundingClientRect?.()

    const startWidth = Number.isFinite(width) ? width : Math.round(imgRect?.width || IMAGE_MIN_WIDTH)
    const naturalRatio =
      Number.isFinite(imgEl?.naturalWidth) &&
      Number.isFinite(imgEl?.naturalHeight) &&
      imgEl.naturalWidth > 0 &&
      imgEl.naturalHeight > 0
        ? imgEl.naturalWidth / imgEl.naturalHeight
        : null
    const renderedRatio =
      Number.isFinite(imgRect?.width) &&
      Number.isFinite(imgRect?.height) &&
      imgRect.width > 0 &&
      imgRect.height > 0
        ? imgRect.width / imgRect.height
        : null
    const attrsRatio =
      typeof height === 'number' && height > 0 && startWidth > 0
        ? startWidth / height
        : null
    const ratio = naturalRatio || renderedRatio || attrsRatio || 1

    const move = ev => {
      let widthDelta = 0

      if (side === 'right') widthDelta = ev.clientX - startX
      if (side === 'left') widthDelta = startX - ev.clientX
      if (side === 'bottom') widthDelta = (ev.clientY - startY) * ratio
      if (side === 'top') widthDelta = (startY - ev.clientY) * ratio

      const nextWidth = clamp(startWidth + widthDelta, minWidth, maxWidth)
      updateAttributes({
        width: Math.round(nextWidth),
        height: null,
      })
    }

    const up = () => {
      document.removeEventListener('mousemove', move)
      document.removeEventListener('mouseup', up)
    }

    document.addEventListener('mousemove', move)
    document.addEventListener('mouseup', up)
  }

  if (!canEdit && !hasImage) return null

  return (
    <NodeViewWrapper
      className="image-block-wrapper block-resizable"
      onMouseDown={safeSetNodeSelectionHere}
      style={{ width, ...alignMargins }}
    >
      {/* RESIZE HANDLES */}
      {canEdit && (
        <>
          <div className="block-resize left" contentEditable={false} onMouseDown={e => startResize(e, 'left')} />
          <div className="block-resize right" contentEditable={false} onMouseDown={e => startResize(e, 'right')} />
        </>
      )}
      {canEdit && hasImage && (
        <>
          <div className="block-resize top" contentEditable={false} onMouseDown={e => startResize(e, 'top')} />
          <div className="block-resize bottom" contentEditable={false} onMouseDown={e => startResize(e, 'bottom')} />
        </>
      )}

      {/* EMPTY */}
      {!(objectUrl || src) && (
        // <div
        //   className="image-empty"
        //   onClick={openAtEvent}
        //   onDragOver={e => {
        //     e.preventDefault()
        //     e.currentTarget.classList.add('drag-over')
        //   }}
        //   onDragLeave={e =>
        //     e.currentTarget.classList.remove('drag-over')
        //   }
        //   onDrop={handleDrop}
        // >
        //   + Добавить изображение
        // </div>


        <div
          className="file-empty"
          onClick={canEdit ? openAtEvent : undefined}
          onDragOver={
            canEdit
              ? e => {
                  e.preventDefault()
                  e.currentTarget.classList.add('drag-over')
                }
              : undefined
          }
          onDragLeave={
            canEdit
              ? e => e.currentTarget.classList.remove('drag-over')
              : undefined
          }
          onDrop={canEdit ? handleDrop : undefined}
        >
          + Добавить изображение
        </div>
      )}

      {/* IMAGE */}
      {(objectUrl || src) && (
        <div className="image-preview" style={{ width: '100%' }}>
          <img
            src={displaySrc}
            draggable
            onDragStart={e => {
              e.stopPropagation()
              e.dataTransfer.effectAllowed = 'copy'
              const s = displaySrc
              e.dataTransfer.setData('text/uri-list', s)
              e.dataTransfer.setData('text/plain', s)
            }}
            onClick={() => {
              const s = displaySrc
              window.dispatchEvent(
                new CustomEvent('open-viewer', {
                  detail: {
                    images: [s],
                    index: 0,
                  },
                })
              )
            }}
            style={{ cursor: 'pointer' }}
          />
          {canEdit && (
            <button
              className="image-more-btn"
              onClick={openAtEvent}
            >
              ⋮
            </button>
          )}

          {showCaption && (
            <input
              className="image-caption"
              placeholder="Комментарий"
              value={caption}
              readOnly={!canEdit}
              onChange={
                canEdit
                  ? e => updateAttributes({ caption: e.target.value })
                  : undefined
              }
            />
          )}
        </div>
      )}

      {/* MODAL */}
      {canEdit && open && renderModalPortal(
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
                Выбрать изображение
                <input
                  type="file"
                  accept="image/*"
                  hidden
                  onChange={e =>
                    onUpload(e.target.files[0])
                  }
                />
              </label>
            )}

            {(objectUrl || src) && (
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
                <button onClick={() => url && setImage(url)}>
                  Вставить
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </NodeViewWrapper>
  )
}
