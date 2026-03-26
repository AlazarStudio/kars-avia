// src/extensions/slashInterceptor.js
import { Extension } from '@tiptap/core'
import { Plugin } from 'prosemirror-state'
import { SlashSourceKey } from './slashSourceKey'

export const SlashInterceptor = Extension.create({
  name: 'slashInterceptor',

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: SlashSourceKey,

        state: {
          init: () => ({ fromPlus: false, anchorRect: null }),
          apply(tr, prev) {
            const meta = tr.getMeta(SlashSourceKey)
            if (meta && typeof meta === 'object') {
              const next = { ...(prev || {}) }

              if (typeof meta.fromPlus === 'boolean') {
                next.fromPlus = meta.fromPlus
              }

              if (Object.prototype.hasOwnProperty.call(meta, 'anchorRect')) {
                next.anchorRect = meta.anchorRect || null
              }

              return next
            }
            return prev
          },
        },

        props: {
          handleTextInput(view, from, to, text) {
            // ❗ если пользователь ПЕЧАТАЕТ "/" — считаем, что НЕ от "+"
            if (text === '/') {
              const slashState = SlashSourceKey.getState(view.state)
              if (slashState?.fromPlus) return false
              view.dispatch(
                view.state.tr.setMeta(SlashSourceKey, { fromPlus: false })
              )
            }
            return false
          },
        },
      }),
    ]
  },
})
