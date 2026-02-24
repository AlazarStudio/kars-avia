const DOC_MODAL_SELECTOR = [
  '.modal',
  '.image-modal',
  '.link-modal',
  '.custom-style-modal',
  '.table-controls-modal',
  '.color-palette-modal',
  '.emoji-picker-modal',
  '.file-preview-modal',
].join(', ')

const MODAL_Z_INDEX_BASE = 2147483000
const MODAL_Z_INDEX_MAX = 2147483646

function parseZIndex(value) {
  const numeric = Number.parseInt(value, 10)
  return Number.isFinite(numeric) ? numeric : 0
}

function getTopModalZIndex() {
  const nodes = document.querySelectorAll(DOC_MODAL_SELECTOR)
  let max = MODAL_Z_INDEX_BASE

  nodes.forEach(node => {
    if (!(node instanceof HTMLElement)) return
    const computed = window.getComputedStyle(node)
    const inline = node.style.getPropertyValue('z-index')
    max = Math.max(max, parseZIndex(computed.zIndex), parseZIndex(inline))
  })

  return max
}

function toElement(target) {
  if (target instanceof Element) return target
  if (target instanceof Node) return target.parentElement
  return null
}

export function findDocModalRoot(target) {
  const element = toElement(target)
  if (!element) return null
  return element.closest(DOC_MODAL_SELECTOR)
}

export function bringDocModalToFront(modalElement) {
  if (!(modalElement instanceof HTMLElement)) return
  const nextZIndex = Math.min(MODAL_Z_INDEX_MAX, getTopModalZIndex() + 1)
  modalElement.style.setProperty('z-index', String(nextZIndex), 'important')
}
