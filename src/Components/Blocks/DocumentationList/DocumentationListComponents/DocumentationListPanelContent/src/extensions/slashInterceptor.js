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
          init: () => ({ fromPlus: false }),
          apply(tr, prev) {
            const meta = tr.getMeta(SlashSourceKey)
            if (meta && typeof meta.fromPlus === 'boolean') {
              return { fromPlus: meta.fromPlus }
            }
            return prev
          },
        },

        props: {
          handleTextInput(view, from, to, text) {
            // ❗ если пользователь ПЕЧАТАЕТ "/" — считаем, что НЕ от "+"
            if (text === '/') {
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
