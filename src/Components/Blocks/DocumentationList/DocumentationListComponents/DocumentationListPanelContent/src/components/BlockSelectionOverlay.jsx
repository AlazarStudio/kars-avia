import { useEffect, useRef, useState } from 'react'
import { Fragment, Slice } from 'prosemirror-model'
import { Selection } from 'prosemirror-state'
import { BlockLassoSelectionKey } from '../extensions/blockLassoSelection'

const RECT_CLASS = 'block-lasso-rect'
const MARKER_CLASS = 'block-lasso-marker'

const MARKER_OFFSET_X = 18

function rectFromPoints(a, b) {
  const left = Math.min(a.x, b.x)
  const top = Math.min(a.y, b.y)
  const right = Math.max(a.x, b.x)
  const bottom = Math.max(a.y, b.y)
  return { left, top, right, bottom, width: right - left, height: bottom - top }
}

function intersectRect(a, b) {
  if (!a || !b) return null
  const left = Math.max(a.left, b.left)
  const top = Math.max(a.top, b.top)
  const right = Math.min(a.right, b.right)
  const bottom = Math.min(a.bottom, b.bottom)
  if (right <= left || bottom <= top) return null
  return { left, top, right, bottom, width: right - left, height: bottom - top }
}

function isFormFieldTarget(target) {
  if (!(target instanceof Element)) return false
  return Boolean(target.closest('input, textarea, select'))
}

function normalizeTargetToElement(target) {
  if (target instanceof Element) return target
  if (target && target.nodeType === 3) return target.parentElement
  return null
}

function hasNativeTextSelectionInActiveField() {
  const el = document.activeElement
  if (el instanceof HTMLTextAreaElement || el instanceof HTMLInputElement) {
    const { selectionStart, selectionEnd } = el
    return (
      typeof selectionStart === 'number' &&
      typeof selectionEnd === 'number' &&
      selectionStart !== selectionEnd
    )
  }
  return false
}

export default function BlockSelectionOverlay({
  editor,
  scopeSelector = '.editor-hover-scope',
  requireAlt = true,
  onSelectionChange,
}) {
  const [rectStyle, setRectStyle] = useState(null)
  const [markers, setMarkers] = useState([])
  const [isViewReady, setIsViewReady] = useState(false)

  const dragRef = useRef({
    active: false,
    startPage: { x: 0, y: 0 },
    lastClient: { x: 0, y: 0 },
    lastRect: null, // viewport coords (client)
    scrollSources: [],
    startSourceScroll: [],
    raf: 0,
  })

  const selectedPosRef = useRef([])
  const lastClickedPosRef = useRef(null)

  useEffect(() => {
    if (!editor) return

    setIsViewReady(false)

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
    const scopeEl = editorDom.closest(scopeSelector) || editorDom.parentElement || editorDom
    const panelScroller = editorDom.closest('.panel-content')
    const stickyTopEl =
      panelScroller instanceof HTMLElement
        ? panelScroller.querySelector('.tiptap-panel-top-sticky')
        : null

    const prevUserSelect = { value: '', important: false }

    const setUserSelect = value => {
      const style = document.documentElement.style
      if (!prevUserSelect.value) {
        prevUserSelect.value = style.userSelect
      }
      style.userSelect = value
    }

    const setAltCursorMode = enabled => {
      if (!(scopeEl instanceof HTMLElement)) return
      scopeEl.classList.toggle('alt-lasso-cursor', Boolean(enabled))
    }

    const samePositions = (a, b) => {
      if (a === b) return true
      if (!a?.length && !b?.length) return true
      if (!a?.length || !b?.length) return false
      if (a.length !== b.length) return false
      for (let i = 0; i < a.length; i++) {
        if (a[i] !== b[i]) return false
      }
      return true
    }

    const dispatchSelectedPositions = nextPos => {
      try {
        const tr = view.state.tr
          .setMeta(BlockLassoSelectionKey, { positions: nextPos })
          .setMeta('addToHistory', false)
        view.dispatch(tr)
      } catch {
        // ignore
      }
    }

    const clearSelected = () => {
      if (selectedPosRef.current.length) {
        dispatchSelectedPositions([])
      }
      selectedPosRef.current = []
      lastClickedPosRef.current = null
      setMarkers([])
      onSelectionChange?.([])
    }

    const getSelectedPositions = () => {
      const pluginState = BlockLassoSelectionKey.getState(view.state)
      if (pluginState && Array.isArray(pluginState.positions)) {
        return pluginState.positions
      }
      return selectedPosRef.current
    }

    const getTopLevelBlockEls = () => {
      const kids = Array.from(editorDom.children)
      return kids.filter(el => {
        if (!(el instanceof HTMLElement)) return false
        if (el.classList.contains('ProseMirror-gapcursor')) return false
        return true
      })
    }

    const getTopLevelBlockPos = el => {
      try {
        const pos = view.posAtDOM(el, 0)
        const $pos = view.state.doc.resolve(pos)
        if ($pos.depth >= 1) return $pos.before(1)
        return pos
      } catch {
        return null
      }
    }

    const getTopLevelBlockElementFromTarget = target => {
      let el = normalizeTargetToElement(target)
      while (el && el !== editorDom) {
        if (
          el instanceof HTMLElement &&
          el.parentElement === editorDom &&
          !el.classList.contains('ProseMirror-gapcursor')
        ) {
          return el
        }
        el = el.parentElement
      }
      return null
    }

    const getTopLevelPosFromTarget = target => {
      const blockEl = getTopLevelBlockElementFromTarget(target)
      if (!blockEl) return null
      const pos = getTopLevelBlockPos(blockEl)
      return typeof pos === 'number' ? pos : null
    }

    const getTopLevelPositionsInOrder = () => {
      const out = []
      const seen = new Set()
      const blocks = getTopLevelBlockEls()
      for (const el of blocks) {
        const pos = getTopLevelBlockPos(el)
        if (typeof pos !== 'number') continue
        if (seen.has(pos)) continue
        seen.add(pos)
        out.push(pos)
      }
      out.sort((a, b) => a - b)
      return out
    }

    const buildMarkersForPositions = positions => {
      if (!positions?.length) return []

      const scopeRect = scopeEl.getBoundingClientRect()
      const editorRect = editorDom.getBoundingClientRect()
      const markerLeft = editorRect.right - scopeRect.left + MARKER_OFFSET_X
      const selected = new Set(positions)
      const out = []

      const blocks = getTopLevelBlockEls()
      for (const el of blocks) {
        const pos = getTopLevelBlockPos(el)
        if (typeof pos !== 'number' || !selected.has(pos)) continue
        const r = el.getBoundingClientRect()
        out.push({
          key: pos,
          top: r.top - scopeRect.top + r.height / 2,
          left: markerLeft,
        })
      }

      return out
    }

    const buildRangePositions = (startPos, endPos) => {
      if (typeof startPos !== 'number' || typeof endPos !== 'number') return []
      const ordered = getTopLevelPositionsInOrder()
      const startIdx = ordered.indexOf(startPos)
      const endIdx = ordered.indexOf(endPos)
      if (startIdx === -1 || endIdx === -1) {
        return [endPos]
      }
      const from = Math.min(startIdx, endIdx)
      const to = Math.max(startIdx, endIdx)
      return ordered.slice(from, to + 1)
    }

    const computeSelectedForRect = selRect => {
      const nextPos = []
      const seen = new Set()
      const nextMarkers = []

      const scopeRect = scopeEl.getBoundingClientRect()
      const editorRect = editorDom.getBoundingClientRect()
      const markerLeft = editorRect.right - scopeRect.left + MARKER_OFFSET_X

      const blocks = getTopLevelBlockEls()
      for (let i = 0; i < blocks.length; i++) {
        const el = blocks[i]
        const r = el.getBoundingClientRect()
        // Выделяем блоки только по пересечению по оси Y (как в "гаттере" Notion)
        // чтобы можно было выделять даже если прямоугольник узкий или слева от контента.
        if (r.bottom < selRect.top || r.top > selRect.bottom) continue

        const pos = getTopLevelBlockPos(el)
        if (typeof pos === 'number' && !seen.has(pos)) {
          seen.add(pos)
          nextPos.push(pos)

          nextMarkers.push({
            key: pos,
            top: r.top - scopeRect.top + r.height / 2,
            left: markerLeft,
          })
        } else if (typeof pos !== 'number') {
          nextMarkers.push({
            key: `idx:${i}`,
            top: r.top - scopeRect.top + r.height / 2,
            left: markerLeft,
          })
        }
      }

      nextPos.sort((a, b) => a - b)
      return { nextPos, nextMarkers }
    }

    const buildSelectedSlice = () => {
      const positions = getSelectedPositions()
      if (!positions?.length) return null

      const nodes = []
      for (const pos of positions) {
        if (typeof pos !== 'number') continue
        const node = view.state.doc.nodeAt(pos)
        if (node) nodes.push(node)
      }

      if (!nodes.length) return null
      return new Slice(Fragment.fromArray(nodes), 0, 0)
    }

    const deleteSelectedBlocks = () => {
      const positions = Array.from(new Set(getSelectedPositions())).filter(p => typeof p === 'number')
      if (!positions.length) return

      positions.sort((a, b) => b - a)

      const { schema } = view.state
      let tr = view.state.tr

      for (const pos of positions) {
        const node = tr.doc.nodeAt(pos)
        if (!node) continue
        tr = tr.delete(pos, pos + node.nodeSize)
      }

      if (!tr.docChanged) return

      if (tr.doc.content.size === 0 && schema.nodes.paragraph) {
        tr = tr.insert(0, schema.nodes.paragraph.create())
      }

      const minPos = Math.min(...positions)
      const nextPos = Math.min(minPos, tr.doc.content.size)
      tr = tr
        .setSelection(Selection.near(tr.doc.resolve(nextPos), 1))
        .scrollIntoView()
        .setMeta('uiEvent', 'delete')

      view.dispatch(tr)
    }

    const applySelection = ({ nextPos, nextMarkers }) => {
      if (!samePositions(selectedPosRef.current, nextPos)) {
        dispatchSelectedPositions(nextPos)
        selectedPosRef.current = nextPos
        onSelectionChange?.(nextPos)
      }
      setMarkers(nextMarkers || [])
    }

    const scheduleSelectionUpdate = () => {
      cancelAnimationFrame(dragRef.current.raf)
      dragRef.current.raf = requestAnimationFrame(() => {
        const selRect = dragRef.current.lastRect
        if (!selRect) return
        applySelection(computeSelectedForRect(selRect))
      })
    }

    const collectScrollSources = () => {
      const out = []
      const seen = new Set()
      const add = el => {
        if (!(el instanceof HTMLElement)) return
        if (seen.has(el)) return
        seen.add(el)
        out.push(el)
      }

      add(editorDom)
      add(scopeEl)
      add(panelScroller)
      return out
    }

    const snapshotScrollSources = sources =>
      sources.map(el => ({
        el,
        left: el.scrollLeft,
        top: el.scrollTop,
      }))

    const getSyntheticScroll = () => {
      let scrollX = window.scrollX
      let scrollY = window.scrollY

      const sourceStart = dragRef.current.startSourceScroll
      if (Array.isArray(sourceStart)) {
        for (const item of sourceStart) {
          const el = item?.el
          if (!(el instanceof HTMLElement)) continue
          scrollX += el.scrollLeft - (item.left || 0)
          scrollY += el.scrollTop - (item.top || 0)
        }
      }

      return { x: scrollX, y: scrollY }
    }

    const toVirtualPagePoint = (clientX, clientY) => {
      const syntheticScroll = getSyntheticScroll()
      return {
        x: clientX + syntheticScroll.x,
        y: clientY + syntheticScroll.y,
      }
    }

    const stopDrag = () => {
      dragRef.current.active = false
      dragRef.current.lastRect = null
      setRectStyle(null)
      setUserSelect(prevUserSelect.value || '')
      document.removeEventListener('mousemove', onMouseMove, true)
      document.removeEventListener('mouseup', onMouseUp, true)
      window.removeEventListener('scroll', onScroll, true)
      const activeSources = Array.isArray(dragRef.current.scrollSources)
        ? dragRef.current.scrollSources
        : []
      for (const el of activeSources) {
        if (!(el instanceof HTMLElement)) continue
        el.removeEventListener('scroll', onScroll, true)
      }
      dragRef.current.scrollSources = []
      dragRef.current.startSourceScroll = []
      cancelAnimationFrame(dragRef.current.raf)
    }

    const updateFromPagePoints = (aPage, bPage) => {
      const syntheticScroll = getSyntheticScroll()
      const a = { x: aPage.x - syntheticScroll.x, y: aPage.y - syntheticScroll.y }
      const b = { x: bPage.x - syntheticScroll.x, y: bPage.y - syntheticScroll.y }
      const next = rectFromPoints(a, b)
      const editorRect = editorDom.getBoundingClientRect()
      let clipRect = {
        left: editorRect.left,
        top: editorRect.top,
        right: editorRect.right,
        bottom: editorRect.bottom,
      }

      if (panelScroller instanceof HTMLElement) {
        const panelRect = panelScroller.getBoundingClientRect()
        const stickyRect =
          stickyTopEl instanceof HTMLElement ? stickyTopEl.getBoundingClientRect() : null

        clipRect = {
          left: clipRect.left,
          right: clipRect.right,
          top: Math.max(
            clipRect.top,
            panelRect.top,
            stickyRect ? stickyRect.bottom : -Infinity
          ),
          bottom: Math.min(clipRect.bottom, panelRect.bottom),
        }
      }

      const clipped = intersectRect(next, clipRect)

      // Keep the logical lasso rect untouched so selection can continue beyond
      // the visible article area while scrolling. Only clip the visual overlay.
      dragRef.current.lastRect = next
      setRectStyle(
        clipped
          ? { left: clipped.left, top: clipped.top, width: clipped.width, height: clipped.height }
          : null
      )
      scheduleSelectionUpdate()
    }

    const onMouseMove = e => {
      if (!dragRef.current.active) return
      dragRef.current.lastClient = { x: e.clientX, y: e.clientY }
      const currentPage = toVirtualPagePoint(e.clientX, e.clientY)
      updateFromPagePoints(dragRef.current.startPage, currentPage)
    }

    const onMouseUp = () => {
      if (!dragRef.current.active) return
      if (dragRef.current.lastRect) {
        applySelection(computeSelectedForRect(dragRef.current.lastRect))
      }
      stopDrag()
      if (selectedPosRef.current.length) {
        lastClickedPosRef.current = selectedPosRef.current[selectedPosRef.current.length - 1]
        editor.commands.focus()
      }
    }

    const onBlur = () => {
      setAltCursorMode(false)
      if (!dragRef.current.active) return
      if (dragRef.current.lastRect) {
        applySelection(computeSelectedForRect(dragRef.current.lastRect))
      }
      stopDrag()
    }

    const onScroll = () => {
      if (!dragRef.current.active) return
      const currentPage = toVirtualPagePoint(
        dragRef.current.lastClient.x,
        dragRef.current.lastClient.y
      )
      updateFromPagePoints(dragRef.current.startPage, currentPage)
    }

    const canStart = e => {
      if (e.button !== 0) return false
      const t = normalizeTargetToElement(e.target)
      if (!t) return false
      if (requireAlt && !e.altKey) return false
      if (t.closest('.block-dnd-handle')) return false
      if (t.closest('.plus-overlay')) return false
      if (t.closest('.slash-menu-wrapper')) return false
      if (t.closest('input, textarea, select, button')) return false

      const insideEditor = editorDom.contains(t)
      if (!insideEditor) return false
      if (insideEditor && !e.altKey) return false

      return true
    }

    const onMouseDown = e => {
      if (!canStart(e)) return

      const clickedPos = getTopLevelPosFromTarget(e.target)
      const isAdditivePick = e.altKey && (e.ctrlKey || e.metaKey) && !e.shiftKey
      const isRangePick = e.altKey && e.shiftKey

      if (typeof clickedPos === 'number' && (isAdditivePick || isRangePick)) {
        e.preventDefault()

        const currentSelection = Array.from(new Set(getSelectedPositions()))
          .filter(pos => typeof pos === 'number')
          .sort((a, b) => a - b)

        let nextPos = currentSelection

        if (isRangePick) {
          const anchorPos =
            typeof lastClickedPosRef.current === 'number'
              ? lastClickedPosRef.current
              : currentSelection.length
                ? currentSelection[currentSelection.length - 1]
                : null

          nextPos =
            typeof anchorPos === 'number'
              ? buildRangePositions(anchorPos, clickedPos)
              : [clickedPos]
        } else {
          const isAlreadySelected = currentSelection.includes(clickedPos)
          nextPos = isAlreadySelected
            ? currentSelection.filter(pos => pos !== clickedPos)
            : [...currentSelection, clickedPos].sort((a, b) => a - b)
        }

        applySelection({
          nextPos,
          nextMarkers: buildMarkersForPositions(nextPos),
        })
        lastClickedPosRef.current = clickedPos
        if (nextPos.length) {
          editor.commands.focus()
        }
        return
      }

      e.preventDefault()

      clearSelected()
      lastClickedPosRef.current = typeof clickedPos === 'number' ? clickedPos : null

      const scrollSources = collectScrollSources()
      dragRef.current.scrollSources = scrollSources
      dragRef.current.startSourceScroll = snapshotScrollSources(scrollSources)
      dragRef.current.active = true
      dragRef.current.startPage = toVirtualPagePoint(e.clientX, e.clientY)
      dragRef.current.lastClient = { x: e.clientX, y: e.clientY }
      updateFromPagePoints(dragRef.current.startPage, dragRef.current.startPage)

      setUserSelect('none')

      document.addEventListener('mousemove', onMouseMove, true)
      document.addEventListener('mouseup', onMouseUp, true)
      window.addEventListener('scroll', onScroll, true)
      for (const el of scrollSources) {
        if (!(el instanceof HTMLElement)) continue
        el.addEventListener('scroll', onScroll, true)
      }
    }

    const onGlobalMouseDown = e => {
      if (dragRef.current.active) return
      const t = normalizeTargetToElement(e.target)
      if (!t) return
      if (t.closest('.block-dnd-handle')) return
      if (t.closest('.plus-overlay')) return
      if (t.closest('.position-plus-button')) return
      if (t.closest('.slash-menu-wrapper')) return
      if (!getSelectedPositions().length) return

      if (!e.altKey) clearSelected()
    }

    const onCopy = e => {
      if (!getSelectedPositions().length) return
      if (dragRef.current.active) return
      if (hasNativeTextSelectionInActiveField()) return

      const data = e.clipboardData
      if (!data) return

      const slice = buildSelectedSlice()
      if (!slice) return

      const { dom } = view.serializeForClipboard(slice)
      const text = slice.content.textBetween(0, slice.content.size, '\n\n')

      e.preventDefault()
      e.stopPropagation()
      try {
        data.clearData()
      } catch {
        // ignore
      }
      data.setData('text/html', dom.innerHTML)
      data.setData('text/plain', text)
    }

    const onKeyDown = e => {
      if (requireAlt) {
        setAltCursorMode(Boolean(e.altKey))
      }

      const selectedPositions = getSelectedPositions()
      if (
        (e.key === 'Backspace' || e.key === 'Delete') &&
        !dragRef.current.active &&
        selectedPositions.length
      ) {
        if (isFormFieldTarget(e.target)) return
        e.preventDefault()
        e.stopPropagation()
        deleteSelectedBlocks()
        clearSelected()
        return
      }

      if (
        (e.key === 'c' || e.key === 'C') &&
        (e.metaKey || e.ctrlKey) &&
        !dragRef.current.active &&
        selectedPositions.length
      ) {
        if (hasNativeTextSelectionInActiveField()) return

        const domSel = window.getSelection()
        if (domSel && !domSel.isCollapsed) return

        e.preventDefault()
        e.stopPropagation()

        try {
          editor.commands.focus()
        } catch {
          // ignore
        }

        let ok = false
        try {
          ok = document.execCommand('copy')
        } catch {
          ok = false
        }

        if (!ok && navigator.clipboard && window.ClipboardItem) {
          const slice = buildSelectedSlice()
          if (!slice) return

          const { dom } = view.serializeForClipboard(slice)
          const html = dom.innerHTML
          const text = slice.content.textBetween(0, slice.content.size, '\n\n')

          navigator.clipboard
            .write([
              new ClipboardItem({
                'text/html': new Blob([html], { type: 'text/html' }),
                'text/plain': new Blob([text], { type: 'text/plain' }),
              }),
            ])
            .catch(() => {
              navigator.clipboard?.writeText?.(text).catch(() => {})
            })
        }

        return
      }

      if (e.key !== 'Escape') return
      if (!dragRef.current.active) return
      e.preventDefault()
      clearSelected()
      stopDrag()
    }

    const onKeyUp = e => {
      if (requireAlt) {
        setAltCursorMode(Boolean(e.altKey))
      }
    }

    scopeEl.addEventListener('mousedown', onMouseDown, true)
    document.addEventListener('mousedown', onGlobalMouseDown, true)
    document.addEventListener('copy', onCopy, true)
    document.addEventListener('keydown', onKeyDown, true)
    document.addEventListener('keyup', onKeyUp, true)
    window.addEventListener('blur', onBlur, true)

    return () => {
      scopeEl.removeEventListener('mousedown', onMouseDown, true)
      document.removeEventListener('mousedown', onGlobalMouseDown, true)
      document.removeEventListener('copy', onCopy, true)
      document.removeEventListener('keydown', onKeyDown, true)
      document.removeEventListener('keyup', onKeyUp, true)
      window.removeEventListener('blur', onBlur, true)
      stopDrag()
      setAltCursorMode(false)
      clearSelected()
    }
  }, [editor, scopeSelector, requireAlt, onSelectionChange, isViewReady])

  const hasAnyOverlay = Boolean(rectStyle || markers.length)
  if (!hasAnyOverlay) return null

  return (
    <>
      {rectStyle && <div className={RECT_CLASS} style={{ ...rectStyle, borderRadius: 0 }} />}
    </>
  )
}
