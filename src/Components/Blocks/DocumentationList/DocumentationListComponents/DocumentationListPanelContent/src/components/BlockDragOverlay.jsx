import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { NodeSelection, TextSelection } from '@tiptap/pm/state'

const AUTO_SCROLL_EDGE_PX = 52
const AUTO_SCROLL_MAX_STEP_PX = 18
const SIDE_DROP_EDGE_PX = 22
const SIDE_DROP_EDGE_RATIO = 0.2
const OVERLAY_SYNC_EVENT = 'doclist-overlay-sync'
const USE_PLUS_OVERLAY_SYNC = true
const ENABLE_BLOCK_FOLLOW_CURSOR = false
const ENABLE_PREVIEW_REORDER = false
// Temporary rollback:
// horizontal side-by-side block placement is disabled until further revision.
const ENABLE_HORIZONTAL_BLOCK_LAYOUT = false
// Temporary rollback:
// hide drag handles to avoid UI conflicts.
const ENABLE_TOP_LEVEL_DRAG_HANDLE = true
const ENABLE_COLUMN_CHILD_DRAG_HANDLE = false

function getEditorViewSafe(editor) {
  if (!editor) return null
  try {
    return editor.view
  } catch {
    return null
  }
}

function getEditorDomSafe(editor) {
  const view = getEditorViewSafe(editor)
  if (!view) return null
  try {
    return view.dom
  } catch {
    return null
  }
}

function getClientPointFromEvent(ev) {
  if (!ev || typeof ev !== 'object') return null

  if ('clientX' in ev && 'clientY' in ev) {
    const x = ev.clientX
    const y = ev.clientY
    if (typeof x === 'number' && typeof y === 'number') return { x, y }
  }

  if ('touches' in ev && ev.touches?.length) {
    const t = ev.touches[0]
    if (typeof t?.clientX === 'number' && typeof t?.clientY === 'number') {
      return { x: t.clientX, y: t.clientY }
    }
  }

  if ('changedTouches' in ev && ev.changedTouches?.length) {
    const t = ev.changedTouches[0]
    if (typeof t?.clientX === 'number' && typeof t?.clientY === 'number') {
      return { x: t.clientX, y: t.clientY }
    }
  }

  return null
}

function getTopLevelStartPositions(doc) {
  if (!doc || typeof doc.forEach !== 'function') return []
  const positions = []
  doc.forEach((_node, offset) => {
    if (Number.isFinite(offset)) positions.push(offset)
  })
  return positions
}

function getTopLevelBlockEl(editorDom, target) {
  let el = target
  if (!(el instanceof Element)) {
    if (el && el.nodeType === 3) el = el.parentElement
  }
  if (!(el instanceof Element)) return null

  while (el && el !== editorDom) {
    if (el.parentElement === editorDom) return el
    el = el.parentElement
  }
  return null
}

function getTopLevelBlockPos(view, el) {
  try {
    const pos = view.posAtDOM(el, 0)
    const $pos = view.state.doc.resolve(pos)
    if ($pos.depth >= 1) return $pos.before(1)
    return pos
  } catch {
    return null
  }
}

function getNodePosByDom(view, el) {
  try {
    const pos = view.posAtDOM(el, 0)
    if (typeof pos !== 'number') return null
    if (view.state.doc.nodeAt(pos)) return pos
    return null
  } catch {
    return null
  }
}

function getNearestTopLevelBlockElByClientY(editorDom, clientY, excludeEl = null) {
  if (!(editorDom instanceof HTMLElement)) return null
  if (typeof clientY !== 'number') return null

  const kids = Array.from(editorDom.children)
  let nearest = null
  let nearestDist = Infinity

  for (const el of kids) {
    if (!(el instanceof HTMLElement)) continue
    if (el.classList.contains('ProseMirror-gapcursor')) continue
    if (excludeEl instanceof HTMLElement && el === excludeEl) continue

    const rect = el.getBoundingClientRect()
    if (!rect || !Number.isFinite(rect.top) || !Number.isFinite(rect.bottom)) {
      continue
    }

    let marginTop = 0
    let marginBottom = 0
    try {
      const cs = window.getComputedStyle(el)
      marginTop = Number.parseFloat(cs.marginTop) || 0
      marginBottom = Number.parseFloat(cs.marginBottom) || 0
    } catch {
      // ignore
    }

    const expandedTop = rect.top - marginTop
    const expandedBottom = rect.bottom + marginBottom
    if (clientY >= expandedTop && clientY <= expandedBottom) return el

    const centerY = rect.top + rect.height * 0.5
    if (!Number.isFinite(centerY)) continue
    const dist = Math.abs(centerY - clientY)
    if (dist < nearestDist) {
      nearestDist = dist
      nearest = el
    }
  }

  return nearest
}

function getDropPositionByPoint(rect, point, { allowSide = true } = {}) {
  if (!rect || !point) return 'after'
  const { x: clientX, y: clientY } = point
  if (typeof clientY !== 'number') return 'after'

  if (allowSide && typeof clientX === 'number' && clientY >= rect.top && clientY <= rect.bottom) {
    const sideEdgePx = Math.max(
      12,
      Math.min(SIDE_DROP_EDGE_PX, Math.round(rect.width * SIDE_DROP_EDGE_RATIO))
    )
    if (clientX <= rect.left + sideEdgePx) return 'left'
    if (clientX >= rect.right - sideEdgePx) return 'right'
  }

  const midY = rect.top + rect.height * 0.5
  return clientY <= midY ? 'before' : 'after'
}

function isSideDropPosition(position) {
  return position === 'left' || position === 'right'
}

function clampNumber(value, min, max) {
  if (!Number.isFinite(value)) return min
  if (value < min) return min
  if (value > max) return max
  return value
}

function getColumnsSideDropHint(targetEl, point) {
  if (!(targetEl instanceof HTMLElement) || !point) return null
  if (!targetEl.hasAttribute('data-columns-layout')) return null
  if (typeof point.x !== 'number' || typeof point.y !== 'number') return null

  const rowRect = targetEl.getBoundingClientRect()
  if (!rowRect || point.y < rowRect.top || point.y > rowRect.bottom) return null

  const children = Array.from(targetEl.children).filter(
    child => child instanceof HTMLElement
  )
  if (children.length === 0) return null

  const childRects = children
    .map((child, index) => ({ index, rect: child.getBoundingClientRect() }))
    .filter(({ rect }) =>
      rect &&
      Number.isFinite(rect.left) &&
      Number.isFinite(rect.right) &&
      Number.isFinite(rect.top) &&
      Number.isFinite(rect.bottom)
    )

  if (childRects.length === 0) return null

  for (const { index, rect } of childRects) {
    if (point.y < rect.top || point.y > rect.bottom) continue
    const sideEdgePx = Math.max(
      10,
      Math.min(SIDE_DROP_EDGE_PX, Math.round(rect.width * SIDE_DROP_EDGE_RATIO))
    )

    if (point.x <= rect.left + sideEdgePx) {
      return { position: 'left', columnInsertIndex: index, sideClientX: rect.left }
    }
    if (point.x >= rect.right - sideEdgePx) {
      return { position: 'right', columnInsertIndex: index + 1, sideClientX: rect.right }
    }
  }

  const firstRect = childRects[0]?.rect
  const lastRect = childRects[childRects.length - 1]?.rect
  if (!firstRect || !lastRect) return null

  const rowEdgePx = Math.max(
    10,
    Math.min(SIDE_DROP_EDGE_PX, Math.round(rowRect.width * SIDE_DROP_EDGE_RATIO))
  )
  if (point.x <= rowRect.left + rowEdgePx) {
    return { position: 'left', columnInsertIndex: 0, sideClientX: firstRect.left }
  }
  if (point.x >= rowRect.right - rowEdgePx) {
    return {
      position: 'right',
      columnInsertIndex: childRects.length,
      sideClientX: lastRect.right,
    }
  }

  return null
}

function getAutoScrollDeltaY(editorDom, clientY) {
  if (!(editorDom instanceof HTMLElement)) return 0
  if (!Number.isFinite(clientY)) return 0

  const rect = editorDom.getBoundingClientRect()
  if (!rect || !Number.isFinite(rect.top) || !Number.isFinite(rect.bottom)) {
    return 0
  }

  const topZone = rect.top + AUTO_SCROLL_EDGE_PX
  const bottomZone = rect.bottom - AUTO_SCROLL_EDGE_PX

  if (clientY < topZone) {
    const ratio = Math.min(1, Math.max(0, (topZone - clientY) / AUTO_SCROLL_EDGE_PX))
    return -Math.ceil(AUTO_SCROLL_MAX_STEP_PX * ratio)
  }

  if (clientY > bottomZone) {
    const ratio = Math.min(1, Math.max(0, (clientY - bottomZone) / AUTO_SCROLL_EDGE_PX))
    return Math.ceil(AUTO_SCROLL_MAX_STEP_PX * ratio)
  }

  return 0
}

function getTextCursorPosInsideTopLevelBlock(doc, fromPos, blockNode) {
  if (!doc || typeof fromPos !== 'number' || !blockNode) return null

  if (blockNode.isTextblock) {
    return fromPos + 1
  }

  let textPos = null
  blockNode.descendants((node, pos) => {
    if (textPos != null) return false
    if (node.isTextblock) {
      textPos = fromPos + pos + 2
      return false
    }
    return true
  })

  return textPos
}

function moveSelectionToTopLevelBlock(view, fromPos) {
  if (!view || typeof fromPos !== 'number') return

  const { doc } = view.state
  const starts = getTopLevelStartPositions(doc)
  const index = starts.indexOf(fromPos)
  if (index < 0) return

  const blockNode = doc.child(index)
  if (!blockNode) return

  const textPos = getTextCursorPosInsideTopLevelBlock(doc, fromPos, blockNode)
  const tr = view.state.tr

  if (typeof textPos === 'number') {
    tr.setSelection(TextSelection.create(doc, textPos))
  } else {
    tr.setSelection(NodeSelection.create(doc, fromPos))
  }

  tr.setMeta('addToHistory', false)
  view.dispatch(tr)
  view.focus()
}

export default function BlockDragOverlay({
  editor,
  scopeSelector = '.editor-hover-scope',
}) {
  const [isViewReady, setIsViewReady] = useState(false)
  const [isInScope, setIsInScope] = useState(false)
  const [hoverPos, setHoverPos] = useState(null)
  const [hoverY, setHoverY] = useState(null)
  const [activeId, setActiveId] = useState(null)
  const [startHandleY, setStartHandleY] = useState(null)
  const [dragDy, setDragDy] = useState(0)
  const [handleLayerEl, setHandleLayerEl] = useState(null)
  const [gutterHint, setGutterHint] = useState(null)
  const [columnHandles, setColumnHandles] = useState([])

  const blocksRef = useRef([])
  const hoverRef = useRef({ el: null, blockPos: null })
  const dropRef = useRef({
    id: null,
    position: null,
    el: null,
    columnInsertIndex: null,
    sideClientX: null,
  })
  const previewShiftRef = useRef(new Map())
  const activeDragTransformRef = useRef({ el: null, transform: '' })
  const activeBlockRef = useRef(null)
  const editorDomRef = useRef(null)
  const dragRef = useRef({
    active: false,
    startPoint: null,
    lastPoint: null,
    fromId: null,
    fromKind: 'top',
    fromChildIndex: null,
    fromChildPos: null,
    startScrollTop: 0,
  })

  const canDrag =
    ENABLE_TOP_LEVEL_DRAG_HANDLE &&
    (typeof hoverPos === 'number' || typeof activeId === 'number')
  const handleId = typeof activeId === 'number' ? activeId : hoverPos

  const clearDropHintClasses = () => {
    dropRef.current = {
      id: null,
      position: null,
      el: null,
      columnInsertIndex: null,
      sideClientX: null,
    }
    setGutterHint(null)
  }

  const updateGutterHint = (hint) => {
    if (!hint || !(hint.el instanceof HTMLElement)) {
      setGutterHint(null)
      return
    }

    const editorDom =
      editorDomRef.current instanceof HTMLElement
        ? editorDomRef.current
        : getEditorDomSafe(editor)
    if (!(editorDom instanceof HTMLElement)) {
      setGutterHint(null)
      return
    }

    const rect = hint.el.getBoundingClientRect()
    const editorRect = editorDom.getBoundingClientRect()
    if (
      !rect ||
      !Number.isFinite(rect.left) ||
      !Number.isFinite(rect.width) ||
      !Number.isFinite(rect.top) ||
      !Number.isFinite(rect.height) ||
      !Number.isFinite(editorRect.top)
    ) {
      setGutterHint(null)
      return
    }

    if (isSideDropPosition(hint.position)) {
      const nextTop = rect.top - editorRect.top + editorDom.scrollTop
      const hasCustomSideX = Number.isFinite(hint.sideClientX)
      const nextLeft = hasCustomSideX
        ? hint.sideClientX - editorRect.left + editorDom.scrollLeft - 1
        : rect.left - editorRect.left + editorDom.scrollLeft
      const nextWidth = hasCustomSideX ? 2 : Math.max(2, rect.width)
      const nextHeight = Math.max(2, rect.height)

      setGutterHint((prev) => {
        if (
          prev &&
          prev.axis === 'vertical' &&
          prev.position === hint.position &&
          Math.abs((prev.left ?? 0) - nextLeft) < 0.5 &&
          Math.abs((prev.top ?? 0) - nextTop) < 0.5 &&
          Math.abs((prev.width ?? 0) - nextWidth) < 0.5 &&
          Math.abs((prev.height ?? 0) - nextHeight) < 0.5
        ) {
          return prev
        }
        return {
          axis: 'vertical',
          position: hint.position,
          left: nextLeft,
          top: nextTop,
          width: nextWidth,
          height: nextHeight,
        }
      })
      return
    }

    const nextTop = rect.top - editorRect.top + editorDom.scrollTop
    const nextHeight = Math.max(2, rect.height)
    const nextPosition = hint.position === 'before' ? 'before' : 'after'

    setGutterHint((prev) => {
      if (
        prev &&
        prev.axis === 'horizontal' &&
        prev.position === nextPosition &&
        Math.abs((prev.top ?? 0) - nextTop) < 0.5 &&
        Math.abs((prev.height ?? 0) - nextHeight) < 0.5
      ) {
        return prev
      }
      return { axis: 'horizontal', top: nextTop, height: nextHeight, position: nextPosition }
    })
  }

  const clearPreviewShiftStyles = () => {
    const shifted = previewShiftRef.current
    if (shifted instanceof Map && shifted.size > 0) {
      shifted.forEach((prevTransform, el) => {
        if (!(el instanceof HTMLElement)) return
        if (typeof prevTransform === 'string' && prevTransform.length) {
          el.style.transform = prevTransform
        } else {
          el.style.removeProperty('transform')
        }
      })
      shifted.clear()
    }

    const blocks = Array.isArray(blocksRef.current) ? blocksRef.current : []
    for (const entry of blocks) {
      const el = entry?.el
      if (!(el instanceof HTMLElement)) continue
      el.classList.remove('block-dnd-animate')
    }
  }

  const clearActiveDragClasses = () => {
    const prevEl = activeBlockRef.current
    if (prevEl instanceof HTMLElement) {
      const prevDragTransform = activeDragTransformRef.current
      if (prevDragTransform?.el === prevEl) {
        if (
          typeof prevDragTransform.transform === 'string' &&
          prevDragTransform.transform.length
        ) {
          prevEl.style.transform = prevDragTransform.transform
        } else {
          prevEl.style.removeProperty('transform')
        }
      } else {
        prevEl.style.removeProperty('transform')
      }
      prevEl.style.removeProperty('--block-dnd-dy')
      prevEl.classList.remove('block-dnd-active', 'block-dnd-dragging')
    }
    activeDragTransformRef.current = { el: null, transform: '' }
    activeBlockRef.current = null
  }

  const setDraggingClass = (enabled) => {
    document.body.classList.toggle('dragging-blocks', Boolean(enabled))
  }

  const setNativeDragMode = (enabled) => {
    const editorDom =
      editorDomRef.current instanceof HTMLElement
        ? editorDomRef.current
        : getEditorDomSafe(editor)
    if (editorDom instanceof HTMLElement) {
      editorDom.classList.toggle('block-dnd-native-active', Boolean(enabled))
    }
  }

  const cancelDrag = () => {
    dragRef.current = {
      active: false,
      startPoint: null,
      lastPoint: null,
      fromId: null,
      fromKind: 'top',
      fromChildIndex: null,
      fromChildPos: null,
      startScrollTop: 0,
    }
    clearDropHintClasses()
    clearPreviewShiftStyles()
    clearActiveDragClasses()
    setNativeDragMode(false)
    setActiveId(null)
    setStartHandleY(null)
    setDragDy(0)
    setDraggingClass(false)
  }

  const applyPreviewShiftStyles = (fromId, hint) => {
    if (!ENABLE_PREVIEW_REORDER) {
      clearPreviewShiftStyles()
      return
    }

    if (typeof fromId !== 'number' || !hint || typeof hint.id !== 'number') {
      clearPreviewShiftStyles()
      return
    }

    const blocks = Array.isArray(blocksRef.current) ? blocksRef.current : []
    if (blocks.length < 2) {
      clearPreviewShiftStyles()
      return
    }

    const fromIndex = blocks.findIndex(b => b?.id === fromId)
    const targetIndex = blocks.findIndex(b => b?.id === hint.id)
    if (fromIndex < 0 || targetIndex < 0) {
      clearPreviewShiftStyles()
      return
    }

    let insertIndex = hint.position === 'before' ? targetIndex : targetIndex + 1
    if (fromIndex < insertIndex) insertIndex -= 1
    const isNeutral = insertIndex === fromIndex

    const fromEl = blocks[fromIndex]?.el
    if (!(fromEl instanceof HTMLElement)) {
      clearPreviewShiftStyles()
      return
    }

    const fromRect = fromEl.getBoundingClientRect()
    if (!fromRect || !Number.isFinite(fromRect.height)) {
      clearPreviewShiftStyles()
      return
    }

    let marginTop = 0
    let marginBottom = 0
    try {
      const cs = window.getComputedStyle(fromEl)
      marginTop = Number.parseFloat(cs.marginTop) || 0
      marginBottom = Number.parseFloat(cs.marginBottom) || 0
    } catch {
      // ignore
    }

    const shiftY = fromRect.height + marginTop + marginBottom
    if (!Number.isFinite(shiftY) || shiftY <= 0) {
      clearPreviewShiftStyles()
      return
    }

    const shouldShift = (idx) => {
      if (isNeutral) return 0
      if (idx === fromIndex) return 0
      if (fromIndex < insertIndex) {
        return idx > fromIndex && idx <= insertIndex ? -shiftY : 0
      }
      return idx >= insertIndex && idx < fromIndex ? shiftY : 0
    }

    const shifted = previewShiftRef.current
    const seen = new Set()

    for (let i = 0; i < blocks.length; i += 1) {
      const entry = blocks[i]
      const el = entry?.el
      if (!(el instanceof HTMLElement)) continue

      if (i === fromIndex) {
        el.classList.remove('block-dnd-animate')
      } else {
        el.classList.add('block-dnd-animate')
      }

      const delta = shouldShift(i)
      if (delta === 0) {
        if (shifted.has(el)) {
          const prev = shifted.get(el)
          if (typeof prev === 'string' && prev.length) el.style.transform = prev
          else el.style.removeProperty('transform')
          shifted.delete(el)
        }
        continue
      }

      seen.add(el)
      if (!shifted.has(el)) shifted.set(el, el.style.transform || '')
      el.style.transform = `translate3d(0px, ${delta}px, 0px)`
    }

    shifted.forEach((prev, el) => {
      if (seen.has(el)) return
      if (!(el instanceof HTMLElement)) {
        shifted.delete(el)
        return
      }
      if (typeof prev === 'string' && prev.length) el.style.transform = prev
      else el.style.removeProperty('transform')
      shifted.delete(el)
    })
  }

  const setHoverFromElement = (editorDom, view, el) => {
    const known = blocksRef.current.find(b => b.el === el)
    const pos = typeof known?.id === 'number' ? known.id : getTopLevelBlockPos(view, el)
    if (typeof pos !== 'number') return

    const rect = el.getBoundingClientRect()
    const editorRect = editorDom.getBoundingClientRect()
    const y =
      rect.top -
      editorRect.top +
      editorDom.scrollTop +
      Math.max(0, (rect.height - 24) / 2)

    hoverRef.current = { el, blockPos: pos }
    setHoverPos(pos)
    setHoverY(y)
  }

  const normalizeFromMeta = (fromMeta) => {
    if (typeof fromMeta === 'number') {
      return {
        fromId: fromMeta,
        fromKind: 'top',
        fromChildIndex: null,
      }
    }

    if (!fromMeta || typeof fromMeta !== 'object') return null
    if (typeof fromMeta.fromId !== 'number') return null

    return {
      fromId: fromMeta.fromId,
      fromKind: fromMeta.fromKind === 'column-child' ? 'column-child' : 'top',
      fromChildIndex: Number.isInteger(fromMeta.fromChildIndex)
        ? fromMeta.fromChildIndex
        : null,
    }
  }

  const resolveDropHintFromPoint = (point, fromMeta) => {
    const editorDom =
      editorDomRef.current instanceof HTMLElement
        ? editorDomRef.current
        : getEditorDomSafe(editor)
    if (!(editorDom instanceof HTMLElement) || !point) return null

    const view = getEditorViewSafe(editor)
    if (!view) return null

    const from = normalizeFromMeta(fromMeta)
    if (!from) return null
    const fromId = from.fromId

    const fromEntry = blocksRef.current.find(b => b?.id === fromId)
    const fromEl = from.fromKind === 'top'
      ? (fromEntry?.el instanceof HTMLElement
          ? fromEntry.el
          : activeBlockRef.current instanceof HTMLElement
            ? activeBlockRef.current
            : null)
      : null
    const targetEl = getNearestTopLevelBlockElByClientY(
      editorDom,
      point.y,
      fromEl instanceof HTMLElement ? fromEl : null
    )
    if (!(targetEl instanceof HTMLElement)) return null

    const known = blocksRef.current.find(b => b.el === targetEl)
    const targetId =
      typeof known?.id === 'number' ? known.id : getTopLevelBlockPos(view, targetEl)
    if (typeof targetId !== 'number') return null

    const rect = targetEl.getBoundingClientRect()
    const starts = getTopLevelStartPositions(view.state.doc)
    const fromIndex = starts.indexOf(fromId)
    const targetIndex = starts.indexOf(targetId)
    const fromNode = fromIndex >= 0 ? view.state.doc.child(fromIndex) : null
    const targetNode = targetIndex >= 0 ? view.state.doc.child(targetIndex) : null
    const allowSideDrop =
      ENABLE_HORIZONTAL_BLOCK_LAYOUT &&
      (
        from.fromKind === 'column-child' ||
        (Boolean(fromNode) && fromNode.type?.name !== 'columnsLayout')
      )

    const columnSideHint =
      ENABLE_HORIZONTAL_BLOCK_LAYOUT && allowSideDrop && targetNode?.type?.name === 'columnsLayout'
        ? getColumnsSideDropHint(targetEl, point)
        : null
    const position = columnSideHint?.position || getDropPositionByPoint(rect, point, { allowSide: allowSideDrop })

    if (targetId === fromId) {
      if (from.fromKind !== 'column-child') return null
      if (!isSideDropPosition(position)) return null

      const insertIndex = Number.isInteger(columnSideHint?.columnInsertIndex)
        ? columnSideHint.columnInsertIndex
        : null
      if (insertIndex == null || from.fromChildIndex == null) return null
      if (insertIndex === from.fromChildIndex || insertIndex === from.fromChildIndex + 1) {
        return null
      }
    }

    return {
      id: targetId,
      position,
      el: targetEl,
      columnInsertIndex: Number.isInteger(columnSideHint?.columnInsertIndex)
        ? columnSideHint.columnInsertIndex
        : null,
      sideClientX: Number.isFinite(columnSideHint?.sideClientX)
        ? columnSideHint.sideClientX
        : null,
    }
  }

  const applyDropHint = (hint) => {
    const prev = dropRef.current
    const prevSideX = Number.isFinite(prev.sideClientX) ? prev.sideClientX : null
    const nextSideX = Number.isFinite(hint.sideClientX) ? hint.sideClientX : null
    if (
      prev.el === hint.el &&
      prev.id === hint.id &&
      prev.position === hint.position &&
      prev.columnInsertIndex === hint.columnInsertIndex &&
      (prevSideX == null ? nextSideX == null : nextSideX != null && Math.abs(prevSideX - nextSideX) < 0.5)
    ) {
      return false
    }

    dropRef.current = {
      id: hint.id,
      position: hint.position,
      el: hint.el instanceof HTMLElement ? hint.el : null,
      columnInsertIndex: Number.isInteger(hint.columnInsertIndex) ? hint.columnInsertIndex : null,
      sideClientX: Number.isFinite(hint.sideClientX) ? hint.sideClientX : null,
    }
    return true
  }

  const updateDropHintFromPoint = (point, fromMeta) => {
    const normalizedFrom = normalizeFromMeta(fromMeta)
    const hint = resolveDropHintFromPoint(point, fromMeta)
    if (!hint) {
      clearDropHintClasses()
      clearPreviewShiftStyles()
      return
    }
    updateGutterHint(hint)
    applyDropHint(hint)
    applyPreviewShiftStyles(
      normalizedFrom?.fromKind === 'top' ? normalizedFrom.fromId : null,
      hint
    )
  }

  const moveTopLevelBlock = (fromMeta, dropHint) => {
    const from = normalizeFromMeta(fromMeta)
    if (!from || typeof from.fromId !== 'number') return
    if (!dropHint || typeof dropHint.id !== 'number') return
    if (dropHint.id === from.fromId && from.fromKind !== 'column-child') return

    const view = getEditorViewSafe(editor)
    if (!view) return
    const editorDom = view.dom

    const doc = view.state.doc
    const starts = getTopLevelStartPositions(doc)
    const fromIndex = starts.indexOf(from.fromId)
    const targetIndex = starts.indexOf(dropHint.id)
    if (fromIndex < 0 || targetIndex < 0) return

    const fromNode = doc.child(fromIndex)
    const targetNode = doc.child(targetIndex)
    if (!fromNode || !targetNode) return
    const columnsLayoutType = view.state.schema.nodes.columnsLayout
    const prevScrollTop =
      editorDom instanceof HTMLElement ? editorDom.scrollTop : null
    const dispatchWithScrollRestore = (tr) => {
      view.dispatch(tr)
      if (editorDom instanceof HTMLElement && Number.isFinite(prevScrollTop)) {
        editorDom.scrollTop = prevScrollTop
      }
    }

    if (from.fromKind === 'column-child') {
      if (!columnsLayoutType) return
      if (fromNode.type !== columnsLayoutType) return

      const sourceChildren = fromNode.content.toArray()
      if (sourceChildren.length === 0) return
      const sourceChildIndex = Number.isInteger(from.fromChildIndex)
        ? clampNumber(from.fromChildIndex, 0, sourceChildren.length - 1)
        : -1
      if (sourceChildIndex < 0 || sourceChildIndex >= sourceChildren.length) return

      const movedChildNode = sourceChildren[sourceChildIndex]
      const sourcePos = starts[fromIndex]
      const targetPos = starts[targetIndex]
      let tr = view.state.tr

      sourceChildren.splice(sourceChildIndex, 1)
      if (sourceChildren.length > 0) {
        const nextSourceRow = columnsLayoutType.create(
          fromNode.attrs,
          sourceChildren,
          fromNode.marks
        )
        tr = tr.replaceWith(sourcePos, sourcePos + fromNode.nodeSize, nextSourceRow)
      } else {
        tr = tr.delete(sourcePos, sourcePos + fromNode.nodeSize)
      }

      const mappedTargetPos = tr.mapping.map(targetPos, -1)
      const mappedTargetNode = tr.doc.nodeAt(mappedTargetPos)
      if (!mappedTargetNode) {
        dispatchWithScrollRestore(tr)
        return
      }

      if (
        ENABLE_HORIZONTAL_BLOCK_LAYOUT &&
        isSideDropPosition(dropHint.position) &&
        mappedTargetNode.type === columnsLayoutType
      ) {
        const children = mappedTargetNode.content.toArray()
        let insertIndex = Number.isInteger(dropHint.columnInsertIndex)
          ? clampNumber(dropHint.columnInsertIndex, 0, children.length)
          : (dropHint.position === 'left' ? 0 : children.length)

        if (
          dropHint.id === from.fromId &&
          Number.isInteger(dropHint.columnInsertIndex) &&
          Number.isInteger(from.fromChildIndex)
        ) {
          if (dropHint.columnInsertIndex > from.fromChildIndex) {
            insertIndex -= 1
          }
          insertIndex = clampNumber(insertIndex, 0, children.length)
        }

        children.splice(insertIndex, 0, movedChildNode)
        const nextTargetRow = columnsLayoutType.create(
          mappedTargetNode.attrs,
          children,
          mappedTargetNode.marks
        )
        tr = tr.replaceWith(
          mappedTargetPos,
          mappedTargetPos + mappedTargetNode.nodeSize,
          nextTargetRow
        )
        dispatchWithScrollRestore(tr)
        return
      }

      if (
        ENABLE_HORIZONTAL_BLOCK_LAYOUT &&
        isSideDropPosition(dropHint.position) &&
        columnsLayoutType &&
        mappedTargetNode.type?.name !== 'columnsLayout'
      ) {
        const wrapperContent =
          dropHint.position === 'left'
            ? [movedChildNode, mappedTargetNode]
            : [mappedTargetNode, movedChildNode]
        const wrapperNode = columnsLayoutType.create(null, wrapperContent)
        tr = tr.replaceWith(
          mappedTargetPos,
          mappedTargetPos + mappedTargetNode.nodeSize,
          wrapperNode
        )
        dispatchWithScrollRestore(tr)
        return
      }

      if (dropHint.id === from.fromId) {
        dispatchWithScrollRestore(tr)
        return
      }

      const linearPosition =
        dropHint.position === 'before' || dropHint.position === 'after'
          ? dropHint.position
          : (dropHint.position === 'left' ? 'before' : 'after')
      const insertPos =
        linearPosition === 'before'
          ? mappedTargetPos
          : mappedTargetPos + mappedTargetNode.nodeSize
      tr = tr.insert(insertPos, movedChildNode)
      dispatchWithScrollRestore(tr)
      return
    }

    if (
      ENABLE_HORIZONTAL_BLOCK_LAYOUT &&
      isSideDropPosition(dropHint.position) &&
      columnsLayoutType &&
      fromNode.type?.name !== 'columnsLayout' &&
      targetNode.type?.name === 'columnsLayout'
    ) {
      const fromPos = starts[fromIndex]
      const targetPos = starts[targetIndex]
      let tr = view.state.tr
      tr = tr.delete(fromPos, fromPos + fromNode.nodeSize)

      const mappedTargetPos = tr.mapping.map(targetPos, -1)
      const mappedTargetNode = tr.doc.nodeAt(mappedTargetPos)
      if (!mappedTargetNode || mappedTargetNode.type !== columnsLayoutType) {
        view.dispatch(tr)
        return
      }

      const children = mappedTargetNode.content.toArray()
      const insertIndex = Number.isInteger(dropHint.columnInsertIndex)
        ? clampNumber(dropHint.columnInsertIndex, 0, children.length)
        : (dropHint.position === 'left' ? 0 : children.length)
      children.splice(insertIndex, 0, fromNode)

      const nextWrapper = columnsLayoutType.create(
        mappedTargetNode.attrs,
        children,
        mappedTargetNode.marks
      )

      tr = tr.replaceWith(
        mappedTargetPos,
        mappedTargetPos + mappedTargetNode.nodeSize,
        nextWrapper
      )
      dispatchWithScrollRestore(tr)
      return
    }

    if (
      ENABLE_HORIZONTAL_BLOCK_LAYOUT &&
      isSideDropPosition(dropHint.position) &&
      columnsLayoutType &&
      fromNode.type?.name !== 'columnsLayout' &&
      targetNode.type?.name !== 'columnsLayout'
    ) {
      const wrapperContent =
        dropHint.position === 'left'
          ? [fromNode, targetNode]
          : [targetNode, fromNode]
      const wrapperNode = columnsLayoutType.create(null, wrapperContent)

      const minIndex = Math.min(fromIndex, targetIndex)
      const maxIndex = Math.max(fromIndex, targetIndex)
      const maxPos = starts[maxIndex]
      const minPos = starts[minIndex]
      const maxNode = doc.child(maxIndex)
      const minNode = doc.child(minIndex)
      if (!maxNode || !minNode) return

      let tr = view.state.tr
      tr = tr.delete(maxPos, maxPos + maxNode.nodeSize)
      tr = tr.delete(minPos, minPos + minNode.nodeSize)

      const nextStarts = getTopLevelStartPositions(tr.doc)
      const insertPos =
        minIndex >= nextStarts.length ? tr.doc.content.size : nextStarts[minIndex]

      tr = tr.insert(insertPos, wrapperNode)
      dispatchWithScrollRestore(tr)
      return
    }

    const linearPosition =
      dropHint.position === 'before' || dropHint.position === 'after'
        ? dropHint.position
        : (dropHint.position === 'left' ? 'before' : 'after')

    let insertIndex = linearPosition === 'before' ? targetIndex : targetIndex + 1
    if (fromIndex < insertIndex) insertIndex -= 1
    if (insertIndex === fromIndex) return

    const fromPos = starts[fromIndex]

    let tr = view.state.tr.delete(fromPos, fromPos + fromNode.nodeSize)
    const nextStarts = getTopLevelStartPositions(tr.doc)
    const insertPos =
      insertIndex >= nextStarts.length ? tr.doc.content.size : nextStarts[insertIndex]

    tr = tr.insert(insertPos, fromNode)
    dispatchWithScrollRestore(tr)
  }

  useEffect(() => {
    if (!editor) return

    setIsViewReady(false)
    let raf = 0
    let cancelled = false

    const check = () => {
      if (cancelled) return
      if (getEditorViewSafe(editor)) {
        setIsViewReady(true)
      } else {
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
    if (!USE_PLUS_OVERLAY_SYNC) return undefined

    const onOverlaySync = (event) => {
      if (dragRef.current.active) return

      const detail = event?.detail
      if (!detail || typeof detail !== 'object') return

      const nextHoverPos =
        typeof detail.hoverPos === 'number' ? detail.hoverPos : null
      const nextHoverY = Number.isFinite(detail.hoverY) ? detail.hoverY : null

      setIsInScope(Boolean(detail.isInScope))
      setHoverPos(nextHoverPos)
      setHoverY(nextHoverY)
      hoverRef.current = { el: null, blockPos: nextHoverPos }
    }

    window.addEventListener(OVERLAY_SYNC_EVENT, onOverlaySync)
    return () => {
      window.removeEventListener(OVERLAY_SYNC_EVENT, onOverlaySync)
    }
  }, [])

  useEffect(() => {
    if (!editor || !isViewReady) return

    const view = getEditorViewSafe(editor)
    if (!view) return
    const editorDom = view.dom
    editorDomRef.current = editorDom

    const refresh = () => {
      const next = []
      const nextColumnHandles = []
      const kids = Array.from(editorDom.children)
      const starts = getTopLevelStartPositions(view.state.doc)
      const editorRect = editorDom.getBoundingClientRect()
      let docCursor = 0

      for (const el of kids) {
        if (!(el instanceof HTMLElement)) continue
        if (el.classList.contains('ProseMirror-gapcursor')) continue

        const mappedPos = starts[docCursor]
        const fallbackPos = getTopLevelBlockPos(view, el)
        const pos =
          typeof mappedPos === 'number' && mappedPos >= 0 ? mappedPos : fallbackPos
        if (typeof pos !== 'number') continue
        docCursor += 1

        next.push({ id: pos, el })

        if (ENABLE_COLUMN_CHILD_DRAG_HANDLE && el.hasAttribute('data-columns-layout')) {
          const columnKids = Array.from(el.children)
          for (let columnIndex = 0; columnIndex < columnKids.length; columnIndex += 1) {
            const childEl = columnKids[columnIndex]
            if (!(childEl instanceof HTMLElement)) continue

            const childPos = getNodePosByDom(view, childEl)
            if (typeof childPos !== 'number') continue

            const childRect = childEl.getBoundingClientRect()
            if (
              !childRect ||
              !Number.isFinite(childRect.left) ||
              !Number.isFinite(childRect.top) ||
              !Number.isFinite(childRect.height)
            ) {
              continue
            }

            const handleY =
              childRect.top -
              editorRect.top +
              editorDom.scrollTop +
              Math.max(0, (childRect.height - 24) / 2)
            const handleX =
              childRect.left -
              editorRect.left +
              editorDom.scrollLeft -
              32

            nextColumnHandles.push({
              key: `${pos}:${columnIndex}:${childPos}`,
              rowPos: pos,
              childIndex: columnIndex,
              childPos,
              el: childEl,
              x: Math.max(0, handleX),
              y: handleY,
            })
          }
        }
      }

      next.sort((a, b) => a.id - b.id)
      blocksRef.current = next
      setColumnHandles(nextColumnHandles)
    }

    let raf = 0
    const schedule = () => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(refresh)
    }

    schedule()
    editor.on('transaction', schedule)
    window.addEventListener('resize', schedule)
    editorDom.addEventListener('scroll', schedule)

    return () => {
      cancelAnimationFrame(raf)
      editor.off('transaction', schedule)
      window.removeEventListener('resize', schedule)
      editorDom.removeEventListener('scroll', schedule)
      if (editorDomRef.current === editorDom) editorDomRef.current = null
      setColumnHandles([])
    }
  }, [editor, isViewReady])

  useEffect(() => {
    if (!editor || !isViewReady) return
    if (USE_PLUS_OVERLAY_SYNC) return

    const view = getEditorViewSafe(editor)
    if (!view) return
    const editorDom = view.dom
    editorDomRef.current = editorDom
    const scopeEl = editorDom.closest(scopeSelector) || editorDom

    let raf = 0
    const schedule = (fn) => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(fn)
    }

    const updateFromSelection = () => {
      const { $from } = view.state.selection
      if (!$from) return

      const domAtPos = view.domAtPos($from.pos)
      let dom = domAtPos.node
      if (dom && dom.nodeType === 3) dom = dom.parentElement
      if (!(dom instanceof HTMLElement)) return

      const top = getTopLevelBlockEl(editorDom, dom) || dom
      setHoverFromElement(editorDom, view, top)
    }

    const onEditorMouseMove = (e) => {
      if (dragRef.current.active) return
      const blockEl = getTopLevelBlockEl(editorDom, e.target)
      if (!blockEl) return
      if (hoverRef.current.el === blockEl) return
      schedule(() => setHoverFromElement(editorDom, view, blockEl))
    }

    const onScopeMouseMove = (e) => {
      if (dragRef.current.active) return

      const t = e?.target
      if (t instanceof Element) {
        if (editorDom.contains(t)) return
        if (t.closest('.plus-overlay')) return
        if (t.closest('.block-dnd-handle')) return
        if (t.closest('.slash-menu-wrapper')) return
      }

      const blockEl = getNearestTopLevelBlockElByClientY(editorDom, e?.clientY)
      if (!blockEl) return
      if (hoverRef.current.el === blockEl) return
      schedule(() => setHoverFromElement(editorDom, view, blockEl))
    }

    const onMouseEnter = (e) => {
      setIsInScope(true)
      schedule(() => {
        const fromPoint = getNearestTopLevelBlockElByClientY(editorDom, e?.clientY)
        if (fromPoint) setHoverFromElement(editorDom, view, fromPoint)
        else if (hoverRef.current.el) setHoverFromElement(editorDom, view, hoverRef.current.el)
        else updateFromSelection()
      })
    }

    const onMouseLeave = () => {
      if (dragRef.current.active) return
      setIsInScope(false)
      hoverRef.current = { el: null, blockPos: null }
      setHoverPos(null)
      setHoverY(null)
    }

    const onScroll = () => {
      if (dragRef.current.active) return
      if (hoverRef.current.el) schedule(() => setHoverFromElement(editorDom, view, hoverRef.current.el))
      else schedule(updateFromSelection)
    }

    const onSelectionLike = () => {
      if (dragRef.current.active) return
      if (hoverRef.current.el) return
      updateFromSelection()
    }

    const onBlur = () => {
      if (!hoverRef.current.el) {
        setHoverPos(null)
        setHoverY(null)
      }
    }

    editor.on('selectionUpdate', onSelectionLike)
    editor.on('transaction', onSelectionLike)
    editor.on('focus', onSelectionLike)
    editor.on('blur', onBlur)
    editorDom.addEventListener('mousemove', onEditorMouseMove)
    scopeEl.addEventListener('mousemove', onScopeMouseMove)
    scopeEl.addEventListener('mouseenter', onMouseEnter)
    scopeEl.addEventListener('mouseleave', onMouseLeave)
    editorDom.addEventListener('scroll', onScroll)

    updateFromSelection()

    return () => {
      cancelAnimationFrame(raf)
      editor.off('selectionUpdate', onSelectionLike)
      editor.off('transaction', onSelectionLike)
      editor.off('focus', onSelectionLike)
      editor.off('blur', onBlur)
      editorDom.removeEventListener('mousemove', onEditorMouseMove)
      scopeEl.removeEventListener('mousemove', onScopeMouseMove)
      scopeEl.removeEventListener('mouseenter', onMouseEnter)
      scopeEl.removeEventListener('mouseleave', onMouseLeave)
      editorDom.removeEventListener('scroll', onScroll)
      if (editorDomRef.current === editorDom) editorDomRef.current = null
    }
  }, [editor, scopeSelector, isViewReady])

  useEffect(() => {
    if (!editor || !isViewReady) return

    const getEditorDomForDrag = () =>
      editorDomRef.current instanceof HTMLElement
        ? editorDomRef.current
        : getEditorDomSafe(editor)

    const computeDragDy = (point, editorDom) => {
      const startPoint = dragRef.current.startPoint
      const pointerDy =
        startPoint && point ? point.y - startPoint.y : 0
      const baseScrollTop = Number.isFinite(dragRef.current.startScrollTop)
        ? dragRef.current.startScrollTop
        : editorDom.scrollTop
      const scrollDy = editorDom.scrollTop - baseScrollTop
      return pointerDy + scrollDy
    }

    const applyActiveDragOffset = (nextDy) => {
      setDragDy(nextDy)
      const activeEl = activeBlockRef.current
      if (activeEl instanceof HTMLElement) {
        activeEl.style.setProperty('--block-dnd-dy', `${nextDy}px`)
        activeEl.style.transform = `translate3d(0px, ${nextDy}px, 0px)`
      }
    }

    const syncDragFromPoint = (point, { allowAutoScroll = false } = {}) => {
      if (!point) return

      const editorDom = getEditorDomForDrag()
      if (!(editorDom instanceof HTMLElement)) return

      if (allowAutoScroll) {
        const deltaY = getAutoScrollDeltaY(editorDom, point.y)
        if (deltaY !== 0) editorDom.scrollTop += deltaY
      }

      if (ENABLE_BLOCK_FOLLOW_CURSOR) {
        const nextDy = computeDragDy(point, editorDom)
        applyActiveDragOffset(nextDy)
      } else if (dragDy !== 0) {
        setDragDy(0)
      }
      updateDropHintFromPoint(point, {
        fromId: dragRef.current.fromId,
        fromKind: dragRef.current.fromKind,
        fromChildIndex: dragRef.current.fromChildIndex,
      })
    }

    const onMove = (e) => {
      if (!dragRef.current.active) return

      const point = getClientPointFromEvent(e)
      if (!point) return

      if (e.cancelable) e.preventDefault()
      dragRef.current.lastPoint = point
      syncDragFromPoint(point, { allowAutoScroll: true })
    }

    const onEditorScroll = () => {
      if (!dragRef.current.active) return
      const point = dragRef.current.lastPoint || dragRef.current.startPoint
      if (!point) return
      syncDragFromPoint(point)
    }

    const onEnd = () => {
      if (!dragRef.current.active) return

      const from = dragRef.current.fromId
      const fromMeta = {
        fromId: dragRef.current.fromId,
        fromKind: dragRef.current.fromKind,
        fromChildIndex: dragRef.current.fromChildIndex,
        fromChildPos: dragRef.current.fromChildPos,
      }
      let dropHint = { ...dropRef.current }

      if (
        typeof fromMeta.fromId === 'number' &&
        typeof dragRef.current.lastPoint?.y === 'number' &&
        (typeof dropHint.id !== 'number' || dropHint.id === fromMeta.fromId)
      ) {
        const resolved = resolveDropHintFromPoint(dragRef.current.lastPoint, fromMeta)
        if (resolved) dropHint = resolved
      }

      cancelDrag()

      if (typeof from === 'number' && typeof dropHint.id === 'number') {
        moveTopLevelBlock(fromMeta, dropHint)
      }
    }

    const editorDom = getEditorDomForDrag()
    window.addEventListener('pointermove', onMove, true)
    window.addEventListener('pointerup', onEnd, true)
    window.addEventListener('pointercancel', onEnd, true)
    if (editorDom instanceof HTMLElement) {
      editorDom.addEventListener('scroll', onEditorScroll, true)
    }

    return () => {
      window.removeEventListener('pointermove', onMove, true)
      window.removeEventListener('pointerup', onEnd, true)
      window.removeEventListener('pointercancel', onEnd, true)
      if (editorDom instanceof HTMLElement) {
        editorDom.removeEventListener('scroll', onEditorScroll, true)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editor, isViewReady])

  useEffect(() => {
    return () => {
      cancelDrag()
      document.body.classList.remove('dragging-blocks')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const onColumnHandlePointerDown = (e, columnHandle) => {
    if (!editor || !isViewReady) return
    if (!columnHandle || typeof columnHandle !== 'object') return
    if (dragRef.current.active) return

    const view = getEditorViewSafe(editor)
    if (!view) return
    const editorDom =
      editorDomRef.current instanceof HTMLElement
        ? editorDomRef.current
        : getEditorDomSafe(editor)
    if (!(editorDom instanceof HTMLElement)) return

    const activeEl = columnHandle.el
    if (!(activeEl instanceof HTMLElement)) return
    if (!editorDom.contains(activeEl)) return

    const fromRowPos = columnHandle.rowPos
    const fromChildIndex = columnHandle.childIndex
    const fromChildPos = columnHandle.childPos
    if (
      typeof fromRowPos !== 'number' ||
      !Number.isInteger(fromChildIndex) ||
      typeof fromChildPos !== 'number'
    ) {
      return
    }

    const point = getClientPointFromEvent(e)
    if (!point) return

    e.preventDefault()
    e.stopPropagation()
    if (
      typeof e.pointerId === 'number' &&
      e.currentTarget &&
      typeof e.currentTarget.setPointerCapture === 'function'
    ) {
      try {
        e.currentTarget.setPointerCapture(e.pointerId)
      } catch {
        // ignore
      }
    }

    const rect = activeEl.getBoundingClientRect()
    const editorRect = editorDom.getBoundingClientRect()
    const startY =
      rect.top -
      editorRect.top +
      editorDom.scrollTop +
      Math.max(0, (rect.height - 24) / 2)

    dragRef.current = {
      active: true,
      startPoint: point,
      lastPoint: point,
      fromId: fromRowPos,
      fromKind: 'column-child',
      fromChildIndex,
      fromChildPos,
      startScrollTop: editorDom.scrollTop,
    }

    moveSelectionToTopLevelBlock(view, fromRowPos)

    setActiveId(fromRowPos)
    setStartHandleY(startY)
    setDragDy(0)
    setDraggingClass(true)
    setNativeDragMode(true)

    activeDragTransformRef.current = { el: activeEl, transform: activeEl.style.transform || '' }
    activeEl.style.setProperty('--block-dnd-dy', '0px')
    activeEl.classList.add('block-dnd-active', 'block-dnd-dragging')
    activeBlockRef.current = activeEl

    updateDropHintFromPoint(point, {
      fromId: fromRowPos,
      fromKind: 'column-child',
      fromChildIndex,
    })
  }

  const onHandlePointerDown = (e) => {
    if (!canDrag) return
    if (e.button != null && e.button !== 0) return
    if (!editor || !isViewReady) return
    if (dragRef.current.active) return
    if (blocksRef.current.length < 2) return

    const view = getEditorViewSafe(editor)
    if (!view) return
    const editorDom =
      editorDomRef.current instanceof HTMLElement
        ? editorDomRef.current
        : getEditorDomSafe(editor)
    if (!(editorDom instanceof HTMLElement)) return

    const point = getClientPointFromEvent(e)
    if (!point) return

    const hoveredEl = hoverRef.current?.el
    const hoveredPos = hoverRef.current?.blockPos

    const fromPointEl = getNearestTopLevelBlockElByClientY(editorDom, point.y)
    let activeEl =
      fromPointEl instanceof HTMLElement
        ? fromPointEl
        : hoveredEl instanceof HTMLElement
          ? hoveredEl
          : null

    let from = typeof hoveredPos === 'number' ? hoveredPos : hoverPos
    if (!(activeEl instanceof HTMLElement)) return

    {
      const known = blocksRef.current.find(b => b.el === activeEl)
      const resolvedFrom =
        typeof known?.id === 'number' ? known.id : getTopLevelBlockPos(view, activeEl)
      if (typeof resolvedFrom === 'number') from = resolvedFrom
    }

    if (typeof from !== 'number') return
    if (!(activeEl instanceof HTMLElement)) return

    e.preventDefault()
    e.stopPropagation()
    if (
      typeof e.pointerId === 'number' &&
      e.currentTarget &&
      typeof e.currentTarget.setPointerCapture === 'function'
    ) {
      try {
        e.currentTarget.setPointerCapture(e.pointerId)
      } catch {
        // ignore
      }
    }

    const rect = activeEl.getBoundingClientRect()
    const editorRect = editorDom.getBoundingClientRect()
    const startY =
      rect.top -
      editorRect.top +
      editorDom.scrollTop +
      Math.max(0, (rect.height - 24) / 2)

    dragRef.current = {
      active: true,
      startPoint: point,
      lastPoint: point,
      fromId: from,
      fromKind: 'top',
      fromChildIndex: null,
      fromChildPos: null,
      startScrollTop: editorDom.scrollTop,
    }

    moveSelectionToTopLevelBlock(view, from)

    setActiveId(from)
    setStartHandleY(startY)
    setDragDy(0)
    setDraggingClass(true)
    setNativeDragMode(true)

    activeDragTransformRef.current = { el: activeEl, transform: activeEl.style.transform || '' }
    activeEl.style.setProperty('--block-dnd-dy', '0px')
    activeEl.classList.add('block-dnd-active', 'block-dnd-dragging')
    activeBlockRef.current = activeEl
    updateDropHintFromPoint(point, {
      fromId: from,
      fromKind: 'top',
      fromChildIndex: null,
    })
  }

  const baseY = typeof activeId === 'number' ? startHandleY : hoverY
  const handleY = typeof baseY === 'number' ? baseY + dragDy : null
  const handleTransform =
    typeof handleY === 'number'
      ? `translate3d(0px, ${handleY}px, 0)`
      : null

  return (
    <>
      {handleLayerEl &&
      typeof activeId === 'number' &&
      gutterHint &&
      Number.isFinite(gutterHint.top) &&
      Number.isFinite(gutterHint.height)
        ? createPortal(
            gutterHint.axis === 'vertical'
              ? <div
                  className={`block-dnd-side-indicator ${gutterHint.position === 'left' ? 'is-left' : 'is-right'}`}
                  style={{
                    transform: `translate3d(${Math.max(0, gutterHint.left ?? 0)}px, ${gutterHint.top}px, 0px)`,
                    width: `${Math.max(2, gutterHint.width ?? 0)}px`,
                    height: `${Math.max(2, gutterHint.height)}px`,
                  }}
                />
              : <div
                  className={`block-dnd-gutter-indicator ${gutterHint.position === 'before' ? 'is-top' : 'is-bottom'}`}
                  style={{
                    transform: `translate3d(0px, ${gutterHint.top}px, 0px)`,
                    height: `${Math.max(2, gutterHint.height)}px`,
                  }}
                />,
            handleLayerEl
          )
        : null}

      {ENABLE_COLUMN_CHILD_DRAG_HANDLE &&
      handleLayerEl &&
      typeof activeId !== 'number' &&
      isInScope &&
      Array.isArray(columnHandles) &&
      columnHandles.length > 0
        ? createPortal(
            <>
              {columnHandles.map((columnHandle) => {
                if (!columnHandle || !Number.isFinite(columnHandle.x) || !Number.isFinite(columnHandle.y)) {
                  return null
                }
                return <button
                    key={columnHandle.key}
                    type="button"
                    className="block-dnd-handle block-dnd-column-handle"
                    style={{
                      left: '0px',
                      transform: `translate3d(${columnHandle.x}px, ${columnHandle.y}px, 0px)`,
                    }}
                    onPointerDown={(e) => onColumnHandlePointerDown(e, columnHandle)}
                    aria-label="Move block"
                    title="Move block"
                  >
                    ⋮⋮
                  </button>
              })}
            </>,
            handleLayerEl
          )
        : null}

      {ENABLE_TOP_LEVEL_DRAG_HANDLE &&
      handleLayerEl &&
      typeof handleId === 'number' &&
      typeof handleY === 'number'
        ? createPortal(
            <button
              type="button"
              className={`block-dnd-handle ${canDrag ? '' : 'is-disabled'}`.trim()}
              style={handleTransform ? { transform: handleTransform } : undefined}
              onPointerDown={onHandlePointerDown}
              aria-label="Переместить блок"
              aria-disabled={!canDrag}
              disabled={!canDrag}
              title={canDrag ? 'Перетащить блок' : 'Наведи на блок'}
            >
              ⋮⋮
            </button>,
            handleLayerEl
          )
        : null}

      <div
        ref={setHandleLayerEl}
        className={`position-plus-button ${(isInScope || typeof activeId === 'number') ? 'plus-visible' : ''}`}
      />
    </>
  )
}
