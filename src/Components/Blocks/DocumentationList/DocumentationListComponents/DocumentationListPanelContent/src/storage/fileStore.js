import { idbDelete, idbGet, idbPut } from './indexedDb'

function randomId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return `${Date.now().toString(36)}_${Math.random().toString(36).slice(2)}`
}

export async function saveBlobAsFile({
  blob,
  name = '',
  mimeType = '',
  size = 0,
}) {
  if (!(blob instanceof Blob)) {
    throw new Error('saveBlobAsFile: blob must be a Blob')
  }

  const id = randomId()
  await idbPut('files', {
    id,
    blob,
    name,
    mimeType: mimeType || blob.type || '',
    size: size || blob.size || 0,
    createdAt: Date.now(),
  })
  return id
}

export async function saveFile(file) {
  if (!(file instanceof File)) {
    throw new Error('saveFile: file must be a File')
  }
  const id = await saveBlobAsFile({
    blob: file,
    name: file.name,
    mimeType: file.type,
    size: file.size,
  })
  return { id, name: file.name, mimeType: file.type, size: file.size }
}

export async function getFileRecord(id) {
  if (!id) return null
  return await idbGet('files', id)
}

export async function deleteFileRecord(id) {
  if (!id) return
  await idbDelete('files', id)
}

export async function blobFromDataUrl(dataUrl) {
  const response = await fetch(dataUrl)
  return await response.blob()
}

export async function blobFromUrl(url) {
  const response = await fetch(url)
  return await response.blob()
}

