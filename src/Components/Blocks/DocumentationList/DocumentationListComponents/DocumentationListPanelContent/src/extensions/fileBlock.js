import { Node } from '@tiptap/core'
import { ReactNodeViewRenderer } from '@tiptap/react'
import FileBlockView from './fileBlockView'

export const FileBlock = Node.create({
  name: 'fileBlock',

  group: 'block',
  draggable: true,
  selectable: true,

  addAttributes() {
    return {
      fileId: { default: null },
      url: { default: null },
      name: { default: 'Файл' },
      size: { default: '' },
      type: { default: 'file' },
      mimeType: { default: '' },
      width: { default: 520 }, // px
      height: { default: null }, // px (null = auto)
      textAlign: { default: null },
      note: { default: '' },
    }
  },

  parseHTML() {
    return [{ tag: 'div[data-file-block]' }]
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'div',
      { 'data-file-block': '', ...HTMLAttributes },
      ['a', { href: HTMLAttributes.url, target: '_blank' }, HTMLAttributes.name],
    ]
  },

  addNodeView() {
    return ReactNodeViewRenderer(FileBlockView, {
      stopEvent: ({ event }) => {
        const t = event?.target
        if (t instanceof Element && t.closest('input, textarea, select, button')) {
          return true
        }
        return false
      },
    })
  },

  addCommands() {
    return {
      insertFileBlock:
        ({ url, name }) =>
        ({ commands }) =>
          commands.insertContent({
            type: this.name,
            attrs: {
              url,
              name: name || 'Файл',
            },
          }),
    }
  },
})
