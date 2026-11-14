import mammoth from 'mammoth'
import assert from 'node:assert/strict'
import { test } from 'node:test'
import { DocxBuilder } from './docx.ts'

test('Mammoth reads application-generated DOCX with Unicode and table content', async () => {
  const blob = new DocxBuilder()
    .paragraph('Rekap kegiatan café & data <uji>')
    .table(
      [
        [{ text: 'Tanggal' }, { text: 'Uraian Kegiatan' }],
        [{ text: '14 November 2026' }, { text: 'Pemeriksaan 12 dokumen' }],
      ],
      { widths: [2000, 7638], headerRow: true }
    )
    .toBlob()
  const result = await mammoth.convertToHtml({
    buffer: Buffer.from(await blob.arrayBuffer()),
  })
  assert.match(result.value, /Rekap kegiatan café &amp; data &lt;uji&gt;/)
  assert.match(result.value, /<table>/)
  assert.match(result.value, /Pemeriksaan 12 dokumen/)
  assert(!result.messages.some((message) => message.type === 'error'))
})
