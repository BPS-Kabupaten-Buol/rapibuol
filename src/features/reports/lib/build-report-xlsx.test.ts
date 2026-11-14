import assert from 'node:assert/strict'
import { test } from 'node:test'
import * as XLSX from 'xlsx'
import type { ReportDocInput } from './build-report-docx'
import { buildReportXlsx } from './build-report-xlsx.ts'

const report: ReportDocInput = {
  employeeName: 'Pegawai uji',
  periodLabel: 'November 2026',
  kindLabel: 'Bulanan',
  printedOn: '14 November 2026',
  rows: [
    {
      date: '14 November 2026',
      time: '08:00–09:00',
      description: 'Verifikasi data café & hasil kegiatan',
      volume: '12',
      unit: 'Dokumen',
      team: 'Tim uji',
      link: 'https://example.com/bukti?id=1&jenis=data',
      status: 'Selesai',
    },
  ],
  summary: {
    total: 1,
    done: 1,
    pending: 0,
    volumes: [{ unit: 'Dokumen', total: 12 }],
  },
}

test('exported report reopens with identity, rows, summary, and merged headings', async () => {
  const blob = buildReportXlsx(report)
  assert.equal(
    blob.type,
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  )
  const workbook = XLSX.read(await blob.arrayBuffer(), { type: 'array' })
  assert.deepEqual(workbook.SheetNames, ['Rekap'])
  const sheet = workbook.Sheets.Rekap
  assert.equal(sheet.A1.v, 'REKAPITULASI KEGIATAN PEGAWAI')
  assert.equal(sheet.B4.v, report.employeeName)
  assert.equal(sheet.D9.v, report.rows[0].description)
  assert.equal(sheet.H9.v, report.rows[0].link)
  assert.equal(sheet.B11.v, 1)
  assert.equal(sheet.D11.v, 1)
  assert.equal(sheet.B12.v, 12)
  assert.equal(sheet['!merges']?.length, 2)
})

test('empty report keeps its empty message and zero summary', async () => {
  const blob = buildReportXlsx({
    ...report,
    rows: [],
    summary: { total: 0, done: 0, pending: 0, volumes: [] },
  })
  const sheet = XLSX.read(await blob.arrayBuffer(), { type: 'array' }).Sheets
    .Rekap
  assert.equal(sheet.A9.v, 'Tidak ada kegiatan pada periode ini.')
  assert.equal(sheet.B11.v, 0)
})

test('activity text beginning with equals remains text rather than a formula', async () => {
  const description = '=SUM(1,2)'
  const blob = buildReportXlsx({
    ...report,
    rows: [{ ...report.rows[0], description }],
  })
  const sheet = XLSX.read(await blob.arrayBuffer(), { type: 'array' }).Sheets
    .Rekap
  assert.equal(sheet.D9.v, description)
  assert.equal(sheet.D9.t, 's')
  assert.equal(sheet.D9.f, undefined)
})
