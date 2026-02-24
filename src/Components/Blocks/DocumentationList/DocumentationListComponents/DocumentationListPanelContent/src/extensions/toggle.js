// src/extensions/toggle.js
import { mergeAttributes, Node } from '@tiptap/core'
import { ReactNodeViewRenderer } from '@tiptap/react'
import ToggleView from './toggleView'

const DEFAULT_TOGGLE_TITLE = 'Раскрываемый список'

export const Toggle = Node.create({
  name: 'toggle',

  group: 'block',
  content: 'block+',
  defining: true,
  draggable: true,
  selectable: true,

  addAttributes() {
    return {
      // Stored for backward compatibility with existing documents.
      // The visual open/closed state is handled locally in ToggleView and is not persisted.
      collapsed: {
        default: false,
      },
      title: {
        default: DEFAULT_TOGGLE_TITLE,
      },
      width: { default: 520 }, // px
      height: { default: null }, // px (null = auto)
      textAlign: { default: null },
    }
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-type="toggle"]',
        getAttrs: el => ({
          collapsed: false,
          title: el.getAttribute('data-title') || DEFAULT_TOGGLE_TITLE,
        }),
      },
      // Fallback for pasted HTML <details>.
      {
        tag: 'details',
        getAttrs: el => ({
          collapsed: false,
          title: el.querySelector('summary')?.textContent?.trim() || DEFAULT_TOGGLE_TITLE,
        }),
      },
    ]
  },

  renderHTML({ node, HTMLAttributes }) {
    return [
      'div',
      mergeAttributes(HTMLAttributes, {
        'data-type': 'toggle',
        'data-collapsed': 'false',
        'data-title': node.attrs.title || '',
      }),
      0,
    ]
  },

  addNodeView() {
    return ReactNodeViewRenderer(ToggleView)
  },

  addCommands() {
    return {
      insertToggle:
        () =>
        ({ state, dispatch }) => {
          const { schema, selection } = state
          const { from } = selection

          const toggleNode = schema.nodes.toggle.create(
            { collapsed: false, title: DEFAULT_TOGGLE_TITLE },
            [schema.nodes.paragraph.create()]
          )

          const tr = state.tr.insert(from, toggleNode)

          // Place cursor into the first line inside toggle.
          const cursorPos = from + 2
          tr.setSelection(selection.constructor.near(tr.doc.resolve(cursorPos)))

          dispatch(tr)
          return true
        },
    }
  },

  addProseMirrorPlugins() {
    return []
  },
})
