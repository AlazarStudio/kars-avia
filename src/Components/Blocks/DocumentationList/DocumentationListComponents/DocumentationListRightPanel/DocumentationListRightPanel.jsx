import { useEffect, useMemo, useRef, useState } from 'react'
import './DocumentationListRightPanel.css'

const NAV_SCROLL_GAP = 8
const NAV_SCROLL_LOCK_THRESHOLD = 24

function getPanelScroller(targetElement, navRootElement = null) {
  if (targetElement instanceof HTMLElement) {
    const closestPanel = targetElement.closest('.panel-content')
    if (closestPanel instanceof HTMLElement) return closestPanel
  }
  if (!(navRootElement instanceof HTMLElement)) return null

  const rightPanelEl = navRootElement.closest('.right-panel')
  const layoutRoot = rightPanelEl?.parentElement
  if (!(layoutRoot instanceof HTMLElement)) return null

  const siblingPanel = Array.from(layoutRoot.children).find(
    child => child instanceof HTMLElement && child.classList.contains('panel-content')
  )
  return siblingPanel instanceof HTMLElement ? siblingPanel : null
}

function getStickyTopOffset(scroller) {
  if (!(scroller instanceof HTMLElement)) return 0

  const stickyTop = scroller.querySelector('.tiptap-panel-top-sticky')
  if (stickyTop instanceof HTMLElement) {
    const stickyStyle = window.getComputedStyle(stickyTop)
    if (stickyStyle.position === 'sticky' || stickyStyle.position === 'fixed') {
      return stickyTop.getBoundingClientRect().height
    }
  }

  const toolbar = scroller.querySelector('.toolbar')
  if (!(toolbar instanceof HTMLElement)) return 0

  const toolbarStyle = window.getComputedStyle(toolbar)
  if (toolbarStyle.position !== 'sticky' && toolbarStyle.position !== 'fixed') return 0

  return toolbar.getBoundingClientRect().height
}

function findSectionElement(scroller, id) {
  if (!(scroller instanceof HTMLElement) || !id) return null
  const safeId = String(id).replace(/\\/g, '\\\\').replace(/"/g, '\\"')
  try {
    const el = scroller.querySelector(`[id="${safeId}"]`)
    return el instanceof HTMLElement ? el : null
  } catch {
    return null
  }
}

function DocumentationListRightPanel({ blocks = [] }) {
  const [activeId, setActiveId] = useState(null)
  const pendingScrollTargetRef = useRef(null)
  const pendingScrollDirectionRef = useRef(null)
  const pendingScrollTopRef = useRef(null)
  const navRootRef = useRef(null)

  // 1️⃣ Берём только блоки с #
  const sections = useMemo(() => {
    return blocks
      .filter(b => b.hasAnchor)
      .map(b => ({
        id: b.domId || `block-${b.id}`,
        label: b.lines?.[0] || 'Без названия',
        level: b.level || 'p'
      }))
  }, [blocks])

  // 2️⃣ Следим за активным блоком
  useEffect(() => {
    if (!sections.length) {
      setActiveId(null)
      pendingScrollTargetRef.current = null
      pendingScrollDirectionRef.current = null
      pendingScrollTopRef.current = null
      return
    }

    let raf = 0
    const firstSectionId = sections[0].id

    const updateActiveSection = () => {
      const scroller = getPanelScroller(null, navRootRef.current)

      let probeTop = NAV_SCROLL_GAP + 1
      if (scroller instanceof HTMLElement) {
        const scrollerRect = scroller.getBoundingClientRect()
        probeTop = scrollerRect.top + getStickyTopOffset(scroller) + NAV_SCROLL_GAP + 1
      }

      const pendingTargetId = pendingScrollTargetRef.current
      if (pendingTargetId) {
        const pendingScrollTop = pendingScrollTopRef.current
        if (
          scroller instanceof HTMLElement &&
          Number.isFinite(pendingScrollTop)
        ) {
          const scrollDelta = Math.abs(scroller.scrollTop - pendingScrollTop)
          if (scrollDelta > 1) {
            setActiveId(prev => (prev === pendingTargetId ? prev : pendingTargetId))
            return
          }

          pendingScrollTargetRef.current = null
          pendingScrollDirectionRef.current = null
          pendingScrollTopRef.current = null
          setActiveId(prev => (prev === pendingTargetId ? prev : pendingTargetId))
          return
        }

        const pendingTargetEl = findSectionElement(scroller, pendingTargetId)
        if (pendingTargetEl instanceof HTMLElement) {
          const deltaToProbe = pendingTargetEl.getBoundingClientRect().top - probeTop
          const pendingDirection = pendingScrollDirectionRef.current
          const hasReachedProbeLine =
            pendingDirection === 'down'
              ? deltaToProbe <= 1
              : pendingDirection === 'up'
                ? deltaToProbe >= -1
                : Math.abs(deltaToProbe) <= NAV_SCROLL_LOCK_THRESHOLD

          if (hasReachedProbeLine) {
            pendingScrollTargetRef.current = null
            pendingScrollDirectionRef.current = null
            pendingScrollTopRef.current = null
          } else {
            setActiveId(prev => (prev === pendingTargetId ? prev : pendingTargetId))
            return
          }
        } else {
          pendingScrollTargetRef.current = null
          pendingScrollDirectionRef.current = null
          pendingScrollTopRef.current = null
        }
      }

      let nextActiveId = firstSectionId
      for (const section of sections) {
        const sectionEl = findSectionElement(scroller, section.id)
        if (!(sectionEl instanceof HTMLElement)) continue
        if (sectionEl.getBoundingClientRect().top <= probeTop) {
          nextActiveId = section.id
          continue
        }
        break
      }

      setActiveId(prev => (prev === nextActiveId ? prev : nextActiveId))
    }

    const scheduleUpdate = () => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(updateActiveSection)
    }

    const scroller = getPanelScroller(null, navRootRef.current)
    const rightPanel = navRootRef.current?.closest('.right-panel')

    scheduleUpdate()

    if (scroller instanceof HTMLElement) {
      scroller.addEventListener('scroll', scheduleUpdate)
    }
    window.addEventListener('resize', scheduleUpdate)
    window.addEventListener('scroll', scheduleUpdate, true)

    if (rightPanel instanceof HTMLElement) {
      rightPanel.addEventListener('transitionrun', scheduleUpdate)
      rightPanel.addEventListener('transitionstart', scheduleUpdate)
      rightPanel.addEventListener('transitionend', scheduleUpdate)
      rightPanel.addEventListener('transitioncancel', scheduleUpdate)
    }

    return () => {
      cancelAnimationFrame(raf)
      if (scroller instanceof HTMLElement) {
        scroller.removeEventListener('scroll', scheduleUpdate)
      }
      window.removeEventListener('resize', scheduleUpdate)
      window.removeEventListener('scroll', scheduleUpdate, true)
      if (rightPanel instanceof HTMLElement) {
        rightPanel.removeEventListener('transitionrun', scheduleUpdate)
        rightPanel.removeEventListener('transitionstart', scheduleUpdate)
        rightPanel.removeEventListener('transitionend', scheduleUpdate)
        rightPanel.removeEventListener('transitioncancel', scheduleUpdate)
      }
    }
  }, [sections])

  const scrollTo = id => {
    const scroller = getPanelScroller(null, navRootRef.current)
    const target = findSectionElement(scroller, id)
    if (!(target instanceof HTMLElement)) return
    pendingScrollTargetRef.current = id
    pendingScrollDirectionRef.current = null
    pendingScrollTopRef.current = null

    if (!(scroller instanceof HTMLElement)) {
      return
    }

    const scrollerRect = scroller.getBoundingClientRect()
    const targetRect = target.getBoundingClientRect()
    const stickyOffset = getStickyTopOffset(scroller)
    const probeTop = scrollerRect.top + stickyOffset + NAV_SCROLL_GAP + 1
    const targetTop =
      scroller.scrollTop +
      (targetRect.top - scrollerRect.top) -
      stickyOffset -
      NAV_SCROLL_GAP
    const nextScrollTop = Math.max(0, targetTop)

    if (targetRect.top > probeTop + 1) {
      pendingScrollDirectionRef.current = 'down'
    } else if (targetRect.top < probeTop - 1) {
      pendingScrollDirectionRef.current = 'up'
    }
    pendingScrollTopRef.current = nextScrollTop

    if (Math.abs(scroller.scrollTop - nextScrollTop) <= 1) {
      pendingScrollTargetRef.current = null
      pendingScrollDirectionRef.current = null
      pendingScrollTopRef.current = null
      setActiveId(id)
      return
    }

    scroller.scrollTo({
      top: nextScrollTop,
      behavior: 'smooth',
    })
    setActiveId(id)
  }

  if (!sections.length) return null

  return (
    <div className="doc-right" ref={navRootRef}>
      <div className="doc-right-title">Навигация</div>

      <ul className="doc-right-list">
        {sections.map((section, index) => (
          <li
            key={`${section.id}-${index}`}
            className={`doc-right-item ${activeId === section.id ? 'active' : ''}`}
            onClick={() => scrollTo(section.id)}
            onKeyDown={event => {
              if (event.key !== 'Enter' && event.key !== ' ') return
              event.preventDefault()
              scrollTo(section.id)
            }}
            role="button"
            tabIndex={0}
            aria-current={activeId === section.id ? 'location' : undefined}
          >
            {section.label}
          </li>
        ))}
      </ul>
    </div>
  )
}

export default DocumentationListRightPanel
