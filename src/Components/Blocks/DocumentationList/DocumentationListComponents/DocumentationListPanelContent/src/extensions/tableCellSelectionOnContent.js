import { Extension } from '@tiptap/core'
import { Plugin, TextSelection } from 'prosemirror-state'
import { CellSelection, cellAround } from 'prosemirror-tables'

function isCellVisuallyEmpty(cellNode) {
  if (!cellNode) return true

  const text = cellNode.textContent || ''
  const normalizedText = text.replace(/\s/g, '').replace(/[\u200b\ufeff]/g, '')
  if (normalizedText.length > 0) return false

  let hasNonTextContent = false
  cellNode.descendants(node => {
    if (node.isText || node.isTextblock) return true
    hasNonTextContent = true
    return false
  })

  return !hasNonTextContent
}

function findDomTableCell(dom, root) {
  let cur = dom
  while (cur && cur !== root) {
    if (cur.nodeName === 'TD' || cur.nodeName === 'TH') return cur
    cur = cur.parentNode
  }
  return null
}

function findCellTextBoundarySelection(doc, cellPos, dir) {
  if (typeof cellPos !== 'number') return null
  const cellNode = doc.nodeAt(cellPos)
  if (!cellNode) return null

  const boundaryPos =
    dir > 0
      ? cellPos + 1
      : Math.max(cellPos + 1, cellPos + cellNode.nodeSize - 1)

  try {
    return TextSelection.near(doc.resolve(boundaryPos), dir)
  } catch {
    return null
  }
}

export const TableCellSelectionOnContent = Extension.create({
  name: 'tableCellSelectionOnContent',

  addProseMirrorPlugins() {
    const isEditorEditable = () => this.editor?.isEditable !== false

    return [
      new Plugin({
        appendTransaction: (_transactions, _oldState, newState) => {
          if (isEditorEditable()) return null

          const selection = newState.selection
          if (!(selection instanceof CellSelection)) return null

          const anchorCellPos = selection.$anchorCell?.pos
          const headCellPos = selection.$headCell?.pos
          if (typeof anchorCellPos !== 'number' || typeof headCellPos !== 'number') return null

          try {
            const fromCellPos = Math.min(anchorCellPos, headCellPos)
            const toCellPos = Math.max(anchorCellPos, headCellPos)

            const startSelection = findCellTextBoundarySelection(newState.doc, fromCellPos, 1)
            const endSelection = findCellTextBoundarySelection(newState.doc, toCellPos, -1)
            if (!startSelection || !endSelection) return null

            const from = Math.min(startSelection.from, endSelection.to)
            const to = Math.max(startSelection.from, endSelection.to)
            const textSelection = TextSelection.create(newState.doc, from, to)
            if (
              newState.selection.from === textSelection.from &&
              newState.selection.to === textSelection.to
            ) {
              return null
            }
            return newState.tr.setSelection(textSelection)
          } catch {
            return null
          }
        },
        props: {
          handleClick(view, pos, event) {
            if (!view.editable) return false
            if (event.button != null && event.button !== 0) return false
            if (event.shiftKey || event.ctrlKey || event.metaKey || event.altKey) return false
            if (!(event.target instanceof Node)) return false

            const domCell = findDomTableCell(event.target, view.dom)
            if (!domCell) return false

            let domPos
            try {
              domPos = view.posAtDOM(domCell, 0)
            } catch {
              return false
            }

            const $cell = cellAround(view.state.doc.resolve(domPos))
            if (!$cell) return false

            const cellNode = view.state.doc.nodeAt($cell.pos)
            if (isCellVisuallyEmpty(cellNode)) return false

            const selection = view.state.selection
            if (
              selection instanceof CellSelection &&
              selection.$anchorCell.pos === $cell.pos &&
              selection.$headCell.pos === $cell.pos
            ) {
              // Second click on an already-selected cell should place the cursor for editing.
              return false
            }

            view.dispatch(view.state.tr.setSelection(new CellSelection($cell, $cell)))
            return true
          },
        },
      }),
    ]
  },
})
