// !!!РїРµСЂРµРјРµРЅРЅР°СЏ РЅР° РєРѕР»РёС‡РµСЃС‚РІРѕ РІР»РѕР¶РµРЅРЅРѕСЃС‚РµР№ Р°СЂС…РёС‚РµРєС‚СѓСЂС‹
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

// РљРѕРјРїРѕРЅРµРЅС‚ РґР»СЏ РѕС‚РѕР±СЂР°Р¶РµРЅРёСЏ Р·Р°РіРѕР»РѕРІРєР° СЃ РІРѕР·РјРѕР¶РЅРѕСЃС‚СЊСЋ СЂР°СЃС€РёСЂРµРЅРёСЏ
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

function DocumentationListLeftPanel({ tree, setTree, onSelectFile, canManage = false }) {
  const [creating, setCreating] = useState(null)
  const [hovered, setHovered] = useState(false)
  const [lastDeleted, setLastDeleted] = useState(null)
  const [copyModal, setCopyModal] = useState(null)
  const [deleteConfirm, setDeleteConfirm] = useState(null)
  const [dropHint, setDropHint] = useState(null)
  const [dragState, setDragState] = useState(null)
  
  // РќРѕРІС‹Рµ СЃРѕСЃС‚РѕСЏРЅРёСЏ РґР»СЏ РїРѕРёСЃРєР°
  const [showSearch, setShowSearch] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterType, setFilterType] = useState('all') // 'all', 'section', 'article'

  // GraphQL мутации
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

  /* ===== helpers ===== */

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

  const insertBack = (nodes, parentId, index, item) => {
    if (parentId === 'root') {
      nodes.splice(index, 0, item)
      return
    }
    for (const n of nodes) {
      if (n.id === parentId && n.children) {
        n.children.splice(index, 0, item)
        return
      }
      if (n.children) insertBack(n.children, parentId, index, item)
    }
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

  const cloneSection = (section, withChildren) => ({
    ...structuredClone(section),
    id: Date.now() + Math.random(),
    children: withChildren
      ? section.children?.map(child => ({
          ...structuredClone(child),
          id: Date.now() + Math.random()
        }))
      : [],
    isOpen: true
  })

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

  const copyArticleWithContent = async (article) => {
    if (!canManage) return

    try {
      const { data } = await fetchArticle({
        variables: { id: article.id },
      })
      const content = data?.article?.content ?? null

      const sectionId = findParentSectionId(tree, article.id) ?? null

      const result = await createArticleMutation({
        variables: {
          input: {
            title: `${article.title} (копия)`,
            sectionId,
            content: content && typeof content === 'object' && content.type === 'doc' ? content : null,
          },
        },
      })

      const createdArticle = result?.data?.createArticle
      if (!createdArticle) return

      const newItem = {
        id: createdArticle.id,
        type: 'article',
        title: createdArticle.title,
        editor: 'tiptap',
      }

      setTree(prev => {
        const next = structuredClone(prev)
        insertBelow(next, article.id, newItem)
        return next
      })
    } catch (error) {
      console.error('Failed to copy article:', error)
    }
  }

  // Р¤СѓРЅРєС†РёСЏ РґР»СЏ РїСЂРѕРІРµСЂРєРё, РЅРµ СЏРІР»СЏРµС‚СЃСЏ Р»Рё target РґРѕС‡РµСЂРЅРёРј СЌР»РµРјРµРЅС‚РѕРј draggingItem
  const isDescendant = useCallback((nodes, parentId, childId) => {
    // РЎРЅР°С‡Р°Р»Р° РЅР°С…РѕРґРёРј СЂРѕРґРёС‚РµР»СЊСЃРєРёР№ СѓР·РµР»
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

    // РќР°С…РѕРґРёРј СЂРѕРґРёС‚РµР»СЊСЃРєСѓСЋ РЅРѕРґСѓ
    const parentNode = findNode(nodes, parentId)
    if (!parentNode || !parentNode.children) return false

    // РџСЂРѕРІРµСЂСЏРµРј, РµСЃС‚СЊ Р»Рё childId СЃСЂРµРґРё РґРµС‚РµР№ parentNode (СЂРµРєСѓСЂСЃРёРІРЅРѕ)
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

  // Р¤СѓРЅРєС†РёСЏ РґР»СЏ РїРѕРёСЃРєР° СЌР»РµРјРµРЅС‚РѕРІ РІ РґРµСЂРµРІРµ
  const searchTree = useCallback((nodes, query, typeFilter = 'all') => {
    if (!query.trim()) return null // Р’РѕР·РІСЂР°С‰Р°РµРј null РµСЃР»Рё РїРѕРёСЃРє РїСѓСЃС‚РѕР№

    const results = []
    
    const searchNodes = (items, path = '') => {
      items.forEach(item => {
        const currentPath = path ? `${path} / ${item.title}` : item.title
        
        // РџСЂРѕРІРµСЂСЏРµРј СЃРѕРѕС‚РІРµС‚СЃС‚РІРёРµ С„РёР»СЊС‚СЂСѓ С‚РёРїР° Рё РїРѕРёСЃРєРѕРІРѕРјСѓ Р·Р°РїСЂРѕСЃСѓ
        const matchesType = typeFilter === 'all' || item.type === typeFilter
        const matchesQuery = item.title.toLowerCase().includes(query.toLowerCase())
        
        if (matchesType && matchesQuery) {
          results.push({
            ...item,
            path: currentPath
          })
        }
        
        // Р РµРєСѓСЂСЃРёРІРЅРѕ РёС‰РµРј РІ РґРµС‚СЏС…
        if (item.children && item.children.length > 0) {
          searchNodes(item.children, currentPath)
        }
      })
    }
    
    searchNodes(nodes)
    return results
  }, [])

  // РџРѕР»СѓС‡Р°РµРј СЂРµР·СѓР»СЊС‚Р°С‚С‹ РїРѕРёСЃРєР°
  const searchResults = searchQuery.trim() 
    ? searchTree(tree, searchQuery, filterType !== 'all' ? filterType : 'all')
    : null

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
        result = await createSectionMutation({
          variables: {
            input: {
              title,
              parentId,
            },
          },
        })
        const createdSection = result?.data?.createSection
        if (createdSection) {
          const newItem = {
            id: createdSection.id,
            type: 'section',
            title: createdSection.title,
            children: [],
            isOpen: true,
          }
          
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
        }
      } else {
        // Article
        result = await createArticleMutation({
          variables: {
            input: {
              title,
              sectionId: parentId,
              content: null,
            },
          },
        })
        const createdArticle = result?.data?.createArticle
        if (createdArticle) {
          const newItem = {
            id: createdArticle.id,
            type: 'article',
            title: createdArticle.title,
            editor: 'tiptap',
          }
          
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

    // Найдем тип узла
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
        await updateSectionMutation({
          variables: {
            id,
            input: { title: newTitle.trim() },
          },
        })
      } else {
        await updateArticleMutation({
          variables: {
            id,
            input: { title: newTitle.trim() },
          },
        })
      }

      // Обновляем локальное дерево
      const rename = (nodes) =>
        nodes.map(n => {
          if (n.id === id) return { ...n, title: newTitle }
          if (n.children) return { ...n, children: rename(n.children) }
          return n
        })

      setTree(prev => rename(prev))
    } catch (error) {
      console.error('Failed to rename item:', error)
    }
  }

  /* ===== delete + undo ===== */

  const deleteWithUndo = (id) => {
    if (!canManage) return
    const nextTree = structuredClone(tree)
    const deleted = findAndRemove(nextTree, id)
    if (!deleted) return

    setTree(nextTree)
    setLastDeleted({
      ...deleted,
      toastId: Date.now() + Math.random(),
    })
  }

  const undoDelete = () => {
    if (!lastDeleted) return

    setTree(prev => {
      const clone = structuredClone(prev)
      insertBack(
        clone,
        lastDeleted.parentId,
        lastDeleted.index,
        lastDeleted.item
      )
      return clone
    })

    setLastDeleted(null)
  }

  const confirmDelete = async () => {
    if (!lastDeleted) return

    const { item } = lastDeleted
    try {
      if (item.type === 'section') {
        await deleteSectionMutation({
          variables: { id: item.id },
        })
      } else {
        await deleteArticleMutation({
          variables: { id: item.id },
        })
      }
    } catch (error) {
      console.error('Failed to delete item from server:', error)
      // Восстановим элемент если удаление не удалось
      undoDelete()
      return
    }

    setLastDeleted(null)
  }

  /* ===== drag & drop ===== */

  const handleDrop = (targetId, targetIndex, parentId, dragging = dragState) => {
    if (!canManage) return
    if (!dragging) return

    // РџСЂРѕРІРµСЂРєР°: РЅРµР»СЊР·СЏ РїРµСЂРµРјРµС‰Р°С‚СЊ СЌР»РµРјРµРЅС‚ РІРЅСѓС‚СЂСЊ СЃР°РјРѕРіРѕ СЃРµР±СЏ
    if (dragging.id === parentId) {
      // РћС‚РјРµРЅСЏРµРј РїРµСЂРµРјРµС‰РµРЅРёРµ, РµСЃР»Рё РїС‹С‚Р°РµРјСЃСЏ РїРµСЂРµРјРµСЃС‚РёС‚СЊ РІ СЃР°РјРѕРіРѕ СЃРµР±СЏ
      setDragState(null)
      setDropHint(null)
      return
    }

    // Р•СЃР»Рё РїРµСЂРµРјРµС‰Р°РµРј РІРЅСѓС‚СЂСЊ РїР°РїРєРё (parentId), РїСЂРѕРІРµСЂСЏРµРј, С‡С‚Рѕ СЌС‚Рѕ РЅРµ РґРѕС‡РµСЂРЅСЏСЏ РїР°РїРєР°
    if (parentId !== 'root') {
      // РџСЂРѕРІРµСЂСЏРµРј, РЅРµ СЏРІР»СЏРµС‚СЃСЏ Р»Рё parentId РґРѕС‡РµСЂРЅРёРј СЌР»РµРјРµРЅС‚РѕРј dragState.id
      if (isDescendant(tree, dragging.id, parentId)) {
        // РћС‚РјРµРЅСЏРµРј РїРµСЂРµРјРµС‰РµРЅРёРµ, РµСЃР»Рё РїС‹С‚Р°РµРјСЃСЏ РїРµСЂРµРјРµСЃС‚РёС‚СЊ СЂРѕРґРёС‚РµР»СЏ РІ РїРѕС‚РѕРјРєР°
        setDragState(null)
        setDropHint(null)
        return
      }
    }

    setTree(prev => {
      const clone = structuredClone(prev)

      const removed = findAndRemove(clone, dragging.id)
      if (!removed) return prev

      let insertIndex = targetIndex

      if (
        removed.parentId === parentId &&
        dragging.index < targetIndex
      ) {
        insertIndex -= 1
      }

      insertAt(clone, parentId, insertIndex, removed.item)
      return clone
    })

    setDragState(null)
    setDropHint(null)
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

  // Р¤СѓРЅРєС†РёСЏ РґР»СЏ РїРµСЂРµС…РѕРґР° Рє СЌР»РµРјРµРЅС‚Сѓ РІ РґРµСЂРµРІРµ
  const navigateToItem = (item) => {
    if (item.type === 'article') {
      onSelectFile(item.id)
    }
    
    // Р—Р°РєСЂС‹РІР°РµРј РїРѕРёСЃРє РїРѕСЃР»Рµ РІС‹Р±РѕСЂР°
    setShowSearch(false)
  }

  /* ===== render ===== */

  return (
    <div
      className="doc-left"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className="doc-left-header">
        <div className="header-content">
          <span></span>
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

      <div className="doc-left-tree">
        {searchResults ? (
          // РџРѕРєР°Р·С‹РІР°РµРј СЂРµР·СѓР»СЊС‚Р°С‚С‹ РїРѕРёСЃРєР°
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
          // РџРѕРєР°Р·С‹РІР°РµРј РѕР±С‹С‡РЅРѕРµ РґРµСЂРµРІРѕ
          <>
            {tree.map((item, index) => (
              <TreeItem
                key={item.id}
                item={item}
                index={index}
                parentId="root"
                onSelectFile={onSelectFile}
                toggleSection={toggleSection}
                startCreate={startCreate}
                renameItem={renameItem}
                deleteWithUndo={deleteWithUndo}
                creating={creating}
                setCreating={setCreating}
                commitCreate={commitCreate}
                setTree={setTree}
                openCopyModal={openCopyModal}
                openDeleteConfirm={openDeleteConfirm}
                cloneSection={cloneSection}
                copyArticleWithContent={copyArticleWithContent}
                insertBelow={insertBelow}
                dragState={dragState}
                setDragState={setDragState}
                handleDrop={handleDrop}
                dropHint={dropHint}
                setDropHint={setDropHint}
                isDescendant={isDescendant}
                tree={tree}
                canManage={canManage}
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

      {/* РњРѕРґР°Р»СЊРЅРѕРµ РѕРєРЅРѕ РїРѕРёСЃРєР° */}
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
          onOnlyFolder={() => {
            const cloned = cloneSection(copyModal.section, false)
            setTree(prev => {
              const next = structuredClone(prev)
              insertBelow(next, copyModal.section.id, cloned)
              return next
            })
            closeAllLeftModals()
          }}
          onWithContent={() => {
            const cloned = cloneSection(copyModal.section, true)
            setTree(prev => {
              const next = structuredClone(prev)
              insertBelow(next, copyModal.section.id, cloned)
              return next
            })
            closeAllLeftModals()
          }}
        />
      )}

      {canManage && deleteConfirm && (
        <DeleteConfirm
          title={deleteConfirm.title}
          onCancel={() => setDeleteConfirm(null)}
          onConfirm={() => {
            deleteWithUndo(deleteConfirm.id)
            setDeleteConfirm(null)
          }}
        />
      )}

      {lastDeleted && (
        <UndoToast
          key={lastDeleted.toastId}
          itemType={lastDeleted.item.type}
          title={lastDeleted.item.title}
          onUndo={undoDelete}
          onClose={confirmDelete}
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
  onSelectFile,
  toggleSection,
  startCreate,
  renameItem,
  deleteWithUndo,
  creating,
  setCreating,
  commitCreate,
  setTree,
  openCopyModal,
  openDeleteConfirm,
  cloneSection,
  copyArticleWithContent,
  insertBelow,
  dragState,
  setDragState,
  handleDrop,
  dropHint,
  setDropHint,
  isDescendant,
  tree,
  canManage,
}) {
  const [editing, setEditing] = useState(false)
  const [flash, setFlash] = useState(false)

  const ignoreToggleRef = useRef(false)

  const isSection = item.type === 'section'
  const hasChildren = item.children?.length > 0
  const isDragging = dragState?.id === item.id

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
          ${flash ? 'copied-flash' : ''}
          ${isDragging ? 'dragging' : ''}
          ${dropHint?.id === item.id && dropHint.position === 'inside' ? 'drop-inside' : ''}
          ${dropHint?.id === item.id && dropHint.position === 'before' ? 'drop-before' : ''}
          ${dropHint?.id === item.id && dropHint.position === 'after' ? 'drop-after' : ''}
        `}
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

          // РџСЂРѕРІРµСЂРєР°: РЅРµР»СЊР·СЏ РїРµСЂРµРјРµС‰Р°С‚СЊ СЌР»РµРјРµРЅС‚ РІРЅСѓС‚СЂСЊ СЃР°РјРѕРіРѕ СЃРµР±СЏ
          if (dragState && dragState.id === item.id && dropHint.position === 'inside') {
            setDropHint(null)
            return
          }

          // РџСЂРѕРІРµСЂРєР°: РЅРµР»СЊР·СЏ РїРµСЂРµРјРµС‰Р°С‚СЊ СЂРѕРґРёС‚РµР»СЏ РІ РїРѕС‚РѕРјРєР°
          if (dropHint.position === 'inside' && item.type === 'section' && dragState) {
            // РџСЂРѕРІРµСЂСЏРµРј, РЅРµ СЏРІР»СЏРµС‚СЃСЏ Р»Рё С‚РµРєСѓС‰РёР№ СЌР»РµРјРµРЅС‚ (item) РїРѕС‚РѕРјРєРѕРј dragState
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
        onClick={() => {
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
        {/* в”Ђв”Ђв”Ђв”Ђв”Ђ TOP ROW в”Ђв”Ђв”Ђв”Ђв”Ђ */}
        <div className="tree-row tree-row-title">
          {!editing ? (
            <div className="tree-title-text">
              <ExpandableTitle title={item.title} />
            </div>
          ) : (
            <input
              className="rename-input"
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
        </div>

        {/* в”Ђв”Ђв”Ђв”Ђв”Ђ BOTTOM ROW в”Ђв”Ђв”Ђв”Ђв”Ђ */}
        <div className="tree-row tree-row-bottom">
          {/* LEFT */}
          <div className="tree-row-left">
            {canManage && (
              <span className="drag-handle" onMouseDown={preventToggle}>
                <IconGripVertical size={16} />
              </span>
            )}

            {isSection && (
              <span
                className="folder-arrow"
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

          {/* RIGHT */}
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
                    const rect = e.currentTarget.getBoundingClientRect()
                    const x = Math.min(rect.right + 6, window.innerWidth - 200)
                    const y = Math.min(rect.top, window.innerHeight - 120)

                    if (item.type === 'article') {
                      await copyArticleWithContent(item)
                      triggerFlash()
                      return
                    }

                    if (!hasChildren) {
                      const cloned = cloneSection(item, false)
                      setTree(prev => {
                        const next = structuredClone(prev)
                        insertBelow(next, item.id, cloned)
                        return next
                      })
                      triggerFlash()
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
                    if (hasChildren) openDeleteConfirm({ id: item.id, title: item.title })
                    else deleteWithUndo(item.id)
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
              onSelectFile={onSelectFile}
              toggleSection={toggleSection}
              startCreate={startCreate}
              renameItem={renameItem}
              deleteWithUndo={deleteWithUndo}
              creating={creating}
              setCreating={setCreating}
              commitCreate={commitCreate}
              setTree={setTree}
              openCopyModal={openCopyModal}
              openDeleteConfirm={openDeleteConfirm}
              cloneSection={cloneSection}
              copyArticleWithContent={copyArticleWithContent}
              insertBelow={insertBelow}
              dragState={dragState}
              setDragState={setDragState}
              handleDrop={handleDrop}
              dropHint={dropHint}
              setDropHint={setDropHint}
              isDescendant={isDescendant}
              tree={tree}
              canManage={canManage}
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

  // Р¤РѕРєСѓСЃ РЅР° input РїСЂРё РѕС‚РєСЂС‹С‚РёРё
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus()
    }
  }, [])

  // Drag РґР»СЏ РјРѕРґР°Р»СЊРЅРѕРіРѕ РѕРєРЅР°
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
      
      // РћРіСЂР°РЅРёС‡РёРІР°РµРј РїРµСЂРµРјРµС‰РµРЅРёРµ РІ РїСЂРµРґРµР»Р°С… РѕРєРЅР°
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

  // Р—Р°РєСЂС‹С‚РёРµ РїСЂРё РЅР°Р¶Р°С‚РёРё Escape
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

  // Р—Р°РєСЂС‹С‚РёРµ РїСЂРё РєР»РёРєРµ РІРЅРµ РјРѕРґР°Р»СЊРЅРѕРіРѕ РѕРєРЅР°
  const handleClickOutside = useCallback((e) => {
    if (!ref.current) return
    if (ref.current.contains(e.target)) return
    onClose()
  }, [onClose])

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [handleClickOutside])

  // Drag РґР»СЏ РјРѕРґР°Р»СЊРЅРѕРіРѕ РѕРєРЅР°
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
      
      // РћРіСЂР°РЅРёС‡РёРІР°РµРј РїРµСЂРµРјРµС‰РµРЅРёРµ РІ РїСЂРµРґРµР»Р°С… РѕРєРЅР°
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

  // Р—Р°РєСЂС‹С‚РёРµ РїСЂРё РєР»РёРєРµ РІРЅРµ РјРѕРґР°Р»СЊРЅРѕРіРѕ РѕРєРЅР°
  const handleClickOutside = useCallback((e) => {
    if (!ref.current) return
    if (ref.current.contains(e.target)) return
    onCancel()
  }, [onCancel])

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [handleClickOutside])

  // Drag РґР»СЏ РјРѕРґР°Р»СЊРЅРѕРіРѕ РѕРєРЅР°
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
      
      // РћРіСЂР°РЅРёС‡РёРІР°РµРј РїРµСЂРµРјРµС‰РµРЅРёРµ РІ РїСЂРµРґРµР»Р°С… РѕРєРЅР°
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

function UndoToast({ title, itemType, onUndo, onClose }) {
  const [visible, setVisible] = useState(true)
  const deletedLabel =
    itemType === 'section'
      ? '\u0423\u0434\u0430\u043b\u0435\u043d\u0430 \u043f\u0430\u043f\u043a\u0430'
      : '\u0423\u0434\u0430\u043b\u0435\u043d\u0430 \u0441\u0442\u0430\u0442\u044c\u044f'

  useEffect(() => {
    const t = setTimeout(() => {
      setVisible(false)
      setTimeout(onClose, 300)
    }, 5000)
    return () => clearTimeout(t)
  }, [])

  if (!visible) return null
  if (typeof document === 'undefined') return null

  return createPortal(
    <div className="undo-toast show">
      <span className="undo-text">
        {deletedLabel}: <ExpandableTitle title={title} defaultExpanded={false} />
      </span>
      <button onClick={onUndo}>{'\u041e\u0442\u043c\u0435\u043d\u0438\u0442\u044c'}</button>
      <button onClick={onClose} aria-label={'\u0417\u0430\u043a\u0440\u044b\u0442\u044c'}>
        <IconX size={14} />
      </button>
    </div>,
    document.body
  )
}

export default DocumentationListLeftPanel

