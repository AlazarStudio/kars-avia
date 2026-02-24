import { createContext, useContext, useCallback, useMemo, useEffect } from 'react'
import { useMutation } from '@apollo/client'
import {
  UPLOAD_DOCUMENTATION_IMAGE,
  UPLOAD_DOCUMENTATION_FILE,
  server,
  getCookie,
} from '../../../../../../../graphQL_requests'
import { setDocumentationUpload, clearDocumentationUpload } from './DocumentationUploadStore'

const DocumentationUploadContext = createContext(null)
const ABSOLUTE_URL_RE = /^https?:\/\//i

function ensureLeadingSlash(pathname) {
  if (!pathname) return '/'
  return pathname.startsWith('/') ? pathname : `/${pathname}`
}

function normalizeUploadsPath(pathname) {
  const safePath = ensureLeadingSlash(pathname)
  if (/^\/files\/uploads\//i.test(safePath)) return safePath
  if (/^\/uploads\//i.test(safePath)) return `/files${safePath}`
  return safePath
}

export function DocumentationUploadProvider({ children }) {
  const token = getCookie('token')
  const context = useMemo(
    () => ({
      headers: {
        Authorization: `Bearer ${token}`,
        'Apollo-Require-Preflight': 'true',
      },
    }),
    [token]
  )

  const [uploadImageMutation] = useMutation(UPLOAD_DOCUMENTATION_IMAGE, {
    context,
  })
  const [uploadFileMutation] = useMutation(UPLOAD_DOCUMENTATION_FILE, {
    context,
  })

  const uploadImage = useCallback(
    async (file) => {
      if (!token) return null
      try {
        const { data } = await uploadImageMutation({ variables: { file } })
        return data?.uploadDocumentationImage ?? null
      } catch (err) {
        console.error('[DocumentationUpload] uploadImage failed:', err)
        return null
      }
    },
    [uploadImageMutation, token]
  )

  const uploadFile = useCallback(
    async (file) => {
      if (!token) return null
      try {
        const { data } = await uploadFileMutation({ variables: { file } })
        return data?.uploadDocumentationFile ?? null
      } catch (err) {
        console.error('[DocumentationUpload] uploadFile failed:', err)
        return null
      }
    },
    [uploadFileMutation, token]
  )

  const getMediaUrl = useCallback((path) => {
    if (!path || typeof path !== 'string') return path
    if (path.startsWith('data:') || path.startsWith('blob:')) {
      return path
    }

    const currentToken = getCookie('token')

    if (ABSOLUTE_URL_RE.test(path)) {
      try {
        const parsed = new URL(path)
        parsed.pathname = normalizeUploadsPath(parsed.pathname)
        if (currentToken) parsed.searchParams.set('token', currentToken)
        return parsed.toString()
      } catch {
        return path
      }
    }

    const base = (server || '').replace(/\/+$/, '')
    const normalizedPath = normalizeUploadsPath(path)
    const url = `${base}${normalizedPath}`
    return currentToken ? `${url}?token=${currentToken}` : url
  }, [])

  const value = useMemo(
    () => ({ uploadImage, uploadFile, getMediaUrl }),
    [uploadImage, uploadFile, getMediaUrl]
  )

  useEffect(() => {
    setDocumentationUpload({ uploadImage, uploadFile, getMediaUrl })
    return () => clearDocumentationUpload()
  }, [uploadImage, uploadFile, getMediaUrl])

  return (
    <DocumentationUploadContext.Provider value={value}>
      {children}
    </DocumentationUploadContext.Provider>
  )
}

export function useDocumentationUpload() {
  return useContext(DocumentationUploadContext)
}
