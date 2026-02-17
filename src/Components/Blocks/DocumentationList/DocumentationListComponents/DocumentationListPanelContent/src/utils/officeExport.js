const textEncoder = new TextEncoder()

function encodeUtf8(str) {
  return textEncoder.encode(String(str ?? ''))
}

function u16le(value) {
  const v = value & 0xffff
  return new Uint8Array([v & 0xff, (v >> 8) & 0xff])
}

function u32le(value) {
  const v = value >>> 0
  return new Uint8Array([
    v & 0xff,
    (v >> 8) & 0xff,
    (v >> 16) & 0xff,
    (v >> 24) & 0xff,
  ])
}

function concatBytes(chunks) {
  const total = chunks.reduce((sum, c) => sum + c.length, 0)
  const out = new Uint8Array(total)
  let offset = 0
  for (const chunk of chunks) {
    out.set(chunk, offset)
    offset += chunk.length
  }
  return out
}

let crcTable = null

function getCrcTable() {
  if (crcTable) return crcTable

  const table = new Uint32Array(256)
  for (let i = 0; i < 256; i++) {
    let c = i
    for (let k = 0; k < 8; k++) {
      c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1)
    }
    table[i] = c >>> 0
  }

  crcTable = table
  return table
}

function crc32(bytes) {
  const table = getCrcTable()
  let c = 0xffffffff

  for (let i = 0; i < bytes.length; i++) {
    c = table[(c ^ bytes[i]) & 0xff] ^ (c >>> 8)
  }

  return (c ^ 0xffffffff) >>> 0
}

function createZip(entries) {
  const files = entries.map(e => {
    const nameBytes = encodeUtf8(e.path)
    const dataBytes =
      e.data instanceof Uint8Array ? e.data : encodeUtf8(e.data)
    const crc = crc32(dataBytes)

    return {
      path: e.path,
      nameBytes,
      dataBytes,
      crc,
    }
  })

  const localParts = []
  const centralParts = []
  let offset = 0

  for (const file of files) {
    const localHeader = concatBytes([
      u32le(0x04034b50), // local file header signature
      u16le(20), // version needed to extract
      u16le(0), // general purpose bit flag
      u16le(0), // compression method (store)
      u16le(0), // mod file time
      u16le(0), // mod file date
      u32le(file.crc),
      u32le(file.dataBytes.length),
      u32le(file.dataBytes.length),
      u16le(file.nameBytes.length),
      u16le(0), // extra field length
      file.nameBytes,
    ])

    localParts.push(localHeader, file.dataBytes)

    const centralHeader = concatBytes([
      u32le(0x02014b50), // central directory file header signature
      u16le(20), // version made by
      u16le(20), // version needed to extract
      u16le(0), // general purpose bit flag
      u16le(0), // compression method (store)
      u16le(0), // mod file time
      u16le(0), // mod file date
      u32le(file.crc),
      u32le(file.dataBytes.length),
      u32le(file.dataBytes.length),
      u16le(file.nameBytes.length),
      u16le(0), // extra field length
      u16le(0), // file comment length
      u16le(0), // disk number start
      u16le(0), // internal file attributes
      u32le(0), // external file attributes
      u32le(offset), // relative offset of local header
      file.nameBytes,
    ])

    centralParts.push(centralHeader)
    offset += localHeader.length + file.dataBytes.length
  }

  const centralDir = concatBytes(centralParts)

  const endOfCentralDir = concatBytes([
    u32le(0x06054b50), // end of central dir signature
    u16le(0), // number of this disk
    u16le(0), // disk where central directory starts
    u16le(files.length), // number of central directory records on this disk
    u16le(files.length), // total number of central directory records
    u32le(centralDir.length), // size of central directory
    u32le(offset), // offset of start of central directory
    u16le(0), // zip file comment length
  ])

  return concatBytes([...localParts, centralDir, endOfCentralDir])
}

function escapeXml(text) {
  return String(text ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

function wordParagraphXmlFromText(paragraph) {
  const lines = String(paragraph ?? '').split('\n')

  const runs = []
  for (let i = 0; i < lines.length; i++) {
    const part = lines[i]
    const needsPreserve = /^\s|\s$/.test(part) || part.includes('  ')
    const attrs = needsPreserve ? ' xml:space="preserve"' : ''
    runs.push(
      `<w:r><w:t${attrs}>${escapeXml(part)}</w:t></w:r>`
    )

    if (i !== lines.length - 1) {
      runs.push('<w:r><w:br/></w:r>')
    }
  }

  return `<w:p>${runs.join('')}</w:p>`
}

function wordDocumentXmlFromPlainText(text) {
  const normalized = String(text ?? '').replace(/\r\n/g, '\n')
  const paragraphs = normalized.split(/\n{2,}/)

  const bodyParts = paragraphs
    .map(p => wordParagraphXmlFromText(p))
    .join('')

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    ${bodyParts}
    <w:sectPr/>
  </w:body>
</w:document>`
}

export function createDocxBlobFromPlainText(text) {
  const documentXml = wordDocumentXmlFromPlainText(text)

  const zipBytes = createZip([
    {
      path: '[Content_Types].xml',
      data: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
</Types>`,
    },
    {
      path: '_rels/.rels',
      data: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`,
    },
    {
      path: 'word/document.xml',
      data: documentXml,
    },
    {
      path: 'word/_rels/document.xml.rels',
      data: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"/>`,
    },
  ])

  return new Blob([zipBytes], {
    type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  })
}

export function buildWordHtmlDocument({ html, title = 'Document' }) {
  const safeTitle = escapeXml(title)
  const body = String(html ?? '')

  return `<!doctype html>
<html xmlns:o="urn:schemas-microsoft-com:office:office"
      xmlns:w="urn:schemas-microsoft-com:office:word"
      xmlns="http://www.w3.org/TR/REC-html40">
  <head>
    <meta charset="utf-8" />
    <title>${safeTitle}</title>
    <style>
      body { font-family: Calibri, Arial, sans-serif; }
      table { border-collapse: collapse; }
      td, th { border: 1px solid #d1d5db; padding: 4px 6px; vertical-align: top; }
    </style>
  </head>
  <body>${body}</body>
</html>`
}

export function buildExcelHtmlDocument({ html, title = 'Sheet1', sheetName = 'Sheet1' }) {
  const safeTitle = escapeXml(title)
  const safeSheet = escapeXml(sheetName)
  const body = String(html ?? '')

  return `<!doctype html>
<html xmlns:o="urn:schemas-microsoft-com:office:office"
      xmlns:x="urn:schemas-microsoft-com:office:excel"
      xmlns="http://www.w3.org/TR/REC-html40">
  <head>
    <meta charset="utf-8" />
    <title>${safeTitle}</title>
    <!--[if gte mso 9]><xml>
      <x:ExcelWorkbook>
        <x:ExcelWorksheets>
          <x:ExcelWorksheet>
            <x:Name>${safeSheet}</x:Name>
            <x:WorksheetOptions>
              <x:DisplayGridlines/>
            </x:WorksheetOptions>
          </x:ExcelWorksheet>
        </x:ExcelWorksheets>
      </x:ExcelWorkbook>
    </xml><![endif]-->
    <style>
      body { font-family: Calibri, Arial, sans-serif; }
      table { border-collapse: collapse; }
      td, th { border: 1px solid #d1d5db; padding: 4px 6px; vertical-align: top; }
    </style>
  </head>
  <body>${body}</body>
</html>`
}

