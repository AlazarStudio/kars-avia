/**
 * Глобальное хранилище для функций загрузки документации.
 * Заполняется DocumentationUploadProvider при монтировании.
 * Используется плагинами и компонентами без доступа к React-контексту.
 */
let uploadImageFn = null
let uploadFileFn = null
let getMediaUrlFn = null

export function setDocumentationUpload({ uploadImage, uploadFile, getMediaUrl }) {
  uploadImageFn = uploadImage || null
  uploadFileFn = uploadFile || null
  getMediaUrlFn = getMediaUrl || null
}

export function clearDocumentationUpload() {
  uploadImageFn = null
  uploadFileFn = null
  getMediaUrlFn = null
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
