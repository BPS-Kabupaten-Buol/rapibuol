import { PdfBuilder, type PdfAlign } from '@/lib/pdf'
import { type ReportDocInput } from './build-report-docx'

/** Bobot lebar kolom tabel kegiatan (relatif, total diskalakan ke halaman). */
const PDF_WIDTHS = [380, 1200, 900, 2500, 560, 780, 950, 1600, 768]

const PDF_ALIGNMENTS: PdfAlign[] = [
  'center',
  'center',
  'center',
  'left',
  'right',
  'left',
  'left',
  'left',
  'center',
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

/** Menyusun PDF rekap bulanan/triwulanan. */
export function buildReportPdf(input: ReportDocInput): Blob {
  const pdf = new PdfBuilder()

  pdf.text('REKAPITULASI KEGIATAN PEGAWAI', {
    size: 14,
    bold: true,
    align: 'center',
    gapAfter: 2,
  })
  pdf.text('BPS KABUPATEN BUOL', {
    size: 12,
    bold: true,
    align: 'center',
    gapAfter: 12,
  })

  pdf.text(`Nama      : ${input.employeeName}`, { size: 10, gapAfter: 1 })
  pdf.text(`Periode   : ${input.periodLabel} (${input.kindLabel})`, {
    size: 10,
    gapAfter: 1,
  })
  pdf.text(`Dicetak   : ${input.printedOn}`, { size: 10, gapAfter: 10 })

  if (input.rows.length === 0) {
    pdf.text('Tidak ada kegiatan pada periode ini.', {
      size: 10,
      align: 'center',
      gapAfter: 8,
    })
  } else {
    const rows = [
      TABLE_HEADERS,
      ...input.rows.map((row, index) => [
        String(index + 1),
        row.date,
        row.time,
        row.description,
        row.volume,
        row.unit,
        row.team,
        row.link || '-',
        row.status,
      ]),
    ]

    pdf.table(rows, {
      widths: PDF_WIDTHS,
      alignments: PDF_ALIGNMENTS,
      headerRow: true,
      fontSize: 7.5,
      lineHeight: 9,
      padding: 2,
    })
  }

  pdf.spacer(8)
  pdf.text(
    `Jumlah kegiatan: ${input.summary.total} - Selesai: ${input.summary.done} - Belum: ${input.summary.pending}`,
    { size: 10, gapAfter: 1 }
  )

  if (input.summary.volumes.length > 0) {
    pdf.text(
      `Total volume: ${input.summary.volumes
        .map((volume) => `${volume.total} ${volume.unit}`)
        .join(', ')}`,
      { size: 10, gapAfter: 1 }
    )
  }

  pdf.spacer(28)
  pdf.table(
    [
      ['Mengetahui,', `Buol, ${input.printedOn}`],
      ['Kepala BPS Kabupaten Buol', 'Pegawai yang bersangkutan'],
      ['', ''],
      ['', ''],
      ['(............................)', `(${input.employeeName})`],
    ],
    {
      widths: [1, 1],
      alignments: ['center', 'center'],
      headerRow: false,
      borders: false,
      fontSize: 10,
      lineHeight: 14,
      padding: 0,
    }
  )

  return pdf.toBlob()
}
