import { Extension } from '@tiptap/core'
import { Plugin } from 'prosemirror-state'
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

export const TableCellSelectionOnContent = Extension.create({
  name: 'tableCellSelectionOnContent',

  addProseMirrorPlugins() {
    return [
      new Plugin({
        props: {
          handleClick(view, pos, event) {
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
