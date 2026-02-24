import { Node } from '@tiptap/core'
import { NodeSelection, TextSelection } from '@tiptap/pm/state'
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

  addKeyboardShortcuts() {
    const moveFromSelectedFileBlock = direction => {
      const { state, view } = this.editor
      const { selection } = state

      if (!(selection instanceof NodeSelection)) return false
      if (selection.node?.type?.name !== this.name) return false

      const edgePos = direction < 0 ? selection.from : selection.to
      const nextSelection = TextSelection.near(state.doc.resolve(edgePos), direction)
      view.dispatch(state.tr.setSelection(nextSelection).scrollIntoView())
      return true
    }

    const skipAdjacentFileBlockFromText = direction => {
      const { state, view } = this.editor
      const { selection } = state

      if (!selection.empty) return false

      const { $from } = selection
      if (!$from.parent.isTextblock) return false

      const atBoundary =
        direction < 0
          ? $from.parentOffset === 0
          : $from.parentOffset === $from.parent.content.size
      if (!atBoundary) return false

      const parentDepth = $from.depth
      const containerDepth = parentDepth - 1
      if (containerDepth < 0) return false

      const container = $from.node(containerDepth)
      const indexInContainer = $from.index(containerDepth)
      const targetIndex =
        direction < 0
          ? indexInContainer - 1
          : indexInContainer + 1

      if (targetIndex < 0 || targetIndex >= container.childCount) return false

      const targetNode = container.child(targetIndex)
      if (targetNode.type.name !== this.name) return false

      const currentBlockPos = $from.before(parentDepth)
      const targetPos =
        direction < 0
          ? currentBlockPos - targetNode.nodeSize
          : currentBlockPos + $from.parent.nodeSize

      const destinationPos =
        direction < 0
          ? targetPos
          : targetPos + targetNode.nodeSize

      const nextSelection = TextSelection.near(
        state.doc.resolve(destinationPos),
        direction
      )
      view.dispatch(state.tr.setSelection(nextSelection).scrollIntoView())
      return true
    }

    return {
      ArrowUp: () =>
        moveFromSelectedFileBlock(-1) || skipAdjacentFileBlockFromText(-1),
      ArrowDown: () =>
        moveFromSelectedFileBlock(1) || skipAdjacentFileBlockFromText(1),
    }
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
