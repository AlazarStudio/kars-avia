import { Extension } from '@tiptap/core'
import { Plugin, PluginKey, TextSelection } from 'prosemirror-state'

const TableCellCursorPadKey = new PluginKey('tableCellCursorPad')
const PAD_CHAR = '\u200b'

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

function findCellFromSelection($from) {
  for (let d = $from.depth; d > 0; d--) {
    const node = $from.node(d)
    if (node.type.name === 'tableCell' || node.type.name === 'tableHeader') {
      return { pos: $from.before(d), node }
    }
  }
  return null
}

function findFirstTextblockStartPos(doc, cellPos) {
  const cell = doc.nodeAt(cellPos)
  if (!cell) return null

  let textStartPos = null
  cell.descendants((node, pos) => {
    if (node.isTextblock) {
      textStartPos = cellPos + pos + 2
      return false
    }
    return true
  })

  return textStartPos
}

function getFirstChar(doc, pos) {
  return doc.textBetween(pos, pos + 1, '\n', '\n')
}

function getChar(doc, pos) {
  return doc.textBetween(pos, pos + 1, '\n', '\n')
}

export const TableCellCursorPad = Extension.create({
  name: 'tableCellCursorPad',

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: TableCellCursorPadKey,

        appendTransaction(transactions, oldState, newState) {
          const docChanged = transactions.some(tr => tr.docChanged)
          const selectionChanged = transactions.some(tr => tr.selectionSet)
          if (!docChanged && !selectionChanged) return null

          let tr = newState.tr
          let changed = false

          const inserts = []
          newState.doc.descendants((node, pos) => {
            if (node.type.name !== 'tableCell' && node.type.name !== 'tableHeader') {
              return true
            }
            const textStart = findFirstTextblockStartPos(newState.doc, pos)
            if (textStart == null) return false

            const firstChar = getFirstChar(newState.doc, textStart)

            if (isCellVisuallyEmpty(node)) {
              if (firstChar !== PAD_CHAR && firstChar !== ' ') {
                inserts.push({ pos: textStart, type: 'insert' })
              } else if (firstChar === ' ') {
                inserts.push({ pos: textStart, type: 'replace_space' })
              }
              return false
            }

            // cleanup legacy pad in non-empty cells so it doesn't affect wrapping/layout
            if (firstChar === PAD_CHAR || firstChar === ' ') {
              const secondChar = getChar(newState.doc, textStart + 1)
              if (secondChar) {
                inserts.push({ pos: textStart, type: 'delete' })
              }
            }
            return false
          })

          if (inserts.length > 0) {
            for (let i = inserts.length - 1; i >= 0; i--) {
              const action = inserts[i]
              if (action.type === 'insert') {
                tr = tr.insertText(PAD_CHAR, action.pos)
              } else if (action.type === 'replace_space') {
                tr = tr.delete(action.pos, action.pos + 1).insertText(PAD_CHAR, action.pos)
              } else if (action.type === 'delete') {
                tr = tr.delete(action.pos, action.pos + 1)
              }
            }
            changed = true
          }

          if (selectionChanged && !docChanged && newState.selection instanceof TextSelection) {
            let selectionPos = newState.selection.from
            if (tr.steps.length > 0) {
              selectionPos = tr.mapping.map(selectionPos, 1)
            }

            const docForSelection = tr.steps.length > 0 ? tr.doc : newState.doc
            const $from = docForSelection.resolve(selectionPos)
            const cell = findCellFromSelection($from)

            if (cell) {
              if (!isCellVisuallyEmpty(cell.node)) return changed ? tr : null
              const textStart = findFirstTextblockStartPos(docForSelection, cell.pos)
              if (textStart != null) {
                const desiredPos = textStart + 1
                if (selectionPos !== desiredPos) {
                  let shouldClamp = true

                  if (selectionPos === textStart) {
                    const oldSel = oldState.selection
                    if (oldSel instanceof TextSelection) {
                      const oldCell = findCellFromSelection(oldState.doc.resolve(oldSel.from))
                      const oldTextStart = oldCell
                        ? findFirstTextblockStartPos(oldState.doc, oldCell.pos)
                        : null
                      const oldDesiredPos = oldTextStart != null ? oldTextStart + 1 : null

                      const sameCell = oldCell && oldCell.pos === cell.pos
                      const wasAfterPad = oldDesiredPos != null && oldSel.from >= oldDesiredPos

                      // allow left-arrow to reach the pad position so user can move to previous cell
                      if (sameCell && wasAfterPad) {
                        shouldClamp = false
                      }
                    }
                  }

                  if (shouldClamp) {
                    tr = tr.setSelection(TextSelection.create(docForSelection, desiredPos))
                    changed = true
                  }
                }
              }
            }
          }

          return changed ? tr : null
        },
      }),
    ]
  },
})
