import { NodeViewWrapper, NodeViewContent } from '@tiptap/react'
import { useEffect, useRef, useState } from 'react'
import DragIndicatorRoundedIcon from '@mui/icons-material/DragIndicatorRounded'
import TableRowsRoundedIcon from '@mui/icons-material/TableRowsRounded'
import ViewWeekRoundedIcon from '@mui/icons-material/ViewWeekRounded'
import ChevronRightRoundedIcon from '@mui/icons-material/ChevronRightRounded'
import { Fragment } from 'prosemirror-model'
import { clampFixedModalPosition, MODAL_VIEWPORT_MARGIN } from '../utils/modalViewportClamp'
import './tableWrapperView.css'

const TABLE_HEADER_MODAL_ESTIMATE = { width: 248, height: 208 }
const TABLE_HEADER_PRESET_COLORS = [
  '#E2E8F0',
  '#DBEAFE',
  '#DCFCE7',
  '#FEF3C7',
  '#FCE7F3',
  '#F3E8FF',
  '#FEE2E2',
  '#E5E7EB',
]

/* ================= FIND TABLE ================= */

function findTable(state) {
  const { $from } = state.selection
  for (let d = $from.depth; d > 0; d--) {
    if ($from.node(d).type.name === 'table') {
      return { node: $from.node(d), pos: $from.before(d) }
    }
  }
  return null
}

/* ================= SELECTION FIX ================= */

function ensureSelectionInThisTable(editor, tableRef) {
  const { state, view } = editor
  const dom = tableRef.current
  if (!dom) return

  try {
    const pos = view.posAtDOM(dom, 0)
    if (pos != null) {
      view.dispatch(
        state.tr.setSelection(
          state.selection.constructor.near(
            state.doc.resolve(pos + 1)
          )
        )
      )
    }
  } catch {}
}

/* ================= CURSOR HELPERS ================= */

function isSelectionInsideTable(state) {
  const { $from } = state.selection
  for (let d = $from.depth; d > 0; d--) {
    if ($from.node(d).type.name === 'table') return true
  }
  return false
}

function forceCursorBackIntoTable(editor) {
  const { view } = editor
  let safety = 0

  while (!isSelectionInsideTable(view.state) && safety < 10) {
    const { from } = view.state.selection
    view.dispatch(
      view.state.tr.setSelection(
        view.state.selection.constructor.near(
          view.state.doc.resolve(Math.max(0, from - 1)),
          -1
        )
      )
    )
    safety++
  }
}

function moveCursorLeft(editor) {
  const { state, view } = editor
  const { from } = state.selection

  for (let i = 1; i <= 5; i++) {
    try {
      const resolved = state.doc.resolve(from - i)
      view.dispatch(
        state.tr.setSelection(
          state.selection.constructor.near(resolved, -1)
        )
      )
      return
    } catch {}
  }
}

/* ================= REMOVE HELPERS ================= */

function removeLastRow(editor) {
  const { state, view } = editor
  const table = findTable(state)
  if (!table) return false

  const { node, pos } = table
  if (node.childCount <= 1) return false

  let from = pos + 1
  for (let i = 0; i < node.childCount - 1; i++) {
    from += node.child(i).nodeSize
  }

  view.dispatch(
    state.tr.delete(from, from + node.child(node.childCount - 1).nodeSize)
  )
  return true
}

function removeLastColumn(editor) {
  const { state, view } = editor
  const table = findTable(state)
  if (!table) return false

  const { node, pos } = table
  const rows = node.childCount
  const cols = node.child(0).childCount
  if (cols <= 1) return false

  const ranges = []
  let rowStart = pos + 1

  for (let r = 0; r < rows; r++) {
    const rowNode = node.child(r)
    let cellPos = rowStart
    for (let c = 0; c < cols - 1; c++) {
      cellPos += rowNode.child(c).nodeSize
    }
    ranges.push({
      from: cellPos,
      to: cellPos + rowNode.child(cols - 1).nodeSize,
    })
    rowStart += rowNode.nodeSize
  }

  let tr = state.tr
  for (let i = ranges.length - 1; i >= 0; i--) {
    tr = tr.delete(ranges[i].from, ranges[i].to)
  }
  view.dispatch(tr)
  return true
}

function isTableWrapperEmpty(tableWrapperNode) {
  if (!tableWrapperNode || tableWrapperNode.childCount === 0) return true

  const tableNode = tableWrapperNode.child(0)
  if (!tableNode || tableNode.type?.name !== 'table') return true
  if (tableNode.childCount === 0) return true

  const rows = tableNode.childCount
  let totalCells = 0
  for (let r = 0; r < rows; r++) {
    const rowNode = tableNode.child(r)
    totalCells += rowNode.childCount
  }

  return totalCells === 0
}

function getTableInWrapper(state, getPos) {
  if (typeof getPos !== 'function') return null

  let wrapperPos
  try {
    wrapperPos = getPos()
  } catch {
    return null
  }

  if (typeof wrapperPos !== 'number') return null

  const wrapperNode = state.doc.nodeAt(wrapperPos)
  if (!wrapperNode || wrapperNode.type?.name !== 'tableWrapper' || wrapperNode.childCount === 0) {
    return null
  }

  const tableNode = wrapperNode.child(0)
  if (!tableNode || tableNode.type?.name !== 'table') return null

  return {
    node: tableNode,
    pos: wrapperPos + 1,
  }
}

function isSimpleGridTable(tableNode) {
  if (!tableNode || tableNode.childCount === 0) return false

  const cols = tableNode.child(0)?.childCount || 0
  if (cols <= 0) return false

  for (let r = 0; r < tableNode.childCount; r++) {
    const rowNode = tableNode.child(r)
    if (rowNode.childCount !== cols) return false

    for (let c = 0; c < rowNode.childCount; c++) {
      const cellNode = rowNode.child(c)
      const colspan = Number(cellNode?.attrs?.colspan || 1)
      const rowspan = Number(cellNode?.attrs?.rowspan || 1)
      if (colspan !== 1 || rowspan !== 1) return false
    }
  }

  return true
}

function getCellPosInTable(tableNode, tablePos, rowIndex, colIndex) {
  if (!tableNode) return null
  if (rowIndex < 0 || rowIndex >= tableNode.childCount) return null

  const rowNode = tableNode.child(rowIndex)
  if (!rowNode || colIndex < 0 || colIndex >= rowNode.childCount) return null

  let pos = tablePos + 1
  for (let r = 0; r < rowIndex; r++) {
    pos += tableNode.child(r).nodeSize
  }
  for (let c = 0; c < colIndex; c++) {
    pos += rowNode.child(c).nodeSize
  }

  return pos
}

function moveTableRowByInsertion(editor, getPos, fromIndex, insertionIndex) {
  if (!editor) return false

  const info = getTableInWrapper(editor.state, getPos)
  if (!info) return false

  const { node: tableNode, pos: tablePos } = info
  if (!isSimpleGridTable(tableNode)) return false

  const rowCount = tableNode.childCount
  if (rowCount <= 1) return false
  if (fromIndex < 0 || fromIndex >= rowCount) return false

  const clampedInsertion = Math.max(0, Math.min(rowCount, insertionIndex))
  let targetIndex = clampedInsertion > fromIndex ? clampedInsertion - 1 : clampedInsertion
  targetIndex = Math.max(0, Math.min(rowCount - 1, targetIndex))
  if (targetIndex === fromIndex) return false

  const rows = Array.from({ length: rowCount }, (_, i) => tableNode.child(i))
  const [movedRow] = rows.splice(fromIndex, 1)
  rows.splice(targetIndex, 0, movedRow)

  const nextTableNode = tableNode.type.create(
    tableNode.attrs,
    Fragment.fromArray(rows),
    tableNode.marks
  )

  const { state, view } = editor
  let tr = state.tr.replaceWith(tablePos, tablePos + tableNode.nodeSize, nextTableNode)
  const focusCellPos = getCellPosInTable(nextTableNode, tablePos, targetIndex, 0)
  if (typeof focusCellPos === 'number') {
    tr = tr.setSelection(
      state.selection.constructor.near(tr.doc.resolve(Math.max(1, focusCellPos + 1)))
    )
  }
  view.dispatch(tr)
  return true
}

function moveTableColumnByInsertion(editor, getPos, fromIndex, insertionIndex) {
  if (!editor) return false

  const info = getTableInWrapper(editor.state, getPos)
  if (!info) return false

  const { node: tableNode, pos: tablePos } = info
  if (!isSimpleGridTable(tableNode)) return false

  const rowCount = tableNode.childCount
  const colCount = tableNode.child(0)?.childCount || 0
  if (rowCount <= 0 || colCount <= 1) return false
  if (fromIndex < 0 || fromIndex >= colCount) return false

  const clampedInsertion = Math.max(0, Math.min(colCount, insertionIndex))
  let targetIndex = clampedInsertion > fromIndex ? clampedInsertion - 1 : clampedInsertion
  targetIndex = Math.max(0, Math.min(colCount - 1, targetIndex))
  if (targetIndex === fromIndex) return false

  const reorderedRows = []
  for (let r = 0; r < rowCount; r++) {
    const rowNode = tableNode.child(r)
    const cells = Array.from({ length: colCount }, (_, i) => rowNode.child(i))
    const [movedCell] = cells.splice(fromIndex, 1)
    cells.splice(targetIndex, 0, movedCell)
    reorderedRows.push(
      rowNode.type.create(
        rowNode.attrs,
        Fragment.fromArray(cells),
        rowNode.marks
      )
    )
  }

  const nextTableNode = tableNode.type.create(
    tableNode.attrs,
    Fragment.fromArray(reorderedRows),
    tableNode.marks
  )

  const { state, view } = editor
  let tr = state.tr.replaceWith(tablePos, tablePos + tableNode.nodeSize, nextTableNode)
  const focusCellPos = getCellPosInTable(nextTableNode, tablePos, 0, targetIndex)
  if (typeof focusCellPos === 'number') {
    tr = tr.setSelection(
      state.selection.constructor.near(tr.doc.resolve(Math.max(1, focusCellPos + 1)))
    )
  }
  view.dispatch(tr)
  return true
}

function isValidHexColor(value) {
  return typeof value === 'string' && /^#[0-9A-F]{6}$/i.test(value.trim())
}

function normalizeHeaderColor(value, fallback = '#E2E8F0') {
  if (isValidHexColor(value)) return value.trim().toUpperCase()
  return fallback
}

/* ================= COMPONENT ================= */

export default function TableWrapperView({ editor, node, getPos, updateAttributes }) {
  const tableRef = useRef(null)
  const resizeObserverRef = useRef(null)
  const dragReorderRef = useRef(null)
  const hoverCellRef = useRef({ row: -1, col: -1 })
  const isEditableRef = useRef(Boolean(editor?.isEditable))
  const headerToolsRef = useRef(null)
  const headerColorModalRef = useRef(null)
  const headerColorToggleRef = useRef(null)
  const [controls, setControls] = useState(null)
  const [dropGuide, setDropGuide] = useState(null)
  const [tableHovered, setTableHovered] = useState(false)
  const [headerControlsHovered, setHeaderControlsHovered] = useState(false)
  const [headerColorOpen, setHeaderColorOpen] = useState(false)
  const [headerColorPos, setHeaderColorPos] = useState({ x: 0, y: 0 })
  const [headerColorInput, setHeaderColorInput] = useState('#E2E8F0')
  const isEditable = Boolean(editor?.isEditable)
  const textAlign = node?.attrs?.textAlign || 'left'
  const headerRowEnabled = Boolean(node?.attrs?.headerRowEnabled)
  const headerColumnEnabled = Boolean(node?.attrs?.headerColumnEnabled)
  const headerBgColor = normalizeHeaderColor(node?.attrs?.headerBgColor, '#E2E8F0')
  const alignMargins =
    textAlign === 'center'
      ? { marginLeft: 'auto', marginRight: 'auto' }
      : textAlign === 'right'
        ? { marginLeft: 'auto', marginRight: 0 }
        : { marginLeft: 0, marginRight: 'auto' }
  
  // 🔒 Это должно быть внутри компонента!
  const lockedTablePosRef = useRef(null)

  useEffect(() => {
    isEditableRef.current = isEditable
  }, [isEditable])

  useEffect(() => {
    setHeaderColorInput(headerBgColor)
  }, [headerBgColor])

  useEffect(() => {
    if (isEditable) return
    setHeaderColorOpen(false)
    setTableHovered(false)
    setHeaderControlsHovered(false)
  }, [isEditable])

  function forceSelectionInLockedTable(editor, lockedPos) {
    const { state, view } = editor
    const { $from } = state.selection

    for (let d = $from.depth; d > 0; d--) {
      if (
        $from.node(d).type.name === 'table' &&
        $from.before(d) === lockedPos
      ) {
        return // всё ок, мы в нужной таблице
      }
    }

    // если вышли — возвращаемся внутрь
    try {
      view.dispatch(
        state.tr.setSelection(
          state.selection.constructor.near(
            state.doc.resolve(lockedPos + 1)
          )
        )
      )
    } catch {}
  }

  const getDims = () => {
    const t = findTable(editor.state)
    if (!t) return { rows: 0, cols: 0 }
    return {
      rows: t.node.childCount,
      cols: t.node.child(0)?.childCount || 0,
    }
  }

  const setCursorAt = (row, col) => {
    const { state, view } = editor
    const table = findTable(state)
    if (!table) return

    let pos = table.pos + 1
    for (let r = 0; r < row; r++) pos += table.node.child(r).nodeSize
    for (let c = 0; c < col; c++) pos += table.node.child(row).child(c).nodeSize
    pos += 1

    view.dispatch(
      state.tr.setSelection(
        state.selection.constructor.near(state.doc.resolve(pos))
      )
    )
  }

  const moveCursorToEnd = () => {
    const d = getDims()
    if (!d.rows || !d.cols) return
    setCursorAt(d.rows - 1, d.cols - 1)
  }

  const getCellSize = () => {
    const rect = tableRef.current.getBoundingClientRect()
    const d = getDims()
    return { col: rect.width / d.cols, row: rect.height / d.rows }
  }

  const getTableElement = () => {
    const container = tableRef.current
    if (!(container instanceof HTMLElement)) return null
    const tableEl = container.querySelector('table')
    return tableEl instanceof HTMLTableElement ? tableEl : null
  }

  const clearHoverCell = () => {
    const prev = hoverCellRef.current
    if (prev.row === -1 && prev.col === -1) return
    hoverCellRef.current = { row: -1, col: -1 }
  }

  const patchWrapperAttrs = patch => {
    if (typeof updateAttributes !== 'function') return
    updateAttributes(patch)
  }

  const toggleHeaderRow = event => {
    event.preventDefault()
    event.stopPropagation()
    patchWrapperAttrs({ headerRowEnabled: !headerRowEnabled })
  }

  const toggleHeaderColumn = event => {
    event.preventDefault()
    event.stopPropagation()
    patchWrapperAttrs({ headerColumnEnabled: !headerColumnEnabled })
  }

  const applyHeaderColor = color => {
    const normalized = normalizeHeaderColor(color, headerBgColor)
    setHeaderColorInput(normalized)
    patchWrapperAttrs({ headerBgColor: normalized })
  }

  const openHeaderColorPopup = event => {
    event.preventDefault()
    event.stopPropagation()

    const triggerRect = event.currentTarget.getBoundingClientRect()
    setHeaderColorPos(
      clampFixedModalPosition(
        { x: triggerRect.left, y: triggerRect.bottom + 8 },
        TABLE_HEADER_MODAL_ESTIMATE,
        MODAL_VIEWPORT_MARGIN
      )
    )
    setHeaderColorOpen(prev => !prev)
  }

  const stopEditorPointer = event => {
    event.preventDefault()
    event.stopPropagation()
  }

  const getGuideBoundaryRect = () => {
    const container = tableRef.current
    if (!(container instanceof HTMLElement)) return null

    const panelScroller = container.closest('.panel-content')
    const stickyTopEl =
      panelScroller instanceof HTMLElement
        ? panelScroller.querySelector('.tiptap-panel-top-sticky')
        : null
    const proseMirrorEl = container.closest('.ProseMirror')
    const fallbackEl =
      container.closest('.editor-content-frame') ||
      container.closest('.editor-hover-scope') ||
      container.closest('.panel-content')
    const boundaryEl =
      proseMirrorEl instanceof HTMLElement
        ? proseMirrorEl
        : fallbackEl instanceof HTMLElement
          ? fallbackEl
          : null

    if (!(boundaryEl instanceof HTMLElement)) return null

    const baseRect = boundaryEl.getBoundingClientRect()
    let top = baseRect.top
    let right = baseRect.right
    let bottom = baseRect.bottom
    let left = baseRect.left

    if (panelScroller instanceof HTMLElement) {
      const panelRect = panelScroller.getBoundingClientRect()
      let visibleTop = panelRect.top

      if (stickyTopEl instanceof HTMLElement) {
        const stickyStyle = window.getComputedStyle(stickyTopEl)
        if (stickyStyle.position === 'sticky' || stickyStyle.position === 'fixed') {
          visibleTop += stickyTopEl.getBoundingClientRect().height
        }
      }

      top = Math.max(top, visibleTop)
      right = Math.min(right, panelRect.right)
      bottom = Math.min(bottom, panelRect.bottom)
      left = Math.max(left, panelRect.left)
    }

    if (!(bottom > top && right > left)) return null

    return { top, right, bottom, left }
  }

  /* ================= CONTROLS ================= */

  const updateControls = () => {
    if (!editor || !tableRef.current) return
    const r = tableRef.current.getBoundingClientRect()
    const panelScroller = tableRef.current.closest('.panel-content')
    const panelRect =
      panelScroller instanceof HTMLElement ? panelScroller.getBoundingClientRect() : null
    const stickyTopEl =
      panelScroller instanceof HTMLElement
        ? panelScroller.querySelector('.tiptap-panel-top-sticky')
        : null

    let stickyTopOffset = 0
    if (stickyTopEl instanceof HTMLElement) {
      const stickyStyle = window.getComputedStyle(stickyTopEl)
      if (stickyStyle.position === 'sticky' || stickyStyle.position === 'fixed') {
        stickyTopOffset = stickyTopEl.getBoundingClientRect().height
      }
    }

    const boundaryEl =
      tableRef.current.closest('.editor-hover-scope') ||
      tableRef.current.closest('.editor-content-frame') ||
      tableRef.current.closest('.panel-content')
    const boundaryRect =
      boundaryEl instanceof HTMLElement ? boundaryEl.getBoundingClientRect() : null

    const PLUS_SIZE = 20
    const DRAG_SIZE = 20
    const DRAG_HALF = DRAG_SIZE / 2
    const OFFSET = 6
    const HEADER_TOOLS_HEIGHT = 24
    const HEADER_TOOLS_WIDTH = 78
    const clamp = (value, min, max) => Math.min(max, Math.max(min, value))

    let colLeft = r.right + OFFSET
    let colTop = r.top
    let colHeight = r.height
    let bothLeft = r.right + OFFSET
    let bothTop = r.bottom + OFFSET
    let rowLeft = r.left
    let rowTop = r.bottom + OFFSET
    let rowWidth = r.width
    let rowDrag = null
    let colDrag = null
    let headerToolsLeft = r.right - HEADER_TOOLS_WIDTH
    let headerToolsTop = r.top + OFFSET

    let minLeft = Number.NEGATIVE_INFINITY
    let maxPlusLeft = Number.POSITIVE_INFINITY
    let minTop = Number.NEGATIVE_INFINITY
    let maxPlusTop = Number.POSITIVE_INFINITY
    let maxVisibleBottom = Number.POSITIVE_INFINITY
    let maxVisibleRight = Number.POSITIVE_INFINITY

    if (boundaryRect) {
      minLeft = boundaryRect.left + OFFSET
      maxPlusLeft = Math.max(minLeft, boundaryRect.right - OFFSET - PLUS_SIZE)
      const boundaryTop = boundaryRect.top + OFFSET
      const scrollerVisibleTop =
        panelRect && Number.isFinite(panelRect.top)
          ? panelRect.top + stickyTopOffset + OFFSET
          : boundaryTop
      minTop = Math.max(boundaryTop, scrollerVisibleTop)
      maxPlusTop = Math.max(minTop, boundaryRect.bottom - OFFSET - PLUS_SIZE)
      maxVisibleBottom = boundaryRect.bottom - OFFSET
      maxVisibleRight = boundaryRect.right - OFFSET

      const tableIsOutsideVisibleArea =
        r.bottom <= minTop ||
        r.top >= maxVisibleBottom ||
        r.right <= minLeft ||
        r.left >= maxVisibleRight

      if (tableIsOutsideVisibleArea) {
        setControls(null)
        return
      }

      colLeft = clamp(colLeft, minLeft, maxPlusLeft)
      bothLeft = clamp(bothLeft, minLeft, maxPlusLeft)

      const visibleColTop = Math.max(minTop, r.top)
      const visibleColBottom = Math.min(maxVisibleBottom, r.bottom)
      colTop = clamp(visibleColTop, minTop, maxPlusTop)
      colHeight = Math.max(PLUS_SIZE, visibleColBottom - visibleColTop)

      rowTop = clamp(rowTop, minTop, maxPlusTop)
      bothTop = clamp(bothTop, minTop, maxPlusTop)
      const maxHeaderTop = Math.max(minTop, boundaryRect.bottom - OFFSET - HEADER_TOOLS_HEIGHT)
      const maxHeaderLeft = Math.max(minLeft, boundaryRect.right - OFFSET - HEADER_TOOLS_WIDTH)
      headerToolsTop = clamp(headerToolsTop, minTop, maxHeaderTop)
      headerToolsLeft = clamp(headerToolsLeft, minLeft, maxHeaderLeft)

      const rowRightLimit = boundaryRect.right - OFFSET
      rowLeft = clamp(Math.max(minLeft, r.left), minLeft, maxPlusLeft)
      const visibleRowRight = Math.min(r.right, rowRightLimit)
      rowWidth = Math.max(PLUS_SIZE, visibleRowRight - rowLeft)
    }

    const tableInfo = getTableInWrapper(editor.state, getPos)
    const hovered = hoverCellRef.current
    const canShowDragHandles =
      Boolean(isEditableRef.current) &&
      !dragReorderRef.current &&
      hovered.row >= 0 &&
      hovered.col >= 0 &&
      tableInfo &&
      isSimpleGridTable(tableInfo.node)

    if (canShowDragHandles) {
      const tableEl = getTableElement()
      if (tableEl) {
        const rowEl = tableEl.rows?.[hovered.row]
        const firstRow = tableEl.rows?.[0]
        const colEl = firstRow?.cells?.[hovered.col]

        if (rowEl && colEl) {
          const rowRect = rowEl.getBoundingClientRect()
          const colRect = colEl.getBoundingClientRect()
          let rowDragTop = rowRect.top + rowRect.height / 2 - DRAG_SIZE / 2
          let rowDragLeft = r.left - DRAG_HALF
          let colDragTop = r.top - DRAG_HALF
          let colDragLeft = colRect.left + colRect.width / 2 - DRAG_SIZE / 2

          if (boundaryRect) {
            const maxDragLeft = Math.max(minLeft, boundaryRect.right - OFFSET - DRAG_SIZE)
            const maxDragTop = Math.max(minTop, boundaryRect.bottom - OFFSET - DRAG_SIZE)
            rowDragLeft = clamp(rowDragLeft, minLeft, maxDragLeft)
            rowDragTop = clamp(rowDragTop, minTop, maxDragTop)
            colDragLeft = clamp(colDragLeft, minLeft, maxDragLeft)
            colDragTop = clamp(colDragTop, minTop, maxDragTop)

            if (
              rowRect.bottom > minTop &&
              rowRect.top < maxVisibleBottom &&
              r.left < maxVisibleRight
            ) {
              rowDrag = { top: rowDragTop, left: rowDragLeft }
            }

            if (
              colRect.right > minLeft &&
              colRect.left < maxVisibleRight &&
              r.top < maxVisibleBottom
            ) {
              colDrag = { top: colDragTop, left: colDragLeft }
            }
          } else {
            rowDrag = { top: rowDragTop, left: rowDragLeft }
            colDrag = { top: colDragTop, left: colDragLeft }
          }
        }
      }
    }

    setControls({
      col: { top: colTop, left: colLeft, height: colHeight },
      row: { top: rowTop, left: rowLeft, width: rowWidth },
      both: { top: bothTop, left: bothLeft },
      rowDrag,
      colDrag,
      headerTools: {
        top: headerToolsTop,
        left: headerToolsLeft,
      },
    })
  }

  useEffect(() => {
    if (!editor) return

    const update = () => {
      // requestAnimationFrame, чтобы DOM успел перелэйаутиться
      requestAnimationFrame(updateControls)
    }

    editor.on('transaction', update)

    return () => {
      editor.off('transaction', update)
    }
  }, [editor])

  useEffect(() => {
    if (!headerColorOpen) return

    const closeOnOutside = event => {
      const target = event.target
      if (!(target instanceof Element)) return
      if (headerColorModalRef.current?.contains(target)) return
      if (headerColorToggleRef.current?.contains(target)) return
      setHeaderColorOpen(false)
    }

    document.addEventListener('mousedown', closeOnOutside)
    return () => {
      document.removeEventListener('mousedown', closeOnOutside)
    }
  }, [headerColorOpen])

  useEffect(() => {
    if (!headerColorOpen) return

    const clampColorPopup = () => {
      const rect = headerColorModalRef.current?.getBoundingClientRect?.()
      if (!rect) return
      setHeaderColorPos(prev => {
        const next = clampFixedModalPosition(prev, rect, MODAL_VIEWPORT_MARGIN)
        if (next.x === prev.x && next.y === prev.y) return prev
        return next
      })
    }

    const rafId = window.requestAnimationFrame(clampColorPopup)
    window.addEventListener('resize', clampColorPopup)
    return () => {
      window.cancelAnimationFrame(rafId)
      window.removeEventListener('resize', clampColorPopup)
    }
  }, [headerColorOpen])

  useEffect(() => {
    if (!isEditable) return

    const forceHideWhenOutside = event => {
      if (!tableHovered && !headerControlsHovered && !headerColorOpen) return
      const target = event.target
      if (!(target instanceof Element)) return

      const isInsideTable =
        tableRef.current instanceof HTMLElement && tableRef.current.contains(target)
      const isInsideHeaderTools =
        headerToolsRef.current instanceof HTMLElement && headerToolsRef.current.contains(target)
      const isInsideColorModal =
        headerColorModalRef.current instanceof HTMLElement && headerColorModalRef.current.contains(target)
      const isInsideTableControls =
        target.closest('.table-drag-handle') || target.closest('.table-plus')

      if (isInsideTable || isInsideHeaderTools || isInsideColorModal || isInsideTableControls) return

      setTableHovered(false)
      setHeaderControlsHovered(false)
      clearHoverCell()
    }

    document.addEventListener('mousemove', forceHideWhenOutside, true)
    return () => {
      document.removeEventListener('mousemove', forceHideWhenOutside, true)
    }
  }, [isEditable, tableHovered, headerControlsHovered, headerColorOpen])

  useEffect(() => {
    if (!editor || !node || typeof getPos !== 'function') return
    if (!isTableWrapperEmpty(node)) return

    const pos = getPos()
    if (typeof pos !== 'number') return

    const { state, view } = editor
    view.dispatch(state.tr.delete(pos, pos + node.nodeSize))
  }, [editor, node, getPos])

  useEffect(() => {
    const panelScroller =
      tableRef.current instanceof HTMLElement
        ? tableRef.current.closest('.panel-content')
        : null
    const rightPanel = document.querySelector('.right-panel')

    updateControls()
    window.addEventListener('scroll', updateControls, true)
    window.addEventListener('resize', updateControls)
    resizeObserverRef.current = new ResizeObserver(updateControls)
    if (tableRef.current instanceof HTMLElement) {
      resizeObserverRef.current.observe(tableRef.current)
    }
    if (panelScroller instanceof HTMLElement) {
      resizeObserverRef.current.observe(panelScroller)
    }
    if (rightPanel instanceof HTMLElement) {
      rightPanel.addEventListener('transitionrun', updateControls)
      rightPanel.addEventListener('transitionstart', updateControls)
      rightPanel.addEventListener('transitionend', updateControls)
      rightPanel.addEventListener('transitioncancel', updateControls)
    }

    return () => {
      window.removeEventListener('scroll', updateControls, true)
      window.removeEventListener('resize', updateControls)
      if (rightPanel instanceof HTMLElement) {
        rightPanel.removeEventListener('transitionrun', updateControls)
        rightPanel.removeEventListener('transitionstart', updateControls)
        rightPanel.removeEventListener('transitionend', updateControls)
        rightPanel.removeEventListener('transitioncancel', updateControls)
      }
      resizeObserverRef.current?.disconnect()
    }
  }, [])

  const handleTableMouseEnter = () => {
    if (!isEditableRef.current) return
    setTableHovered(true)
  }

  const handleTableMouseMove = event => {
    if (!isEditableRef.current || dragReorderRef.current) return
    setTableHovered(true)

    const target = event.target
    if (!(target instanceof Element)) return

    const cell = target.closest('td, th')
    const tableEl = getTableElement()
    if (!(cell instanceof HTMLTableCellElement) || !tableEl || !tableEl.contains(cell)) return

    const rowEl = cell.parentElement
    if (!(rowEl instanceof HTMLTableRowElement)) return

    const nextRow = rowEl.rowIndex
    const nextCol = cell.cellIndex
    const prev = hoverCellRef.current
    if (prev.row === nextRow && prev.col === nextCol) return

    hoverCellRef.current = { row: nextRow, col: nextCol }
    requestAnimationFrame(updateControls)
  }

  const handleTableMouseLeave = event => {
    if (dragReorderRef.current) return
    const related = event.relatedTarget
    if (
      related instanceof Element &&
      (
        related.closest('.table-drag-handle') ||
        related.closest('.table-header-tools') ||
        related.closest('.table-header-color-modal')
      )
    ) {
      return
    }
    setTableHovered(false)
    clearHoverCell()
    requestAnimationFrame(updateControls)
  }

  const handleDragHandleMouseLeave = event => {
    if (dragReorderRef.current) return
    const related = event.relatedTarget
    if (
      related instanceof Element &&
      (related.closest('.table-drag-handle') || related.closest('.table-container'))
    ) {
      return
    }
    clearHoverCell()
    requestAnimationFrame(updateControls)
  }

  const handleHeaderToolsMouseEnter = () => {
    setHeaderControlsHovered(true)
    setTableHovered(true)
  }

  const handleHeaderToolsMouseLeave = event => {
    const related = event.relatedTarget
    if (
      related instanceof Element &&
      (
        related.closest('.table-container') ||
        related.closest('.table-header-tools') ||
        related.closest('.table-header-color-modal')
      )
    ) {
      return
    }

    setHeaderControlsHovered(false)
    if (!headerColorOpen) {
      setTableHovered(false)
    }
  }

  const handleHeaderColorInputChange = event => {
    const nextValue = event.target.value.toUpperCase()
    if (nextValue === '' || /^#[0-9A-F]{0,6}$/i.test(nextValue)) {
      setHeaderColorInput(nextValue)
    }
  }

  const commitHeaderColorInput = () => {
    const nextColor = normalizeHeaderColor(headerColorInput, headerBgColor)
    setHeaderColorInput(nextColor)
    applyHeaderColor(nextColor)
  }

  const getRowInsertionIndex = clientY => {
    const tableEl = getTableElement()
    if (!tableEl) return -1
    const rows = Array.from(tableEl.rows)
    if (!rows.length) return -1

    for (let i = 0; i < rows.length; i++) {
      const rect = rows[i].getBoundingClientRect()
      if (clientY < rect.top + rect.height / 2) {
        return i
      }
    }

    return rows.length
  }

  const getColumnInsertionIndex = clientX => {
    const tableEl = getTableElement()
    if (!tableEl) return -1

    const firstRow = tableEl.rows?.[0]
    if (!firstRow) return -1

    const cells = Array.from(firstRow.cells)
    if (!cells.length) return -1

    for (let i = 0; i < cells.length; i++) {
      const rect = cells[i].getBoundingClientRect()
      if (clientX < rect.left + rect.width / 2) {
        return i
      }
    }

    return cells.length
  }

  const updateRowDropGuide = insertionIndex => {
    const tableEl = getTableElement()
    if (!tableEl) return
    const rows = Array.from(tableEl.rows)
    if (!rows.length) return

    const tableRect = tableEl.getBoundingClientRect()
    const boundaryRect = getGuideBoundaryRect()
    const y =
      insertionIndex <= 0
        ? rows[0].getBoundingClientRect().top
        : insertionIndex >= rows.length
          ? rows[rows.length - 1].getBoundingClientRect().bottom
          : rows[insertionIndex].getBoundingClientRect().top

    let left = tableRect.left
    let right = tableRect.right
    let lineY = y - 1

    if (boundaryRect) {
      left = Math.max(left, boundaryRect.left)
      right = Math.min(right, boundaryRect.right)
      lineY = Math.min(boundaryRect.bottom - 1, Math.max(boundaryRect.top, lineY))
    }

    if (right <= left) {
      setDropGuide(null)
      return
    }

    setDropGuide({
      type: 'row',
      style: {
        top: lineY,
        left,
        width: right - left,
        height: 2,
      },
    })
  }

  const updateColumnDropGuide = insertionIndex => {
    const tableEl = getTableElement()
    if (!tableEl) return
    const firstRow = tableEl.rows?.[0]
    if (!firstRow) return

    const cells = Array.from(firstRow.cells)
    if (!cells.length) return

    const tableRect = tableEl.getBoundingClientRect()
    const boundaryRect = getGuideBoundaryRect()
    const x =
      insertionIndex <= 0
        ? cells[0].getBoundingClientRect().left
        : insertionIndex >= cells.length
          ? cells[cells.length - 1].getBoundingClientRect().right
          : cells[insertionIndex].getBoundingClientRect().left

    let top = tableRect.top
    let bottom = tableRect.bottom
    let lineX = x - 1

    if (boundaryRect) {
      top = Math.max(top, boundaryRect.top)
      bottom = Math.min(bottom, boundaryRect.bottom)
      lineX = Math.min(boundaryRect.right - 1, Math.max(boundaryRect.left, lineX))
    }

    if (bottom <= top) {
      setDropGuide(null)
      return
    }

    setDropGuide({
      type: 'col',
      style: {
        top,
        left: lineX,
        width: 2,
        height: bottom - top,
      },
    })
  }

  const stopReorderDrag = () => {
    dragReorderRef.current = null
    setDropGuide(null)
    requestAnimationFrame(updateControls)
  }

  const startRowReorderDrag = e => {
    e.preventDefault()
    e.stopPropagation()

    const tableInfo = getTableInWrapper(editor.state, getPos)
    if (!tableInfo || !isSimpleGridTable(tableInfo.node)) return

    const fromRow = hoverCellRef.current.row
    if (fromRow < 0 || fromRow >= tableInfo.node.childCount) return

    dragReorderRef.current = {
      type: 'row',
      fromIndex: fromRow,
      insertionIndex: fromRow,
      lastClientY: e.clientY,
    }

    const move = evt => {
      const active = dragReorderRef.current
      if (!active || active.type !== 'row') return
      active.lastClientY = evt.clientY

      const insertion = getRowInsertionIndex(evt.clientY)
      if (insertion < 0) {
        updateRowDropGuide(active.insertionIndex)
        return
      }

      active.insertionIndex = insertion
      updateRowDropGuide(insertion)
    }

    const syncOnViewport = () => {
      const active = dragReorderRef.current
      if (!active || active.type !== 'row') return

      const y = Number.isFinite(active.lastClientY) ? active.lastClientY : e.clientY
      const insertion = getRowInsertionIndex(y)
      if (insertion >= 0) {
        active.insertionIndex = insertion
      }
      updateRowDropGuide(active.insertionIndex)
    }

    const up = evt => {
      document.removeEventListener('mousemove', move)
      document.removeEventListener('mouseup', up)
      window.removeEventListener('scroll', syncOnViewport, true)
      window.removeEventListener('resize', syncOnViewport)

      const active = dragReorderRef.current
      if (!active || active.type !== 'row') {
        stopReorderDrag()
        return
      }

      const insertion = getRowInsertionIndex(evt.clientY)
      const targetInsertion = insertion >= 0 ? insertion : active.insertionIndex
      moveTableRowByInsertion(editor, getPos, active.fromIndex, targetInsertion)
      stopReorderDrag()
    }

    document.addEventListener('mousemove', move)
    document.addEventListener('mouseup', up)
    window.addEventListener('scroll', syncOnViewport, true)
    window.addEventListener('resize', syncOnViewport)
    move(e)
    requestAnimationFrame(updateControls)
  }

  const startColumnReorderDrag = e => {
    e.preventDefault()
    e.stopPropagation()

    const tableInfo = getTableInWrapper(editor.state, getPos)
    if (!tableInfo || !isSimpleGridTable(tableInfo.node)) return

    const fromCol = hoverCellRef.current.col
    const colCount = tableInfo.node.child(0)?.childCount || 0
    if (fromCol < 0 || fromCol >= colCount) return

    dragReorderRef.current = {
      type: 'col',
      fromIndex: fromCol,
      insertionIndex: fromCol,
      lastClientX: e.clientX,
    }

    const move = evt => {
      const active = dragReorderRef.current
      if (!active || active.type !== 'col') return
      active.lastClientX = evt.clientX

      const insertion = getColumnInsertionIndex(evt.clientX)
      if (insertion < 0) {
        updateColumnDropGuide(active.insertionIndex)
        return
      }

      active.insertionIndex = insertion
      updateColumnDropGuide(insertion)
    }

    const syncOnViewport = () => {
      const active = dragReorderRef.current
      if (!active || active.type !== 'col') return

      const x = Number.isFinite(active.lastClientX) ? active.lastClientX : e.clientX
      const insertion = getColumnInsertionIndex(x)
      if (insertion >= 0) {
        active.insertionIndex = insertion
      }
      updateColumnDropGuide(active.insertionIndex)
    }

    const up = evt => {
      document.removeEventListener('mousemove', move)
      document.removeEventListener('mouseup', up)
      window.removeEventListener('scroll', syncOnViewport, true)
      window.removeEventListener('resize', syncOnViewport)

      const active = dragReorderRef.current
      if (!active || active.type !== 'col') {
        stopReorderDrag()
        return
      }

      const insertion = getColumnInsertionIndex(evt.clientX)
      const targetInsertion = insertion >= 0 ? insertion : active.insertionIndex
      moveTableColumnByInsertion(editor, getPos, active.fromIndex, targetInsertion)
      stopReorderDrag()
    }

    document.addEventListener('mousemove', move)
    document.addEventListener('mouseup', up)
    window.addEventListener('scroll', syncOnViewport, true)
    window.addEventListener('resize', syncOnViewport)
    move(e)
    requestAnimationFrame(updateControls)
  }

  /* ================= DRAG HANDLERS ================= */

  const startAddCols = e => {
    e.preventDefault()
    ensureSelectionInThisTable(editor, tableRef)

    const startX = e.clientX
    const { col } = getCellSize()
    let prev = 0

    // 🔒 фиксируем таблицу
    const table = findTable(editor.state)
    if (!table) return
    lockedTablePosRef.current = table.pos

    const move = e => {
      // ⛔ НЕ ДАЁМ selection уйти в другую таблицу
      forceSelectionInLockedTable(editor, lockedTablePosRef.current)
      
      const dx = Math.floor((e.clientX - startX) / col)
      if (dx === prev) return

      if (dx > prev) {
        // ⬅️ ГАРАНТИРУЕМ, что курсор в последнем столбце
        const d = getDims()
        setCursorAt(0, d.cols - 1)

        for (let i = 0; i < dx - prev; i++) {
          editor.commands.addColumnAfter()
        }
      }
      if (dx < prev) {
        for (let i = 0; i < prev - dx; i++) {
          if (removeLastColumn(editor)) {
            // ⬅️ ВАЖНО: если таблица из 1 строки — страхуемся
            if (!isSelectionInsideTable(editor.state)) {
              forceCursorBackIntoTable(editor)
            }
          }
        }
      }

      const d = getDims()
      setCursorAt(0, d.cols - 1)
      prev = dx
    }

    const up = () => {
      lockedTablePosRef.current = null
      document.removeEventListener('mousemove', move)
      document.removeEventListener('mouseup', up)
    }

    document.addEventListener('mousemove', move)
    document.addEventListener('mouseup', up, { once: true })
  }

  const startAddRows = e => {
    e.preventDefault()
    ensureSelectionInThisTable(editor, tableRef)

    const startY = e.clientY
    const { row } = getCellSize()
    let prev = 0
    const wasInside = isSelectionInsideTable(editor.state)

    // 🔒 фиксируем таблицу
    const table = findTable(editor.state)
    if (!table) return
    lockedTablePosRef.current = table.pos

    const move = e => {
      // ⛔ НЕ ДАЁМ selection уйти в другую таблицу
      forceSelectionInLockedTable(editor, lockedTablePosRef.current)
      
      const dy = Math.floor((e.clientY - startY) / row)
      if (dy === prev) return

      if (dy > prev) {
        // ✅ КЛЮЧЕВОЕ ИЗМЕНЕНИЕ:
        // каждый раз перед добавлением ставим курсор В КОНЕЦ таблицы
        for (let i = 0; i < dy - prev; i++) {
          const d = getDims()
          setCursorAt(d.rows - 1, 0)
          editor.commands.addRowAfter()
        }
      }
      if (dy < prev) {
        for (let i = 0; i < prev - dy; i++) {
          if (removeLastRow(editor) && wasInside) {
            forceCursorBackIntoTable(editor)
          }
        }
      }

      const d = getDims()
      setCursorAt(d.rows - 1, 0)
      prev = dy
    }

    const up = () => {
      lockedTablePosRef.current = null
      document.removeEventListener('mousemove', move)
      document.removeEventListener('mouseup', up)
    }

    document.addEventListener('mousemove', move)
    document.addEventListener('mouseup', up, { once: true })
  }

  const startAddBoth = e => {
    e.preventDefault()
    ensureSelectionInThisTable(editor, tableRef)

    const table = findTable(editor.state)
    if (!table) return

    // 🔒 фиксируем таблицу
    lockedTablePosRef.current = table.pos

    const startX = e.clientX
    const startY = e.clientY
    const { col, row } = getCellSize()
    let px = 0
    let py = 0
    const wasInside = isSelectionInsideTable(editor.state)

    const move = e => {
      // ⛔ НЕ ДАЁМ selection уйти в другую таблицу
      forceSelectionInLockedTable(editor, lockedTablePosRef.current)

      const dx = Math.floor((e.clientX - startX) / col)
      const dy = Math.floor((e.clientY - startY) / row)

      if (dx < px) {
        for (let i = 0; i < px - dx; i++) {
          removeLastColumn(editor)
          moveCursorLeft(editor)
        }
      }

      if (dy < py) {
        for (let i = 0; i < py - dy; i++) {
          if (removeLastRow(editor) && wasInside) {
            forceCursorBackIntoTable(editor)
          }
        }
      }

      if (dx > px) for (let i = 0; i < dx - px; i++) editor.commands.addColumnAfter()
      if (dy > py) for (let i = 0; i < dy - py; i++) editor.commands.addRowAfter()

      moveCursorToEnd()
      px = dx
      py = dy
    }

    const up = () => {
      lockedTablePosRef.current = null
      document.removeEventListener('mousemove', move)
      document.removeEventListener('mouseup', up)
    }

    document.addEventListener('mousemove', move)
    document.addEventListener('mouseup', up, { once: true })
  }

  const showHeaderTools =
    isEditable &&
    Boolean(controls?.headerTools) &&
    (tableHovered || headerControlsHovered || headerColorOpen)

  /* ================= RENDER ================= */

  return (
    <>
      <NodeViewWrapper
        className={`table-wrapper${headerRowEnabled ? ' table-wrapper--header-row' : ''}${headerColumnEnabled ? ' table-wrapper--header-column' : ''}`}
        style={{ '--table-header-bg': headerBgColor }}
      >
        <div
          className="table-container"
          ref={tableRef}
          style={alignMargins}
          onMouseEnter={handleTableMouseEnter}
          onMouseMove={handleTableMouseMove}
          onMouseLeave={handleTableMouseLeave}
        >
          <NodeViewContent />
        </div>
      </NodeViewWrapper>

      {showHeaderTools && (
        <div
          ref={headerToolsRef}
          className="table-header-tools"
          style={controls.headerTools}
          onMouseEnter={handleHeaderToolsMouseEnter}
          onMouseLeave={handleHeaderToolsMouseLeave}
          onMouseDown={event => event.stopPropagation()}
        >
          <button
            type="button"
            className={`table-header-tool-btn${headerRowEnabled ? ' active' : ''}`}
            title="\u0417\u0430\u0433\u043b\u0430\u0432\u043d\u0430\u044f \u0441\u0442\u0440\u043e\u043a\u0430"
            aria-label="\u0417\u0430\u0433\u043b\u0430\u0432\u043d\u0430\u044f \u0441\u0442\u0440\u043e\u043a\u0430"
            onMouseDown={stopEditorPointer}
            onClick={toggleHeaderRow}
          >
            <TableRowsRoundedIcon aria-hidden="true" fontSize="inherit" />
          </button>

          <button
            type="button"
            className={`table-header-tool-btn${headerColumnEnabled ? ' active' : ''}`}
            title="\u0417\u0430\u0433\u043b\u0430\u0432\u043d\u044b\u0439 \u0441\u0442\u043e\u043b\u0431\u0435\u0446"
            aria-label="\u0417\u0430\u0433\u043b\u0430\u0432\u043d\u044b\u0439 \u0441\u0442\u043e\u043b\u0431\u0435\u0446"
            onMouseDown={stopEditorPointer}
            onClick={toggleHeaderColumn}
          >
            <ViewWeekRoundedIcon aria-hidden="true" fontSize="inherit" />
          </button>

          <button
            ref={headerColorToggleRef}
            type="button"
            className={`table-header-tool-btn table-header-tool-btn-chevron${headerColorOpen ? ' active' : ''}`}
            title="\u0426\u0432\u0435\u0442 \u0437\u0430\u043b\u0438\u0432\u043a\u0438"
            aria-label="\u0426\u0432\u0435\u0442 \u0437\u0430\u043b\u0438\u0432\u043a\u0438"
            onMouseDown={stopEditorPointer}
            onClick={openHeaderColorPopup}
          >
            <ChevronRightRoundedIcon aria-hidden="true" fontSize="inherit" />
          </button>
        </div>
      )}

      {isEditable && headerColorOpen && (
        <div
          ref={headerColorModalRef}
          className="table-header-color-modal"
          style={{ top: headerColorPos.y, left: headerColorPos.x }}
          onMouseDown={event => event.stopPropagation()}
          onMouseEnter={handleHeaderToolsMouseEnter}
          onMouseLeave={handleHeaderToolsMouseLeave}
        >
          <div className="table-header-color-modal-title">
            {'\u0426\u0432\u0435\u0442 \u0437\u0430\u043b\u0438\u0432\u043a\u0438'}
          </div>

          <div className="table-header-color-presets">
            {TABLE_HEADER_PRESET_COLORS.map(color => (
              <button
                key={color}
                type="button"
                className={`table-header-color-swatch${headerBgColor === color ? ' active' : ''}`}
                style={{ backgroundColor: color }}
                title={color}
                onMouseDown={stopEditorPointer}
                onClick={() => applyHeaderColor(color)}
              />
            ))}
          </div>

          <div className="table-header-color-input-row">
            <input
              type="color"
              className="table-header-color-picker"
              value={headerBgColor}
              onMouseDown={event => event.stopPropagation()}
              onChange={event => applyHeaderColor(event.target.value)}
              title="\u0412\u044b\u0431\u0440\u0430\u0442\u044c \u0446\u0432\u0435\u0442"
            />
            <input
              type="text"
              className="table-header-color-hex"
              value={headerColorInput}
              maxLength={7}
              placeholder="#RRGGBB"
              onMouseDown={event => event.stopPropagation()}
              onChange={handleHeaderColorInputChange}
              onBlur={commitHeaderColorInput}
              onKeyDown={event => {
                if (event.key !== 'Enter') return
                event.preventDefault()
                commitHeaderColorInput()
              }}
            />
          </div>

          <button
            type="button"
            className="table-header-color-reset"
            onMouseDown={stopEditorPointer}
            onClick={() => applyHeaderColor('#E2E8F0')}
          >
            {'\u041f\u043e \u0443\u043c\u043e\u043b\u0447\u0430\u043d\u0438\u044e'}
          </button>
        </div>
      )}

      {isEditable && controls && (
        <>
          <button
            className="table-plus vertical"
            style={controls.col}
            onMouseDown={startAddCols}
            onClick={() => {
              ensureSelectionInThisTable(editor, tableRef)
              moveCursorToEnd()
              editor.commands.addColumnAfter()
            }}
          >
            +
          </button>

          <button
            className="table-plus horizontal"
            style={controls.row}
            onMouseDown={startAddRows}
            onClick={() => {
              ensureSelectionInThisTable(editor, tableRef)
              moveCursorToEnd()
              editor.commands.addRowAfter()
            }}
          >
            +
          </button>

          <button
            className="table-plus corner"
            style={controls.both}
            onMouseDown={startAddBoth}
            onClick={() => {
              ensureSelectionInThisTable(editor, tableRef)
              moveCursorToEnd()
              editor.commands.addColumnAfter()
              editor.commands.addRowAfter()
            }}
          >
            +
          </button>

          {controls.rowDrag && (
            <button
              type="button"
              className="table-drag-handle table-drag-handle-row"
              style={controls.rowDrag}
              onMouseDown={startRowReorderDrag}
              onMouseLeave={handleDragHandleMouseLeave}
              title="Переместить строку"
            >
              <DragIndicatorRoundedIcon aria-hidden="true" fontSize="inherit" />
            </button>
          )}

          {controls.colDrag && (
            <button
              type="button"
              className="table-drag-handle table-drag-handle-col"
              style={controls.colDrag}
              onMouseDown={startColumnReorderDrag}
              onMouseLeave={handleDragHandleMouseLeave}
              title="Переместить столбец"
            >
              <DragIndicatorRoundedIcon aria-hidden="true" fontSize="inherit" />
            </button>
          )}
        </>
      )}

      {isEditable && dropGuide && (
        <div
          className={`table-drop-guide table-drop-guide-${dropGuide.type}`}
          style={dropGuide.style}
        />
      )}
    </>
  )
}

