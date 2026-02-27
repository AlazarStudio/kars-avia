import { useState, useEffect, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { useMutation } from '@apollo/client'
import { 
  CREATE_SECTION, 
  CREATE_ARTICLE, 
  UPDATE_SECTION, 
  UPDATE_ARTICLE, 
  DELETE_SECTION, 
  DELETE_ARTICLE,
  GET_ARTICLE,
  getCookie 
} from '../../../../../../graphQL_requests'
import { useLazyQuery } from '@apollo/client'
import './DocumentationListLeftPanel.css'
import {
  IconChevronDown,
  IconChevronLeft,
  IconChevronUp,
  IconCopy,
  IconEllipsis,
  IconFile,
  IconFolder,
  IconGripVertical,
  IconPencil,
  IconPlus,
  IconSearch,
  IconTrash,
  IconX,
} from './LeftPanelIcons'


const MAX_TITLE = 10
const MAX_PATH_CHARS = 20
const SINGLE_MODAL_EVENT = 'doclist-single-modal-open'
const DELETE_MODAL_RIGHT_OFFSET = 16
const DELETE_MODAL_BOTTOM_OFFSET = 16
const DELETE_MODAL_ESTIMATED_WIDTH = 340
const DELETE_MODAL_ESTIMATED_HEIGHT = 210
const COPY_TITLE_SUFFIX = ' (\u043a\u043e\u043f\u0438\u044f)'
const DEFAULT_DOCUMENTATION_FILTER = 'dispatcher'
const DOC_NODE_FILTER_STATE_KEY = 'doclist_node_filter_state_v1'
const DOC_FILTER_INPUT_FIELD_CANDIDATES = ['filter', 'documentationFilter', 'docFilter']

function normalizeDocumentationFilter(rawValue) {
  if (rawValue == null) return null
  const value = String(rawValue).trim().toLowerCase()
  if (!value) return null

  if (
    value === 'dispatcher' ||
    value === 'dispatch' ||
    value === 'dispetcher' ||
    value.includes('dispatch')
  ) {
    return 'dispatcher'
  }

  if (value === 'hotel' || value === 'hotels' || value.includes('hotel')) {
    return 'hotel'
  }

  if (
    value === 'airline' ||
    value === 'aviacompany' ||
    value === 'aircompany' ||
    value.includes('airline') ||
    value.includes('avia')
  ) {
    return 'airline'
  }

  return null
}

function isUnsupportedInputFieldError(error, fieldName) {
  const message = [
    error?.message,
    ...(Array.isArray(error?.graphQLErrors)
      ? error.graphQLErrors.map(gqlError => gqlError?.message)
      : []),
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()

  const safeFieldName = String(fieldName || '').toLowerCase()
  if (!safeFieldName) return false

  return (
    message.includes(safeFieldName) &&
    (message.includes('not defined') ||
      message.includes('unknown field') ||
      message.includes('cannot query field') ||
      message.includes('validation') ||
      message.includes('does not exist'))
  )
}

function loadNodeFilterState() {
  if (typeof window === 'undefined') return {}
  try {
    const raw = window.localStorage.getItem(DOC_NODE_FILTER_STATE_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw)
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {}
    return parsed
  } catch {
    return {}
  }
}

function saveNodeFilterState(nextMap) {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(DOC_NODE_FILTER_STATE_KEY, JSON.stringify(nextMap))
  } catch {
    // ignore storage errors
  }
}

function getDeleteModalStartPosition() {
  if (typeof window === 'undefined') return { x: 100, y: 100 }

  return {
    x: Math.max(10, window.innerWidth - DELETE_MODAL_ESTIMATED_WIDTH - DELETE_MODAL_RIGHT_OFFSET),
    y: Math.max(10, window.innerHeight - DELETE_MODAL_ESTIMATED_HEIGHT - DELETE_MODAL_BOTTOM_OFFSET),
  }
}

/* ================= UTILS ================= */
function ChildrenPathPreview({ children }) {
  if (!children?.length) return null

  const names = children
    .filter(c => c.type === 'section')
    .map(c => c.title)

  if (!names.length) return null

  const full = names.join(', ')
  const short =
    full.length > MAX_PATH_CHARS
      ? full.slice(0, MAX_PATH_CHARS) + '\u2026'
      : full

  return (
    <span className="tree-path-preview" title={full}>
      {' / '}
      {short}
    </span>
  )
}

// Р С™Р С•Р СР С—Р С•Р Р…Р ВµР Р…РЎвЂљ Р Т‘Р В»РЎРЏ Р С•РЎвЂљР С•Р В±РЎР‚Р В°Р В¶Р ВµР Р…Р С‘РЎРЏ Р В·Р В°Р С–Р С•Р В»Р С•Р Р†Р С”Р В° РЎРѓ Р Р†Р С•Р В·Р СР С•Р В¶Р Р…Р С•РЎРѓРЎвЂљРЎРЉРЎР‹ РЎР‚Р В°РЎРѓРЎв‚¬Р С‘РЎР‚Р ВµР Р…Р С‘РЎРЏ
function ExpandableTitle({ title, onExpandChange, defaultExpanded = true }) {
  const [expanded, setExpanded] = useState(defaultExpanded)

  useEffect(() => {
    if (!title) return
    if (title.length <= MAX_TITLE) {
      onExpandChange?.(true)
      return
    }
    onExpandChange?.(expanded)
  }, [title, expanded, onExpandChange])
  
  if (!title) return null

  if (title.length <= MAX_TITLE) {
    return <span className="tree-title1">{title}</span>
  }

  const handleToggle = (e) => {
    e.stopPropagation()
    setExpanded(prev => !prev)
  }

  return (
    <span className="tree-title">
      {expanded ? title : title.slice(0, MAX_TITLE)}
      <button
        className="ellipsis-btn"
        onMouseDown={(e) => e.stopPropagation()}
        onClick={handleToggle}
      >
        {expanded ? <IconChevronLeft size={12} /> : <IconEllipsis size={12} />}
      </button>
    </span>
  )
}

/* ================= MAIN ================= */

function DocumentationListLeftPanel({
  tree,
  setTree,
  onSelectFile,
  canManage = false,
  activeFilter = DEFAULT_DOCUMENTATION_FILTER,
  activeDocId = null,
}) {
  const [creating, setCreating] = useState(null)
  const [hovered, setHovered] = useState(false)
  const [lastDeleted, setLastDeleted] = useState(null)
  const [copyModal, setCopyModal] = useState(null)
  const [deleteConfirm, setDeleteConfirm] = useState(null)
  const [dropHint, setDropHint] = useState(null)
  const [dragState, setDragState] = useState(null)
  const [leftTreeLassoSelectedIds, setLeftTreeLassoSelectedIds] = useState([])
  const [leftTreeLassoRectStyle, setLeftTreeLassoRectStyle] = useState(null)
  const [leftTreeAltMode, setLeftTreeAltMode] = useState(false)
  const [leftTreeCopyBuffer, setLeftTreeCopyBuffer] = useState(null)
  const [leftTreePasteHoverHint, setLeftTreePasteHoverHint] = useState(null)
  const [leftTreePasteTargetHint, setLeftTreePasteTargetHint] = useState(null)
  const [leftTreePasteBusy, setLeftTreePasteBusy] = useState(false)
  const leftTreeRef = useRef(null)
  const leftTreeLassoRef = useRef({
    active: false,
    startContentX: 0,
    startContentY: 0,
    lastClientX: 0,
    lastClientY: 0,
    lastRect: null,
  })
  const leftTreeLassoCleanupRef = useRef(null)
  const suppressTreeClickUntilRef = useRef(0)
  const leftTreeLassoLastClickedIdRef = useRef(null)
  
  // Р СњР С•Р Р†РЎвЂ№Р Вµ РЎРѓР С•РЎРѓРЎвЂљР С•РЎРЏР Р…Р С‘РЎРЏ Р Т‘Р В»РЎРЏ Р С—Р С•Р С‘РЎРѓР С”Р В°
  const [showSearch, setShowSearch] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterType, setFilterType] = useState('all') // 'all', 'section', 'article'
  const [showSaveIndicator, setShowSaveIndicator] = useState(false)
  const normalizedDocFilter =
    normalizeDocumentationFilter(activeFilter) || DEFAULT_DOCUMENTATION_FILTER
  const saveIndicatorTimerRef = useRef(null)

  // GraphQL РјСѓС‚Р°С†РёРё
  const token = getCookie('token')
  const mutationContext = {
    context: {
      headers: {
        Authorization: `Bearer ${token}`,
        'Apollo-Require-Preflight': 'true',
      },
    },
  }

  const [fetchArticle] = useLazyQuery(GET_ARTICLE, {
    context: mutationContext.context,
    fetchPolicy: 'network-only',
  })

  const [createSectionMutation] = useMutation(CREATE_SECTION, mutationContext)
  const [createArticleMutation] = useMutation(CREATE_ARTICLE, mutationContext)
  const [updateSectionMutation] = useMutation(UPDATE_SECTION, mutationContext)
  const [updateArticleMutation] = useMutation(UPDATE_ARTICLE, mutationContext)
  const [deleteSectionMutation] = useMutation(DELETE_SECTION, mutationContext)
  const [deleteArticleMutation] = useMutation(DELETE_ARTICLE, mutationContext)

  const createSectionWithFilter = useCallback(
    async (input) => {
      const safeInput = { ...input }
      for (const fieldName of DOC_FILTER_INPUT_FIELD_CANDIDATES) {
        try {
          return await createSectionMutation({
            variables: {
              input: { ...safeInput, [fieldName]: normalizedDocFilter },
            },
          })
        } catch (error) {
          if (!isUnsupportedInputFieldError(error, fieldName)) {
            throw error
          }
        }
      }

      return createSectionMutation({
        variables: { input: safeInput },
      })
    },
    [createSectionMutation, normalizedDocFilter]
  )

  const createArticleWithFilter = useCallback(
    async (input) => {
      const safeInput = { ...input }
      for (const fieldName of DOC_FILTER_INPUT_FIELD_CANDIDATES) {
        try {
          return await createArticleMutation({
            variables: {
              input: { ...safeInput, [fieldName]: normalizedDocFilter },
            },
          })
        } catch (error) {
          if (!isUnsupportedInputFieldError(error, fieldName)) {
            throw error
          }
        }
      }

      return createArticleMutation({
        variables: { input: safeInput },
      })
    },
    [createArticleMutation, normalizedDocFilter]
  )

  const updateSectionWithFilter = useCallback(
    async (id, input) => {
      const safeInput = { ...input }
      for (const fieldName of DOC_FILTER_INPUT_FIELD_CANDIDATES) {
        try {
          return await updateSectionMutation({
            variables: {
              id,
              input: { ...safeInput, [fieldName]: normalizedDocFilter },
            },
          })
        } catch (error) {
          if (!isUnsupportedInputFieldError(error, fieldName)) {
            throw error
          }
        }
      }

      return updateSectionMutation({
        variables: { id, input: safeInput },
      })
    },
    [normalizedDocFilter, updateSectionMutation]
  )

  const updateArticleWithFilter = useCallback(
    async (id, input) => {
      const safeInput = { ...input }
      for (const fieldName of DOC_FILTER_INPUT_FIELD_CANDIDATES) {
        try {
          return await updateArticleMutation({
            variables: {
              id,
              input: { ...safeInput, [fieldName]: normalizedDocFilter },
            },
          })
        } catch (error) {
          if (!isUnsupportedInputFieldError(error, fieldName)) {
            throw error
          }
        }
      }

      return updateArticleMutation({
        variables: { id, input: safeInput },
      })
    },
    [normalizedDocFilter, updateArticleMutation]
  )

  const persistNodeFilterById = useCallback(
    (nodeId, filter = normalizedDocFilter) => {
      if (nodeId == null) return
      const normalizedFilter =
        normalizeDocumentationFilter(filter) || DEFAULT_DOCUMENTATION_FILTER
      const key = String(nodeId)
      const current = loadNodeFilterState()
      current[key] = normalizedFilter
      saveNodeFilterState(current)
    },
    [normalizedDocFilter]
  )

  const persistNodeFilterIds = useCallback(
    (nodeIds, filter = normalizedDocFilter) => {
      if (!Array.isArray(nodeIds) || !nodeIds.length) return
      const normalizedFilter =
        normalizeDocumentationFilter(filter) || DEFAULT_DOCUMENTATION_FILTER
      const current = loadNodeFilterState()
      for (const rawId of nodeIds) {
        if (rawId == null) continue
        current[String(rawId)] = normalizedFilter
      }
      saveNodeFilterState(current)
    },
    [normalizedDocFilter]
  )

  const removeNodeFilterIds = useCallback((nodeIds) => {
    if (!Array.isArray(nodeIds) || !nodeIds.length) return
    const current = loadNodeFilterState()
    let changed = false
    for (const rawId of nodeIds) {
      if (rawId == null) continue
      const key = String(rawId)
      if (!Object.prototype.hasOwnProperty.call(current, key)) continue
      delete current[key]
      changed = true
    }
    if (changed) {
      saveNodeFilterState(current)
    }
  }, [])

  const markSaveSuccess = useCallback(() => {
    setShowSaveIndicator(true)
    if (saveIndicatorTimerRef.current) {
      clearTimeout(saveIndicatorTimerRef.current)
    }
    saveIndicatorTimerRef.current = setTimeout(() => {
      setShowSaveIndicator(false)
    }, 1400)
  }, [])

  const closeAllLeftModals = () => {
    setShowSearch(false)
    setCopyModal(null)
    setDeleteConfirm(null)
  }

  const announceModalOpen = () => {
    try {
      window.dispatchEvent(
        new CustomEvent(SINGLE_MODAL_EVENT, {
          detail: { source: 'left' },
        })
      )
    } catch {
      // ignore
    }
  }

  useEffect(() => {
    const onExternalModalOpen = (event) => {
      if (event?.detail?.source === 'left') return
      closeAllLeftModals()
    }

    window.addEventListener(SINGLE_MODAL_EVENT, onExternalModalOpen)
    return () => {
      window.removeEventListener(SINGLE_MODAL_EVENT, onExternalModalOpen)
    }
  }, [])

  useEffect(() => {
    if (canManage) return
    setCreating(null)
    setCopyModal(null)
    setDeleteConfirm(null)
    setDragState(null)
    setDropHint(null)
  }, [canManage])

  useEffect(() => {
    return () => {
      if (saveIndicatorTimerRef.current) {
        clearTimeout(saveIndicatorTimerRef.current)
      }
    }
  }, [])

  useEffect(() => {
    return () => {
      if (leftTreeLassoCleanupRef.current) {
        leftTreeLassoCleanupRef.current()
        leftTreeLassoCleanupRef.current = null
      }
    }
  }, [])

  useEffect(() => {
    const onKeyDown = (event) => {
      setLeftTreeAltMode(Boolean(event.altKey))
    }
    const onKeyUp = (event) => {
      setLeftTreeAltMode(Boolean(event.altKey))
    }
    const onBlur = () => {
      setLeftTreeAltMode(false)
    }

    document.addEventListener('keydown', onKeyDown, true)
    document.addEventListener('keyup', onKeyUp, true)
    window.addEventListener('blur', onBlur, true)

    return () => {
      document.removeEventListener('keydown', onKeyDown, true)
      document.removeEventListener('keyup', onKeyUp, true)
      window.removeEventListener('blur', onBlur, true)
    }
  }, [])

  /* ===== helpers ===== */

  const leftTreeRectsIntersect = (a, b) => {
    if (!a || !b) return false
    return !(a.right <= b.left || a.left >= b.right || a.bottom <= b.top || a.top >= b.bottom)
  }

  const sameStringArrays = (a, b) => {
    if (a === b) return true
    if (!Array.isArray(a) || !Array.isArray(b)) return false
    if (a.length !== b.length) return false
    for (let i = 0; i < a.length; i += 1) {
      if (a[i] !== b[i]) return false
    }
    return true
  }

  const samePasteHint = (a, b) => {
    if (a === b) return true
    if (!a || !b) return false
    return (
      String(a.id) === String(b.id) &&
      String(a.parentId ?? 'root') === String(b.parentId ?? 'root') &&
      String(a.position) === String(b.position) &&
      Number(a.index) === Number(b.index)
    )
  }

  const isFormFieldTarget = (target) => {
    if (!(target instanceof Element)) return false
    return Boolean(target.closest('input, textarea, select, button'))
  }

  const getVisibleTreeItemIds = useCallback(() => {
    const treeEl = leftTreeRef.current
    if (!treeEl) return []
    return Array.from(treeEl.querySelectorAll('.tree-item[data-doc-tree-id]'))
      .map((node) => String(node.getAttribute('data-doc-tree-id') || ''))
      .filter(Boolean)
  }, [])

  const collectBatchTargets = useCallback((selectedIdsInput) => {
    const selectedSet = new Set(
      (Array.isArray(selectedIdsInput) ? selectedIdsInput : [])
        .map((id) => String(id))
        .filter(Boolean)
    )
    if (!selectedSet.size) return []

    const result = []
    const walk = (nodes, parentId = 'root', ancestorSelectedSection = false) => {
      if (!Array.isArray(nodes) || !nodes.length) return
      for (let index = 0; index < nodes.length; index += 1) {
        const node = nodes[index]
        if (!node || node.id == null) continue
        const id = String(node.id)
        const isSelected = selectedSet.has(id)
        const shouldInclude = isSelected && !ancestorSelectedSection

        if (shouldInclude) {
          result.push({
            id,
            item: node,
            parentId,
            index,
          })
        }

        const nextAncestorSelectedSection =
          ancestorSelectedSection || (shouldInclude && node.type === 'section')

        if (Array.isArray(node.children) && node.children.length) {
          walk(node.children, node.id, nextAncestorSelectedSection)
        }
      }
    }

    walk(tree)
    return result
  }, [tree])

  const stopLeftTreeLasso = useCallback(() => {
    leftTreeLassoRef.current.active = false
    leftTreeLassoRef.current.lastRect = null
    if (leftTreeLassoCleanupRef.current) {
      leftTreeLassoCleanupRef.current()
      leftTreeLassoCleanupRef.current = null
    }
    setLeftTreeLassoRectStyle(null)
  }, [])

  const updateLeftTreeLassoSelection = useCallback((clientX, clientY) => {
    const treeEl = leftTreeRef.current
    const drag = leftTreeLassoRef.current
    if (!treeEl || !drag.active) return

    drag.lastClientX = clientX
    drag.lastClientY = clientY

    const treeRect = treeEl.getBoundingClientRect()
    const currentContentX = clientX - treeRect.left + treeEl.scrollLeft
    const currentContentY = clientY - treeRect.top + treeEl.scrollTop

    const left = Math.min(drag.startContentX, currentContentX)
    const top = Math.min(drag.startContentY, currentContentY)
    const width = Math.max(1, Math.abs(currentContentX - drag.startContentX))
    const height = Math.max(1, Math.abs(currentContentY - drag.startContentY))

    const logicalRect = {
      left,
      top,
      right: left + width,
      bottom: top + height,
      width,
      height,
    }
    drag.lastRect = logicalRect

    const nextRectStyle = {
      left: `${left}px`,
      top: `${top}px`,
      width: `${width}px`,
      height: `${height}px`,
    }
    setLeftTreeLassoRectStyle((prev) => {
      if (
        prev &&
        prev.left === nextRectStyle.left &&
        prev.top === nextRectStyle.top &&
        prev.width === nextRectStyle.width &&
        prev.height === nextRectStyle.height
      ) {
        return prev
      }
      return nextRectStyle
    })

    const nextSelectedIds = []
    const itemNodes = treeEl.querySelectorAll('.tree-item[data-doc-tree-id]')
    for (const node of itemNodes) {
      const id = node.getAttribute('data-doc-tree-id')
      if (!id) continue
      const rect = node.getBoundingClientRect()
      const itemRect = {
        left: rect.left - treeRect.left + treeEl.scrollLeft,
        top: rect.top - treeRect.top + treeEl.scrollTop,
        right: rect.right - treeRect.left + treeEl.scrollLeft,
        bottom: rect.bottom - treeRect.top + treeEl.scrollTop,
      }
      if (leftTreeRectsIntersect(logicalRect, itemRect)) {
        nextSelectedIds.push(String(id))
      }
    }

    setLeftTreeLassoSelectedIds((prev) => (
      sameStringArrays(prev, nextSelectedIds) ? prev : nextSelectedIds
    ))
  }, [])

  const findAndRemove = (nodes, id, parentId = 'root') => {
    for (let i = 0; i < nodes.length; i++) {
      if (nodes[i].id === id) {
        const item = nodes[i]
        nodes.splice(i, 1)
        return { item, parentId, index: i }
      }
      if (nodes[i].children) {
        const res = findAndRemove(nodes[i].children, id, nodes[i].id)
        if (res) return res
      }
    }
    return null
  }

  const insertBelow = (nodes, targetId, newItem) => {
    for (let i = 0; i < nodes.length; i++) {
      if (nodes[i].id === targetId) {
        nodes.splice(i + 1, 0, newItem)
        return true
      }
      if (nodes[i].children && insertBelow(nodes[i].children, targetId, newItem)) {
        return true
      }
    }
    return false
  }

  const insertAt = (nodes, parentId, index, item) => {
    if (parentId === 'root') {
      nodes.splice(index, 0, item)
      return
    }
    for (const n of nodes) {
      if (n.id === parentId && n.children) {
        n.children.splice(index, 0, item)
        return
      }
      if (n.children) insertAt(n.children, parentId, index, item)
    }
  }

  const getChildrenByParentId = (nodes, parentId) => {
    if (parentId === 'root') return nodes
    for (const node of nodes) {
      if (node.id === parentId) {
        return Array.isArray(node.children) ? node.children : []
      }
      if (Array.isArray(node.children) && node.children.length) {
        const nested = getChildrenByParentId(node.children, parentId)
        if (nested) return nested
      }
    }
    return null
  }

  const buildCopiedTitle = (title) => `${String(title || '').trim()}${COPY_TITLE_SUFFIX}`

  const findParentSectionId = (nodes, targetId, parentId = null) => {
    for (const n of nodes) {
      if (n.id === targetId) return parentId
      if (n.children?.length) {
        const found = findParentSectionId(
          n.children,
          targetId,
          n.type === 'section' ? n.id : parentId
        )
        if (found !== undefined) return found
      }
    }
    return undefined
  }

  const collectNodeIds = (node, acc = []) => {
    if (!node || typeof node !== 'object') return acc
    if (node.id != null) {
      acc.push(String(node.id))
    }
    if (Array.isArray(node.children) && node.children.length) {
      for (const child of node.children) {
        collectNodeIds(child, acc)
      }
    }
    return acc
  }

  const copyArticleWithContent = async (article) => {
    if (!canManage) return

    try {
      const { data } = await fetchArticle({
        variables: { id: article.id },
      })
      const content = data?.article?.content ?? null

      const sectionId = findParentSectionId(tree, article.id) ?? null

      const result = await createArticleWithFilter({
        title: buildCopiedTitle(article.title),
        sectionId,
        content: content && typeof content === 'object' && content.type === 'doc' ? content : null,
      })

      const createdArticle = result?.data?.createArticle
      if (!createdArticle) return

      const newItem = {
        id: createdArticle.id,
        type: 'article',
        title: createdArticle.title,
        editor: 'tiptap',
        filter: normalizedDocFilter,
      }
      persistNodeFilterById(createdArticle.id)

      setTree(prev => {
        const next = structuredClone(prev)
        insertBelow(next, article.id, newItem)
        return next
      })
      markSaveSuccess()
    } catch (error) {
      console.error('Failed to copy article:', error)
    }
  }

  const copySectionBranch = async (section, targetParentId, withChildren, isRootCopy = false) => {
    const sectionResult = await createSectionWithFilter({
      title: isRootCopy ? buildCopiedTitle(section.title) : section.title,
      parentId: targetParentId,
    })

    const createdSection = sectionResult?.data?.createSection
    if (!createdSection?.id) {
      throw new Error('Failed to create copied section')
    }

    const copiedSectionNode = {
      id: createdSection.id,
      type: 'section',
      title: createdSection.title,
      children: [],
      isOpen: true,
      filter: normalizedDocFilter,
    }
    persistNodeFilterById(createdSection.id)

    if (!withChildren || !Array.isArray(section.children) || !section.children.length) {
      return copiedSectionNode
    }

    for (const child of section.children) {
      if (child.type === 'section') {
        const copiedChildSection = await copySectionBranch(child, createdSection.id, true, false)
        if (copiedChildSection) {
          copiedSectionNode.children.push(copiedChildSection)
        }
        continue
      }

      if (child.type === 'article') {
        let childContent = null
        try {
          const { data } = await fetchArticle({
            variables: { id: child.id },
          })
          const rawContent = data?.article?.content ?? null
          childContent =
            rawContent && typeof rawContent === 'object' && rawContent.type === 'doc'
              ? rawContent
              : null
        } catch (error) {
          console.error('Failed to fetch nested article content for section copy:', error)
        }

        const createdArticleResult = await createArticleWithFilter({
          title: child.title,
          sectionId: createdSection.id,
          content: childContent,
        })

        const createdArticle = createdArticleResult?.data?.createArticle
        if (!createdArticle?.id) continue

        copiedSectionNode.children.push({
          id: createdArticle.id,
          type: 'article',
          title: createdArticle.title,
          editor: 'tiptap',
          filter: normalizedDocFilter,
        })
        persistNodeFilterById(createdArticle.id)
      }
    }

    return copiedSectionNode
  }

  const copySectionOnServer = async (section, withChildren) => {
    if (!canManage) return false
    if (!section || section.type !== 'section') return false

    try {
      const parentSectionId = findParentSectionId(tree, section.id) ?? null
      const copiedSectionNode = await copySectionBranch(
        section,
        parentSectionId,
        withChildren,
        true
      )

      if (!copiedSectionNode) return false
      persistNodeFilterIds(collectNodeIds(copiedSectionNode))

      setTree(prev => {
        const next = structuredClone(prev)
        insertBelow(next, section.id, copiedSectionNode)
        return next
      })

      markSaveSuccess()
      return true
    } catch (error) {
      console.error('Failed to copy section:', error)
      return false
    }
  }

  // Р В¤РЎС“Р Р…Р С”РЎвЂ Р С‘РЎРЏ Р Т‘Р В»РЎРЏ Р С—РЎР‚Р С•Р Р†Р ВµРЎР‚Р С”Р С‘, Р Р…Р Вµ РЎРЏР Р†Р В»РЎРЏР ВµРЎвЂљРЎРѓРЎРЏ Р В»Р С‘ target Р Т‘Р С•РЎвЂЎР ВµРЎР‚Р Р…Р С‘Р С РЎРЊР В»Р ВµР СР ВµР Р…РЎвЂљР С•Р С draggingItem
  const isDescendant = useCallback((nodes, parentId, childId) => {
    // Р РЋР Р…Р В°РЎвЂЎР В°Р В»Р В° Р Р…Р В°РЎвЂ¦Р С•Р Т‘Р С‘Р С РЎР‚Р С•Р Т‘Р С‘РЎвЂљР ВµР В»РЎРЉРЎРѓР С”Р С‘Р в„– РЎС“Р В·Р ВµР В»
    const findNode = (nodes, id) => {
      for (const node of nodes) {
        if (node.id === id) return node
        if (node.children) {
          const found = findNode(node.children, id)
          if (found) return found
        }
      }
      return null
    }

    // Р СњР В°РЎвЂ¦Р С•Р Т‘Р С‘Р С РЎР‚Р С•Р Т‘Р С‘РЎвЂљР ВµР В»РЎРЉРЎРѓР С”РЎС“РЎР‹ Р Р…Р С•Р Т‘РЎС“
    const parentNode = findNode(nodes, parentId)
    if (!parentNode || !parentNode.children) return false

    // Р СџРЎР‚Р С•Р Р†Р ВµРЎР‚РЎРЏР ВµР С, Р ВµРЎРѓРЎвЂљРЎРЉ Р В»Р С‘ childId РЎРѓРЎР‚Р ВµР Т‘Р С‘ Р Т‘Р ВµРЎвЂљР ВµР в„– parentNode (РЎР‚Р ВµР С”РЎС“РЎР‚РЎРѓР С‘Р Р†Р Р…Р С•)
    const checkChildren = (children, targetId) => {
      for (const child of children) {
        if (child.id === targetId) return true
        if (child.children && checkChildren(child.children, targetId)) {
          return true
        }
      }
      return false
    }

    return checkChildren(parentNode.children, childId)
  }, [])

  // Р В¤РЎС“Р Р…Р С”РЎвЂ Р С‘РЎРЏ Р Т‘Р В»РЎРЏ Р С—Р С•Р С‘РЎРѓР С”Р В° РЎРЊР В»Р ВµР СР ВµР Р…РЎвЂљР С•Р Р† Р Р† Р Т‘Р ВµРЎР‚Р ВµР Р†Р Вµ
  const searchTree = useCallback((nodes, query, typeFilter = 'all') => {
    if (!query.trim()) return null // Р вЂ™Р С•Р В·Р Р†РЎР‚Р В°РЎвЂ°Р В°Р ВµР С null Р ВµРЎРѓР В»Р С‘ Р С—Р С•Р С‘РЎРѓР С” Р С—РЎС“РЎРѓРЎвЂљР С•Р в„–

    const results = []
    
    const searchNodes = (items, path = '') => {
      items.forEach(item => {
        const currentPath = path ? `${path} / ${item.title}` : item.title
        
        // Р СџРЎР‚Р С•Р Р†Р ВµРЎР‚РЎРЏР ВµР С РЎРѓР С•Р С•РЎвЂљР Р†Р ВµРЎвЂљРЎРѓРЎвЂљР Р†Р С‘Р Вµ РЎвЂћР С‘Р В»РЎРЉРЎвЂљРЎР‚РЎС“ РЎвЂљР С‘Р С—Р В° Р С‘ Р С—Р С•Р С‘РЎРѓР С”Р С•Р Р†Р С•Р СРЎС“ Р В·Р В°Р С—РЎР‚Р С•РЎРѓРЎС“
        const matchesType = typeFilter === 'all' || item.type === typeFilter
        const matchesQuery = item.title.toLowerCase().includes(query.toLowerCase())
        
        if (matchesType && matchesQuery) {
          results.push({
            ...item,
            path: currentPath
          })
        }
        
        // Р В Р ВµР С”РЎС“РЎР‚РЎРѓР С‘Р Р†Р Р…Р С• Р С‘РЎвЂ°Р ВµР С Р Р† Р Т‘Р ВµРЎвЂљРЎРЏРЎвЂ¦
        if (item.children && item.children.length > 0) {
          searchNodes(item.children, currentPath)
        }
      })
    }
    
    searchNodes(nodes)
    return results
  }, [])

  // Р СџР С•Р В»РЎС“РЎвЂЎР В°Р ВµР С РЎР‚Р ВµР В·РЎС“Р В»РЎРЉРЎвЂљР В°РЎвЂљРЎвЂ№ Р С—Р С•Р С‘РЎРѓР С”Р В°
  const searchResults = searchQuery.trim() 
    ? searchTree(tree, searchQuery, filterType !== 'all' ? filterType : 'all')
    : null

  const handleLeftTreeLassoMouseDownCapture = useCallback((event) => {
    if (event.button !== 0 || !event.altKey) return
    if (searchResults) return

    const treeEl = leftTreeRef.current
    if (!treeEl) return

    const target = event.target
    if (!(target instanceof Element)) return

    if (
      target.closest(
        'button, input, textarea, select, a, [contenteditable="true"], .rename-input, .action-btn, .drag-handle, .folder-arrow'
      )
    ) {
      return
    }

    const clickedTreeItem = target.closest('.tree-item[data-doc-tree-id]')
    const clickedId = clickedTreeItem?.getAttribute('data-doc-tree-id')
      ? String(clickedTreeItem.getAttribute('data-doc-tree-id'))
      : null
    const isAdditivePick =
      event.altKey && (event.ctrlKey || event.metaKey) && !event.shiftKey
    const isRangePick = event.altKey && event.shiftKey

    if (clickedId && (isAdditivePick || isRangePick)) {
      event.preventDefault()
      event.stopPropagation()

      const currentSelection = Array.from(
        new Set((leftTreeLassoSelectedIds || []).map((id) => String(id)))
      )

      let nextSelected = currentSelection

      if (isRangePick) {
        const visibleIds = getVisibleTreeItemIds()
        const anchorId =
          leftTreeLassoLastClickedIdRef.current != null
            ? String(leftTreeLassoLastClickedIdRef.current)
            : currentSelection.length
              ? currentSelection[currentSelection.length - 1]
              : clickedId
        const fromIndex = visibleIds.indexOf(anchorId)
        const toIndex = visibleIds.indexOf(clickedId)

        if (fromIndex >= 0 && toIndex >= 0) {
          const start = Math.min(fromIndex, toIndex)
          const end = Math.max(fromIndex, toIndex)
          nextSelected = visibleIds.slice(start, end + 1)
        } else {
          nextSelected = [clickedId]
        }
      } else {
        nextSelected = currentSelection.includes(clickedId)
          ? currentSelection.filter((id) => id !== clickedId)
          : [...currentSelection, clickedId]
      }

      leftTreeLassoLastClickedIdRef.current = clickedId
      setLeftTreeLassoSelectedIds(nextSelected)
      return
    }

    stopLeftTreeLasso()
    setLeftTreeLassoSelectedIds([])
    leftTreeLassoLastClickedIdRef.current = clickedId

    const treeRect = treeEl.getBoundingClientRect()
    leftTreeLassoRef.current.active = true
    leftTreeLassoRef.current.startContentX =
      event.clientX - treeRect.left + treeEl.scrollLeft
    leftTreeLassoRef.current.startContentY =
      event.clientY - treeRect.top + treeEl.scrollTop
    leftTreeLassoRef.current.lastClientX = event.clientX
    leftTreeLassoRef.current.lastClientY = event.clientY
    leftTreeLassoRef.current.lastRect = null

    suppressTreeClickUntilRef.current = Date.now() + 220

    const onMouseMove = (moveEvent) => {
      if (!leftTreeLassoRef.current.active) return
      if ((moveEvent.buttons & 1) !== 1) {
        stopLeftTreeLasso()
        return
      }
      updateLeftTreeLassoSelection(moveEvent.clientX, moveEvent.clientY)
    }

    const onMouseUp = () => {
      suppressTreeClickUntilRef.current = Date.now() + 220
      stopLeftTreeLasso()
    }

    const onTreeScroll = () => {
      if (!leftTreeLassoRef.current.active) return
      updateLeftTreeLassoSelection(
        leftTreeLassoRef.current.lastClientX,
        leftTreeLassoRef.current.lastClientY
      )
    }

    const onSelectStart = (selectEvent) => {
      if (leftTreeLassoRef.current.active) {
        selectEvent.preventDefault()
      }
    }

    const onWindowBlur = () => {
      stopLeftTreeLasso()
    }

    document.addEventListener('mousemove', onMouseMove)
    document.addEventListener('mouseup', onMouseUp, true)
    document.addEventListener('selectstart', onSelectStart)
    window.addEventListener('blur', onWindowBlur)
    treeEl.addEventListener('scroll', onTreeScroll, { passive: true })

    leftTreeLassoCleanupRef.current = () => {
      document.removeEventListener('mousemove', onMouseMove)
      document.removeEventListener('mouseup', onMouseUp, true)
      document.removeEventListener('selectstart', onSelectStart)
      window.removeEventListener('blur', onWindowBlur)
      treeEl.removeEventListener('scroll', onTreeScroll)
    }

    event.preventDefault()
    event.stopPropagation()
    updateLeftTreeLassoSelection(event.clientX, event.clientY)
  }, [
    getVisibleTreeItemIds,
    leftTreeLassoSelectedIds,
    searchResults,
    stopLeftTreeLasso,
    updateLeftTreeLassoSelection,
  ])

  const handleDocLeftMouseDownCapture = useCallback((event) => {
    if (!event.altKey) return
    const target = event.target
    if (!(target instanceof Element)) return
    if (target.closest('.doc-left-tree')) return
    event.preventDefault()
    event.stopPropagation()
  }, [])

  const handleDocLeftClickCapture = useCallback((event) => {
    if (!event.altKey) return
    event.preventDefault()
    event.stopPropagation()
  }, [])

  const buildLeftTreePasteHintFromEvent = useCallback((event) => {
    if (!leftTreeCopyBuffer || leftTreePasteBusy) return null
    if (event.altKey) return null

    const treeEl = leftTreeRef.current
    const target = event.target
    if (!treeEl || !(target instanceof Element)) return null

    if (
      target.closest(
        'button, input, textarea, select, a, [contenteditable="true"], .rename-input, .action-btn, .drag-handle, .folder-arrow'
      )
    ) {
      return null
    }

    const itemEl = target.closest('.tree-item[data-doc-tree-id]')
    if (!itemEl || !treeEl.contains(itemEl)) return null

    const id = itemEl.getAttribute('data-doc-tree-id')
    if (!id) return null

    const rect = itemEl.getBoundingClientRect()
    const offsetY = event.clientY - rect.top
    const edgeThreshold = Math.max(6, Math.min(12, rect.height * 0.28))
    let position = null
    if (offsetY <= edgeThreshold) position = 'before'
    else if (offsetY >= rect.height - edgeThreshold) position = 'after'
    else return null
    const rawParentId = itemEl.getAttribute('data-doc-tree-parent-id')
    const rawIndex = itemEl.getAttribute('data-doc-tree-index')

    return {
      id: String(id),
      parentId: rawParentId == null || rawParentId === '' ? 'root' : String(rawParentId),
      index: Number.parseInt(rawIndex || '0', 10) || 0,
      position,
    }
  }, [leftTreeCopyBuffer, leftTreePasteBusy])

  const handleLeftTreeMouseMoveCapture = useCallback((event) => {
    const nextHint = buildLeftTreePasteHintFromEvent(event)
    setLeftTreePasteHoverHint((prev) => (samePasteHint(prev, nextHint) ? prev : nextHint))
  }, [buildLeftTreePasteHintFromEvent])

  const handleLeftTreeMouseLeave = useCallback(() => {
    setLeftTreePasteHoverHint(null)
  }, [])

  const handleLeftTreeClickCapture = useCallback((event) => {
    if (event.altKey) {
      event.preventDefault()
      event.stopPropagation()
      return
    }

    if (!leftTreeCopyBuffer || leftTreePasteBusy) return

    const nextHint = buildLeftTreePasteHintFromEvent(event)
    if (!nextHint) return

    setLeftTreePasteTargetHint(nextHint)
    event.preventDefault()
    event.stopPropagation()
  }, [buildLeftTreePasteHintFromEvent, leftTreeCopyBuffer, leftTreePasteBusy])

  /* ===== create ===== */

  const startCreate = (parentId) => {
    if (!canManage) return
    setCreating({ parentId, name: '', type: 'section' })
  }

  const commitCreate = async (forcedType) => {
    if (!canManage) {
      setCreating(null)
      return
    }
    if (!creating || !creating.name.trim()) {
      setCreating(null)
      return
    }

    const type = forcedType ?? creating.type
    const title = creating.name.trim()
    const parentId = creating.parentId === 'root' ? null : creating.parentId

    try {
      let result
      if (type === 'section') {
        result = await createSectionWithFilter({
          title,
          parentId,
        })
        const createdSection = result?.data?.createSection
        if (createdSection) {
          const newItem = {
            id: createdSection.id,
            type: 'section',
            title: createdSection.title,
            children: [],
            isOpen: true,
            filter: normalizedDocFilter,
          }
          persistNodeFilterById(createdSection.id)
          
          setTree(prev => {
            if (creating.parentId === 'root') {
              return [...prev, newItem]
            }
            const insert = (nodes) =>
              nodes.map(n => {
                if (n.id === creating.parentId && n.type === 'section') {
                  return { ...n, children: [...n.children, newItem] }
                }
                if (n.children) return { ...n, children: insert(n.children) }
                return n
              })
            return insert(prev)
          })
          markSaveSuccess()
        }
      } else {
        // Article
        result = await createArticleWithFilter({
          title,
          sectionId: parentId,
          content: null,
        })
        const createdArticle = result?.data?.createArticle
        if (createdArticle) {
          const newItem = {
            id: createdArticle.id,
            type: 'article',
            title: createdArticle.title,
            editor: 'tiptap',
            filter: normalizedDocFilter,
          }
          persistNodeFilterById(createdArticle.id)
          
          setTree(prev => {
            if (creating.parentId === 'root') {
              return [...prev, newItem]
            }
            const insert = (nodes) =>
              nodes.map(n => {
                if (n.id === creating.parentId && n.type === 'section') {
                  return { ...n, children: [...n.children, newItem] }
                }
                if (n.children) return { ...n, children: insert(n.children) }
                return n
              })
            return insert(prev)
          })
          markSaveSuccess()
        }
      }
    } catch (error) {
      console.error('Failed to create item:', error)
    } finally {
      setCreating(null)
    }
  }

  /* ===== toggle ===== */

  const toggleSection = (id) => {
    const toggle = (nodes) =>
      nodes.map(n => {
        if (n.id === id && n.type === 'section') {
          return { ...n, isOpen: !n.isOpen }
        }
        if (n.children) return { ...n, children: toggle(n.children) }
        return n
      })

    setTree(prev => toggle(prev))
  }

  /* ===== rename ===== */

  const renameItem = async (id, newTitle) => {
    if (!canManage) return
    if (!newTitle.trim()) return

    // РќР°Р№РґРµРј С‚РёРї СѓР·Р»Р°
    let nodeType = null
    const findType = (nodes) => {
      for (const n of nodes) {
        if (n.id === id) {
          nodeType = n.type
          return true
        }
        if (n.children && findType(n.children)) {
          return true
        }
      }
      return false
    }
    findType(tree)

    if (!nodeType) return

    try {
      if (nodeType === 'section') {
        await updateSectionWithFilter(id, { title: newTitle.trim() })
      } else {
        await updateArticleWithFilter(id, { title: newTitle.trim() })
      }
      persistNodeFilterById(id)

      // РћР±РЅРѕРІР»СЏРµРј Р»РѕРєР°Р»СЊРЅРѕРµ РґРµСЂРµРІРѕ
      const rename = (nodes) =>
        nodes.map(n => {
          if (n.id === id) return { ...n, title: newTitle }
          if (n.children) return { ...n, children: rename(n.children) }
          return n
        })

      setTree(prev => rename(prev))
      markSaveSuccess()
    } catch (error) {
      console.error('Failed to rename item:', error)
    }
  }

  /* ===== delete ===== */

  const restoreDeletedItemLocally = useCallback((deletedEntry) => {
    if (!deletedEntry?.item) return

    setTree(prev => {
      const next = structuredClone(prev)
      insertAt(
        next,
        deletedEntry.parentId ?? 'root',
        Number.isFinite(deletedEntry.index) ? deletedEntry.index : 0,
        structuredClone(deletedEntry.item)
      )
      return next
    })
  }, [setTree])

  const restoreDeletedEntriesLocally = useCallback((deletedEntries) => {
    if (!Array.isArray(deletedEntries) || !deletedEntries.length) return

    const entries = deletedEntries
      .filter((entry) => entry?.item)
      .map((entry) => ({
        ...entry,
        parentKey: String(entry.parentId ?? 'root'),
        indexValue: Number.isFinite(entry.index) ? entry.index : 0,
      }))
      .sort((a, b) => {
        if (a.parentKey === b.parentKey) return a.indexValue - b.indexValue
        return 0
      })

    if (!entries.length) return

    setTree(prev => {
      const next = structuredClone(prev)
      for (const entry of entries) {
        insertAt(
          next,
          entry.parentId ?? 'root',
          entry.indexValue,
          structuredClone(entry.item)
        )
      }
      return next
    })
  }, [setTree])

  const commitDelete = useCallback(async (toastId) => {
    let pendingDelete = null

    setLastDeleted(prev => {
      if (!prev) return prev
      if (toastId != null && prev.toastId !== toastId) return prev
      pendingDelete = prev
      return null
    })

    const pendingEntries = Array.isArray(pendingDelete?.entries) && pendingDelete.entries.length
      ? pendingDelete.entries
      : pendingDelete?.item
        ? [pendingDelete]
        : []

    if (!pendingEntries.length) return

    let anySuccess = false
    for (const entry of pendingEntries) {
      if (!entry?.item) continue
      try {
        if (entry.item.type === 'section') {
          await deleteSectionMutation({
            variables: { id: entry.item.id },
          })
        } else {
          await deleteArticleMutation({
            variables: { id: entry.item.id },
          })
        }

        removeNodeFilterIds(collectNodeIds(entry.item))
        anySuccess = true
      } catch (error) {
        console.error('Failed to delete item from server:', error)
        restoreDeletedItemLocally(entry)
      }
    }

    if (anySuccess) {
      markSaveSuccess()
    }
  }, [
    deleteArticleMutation,
    deleteSectionMutation,
    markSaveSuccess,
    removeNodeFilterIds,
    restoreDeletedItemLocally,
  ])

  const undoDelete = useCallback((toastId) => {
    let pendingDelete = null

    setLastDeleted(prev => {
      if (!prev) return prev
      if (toastId != null && prev.toastId !== toastId) return prev
      pendingDelete = prev
      return null
    })

    const pendingEntries = Array.isArray(pendingDelete?.entries) && pendingDelete.entries.length
      ? pendingDelete.entries
      : pendingDelete?.item
        ? [pendingDelete]
        : []

    if (!pendingEntries.length) return
    restoreDeletedEntriesLocally(pendingEntries)
  }, [restoreDeletedEntriesLocally])

  const deleteItemsBulk = async (rawIds) => {
    if (!canManage) return

    const uniqueIds = Array.from(
      new Set((Array.isArray(rawIds) ? rawIds : []).map((id) => String(id)).filter(Boolean))
    )
    if (!uniqueIds.length) return

    const targets = collectBatchTargets(uniqueIds)
    if (!targets.length) return

    if (lastDeleted) {
      await commitDelete(lastDeleted.toastId)
    }

    const nextTree = structuredClone(tree)
    const deletedEntries = []
    for (const target of targets) {
      const deleted = findAndRemove(nextTree, target.id)
      if (deleted?.item) {
        deletedEntries.push(deleted)
      }
    }
    if (!deletedEntries.length) return

    setTree(nextTree)
    setLeftTreeLassoSelectedIds([])

    const firstItem = deletedEntries[0]?.item
    const toastId = Date.now() + Math.random()

    setLastDeleted({
      item: firstItem,
      parentId: deletedEntries[0]?.parentId,
      index: deletedEntries[0]?.index,
      entries: deletedEntries,
      count: deletedEntries.length,
      toastId,
    })
  }

  const deleteItem = async (id) => {
    await deleteItemsBulk([id])
  }

  useEffect(() => {
    if (!lastDeleted) return

    const timeoutId = window.setTimeout(() => {
      void commitDelete(lastDeleted.toastId)
    }, 2400)

    return () => {
      window.clearTimeout(timeoutId)
    }
  }, [commitDelete, lastDeleted])

  const copySelectedItems = useCallback(async (selectedIdsInput) => {
    if (!canManage) return
    const targets = collectBatchTargets(selectedIdsInput)
    if (!targets.length) return

    for (const target of targets) {
      if (!target?.item) continue
      if (target.item.type === 'article') {
        await copyArticleWithContent(target.item)
        continue
      }
      if (target.item.type === 'section') {
        await copySectionOnServer(target.item, true)
      }
    }
  }, [canManage, collectBatchTargets, copyArticleWithContent, copySectionOnServer])

  const deleteSelectedItems = useCallback(async (selectedIdsInput) => {
    if (!canManage) return
    await deleteItemsBulk(selectedIdsInput)
  }, [canManage, deleteItemsBulk])

  const persistNodePlacementForLeftTree = useCallback(async (
    node,
    nextNodeParentId,
    nodeIndex,
    fallbackWithoutIndex = false
  ) => {
    if (!node?.id) return true

    const isUnsupportedOrderFieldError = (error, fieldName) => {
      const messages = [
        error?.message,
        ...(Array.isArray(error?.graphQLErrors)
          ? error.graphQLErrors.map(gqlError => gqlError?.message)
          : []),
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()

      return (
        messages.includes(fieldName) &&
        (messages.includes('not defined') ||
          messages.includes('unknown field') ||
          messages.includes('cannot query field') ||
          messages.includes('validation'))
      )
    }

    const saveSectionPlacement = async (id, baseInput, indexValue) => {
      try {
        await updateSectionWithFilter(id, {
          ...baseInput,
          index: indexValue,
        })
        return true
      } catch (errorWithIndex) {
        if (!isUnsupportedOrderFieldError(errorWithIndex, 'index')) {
          throw errorWithIndex
        }
      }

      await updateSectionWithFilter(id, {
        ...baseInput,
        order: indexValue,
      })
      return true
    }

    const saveArticlePlacement = async (id, baseInput, indexValue) => {
      try {
        await updateArticleWithFilter(id, {
          ...baseInput,
          index: indexValue,
        })
        return true
      } catch (errorWithIndex) {
        if (!isUnsupportedOrderFieldError(errorWithIndex, 'index')) {
          throw errorWithIndex
        }
      }

      await updateArticleWithFilter(id, {
        ...baseInput,
        order: indexValue,
      })
      return true
    }

    if (node.type === 'section') {
      const baseInput = {
        title: String(node.title || '').trim(),
        parentId: nextNodeParentId,
      }

      try {
        await saveSectionPlacement(node.id, baseInput, nodeIndex)
        persistNodeFilterById(node.id)
        return true
      } catch (orderFieldError) {
        if (
          !fallbackWithoutIndex ||
          (!isUnsupportedOrderFieldError(orderFieldError, 'index') &&
            !isUnsupportedOrderFieldError(orderFieldError, 'order'))
        ) {
          throw orderFieldError
        }

        await updateSectionWithFilter(node.id, baseInput)
        persistNodeFilterById(node.id)
        return false
      }
    }

    const baseInput = {
      title: String(node.title || '').trim(),
      sectionId: nextNodeParentId,
    }

    try {
      await saveArticlePlacement(node.id, baseInput, nodeIndex)
      persistNodeFilterById(node.id)
      return true
    } catch (orderFieldError) {
      if (
        !fallbackWithoutIndex ||
        (!isUnsupportedOrderFieldError(orderFieldError, 'index') &&
          !isUnsupportedOrderFieldError(orderFieldError, 'order'))
      ) {
        throw orderFieldError
      }

      await updateArticleWithFilter(node.id, baseInput)
      persistNodeFilterById(node.id)
      return false
    }
  }, [
    persistNodeFilterById,
    updateArticleWithFilter,
    updateSectionWithFilter,
  ])

  const persistSiblingOrderingForParent = useCallback(async (treeSnapshot, affectedParentId) => {
    const siblings = getChildrenByParentId(treeSnapshot, affectedParentId)
    if (!Array.isArray(siblings)) return true

    const siblingParentId = affectedParentId === 'root' ? null : affectedParentId

    let orderSaved = false
    for (let siblingIndex = 0; siblingIndex < siblings.length; siblingIndex += 1) {
      const saved = await persistNodePlacementForLeftTree(
        siblings[siblingIndex],
        siblingParentId,
        siblingIndex,
        true
      )
      if (saved) orderSaved = true
    }
    return orderSaved
  }, [persistNodePlacementForLeftTree])

  const createArticleCopyNodeForPaste = useCallback(async (article, targetParentId) => {
    const { data } = await fetchArticle({
      variables: { id: article.id },
    })
    const rawContent = data?.article?.content ?? null
    const content =
      rawContent && typeof rawContent === 'object' && rawContent.type === 'doc'
        ? rawContent
        : null

    const result = await createArticleWithFilter({
      title: buildCopiedTitle(article.title),
      sectionId: targetParentId,
      content,
    })

    const createdArticle = result?.data?.createArticle
    if (!createdArticle?.id) return null

    persistNodeFilterById(createdArticle.id)
    return {
      id: createdArticle.id,
      type: 'article',
      title: createdArticle.title,
      editor: 'tiptap',
      filter: normalizedDocFilter,
    }
  }, [
    createArticleWithFilter,
    fetchArticle,
    normalizedDocFilter,
    persistNodeFilterById,
  ])

  const pasteCopiedItemsAtTarget = useCallback(async () => {
    if (!canManage) return
    if (leftTreePasteBusy) return
    if (!leftTreeCopyBuffer?.ids?.length) return
    if (!leftTreePasteTargetHint) return

    const batchTargets = collectBatchTargets(leftTreeCopyBuffer.ids)
    if (!batchTargets.length) return

    const targetParentId = String(leftTreePasteTargetHint.parentId ?? 'root')
    let insertIndex =
      leftTreePasteTargetHint.position === 'before'
        ? Number(leftTreePasteTargetHint.index) || 0
        : (Number(leftTreePasteTargetHint.index) || 0) + 1

    setLeftTreePasteBusy(true)
    try {
      const copiedNodes = []

      for (const source of batchTargets) {
        if (!source?.item) continue
        if (source.item.type === 'section') {
          const copiedSectionNode = await copySectionBranch(
            source.item,
            targetParentId === 'root' ? null : targetParentId,
            true,
            true
          )
          if (copiedSectionNode) {
            copiedNodes.push(copiedSectionNode)
          }
          continue
        }

        if (source.item.type === 'article') {
          const copiedArticleNode = await createArticleCopyNodeForPaste(
            source.item,
            targetParentId === 'root' ? null : targetParentId
          )
          if (copiedArticleNode) {
            copiedNodes.push(copiedArticleNode)
          }
        }
      }

      if (!copiedNodes.length) return

      const nextTree = structuredClone(tree)
      const insertedIds = []
      for (const copiedNode of copiedNodes) {
        insertAt(nextTree, targetParentId, insertIndex, copiedNode)
        insertIndex += 1
        insertedIds.push(String(copiedNode.id))
      }

      setTree(nextTree)
      setLeftTreeLassoSelectedIds(insertedIds)
      leftTreeLassoLastClickedIdRef.current = insertedIds[insertedIds.length - 1] || null
      setLeftTreePasteHoverHint(null)
      setLeftTreePasteTargetHint((prev) => prev)

      try {
        await persistSiblingOrderingForParent(nextTree, targetParentId)
        markSaveSuccess()
      } catch (persistError) {
        console.error('Failed to persist pasted items ordering:', persistError)
      }
    } finally {
      setLeftTreePasteBusy(false)
    }
  }, [
    canManage,
    collectBatchTargets,
    copySectionBranch,
    createArticleCopyNodeForPaste,
    leftTreeCopyBuffer,
    leftTreePasteBusy,
    leftTreePasteTargetHint,
    markSaveSuccess,
    persistSiblingOrderingForParent,
    tree,
  ])

  useEffect(() => {
    const onGlobalMouseDown = (event) => {
      if (leftTreeLassoRef.current.active) return
      if (event.altKey) return
      if (!leftTreeLassoSelectedIds.length) return
      const target = event.target
      if (!(target instanceof Element)) return
      if (target.closest('.doc-left-tree')) return
      setLeftTreeLassoSelectedIds([])
    }

    const onKeyDown = (event) => {
      if (leftTreeLassoRef.current.active) return
      if (isFormFieldTarget(event.target)) return

      if (event.key === 'Escape') {
        if (leftTreeCopyBuffer) {
          setLeftTreeCopyBuffer(null)
          setLeftTreePasteHoverHint(null)
          setLeftTreePasteTargetHint(null)
        }
        if (!leftTreeLassoSelectedIds.length) return
        event.preventDefault()
        event.stopPropagation()
        setLeftTreeLassoSelectedIds([])
        return
      }

      if (
        (event.ctrlKey || event.metaKey) &&
        (event.key === 'v' || event.key === 'V') &&
        leftTreeCopyBuffer?.ids?.length &&
        leftTreePasteTargetHint &&
        canManage
      ) {
        const sel = typeof window !== 'undefined' ? window.getSelection?.() : null
        if (sel && !sel.isCollapsed) return
        event.preventDefault()
        event.stopPropagation()
        void pasteCopiedItemsAtTarget()
        return
      }

      if (!leftTreeLassoSelectedIds.length) return

      if (!canManage) return

      if (event.key === 'Backspace' || event.key === 'Delete') {
        event.preventDefault()
        event.stopPropagation()
        void deleteSelectedItems(leftTreeLassoSelectedIds)
        return
      }

      if ((event.ctrlKey || event.metaKey) && (event.key === 'c' || event.key === 'C')) {
        const sel = typeof window !== 'undefined' ? window.getSelection?.() : null
        if (sel && !sel.isCollapsed) return
        event.preventDefault()
        event.stopPropagation()
        setLeftTreeCopyBuffer({
          ids: Array.from(new Set(leftTreeLassoSelectedIds.map((id) => String(id)))),
          createdAt: Date.now(),
        })
        setLeftTreePasteHoverHint(null)
        setLeftTreePasteTargetHint(null)
      }
    }

    document.addEventListener('mousedown', onGlobalMouseDown, true)
    document.addEventListener('keydown', onKeyDown, true)
    return () => {
      document.removeEventListener('mousedown', onGlobalMouseDown, true)
      document.removeEventListener('keydown', onKeyDown, true)
    }
  }, [
    canManage,
    leftTreeCopyBuffer,
    leftTreePasteTargetHint,
    deleteSelectedItems,
    leftTreeLassoSelectedIds,
    pasteCopiedItemsAtTarget,
  ])

  /* ===== drag & drop ===== */

  const handleDrop = async (targetId, targetIndex, parentId, dragging = dragState) => {
    if (!canManage) return
    if (!dragging) return

    if (dragging.id === parentId) {
      setDragState(null)
      setDropHint(null)
      return
    }

    if (parentId !== 'root') {
      if (isDescendant(tree, dragging.id, parentId)) {
        setDragState(null)
        setDropHint(null)
        return
      }
    }

    const prevTree = structuredClone(tree)
    const nextTree = structuredClone(tree)
    const removed = findAndRemove(nextTree, dragging.id)
    if (!removed) {
      setDragState(null)
      setDropHint(null)
      return
    }

    let insertIndex = targetIndex
    if (removed.parentId === parentId && dragging.index < targetIndex) {
      insertIndex -= 1
    }

    insertAt(nextTree, parentId, insertIndex, removed.item)
    setTree(nextTree)
    setDragState(null)
    setDropHint(null)

    const nextParentId = parentId === 'root' ? null : parentId

    const isUnsupportedOrderFieldError = (error, fieldName) => {
      const messages = [
        error?.message,
        ...(Array.isArray(error?.graphQLErrors)
          ? error.graphQLErrors.map(gqlError => gqlError?.message)
          : []),
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()

      return (
        messages.includes(fieldName) &&
        (messages.includes('not defined') ||
          messages.includes('unknown field') ||
          messages.includes('cannot query field') ||
          messages.includes('validation'))
      )
    }

    const saveSectionPlacement = async (id, baseInput, nodeIndex) => {
      try {
        await updateSectionWithFilter(id, {
          ...baseInput,
          index: nodeIndex,
        })
        return true
      } catch (errorWithIndex) {
        if (!isUnsupportedOrderFieldError(errorWithIndex, 'index')) {
          throw errorWithIndex
        }
      }

      await updateSectionWithFilter(id, {
        ...baseInput,
        order: nodeIndex,
      })
      return true
    }

    const saveArticlePlacement = async (id, baseInput, nodeIndex) => {
      try {
        await updateArticleWithFilter(id, {
          ...baseInput,
          index: nodeIndex,
        })
        return true
      } catch (errorWithIndex) {
        if (!isUnsupportedOrderFieldError(errorWithIndex, 'index')) {
          throw errorWithIndex
        }
      }

      await updateArticleWithFilter(id, {
        ...baseInput,
        order: nodeIndex,
      })
      return true
    }

    const persistNodePlacement = async (
      node,
      nextNodeParentId,
      nodeIndex,
      fallbackWithoutIndex = false
    ) => {
      if (!node?.id) return true

      if (node.type === 'section') {
        const baseInput = {
          title: String(node.title || '').trim(),
          parentId: nextNodeParentId,
        }

        try {
          await saveSectionPlacement(node.id, baseInput, nodeIndex)
          persistNodeFilterById(node.id)
          return true
        } catch (orderFieldError) {
          if (
            !fallbackWithoutIndex ||
            (!isUnsupportedOrderFieldError(orderFieldError, 'index') &&
              !isUnsupportedOrderFieldError(orderFieldError, 'order'))
          ) {
            throw orderFieldError
          }

          await updateSectionWithFilter(node.id, baseInput)
          persistNodeFilterById(node.id)
          return false
        }
      }

      const baseInput = {
        title: String(node.title || '').trim(),
        sectionId: nextNodeParentId,
      }

      try {
        await saveArticlePlacement(node.id, baseInput, nodeIndex)
        persistNodeFilterById(node.id)
        return true
      } catch (orderFieldError) {
        if (
          !fallbackWithoutIndex ||
          (!isUnsupportedOrderFieldError(orderFieldError, 'index') &&
            !isUnsupportedOrderFieldError(orderFieldError, 'order'))
        ) {
          throw orderFieldError
        }

        await updateArticleWithFilter(node.id, baseInput)
        persistNodeFilterById(node.id)
        return false
      }
    }

    try {
      const movedNodeIndexSaved = await persistNodePlacement(
        removed.item,
        nextParentId,
        insertIndex,
        true
      )

      if (movedNodeIndexSaved) {
        const affectedParentIds = Array.from(new Set([removed.parentId, parentId]))

        for (const affectedParentId of affectedParentIds) {
          const siblings = getChildrenByParentId(nextTree, affectedParentId)
          if (!Array.isArray(siblings)) continue

          const siblingParentId =
            affectedParentId === 'root' ? null : affectedParentId

          for (let siblingIndex = 0; siblingIndex < siblings.length; siblingIndex += 1) {
            await persistNodePlacement(
              siblings[siblingIndex],
              siblingParentId,
              siblingIndex,
              false
            )
          }
        }
      }

      markSaveSuccess()
    } catch (error) {
      console.error('Failed to persist moved item:', error)
      setTree(prevTree)
    }
  }

  const clearSearch = () => {
    setSearchQuery('')
    setFilterType('all')
  }

  const openSearchModal = () => {
    closeAllLeftModals()
    announceModalOpen()
    setShowSearch(true)
  }

  const openCopyModal = (data) => {
    if (!canManage) return
    closeAllLeftModals()
    announceModalOpen()
    setCopyModal(data)
  }

  const openDeleteConfirm = ({ id, title }) => {
    if (!canManage) return
    closeAllLeftModals()
    announceModalOpen()
    setDeleteConfirm({ id, title })
  }

  // Р В¤РЎС“Р Р…Р С”РЎвЂ Р С‘РЎРЏ Р Т‘Р В»РЎРЏ Р С—Р ВµРЎР‚Р ВµРЎвЂ¦Р С•Р Т‘Р В° Р С” РЎРЊР В»Р ВµР СР ВµР Р…РЎвЂљРЎС“ Р Р† Р Т‘Р ВµРЎР‚Р ВµР Р†Р Вµ
  const navigateToItem = (item) => {
    if (item.type === 'article') {
      onSelectFile(item.id)
    }
    
    // Р вЂ”Р В°Р С”РЎР‚РЎвЂ№Р Р†Р В°Р ВµР С Р С—Р С•Р С‘РЎРѓР С” Р С—Р С•РЎРѓР В»Р Вµ Р Р†РЎвЂ№Р В±Р С•РЎР‚Р В°
    setShowSearch(false)
  }

  /* ===== render ===== */

  return (
    <div
      className={`doc-left ${leftTreeCopyBuffer ? 'copy-insert-mode' : ''} ${leftTreeAltMode ? 'alt-lasso-cursor' : ''}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onMouseDownCapture={handleDocLeftMouseDownCapture}
      onClickCapture={handleDocLeftClickCapture}
    >
      <div className="doc-left-header">
        <div className="header-content">
          <span></span>
          <div className="header-actions">
            {showSaveIndicator && (
              <span
                className="save-indicator-dot"
                title={'\u0421\u043e\u0445\u0440\u0430\u043d\u0435\u043d\u043e'}
                aria-label={'\u0421\u043e\u0445\u0440\u0430\u043d\u0435\u043d\u043e'}
              />
            )}
            <button
              className="search-toggle-btn"
              onClick={openSearchModal}
              title={'\u041f\u043e\u0438\u0441\u043a'}
              aria-label={'\u041f\u043e\u0438\u0441\u043a'}
            >
              <IconSearch size={16} />
            </button>
          </div>
        </div>
      </div>

      <div
        ref={leftTreeRef}
        className="doc-left-tree"
        onMouseDownCapture={handleLeftTreeLassoMouseDownCapture}
        onMouseMoveCapture={handleLeftTreeMouseMoveCapture}
        onMouseLeave={handleLeftTreeMouseLeave}
        onClickCapture={handleLeftTreeClickCapture}
      >
        {leftTreeLassoRectStyle && (
          <div className="doc-left-tree-lasso-rect" style={leftTreeLassoRectStyle} />
        )}
        {searchResults ? (
            // Р СџР С•Р С”Р В°Р В·РЎвЂ№Р Р†Р В°Р ВµР С РЎР‚Р ВµР В·РЎС“Р В»РЎРЉРЎвЂљР В°РЎвЂљРЎвЂ№ Р С—Р С•Р С‘РЎРѓР С”Р В°
            <div className="search-results">
              <div className="search-info">
                {'\u041d\u0430\u0439\u0434\u0435\u043d\u043e'}: {searchResults.length} {'\u0440\u0435\u0437\u0443\u043b\u044c\u0442\u0430\u0442\u043e\u0432'}
                <button 
                  className="clear-search-btn"
                  onClick={clearSearch}
                  title={'\u041e\u0447\u0438\u0441\u0442\u0438\u0442\u044c \u043f\u043e\u0438\u0441\u043a'}
                >
                  <IconX size={12} />
                </button>
              </div>
              {searchResults.map((result, index) => (
                <div 
                  key={`search-${result.id}-${index}`}
                  className="search-result-item"
                  onClick={() => navigateToItem(result)}
                >
                  <div className="search-result-type">
                    {result.type === 'section' ? (
                      <IconFolder size={16} />
                    ) : (
                      <IconFile size={16} />
                    )}
                  </div>
                  <div className="search-result-content">
                    <div className="search-result-title">
                      {result.title}
                    </div>
                    {result.path && result.path !== result.title && (
                      <div className="search-result-path">
                        {result.path}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            // Р СџР С•Р С”Р В°Р В·РЎвЂ№Р Р†Р В°Р ВµР С Р С•Р В±РЎвЂ№РЎвЂЎР Р…Р С•Р Вµ Р Т‘Р ВµРЎР‚Р ВµР Р†Р С•
            <>
              {tree.map((item, index) => (
                <TreeItem
                  key={item.id}
                  item={item}
                  index={index}
                  parentId="root"
                  activeDocId={activeDocId}
                  onSelectFile={onSelectFile}
                  toggleSection={toggleSection}
                  startCreate={startCreate}
                  renameItem={renameItem}
                  deleteItem={deleteItem}
                  creating={creating}
                  setCreating={setCreating}
                  commitCreate={commitCreate}
                  setTree={setTree}
                  openCopyModal={openCopyModal}
                  openDeleteConfirm={openDeleteConfirm}
                  copySectionOnServer={copySectionOnServer}
                  copyArticleWithContent={copyArticleWithContent}
                  copySelectedItems={copySelectedItems}
                  deleteSelectedItems={deleteSelectedItems}
                  dragState={dragState}
                  setDragState={setDragState}
                  handleDrop={handleDrop}
                  dropHint={dropHint}
                  setDropHint={setDropHint}
                  isDescendant={isDescendant}
                  tree={tree}
                  canManage={canManage}
                  lassoSelectedIds={leftTreeLassoSelectedIds}
                  suppressTreeClickUntilRef={suppressTreeClickUntilRef}
                  pasteHoverHint={leftTreePasteHoverHint}
                  pasteTargetHint={leftTreePasteTargetHint}
                />
              ))}

              <div
                className="drop-zone-end"
                onDragOver={(e) => {
                  if (!canManage) return
                  e.preventDefault()
                }}
                onDrop={() => {
                  if (!canManage) return
                  handleDrop(null, tree.length, 'root')
                }}
              />

              {canManage && creating?.parentId === 'root' && (
                <CreateRow
                  creating={creating}
                  setCreating={setCreating}
                  commitCreate={commitCreate}
                />
              )}

              {canManage && !creating && (
                <button
                  className={`root-plus ${hovered ? 'visible' : ''}`}
                  onClick={() => startCreate('root')}
                >
                  +
                </button>
              )}
            </>
          )}
      </div>

      {/* Р СљР С•Р Т‘Р В°Р В»РЎРЉР Р…Р С•Р Вµ Р С•Р С”Р Р…Р С• Р С—Р С•Р С‘РЎРѓР С”Р В° */}
      {showSearch && (
        <SearchModal
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          filterType={filterType}
          setFilterType={setFilterType}
          onClose={closeAllLeftModals}
          onClear={clearSearch}
        />
      )}

      {canManage && copyModal && (
        <CopyModal
          data={copyModal}
          onClose={closeAllLeftModals}
          onOnlyFolder={async () => {
            await copySectionOnServer(copyModal.section, false)
            closeAllLeftModals()
          }}
          onWithContent={async () => {
            await copySectionOnServer(copyModal.section, true)
            closeAllLeftModals()
          }}
        />
      )}

      {canManage && deleteConfirm && (
        <DeleteConfirm
          title={deleteConfirm.title}
          onCancel={() => setDeleteConfirm(null)}
          onConfirm={() => {
            deleteItem(deleteConfirm.id)
            setDeleteConfirm(null)
          }}
        />
      )}

      {lastDeleted && (
        <UndoToast
          key={lastDeleted.toastId}
          itemType={lastDeleted.item?.type}
          title={lastDeleted.item?.title}
          itemCount={
            Number.isFinite(lastDeleted.count)
              ? lastDeleted.count
              : Array.isArray(lastDeleted.entries)
                ? lastDeleted.entries.length
                : 1
          }
          onUndo={() => undoDelete(lastDeleted.toastId)}
          onClose={() => commitDelete(lastDeleted.toastId)}
        />
      )}
    </div>
  )
}


/* ================= TREE ITEM ================= */

function TreeItem({
  item,
  parentId,
  index,
  activeDocId,
  onSelectFile,
  toggleSection,
  startCreate,
  renameItem,
  deleteItem,
  creating,
  setCreating,
  commitCreate,
  setTree,
  openCopyModal,
  openDeleteConfirm,
  copySectionOnServer,
  copyArticleWithContent,
  copySelectedItems,
  deleteSelectedItems,
  dragState,
  setDragState,
  handleDrop,
  dropHint,
  setDropHint,
  isDescendant,
  tree,
  canManage,
  lassoSelectedIds,
  suppressTreeClickUntilRef,
  pasteHoverHint,
  pasteTargetHint,
}) {
  const [editing, setEditing] = useState(false)
  const [flash, setFlash] = useState(false)

  const ignoreToggleRef = useRef(false)

  const isSection = item.type === 'section'
  const hasChildren = item.children?.length > 0
  const isDragging = dragState?.id === item.id
  const isActiveArticle =
    item.type === 'article' &&
    String(item.id) === String(activeDocId)
  const isLassoSelected =
    Array.isArray(lassoSelectedIds) &&
    lassoSelectedIds.includes(String(item.id))
  const hasMultiLassoSelection =
    Array.isArray(lassoSelectedIds) && lassoSelectedIds.length > 1
  const isPasteHoverBefore =
    pasteHoverHint &&
    String(pasteHoverHint.id) === String(item.id) &&
    pasteHoverHint.position === 'before'
  const isPasteHoverAfter =
    pasteHoverHint &&
    String(pasteHoverHint.id) === String(item.id) &&
    pasteHoverHint.position === 'after'
  const isPasteTargetBefore =
    pasteTargetHint &&
    String(pasteTargetHint.id) === String(item.id) &&
    pasteTargetHint.position === 'before'
  const isPasteTargetAfter =
    pasteTargetHint &&
    String(pasteTargetHint.id) === String(item.id) &&
    pasteTargetHint.position === 'after'

  useEffect(() => {
    if (!canManage) {
      setEditing(false)
    }
  }, [canManage])

  const preventToggle = (e) => {
    e.stopPropagation()
    ignoreToggleRef.current = true
  }

  const triggerFlash = () => {
    setFlash(true)
    setTimeout(() => setFlash(false), 400)
  }

  return (
    <div className="tree-node">
      <div
        className={`tree-item ${item.type}
          ${isActiveArticle ? 'is-active' : ''}
          ${isLassoSelected ? 'lasso-selected' : ''}
          ${isPasteHoverBefore ? 'paste-hover-before' : ''}
          ${isPasteHoverAfter ? 'paste-hover-after' : ''}
          ${isPasteTargetBefore ? 'paste-target-before' : ''}
          ${isPasteTargetAfter ? 'paste-target-after' : ''}
          ${flash ? 'copied-flash' : ''}
          ${isDragging ? 'dragging' : ''}
          ${dropHint?.id === item.id && dropHint.position === 'inside' ? 'drop-inside' : ''}
          ${dropHint?.id === item.id && dropHint.position === 'before' ? 'drop-before' : ''}
          ${dropHint?.id === item.id && dropHint.position === 'after' ? 'drop-after' : ''}
        `}
        data-doc-tree-id={item.id}
        data-doc-tree-type={item.type}
        data-doc-tree-parent-id={parentId ?? 'root'}
        data-doc-tree-index={index}
        draggable={canManage}
        onDragStart={() => {
          if (!canManage) return
          ignoreToggleRef.current = true
          setDragState({ id: item.id, parentId, index })
        }}
        onDragEnd={() => {
          if (!canManage) return
          setDragState(null)
          setDropHint(null)
          ignoreToggleRef.current = false
        }}
        onDragOver={(e) => {
          if (!canManage) return
          e.preventDefault()

          const rect = e.currentTarget.getBoundingClientRect()
          const offsetY = e.clientY - rect.top
          const height = rect.height

          let position = 'inside'
          if (offsetY < height * 0.25) position = 'before'
          else if (offsetY > height * 0.75) position = 'after'
          else if (item.type !== 'section') return

          setDropHint({ id: item.id, position })
        }}
        onDragLeave={() => {
          if (!canManage) return
          setDropHint(null)
        }}
        onDrop={() => {
          if (!canManage) return
          if (!dropHint || dropHint.id !== item.id) return

          // Р СџРЎР‚Р С•Р Р†Р ВµРЎР‚Р С”Р В°: Р Р…Р ВµР В»РЎРЉР В·РЎРЏ Р С—Р ВµРЎР‚Р ВµР СР ВµРЎвЂ°Р В°РЎвЂљРЎРЉ РЎРЊР В»Р ВµР СР ВµР Р…РЎвЂљ Р Р†Р Р…РЎС“РЎвЂљРЎР‚РЎРЉ РЎРѓР В°Р СР С•Р С–Р С• РЎРѓР ВµР В±РЎРЏ
          if (dragState && dragState.id === item.id && dropHint.position === 'inside') {
            setDropHint(null)
            return
          }

          // Р СџРЎР‚Р С•Р Р†Р ВµРЎР‚Р С”Р В°: Р Р…Р ВµР В»РЎРЉР В·РЎРЏ Р С—Р ВµРЎР‚Р ВµР СР ВµРЎвЂ°Р В°РЎвЂљРЎРЉ РЎР‚Р С•Р Т‘Р С‘РЎвЂљР ВµР В»РЎРЏ Р Р† Р С—Р С•РЎвЂљР С•Р СР С”Р В°
          if (dropHint.position === 'inside' && item.type === 'section' && dragState) {
            // Р СџРЎР‚Р С•Р Р†Р ВµРЎР‚РЎРЏР ВµР С, Р Р…Р Вµ РЎРЏР Р†Р В»РЎРЏР ВµРЎвЂљРЎРѓРЎРЏ Р В»Р С‘ РЎвЂљР ВµР С”РЎС“РЎвЂ°Р С‘Р в„– РЎРЊР В»Р ВµР СР ВµР Р…РЎвЂљ (item) Р С—Р С•РЎвЂљР С•Р СР С”Р С•Р С dragState
            if (isDescendant && isDescendant(tree, dragState.id, item.id)) {
              setDropHint(null)
              return
            }
          }

          if (dropHint.position === 'inside' && item.type === 'section') {
            handleDrop(item.id, 0, item.id)
            setDropHint(null)
            return
          }

          const targetIndex =
            dropHint.position === 'before' ? index : index + 1

          handleDrop(item.id, targetIndex, parentId)
          setDropHint(null)
        }}
        onClick={(e) => {
          if (
            e.altKey ||
            (suppressTreeClickUntilRef?.current &&
              Date.now() < suppressTreeClickUntilRef.current)
          ) {
            return
          }

          if (ignoreToggleRef.current) {
            ignoreToggleRef.current = false
            return
          }

          if (item.type === 'article') {
            onSelectFile(item.id)
          } else {
            toggleSection(item.id)
          }
        }}
      >
        {/* РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚ TOP ROW РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚ */}
        <div className="tree-row tree-row-title">
          <div
            className={`tree-row-left tree-row-left-title ${
              canManage ? 'is-manageable' : ''
            }`}
          >
            {canManage && (
              <span
                className="drag-handle drag-handle-inline"
                onMouseDown={preventToggle}
              >
                <IconGripVertical size={16} />
              </span>
            )}

            <div className="tree-title-and-arrow">
              {!editing ? (
                <div className="tree-title-text tree-title-shift">
                  <ExpandableTitle title={item.title} />
                </div>
              ) : (
                <input
                  className="rename-input tree-title-shift"
                  autoFocus
                  defaultValue={item.title}
                  onMouseDown={preventToggle}
                  onBlur={(e) => {
                    renameItem(item.id, e.target.value)
                    setEditing(false)
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      renameItem(item.id, e.target.value)
                      setEditing(false)
                    }
                    if (e.key === 'Escape') setEditing(false)
                  }}
                />
              )}

              {isSection && (
                <span
                  className="folder-arrow folder-arrow-inline"
                  onMouseDown={preventToggle}
                  onClick={() => toggleSection(item.id)}
                >
                  {item.isOpen ? (
                    <IconChevronDown size={16} />
                  ) : (
                    <IconChevronUp size={16} />
                  )}
                </span>
              )}
            </div>
          </div>

          <div className="tree-row-right">
            {canManage && isSection && (
                <button
                  className="action-btn"
                  title={'\u0414\u043e\u0431\u0430\u0432\u0438\u0442\u044c'}
                  onMouseDown={preventToggle}
                  onClick={() => startCreate(item.id)}
                >
                <IconPlus size={16} />
              </button>
            )}

            {canManage && (
              <>
                {/* COPY */}
                <button
                  className="action-btn"
                  title={'\u041a\u043e\u043f\u0438\u0440\u043e\u0432\u0430\u0442\u044c'}
                  onMouseDown={preventToggle}
                  onClick={async (e) => {
                    if (isLassoSelected && hasMultiLassoSelection) {
                      await copySelectedItems(lassoSelectedIds)
                      return
                    }

                    const rect = e.currentTarget.getBoundingClientRect()
                    const x = Math.min(rect.right + 6, window.innerWidth - 200)
                    const y = Math.min(rect.top, window.innerHeight - 120)

                    if (item.type === 'article') {
                      await copyArticleWithContent(item)
                      triggerFlash()
                      return
                    }

                    if (!hasChildren) {
                      const copied = await copySectionOnServer(item, false)
                      if (copied) triggerFlash()
                    } else {
                      openCopyModal({ section: item, x, y })
                    }
                  }}
                >
                  <IconCopy size={16} />
                </button>

                <button
                  className="action-btn"
                  title={'\u041f\u0435\u0440\u0435\u0438\u043c\u0435\u043d\u043e\u0432\u0430\u0442\u044c'}
                  onMouseDown={preventToggle}
                  onClick={() => setEditing(true)}
                >
                  <IconPencil size={16} />
                </button>

                <button
                  className="action-btn danger"
                  title={'\u0423\u0434\u0430\u043b\u0438\u0442\u044c'}
                  onMouseDown={preventToggle}
                  onClick={() => {
                    if (isLassoSelected && hasMultiLassoSelection) {
                      void deleteSelectedItems(lassoSelectedIds)
                      return
                    }
                    if (hasChildren) openDeleteConfirm({ id: item.id, title: item.title })
                    else deleteItem(item.id)
                  }}
                >
                  <IconTrash size={16} />
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* CREATE */}
      {canManage && creating?.parentId === item.id && (
        <CreateRow
          creating={creating}
          setCreating={setCreating}
          commitCreate={commitCreate}
        />
      )}

      {/* CHILDREN */}
      {isSection && item.isOpen && item.children && (
        <div className="tree-children">
          {item.children.map((child, i) => (
            <TreeItem
              key={child.id}
              item={child}
              parentId={item.id}
              index={i}
              activeDocId={activeDocId}
              onSelectFile={onSelectFile}
              toggleSection={toggleSection}
              startCreate={startCreate}
              renameItem={renameItem}
              deleteItem={deleteItem}
              creating={creating}
              setCreating={setCreating}
              commitCreate={commitCreate}
              setTree={setTree}
              openCopyModal={openCopyModal}
              openDeleteConfirm={openDeleteConfirm}
              copySectionOnServer={copySectionOnServer}
              copyArticleWithContent={copyArticleWithContent}
              copySelectedItems={copySelectedItems}
              deleteSelectedItems={deleteSelectedItems}
              dragState={dragState}
              setDragState={setDragState}
              handleDrop={handleDrop}
              dropHint={dropHint}
              setDropHint={setDropHint}
              isDescendant={isDescendant}
              tree={tree}
              canManage={canManage}
              lassoSelectedIds={lassoSelectedIds}
              suppressTreeClickUntilRef={suppressTreeClickUntilRef}
              pasteHoverHint={pasteHoverHint}
              pasteTargetHint={pasteTargetHint}
            />
          ))}
        </div>
      )}
    </div>
  )
}

/* ================= SEARCH MODAL ================= */
function SearchModal({ searchQuery, setSearchQuery, filterType, setFilterType, onClose, onClear }) {
  const modalRef = useRef(null)
  const inputRef = useRef(null)
  const [position, setPosition] = useState({ x: 100, y: 50 })
  const offsetRef = useRef({ x: 0, y: 0 })

  // Р В¤Р С•Р С”РЎС“РЎРѓ Р Р…Р В° input Р С—РЎР‚Р С‘ Р С•РЎвЂљР С”РЎР‚РЎвЂ№РЎвЂљР С‘Р С‘
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus()
    }
  }, [])

  // Drag Р Т‘Р В»РЎРЏ Р СР С•Р Т‘Р В°Р В»РЎРЉР Р…Р С•Р С–Р С• Р С•Р С”Р Р…Р В°
  const handleMouseDown = (e) => {
    if (!e.target.closest('.modal-draggable-header')) return
    
    e.preventDefault()
    
    if (!modalRef.current) return
    
    const rect = modalRef.current.getBoundingClientRect()
    offsetRef.current = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    }

    const handleMouseMove = (moveEvent) => {
      const newX = moveEvent.clientX - offsetRef.current.x
      const newY = moveEvent.clientY - offsetRef.current.y
      
      // Р С›Р С–РЎР‚Р В°Р Р…Р С‘РЎвЂЎР С‘Р Р†Р В°Р ВµР С Р С—Р ВµРЎР‚Р ВµР СР ВµРЎвЂ°Р ВµР Р…Р С‘Р Вµ Р Р† Р С—РЎР‚Р ВµР Т‘Р ВµР В»Р В°РЎвЂ¦ Р С•Р С”Р Р…Р В°
      const boundedX = Math.max(10, Math.min(newX, window.innerWidth - rect.width - 10))
      const boundedY = Math.max(10, Math.min(newY, window.innerHeight - rect.height - 10))
      
      setPosition({ x: boundedX, y: boundedY })
    }

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
  }

  // Р вЂ”Р В°Р С”РЎР‚РЎвЂ№РЎвЂљР С‘Р Вµ Р С—РЎР‚Р С‘ Р Р…Р В°Р В¶Р В°РЎвЂљР С‘Р С‘ Escape
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }
    
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [onClose])

  if (typeof document === 'undefined') return null

  return createPortal(
    <div 
      className="search-modal" 
      ref={modalRef}
      style={{
        position: 'fixed',
        left: `${position.x}px`,
        top: `${position.y}px`
      }}
    >
      <div 
        className="search-modal-header modal-draggable-header"
        onMouseDown={handleMouseDown}
      >
        <span>Поиск</span>
        <button className="modal-close-btn" onClick={onClose} aria-label={'\u0417\u0430\u043a\u0440\u044b\u0442\u044c'}>
          <IconX size={16} />
        </button>
      </div>
      
      <div className="search-modal-body">
        <div className="search-input-wrapper">
          <input
            ref={inputRef}
            type="text"
            className="search-input"
            placeholder={'\u0412\u0432\u0435\u0434\u0438\u0442\u0435 \u043d\u0430\u0437\u0432\u0430\u043d\u0438\u0435 \u043f\u0430\u043f\u043a\u0438 \u0438\u043b\u0438 \u0434\u043e\u043a\u0443\u043c\u0435\u043d\u0442\u0430...'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button 
              className="clear-input-btn"
              onClick={() => setSearchQuery('')}
              title={'\u041e\u0447\u0438\u0441\u0442\u0438\u0442\u044c'}
              aria-label={'\u041e\u0447\u0438\u0441\u0442\u0438\u0442\u044c'}
            >
              <IconX size={14} />
            </button>
          )}
        </div>
        
        <div className="filter-buttons">
          <button
            className={`filter-btn ${filterType === 'all' ? 'active' : ''}`}
            onClick={() => setFilterType('all')}
          >
            {'\u0412\u0441\u0435'}
          </button>
          <button
            className={`filter-btn ${filterType === 'section' ? 'active' : ''}`}
            onClick={() => setFilterType('section')}
          >
            <IconFolder size={14} />
            <span>{'\u041f\u0430\u043f\u043a\u0438'}</span>
          </button>
          <button
            className={`filter-btn ${filterType === 'article' ? 'active' : ''}`}
            onClick={() => setFilterType('article')}
          >
            <IconFile size={14} />
            <span>{'\u0414\u043e\u043a\u0443\u043c\u0435\u043d\u0442\u044b'}</span>
          </button>
        </div>
      </div>
      
      <div className="search-modal-footer">
        <button 
          className="clear-all-btn"
          onClick={onClear}
          disabled={!searchQuery && filterType === 'all'}
        >
          {'\u041e\u0447\u0438\u0441\u0442\u0438\u0442\u044c \u043f\u043e\u0438\u0441\u043a'}
        </button>
      </div>
    </div>,
    document.body
  )
}

/* ================= UI ================= */
function CopyModal({ data, onClose, onOnlyFolder, onWithContent }) {
  const ref = useRef(null)
  const [position, setPosition] = useState({ x: data.x, y: data.y })
  const [titleExpanded, setTitleExpanded] = useState(false)
  const offsetRef = useRef({ x: 0, y: 0 })

  // Р вЂ”Р В°Р С”РЎР‚РЎвЂ№РЎвЂљР С‘Р Вµ Р С—РЎР‚Р С‘ Р С”Р В»Р С‘Р С”Р Вµ Р Р†Р Р…Р Вµ Р СР С•Р Т‘Р В°Р В»РЎРЉР Р…Р С•Р С–Р С• Р С•Р С”Р Р…Р В°
  const handleClickOutside = useCallback((e) => {
    if (!ref.current) return
    if (ref.current.contains(e.target)) return
    onClose()
  }, [onClose])

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [handleClickOutside])

  // Drag Р Т‘Р В»РЎРЏ Р СР С•Р Т‘Р В°Р В»РЎРЉР Р…Р С•Р С–Р С• Р С•Р С”Р Р…Р В°
  const handleMouseDown = (e) => {
    if (!e.target.closest('.copy-modal-header')) return
    
    e.preventDefault()
    
    if (!ref.current) return
    
    const rect = ref.current.getBoundingClientRect()
    offsetRef.current = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    }

    const handleMouseMove = (moveEvent) => {
      const newX = moveEvent.clientX - offsetRef.current.x
      const newY = moveEvent.clientY - offsetRef.current.y
      
      // Р С›Р С–РЎР‚Р В°Р Р…Р С‘РЎвЂЎР С‘Р Р†Р В°Р ВµР С Р С—Р ВµРЎР‚Р ВµР СР ВµРЎвЂ°Р ВµР Р…Р С‘Р Вµ Р Р† Р С—РЎР‚Р ВµР Т‘Р ВµР В»Р В°РЎвЂ¦ Р С•Р С”Р Р…Р В°
      const boundedX = Math.max(10, Math.min(newX, window.innerWidth - rect.width - 10))
      const boundedY = Math.max(10, Math.min(newY, window.innerHeight - rect.height - 10))
      
      setPosition({ x: boundedX, y: boundedY })
    }

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
  }

  if (typeof document === 'undefined') return null

  return createPortal(
    <div
      ref={ref}
      className="copy-modal"
      style={{ 
        position: 'fixed',
        left: `${position.x}px`,
        top: `${position.y}px`,
        minHeight: titleExpanded ? 'auto' : '140px'
      }}
    >
      <div 
        className="copy-modal-header modal-draggable-header"
        onMouseDown={handleMouseDown}
      >
        <span>{'\u041a\u043e\u043f\u0438\u0440\u043e\u0432\u0430\u043d\u0438\u0435 \u043f\u0430\u043f\u043a\u0438'}</span>
        <button className="modal-close-btn" onClick={onClose} aria-label={'\u0417\u0430\u043a\u0440\u044b\u0442\u044c'}>
          <IconX size={16} />
        </button>
      </div>
      <div className="copy-modal-body">
        <div className="copy-hint">
          {'\u0412 \u043f\u0430\u043f\u043a\u0435'} <b className="copy-folder-name">
            <ExpandableTitle 
              title={data.section.title} 
              onExpandChange={setTitleExpanded}
            />
          </b> {'\u0435\u0441\u0442\u044c \u0441\u043e\u0434\u0435\u0440\u0436\u0438\u043c\u043e\u0435'}
        </div>

        <button onClick={onOnlyFolder}>{'\u0422\u043e\u043b\u044c\u043a\u043e \u043f\u0430\u043f\u043a\u0443'}</button>
        <button onClick={onWithContent}>{'\u0421 \u0441\u043e\u0434\u0435\u0440\u0436\u0438\u043c\u044b\u043c'}</button>
      </div>
    </div>,
    document.body
  )
}

function DeleteConfirm({ title, onCancel, onConfirm }) {
  const ref = useRef(null)
  const [position, setPosition] = useState(getDeleteModalStartPosition)
  const [titleExpanded, setTitleExpanded] = useState(false)
  const offsetRef = useRef({ x: 0, y: 0 })

  // Р вЂ”Р В°Р С”РЎР‚РЎвЂ№РЎвЂљР С‘Р Вµ Р С—РЎР‚Р С‘ Р С”Р В»Р С‘Р С”Р Вµ Р Р†Р Р…Р Вµ Р СР С•Р Т‘Р В°Р В»РЎРЉР Р…Р С•Р С–Р С• Р С•Р С”Р Р…Р В°
  const handleClickOutside = useCallback((e) => {
    if (!ref.current) return
    if (ref.current.contains(e.target)) return
    onCancel()
  }, [onCancel])

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [handleClickOutside])

  // Drag Р Т‘Р В»РЎРЏ Р СР С•Р Т‘Р В°Р В»РЎРЉР Р…Р С•Р С–Р С• Р С•Р С”Р Р…Р В°
  const handleMouseDown = (e) => {
    if (!e.target.closest('.delete-confirm-header')) return
    
    e.preventDefault()
    
    if (!ref.current) return
    
    const rect = ref.current.getBoundingClientRect()
    offsetRef.current = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    }

    const handleMouseMove = (moveEvent) => {
      const newX = moveEvent.clientX - offsetRef.current.x
      const newY = moveEvent.clientY - offsetRef.current.y
      
      // Р С›Р С–РЎР‚Р В°Р Р…Р С‘РЎвЂЎР С‘Р Р†Р В°Р ВµР С Р С—Р ВµРЎР‚Р ВµР СР ВµРЎвЂ°Р ВµР Р…Р С‘Р Вµ Р Р† Р С—РЎР‚Р ВµР Т‘Р ВµР В»Р В°РЎвЂ¦ Р С•Р С”Р Р…Р В°
      const boundedX = Math.max(10, Math.min(newX, window.innerWidth - rect.width - 10))
      const boundedY = Math.max(10, Math.min(newY, window.innerHeight - rect.height - 10))
      
      setPosition({ x: boundedX, y: boundedY })
    }

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
  }

  if (typeof document === 'undefined') return null

  return createPortal(
    <div 
      ref={ref} 
      className="delete-confirm"
      style={{
        position: 'fixed',
        left: `${position.x}px`,
        top: `${position.y}px`,
        minHeight: titleExpanded ? 'auto' : '140px'
      }}
    >
      <div 
        className="delete-confirm-header modal-draggable-header"
        onMouseDown={handleMouseDown}
      >
        <span>{'\u041f\u043e\u0434\u0442\u0432\u0435\u0440\u0436\u0434\u0435\u043d\u0438\u0435 \u0443\u0434\u0430\u043b\u0435\u043d\u0438\u044f'}</span>
        <button className="modal-close-btn" onClick={onCancel} aria-label={'\u0417\u0430\u043a\u0440\u044b\u0442\u044c'}>
          <IconX size={16} />
        </button>
      </div>
      <div className="delete-confirm-body">
        <div className="delete-text">
          {'\u0423\u0434\u0430\u043b\u0438\u0442\u044c section'}{' '}
          <b className="delete-title">
            <ExpandableTitle 
              title={title} 
              onExpandChange={setTitleExpanded}
            />
          </b>{' '}
          {'\u0432\u043c\u0435\u0441\u0442\u0435 \u0441 \u0441\u043e\u0434\u0435\u0440\u0436\u0438\u043c\u044b\u043c?'}
        </div>

        <div className="delete-actions">
          <button className="btn-danger" onClick={onConfirm}>
            {'\u0423\u0434\u0430\u043b\u0438\u0442\u044c'}
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}

function CreateRow({ creating, setCreating, commitCreate }) {
  const ref = useRef(null)
  const [showError, setShowError] = useState(false)

  useOutsideClose(ref, () => setCreating(null))

  const tryCreate = (type) => {
    if (!creating.name.trim()) {
      setShowError(true)
      return
    }

    commitCreate(type)
  }

  return (
    <div ref={ref} className="create-row">
      <input
        className={`inline-input ${showError ? 'error' : ''}`}
        autoFocus
        value={creating.name}
        onChange={(e) => {
          setCreating({ ...creating, name: e.target.value })
          if (showError) setShowError(false)
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter') tryCreate()
          if (e.key === 'Escape') setCreating(null)
        }}
      />

      <div
        className="create-actions"
        onMouseDown={(e) => e.preventDefault()}
      >
        <button className="create-btn" onClick={() => tryCreate('section')}>
          Section
        </button>
        <button className="create-btn" onClick={() => tryCreate('article')}>
          Article
        </button>
      </div>
    </div>
  )
}

function useOutsideClose(ref, onClose) {
  useEffect(() => {
    const handler = (e) => {
      if (!ref.current) return
      if (ref.current.contains(e.target)) return
      onClose()
    }

    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [onClose])
}

function UndoToast({ title, itemType, itemCount = 1, onUndo, onClose }) {
  const isBatch = Number(itemCount) > 1
  const deletedLabel = isBatch
    ? '\u0423\u0434\u0430\u043b\u0435\u043d\u043e \u044d\u043b\u0435\u043c\u0435\u043d\u0442\u043e\u0432'
    : itemType === 'section'
      ? '\u0423\u0434\u0430\u043b\u0435\u043d\u0430 \u043f\u0430\u043f\u043a\u0430'
      : '\u0423\u0434\u0430\u043b\u0435\u043d\u0430 \u0441\u0442\u0430\u0442\u044c\u044f'
  if (typeof document === 'undefined') return null

  return createPortal(
    <div className="undo-toast show">
      <span className="undo-text">
        {isBatch ? (
          <>{deletedLabel}: {itemCount}</>
        ) : (
          <>
            {deletedLabel}: <ExpandableTitle title={title} defaultExpanded={false} />
          </>
        )}
      </span>
      <button onClick={onUndo}>
        {'\u041e\u0442\u043c\u0435\u043d\u0438\u0442\u044c'}
      </button>
      <button onClick={onClose} aria-label={'\u0417\u0430\u043a\u0440\u044b\u0442\u044c'}>
        <IconX size={14} />
      </button>
    </div>,
    document.body
  )
}

export default DocumentationListLeftPanel
