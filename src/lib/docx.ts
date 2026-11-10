/**
 * Pembuat DOCX minimal tanpa dependensi.
 *
 * DOCX = arsip ZIP berisi beberapa berkas XML. ZIP-nya ditulis dengan metode
 * "store" (tanpa kompresi), jadi cukup memakai TextEncoder + DataView.
 */

export type DocxAlign = 'left' | 'center' | 'right' | 'justify'

export type DocxCell = {
  text: string
  bold?: boolean
  align?: DocxAlign
  /** Ukuran font dalam half-point (18 = 9pt). */
  size?: number
}

export type DocxTableOptions = {
  widths: number[]
  headerRow?: boolean
  borders?: boolean
}

export type DocxParagraphOptions = {
  bold?: boolean
  align?: DocxAlign
  size?: number
  spaceAfter?: number
  spaceBefore?: number
}

/** Lebar area teks A4 (11906) dikurangi margin 1134 kiri-kanan. */
export const CONTENT_WIDTH = 9638

const SECT_PR =
  '<w:sectPr><w:pgSz w:w="11906" w:h="16838"/>' +
  '<w:pgMar w:top="1134" w:right="1134" w:bottom="1134" w:left="1134" w:header="0" w:footer="0" w:gutter="0"/>' +
  '</w:sectPr>'

function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function runProperties(bold?: boolean, size?: number): string {
  const parts: string[] = []
  if (bold) parts.push('<w:b/>')
  if (size) {
    parts.push(`<w:sz w:val="${size}"/><w:szCs w:val="${size}"/>`)
  }
  return parts.length > 0 ? `<w:rPr>${parts.join('')}</w:rPr>` : ''
}

function paragraphXml(text: string, options: DocxParagraphOptions): string {
  const spacing = `<w:spacing w:after="${options.spaceAfter ?? 80}" w:before="${options.spaceBefore ?? 0}" w:line="240" w:lineRule="auto"/>`
  const align = options.align ? `<w:jc w:val="${options.align}"/>` : ''

  return (
    '<w:p><w:pPr>' +
    align +
    spacing +
    '</w:pPr>' +
    `<w:r>${runProperties(options.bold, options.size)}` +
    `<w:t xml:space="preserve">${escapeXml(text)}</w:t></w:r></w:p>`
  )
}

function borderXml(kind: 'single' | 'none'): string {
  const value = kind === 'none' ? 'none' : 'single'
  const size = kind === 'none' ? 0 : 4
  const color = kind === 'none' ? 'auto' : '000000'
  const sides = ['top', 'left', 'bottom', 'right', 'insideH', 'insideV']

  return `<w:tblBorders>${sides
    .map(
      (side) =>
        `<w:${side} w:val="${value}" w:sz="${size}" w:space="0" w:color="${color}"/>`
    )
    .join('')}</w:tblBorders>`
}

function cellXml(cell: DocxCell, width: number): string {
  const size = cell.size ?? 18
  const align = cell.align ?? 'left'

  return (
    `<w:tc><w:tcPr><w:tcW w:w="${width}" w:type="dxa"/><w:vAlign w:val="center"/></w:tcPr>` +
    `<w:p><w:pPr><w:jc w:val="${align}"/>` +
    '<w:spacing w:after="0" w:before="0" w:line="240" w:lineRule="auto"/>' +
    '</w:pPr>' +
    `<w:r>${runProperties(cell.bold, size)}` +
    `<w:t xml:space="preserve">${escapeXml(cell.text)}</w:t></w:r></w:p></w:tc>`
  )
}

function tableXml(rows: DocxCell[][], options: DocxTableOptions): string {
  const widths = options.widths
  const grid = widths
    .map((width) => `<w:gridCol w:w="${width}"/>`)
    .join('')

  const body = rows
    .map((row, rowIndex) => {
      const isHeader = options.headerRow && rowIndex === 0
      const trPr = isHeader ? '<w:trPr><w:tblHeader/></w:trPr>' : ''
      const cells = row
        .map((cell, cellIndex) =>
          cellXml(
            { ...cell, bold: cell.bold ?? isHeader },
            widths[cellIndex] ?? widths[0]
          )
        )
        .join('')

      return `<w:tr>${trPr}${cells}</w:tr>`
    })
    .join('')

  return (
    '<w:tbl><w:tblPr>' +
    `<w:tblW w:w="${CONTENT_WIDTH}" w:type="dxa"/><w:jc w:val="center"/>` +
    borderXml(options.borders === false ? 'none' : 'single') +
    '<w:tblCellMar><w:left w:w="70" w:type="dxa"/><w:right w:w="70" w:type="dxa"/></w:tblCellMar>' +
    `<w:tblLayout w:type="fixed"/></w:tblPr><w:tblGrid>${grid}</w:tblGrid>${body}</w:tbl>`
  )
}

// ── ZIP (store) ─────────────────────────────────────────────────────────────

function crc32(data: Uint8Array): number {
  let crc = 0xffffffff

  for (let index = 0; index < data.length; index++) {
    crc ^= data[index]

    for (let bit = 0; bit < 8; bit++) {
      crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1))
    }
  }

  return (crc ^ 0xffffffff) >>> 0
}

function concat(parts: Uint8Array[]): Uint8Array {
  const total = parts.reduce((sum, part) => sum + part.length, 0)
  const result = new Uint8Array(total)
  let offset = 0

  for (const part of parts) {
    result.set(part, offset)
    offset += part.length
  }

  return result
}

type ZipEntry = { name: string; data: Uint8Array }

function zipStore(entries: ZipEntry[]): Uint8Array {
  const encoder = new TextEncoder()
  const chunks: Uint8Array[] = []
  const central: Uint8Array[] = []

  const now = new Date()
  const dosTime =
    ((now.getHours() << 11) |
      (now.getMinutes() << 5) |
      Math.floor(now.getSeconds() / 2)) &
    0xffff
  const dosDate =
    (((now.getFullYear() - 1980) << 9) |
      ((now.getMonth() + 1) << 5) |
      now.getDate()) &
    0xffff

  let offset = 0

  for (const entry of entries) {
    const nameBytes = encoder.encode(entry.name)
    const crc = crc32(entry.data)
    const size = entry.data.length

    const local = new Uint8Array(30 + nameBytes.length)
    const localView = new DataView(local.buffer)
    localView.setUint32(0, 0x04034b50, true)
    localView.setUint16(4, 20, true)
    localView.setUint16(6, 0x0800, true) // nama berkas UTF-8
    localView.setUint16(8, 0, true) // metode store
    localView.setUint16(10, dosTime, true)
    localView.setUint16(12, dosDate, true)
    localView.setUint32(14, crc, true)
    localView.setUint32(18, size, true)
    localView.setUint32(22, size, true)
    localView.setUint16(26, nameBytes.length, true)
    localView.setUint16(28, 0, true)
    local.set(nameBytes, 30)

    chunks.push(local, entry.data)

    const directory = new Uint8Array(46 + nameBytes.length)
    const directoryView = new DataView(directory.buffer)
    directoryView.setUint32(0, 0x02014b50, true)
    directoryView.setUint16(4, 20, true)
    directoryView.setUint16(6, 20, true)
    directoryView.setUint16(8, 0x0800, true)
    directoryView.setUint16(10, 0, true)
    directoryView.setUint16(12, dosTime, true)
    directoryView.setUint16(14, dosDate, true)
    directoryView.setUint32(16, crc, true)
    directoryView.setUint32(20, size, true)
    directoryView.setUint32(24, size, true)
    directoryView.setUint16(28, nameBytes.length, true)
    directoryView.setUint16(30, 0, true)
    directoryView.setUint16(32, 0, true)
    directoryView.setUint16(34, 0, true)
    directoryView.setUint16(36, 0, true)
    directoryView.setUint32(38, 0, true)
    directoryView.setUint32(42, offset, true)
    directory.set(nameBytes, 46)

    central.push(directory)
    offset += local.length + size
  }

  const centralSize = central.reduce((sum, part) => sum + part.length, 0)

  const end = new Uint8Array(22)
  const endView = new DataView(end.buffer)
  endView.setUint32(0, 0x06054b50, true)
  endView.setUint16(4, 0, true)
  endView.setUint16(6, 0, true)
  endView.setUint16(8, entries.length, true)
  endView.setUint16(10, entries.length, true)
  endView.setUint32(12, centralSize, true)
  endView.setUint32(16, offset, true)
  endView.setUint16(20, 0, true)

  return concat([...chunks, ...central, end])
}

// ── Bagian-bagian DOCX ──────────────────────────────────────────────────────

const CONTENT_TYPES =
  '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
  '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">' +
  '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>' +
  '<Default Extension="xml" ContentType="application/xml"/>' +
  '<Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>' +
  '<Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>' +
  '</Types>'

const ROOT_RELS =
  '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
  '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
  '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>' +
  '</Relationships>'

const DOCUMENT_RELS =
  '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
  '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
  '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>' +
  '</Relationships>'

const STYLES =
  '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
  '<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">' +
  '<w:docDefaults><w:rPrDefault><w:rPr>' +
  '<w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman" w:cs="Times New Roman" w:eastAsia="Times New Roman"/>' +
  '<w:sz w:val="22"/><w:szCs w:val="22"/>' +
  '</w:rPr></w:rPrDefault>' +
  '<w:pPrDefault><w:pPr><w:spacing w:after="0" w:line="240" w:lineRule="auto"/></w:pPr></w:pPrDefault>' +
  '</w:docDefaults></w:styles>'

const DOCX_MIME =
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document'

/** Penyusun dokumen Word sederhana: paragraf, tabel, dan pemisah halaman. */
export class DocxBuilder {
  private blocks: string[] = []

  paragraph(text: string, options: DocxParagraphOptions = {}): this {
    this.blocks.push(paragraphXml(text, options))
    return this
  }

  table(rows: DocxCell[][], options: DocxTableOptions): this {
    this.blocks.push(tableXml(rows, options))
    return this
  }

  pageBreak(): this {
    this.blocks.push('<w:p><w:r><w:br w:type="page"/></w:r></w:p>')
    return this
  }

  toBlob(): Blob {
    const documentXml =
      '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
      '<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">' +
      `<w:body>${this.blocks.join('')}${SECT_PR}</w:body></w:document>`

    const encoder = new TextEncoder()
    const zip = zipStore([
      { name: '[Content_Types].xml', data: encoder.encode(CONTENT_TYPES) },
      { name: '_rels/.rels', data: encoder.encode(ROOT_RELS) },
      {
        name: 'word/_rels/document.xml.rels',
        data: encoder.encode(DOCUMENT_RELS),
      },
      { name: 'word/document.xml', data: encoder.encode(documentXml) },
      { name: 'word/styles.xml', data: encoder.encode(STYLES) },
    ])

    return new Blob([zip as unknown as BlobPart], { type: DOCX_MIME })
  }
}

/** Mengunduh blob sebagai berkas di browser. */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
