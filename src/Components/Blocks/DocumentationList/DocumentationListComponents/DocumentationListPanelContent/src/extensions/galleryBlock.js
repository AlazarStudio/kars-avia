import { mergeAttributes, Node } from '@tiptap/core'
import { ReactNodeViewRenderer } from '@tiptap/react'
import GalleryBlockView from './galleryBlockView'

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

const DEFAULT_GALLERY_WIDTH = 520
const DEFAULT_GALLERY_LAYOUT = 'grid'
const DEFAULT_GALLERY_COLUMNS = 3
const DEFAULT_GALLERY_GAP = 12
const DEFAULT_GALLERY_FIT = 'contain'
const GALLERY_LAYOUTS = new Set(['grid', 'masonry', 'strip'])
const GALLERY_FITS = new Set(['contain'])

const normalizeGalleryLayout = value =>
  GALLERY_LAYOUTS.has(value) ? value : DEFAULT_GALLERY_LAYOUT

const normalizeGalleryColumns = value =>
  Math.min(4, Math.max(1, parseMaybeInt(value, DEFAULT_GALLERY_COLUMNS)))

const normalizeGalleryGap = value =>
  Math.min(32, Math.max(4, parseMaybeInt(value, DEFAULT_GALLERY_GAP)))

const normalizeGalleryFit = value =>
  GALLERY_FITS.has(value) ? value : DEFAULT_GALLERY_FIT

const decodeImages = value => {
  if (value == null) return []
  const raw = String(value)
  if (!raw) return []

  try {
    const decoded = decodeURIComponent(raw)
    const parsed = JSON.parse(decoded)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    try {
      const parsed = JSON.parse(raw)
      return Array.isArray(parsed) ? parsed : []
    } catch {
      return []
    }
  }
}

const encodeImages = images => {
  try {
    return encodeURIComponent(JSON.stringify(images))
  } catch {
    return ''
  }
}

export const GalleryBlock = Node.create({
  name: 'galleryBlock',

  group: 'block',
  draggable: true,
  selectable: true,

  addAttributes() {
    return {
      images: {
        default: [],
      },
      width: { default: DEFAULT_GALLERY_WIDTH }, // px
      height: { default: null }, // px (null = auto)
      textAlign: { default: null },
      layout: { default: DEFAULT_GALLERY_LAYOUT },
      columns: { default: DEFAULT_GALLERY_COLUMNS },
      gap: { default: DEFAULT_GALLERY_GAP },
      fit: { default: DEFAULT_GALLERY_FIT },
    }
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-gallery-block]',
        getAttrs: el => {
          const images = decodeImages(el.getAttribute('data-images') ?? el.getAttribute('images'))

          const width = parseMaybeInt(
            el.getAttribute('data-width') ?? el.getAttribute('width'),
            DEFAULT_GALLERY_WIDTH
          )

          const heightRaw = el.getAttribute('data-height') ?? el.getAttribute('height')
          const heightParsed = Number.parseInt(heightRaw ?? '', 10)
          const height = Number.isFinite(heightParsed) ? heightParsed : null

          const textAlign = parseMaybeString(
            el.getAttribute('data-text-align') ?? el.getAttribute('textAlign')
          )

          const layout = normalizeGalleryLayout(
            parseMaybeString(el.getAttribute('data-layout') ?? el.getAttribute('layout'))
          )
          const columns = normalizeGalleryColumns(
            el.getAttribute('data-columns') ?? el.getAttribute('columns')
          )
          const gap = normalizeGalleryGap(
            el.getAttribute('data-gap') ?? el.getAttribute('gap')
          )
          const fit = normalizeGalleryFit(
            parseMaybeString(el.getAttribute('data-fit') ?? el.getAttribute('fit'))
          )

          return { images, width, height, textAlign, layout, columns, gap, fit }
        },
      },
    ]
  },

  renderHTML({ node, HTMLAttributes }) {
    const images = Array.isArray(node.attrs.images) ? node.attrs.images : []
    const widthValue = Number.isFinite(Number(node.attrs.width))
      ? Number(node.attrs.width)
      : null

    const heightValue = node.attrs.height
    const height = Number.isFinite(Number(heightValue)) ? Number(heightValue) : null

    const textAlign = parseMaybeString(node.attrs.textAlign)
    const layout = normalizeGalleryLayout(node.attrs.layout)
    const columns = normalizeGalleryColumns(node.attrs.columns)
    const gap = normalizeGalleryGap(node.attrs.gap)
    const fit = normalizeGalleryFit(node.attrs.fit)

    const {
      images: _images,
      width: _width,
      height: _height,
      textAlign: _textAlign,
      layout: _layout,
      columns: _columns,
      gap: _gap,
      fit: _fit,
      ...rest
    } = HTMLAttributes

    const encodedImages = encodeImages(images)

    return [
      'div',
      mergeAttributes(rest, {
        'data-gallery-block': '',
        ...(encodedImages ? { 'data-images': encodedImages } : {}),
        ...(widthValue != null ? { 'data-width': String(widthValue) } : {}),
        ...(height != null ? { 'data-height': String(height) } : {}),
        ...(textAlign ? { 'data-text-align': textAlign } : {}),
        'data-layout': layout,
        'data-columns': String(columns),
        'data-gap': String(gap),
        'data-fit': fit,
      }),
    ]
  },

  addNodeView() {
    return ReactNodeViewRenderer(GalleryBlockView, {
      // ❗ НЕ даём ProseMirror выделять блок по клику
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
      insertGalleryBlock:
        () =>
        ({ commands }) =>
          commands.insertContent({
            type: this.name,
            attrs: {
              images: [],
              width: DEFAULT_GALLERY_WIDTH,
              layout: DEFAULT_GALLERY_LAYOUT,
              columns: DEFAULT_GALLERY_COLUMNS,
              gap: DEFAULT_GALLERY_GAP,
              fit: DEFAULT_GALLERY_FIT,
            },
          }),
    }
  },
})
