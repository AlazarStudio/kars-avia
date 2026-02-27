import { useState, useEffect, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'
import './toolbar.css'
import { useReducer } from 'react'
import FormatAlignLeftRoundedIcon from '@mui/icons-material/FormatAlignLeftRounded'
import FormatAlignCenterRoundedIcon from '@mui/icons-material/FormatAlignCenterRounded'
import FormatAlignRightRoundedIcon from '@mui/icons-material/FormatAlignRightRounded'
import FormatAlignJustifyRoundedIcon from '@mui/icons-material/FormatAlignJustifyRounded'
import ChevronRightRoundedIcon from '@mui/icons-material/ChevronRightRounded'
import LinkRoundedIcon from '@mui/icons-material/LinkRounded'
import UploadRoundedIcon from '@mui/icons-material/UploadRounded'
import DownloadRoundedIcon from '@mui/icons-material/DownloadRounded'
import DataObjectRoundedIcon from '@mui/icons-material/DataObjectRounded'
import DesktopWindowsRoundedIcon from '@mui/icons-material/DesktopWindowsRounded'
import RestartAltRoundedIcon from '@mui/icons-material/RestartAltRounded'
import FontSizeSelect from './FontSizeSelect'
import ColorModal from './ColorModal'
import LinkModal from './LinkModal'
import CustomStyleModal from './CustomStyleModal'
import ExportModal from './ExportModal'
import ImportModal from './ImportModal'
import { saveFile } from '../storage/fileStore'
import { getDocumentationUploadFile } from '../DocumentationUploadStore'
import { BlockLassoSelectionKey } from '../extensions/blockLassoSelection'
import {
  buildExcelHtmlDocument,
  buildWordHtmlDocument,
  createDocxBlobFromPlainText,
} from '../utils/officeExport'
import { docxArrayBufferToHtml } from '../utils/docxImport'

const linkStyles = [
  {
    id: 'default',
    label: 'Обычная ссылка',
    icon: 'link',
    description: 'Стандартное оформление ссылки.',
  },
  {
    id: 'button',
    label: 'Кнопка',
    icon: 'button',
    description: 'Ссылка отображается как кнопка.',
  },
  {
    id: 'highlighted',
    label: 'Выделенная',
    icon: 'highlight',
    description: 'Ссылка с цветной подложкой.',
  },
  {
    id: 'dashed',
    label: 'Пунктирная',
    icon: 'dashed',
    description: 'Ссылка с пунктирным подчеркиванием.',
  },
  {
    id: 'no-underline',
    label: 'Без подчеркивания',
    icon: 'no-underline',
    description: 'Ссылка без подчеркивания.',
  },
  {
    id: 'colored',
    label: 'Цветная',
    icon: 'colored',
    description: 'Ссылка с акцентным цветом.',
  },
]
const BLOCK_ALIGN_NODE_TYPES = new Set([
  'imageBlock',
  'galleryBlock',
  'videoBlock',
  'audioBlock',
  'fileBlock',
  'toggle',
  'frameBlock',
  'tableWrapper',
])

const TEXT_ALIGN_NODE_TYPES = new Set(['paragraph', 'heading'])

const SINGLE_MODAL_EVENT = 'doclist-single-modal-open'
const ARTICLE_MIN_MANUAL_WIDTH = 320
const ARTICLE_MAX_MANUAL_WIDTH = 2400
const DEFAULT_JSON_MODAL_WIDTH = 600
const ARTICLE_WIDTH_PRESETS = [
  { id: 'level4', label: '\u0423\u0440\u043e\u0432\u0435\u043d\u044c 4', maxWidth: null },
  { id: 'level3', label: '\u0423\u0440\u043e\u0432\u0435\u043d\u044c 3', maxWidth: 1080 },
  { id: 'level2', label: '\u0423\u0440\u043e\u0432\u0435\u043d\u044c 2', maxWidth: 860 },
  { id: 'level1', label: '\u0423\u0440\u043e\u0432\u0435\u043d\u044c 1', maxWidth: 720 },
]
const TOOLBAR_GROUP_ORDER = [
  'text-style',
  'font-size',
  'alignment',
  'text-color',
  'bg-color',
  'link',
  'import-export',
  'article-layout',
  'reset',
]

function areStringArraysEqual(a, b) {
  if (a === b) return true
  if (!Array.isArray(a) || !Array.isArray(b)) return false
  if (a.length !== b.length) return false
  for (let i = 0; i < a.length; i += 1) {
    if (a[i] !== b[i]) return false
  }
  return true
}

function getArticleWidthPresetText(option) {
  return String(option?.label || '')
}

export default function Toolbar({
  editor,
  anchorModeEnabled = false,
  onToggleAnchorMode,
  articleWidthMode = 'preset',
  articleWidthPreset = 'level4',
  articleManualWidth = 1080,
  articleWidthFrameVisible = true,
  onArticleWidthModeChange,
  onArticleWidthPresetChange,
  onArticleManualWidthChange,
  onArticleWidthFrameVisibleChange,
  articlePaddingMode = 'shared',
  onArticlePaddingModeChange,
  articlePaddingFrameVisible = false,
  onArticlePaddingFrameVisibleChange,
  onArticlePaddingReset,
}) {
  if (!editor) return null

  // Color tool state
  const [textColor, setTextColor] = useState('#000000')
  const [bgColor, setBgColor] = useState('#FFFFFF')
  const [showTextColorModal, setShowTextColorModal] = useState(false)
  const [showBgColorModal, setShowBgColorModal] = useState(false)
  const [showLinkModal, setShowLinkModal] = useState(false)
  const [showCustomStyleModal, setShowCustomStyleModal] = useState(false)
  const [showExportModal, setShowExportModal] = useState(false)
  const [showImportModal, setShowImportModal] = useState(false)
  const [showJsonModal, setShowJsonModal] = useState(false)
  const [showArticleLayoutModal, setShowArticleLayoutModal] = useState(false)
  const [showToolbarOverflowModal, setShowToolbarOverflowModal] = useState(false)
  const [overflowGroupIds, setOverflowGroupIds] = useState([])
  const [articleLayoutTab, setArticleLayoutTab] = useState('width')
  const [articleManualWidthInput, setArticleManualWidthInput] = useState(
    String(articleManualWidth || 1080)
  )
  const [jsonText, setJsonText] = useState('')
  const [jsonError, setJsonError] = useState(null)
  const [jsonModalWidth, setJsonModalWidth] = useState(DEFAULT_JSON_MODAL_WIDTH)
  const [isResizingJsonModal, setIsResizingJsonModal] = useState(false)
  const jsonResizeStateRef = useRef(null)
  const [modalPosition, setModalPosition] = useState({ x: 100, y: 100 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const draggedModalRef = useRef(null)
  
  // Custom presets state
  const [customTextColors, setCustomTextColors] = useState(() => Array(10).fill(null))
  const [customBgColors, setCustomBgColors] = useState(() => Array(10).fill(null))
  const [customLinkStyles, setCustomLinkStyles] = useState(() => [])
  
  // State for editing a custom link style
  const [editingStyle, setEditingStyle] = useState(null)
  
  // Background paint mode state
  const [isBgPaintingMode, setIsBgPaintingMode] = useState(false)
  
  // Selected value for font size select
  const [selectedFontSize, setSelectedFontSize] = useState('16')
  
  // Guard for popup closing while interacting with inputs
  const [blockClose, setBlockClose] = useState(false)
  const [toolbarRefreshTick, forceToolbarRefresh] = useReducer(v => v + 1, 0)
  
  // Refs
  const textColorButtonRef = useRef(null)
  const bgColorButtonRef = useRef(null)
  const textSelectButtonRef = useRef(null)
  const bgSelectButtonRef = useRef(null)
  const linkButtonRef = useRef(null)
  const exportButtonRef = useRef(null)
  const importButtonRef = useRef(null)
  const jsonButtonRef = useRef(null)
  const articleLayoutButtonRef = useRef(null)
  const toolbarRootRef = useRef(null)
  const toolbarMainRef = useRef(null)
  const toolbarOverflowTriggerRef = useRef(null)
  const toolbarGroupRefs = useRef({})
  const backdropRef = useRef(null)
  const modalPortalTarget = typeof document !== 'undefined' ? document.body : null
  const renderModalPortal = (node) => {
    if (!node) return null
    return modalPortalTarget ? createPortal(node, modalPortalTarget) : node
  }

  const closeAllModals = useCallback((options = {}) => {
    const preserveWidthFrame = Boolean(options.preserveWidthFrame)
    const preservePaddingFrame = Boolean(options.preservePaddingFrame)
    const hideWidthFrame =
      typeof options.hideWidthFrame === 'boolean'
        ? options.hideWidthFrame
        : (showArticleLayoutModal && !preserveWidthFrame)
    const hidePaddingFrame =
      typeof options.hidePaddingFrame === 'boolean'
        ? options.hidePaddingFrame
        : (showArticleLayoutModal && !preservePaddingFrame)

    setShowTextColorModal(false)
    setShowBgColorModal(false)
    setShowLinkModal(false)
    setShowCustomStyleModal(false)
    setShowExportModal(false)
    setShowImportModal(false)
    setShowJsonModal(false)
    setShowArticleLayoutModal(false)
    setShowToolbarOverflowModal(false)
    setArticleLayoutTab('width')
    setEditingStyle(null)
    if (hideWidthFrame) {
      onArticleWidthFrameVisibleChange?.(false)
    }
    if (hidePaddingFrame) {
      onArticlePaddingFrameVisibleChange?.(false)
    }
  }, [
    onArticlePaddingFrameVisibleChange,
    onArticleWidthFrameVisibleChange,
    showArticleLayoutModal,
  ])

  const announceModalOpen = () => {
    try {
      window.dispatchEvent(
        new CustomEvent(SINGLE_MODAL_EVENT, {
          detail: { source: 'toolbar' },
        })
      )
    } catch {
      // ignore
    }
  }

  useEffect(() => {
    const onExternalModalOpen = (event) => {
      if (event?.detail?.source === 'toolbar') return
      closeAllModals()
    }

    window.addEventListener(SINGLE_MODAL_EVENT, onExternalModalOpen)
    return () => {
      window.removeEventListener(SINGLE_MODAL_EVENT, onExternalModalOpen)
    }
  }, [closeAllModals])

  useEffect(() => {
    setArticleManualWidthInput(String(articleManualWidth || 1080))
  }, [articleManualWidth, showArticleLayoutModal])

  // Sync toolbar state with current editor selection
useEffect(() => {
  if (!editor) return

  let raf = 0

  const calc = () => {
    const marks = editor.getAttributes('textStyle')

    if (marks?.fontSize) {
      setSelectedFontSize(marks.fontSize.replace('px', ''))
      return
    }

    if (editor.isActive('heading', { level: 1 })) return setSelectedFontSize('32')
    if (editor.isActive('heading', { level: 2 })) return setSelectedFontSize('24')
    if (editor.isActive('heading', { level: 3 })) return setSelectedFontSize('20')
    if (editor.isActive('heading', { level: 4 })) return setSelectedFontSize('18')
    if (editor.isActive('heading', { level: 5 })) return setSelectedFontSize('16')
    if (editor.isActive('heading', { level: 6 })) return setSelectedFontSize('14')

    setSelectedFontSize('16')
  }

  const update = () => {
    cancelAnimationFrame(raf)
    raf = requestAnimationFrame(calc)
  }

  update()
  editor.on('selectionUpdate', update)
  editor.on('transaction', update)

  return () => {
    cancelAnimationFrame(raf)
    editor.off('selectionUpdate', update)
    editor.off('transaction', update)
  }
}, [editor])

  useEffect(() => {
    if (!editor) return

    let raf = 0
    const refresh = () => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(() => {
        forceToolbarRefresh()
      })
    }

    refresh()
    editor.on('selectionUpdate', refresh)
    editor.on('transaction', refresh)
    editor.on('focus', refresh)
    editor.on('blur', refresh)

    return () => {
      cancelAnimationFrame(raf)
      editor.off('selectionUpdate', refresh)
      editor.off('transaction', refresh)
      editor.off('focus', refresh)
      editor.off('blur', refresh)
    }
  }, [editor, forceToolbarRefresh])


  useEffect(() => {
    if (editor) {
      const textColorAttr = editor.getAttributes('textStyle').color
      if (textColorAttr) {
        setTextColor(textColorAttr)
      }

      const bgColorAttr = editor.getAttributes('textStyle').backgroundColor
      if (bgColorAttr) {
        setBgColor(bgColorAttr)
      }
    }
  }, [editor])

  const getLassoSelectedPositions = () => {
    if (!editor) return []
    const pluginState = BlockLassoSelectionKey.getState(editor.state)
    const positions = pluginState?.positions
    if (!Array.isArray(positions) || !positions.length) return []

    const out = []
    const seen = new Set()
    for (const pos of positions) {
      if (typeof pos !== 'number' || !Number.isFinite(pos) || pos < 0) continue
      const safePos = Math.floor(pos)
      if (seen.has(safePos)) continue
      seen.add(safePos)
      out.push(safePos)
    }
    out.sort((a, b) => a - b)
    return out
  }

  const getLassoTextRanges = ({ includeCollapsed = false } = {}) => {
    if (!editor) return []

    const doc = editor.state.doc
    const out = []
    for (const pos of getLassoSelectedPositions()) {
      const node = doc.nodeAt(pos)
      if (!node) continue
      const from = pos + 1
      const to = pos + node.nodeSize - 1
      if (from > to) continue
      if (!includeCollapsed && from === to) continue
      out.push({ pos, from, to, node })
    }
    return out
  }

  const runForLassoTextRanges = (runner, options = {}) => {
    if (!editor || typeof runner !== 'function') return false
    const ranges = getLassoTextRanges(options)
    if (!ranges.length) return false

    let applied = false
    for (const range of ranges) {
      const chain = editor.chain().focus().setTextSelection({ from: range.from, to: range.to })
      const shouldRun = runner(chain, range)
      if (shouldRun === false) continue
      if (chain.run()) {
        applied = true
      }
    }
    return applied
  }

  const applyBlockAttrsForLasso = (nextAttrs, predicate) => {
    if (!editor) return false

    const positions = getLassoSelectedPositions()
    if (!positions.length) return false

    let tr = editor.state.tr
    let changed = false
    for (const pos of positions) {
      const node = tr.doc.nodeAt(pos)
      if (!node) continue
      if (typeof predicate === 'function' && !predicate(node)) continue

      const patch = typeof nextAttrs === 'function'
        ? nextAttrs(node.attrs || {}, node)
        : nextAttrs
      if (!patch || typeof patch !== 'object') continue

      let shouldUpdate = false
      for (const [key, value] of Object.entries(patch)) {
        if (node.attrs?.[key] !== value) {
          shouldUpdate = true
          break
        }
      }
      if (!shouldUpdate) continue

      tr = tr.setNodeMarkup(pos, node.type, { ...node.attrs, ...patch }, node.marks)
      changed = true
    }

    if (changed) {
      editor.view.dispatch(tr)
    }
    return changed
  }

  const toggleBoldAction = () => {
    if (runForLassoTextRanges(chain => chain.toggleBold())) return
    editor.chain().focus().toggleBold().run()
  }

  const toggleItalicAction = () => {
    if (runForLassoTextRanges(chain => chain.toggleItalic())) return
    editor.chain().focus().toggleItalic().run()
  }

  const toggleUnderlineAction = () => {
    if (runForLassoTextRanges(chain => chain.toggleUnderline())) return
    editor.chain().focus().toggleUnderline().run()
  }

  const toggleStrikeAction = () => {
    if (runForLassoTextRanges(chain => chain.toggleStrike())) return
    editor.chain().focus().toggleStrike().run()
  }

  const resetAllStyles = () => {
    if (!editor) return

    const lassoSelection = getLassoSelectedPositions()
    if (lassoSelection.length) {
      const nodeChanged = applyBlockAttrsForLasso(
        { textAlign: null },
        node => BLOCK_ALIGN_NODE_TYPES.has(node.type.name)
      )
      const textChanged = runForLassoTextRanges(
        chain => {
          chain
            .unsetAllMarks()
            .unsetTextAlign()
            .unsetFontSize()
            .unsetColor()
            .unsetBackgroundColor()
            .setParagraph()
        },
        { includeCollapsed: true }
      )

      if (nodeChanged || textChanged) {
        setTextColor('#000000')
        setBgColor('#FFFFFF')
        setSelectedFontSize('16')
        return
      }
    }

    const selectedNode = editor.state.selection?.node
    if (selectedNode) {
      if (BLOCK_ALIGN_NODE_TYPES.has(selectedNode.type.name)) {
        editor.chain().focus().updateAttributes(selectedNode.type.name, { textAlign: null }).run()
      }
      return
    }
    
    editor.chain().focus()
      .unsetAllMarks()
      .unsetTextAlign()
      .unsetFontSize()
      .unsetColor()
      .unsetBackgroundColor()
      .setParagraph()
      .run()
    
    setTextColor('#000000')
    setBgColor('#FFFFFF')
    setSelectedFontSize('16')
  }

  const setAlignment = (align) => {
    if (!editor) return

    const isJustify = align === 'justify'

    const lassoSelection = getLassoSelectedPositions()
    if (lassoSelection.length) {
      const nodeChanged = !isJustify && applyBlockAttrsForLasso(
        { textAlign: align },
        node => BLOCK_ALIGN_NODE_TYPES.has(node.type.name)
      )
      const textChanged = runForLassoTextRanges(
        (chain, range) => {
          if (!isJustify && BLOCK_ALIGN_NODE_TYPES.has(range.node.type.name)) return false
          chain.setTextAlign(align)
        },
        { includeCollapsed: true }
      )
      if (nodeChanged || textChanged) return
    }

    const { selection } = editor.state
    const selectedNode = selection?.node

    if (!isJustify && selectedNode && BLOCK_ALIGN_NODE_TYPES.has(selectedNode.type.name)) {
      editor.chain().focus().updateAttributes(selectedNode.type.name, { textAlign: align }).run()
      return
    }

    // If we're inside a block-resizable node (toggle/table/frame/etc.), align the whole block,
    // not the text inside. Keep text alignment when a range is selected.
    if (!isJustify && selection?.from === selection?.to) {
      const { $from } = selection
      for (let d = $from.depth; d > 0; d--) {
        const name = $from.node(d).type.name
        if (BLOCK_ALIGN_NODE_TYPES.has(name)) {
          editor.chain().focus().updateAttributes(name, { textAlign: align }).run()
          return
        }
      }
    }

    editor.chain().focus().setTextAlign(align).run()
  }

  const resolveNodeAlignment = node => {
    if (!node) return null
    const nodeName = node.type?.name
    if (!nodeName) return null
    if (!TEXT_ALIGN_NODE_TYPES.has(nodeName) && !BLOCK_ALIGN_NODE_TYPES.has(nodeName)) {
      return null
    }
    const raw = node.attrs?.textAlign
    if (raw === 'center' || raw === 'right' || raw === 'justify' || raw === 'left') {
      return raw
    }
    return 'left'
  }

  const getCurrentAlignmentValue = () => {
    if (!editor) return null

    const lassoSelection = getLassoSelectedPositions()
    if (lassoSelection.length) {
      const values = new Set()
      for (const pos of lassoSelection) {
        const node = editor.state.doc.nodeAt(pos)
        const value = resolveNodeAlignment(node)
        if (!value) continue
        values.add(value)
        if (values.size > 1) return null
      }
      if (values.size === 1) {
        return Array.from(values)[0]
      }
      return null
    }

    const { selection, doc } = editor.state
    const selectedNodeValue = resolveNodeAlignment(selection?.node)
    if (selectedNodeValue) return selectedNodeValue

    if (selection?.from === selection?.to) {
      const { $from } = selection
      for (let d = $from.depth; d > 0; d--) {
        const value = resolveNodeAlignment($from.node(d))
        if (value) return value
      }
      return 'left'
    }

    const rangeValues = new Set()
    doc.nodesBetween(selection.from, selection.to, node => {
      const value = resolveNodeAlignment(node)
      if (!value) return
      rangeValues.add(value)
    })

    if (rangeValues.size === 1) {
      return Array.from(rangeValues)[0]
    }

    return null
  }

  const hasAnyStyle = () => {
    return (
      editor.isActive('bold') ||
      editor.isActive('italic') ||
      editor.isActive('underline') ||
      editor.isActive('strike') ||
      editor.isActive('highlight') ||
      editor.getAttributes('textStyle').color ||
      editor.getAttributes('textStyle').backgroundColor ||
      editor.getAttributes('textStyle').fontSize ||
      editor.isActive({ textAlign: 'center' }) ||
      editor.isActive({ textAlign: 'right' }) ||
      editor.isActive({ textAlign: 'justify' })
    )
  }

  const applyTextColor = (color) => {
    if (!editor) return
    if (!runForLassoTextRanges(chain => chain.setColor(color))) {
      editor.chain().focus().setColor(color).run()
    }
    setTextColor(color)
  }

  const applyBgColor = (color) => {
    setBgColor(color)
    if (!editor) return
    runForLassoTextRanges(chain => chain.setBackgroundColor(color))
  }

  const applyBgColorToSelection = () => {
    if (!editor || !isBgPaintingMode) return
    
    const { from, to } = editor.state.selection
    
    if (from !== to) {
      editor.chain()
        .focus()
        .setTextSelection({ from, to })
        .setBackgroundColor(bgColor)
        .run()
    }
  }

  const saveCustomColor = (color, isTextColor) => {
    if (isTextColor) {
      const emptyIndex = customTextColors.findIndex(c => c === null)
      if (emptyIndex !== -1) {
        const newColors = [...customTextColors]
        newColors[emptyIndex] = color
        setCustomTextColors(newColors)
      } else {
        const newColors = [...customTextColors]
        newColors.shift()
        newColors.push(color)
        setCustomTextColors(newColors)
      }
    } else {
      const emptyIndex = customBgColors.findIndex(c => c === null)
      if (emptyIndex !== -1) {
        const newColors = [...customBgColors]
        newColors[emptyIndex] = color
        setCustomBgColors(newColors)
      } else {
        const newColors = [...customBgColors]
        newColors.shift()
        newColors.push(color)
        setCustomBgColors(newColors)
      }
    }
  }

  const removeCustomColor = (index, isTextColor, e) => {
    e.stopPropagation()
    if (isTextColor) {
      const newColors = [...customTextColors]
      newColors[index] = null
      setCustomTextColors(newColors)
    } else {
      const newColors = [...customBgColors]
      newColors[index] = null
      setCustomBgColors(newColors)
    }
  }

  const removeCustomStyle = (index, e) => {
    e.stopPropagation()
    e.preventDefault()
    const newStyles = [...customLinkStyles]
    newStyles.splice(index, 1)
    setCustomLinkStyles(newStyles)
  }

  const updateCustomStyle = (updatedStyle) => {
    setCustomLinkStyles(prevStyles => 
      prevStyles.map(style => 
        style.id === updatedStyle.id ? updatedStyle : style
      )
    )
  }

  const openTextColorModal = () => {
    closeAllModals()
    announceModalOpen()
    setShowTextColorModal(true)
    
    if (textSelectButtonRef.current) {
      const rect = textSelectButtonRef.current.getBoundingClientRect()
      setModalPosition({
        x: Math.min(rect.left, window.innerWidth - 280),
        y: rect.bottom + 10
      })
    }
  }

  const openBgColorModal = () => {
    closeAllModals()
    announceModalOpen()
    setShowBgColorModal(true)
    
    if (bgSelectButtonRef.current) {
      const rect = bgSelectButtonRef.current.getBoundingClientRect()
      setModalPosition({
        x: Math.min(rect.left, window.innerWidth - 280),
        y: rect.bottom + 10
      })
    }
  }

  const openLinkModal = () => {
    closeAllModals()
    announceModalOpen()
    setShowLinkModal(true)
    
    if (linkButtonRef.current) {
      const rect = linkButtonRef.current.getBoundingClientRect()
      setModalPosition({
        x: Math.min(rect.left, window.innerWidth - 450),
        y: rect.bottom + 10
      })
    }
  }

  const openExportModal = () => {
    closeAllModals()
    announceModalOpen()
    setShowExportModal(true)

    if (exportButtonRef.current) {
      const rect = exportButtonRef.current.getBoundingClientRect()
      setModalPosition({
        x: Math.min(rect.left, window.innerWidth - 450),
        y: rect.bottom + 10,
      })
      return
    }

    setModalPosition({
      x: window.innerWidth / 2 - 200,
      y: window.innerHeight / 2 - 180,
    })
  }

  const openImportModal = () => {
    closeAllModals()
    announceModalOpen()
    setShowImportModal(true)

    if (importButtonRef.current) {
      const rect = importButtonRef.current.getBoundingClientRect()
      setModalPosition({
        x: Math.min(rect.left, window.innerWidth - 450),
        y: rect.bottom + 10,
      })
      return
    }

    setModalPosition({
      x: window.innerWidth / 2 - 200,
      y: window.innerHeight / 2 - 180,
    })
  }

  const refreshJsonFromEditor = () => {
    if (!editor) return

    try {
      const json =
        editor.getJSON?.() ?? { type: 'doc', content: [{ type: 'paragraph' }] }
      setJsonText(JSON.stringify(json, null, 2))
      setJsonError(null)
    } catch {
      setJsonText('')
      setJsonError('Не удалось получить JSON из редактора')
    }
  }

  const openJsonModal = () => {
    closeAllModals()
    announceModalOpen()
    refreshJsonFromEditor()
    setJsonModalWidth(DEFAULT_JSON_MODAL_WIDTH)
    setIsResizingJsonModal(false)
    jsonResizeStateRef.current = null
    setShowJsonModal(true)

    if (jsonButtonRef.current) {
      const rect = jsonButtonRef.current.getBoundingClientRect()
      const defaultJsonModalWidth = DEFAULT_JSON_MODAL_WIDTH
      const maxX = Math.max(20, window.innerWidth - defaultJsonModalWidth - 20)
      setModalPosition({
        x: Math.min(Math.max(20, rect.left), maxX),
        y: rect.bottom + 10,
      })
      return
    }

    const defaultJsonModalWidth = DEFAULT_JSON_MODAL_WIDTH
    setModalPosition({
      x: Math.max(20, window.innerWidth / 2 - defaultJsonModalWidth / 2),
      y: window.innerHeight / 2 - 260,
    })
  }

  const switchArticleLayoutTab = (tab) => {
    const nextTab = tab === 'padding' ? 'padding' : 'width'
    setArticleLayoutTab(nextTab)
  }

  const clampManualWidth = width => {
    return Math.min(
      ARTICLE_MAX_MANUAL_WIDTH,
      Math.max(ARTICLE_MIN_MANUAL_WIDTH, Math.round(Number(width) || 0))
    )
  }

  const applyManualWidthInput = () => {
    const parsed = Number(articleManualWidthInput)
    if (!Number.isFinite(parsed)) {
      setArticleManualWidthInput(String(articleManualWidth || 1080))
      return
    }

    const clamped = clampManualWidth(parsed)
    onArticleManualWidthChange?.(clamped)
    setArticleManualWidthInput(String(clamped))
  }

  const resetArticleWidth = () => {
    const defaultPreset =
      ARTICLE_WIDTH_PRESETS.find(option => option.id === 'level4') || ARTICLE_WIDTH_PRESETS[0]
    const defaultWidth = Number(defaultPreset?.maxWidth) || 1080
    onArticleWidthModeChange?.('preset')
    if (defaultPreset?.id) {
      onArticleWidthPresetChange?.(defaultPreset.id)
    }
    onArticleManualWidthChange?.(defaultWidth)
    setArticleManualWidthInput(String(defaultWidth))
    onArticleWidthFrameVisibleChange?.(false)
  }

  const openArticleLayoutModal = (tab = 'width') => {
    closeAllModals()
    announceModalOpen()
    setShowArticleLayoutModal(true)
    switchArticleLayoutTab(tab)
    setArticleManualWidthInput(String(articleManualWidth || 1080))

    if (articleLayoutButtonRef.current) {
      const rect = articleLayoutButtonRef.current.getBoundingClientRect()
      setModalPosition({
        x: Math.min(Math.max(20, rect.left), window.innerWidth - 320),
        y: rect.bottom + 10,
      })
      return
    }

    setModalPosition({
      x: Math.max(20, window.innerWidth / 2 - 150),
      y: Math.max(20, window.innerHeight / 2 - 160),
    })
  }

  const applyJsonToEditor = () => {
    if (!editor) return

    try {
      const parsed = JSON.parse(jsonText)
      if (!parsed || parsed.type !== 'doc') {
        throw new Error('JSON должен содержать корневой объект документа ProseMirror с type="doc"')
      }

      editor.commands.setContent(parsed)
      setJsonError(null)
    } catch (e) {
      setJsonError(e?.message || 'Не удалось применить JSON')
    }
  }

  const copyJsonToClipboard = async () => {
    const text = jsonText || ''

    try {
      await navigator.clipboard.writeText(text)
      return
    } catch {
      // ignore
    }

    try {
      const el = document.createElement('textarea')
      el.value = text
      el.setAttribute('readonly', '')
      el.style.position = 'fixed'
      el.style.left = '-9999px'
      document.body.appendChild(el)
      el.select()
      document.execCommand('copy')
      el.remove()
    } catch {
      // ignore
    }
  }

  const openCustomStyleModal = (style = null) => {
    closeAllModals()
    announceModalOpen()
    setEditingStyle(style)
    setShowCustomStyleModal(true)
    
    setModalPosition({
      x: window.innerWidth / 2 - 200,
      y: window.innerHeight / 2 - 250
    })
  }

  const handleEditStyle = (style) => {
    openCustomStyleModal(style)
  }

  const applyLinkStyle = (styleId) => {
    if (!editor) return
    
    const { from, to } = editor.state.selection
    if (from === to) return
    
    editor.chain()
      .focus()
      .setTextSelection({ from, to })
      .unsetMark('highlight')
      .unsetMark('textStyle')
      .run()
    
    const isCustomStyle = styleId.startsWith('custom_')
    let styleConfig = null
    
    if (isCustomStyle) {
      styleConfig = customLinkStyles.find(s => s.id === styleId)
    } else {
      styleConfig = linkStyles.find(s => s.id === styleId)
    }
    
    if (!styleConfig) {
      switch (styleId) {
        case 'button':
          editor.chain()
            .focus()
            .setTextSelection({ from, to })
            .setBackgroundColor('#3b82f6')
            .setColor('#ffffff')
            .setMark('textStyle', { backgroundColor: '#3b82f6', color: '#ffffff' })
            .run()
          break
          
        case 'highlighted':
          editor.chain()
            .focus()
            .setTextSelection({ from, to })
            .setHighlight({ color: '#fef3c7' })
            .run()
          break
          
        case 'dashed':
          editor.chain()
            .focus()
            .setTextSelection({ from, to })
            .setMark('textStyle', { 
              textDecoration: 'underline dashed #3b82f6',
              color: '#3b82f6'
            })
            .run()
          break
          
        case 'no-underline':
          editor.chain()
            .focus()
            .setTextSelection({ from, to })
            .setMark('textStyle', { 
              textDecoration: 'none',
              color: '#3b82f6',
              fontWeight: 'bold'
            })
            .run()
          break
          
        case 'colored':
          editor.chain()
            .focus()
            .setTextSelection({ from, to })
            .setBackgroundColor('#e0f2fe')
            .setColor('#0369a1')
            .run()
          break
          
        default:
          editor.chain()
            .focus()
            .setTextSelection({ from, to })
            .setMark('textStyle', { 
              color: '#2563eb',
              textDecoration: 'underline'
            })
            .run()
          break
      }
      return
    }
    
    if (isCustomStyle && styleConfig) {
      let styleProps = {}
      
      if (styleConfig.color) {
        styleProps.color = styleConfig.color
      }
      
      if (styleConfig.bgColor && styleConfig.bgColor !== 'transparent') {
        styleProps.backgroundColor = styleConfig.bgColor
      }
      
      if (styleConfig.underline) {
        styleProps.textDecoration = `underline ${styleConfig.underlineStyle}`
      }
      
      editor.chain()
        .focus()
        .setTextSelection({ from, to })
        .setMark('textStyle', styleProps)
        .run()
        
      if (styleConfig.bold) {
        editor.chain().focus().setTextSelection({ from, to }).toggleBold().run()
      }
      
      if (styleConfig.italic) {
        editor.chain().focus().setTextSelection({ from, to }).toggleItalic().run()
      }
    }
  }

  const createCustomStyle = (newStyle) => {
    setCustomLinkStyles([...customLinkStyles, newStyle])
  }

useEffect(() => {
  const handleClickOutside = (event) => {
    if (blockClose) return
    
    const isModal = event.target.closest('.modal, .link-modal, .custom-style-modal')
    const isBackdrop = event.target === backdropRef.current
    
    if (!isModal || isBackdrop) {
      closeAllModals()
    }
  }

  document.addEventListener('mousedown', handleClickOutside)
  return () => document.removeEventListener('mousedown', handleClickOutside)
}, [blockClose, closeAllModals])

  /* ================= EXPORT / IMPORT ================= */

  const sanitizeFileBaseName = (name) => {
    const cleaned = String(name || 'document')
      .trim()
      .replace(/[\\/:*?"<>|]+/g, '_')
      .replace(/\s+/g, ' ')

    return cleaned || 'document'
  }

  const downloadBlob = ({ blob, fileName }) => {
    const url = URL.createObjectURL(blob)

    const a = document.createElement('a')
    a.href = url
    a.download = fileName
    document.body.appendChild(a)
    a.click()
    a.remove()

    setTimeout(() => URL.revokeObjectURL(url), 1000)
  }

  const downloadTextFile = ({ text, mimeType, fileName, bom = false }) => {
    const parts = bom ? ['\ufeff', text] : [text]
    const blob = new Blob(parts, { type: `${mimeType};charset=utf-8` })
    downloadBlob({ blob, fileName })
  }

  const handleExport = ({ format, fileBaseName }) => {
    if (!editor) return

    const base = sanitizeFileBaseName(fileBaseName)
    const baseNoExt =
      base.replace(/\.(json|html|htm|txt|md|doc|docx|pdf|xls|xlsx)$/i, '') || 'document'

    if (format === 'pdf') {
      const html = editor.getHTML?.() ?? ''
      const page = buildWordHtmlDocument({ html, title: baseNoExt })

      const w = window.open('', '_blank', 'noopener,noreferrer')
      if (!w) {
        // popup blocked
        downloadTextFile({
          text: page,
          mimeType: 'text/html',
          fileName: `${baseNoExt}.html`,
        })
        return
      }

      w.document.open()
      w.document.write(page)
      w.document.close()
      w.focus()

      setTimeout(() => {
        try {
          w.print()
        } catch {
          // ignore
        }
      }, 250)

      return
    }

    if (format === 'doc') {
      const html = editor.getHTML?.() ?? ''
      const page = buildWordHtmlDocument({ html, title: baseNoExt })

      downloadTextFile({
        text: page,
        mimeType: 'application/msword',
        fileName: `${baseNoExt}.doc`,
        bom: true,
      })
      return
    }

    if (format === 'docx') {
      const text =
        editor.getText?.({ blockSeparator: '\n\n' }) ?? editor.getText?.() ?? ''

      const blob = createDocxBlobFromPlainText(text)
      downloadBlob({ blob, fileName: `${baseNoExt}.docx` })
      return
    }

    if (format === 'xls') {
      const html = editor.getHTML?.() ?? ''
      const page = buildExcelHtmlDocument({
        html,
        title: baseNoExt,
        sheetName: 'Sheet1',
      })

      downloadTextFile({
        text: page,
        mimeType: 'application/vnd.ms-excel',
        fileName: `${baseNoExt}.xls`,
        bom: true,
      })
      return
    }

    if (format === 'html') {
      const html = editor.getHTML?.() ?? ''
      downloadTextFile({
        text: html,
        mimeType: 'text/html',
        fileName: `${baseNoExt}.html`,
      })
      return
    }

    if (format === 'txt') {
      const text = editor.getText?.() ?? ''
      downloadTextFile({
        text,
        mimeType: 'text/plain',
        fileName: `${baseNoExt}.txt`,
      })
      return
    }

    const json =
      editor.getJSON?.() ?? { type: 'doc', content: [{ type: 'paragraph' }] }
    downloadTextFile({
      text: JSON.stringify(json, null, 2),
      mimeType: 'application/json',
      fileName: `${baseNoExt}.json`,
    })
  }

  const escapeHtml = (s) => {
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;')
  }

  const inferFormatFromName = (name) => {
    const n = String(name || '').toLowerCase()
    if (n.endsWith('.json')) return 'json'
    if (n.endsWith('.html') || n.endsWith('.htm')) return 'html'
    if (n.endsWith('.doc') || n.endsWith('.xls')) return 'html'
    if (n.endsWith('.txt') || n.endsWith('.md')) return 'txt'
    if (n.endsWith('.docx')) return 'docx'
    if (n.endsWith('.pdf')) return 'pdf'
    if (n.endsWith('.xlsx')) return 'xlsx'
    return null
  }

  const looksLikeHtml = (text) => {
    const t = String(text || '').trim().toLowerCase()
    return t.startsWith('<!doctype') || t.startsWith('<html') || t.includes('<body') || t.includes('<table')
  }

  const normalizeHtmlForImport = (html) => {
    const input = String(html ?? '')
    try {
      const parsed = new DOMParser().parseFromString(input, 'text/html')
      const body = parsed?.body
      if (!body) return input

      const images = Array.from(body.querySelectorAll('img'))
      for (const img of images) {
        const src = String(img.getAttribute('src') || '').trim()
        if (!src) continue

        const imageBlockEl = parsed.createElement('div')
        imageBlockEl.setAttribute('data-image-block', '')
        imageBlockEl.setAttribute('src', src)

        const caption = String(img.getAttribute('alt') || '').trim()
        if (caption) {
          imageBlockEl.setAttribute('caption', caption)
          imageBlockEl.setAttribute('showCaption', 'true')
        }

        const widthCandidates = [
          img.getAttribute('width'),
          img.style?.width,
          img.getAttribute('data-width'),
        ]
        let widthPx = null
        for (const candidate of widthCandidates) {
          if (!candidate) continue
          const n = Number.parseFloat(String(candidate).replace(/[^0-9.]/g, ''))
          if (Number.isFinite(n) && n > 0) {
            widthPx = Math.round(Math.min(1800, Math.max(120, n)))
            break
          }
        }
        if (widthPx != null) {
          imageBlockEl.setAttribute('width', String(widthPx))
        }

        img.replaceWith(imageBlockEl)
      }

      const bodyHtml = body.innerHTML
      return typeof bodyHtml === 'string' && bodyHtml.trim() ? bodyHtml : input
    } catch {
      return input
    }
  }

  const fileNameFromUrl = (url) => {
    try {
      const u = new URL(url)
      const last = u.pathname.split('/').filter(Boolean).pop() || 'file'
      return decodeURIComponent(last) || 'file'
    } catch {
      return (String(url || '').split('/').pop() || 'file').trim() || 'file'
    }
  }

  const setDocumentToFileBlock = async ({ file, url }) => {
    if (!editor) return

    let attrs = {
      fileId: null,
      url: null,
      name: 'Документ',
      size: '',
      mimeType: '',
    }

    if (file) {
      try {
        const docUploadFile = getDocumentationUploadFile()
        if (docUploadFile) {
          const path = await docUploadFile(file)
          if (path) {
            attrs = {
              ...attrs,
              fileId: null,
              url: path,
              name: file.name || 'Документ',
              size: file.size || '',
              mimeType: file.type || '',
            }
          }
        }
        if (!attrs.url) {
          const saved = await saveFile(file)
          attrs = {
            ...attrs,
            fileId: saved.id,
            url: null,
            name: saved.name || file.name || 'Документ',
            size: saved.size || file.size || '',
            mimeType: saved.mimeType || file.type || '',
          }
        }
      } catch {
        const blobUrl = URL.createObjectURL(file)
        attrs = {
          ...attrs,
          fileId: null,
          url: blobUrl,
          name: file.name || 'Документ',
          size: file.size || '',
          mimeType: file.type || '',
        }
      }
    } else if (url) {
      attrs = {
        ...attrs,
        fileId: null,
        url: String(url),
        name: fileNameFromUrl(url),
      }
    }

    editor.commands.setContent({
      type: 'doc',
      content: [
        {
          type: 'fileBlock',
          attrs,
        },
      ],
    })
  }

  const importFromText = async ({ text, hintName = '' }) => {
    if (!editor) return

    const fmt = inferFormatFromName(hintName)
    const trimmed = String(text ?? '').trim()

    if (fmt === 'json' || (!fmt && trimmed.startsWith('{'))) {
      try {
        const parsed = JSON.parse(text)
        const doc =
          parsed?.type === 'doc'
            ? parsed
            : parsed?.content?.type === 'doc'
              ? parsed.content
              : null
        if (!doc) {
          throw new Error('JSON не содержит документ ProseMirror с type="doc"')
        }
        editor.commands.setContent(doc)
        return
      } catch (e) {
        if (fmt === 'json') {
          throw new Error(`Не удалось импортировать JSON: ${e?.message || e}`)
        }
      }
    }

    if (fmt === 'html' || (!fmt && looksLikeHtml(trimmed))) {
      editor.commands.setContent(normalizeHtmlForImport(text))
      return
    }

    const escaped = escapeHtml(text ?? '')
    const html = `<p>${escaped
      .replace(/\r\n/g, '\n')
      .replace(/\n{2,}/g, '</p><p>')
      .replace(/\n/g, '<br />')}</p>`
    editor.commands.setContent(html)
  }

  const handleImportFile = async (file) => {
    if (!file) throw new Error('Файл не выбран')

    const name = String(file.name || '').toLowerCase()

    if (name.endsWith('.pdf') || name.endsWith('.xlsx')) {
      await setDocumentToFileBlock({ file })
      return
    }

    if (name.endsWith('.docx')) {
      try {
        const ab = typeof file.arrayBuffer === 'function' ? await file.arrayBuffer() : null
        if (!ab) throw new Error('Не удалось прочитать файл .docx')

        const html = await docxArrayBufferToHtml(ab)
        editor.commands.setContent(normalizeHtmlForImport(html))
        return
      } catch {
        await setDocumentToFileBlock({ file })
        return
      }
    }

    let text = ''
    try {
      text = typeof file.text === 'function' ? await file.text() : ''
    } catch {
      text = ''
    }

    if (!text) throw new Error('Не удалось прочитать содержимое файла')

    if ((name.endsWith('.doc') || name.endsWith('.xls')) && !looksLikeHtml(text)) {
      await setDocumentToFileBlock({ file })
      return
    }

    await importFromText({ text, hintName: file.name })
  }

  const handleImportUrl = async (url) => {
    if (!url) throw new Error('URL не указан')

    const hintName = fileNameFromUrl(url)
    const lowerHintName = String(hintName || '').toLowerCase()

    if (lowerHintName.endsWith('.pdf') || lowerHintName.endsWith('.xlsx')) {
      await setDocumentToFileBlock({ url })
      return
    }

    if (lowerHintName.endsWith('.docx')) {
      try {
        const response = await fetch(url)
        if (!response.ok) {
          throw new Error(`Не удалось загрузить DOCX по URL: ${response.status} ${response.statusText}`)
        }

        const ab = await response.arrayBuffer()
        const html = await docxArrayBufferToHtml(ab)
        editor.commands.setContent(normalizeHtmlForImport(html))
        return
      } catch {
        await setDocumentToFileBlock({ url })
        return
      }
    }

    let response
    try {
      response = await fetch(url)
    } catch (e) {
      throw new Error(`Не удалось загрузить данные по URL: ${e?.message || e}`)
    }

    if (!response.ok) {
      throw new Error(`Не удалось загрузить данные по URL: ${response.status} ${response.statusText}`)
    }

    const text = await response.text()

    if ((lowerHintName.endsWith('.doc') || lowerHintName.endsWith('.xls')) && !looksLikeHtml(text)) {
      await setDocumentToFileBlock({ url })
      return
    }

    await importFromText({ text, hintName })
  }

  useEffect(() => {
    if (!isBgPaintingMode || !editor) return

    const handleMouseUp = () => {
      setTimeout(() => {
        applyBgColorToSelection()
      }, 10)
    }

    document.body.style.cursor = 'crosshair'
    
    document.addEventListener('mouseup', handleMouseUp)
    
    return () => {
      document.removeEventListener('mouseup', handleMouseUp)
      document.body.style.cursor = ''
    }
  }, [isBgPaintingMode, bgColor, editor])

  const handleMouseDown = useCallback((e) => {
    const isDragHandle = e.target.classList.contains('modal-drag-handle') ||
        e.target.closest('.modal-header') ||
        e.target.closest('.link-modal-header') ||
        e.target.closest('.custom-style-modal-header');
    const isToolbarOverflowModalSurface = e.target.closest('.toolbar-overflow-modal') &&
        !e.target.closest('button, input, textarea, select, a, [role="button"]');
    
    const isInput = e.target.tagName === 'INPUT' || 
                    e.target.tagName === 'TEXTAREA' ||
                    e.target.tagName === 'SELECT' ||
                    e.target.closest('input') ||
                    e.target.closest('textarea') ||
                    e.target.closest('select') ||
                    e.target.closest('button') && !isDragHandle;
    
    if ((isDragHandle || isToolbarOverflowModalSurface) && !isInput) {
      const modalElement = e.target.closest('.modal, .link-modal, .custom-style-modal');
      if (modalElement) {
        const rect = modalElement.getBoundingClientRect();
        draggedModalRef.current = modalElement
        setDragOffset({
          x: e.clientX - rect.left,
          y: e.clientY - rect.top
        });
        setIsDragging(true);
        e.preventDefault();
      }
    }
  }, [])

  const handleMouseMove = useCallback((e) => {
    if (!isDragging) return
    
    const newX = e.clientX - dragOffset.x
    const newY = e.clientY - dragOffset.y

    const modalEl = draggedModalRef.current
    const modalWidth = modalEl?.offsetWidth || 0
    const modalHeight = modalEl?.offsetHeight || 0

    const maxX = Math.max(0, window.innerWidth - modalWidth)
    const maxY = Math.max(0, window.innerHeight - modalHeight)
    const boundedX = Math.max(0, Math.min(newX, maxX))
    const boundedY = Math.max(0, Math.min(newY, maxY))
    
    setModalPosition(prev => ({
      ...prev,
      x: boundedX,
      y: boundedY
    }))
  }, [isDragging, dragOffset])

  const handleMouseUp = useCallback(() => {
    setIsDragging(false)
    draggedModalRef.current = null
  }, [])

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      document.body.style.userSelect = 'none'
      document.body.style.cursor = 'move'
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
        document.body.style.userSelect = ''
        document.body.style.cursor = ''
      }
    }
  }, [isDragging, handleMouseMove, handleMouseUp])

  const handleJsonResizeMouseDown = useCallback(
    e => {
      e.preventDefault()
      e.stopPropagation()

      if (!showJsonModal) return

      jsonResizeStateRef.current = {
        startX: e.clientX,
        startWidth: jsonModalWidth,
        startLeft: modalPosition.x,
      }
      setIsResizingJsonModal(true)
    },
    [showJsonModal, jsonModalWidth, modalPosition.x]
  )

  useEffect(() => {
    if (!isResizingJsonModal) return

    const handleMove = e => {
      const state = jsonResizeStateRef.current
      if (!state) return

      const deltaX = e.clientX - state.startX
      let nextWidth = state.startWidth + deltaX

      const minWidth = 200
      const maxWidthViewport = Math.min(860, window.innerWidth - 40)
      const maxWidthAtX = Math.max(
        minWidth,
        Math.min(maxWidthViewport, window.innerWidth - 20 - state.startLeft)
      )

      nextWidth = Math.max(minWidth, Math.min(maxWidthAtX, nextWidth))
      setJsonModalWidth(nextWidth)
    }

    const handleUp = () => {
      setIsResizingJsonModal(false)
      jsonResizeStateRef.current = null
    }

    document.addEventListener('mousemove', handleMove)
    document.addEventListener('mouseup', handleUp)
    document.body.style.userSelect = 'none'
    document.body.style.cursor = 'ew-resize'

    return () => {
      document.removeEventListener('mousemove', handleMove)
      document.removeEventListener('mouseup', handleUp)
      document.body.style.userSelect = ''
      document.body.style.cursor = ''
    }
  }, [isResizingJsonModal])

  const fetchLinkPreview = async (url) => {
    if (!url || !url.trim()) {
      return null
    }

    try {
      const urlObj = new URL(url)
      const domain = urlObj.hostname
      
      return {
        title: domain,
        description: `Ссылка на ${domain}`,
        favicon: `https://www.google.com/s2/favicons?domain=${domain}&sz=64`,
        url: url
      }
    } catch (error) {
      return null
    }
  }

  const getToolbarButtonTitle = (value) => {
    if (typeof value !== 'string') return ''
    const text = value.trim()
    if (!text || text.length > 120) return ''
    if (/^\?+$/.test(text) || text.includes('???')) return ''
    const fragments = ['\u0420\u00a0', '\u0420\u040e', '\u0421\u0402', '\u0432\u0402']
    if (fragments.some(fragment => text.includes(fragment))) return ''
    const oddCyrillicCount = (text.match(/[\u0400-\u040f\u0450-\u045f]/g) || []).length
    if (oddCyrillicCount >= 3) return ''
    const weirdMojibakeMarkers = (text.match(/(?:вЂ|РЋ|РЎ|С›|Сћ)/g) || []).length
    const rCount = (text.match(/\u0420/g) || []).length
    const vCount = (text.match(/\u0412/g) || []).length
    if (weirdMojibakeMarkers >= 2 || (rCount >= 4 && vCount >= 4 && text.length > 20)) return ''
    return text
  }

  useEffect(() => {
    const sanitizeDomTitle = event => {
      const target = event.target
      if (!(target instanceof Element)) return

      const titledNode = target.closest('[title]')
      if (!titledNode) return

      const rawTitle = titledNode.getAttribute('title')
      if (rawTitle == null) return

      if (!getToolbarButtonTitle(rawTitle)) {
        titledNode.removeAttribute('title')
      }
    }

    document.addEventListener('mouseover', sanitizeDomTitle, true)
    document.addEventListener('focusin', sanitizeDomTitle, true)

    return () => {
      document.removeEventListener('mouseover', sanitizeDomTitle, true)
      document.removeEventListener('focusin', sanitizeDomTitle, true)
    }
  }, [])




  const btn = (active, onClick, label, title = '') => (
    <button
      className={`toolbar-btn ${active ? 'active' : ''}`}
      onClick={e => {
        e.preventDefault()
        e.stopPropagation()
        onClick()
      }}
      title={getToolbarButtonTitle(title)}
    >
      {label}
    </button>
  )

  const currentAlignmentValue = getCurrentAlignmentValue()
  const selectedWidthPreset =
    ARTICLE_WIDTH_PRESETS.find(item => item.id === articleWidthPreset) || ARTICLE_WIDTH_PRESETS[0]
  const currentWidthLabel =
    articleWidthMode === 'manual'
      ? `${Math.round(Number(articleManualWidth) || 1080)}px`
      : getArticleWidthPresetText(selectedWidthPreset)

  const detectToolbarOverflow = useCallback(() => {
    const toolbarMainElement = toolbarMainRef.current
    if (!(toolbarMainElement instanceof HTMLElement)) return

    const mainRect = toolbarMainElement.getBoundingClientRect()
    if (!mainRect?.width) {
      setOverflowGroupIds(prev => (prev.length ? [] : prev))
      return
    }

    const nextOverflowGroupIds = TOOLBAR_GROUP_ORDER.filter(groupId => {
      const groupElement = toolbarGroupRefs.current[groupId]
      if (!(groupElement instanceof HTMLElement)) return false
      const groupRect = groupElement.getBoundingClientRect()
      return groupRect.right > mainRect.right - 1
    })

    setOverflowGroupIds(prev =>
      areStringArraysEqual(prev, nextOverflowGroupIds) ? prev : nextOverflowGroupIds
    )
  }, [])

  useEffect(() => {
    let raf = 0
    const schedule = () => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(detectToolbarOverflow)
    }

    schedule()

    const resizeObserver =
      typeof ResizeObserver !== 'undefined' ? new ResizeObserver(schedule) : null
    if (resizeObserver) {
      if (toolbarRootRef.current instanceof HTMLElement) {
        resizeObserver.observe(toolbarRootRef.current)
      }
      if (toolbarMainRef.current instanceof HTMLElement) {
        resizeObserver.observe(toolbarMainRef.current)
      }
      TOOLBAR_GROUP_ORDER.forEach(groupId => {
        const groupElement = toolbarGroupRefs.current[groupId]
        if (groupElement instanceof HTMLElement) {
          resizeObserver.observe(groupElement)
        }
      })
    }

    window.addEventListener('resize', schedule)

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', schedule)
      if (resizeObserver) {
        resizeObserver.disconnect()
      }
    }
  }, [
    articleManualWidth,
    articlePaddingFrameVisible,
    articleWidthFrameVisible,
    articleWidthMode,
    articleWidthPreset,
    detectToolbarOverflow,
    selectedFontSize,
    showToolbarOverflowModal,
    textColor,
    bgColor,
    toolbarRefreshTick,
  ])

  const openToolbarOverflowModal = () => {
    closeAllModals()
    announceModalOpen()
    setShowToolbarOverflowModal(true)

    if (toolbarOverflowTriggerRef.current) {
      const rect = toolbarOverflowTriggerRef.current.getBoundingClientRect()
      const toolbarRect =
        toolbarRootRef.current instanceof HTMLElement
          ? toolbarRootRef.current.getBoundingClientRect()
          : null

      if (toolbarRect) {
        const width = Math.round(toolbarRect.width)
        const x = Math.min(
          Math.max(20, Math.round(toolbarRect.left)),
          Math.max(20, window.innerWidth - width - 20)
        )
        const y = Math.min(
          Math.max(20, Math.round(toolbarRect.bottom) + 4),
          Math.max(20, window.innerHeight - 220)
        )

        setModalPosition({
          x,
          y,
          width,
        })
        return
      }

      const topAnchor = rect.bottom + 8
      setModalPosition({
        x: Math.min(Math.max(20, rect.left), Math.max(20, window.innerWidth - 380)),
        y: Math.min(Math.max(20, topAnchor), Math.max(20, window.innerHeight - 220)),
      })
      return
    }

    setModalPosition({
      x: Math.max(20, window.innerWidth / 2 - 180),
      y: Math.max(20, window.innerHeight / 2 - 180),
    })
  }

  const renderToolbarGroup = (groupId, { inOverflow = false } = {}) => {
    const isHiddenInMain = !inOverflow && overflowGroupIds.includes(groupId)
    const groupClassName = [
      'toolbar-group',
      inOverflow ? 'toolbar-group-in-overflow' : '',
      isHiddenInMain ? 'toolbar-group-overflow-hidden' : '',
    ]
      .filter(Boolean)
      .join(' ')

    const groupRef =
      inOverflow
        ? undefined
        : node => {
            if (node) {
              toolbarGroupRefs.current[groupId] = node
            } else {
              delete toolbarGroupRefs.current[groupId]
            }
          }

    if (groupId === 'text-style') {
      return (
        <div key={groupId} className={groupClassName} ref={groupRef}>
          {btn(
            editor.isActive('bold'),
            toggleBoldAction,
            <span className="bold-icon">B</span>,
            'Жирный',
          )}
          {btn(
            editor.isActive('italic'),
            toggleItalicAction,
            <span className="italic-icon">I</span>,
            'Курсив',
          )}
          {btn(
            editor.isActive('underline'),
            toggleUnderlineAction,
            <span className="underline-icon">U</span>,
            'Подчеркнутый',
          )}
          {btn(
            editor.isActive('strike'),
            toggleStrikeAction,
            <span style={{ textDecoration: 'line-through' }}>S</span>,
            'Зачеркнутый',
          )}
        </div>
      )
    }

    if (groupId === 'font-size') {
      return (
        <div key={groupId} className={groupClassName} ref={groupRef}>
          <FontSizeSelect
            editor={editor}
            selectedFontSize={selectedFontSize}
            setSelectedFontSize={setSelectedFontSize}
          />
        </div>
      )
    }

    if (groupId === 'alignment') {
      return (
        <div key={groupId} className={groupClassName} ref={groupRef}>
          {btn(
            currentAlignmentValue === 'left',
            () => setAlignment('left'),
            <>
              {/* Legacy SVG icon:
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M4 5h16v2H4zm0 4h10v2H4zm0 4h16v2H4zm0 4h10v2H4z" />
              </svg>
              */}
              <FormatAlignLeftRoundedIcon
                aria-hidden="true"
                fontSize="inherit"
                style={{ width: 16, height: 16, fontSize: 16 }}
              />
            </>,
            'Выравнивание по левому краю',
          )}
          {btn(
            currentAlignmentValue === 'center',
            () => setAlignment('center'),
            <>
              {/* Legacy SVG icon:
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M4 5h16v2H4zm2 4h12v2H6zm-2 4h16v2H4zm2 4h12v2H6z" />
              </svg>
              */}
              <FormatAlignCenterRoundedIcon
                aria-hidden="true"
                fontSize="inherit"
                style={{ width: 16, height: 16, fontSize: 16 }}
              />
            </>,
            'Выравнивание по центру',
          )}
          {btn(
            currentAlignmentValue === 'right',
            () => setAlignment('right'),
            <>
              {/* Legacy SVG icon:
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M4 5h16v2H4zm6 4h10v2H10zm-6 4h16v2H4zm6 4h10v2H10z" />
              </svg>
              */}
              <FormatAlignRightRoundedIcon
                aria-hidden="true"
                fontSize="inherit"
                style={{ width: 16, height: 16, fontSize: 16 }}
              />
            </>,
            'Выравнивание по правому краю',
          )}
          {btn(
            currentAlignmentValue === 'justify',
            () => setAlignment('justify'),
            <>
              {/* Legacy SVG icon:
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M4 5h16v2H4zm0 4h16v2H4zm0 4h16v2H4zm0 4h16v2H4z" />
              </svg>
              */}
              <FormatAlignJustifyRoundedIcon
                aria-hidden="true"
                fontSize="inherit"
                style={{ width: 16, height: 16, fontSize: 16 }}
              />
            </>,
            'Выравнивание по ширине',
          )}
        </div>
      )
    }

    if (groupId === 'text-color') {
      return (
        <div key={groupId} className={groupClassName} ref={groupRef}>
          <div className="color-tool-container">
            <button
              ref={textColorButtonRef}
              className="color-main-btn text-color-btn"
              style={{
                color: textColor,
              }}
              onClick={e => {
                e.stopPropagation()
                applyTextColor(textColor)
              }}
              title="Применить цвет текста"
            >
              A
            </button>
            <button
              ref={textSelectButtonRef}
              className="color-select-btn"
              onClick={e => {
                e.stopPropagation()
                openTextColorModal()
              }}
              title="Выбрать цвет текста"
            >
              <>
                {/* Legacy SVG icon:
                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z" />
                </svg>
                */}
                <ChevronRightRoundedIcon
                  aria-hidden="true"
                  fontSize="inherit"
                  style={{ width: 12, height: 12, fontSize: 12 }}
                />
              </>
            </button>
          </div>
        </div>
      )
    }

    if (groupId === 'bg-color') {
      return (
        <div key={groupId} className={groupClassName} ref={groupRef}>
          <div className="color-tool-container">
            <button
              ref={bgColorButtonRef}
              className={`color-main-btn bg-color-btn ${isBgPaintingMode ? 'painting-mode' : ''}`}
              style={{
                backgroundColor: bgColor,
                color: textColor,
              }}
              onClick={e => {
                e.stopPropagation()
                setIsBgPaintingMode(!isBgPaintingMode)
              }}
              title={
                isBgPaintingMode
                  ? 'Выключить режим заливки фона'
                  : 'Включить режим заливки фона'
              }
            >
              A
            </button>
            <button
              ref={bgSelectButtonRef}
              className="color-select-btn"
              onClick={e => {
                e.stopPropagation()
                openBgColorModal()
              }}
              title="Выбрать цвет фона"
            >
              <>
                {/* Legacy SVG icon:
                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z" />
                </svg>
                */}
                <ChevronRightRoundedIcon
                  aria-hidden="true"
                  fontSize="inherit"
                  style={{ width: 12, height: 12, fontSize: 12 }}
                />
              </>
            </button>
          </div>
        </div>
      )
    }

    if (groupId === 'link') {
      return (
        <div key={groupId} className={groupClassName} ref={groupRef}>
          <button
            ref={linkButtonRef}
            className={`toolbar-btn ${editor.isActive('link') ? 'active' : ''}`}
            onClick={e => {
              e.preventDefault()
              e.stopPropagation()
              openLinkModal()
            }}
            title="Вставить или редактировать ссылку"
          >
            <>
              {/* Legacy SVG icon:
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M3.9 12c0-1.71 1.39-3.1 3.1-3.1h4V7H7c-2.76 0-5 2.24-5 5s2.24 5 5 5h4v-1.9H7c-1.71 0-3.1-1.39-3.1-3.1zM8 13h8v-2H8v2zm9-6h-4v1.9h4c1.71 0 3.1 1.39 3.1 3.1s-1.39 3.1-3.1 3.1h-4V17h4c2.76 0 5-2.24 5-5s-2.24-5-5-5z" />
              </svg>
              */}
              <LinkRoundedIcon
                aria-hidden="true"
                fontSize="inherit"
                style={{ width: 16, height: 16, fontSize: 16 }}
              />
            </>
          </button>
        </div>
      )
    }

    if (groupId === 'import-export') {
      return (
        <div key={groupId} className={groupClassName} ref={groupRef}>
          <button
            ref={importButtonRef}
            className={`toolbar-btn ${showImportModal ? 'active' : ''}`}
            onClick={e => {
              e.preventDefault()
              e.stopPropagation()
              openImportModal()
            }}
            title="Импорт"
          >
            <>
              {/* Legacy SVG icon:
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M5 20h14v-2H5v2zM12 2l-5 5h3v6h4V7h3l-5-5z" />
              </svg>
              */}
              <UploadRoundedIcon
                aria-hidden="true"
                fontSize="inherit"
                style={{ width: 16, height: 16, fontSize: 16 }}
              />
            </>
          </button>
          <button
            ref={exportButtonRef}
            className={`toolbar-btn ${showExportModal ? 'active' : ''}`}
            onClick={e => {
              e.preventDefault()
              e.stopPropagation()
              openExportModal()
            }}
            title="Экспорт"
          >
            <>
              {/* Legacy SVG icon:
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M5 20h14v-2H5v2zM12 2v10h4l-5 5-5-5h4V2h2z" />
              </svg>
              */}
              <DownloadRoundedIcon
                aria-hidden="true"
                fontSize="inherit"
                style={{ width: 16, height: 16, fontSize: 16 }}
              />
            </>
          </button>
          <button
            ref={jsonButtonRef}
            className={`toolbar-btn ${showJsonModal ? 'active' : ''}`}
            onClick={e => {
              e.preventDefault()
              e.stopPropagation()
              openJsonModal()
            }}
            title="JSON"
          >
            <>
              {/* Legacy SVG icon:
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M8 5c-1.1 0-2 .9-2 2v3c0 .6-.4 1-1 1 .6 0 1 .4 1 1v3c0 1.1.9 2 2 2h1v-2H8v-3c0-.6-.4-1-1-1 .6 0 1-.4 1-1V7h1V5H8zm8 0h-1v2h1v3c0 .6.4 1 1 1-.6 0-1 .4-1 1v3h-1v2h1c1.1 0 2-.9 2-2v-3c0-.6.4-1 1-1-.6 0-1-.4-1-1V7c0-1.1-.9-2-2-2z" />
              </svg>
              */}
              <DataObjectRoundedIcon
                aria-hidden="true"
                fontSize="inherit"
                style={{ width: 16, height: 16, fontSize: 16 }}
              />
            </>
          </button>
        </div>
      )
    }

    if (groupId === 'article-layout') {
      return (
        <div key={groupId} className={groupClassName} ref={groupRef}>
          <button
            ref={articleLayoutButtonRef}
            className={`toolbar-btn ${showArticleLayoutModal || articleWidthFrameVisible || articlePaddingFrameVisible ? 'active' : ''}`}
            onClick={e => {
              e.preventDefault()
              e.stopPropagation()
              openArticleLayoutModal(articleLayoutTab)
            }}
            title={`\u041f\u0430\u0440\u0430\u043c\u0435\u0442\u0440\u044b \u0441\u0442\u0430\u0442\u044c\u0438: ${currentWidthLabel}`}
          >
            <>
              {/* Legacy SVG icon:
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M3 5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5zm2 0v11h14V5H5zm4 15h6v2H9v-2z" />
              </svg>
              */}
              <DesktopWindowsRoundedIcon
                aria-hidden="true"
                fontSize="inherit"
                style={{ width: 16, height: 16, fontSize: 16 }}
              />
            </>
          </button>
        </div>
      )
    }

    if (groupId === 'reset') {
      return (
        <div key={groupId} className={groupClassName} ref={groupRef}>
          {btn(
            hasAnyStyle(),
            resetAllStyles,
            <>
              {/* Legacy SVG icon:
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z" />
              </svg>
              */}
              <RestartAltRoundedIcon
                aria-hidden="true"
                fontSize="inherit"
                style={{ width: 16, height: 16, fontSize: 16 }}
              />
            </>,
            'Сбросить форматирование',
          )}
        </div>
      )
    }

    return null
  }

  return (
    <>
      <div className="toolbar" ref={toolbarRootRef}>
        <div className="toolbar-main" ref={toolbarMainRef}>
          {TOOLBAR_GROUP_ORDER.map(groupId => renderToolbarGroup(groupId))}
        </div>

        <div className="toolbar-right">
          {overflowGroupIds.length > 0 && (
            <button
              ref={toolbarOverflowTriggerRef}
              type="button"
              className={`toolbar-overflow-trigger ${showToolbarOverflowModal ? 'active' : ''}`}
              onClick={e => {
                e.preventDefault()
                e.stopPropagation()
                openToolbarOverflowModal()
              }}
              title="More tools"
            >
              ...
            </button>
          )}

          <div className="toolbar-group toolbar-anchor-group">
            {btn(
              anchorModeEnabled,
              () => onToggleAnchorMode?.(),
              '#',
              'Режим якорей',
            )}
          </div>
        </div>
      </div>

      {(
        showTextColorModal ||
        showBgColorModal ||
        showLinkModal ||
        showCustomStyleModal ||
        showExportModal ||
        showImportModal ||
        showJsonModal ||
        showArticleLayoutModal ||
        showToolbarOverflowModal
      ) &&
        renderModalPortal(
          <div 
            ref={backdropRef}
            className="modal-backdrop"
            style={{ zIndex: 2147482900 }}
          />
        )}

      {showTextColorModal &&
        renderModalPortal(
          <ColorModal 
            type="text"
            currentColor={textColor}
            customColors={customTextColors}
            onApplyColor={applyTextColor}
            onSaveCustomColor={saveCustomColor}
            onRemoveCustomColor={removeCustomColor}
            onClose={closeAllModals}
            position={modalPosition}
            isDragging={isDragging}
            onMouseDown={handleMouseDown}
            blockClose={blockClose}
            setBlockClose={setBlockClose}
          />
        )}
      
      {showBgColorModal &&
        renderModalPortal(
          <ColorModal 
            type="bg"
            currentColor={bgColor}
            customColors={customBgColors}
            onApplyColor={applyBgColor}
            onSaveCustomColor={saveCustomColor}
            onRemoveCustomColor={removeCustomColor}
            onClose={closeAllModals}
            position={modalPosition}
            isDragging={isDragging}
            onMouseDown={handleMouseDown}
            blockClose={blockClose}
            setBlockClose={setBlockClose}
          />
        )}
      
      {showLinkModal &&
        renderModalPortal(
          <LinkModal
            editor={editor}
            onClose={closeAllModals}
            position={modalPosition}
            isDragging={isDragging}
            onMouseDown={handleMouseDown}
            blockClose={blockClose}
            setBlockClose={setBlockClose}
            customLinkStyles={customLinkStyles}
            removeCustomStyle={removeCustomStyle}
            onOpenCustomStyleModal={() => openCustomStyleModal()}
            onEditStyle={handleEditStyle}
            applyLinkStyle={applyLinkStyle}
            fetchLinkPreview={fetchLinkPreview}
          />
        )}
      
      {showCustomStyleModal &&
        renderModalPortal(
          <CustomStyleModal
            onClose={closeAllModals}
            position={modalPosition}
            onMouseDown={handleMouseDown}
            blockClose={blockClose}
            setBlockClose={setBlockClose}
            onCreateCustomStyle={createCustomStyle}
            onUpdateCustomStyle={updateCustomStyle}
            editingStyle={editingStyle}
            standardStyles={linkStyles}
          />
        )}

      {showExportModal &&
        renderModalPortal(
          <ExportModal
            onClose={closeAllModals}
            position={modalPosition}
            isDragging={isDragging}
            onMouseDown={handleMouseDown}
            setBlockClose={setBlockClose}
            onExport={handleExport}
          />
        )}

      {showImportModal &&
        renderModalPortal(
          <ImportModal
            onClose={closeAllModals}
            position={modalPosition}
            isDragging={isDragging}
            onMouseDown={handleMouseDown}
            setBlockClose={setBlockClose}
            onImportFile={handleImportFile}
            onImportUrl={handleImportUrl}
          />
        )}

      {showToolbarOverflowModal &&
        renderModalPortal(
          <div
            className={`modal toolbar-overflow-modal ${isDragging ? 'dragging' : ''}`}
            style={{
              left: `${modalPosition.x}px`,
              top: `${modalPosition.y}px`,
              width: typeof modalPosition.width === 'number' ? `${modalPosition.width}px` : undefined,
              maxWidth: typeof modalPosition.width === 'number' ? `${modalPosition.width}px` : undefined,
            }}
            onMouseDown={handleMouseDown}
            onClick={e => e.stopPropagation()}
          >
            <div className="doc-io-modal-content">
              <div className="toolbar-overflow-modal-close-row">
                <button
                  className="close-modal-btn"
                  onMouseDown={e => {
                    e.preventDefault()
                    e.stopPropagation()
                  }}
                  onClick={e => {
                    e.preventDefault()
                    e.stopPropagation()
                    closeAllModals()
                  }}
                  title={'\u0417\u0430\u043a\u0440\u044b\u0442\u044c'}
                >
                  x
                </button>
              </div>

              <div className="toolbar-overflow-groups">
                {overflowGroupIds.length ? (
                  overflowGroupIds.map(groupId => renderToolbarGroup(groupId, { inOverflow: true }))
                ) : (
                  <div className="toolbar-overflow-empty">{'\u0412\u0441\u0435 \u0438\u043d\u0441\u0442\u0440\u0443\u043c\u0435\u043d\u0442\u044b \u043f\u043e\u043c\u0435\u0449\u0430\u044e\u0442\u0441\u044f \u0432 \u043f\u0430\u043d\u0435\u043b\u0438.'}</div>
                )}
              </div>
            </div>
          </div>
        )}

      {showArticleLayoutModal && renderModalPortal(
        <div
          className={`modal article-layout-modal ${isDragging ? 'dragging' : ''}`}
          style={{
            left: `${modalPosition.x}px`,
            top: `${modalPosition.y}px`,
          }}
          onClick={e => e.stopPropagation()}
        >
          <div className="doc-io-modal-content">
            <div className="modal-header" onMouseDown={handleMouseDown}>
              <div className="modal-drag-handle">{'\u041f\u0430\u0440\u0430\u043c\u0435\u0442\u0440\u044b \u0441\u0442\u0430\u0442\u044c\u0438'}</div>
              <button
                className="close-modal-btn"
                onMouseDown={e => {
                  e.preventDefault()
                  e.stopPropagation()
                }}
                onClick={e => {
                  e.preventDefault()
                  e.stopPropagation()
                  closeAllModals()
                }}
                title={'\u0417\u0430\u043a\u0440\u044b\u0442\u044c'}
              >
                x
              </button>
            </div>

            <div className="article-layout-tabs">
              <button
                className={`article-layout-tab ${articleLayoutTab === 'width' ? 'active' : ''}`}
                onClick={e => {
                  e.preventDefault()
                  e.stopPropagation()
                  switchArticleLayoutTab('width')
                }}
              >
                {'\u0428\u0438\u0440\u0438\u043d\u0430'}
              </button>
              <button
                className={`article-layout-tab ${articleLayoutTab === 'padding' ? 'active' : ''}`}
                onClick={e => {
                  e.preventDefault()
                  e.stopPropagation()
                  switchArticleLayoutTab('padding')
                }}
              >
                {'\u041e\u0442\u0441\u0442\u0443\u043f\u044b'}
              </button>
            </div>

            {articleLayoutTab === 'width' ? (
              <>
                <div className="article-layout-section-title">{'\u0420\u0435\u0436\u0438\u043c \u0448\u0438\u0440\u0438\u043d\u044b'}</div>
                <div className="article-width-mode-switch">
                  <button
                    className={`article-width-mode-btn ${articleWidthMode === 'preset' ? 'active' : ''}`}
                    onClick={e => {
                      e.preventDefault()
                      e.stopPropagation()
                      onArticleWidthModeChange?.('preset')
                    }}
                  >
                    {'\u0417\u0430\u0433\u043e\u0442\u043e\u0432\u043a\u0438'}
                  </button>
                  <button
                    className={`article-width-mode-btn ${articleWidthMode === 'manual' ? 'active' : ''}`}
                    onClick={e => {
                      e.preventDefault()
                      e.stopPropagation()
                      onArticleWidthModeChange?.('manual')
                      onArticleWidthFrameVisibleChange?.(true)
                    }}
                  >
                    {'\u0412\u0440\u0443\u0447\u043d\u0443\u044e'}
                  </button>
                </div>

                {articleWidthMode === 'manual' ? (
                  <div className="article-width-manual">
                    <div className="modal-actions article-layout-actions">
                      <button
                        className="modal-btn secondary"
                        onClick={event => {
                          event.preventDefault()
                          event.stopPropagation()
                          resetArticleWidth()
                        }}
                      >
                        {'\u0421\u0431\u0440\u043e\u0441\u0438\u0442\u044c'}
                      </button>
                      <button
                        className={`modal-btn article-width-frame-toggle ${articleWidthFrameVisible ? 'hide' : 'show'}`}
                        onClick={event => {
                          event.preventDefault()
                          event.stopPropagation()
                          onArticleWidthFrameVisibleChange?.(!articleWidthFrameVisible)
                        }}
                      >
                        {articleWidthFrameVisible
                          ? '\u0421\u043a\u0440\u044b\u0442\u044c \u0431\u043e\u043a\u043e\u0432\u044b\u0435 \u043b\u0438\u043d\u0438\u0438'
                          : '\u041f\u043e\u043a\u0430\u0437\u0430\u0442\u044c \u0431\u043e\u043a\u043e\u0432\u044b\u0435 \u043b\u0438\u043d\u0438\u0438'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="article-layout-grid">
                      {ARTICLE_WIDTH_PRESETS.map(option => (
                        <button
                          key={option.id}
                          className={`article-layout-option ${articleWidthPreset === option.id ? 'active' : ''}`}
                          onClick={e => {
                            e.preventDefault()
                            e.stopPropagation()
                            onArticleWidthPresetChange?.(option.id)
                          }}
                        >
                          <span className="article-layout-option-label">{getArticleWidthPresetText(option)}</span>
                        </button>
                      ))}
                    </div>
                    <div className="modal-actions article-layout-actions">
                      <button
                        className="modal-btn secondary"
                        onClick={event => {
                          event.preventDefault()
                          event.stopPropagation()
                          resetArticleWidth()
                        }}
                      >
                        {'\u0421\u0431\u0440\u043e\u0441\u0438\u0442\u044c'}
                      </button>
                    </div>
                  </>
                )}
              </>
            ) : (
              <>
                <div className="article-layout-section-title">{'\u0420\u0435\u0436\u0438\u043c \u043e\u0442\u0441\u0442\u0443\u043f\u043e\u0432'}</div>
                <div className="article-padding-mode-switch">
                  <button
                    className={`article-padding-mode-btn ${articlePaddingMode === 'shared' ? 'active' : ''}`}
                    onClick={e => {
                      e.preventDefault()
                      e.stopPropagation()
                      onArticlePaddingModeChange?.('shared')
                    }}
                  >
                    {'\u041e\u0431\u0449\u0430\u044f \u0440\u0430\u043c\u043a\u0430'}
                  </button>
                  <button
                    className={`article-padding-mode-btn ${articlePaddingMode === 'manual' ? 'active' : ''}`}
                    onClick={e => {
                      e.preventDefault()
                      e.stopPropagation()
                      onArticlePaddingModeChange?.('manual')
                    }}
                  >
                    {'\u0412\u0440\u0443\u0447\u043d\u0443\u044e'}
                  </button>
                </div>

                <div className="modal-actions article-layout-actions">
                  <button
                    className="modal-btn secondary"
                    onClick={e => {
                      e.preventDefault()
                      e.stopPropagation()
                      onArticlePaddingReset?.()
                    }}
                  >
                    {'\u0421\u0431\u0440\u043e\u0441\u0438\u0442\u044c'}
                  </button>
                  <button
                    className={`modal-btn ${articlePaddingFrameVisible ? 'primary' : 'secondary'}`}
                    onClick={e => {
                      e.preventDefault()
                      e.stopPropagation()
                      onArticlePaddingFrameVisibleChange?.(!articlePaddingFrameVisible)
                    }}
                  >
                    {articlePaddingFrameVisible
                      ? '\u0421\u043a\u0440\u044b\u0442\u044c \u0440\u0430\u043c\u043a\u0443'
                      : '\u041f\u043e\u043a\u0430\u0437\u0430\u0442\u044c \u0440\u0430\u043c\u043a\u0443'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {showJsonModal && renderModalPortal(
        <div
          className={`modal json-modal ${isDragging ? 'dragging' : ''} ${isResizingJsonModal ? 'resizing' : ''}`}
          style={{
            left: `${modalPosition.x}px`,
            top: `${modalPosition.y}px`,
            width: jsonModalWidth,
          }}
          onClick={e => e.stopPropagation()}
        >
          <div className="doc-io-modal-content">
            <div className="modal-header" onMouseDown={handleMouseDown}>
              <div className="modal-drag-handle">JSON</div>
              <button
                className="close-modal-btn"
                onMouseDown={e => {
                  e.preventDefault()
                  e.stopPropagation()
                }}
                onClick={e => {
                  e.preventDefault()
                  e.stopPropagation()
                  setIsResizingJsonModal(false)
                  jsonResizeStateRef.current = null
                  closeAllModals()
                }}
                title={'\u0417\u0430\u043a\u0440\u044b\u0442\u044c'}
              >
                x
              </button>
            </div>

            <div className="json-panel">
              <textarea
                value={jsonText}
                onChange={e => setJsonText(e.target.value)}
                spellCheck={false}
                className="json-panel-textarea"
              />

              {jsonError && <div className="json-panel-error">? {jsonError}</div>}

              <div className="modal-actions">
                <button
                  className="modal-btn secondary"
                  onClick={e => {
                    e.preventDefault()
                    e.stopPropagation()
                    refreshJsonFromEditor()
                  }}
                >
                  {'\u041e\u0431\u043d\u043e\u0432\u0438\u0442\u044c'}
                </button>
                <button
                  className="modal-btn secondary"
                  onClick={e => {
                    e.preventDefault()
                    e.stopPropagation()
                    copyJsonToClipboard()
                  }}
                >
                  {'\u041a\u043e\u043f\u0438\u0440\u043e\u0432\u0430\u0442\u044c'}
                </button>
                <button
                  className="modal-btn primary"
                  onClick={e => {
                    e.preventDefault()
                    e.stopPropagation()
                    applyJsonToEditor()
                  }}
                >
                  {'\u041f\u0440\u0438\u043c\u0435\u043d\u0438\u0442\u044c'}
                </button>
              </div>
            </div>
          </div>

          <div
            className="json-modal-resize-handle"
            onMouseDown={handleJsonResizeMouseDown}
            title={'\u0418\u0437\u043c\u0435\u043d\u0438\u0442\u044c \u0448\u0438\u0440\u0438\u043d\u0443'}
          />
        </div>
      )}
    </>
  )
}
