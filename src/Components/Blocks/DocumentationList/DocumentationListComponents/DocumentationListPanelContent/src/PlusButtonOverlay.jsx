// src/PlusButtonOverlay.jsx
import { useEffect, useRef, useState } from 'react'
import { TextSelection } from '@tiptap/pm/state'
import KeyboardArrowUpRoundedIcon from '@mui/icons-material/KeyboardArrowUpRounded'
import KeyboardArrowDownRoundedIcon from '@mui/icons-material/KeyboardArrowDownRounded'
import { SlashSourceKey } from './extensions/slashSourceKey'

const OVERLAY_SYNC_EVENT = 'doclist-overlay-sync'

function clampNumber(value, min, max) {
  if (!Number.isFinite(value)) return min
  if (value < min) return min
  if (value > max) return max
  return value
}

function getTopLevelBlockPos(view, el) {
  try {
    const pos = view.posAtDOM(el, 0)
    const $pos = view.state.doc.resolve(pos)
    if ($pos.depth >= 1) return $pos.before(1)
    return pos
  } catch {
    return null
  }
}

function getTopLevelStartPositions(doc) {
  if (!doc || typeof doc.forEach !== 'function') return []
  const positions = []
  doc.forEach((_node, offset) => {
    if (Number.isFinite(offset)) positions.push(offset)
  })
  return positions
}

function getInsertTargetPosForBlock(view, blockEl) {
  if (!view || !(blockEl instanceof Element)) return null

  try {
    const rect = blockEl.getBoundingClientRect()
    const hit = view.posAtCoords({
      left: Math.min(rect.left + 24, rect.right - 6),
      top: Math.min(rect.top + 8, rect.bottom - 8),
    })

    if (!hit) return null

    const $pos = view.state.doc.resolve(hit.pos)

    for (let d = $pos.depth; d > 0; d--) {
      if ($pos.node(d).type.name === 'tableCell') {
        return hit.pos
      }
    }

    for (let d = $pos.depth; d > 0; d--) {
      const node = $pos.node(d)
      if (node.isTextblock) {
        return $pos.end(d) - 1
      }
    }

    for (let d = $pos.depth; d > 0; d--) {
      const node = $pos.node(d)
      if (node.isBlock && node.type.name !== 'doc') {
        try {
          return $pos.after(d)
        } catch {
          // ignore
        }
      }
    }

    return hit.pos
  } catch {
    return null
  }
}

export default function PlusButtonOverlay({
  editor,
  scopeSelector = '.editor-hover-scope',
}) {
  const [pos, setPos] = useState(null)
  const [isInScope, setIsInScope] = useState(false)
  const [isViewReady, setIsViewReady] = useState(false)
  const [hasFreshHover, setHasFreshHover] = useState(false)

  // текущий “ховернутый” блок и позиция, куда ставим курсор при клике на "+"
  const hoverRef = useRef({ el: null, targetPos: null })
  const inScopeRef = useRef(false)
  const controlsGutterHoverRef = useRef(false)
  const openRafRef = useRef(0)
  const syncRafRef = useRef(0)
  const openSnapshotRef = useRef(null)

  useEffect(() => {
    if (!editor) return

    let raf = 0
    let cancelled = false

    const check = () => {
      if (cancelled) return
      try {
        editor.view
        setIsViewReady(true)
      } catch {
        raf = requestAnimationFrame(check)
      }
    }

    check()

    return () => {
      cancelled = true
      cancelAnimationFrame(raf)
      cancelAnimationFrame(syncRafRef.current)
    }
  }, [editor])

  useEffect(() => {
    if (!editor) return
    if (!isViewReady) return

    let view
    try {
      view = editor.view
    } catch {
      return
    }
    const editorDom = view.dom

    // Важно: hover-область должна включать и кнопку "+"
    // Если обёртки нет — fallback на editorDom (как раньше)
    const scopeEl = editorDom.closest(scopeSelector) || editorDom
    const panelScroller = editorDom.closest('.panel-content')

    let raf = 0
    const schedule = fn => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(fn)
    }

    const emitOverlaySync = detail => {
      try {
        window.dispatchEvent(new CustomEvent(OVERLAY_SYNC_EVENT, { detail }))
      } catch {
        // ignore
      }
    }

    const scheduleOverlaySync = detail => {
      emitOverlaySync(detail)
    }

    const getTopLevelBlockEl = target => {
      let el = target
      if (!(el instanceof Element)) {
        if (el && el.nodeType === 3) el = el.parentElement
      }
      if (!(el instanceof Element)) return null

      while (el && el !== editorDom) {
        // берём ближайший верхнеуровневый блок: прямой ребёнок .ProseMirror
        if (el.parentElement === editorDom) return el
        el = el.parentElement
      }
      return null
    }

    const getTopLevelBlockElFromClientY = clientY => {
      if (typeof clientY !== 'number') return null

      const kids = Array.from(editorDom.children)
      let nearest = null
      let nearestDist = Infinity

      for (const el of kids) {
        if (!(el instanceof HTMLElement)) continue
        if (el.classList.contains('ProseMirror-gapcursor')) continue

        const rect = el.getBoundingClientRect()
        if (
          !rect ||
          !Number.isFinite(rect.top) ||
          !Number.isFinite(rect.bottom)
        ) {
          continue
        }

        let marginTop = 0
        let marginBottom = 0
        try {
          const cs = window.getComputedStyle(el)
          marginTop = Number.parseFloat(cs.marginTop) || 0
          marginBottom = Number.parseFloat(cs.marginBottom) || 0
        } catch {
          // ignore
        }

        const expandedTop = rect.top - marginTop
        const expandedBottom = rect.bottom + marginBottom
        if (clientY >= expandedTop && clientY <= expandedBottom) return el

        const centerY = rect.top + rect.height * 0.5
        if (!Number.isFinite(centerY)) continue
        const dist = Math.abs(centerY - clientY)
        if (dist < nearestDist) {
          nearestDist = dist
          nearest = el
        }
      }

      return nearest
    }

    const setPosFromRect = rect => {
      const editorRect = editorDom.getBoundingClientRect()
      const btn = 24
      const centerOffset = Math.max(0, (rect.height - btn) / 2)
      const desiredViewportTop = rect.top + centerOffset

      let visibleTopViewport = editorRect.top
      let visibleBottomViewport = editorRect.bottom - btn
      if (panelScroller instanceof HTMLElement) {
        const panelRect = panelScroller.getBoundingClientRect()
        visibleTopViewport = Math.max(visibleTopViewport, panelRect.top)
        visibleBottomViewport = Math.min(visibleBottomViewport, panelRect.bottom - btn)

        const stickyTopEl = panelScroller.querySelector('.tiptap-panel-top-sticky')
        if (stickyTopEl instanceof HTMLElement) {
          const stickyRect = stickyTopEl.getBoundingClientRect()
          visibleTopViewport = Math.max(visibleTopViewport, stickyRect.bottom)
        }
      }

      const edgeGap = 4
      const minTop = visibleTopViewport + edgeGap
      const maxTop = visibleBottomViewport - edgeGap
      const clampedViewportTop =
        maxTop >= minTop
          ? clampNumber(desiredViewportTop, minTop, maxTop)
          : desiredViewportTop

      const top = clampedViewportTop - editorRect.top + editorDom.scrollTop
      setPos({
        top,
        left: 10,
      })
      return top
    }

    const updateFromElement = el => {
      if (!el) return
      const top = setPosFromRect(el.getBoundingClientRect())
      const blockPos = getTopLevelBlockPos(view, el)
      setHasFreshHover(true)
      scheduleOverlaySync({
        isInScope: inScopeRef.current,
        hoverY: Number.isFinite(top) ? top : null,
        hoverPos: typeof blockPos === 'number' ? blockPos : null,
      })
    }

    const updateFromSelection = () => {
      const { state } = editor
      const { $from } = state.selection
      if (!$from) return

      const domAtPos = view.domAtPos($from.pos)
      let dom = domAtPos.node

      // если это текстовый узел — поднимаемся на element
      if (dom && dom.nodeType === 3) dom = dom.parentElement
      if (!(dom instanceof HTMLElement)) return

      const blockEl = getTopLevelBlockEl(dom) || dom
      updateFromElement(blockEl)
    }

    const computeTargetPos = blockEl => {
      const rect = blockEl.getBoundingClientRect()

      // берём координату внутри блока, чтобы получить doc pos
      const hit = view.posAtCoords({
        left: Math.min(rect.left + 24, rect.right - 6),
        top: Math.min(rect.top + 8, rect.bottom - 8),
      })

      if (!hit) return null

      const $pos = view.state.doc.resolve(hit.pos)

      // таблица?
      for (let d = $pos.depth; d > 0; d--) {
        if ($pos.node(d).type.name === 'tableCell') {
          return { pos: hit.pos, insideTable: true }
        }
      }

      // если это текстовый блок — ставим курсор в КОНЕЦ этого текстблока
      for (let d = $pos.depth; d > 0; d--) {
        const node = $pos.node(d)
        if (node.isTextblock) {
          return { pos: $pos.end(d) - 1, insideTable: false }
        }
      }

      // иначе (image/video/atom/etc) — ставим курсор ПОСЛЕ блока
      for (let d = $pos.depth; d > 0; d--) {
        const node = $pos.node(d)
        if (node.isBlock && node.type.name !== 'doc') {
          try {
            return { pos: $pos.after(d), insideTable: false }
          } catch {
            // ignore
          }
        }
      }

      return { pos: hit.pos, insideTable: false }
    }
    const onMouseMove = e => {
      if (!inScopeRef.current) {
        inScopeRef.current = true
        setIsInScope(true)
      }
      controlsGutterHoverRef.current = false

      const blockEl = getTopLevelBlockEl(e.target)

      // мышь попала в зазор между блоками — НЕ прыгаем к текстовому курсору, держим прошлую позицию
      if (!blockEl) return

      // тот же блок — ничего не делаем
      if (hoverRef.current.el === blockEl) return

      const info = computeTargetPos(blockEl)
      hoverRef.current = {
        el: blockEl,
        targetPos: info?.pos ?? null,
      }

      schedule(() => updateFromElement(blockEl))
    }

    const onScopeMouseMove = e => {
      const t = e?.target
      if (t instanceof Element) {
        // Keep controls stable while pointer is in the left controls gutter
        // (buttons +/drag/arrows) to make click interactions reliable.
        if (t.closest('.position-plus-button')) {
          controlsGutterHoverRef.current = true
          return
        }
        controlsGutterHoverRef.current = false
        if (editorDom.contains(t)) return
        if (t.closest('.slash-menu-wrapper')) return
      } else {
        controlsGutterHoverRef.current = false
      }

      // Hide controls while cursor is outside the article area (gray gutter / outside editor).
      if (typeof e?.clientX === 'number') {
        const editorRect = editorDom.getBoundingClientRect()
        if (
          Number.isFinite(editorRect.left) &&
          Number.isFinite(editorRect.right) &&
          (e.clientX < editorRect.left || e.clientX > editorRect.right)
        ) {
          inScopeRef.current = false
          setIsInScope(false)
          setHasFreshHover(false)
          hoverRef.current = { el: null, targetPos: null }
          emitOverlaySync({
            isInScope: false,
            hoverY: null,
            hoverPos: null,
          })
          return
        }
      }

      const blockEl = getTopLevelBlockElFromClientY(e?.clientY)
      if (!blockEl) return

      if (!inScopeRef.current) {
        inScopeRef.current = true
        setIsInScope(true)
      }
      if (hoverRef.current.el === blockEl) return

      const info = computeTargetPos(blockEl)
      hoverRef.current = {
        el: blockEl,
        targetPos: info?.pos ?? null,
      }

      schedule(() => updateFromElement(blockEl))
    }

    const onMouseEnter = e => {
      const editorRect = editorDom.getBoundingClientRect()
      const insideArticleX =
        typeof e?.clientX === 'number' &&
        Number.isFinite(editorRect.left) &&
        Number.isFinite(editorRect.right) &&
        e.clientX >= editorRect.left &&
        e.clientX <= editorRect.right

      if (!insideArticleX) {
        inScopeRef.current = false
        setIsInScope(false)
        setHasFreshHover(false)
        hoverRef.current = { el: null, targetPos: null }
        emitOverlaySync({
          isInScope: false,
          hoverY: null,
          hoverPos: null,
        })
        return
      }

      inScopeRef.current = true
      setIsInScope(true)
      setHasFreshHover(false)
      schedule(() => {
        const fromPoint = getTopLevelBlockElFromClientY(e?.clientY)
        if (fromPoint) updateFromElement(fromPoint)
        else if (hoverRef.current.el) updateFromElement(hoverRef.current.el)
      })
    }

    const onMouseLeave = () => {
      inScopeRef.current = false
      controlsGutterHoverRef.current = false
      setIsInScope(false)
      setHasFreshHover(false)
      hoverRef.current = { el: null, targetPos: null }
      emitOverlaySync({
        isInScope: false,
        hoverY: null,
        hoverPos: null,
      })
      // Keep last position and just hide controls; no selection-based reposition on leave.
    }

    const onScroll = () => {
      if (hoverRef.current.el) {
        schedule(() => updateFromElement(hoverRef.current.el))
      } else {
        schedule(updateFromSelection)
      }
    }

    const onSelectionLike = () => {
      const hoveredEl = hoverRef.current.el
      if (hoveredEl instanceof HTMLElement && editorDom.contains(hoveredEl)) {
        updateFromElement(hoveredEl)
        return
      }
      if (controlsGutterHoverRef.current) {
        updateFromSelection()
        return
      }
      hoverRef.current = { el: null, targetPos: null }
      updateFromSelection()
    }

    const onBlur = () => {
      // если мышь НЕ над блоком — можно убрать позицию, чтобы не висела в воздухе
      if (!hoverRef.current.el) setPos(null)
    }

    editor.on('selectionUpdate', onSelectionLike)
    editor.on('transaction', onSelectionLike)
    editor.on('focus', onSelectionLike)
    editor.on('blur', onBlur)

    // mousemove оставляем на ProseMirror для точного определения блока
    editorDom.addEventListener('mousemove', onMouseMove)
    scopeEl.addEventListener('mousemove', onScopeMouseMove)
    if (panelScroller instanceof HTMLElement && panelScroller !== editorDom) {
      panelScroller.addEventListener('mousemove', onScopeMouseMove)
    }

    // enter/leave вешаем на scope, чтобы кнопка "+" считалась "внутри"
    scopeEl.addEventListener('mouseenter', onMouseEnter)
    scopeEl.addEventListener('mouseleave', onMouseLeave)
    if (panelScroller instanceof HTMLElement && panelScroller !== editorDom) {
      panelScroller.addEventListener('mouseleave', onMouseLeave)
    }

    editorDom.addEventListener('scroll', onScroll)
    if (panelScroller instanceof HTMLElement && panelScroller !== editorDom) {
      panelScroller.addEventListener('scroll', onScroll)
    }
    window.addEventListener('resize', onScroll)
    window.addEventListener('scroll', onScroll, true)

    // стартовое позиционирование
    updateFromSelection()

    return () => {
      cancelAnimationFrame(raf)
      cancelAnimationFrame(syncRafRef.current)

      editor.off('selectionUpdate', onSelectionLike)
      editor.off('transaction', onSelectionLike)
      editor.off('focus', onSelectionLike)
      editor.off('blur', onBlur)

      editorDom.removeEventListener('mousemove', onMouseMove)
      scopeEl.removeEventListener('mousemove', onScopeMouseMove)
      if (panelScroller instanceof HTMLElement && panelScroller !== editorDom) {
        panelScroller.removeEventListener('mousemove', onScopeMouseMove)
      }
      scopeEl.removeEventListener('mouseenter', onMouseEnter)
      scopeEl.removeEventListener('mouseleave', onMouseLeave)
      if (panelScroller instanceof HTMLElement && panelScroller !== editorDom) {
        panelScroller.removeEventListener('mouseleave', onMouseLeave)
      }
      editorDom.removeEventListener('scroll', onScroll)
      if (panelScroller instanceof HTMLElement && panelScroller !== editorDom) {
        panelScroller.removeEventListener('scroll', onScroll)
      }
      window.removeEventListener('resize', onScroll)
      window.removeEventListener('scroll', onScroll, true)
    }
  }, [editor, scopeSelector, isViewReady])

  useEffect(() => {
    return () => {
      cancelAnimationFrame(openRafRef.current)
      cancelAnimationFrame(syncRafRef.current)
    }
  }, [])
  const toAnchorRect = (rectLike) => {
    if (!rectLike) return null
    const { top, left, right, bottom, width, height } = rectLike
    if (
      !Number.isFinite(top) ||
      !Number.isFinite(left) ||
      !Number.isFinite(right) ||
      !Number.isFinite(bottom)
    ) {
      return null
    }
    return { top, left, right, bottom, width, height }
  }

  const createOpenSnapshot = () => {
    const hoverEl = hoverRef.current?.el
    const hoverRect =
      hoverEl && typeof hoverEl.getBoundingClientRect === 'function'
        ? hoverEl.getBoundingClientRect()
        : null
    let liveTargetPos = null
    try {
      liveTargetPos = getInsertTargetPosForBlock(editor?.view, hoverEl)
    } catch {
      liveTargetPos = null
    }
    return {
      targetPos:
        typeof liveTargetPos === 'number'
          ? liveTargetPos
          : typeof hoverRef.current?.targetPos === 'number'
            ? hoverRef.current.targetPos
          : null,
      anchorRect: toAnchorRect(hoverRect),
    }
  }

  const getCurrentTopLevelBlockPos = () => {
    if (!editor || !isViewReady) return null

    let view
    try {
      view = editor.view
    } catch {
      return null
    }

    const hoverEl = hoverRef.current?.el
    if (hoverEl instanceof Element) {
      const hoverPos = getTopLevelBlockPos(view, hoverEl)
      if (typeof hoverPos === 'number') return hoverPos
    }

    const selection = view.state.selection
    const $from = selection?.$from
    if ($from && typeof $from.depth === 'number' && $from.depth >= 1) {
      try {
        return $from.before(1)
      } catch {
        // ignore
      }
    }

    const starts = getTopLevelStartPositions(view.state.doc)
    return starts.length > 0 ? starts[0] : null
  }

  const insertParagraphNearCurrentBlock = (direction) => {
    if (!editor || !isViewReady) return null
    if (direction !== 'up' && direction !== 'down') return null

    let view
    try {
      view = editor.view
    } catch {
      return null
    }

    const { state } = view
    const starts = getTopLevelStartPositions(state.doc)
    if (!Array.isArray(starts) || starts.length === 0) return null

    const paragraphType = state.schema?.nodes?.paragraph
    if (!paragraphType) return null

    const currentBlockPos = getCurrentTopLevelBlockPos()
    let currentIndex = starts.indexOf(currentBlockPos)

    if (currentIndex < 0 && typeof currentBlockPos === 'number') {
      let closestIndex = 0
      let closestDistance = Infinity
      for (let i = 0; i < starts.length; i += 1) {
        const dist = Math.abs(starts[i] - currentBlockPos)
        if (dist < closestDistance) {
          closestDistance = dist
          closestIndex = i
        }
      }
      currentIndex = closestIndex
    }

    if (currentIndex < 0) currentIndex = 0

    const insertPos =
      direction === 'up'
        ? starts[currentIndex]
        : (currentIndex + 1 < starts.length ? starts[currentIndex + 1] : state.doc.content.size)

    let tr = state.tr.insert(insertPos, paragraphType.create())
    const textPos = Math.max(1, Math.min(insertPos + 1, tr.doc.content.size))
    tr = tr.setSelection(TextSelection.create(tr.doc, textPos))
    view.dispatch(tr.scrollIntoView())
    view.focus()

    return textPos
  }

  const openSlashMenu = (snapshot) => {
    const { state, view } = editor
    const fallbackSnapshot = createOpenSnapshot()
    const anchorRect = snapshot?.anchorRect || fallbackSnapshot.anchorRect

    // помечаем, что slash пришёл от "+"
    view.dispatch(
      state.tr.setMeta(SlashSourceKey, { fromPlus: true, anchorRect })
    )

    editor.commands.focus()

    // если курсор уже в таблице — НЕ переносим его в другое место
    const isCursorInsideTable = (() => {
      const { $from } = editor.state.selection
      for (let d = $from.depth; d > 0; d--) {
        if ($from.node(d).type.name === 'tableCell') return true
      }
      return false
    })()

    // если мы навелись на блок — переносим курсор туда (но не из таблицы)
    const targetPos =
      typeof snapshot?.targetPos === 'number'
        ? snapshot.targetPos
        : fallbackSnapshot.targetPos
    if (!isCursorInsideTable && typeof targetPos === 'number') {
      editor.commands.setTextSelection(targetPos)
    }

    // дальше работаем уже с актуальной селекцией
    const { state: nextState } = editor
    const { $from } = nextState.selection
    const parent = $from.parent

    const insideTable = (() => {
      for (let d = $from.depth; d > 0; d--) {
        if ($from.node(d).type.name === 'tableCell') return true
      }
      return false
    })()

    const text = parent.isTextblock ? parent.textContent : ''
    const trimmed = text.trim()
    const hasRealContent = trimmed !== '' && trimmed !== '/'

    // если мы НЕ в текстблоке (например image/video) — создаём paragraph перед "/"
    if (!insideTable && !parent.isTextblock) {
      editor.chain().insertContent({ type: 'paragraph' }).run()
    } else if (!insideTable && hasRealContent) {
      // если текстблок не пустой — создаём новый paragraph
      editor.chain().insertContent({ type: 'paragraph' }).run()
    }

    // вставляем "/" (не дублируем)
    const { state: st2 } = editor
    const { $from: f2 } = st2.selection
    const p2 = f2.parent
    const t2 = p2.isTextblock ? p2.textContent : ''
    if (!t2.includes('/')) {
      editor.commands.insertContent('/')
    }
  }

  const scheduleOpenSlashMenu = (snapshot) => {
    cancelAnimationFrame(openRafRef.current)
    openRafRef.current = requestAnimationFrame(() => {
      openSlashMenu(snapshot)
    })
  }

  const onStepButtonPointerDown = (e) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const onStepInsertClick = (e, direction) => {
    e.preventDefault()
    e.stopPropagation()

    const baseSnapshot = createOpenSnapshot()
    const insertedTargetPos = insertParagraphNearCurrentBlock(direction)
    if (typeof insertedTargetPos === 'number') {
      scheduleOpenSlashMenu({
        targetPos: insertedTargetPos,
        anchorRect: baseSnapshot?.anchorRect ?? null,
      })
      return
    }

    scheduleOpenSlashMenu(baseSnapshot)
  }

  const hasPos = Number.isFinite(pos?.top)
  const x = 0
  const y = hasPos ? pos.top : 0
  const plusClusterY = hasPos ? y - 32 : 0
  const plusVisibleClass = isInScope && hasPos && hasFreshHover ? 'plus-visible' : ''

  return (
    <div className={`position-plus-button ${plusVisibleClass}`}>
      <div
        className="plus-handle-cluster"
        style={{ transform: `translate3d(${x}px, ${plusClusterY}px, 0)` }}
      >
        <button
          type="button"
          className="plus-step-btn plus-step-btn-up"
          onPointerDown={onStepButtonPointerDown}
          onClick={e => onStepInsertClick(e, 'up')}
          aria-label="Добавить блок выше"
          title="Добавить блок выше"
        >
          <KeyboardArrowUpRoundedIcon
            aria-hidden="true"
            fontSize="inherit"
            style={{ width: 12, height: 12, fontSize: 12 }}
          />
        </button>

        <div
          className="plus-overlay"
          role="button"
          aria-label="Добавить блок"
          style={{ transform: 'translate3d(0px, 32px, 0px)' }}
          onPointerDown={e => {
            openSnapshotRef.current = createOpenSnapshot()
            e.preventDefault()
            e.stopPropagation()
          }}
          onClick={e => {
            e.preventDefault()
            e.stopPropagation()
            scheduleOpenSlashMenu(openSnapshotRef.current || createOpenSnapshot())
          }}
        >
          +
        </div>

        <button
          type="button"
          className="plus-step-btn plus-step-btn-down"
          onPointerDown={onStepButtonPointerDown}
          onClick={e => onStepInsertClick(e, 'down')}
          aria-label="Добавить блок ниже"
          title="Добавить блок ниже"
        >
          <KeyboardArrowDownRoundedIcon
            aria-hidden="true"
            fontSize="inherit"
            style={{ width: 12, height: 12, fontSize: 12 }}
          />
        </button>
      </div>
    </div>
  )
}


























