export const ANCHOR_DOM_ID_PREFIX = 'doc-anchor-'

export function buildAnchorDomId(anchorId) {
  if (!anchorId) return null
  return `${ANCHOR_DOM_ID_PREFIX}${anchorId}`
}

export function createAnchorId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }

  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
}

