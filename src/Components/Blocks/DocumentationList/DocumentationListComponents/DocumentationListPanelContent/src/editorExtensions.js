// src\editorExtensions.js
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'

import { Table } from '@tiptap/extension-table'
import { TableCell } from '@tiptap/extension-table-cell'
import { TableHeader } from '@tiptap/extension-table-header'
import { TableWrapper } from './extensions/tableWrapper'
import { TableCellCursorPad } from './extensions/tableCellCursorPad'
import { TableCellSelectionOnContent } from './extensions/tableCellSelectionOnContent'
import { TableRowHeight } from './extensions/tableRowHeight'
import { TableRowResizing } from './extensions/tableRowResizing'

import { SlashInterceptor } from './extensions/slashInterceptor'
import { SlashCommand } from './extensions/slash-command'
import { HiddenSlashDecoration } from './extensions/hiddenSlashDecoration'

import { Toggle } from './extensions/toggle'
import { ImageBlock } from './extensions/imageBlock'
import { FileBlock } from './extensions/fileBlock'
import { VideoBlock } from './extensions/videoBlock'
import { AudioBlock } from './extensions/audioBlock'
import { GalleryBlock } from './extensions/galleryBlock'
import { TableSelectionLockPlugin } from './extensions/tableSelectionLock'
import { FrameBlock } from './extensions/frameBlock'
import { ColumnsLayout } from './extensions/columnsLayout'
import { BlockLassoSelectionPlugin } from './extensions/blockLassoSelection'

// Новые расширения для панели инструментов
import { Color } from '@tiptap/extension-color'
import { TextStyle } from '@tiptap/extension-text-style'
import { Highlight } from '@tiptap/extension-highlight'
import { TextAlign } from '@tiptap/extension-text-align'
import { Underline } from '@tiptap/extension-underline'

import { Extension } from '@tiptap/core'
import { buildAnchorDomId } from './navigationAnchors'

// Кастомное расширение для размера шрифта
const FontSize = Extension.create({
  name: 'fontSize',
  
  addGlobalAttributes() {
    return [
      {
        types: ['textStyle'],
        attributes: {
          fontSize: {
            default: null,
            parseHTML: element => element.style.fontSize,
            renderHTML: attributes => {
              if (!attributes.fontSize) return {}
              return {
                style: `font-size: ${attributes.fontSize}`,
              }
            },
          },
        },
      },
    ]
  },
  
  addCommands() {
    return {
      setFontSize: fontSize => ({ chain }) => {
        return chain()
          .setMark('textStyle', { fontSize: `${fontSize}px` })
          .run()
      },
      unsetFontSize: () => ({ chain }) => {
        return chain()
          .setMark('textStyle', { fontSize: null })
          .run()
      },
    }
  },
})

// Кастомное расширение для цвета фона текста
const BackgroundColor = Extension.create({
  name: 'backgroundColor',
  
  addGlobalAttributes() {
    return [
      {
        types: ['textStyle'],
        attributes: {
          backgroundColor: {
            default: null,
            parseHTML: element => element.style.backgroundColor,
            renderHTML: attributes => {
              if (!attributes.backgroundColor) return {}
              return {
                style: `background-color: ${attributes.backgroundColor}`,
              }
            },
          },
        },
      },
    ]
  },
  
  addCommands() {
    return {
      setBackgroundColor: backgroundColor => ({ chain }) => {
        return chain()
          .setMark('textStyle', { backgroundColor })
          .run()
      },
      unsetBackgroundColor: () => ({ chain }) => {
        return chain()
          .setMark('textStyle', { backgroundColor: null })
          .run()
      },
    }
  },
})

const NavigationAnchor = Extension.create({
  name: 'navigationAnchor',

  addGlobalAttributes() {
    return [
      {
        types: ['paragraph', 'heading'],
        attributes: {
          anchorTag: {
            default: false,
            parseHTML: element => element.getAttribute('data-nav-anchor') === 'true',
            renderHTML: attributes => {
              if (!attributes.anchorTag || !attributes.anchorId) return {}
              return { 'data-nav-anchor': 'true' }
            },
          },
          anchorId: {
            default: null,
            parseHTML: element => element.getAttribute('data-nav-id'),
            renderHTML: attributes => {
              if (!attributes.anchorTag || !attributes.anchorId) return {}
              const domId = buildAnchorDomId(attributes.anchorId)
              return {
                'data-nav-id': attributes.anchorId,
                id: domId,
              }
            },
          },
        },
      },
    ]
  },
})

export const editorExtensions = [
  // Базовые расширения
  StarterKit.configure({
    heading: { levels: [1, 2, 3, 4, 5, 6] },
    // Отключаем подчеркивание из StarterKit, будем использовать отдельное
    underline: false,
    // Отключаем цвет текста из StarterKit, будем использовать отдельное
    color: false,
    // Отключаем выделение из StarterKit, будем использовать отдельное
    highlight: false,
    link: {
      openOnClick: true,
      autolink: true,
      linkOnPaste: true,
    },
  }),

  Placeholder.configure({
    placeholder: 'Начните писать…',
  }),

  // Расширения для текста (для панели инструментов)
  TextStyle,
  Color,
  Highlight.configure({ multicolor: true }),
  Underline,
  TextAlign.configure({
    types: ['heading', 'paragraph'],
  }),
  FontSize,
  BackgroundColor,
  NavigationAnchor,

  // 🔑 ВАЖНЫЙ ПОРЯДОК
  SlashInterceptor,
  HiddenSlashDecoration(),
  SlashCommand,
  
  TableWrapper,
  TableRowResizing,
  Table.configure({ resizable: true }),
  TableRowHeight,
  TableCell,
  TableHeader,
  TableCellCursorPad,
  TableCellSelectionOnContent,

  Toggle,
  FrameBlock,
  ColumnsLayout,
  ImageBlock,
  GalleryBlock,
  VideoBlock,
  AudioBlock,
  FileBlock,

  BlockLassoSelectionPlugin,
  TableSelectionLockPlugin,
]
