import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useApolloClient, useMutation, useQuery } from '@apollo/client'
import PropTypes from 'prop-types'
import {
  CREATE_SECTION,
  CREATE_ARTICLE,
  UPDATE_SECTION,
  UPDATE_ARTICLE,
  GET_SECTIONS_WITH_HIERARCHY,
  GET_ARTICLE,
  getCookie,
} from '../../../../../../graphQL_requests'
import { roles } from '../../../../../roles'
import { findDocById } from '../docTreeUtils'
import DocumentationListLeftPanel from '../DocumentationListLeftPanel/DocumentationListLeftPanel'
import DocumentListTiptapPanelContent from '../DocumentationListPanelContent/DocumentListTiptapPanelContent'
import DocumentationListRightPanel from '../DocumentationListRightPanel/DocumentationListRightPanel'
import { loadTree } from './tree'
import classes from './DocumentationList1.module.css'

const DEFAULT_LEFT_PANEL_WIDTH = 400
const MIN_LEFT_PANEL_WIDTH = 300
const MAX_LEFT_PANEL_WIDTH = 860
const RIGHT_PANEL_WIDTH = 350
const MIN_CENTER_PANEL_WIDTH = 360

const DOC_TYPE = 'documentation'
const TREE_SYNC_DEBOUNCE_MS = 1200
const DOC_REALTIME_REFRESH_MS = 5000
const DOC_META_KEY = '__doclist_meta'
const DOC_META_VERSION = 1
const DOC_SECTION_OPEN_STATE_KEY = 'doclist_section_open_state_v1'
const DOC_NODE_FILTER_STATE_KEY = 'doclist_node_filter_state_v1'
const DEFAULT_DOCUMENTATION_FILTER = 'dispatcher'
const DOC_MANAGE_ROLES = new Set([
  String(roles.superAdmin || '').toUpperCase(),
  'SUPER_ADMIN',
])
const cn = (...parts) => parts.filter(Boolean).join(' ')
const BODY_RESIZING_CLASS =
  classes['is-resizing-left-panel'] || 'is-resizing-left-panel'

function clampLeftPanelWidth(rawWidth) {
  const safeWidth = Number(rawWidth)
  if (!Number.isFinite(safeWidth)) return DEFAULT_LEFT_PANEL_WIDTH

  if (typeof window === 'undefined') {
    return Math.round(
      Math.min(MAX_LEFT_PANEL_WIDTH, Math.max(MIN_LEFT_PANEL_WIDTH, safeWidth))
    )
  }

  const viewportLimit = window.innerWidth - RIGHT_PANEL_WIDTH - MIN_CENTER_PANEL_WIDTH
  const maxWidth = Math.max(
    MIN_LEFT_PANEL_WIDTH,
    Math.min(MAX_LEFT_PANEL_WIDTH, viewportLimit)
  )

  return Math.round(Math.min(maxWidth, Math.max(MIN_LEFT_PANEL_WIDTH, safeWidth)))
}

function getInitialLeftPanelWidth() {
  return clampLeftPanelWidth(DEFAULT_LEFT_PANEL_WIDTH)
}

function isPlainObject(value) {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value))
}

function isDocJson(value) {
  return Boolean(isPlainObject(value) && value.type === 'doc')
}

function parseDocMeta(rawDescription) {
  if (typeof rawDescription !== 'string' || !rawDescription.trim()) return null

  try {
    const parsed = JSON.parse(rawDescription)
    if (!isPlainObject(parsed)) return null
    if (parsed[DOC_META_KEY] !== true) return null
    return parsed
  } catch {
    return null
  }
}

function serializeDocMeta(nodeType, draft) {
  const safeNodeType = nodeType === 'section' ? 'section' : 'article'
  const payload = {
    [DOC_META_KEY]: true,
    version: DOC_META_VERSION,
    nodeType: safeNodeType,
  }

  if (safeNodeType === 'article') {
    if (isDocJson(draft?.content)) {
      payload.content = draft.content
    }
    if (isPlainObject(draft?.layout)) {
      payload.layout = draft.layout
    }
  }

  return JSON.stringify(payload)
}

function legacyDescriptionToDoc(rawDescription) {
  if (typeof rawDescription !== 'string') return null
  const text = rawDescription
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  if (!text) return null

  return {
    type: 'doc',
    content: [
      {
        type: 'paragraph',
        content: [{ type: 'text', text }],
      },
    ],
  }
}

function getNodeOrderValue(node) {
  const candidates = [
    node?.index,
    node?.order,
    node?.position,
    node?.sortOrder,
  ]

  for (const candidate of candidates) {
    const parsed = Number(candidate)
    if (Number.isFinite(parsed)) return parsed
  }

  return null
}

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

function extractNodeDocumentationFilter(node) {
  if (!isPlainObject(node)) return null

  const candidateKeys = [
    'filter',
    '__localDocFilter',
    'docFilter',
    'documentationFilter',
    'categoryFilter',
    'scope',
    'audience',
    'target',
    'category',
  ]

  for (const key of candidateKeys) {
    const candidate = node[key]
    if (candidate == null) continue

    if (isPlainObject(candidate)) {
      const nested = normalizeDocumentationFilter(
        candidate.value ?? candidate.name ?? candidate.key ?? candidate.type
      )
      if (nested) return nested
      continue
    }

    const normalized = normalizeDocumentationFilter(candidate)
    if (normalized) return normalized
  }

  if (typeof node.description === 'string' && node.description.trim()) {
    try {
      const parsedDescription = JSON.parse(node.description)
      if (isPlainObject(parsedDescription)) {
        const nested = extractNodeDocumentationFilter(parsedDescription)
        if (nested) return nested
      }
    } catch {
      // ignore non-JSON descriptions
    }
  }

  return null
}

function filterHierarchyByDocumentationFilter(nodes, requestedFilter) {
  if (!Array.isArray(nodes) || !requestedFilter) {
    return { nodes: Array.isArray(nodes) ? nodes : [], hasFilterMarkers: false }
  }

  let hasFilterMarkers = false
  const filteredNodes = []

  for (const rawNode of nodes) {
    if (!isPlainObject(rawNode)) continue

    let nextNode = rawNode
    let hasMatchingChildren = false

    if (Array.isArray(rawNode.childrens)) {
      const nestedSections = filterHierarchyByDocumentationFilter(
        rawNode.childrens,
        requestedFilter
      )
      hasFilterMarkers = hasFilterMarkers || nestedSections.hasFilterMarkers
      nextNode = { ...nextNode, childrens: nestedSections.nodes }
      hasMatchingChildren = hasMatchingChildren || nestedSections.nodes.length > 0
    }

    if (Array.isArray(rawNode.articles)) {
      const nestedArticles = filterHierarchyByDocumentationFilter(
        rawNode.articles,
        requestedFilter
      )
      hasFilterMarkers = hasFilterMarkers || nestedArticles.hasFilterMarkers
      nextNode = { ...nextNode, articles: nestedArticles.nodes }
      hasMatchingChildren = hasMatchingChildren || nestedArticles.nodes.length > 0
    }

    const nodeFilter = extractNodeDocumentationFilter(rawNode)
    if (nodeFilter) {
      hasFilterMarkers = true
    }

    const resolvedNodeFilter = nodeFilter || DEFAULT_DOCUMENTATION_FILTER
    const nodeMatchesFilter = resolvedNodeFilter === requestedFilter
    if (nodeMatchesFilter || hasMatchingChildren) {
      filteredNodes.push(nextNode)
    }
  }

  return { nodes: filteredNodes, hasFilterMarkers }
}

function toLocalTreeNode(serverNode, options = {}) {
  const safeNode = isPlainObject(serverNode) ? serverNode : {}
  const safeId = safeNode.id ? String(safeNode.id) : `${Date.now()}-${Math.random()}`
  const title = typeof safeNode.title === 'string' ? safeNode.title : ''
  const useMixedOrdering = Boolean(options?.useMixedOrdering)
  
  const childrens = Array.isArray(safeNode.childrens) ? safeNode.childrens : []
  const articles = Array.isArray(safeNode.articles) ? safeNode.articles : []
  
  if (safeNode.type === 'article') {
    return {
      id: safeId,
      type: 'article',
      title,
      editor: 'tiptap',
    }
  }

  if (safeNode.type === 'section' || childrens.length > 0 || articles.length > 0) {
    let children = []
    if (useMixedOrdering) {
      const sectionEntries = childrens.map((childSection, order) => ({
        kind: 'section',
        node: childSection,
        order,
        index: getNodeOrderValue(childSection),
      }))
      const articleEntries = articles.map((article, order) => ({
        kind: 'article',
        node: article,
        order,
        index: getNodeOrderValue(article),
      }))

      let mergedEntries = [...sectionEntries, ...articleEntries]
      const hasServerIndex = mergedEntries.some(entry => entry.index != null)
      if (hasServerIndex) {
        mergedEntries.sort((a, b) => {
          const ai = a.index == null ? Number.MAX_SAFE_INTEGER : a.index
          const bi = b.index == null ? Number.MAX_SAFE_INTEGER : b.index
          if (ai !== bi) return ai - bi
          return a.order - b.order
        })
      }

      children = mergedEntries.map(entry => {
        if (entry.kind === 'section') {
          return toLocalTreeNode(entry.node, options)
        }
        const article = entry.node
        return {
          id: String(article.id),
          type: 'article',
          title: typeof article.title === 'string' ? article.title : '',
          editor: 'tiptap',
        }
      })
    } else {
      const sectionChildren = childrens.map(childSection =>
        toLocalTreeNode(childSection, options)
      )
      const articleChildren = articles.map(article => ({
        id: String(article.id),
        type: 'article',
        title: typeof article.title === 'string' ? article.title : '',
        editor: 'tiptap',
      }))
      children = [...sectionChildren, ...articleChildren]
    }

    return {
      id: safeId,
      type: 'section',
      title,
      isOpen: true,
      children,
    }
  }
  
  return {
    id: safeId,
    type: 'article',
    title,
    editor: 'tiptap',
  }
}

async function toServerTreeNode(localNode) {
  const safeNode = isPlainObject(localNode) ? localNode : {}
  const nodeType = safeNode.type === 'section' ? 'section' : 'article'
  const nodeId =
    safeNode.id == null ? `${Date.now()}-${Math.random()}` : String(safeNode.id)
  const title = typeof safeNode.title === 'string' ? safeNode.title : ''

  const draft = null

  let children = []
  if (
    nodeType === 'section' &&
    Array.isArray(safeNode.children) &&
    safeNode.children.length
  ) {
    children = await Promise.all(safeNode.children.map(child => toServerTreeNode(child)))
  }

  return {
    clientKey: nodeId,
    name: title,
    description: serializeDocMeta(nodeType, draft),
    type: DOC_TYPE,
    children,
  }
}

function extractRootNodes(documents) {
  if (!Array.isArray(documents)) return []

  const roots = documents.filter(item => !item?.parentId)
  const source = roots.length ? roots : documents
  const unique = []
  const seen = new Set()

  for (const item of source) {
    if (!item?.id) continue
    const key = String(item.id)
    if (seen.has(key)) continue
    seen.add(key)
    unique.push(item)
  }

  return unique
}

function loadSectionOpenState() {
  if (typeof window === 'undefined') return {}
  try {
    const raw = window.localStorage.getItem(DOC_SECTION_OPEN_STATE_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw)
    if (!isPlainObject(parsed)) return {}
    return parsed
  } catch {
    return {}
  }
}

function loadNodeFilterState() {
  if (typeof window === 'undefined') return {}
  try {
    const raw = window.localStorage.getItem(DOC_NODE_FILTER_STATE_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw)
    if (!isPlainObject(parsed)) return {}
    return parsed
  } catch {
    return {}
  }
}

function saveNodeFilterState(nodeFilterStateMap) {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(
      DOC_NODE_FILTER_STATE_KEY,
      JSON.stringify(nodeFilterStateMap)
    )
  } catch {
    // ignore storage errors
  }
}

function hydrateHierarchyFilterState(nodes, filterStateMap) {
  if (!Array.isArray(nodes)) return []
  const safeMap = isPlainObject(filterStateMap) ? filterStateMap : {}

  return nodes
    .filter(node => isPlainObject(node))
    .map(node => {
      const nodeId = node.id == null ? null : String(node.id)
      const explicitFilter = extractNodeDocumentationFilter(node)
      const mappedFilter = nodeId
        ? normalizeDocumentationFilter(safeMap[nodeId])
        : null
      const resolvedFilter = explicitFilter || mappedFilter

      const nextNode = { ...node }
      if (!explicitFilter && resolvedFilter) {
        nextNode.__localDocFilter = resolvedFilter
      }
      if (nodeId && resolvedFilter) {
        safeMap[nodeId] = resolvedFilter
      }

      if (Array.isArray(node.childrens)) {
        nextNode.childrens = hydrateHierarchyFilterState(node.childrens, safeMap)
      }

      if (Array.isArray(node.articles)) {
        nextNode.articles = hydrateHierarchyFilterState(node.articles, safeMap)
      }

      return nextNode
    })
}

function saveSectionOpenState(openStateMap) {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(
      DOC_SECTION_OPEN_STATE_KEY,
      JSON.stringify(openStateMap)
    )
  } catch {
    // ignore storage errors
  }
}

function collectSectionOpenState(nodes, acc = {}) {
  if (!Array.isArray(nodes)) return acc
  for (const node of nodes) {
    if (!isPlainObject(node)) continue
    if (node.type === 'section' && node.id != null) {
      acc[String(node.id)] = Boolean(node.isOpen)
    }
    if (Array.isArray(node.children) && node.children.length) {
      collectSectionOpenState(node.children, acc)
    }
  }
  return acc
}

function applySectionOpenState(nodes, openStateMap) {
  if (!Array.isArray(nodes)) return []
  const safeMap = isPlainObject(openStateMap) ? openStateMap : {}
  return nodes.map(node => {
    if (!isPlainObject(node)) return node

    const nextNode = { ...node }
    if (Array.isArray(node.children) && node.children.length) {
      nextNode.children = applySectionOpenState(node.children, safeMap)
    }

    if (node.type === 'section') {
      const key = node.id == null ? '' : String(node.id)
      const hasSavedState = key && Object.prototype.hasOwnProperty.call(safeMap, key)
      nextNode.isOpen = hasSavedState ? Boolean(safeMap[key]) : Boolean(node.isOpen)
    }

    return nextNode
  })
}

function DocumentationList1({ user, filterValue = 'dispatcher' }) {
  const token = getCookie('token')
  const [tree, setTree] = useState(loadTree)
  const [activeDocId, setActiveDocId] = useState(null)
  const [rightPanelBlocks, setRightPanelBlocks] = useState([])
  const [isRightPanelOpen, setIsRightPanelOpen] = useState(false)
  const [leftPanelWidth, setLeftPanelWidth] = useState(getInitialLeftPanelWidth)
  const [isLeftPanelOpen, setIsLeftPanelOpen] = useState(true)
  const [isResizingLeftPanel, setIsResizingLeftPanel] = useState(false)
  const [isReloadingArticles, setIsReloadingArticles] = useState(false)
  const [draftHydrationVersion, setDraftHydrationVersion] = useState(0)
  const treeRef = useRef(tree)
  const sectionOpenStateRef = useRef(loadSectionOpenState())
  const nodeFilterStateRef = useRef(loadNodeFilterState())
  const resizeStateRef = useRef(null)
  const rootServerIdMapRef = useRef(new Map())
  const syncTimerRef = useRef(null)
  const syncInFlightRef = useRef(false)
  const syncQueuedRef = useRef(false)
  const skipNextTreeSyncRef = useRef(false)
  const syncReadyRef = useRef(false)
  const reloadInFlightRef = useRef(false)
  const queuedManualReloadRef = useRef(false)
  const apolloClient = useApolloClient()
  const canManageDocs = useMemo(() => {
    const normalizedRole = String(user?.role || '').trim().toUpperCase()
    return DOC_MANAGE_ROLES.has(normalizedRole)
  }, [user?.role])

  const effectiveFilter = useMemo(() => {
    if (user?.role === roles.hotelAdmin) return 'hotel'
    if (user?.role === roles.airlineAdmin) return 'airline'
    return filterValue || 'dispatcher'
  }, [filterValue, user?.role])

  const requestContext = useMemo(
    () => ({
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }),
    [token]
  )

  const mutationContext = useMemo(
    () => ({
      headers: {
        Authorization: `Bearer ${token}`,
        'Apollo-Require-Preflight': 'true',
      },
    }),
    [token]
  )

  const {
    data: allDocsData,
    loading: allDocsLoading,
    error: allDocsError,
    refetch: refetchAllDocs,
  } = useQuery(GET_SECTIONS_WITH_HIERARCHY, {
    skip: !token,
    fetchPolicy: 'network-only',
    context: requestContext,
  })

  const [createSection] = useMutation(CREATE_SECTION, {
    context: mutationContext,
  })
  const [createArticle] = useMutation(CREATE_ARTICLE, {
    context: mutationContext,
  })
  const [updateSection] = useMutation(UPDATE_SECTION, {
    context: mutationContext,
  })
  const [updateArticle] = useMutation(UPDATE_ARTICLE, {
    context: mutationContext,
  })

  const activeDoc = useMemo(
    () => (activeDocId ? findDocById(tree, activeDocId) : null),
    [tree, activeDocId]
  )

  const hydrateTreeFromHierarchy = useCallback(
    async (hierarchyData, isCancelled = () => false) => {
      if (!hierarchyData) {
        if (isCancelled()) return
        skipNextTreeSyncRef.current = true
        setTree([])
        setDraftHydrationVersion(prev => prev + 1)
        return
      }

      if (isCancelled()) return

      let parsedData
      
      // РџР°СЂСЃРёРј JSON РµСЃР»Рё РЅСѓР¶РЅРѕ
      try {
        parsedData = typeof hierarchyData === 'string' ? JSON.parse(hierarchyData) : hierarchyData
      } catch {
        parsedData = hierarchyData
      }
      
      // РџСЂРµРѕР±СЂР°Р·СѓРµРј РІ РјР°СЃСЃРёРІ РµСЃР»Рё СЌС‚Рѕ РЅРµ РјР°СЃСЃРёРІ
      const dataArray = Array.isArray(parsedData) ? parsedData : [parsedData]

      // Left panel writes node filter bindings to localStorage during create/copy/move.
      // Merge the latest persisted map before hydration so filtered trees (hotel/airline)
      // do not lose freshly created nodes on the next refetch.
      const nextNodeFilterState = {
        ...nodeFilterStateRef.current,
        ...loadNodeFilterState(),
      }
      const hydratedHierarchy = hydrateHierarchyFilterState(
        dataArray,
        nextNodeFilterState
      )
      nodeFilterStateRef.current = nextNodeFilterState
      saveNodeFilterState(nextNodeFilterState)

      // РџСЂРµРѕР±СЂР°Р·СѓРµРј РєР°Р¶РґС‹Р№ РєРѕСЂРЅРµРІРѕР№ СѓР·РµР»
      let rootItems = hydratedHierarchy
        .filter(item => item && item.id)

      const normalizedFilter = normalizeDocumentationFilter(effectiveFilter)
      if (normalizedFilter) {
        const filteredHierarchy = filterHierarchyByDocumentationFilter(
          rootItems,
          normalizedFilter
        )
        rootItems = filteredHierarchy.nodes
      }

      if (canManageDocs) {
        rootItems = rootItems
          .map((node, order) => ({
            node,
            order,
            index: getNodeOrderValue(node),
          }))
          .sort((a, b) => {
            const ai = a.index == null ? Number.MAX_SAFE_INTEGER : a.index
            const bi = b.index == null ? Number.MAX_SAFE_INTEGER : b.index
            if (ai !== bi) return ai - bi
            return a.order - b.order
          })
          .map(entry => entry.node)
      }

      const nextTree = rootItems.map(item =>
        toLocalTreeNode(item, { useMixedOrdering: canManageDocs })
      )
      const nextTreeWithOpenState = applySectionOpenState(
        nextTree,
        sectionOpenStateRef.current
      )

      if (isCancelled()) return

      skipNextTreeSyncRef.current = true
      setTree(nextTreeWithOpenState)
      setDraftHydrationVersion(prev => prev + 1)
    },
    [canManageDocs, effectiveFilter]
  )

  useEffect(() => {
    treeRef.current = tree
  }, [tree])

  useEffect(() => {
    const nextOpenState = collectSectionOpenState(tree)
    sectionOpenStateRef.current = nextOpenState
    saveSectionOpenState(nextOpenState)
  }, [tree])

  useEffect(() => {
    let cancelled = false

    const hydrateFromServer = async () => {
      if (!token) {
        syncReadyRef.current = true
        return
      }

      if (allDocsLoading) {
        syncReadyRef.current = false
        return
      }

      syncReadyRef.current = false
      if (syncTimerRef.current) {
        clearTimeout(syncTimerRef.current)
      }

      if (allDocsError) {
        console.error('Failed to load documentation roots', allDocsError)
        syncReadyRef.current = true
        return
      }

      const hierarchyData = allDocsData?.sectionsWithHierarhy
      try {
        await hydrateTreeFromHierarchy(hierarchyData, () => cancelled)
      } catch (error) {
        if (!cancelled) {
          console.error('Failed to hydrate documentation tree', error)
        }
      } finally {
        if (!cancelled) {
          syncReadyRef.current = true
        }
      }
    }

    hydrateFromServer()

    return () => {
      cancelled = true
    }
  }, [allDocsData, allDocsError, allDocsLoading, hydrateTreeFromHierarchy, token])

  const syncTreeToServer = useCallback(async () => {
    // Note: Tree synchronization is now handled individually through
    // createSection, updateSection, createArticle, updateArticle mutations
    // called from DocumentationListLeftPanel when user makes changes.
    // This function is kept as a no-op for compatibility.
    if (!token) return
    if (!canManageDocs) return
    
    // Clear any queued syncs
    syncQueuedRef.current = false
  }, [canManageDocs, token])

  const scheduleTreeSync = useCallback(() => {
    if (!token) return
    if (!canManageDocs) return
    if (!syncReadyRef.current) return

    if (syncTimerRef.current) {
      clearTimeout(syncTimerRef.current)
    }

    syncTimerRef.current = setTimeout(() => {
      syncTreeToServer()
    }, TREE_SYNC_DEBOUNCE_MS)
  }, [canManageDocs, syncTreeToServer, token])

  useEffect(() => {
    if (skipNextTreeSyncRef.current) {
      skipNextTreeSyncRef.current = false
      return
    }

    scheduleTreeSync()
  }, [tree, scheduleTreeSync])

  const handleDraftPersist = useCallback(async (docId, changeType, content) => {
    // Only persist 'content' changes to server, 'layout' is local UI state
    if (changeType !== 'content' || !docId || !canManageDocs) return
    if (!content || typeof content !== 'object' || content.type !== 'doc') return

    try {
      await updateArticle({
        variables: {
          id: docId,
          input: {
            content,
          },
        },
      })
    } catch (error) {
      console.error('Failed to persist article content:', error)
    }
  }, [canManageDocs, updateArticle])

  useEffect(() => {
    if (!activeDocId) return
    if (activeDoc) return

    // If the opened document was deleted from the tree, return to list view.
    setActiveDocId(null)
  }, [activeDocId, activeDoc])

  useEffect(() => {
    // Right navigation is closed by default whenever article selection changes.
    setIsRightPanelOpen(false)
  }, [activeDocId])

  useEffect(() => {
    if (typeof window === 'undefined') return

    const handleWindowResize = () => {
      setLeftPanelWidth(prev => clampLeftPanelWidth(prev))
    }

    window.addEventListener('resize', handleWindowResize)
    return () => {
      window.removeEventListener('resize', handleWindowResize)
    }
  }, [])

  useEffect(() => {
    return () => {
      document.body.classList.remove(BODY_RESIZING_CLASS)

      const resizeState = resizeStateRef.current
      resizeStateRef.current = null
      if (!resizeState) return

      document.body.style.cursor = resizeState.prevCursor
      document.body.style.userSelect = resizeState.prevUserSelect
    }
  }, [])

  useEffect(() => {
    return () => {
      if (syncTimerRef.current) {
        clearTimeout(syncTimerRef.current)
      }
    }
  }, [])

  const handleLeftPanelResizeStart = event => {
    if (!isLeftPanelOpen) return
    if (event.button !== 0) return

    event.preventDefault()
    event.stopPropagation()

    const resizeState = {
      startX: event.clientX,
      startWidth: leftPanelWidth,
      prevCursor: document.body.style.cursor,
      prevUserSelect: document.body.style.userSelect,
    }
    resizeStateRef.current = resizeState

    setIsResizingLeftPanel(true)
    document.body.classList.add(BODY_RESIZING_CLASS)
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'

    const handlePointerMove = moveEvent => {
      const state = resizeStateRef.current
      if (!state) return
      const deltaX = moveEvent.clientX - state.startX
      setLeftPanelWidth(clampLeftPanelWidth(state.startWidth + deltaX))
    }

    const stopResize = () => {
      const state = resizeStateRef.current
      resizeStateRef.current = null

      window.removeEventListener('pointermove', handlePointerMove)
      window.removeEventListener('pointerup', stopResize)
      window.removeEventListener('pointercancel', stopResize)

      setIsResizingLeftPanel(false)
      document.body.classList.remove(BODY_RESIZING_CLASS)

      if (!state) {
        document.body.style.cursor = ''
        document.body.style.userSelect = ''
        return
      }

      document.body.style.cursor = state.prevCursor
      document.body.style.userSelect = state.prevUserSelect
    }

    window.addEventListener('pointermove', handlePointerMove)
    window.addEventListener('pointerup', stopResize)
    window.addEventListener('pointercancel', stopResize)
  }

  const hasOpenedContent = Boolean(activeDocId)
  const leftPanelVisualWidth = isLeftPanelOpen ? leftPanelWidth : 0

  const handleLeftPanelToggle = () => {
    setIsLeftPanelOpen(prev => {
      const next = !prev
      if (next) {
        setLeftPanelWidth(current =>
          clampLeftPanelWidth(current || DEFAULT_LEFT_PANEL_WIDTH)
        )
      }
      return next
    })
  }

  const handleRightPanelToggle = () => {
    if (!hasOpenedContent) return
    setIsRightPanelOpen(prev => !prev)
  }

  const refreshDocumentationTree = useCallback(
    async ({ showLoading = false } = {}) => {
      if (!token) return
      if (reloadInFlightRef.current) {
        if (showLoading) {
          queuedManualReloadRef.current = true
        }
        return
      }

      reloadInFlightRef.current = true
      if (showLoading) {
        setIsReloadingArticles(true)
      }

      try {
        if (syncTimerRef.current) {
          clearTimeout(syncTimerRef.current)
        }
        syncReadyRef.current = false

        const result = await refetchAllDocs()
        const hierarchyData = result?.data?.sectionsWithHierarhy
        await hydrateTreeFromHierarchy(hierarchyData)
        if (activeDocId) {
          await apolloClient.refetchQueries({
            include: [GET_ARTICLE],
          })
        }
      } catch (error) {
        console.error('Failed to reload documentation roots', error)
      } finally {
        syncReadyRef.current = true
        reloadInFlightRef.current = false
        if (showLoading) {
          setIsReloadingArticles(false)
        }
        if (queuedManualReloadRef.current) {
          queuedManualReloadRef.current = false
          refreshDocumentationTree({ showLoading: true })
        }
      }
    },
    [activeDocId, apolloClient, hydrateTreeFromHierarchy, refetchAllDocs, token]
  )

  const handleReloadArticles = useCallback(() => {
    refreshDocumentationTree({ showLoading: true })
  }, [refreshDocumentationTree])

  useEffect(() => {
    if (!token) return

    const timerId = window.setInterval(() => {
      if (canManageDocs && activeDocId) return
      refreshDocumentationTree()
    }, DOC_REALTIME_REFRESH_MS)

    return () => {
      window.clearInterval(timerId)
    }
  }, [activeDocId, canManageDocs, refreshDocumentationTree, token])

  const isReloadButtonBusy = allDocsLoading || isReloadingArticles
  const shouldRenderInlineHeaderPanelControls = hasOpenedContent && !isRightPanelOpen
  const shouldRenderInlineHeaderLeftPanelToggle = hasOpenedContent && !isLeftPanelOpen

  const renderReloadArticlesButton = () => (
    <button
      className={cn(
        classes['reload-articles-btn'],
        isReloadButtonBusy && classes['is-loading']
      )}
      type="button"
      onClick={handleReloadArticles}
      disabled={isReloadButtonBusy}
      aria-label={'\u041e\u0431\u043d\u043e\u0432\u0438\u0442\u044c \u0441\u0442\u0430\u0442\u044c\u0438'}
      title={'\u041e\u0431\u043d\u043e\u0432\u0438\u0442\u044c \u0441\u0442\u0430\u0442\u044c\u0438'}
    >
      <svg
        className={classes['reload-articles-icon']}
        viewBox="0 0 24 24"
        width="16"
        height="16"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <path
          d="M20 4V9H15"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M4 20V15H9"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M6.5 9.5C7.05 7.96 8.26 6.72 9.78 6.13C11.3 5.55 13 5.65 14.44 6.41C15.88 7.17 16.92 8.5 17.31 10.07M6.69 13.93C7.08 15.5 8.12 16.83 9.56 17.59C11 18.35 12.7 18.45 14.22 17.87C15.74 17.28 16.95 16.04 17.5 14.5"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  )

  const renderRightPanelToggleButton = ({ inline = false } = {}) => (
    <button
      className={cn(
        classes['right-panel-toggle-btn'],
        inline && classes['header-inline-panel-btn']
      )}
      type="button"
      onClick={handleRightPanelToggle}
      aria-label={isRightPanelOpen ? 'Close navigation' : 'Open navigation'}
      title={isRightPanelOpen ? 'Close navigation' : 'Open navigation'}
    >
      {isRightPanelOpen ? '>' : '<'}
    </button>
  )

  const renderLeftPanelToggleButton = ({ inline = false } = {}) => (
    <button
      className={cn(
        classes['left-panel-toggle-btn'],
        inline && classes['header-inline-panel-btn']
      )}
      type="button"
      onClick={handleLeftPanelToggle}
      aria-label={isLeftPanelOpen ? 'Close left panel' : 'Open left panel'}
      title={isLeftPanelOpen ? 'Close left panel' : 'Open left panel'}
    >
      {isLeftPanelOpen ? '<' : '>'}
    </button>
  )

  const inlineHeaderLeftControls = shouldRenderInlineHeaderLeftPanelToggle
    ? renderLeftPanelToggleButton({ inline: true })
    : null

  const inlineHeaderPanelControls = shouldRenderInlineHeaderPanelControls ? (
    <>
      {renderReloadArticlesButton()}
      {renderRightPanelToggleButton({ inline: true })}
    </>
  ) : null

  const emptyPanelTopRightControls = !hasOpenedContent && !isRightPanelOpen
    ? renderReloadArticlesButton()
    : null

  return (
    <div className={classes['doc-page']}>
      <div
        className={cn(
          classes['doc-list'],
          isLeftPanelOpen ? 'left-panel-open' : 'left-panel-collapsed'
        )}
      >
        <div
          className={cn(
            classes['left-panel'],
            isLeftPanelOpen ? classes.open : classes.collapsed
          )}
          style={{
            width: `${leftPanelVisualWidth}px`,
            '--left-panel-content-width': `${leftPanelWidth}px`,
          }}
        >
          <DocumentationListLeftPanel
            tree={tree}
            setTree={setTree}
            onSelectFile={setActiveDocId}
            canManage={canManageDocs}
            activeFilter={effectiveFilter}
            activeDocId={activeDocId}
          />
        </div>

        <div
          className={cn(
            classes['left-panel-resizer'],
            isResizingLeftPanel && classes['is-resizing'],
            !isLeftPanelOpen && classes.hidden
          )}
          onPointerDown={handleLeftPanelResizeStart}
          role="separator"
          aria-orientation="vertical"
          aria-label="Resize left panel"
          aria-valuemin={MIN_LEFT_PANEL_WIDTH}
          aria-valuemax={MAX_LEFT_PANEL_WIDTH}
          aria-valuenow={leftPanelWidth}
        />

        {(!hasOpenedContent || isLeftPanelOpen) && (
          <div
            className={cn(
              classes['left-panel-toggle-zone'],
              isLeftPanelOpen && classes.open
            )}
          >
            {renderLeftPanelToggleButton()}
          </div>
        )}

        {hasOpenedContent && isRightPanelOpen && (
          <div
            className={cn(
              classes['reload-articles-zone'],
              hasOpenedContent && isRightPanelOpen && classes['with-right-toggle']
            )}
          >
            {renderReloadArticlesButton()}
          </div>
        )}

        <div
          className={cn(classes['panel-content'], 'panel-content')}
          style={{
            '--panel-top-controls-left-offset':
              isLeftPanelOpen ? '10px' : hasOpenedContent ? '12px' : '64px',
            '--panel-top-controls-right-offset': '12px',
          }}
        >
          <DocumentListTiptapPanelContent
            activeDocId={activeDocId}
            docTitle={activeDoc?.title}
            setActiveDocId={setActiveDocId}
            onAnchorsChange={setRightPanelBlocks}
            onDraftPersist={handleDraftPersist}
            onForceSync={syncTreeToServer}
            draftHydrationVersion={draftHydrationVersion}
            canEdit={canManageDocs}
            headerLeadingControls={inlineHeaderLeftControls}
            headerTrailingControls={inlineHeaderPanelControls}
            emptyStateTopRightControls={emptyPanelTopRightControls}
          />
        </div>

        {hasOpenedContent && isRightPanelOpen && (
          <div
            className={cn(
              classes['right-panel-toggle-zone'],
              isRightPanelOpen && classes.open
            )}
          >
            {renderRightPanelToggleButton()}
          </div>
        )}

        <div
          className={cn(
            classes['right-panel'],
            'right-panel',
            isRightPanelOpen && hasOpenedContent && classes.open
          )}
        >
          {isRightPanelOpen && hasOpenedContent ? (
            <DocumentationListRightPanel blocks={rightPanelBlocks} />
          ) : null}
        </div>
      </div>
    </div>
  )
}

export default DocumentationList1

DocumentationList1.propTypes = {
  user: PropTypes.shape({
    role: PropTypes.string,
  }),
  filterValue: PropTypes.string,
}


