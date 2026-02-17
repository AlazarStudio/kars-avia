// src/extensions/blockRegistry.js

// Удаляем "/" и выполняем действие
const deleteSlashAndExecute = (editor, range, action) => {
  editor.commands.focus()

  const { state, view } = editor
  // `@tiptap/suggestion` range already includes the trigger char ("/").
  // Deleting `from - 1` can cross textblock/cell boundaries (tables) and break insertion position.
  const docSize = state.doc.content.size
  const from = Math.max(0, Math.min(range.from, docSize))
  const to = Math.max(from, Math.min(range.to, docSize))
  const tr = state.tr.deleteRange(from, to)
  view.dispatch(tr)
  action(editor)
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
    deleteSlashAndExecute(editor, range, e =>
      e.chain()
        .focus()
        .unsetFontSize()        // 🔥 сброс липкого fontSize
        .setHeading({ level })  // делаем заголовок
        .run()
    ),
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
      deleteSlashAndExecute(editor, range, e =>
        e.chain().insertToggle().run()
      ),
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

        const { state, view } = e
        const doc = state.doc
        const from = Math.max(0, range.from - 2)
        const to = Math.min(doc.content.size, range.from + 2000)

        let wrapperPos = null
        doc.nodesBetween(from, to, (node, pos) => {
          if (node.type.name === 'tableWrapper') {
            wrapperPos = pos
            return false
          }
          return true
        })

        if (wrapperPos == null) return
        const wrapperNode = doc.nodeAt(wrapperPos)
        if (!wrapperNode) return

        // Position inside first cell paragraph, before the single space.
        let textPos = wrapperPos + 5
        try {
          view.dispatch(
            state.tr.setSelection(
              state.selection.constructor.near(
                doc.resolve(textPos),
                1
              )
            )
          )
        } catch {
          // ignore
        }
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
      deleteSlashAndExecute(editor, range, e =>
        e.chain().setBlockquote().run()
      ),
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
      deleteSlashAndExecute(editor, range, e =>
        e.chain().insertFrameBlock().run()
      ),
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
