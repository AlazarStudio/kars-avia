// src/extensions/tableSelectionLock.js
import { Plugin, PluginKey } from 'prosemirror-state'

export const TableSelectionLockKey = new PluginKey('tableSelectionLock')

export const TableSelectionLockPlugin = new Plugin({
  key: TableSelectionLockKey,

  state: {
    init: () => ({
      locked: false,
      pos: null,
    }),
    apply(tr, value) {
      const meta = tr.getMeta(TableSelectionLockKey)
      if (meta) return meta
      return value
    },
  },

  filterTransaction(tr, state) {
    const lock = TableSelectionLockKey.getState(state)
    if (!lock?.locked) return true

    // 🔒 запрещаем любые попытки сменить selection
    if (tr.selectionSet && lock.pos != null) {
      tr.setSelection(
        state.selection.constructor.near(
          state.doc.resolve(lock.pos)
        )
      )
    }
    return true
  },
})
