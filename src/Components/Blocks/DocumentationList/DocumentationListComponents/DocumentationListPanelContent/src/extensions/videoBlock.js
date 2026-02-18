// src/extensions/videoBlock.js
import { mergeAttributes, Node } from '@tiptap/core'
import { ReactNodeViewRenderer } from '@tiptap/react'
import VideoBlockView from './videoBlockView'

const parseMaybeInt = (value, fallback) => {
  const n = Number.parseInt(value ?? '', 10)
  return Number.isFinite(n) ? n : fallback
}

const parseMaybeString = value => {
  if (value == null) return null
  const s = String(value).trim()
  if (!s || s === 'null' || s === 'undefined') return null
  return s
}

const DEFAULT_VIDEO_WIDTH = 520
const DEFAULT_VIDEO_HEIGHT = 293

export const VideoBlock = Node.create({
  name: 'videoBlock',

  group: 'block',
  draggable: true,
  selectable: true,

  addAttributes() {
    return {
      fileId: { default: null },
      src: { default: null },
      width: { default: DEFAULT_VIDEO_WIDTH },
      height: { default: DEFAULT_VIDEO_HEIGHT },
      caption: { default: '' },
      textAlign: { default: null },
    }
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-video-block]',
        getAttrs: el => {
          const fileId = parseMaybeString(el.getAttribute('data-file-id') ?? el.getAttribute('fileId'))
          const src = parseMaybeString(el.getAttribute('data-src') ?? el.getAttribute('src'))
          const caption = el.getAttribute('data-caption') ?? el.getAttribute('caption') ?? ''
          const textAlign = parseMaybeString(
            el.getAttribute('data-text-align') ?? el.getAttribute('textAlign')
          )

          const width = parseMaybeInt(
            el.getAttribute('data-width') ?? el.getAttribute('width'),
            DEFAULT_VIDEO_WIDTH
          )
          const height = parseMaybeInt(
            el.getAttribute('data-height') ?? el.getAttribute('height'),
            DEFAULT_VIDEO_HEIGHT
          )

          return {
            fileId,
            src,
            caption,
            textAlign,
            width,
            height,
          }
        },
      },
    ]
  },

  renderHTML({ node, HTMLAttributes }) {
    const width =
      Number.isFinite(Number(node.attrs.width)) ? Number(node.attrs.width) : DEFAULT_VIDEO_WIDTH
    const height =
      Number.isFinite(Number(node.attrs.height))
        ? Number(node.attrs.height)
        : DEFAULT_VIDEO_HEIGHT
    const fileId = parseMaybeString(node.attrs.fileId)
    const src = parseMaybeString(node.attrs.src)
    const caption = node.attrs.caption || ''
    const textAlign = parseMaybeString(node.attrs.textAlign)

    const { fileId: _fileId, src: _src, width: _width, height: _height, caption: _caption, textAlign: _textAlign, ...rest } =
      HTMLAttributes

    return [
      'div',
      mergeAttributes(rest, {
        'data-video-block': '',
        ...(fileId ? { 'data-file-id': fileId } : {}),
        ...(src ? { 'data-src': src } : {}),
        ...(caption ? { 'data-caption': caption } : {}),
        ...(textAlign ? { 'data-text-align': textAlign } : {}),
        'data-width': String(width),
        'data-height': String(height),
        style: `width: ${width}px; height: ${height}px;`,
      }),
    ]
  },

  addNodeView() {
    return ReactNodeViewRenderer(VideoBlockView, {
      stopEvent: ({ event }) => {
        const t = event?.target
        if (t instanceof Element && t.closest('input, textarea, select')) return true

        // Allow ProseMirror clipboard handlers so the whole block can be copied/cut.
        if (event?.type === 'copy' || event?.type === 'cut') return false

        return true
      },
    })
  },

  addCommands() {
    return {
      insertVideoBlock:
        () =>
        ({ commands }) =>
          commands.insertContent({
            type: this.name,
            attrs: { width: DEFAULT_VIDEO_WIDTH, height: DEFAULT_VIDEO_HEIGHT },
          }),
    }
  },
})
