// src/extensions/blockLassoSelection.js
import { Extension } from '@tiptap/core'
import { Plugin, PluginKey } from 'prosemirror-state'
import { Decoration, DecorationSet } from 'prosemirror-view'

export const BlockLassoSelectionKey = new PluginKey('blockLassoSelection')

function normalizePositions(input) {
  if (!Array.isArray(input)) return []
  const out = []
  const seen = new Set()
  for (const p of input) {
    if (typeof p !== 'number' || !Number.isFinite(p)) continue
    const pos = Math.max(0, Math.floor(p))
    if (seen.has(pos)) continue
    seen.add(pos)
    out.push(pos)
  }
  out.sort((a, b) => a - b)
  return out
}

const BlockLassoSelectionPMPlugin = new Plugin({
  key: BlockLassoSelectionKey,

  state: {
    init: () => ({ positions: [] }),
    apply(tr, value) {
      const meta = tr.getMeta(BlockLassoSelectionKey)
      if (meta) {
        if (meta === 'clear' || meta?.type === 'clear' || meta?.clear) {
          return { positions: [] }
        }
        if (Array.isArray(meta)) {
          return { positions: normalizePositions(meta) }
        }
        if (Array.isArray(meta?.positions)) {
          return { positions: normalizePositions(meta.positions) }
        }
      }

      if (!tr.docChanged || !value?.positions?.length) return value

      // Поддерживаем позиции при docChanged (на случай вставок/удалений вне выделения)
      const next = []
      const seen = new Set()
      for (const pos of value.positions) {
        const mapped = tr.mapping.map(pos, 1)
        if (seen.has(mapped)) continue
        seen.add(mapped)
        next.push(mapped)
      }
      next.sort((a, b) => a - b)
      return { positions: next }
    },
  },

  props: {
    decorations(state) {
      const pluginState = BlockLassoSelectionKey.getState(state)
      const positions = pluginState?.positions
      if (!positions?.length) return null

      const decorations = []
      const doc = state.doc

      for (const pos of positions) {
        const node = doc.nodeAt(pos)
        if (!node) continue
        decorations.push(
          Decoration.node(pos, pos + node.nodeSize, {
            class: 'block-lasso-selected',
          })
        )
      }

      return decorations.length ? DecorationSet.create(doc, decorations) : null
    },
  },
})

export const BlockLassoSelectionPlugin = Extension.create({
  name: 'blockLassoSelection',

  addProseMirrorPlugins() {
    return [BlockLassoSelectionPMPlugin]
  },
})
