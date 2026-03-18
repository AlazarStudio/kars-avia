/**
 * Глобальное хранилище для функций загрузки документации.
 * Заполняется DocumentationUploadProvider при монтировании.
 * Используется плагинами и компонентами без доступа к React-контексту.
 */
let uploadImageFn = null
let uploadFileFn = null
let getMediaUrlFn = null
let getMediaUrlCandidatesFn = null
let lastUploadFailure = {
  message: '',
  at: 0,
}

export function setDocumentationUpload({ uploadImage, uploadFile, getMediaUrl, getMediaUrlCandidates }) {
  uploadImageFn = uploadImage || null
  uploadFileFn = uploadFile || null
  getMediaUrlFn = getMediaUrl || null
  getMediaUrlCandidatesFn = getMediaUrlCandidates || null
}

export function clearDocumentationUpload() {
  uploadImageFn = null
  uploadFileFn = null
  getMediaUrlFn = null
  getMediaUrlCandidatesFn = null
}

export function getDocumentationUploadImage() {
  return uploadImageFn
}

export function getDocumentationUploadFile() {
  return uploadFileFn
}

export function getDocumentationGetMediaUrl() {
  return getMediaUrlFn
}

export function getDocumentationGetMediaUrlCandidates() {
  return getMediaUrlCandidatesFn
}

export function notifyDocumentationUploadFailure(error, mediaLabel = 'файл') {
  const fallbackMessage = `Не удалось загрузить ${mediaLabel} на сервер документации. Повторите попытку.`
  const rawMessage =
    typeof error?.message === 'string' && error.message.trim()
      ? error.message.trim()
      : ''
  const message =
    rawMessage && rawMessage !== fallbackMessage
      ? `${fallbackMessage}\n${rawMessage}`
      : fallbackMessage

  console.error('[DocumentationUpload]', mediaLabel, error)

  if (typeof window === 'undefined' || typeof window.alert !== 'function') {
    return
  }

  const now = Date.now()
  if (
    lastUploadFailure.message === message &&
    now - lastUploadFailure.at < 1500
  ) {
    return
  }

  lastUploadFailure = {
    message,
    at: now,
  }
  window.alert(message)
}
