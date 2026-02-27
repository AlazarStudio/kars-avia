// src/extensions/toggleView.jsx
import { NodeViewWrapper, NodeViewContent } from '@tiptap/react'
import { useEffect, useRef, useState } from 'react'
import './toggle.css'
import './blockResize.css'

export default function ToggleView({ editor, node, updateAttributes, getPos }) {
  const isEditable = Boolean(editor?.isEditable)
  const [collapsed, setCollapsed] = useState(false)
  const width = typeof node.attrs.width === 'number' ? node.attrs.width : 520
  const height = typeof node.attrs.height === 'number' ? node.attrs.height : null
  const textAlign = node.attrs.textAlign || 'left'

  const alignMargins =
    textAlign === 'center'
      ? { marginLeft: 'auto', marginRight: 'auto' }
      : textAlign === 'right'
        ? { marginLeft: 'auto', marginRight: 0 }
        : { marginLeft: 0, marginRight: 'auto' }

  const [editing, setEditing] = useState(false)
  const [tempTitle, setTempTitle] = useState(node.attrs.title || '')

  const inputRef = useRef(null)

  useEffect(() => {
    setTempTitle(node.attrs.title || '')
  }, [node.attrs.title])

  useEffect(() => {
    if (!editing) return
    const t = setTimeout(() => {
      inputRef.current?.focus()
      inputRef.current?.select()
    }, 0)
    return () => clearTimeout(t)
  }, [editing])

  useEffect(() => {
    if (!isEditable && editing) {
      setEditing(false)
    }
  }, [editing, isEditable])

  const safeSetNodeSelectionHere = () => {
    const pos = typeof getPos === 'function' ? getPos() : null
    if (typeof pos === 'number' && editor?.commands?.setNodeSelection) {
      editor.commands.setNodeSelection(pos)
    }
  }

  const toggleCollapsed = e => {
    e?.preventDefault?.()
    e?.stopPropagation?.()

    const next = !collapsed
    setCollapsed(next)

    // если закрываем — не оставляем курсор внутри
    if (next) safeSetNodeSelectionHere()
  }

  const startEditTitle = e => {
    if (!isEditable) return
    e.preventDefault()
    e.stopPropagation()
    setEditing(true)
  }

  const onHeaderMouseDown = e => {
    const target = e.target
    if (target instanceof Element && target.closest('.toggle-title-input')) {
      // Let the input receive focus, but keep the editor selection stable.
      e.stopPropagation()
      return
    }

    e.preventDefault()
    e.stopPropagation()
  }

  const saveTitle = () => {
    if (!isEditable) {
      setEditing(false)
      return
    }
    const next = (tempTitle || '').trim()
    if (next) updateAttributes({ title: next })
    else updateAttributes({ title: 'Раскрываемый список' })
    setEditing(false)
  }

  const onTitleKeyDown = e => {
    // Title editing is an inline control inside the node-view. Do not leak keys to ProseMirror.
    e.stopPropagation()

    if (e.key === 'Enter') {
      e.preventDefault()
      saveTitle()
    }
    if (e.key === 'Escape') {
      e.preventDefault()
      setTempTitle(node.attrs.title || '')
      setEditing(false)
    }
  }

  const onHeaderClick = e => {
    // клик по названию — редактирование, а не раскрытие
    if (editing) return
    const target = e.target
    if (target instanceof Element) {
      if (target.closest('.toggle-title-input')) return
      if (isEditable && target.closest('.toggle-title')) return
      if (target.closest('.toggle-chevron')) return // у кнопки свой handler
    }
    toggleCollapsed(e)
  }

  const onHeaderKeyDown = e => {
    // Header is a UI control, not editor content.
    e.stopPropagation()

    if (editing) return
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      toggleCollapsed(e)
    }
  }

  /* ================= RESIZE ================= */

  const clamp = (value, min, max) => Math.min(max, Math.max(min, value))

  const startResize = (e, side) => {
    if (!isEditable) return
    e.preventDefault()
    e.stopPropagation()

    const startX = e.clientX
    const startY = e.clientY

    const wrapperEl = e.currentTarget?.closest?.('[data-node-view-wrapper]')
    const proseMirrorEl = wrapperEl?.closest?.('.ProseMirror') || wrapperEl?.parentElement
    const maxWidth = Math.max(280, Math.floor(proseMirrorEl?.clientWidth || 700))

    const startRect = wrapperEl?.getBoundingClientRect?.()
    const startWidth = width
    const startHeight = typeof height === 'number' ? height : Math.round(startRect?.height || 80)

    const move = ev => {
      let deltaX = 0
      let deltaY = 0

      if (side === 'right') deltaX = ev.clientX - startX
      if (side === 'left') deltaX = startX - ev.clientX
      if (side === 'bottom') deltaY = ev.clientY - startY
      if (side === 'top') deltaY = startY - ev.clientY

      const nextWidth = clamp(startWidth + deltaX, 280, maxWidth)
      const nextHeight = clamp(startHeight + deltaY, 60, 900)

      const nextAttrs = {}
      if (side === 'left' || side === 'right') nextAttrs.width = Math.round(nextWidth)
      if (side === 'top' || side === 'bottom') nextAttrs.height = Math.round(nextHeight)
      updateAttributes(nextAttrs)
    }

    const up = () => {
      document.removeEventListener('mousemove', move)
      document.removeEventListener('mouseup', up)
    }

    document.addEventListener('mousemove', move)
    document.addEventListener('mouseup', up)
  }

  return (
    <NodeViewWrapper
      as="div"
      className={`toggle-block block-resizable ${collapsed ? 'is-collapsed' : ''}`}
      data-type="toggle"
      data-collapsed={collapsed ? 'true' : 'false'}
      style={{
        width,
        ...alignMargins,
        minHeight: typeof height === 'number' ? height : undefined,
      }}
    >
      {/* RESIZE HANDLES */}
      {isEditable && (
        <>
          <div className="block-resize left" contentEditable={false} onMouseDown={e => startResize(e, 'left')} />
          <div className="block-resize right" contentEditable={false} onMouseDown={e => startResize(e, 'right')} />
          <div className="block-resize top" contentEditable={false} onMouseDown={e => startResize(e, 'top')} />
          <div className="block-resize bottom" contentEditable={false} onMouseDown={e => startResize(e, 'bottom')} />
        </>
      )}

      <div
        className="toggle-header"
        contentEditable={false}
        role="button"
        tabIndex={0}
        aria-expanded={!collapsed}
        onMouseDown={onHeaderMouseDown}
        onClick={onHeaderClick}
        onKeyDown={onHeaderKeyDown}
      >
        <button
          type="button"
          className="toggle-chevron"
          onMouseDown={e => e.preventDefault()} // не даём ProseMirror увести selection
          onKeyDown={e => e.stopPropagation()}
          onClick={toggleCollapsed}
          aria-label={collapsed ? 'Раскрыть' : 'Свернуть'}
        />

        {editing ? (
          <input
            ref={inputRef}
            className="toggle-title-input"
            value={tempTitle}
            onChange={e => setTempTitle(e.target.value)}
            onMouseDown={e => e.stopPropagation()}
            onKeyDown={onTitleKeyDown}
            onBlur={saveTitle}
          />
        ) : (
          <div
            className={`toggle-title ${isEditable ? 'is-editable' : ''}`}
            title="Кликните, чтобы переименовать"
            onClick={isEditable ? startEditTitle : undefined}
          >
            {node.attrs.title || 'Раскрываемый список'}
          </div>
        )}
      </div>

      <div className="toggle-body">
        <div className="toggle-body-inner">
          <div className="toggle-content">
            <NodeViewContent />
          </div>
        </div>
      </div>
    </NodeViewWrapper>
  )
}
