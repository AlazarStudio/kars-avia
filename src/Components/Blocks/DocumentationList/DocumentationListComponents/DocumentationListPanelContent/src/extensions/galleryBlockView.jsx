import { NodeViewWrapper } from '@tiptap/react'
import { useEffect, useMemo, useRef, useState } from 'react'
import './imageBlockModal.css'
import './galleryBlock.css'
import './fileEmpty.css'
import './blockResize.css'
import { blobFromDataUrl, blobFromUrl, getFileRecord, saveBlobAsFile, saveFile } from '../storage/fileStore'
import { useDocumentationUpload } from '../DocumentationUploadContext'

const SINGLE_MODAL_EVENT = 'doclist-single-modal-open'

const DEFAULT_GALLERY_WIDTH = 520
const DEFAULT_GALLERY_LAYOUT = 'grid'
const DEFAULT_GALLERY_COLUMNS = 3
const DEFAULT_GALLERY_GAP = 12
const MIN_GALLERY_WIDTH = 320
const MAX_GALLERY_WIDTH = 4096

const clamp = (value, min, max) => Math.min(max, Math.max(min, value))

export default function GalleryBlockView({ editor, node, updateAttributes, getPos }) {
  const docUpload = useDocumentationUpload()
  const { uploadImage: docUploadImage, getMediaUrl } = docUpload || {}

  const images = useMemo(() => {
    return Array.isArray(node.attrs.images) ? node.attrs.images : []
  }, [node.attrs.images])

  const parsedWidth = Number(node.attrs.width)
  const width = clamp(
    Number.isFinite(parsedWidth) ? parsedWidth : DEFAULT_GALLERY_WIDTH,
    MIN_GALLERY_WIDTH,
    MAX_GALLERY_WIDTH
  )
  const textAlign = node.attrs.textAlign || 'left'
  const hasImages = images.length > 0
  const layout =
    node.attrs.layout === 'masonry' || node.attrs.layout === 'strip'
      ? node.attrs.layout
      : DEFAULT_GALLERY_LAYOUT
  const columns = clamp(
    Number.isFinite(Number(node.attrs.columns)) ? Number(node.attrs.columns) : DEFAULT_GALLERY_COLUMNS,
    1,
    4
  )
  const gap = clamp(
    Number.isFinite(Number(node.attrs.gap)) ? Number(node.attrs.gap) : DEFAULT_GALLERY_GAP,
    4,
    32
  )

  const alignMargins =
    textAlign === 'center'
      ? { marginLeft: 'auto', marginRight: 'auto' }
      : textAlign === 'right'
        ? { marginLeft: 'auto', marginRight: 0 }
        : { marginLeft: 0, marginRight: 'auto' }

  const [open, setOpen] = useState(false)
  const [tab, setTab] = useState('upload')
  const [url, setUrl] = useState('')
  const [objectUrls, setObjectUrls] = useState(() => new Map())

  const imagesRef = useRef(images)
  const modalRef = useRef(null)
  const modalSourceRef = useRef(`gallery-block-${Math.random().toString(36).slice(2)}`)
  const [modalPos, setModalPos] = useState({ x: 0, y: 0 })
  const dragOffset = useRef({ x: 0, y: 0 })
  const migrationRef = useRef(new Set())

  useEffect(() => {
    imagesRef.current = images
  }, [images])

  useEffect(() => {
    const nextWidth = clamp(
      Number.isFinite(parsedWidth) ? Math.round(parsedWidth) : DEFAULT_GALLERY_WIDTH,
      MIN_GALLERY_WIDTH,
      MAX_GALLERY_WIDTH
    )
    if (nextWidth !== node.attrs.width) {
      updateAttributes({ width: nextWidth })
    }
  }, [node.attrs.width, parsedWidth, updateAttributes])

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
    if (t instanceof Element && t.closest('input, textarea, select, button')) return

    const pos = typeof getPos === 'function' ? getPos() : null
    if (typeof pos === 'number' && editor?.commands?.setNodeSelection) {
      editor.commands.setNodeSelection(pos)
    }
  }

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

  const startResize = (e, side) => {
    e.preventDefault()
    e.stopPropagation()

    if (side !== 'left' && side !== 'right') return

    const startX = e.clientX

    const wrapperEl = e.currentTarget?.closest?.('[data-node-view-wrapper]')
    const proseMirrorEl = wrapperEl?.closest?.('.ProseMirror') || wrapperEl?.parentElement

    const proseStyles = proseMirrorEl ? window.getComputedStyle(proseMirrorEl) : null
    const paddingLeft = proseStyles ? parseFloat(proseStyles.paddingLeft) || 0 : 0
    const paddingRight = proseStyles ? parseFloat(proseStyles.paddingRight) || 0 : 0
    const contentMaxWidth = Math.floor((proseMirrorEl?.clientWidth || 700) - paddingLeft - paddingRight)
    const containerMaxWidth = Math.floor(proseMirrorEl?.clientWidth || 700)
    const maxWidth = clamp(
      Math.max(contentMaxWidth, containerMaxWidth),
      MIN_GALLERY_WIDTH,
      MAX_GALLERY_WIDTH
    )

    const startRect = wrapperEl?.getBoundingClientRect?.()
    const startWidth = Number.isFinite(width)
      ? width
      : Math.round(startRect?.width || maxWidth)

    const move = ev => {
      let deltaX = 0
      if (side === 'right') deltaX = ev.clientX - startX
      if (side === 'left') deltaX = startX - ev.clientX

      const nextWidth = clamp(startWidth + deltaX, MIN_GALLERY_WIDTH, maxWidth)
      updateAttributes({ width: Math.round(nextWidth) })
    }

    const up = () => {
      document.removeEventListener('mousemove', move)
      document.removeEventListener('mouseup', up)
    }

    document.addEventListener('mousemove', move)
    document.addEventListener('mouseup', up)
  }

  const addImage = item => {
    updateAttributes({
      images: [...imagesRef.current, { ...item }],
    })
    setOpen(false)
    setUrl('')
  }

  const onUpload = file => {
    if (!file || !file.type.startsWith('image/')) return
    ;(async () => {
      try {
        if (docUploadImage) {
          const path = await docUploadImage(file)
          if (path) addImage({ src: path })
        } else {
          const saved = await saveFile(file)
          addImage({ fileId: saved.id })
        }
      } catch {
        // ignore
      }
    })()
  }

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

    const droppedUrl = dt.getData('text/uri-list') || dt.getData('text/plain')
    if (!droppedUrl) return

    if (droppedUrl.startsWith('data:')) {
      ;(async () => {
        try {
          const blob = await blobFromDataUrl(droppedUrl)
          if (docUploadImage) {
            const file = new File([blob], 'image', { type: blob.type })
            const path = await docUploadImage(file)
            if (path) {
              addImage({ src: path })
              return
            }
          }
          const id = await saveBlobAsFile({ blob, mimeType: blob.type })
          addImage({ fileId: id })
        } catch {
          addImage({ src: droppedUrl })
        }
      })()
      return
    }

    if (droppedUrl.startsWith('blob:')) {
      ;(async () => {
        try {
          const blob = await blobFromUrl(droppedUrl)
          if (docUploadImage) {
            const file = new File([blob], 'image', { type: blob.type })
            const path = await docUploadImage(file)
            if (path) {
              addImage({ src: path })
              return
            }
          }
          const id = await saveBlobAsFile({ blob, mimeType: blob.type })
          addImage({ fileId: id })
        } catch {
          addImage({ src: droppedUrl })
        }
      })()
      return
    }

    if (droppedUrl.startsWith('http')) {
      addImage({ src: droppedUrl })
    }
  }

  const removeImage = index => {
    updateAttributes({
      images: images.filter((_, i) => i !== index),
    })
  }

  const displayedSrcFor = img => {
    if (img?.fileId && objectUrls.has(img.fileId)) return objectUrls.get(img.fileId)
    const rawSrc = img?.src ?? null
    return rawSrc && getMediaUrl ? getMediaUrl(rawSrc) : rawSrc
  }

  useEffect(() => {
    let cancelled = false
    const nextMap = new Map(objectUrls)
    const neededFileIds = new Set()

    images.forEach(img => {
      if (img?.fileId) neededFileIds.add(img.fileId)
    })

    for (const [id, blobUrl] of nextMap.entries()) {
      if (!neededFileIds.has(id)) {
        URL.revokeObjectURL(blobUrl)
        nextMap.delete(id)
      }
    }

    const toLoad = []
    neededFileIds.forEach(id => {
      if (!nextMap.has(id)) toLoad.push(id)
    })

    if (!toLoad.length) {
      setObjectUrls(nextMap)
      return () => {
        cancelled = true
      }
    }

    ;(async () => {
      for (const id of toLoad) {
        try {
          const record = await getFileRecord(id)
          if (!record?.blob) continue
          const blobUrl = URL.createObjectURL(record.blob)
          nextMap.set(id, blobUrl)
        } catch {
          // ignore
        }
      }
      if (!cancelled) setObjectUrls(new Map(nextMap))
    })()

    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [images])

  useEffect(() => {
    images.forEach((img, index) => {
      if (!img || img.fileId || !img.src) return
      if (typeof img.src !== 'string') return
      if (!img.src.startsWith('data:') && !img.src.startsWith('blob:')) return

      const key = `${index}:${img.src}`
      if (migrationRef.current.has(key)) return
      migrationRef.current.add(key)

      ;(async () => {
        try {
          const blob = img.src.startsWith('data:')
            ? await blobFromDataUrl(img.src)
            : await blobFromUrl(img.src)
          if (docUploadImage) {
            const file = new File([blob], 'image', { type: blob.type })
            const path = await docUploadImage(file)
            if (path) {
              const nextImages = [...images]
              nextImages[index] = { ...nextImages[index], src: path }
              delete nextImages[index].fileId
              updateAttributes({ images: nextImages })
              return
            }
          }
          const id = await saveBlobAsFile({ blob, mimeType: blob.type })
          const nextImages = [...images]
          nextImages[index] = { ...nextImages[index], fileId: id }
          delete nextImages[index].src
          updateAttributes({ images: nextImages })
        } catch {
          // ignore
        }
      })()
    })
  }, [images, updateAttributes, docUploadImage])

  const galleryGridStyle =
    layout === 'grid'
      ? {
          '--gallery-gap': `${gap}px`,
          gap: `${gap}px`,
          gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
        }
      : layout === 'masonry'
        ? {
            '--gallery-gap': `${gap}px`,
            columnCount: columns,
            columnGap: `${gap}px`,
          }
        : {
            '--gallery-gap': `${gap}px`,
            gap: `${gap}px`,
          }

  const handleGalleryWheel = e => {
    if (layout !== 'strip') return

    const scroller = e.currentTarget
    if (!(scroller instanceof HTMLElement)) return

    e.preventDefault()
    e.stopPropagation()

    const maxScrollLeft = scroller.scrollWidth - scroller.clientWidth
    if (maxScrollLeft <= 0) return

    const delta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY
    if (!delta) return

    scroller.scrollLeft += delta
  }

  return (
    <NodeViewWrapper
      className="gallery-block block-resizable"
      onMouseDown={safeSetNodeSelectionHere}
      style={{
        width,
        ...alignMargins,
      }}
    >
      <div className="block-resize left" contentEditable={false} onMouseDown={e => startResize(e, 'left')} />
      <div className="block-resize right" contentEditable={false} onMouseDown={e => startResize(e, 'right')} />

      {hasImages && (
        <div className="gallery-layout-controls" contentEditable={false}>
          <div className="gallery-layout-row">
            <button
              type="button"
              className={layout === 'grid' ? 'active' : ''}
              onClick={() => updateAttributes({ layout: 'grid' })}
            >
              Сетка
            </button>
            <button
              type="button"
              className={layout === 'masonry' ? 'active' : ''}
              onClick={() => updateAttributes({ layout: 'masonry' })}
            >
              Кладка
            </button>
            <button
              type="button"
              className={layout === 'strip' ? 'active' : ''}
              onClick={() => updateAttributes({ layout: 'strip' })}
            >
              Лента
            </button>
          </div>

          {(layout === 'grid' || layout === 'masonry') && (
            <div className="gallery-layout-row">
              {[2, 3, 4].map(col => (
                <button
                  key={col}
                  type="button"
                  className={columns === col ? 'active' : ''}
                  onClick={() => updateAttributes({ columns: col })}
                >
                  {col} кол.
                </button>
              ))}
            </div>
          )}

        </div>
      )}

      <div
        className={`gallery-grid layout-${layout} fit-contain`}
        style={galleryGridStyle}
        onWheelCapture={handleGalleryWheel}
        onWheel={handleGalleryWheel}
        onDragOver={
          hasImages
            ? e => {
                e.preventDefault()
                e.currentTarget.classList.add('drag-over')
              }
            : undefined
        }
        onDragLeave={
          hasImages
            ? e => e.currentTarget.classList.remove('drag-over')
            : undefined
        }
        onDrop={handleDrop}
      >
        {images.map((img, i) => {
          const displaySrc = displayedSrcFor(img)
          return (
            <div key={i} className="gallery-item">
              <div className="gallery-item-inner">
                {displaySrc ? (
                  <>
                    <img
                      className="gallery-image-backdrop"
                      src={displaySrc || undefined}
                      alt=""
                      aria-hidden="true"
                      draggable={false}
                    />
                    <img
                      className="gallery-image-main"
                      src={displaySrc || undefined}
                      draggable
                      onDragStart={e => {
                        e.stopPropagation()
                        e.dataTransfer.effectAllowed = 'copy'
                        e.dataTransfer.setData('text/uri-list', displaySrc)
                        e.dataTransfer.setData('text/plain', displaySrc)
                      }}
                      onClick={() => {
                        const displayImages = images.map(displayedSrcFor).filter(Boolean)
                        if (!displaySrc) return
                        window.dispatchEvent(
                          new CustomEvent('open-viewer', {
                            detail: {
                              images: displayImages,
                              index: Math.max(0, displayImages.indexOf(displaySrc)),
                            },
                          })
                        )
                      }}
                      style={{ cursor: 'pointer' }}
                    />
                  </>
                ) : (
                  <div className="gallery-image-placeholder" />
                )}
              </div>

              <button
                className="gallery-remove"
                onClick={e => {
                  e.stopPropagation()
                  removeImage(i)
                }}
              >
                ×
              </button>
            </div>
          )
        })}

        {!hasImages ? (
          <div
            className="file-empty gallery-empty"
            onClick={openAtEvent}
            onDragOver={e => {
              e.preventDefault()
              e.currentTarget.classList.add('drag-over')
            }}
            onDragLeave={e => e.currentTarget.classList.remove('drag-over')}
            onDrop={handleDrop}
          >
            + Добавить изображение
          </div>
        ) : (
          <button
            type="button"
            className="gallery-add-circle"
            onClick={openAtEvent}
            aria-label="Добавить изображение"
          >
            +
          </button>
        )}
      </div>

      {open && (
        <div
          ref={modalRef}
          className="image-modal"
          style={{
            top: modalPos.y,
            left: modalPos.x,
          }}
        >
          <div className="image-modal-header" onMouseDown={startDragModal} />

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
                  onChange={e => onUpload(e.target.files[0])}
                />
              </label>
            )}

            {tab === 'url' && (
              <>
                <input
                  placeholder="https://..."
                  value={url}
                  onChange={e => setUrl(e.target.value)}
                />
                <button onClick={() => url && addImage({ src: url })}>
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

