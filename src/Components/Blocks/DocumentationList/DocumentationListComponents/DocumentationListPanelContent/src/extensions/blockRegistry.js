// src/extensions/blockRegistry.js
import { Selection, TextSelection } from '@tiptap/pm/state'

// Удаляем "/" и выполняем действие
const deleteSlashAndExecute = (editor, range, action) => {
  const { state, view } = editor
  try {
    view.focus()
  } catch {
    // ignore
  }
  // `@tiptap/suggestion` range already includes the trigger char ("/").
  // Deleting `from - 1` can cross textblock/cell boundaries (tables) and break insertion position.
  const docSize = state.doc.content.size
  const from = Math.max(0, Math.min(range.from, docSize))
  const to = Math.max(from, Math.min(range.to, docSize))
  const tr = state.tr.deleteRange(from, to)
  try {
    const anchor = Math.max(0, Math.min(from, tr.doc.content.size))
    tr.setSelection(Selection.near(tr.doc.resolve(anchor), 1))
  } catch {
    // ignore selection fallback errors (e.g. uncommon node boundaries)
  }
  view.dispatch(tr)
  try {
    view.focus()
  } catch {
    // ignore
  }
  action(editor)
}

const clampDocPos = (doc, pos) => {
  const docSize = doc?.content?.size ?? 0
  return Math.max(0, Math.min(Number.isFinite(pos) ? pos : 0, docSize))
}

const getFirstTextCursorPosInNode = (node, nodePos) => {
  if (!node || typeof nodePos !== 'number') return null
  if (node.isTextblock) return nodePos + 1

  let cursorPos = null
  node.descendants((child, offset) => {
    if (cursorPos != null) return false
    if (child.isTextblock) {
      cursorPos = nodePos + offset + 2
      return false
    }
    return true
  })

  return cursorPos
}

const getMatchingAncestorFromSelection = (state, matchNode) => {
  const $from = state?.selection?.$from
  if (!$from || typeof matchNode !== 'function') return null

  for (let depth = $from.depth; depth > 0; depth -= 1) {
    let pos = null
    try {
      pos = $from.before(depth)
    } catch {
      continue
    }

    const node = $from.node(depth)
    if (!node) continue
    if (!matchNode(node, pos)) continue

    return { node, pos }
  }

  return null
}

const placeCursorInsideNearestNode = (editor, anchorPos, matchNode) => {
  if (!editor || typeof matchNode !== 'function') return false

  let view
  try {
    view = editor.view
  } catch {
    return false
  }

  const { state } = view
  const doc = state.doc
  const safeAnchor = clampDocPos(doc, anchorPos)
  const selectionMatch = getMatchingAncestorFromSelection(state, matchNode)
  const searchFrom = Math.max(0, safeAnchor - 64)
  const searchTo = Math.min(doc.content.size, safeAnchor + 4096)

  let best = selectionMatch
  if (!best) {
    doc.nodesBetween(searchFrom, searchTo, (node, pos) => {
      if (!matchNode(node, pos)) return true

      const containsAnchor =
        Number.isFinite(node?.nodeSize) &&
        safeAnchor >= pos &&
        safeAnchor <= pos + node.nodeSize
      const distance = Math.abs(pos - safeAnchor)

      if (!best) {
        best = { node, pos, distance, containsAnchor }
        return true
      }

      if (containsAnchor && !best.containsAnchor) {
        best = { node, pos, distance, containsAnchor }
        return true
      }

      if (Boolean(containsAnchor) === Boolean(best.containsAnchor) && distance < best.distance) {
        best = { node, pos, distance, containsAnchor }
      }
      return true
    })
  }

  if (!best) return false

  try {
    const tr = state.tr
    const textPos = getFirstTextCursorPosInNode(best.node, best.pos)

    if (typeof textPos === 'number') {
      tr.setSelection(TextSelection.create(doc, clampDocPos(doc, textPos)))
    } else {
      tr.setSelection(Selection.near(doc.resolve(clampDocPos(doc, best.pos + 1)), 1))
    }

    tr.scrollIntoView()
    view.dispatch(tr)
    view.focus()
    return true
  } catch {
    return false
  }
}

const schedulePlaceCursorInsideNearestNode = (editor, anchorPos, matchNode) => {
  if (typeof requestAnimationFrame === 'function') {
    requestAnimationFrame(() => {
      placeCursorInsideNearestNode(editor, anchorPos, matchNode)
    })
    return
  }

  setTimeout(() => {
    placeCursorInsideNearestNode(editor, anchorPos, matchNode)
  }, 0)
}

export const blockRegistry = [
  /* ================= TEXT ================= */
  {
    id: 'text',
    label: 'Текст',
    icon: `
Aa
`,
    keywords: ['text', 'paragraph', 'обычный'],
    command: ({ editor, range }) =>
      deleteSlashAndExecute(editor, range, e =>
        e.chain().setParagraph().run()
      ),
  },

  /* ================= HEADINGS ================= */
  /* ================= HEADINGS ================= */
...[1, 2, 3, 4, 5, 6].map(level => ({
  id: `heading-${level}`,
  label: `Заголовок ${level}`,
  icon: `H${level}`,
  keywords: [`h${level}`, 'heading', 'заголовок'],
  command: ({ editor, range }) =>
    deleteSlashAndExecute(editor, range, e => {
      e.chain()
        .unsetFontSize()        // 🔥 сброс липкого fontSize
        .setHeading({ level })  // делаем заголовок
        .run()

      schedulePlaceCursorInsideNearestNode(
        e,
        range.from,
        node => node.type?.name === 'heading' && Number(node.attrs?.level || 1) === level
      )
    }),
})),


  /* ================= LISTS ================= */
  {
    id: 'bullet-list',
    label: 'Маркерный список',
    icon: `
<svg viewBox="0 0 24 24" fill="none">
  <circle cx="6" cy="7" r="1.5" fill="currentColor"/>
  <circle cx="6" cy="12" r="1.5" fill="currentColor"/>
  <circle cx="6" cy="17" r="1.5" fill="currentColor"/>
  <path d="M10 7h10M10 12h10M10 17h10"
    stroke="currentColor"
    stroke-width="1.75"
    stroke-linecap="round"/>
</svg>`,
    keywords: ['list', 'bullet', 'маркерный'],
    command: ({ editor, range }) =>
      deleteSlashAndExecute(editor, range, e =>
        e.chain().toggleBulletList().run()
      ),
  },

  {
    id: 'ordered-list',
    label: 'Нумерованный список',
    icon: `<svg viewBox="0 0 24 24" fill="none">
  <path
    d="M11 6h9M11 13h9M11 20h9"
    stroke="currentColor"
    stroke-width="1.75"
    stroke-linecap="round"
  />
  <text x="5" y="8" font-size="7.5" fill="currentColor" font-weight="600">1</text>
  <text x="5" y="15" font-size="7.5" fill="currentColor" font-weight="600">2</text>
  <text x="5" y="22" font-size="7.5" fill="currentColor" font-weight="600">3</text>
</svg>
`,
    keywords: ['list', 'ordered', 'нумерованный'],
    command: ({ editor, range }) =>
      deleteSlashAndExecute(editor, range, e =>
        e.chain().toggleOrderedList().run()
      ),
  },

  {
    id: 'toggle',
    label: 'Раскрываемый список',
    icon: `
<svg viewBox="0 0 24 24" fill="none">
  <path d="M7 10l5 5 5-5"
    stroke="currentColor"
    stroke-width="1.75"
    stroke-linecap="round"
    stroke-linejoin="round"/>
</svg>`,
    keywords: ['toggle', 'details', 'раскрываемый'],
    command: ({ editor, range }) =>
      deleteSlashAndExecute(editor, range, e => {
        e.chain().insertToggle().run()
        schedulePlaceCursorInsideNearestNode(e, range.from, node => node.type?.name === 'toggle')
      }),
  },

  /* ================= TABLE ================= */
  {
    id: 'table',
    label: 'Таблица',
    icon: `
<svg viewBox="0 0 24 24" fill="none">
  <rect x="4" y="4" width="16" height="16" rx="2"
    stroke="currentColor"
    stroke-width="1.75"/>
  <path d="M8 4v16M12 4v16M16 4v16M4 8h16M4 12h16M4 16h16"
    stroke="currentColor"
    stroke-width="1"/>
</svg>`,
    keywords: ['table', 'таблица'],
    command: ({ editor, range }) =>
      deleteSlashAndExecute(editor, range, e => {
        e
          .chain()
          .insertContent({
            type: 'tableWrapper',
            content: [
              {
                type: 'table',
                content: Array.from({ length: 3 }).map(() => ({
                  type: 'tableRow',
                  content: Array.from({ length: 3 }).map(() => ({
                    type: 'tableCell',
                    content: [
                      { type: 'paragraph', content: [{ type: 'text', text: ' ' }] },
                    ],
                  })),
                })),
              },
            ],
          })
          .run()

        schedulePlaceCursorInsideNearestNode(
          e,
          range.from,
          node => node.type?.name === 'tableWrapper'
        )
      }),
  },

  /* ================= BLOCKS ================= */
  {
    id: 'divider',
    label: 'Разделитель',
    icon: `
<svg viewBox="0 0 24 24" fill="none">
  <line x1="4" y1="12" x2="20" y2="12"
    stroke="currentColor"
    stroke-width="2.5"
    stroke-linecap="round"/>
</svg>`,
    keywords: ['divider', 'hr'],
    command: ({ editor, range }) =>
      deleteSlashAndExecute(editor, range, e =>
        e.chain().setHorizontalRule().run()
      ),
  },

  {
    id: 'quote',
    label: 'Цитата',
    icon: `
<svg viewBox="0 0 24 24" fill="none">
  <path d="M7 7h4v5H7zM13 7h4v5h-4z"
    stroke="currentColor"
    stroke-width="1.75"
    stroke-linejoin="round"/>
</svg>`,
    keywords: ['quote', 'цитата'],
    command: ({ editor, range }) =>
      deleteSlashAndExecute(editor, range, e => {
        e.chain().setBlockquote().run()
        schedulePlaceCursorInsideNearestNode(e, range.from, node => node.type?.name === 'blockquote')
      }),
  },

  {
    id: 'frame',
    label: 'Блок с рамкой',
    icon: `
<svg viewBox="0 0 24 24" fill="none">
  <rect x="5" y="5" width="14" height="14" rx="2"
    stroke="currentColor"
    stroke-width="1.75"/>
</svg>`,
    keywords: ['frame', 'callout', 'рамка'],
    command: ({ editor, range }) =>
      deleteSlashAndExecute(editor, range, e => {
        e.chain().insertFrameBlock().run()
        schedulePlaceCursorInsideNearestNode(e, range.from, node => node.type?.name === 'frameBlock')
      }),
  },

  /* ================= MEDIA ================= */
  {
    id: 'image',
    label: 'Изображение',
    icon: `
<svg viewBox="0 0 24 24" fill="none">
  <rect x="4" y="4" width="16" height="16" rx="2"
    stroke="currentColor"
    stroke-width="1.75"/>
  <circle cx="9" cy="9" r="1.5" fill="currentColor"/>
  <path d="M4 16l5-5 4 4 3-3 4 4"
    stroke="currentColor"
    stroke-width="1.75"
    stroke-linecap="round"/>
</svg>`,
    keywords: ['image', 'img'],
    command: ({ editor, range }) =>
      deleteSlashAndExecute(editor, range, e =>
        e.chain().insertImageBlock().run()
      ),
  },

  {
    id: 'gallery',
    label: 'Галерея',
    icon: `
<svg viewBox="0 0 24 24" fill="none">
  <rect x="3" y="3" width="7" height="7" rx="1.5" stroke="currentColor" stroke-width="1.75"/>
  <rect x="14" y="3" width="7" height="7" rx="1.5" stroke="currentColor" stroke-width="1.75"/>
  <rect x="3" y="14" width="7" height="7" rx="1.5" stroke="currentColor" stroke-width="1.75"/>
  <rect x="14" y="14" width="7" height="7" rx="1.5" stroke="currentColor" stroke-width="1.75"/>
</svg>`,
    keywords: ['gallery'],
    command: ({ editor, range }) =>
      deleteSlashAndExecute(editor, range, e =>
        e.chain().insertGalleryBlock({ images: [] }).run()
      ),
  },

  {
    id: 'video',
    label: 'Видео',
    icon: `
<svg viewBox="0 0 24 24" fill="none">
  <rect x="4" y="6" width="16" height="12" rx="2"
    stroke="currentColor"
    stroke-width="1.75"/>
  <path d="M11 10l4 2-4 2z" fill="currentColor"/>
</svg>`,
    keywords: ['video'],
    command: ({ editor, range }) =>
      deleteSlashAndExecute(editor, range, e =>
        e.chain().insertVideoBlock().run()
      ),
  },

  {
    id: 'audio',
    label: 'Аудио',
    icon: `
<svg viewBox="0 0 24 24" fill="none">
  <circle cx="12" cy="12" r="9"
    stroke="currentColor"
    stroke-width="1.75"/>
  <path d="M9 8v8M12 6v12M15 8v8"
    stroke="currentColor"
    stroke-width="1.75"
    stroke-linecap="round"/>
</svg>`,
    keywords: ['audio'],
    command: ({ editor, range }) =>
      deleteSlashAndExecute(editor, range, e =>
        e.chain().insertAudioBlock({ src: null }).run()
      ),
  },

  {
    id: 'file',
    label: 'Файл',
    icon: `
<svg viewBox="0 0 24 24" fill="none">
  <path d="M6 3h8l4 4v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z"
    stroke="currentColor"
    stroke-width="1.75"
    stroke-linejoin="round"/>
  <path d="M14 3v5h5" stroke="currentColor" stroke-width="1.75"/>
</svg>`,
    keywords: ['file'],
    command: ({ editor, range }) =>
      deleteSlashAndExecute(editor, range, e => {
        e.chain().insertFileBlock({ url: null, name: 'Файл' }).run()

        setTimeout(() => {
          const blocks = document.querySelectorAll('[data-file-block]')
          const last = blocks[blocks.length - 1]
          last?.querySelector('.file-empty')?.click()
        }, 50)
      }),
  },
]
