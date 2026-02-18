import { NodeViewWrapper, NodeViewContent } from '@tiptap/react'
import { useEffect, useRef, useState } from 'react'
import './tableWrapperView.css'

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

/* ================= COMPONENT ================= */

export default function TableWrapperView({ editor, node, getPos }) {
  const tableRef = useRef(null)
  const resizeObserverRef = useRef(null)
  const [controls, setControls] = useState(null)
  const textAlign = node?.attrs?.textAlign || 'left'
  const alignMargins =
    textAlign === 'center'
      ? { marginLeft: 'auto', marginRight: 'auto' }
      : textAlign === 'right'
        ? { marginLeft: 'auto', marginRight: 0 }
        : { marginLeft: 0, marginRight: 'auto' }
  
  // 🔒 Это должно быть внутри компонента!
  const lockedTablePosRef = useRef(null)

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

  /* ================= CONTROLS ================= */

  const updateControls = () => {
    if (!tableRef.current) return
    const r = tableRef.current.getBoundingClientRect()
    setControls({
      col: { top: r.top, left: r.right + 6, height: r.height },
      row: { top: r.bottom + 6, left: r.left, width: r.width },
      both: { top: r.bottom + 6, left: r.right + 6 },
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
    if (!editor || !node || typeof getPos !== 'function') return
    if (!isTableWrapperEmpty(node)) return

    const pos = getPos()
    if (typeof pos !== 'number') return

    const { state, view } = editor
    view.dispatch(state.tr.delete(pos, pos + node.nodeSize))
  }, [editor, node, getPos])

  useEffect(() => {
    updateControls()
    window.addEventListener('scroll', updateControls, true)
    window.addEventListener('resize', updateControls)
    resizeObserverRef.current = new ResizeObserver(updateControls)
    resizeObserverRef.current.observe(tableRef.current)

    return () => {
      window.removeEventListener('scroll', updateControls, true)
      window.removeEventListener('resize', updateControls)
      resizeObserverRef.current?.disconnect()
    }
  }, [])

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

  /* ================= RENDER ================= */

  return (
    <>
      <NodeViewWrapper className="table-wrapper">
        <div className="table-container" ref={tableRef} style={alignMargins}>
          <NodeViewContent />
        </div>
      </NodeViewWrapper>

      {controls && (
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
        </>
      )}
    </>
  )
}
