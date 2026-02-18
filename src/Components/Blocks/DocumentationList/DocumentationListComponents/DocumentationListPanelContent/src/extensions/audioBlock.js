import { Node } from '@tiptap/core'
import { ReactNodeViewRenderer } from '@tiptap/react'
import AudioBlockView from './audioBlockView.jsx'

export const AudioBlock = Node.create({
  name: 'audioBlock',

  group: 'block',
  atom: true,
  draggable: true,
  selectable: true,

  addAttributes() {
    return {
      fileId: { default: null },
      src: { default: null },
      volume: { default: 1 },
      loop: { default: false },
      width: { default: 520 }, // px
      height: { default: null }, // px (null = auto)
      textAlign: { default: null },
    }
  },

  parseHTML() {
    return [{ tag: 'audio-block' }]
  },

  renderHTML({ HTMLAttributes }) {
    return ['audio-block', HTMLAttributes]
  },

  addNodeView() {
    return ReactNodeViewRenderer(AudioBlockView)
  },

  addCommands() {
    return {
      insertAudioBlock:
        ({ src }) =>
        ({ commands }) =>
          commands.insertContent({
            type: this.name,
            attrs: { src },
          }),
    }
  },
})
