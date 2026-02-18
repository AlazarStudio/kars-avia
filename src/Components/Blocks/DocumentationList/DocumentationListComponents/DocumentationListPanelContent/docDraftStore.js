import { idbGet, idbPut } from './src/storage/indexedDb'

const STORE_NAME = 'drafts'

export function buildDocDraftId(docId) {
  if (docId == null) return null
  return `doc:${docId}`
}

export function buildDocLayoutId(docId) {
  if (docId == null) return null
  return `doc-layout:${docId}`
}

export async function loadDocContent(docId) {
  const id = buildDocDraftId(docId)
  if (!id) return null

  const record = await idbGet(STORE_NAME, id)
  const content = record?.content
  return content && content.type === 'doc' ? content : null
}

export async function loadDocDraft(docId) {
  const draftId = buildDocDraftId(docId)
  if (!draftId) return null
  const layoutId = buildDocLayoutId(docId)

  const draftRecord = await idbGet(STORE_NAME, draftId)
  const layoutRecord = layoutId ? await idbGet(STORE_NAME, layoutId) : null

  const content = draftRecord?.content
  const safeContent = content && content.type === 'doc' ? content : null
  const safeLayout =
    layoutRecord?.layout && typeof layoutRecord.layout === 'object'
      ? layoutRecord.layout
      : draftRecord?.layout && typeof draftRecord.layout === 'object'
        ? draftRecord.layout
        : null

  if (!safeContent && !safeLayout) {
    return null
  }

  return {
    content: safeContent,
    layout: safeLayout,
  }
}

export async function saveDocContent(docId, content) {
  const id = buildDocDraftId(docId)
  if (!id) return

  await idbPut(STORE_NAME, {
    id,
    content,
    updatedAt: Date.now(),
  })
}

export async function saveDocLayout(docId, layout) {
  const id = buildDocLayoutId(docId)
  if (!id) return

  await idbPut(STORE_NAME, {
    id,
    layout,
    updatedAt: Date.now(),
  })
}
