import { format } from 'date-fns'
import { type ExportColumn, exportToXlsx } from '@/lib/export'
import { type Team } from '@/features/teams/api/teams'
import { type Unit } from '@/features/units/api/units'
import { type Activity } from '../data/schema'

export type ActivityExportRow = {
  description: string
  date: string
  end_date: string | null
  start_time: string | null
  end_time: string | null
  volume: number | null
  unit_name: string
  team_name: string
  link_bukti_dukung: string | null
  status: string
}

export const ACTIVITY_EXPORT_COLUMNS: ExportColumn<ActivityExportRow>[] = [
  { key: 'description', header: 'Deskripsi' },
  { key: 'date', header: 'Tanggal' },
  { key: 'end_date', header: 'Tanggal Berakhir' },
  { key: 'start_time', header: 'Jam Mulai' },
  { key: 'end_time', header: 'Jam Selesai' },
  { key: 'volume', header: 'Volume' },
  { key: 'unit_name', header: 'Satuan' },
  { key: 'team_name', header: 'Tim' },
  { key: 'link_bukti_dukung', header: 'Link Bukti Dukung' },
  { key: 'status', header: 'Status' },
]

export function buildActivityExportRows(
  activities: Activity[],
  teams: Team[],
  units: Unit[]
): ActivityExportRow[] {
  return activities.map((activity) => ({
    description: activity.description,
    date: activity.date,
    end_date: activity.end_date,
    start_time: activity.start_time,
    end_time: activity.end_time,
    volume: activity.volume,
    unit_name: units.find((unit) => unit.id === activity.unit)?.name ?? '-',
    team_name: teams.find((team) => team.id === activity.assignor)?.name ?? '-',
    link_bukti_dukung: activity.link_bukti_dukung,
    status: activity.is_done ? 'Selesai' : 'Pending',
  }))
}

export function exportActivities(
  activities: Activity[],
  teams: Team[],
  units: Unit[],
  suffix = ''
) {
  exportToXlsx(
    buildActivityExportRows(activities, teams, units),
    `activities-${format(new Date(), 'yyyy-MM-dd')}${suffix}`,
    ACTIVITY_EXPORT_COLUMNS
  )
}
