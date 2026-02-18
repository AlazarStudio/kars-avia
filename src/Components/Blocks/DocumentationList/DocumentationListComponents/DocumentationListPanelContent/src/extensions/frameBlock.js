// src/extensions/frameBlock.js
import { Node } from '@tiptap/core'
import { ReactNodeViewRenderer } from '@tiptap/react'
import FrameBlockView from './frameBlockView'

export const FrameBlock = Node.create({
  name: 'frameBlock',

  group: 'block',
  content: 'block+',
  defining: true,
  draggable: true,
  selectable: true,

  addAttributes() {
    return {
      emoji: {
        default: '💡',
      },
      bgColor: {
        default: null,
      },
      width: { default: 520 }, // px
      height: { default: null }, // px (null = auto)
      textAlign: { default: null },
    }
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-frame-block]',
        getAttrs: el => {
          const emoji = el.getAttribute('data-emoji') || '💡'
          const bgColor = el.getAttribute('data-bg') || null
          return { emoji, bgColor }
        },
      },
    ]
  },

  renderHTML({ HTMLAttributes, node }) {
    return [
      'div',
      {
        'data-frame-block': '',
        'data-emoji': node.attrs.emoji || '💡',
        'data-bg': node.attrs.bgColor || '',
        ...HTMLAttributes,
      },
      0,
    ]
  },

  addNodeView() {
    return ReactNodeViewRenderer(FrameBlockView)
  },

  addCommands() {
    return {
      insertFrameBlock:
        () =>
        ({ commands }) =>
          commands.insertContent({
            type: this.name,
            attrs: { emoji: '💡', bgColor: null },
            content: [{ type: 'paragraph' }],
          }),
    }
  },
})
