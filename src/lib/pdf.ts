/**
 * Pembuat PDF minimal tanpa dependensi.
 *
 * Memakai font standar PDF (Helvetica / Helvetica-Bold, tidak di-embed) dan
 * menulis content stream sendiri: teks, garis tabel, dan pemisah halaman.
 * Semua teks disaring ke ASCII supaya aman dengan encoding WinAnsi.
 */

export type PdfAlign = 'left' | 'center' | 'right'

export type PdfTextOptions = {
  size?: number
  bold?: boolean
  align?: PdfAlign
  gapAfter?: number
}

export type PdfTableOptions = {
  /** Bobot lebar kolom; otomatis diskalakan ke lebar halaman. */
  widths: number[]
  alignments?: PdfAlign[]
  headerRow?: boolean
  borders?: boolean
  fontSize?: number
  lineHeight?: number
  padding?: number
}

const PAGE_W = 595
const PAGE_H = 842
const MARGIN = 56
const CONTENT_W = PAGE_W - MARGIN * 2

/** Lebar karakter Helvetica (per 1000 unit) untuk kode ASCII 32-126. */
const HELVETICA_WIDTHS = [
  278, 278, 355, 556, 556, 889, 667, 191, 333, 333, 389, 584, 278, 333, 278,
  278, 556, 556, 556, 556, 556, 556, 556, 556, 556, 556, 278, 278, 584, 584,
  584, 556, 1015, 667, 667, 722, 722, 667, 611, 778, 722, 278, 500, 667, 556,
  833, 722, 778, 667, 778, 722, 667, 611, 722, 667, 944, 667, 667, 611, 278,
  278, 278, 469, 556, 333, 556, 556, 500, 556, 556, 278, 556, 556, 222, 222,
  500, 222, 833, 556, 556, 556, 556, 333, 500, 278, 556, 500, 722, 500, 500,
  500, 334, 260, 334, 584,
]

const ASCII_MAP: Record<string, string> = {
  '\u2013': '-',
  '\u2014': '-',
  '\u2018': "'",
  '\u2019': "'",
  '\u201C': '"',
  '\u201D': '"',
  '\u2022': '-',
  '\u00B7': '-',
  '\u2026': '...',
}

function sanitize(text: string): string {
  let result = text

  for (const [from, to] of Object.entries(ASCII_MAP)) {
    result = result.split(from).join(to)
  }

  return result.replace(/[^\x20-\x7E]/g, ' ')
}

function charWidth(char: string): number {
  const code = char.charCodeAt(0)
  if (code < 32 || code > 126) return 556

  return HELVETICA_WIDTHS[code - 32]
}

function measure(text: string, size: number): number {
  let total = 0

  for (const char of sanitize(text)) total += charWidth(char)

  return (total / 1000) * size
}

function wrapText(text: string, maxWidth: number, size: number): string[] {
  const clean = sanitize(text).trim()
  if (!clean) return ['']

  const lines: string[] = []
  let current = ''

  for (const word of clean.split(/\s+/)) {
    const candidate = current ? `${current} ${word}` : word

    if (measure(candidate, size) <= maxWidth) {
      current = candidate
      continue
    }

    if (current) {
      lines.push(current)
    }

    if (measure(word, size) <= maxWidth) {
      current = word
      continue
    }

    // Kata lebih panjang dari kolom (mis. URL) dipotong per karakter.
    let chunk = ''
    for (const char of word) {
      if (chunk && measure(chunk + char, size) > maxWidth) {
        lines.push(chunk)
        chunk = ''
      }
      chunk += char
    }
    current = chunk
  }

  if (current) lines.push(current)

  return lines.length > 0 ? lines : ['']
}

function escapePdfText(text: string): string {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)')
}

export class PdfBuilder {
  private pages: string[][] = []
  private current: string[] = []
  private cursor = MARGIN

  text(content: string, options: PdfTextOptions = {}): this {
    const size = options.size ?? 10
    const bold = options.bold ?? false
    const align = options.align ?? 'left'
    const lineHeight = size * 1.35

    const lines = wrapText(content, CONTENT_W, size)

    for (const line of lines) {
      this.ensureSpace(lineHeight)

      const width = measure(line, size)
      let x = MARGIN
      if (align === 'center') x = MARGIN + (CONTENT_W - width) / 2
      if (align === 'right') x = MARGIN + CONTENT_W - width

      if (line) {
        this.drawText(line, x, this.cursor + size * 0.8, size, bold)
      }
      this.cursor += lineHeight
    }

    this.cursor += options.gapAfter ?? 0
    return this
  }

  table(rows: string[][], options: PdfTableOptions): this {
    const weights = options.widths
    const totalWeight = weights.reduce((sum, weight) => sum + weight, 0)
    const columns = weights.map((weight) => (weight / totalWeight) * CONTENT_W)

    const fontSize = options.fontSize ?? 9
    const lineHeight = options.lineHeight ?? 11
    const padding = options.padding ?? 3
    const borders = options.borders ?? true
    const alignments = options.alignments ?? []
    const headerRow = options.headerRow ?? true

    const drawRow = (row: string[], isHeader: boolean) => {
      const wrapped = row.map((cell, index) =>
        wrapText(cell, Math.max(columns[index] - padding * 2, 8), fontSize)
      )

      const height =
        Math.max(...wrapped.map((lines) => lines.length), 1) * lineHeight +
        padding * 2

      if (this.cursor + height > PAGE_H - MARGIN) {
        this.finishPage()

        // Ulangi baris header di halaman baru.
        if (headerRow && !isHeader && rows.length > 0) {
          drawRow(rows[0], true)
        }
      }

      let x = MARGIN

      for (let index = 0; index < row.length; index++) {
        const width = columns[index]
        const align = alignments[index] ?? 'left'

        if (borders) {
          this.current.push(
            `0.5 w 0.55 0.55 0.55 RG ${x} ${PAGE_H - this.cursor - height} ${width} ${height} re S`
          )
        }

        let baseline = this.cursor + padding + fontSize * 0.8

        for (const line of wrapped[index]) {
          if (line) {
            const lineWidth = measure(line, fontSize)
            let textX = x + padding
            if (align === 'center') {
              textX = x + (width - lineWidth) / 2
            }
            if (align === 'right') {
              textX = x + width - padding - lineWidth
            }

            this.drawText(line, textX, baseline, fontSize, isHeader)
          }
          baseline += lineHeight
        }

        x += width
      }

      this.cursor += height
    }

    for (let index = 0; index < rows.length; index++) {
      drawRow(rows[index], index === 0 && headerRow)
    }

    return this
  }

  spacer(height: number): this {
    this.cursor += height
    return this
  }

  toBlob(): Blob {
    this.finishPage()

    const pageCount = this.pages.length
    const contentStart = 3 + pageCount
    const regularFont = 3 + pageCount * 2
    const boldFont = regularFont + 1

    let pdf = '%PDF-1.4\n'
    const offsets: number[] = []

    const addObject = (id: number, body: string) => {
      offsets[id] = pdf.length
      pdf += `${id} 0 obj\n${body}\nendobj\n`
    }

    const kids = Array.from(
      { length: pageCount },
      (_, index) => `${3 + index} 0 R`
    ).join(' ')

    addObject(1, '<< /Type /Catalog /Pages 2 0 R >>')
    addObject(2, `<< /Type /Pages /Count ${pageCount} /Kids [${kids}] >>`)

    for (let index = 0; index < pageCount; index++) {
      const contentId = contentStart + index
      addObject(
        3 + index,
        `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PAGE_W} ${PAGE_H}] ` +
          `/Resources << /Font << /F1 ${regularFont} 0 R /F2 ${boldFont} 0 R >> >> ` +
          `/Contents ${contentId} 0 R >>`
      )
    }

    for (let index = 0; index < pageCount; index++) {
      const stream = this.pages[index].join('\n')
      addObject(
        contentStart + index,
        `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`
      )
    }

    addObject(
      regularFont,
      '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>'
    )
    addObject(
      boldFont,
      '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>'
    )

    const objectCount = boldFont
    const xrefOffset = pdf.length

    pdf += `xref\n0 ${objectCount + 1}\n`
    pdf += '0000000000 65535 f \n'

    for (let id = 1; id <= objectCount; id++) {
      pdf += `${String(offsets[id] ?? 0).padStart(10, '0')} 00000 n \n`
    }

    pdf += `trailer\n<< /Size ${objectCount + 1} /Root 1 0 R >>\n`
    pdf += `startxref\n${xrefOffset}\n%%EOF\n`

    return new Blob([pdf], { type: 'application/pdf' })
  }

  private drawText(
    text: string,
    x: number,
    baselineFromTop: number,
    size: number,
    bold: boolean
  ): void {
    const font = bold ? '/F2' : '/F1'
    const y = PAGE_H - baselineFromTop

    this.current.push(
      `BT ${font} ${size} Tf 1 0 0 1 ${x.toFixed(2)} ${y.toFixed(2)} Tm (${escapePdfText(sanitize(text))}) Tj ET`
    )
  }

  private ensureSpace(height: number): void {
    if (this.cursor + height > PAGE_H - MARGIN) {
      this.finishPage()
    }
  }

  private finishPage(): void {
    this.pages.push(this.current)
    this.current = []
    this.cursor = MARGIN
  }
}
