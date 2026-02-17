import { mergeAttributes, Node } from '@tiptap/core'
import { ReactNodeViewRenderer } from '@tiptap/react'
import ImageBlockView from './imageBlockView.jsx'

export const ImageBlock = Node.create({
  name: 'imageBlock',

  group: 'block',
  draggable: true,
  selectable: true,

  addAttributes() {
    return {
      fileId: { default: null },
      src: { default: null },
      caption: { default: '' },
      showCaption: { default: false },
      width: { default: 520 }, // px
      height: { default: null }, // px (null = auto)
      textAlign: { default: null },
    }
  },

  parseHTML() {
    return [{ tag: 'div[data-image-block]' }]
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'div',
      mergeAttributes(HTMLAttributes, {
        'data-image-block': '',
        'data-width': HTMLAttributes.width,
      }),
    ]
  },

  addNodeView() {
    return ReactNodeViewRenderer(ImageBlockView, {
      stopEvent: ({ event }) => {
        const t = event?.target
        if (t instanceof Element && t.closest('input, textarea, select')) return true

        // Allow ProseMirror clipboard handlers so the whole block can be copied/cut.
        if (event?.type === 'copy' || event?.type === 'cut') return false

        return true
      },
    })
  },

  addCommands() {
    return {
      insertImageBlock:
        () =>
        ({ commands }) =>
          commands.insertContent({
            type: this.name,
            attrs: { width: 520 },
          }),
    }
  },
})
