import { CONTENT_WIDTH, DocxBuilder, type DocxCell } from '@/lib/docx'

export type ReportDocRow = {
  date: string
  time: string
  description: string
  volume: string
  unit: string
  team: string
  link: string
  status: string
}

export type ReportDocInput = {
  employeeName: string
  periodLabel: string
  kindLabel: string
  printedOn: string
  rows: ReportDocRow[]
  summary: {
    total: number
    done: number
    pending: number
    volumes: Array<{ unit: string; total: number }>
  }
}

/** Lebar kolom tabel kegiatan (twips, total = lebar area teks A4). */
const TABLE_WIDTHS = [380, 1200, 900, 2500, 560, 780, 950, 1600, 768]
const IDENTITY_WIDTHS = [900, 4500, 1000, 3238]
const SIGNATURE_WIDTHS = [
  Math.floor(CONTENT_WIDTH / 2),
  Math.ceil(CONTENT_WIDTH / 2),
]

const TABLE_HEADERS = [
  'No',
  'Tanggal',
  'Waktu',
  'Uraian Kegiatan',
  'Volume',
  'Satuan',
  'Tim',
  'Bukti Dukung',
  'Status',
]

/** Titik potong tambahan supaya URL panjang bisa turun baris di Word. */
function breakableLink(link: string): string {
  return link.replace(/\//g, '/\u200B').replace(/[?&]/g, (match) => `${match}\u200B`)
}

function headerCells(): DocxCell[] {
  return TABLE_HEADERS.map((text) => ({ text, align: 'center' }))
}

function bodyCells(row: ReportDocRow, index: number): DocxCell[] {
  return [
    { text: String(index + 1), align: 'center' },
    { text: row.date, align: 'center' },
    { text: row.time, align: 'center' },
    { text: row.description },
    { text: row.volume, align: 'right' },
    { text: row.unit },
    { text: row.team },
    { text: row.link ? breakableLink(row.link) : '-', size: 16 },
    { text: row.status, align: 'center' },
  ]
}

/** Menyusun dokumen DOCX rekap bulanan/triwulanan. */
export function buildReportDocx(input: ReportDocInput): Blob {
  const builder = new DocxBuilder()

  builder
    .paragraph('REKAPITULASI KEGIATAN PEGAWAI', {
      bold: true,
      align: 'center',
      size: 28,
      spaceAfter: 40,
    })
    .paragraph('BPS KABUPATEN BUOL', {
      bold: true,
      align: 'center',
      size: 24,
      spaceAfter: 200,
    })
    .table(
      [
        [
          { text: 'Nama', size: 22 },
          { text: `: ${input.employeeName}`, size: 22 },
          { text: 'Periode', size: 22 },
          { text: `: ${input.periodLabel}`, size: 22 },
        ],
        [
          { text: 'Jenis', size: 22 },
          { text: `: ${input.kindLabel}`, size: 22 },
          { text: 'Dicetak', size: 22 },
          { text: `: ${input.printedOn}`, size: 22 },
        ],
      ],
      { widths: IDENTITY_WIDTHS, borders: false }
    )
    .paragraph('', { spaceAfter: 160 })

  if (input.rows.length === 0) {
    builder.paragraph('Tidak ada kegiatan pada periode ini.', {
      align: 'center',
      size: 22,
      spaceAfter: 160,
    })
  } else {
    builder
      .table(
        [
          headerCells(),
          ...input.rows.map((row, index) => bodyCells(row, index)),
        ],
        { widths: TABLE_WIDTHS, headerRow: true }
      )
      .paragraph('', { spaceAfter: 160 })
  }

  builder.paragraph(
    `Jumlah kegiatan: ${input.summary.total} · Selesai: ${input.summary.done} · Belum: ${input.summary.pending}`,
    { size: 22, spaceAfter: 40 }
  )

  if (input.summary.volumes.length > 0) {
    builder.paragraph(
      `Total volume: ${input.summary.volumes
        .map((volume) => `${volume.total} ${volume.unit}`)
        .join(', ')}`,
      { size: 22, spaceAfter: 40 }
    )
  }

  builder
    .paragraph('', { spaceAfter: 400 })
    .table(
      [
        [
          { text: 'Mengetahui,', align: 'center', size: 22 },
          { text: `Buol, ${input.printedOn}`, align: 'center', size: 22 },
        ],
        [
          { text: 'Kepala BPS Kabupaten Buol', align: 'center', size: 22 },
          { text: 'Pegawai yang bersangkutan', align: 'center', size: 22 },
        ],
        [
          { text: '', align: 'center', size: 22 },
          { text: '', align: 'center', size: 22 },
        ],
        [
          { text: '', align: 'center', size: 22 },
          { text: '', align: 'center', size: 22 },
        ],
        [
          { text: '...............................', align: 'center', size: 22 },
          { text: input.employeeName, align: 'center', size: 22 },
        ],
      ],
      { widths: SIGNATURE_WIDTHS, borders: false }
    )

  return builder.toBlob()
}

export function reportFileName(
  input: ReportDocInput,
  extension: 'docx' | 'pdf' | 'xlsx' = 'docx'
): string {
  const slug = `${input.kindLabel}-${input.periodLabel}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

  return `rekap-${slug}.${extension}`
}
