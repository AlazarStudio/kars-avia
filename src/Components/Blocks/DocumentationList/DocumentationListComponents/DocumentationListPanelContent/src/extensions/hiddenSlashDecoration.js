// src/extensions/hiddenSlashDecoration.js
import { Plugin } from 'prosemirror-state'
import { Decoration, DecorationSet } from 'prosemirror-view'
import { SlashSourceKey } from './slashSourceKey'

export const HiddenSlashDecoration = () => {
  return new Plugin({
    props: {
      decorations(state) {
        const slashState = SlashSourceKey.getState(state)
        
        // Прячем "/" только если он был вставлен через "+"
        if (!slashState?.fromPlus) return null

        const decorations = []

        state.doc.descendants((node, pos) => {
          if (!node.isText || !node.text) return

          const text = node.text
          for (let i = 0; i < text.length; i++) {
            if (text[i] === '/') {
              const from = pos + i
              const to = from + 1

              decorations.push(
                Decoration.inline(from, to, {
                  style: `
                    opacity: 0;
                    display: inline-block;
                    width: 0;
                    overflow: hidden;
                    pointer-events: none;
                    user-select: none;
                  `,
                  class: 'hidden-slash'
                })
              )
            }
          }
        })

        return decorations.length
          ? DecorationSet.create(state.doc, decorations)
          : null
      }
    }
  })
}