import { NodeViewWrapper } from '@tiptap/react'
import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import PlayArrowRoundedIcon from '@mui/icons-material/PlayArrowRounded'
import PauseRoundedIcon from '@mui/icons-material/PauseRounded'
import RepeatRoundedIcon from '@mui/icons-material/RepeatRounded'
import VolumeUpRoundedIcon from '@mui/icons-material/VolumeUpRounded'
import MoreVertRoundedIcon from '@mui/icons-material/MoreVertRounded'
import './audioBlock.css'
import './imageBlockModal.css'
import './fileEmpty.css'
import './blockResize.css'
import { blobFromDataUrl, blobFromUrl, getFileRecord, saveBlobAsFile, saveFile } from '../storage/fileStore'
import { useDocumentationUpload } from '../DocumentationUploadContext'

const SINGLE_MODAL_EVENT = 'doclist-single-modal-open'
const AUDIO_MIN_WIDTH = 200

const IconPlay = ({ className }) => (
  <>
    {/* Legacy SVG icon:
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M8 6.5v11a1 1 0 0 0 1.53.85l8.5-5.5a1 1 0 0 0 0-1.7l-8.5-5.5A1 1 0 0 0 8 6.5z" />
    </svg>
    */}
    <PlayArrowRoundedIcon className={className} aria-hidden="true" fontSize="inherit" />
  </>
)

const IconPause = ({ className }) => (
  <>
    {/* Legacy SVG icon:
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <rect x="7" y="6" width="4" height="12" rx="1" />
      <rect x="13" y="6" width="4" height="12" rx="1" />
    </svg>
    */}
    <PauseRoundedIcon className={className} aria-hidden="true" fontSize="inherit" />
  </>
)

const IconLoop = ({ className }) => (
  <>
    {/* Legacy SVG icon:
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M17 1l3 3-3 3" />
      <path d="M3 11V9a5 5 0 0 1 5-5h12" />
      <path d="M7 23l-3-3 3-3" />
      <path d="M21 13v2a5 5 0 0 1-5 5H4" />
    </svg>
    */}
    <RepeatRoundedIcon className={className} aria-hidden="true" fontSize="inherit" />
  </>
)

const IconVolume = ({ className }) => (
  <>
    {/* Legacy SVG icon:
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M3 10v4h4l5 4V6l-5 4H3z" />
      <path d="M16 9a4 4 0 0 1 0 6" />
      <path d="M19 6a8 8 0 0 1 0 12" />
    </svg>
    */}
    <VolumeUpRoundedIcon className={className} aria-hidden="true" fontSize="inherit" />
  </>
)

const IconMore = ({ className }) => (
  <>
    {/* Legacy SVG icon:
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <circle cx="12" cy="5" r="1.8" />
      <circle cx="12" cy="12" r="1.8" />
      <circle cx="12" cy="19" r="1.8" />
    </svg>
    */}
    <MoreVertRoundedIcon className={className} aria-hidden="true" fontSize="inherit" />
  </>
)

export default function AudioBlockView({ editor, node, updateAttributes }) {
  const { fileId, src, volume, loop } = node.attrs

  const docUpload = useDocumentationUpload()
  const { uploadFile: docUploadFile, getMediaUrl } = docUpload || {}
  const canEdit = editor?.isEditable !== false
  const width = typeof node.attrs.width === 'number' ? node.attrs.width : 520
  const textAlign = node.attrs.textAlign || 'left'

  const alignMargins =
    textAlign === 'center'
      ? { marginLeft: 'auto', marginRight: 'auto' }
      : textAlign === 'right'
        ? { marginLeft: 'auto', marginRight: 0 }
        : { marginLeft: 0, marginRight: 'auto' }

  const audioRef = useRef(null)
  const idRef = useRef(Math.random().toString(36).slice(2))
  const modalRef = useRef(null)
  const modalSourceRef = useRef(`audio-block-${Math.random().toString(36).slice(2)}`)
  const [modalPos, setModalPos] = useState({ x: 0, y: 0 })
  const dragOffset = useRef({ x: 0, y: 0 })
  const modalPortalTarget = typeof document !== 'undefined' ? document.body : null
  const renderModalPortal = (node) => {
    if (!node) return null
    return modalPortalTarget ? createPortal(node, modalPortalTarget) : node
  }

  const [open, setOpen] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [current, setCurrent] = useState(0)
  const [duration, setDuration] = useState(0)
  const [showVolume, setShowVolume] = useState(false)
  const [url, setUrl] = useState('')
  const [tab, setTab] = useState('upload')
  const [objectUrl, setObjectUrl] = useState(null)
  const audioUrl = objectUrl || src
  const displayUrl = objectUrl || (src && getMediaUrl ? getMediaUrl(src) : src)
  const hasAudio = Boolean(audioUrl)
  const migrationRef = useRef({ running: false, doneFor: null })

  const announceModalOpen = () => {
    try {
      window.dispatchEvent(
        new CustomEvent(SINGLE_MODAL_EVENT, {
          detail: { source: modalSourceRef.current },
        })
      )
    } catch {
      // ignore
    }
  }

  /* ================= ONE AUDIO AT A TIME ================= */

  useEffect(() => {
    const stopOthers = e => {
      if (e.detail !== idRef.current && audioRef.current) {
        audioRef.current.pause()
        setIsPlaying(false)
      }
    }
    window.addEventListener('audio-play', stopOthers)
    return () => window.removeEventListener('audio-play', stopOthers)
  }, [])

  /* ================= SYNC ================= */

  useEffect(() => {
    if (!audioRef.current) return
    audioRef.current.volume = volume
    audioRef.current.loop = loop
  }, [volume, loop])

  /* ================= RESOLVE LOCAL FILE ================= */

  useEffect(() => {
    let cancelled = false
    let urlToRevoke = null

    ;(async () => {
      if (!fileId) {
        setObjectUrl(null)
        return
      }

      try {
        const record = await getFileRecord(fileId)
        if (!record?.blob) {
          if (!cancelled) setObjectUrl(null)
          return
        }
        const nextUrl = URL.createObjectURL(record.blob)
        urlToRevoke = nextUrl
        if (!cancelled) setObjectUrl(nextUrl)
      } catch {
        if (!cancelled) setObjectUrl(null)
      }
    })()

    return () => {
      cancelled = true
      if (urlToRevoke) URL.revokeObjectURL(urlToRevoke)
    }
  }, [fileId])

  /* ================= MIGRATE data:/blob: ================= */

  useEffect(() => {
    if (fileId) return
    if (!src || typeof src !== 'string') return
    if (!src.startsWith('data:') && !src.startsWith('blob:')) return

    if (migrationRef.current.running) return
    if (migrationRef.current.doneFor === src) return

    migrationRef.current.running = true
    migrationRef.current.doneFor = src

    ;(async () => {
      try {
        const blob = src.startsWith('data:')
          ? await blobFromDataUrl(src)
          : await blobFromUrl(src)
        if (docUploadFile) {
          const file = new File([blob], 'audio', { type: blob.type })
          const path = await docUploadFile(file)
          if (path) {
            updateAttributes({ src: path, fileId: null })
            migrationRef.current.running = false
            return
          }
        }
        const id = await saveBlobAsFile({ blob, mimeType: blob.type })
        updateAttributes({ fileId: id, src: null })
      } catch {
        // ignore
      } finally {
        migrationRef.current.running = false
      }
    })()
  }, [fileId, src, updateAttributes, docUploadFile])

  /* ================= OPEN MODAL AT CURSOR ================= */

  const openAtEvent = e => {
    if (!canEdit) return
    e.stopPropagation()
    // Позиция рядом с курсором мыши
    setModalPos({
      x: e.clientX + 10,
      y: e.clientY - 10,
    })
    announceModalOpen()
    setOpen(true)
  }

  useEffect(() => {
    const onExternalModalOpen = event => {
      if (event?.detail?.source === modalSourceRef.current) return
      setOpen(false)
    }

    window.addEventListener(SINGLE_MODAL_EVENT, onExternalModalOpen)
    return () => {
      window.removeEventListener(SINGLE_MODAL_EVENT, onExternalModalOpen)
    }
  }, [])

  /* ================= CLOSE ON OUTSIDE CLICK ================= */

  useEffect(() => {
    if (!open) return
    const close = e => {
      if (modalRef.current && !modalRef.current.contains(e.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [open])

  /* ================= DRAG MODAL ================= */

  const startDragModal = e => {
    e.preventDefault()
    e.stopPropagation()
    dragOffset.current = {
      x: e.clientX - modalPos.x,
      y: e.clientY - modalPos.y,
    }
    document.addEventListener('mousemove', onDragModal)
    document.addEventListener('mouseup', stopDragModal)
  }

  const onDragModal = e => {
    setModalPos({
      x: e.clientX - dragOffset.current.x,
      y: e.clientY - dragOffset.current.y,
    })
  }

  const stopDragModal = () => {
    document.removeEventListener('mousemove', onDragModal)
    document.removeEventListener('mouseup', stopDragModal)
  }

  /* ================= CONTROLS ================= */

  const togglePlay = () => {
    if (!audioRef.current) return

    if (audioRef.current.paused) {
      window.dispatchEvent(
        new CustomEvent('audio-play', { detail: idRef.current })
      )
      audioRef.current.play()
      setIsPlaying(true)
    } else {
      audioRef.current.pause()
      setIsPlaying(false)
    }
  }

  const onTime = () => {
    setCurrent(audioRef.current.currentTime)
  }

  const onLoaded = () => {
    setDuration(audioRef.current.duration || 0)
  }

  const seek = e => {
    const rect = e.currentTarget.getBoundingClientRect()
    const percent = (e.clientX - rect.left) / rect.width
    audioRef.current.currentTime = percent * duration
  }

  const format = s =>
    `${Math.floor(s / 60)
      .toString()
      .padStart(2, '0')}:${Math.floor(s % 60)
      .toString()
      .padStart(2, '0')}`

  /* ================= RESIZE ================= */

  const clamp = (value, min, max) => Math.min(max, Math.max(min, value))

  const startResize = (e, side) => {
    if (!canEdit) return
    e.preventDefault()
    e.stopPropagation()

    const startX = e.clientX

    const wrapperEl = e.currentTarget?.closest?.('[data-node-view-wrapper]')
    const proseMirrorEl = wrapperEl?.closest?.('.ProseMirror') || wrapperEl?.parentElement
    const maxWidth = Math.max(AUDIO_MIN_WIDTH, Math.floor(proseMirrorEl?.clientWidth || 700))

    const startWidth = width

    const move = ev => {
      let deltaX = 0

      if (side === 'right') deltaX = ev.clientX - startX
      if (side === 'left') deltaX = startX - ev.clientX

      const nextWidth = clamp(startWidth + deltaX, AUDIO_MIN_WIDTH, maxWidth)
      if (side === 'left' || side === 'right') {
        updateAttributes({ width: Math.round(nextWidth) })
      }
    }

    const up = () => {
      document.removeEventListener('mousemove', move)
      document.removeEventListener('mouseup', up)
    }

    document.addEventListener('mousemove', move)
    document.addEventListener('mouseup', up)
  }

  /* ================= RENDER ================= */

  if (!canEdit && !hasAudio) return null

  return (
    <NodeViewWrapper
      className="audio-block-wrapper block-resizable"
      style={{
        width,
        ...alignMargins,
      }}
    >
      {/* RESIZE HANDLES */}
      {canEdit && (
        <>
          <div className="block-resize left" contentEditable={false} onMouseDown={e => startResize(e, 'left')} />
          <div className="block-resize right" contentEditable={false} onMouseDown={e => startResize(e, 'right')} />
        </>
      )}

      {!hasAudio && (
        // <button className="audio-add" onClick={openAtEvent}>
        //   ＋ Добавить аудио
        // </button>




        <div className="file-empty" onClick={canEdit ? openAtEvent : undefined}>
          + Добавить аудио
        </div>
      )}

      {hasAudio && (
        <div className="audio-player">
          <audio
            ref={audioRef}
            src={displayUrl}
            onTimeUpdate={onTime}
            onLoadedMetadata={onLoaded}
            onEnded={() => setIsPlaying(false)}
          />

          <button onClick={togglePlay} className="audio-play-btn">
            {isPlaying ? <IconPause className="audio-btn-icon" /> : <IconPlay className="audio-btn-icon" />}
          </button>

          <button
            className={`audio-loop-btn ${loop ? 'active' : ''}`}
            onClick={canEdit ? () => updateAttributes({ loop: !loop }) : undefined}
            disabled={!canEdit}
            title={loop ? 'Повтор выключен' : 'Повтор включен'}
          >
            <IconLoop className="audio-btn-icon" />
          </button>

          <span className="audio-time">
            {format(current)} / {format(duration)}
          </span>

          <div className="audio-progress" onClick={seek}>
            <div
              className="audio-progress-fill"
              style={{
                width: duration
                  ? `${(current / duration) * 100}%`
                  : '0%',
              }}
            />
          </div>

          <div
            className="audio-volume"
            onMouseEnter={() => setShowVolume(true)}
            onMouseLeave={() => setShowVolume(false)}
          >
            <button className="audio-volume-btn" title="Громкость">
              <IconVolume className="audio-btn-icon" />
            </button>
            {showVolume && (
              <div className="audio-volume-slider">
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={volume}
                  onChange={canEdit ? e => updateAttributes({ volume: +e.target.value }) : undefined}
                  disabled={!canEdit}
                />
                <div className="audio-volume-value">
                  {Math.round(volume * 100)}%
                </div>
              </div>
            )}
          </div>
          
          {/* Кнопка для открытия меню */}
          {canEdit && (
            <button
              className="audio-more-btn"
              onClick={openAtEvent}
              title="Audio settings"
            >
              <IconMore className="audio-btn-icon" />
            </button>
          )}
        </div>
      )}

      {/* ================= MODAL ================= */}
      {/* {open && (
        <div
          ref={modalRef}
          className="audio-modal"
          style={{
            position: 'fixed',
            top: `${modalPos.y}px`,
            left: `${modalPos.x}px`,
            zIndex: 9,
          }}
        >
          <div
            className="audio-modal-header"
            onMouseDown={startDragModal}
          >
            Добавить аудио
          </div>

          <div className="audio-modal-content">
            <div className="file-input-wrapper">
              <label className="file-input-label">
                <div className="file-input-icon">рџЋµ</div>
                <div className="file-input-text">
                  Нажмите для выбора файла или <strong>перетащите</strong>
                </div>
                <div className="file-input-hint">MP3, WAV, AAC, FLAC, OGG, M4A</div>
                <input
                  type="file"
                  accept="audio/*,.mp3,.wav,.aac,.flac,.ogg,.m4a"
                  onChange={e => {
                    const file = e.target.files?.[0]
                    if (!file) return
                    ;(async () => {
                      try {
                        if (docUploadFile) {
                          const path = await docUploadFile(file)
                          if (path) {
                            updateAttributes({ src: path, fileId: null })
                          } else {
                            const saved = await saveFile(file)
                            updateAttributes({ fileId: saved.id, src: null })
                          }
                        } else {
                          const saved = await saveFile(file)
                          updateAttributes({ fileId: saved.id, src: null })
                        }
                      } catch {
                        updateAttributes({ src: URL.createObjectURL(file), fileId: null })
                      } finally {
                        setOpen(false)
                      }
                    })()
                  }}
                  hidden
                />
              </label>
            </div>

            <div className="modal-divider">
              <span>или</span>
            </div>

            <div className="url-input-section">
              <input
                type="text"
                placeholder="https://example.com/audio.mp3"
                value={url}
                onChange={e => setUrl(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && url.trim()) {
                    updateAttributes({ src: url.trim(), fileId: null })
                    setOpen(false)
                  }
                }}
              />
              <button
                onClick={() => {
                  if (!url.trim()) return
                  updateAttributes({ src: url.trim(), fileId: null })
                  setOpen(false)
                }}
                disabled={!url.trim()}
                className="audio-insert-btn"
              >
                Вставить по ссылке
              </button>
            </div>
          </div>

          <button
            className="audio-modal-close"
            onClick={() => setOpen(false)}
          >
            вњ•
          </button>
        </div>
      )} */}






      {canEdit && open && renderModalPortal(
        <div
          ref={modalRef}
          className="image-modal"
          style={{
            top: modalPos.y,
            left: modalPos.x,
          }}
        >
          <div
            className="image-modal-header"
            onMouseDown={startDragModal}
          />

          <div className="image-modal-tabs">
            <button
              className={tab === 'upload' ? 'active' : ''}
              onClick={() => setTab('upload')}
            >
              Загрузить
            </button>
            <button
              className={tab === 'url' ? 'active' : ''}
              onClick={() => setTab('url')}
            >
              Ссылка
            </button>
          </div>

          <div className="image-modal-content">
            {tab === 'upload' && (
              <label className="image-upload-btn">
                Выбрать аудио
                <input
                  type="file"
                  accept="audio/*"
                  hidden
                  onChange={e => {
                    const file = e.target.files?.[0]
                    if (!file) return
                    ;(async () => {
                      try {
                        if (docUploadFile) {
                          const path = await docUploadFile(file)
                          if (path) updateAttributes({ src: path, fileId: null })
                        } else {
                          const saved = await saveFile(file)
                          updateAttributes({ fileId: saved.id, src: null })
                        }
                      } catch {
                        // ignore
                      } finally {
                        setOpen(false)
                      }
                    })()
                  }}
                />
              </label>
            )}

            {tab === 'url' && (
              <>
                <input
                  placeholder="https://..."
                  value={url}
                  onChange={e => setUrl(e.target.value)}
                />
                <button
                  onClick={() => {
                    if (!url) return
                    updateAttributes({ src: url, fileId: null })
                    setOpen(false)
                  }}
                >
                  Вставить
                </button>
              </>
            )}

            {hasAudio && (
              <button
                className="image-delete-btn"
                onClick={() => {
                  updateAttributes({ src: null, fileId: null })
                  setOpen(false)
                }}
              >
                Удалить
              </button>
            )}
          </div>
        </div>
      )}

    </NodeViewWrapper>
  )
}
