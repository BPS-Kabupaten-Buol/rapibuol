import { format } from 'date-fns'
import * as XLSX from 'xlsx'

type ExportColumn<T> = {
  key: keyof T
  header: string
}

export function exportToXlsx<T>(
  data: T[],
  filename: string,
  columns: ExportColumn<T>[]
) {
  const worksheetData = data.map((row) => {
    const newRow: Record<string, unknown> = {}
    columns.forEach(({ key, header }) => {
      let value = (row as Record<string, unknown>)[key as string]
      if (value === null || value === undefined) {
        value = '-'
      } else if (value instanceof Date) {
        value = format(value, 'PPP')
      } else if (typeof value === 'object') {
        value = JSON.stringify(value)
      }
      newRow[header] = value
    })
    return newRow
  })

  const worksheet = XLSX.utils.json_to_sheet(worksheetData)
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Data')

  const colWidths = columns.map(({ header }) => ({
    wch: Math.max(header.length, 15),
  }))
  worksheet['!cols'] = colWidths

  XLSX.writeFile(workbook, `${filename}.xlsx`)
}
