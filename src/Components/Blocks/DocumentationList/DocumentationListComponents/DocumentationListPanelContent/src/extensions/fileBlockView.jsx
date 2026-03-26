import { NodeViewWrapper } from '@tiptap/react'
import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import InsertDriveFileOutlinedIcon from '@mui/icons-material/InsertDriveFileOutlined'
import DownloadRoundedIcon from '@mui/icons-material/DownloadRounded'
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined'
import LinkRoundedIcon from '@mui/icons-material/LinkRounded'
import MoreVertRoundedIcon from '@mui/icons-material/MoreVertRounded'
import CloseRoundedIcon from '@mui/icons-material/CloseRounded'
import './imageBlockModal.css'
import './fileEmpty.css'
import './fileBlockView.css'
import './blockResize.css'
import { blobFromDataUrl, blobFromUrl, getFileRecord } from '../storage/fileStore'
import { useDocumentationUpload } from '../DocumentationUploadContext'
import { notifyDocumentationUploadFailure } from '../DocumentationUploadStore'
import { clampFixedModalPosition, MODAL_VIEWPORT_MARGIN } from '../utils/modalViewportClamp'
import { parseVideoUrl } from '../utils/videoEmbedParser'
const SINGLE_MODAL_EVENT = 'doclist-single-modal-open'
const FILE_BLOCK_MIN_HEIGHT = 120
const FILE_BLOCK_MIN_WIDTH = 200
const FILE_MODAL_ESTIMATED_SIZE = { width: 360, height: 260 }
const DEFAULT_BLOCK_TARGET = 'auto'
const BLOCK_TARGET_OPTIONS = [
  { value: 'auto', label: 'Авто' },
  { value: 'file', label: 'Файл' },
  { value: 'image', label: 'Изображение' },
  { value: 'video', label: 'Видео' },
  { value: 'audio', label: 'Аудио' },
]

const getFileExtension = (filename = '') => {
  if (typeof filename !== 'string') return ''
  const trimmed = filename.trim()
  const lastDotIndex = trimmed.lastIndexOf('.')
  if (lastDotIndex < 0) return ''
  return trimmed.slice(lastDotIndex + 1).toLowerCase()
}

const getOfficePreviewUrl = (url) => {
  if (!url || typeof url !== 'string') return null
  if (url.startsWith('blob:') || url.startsWith('data:')) return null

  try {
    const resolved = new URL(url, window.location.origin)
    if (!/^https?:$/i.test(resolved.protocol)) return null
    return `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(resolved.toString())}`
  } catch {
    return null
  }
}

const getPreviewKind = ({ fileType, filename, url }) => {
  if (!url) return null

  if (fileType === 'image' || fileType === 'pdf') return fileType
  if (fileType === 'text' || fileType === 'code') return 'text'

  if (fileType === 'document') {
    const extension = getFileExtension(filename)
    if (extension === 'doc' || extension === 'docx') {
      return getOfficePreviewUrl(url) ? 'office' : null
    }
  }

  return null
}

const TEXT_FILE_EXTENSIONS = [
  'txt', 'text', 'log', 'out', 'err',
  'md', 'markdown', 'rst', 'adoc', 'asciidoc',
  'json', 'jsonl', 'ndjson', 'geojson',
  'xml', 'xsd', 'xsl', 'xslt',
  'html', 'htm', 'xhtml',
  'css', 'scss', 'sass', 'less',
  'csv', 'tsv', 'psv',
  'yaml', 'yml', 'toml', 'ini', 'cfg', 'conf', 'config', 'properties', 'prop',
  'env', 'editorconfig', 'gitignore', 'gitattributes', 'gitmodules', 'npmrc', 'yarnrc',
  'babelrc', 'prettierrc', 'eslintrc',
  'sql', 'graphql', 'gql', 'proto',
  'rtf',
]

const CODE_FILE_EXTENSIONS = [
  'js', 'mjs', 'cjs', 'jsx',
  'ts', 'mts', 'cts', 'tsx',
  'vue', 'svelte', 'astro',
  'py', 'pyw',
  'java',
  'c', 'h', 'hpp', 'hh', 'hxx', 'cpp', 'cc', 'cxx',
  'cs',
  'php', 'phtml',
  'rb',
  'go',
  'rs',
  'swift',
  'kt', 'kts',
  'scala',
  'lua',
  'r',
  'pl', 'pm',
  'dart',
  'sh', 'bash', 'zsh', 'fish',
  'bat', 'cmd',
  'ps1', 'psm1', 'psd1',
  'dockerfile', 'makefile',
]

const TEXT_FILENAMES = [
  'readme',
  'license',
  'licence',
  'dockerfile',
  'makefile',
  'jenkinsfile',
]

const isLikelyTextMimeType = (mimeType = '') => {
  const normalizedMime = String(mimeType || '').toLowerCase()
  if (!normalizedMime) return false

  if (
    normalizedMime.includes('officedocument') ||
    normalizedMime.includes('msword') ||
    normalizedMime.includes('spreadsheetml') ||
    normalizedMime.includes('presentationml') ||
    normalizedMime.includes('application/vnd.ms-')
  ) {
    return false
  }

  return (
    normalizedMime.startsWith('text/') ||
    normalizedMime.includes('json') ||
    normalizedMime.includes('xml') ||
    normalizedMime.includes('yaml') ||
    normalizedMime.includes('yml') ||
    normalizedMime.includes('javascript') ||
    normalizedMime.includes('ecmascript') ||
    normalizedMime.includes('typescript') ||
    normalizedMime.includes('csv') ||
    normalizedMime.includes('tab-separated-values') ||
    normalizedMime.includes('sql') ||
    normalizedMime.includes('graphql') ||
    normalizedMime.includes('x-sh') ||
    normalizedMime.includes('x-shellscript') ||
    normalizedMime.includes('x-python') ||
    normalizedMime.includes('x-httpd-php') ||
    normalizedMime.includes('x-ruby') ||
    normalizedMime.includes('x-c') ||
    normalizedMime.includes('x-c++') ||
    normalizedMime.includes('x-java') ||
    normalizedMime.includes('x-rust') ||
    normalizedMime.includes('x-go') ||
    normalizedMime.includes('x-kotlin') ||
    normalizedMime.includes('toml') ||
    normalizedMime.includes('rtf')
  )
}

const isKnownTextFilename = (filename = '') => {
  const normalizedName = String(filename || '').trim().toLowerCase()
  if (!normalizedName) return false

  return (
    TEXT_FILENAMES.includes(normalizedName) ||
    /^\.env(\..+)?$/i.test(normalizedName) ||
    /^\.eslint/i.test(normalizedName) ||
    /^\.prettier/i.test(normalizedName) ||
    /^\.babel/i.test(normalizedName)
  )
}

const getFilenameFromUrl = (inputUrl = '') => {
  const raw = String(inputUrl || '').trim()
  if (!raw) return ''

  try {
    const parsed = new URL(raw, window.location.origin)
    const lastSegment = parsed.pathname.split('/').filter(Boolean).pop()
    return lastSegment ? decodeURIComponent(lastSegment) : ''
  } catch {
    const withoutHash = raw.split('#')[0]
    const withoutQuery = withoutHash.split('?')[0]
    const lastSegment = withoutQuery.split('/').filter(Boolean).pop()
    return lastSegment ? decodeURIComponent(lastSegment) : ''
  }
}

const inferTargetBlock = ({ fileType, url }) => {
  if (fileType === 'image') return 'image'
  if (fileType === 'video') return 'video'
  if (fileType === 'audio') return 'audio'

  if (typeof url === 'string' && url.trim()) {
    const parsedVideo = parseVideoUrl(url)
    if (parsedVideo) {
      return 'video'
    }
  }

  return 'file'
}

const resolveTargetBlock = ({ preferredTarget, fileType, url }) => {
  if (preferredTarget && preferredTarget !== DEFAULT_BLOCK_TARGET) {
    return preferredTarget
  }
  return inferTargetBlock({ fileType, url })
}

const getTargetBlockLabel = (target) => {
  const match = BLOCK_TARGET_OPTIONS.find(option => option.value === target)
  return match?.label || 'Файл'
}

// Определяем тип файла по расширению или MIME-типу
const getFileType = (filename, mimeType = '') => {
  const extension = getFileExtension(filename)

  // Изображения
  const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg', 'ico', 'tiff', 'tif'];
  if (imageExtensions.includes(extension) || mimeType.startsWith('image/')) {
    return 'image';
  }
  
  // PDF
  if (extension === 'pdf' || mimeType === 'application/pdf') {
    return 'pdf';
  }

  // Документы
  const documentExtensions = ['doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'odt', 'ods', 'odp'];
  if (documentExtensions.includes(extension) || 
      mimeType.includes('msword') || 
      mimeType.includes('spreadsheetml') ||
      mimeType.includes('presentationml') ||
      mimeType.includes('officedocument')) {
    return 'document';
  }

  // Текстовые файлы
  if (
    TEXT_FILE_EXTENSIONS.includes(extension) ||
    isKnownTextFilename(filename) ||
    isLikelyTextMimeType(mimeType)
  ) {
    return 'text';
  }
  
  // Аудио
  const audioExtensions = ['mp3', 'wav', 'm4a', 'aac', 'flac', 'ogg', 'oga', 'opus', 'wma'];
  if (audioExtensions.includes(extension) || mimeType.startsWith('audio/')) {
    return 'audio';
  }
  
  // Видео
  const videoExtensions = ['mp4', 'webm', 'ogg', 'mov', 'avi', 'wmv', 'flv', 'mkv', '3gp', 'm4v', 'mpg', 'mpeg'];
  if (videoExtensions.includes(extension) || mimeType.startsWith('video/')) {
    return 'video';
  }
  
  // Архивы
  const archiveExtensions = ['zip', 'rar', '7z', 'tar', 'gz', 'bz2', 'xz'];
  if (archiveExtensions.includes(extension) || 
      mimeType.includes('zip') || 
      mimeType.includes('rar') ||
      mimeType.includes('compressed')) {
    return 'archive';
  }
  
  // Код
  if (CODE_FILE_EXTENSIONS.includes(extension)) {
    return 'code';
  }
  
  return 'file';
};

const getFileIconClass = (fileType) => {
  switch (fileType) {
    case 'pdf':
      return 'file-icon-pdf';
    case 'image':
      return 'file-icon-image';
    case 'text':
      return 'file-icon-text';
    case 'document':
      return 'file-icon-doc';
    case 'audio':
      return 'file-icon-audio';
    case 'video':
      return 'file-icon-video';
    case 'archive':
      return 'file-icon-archive';
    case 'code':
      return 'file-icon-code';
    default:
      return 'file-icon-file';
  }
};

const FileTypeIcon = ({ fileType, className }) => (
  <>
    {/* Legacy SVG icon:
    <svg
      className={`file-type-icon ${getFileIconClass(fileType)} ${className || ''}`}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M7 3h6l4 4v14H7z" />
      <path d="M13 3v4h4" />
      <path d="M9 13h6" />
      <path d="M9 17h6" />
    </svg>
    */}
    <InsertDriveFileOutlinedIcon
      className={`file-type-icon ${getFileIconClass(fileType)} ${className || ''}`}
      aria-hidden="true"
      fontSize="inherit"
    />
  </>
);

const IconDownload = ({ className }) => (
  <>
    {/* Legacy SVG icon:
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 3v12" />
      <path d="M7 10l5 5 5-5" />
      <path d="M5 21h14" />
    </svg>
    */}
    <DownloadRoundedIcon className={className} aria-hidden="true" fontSize="inherit" />
  </>
);

const IconEye = ({ className }) => (
  <>
    {/* Legacy SVG icon:
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
    */}
    <VisibilityOutlinedIcon className={className} aria-hidden="true" fontSize="inherit" />
  </>
);

const IconLink = ({ className }) => (
  <>
    {/* Legacy SVG icon:
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M10 13a5 5 0 0 0 7.07 0l2.83-2.83a5 5 0 1 0-7.07-7.07L10 4" />
      <path d="M14 11a5 5 0 0 0-7.07 0L4.1 13.83a5 5 0 0 0 7.07 7.07L14 20" />
    </svg>
    */}
    <LinkRoundedIcon className={className} aria-hidden="true" fontSize="inherit" />
  </>
);

const IconMore = ({ className }) => (
  <>
    {/* Legacy SVG icon:
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <circle cx="12" cy="5" r="1.6" />
      <circle cx="12" cy="12" r="1.6" />
      <circle cx="12" cy="19" r="1.6" />
    </svg>
    */}
    <MoreVertRoundedIcon className={className} aria-hidden="true" fontSize="inherit" />
  </>
);

const IconClose = ({ className }) => (
  <>
    {/* Legacy SVG icon:
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M6 6l12 12" />
      <path d="M18 6l-12 12" />
    </svg>
    */}
    <CloseRoundedIcon className={className} aria-hidden="true" fontSize="inherit" />
  </>
);

// Форматирование размера файла
const formatFileSize = (bytes) => {
  if (!bytes || bytes === 0) return '0 Б';
  const k = 1024;
  const sizes = ['Б', 'КБ', 'МБ', 'ГБ', 'ТБ'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};

// Компонент для превью PDF (упрощенная версия с iframe)
const PDFPreview = ({ url, filename }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  return (
    <div className="pdf-preview">
      {loading && <div className="pdf-loading">Загрузка PDF...</div>}
      {error && <div className="pdf-error">Не удалось загрузить PDF</div>}
      <iframe
        src={url}
        title={filename}
        onLoad={() => setLoading(false)}
        onError={() => {
          setLoading(false);
          setError(true);
        }}
        style={{ display: loading || error ? 'none' : 'block' }}
      />
    </div>
  );
};

// Компонент для превью текстового файла
const TextPreview = ({ url }) => {
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const loadText = async () => {
      try {
        if (!url || typeof url !== 'string') throw new Error('Empty text URL');
        // Для blob-ссылок и data URLs
        if (url.startsWith('blob:') || url.startsWith('data:')) {
          const response = await fetch(url);
          if (!response.ok) throw new Error(`HTTP ${response.status}`);
          const text = await response.text();
          // Ограничиваем длину текста для превью
          setContent(text.length > 10000 ? text.substring(0, 10000) + '\n...' : text);
        } else {
          // Для внешних ссылок - используем прокси через CORS proxy
          const response = await fetch(url);
          if (!response.ok) throw new Error('Network response was not ok');
          const text = await response.text();
          setContent(text.length > 10000 ? text.substring(0, 10000) + '\n...' : text);
        }
        setLoading(false);
      } catch (error) {
        console.error('Error loading text file:', error);
        setError(true);
        setContent('Не удалось загрузить содержимое файла');
        setLoading(false);
      }
    };

    if (url) {
      loadText();
    }
  }, [url]);

  return (
    <div className="text-preview">
      {loading && <div className="text-loading">Загрузка текста...</div>}
      {error && <div className="text-error">Ошибка загрузки</div>}
      {!loading && !error && <pre>{content}</pre>}
    </div>
  );
};

const advanceMediaCandidate = (setIndex, candidatesLength) => {
  setIndex(prev => (prev + 1 < candidatesLength ? prev + 1 : prev));
};

export default function FileBlockView({ editor, node, updateAttributes, getPos }) {
  const { fileId, url: rawUrl, name, size, type: _type, mimeType } = node.attrs;

  const docUpload = useDocumentationUpload();
  const { uploadFile: docUploadFile, getMediaUrl, getMediaUrlCandidates } = docUpload || {};
  const canEdit = editor?.isEditable !== false;
  const width = typeof node.attrs.width === 'number' ? node.attrs.width : 520;
  const height = typeof node.attrs.height === 'number' ? node.attrs.height : null;
  const textAlign = node.attrs.textAlign || 'left';

  const alignMargins =
    textAlign === 'center'
      ? { marginLeft: 'auto', marginRight: 'auto' }
      : textAlign === 'right'
        ? { marginLeft: 'auto', marginRight: 0 }
        : { marginLeft: 0, marginRight: 'auto' };

  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState('upload');
  const [fileName, setFileName] = useState(name || '');
  const [fileUrl, setFileUrl] = useState('');
  const [blockTarget, setBlockTarget] = useState(DEFAULT_BLOCK_TARGET);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [objectUrl, setObjectUrl] = useState(null);
  const [displayUrlIndex, setDisplayUrlIndex] = useState(0);
  const migrationRef = useRef({ running: false, doneFor: null });

  const modalRef = useRef(null);
  const modalSourceRef = useRef(`file-block-${Math.random().toString(36).slice(2)}`);
  const fileInputRef = useRef(null);
  const [modalPos, setModalPos] = useState({ x: 0, y: 0 });
  const dragOffset = useRef({ x: 0, y: 0 });
  const modalPortalTarget = typeof document !== 'undefined' ? document.body : null;
  const renderModalPortal = (node) => {
    if (!node) return null;
    return modalPortalTarget ? createPortal(node, modalPortalTarget) : node;
  };

  const announceModalOpen = () => {
    try {
      window.dispatchEvent(
        new CustomEvent(SINGLE_MODAL_EVENT, {
          detail: { source: modalSourceRef.current },
        })
      );
    } catch {
      // ignore
    }
  };

  const safeSetNodeSelectionHere = (e) => {
    if (e?.button != null && e.button !== 0) return;

    const t = e?.target;
    if (t instanceof Element && t.closest('input, textarea, select, button, a')) return;

    const pos = typeof getPos === 'function' ? getPos() : null;
    if (typeof pos === 'number' && editor?.commands?.setNodeSelection) {
      editor.commands.setNodeSelection(pos);
    }
  };

  const url = objectUrl || rawUrl;
  const displayUrlCandidates = objectUrl
    ? [objectUrl]
    : rawUrl
      ? (
          getMediaUrlCandidates
            ? getMediaUrlCandidates(rawUrl)
            : [getMediaUrl ? getMediaUrl(rawUrl) : rawUrl]
        ).filter(Boolean)
      : [];
  const displayUrl =
    displayUrlCandidates[
      Math.min(displayUrlIndex, Math.max(0, displayUrlCandidates.length - 1))
    ] || null;
  const hasFile = Boolean(url);
  const fileType = getFileType(name || '', mimeType);
  const previewKind = getPreviewKind({
    fileType,
    filename: name || '',
    url: displayUrl,
  });
  const canPreview = Boolean(previewKind);
  const draftName = fileName.trim() || getFilenameFromUrl(fileUrl)
  const draftFileType = fileUrl.trim() ? getFileType(draftName || 'file', '') : 'file'
  const predictedTargetBlock = fileUrl.trim()
    ? inferTargetBlock({ fileType: draftFileType, url: fileUrl.trim() })
    : 'file'

  /* ================= RESOLVE LOCAL FILE ================= */

  useEffect(() => {
    let cancelled = false;
    let urlToRevoke = null;

    (async () => {
      if (!fileId) {
        setObjectUrl(null);
        return;
      }

      try {
        const record = await getFileRecord(fileId);
        if (!record?.blob) {
          if (!cancelled) setObjectUrl(null);
          return;
        }
        const nextUrl = URL.createObjectURL(record.blob);
        urlToRevoke = nextUrl;
        if (!cancelled) setObjectUrl(nextUrl);
      } catch {
        if (!cancelled) setObjectUrl(null);
      }
    })();

    return () => {
      cancelled = true;
      if (urlToRevoke) URL.revokeObjectURL(urlToRevoke);
    };
  }, [fileId]);

  useEffect(() => {
    setDisplayUrlIndex(0);
  }, [objectUrl, rawUrl]);

  /* ================= MIGRATE data:/blob: ================= */

  useEffect(() => {
    if (fileId) return;
    if (!rawUrl || typeof rawUrl !== 'string') return;
    if (!rawUrl.startsWith('data:') && !rawUrl.startsWith('blob:')) return;

    if (migrationRef.current.running) return;
    if (migrationRef.current.doneFor === rawUrl) return;

    migrationRef.current.running = true;
    migrationRef.current.doneFor = rawUrl;

    (async () => {
      try {
        if (!docUploadFile) return
        const blob = rawUrl.startsWith('data:')
          ? await blobFromDataUrl(rawUrl)
          : await blobFromUrl(rawUrl);

        const ext = (name || '').split('.').pop() || '';
        const fileName = name || `file.${ext}`;
        const file = new File([blob], fileName, { type: blob.type });
        const path = await docUploadFile(file);
        updateAttributes({ fileId: null, url: path });
      } catch (error) {
        console.error('Failed to migrate documentation file block to server upload:', error)
      } finally {
        migrationRef.current.running = false;
      }
    })();
  }, [fileId, rawUrl, name, size, updateAttributes, docUploadFile]);

  /* ================= DRAG MODAL ================= */
  const startDragModal = (e) => {
    e.preventDefault();
    e.stopPropagation();
    dragOffset.current = {
      x: e.clientX - modalPos.x,
      y: e.clientY - modalPos.y,
    };
    document.addEventListener('mousemove', onDragModal);
    document.addEventListener('mouseup', stopDragModal);
  };

  const onDragModal = (e) => {
    const rect = modalRef.current?.getBoundingClientRect?.();
    setModalPos(
      clampFixedModalPosition(
        {
          x: e.clientX - dragOffset.current.x,
          y: e.clientY - dragOffset.current.y,
        },
        rect || FILE_MODAL_ESTIMATED_SIZE,
        MODAL_VIEWPORT_MARGIN
      )
    );
  };

  const stopDragModal = () => {
    document.removeEventListener('mousemove', onDragModal);
    document.removeEventListener('mouseup', stopDragModal);
  };

  /* ================= OPEN MODAL ================= */
  const openAtEvent = (e) => {
    if (!canEdit) return;
    e.stopPropagation();
    const rect = modalRef.current?.getBoundingClientRect?.();
    setModalPos(
      clampFixedModalPosition(
        { x: e.clientX + 10, y: e.clientY - 10 },
        rect || FILE_MODAL_ESTIMATED_SIZE,
        MODAL_VIEWPORT_MARGIN
      )
    );
    announceModalOpen();
    setPreviewOpen(false);
    setOpen(true);
    setFileUrl('');
    setFileName('');
    setBlockTarget(DEFAULT_BLOCK_TARGET);
  };

  useEffect(() => {
    const onExternalModalOpen = (event) => {
      if (event?.detail?.source === modalSourceRef.current) return;
      setOpen(false);
      setPreviewOpen(false);
    };

    window.addEventListener(SINGLE_MODAL_EVENT, onExternalModalOpen);
    return () => {
      window.removeEventListener(SINGLE_MODAL_EVENT, onExternalModalOpen);
    };
  }, []);

  /* ================= CLOSE MODAL ================= */
  useEffect(() => {
    if (!open) return;
    const close = (e) => {
      if (modalRef.current && !modalRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const clampModalToViewport = () => {
      const rect = modalRef.current?.getBoundingClientRect?.();
      if (!rect) return;
      setModalPos((prev) => {
        const next = clampFixedModalPosition(prev, rect, MODAL_VIEWPORT_MARGIN);
        if (next.x === prev.x && next.y === prev.y) return prev;
        return next;
      });
    };

    const rafId = window.requestAnimationFrame(clampModalToViewport);
    window.addEventListener('resize', clampModalToViewport);
    return () => {
      window.cancelAnimationFrame(rafId);
      window.removeEventListener('resize', clampModalToViewport);
    };
  }, [open]);

  const resetModalDrafts = () => {
    setOpen(false);
    setFileUrl('');
    setFileName('');
    setBlockTarget(DEFAULT_BLOCK_TARGET);
  };

  const replaceFileBlockNode = ({ targetBlock, sourceUrl }) => {
    const pos = typeof getPos === 'function' ? getPos() : null;
    if (typeof pos !== 'number' || !editor?.view?.state?.schema) return false;

    const targetNodeName = {
      image: 'imageBlock',
      video: 'videoBlock',
      audio: 'audioBlock',
    }[targetBlock];

    if (!targetNodeName) return false;

    const nodeType = editor.view.state.schema.nodes[targetNodeName];
    if (!nodeType) return false;

    const sharedWidth =
      typeof node.attrs.width === 'number' && Number.isFinite(node.attrs.width)
        ? node.attrs.width
        : 520;
    const sharedTextAlign = node.attrs.textAlign || null;

    let nextAttrs = null;

    if (targetBlock === 'image') {
      nextAttrs = {
        fileId: null,
        src: sourceUrl,
        caption: '',
        showCaption: false,
        width: sharedWidth,
        height: null,
        textAlign: sharedTextAlign,
      };
    }

    if (targetBlock === 'video') {
      nextAttrs = {
        fileId: null,
        src: sourceUrl,
        width: sharedWidth,
        height: Math.max(180, Math.round(sharedWidth * 9 / 16)),
        caption: '',
        textAlign: sharedTextAlign,
      };
    }

    if (targetBlock === 'audio') {
      nextAttrs = {
        fileId: null,
        src: sourceUrl,
        volume: 1,
        loop: false,
        width: sharedWidth,
        height: null,
        textAlign: sharedTextAlign,
      };
    }

    if (!nextAttrs) return false;

    const nextNode = nodeType.create(nextAttrs);
    const tr = editor.view.state.tr.replaceWith(pos, pos + node.nodeSize, nextNode);
    editor.view.dispatch(tr.scrollIntoView());
    resetModalDrafts();
    return true;
  };

  const applyResolvedTarget = ({
    sourceUrl,
    fileName: incomingFileName,
    fileSize = '',
    mimeType: nextMimeType = '',
    fileType: incomingFileType,
    preferredTarget = DEFAULT_BLOCK_TARGET,
  }) => {
    const normalizedUrl = String(sourceUrl || '').trim();
    if (!normalizedUrl) return;

    const finalName = incomingFileName || getFilenameFromUrl(normalizedUrl) || 'Файл';
    const normalizedFileType = incomingFileType || getFileType(finalName || 'file', nextMimeType);
    const targetBlock = resolveTargetBlock({
      preferredTarget,
      fileType: normalizedFileType,
      url: normalizedUrl,
    });

    if (targetBlock === 'file') {
      updateAttributes({
        fileId: null,
        url: normalizedUrl,
        name: finalName,
        size: fileSize || '',
        type: normalizedFileType,
        mimeType: nextMimeType || '',
      });
      resetModalDrafts();
      return;
    }

    const replaced = replaceFileBlockNode({
      targetBlock,
      sourceUrl: normalizedUrl,
    });

    if (!replaced) {
      updateAttributes({
        fileId: null,
        url: normalizedUrl,
        name: finalName,
        size: fileSize || '',
        type: normalizedFileType,
        mimeType: nextMimeType || '',
      });
      resetModalDrafts();
    }
  };

  /* ================= ADD FILE ================= */
  const addFile = (inputUrl, fileName, fileSize, fileType, mimeType) => {
    if (!canEdit) return;
    if (!inputUrl || !inputUrl.trim()) return;

    applyResolvedTarget({
      sourceUrl: inputUrl.trim(),
      fileName,
      fileSize,
      fileType,
      mimeType,
      preferredTarget: blockTarget,
    });
  };

  const onUpload = (file, preferredTarget = DEFAULT_BLOCK_TARGET) => {
    if (!canEdit) return;
    if (!file) return;

    const fileType = getFileType(file.name, file.type);

    (async () => {
      try {
        if (!docUploadFile) {
          throw new Error('Documentation upload service is unavailable')
        }

        const path = await docUploadFile(file);
        applyResolvedTarget({
          sourceUrl: path,
          fileName: file.name,
          fileSize: file.size || '',
          fileType,
          mimeType: file.type || '',
          preferredTarget,
        });
      } catch (error) {
        notifyDocumentationUploadFailure(error, 'файл')
      } finally {
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    })();
  };

  /* ================= DRAG & DROP ================= */
  const handleDrop = (e) => {
    if (!canEdit) return;
    e.preventDefault();
    e.currentTarget.classList.remove('drag-over');

    const dt = e.dataTransfer;
    if (dt.files && dt.files.length) {
      const file = dt.files[0];
      onUpload(file, DEFAULT_BLOCK_TARGET);
      return;
    }

    // Также пробуем получить URL из перетаскиваемого текста
    const urlFromText = dt.getData('text/plain');
    if (urlFromText) {
      const trimmedUrl = urlFromText.trim();
      if (!trimmedUrl) return;
      const inferredName = getFilenameFromUrl(trimmedUrl);
      const inferredType = getFileType(inferredName || 'file', '');

      applyResolvedTarget({
        sourceUrl: trimmedUrl,
        fileName: inferredName,
        fileSize: '',
        fileType: inferredType,
        mimeType: '',
        preferredTarget: DEFAULT_BLOCK_TARGET,
      });
    }
  };

  /* ================= ВАЛИДАЦИЯ URL ================= */
  const validateUrl = (url) => {
    if (!url) return false;
    return url.trim().length > 0;
  };

  /* ================= РљРќРћРџРљРђ Р’РЎРўРђР’РљР ================= */
  const handleInsertFile = () => {
    if (!canEdit) return;
    if (!fileUrl.trim()) {
      alert('Введите ссылку на файл');
      return;
    }

    if (!validateUrl(fileUrl)) {
      alert('Некорректная ссылка на файл');
      return;
    }

    const normalizedUrl = fileUrl.trim();
    const resolvedName = fileName.trim() || getFilenameFromUrl(normalizedUrl);
    const resolvedType = getFileType(resolvedName || 'file', '');

    addFile(normalizedUrl, resolvedName, '', resolvedType, '');
  };

  /* ================= РћРўРљР Р«РўР¬ РџР Р•Р’Р¬Р® ================= */
  const openPreview = () => {
    if (!displayUrl) return;

    if (previewKind) {
      announceModalOpen();
      setOpen(false);
      setSelectedFile({
        url: displayUrl,
        name,
        type: previewKind,
        mimeType,
        officeUrl: previewKind === 'office' ? getOfficePreviewUrl(displayUrl) : null,
      });
      setPreviewOpen(true);
    } else {
      // Для других типов просто открываем скачивание
      window.open(displayUrl, '_blank');
    }
  };

  /* ================= РџР Р•Р’Р¬Р® РР—РћР‘Р РђР–Р•РќРРЇ ================= */
  const handleImageClick = (e) => {
    e.stopPropagation();
    window.dispatchEvent(
      new CustomEvent('open-viewer', {
        detail: {
          images: [displayUrl],
          index: 0,
        },
      })
    );
  };

  // Очистка blob-ссылок при размонтировании
  useEffect(() => {
    return () => {
      if (url && url.startsWith('blob:')) {
        URL.revokeObjectURL(url);
      }
    };
  }, [url]);

  /* ================= Р“Р•РќР•Р РђР¦РРЇ РџР Р•Р’Р¬Р® ================= */
  const renderPreview = () => {
    if (!displayUrl) return null;

    switch (fileType) {
      case 'image':
        return (
          <div className="file-image-preview" onClick={handleImageClick}>
            <img
              src={displayUrl}
              alt={name}
              onError={() => advanceMediaCandidate(setDisplayUrlIndex, displayUrlCandidates.length)}
            />
            <div className="file-preview-overlay">
              <span>Просмотр</span>
            </div>
          </div>
        );

      case 'pdf':
        return (
          <div className="file-pdf-preview">
            <div className="pdf-preview-simple">
              <div className="pdf-icon">
                <FileTypeIcon fileType="pdf" />
              </div>
              <div className="pdf-info">
                <div className="pdf-name">{name}</div>
                <div className="pdf-size">{formatFileSize(parseInt(size) || 0)}</div>
              </div>
            </div>
            <div className="file-preview-overlay" onClick={openPreview}>
              <span>Открыть PDF</span>
            </div>
          </div>
        );

      case 'text':
      case 'code':
        return (
          <div className="file-text-preview">
            <TextPreview url={displayUrl} />
            <div className="file-preview-overlay" onClick={openPreview}>
              <span>Просмотр текста</span>
            </div>
          </div>
        );

      case 'document':
        if (previewKind === 'office') {
          return (
            <div className="file-doc-preview">
              <div className="pdf-preview-simple">
                <div className="pdf-icon">
                  <FileTypeIcon fileType="document" />
                </div>
                <div className="pdf-info">
                  <div className="pdf-name">{name}</div>
                  <div className="pdf-size">{formatFileSize(parseInt(size) || 0)}</div>
                </div>
              </div>
              <div className="file-preview-overlay" onClick={openPreview}>
                <span>{`Открыть ${(getFileExtension(name || '') || 'doc').toUpperCase()}`}</span>
              </div>
            </div>
          );
        }
        return (
          <div className="file-generic-preview">
            <div className="generic-icon">
              <FileTypeIcon fileType={fileType} />
            </div>
            <div className="generic-info">
              <div className="generic-name">{name}</div>
              <div className="generic-type">{fileType.toUpperCase()}</div>
            </div>
          </div>
        );

      case 'audio':
        return (
          <div className="file-audio-preview">
            <audio
              controls
              src={displayUrl}
              onError={() => advanceMediaCandidate(setDisplayUrlIndex, displayUrlCandidates.length)}
            />
          </div>
        );

      case 'video':
        return (
          <div className="file-video-preview">
            <video
              controls
              src={displayUrl}
              onError={() => advanceMediaCandidate(setDisplayUrlIndex, displayUrlCandidates.length)}
            />
          </div>
        );

      default:
        return (
          <div className="file-generic-preview">
            <div className="generic-icon">
              <FileTypeIcon fileType={fileType} />
            </div>
            <div className="generic-info">
              <div className="generic-name">{name}</div>
              <div className="generic-type">{fileType.toUpperCase()}</div>
            </div>
          </div>
        );
    }
  };

  const openFileLink = () => {
    if (!displayUrl) return;
    window.open(displayUrl, '_blank');
  };


  /* ================= RESIZE ================= */

  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

  const startResize = (e, side) => {
    if (!canEdit) return;
    e.preventDefault();
    e.stopPropagation();

    const startX = e.clientX;
    const startY = e.clientY;

    const wrapperEl = e.currentTarget?.closest?.('[data-node-view-wrapper]');
    const proseMirrorEl = wrapperEl?.closest?.('.ProseMirror') || wrapperEl?.parentElement;
    const maxWidth = Math.max(FILE_BLOCK_MIN_WIDTH, Math.floor(proseMirrorEl?.clientWidth || 700));

    const startRect = wrapperEl?.getBoundingClientRect?.();
    const startWidth = width;
    const startHeight = typeof height === 'number' ? height : Math.round(startRect?.height || 120);
    const isLeft = side.includes('left');
    const isRight = side.includes('right');
    const isTop = side.includes('top');
    const isBottom = side.includes('bottom');

    const move = ev => {
      let deltaX = 0;
      let deltaY = 0;

      if (isRight) deltaX = ev.clientX - startX;
      if (isLeft) deltaX = startX - ev.clientX;
      if (isBottom) deltaY = ev.clientY - startY;
      if (isTop) deltaY = startY - ev.clientY;

      const nextWidth = clamp(startWidth + deltaX, FILE_BLOCK_MIN_WIDTH, maxWidth);
      const nextHeight = clamp(startHeight + deltaY, FILE_BLOCK_MIN_HEIGHT, 900);

      const nextAttrs = {};
      if (isLeft || isRight) nextAttrs.width = Math.round(nextWidth);
      if (isTop || isBottom) nextAttrs.height = Math.round(nextHeight);
      updateAttributes(nextAttrs);
    };

    const up = () => {
      document.removeEventListener('mousemove', move);
      document.removeEventListener('mouseup', up);
    };

    document.addEventListener('mousemove', move);
    document.addEventListener('mouseup', up);
  };

  if (!canEdit && !hasFile) return null;

  return (
    <>
      <NodeViewWrapper
        className="file-block-wrapper block-resizable"
        onMouseDown={safeSetNodeSelectionHere}
        style={{
          width,
          ...alignMargins,
          minHeight: hasFile ? FILE_BLOCK_MIN_HEIGHT : undefined,
          height: hasFile && typeof height === 'number'
            ? Math.max(FILE_BLOCK_MIN_HEIGHT, height)
            : undefined,
        }}
      >
        {/* RESIZE HANDLES */}
        {canEdit && (
          <>
            <div className="block-resize left" contentEditable={false} onMouseDown={e => startResize(e, 'left')} />
            <div className="block-resize right" contentEditable={false} onMouseDown={e => startResize(e, 'right')} />
            {url && (
              <>
                <div className="block-resize top" contentEditable={false} onMouseDown={e => startResize(e, 'top')} />
                <div className="block-resize bottom" contentEditable={false} onMouseDown={e => startResize(e, 'bottom')} />
                <div className="block-resize corner top-left" contentEditable={false} onMouseDown={e => startResize(e, 'top-left')} />
                <div className="block-resize corner top-right" contentEditable={false} onMouseDown={e => startResize(e, 'top-right')} />
                <div className="block-resize corner bottom-left" contentEditable={false} onMouseDown={e => startResize(e, 'bottom-left')} />
                <div className="block-resize corner bottom-right" contentEditable={false} onMouseDown={e => startResize(e, 'bottom-right')} />
              </>
            )}
          </>
        )}

        {/* EMPTY BLOCK */}
        {!hasFile && (
          <div
            className="file-empty"
            onClick={canEdit ? openAtEvent : undefined}
            onDragOver={canEdit ? (e) => {
              e.preventDefault();
              e.currentTarget.classList.add('drag-over');
            } : undefined}
            onDragLeave={canEdit ? (e) => e.currentTarget.classList.remove('drag-over') : undefined}
            onDrop={canEdit ? handleDrop : undefined}
          >
            + Добавить файл
          </div>
        )}

        {/* FILE BLOCK */}
        {hasFile && (
          <div className="file-block">
            {/* Превью файла (если доступно) */}
            {renderPreview()}

            {/* Notes in file block are disabled */}
            <div className="file-info">
              <div className="file-compact-row">
                <button
                  className="file-compact-btn"
                  onClick={openPreview}
                  title="Просмотр"
                  disabled={!canPreview}
                >
                  <IconEye className="file-btn-icon" />
                </button>
                <button
                  className="file-compact-name"
                  onClick={openFileLink}
                  title={name}
                >
                  {name}
                </button>
                <button
                  className="file-compact-btn"
                  onClick={() => {
                    const a = document.createElement('a');
                    a.href = displayUrl;
                    a.download = name || 'file';
                    a.click();
                  }}
                  title="Скачать"
                >
                  <IconDownload className="file-btn-icon" />
                </button>
                <button
                  className="file-compact-btn"
                  style={{ display: canEdit ? undefined : 'none' }}
                  onClick={openAtEvent}
                  title="Настройки"
                >
                  <IconMore className="file-btn-icon" />
                </button>
                <button
                  className="file-compact-btn"
                  onClick={openFileLink}
                  title="Открыть ссылку"
                >
                  <IconLink className="file-btn-icon" />
                </button>
              </div>

              <div className="file-header">
                <span className="file-icon">
                  <FileTypeIcon fileType={fileType} />
                </span>
                <div className="file-details">
                  <div className="file-name">{name}</div>
                  <div className="file-meta">
                    {size && <span className="file-size">{formatFileSize(parseInt(size) || 0)}</span>}
                    {fileType && <span className="file-type">{fileType.toUpperCase()}</span>}
                  </div>
                </div>
              </div>

              {/* Notes in file block are disabled */}
              <div className="file-actions">
                <button
                  className="file-action-btn download-btn"
                  onClick={() => {
                    const a = document.createElement('a');
                    a.href = displayUrl;
                    a.download = name || 'file';
                    a.click();
                  }}
                  title="Скачать"
                >
                  <IconDownload className="file-btn-icon" />
                  <span className="sr-only">Скачать</span>
                </button>

                <button
                  className="file-action-btn preview-btn"
                  onClick={openPreview}
                  title="Просмотр"
                  disabled={!canPreview}
                >
                  <IconEye className="file-btn-icon" />
                  <span className="sr-only">Просмотр</span>
                </button>

                <button
                  className="file-action-btn more-btn"
                  style={{ display: canEdit ? undefined : 'none' }}
                  onClick={openAtEvent}
                  title="Настройки"
                >
                  <IconMore className="file-btn-icon" />
                  <span className="sr-only">Настройки</span>
                </button>
              </div>

              {/* Дополнительная информация */}
              <div className="file-extra-info">
                <a
                  href={displayUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="file-link"
                  onClick={(e) => e.stopPropagation()}
                >
                  <IconLink className="file-link-icon" />
                  Открыть ссылку
                </a>
              </div>

              {/* Notes in file block are disabled */}
            </div>
          </div>
        )}
      </NodeViewWrapper>

      {/* MODAL ДЛЯ ДОБАВЛЕНИЯ ФАЙЛА */}
      {canEdit && open && renderModalPortal(
        <div
          ref={modalRef}
          className="image-modal"
          style={{
            top: modalPos.y,
            left: modalPos.x,
          }}
        >
          <div className="image-modal-header" onMouseDown={startDragModal}>
          </div>

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
            <div className="file-block-target-panel">
              <div className="file-block-target-title">Формат блока</div>
              <div className="file-block-target-list">
                {BLOCK_TARGET_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    className={`file-block-target-btn ${blockTarget === option.value ? 'active' : ''}`}
                    onClick={() => setBlockTarget(option.value)}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
              <div className="file-block-target-hint">
                {blockTarget === DEFAULT_BLOCK_TARGET
                  ? `Автоопределение: ${getTargetBlockLabel(predictedTargetBlock)}`
                  : `Будет создан блок: ${getTargetBlockLabel(blockTarget)}`}
              </div>
            </div>

            {tab === 'upload' && (
              <div className="upload-section">
                <label
                  className="image-upload-btn"
                  style={{
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '24px',
                  }}
                >
                  {/* <div style={{ fontSize: '48px', marginBottom: '12px' }}>рџ“Ѓ</div> */}
                  {/* <div style={{ fontSize: '16px', fontWeight: '500' }}>
                    Кликните для выбора файла
                  </div> */}
                  <div style={{ fontSize: '14px', color: '#6b7280' }}>
                    Выберите файл
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    hidden
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        onUpload(file, blockTarget);
                      }
                    }}
                  />
                </label>
                {/* <div className="upload-hint">
                  <strong>Поддерживаемые типы файлов:</strong>
                  <br />
                  • Документы: PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX, TXT
                  <br />
                  • Изображения: JPG, PNG, GIF, SVG, WEBP
                  <br />
                  • Медиа: MP3, MP4, WAV, AVI, MPEG
                  <br />
                  • Архивы: ZIP, RAR, 7Z
                  <br />
                  • И другие файлы
                </div> */}
              </div>
            )}

            {tab === 'url' && (
              <div className="url-section">
                <div className="url-input-wrapper">
                  <input
                    type="text"
                    placeholder="Вставьте ссылку на файл..."
                    value={fileUrl}
                    onChange={(e) => setFileUrl(e.target.value)}
                    style={{ marginBottom: '12px' }}
                  />
                  <input
                    type="text"
                    placeholder="Название файла (опционально)"
                    value={fileName}
                    onChange={(e) => setFileName(e.target.value)}
                  />
                  {/* <div className="supported-platforms">
                    <strong>Поддерживаются:</strong> любые прямые ссылки на файлы
                    <br />
                    <strong>Примеры:</strong>
                    <br />
                    вЂў https://example.com/document.pdf
                    <br />
                    вЂў https://example.com/data.xlsx
                    <br />
                    вЂў https://example.com/image.jpg
                  </div> */}
                </div>

                <button
                  className="insert-btn"
                  onClick={handleInsertFile}
                  disabled={!fileUrl.trim()}
                  style={{ marginTop: '12px' }}
                >
                  Вставить файл
                </button>
              </div>
            )}

            {url && (
              <button
                className="delete-btn"
                onClick={() => {
                  // Очищаем blob-ссылку если это загруженный файл
                  if (url.startsWith('blob:')) {
                    URL.revokeObjectURL(url);
                  }

                  updateAttributes({
                    fileId: null,
                    url: null,
                    name: 'Файл',
                    size: '',
                    type: '',
                    mimeType: '',
                    height: null,
                    note: '',
                  });
                  setObjectUrl(null);
                  resetModalDrafts();
                }}
                style={{ marginTop: '12px' }}
              >
                Удалить файл
              </button>
            )}
          </div>
        </div>
      )}

      {/* Notes in file block are disabled */}
      {previewOpen && selectedFile && renderModalPortal(
        <div className="file-preview-modal" onClick={() => setPreviewOpen(false)}>
          <div
            className="file-preview-content"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="file-preview-header">
              <h3>{selectedFile.name}</h3>
              <button
                className="close-btn"
                onClick={() => setPreviewOpen(false)}
                aria-label="Закрыть"
              >
                <IconClose className="file-btn-icon" />
              </button>
            </div>

            <div className="file-preview-body">
              {selectedFile.type === 'pdf' && (
                <div className="pdf-full-preview">
                  <iframe
                    src={selectedFile.url}
                    title={selectedFile.name}
                    style={{ width: '100%', height: '70vh', border: 'none' }}
                  />
                </div>
              )}

              {selectedFile.type === 'text' && (
                <div className="text-full-preview">
                  <TextPreview url={selectedFile.url} />
                </div>
              )}

              {selectedFile.type === 'image' && (
                <div className="image-full-preview">
                  <img src={selectedFile.url} alt={selectedFile.name} />
                </div>
              )}

              {selectedFile.type === 'office' && selectedFile.officeUrl && (
                <div className="office-full-preview">
                  <iframe
                    src={selectedFile.officeUrl}
                    title={selectedFile.name}
                    style={{ width: '100%', height: '70vh', border: 'none' }}
                  />
                </div>
              )}
            </div>

            <div className="file-preview-footer">
              <button
                className="download-btn"
                onClick={() => {
                  const a = document.createElement('a');
                  a.href = selectedFile.url;
                  a.download = selectedFile.name;
                  a.click();
                }}
              >
                <IconDownload className="file-btn-icon" />
                Скачать
              </button>
              <button className="close-btn" onClick={() => setPreviewOpen(false)}>
                Закрыть
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
