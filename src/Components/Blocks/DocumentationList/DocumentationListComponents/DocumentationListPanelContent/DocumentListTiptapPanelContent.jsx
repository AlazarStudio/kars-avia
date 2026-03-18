import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useQuery } from '@apollo/client'
import { EditorContent, useEditor } from '@tiptap/react'
import SaveRoundedIcon from '@mui/icons-material/SaveRounded'
import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded'
import ChevronLeftRoundedIcon from '@mui/icons-material/ChevronLeftRounded'
import ChevronRightRoundedIcon from '@mui/icons-material/ChevronRightRounded'
import { editorExtensions } from './src/editorExtensions'
import { DocumentationUploadProvider } from './src/DocumentationUploadContext'
import Toolbar from './src/components/Toolbar'
import PlusButtonOverlay from './src/PlusButtonOverlay'
import BlockDragOverlay from './src/components/BlockDragOverlay'
import BlockSelectionOverlay from './src/components/BlockSelectionOverlay'
import AnchorHashOverlay from './src/components/AnchorHashOverlay'
import ImageViewer from './src/ImageViewer'
import { GET_ARTICLE, getCookie } from '../../../../../../graphQL_requests'
import { saveDocLayout } from './docDraftStore'
import { bringDocModalToFront, findDocModalRoot } from './src/utils/modalStacking'

import './src/main.css'
import './DocumentListTiptapPanelContent.css'

const EMPTY_DOC = {
  type: 'doc',
  content: [{ type: 'paragraph' }],
}

const DEFAULT_ARTICLE_PADDING = Object.freeze({
  top: 14,
  right: 16,
  bottom: 14,
  left: 16,
})

const ARTICLE_WIDTH_PRESET_MAX = Object.freeze({
  level4: null,
  level3: 1080,
  level2: 860,
  level1: 720,
})

const DEFAULT_ARTICLE_WIDTH_MODE = 'preset'
const DEFAULT_ARTICLE_WIDTH_PRESET = 'level4'
const DEFAULT_ARTICLE_MANUAL_WIDTH = 1080
const DEFAULT_ARTICLE_PADDING_MODE = 'shared'
const EDITOR_CONTROLS_GUTTER_PX = 72
const GUTTER_TOGGLE_ANIMATION_MS = 160

const MIN_ARTICLE_CONTENT_SIZE = 120
const MAX_ARTICLE_PADDING = 260
const MIN_ARTICLE_WIDTH = 320
const MAX_ARTICLE_WIDTH = 2400

function isDocJson(value) {
  return Boolean(value && typeof value === 'object' && value.type === 'doc')
}

function normalizeIncomingDocContent(rawContent) {
  if (isDocJson(rawContent)) return rawContent

  if (typeof rawContent === 'string' && rawContent.trim()) {
    try {
      const parsed = JSON.parse(rawContent)
      if (isDocJson(parsed)) {
        return parsed
      }
    } catch {
      // ignore malformed JSON and fall back to an empty document
    }
  }

  return EMPTY_DOC
}

function isSameDocContentSemantically(editor, nextContent) {
  if (!editor || !isDocJson(nextContent)) return false

  try {
    const currentDoc = editor?.state?.doc
    const schema = editor?.state?.schema
    if (!currentDoc || !schema?.nodeFromJSON) return false

    const nextDoc = schema.nodeFromJSON(nextContent)
    return Boolean(nextDoc && typeof currentDoc.eq === 'function' && currentDoc.eq(nextDoc))
  } catch {
    return false
  }
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value))
}

function normalizePadding(padding) {
  const source = padding || DEFAULT_ARTICLE_PADDING
  return {
    top: clamp(Math.round(Number(source.top) || 0), 0, MAX_ARTICLE_PADDING),
    right: clamp(Math.round(Number(source.right) || 0), 0, MAX_ARTICLE_PADDING),
    bottom: clamp(Math.round(Number(source.bottom) || 0), 0, MAX_ARTICLE_PADDING),
    left: clamp(Math.round(Number(source.left) || 0), 0, MAX_ARTICLE_PADDING),
  }
}

function isSamePadding(a, b) {
  return (
    a.top === b.top &&
    a.right === b.right &&
    a.bottom === b.bottom &&
    a.left === b.left
  )
}

function clampPairToLimit(first, second, limit) {
  const safeFirst = clamp(Math.round(first), 0, MAX_ARTICLE_PADDING)
  const safeSecond = clamp(Math.round(second), 0, MAX_ARTICLE_PADDING)
  const safeLimit = Math.max(0, Math.round(limit))

  if (safeFirst + safeSecond <= safeLimit) {
    return [safeFirst, safeSecond]
  }

  if (safeLimit <= 0) return [0, 0]

  const total = safeFirst + safeSecond
  if (total <= 0) return [0, 0]

  let nextFirst = Math.round((safeFirst / total) * safeLimit)
  nextFirst = clamp(nextFirst, 0, safeLimit)
  const nextSecond = safeLimit - nextFirst
  return [nextFirst, nextSecond]
}

function clampPaddingByRect(mode, padding, rect) {
  const safe = normalizePadding(padding)
  const safeWidth = Math.max(0, Math.round(Number(rect?.width) || 0))
  const safeHeight = Math.max(0, Math.round(Number(rect?.height) || 0))
  const horizontalLimit = Math.max(0, safeWidth - MIN_ARTICLE_CONTENT_SIZE)
  const verticalLimit = Math.max(0, safeHeight - MIN_ARTICLE_CONTENT_SIZE)

  if (mode === 'shared') {
    const sharedCurrent = Math.round((safe.top + safe.right + safe.bottom + safe.left) / 4)
    const sharedMax = Math.max(
      0,
      Math.min(
        MAX_ARTICLE_PADDING,
        Math.floor(horizontalLimit / 2),
        Math.floor(verticalLimit / 2)
      )
    )
    const shared = clamp(sharedCurrent, 0, sharedMax)
    return {
      top: shared,
      right: shared,
      bottom: shared,
      left: shared,
    }
  }

  const [left, right] = clampPairToLimit(safe.left, safe.right, horizontalLimit)
  const [top, bottom] = clampPairToLimit(safe.top, safe.bottom, verticalLimit)
  return { top, right, bottom, left }
}

function normalizeArticleWidth(width) {
  return clamp(Math.round(Number(width) || 0), MIN_ARTICLE_WIDTH, MAX_ARTICLE_WIDTH)
}

function normalizeSharedPaddingValue(padding) {
  const safe = normalizePadding(padding)
  return clamp(
    Math.round((safe.top + safe.right + safe.bottom + safe.left) / 4),
    0,
    MAX_ARTICLE_PADDING
  )
}

function toSharedPadding(padding) {
  const shared = normalizeSharedPaddingValue(padding)
  return {
    top: shared,
    right: shared,
    bottom: shared,
    left: shared,
  }
}

function normalizeArticleLayout(layout) {
  const source = layout && typeof layout === 'object' ? layout : {}
  const widthMode = source.articleWidthMode === 'manual' ? 'manual' : DEFAULT_ARTICLE_WIDTH_MODE
  const widthPreset = Object.prototype.hasOwnProperty.call(
    ARTICLE_WIDTH_PRESET_MAX,
    source.articleWidthPreset
  )
    ? source.articleWidthPreset
    : DEFAULT_ARTICLE_WIDTH_PRESET
  const manualWidth = normalizeArticleWidth(
    source.articleManualWidth ?? DEFAULT_ARTICLE_MANUAL_WIDTH
  )
  const paddingMode =
    source.articlePaddingMode === 'manual' ? 'manual' : DEFAULT_ARTICLE_PADDING_MODE
  const normalizedPadding = normalizePadding(source.articlePadding)

  return {
    articleWidthMode: widthMode,
    articleWidthPreset: widthPreset,
    articleManualWidth: manualWidth,
    articlePaddingMode: paddingMode,
    articlePadding: paddingMode === 'shared' ? toSharedPadding(normalizedPadding) : normalizedPadding,
  }
}

function ArticleWidthFrameOverlay({ editor, enabled, width, onChange }) {
  const [editorRect, setEditorRect] = useState(null)
  const rafRef = useRef(0)
  const dragRafRef = useRef(0)
  const pendingWidthRef = useRef(null)
  const appliedWidthRef = useRef(normalizeArticleWidth(width))
  const editorRectRef = useRef(null)

  const updateEditorRect = useCallback(() => {
    if (!enabled || !editor) {
      setEditorRect(null)
      editorRectRef.current = null
      return
    }

    let view
    try {
      view = editor.view
    } catch {
      return
    }

    const editorDom = view.dom
    if (!(editorDom instanceof HTMLElement)) return

    const frameEl = editorDom.closest('.editor-content-frame') || editorDom.parentElement
    if (!(frameEl instanceof HTMLElement)) return

    const frameRect = frameEl.getBoundingClientRect()
    const proseRect = editorDom.getBoundingClientRect()
    const contentHeight = Math.max(
      Math.round(proseRect.height),
      Math.round(editorDom.scrollHeight || 0),
      Math.round(editorDom.clientHeight || 0),
      Math.round(editorDom.offsetHeight || 0)
    )

    const nextRect = {
      top: Math.max(0, Math.round(proseRect.top - frameRect.top)),
      left: Math.max(0, Math.round(proseRect.left - frameRect.left)),
      width: Math.max(0, Math.round(proseRect.width)),
      height: contentHeight,
    }

    editorRectRef.current = nextRect
    setEditorRect(nextRect)
    return nextRect
  }, [editor, enabled])

  useEffect(() => {
    if (!enabled || !editor) {
      return
    }

    let view
    try {
      view = editor.view
    } catch {
      return
    }

    const editorDom = view.dom
    if (!(editorDom instanceof HTMLElement)) return

    const frameEl = editorDom.closest('.editor-content-frame') || editorDom.parentElement
    const scopeEl = editorDom.closest('.editor-hover-scope') || editorDom.parentElement
    const panelScroller = editorDom.closest('.panel-content')
    const rightPanel = document.querySelector('.right-panel')

    const schedule = () => {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = requestAnimationFrame(updateEditorRect)
    }

    schedule()

    editor.on('update', schedule)
    editor.on('transaction', schedule)
    editor.on('selectionUpdate', schedule)

    window.addEventListener('resize', schedule)
    window.addEventListener('scroll', schedule, true)
    editorDom.addEventListener('scroll', schedule)
    if (scopeEl instanceof HTMLElement) {
      scopeEl.addEventListener('scroll', schedule)
    }
    if (panelScroller instanceof HTMLElement) {
      panelScroller.addEventListener('scroll', schedule)
    }
    if (rightPanel instanceof HTMLElement) {
      rightPanel.addEventListener('transitionrun', schedule)
      rightPanel.addEventListener('transitionstart', schedule)
      rightPanel.addEventListener('transitionend', schedule)
      rightPanel.addEventListener('transitioncancel', schedule)
    }

    editorDom.addEventListener('input', schedule)

    const mutationObserver =
      typeof MutationObserver !== 'undefined'
        ? new MutationObserver(schedule)
        : null
    if (mutationObserver) {
      mutationObserver.observe(editorDom, {
        subtree: true,
        childList: true,
        characterData: true,
      })
    }

    const resizeObserver =
      typeof ResizeObserver !== 'undefined' ? new ResizeObserver(schedule) : null
    if (resizeObserver) {
      resizeObserver.observe(editorDom)
      if (frameEl instanceof HTMLElement) {
        resizeObserver.observe(frameEl)
      }
      if (scopeEl instanceof HTMLElement) {
        resizeObserver.observe(scopeEl)
      }
      if (panelScroller instanceof HTMLElement) {
        resizeObserver.observe(panelScroller)
      }
    }

    return () => {
      cancelAnimationFrame(rafRef.current)
      editor.off('update', schedule)
      editor.off('transaction', schedule)
      editor.off('selectionUpdate', schedule)
      window.removeEventListener('resize', schedule)
      window.removeEventListener('scroll', schedule, true)
      editorDom.removeEventListener('scroll', schedule)
      if (scopeEl instanceof HTMLElement) {
        scopeEl.removeEventListener('scroll', schedule)
      }
      if (panelScroller instanceof HTMLElement) {
        panelScroller.removeEventListener('scroll', schedule)
      }
      if (rightPanel instanceof HTMLElement) {
        rightPanel.removeEventListener('transitionrun', schedule)
        rightPanel.removeEventListener('transitionstart', schedule)
        rightPanel.removeEventListener('transitionend', schedule)
        rightPanel.removeEventListener('transitioncancel', schedule)
      }
      editorDom.removeEventListener('input', schedule)
      if (mutationObserver) {
        mutationObserver.disconnect()
      }
      if (resizeObserver) {
        resizeObserver.disconnect()
      }
    }
  }, [editor, enabled, updateEditorRect])

  useEffect(() => {
    appliedWidthRef.current = normalizeArticleWidth(width)
  }, [width])

  const handleDragStart = useCallback(
    (side, event) => {
      if (!editorRect || typeof onChange !== 'function') return
      if (event.button !== 0) return

      event.preventDefault()
      event.stopPropagation()

      const startX = event.clientX
      const visibleWidth = clamp(Math.round(editorRect.width), MIN_ARTICLE_WIDTH, MAX_ARTICLE_WIDTH)
      const stateWidth = normalizeArticleWidth(width)
      const startWidth = Math.min(stateWidth, visibleWidth)

      if (
        typeof event.pointerId === 'number' &&
        event.currentTarget &&
        typeof event.currentTarget.setPointerCapture === 'function'
      ) {
        try {
          event.currentTarget.setPointerCapture(event.pointerId)
        } catch {
          // ignore
        }
      }

      const scheduleWidthApply = () => {
        cancelAnimationFrame(dragRafRef.current)
        dragRafRef.current = requestAnimationFrame(() => {
          const nextWidth = pendingWidthRef.current
          pendingWidthRef.current = null
          if (typeof nextWidth !== 'number') return
          if (nextWidth === appliedWidthRef.current) return
          appliedWidthRef.current = nextWidth
          onChange(nextWidth)
        })
      }

      const handleMove = moveEvent => {
        const dx = moveEvent.clientX - startX
        const delta = side === 'right' ? dx * 2 : -dx * 2
        const nextWidth = normalizeArticleWidth(startWidth + delta)
        pendingWidthRef.current = nextWidth
        scheduleWidthApply()
      }

      const stopMove = () => {
        window.removeEventListener('pointermove', handleMove)
        window.removeEventListener('pointerup', stopMove)
        window.removeEventListener('pointercancel', stopMove)
        cancelAnimationFrame(dragRafRef.current)
        const finalWidth = pendingWidthRef.current
        pendingWidthRef.current = null
        if (typeof finalWidth === 'number' && finalWidth !== appliedWidthRef.current) {
          appliedWidthRef.current = finalWidth
          onChange(finalWidth)
        }
        updateEditorRect()
        document.body.style.userSelect = ''
        document.body.style.cursor = ''
      }

      document.body.style.userSelect = 'none'
      document.body.style.cursor = 'ew-resize'
      window.addEventListener('pointermove', handleMove)
      window.addEventListener('pointerup', stopMove)
      window.addEventListener('pointercancel', stopMove)
    },
    [editorRect, onChange, updateEditorRect, width]
  )

  if (!enabled || !editorRect) return null

  const frameTop = editorRect.top
  const frameLeft = editorRect.left
  const frameWidth = editorRect.width
  const frameHeight = editorRect.height
  if (frameWidth <= 24 || frameHeight <= 24) return null

  return (
    <div className="article-width-overlay">
      <div
        className="article-width-edge article-width-edge-left"
        style={{
          left: `${frameLeft}px`,
          top: `${frameTop}px`,
          height: `${frameHeight}px`,
        }}
        onPointerDown={event => handleDragStart('left', event)}
      />
      <div
        className="article-width-edge article-width-edge-right"
        style={{
          left: `${frameLeft + frameWidth}px`,
          top: `${frameTop}px`,
          height: `${frameHeight}px`,
        }}
        onPointerDown={event => handleDragStart('right', event)}
      />

      <button
        type="button"
        className="article-width-handle article-width-handle-left"
        style={{
          left: `${frameLeft}px`,
          top: `${frameTop + frameHeight / 2}px`,
        }}
        onPointerDown={event => handleDragStart('left', event)}
      />
      <button
        type="button"
        className="article-width-handle article-width-handle-right"
        style={{
          left: `${frameLeft + frameWidth}px`,
          top: `${frameTop + frameHeight / 2}px`,
        }}
        onPointerDown={event => handleDragStart('right', event)}
      />
    </div>
  )
}

function ArticlePaddingFrameOverlay({ editor, enabled, mode, padding, onChange }) {
  const [editorRect, setEditorRect] = useState(null)
  const rafRef = useRef(0)
  const dragRafRef = useRef(0)
  const editorRectRef = useRef(null)

  const updateEditorRect = useCallback(() => {
    if (!enabled || !editor) {
      setEditorRect(null)
      editorRectRef.current = null
      return
    }

    let view
    try {
      view = editor.view
    } catch {
      return
    }

    const editorDom = view.dom
    if (!(editorDom instanceof HTMLElement)) return

    const frameEl = editorDom.closest('.editor-content-frame') || editorDom.parentElement
    if (!(frameEl instanceof HTMLElement)) return

    const frameRect = frameEl.getBoundingClientRect()
    const proseRect = editorDom.getBoundingClientRect()
    const contentHeight = Math.max(
      Math.round(proseRect.height),
      Math.round(editorDom.scrollHeight || 0),
      Math.round(editorDom.clientHeight || 0),
      Math.round(editorDom.offsetHeight || 0)
    )

    const nextRect = {
      top: Math.max(0, Math.round(proseRect.top - frameRect.top)),
      left: Math.max(0, Math.round(proseRect.left - frameRect.left)),
      width: Math.max(0, Math.round(proseRect.width)),
      height: contentHeight,
    }

    editorRectRef.current = nextRect
    setEditorRect(nextRect)
    return nextRect
  }, [editor, enabled])

  useEffect(() => {
    if (!enabled || !editor) {
      return
    }

    let view
    try {
      view = editor.view
    } catch {
      return
    }

    const editorDom = view.dom
    if (!(editorDom instanceof HTMLElement)) return

    const frameEl = editorDom.closest('.editor-content-frame') || editorDom.parentElement
    const scopeEl = editorDom.closest('.editor-hover-scope') || editorDom.parentElement
    const panelScroller = editorDom.closest('.panel-content')
    const rightPanel = document.querySelector('.right-panel')

    const schedule = () => {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = requestAnimationFrame(updateEditorRect)
    }

    schedule()

    editor.on('update', schedule)
    editor.on('transaction', schedule)
    editor.on('selectionUpdate', schedule)

    window.addEventListener('resize', schedule)
    window.addEventListener('scroll', schedule, true)
    editorDom.addEventListener('scroll', schedule)
    if (scopeEl instanceof HTMLElement) {
      scopeEl.addEventListener('scroll', schedule)
    }
    if (panelScroller instanceof HTMLElement) {
      panelScroller.addEventListener('scroll', schedule)
    }
    if (rightPanel instanceof HTMLElement) {
      rightPanel.addEventListener('transitionrun', schedule)
      rightPanel.addEventListener('transitionstart', schedule)
      rightPanel.addEventListener('transitionend', schedule)
      rightPanel.addEventListener('transitioncancel', schedule)
    }

    editorDom.addEventListener('input', schedule)

    const mutationObserver =
      typeof MutationObserver !== 'undefined'
        ? new MutationObserver(schedule)
        : null
    if (mutationObserver) {
      mutationObserver.observe(editorDom, {
        subtree: true,
        childList: true,
        characterData: true,
      })
    }

    const resizeObserver =
      typeof ResizeObserver !== 'undefined' ? new ResizeObserver(schedule) : null
    if (resizeObserver) {
      resizeObserver.observe(editorDom)
      if (frameEl instanceof HTMLElement) {
        resizeObserver.observe(frameEl)
      }
      if (scopeEl instanceof HTMLElement) {
        resizeObserver.observe(scopeEl)
      }
      if (panelScroller instanceof HTMLElement) {
        resizeObserver.observe(panelScroller)
      }
    }

    return () => {
      cancelAnimationFrame(rafRef.current)
      editor.off('update', schedule)
      editor.off('transaction', schedule)
      editor.off('selectionUpdate', schedule)
      window.removeEventListener('resize', schedule)
      window.removeEventListener('scroll', schedule, true)
      editorDom.removeEventListener('scroll', schedule)
      if (scopeEl instanceof HTMLElement) {
        scopeEl.removeEventListener('scroll', schedule)
      }
      if (panelScroller instanceof HTMLElement) {
        panelScroller.removeEventListener('scroll', schedule)
      }
      if (rightPanel instanceof HTMLElement) {
        rightPanel.removeEventListener('transitionrun', schedule)
        rightPanel.removeEventListener('transitionstart', schedule)
        rightPanel.removeEventListener('transitionend', schedule)
        rightPanel.removeEventListener('transitioncancel', schedule)
      }
      editorDom.removeEventListener('input', schedule)
      if (mutationObserver) {
        mutationObserver.disconnect()
      }
      if (resizeObserver) {
        resizeObserver.disconnect()
      }
    }
  }, [editor, enabled, updateEditorRect])

  useEffect(() => {
    if (!enabled || !editorRect || typeof onChange !== 'function') return

    const current = normalizePadding(padding)
    const next = clampPaddingByRect(mode === 'manual' ? 'manual' : 'shared', current, editorRect)
    if (!isSamePadding(current, next)) {
      onChange(next)
    }
  }, [editorRect, enabled, mode, onChange, padding])

  useEffect(() => {
    if (!enabled) return

    const raf = requestAnimationFrame(updateEditorRect)
    return () => cancelAnimationFrame(raf)
  }, [enabled, mode, padding, updateEditorRect])

  const handleDragStart = useCallback(
    (side, event) => {
      if (!editorRect || typeof onChange !== 'function') return
      if (event.button !== 0) return

      event.preventDefault()
      event.stopPropagation()

      const startX = event.clientX
      const startY = event.clientY
      const startPadding = normalizePadding(padding)
      const startMode = mode === 'manual' ? 'manual' : 'shared'
      const rectSnapshot = { ...(editorRectRef.current || editorRect) }

      const handleMove = moveEvent => {
        const dx = moveEvent.clientX - startX
        const dy = moveEvent.clientY - startY
        const liveRect = updateEditorRect() || editorRectRef.current || rectSnapshot
        const safeRect = liveRect || rectSnapshot
        const safeWidth = Math.max(0, Math.round(Number(safeRect?.width) || 0))
        const safeHeight = Math.max(0, Math.round(Number(safeRect?.height) || 0))

        if (startMode === 'shared') {
          let sharedValue = startPadding.top
          if (side === 'top') sharedValue = startPadding.top + dy
          if (side === 'right') sharedValue = startPadding.right - dx
          if (side === 'bottom') sharedValue = startPadding.bottom - dy
          if (side === 'left') sharedValue = startPadding.left + dx

          const sharedMax = Math.max(
            0,
            Math.min(
              MAX_ARTICLE_PADDING,
              Math.floor((safeWidth - MIN_ARTICLE_CONTENT_SIZE) / 2),
              Math.floor((safeHeight - MIN_ARTICLE_CONTENT_SIZE) / 2)
            )
          )
          const nextShared = clamp(Math.round(sharedValue), 0, sharedMax)
          onChange(clampPaddingByRect('shared', {
            top: nextShared,
            right: nextShared,
            bottom: nextShared,
            left: nextShared,
          }, safeRect))
          cancelAnimationFrame(dragRafRef.current)
          dragRafRef.current = requestAnimationFrame(updateEditorRect)
          return
        }

        const next = { ...startPadding }
        if (side === 'top') {
          const maxTop = Math.max(
            0,
            Math.min(
              MAX_ARTICLE_PADDING,
              safeHeight - MIN_ARTICLE_CONTENT_SIZE - startPadding.bottom
            )
          )
          next.top = clamp(Math.round(startPadding.top + dy), 0, maxTop)
        } else if (side === 'right') {
          const maxRight = Math.max(
            0,
            Math.min(
              MAX_ARTICLE_PADDING,
              safeWidth - MIN_ARTICLE_CONTENT_SIZE - startPadding.left
            )
          )
          next.right = clamp(Math.round(startPadding.right - dx), 0, maxRight)
        } else if (side === 'bottom') {
          const maxBottom = Math.max(
            0,
            Math.min(
              MAX_ARTICLE_PADDING,
              safeHeight - MIN_ARTICLE_CONTENT_SIZE - startPadding.top
            )
          )
          next.bottom = clamp(Math.round(startPadding.bottom - dy), 0, maxBottom)
        } else if (side === 'left') {
          const maxLeft = Math.max(
            0,
            Math.min(
              MAX_ARTICLE_PADDING,
              safeWidth - MIN_ARTICLE_CONTENT_SIZE - startPadding.right
            )
          )
          next.left = clamp(Math.round(startPadding.left + dx), 0, maxLeft)
        }

        onChange(clampPaddingByRect('manual', next, safeRect))
        cancelAnimationFrame(dragRafRef.current)
        dragRafRef.current = requestAnimationFrame(updateEditorRect)
      }

      const stopMove = () => {
        window.removeEventListener('pointermove', handleMove)
        window.removeEventListener('pointerup', stopMove)
        window.removeEventListener('pointercancel', stopMove)
        cancelAnimationFrame(dragRafRef.current)
        updateEditorRect()
        document.body.style.userSelect = ''
        document.body.style.cursor = ''
      }

      document.body.style.userSelect = 'none'
      document.body.style.cursor = side === 'left' || side === 'right' ? 'ew-resize' : 'ns-resize'
      window.addEventListener('pointermove', handleMove)
      window.addEventListener('pointerup', stopMove)
      window.addEventListener('pointercancel', stopMove)
    },
    [editorRect, mode, onChange, padding, updateEditorRect]
  )

  if (!enabled || !editorRect) return null

  const safePadding = clampPaddingByRect(mode === 'manual' ? 'manual' : 'shared', padding, editorRect)
  const frameTop = editorRect.top + safePadding.top
  const frameLeft = editorRect.left + safePadding.left
  const frameWidth = editorRect.width - safePadding.left - safePadding.right
  const frameHeight = editorRect.height - safePadding.top - safePadding.bottom

  if (frameWidth <= 24 || frameHeight <= 24) return null

  return (
    <div className={`article-padding-overlay ${mode === 'manual' ? 'is-manual' : 'is-shared'}`}>
      <div
        className="article-padding-frame"
        style={{
          left: `${frameLeft}px`,
          top: `${frameTop}px`,
          width: `${frameWidth}px`,
          height: `${frameHeight}px`,
        }}
      />

      <button
        type="button"
        className="article-padding-handle article-padding-handle-top"
        style={{
          left: `${frameLeft + frameWidth / 2}px`,
          top: `${frameTop}px`,
        }}
        onPointerDown={event => handleDragStart('top', event)}
      />
      <button
        type="button"
        className="article-padding-handle article-padding-handle-right"
        style={{
          left: `${frameLeft + frameWidth}px`,
          top: `${frameTop + frameHeight / 2}px`,
        }}
        onPointerDown={event => handleDragStart('right', event)}
      />
      <button
        type="button"
        className="article-padding-handle article-padding-handle-bottom"
        style={{
          left: `${frameLeft + frameWidth / 2}px`,
          top: `${frameTop + frameHeight}px`,
        }}
        onPointerDown={event => handleDragStart('bottom', event)}
      />
      <button
        type="button"
        className="article-padding-handle article-padding-handle-left"
        style={{
          left: `${frameLeft}px`,
          top: `${frameTop + frameHeight / 2}px`,
        }}
        onPointerDown={event => handleDragStart('left', event)}
      />
    </div>
  )
}

export default function DocumentListTiptapPanelContent({
  activeDocId,
  docTitle,
  setActiveDocId,
  onAnchorsChange,
  onAnchorActivated,
  onDraftPersist,
  onForceSync,
  draftHydrationVersion = 0,
  canEdit = false,
  headerLeadingControls = null,
  headerTrailingControls = null,
  emptyStateTopLeftControls = null,
  emptyStateTopRightControls = null,
}) {
  const [viewer, setViewer] = useState(null)
  const [isAnchorModeEnabled, setIsAnchorModeEnabled] = useState(false)
  const [isAltBlockSelectionMode, setIsAltBlockSelectionMode] = useState(false)
  const [altSelectionModeResetTick, setAltSelectionModeResetTick] = useState(0)
  const [articleWidthMode, setArticleWidthMode] = useState(DEFAULT_ARTICLE_WIDTH_MODE)
  const [articleWidthPreset, setArticleWidthPreset] = useState(DEFAULT_ARTICLE_WIDTH_PRESET)
  const [articleManualWidth, setArticleManualWidth] = useState(DEFAULT_ARTICLE_MANUAL_WIDTH)
  const [articleWidthFrameVisible, setArticleWidthFrameVisible] = useState(true)
  const [articlePaddingMode, setArticlePaddingMode] = useState(DEFAULT_ARTICLE_PADDING_MODE)
  const [articlePaddingFrameVisible, setArticlePaddingFrameVisible] = useState(false)
  const [articlePadding, setArticlePadding] = useState({ ...DEFAULT_ARTICLE_PADDING })
  const [overlayLeftShift, setOverlayLeftShift] = useState(72)
  const [isManualSaving, setIsManualSaving] = useState(false)
  const [isEditorControlsGutterExpanded, setIsEditorControlsGutterExpanded] = useState(
    () => Boolean(canEdit)
  )
  const [isGutterToggleAnimating, setIsGutterToggleAnimating] = useState(false)

  const token = getCookie('token')
  const requestContext = useMemo(
    () => ({
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }),
    [token]
  )

  const { data: articleData } = useQuery(GET_ARTICLE, {
    variables: { id: activeDocId },
    skip: !activeDocId || !token,
    fetchPolicy: 'network-only',
    context: requestContext,
  })

  const skipAutosaveRef = useRef(true)
  const skipLayoutSaveRef = useRef(true)
  const autosaveTimerRef = useRef(null)
  const layoutSaveTimerRef = useRef(null)
  const gutterToggleAnimationTimerRef = useRef(null)
  const hydrationKeyRef = useRef('')
  const editorHoverScopeRef = useRef(null)
  const headerRef = useRef(null)
  const headerActionsRef = useRef(null)
  const saveButtonRef = useRef(null)
  const saveButtonMeasureRef = useRef(null)
  const [isSaveButtonCompact, setIsSaveButtonCompact] = useState(false)

  const handleArticleWidthPresetChange = useCallback((nextPreset) => {
    if (!Object.prototype.hasOwnProperty.call(ARTICLE_WIDTH_PRESET_MAX, nextPreset)) return
    setArticleWidthPreset(nextPreset)
  }, [])

  const handleArticleWidthModeChange = useCallback((nextMode) => {
    const normalizedMode = nextMode === 'manual' ? 'manual' : 'preset'
    setArticleWidthMode(normalizedMode)
    if (normalizedMode === 'manual') {
      setArticleWidthFrameVisible(true)
    }
  }, [])

  const handleArticleManualWidthChange = useCallback((nextWidth) => {
    const numericWidth = Number(nextWidth)
    if (!Number.isFinite(numericWidth)) return
    const clampedWidth = clamp(Math.round(numericWidth), MIN_ARTICLE_WIDTH, MAX_ARTICLE_WIDTH)
    setArticleManualWidth(clampedWidth)
  }, [])

  const handleArticlePaddingModeChange = useCallback((nextMode) => {
    const normalizedMode = nextMode === 'manual' ? 'manual' : 'shared'
    setArticlePaddingMode(normalizedMode)
    if (normalizedMode === 'shared') {
      setArticlePadding(prev => {
        const shared = normalizeSharedPaddingValue(prev)
        return {
          top: shared,
          right: shared,
          bottom: shared,
          left: shared,
        }
      })
    }
  }, [])

  const handleArticlePaddingReset = useCallback(() => {
    setArticlePadding({ ...DEFAULT_ARTICLE_PADDING })
  }, [])

  const buildLayoutPayload = useCallback(() => {
    return {
      articleWidthMode: articleWidthMode === 'manual' ? 'manual' : 'preset',
      articleWidthPreset: Object.prototype.hasOwnProperty.call(
        ARTICLE_WIDTH_PRESET_MAX,
        articleWidthPreset
      )
        ? articleWidthPreset
        : DEFAULT_ARTICLE_WIDTH_PRESET,
      articleManualWidth: normalizeArticleWidth(articleManualWidth),
      articlePaddingMode: articlePaddingMode === 'manual' ? 'manual' : 'shared',
      articlePadding: articlePaddingMode === 'manual'
        ? normalizePadding(articlePadding)
        : toSharedPadding(articlePadding),
    }
  }, [
    articleManualWidth,
    articlePadding,
    articlePaddingMode,
    articleWidthMode,
    articleWidthPreset,
  ])

  const editor = useEditor(
    {
      extensions: editorExtensions,
      content: EMPTY_DOC,
      autofocus: true,
      editable: canEdit,
      injectCSS: false,

      editorProps: {
        attributes: {
          spellcheck: 'true',
        },
        handleKeyDown: (_view, event) => {
          if (event.isComposing) return false
          return false
        },
      },

      onUpdate: () => {
        // Content is saved manually via the "Сохранить" button.
        // Clear any legacy pending autosave timer just in case.
        if (autosaveTimerRef.current) {
          clearTimeout(autosaveTimerRef.current)
          autosaveTimerRef.current = null
        }
      },
    },
    [canEdit, onDraftPersist]
  )

  const handleBack = useCallback(() => {
    if (typeof setActiveDocId === 'function') {
      setActiveDocId(null)
    }
  }, [setActiveDocId])

  const handleDisableAltSelectionMode = useCallback(() => {
    setAltSelectionModeResetTick(prev => prev + 1)
    setIsAltBlockSelectionMode(false)
  }, [])

  const handleManualSave = useCallback(async () => {
    if (!canEdit || !activeDocId || !editor || isManualSaving) return

    setIsManualSaving(true)
    try {
      if (autosaveTimerRef.current) {
        clearTimeout(autosaveTimerRef.current)
      }
      if (layoutSaveTimerRef.current) {
        clearTimeout(layoutSaveTimerRef.current)
      }

      const contentJson = editor.getJSON()
      if (isDocJson(contentJson) && typeof onDraftPersist === 'function') {
        await onDraftPersist(activeDocId, 'content', contentJson)
      }
      await saveDocLayout(activeDocId, buildLayoutPayload())

      if (typeof onDraftPersist === 'function') {
        await onDraftPersist(activeDocId, 'layout')
      }
      if (typeof onForceSync === 'function') {
        await onForceSync()
      }
    } catch {
      // ignore
    } finally {
      setIsManualSaving(false)
    }
  }, [
    activeDocId,
    buildLayoutPayload,
    canEdit,
    editor,
    isManualSaving,
    onDraftPersist,
    onForceSync,
  ])

  useEffect(() => {
    const openViewer = (e) => setViewer(e.detail)
    window.addEventListener('open-viewer', openViewer)
    return () => window.removeEventListener('open-viewer', openViewer)
  }, [])

  useEffect(() => {
    const handlePointerDownCapture = (event) => {
      const modalRoot = findDocModalRoot(event.target)
      if (!modalRoot) return
      bringDocModalToFront(modalRoot)
    }

    document.addEventListener('pointerdown', handlePointerDownCapture, true)
    document.addEventListener('mousedown', handlePointerDownCapture, true)
    return () => {
      document.removeEventListener('pointerdown', handlePointerDownCapture, true)
      document.removeEventListener('mousedown', handlePointerDownCapture, true)
    }
  }, [])

  useEffect(() => {
    return () => {
      if (autosaveTimerRef.current) {
        clearTimeout(autosaveTimerRef.current)
      }
      if (layoutSaveTimerRef.current) {
        clearTimeout(layoutSaveTimerRef.current)
      }
      if (gutterToggleAnimationTimerRef.current) {
        clearTimeout(gutterToggleAnimationTimerRef.current)
      }
    }
  }, [])

  useEffect(() => {
    if (!editor) return
    editor.setEditable(Boolean(canEdit))
    if (!canEdit) {
      setIsAnchorModeEnabled(false)
      setArticleWidthFrameVisible(false)
      setArticlePaddingFrameVisible(false)
      if (autosaveTimerRef.current) {
        clearTimeout(autosaveTimerRef.current)
      }
      if (layoutSaveTimerRef.current) {
        clearTimeout(layoutSaveTimerRef.current)
      }
    }
  }, [canEdit, editor])

  useEffect(() => {
    if (!canEdit) {
      setIsEditorControlsGutterExpanded(false)
      return
    }
    setIsEditorControlsGutterExpanded(true)
  }, [canEdit])

  useEffect(() => {
    if (!editor) return
    if (!token) return

    if (!activeDocId) {
      hydrationKeyRef.current = ''
      queueMicrotask(() => {
        editor.commands.setContent(EMPTY_DOC, false)
      })
      return
    }

    const article = articleData?.article
    const activeIdStr = activeDocId != null ? String(activeDocId) : ''
    const articleIdMatches =
      article != null && activeIdStr !== '' && String(article.id) === activeIdStr
    const articleUpdatedAtKey =
      article && articleIdMatches && article.updatedAt != null
        ? String(article.updatedAt)
        : ''
    const hydrationKey = `${activeDocId}:${draftHydrationVersion}:${articleUpdatedAtKey}`
    skipAutosaveRef.current = true
    skipLayoutSaveRef.current = true

    if (articleData === undefined) {
      skipAutosaveRef.current = false
      skipLayoutSaveRef.current = false
      return
    }

    if (article && !articleIdMatches) {
      skipAutosaveRef.current = false
      skipLayoutSaveRef.current = false
      return
    }

    if (hydrationKeyRef.current === hydrationKey) {
      skipAutosaveRef.current = false
      skipLayoutSaveRef.current = false
      return
    }

    const content = normalizeIncomingDocContent(article?.content)

    // Prevent cursor jumps during local editing/autosave:
    // backend updates `updatedAt`, which changes hydrationKey, but content often stays identical.
    // Re-hydrating identical content with `setContent` resets the selection to the end.
    // Use ProseMirror structural equality instead of JSON.stringify:
    // custom nodes (e.g. toggle) may differ in JSON key order / default attrs representation.
    const previousHydrationWasSameDoc = hydrationKeyRef.current.startsWith(`${activeDocId}:`)
    if (previousHydrationWasSameDoc) {
      try {
        if (isSameDocContentSemantically(editor, content)) {
          hydrationKeyRef.current = hydrationKey
          skipAutosaveRef.current = false
          skipLayoutSaveRef.current = false
          return
        }
      } catch {
        // ignore compare failures and fallback to regular hydration
      }
    }

    queueMicrotask(() => {
      editor.commands.setContent(content, false)
    })

    setArticleWidthMode(DEFAULT_ARTICLE_WIDTH_MODE)
    setArticleWidthPreset(DEFAULT_ARTICLE_WIDTH_PRESET)
    setArticleManualWidth(DEFAULT_ARTICLE_MANUAL_WIDTH)
    setArticlePaddingMode(DEFAULT_ARTICLE_PADDING_MODE)
    setArticlePadding({ ...DEFAULT_ARTICLE_PADDING })
    setArticleWidthFrameVisible(false)
    setArticlePaddingFrameVisible(false)
    hydrationKeyRef.current = hydrationKey

    skipAutosaveRef.current = false
    skipLayoutSaveRef.current = false
  }, [editor, activeDocId, draftHydrationVersion, articleData, token])

  useEffect(() => {
    if (!activeDocId) {
      hydrationKeyRef.current = ''
    }
  }, [activeDocId])

  useEffect(() => {
    if (!canEdit) return
    if (!activeDocId) return
    if (skipLayoutSaveRef.current) return

    if (layoutSaveTimerRef.current) {
      clearTimeout(layoutSaveTimerRef.current)
    }

    const layoutPayload = buildLayoutPayload()

    layoutSaveTimerRef.current = setTimeout(async () => {
      try {
        await saveDocLayout(activeDocId, layoutPayload)
        if (typeof onDraftPersist === 'function') {
          onDraftPersist(activeDocId, 'layout')
        }
      } catch {
        // ignore
      }
    }, 250)

    return () => {
      if (layoutSaveTimerRef.current) {
        clearTimeout(layoutSaveTimerRef.current)
      }
    }
  }, [
    activeDocId,
    buildLayoutPayload,
    canEdit,
    onDraftPersist,
  ])

  useEffect(() => {
    if (typeof onAnchorsChange === 'function') {
      onAnchorsChange([])
    }
  }, [activeDocId, onAnchorsChange])

  useEffect(() => {
    if (!canEdit) {
      setIsSaveButtonCompact(false)
      return
    }

    let raf = 0
    const scheduleMeasure = () => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(() => {
        const headerEl = headerRef.current
        const actionsEl = headerActionsRef.current
        const saveBtnEl = saveButtonRef.current
        const saveMeasureEl = saveButtonMeasureRef.current

        if (
          !(headerEl instanceof HTMLElement) ||
          !(actionsEl instanceof HTMLElement) ||
          !(saveBtnEl instanceof HTMLElement) ||
          !(saveMeasureEl instanceof HTMLElement)
        ) {
          setIsSaveButtonCompact(false)
          return
        }

        const headerStyle = window.getComputedStyle(headerEl)
        const gapValue = headerStyle.columnGap || headerStyle.gap || '0'
        const gap = Number.parseFloat(gapValue) || 0
        const paddingLeft = Number.parseFloat(headerStyle.paddingLeft) || 0
        const paddingRight = Number.parseFloat(headerStyle.paddingRight) || 0
        const contentWidth = Math.max(0, headerEl.clientWidth - paddingLeft - paddingRight)

        const currentSaveWidth = saveBtnEl.getBoundingClientRect().width || 0
        const fullSaveWidth = saveMeasureEl.getBoundingClientRect().width || currentSaveWidth

        const children = Array.from(headerEl.children).filter(
          child => child instanceof HTMLElement
        )

        let fixedWidth = 0
        for (const child of children) {
          const childWidth = child.getBoundingClientRect().width || 0
          if (child.classList.contains('tiptap-panel-title')) continue
          if (child === actionsEl) {
            fixedWidth += Math.max(0, childWidth - currentSaveWidth + fullSaveWidth)
            continue
          }
          fixedWidth += childWidth
        }

        const totalGapWidth = Math.max(0, children.length - 1) * gap
        const shouldCompact = fixedWidth + totalGapWidth > contentWidth + 0.5
        setIsSaveButtonCompact(prev => (prev === shouldCompact ? prev : shouldCompact))
      })
    }

    scheduleMeasure()

    const resizeObserver =
      typeof ResizeObserver !== 'undefined' ? new ResizeObserver(scheduleMeasure) : null
    if (resizeObserver) {
      if (headerRef.current instanceof HTMLElement) resizeObserver.observe(headerRef.current)
      if (headerActionsRef.current instanceof HTMLElement) resizeObserver.observe(headerActionsRef.current)
      if (saveButtonRef.current instanceof HTMLElement) resizeObserver.observe(saveButtonRef.current)
      if (saveButtonMeasureRef.current instanceof HTMLElement) {
        resizeObserver.observe(saveButtonMeasureRef.current)
      }
    }

    window.addEventListener('resize', scheduleMeasure)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', scheduleMeasure)
      if (resizeObserver) {
        resizeObserver.disconnect()
      }
    }
  }, [
    canEdit,
    isManualSaving,
    docTitle,
    Boolean(headerLeadingControls),
    Boolean(headerTrailingControls),
  ])

  useEffect(() => {
    const scopeEl = editorHoverScopeRef.current
    if (!(scopeEl instanceof HTMLElement)) return
    const panelContentEl = scopeEl.closest('.panel-content')
    if (!(panelContentEl instanceof HTMLElement)) return
    const controlsGutter = canEdit && isEditorControlsGutterExpanded
      ? EDITOR_CONTROLS_GUTTER_PX
      : 0

    let raf = 0
    const syncShift = () => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(() => {
        const scopeRect = scopeEl.getBoundingClientRect()
        const panelRect = panelContentEl.getBoundingClientRect()
        if (!scopeRect || !panelRect) return

        const nextShift = Math.max(0, Math.round(scopeRect.left - panelRect.left)) + controlsGutter
        setOverlayLeftShift(prev => (prev === nextShift ? prev : nextShift))
      })
    }

    syncShift()

    const resizeObserver =
      typeof ResizeObserver !== 'undefined' ? new ResizeObserver(syncShift) : null
    if (resizeObserver) {
      resizeObserver.observe(scopeEl)
      resizeObserver.observe(panelContentEl)
    }

    window.addEventListener('resize', syncShift)

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', syncShift)
      if (resizeObserver) {
        resizeObserver.disconnect()
      }
    }
  }, [
    articleWidthMode,
    articleWidthPreset,
    articleManualWidth,
    canEdit,
    isEditorControlsGutterExpanded,
  ])

  const articleMaxWidth =
    articleWidthMode === 'manual'
      ? articleManualWidth
      : articleWidthPreset === 'level4'
        ? null
        : ARTICLE_WIDTH_PRESET_MAX[articleWidthPreset]
  const editorControlsGutterWidth = canEdit && isEditorControlsGutterExpanded
    ? EDITOR_CONTROLS_GUTTER_PX
    : 0
  const shouldShowEditorSideControls = canEdit && isEditorControlsGutterExpanded
  const editorScopeStyle = {
    '--article-pad-top': `${articlePadding.top}px`,
    '--article-pad-right': `${articlePadding.right}px`,
    '--article-pad-bottom': `${articlePadding.bottom}px`,
    '--article-pad-left': `${articlePadding.left}px`,
    '--article-editor-extra-left': `${editorControlsGutterWidth}px`,
    '--editor-controls-gutter': `${editorControlsGutterWidth}px`,
    '--editor-controls-bg': canEdit ? '#f3f4f6' : 'transparent',
    '--editor-scope-left-offset': `${Math.max(0, overlayLeftShift - editorControlsGutterWidth)}px`,
    '--overlay-left-shift': `${shouldShowEditorSideControls ? overlayLeftShift : 0}px`,
    marginLeft: 0,
    marginRight: 0,
    ...(articleMaxWidth ? { maxWidth: `${articleMaxWidth}px` } : {}),
  }

  if (!activeDocId) {
    return (
      <div className="tiptap-panel tiptap-panel-empty">
        {emptyStateTopLeftControls ? (
          <div className="tiptap-panel-empty-top-left">
            {emptyStateTopLeftControls}
          </div>
        ) : null}
        {emptyStateTopRightControls ? (
          <div className="tiptap-panel-empty-top-right">
            {emptyStateTopRightControls}
          </div>
        ) : null}
        <div className="tiptap-panel-empty-message">Выберите документ</div>
      </div>
    )
  }

  if (!editor) {
    return <div className="tiptap-panel">Загрузка редактора...</div>
  }

  return (
    <DocumentationUploadProvider>
    <div className="tiptap-panel">
      <div className="tiptap-panel-top-sticky">
        <div className="tiptap-panel-header" ref={headerRef}>
        {headerLeadingControls}
        <button className="tiptap-panel-back-btn" onClick={handleBack}>
          <ArrowBackRoundedIcon
            aria-hidden="true"
            fontSize="inherit"
            style={{ width: 16, height: 16, fontSize: 16 }}
          />
          <span>Назад</span>
        </button>
        <div className="tiptap-panel-title">{docTitle || 'Без названия'}</div>
        {(canEdit || headerTrailingControls) && (
          <div
            className={`tiptap-panel-header-actions${headerTrailingControls ? ' has-trailing-controls' : ''}`}
            ref={headerActionsRef}
          >
            {canEdit && (
              <button
                type="button"
                ref={saveButtonRef}
                className={`tiptap-panel-save-btn${isSaveButtonCompact ? ' is-icon-only' : ''}${isManualSaving ? ' is-saving' : ''}`}
                onClick={handleManualSave}
                disabled={isManualSaving}
                aria-label={isManualSaving ? 'Сохранение...' : 'Сохранить изменения'}
                aria-busy={isManualSaving ? 'true' : 'false'}
              >
                <span className="tiptap-panel-save-btn-icon" aria-hidden="true">
                  <>
                    {/* Legacy SVG icon:
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <path
                        d="M5 4h11l3 3v13H5V4Z"
                        stroke="currentColor"
                        strokeWidth="1.7"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M8 4v6h7V4"
                        stroke="currentColor"
                        strokeWidth="1.7"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M8 16h8"
                        stroke="currentColor"
                        strokeWidth="1.7"
                        strokeLinecap="round"
                      />
                    </svg>
                    */}
                    <SaveRoundedIcon
                      aria-hidden="true"
                      fontSize="inherit"
                      style={{ width: 16, height: 16, fontSize: 16 }}
                    />
                  </>
                </span>
                <span className="tiptap-panel-save-btn-label">
                  {isManualSaving ? 'Сохранение...' : 'Сохранить изменения'}
                </span>
              </button>
            )}
            {canEdit && (
              <button
                type="button"
                ref={saveButtonMeasureRef}
                className="tiptap-panel-save-btn tiptap-panel-save-btn-measure"
                aria-hidden="true"
                tabIndex={-1}
              >
                {isManualSaving ? 'Сохранение...' : 'Сохранить изменения'}
              </button>
            )}
            {headerTrailingControls ? (
              <div className="tiptap-panel-header-trailing-controls">
                {headerTrailingControls}
              </div>
            ) : null}
          </div>
        )}
      </div>

      {canEdit && (
        <Toolbar
          editor={editor}
          anchorModeEnabled={isAnchorModeEnabled}
          altSelectionModeActive={isAltBlockSelectionMode}
          onToggleAnchorMode={() => setIsAnchorModeEnabled(prev => !prev)}
          onDisableAltSelectionMode={handleDisableAltSelectionMode}
          articleWidthMode={articleWidthMode}
          articleWidthPreset={articleWidthPreset}
          articleManualWidth={articleManualWidth}
          articleWidthFrameVisible={articleWidthFrameVisible}
          onArticleWidthModeChange={handleArticleWidthModeChange}
          onArticleWidthPresetChange={handleArticleWidthPresetChange}
          onArticleManualWidthChange={handleArticleManualWidthChange}
          onArticleWidthFrameVisibleChange={setArticleWidthFrameVisible}
          articlePaddingMode={articlePaddingMode}
          onArticlePaddingModeChange={handleArticlePaddingModeChange}
          articlePaddingFrameVisible={articlePaddingFrameVisible}
          onArticlePaddingFrameVisibleChange={setArticlePaddingFrameVisible}
          onArticlePaddingReset={handleArticlePaddingReset}
        />
      )}

      {canEdit && (
        <div className="tiptap-panel-sticky-controls">
          <button
            type="button"
            className={`editor-controls-gutter-toggle tiptap-panel-gutter-toggle-btn ${
              shouldShowEditorSideControls ? 'is-active' : ''
            }`}
            onMouseDown={(e) => {
              e.preventDefault()
              e.stopPropagation()
            }}
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              if (gutterToggleAnimationTimerRef.current) {
                clearTimeout(gutterToggleAnimationTimerRef.current)
              }
              setIsGutterToggleAnimating(true)
              gutterToggleAnimationTimerRef.current = setTimeout(() => {
                setIsGutterToggleAnimating(false)
                gutterToggleAnimationTimerRef.current = null
              }, GUTTER_TOGGLE_ANIMATION_MS)
              setIsEditorControlsGutterExpanded(prev => !prev)
            }}
            aria-label={
              shouldShowEditorSideControls
                ? 'Скрыть область кнопок редактора'
                : 'Показать область кнопок редактора'
            }
            aria-pressed={shouldShowEditorSideControls}
            title={
              shouldShowEditorSideControls
                ? 'Скрыть кнопки + и ⋮⋮'
                : 'Показать кнопки + и ⋮⋮'
            }
          >
            {shouldShowEditorSideControls ? (
              <ChevronLeftRoundedIcon
                aria-hidden="true"
                fontSize="inherit"
                style={{ width: 16, height: 16, fontSize: 16 }}
              />
            ) : (
              <ChevronRightRoundedIcon
                aria-hidden="true"
                fontSize="inherit"
                style={{ width: 16, height: 16, fontSize: 16 }}
              />
            )}
          </button>
        </div>
      )}
      </div>

      <div
        className={`editor-hover-scope ${shouldShowEditorSideControls ? 'editor-controls-gutter-open' : 'editor-controls-gutter-collapsed'} ${isGutterToggleAnimating ? 'editor-controls-toggle-animating' : ''}`.trim()}
        style={editorScopeStyle}
        ref={editorHoverScopeRef}
      >
        {canEdit && <PlusButtonOverlay editor={editor} />}
        {canEdit && <BlockDragOverlay editor={editor} />}
        {canEdit && (
          <BlockSelectionOverlay
            editor={editor}
            onAltModeChange={setIsAltBlockSelectionMode}
            altModeResetTick={altSelectionModeResetTick}
          />
        )}
        <AnchorHashOverlay
          editor={editor}
          enabled={canEdit && isAnchorModeEnabled}
          onAnchorsChange={onAnchorsChange}
          onAnchorActivated={onAnchorActivated}
        />
        <div className="editor-content-frame">
          <EditorContent editor={editor} />
          <ArticleWidthFrameOverlay
            editor={editor}
            enabled={canEdit && articleWidthMode === 'manual' && articleWidthFrameVisible}
            width={articleManualWidth}
            onChange={handleArticleManualWidthChange}
          />
          <ArticlePaddingFrameOverlay
            editor={editor}
            enabled={canEdit && articlePaddingFrameVisible}
            mode={articlePaddingMode}
            padding={articlePadding}
            onChange={setArticlePadding}
          />
        </div>
      </div>

      {viewer && (
        <ImageViewer
          images={viewer.images}
          index={viewer.index}
          onClose={() => setViewer(null)}
        />
      )}
    </div>
    </DocumentationUploadProvider>
  )
}
