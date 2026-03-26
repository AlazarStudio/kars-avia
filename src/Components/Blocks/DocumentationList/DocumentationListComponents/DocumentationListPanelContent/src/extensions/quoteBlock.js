import Blockquote from '@tiptap/extension-blockquote'
import { ReactNodeViewRenderer } from '@tiptap/react'
import QuoteBlockView from './quoteBlockView'

export const QuoteBlock = Blockquote.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      width: {
        default: null,
        parseHTML: element => {
          const dataWidth = element.getAttribute('data-width')
          if (dataWidth != null && dataWidth !== '') {
            const parsed = Number.parseInt(dataWidth, 10)
            if (Number.isFinite(parsed) && parsed > 0) return parsed
          }
          const inlineWidth = element.style?.width
          if (inlineWidth) {
            const parsedInline = Number.parseInt(String(inlineWidth).replace('px', ''), 10)
            if (Number.isFinite(parsedInline) && parsedInline > 0) return parsedInline
          }
          return null
        },
        renderHTML: attributes => {
          if (typeof attributes.width !== 'number' || !Number.isFinite(attributes.width)) return {}
          return { 'data-width': String(Math.round(attributes.width)) }
        },
      },
      textAlign: {
        default: null,
        parseHTML: element => element.getAttribute('data-text-align') || null,
        renderHTML: attributes => {
          if (!attributes.textAlign) return {}
          return { 'data-text-align': attributes.textAlign }
        },
      },
      bgColor: {
        default: null,
        parseHTML: element => element.getAttribute('data-bg') || null,
        renderHTML: attributes => {
          if (!attributes.bgColor) return {}
          return { 'data-bg': attributes.bgColor }
        },
      },
    }
  },

  renderHTML({ HTMLAttributes }) {
    return ['blockquote', HTMLAttributes, 0]
  },

  addNodeView() {
    return ReactNodeViewRenderer(QuoteBlockView)
  },
})
