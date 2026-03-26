const DEFAULT_MODAL_VIEWPORT_MARGIN = 20

const toFiniteNumber = value => (Number.isFinite(value) ? value : 0)
const clampNumber = (value, min, max) => Math.min(max, Math.max(min, value))

export const MODAL_VIEWPORT_MARGIN = DEFAULT_MODAL_VIEWPORT_MARGIN

export function clampFixedModalPosition(position, size, margin = DEFAULT_MODAL_VIEWPORT_MARGIN) {
  if (typeof window === 'undefined') {
    return {
      x: toFiniteNumber(position?.x),
      y: toFiniteNumber(position?.y),
    }
  }

  const safeMargin = Math.max(0, toFiniteNumber(margin))
  const viewportWidth = Math.max(0, toFiniteNumber(window.innerWidth))
  const viewportHeight = Math.max(0, toFiniteNumber(window.innerHeight))

  const modalWidth = Math.max(0, toFiniteNumber(size?.width))
  const modalHeight = Math.max(0, toFiniteNumber(size?.height))

  const minX = safeMargin
  const minY = safeMargin
  const maxX = Math.max(minX, viewportWidth - modalWidth - safeMargin)
  const maxY = Math.max(minY, viewportHeight - modalHeight - safeMargin)

  return {
    x: clampNumber(toFiniteNumber(position?.x), minX, maxX),
    y: clampNumber(toFiniteNumber(position?.y), minY, maxY),
  }
}
