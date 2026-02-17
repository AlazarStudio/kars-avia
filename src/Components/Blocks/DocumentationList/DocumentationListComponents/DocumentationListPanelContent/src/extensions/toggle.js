// src/extensions/toggle.js
import { mergeAttributes, Node } from '@tiptap/core'
import { ReactNodeViewRenderer } from '@tiptap/react'
import { Plugin, PluginKey, NodeSelection } from 'prosemirror-state'
import ToggleView from './toggleView'

const ToggleSelectionLockKey = new PluginKey('toggleSelectionLock')

export const Toggle = Node.create({
  name: 'toggle',

  group: 'block',
  content: 'block+',
  defining: true,
  draggable: true,
  selectable: true,

  addAttributes() {
    return {
      collapsed: {
        default: false,
      },
      title: {
        default: 'Раскрываемый список',
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
        getAttrs: el => {
          const collapsed = el.getAttribute('data-collapsed') === 'true'
          const title = el.getAttribute('data-title') || 'Раскрываемый список'
          return { collapsed, title }
        },
      },
      // fallback, если кто-то вставит <details>
      {
        tag: 'details',
        getAttrs: el => {
          const open = el.hasAttribute('open')
          const title =
            el.querySelector('summary')?.textContent?.trim() || 'Раскрываемый список'
          return { collapsed: !open, title }
        },
      },
    ]
  },

  renderHTML({ node, HTMLAttributes }) {
    return [
      'div',
      mergeAttributes(HTMLAttributes, {
        'data-type': 'toggle',
        'data-collapsed': node.attrs.collapsed ? 'true' : 'false',
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
            { collapsed: false, title: 'Раскрываемый список' },
            [schema.nodes.paragraph.create()]
          )

          const tr = state.tr.insert(from, toggleNode)

          // курсор в первую строку внутри toggle
          const cursorPos = from + 2
          tr.setSelection(selection.constructor.near(tr.doc.resolve(cursorPos)))

          dispatch(tr)
          return true
        },
    }
  },

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: ToggleSelectionLockKey,

        // если toggle свернут — не даём курсору/selection жить внутри него
        appendTransaction: (trs, oldState, newState) => {
          const shouldCheck = trs.some(tr => tr.selectionSet || tr.docChanged)
          if (!shouldCheck) return null

          const sel = newState.selection
          const $from = sel.$from

          for (let d = $from.depth; d > 0; d--) {
            const n = $from.node(d)
            if (n.type.name === 'toggle' && n.attrs.collapsed) {
              const pos = $from.before(d)

              // уже выбрали этот toggle — ничего не делаем
              if (sel instanceof NodeSelection && sel.from === pos) return null

              return newState.tr.setSelection(NodeSelection.create(newState.doc, pos))
            }
          }

          return null
        },

        props: {
          // клик в “закрытом контенте” выбирает сам toggle
          handleClick: (view, pos, event) => {
            const t = event?.target
            if (!(t instanceof Element)) return false

            // только клики внутри тела toggle (не в заголовке)
            if (!t.closest('.toggle-body')) return false

            const hit = view.posAtCoords({ left: event.clientX, top: event.clientY })
            if (!hit) return false

            const $pos = view.state.doc.resolve(hit.pos)

            for (let d = $pos.depth; d > 0; d--) {
              const n = $pos.node(d)
              if (n.type.name === 'toggle' && n.attrs.collapsed) {
                const togglePos = $pos.before(d)
                view.dispatch(
                  view.state.tr.setSelection(
                    NodeSelection.create(view.state.doc, togglePos)
                  )
                )
                return true
              }
            }

            return false
          },
        },
      }),
    ]
  },
})
