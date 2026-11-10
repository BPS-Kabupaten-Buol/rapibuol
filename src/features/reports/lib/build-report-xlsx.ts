import * as XLSX from 'xlsx'
import { type ReportDocInput } from './build-report-docx'

const HEADERS = [
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

const COLUMN_WIDTHS = [6, 14, 10, 42, 8, 12, 16, 46, 10]

/** Isi lembar kerja rekap dalam bentuk baris-kolom (tanpa format). */
export function buildReportAoa(
  input: ReportDocInput
): Array<Array<string | number>> {
  const rows: Array<Array<string | number>> = [
    ['REKAPITULASI KEGIATAN PEGAWAI'],
    ['BPS KABUPATEN BUOL'],
    [],
    ['Nama', input.employeeName],
    ['Periode', `${input.periodLabel} (${input.kindLabel})`],
    ['Dicetak', input.printedOn],
    [],
    HEADERS,
  ]

  if (input.rows.length === 0) {
    rows.push(['Tidak ada kegiatan pada periode ini.'])
  } else {
    input.rows.forEach((row, index) => {
      rows.push([
        index + 1,
        row.date,
        row.time,
        row.description,
        row.volume,
        row.unit,
        row.team,
        row.link || '-',
        row.status,
      ])
    })
  }

  rows.push([])
  rows.push([
    'Jumlah kegiatan',
    input.summary.total,
    'Selesai',
    input.summary.done,
    'Belum',
    input.summary.pending,
  ])

  for (const volume of input.summary.volumes) {
    rows.push(['Total volume', volume.total, volume.unit])
  }

  return rows
}

/** Menyusun berkas XLSX rekap bulanan/triwulanan. */
export function buildReportXlsx(input: ReportDocInput): Blob {
  const worksheet = XLSX.utils.aoa_to_sheet(buildReportAoa(input))

  worksheet['!cols'] = COLUMN_WIDTHS.map((width) => ({ wch: width }))
  worksheet['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: HEADERS.length - 1 } },
    { s: { r: 1, c: 0 }, e: { r: 1, c: HEADERS.length - 1 } },
  ]

  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Rekap')

  const buffer = XLSX.write(workbook, {
    type: 'array',
    bookType: 'xlsx',
  }) as ArrayBuffer

  return new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  })
}
