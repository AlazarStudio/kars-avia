import { TableRow } from '@tiptap/extension-table-row'

export const TableRowHeight = TableRow.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      rowHeight: {
        default: null,
        parseHTML: element => {
          const height = element.style?.height
          if (!height) return null
          const parsed = parseInt(height, 10)
          return Number.isNaN(parsed) ? null : parsed
        },
        renderHTML: attributes => {
          if (!attributes.rowHeight) return {}
          return {
            style: `height: ${attributes.rowHeight}px;`,
          }
        },
      },
    }
  },
})

