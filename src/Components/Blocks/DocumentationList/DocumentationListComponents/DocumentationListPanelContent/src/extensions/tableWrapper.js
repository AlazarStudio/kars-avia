import { Node } from '@tiptap/core'
import { ReactNodeViewRenderer } from '@tiptap/react'
import { Plugin } from 'prosemirror-state'
import TableWrapperView from './tableWrapperView'

export const TableWrapper = Node.create({
  name: 'tableWrapper',
  group: 'block',
  content: 'table',
  isolating: true,

  addAttributes() {
    return {
      textAlign: { default: null },
      headerRowEnabled: {
        default: false,
        parseHTML: element => element.getAttribute('data-header-row-enabled') === 'true',
        renderHTML: attributes => (
          attributes.headerRowEnabled ? { 'data-header-row-enabled': 'true' } : {}
        ),
      },
      headerColumnEnabled: {
        default: false,
        parseHTML: element => element.getAttribute('data-header-column-enabled') === 'true',
        renderHTML: attributes => (
          attributes.headerColumnEnabled ? { 'data-header-column-enabled': 'true' } : {}
        ),
      },
      headerBgColor: {
        default: '#E2E8F0',
        parseHTML: element => element.getAttribute('data-header-bg-color') || '#E2E8F0',
        renderHTML: attributes => (
          typeof attributes.headerBgColor === 'string' && attributes.headerBgColor.trim()
            ? { 'data-header-bg-color': attributes.headerBgColor.trim() }
            : {}
        ),
      },
    }
  },

  parseHTML() {
    return [{ tag: 'div[data-table-wrapper]' }]
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', { 'data-table-wrapper': '', ...HTMLAttributes }, 0]
  },

  addNodeView() {
    return ReactNodeViewRenderer(TableWrapperView)
  },

  addProseMirrorPlugins() {
    return [
      new Plugin({
        appendTransaction: (transactions, _oldState, newState) => {
          if (!transactions.some(tr => tr.docChanged)) return null

          const { table, tableWrapper } = newState.schema.nodes
          if (!table || !tableWrapper) return null

          const tablesToWrap = []

          newState.doc.descendants((node, pos) => {
            if (node.type !== table) return true

            const $pos = newState.doc.resolve(pos)
            const parent = $pos.parent
            if (parent.type === tableWrapper) return false

            const index = $pos.index()
            if (!parent.canReplaceWith(index, index + 1, tableWrapper)) return false

            tablesToWrap.push({ node, pos })
            return false
          })

          if (tablesToWrap.length === 0) return null

          let tr = newState.tr
          for (let i = tablesToWrap.length - 1; i >= 0; i--) {
            const { node, pos } = tablesToWrap[i]
            const wrapped = tableWrapper.create(null, node)
            tr = tr.replaceWith(pos, pos + node.nodeSize, wrapped)
          }

          return tr.docChanged ? tr : null
        },
      }),
    ]
  },
})
