import { Extension } from '@tiptap/core'
import { Plugin, PluginKey } from 'prosemirror-state'
import { Decoration, DecorationSet } from 'prosemirror-view'
import { TableMap, cellAround, pointsAtCell } from 'prosemirror-tables'

export const tableRowResizingPluginKey = new PluginKey('tableRowResizing')

class RowResizeState {
  constructor(activeHandle, dragging, tempHeight = null, cornerHandle = null, cornerDragging = null) {
    this.activeHandle = activeHandle
    this.dragging = dragging
    this.tempHeight = tempHeight
    this.cornerHandle = cornerHandle
    this.cornerDragging = cornerDragging
  }

  apply(tr) {
    const action = tr.getMeta(tableRowResizingPluginKey)
    let activeHandle = this.activeHandle
    let dragging = this.dragging
    let tempHeight = this.tempHeight
    let cornerHandle = this.cornerHandle
    let cornerDragging = this.cornerDragging

    if (action) {
      if (action.setHandle != null) {
        activeHandle = action.setHandle
        dragging = false
        tempHeight = null
      }
      if (action.setDragging !== undefined) {
        dragging = action.setDragging
        tempHeight = null
      }
      if (action.setTempHeight !== undefined) {
        tempHeight = action.setTempHeight
      }
      if (action.clearTempHeight !== undefined) {
        tempHeight = null
      }
      if (action.setCornerHandle !== undefined) {
        cornerHandle = action.setCornerHandle
      }
      if (action.setCornerDragging !== undefined) {
        cornerDragging = action.setCornerDragging
      }
    }

    if (tr.docChanged) {
      if (activeHandle > -1) {
        const mapped = tr.mapping.map(activeHandle, -1)
        if (!pointsAtCell(tr.doc.resolve(mapped))) {
          activeHandle = -1
        } else {
          activeHandle = mapped
        }
      }

      if (cornerHandle) {
        const mappedRow = tr.mapping.map(cornerHandle.rowCellPos, -1)
        const mappedCol = tr.mapping.map(cornerHandle.colCellPos, -1)
        if (!pointsAtCell(tr.doc.resolve(mappedRow)) || !pointsAtCell(tr.doc.resolve(mappedCol))) {
          cornerHandle = null
        } else {
          cornerHandle = { ...cornerHandle, rowCellPos: mappedRow, colCellPos: mappedCol }
        }
      }
    }

    if (
      activeHandle === this.activeHandle &&
      dragging === this.dragging &&
      tempHeight === this.tempHeight &&
      cornerHandle === this.cornerHandle &&
      cornerDragging === this.cornerDragging
    ) {
      return this
    }

    return new RowResizeState(activeHandle, dragging, tempHeight, cornerHandle, cornerDragging)
  }
}

function domCellAround(target) {
  let cur = target
  while (cur && cur.nodeName !== 'TD' && cur.nodeName !== 'TH') {
    if (cur.classList && cur.classList.contains('ProseMirror')) return null
    cur = cur.parentNode
  }
  return cur
}

function rowDomAtCellPos(view, cellPos) {
  const cellDom = view.nodeDOM?.(cellPos)
  if (cellDom && (cellDom.nodeName === 'TD' || cellDom.nodeName === 'TH')) {
    return cellDom.parentNode
  }

  const dom = view.domAtPos(cellPos)
  const maybeCell = dom.node?.childNodes?.[dom.offset] ?? dom.node
  const resolvedCellDom = domCellAround(maybeCell)
  return resolvedCellDom?.parentNode ?? null
}

function edgeCell(view, event, side, handleHeight) {
  const offset = side === 'bottom' ? -handleHeight : handleHeight
  const found = view.posAtCoords({
    left: event.clientX,
    top: event.clientY + offset,
  })
  if (!found) return -1

  const $cell = cellAround(view.state.doc.resolve(found.pos))
  if (!$cell) return -1

  if (side === 'bottom') return $cell.pos

  const table = $cell.node(-1)
  const map = TableMap.get(table)
  const start = $cell.start(-1)
  const rect = map.findCell($cell.pos - start)
  if (rect.top === 0) return -1

  const aboveIndex = (rect.top - 1) * map.width + rect.left
  return start + map.map[aboveIndex]
}

function edgeCellHorizontal(view, event, side, handleWidth) {
  const offset = side === 'right' ? -handleWidth : handleWidth
  const found = view.posAtCoords({
    left: event.clientX + offset,
    top: event.clientY,
  })
  if (!found) return -1

  const $cell = cellAround(view.state.doc.resolve(found.pos))
  if (!$cell) return -1

  if (side === 'right') return $cell.pos

  const table = $cell.node(-1)
  const map = TableMap.get(table)
  const start = $cell.start(-1)
  const rect = map.findCell($cell.pos - start)
  if (rect.left === 0) return -1

  const leftIndex = rect.top * map.width + (rect.left - 1)
  return start + map.map[leftIndex]
}

function draggedHeight(dragging, event, minHeight) {
  const offset = event.clientY - dragging.startY
  return Math.max(minHeight, Math.round(dragging.startHeight + offset))
}

function draggedWidth(dragging, event, minWidth) {
  const offset = event.clientX - dragging.startX
  return Math.max(minWidth, Math.round(dragging.startWidth + offset))
}

function updateHandle(view, value) {
  view.dispatch(
    view.state.tr.setMeta(tableRowResizingPluginKey, { setHandle: value })
  )
}

function updateCornerHandle(view, value) {
  view.dispatch(
    view.state.tr.setMeta(tableRowResizingPluginKey, { setCornerHandle: value })
  )
}

function findRowAroundCell($cell) {
  for (let d = $cell.depth; d > 0; d--) {
    if ($cell.node(d).type.spec.tableRole === 'row') {
      return { depth: d, pos: $cell.before(d), node: $cell.node(d) }
    }
  }
  return null
}

function currentRowHeight(view, cellPos) {
  const $cell = view.state.doc.resolve(cellPos)
  const rowInfo = findRowAroundCell($cell)
  const attrHeight = rowInfo?.node?.attrs?.rowHeight
  if (typeof attrHeight === 'number' && attrHeight > 0) return attrHeight

  const rowDom = rowDomAtCellPos(view, cellPos)
  if (rowDom && rowDom.getBoundingClientRect) {
    return rowDom.getBoundingClientRect().height
  }

  return 0
}

function displayRowHeight(view, cellPos, height) {
  const rowDom = rowDomAtCellPos(view, cellPos)
  if (rowDom && rowDom.style) {
    rowDom.style.height = `${height}px`
  }
}

function updateRowHeight(view, cellPos, height) {
  const { state } = view
  const $cell = state.doc.resolve(cellPos)
  const rowInfo = findRowAroundCell($cell)
  if (!rowInfo) return

  const attrs = rowInfo.node.attrs || {}
  const nextAttrs = {
    ...attrs,
    rowHeight: height,
  }

  const tr = state.tr.setNodeMarkup(rowInfo.pos, null, nextAttrs)
  if (tr.docChanged) {
    view.dispatch(tr)
    return true
  }
  return false
}

function currentColWidth(view, cellPos, { colspan, colwidth }) {
  const width = colwidth && colwidth[colwidth.length - 1]
  if (width) return width

  const dom = view.domAtPos(cellPos)
  const cellDom = dom.node?.childNodes?.[dom.offset]
  let domWidth = cellDom?.offsetWidth ?? cellDom?.getBoundingClientRect?.().width ?? 0
  let parts = colspan || 1

  if (colwidth && parts > 1) {
    for (let i = 0; i < parts; i++) {
      if (colwidth[i]) {
        domWidth -= colwidth[i]
        parts--
      }
    }
  }

  return parts > 0 ? domWidth / parts : domWidth
}

function getColumnInfo(view, cellPos) {
  const $cell = view.state.doc.resolve(cellPos)
  const table = $cell.node(-1)
  const map = TableMap.get(table)
  const start = $cell.start(-1)
  const col = map.colCount($cell.pos - start) + $cell.nodeAfter.attrs.colspan - 1
  return { table, map, start, col }
}

function tableDomAtCellPos(view, cellPos) {
  const $cell = view.state.doc.resolve(cellPos)
  let dom = view.domAtPos($cell.start(-1)).node
  while (dom && dom.nodeName !== 'TABLE') dom = dom.parentNode
  return dom
}

function displayColumnWidth(view, cellPos, width) {
  const tableDom = tableDomAtCellPos(view, cellPos)
  if (!tableDom) return

  const colgroup =
    tableDom.querySelector?.('colgroup') ??
    (tableDom.firstChild?.nodeName === 'COLGROUP' ? tableDom.firstChild : null)
  if (!colgroup) return

  const { col } = getColumnInfo(view, cellPos)
  const colDom = colgroup.children?.[col]
  if (!colDom) return
  colDom.style.width = `${width}px`
}

function pushRowHandleDecorations(decorations, state, cellPos, tempHeight) {
  const $cell = state.doc.resolve(cellPos)
  const table = $cell.node(-1)
  if (!table) return

  const map = TableMap.get(table)
  const start = $cell.start(-1)
  const rect = map.findCell($cell.pos - start)
  const row = rect.top

  for (let col = 0; col < map.width; col++) {
    const index = col + row * map.width

    if (col > 0 && map.map[index] === map.map[index - 1]) continue
    if (row < map.height - 1 && map.map[index] === map.map[index + map.width]) continue

    const cellRelPos = map.map[index]
    const cellNode = table.nodeAt(cellRelPos)
    if (!cellNode) continue

    const widgetPos = start + cellRelPos + cellNode.nodeSize - 1
    const dom = document.createElement('div')
    dom.className = 'row-resize-handle'

    if (tempHeight !== null) {
      dom.setAttribute('data-height', `${tempHeight}px`)
    }

    decorations.push(Decoration.widget(widgetPos, dom))

    const pluginState = tableRowResizingPluginKey.getState(state)
    if (pluginState?.dragging) {
      decorations.push(
        Decoration.node(start + cellRelPos, start + cellRelPos + cellNode.nodeSize, {
          class: 'row-resize-dragging',
        })
      )
    }
  }
}

function pushCornerHandleDecorations(decorations, state, cornerHandle, isDragging) {
  if (!cornerHandle) return

  const $rowCell = state.doc.resolve(cornerHandle.rowCellPos)
  const $colCell = state.doc.resolve(cornerHandle.colCellPos)
  const table = $rowCell.node(-1)
  if (!table) return

  const map = TableMap.get(table)
  const start = $rowCell.start(-1)

  // ensure we're in the same table
  if ($colCell.start(-1) !== start) return

  const rowRect = map.findCell($rowCell.pos - start)
  const colRect = map.findCell($colCell.pos - start)
  const row = rowRect.top
  const col = colRect.left

  const cellRelPos = map.positionAt(row, col, table)
  const cellNode = table.nodeAt(cellRelPos)
  if (!cellNode) return

  const widgetPos = start + cellRelPos + cellNode.nodeSize - 1
  const dom = document.createElement('div')
  dom.className = isDragging ? 'corner-resize-handle active' : 'corner-resize-handle'

  const rowLine = document.createElement('div')
  rowLine.className = 'corner-row-line'
  dom.appendChild(rowLine)

  const colLine = document.createElement('div')
  colLine.className = 'corner-col-line'
  dom.appendChild(colLine)

  const dot = document.createElement('div')
  dot.className = 'corner-dot'
  dom.appendChild(dot)

  decorations.push(Decoration.widget(widgetPos, dom, { key: 'corner-resize-handle' }))
}

function pushColumnHandleDecorations(decorations, state, cellPos) {
  const $cell = state.doc.resolve(cellPos)
  const table = $cell.node(-1)
  if (!table) return

  const map = TableMap.get(table)
  const start = $cell.start(-1)
  const col = map.colCount($cell.pos - start) + $cell.nodeAfter.attrs.colspan - 1

  for (let row = 0; row < map.height; row++) {
    const index = row * map.width + col
    // skip duplicates from rowspan/colspan
    if (row > 0 && map.map[index] === map.map[index - map.width]) continue
    if (col > 0 && map.map[index] === map.map[index - 1]) continue

    const cellRelPos = map.map[index]
    const cellNode = table.nodeAt(cellRelPos)
    if (!cellNode) continue

    const widgetPos = start + cellRelPos + cellNode.nodeSize - 1
    const dom = document.createElement('div')
    dom.className = 'column-resize-handle'
    decorations.push(Decoration.widget(widgetPos, dom))
  }
}

function buildDecorations(state) {
  const pluginState = tableRowResizingPluginKey.getState(state)
  if (!pluginState) return null

  const decorations = []

  if (pluginState.activeHandle > -1) {
    pushRowHandleDecorations(decorations, state, pluginState.activeHandle, pluginState.tempHeight)
  }

  if (pluginState.cornerHandle || pluginState.cornerDragging) {
    const corner = pluginState.cornerHandle ?? pluginState.cornerDragging
    if (corner?.rowCellPos != null) {
      pushRowHandleDecorations(decorations, state, corner.rowCellPos, null)
    }
    if (corner?.colCellPos != null) {
      pushColumnHandleDecorations(decorations, state, corner.colCellPos)
    }
    pushCornerHandleDecorations(
      decorations,
      state,
      pluginState.cornerHandle,
      !!pluginState.cornerDragging
    )
  }

  if (decorations.length === 0) return null
  return DecorationSet.create(state.doc, decorations)
}

function handleMouseMove(view, event, handleHeight, handleWidth) {
  if (!view.editable) return
  const pluginState = tableRowResizingPluginKey.getState(view.state)
  if (!pluginState || pluginState.dragging || pluginState.cornerDragging) return false

  const target = domCellAround(event.target)
  let cell = -1
  let corner = null

  if (target) {
    const { top, bottom, left, right } = target.getBoundingClientRect()
    const nearTop = event.clientY - top <= handleHeight
    const nearBottom = bottom - event.clientY <= handleHeight
    const nearLeft = event.clientX - left <= handleWidth
    const nearRight = right - event.clientX <= handleWidth

    if ((nearTop || nearBottom) && (nearLeft || nearRight)) {
      const rowSide = nearTop ? 'top' : 'bottom'
      const colSide = nearLeft ? 'left' : 'right'
      const rowCellPos = edgeCell(view, event, rowSide, handleHeight)
      const colCellPos = edgeCellHorizontal(view, event, colSide, handleWidth)
      if (rowCellPos > -1 && colCellPos > -1) {
        corner = { rowCellPos, colCellPos }
      }
    } else if (nearTop) {
      cell = edgeCell(view, event, 'top', handleHeight)
    } else if (nearBottom) {
      cell = edgeCell(view, event, 'bottom', handleHeight)
    }
  }

  if (corner) {
    const prev = pluginState.cornerHandle
    const changed =
      !prev || prev.rowCellPos !== corner.rowCellPos || prev.colCellPos !== corner.colCellPos
    if (changed || pluginState.activeHandle !== -1) {
      view.dispatch(
        view.state.tr.setMeta(tableRowResizingPluginKey, {
          setCornerHandle: corner,
          setHandle: -1,
        })
      )
    }
    return true
  }

  if (pluginState.cornerHandle) {
    updateCornerHandle(view, null)
  }

  if (cell !== pluginState.activeHandle) {
    updateHandle(view, cell)
  }

  return cell > -1
}

function handleMouseLeave(view) {
  if (!view.editable) return
  const pluginState = tableRowResizingPluginKey.getState(view.state)
  if (!pluginState || pluginState.dragging || pluginState.cornerDragging) return

  if (pluginState.cornerHandle) {
    updateCornerHandle(view, null)
  }
  if (pluginState.activeHandle > -1) {
    updateHandle(view, -1)
  }
}

function handleMouseDown(view, event, rowMinHeight, cellMinWidth) {
  if (!view.editable) return false

  const pluginState = tableRowResizingPluginKey.getState(view.state)
  if (!pluginState || pluginState.dragging || pluginState.cornerDragging) return false

  const win = view.dom?.ownerDocument?.defaultView ?? window

  if (pluginState.cornerHandle) {
    const { rowCellPos, colCellPos } = pluginState.cornerHandle
    const rowDom = rowDomAtCellPos(view, rowCellPos)
    const prevRowWillChange = rowDom?.style?.willChange
    if (rowDom?.style) rowDom.style.willChange = 'height'

    const tableDom = tableDomAtCellPos(view, colCellPos)
    const prevTableWillChange = tableDom?.style?.willChange
    if (tableDom?.style) tableDom.style.willChange = 'width'

    const colNode = view.state.doc.nodeAt(colCellPos)
    if (!colNode) return false

    const dragging = {
      startX: event.clientX,
      startY: event.clientY,
      startHeight: currentRowHeight(view, rowCellPos),
      startWidth: currentColWidth(view, colCellPos, colNode.attrs),
      rowCellPos,
      colCellPos,
    }

    view.dispatch(
      view.state.tr.setMeta(tableRowResizingPluginKey, {
        setCornerDragging: dragging,
      })
    )

    let rafId = null
    let pendingHeight = dragging.startHeight
    let pendingWidth = dragging.startWidth
    let lastAppliedHeight = pendingHeight
    let lastAppliedWidth = pendingWidth

    function applySizesToDoc(height, width) {
      const heightDiff = Math.abs(height - lastAppliedHeight)
      const widthDiff = Math.abs(width - lastAppliedWidth)
      if (heightDiff < 2 && widthDiff < 2) return

      let tr = view.state.tr
      if (heightDiff >= 2) {
        const $cell = view.state.doc.resolve(rowCellPos)
        const rowInfo = findRowAroundCell($cell)
        if (rowInfo) {
          const attrs = rowInfo.node.attrs || {}
          tr = tr.setNodeMarkup(rowInfo.pos, null, { ...attrs, rowHeight: height })
        }
      }

      if (widthDiff >= 2) {
        const { state } = view
        const $cell = state.doc.resolve(colCellPos)
        const table = $cell.node(-1)
        if (table) {
          const map = TableMap.get(table)
          const start = $cell.start(-1)
          const col = map.colCount($cell.pos - start) + $cell.nodeAfter.attrs.colspan - 1

          for (let row = 0; row < map.height; row++) {
            const mapIndex = row * map.width + col
            if (row && map.map[mapIndex] === map.map[mapIndex - map.width]) continue
            const pos = map.map[mapIndex]
            const cellNode = table.nodeAt(pos)
            if (!cellNode) continue

            const attrs = cellNode.attrs
            const index = attrs.colspan === 1 ? 0 : col - map.colCount(pos)
            const colwidth = attrs.colwidth ? attrs.colwidth.slice() : Array(attrs.colspan).fill(0)
            colwidth[index] = width

            tr = tr.setNodeMarkup(start + pos, null, {
              ...attrs,
              colwidth,
            })
          }
        }
      }

      if (tr.docChanged) {
        view.dispatch(tr)
        lastAppliedHeight = height
        lastAppliedWidth = width
      }
    }

    function flush() {
      rafId = null
      displayRowHeight(view, rowCellPos, pendingHeight)
      displayColumnWidth(view, colCellPos, pendingWidth)
      applySizesToDoc(pendingHeight, pendingWidth)
    }

    function schedule(height, width) {
      pendingHeight = height
      pendingWidth = width
      if (rafId != null) return
      rafId = win.requestAnimationFrame?.(flush) ?? null
      if (rafId == null) flush()
    }

    function finish(e) {
      win.removeEventListener('mouseup', finish)
      win.removeEventListener('mousemove', move)
      if (rafId != null) {
        win.cancelAnimationFrame?.(rafId)
        rafId = null
      }

      const finalHeight = draggedHeight(dragging, e, rowMinHeight)
      const finalWidth = draggedWidth(dragging, e, cellMinWidth)
      schedule(finalHeight, finalWidth)
      applySizesToDoc(finalHeight, finalWidth)

      view.dispatch(
        view.state.tr.setMeta(tableRowResizingPluginKey, {
          setCornerDragging: null,
          setCornerHandle: null,
        })
      )

      if (rowDom?.style) rowDom.style.willChange = prevRowWillChange ?? ''
      if (tableDom?.style) tableDom.style.willChange = prevTableWillChange ?? ''
    }

    function move(e) {
      const buttons = typeof e.buttons === 'number' ? e.buttons : null
      if (buttons != null ? (buttons & 1) === 0 : !e.which) return finish(e)

      if (!tableRowResizingPluginKey.getState(view.state)?.cornerDragging) return

      schedule(
        draggedHeight(dragging, e, rowMinHeight),
        draggedWidth(dragging, e, cellMinWidth)
      )
    }

    schedule(dragging.startHeight, dragging.startWidth)
    win.addEventListener('mouseup', finish)
    win.addEventListener('mousemove', move)
    event.preventDefault()
    return true
  }

  if (pluginState.activeHandle === -1) return false

  const activeHandle = pluginState.activeHandle
  const rowDom = rowDomAtCellPos(view, activeHandle)
  
  // Сохраняем исходные стили для восстановления
  const prevWillChange = rowDom?.style?.willChange
  
  if (rowDom?.style) {
    rowDom.style.willChange = 'height'
    rowDom.style.transition = 'none'
  }

  const startHeight = currentRowHeight(view, activeHandle)
  const dragging = {
    startY: event.clientY,
    startHeight,
  }
  
  view.dispatch(
    view.state.tr.setMeta(tableRowResizingPluginKey, {
      setDragging: dragging,
    })
  )

  let lastAppliedHeight = startHeight

  function updateHeightInRealTime(height) {
    // Обновляем DOM в реальном времени
    displayRowHeight(view, activeHandle, height)
    
    // Обновляем состояние плагина для отображения текущей высоты
    view.dispatch(
      view.state.tr.setMeta(tableRowResizingPluginKey, {
        setTempHeight: height,
      })
    )
    
    // Сохраняем в состояние документа только если изменилось на значительную величину
    const heightDiff = Math.abs(height - lastAppliedHeight)
    if (heightDiff >= 2) { // Обновляем каждые 2px для производительности
      if (updateRowHeight(view, activeHandle, height)) {
        lastAppliedHeight = height
      }
    }
  }

  function finish(e) {
    win.removeEventListener('mouseup', finish)
    win.removeEventListener('mousemove', move)
    
    const pluginStateNow = tableRowResizingPluginKey.getState(view.state)
    if (pluginStateNow?.dragging) {
      // Финализируем высоту при отпускании
      const finalHeight = draggedHeight(dragging, e, rowMinHeight)
      
      // Обновляем DOM до финальной высоты
      displayRowHeight(view, activeHandle, finalHeight)
      
      // Сохраняем финальную высоту в атрибуты
      updateRowHeight(view, pluginStateNow.activeHandle, finalHeight)
      
      // Очищаем состояние перетаскивания
      view.dispatch(
        view.state.tr.setMeta(tableRowResizingPluginKey, { 
          setDragging: null,
          clearTempHeight: true
        })
      )
    }
    
    // Восстанавливаем стили
    if (rowDom?.style) {
      rowDom.style.willChange = prevWillChange ?? ''
      rowDom.style.transition = ''
      
      // После завершения можно оставить установленную высоту,
      // так как она уже сохранена в атрибутах
    }
    
    // Принудительно обновляем состояние для перерисовки декораций
    view.dispatch(view.state.tr)
  }

  function move(e) {
    const buttons = typeof e.buttons === 'number' ? e.buttons : null
    if (buttons != null ? (buttons & 1) === 0 : !e.which) return finish(e)

    if (!tableRowResizingPluginKey.getState(view.state)?.dragging) return

    const newHeight = draggedHeight(dragging, e, rowMinHeight)
    updateHeightInRealTime(newHeight)
  }

  // Начинаем с текущей высоты
  updateHeightInRealTime(startHeight)
  
  win.addEventListener('mouseup', finish)
  win.addEventListener('mousemove', move)
  
  event.preventDefault()
  return true
}

export const TableRowResizing = Extension.create({
  name: 'tableRowResizing',
  priority: 1001,

  addOptions() {
    return {
      handleHeight: 5,
      handleWidth: 5,
      cellMinWidth: 25,
      rowMinHeight: 24,
    }
  },

  addProseMirrorPlugins() {
    const handleHeight = this.options.handleHeight
    const handleWidth = this.options.handleWidth
    const rowMinHeight = this.options.rowMinHeight
    const cellMinWidth = this.options.cellMinWidth

    return [
      new Plugin({
        key: tableRowResizingPluginKey,
        state: {
          init() {
            return new RowResizeState(-1, false, null)
          },
          apply(tr, prev) {
            return prev.apply(tr)
          },
        },
        props: {
          attributes: state => {
            const pluginState = tableRowResizingPluginKey.getState(state)
            if (pluginState?.cornerHandle || pluginState?.cornerDragging) {
              return { class: 'corner-resize-cursor' }
            }
            return pluginState && pluginState.activeHandle > -1
              ? { class: 'row-resize-cursor' }
              : {}
          },
          handleDOMEvents: {
            mousemove: (view, event) => {
              return handleMouseMove(view, event, handleHeight, handleWidth)
            },
            mouseleave: view => {
              handleMouseLeave(view)
            },
            mousedown: (view, event) => {
              return handleMouseDown(view, event, rowMinHeight, cellMinWidth)
            },
          },
          decorations: state => {
            return buildDecorations(state)
          },
        },
      }),
    ]
  },
})
