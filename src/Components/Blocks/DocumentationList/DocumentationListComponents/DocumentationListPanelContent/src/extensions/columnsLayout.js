import { Node } from '@tiptap/core'

export const ColumnsLayout = Node.create({
  name: 'columnsLayout',

  group: 'block',
  content: 'block+',
  defining: true,
  draggable: true,
  selectable: true,

  parseHTML() {
    return [{ tag: 'div[data-columns-layout]' }]
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', { 'data-columns-layout': '', ...HTMLAttributes }, 0]
  },
})

