import * as cheerio from 'cheerio'
import mammoth from 'mammoth'

export interface ParsedActivityRow {
  date: string
  startTime: string | null
  endTime: string | null
  description: string
  coordinates?: string
}

export interface ImportResult {
  success: boolean
  data: ParsedActivityRow[]
  errors: string[]
}

function parseTimeRange(timeStr: string): {
  startTime: string | null
  endTime: string | null
} {
  const cleaned = timeStr.replace(/\s+/g, '').trim()

  if (!cleaned) {
    return { startTime: null, endTime: null }
  }

  if (cleaned.includes('-')) {
    const [start, end] = cleaned.split('-')
    return {
      startTime: start && start.match(/\d+:\d+/) ? start : null,
      endTime: end && end.match(/\d+:\d+/) ? end : null,
    }
  }

  if (cleaned.includes('s/d')) {
    const parts = cleaned.split('s/d')
    return {
      startTime: parts[0] && parts[0].match(/\d+:\d+/) ? parts[0] : null,
      endTime: parts[1] && parts[1].match(/\d+:\d+/) ? parts[1] : null,
    }
  }

  if (cleaned.match(/\d+:\d+/)) {
    return { startTime: cleaned, endTime: null }
  }

  return { startTime: null, endTime: null }
}

function parseDate(dateStr: string): string {
  const cleaned = dateStr.trim()

  const formats = [
    { regex: /(\d{1,2})\/(\d{1,2})\/(\d{4})/, order: [3, 1, 2] },
    { regex: /(\d{1,2})-(\d{1,2})-(\d{4})/, order: [3, 1, 2] },
    { regex: /(\d{4})-(\d{1,2})-(\d{1,2})/, order: [1, 2, 3] },
    { regex: /(\d{1,2})\s+(\w+)\s+(\d{4})/, order: [3, 1, 2] },
  ]

  for (const format of formats) {
    const match = cleaned.match(format.regex)
    if (match) {
      const parts = format.order.map((i) => match[i].padStart(2, '0'))
      return `${parts[0]}-${parts[1]}-${parts[2]}`
    }
  }

  return cleaned
}

function isValidDate(dateStr: string): boolean {
  return /\d{4}-\d{2}-\d{2}/.test(dateStr)
}

function isCoordinateOnly(text: string): boolean {
  // Check if text is only coordinates (latitude, longitude pattern)
  return /^-?\d+\.\d+\s*,\s*\d+\.\d+/.test(text.trim())
}

function shouldSkipDescription(description: string): boolean {
  // Skip rows dengan deskripsi "Buat kehadiran/Presensi"
  const normalizedDesc = description.toLowerCase().trim()
  return (
    normalizedDesc === 'buat kehadiran/presensi' ||
    normalizedDesc === 'buat kehadiran / presensi' ||
    normalizedDesc === 'kehadiran' ||
    normalizedDesc === 'presensi'
  )
}

function extractTableData(htmlContent: string): ParsedActivityRow[] {
  const data: ParsedActivityRow[] = []
  const $ = cheerio.load(htmlContent)
  let lastDate = ''

  $('table').each((_index, element) => {
    const $table = $(element)
    const rows = $table.find('tr')

    if (rows.length < 2) return

    rows.each((rowIndex, element) => {
      if (rowIndex === 0) return

      const $row = $(element)
      const cells = $row.find('td, th')

      if (cells.length === 0) return

      const cellTexts = cells.map((_, cell) => $(cell).text().trim()).get()

      // Skip rows that only contain coordinates
      if (cellTexts.length === 1 && isCoordinateOnly(cellTexts[0])) {
        // Try to attach coordinates to last entry
        if (data.length > 0 && !data[data.length - 1].coordinates) {
          data[data.length - 1].coordinates = cellTexts[0]
        }
        return
      }

      // Skip empty or invalid rows
      if (cellTexts.length < 3) return

      let date = ''
      let time = ''
      let description = ''
      let coordinates = ''

      // Parse based on number of cells
      if (cellTexts.length >= 5) {
        // Full format: Date | Assignee | Time | Description | Coordinates
        date = parseDate(cellTexts[0])
        time = cellTexts[2]
        description = cellTexts[3]
        coordinates = cellTexts[4] || ''
      } else if (cellTexts.length === 4) {
        // Format: Date | Time | Description | Coordinates
        date = parseDate(cellTexts[0])
        time = cellTexts[1]
        description = cellTexts[2]
        coordinates = cellTexts[3] || ''
      } else if (cellTexts.length === 3) {
        // Check if first cell is a date
        const potentialDate = parseDate(cellTexts[0])
        if (isValidDate(potentialDate)) {
          // Format: Date | Time | Description
          date = potentialDate
          time = cellTexts[1]
          description = cellTexts[2]
        } else {
          // Format: Time | Description | Coordinates (continuation from last date)
          time = cellTexts[0]
          description = cellTexts[1]
          coordinates = cellTexts[2]
          date = lastDate
        }
      }

      // Update last known date
      if (isValidDate(date)) {
        lastDate = date
      } else if (!lastDate) {
        lastDate = new Date().toISOString().split('T')[0]
      }

      // Skip rows without description or with only coordinates
      if (
        !description ||
        description.length === 0 ||
        isCoordinateOnly(description) ||
        shouldSkipDescription(description)
      ) {
        return
      }

      const { startTime, endTime } = parseTimeRange(time)

      // Final check before adding
      if (!shouldSkipDescription(description)) {
        data.push({
          date: lastDate,
          startTime,
          endTime,
          description,
          coordinates: coordinates || undefined,
        })
      }
    })
  })

  return data
}

function extractLineData(htmlContent: string): ParsedActivityRow[] {
  const data: ParsedActivityRow[] = []
  const lines = htmlContent
    .split('\n')
    .map((line) => line.replace(/<[^>]*>/g, '').trim())
    .filter((line) => line.length > 0)

  let currentDate = ''

  for (const line of lines) {
    const dateMatch = line.match(/\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}/)
    if (dateMatch) {
      currentDate = parseDate(dateMatch[0])
      continue
    }

    const timeMatches = line.match(/\d{1,2}:\d{2}/g)
    if (timeMatches && timeMatches.length > 0) {
      const { startTime, endTime } = parseTimeRange(timeMatches.join('-'))
      const desc = line
        .replace(/\d{1,2}:\d{2}/g, '')
        .replace(/[^\w\s\-]/g, '')
        .trim()

      if (desc && desc.length > 0 && !shouldSkipDescription(desc)) {
        data.push({
          date: currentDate || new Date().toISOString().split('T')[0],
          startTime,
          endTime,
          description: desc,
        })
      }
    }
  }

  return data
}

export async function parseDocxFromBuffer(
  buffer: ArrayBuffer
): Promise<ImportResult> {
  const result: ImportResult = {
    success: false,
    data: [],
    errors: [],
  }

  try {
    let htmlContent = ''

    try {
      const mammothResult = await mammoth.convertToHtml({ arrayBuffer: buffer })
      htmlContent = mammothResult.value

      if (mammothResult.messages && mammothResult.messages.length > 0) {
        const warnings = mammothResult.messages
          .filter((m) => m.type === 'warning')
          .map((m) => m.message)
        if (warnings.length > 0) {
          result.errors.push(...warnings)
        }
      }
    } catch (mammothError) {
      result.errors.push(
        `Failed to convert DOCX: ${mammothError instanceof Error ? mammothError.message : 'Unknown error'}`
      )
      return result
    }

    if (!htmlContent || !htmlContent.trim()) {
      result.errors.push('Document is empty or could not be read')
      return result
    }

    let parsedData: ParsedActivityRow[] = []

    const tableData = extractTableData(htmlContent)
    if (tableData.length > 0) {
      parsedData = tableData
    } else {
      const lineData = extractLineData(htmlContent)
      if (lineData.length > 0) {
        parsedData = lineData
      }
    }

    if (parsedData.length === 0) {
      result.errors.push(
        'No valid data found. Make sure the document contains a table or formatted dates and times.'
      )
    }

    result.data = parsedData
    result.success = parsedData.length > 0
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error occurred'
    result.errors.push(`Error processing document: ${errorMessage}`)
  }

  return result
}

export async function parseDocxFromFile(file: File): Promise<ImportResult> {
  try {
    const buffer = await file.arrayBuffer()
    return parseDocxFromBuffer(buffer)
  } catch (error) {
    return {
      success: false,
      data: [],
      errors: [
        `Failed to read file: ${error instanceof Error ? error.message : 'Unknown error'}`,
      ],
    }
  }
}

export async function parseDocxFromPath(
  filePath: string
): Promise<ImportResult> {
  try {
    const fs = await import('fs')
    const buffer = fs.readFileSync(filePath).buffer
    return parseDocxFromBuffer(buffer)
  } catch (error) {
    return {
      success: false,
      data: [],
      errors: [
        `Failed to read file from path: ${error instanceof Error ? error.message : 'Unknown error'}`,
      ],
    }
  }
}

export function convertParsedToActivityInput(
  parsed: ParsedActivityRow,
  userId: string
): {
  description: string
  date: string
  end_date: string | null
  start_time: string | null
  end_time: string | null
  volume: number | null
  unit: number | null
  assignor: number | null
  is_done: boolean
  user_id: string
  link_bukti_dukung: string | null
  coordinates: string | null
} {
  return {
    description: parsed.description,
    date: parsed.date,
    end_date: null,
    start_time: parsed.startTime,
    end_time: parsed.endTime,
    volume: null,
    unit: null,
    assignor: null,
    is_done: false,
    user_id: userId,
    link_bukti_dukung: null,
    coordinates: parsed.coordinates || null,
  }
}
