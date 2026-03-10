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
import { blobFromDataUrl, blobFromUrl, getFileRecord, saveBlobAsFile, saveFile } from '../storage/fileStore'
import { useDocumentationUpload } from '../DocumentationUploadContext'
import { clampFixedModalPosition, MODAL_VIEWPORT_MARGIN } from '../utils/modalViewportClamp'
const SINGLE_MODAL_EVENT = 'doclist-single-modal-open'
const FILE_BLOCK_MIN_HEIGHT = 120
const FILE_BLOCK_MIN_WIDTH = 200
const FILE_MODAL_ESTIMATED_SIZE = { width: 360, height: 260 }

// Определяем тип файла по расширению или MIME-типу
const getFileType = (filename, mimeType = '') => {
  const extension = filename.split('.').pop().toLowerCase();

  // Изображения
  const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg', 'ico', 'tiff', 'tif'];
  if (imageExtensions.includes(extension) || mimeType.startsWith('image/')) {
    return 'image';
  }
  
  // PDF
  if (extension === 'pdf' || mimeType === 'application/pdf') {
    return 'pdf';
  }
  
  // Текстовые файлы
  const textExtensions = ['txt', 'md', 'json', 'xml', 'html', 'htm', 'css', 'js', 'jsx', 'ts', 'tsx', 'csv'];
  if (textExtensions.includes(extension) || mimeType.startsWith('text/')) {
    return 'text';
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
  const codeExtensions = ['py', 'java', 'cpp', 'c', 'h', 'php', 'rb', 'go', 'rs', 'swift', 'kt'];
  if (codeExtensions.includes(extension)) {
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

export default function FileBlockView({ editor, node, updateAttributes, getPos }) {
  const { fileId, url: rawUrl, name, size, type: _type, mimeType } = node.attrs;

  const docUpload = useDocumentationUpload();
  const { uploadFile: docUploadFile, getMediaUrl } = docUpload || {};
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
  const [previewOpen, setPreviewOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [objectUrl, setObjectUrl] = useState(null);
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
  const displayUrl = objectUrl || (rawUrl && getMediaUrl ? getMediaUrl(rawUrl) : rawUrl);
  const hasFile = Boolean(url);
  const fileType = getFileType(name || '', mimeType);

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
        const blob = rawUrl.startsWith('data:')
          ? await blobFromDataUrl(rawUrl)
          : await blobFromUrl(rawUrl);

        if (docUploadFile) {
          const ext = (name || '').split('.').pop() || '';
          const fileName = name || `file.${ext}`;
          const file = new File([blob], fileName, { type: blob.type });
          const path = await docUploadFile(file);
          if (path) {
            updateAttributes({ fileId: null, url: path });
            migrationRef.current.running = false;
            return;
          }
        }
        const id = await saveBlobAsFile({
          blob,
          name: name || '',
          mimeType: blob.type,
          size: typeof size === 'number' ? size : 0,
        });

        updateAttributes({ fileId: id, url: null });
      } catch {
        // ignore
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

  /* ================= ADD FILE ================= */
  const addFile = (inputUrl, fileName, fileSize, fileType, mimeType) => {
    if (!canEdit) return;
    if (!inputUrl || !inputUrl.trim()) return;

    const url = inputUrl.trim();
    const finalName = fileName || url.split('/').pop() || 'Файл';

    updateAttributes({
      fileId: null,
      url: url,
      name: finalName,
      size: fileSize || '',
      type: fileType,
      mimeType: mimeType || '',
    });

    setOpen(false);
    setFileUrl('');
    setFileName('');
  };

  const onUpload = (file) => {
    if (!canEdit) return;
    if (!file) return;

    const fileType = getFileType(file.name, file.type);

    (async () => {
      try {
        if (docUploadFile) {
          const path = await docUploadFile(file);
          if (path) {
            updateAttributes({
              fileId: null,
              url: path,
              name: file.name,
              size: file.size || '',
              type: fileType,
              mimeType: file.type || '',
            });
          } else {
            const saved = await saveFile(file);
            updateAttributes({
              fileId: saved.id,
              url: null,
              name: saved.name || file.name,
              size: saved.size || file.size,
              type: fileType,
              mimeType: saved.mimeType || file.type,
            });
          }
        } else {
          const saved = await saveFile(file);
          updateAttributes({
            fileId: saved.id,
            url: null,
            name: saved.name || file.name,
            size: saved.size || file.size,
            type: fileType,
            mimeType: saved.mimeType || file.type,
          });
        }
      } catch {
        const blobUrl = URL.createObjectURL(file);
        addFile(blobUrl, file.name, file.size, fileType, file.type);
      } finally {
        setOpen(false);
        setFileUrl('');
        setFileName('');
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
      onUpload(file);
    }

    // Также пробуем получить URL из перетаскиваемого текста
    const urlFromText = dt.getData('text/plain');
    if (urlFromText) {
      addFile(urlFromText, '', '', 'file', '');
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

    addFile(fileUrl, fileName, '', 'file', '');
  };

  /* ================= РћРўРљР Р«РўР¬ РџР Р•Р’Р¬Р® ================= */
  const openPreview = () => {
    if (!displayUrl) return;

    // Проверяем, можно ли показать превью для этого типа файла
    const previewableTypes = ['pdf', 'text', 'image'];
    if (previewableTypes.includes(fileType)) {
      announceModalOpen();
      setOpen(false);
      setSelectedFile({
        url: displayUrl,
        name,
        type: fileType,
        mimeType,
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
            <img src={displayUrl} alt={name} />
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

      case 'audio':
        return (
          <div className="file-audio-preview">
            <audio controls src={displayUrl} />
          </div>
        );

      case 'video':
        return (
          <div className="file-video-preview">
            <video controls src={displayUrl} />
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
                  disabled={!['pdf', 'text', 'image', 'code'].includes(fileType)}
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
                  disabled={!['pdf', 'text', 'image', 'code'].includes(fileType)}
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
                        onUpload(file);
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
                  setOpen(false);
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
