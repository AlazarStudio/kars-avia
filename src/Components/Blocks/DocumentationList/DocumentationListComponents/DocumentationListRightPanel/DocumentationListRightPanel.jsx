import { useEffect, useMemo, useRef, useState } from 'react'
import './DocumentationListRightPanel.css'

const NAV_SCROLL_GAP = 8
const NAV_SCROLL_LOCK_THRESHOLD = 24

function getPanelScroller(targetElement) {
  if (!(targetElement instanceof HTMLElement)) return null
  const closestPanel = targetElement.closest('.panel-content')
  if (closestPanel instanceof HTMLElement) return closestPanel

  const fallbackPanel = document.querySelector('.panel-content')
  return fallbackPanel instanceof HTMLElement ? fallbackPanel : null
}

function getStickyToolbarOffset(scroller) {
  if (!(scroller instanceof HTMLElement)) return 0
  const toolbar = scroller.querySelector('.toolbar')
  if (!(toolbar instanceof HTMLElement)) return 0

  const toolbarStyle = window.getComputedStyle(toolbar)
  if (toolbarStyle.position !== 'sticky' && toolbarStyle.position !== 'fixed') return 0

  return toolbar.getBoundingClientRect().height
}

function DocumentationListRightPanel({ blocks = [] }) {
  const [activeId, setActiveId] = useState(null)
  const pendingScrollTargetRef = useRef(null)

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
      return
    }

    let raf = 0
    const firstSectionId = sections[0].id

    const updateActiveSection = () => {
      const firstSectionEl = document.getElementById(firstSectionId)
      const scroller = getPanelScroller(firstSectionEl)

      let probeTop = NAV_SCROLL_GAP + 1
      if (scroller instanceof HTMLElement) {
        const scrollerRect = scroller.getBoundingClientRect()
        probeTop = scrollerRect.top + getStickyToolbarOffset(scroller) + NAV_SCROLL_GAP + 1
      }

      const pendingTargetId = pendingScrollTargetRef.current
      if (pendingTargetId) {
        const pendingTargetEl = document.getElementById(pendingTargetId)
        if (pendingTargetEl instanceof HTMLElement) {
          const deltaToProbe = Math.abs(pendingTargetEl.getBoundingClientRect().top - probeTop)
          if (deltaToProbe <= NAV_SCROLL_LOCK_THRESHOLD) {
            pendingScrollTargetRef.current = null
          } else {
            setActiveId(prev => (prev === pendingTargetId ? prev : pendingTargetId))
            return
          }
        } else {
          pendingScrollTargetRef.current = null
        }
      }

      let nextActiveId = firstSectionId
      for (const section of sections) {
        const sectionEl = document.getElementById(section.id)
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

    const firstSectionEl = document.getElementById(firstSectionId)
    const scroller = getPanelScroller(firstSectionEl)
    const rightPanel = document.querySelector('.right-panel')

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
    const target = document.getElementById(id)
    if (!(target instanceof HTMLElement)) return
    pendingScrollTargetRef.current = id

    const scroller = getPanelScroller(target)
    if (!(scroller instanceof HTMLElement)) {
      target.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      })
      setActiveId(id)
      return
    }

    const scrollerRect = scroller.getBoundingClientRect()
    const targetRect = target.getBoundingClientRect()
    const stickyOffset = getStickyToolbarOffset(scroller)
    const targetTop =
      scroller.scrollTop +
      (targetRect.top - scrollerRect.top) -
      stickyOffset -
      NAV_SCROLL_GAP

    scroller.scrollTo({
      top: Math.max(0, targetTop),
      behavior: 'smooth',
    })
    setActiveId(id)
  }

  if (!sections.length) return null

  return (
    <div className="doc-right">
      <div className="doc-right-title">Навигация</div>

      <ul className="doc-right-list">
        {sections.map((section, index) => (
          <li
            key={`${section.id}-${index}`}
            className={`doc-right-item ${activeId === section.id ? 'active' : ''}`}
            onClick={() => scrollTo(section.id)}
            style={{
              paddingLeft: section.level !== 'h1' ? 24 : 12
            }}
          >
            {section.label}
          </li>
        ))}
      </ul>
    </div>
  )
}

export default DocumentationListRightPanel
