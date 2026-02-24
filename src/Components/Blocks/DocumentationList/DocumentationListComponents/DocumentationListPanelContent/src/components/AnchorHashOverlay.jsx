import { useCallback, useEffect, useState } from 'react'
import { buildAnchorDomId, createAnchorId } from '../navigationAnchors'

const TEXT_NODE_TYPES = new Set(['paragraph', 'heading'])
const TEXT_BLOCK_TAGS = new Set(['P', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6'])
const TABLE_NODE_TYPES = new Set(['table', 'tableRow', 'tableCell', 'tableHeader'])
const ANCHOR_HASH_BTN_SIZE = 20
const ANCHOR_HASH_GAP_FROM_ARTICLE = 2

function normalizeLabel(text) {
  const normalized = (text || '').replace(/\s+/g, ' ').trim()
  return normalized || 'Без названия'
}


function isInsideTableNode(state, pos, dom) {
  if (dom instanceof HTMLElement && dom.closest('table')) {
    return true
  }

  try {
    const $pos = state.doc.resolve(pos)
    for (let depth = $pos.depth; depth >= 0; depth -= 1) {
      if (TABLE_NODE_TYPES.has($pos.node(depth).type.name)) {
        return true
      }
    }
  } catch {
    // ignore
  }

  return false
}
export default function AnchorHashOverlay({
  editor,
  enabled,
  scopeSelector = '.editor-hover-scope',
  onAnchorsChange,
}) {
  const [isViewReady, setIsViewReady] = useState(false)
  const [markers, setMarkers] = useState([])

  const emitAnchors = useCallback(
    nextMarkers => {
      if (typeof onAnchorsChange !== 'function') return

      const seenDomIds = new Set()
      const nextBlocks = nextMarkers
        .filter(marker => marker.isActive && marker.anchorId)
        .filter(marker => {
          const domId = buildAnchorDomId(marker.anchorId)
          if (seenDomIds.has(domId)) return false
          seenDomIds.add(domId)
          return true
        })
        .map(marker => ({
          id: marker.anchorId,
          hasAnchor: true,
          lines: [marker.label],
          level: marker.level,
          domId: buildAnchorDomId(marker.anchorId),
        }))

      onAnchorsChange(nextBlocks)
    },
    [onAnchorsChange]
  )

  const rebuildMarkers = useCallback(() => {
    if (!editor || !isViewReady) return

    let view
    try {
      view = editor.view
    } catch {
      return
    }

    const editorDom = view.dom
    const scopeEl = editorDom.closest(scopeSelector) || editorDom.parentElement || editorDom
    const scopeRect = scopeEl.getBoundingClientRect()
    const editorRect = editorDom.getBoundingClientRect()
    const panelRoot = editorDom.closest('.tiptap-panel')
    const stickyEl =
      panelRoot instanceof HTMLElement
        ? panelRoot.querySelector('.tiptap-panel-top-sticky')
        : null
    const stickyRect = stickyEl instanceof HTMLElement ? stickyEl.getBoundingClientRect() : null

    const nextMarkers = []

    view.state.doc.descendants((node, pos) => {
      if (!TEXT_NODE_TYPES.has(node.type.name)) return

      const dom = view.nodeDOM(pos)
      if (!(dom instanceof HTMLElement)) return
      if (!TEXT_BLOCK_TAGS.has(dom.tagName)) return
      if (isInsideTableNode(view.state, pos, dom)) return

      const rect = dom.getBoundingClientRect()
      if (!Number.isFinite(rect.top) || !Number.isFinite(rect.height)) return
      if (rect.height <= 0 && rect.width <= 0) return

      const level = node.type.name === 'heading' ? `h${node.attrs?.level || 1}` : 'p'
      const label = normalizeLabel(node.textContent)
      const isActive = Boolean(node.attrs?.anchorTag && node.attrs?.anchorId)
      const anchorId = node.attrs?.anchorId || null

      const top =
        rect.top - scopeRect.top + scopeEl.scrollTop + Math.max(0, (rect.height - 18) / 2)
      const left = editorRect.right - scopeRect.left + ANCHOR_HASH_GAP_FROM_ARTICLE
      const markerViewportTop = rect.top + Math.max(0, (rect.height - 18) / 2)
      const markerViewportBottom = markerViewportTop + ANCHOR_HASH_BTN_SIZE
      const isHiddenBySticky =
        Boolean(stickyRect) &&
        markerViewportBottom > stickyRect.top &&
        markerViewportTop < stickyRect.bottom

      nextMarkers.push({
        key: `anchor-${pos}`,
        pos,
        top,
        left,
        label,
        level,
        anchorId,
        isActive,
        isHiddenBySticky,
      })
    })

    const seenAnchorIds = new Set()
    let fixTransaction = view.state.tr
    let hasDuplicateIds = false

    nextMarkers.forEach(marker => {
      if (!marker.isActive) return

      const node = view.state.doc.nodeAt(marker.pos)
      if (!node || !TEXT_NODE_TYPES.has(node.type.name)) return

      const currentAnchorId = node.attrs?.anchorId
      if (!currentAnchorId || seenAnchorIds.has(currentAnchorId)) {
        const nextAnchorId = createAnchorId()
        marker.anchorId = nextAnchorId
        hasDuplicateIds = true

        fixTransaction = fixTransaction.setNodeMarkup(
          marker.pos,
          node.type,
          {
            ...node.attrs,
            anchorTag: true,
            anchorId: nextAnchorId,
          },
          node.marks
        )
        seenAnchorIds.add(nextAnchorId)
        return
      }

      seenAnchorIds.add(currentAnchorId)
    })

    if (hasDuplicateIds) {
      view.dispatch(fixTransaction)
      requestAnimationFrame(rebuildMarkers)
      return
    }

    setMarkers(enabled ? nextMarkers : [])
    emitAnchors(nextMarkers)
  }, [editor, emitAnchors, enabled, isViewReady, scopeSelector])

  const toggleMarker = useCallback(
    marker => {
      if (!editor || !isViewReady) return

      let view
      try {
        view = editor.view
      } catch {
        return
      }

      const { state } = view
      const node = state.doc.nodeAt(marker.pos)
      if (!node || !TEXT_NODE_TYPES.has(node.type.name)) return

      const isCurrentlyActive = Boolean(node.attrs?.anchorTag && node.attrs?.anchorId)
      const nextIsActive = !isCurrentlyActive
      const nextAnchorId = nextIsActive ? node.attrs?.anchorId || createAnchorId() : null

      const tr = state.tr.setNodeMarkup(
        marker.pos,
        node.type,
        {
          ...node.attrs,
          anchorTag: nextIsActive,
          anchorId: nextAnchorId,
        },
        node.marks
      )

      view.dispatch(tr)
      requestAnimationFrame(rebuildMarkers)
    },
    [editor, isViewReady, rebuildMarkers]
  )

  useEffect(() => {
    if (!editor) return

    setIsViewReady(false)
    let raf = 0
    let cancelled = false

    const check = () => {
      if (cancelled) return
      try {
        editor.view
        setIsViewReady(true)
      } catch {
        raf = requestAnimationFrame(check)
      }
    }

    check()

    return () => {
      cancelled = true
      cancelAnimationFrame(raf)
    }
  }, [editor])

  useEffect(() => {
    if (!editor || !isViewReady) return
    rebuildMarkers()
  }, [editor, enabled, isViewReady, rebuildMarkers])

  useEffect(() => {
    if (!editor || !isViewReady) return

    let view
    try {
      view = editor.view
    } catch {
      return
    }

    const editorDom = view.dom
    const scopeEl = editorDom.closest(scopeSelector) || editorDom.parentElement || editorDom
    const panelScroller = editorDom.closest('.panel-content')
    const rightPanel = document.querySelector('.right-panel')

    let raf = 0
    const schedule = () => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(rebuildMarkers)
    }

    schedule()

    editor.on('update', schedule)
    editor.on('transaction', schedule)
    editor.on('selectionUpdate', schedule)

    editorDom.addEventListener('scroll', schedule)
    scopeEl.addEventListener('scroll', schedule)
    if (panelScroller instanceof HTMLElement) {
      panelScroller.addEventListener('scroll', schedule)
    }
    window.addEventListener('resize', schedule)
    window.addEventListener('scroll', schedule, true)

    let resizeObserver = null
    if (typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(schedule)
      resizeObserver.observe(editorDom)
      if (scopeEl !== editorDom) {
        resizeObserver.observe(scopeEl)
      }
      if (panelScroller instanceof HTMLElement && panelScroller !== scopeEl) {
        resizeObserver.observe(panelScroller)
      }
    }

    if (rightPanel instanceof HTMLElement) {
      rightPanel.addEventListener('transitionrun', schedule)
      rightPanel.addEventListener('transitionstart', schedule)
      rightPanel.addEventListener('transitionend', schedule)
      rightPanel.addEventListener('transitioncancel', schedule)
    }

    return () => {
      cancelAnimationFrame(raf)
      editor.off('update', schedule)
      editor.off('transaction', schedule)
      editor.off('selectionUpdate', schedule)
      editorDom.removeEventListener('scroll', schedule)
      scopeEl.removeEventListener('scroll', schedule)
      if (panelScroller instanceof HTMLElement) {
        panelScroller.removeEventListener('scroll', schedule)
      }
      window.removeEventListener('resize', schedule)
      window.removeEventListener('scroll', schedule, true)
      if (resizeObserver) {
        resizeObserver.disconnect()
      }
      if (rightPanel instanceof HTMLElement) {
        rightPanel.removeEventListener('transitionrun', schedule)
        rightPanel.removeEventListener('transitionstart', schedule)
        rightPanel.removeEventListener('transitionend', schedule)
        rightPanel.removeEventListener('transitioncancel', schedule)
      }
    }
  }, [editor, isViewReady, rebuildMarkers, scopeSelector])

  if (!enabled || !markers.length) return null

  return (
    <div className="anchor-hash-overlay">
      {markers.map(marker => (
        <button
          key={marker.key}
          type="button"
          className={`anchor-hash-btn ${marker.isActive ? 'active' : ''}`}
          style={{
            transform: `translate3d(${marker.left}px, ${marker.top}px, 0)`,
            visibility: marker.isHiddenBySticky ? 'hidden' : 'visible',
            pointerEvents: marker.isHiddenBySticky ? 'none' : 'auto',
          }}
          title={marker.isActive ? 'Убрать метку' : 'Добавить метку'}
          onMouseDown={event => {
            event.preventDefault()
            event.stopPropagation()
          }}
          onClick={event => {
            event.preventDefault()
            event.stopPropagation()
            toggleMarker(marker)
          }}
        >
          #
        </button>
      ))}
    </div>
  )
}
