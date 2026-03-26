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

function isSameOriginAsServer(urlValue) {
  try {
    const mediaUrl = new URL(urlValue)
    const serverUrl = new URL(server)
    return mediaUrl.origin === serverUrl.origin
  } catch {
    return false
  }
}

function ensureUploadedPath(value, mediaKind) {
  const nextPath = typeof value === 'string' ? value.trim() : ''
  if (!nextPath) {
    throw new Error(`Server did not return a saved ${mediaKind} path`)
  }
  return nextPath
}

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

function appendToken(urlValue, token) {
  if (!token) return urlValue

  try {
    const parsed = new URL(urlValue)
    parsed.searchParams.set('token', token)
    return parsed.toString()
  } catch {
    return urlValue
  }
}

function uniqueUrls(values) {
  return Array.from(
    new Set(
      values
        .map(value => (typeof value === 'string' ? value.trim() : ''))
        .filter(Boolean)
    )
  )
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
      if (!token) {
        throw new Error('Missing documentation upload token')
      }
      try {
        const { data } = await uploadImageMutation({ variables: { file } })
        return ensureUploadedPath(data?.uploadDocumentationImage, 'image')
      } catch (err) {
        console.error('[DocumentationUpload] uploadImage failed:', err)
        throw err
      }
    },
    [uploadImageMutation, token]
  )

  const uploadFile = useCallback(
    async (file) => {
      if (!token) {
        throw new Error('Missing documentation upload token')
      }
      try {
        const { data } = await uploadFileMutation({ variables: { file } })
        return ensureUploadedPath(data?.uploadDocumentationFile, 'file')
      } catch (err) {
        console.error('[DocumentationUpload] uploadFile failed:', err)
        throw err
      }
    },
    [uploadFileMutation, token]
  )

  const getMediaUrlCandidates = useCallback((path) => {
    if (!path || typeof path !== 'string') return path
    if (path.startsWith('data:') || path.startsWith('blob:')) {
      return [path]
    }

    const currentToken = getCookie('token')

    if (ABSOLUTE_URL_RE.test(path)) {
      try {
        if (!isSameOriginAsServer(path)) {
          return [path]
        }
        const parsed = new URL(path)
        parsed.pathname = normalizeUploadsPath(parsed.pathname)
        parsed.searchParams.delete('token')
        const plainUrl = parsed.toString()
        return uniqueUrls([
          appendToken(plainUrl, currentToken),
          plainUrl,
          path,
        ])
      } catch {
        return [path]
      }
    }

    const base = (server || '').replace(/\/+$/, '')
    const normalizedPath = normalizeUploadsPath(path)
    const nextUrl = `${base}${normalizedPath}`
    return uniqueUrls([
      appendToken(nextUrl, currentToken),
      nextUrl,
      normalizedPath,
    ])
  }, [])

  const getMediaUrl = useCallback((path) => {
    const candidates = getMediaUrlCandidates(path)
    if (Array.isArray(candidates)) {
      return candidates[0] || path
    }
    return candidates || path
  }, [getMediaUrlCandidates])

  const value = useMemo(
    () => ({ uploadImage, uploadFile, getMediaUrl, getMediaUrlCandidates }),
    [uploadImage, uploadFile, getMediaUrl, getMediaUrlCandidates]
  )

  useEffect(() => {
    setDocumentationUpload({ uploadImage, uploadFile, getMediaUrl, getMediaUrlCandidates })
    return () => clearDocumentationUpload()
  }, [uploadImage, uploadFile, getMediaUrl, getMediaUrlCandidates])

  return (
    <DocumentationUploadContext.Provider value={value}>
      {children}
    </DocumentationUploadContext.Provider>
  )
}

export function useDocumentationUpload() {
  return useContext(DocumentationUploadContext)
}
