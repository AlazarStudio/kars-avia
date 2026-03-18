import { NodeViewWrapper } from '@tiptap/react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import LinkRoundedIcon from '@mui/icons-material/LinkRounded'
import './imageBlockModal.css'
import './galleryBlock.css'
import './fileEmpty.css'
import './blockResize.css'
import { blobFromDataUrl, blobFromUrl, getFileRecord } from '../storage/fileStore'
import { useDocumentationUpload } from '../DocumentationUploadContext'
import { notifyDocumentationUploadFailure } from '../DocumentationUploadStore'
import { clampFixedModalPosition, MODAL_VIEWPORT_MARGIN } from '../utils/modalViewportClamp'

const SINGLE_MODAL_EVENT = 'doclist-single-modal-open'

const DEFAULT_GALLERY_WIDTH = 520
const DEFAULT_GALLERY_LAYOUT = 'grid'
const DEFAULT_GALLERY_COLUMNS = 3
const DEFAULT_GALLERY_GAP = 12
const MIN_GALLERY_WIDTH = 200
const MAX_GALLERY_WIDTH = 4096
const GALLERY_INTERNAL_DND_MIME = 'application/x-doclist-gallery-index'
const GALLERY_MODAL_ESTIMATED_SIZE = { width: 360, height: 260 }
const STRIP_WHEEL_MOUSE_DELTA_THRESHOLD_PX = 40
const STRIP_WHEEL_MOUSE_BOOST = 2.2
const STRIP_WHEEL_TRACKPAD_BOOST = 1.25
const STRIP_WHEEL_MOUSE_MIN_STEP_PX = 180

const HINT_OPEN_IMAGE = '\u041e\u0442\u043a\u0440\u044b\u0442\u044c \u0438\u0437\u043e\u0431\u0440\u0430\u0436\u0435\u043d\u0438\u0435'
const HINT_OPEN_AND_REORDER = '\u041e\u0442\u043a\u0440\u044b\u0442\u044c \u0438\u0437\u043e\u0431\u0440\u0430\u0436\u0435\u043d\u0438\u0435. \u041f\u0435\u0440\u0435\u0442\u0430\u0449\u0438\u0442\u0435, \u0447\u0442\u043e\u0431\u044b \u0438\u0437\u043c\u0435\u043d\u0438\u0442\u044c \u043f\u043e\u0440\u044f\u0434\u043e\u043a'
const HINT_DELETE_IMAGE = '\u0423\u0434\u0430\u043b\u0438\u0442\u044c \u0438\u0437\u043e\u0431\u0440\u0430\u0436\u0435\u043d\u0438\u0435'
const HINT_REPLACE_IMAGE = '\u0417\u0430\u043c\u0435\u043d\u0438\u0442\u044c \u0438\u0437\u043e\u0431\u0440\u0430\u0436\u0435\u043d\u0438\u0435'
const HINT_ADD_IMAGE = '\u0414\u043e\u0431\u0430\u0432\u0438\u0442\u044c \u0438\u0437\u043e\u0431\u0440\u0430\u0436\u0435\u043d\u0438\u0435'
const HINT_LAYOUT_GRID = '\u0420\u0435\u0436\u0438\u043c: \u0441\u0435\u0442\u043a\u0430'
const HINT_LAYOUT_MASONRY = '\u0420\u0435\u0436\u0438\u043c: \u043a\u043b\u0430\u0434\u043a\u0430'
const HINT_LAYOUT_STRIP = '\u0420\u0435\u0436\u0438\u043c: \u043b\u0435\u043d\u0442\u0430'

const clamp = (value, min, max) => Math.min(max, Math.max(min, value))

export default function GalleryBlockView({ editor, node, updateAttributes, getPos }) {
  const docUpload = useDocumentationUpload()
  const { uploadImage: docUploadImage, getMediaUrl, getMediaUrlCandidates } = docUpload || {}
  const canEdit = editor?.isEditable !== false

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
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [tab, setTab] = useState('upload')
  const [url, setUrl] = useState('')
  const [replaceTargetIndex, setReplaceTargetIndex] = useState(null)
  const [objectUrls, setObjectUrls] = useState(() => new Map())
  const [fallbackIndexes, setFallbackIndexes] = useState({})
  const [draggedImageIndex, setDraggedImageIndex] = useState(null)
  const [dropInsertIndex, setDropInsertIndex] = useState(null)
  const [dropEdgeHint, setDropEdgeHint] = useState(null)

  const imagesRef = useRef(images)
  const galleryGridRef = useRef(null)
  const modalRef = useRef(null)
  const settingsModalRef = useRef(null)
  const modalSourceRef = useRef(`gallery-block-${Math.random().toString(36).slice(2)}`)
  const [modalPos, setModalPos] = useState({ x: 0, y: 0 })
  const dragOffset = useRef({ x: 0, y: 0 })
  const modalPortalTarget = typeof document !== 'undefined' ? document.body : null
  const renderModalPortal = (node) => {
    if (!node) return null
    return modalPortalTarget ? createPortal(node, modalPortalTarget) : node
  }
  const migrationRef = useRef(new Set())

  useEffect(() => {
    imagesRef.current = images
  }, [images])

  useEffect(() => {
    setFallbackIndexes({})
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
    if (!canEdit) return
    e.preventDefault()
    e.stopPropagation()
    setSettingsOpen(false)
    setReplaceTargetIndex(null)
    const rect = modalRef.current?.getBoundingClientRect?.()
    setModalPos(
      clampFixedModalPosition(
        { x: e.clientX + 10, y: e.clientY - 10 },
        rect || GALLERY_MODAL_ESTIMATED_SIZE,
        MODAL_VIEWPORT_MARGIN
      )
    )
    announceModalOpen()
    setOpen(true)
  }

  const openReplaceAtEvent = (e, index) => {
    if (!canEdit) return
    if (!Number.isInteger(index)) return
    e.preventDefault()
    e.stopPropagation()
    setSettingsOpen(false)
    setReplaceTargetIndex(index)
    const rect = modalRef.current?.getBoundingClientRect?.()
    setModalPos(
      clampFixedModalPosition(
        { x: e.clientX + 10, y: e.clientY - 10 },
        rect || GALLERY_MODAL_ESTIMATED_SIZE,
        MODAL_VIEWPORT_MARGIN
      )
    )
    announceModalOpen()
    setOpen(true)
  }

  const openSettingsAtEvent = e => {
    if (!canEdit) return
    e.preventDefault()
    e.stopPropagation()
    setOpen(false)
    setReplaceTargetIndex(null)
    announceModalOpen()
    setSettingsOpen(prev => !prev)
  }

  useEffect(() => {
    const onExternalModalOpen = event => {
      if (event?.detail?.source === modalSourceRef.current) return
      setOpen(false)
      setSettingsOpen(false)
      setReplaceTargetIndex(null)
    }

    window.addEventListener(SINGLE_MODAL_EVENT, onExternalModalOpen)
    return () => {
      window.removeEventListener(SINGLE_MODAL_EVENT, onExternalModalOpen)
    }
  }, [])

  useEffect(() => {
    if (!open && !settingsOpen) return
    const close = e => {
      const target = e.target
      if (modalRef.current && modalRef.current.contains(target)) return
      if (settingsModalRef.current && settingsModalRef.current.contains(target)) return
      setOpen(false)
      setSettingsOpen(false)
      setReplaceTargetIndex(null)
    }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [open, settingsOpen])

  useEffect(() => {
    if (!open) return

    const clampModalToViewport = () => {
      const rect = modalRef.current?.getBoundingClientRect?.()
      if (!rect) return
      setModalPos(prev => {
        const next = clampFixedModalPosition(prev, rect, MODAL_VIEWPORT_MARGIN)
        if (next.x === prev.x && next.y === prev.y) return prev
        return next
      })
    }

    const rafId = window.requestAnimationFrame(clampModalToViewport)
    window.addEventListener('resize', clampModalToViewport)
    return () => {
      window.cancelAnimationFrame(rafId)
      window.removeEventListener('resize', clampModalToViewport)
    }
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
    const rect = modalRef.current?.getBoundingClientRect?.()
    setModalPos(
      clampFixedModalPosition(
        {
          x: e.clientX - dragOffset.current.x,
          y: e.clientY - dragOffset.current.y,
        },
        rect || GALLERY_MODAL_ESTIMATED_SIZE,
        MODAL_VIEWPORT_MARGIN
      )
    )
  }

  const stopDragModal = () => {
    document.removeEventListener('mousemove', onDragModal)
    document.removeEventListener('mouseup', stopDragModal)
  }

  const startResize = (e, side) => {
    if (!canEdit) return
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

  const addImage = (item, replaceIndex = null) => {
    if (!canEdit) return
    const nextImages = [...imagesRef.current]
    const shouldReplace =
      Number.isInteger(replaceIndex) &&
      replaceIndex >= 0 &&
      replaceIndex < nextImages.length
    if (shouldReplace) {
      nextImages[replaceIndex] = { ...item }
    } else {
      nextImages.push({ ...item })
    }
    updateAttributes({
      images: nextImages,
    })
    setOpen(false)
    setUrl('')
    setReplaceTargetIndex(null)
  }

  const onUpload = (file, replaceIndex = replaceTargetIndex) => {
    if (!canEdit) return
    if (!file || !file.type.startsWith('image/')) return
    ;(async () => {
      try {
        if (!docUploadImage) {
          throw new Error('Documentation upload service is unavailable')
        }
        const path = await docUploadImage(file)
        addImage({ src: path }, replaceIndex)
      } catch (error) {
        notifyDocumentationUploadFailure(error, 'изображение')
      }
    })()
  }

  const getInternalDragIndex = dataTransfer => {
    if (!dataTransfer) return null
    const rawIndex = dataTransfer.getData(GALLERY_INTERNAL_DND_MIME)
    if (rawIndex == null || rawIndex === '') return null
    const parsed = Number.parseInt(rawIndex, 10)
    return Number.isInteger(parsed) ? parsed : null
  }

  const clearGalleryDragState = () => {
    setDraggedImageIndex(null)
    setDropInsertIndex(null)
    setDropEdgeHint(null)
    if (galleryGridRef.current instanceof HTMLElement) {
      galleryGridRef.current.classList.remove('drag-over')
    }
  }

  const moveImage = (fromIndex, rawInsertIndex) => {
    if (!canEdit) return
    const current = imagesRef.current
    if (!Array.isArray(current) || current.length < 2) return
    if (!Number.isInteger(fromIndex)) return
    if (fromIndex < 0 || fromIndex >= current.length) return

    let insertIndex = Number.isInteger(rawInsertIndex) ? rawInsertIndex : current.length
    insertIndex = clamp(insertIndex, 0, current.length)

    const nextImages = [...current]
    const [moved] = nextImages.splice(fromIndex, 1)
    if (!moved) return

    if (fromIndex < insertIndex) {
      insertIndex -= 1
    }
    insertIndex = clamp(insertIndex, 0, nextImages.length)
    if (insertIndex === fromIndex) return

    nextImages.splice(insertIndex, 0, moved)
    updateAttributes({ images: nextImages })
  }

  const handleExternalDrop = dataTransfer => {
    if (!dataTransfer) return

    if (dataTransfer.files && dataTransfer.files.length) {
      const file = dataTransfer.files[0]
      if (!file.type.startsWith('image/')) return
      onUpload(file, null)
      return
    }

    const droppedUrl = dataTransfer.getData('text/uri-list') || dataTransfer.getData('text/plain')
    if (!droppedUrl) return

    if (droppedUrl.startsWith('data:')) {
      void (async () => {
        try {
          if (!docUploadImage) {
            throw new Error('Documentation upload service is unavailable')
          }
          const blob = await blobFromDataUrl(droppedUrl)
          const file = new File([blob], 'image', { type: blob.type })
          const path = await docUploadImage(file)
          addImage({ src: path }, null)
        } catch (error) {
          notifyDocumentationUploadFailure(error, 'изображение')
        }
      })()
      return
    }

    if (droppedUrl.startsWith('blob:')) {
      void (async () => {
        try {
          if (!docUploadImage) {
            throw new Error('Documentation upload service is unavailable')
          }
          const blob = await blobFromUrl(droppedUrl)
          const file = new File([blob], 'image', { type: blob.type })
          const path = await docUploadImage(file)
          addImage({ src: path }, null)
        } catch (error) {
          notifyDocumentationUploadFailure(error, 'изображение')
        }
      })()
      return
    }

    if (droppedUrl.startsWith('http')) {
      addImage({ src: droppedUrl }, null)
    }
  }

  const resolveInsertIndexForItem = (event, targetIndex) => {
    if (!event?.currentTarget || !Number.isInteger(targetIndex)) {
      return { insertIndex: targetIndex, edge: null }
    }
    const rect = event.currentTarget.getBoundingClientRect()
    if (!rect || !Number.isFinite(rect.left) || !Number.isFinite(rect.top)) {
      return { insertIndex: targetIndex, edge: null }
    }

    const useVerticalAxis = layout === 'masonry' || (layout === 'grid' && columns <= 1)
    const isAfter = useVerticalAxis
      ? event.clientY > rect.top + rect.height / 2
      : event.clientX > rect.left + rect.width / 2
    const edge = useVerticalAxis
      ? (isAfter ? 'bottom' : 'top')
      : (isAfter ? 'right' : 'left')
    return {
      insertIndex: isAfter ? targetIndex + 1 : targetIndex,
      edge,
    }
  }

  const handleDrop = (e, explicitInsertIndex = null) => {
    if (!canEdit) return
    e.preventDefault()
    e.stopPropagation()
    e.currentTarget.classList.remove('drag-over')
    if (galleryGridRef.current instanceof HTMLElement) {
      galleryGridRef.current.classList.remove('drag-over')
    }

    const dt = e.dataTransfer
    let internalFromIndex = getInternalDragIndex(dt)
    if (internalFromIndex == null && Number.isInteger(draggedImageIndex)) {
      internalFromIndex = draggedImageIndex
    }
    if (internalFromIndex != null) {
      const fallbackInsertIndex = imagesRef.current.length
      const insertIndex = Number.isInteger(explicitInsertIndex)
        ? explicitInsertIndex
        : Number.isInteger(dropInsertIndex)
          ? dropInsertIndex
          : fallbackInsertIndex
      moveImage(internalFromIndex, insertIndex)
      clearGalleryDragState()
      return
    }

    clearGalleryDragState()
    handleExternalDrop(dt)
  }

  const removeImage = index => {
    if (!canEdit) return
    updateAttributes({
      images: images.filter((_, i) => i !== index),
    })
  }

  const displayedSrcFor = (img, index = -1) => {
    if (img?.fileId && objectUrls.has(img.fileId)) return objectUrls.get(img.fileId)
    const rawSrc = img?.src ?? null
    if (!rawSrc) return rawSrc

    const candidates = getMediaUrlCandidates
      ? getMediaUrlCandidates(rawSrc)
      : [getMediaUrl ? getMediaUrl(rawSrc) : rawSrc]
    const safeCandidates = Array.isArray(candidates) ? candidates.filter(Boolean) : [rawSrc]
    const fallbackIndex = Number.isInteger(fallbackIndexes[index]) ? fallbackIndexes[index] : 0
    return safeCandidates[Math.min(fallbackIndex, Math.max(0, safeCandidates.length - 1))] || rawSrc
  }

  const advanceFallbackIndex = index => {
    if (!Number.isInteger(index)) return

    const img = imagesRef.current[index]
    const rawSrc = img?.src ?? null
    if (!rawSrc || img?.fileId) return

    const candidates = getMediaUrlCandidates
      ? getMediaUrlCandidates(rawSrc)
      : [getMediaUrl ? getMediaUrl(rawSrc) : rawSrc]
    const safeCandidates = Array.isArray(candidates) ? candidates.filter(Boolean) : []
    if (safeCandidates.length < 2) return

    setFallbackIndexes(prev => {
      const currentIndex = Number.isInteger(prev[index]) ? prev[index] : 0
      if (currentIndex + 1 >= safeCandidates.length) return prev
      return {
        ...prev,
        [index]: currentIndex + 1,
      }
    })
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

    void (async () => {
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
          if (!docUploadImage) return
          const blob = img.src.startsWith('data:')
            ? await blobFromDataUrl(img.src)
            : await blobFromUrl(img.src)

          const file = new File([blob], 'image', { type: blob.type })
          const path = await docUploadImage(file)
          const nextImages = [...images]
          nextImages[index] = { ...nextImages[index], src: path }
          delete nextImages[index].fileId
          updateAttributes({ images: nextImages })
        } catch (error) {
          console.error('Failed to migrate documentation gallery image to server upload:', error)
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

    const deltaRaw = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY
    if (!deltaRaw) return

    const deltaPx =
      e.deltaMode === 1
        ? deltaRaw * 16
        : e.deltaMode === 2
          ? deltaRaw * scroller.clientHeight
          : deltaRaw

    const isMouseWheel = Math.abs(deltaPx) >= STRIP_WHEEL_MOUSE_DELTA_THRESHOLD_PX
    let delta = deltaPx * (isMouseWheel ? STRIP_WHEEL_MOUSE_BOOST : STRIP_WHEEL_TRACKPAD_BOOST)

    if (isMouseWheel && Math.abs(delta) < STRIP_WHEEL_MOUSE_MIN_STEP_PX) {
      delta = Math.sign(delta || deltaPx) * STRIP_WHEEL_MOUSE_MIN_STEP_PX
    }

    scroller.scrollLeft += delta
  }

  const handleGridDragOver = e => {
    if (!canEdit) return

    const internalFromIndex = getInternalDragIndex(e.dataTransfer)
    const isInternalDrag = internalFromIndex != null || Number.isInteger(draggedImageIndex)
    if (isInternalDrag) {
      e.preventDefault()
      e.stopPropagation()
      e.dataTransfer.dropEffect = 'move'
      e.currentTarget.classList.remove('drag-over')
      setDropInsertIndex(imagesRef.current.length)
      setDropEdgeHint(null)
      return
    }

    if (!hasImages) return
    e.preventDefault()
    e.currentTarget.classList.add('drag-over')
  }

  const handleGridDragLeave = e => {
    if (!canEdit) return
    if (e.currentTarget.contains(e.relatedTarget)) return
    e.currentTarget.classList.remove('drag-over')
    if (draggedImageIndex == null) {
      setDropInsertIndex(null)
      setDropEdgeHint(null)
    }
  }

  const handleItemDragOver = (e, index) => {
    if (!canEdit) return
    const internalFromIndex = getInternalDragIndex(e.dataTransfer)
    if (internalFromIndex == null && !Number.isInteger(draggedImageIndex)) return
    e.preventDefault()
    e.stopPropagation()
    e.dataTransfer.dropEffect = 'move'
    if (galleryGridRef.current instanceof HTMLElement) {
      galleryGridRef.current.classList.remove('drag-over')
    }
    const { insertIndex, edge } = resolveInsertIndexForItem(e, index)
    setDropInsertIndex(insertIndex)
    setDropEdgeHint({ index, edge })
  }

  const handleItemDrop = (e, index) => {
    const { insertIndex } = resolveInsertIndexForItem(e, index)
    handleDrop(e, insertIndex)
  }

  if (!canEdit && !hasImages) return null

  const addImageButton = canEdit ? (
    <button
      type="button"
      className="gallery-add-circle"
      onClick={openAtEvent}
      title={HINT_ADD_IMAGE}
      aria-label={HINT_ADD_IMAGE}
    >
      +
    </button>
  ) : null

  return (
    <NodeViewWrapper
      className="gallery-block block-resizable"
      onMouseDown={safeSetNodeSelectionHere}
      style={{
        width,
        ...alignMargins,
      }}
    >
      {canEdit && (
        <>
          <div className="block-resize left" contentEditable={false} onMouseDown={e => startResize(e, 'left')} />
          <div className="block-resize right" contentEditable={false} onMouseDown={e => startResize(e, 'right')} />
        </>
      )}

      {canEdit && hasImages && (
        <>
          <button
            type="button"
            className={`gallery-settings-trigger${settingsOpen ? ' is-open' : ''}`}
            contentEditable={false}
            onMouseDown={e => {
              e.preventDefault()
              e.stopPropagation()
            }}
            onClick={openSettingsAtEvent}
            aria-label={'\u041d\u0430\u0441\u0442\u0440\u043e\u0439\u043a\u0438 \u0433\u0430\u043b\u0435\u0440\u0435\u0438'}
            title={'\u041d\u0430\u0441\u0442\u0440\u043e\u0439\u043a\u0438 \u0433\u0430\u043b\u0435\u0440\u0435\u0438'}
          >
            {'\u22ee'}
          </button>
          <div
            ref={settingsModalRef}
            className={`gallery-layout-controls${settingsOpen ? ' is-open' : ''}`}
            contentEditable={false}
            onMouseDown={e => e.stopPropagation()}
          >
          <div className="gallery-layout-row">
            <button
              type="button"
              className={layout === 'grid' ? 'active' : ''}
              onClick={() => updateAttributes({ layout: 'grid' })}
              title={HINT_LAYOUT_GRID}
            >
              {'\u0421\u0435\u0442\u043a\u0430'}
            </button>
            <button
              type="button"
              className={layout === 'masonry' ? 'active' : ''}
              onClick={() => updateAttributes({ layout: 'masonry' })}
              title={HINT_LAYOUT_MASONRY}
            >
              {'\u041a\u043b\u0430\u0434\u043a\u0430'}
            </button>
            <button
              type="button"
              className={layout === 'strip' ? 'active' : ''}
              onClick={() => updateAttributes({ layout: 'strip' })}
              title={HINT_LAYOUT_STRIP}
            >
              {'\u041b\u0435\u043d\u0442\u0430'}
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
                  {col} {'\u043a\u043e\u043b.'}
                </button>
              ))}
            </div>
          )}

          </div>
        </>
      )}

      <div
        ref={galleryGridRef}
        className={`gallery-grid layout-${layout} fit-contain${draggedImageIndex != null ? ' is-reordering' : ''}`}
        style={galleryGridStyle}
        onWheelCapture={handleGalleryWheel}
        onWheel={handleGalleryWheel}
        onDragOver={canEdit ? handleGridDragOver : undefined}
        onDragLeave={canEdit ? handleGridDragLeave : undefined}
        onDrop={canEdit ? e => handleDrop(e, imagesRef.current.length) : undefined}
      >
        {images.map((img, i) => {
          const displaySrc = displayedSrcFor(img, i)
          const isDragging = draggedImageIndex === i
          const dropEdge = dropEdgeHint?.index === i ? dropEdgeHint.edge : null
          const dropEdgeClass = dropEdge ? ` is-drop-${dropEdge}` : ''
          return (
            <div
              key={i}
              className={`gallery-item${isDragging ? ' is-dragging' : ''}${dropEdgeClass}`}
              onDragOver={canEdit ? e => handleItemDragOver(e, i) : undefined}
              onDrop={canEdit ? e => handleItemDrop(e, i) : undefined}
            >
              <div className="gallery-item-inner">
                {displaySrc ? (
                  <>
                    <img
                      className="gallery-image-backdrop"
                      src={displaySrc || undefined}
                      alt=""
                      aria-hidden="true"
                      draggable={false}
                      onError={() => advanceFallbackIndex(i)}
                    />
                    <img
                      className="gallery-image-main"
                      src={displaySrc || undefined}
                      draggable={canEdit}
                      title={canEdit ? HINT_OPEN_AND_REORDER : HINT_OPEN_IMAGE}
                      onDragStart={e => {
                        e.stopPropagation()
                        if (!canEdit) {
                          e.preventDefault()
                          return
                        }
                        setDraggedImageIndex(i)
                        setDropInsertIndex(i)
                        setDropEdgeHint(null)
                        if (galleryGridRef.current instanceof HTMLElement) {
                          galleryGridRef.current.classList.remove('drag-over')
                        }
                        e.dataTransfer.effectAllowed = 'move'
                        e.dataTransfer.setData(GALLERY_INTERNAL_DND_MIME, String(i))
                        e.dataTransfer.setData('text/plain', '__doclist_gallery_internal__')
                      }}
                      onDragEnd={() => {
                        clearGalleryDragState()
                      }}
                      onError={() => advanceFallbackIndex(i)}
                      onClick={() => {
                        const displayImages = images.map((item, itemIndex) => displayedSrcFor(item, itemIndex)).filter(Boolean)
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

              {canEdit && (
                <>
                <button
                  type="button"
                  className="gallery-remove"
                  title={HINT_DELETE_IMAGE}
                  onMouseDown={e => {
                    e.preventDefault()
                    e.stopPropagation()
                  }}
                  onClick={e => {
                    e.stopPropagation()
                    removeImage(i)
                  }}
                >
                  {'\u00D7'}
                </button>
                <button
                  type="button"
                  className="gallery-replace"
                  aria-label={HINT_REPLACE_IMAGE}
                  title={HINT_REPLACE_IMAGE}
                  onMouseDown={e => {
                    e.preventDefault()
                    e.stopPropagation()
                  }}
                  onClick={e => {
                    openReplaceAtEvent(e, i)
                  }}
                >
                  <LinkRoundedIcon
                    aria-hidden="true"
                    fontSize="inherit"
                    style={{ width: 12, height: 12, fontSize: 12 }}
                  />
                </button>
                </>
              )}
            </div>
          )
        })}

        {!hasImages ? (
          <div
            className="file-empty gallery-empty"
            title={HINT_ADD_IMAGE}
            onClick={canEdit ? openAtEvent : undefined}
            onDragOver={
              canEdit
                ? e => {
                    e.preventDefault()
                    e.currentTarget.classList.add('drag-over')
                  }
                : undefined
            }
            onDragLeave={canEdit ? e => e.currentTarget.classList.remove('drag-over') : undefined}
            onDrop={canEdit ? handleDrop : undefined}
          >
            + {'\u0414\u043e\u0431\u0430\u0432\u0438\u0442\u044c \u0438\u0437\u043e\u0431\u0440\u0430\u0436\u0435\u043d\u0438\u0435'}
          </div>
        ) : canEdit ? (
          layout === 'masonry' || layout === 'strip' ? (
            <div className="gallery-add-slot">{addImageButton}</div>
          ) : (
            addImageButton
          )
        ) : null}
      </div>

      {canEdit && open && renderModalPortal(
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
              {'\u0417\u0430\u0433\u0440\u0443\u0437\u0438\u0442\u044c'}
            </button>
            <button
              className={tab === 'url' ? 'active' : ''}
              onClick={() => setTab('url')}
            >
              {'\u0421\u0441\u044b\u043b\u043a\u0430'}
            </button>
          </div>

          <div className="image-modal-content">
            {tab === 'upload' && (
              <label className="image-upload-btn">
                {'\u0412\u044b\u0431\u0440\u0430\u0442\u044c \u0438\u0437\u043e\u0431\u0440\u0430\u0436\u0435\u043d\u0438\u0435'}
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
                <button onClick={() => url && addImage({ src: url }, replaceTargetIndex)}>
                  {'\u0412\u0441\u0442\u0430\u0432\u0438\u0442\u044c'}
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </NodeViewWrapper>
  )
}
