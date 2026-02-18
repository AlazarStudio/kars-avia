// src/PlusButtonOverlay.jsx
import { useEffect, useRef, useState } from 'react'
import { SlashSourceKey } from './extensions/slashSourceKey'

const OVERLAY_SYNC_EVENT = 'doclist-overlay-sync'

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

export default function PlusButtonOverlay({
  editor,
  scopeSelector = '.editor-hover-scope',
}) {
  const [pos, setPos] = useState(null)
  const [isInScope, setIsInScope] = useState(false)
  const [isViewReady, setIsViewReady] = useState(false)

  // текущий “ховернутый” блок и позиция, куда ставим курсор при клике на "+"
  const hoverRef = useRef({ el: null, targetPos: null })
  const inScopeRef = useRef(false)

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

        if (clientY >= rect.top && clientY <= rect.bottom) return el
      }

      return null
    }

    const setPosFromRect = rect => {
      const editorRect = editorDom.getBoundingClientRect()
      const btn = 24
      const centerOffset = Math.max(0, (rect.height - btn) / 2)
      const top = rect.top - editorRect.top + editorDom.scrollTop + centerOffset
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
      emitOverlaySync({
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
        if (editorDom.contains(t)) return
        if (t.closest('.plus-overlay')) return
        if (t.closest('.block-dnd-handle')) return
        if (t.closest('.slash-menu-wrapper')) return
      }

      const blockEl = getTopLevelBlockElFromClientY(e?.clientY)
      if (!blockEl) return
      if (hoverRef.current.el === blockEl) return

      const info = computeTargetPos(blockEl)
      hoverRef.current = {
        el: blockEl,
        targetPos: info?.pos ?? null,
      }

      schedule(() => updateFromElement(blockEl))
    }

    const onMouseEnter = () => {
      inScopeRef.current = true
      setIsInScope(true)
      schedule(() => {
        if (hoverRef.current.el) updateFromElement(hoverRef.current.el)
        else updateFromSelection()
      })
    }

    const onMouseLeave = () => {
      inScopeRef.current = false
      setIsInScope(false)
      hoverRef.current = { el: null, targetPos: null }
      emitOverlaySync({
        isInScope: false,
        hoverY: null,
        hoverPos: null,
      })
      // позицию можно оставить, CSS всё равно скрывает кнопку
      // но на всякий — синхронизируем по selection
      schedule(updateFromSelection)
    }

    const onScroll = () => {
      if (hoverRef.current.el) {
        schedule(() => updateFromElement(hoverRef.current.el))
      } else {
        schedule(updateFromSelection)
      }
    }

    const onSelectionLike = () => {
      // если сейчас наведение — позицию держим от hover
      if (hoverRef.current.el) return
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

    // enter/leave вешаем на scope, чтобы кнопка "+" считалась "внутри"
    scopeEl.addEventListener('mouseenter', onMouseEnter)
    scopeEl.addEventListener('mouseleave', onMouseLeave)

    editorDom.addEventListener('scroll', onScroll)

    // стартовое позиционирование
    updateFromSelection()

    return () => {
      cancelAnimationFrame(raf)

      editor.off('selectionUpdate', onSelectionLike)
      editor.off('transaction', onSelectionLike)
      editor.off('focus', onSelectionLike)
      editor.off('blur', onBlur)

      editorDom.removeEventListener('mousemove', onMouseMove)
      scopeEl.removeEventListener('mousemove', onScopeMouseMove)
      scopeEl.removeEventListener('mouseenter', onMouseEnter)
      scopeEl.removeEventListener('mouseleave', onMouseLeave)
      editorDom.removeEventListener('scroll', onScroll)
    }
  }, [editor, scopeSelector, isViewReady])

  if (!pos) return null

  const openSlashMenu = () => {
    const { state, view } = editor

    // помечаем, что slash пришёл от "+"
    view.dispatch(state.tr.setMeta(SlashSourceKey, { fromPlus: true }))

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
    const targetPos = hoverRef.current?.targetPos
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
  const x = 0
  const y = pos?.top ?? 0 

  return (
    <div className={`position-plus-button ${isInScope ? 'plus-visible' : ''}`}>
    <button
      className="plus-overlay"
      type="button"
      style={{ transform: `translate3d(${x}px, ${y}px, 0)` }}
      onMouseDown={e => {
        e.preventDefault()
        e.stopPropagation()
      }}
      onClick={e => {
        e.preventDefault()
        e.stopPropagation()
        openSlashMenu()
      }}
    >
      +
    </button>
  </div>
  )
}
