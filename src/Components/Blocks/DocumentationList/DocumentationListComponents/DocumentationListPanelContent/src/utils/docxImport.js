const WORD_NS = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'
const REL_NS = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships'
const PKG_REL_NS = 'http://schemas.openxmlformats.org/package/2006/relationships'

function escapeHtml(text) {
  return String(text ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function wordVal(el) {
  return (
    el?.getAttributeNS?.(WORD_NS, 'val') ??
    el?.getAttribute?.('w:val') ??
    el?.getAttribute?.('val') ??
    null
  )
}

function relId(el) {
  return (
    el?.getAttributeNS?.(REL_NS, 'id') ??
    el?.getAttribute?.('r:id') ??
    el?.getAttribute?.('id') ??
    null
  )
}

function wordBoolean(propEl) {
  if (!propEl) return false
  const val = wordVal(propEl)
  if (val == null) return true
  const v = String(val).trim().toLowerCase()
  return !(v === '0' || v === 'false' || v === 'off' || v === 'none')
}

function halfPointsToPx(szVal) {
  const n = Number.parseInt(String(szVal ?? ''), 10)
  if (!Number.isFinite(n) || n <= 0) return null
  // w:sz is in half-points. 1pt = 96/72 px.
  const px = Math.round((n / 2) * (96 / 72))
  return px > 0 ? `${px}px` : null
}

function wordColorToCss(colorVal) {
  const v = String(colorVal ?? '').trim()
  if (!v || v.toLowerCase() === 'auto') return null
  const hex = v.replace(/^#/, '')
  if (!/^[0-9a-fA-F]{6}$/.test(hex)) return null
  return `#${hex}`
}

function wordHighlightToCss(highlightVal) {
  const v = String(highlightVal ?? '').trim().toLowerCase()
  if (!v || v === 'none') return null

  const map = {
    yellow: '#fff59d',
    green: '#a5d6a7',
    cyan: '#80deea',
    magenta: '#f48fb1',
    blue: '#90caf9',
    red: '#ef9a9a',
    black: '#000000',
    darkblue: '#1565c0',
    darkcyan: '#00838f',
    darkgreen: '#2e7d32',
    darkmagenta: '#ad1457',
    darkred: '#c62828',
    darkyellow: '#f9a825',
    darkgray: '#424242',
    lightgray: '#e0e0e0',
    white: '#ffffff',
  }

  return map[v] || null
}

function findFirstChild(parentEl, localName) {
  if (!parentEl) return null
  for (const child of Array.from(parentEl.childNodes || [])) {
    if (child?.nodeType === 1 && child.localName === localName) return child
  }
  return null
}

function parseRelationships(relsXmlText) {
  if (!relsXmlText) return {}

  try {
    const xmlDoc = new DOMParser().parseFromString(relsXmlText, 'application/xml')
    if (xmlDoc.getElementsByTagName('parsererror')?.length) return {}

    const relEls = Array.from(xmlDoc.getElementsByTagNameNS(PKG_REL_NS, 'Relationship'))
    const map = {}
    for (const rel of relEls) {
      const id = rel.getAttribute('Id')
      const target = rel.getAttribute('Target')
      if (!id || !target) continue
      map[id] = target
    }
    return map
  } catch {
    return {}
  }
}

function normalizeZipPathFromWordTarget(target) {
  const raw = String(target ?? '').trim().replace(/\\/g, '/')
  if (!raw) return null
  if (/^[a-z]:\//i.test(raw)) return null
  if (raw.startsWith('/')) return raw.replace(/^\/+/, '')
  if (raw.startsWith('word/')) return raw
  if (
    /^https?:\/\//i.test(raw) ||
    /^data:/i.test(raw) ||
    /^mailto:/i.test(raw) ||
    /^ftp:\/\//i.test(raw)
  ) {
    return null
  }

  const segments = ['word']
  for (const part of raw.split('/')) {
    if (!part || part === '.') continue
    if (part === '..') {
      if (segments.length > 0) segments.pop()
      continue
    }
    segments.push(part)
  }

  return segments.join('/')
}

function guessMimeFromPath(path) {
  const lower = String(path ?? '').toLowerCase()
  if (lower.endsWith('.png')) return 'image/png'
  if (lower.endsWith('.jpg') || lower.endsWith('.jpeg')) return 'image/jpeg'
  if (lower.endsWith('.gif')) return 'image/gif'
  if (lower.endsWith('.webp')) return 'image/webp'
  if (lower.endsWith('.svg')) return 'image/svg+xml'
  if (lower.endsWith('.bmp')) return 'image/bmp'
  if (lower.endsWith('.tif') || lower.endsWith('.tiff')) return 'image/tiff'
  return 'application/octet-stream'
}

function bytesToDataUrl(bytes, mimeType) {
  return new Promise((resolve, reject) => {
    try {
      const blob = new Blob([bytes], { type: mimeType || 'application/octet-stream' })
      const reader = new FileReader()
      reader.onload = () => resolve(String(reader.result || ''))
      reader.onerror = () => reject(new Error('Не удалось прочитать изображение из DOCX'))
      reader.readAsDataURL(blob)
    } catch (e) {
      reject(e)
    }
  })
}

async function buildDocxImageMap(arrayBuffer, relsMap) {
  const entries = Object.entries(relsMap || {})
  if (!entries.length) return {}

  const imageMap = {}
  for (const [id, target] of entries) {
    const zipPath = normalizeZipPathFromWordTarget(target)
    if (!zipPath) continue
    if (!/\/media\//i.test(zipPath)) continue

    try {
      const imageBytes = await extractZipEntryBytes(arrayBuffer, zipPath)
      const mimeType = guessMimeFromPath(zipPath)
      const dataUrl = await bytesToDataUrl(imageBytes, mimeType)
      if (dataUrl) {
        imageMap[id] = dataUrl
      }
    } catch {
      // Ignore individual image extraction errors and keep text import working.
    }
  }

  return imageMap
}

function findAllByLocalName(rootEl, localName) {
  if (!rootEl) return []
  const out = []
  const stack = [rootEl]
  while (stack.length) {
    const node = stack.pop()
    if (!node || !node.childNodes) continue
    for (const child of Array.from(node.childNodes)) {
      if (!child || child.nodeType !== 1) continue
      if (child.localName === localName) out.push(child)
      stack.push(child)
    }
  }
  return out
}

function extractImageHtmlFromRunElement(el, imageMap) {
  if (!el) return []
  const relIds = []

  const blips = findAllByLocalName(el, 'blip')
  for (const blip of blips) {
    const id =
      relId(blip) ||
      blip.getAttributeNS?.(REL_NS, 'embed') ||
      blip.getAttribute?.('r:embed') ||
      blip.getAttribute?.('embed') ||
      null
    if (id) relIds.push(id)
  }

  const imageDataEls = findAllByLocalName(el, 'imagedata')
  for (const imgData of imageDataEls) {
    const id = relId(imgData) || imgData.getAttribute?.('r:id') || imgData.getAttribute?.('id') || null
    if (id) relIds.push(id)
  }

  if (!relIds.length) return []

  const html = []
  const used = new Set()
  for (const id of relIds) {
    if (!id || used.has(id)) continue
    used.add(id)

    const src = imageMap?.[id]
    if (!src) continue
    html.push(
      `<img src="${escapeHtml(src)}" alt="" style="max-width: 100%; height: auto; display: inline-block;" />`
    )
  }

  return html
}

function serializeInlineChildren(containerEl, relsMap, imageMap) {
  const parts = []
  for (const child of Array.from(containerEl.childNodes || [])) {
    if (child?.nodeType !== 1) continue

    if (child.localName === 'r') {
      parts.push(serializeRun(child, imageMap))
      continue
    }

    if (child.localName === 'hyperlink') {
      const id = relId(child)
      const href = id ? relsMap?.[id] : null
      const inner = serializeInlineChildren(child, relsMap, imageMap)
      if (href) {
        parts.push(`<a href="${escapeHtml(href)}">${inner}</a>`)
      } else {
        parts.push(inner)
      }
      continue
    }

    if (child.localName === 'sdt') {
      const content = findFirstChild(child, 'sdtContent')
      if (content) parts.push(serializeInlineChildren(content, relsMap, imageMap))
      continue
    }
  }

  return parts.join('')
}

function serializeRun(runEl, imageMap) {
  const rPr = findFirstChild(runEl, 'rPr')

  const isBold = wordBoolean(findFirstChild(rPr, 'b'))
  const isItalic = wordBoolean(findFirstChild(rPr, 'i'))
  const isUnderline = (() => {
    const u = findFirstChild(rPr, 'u')
    if (!u) return false
    const val = wordVal(u)
    if (val == null) return true
    const v = String(val).trim().toLowerCase()
    return !(v === 'none' || v === '0' || v === 'false' || v === 'off')
  })()
  const isStrike = wordBoolean(findFirstChild(rPr, 'strike'))

  const fontSize = halfPointsToPx(wordVal(findFirstChild(rPr, 'sz')))
  const color = wordColorToCss(wordVal(findFirstChild(rPr, 'color')))
  const bg = wordHighlightToCss(wordVal(findFirstChild(rPr, 'highlight')))

  let textHtml = ''
  const imageHtmlParts = []
  for (const child of Array.from(runEl.childNodes || [])) {
    if (child?.nodeType !== 1) continue

    if (child.localName === 't') {
      const raw = child.textContent ?? ''
      // Preserve multiple/leading spaces when Word sets xml:space="preserve".
      const preserve = child.getAttribute('xml:space') === 'preserve'
      if (preserve) {
        const escaped = escapeHtml(raw)
        const withNbsp = escaped
          .replace(/^\s+/, m => '&nbsp;'.repeat(m.length))
          .replace(/\s+$/, m => '&nbsp;'.repeat(m.length))
          .replace(/ {2,}/g, m => '&nbsp;'.repeat(m.length - 1) + ' ')
        textHtml += withNbsp
      } else {
        textHtml += escapeHtml(raw)
      }
      continue
    }

    if (child.localName === 'tab') {
      textHtml += '&emsp;'
      continue
    }

    if (child.localName === 'br' || child.localName === 'cr') {
      textHtml += '<br />'
      continue
    }

    if (child.localName === 'drawing' || child.localName === 'pict') {
      imageHtmlParts.push(...extractImageHtmlFromRunElement(child, imageMap))
      continue
    }
  }

  if (!textHtml && !imageHtmlParts.length) return ''

  let styledText = ''
  if (textHtml) {
    const styleParts = []
    if (fontSize) styleParts.push(`font-size: ${fontSize}`)
    if (color) styleParts.push(`color: ${color}`)
    if (bg) styleParts.push(`background-color: ${bg}`)

    styledText = textHtml
    if (styleParts.length) {
      styledText = `<span style="${styleParts.join('; ')}">${styledText}</span>`
    }

    if (isStrike) styledText = `<s>${styledText}</s>`
    if (isUnderline) styledText = `<u>${styledText}</u>`
    if (isItalic) styledText = `<em>${styledText}</em>`
    if (isBold) styledText = `<strong>${styledText}</strong>`
  }

  return [styledText, ...imageHtmlParts].filter(Boolean).join('')
}

function paragraphTagName(pStyleVal) {
  const v = String(pStyleVal ?? '').trim().toLowerCase()
  if (!v) return 'p'

  // Common Word style ids: Heading1..Heading6
  const m = v.match(/^heading\s*([1-6])$/) || v.match(/^heading([1-6])$/)
  if (m) return `h${m[1]}`

  return 'p'
}

function serializeParagraph(pEl, relsMap, imageMap) {
  const pPr = findFirstChild(pEl, 'pPr')
  const pStyle = wordVal(findFirstChild(pPr, 'pStyle'))
  const tag = paragraphTagName(pStyle)

  const jcVal = String(wordVal(findFirstChild(pPr, 'jc')) ?? '').trim().toLowerCase()
  const align =
    jcVal === 'center'
      ? 'center'
      : jcVal === 'right'
        ? 'right'
        : jcVal === 'both'
          ? 'justify'
          : jcVal === 'left'
            ? 'left'
            : null

  const style = align ? ` style="text-align: ${align};"` : ''
  const inner = serializeInlineChildren(pEl, relsMap, imageMap)
  const safeInner = inner || '<br />'

  return `<${tag}${style}>${safeInner}</${tag}>`
}

function serializeTable(tblEl, relsMap, imageMap) {
  const rows = Array.from(tblEl.childNodes || []).filter(n => n?.nodeType === 1 && n.localName === 'tr')
  if (!rows.length) return ''

  const rowHtml = rows
    .map(tr => {
      const cells = Array.from(tr.childNodes || []).filter(n => n?.nodeType === 1 && n.localName === 'tc')
      const cellHtml = cells
        .map(tc => {
          const paragraphs = Array.from(tc.childNodes || []).filter(n => n?.nodeType === 1 && n.localName === 'p')
          const inner =
            paragraphs.map(p => serializeParagraph(p, relsMap, imageMap)).join('') || '<p><br /></p>'
          return `<td>${inner}</td>`
        })
        .join('')
      return `<tr>${cellHtml}</tr>`
    })
    .join('')

  return `<table><tbody>${rowHtml}</tbody></table>`
}

function findZipEocdOffset(bytes) {
  const min = Math.max(0, bytes.length - 22 - 0xffff)
  for (let i = bytes.length - 22; i >= min; i--) {
    if (bytes[i] === 0x50 && bytes[i + 1] === 0x4b && bytes[i + 2] === 0x05 && bytes[i + 3] === 0x06) {
      return i
    }
  }
  return -1
}

async function inflateZipDeflate(compressedBytes) {
  if (typeof DecompressionStream === 'undefined') {
    throw new Error('Этот браузер не поддерживает распаковку DOCX')
  }

  let lastError = null
  for (const format of ['deflate-raw', 'deflate']) {
    try {
      const ds = new DecompressionStream(format)
      const stream = new Blob([compressedBytes]).stream().pipeThrough(ds)
      const ab = await new Response(stream).arrayBuffer()
      return new Uint8Array(ab)
    } catch (e) {
      lastError = e
    }
  }

  throw lastError || new Error('Не удалось распаковать DOCX')
}

async function extractZipEntryBytes(arrayBuffer, wantedPath) {
  const bytes = new Uint8Array(arrayBuffer)
  const view = new DataView(arrayBuffer)

  const eocdOffset = findZipEocdOffset(bytes)
  if (eocdOffset < 0) {
    throw new Error('Не удалось прочитать DOCX (не ZIP)')
  }

  const centralDirSize = view.getUint32(eocdOffset + 12, true)
  const centralDirOffset = view.getUint32(eocdOffset + 16, true)

  const decoder = new TextDecoder('utf-8')
  let ptr = centralDirOffset
  const end = centralDirOffset + centralDirSize

  while (ptr < end) {
    const sig = view.getUint32(ptr, true)
    if (sig !== 0x02014b50) break

    const compression = view.getUint16(ptr + 10, true)
    const compressedSize = view.getUint32(ptr + 20, true)
    const nameLen = view.getUint16(ptr + 28, true)
    const extraLen = view.getUint16(ptr + 30, true)
    const commentLen = view.getUint16(ptr + 32, true)
    const localHeaderOffset = view.getUint32(ptr + 42, true)

    const nameStart = ptr + 46
    const name = decoder.decode(bytes.slice(nameStart, nameStart + nameLen))

    ptr = nameStart + nameLen + extraLen + commentLen

    if (name !== wantedPath) continue

    const localSig = view.getUint32(localHeaderOffset, true)
    if (localSig !== 0x04034b50) {
      throw new Error('Не удалось прочитать DOCX (битый ZIP)')
    }

    const localNameLen = view.getUint16(localHeaderOffset + 26, true)
    const localExtraLen = view.getUint16(localHeaderOffset + 28, true)
    const dataStart = localHeaderOffset + 30 + localNameLen + localExtraLen
    const dataEnd = dataStart + compressedSize

    const fileData = bytes.slice(dataStart, dataEnd)
    if (compression === 0) return fileData
    if (compression === 8) return inflateZipDeflate(fileData)

    throw new Error(`Не поддерживается сжатие DOCX (method=${compression})`)
  }

  throw new Error(`В DOCX не найден ${wantedPath}`)
}

export async function docxArrayBufferToHtml(arrayBuffer) {
  if (!arrayBuffer) throw new Error('Пустой DOCX')

  const documentXmlBytes = await extractZipEntryBytes(arrayBuffer, 'word/document.xml')
  const xmlText = new TextDecoder('utf-8').decode(documentXmlBytes)

  let relsMap = {}
  try {
    const relsBytes = await extractZipEntryBytes(arrayBuffer, 'word/_rels/document.xml.rels')
    const relsText = new TextDecoder('utf-8').decode(relsBytes)
    relsMap = parseRelationships(relsText)
  } catch {
    relsMap = {}
  }
  const imageMap = await buildDocxImageMap(arrayBuffer, relsMap)

  const xmlDoc = new DOMParser().parseFromString(xmlText, 'application/xml')
  if (xmlDoc.getElementsByTagName('parsererror')?.length) {
    throw new Error('Не удалось разобрать DOCX')
  }

  const body = xmlDoc.getElementsByTagNameNS(WORD_NS, 'body')?.[0] || null
  if (!body) throw new Error('Не удалось прочитать DOCX (нет body)')

  const parts = []
  for (const child of Array.from(body.childNodes || [])) {
    if (child?.nodeType !== 1) continue

    if (child.localName === 'p') {
      parts.push(serializeParagraph(child, relsMap, imageMap))
      continue
    }

    if (child.localName === 'tbl') {
      parts.push(serializeTable(child, relsMap, imageMap))
      continue
    }
  }

  return parts.join('\n')
}
