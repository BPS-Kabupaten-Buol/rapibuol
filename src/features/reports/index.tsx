import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { format, parseISO } from 'date-fns'
import { id as localeId } from 'date-fns/locale'
import { Download } from 'lucide-react'
import { downloadBlob } from '@/lib/docx'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/context/auth-provider'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ConfigDrawer } from '@/components/config-drawer'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { NotificationBell } from '@/components/notification-bell'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { getActivities } from '@/features/activities/api/activities'
import { getTeams } from '@/features/teams/api/teams'
import { getUnits } from '@/features/units/api/units'
import {
  buildReport,
  getReportKindLabel,
  getReportLabel,
  getReportRange,
  type ReportKind,
  type ReportPeriod,
} from './lib/report-period'
import {
  buildReportDocx,
  reportFileName,
  type ReportDocRow,
} from './lib/build-report-docx'
import { buildReportPdf } from './lib/build-report-pdf'
import { buildReportXlsx } from './lib/build-report-xlsx'

const MONTH_LABELS = [
  'Januari',
  'Februari',
  'Maret',
  'April',
  'Mei',
  'Juni',
  'Juli',
  'Agustus',
  'September',
  'Oktober',
  'November',
  'Desember',
]

const QUARTER_LABELS = ['Triwulan I', 'Triwulan II', 'Triwulan III', 'Triwulan IV']

type ReportProfileRow = {
  name: string | null
  email: string | null
}

export function ReportsPage() {
  const { user } = useAuth()
  const userId = user?.id
  const currentYear = new Date().getFullYear()
  const currentMonth = new Date().getMonth() + 1

  const [kind, setKind] = useState<ReportKind>('monthly')
  const [month, setMonth] = useState(currentMonth)
  const [quarter, setQuarter] = useState(Math.floor((currentMonth - 1) / 3) + 1)
  const [year, setYear] = useState(currentYear)

  const { data: activities = [], isLoading } = useQuery({
    queryKey: ['activities', userId],
    queryFn: () => getActivities(userId),
    enabled: !!userId,
  })

  const { data: units = [] } = useQuery({
    queryKey: ['units'],
    queryFn: getUnits,
  })

  const { data: teams = [] } = useQuery({
    queryKey: ['teams', 'options'],
    queryFn: getTeams,
  })

  const { data: profile } = useQuery({
    queryKey: ['profile-basic', userId],
    queryFn: async (): Promise<ReportProfileRow | null> => {
      if (!userId) return null
      const { data } = await supabase
        .from('profiles')
        .select('name, email')
        .eq('id', userId)
        .single()
      return (data as ReportProfileRow) ?? null
    },
    enabled: !!userId,
  })

  const period = useMemo<ReportPeriod>(
    () =>
      kind === 'monthly'
        ? { kind, year, month }
        : { kind, year, quarter },
    [kind, year, month, quarter]
  )

  const range = useMemo(() => getReportRange(period), [period])

  const report = useMemo(
    () =>
      buildReport(activities, range, (unitId) =>
        unitId ? (units.find((unit) => unit.id === unitId)?.name ?? '') : ''
      ),
    [activities, range, units]
  )

  const availableYears = useMemo(() => {
    const years = new Set<number>([currentYear])

    for (const activity of activities) {
      const startYear = Number(activity.date.slice(0, 4))
      if (startYear > 1900) years.add(startYear)

      if (activity.end_date) {
        const endYear = Number(activity.end_date.slice(0, 4))
        if (endYear > 1900) years.add(endYear)
      }
    }

    return Array.from(years).sort((a, b) => b - a)
  }, [activities, currentYear])

  const periodLabel = getReportLabel(period)
  const kindLabel = getReportKindLabel(period)
  const printedOn = format(new Date(), 'd MMMM yyyy', { locale: localeId })

  const teamName = (assignor: number | null) =>
    assignor ? (teams.find((team) => team.id === assignor)?.name ?? '-') : '-'

  const handleDownload = (target: 'docx' | 'pdf' | 'xlsx') => {
    const rows: ReportDocRow[] = report.rows.map((activity) => ({
      date: format(parseISO(activity.date), 'd MMM yyyy', { locale: localeId }),
      time: activity.start_time
        ? `${activity.start_time.slice(0, 5)}${activity.end_time ? `–${activity.end_time.slice(0, 5)}` : ''}`
        : '-',
      description: activity.description,
      volume: activity.volume ? String(activity.volume) : '-',
      unit: activity.unit
        ? (units.find((unit) => unit.id === activity.unit)?.name ?? '-')
        : '-',
      team: teamName(activity.assignor),
      link: activity.link_bukti_dukung ?? '',
      status: activity.is_done ? 'Selesai' : 'Belum',
    }))

    const input = {
      employeeName: profile?.name ?? '-',
      periodLabel,
      kindLabel,
      printedOn,
      rows,
      summary: report.summary,
    }

    const blob =
      target === 'docx'
        ? buildReportDocx(input)
        : target === 'pdf'
          ? buildReportPdf(input)
          : buildReportXlsx(input)

    downloadBlob(blob, reportFileName(input, target))
  }

  return (
    <>
      <Header fixed data-print='hide'>
        <Search />
        <div className='ms-auto flex items-center space-x-4'>
          <NotificationBell />
          <ThemeSwitch />
          <ConfigDrawer />
          <ProfileDropdown />
        </div>
      </Header>

      <Main data-print='page' className='flex flex-1 flex-col gap-4 sm:gap-6'>
        <div className='flex flex-wrap items-end justify-between gap-3 no-print'>
          <div>
            <h2 className='text-2xl font-bold tracking-tight'>Laporan</h2>
            <p className='text-muted-foreground'>
              Rekap kegiatan bulanan atau triwulanan, siap dicetak.
            </p>
          </div>
          <div className='flex gap-2'>
            <Button
              variant='outline'
              className='gap-1'
              onClick={() => handleDownload('docx')}
            >
              <Download className='h-4 w-4' />
              DOCX
            </Button>
            <Button
              variant='outline'
              className='gap-1'
              onClick={() => handleDownload('xlsx')}
            >
              <Download className='h-4 w-4' />
              Excel
            </Button>
            <Button className='gap-1' onClick={() => handleDownload('pdf')}>
              <Download className='h-4 w-4' />
              PDF
            </Button>
          </div>
        </div>

        <div className='flex flex-wrap items-center gap-2 no-print'>
          <Select value={kind} onValueChange={(value) => setKind(value as ReportKind)}>
            <SelectTrigger size='sm' className='h-8 w-[8.5rem] text-xs'>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='monthly'>Bulanan</SelectItem>
              <SelectItem value='quarterly'>Triwulanan</SelectItem>
            </SelectContent>
          </Select>

          {kind === 'monthly' ? (
            <Select
              value={String(month)}
              onValueChange={(value) => setMonth(Number(value))}
            >
              <SelectTrigger size='sm' className='h-8 w-[8.75rem] text-xs'>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MONTH_LABELS.map((label, index) => (
                  <SelectItem key={label} value={String(index + 1)}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <Select
              value={String(quarter)}
              onValueChange={(value) => setQuarter(Number(value))}
            >
              <SelectTrigger size='sm' className='h-8 w-[8.75rem] text-xs'>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {QUARTER_LABELS.map((label, index) => (
                  <SelectItem key={label} value={String(index + 1)}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          <Select
            value={String(year)}
            onValueChange={(value) => setYear(Number(value))}
          >
            <SelectTrigger size='sm' className='h-8 w-[5.5rem] text-xs'>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {availableYears.map((option) => (
                <SelectItem key={option} value={String(option)}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className='mx-auto w-full max-w-[210mm] bg-white p-6 text-black shadow-sm sm:p-10 print:max-w-none print:p-0 print:shadow-none'>
          <div className='text-center'>
            <h1 className='text-base font-bold tracking-wide uppercase'>
              Rekapitulasi Kegiatan Pegawai
            </h1>
            <p className='text-sm'>BPS Kabupaten Buol</p>
          </div>

          <div className='mt-6 flex flex-wrap justify-between gap-x-6 gap-y-1 text-sm'>
            <p>
              <span className='inline-block w-16'>Nama</span>: {profile?.name ?? '-'}
            </p>
            <p>
              <span className='inline-block w-16'>Periode</span>: {periodLabel}
            </p>
            <p>
              <span className='inline-block w-16'>Jenis</span>: {kindLabel}
            </p>
            <p>
              <span className='inline-block w-16'>Dicetak</span>: {printedOn}
            </p>
          </div>

          <table className='mt-4 w-full table-fixed border-collapse text-[11px] sm:text-[12px]'>
            <colgroup>
              <col style={{ width: '4%' }} />
              <col style={{ width: '12%' }} />
              <col style={{ width: '9%' }} />
              <col style={{ width: '26%' }} />
              <col style={{ width: '6%' }} />
              <col style={{ width: '8%' }} />
              <col style={{ width: '10%' }} />
              <col style={{ width: '18%' }} />
              <col style={{ width: '7%' }} />
            </colgroup>
            <thead>
              <tr>
                <th className='border border-black/30 px-1 py-1'>No</th>
                <th className='border border-black/30 px-1 py-1'>Tanggal</th>
                <th className='border border-black/30 px-1 py-1'>Waktu</th>
                <th className='border border-black/30 px-1 py-1 text-left'>
                  Uraian Kegiatan
                </th>
                <th className='border border-black/30 px-1 py-1'>Volume</th>
                <th className='border border-black/30 px-1 py-1'>Satuan</th>
                <th className='border border-black/30 px-1 py-1'>Tim</th>
                <th className='border border-black/30 px-1 py-1'>
                  Bukti Dukung
                </th>
                <th className='border border-black/30 px-1 py-1'>Status</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td
                    colSpan={9}
                    className='border border-black/30 px-2 py-6 text-center'
                  >
                    Memuat data...
                  </td>
                </tr>
              ) : report.rows.length === 0 ? (
                <tr>
                  <td
                    colSpan={9}
                    className='border border-black/30 px-2 py-6 text-center'
                  >
                    Tidak ada kegiatan pada periode ini.
                  </td>
                </tr>
              ) : (
                report.rows.map((activity, index) => {
                  const unit = activity.unit
                    ? (units.find((item) => item.id === activity.unit)?.name ??
                      '-')
                    : '-'

                  return (
                    <tr key={activity.id} className='print-avoid-break'>
                      <td className='border border-black/30 px-1 py-1 text-center tabular-nums'>
                        {index + 1}
                      </td>
                      <td className='border border-black/30 px-1 py-1 break-words'>
                        {format(parseISO(activity.date), 'd MMM yyyy', {
                          locale: localeId,
                        })}
                      </td>
                      <td className='border border-black/30 px-1 py-1 break-words tabular-nums'>
                        {activity.start_time?.slice(0, 5) ?? '-'}
                        {activity.end_time
                          ? `–${activity.end_time.slice(0, 5)}`
                          : ''}
                      </td>
                      <td className='border border-black/30 px-1 py-1 break-words'>
                        {activity.description}
                      </td>
                      <td className='border border-black/30 px-1 py-1 text-right tabular-nums'>
                        {activity.volume ?? '-'}
                      </td>
                      <td className='border border-black/30 px-1 py-1'>
                        {unit}
                      </td>
                      <td className='border border-black/30 px-1 py-1'>
                        {teamName(activity.assignor)}
                      </td>
                      <td className='border border-black/30 px-1 py-1 text-[10px] break-all'>
                        {activity.link_bukti_dukung || '-'}
                      </td>
                      <td className='border border-black/30 px-1 py-1'>
                        {activity.is_done ? 'Selesai' : 'Belum'}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>

          <div className='mt-4 space-y-1 text-sm'>
            <p>
              Jumlah kegiatan: <strong>{report.summary.total}</strong> · Selesai:{' '}
              {report.summary.done} · Belum: {report.summary.pending}
            </p>
            {report.summary.volumes.length > 0 && (
              <p>
                Total volume:{' '}
                {report.summary.volumes
                  .map((volume) => `${volume.total} ${volume.unit}`)
                  .join(', ')}
              </p>
            )}
          </div>

          <div className='mt-12 flex justify-between gap-8 text-sm print-avoid-break'>
            <div className='text-center'>
              <p>Mengetahui,</p>
              <p>Kepala BPS Kabupaten Buol</p>
              <p className='mt-16'>...............................</p>
            </div>
            <div className='text-center'>
              <p>Buol, {printedOn}</p>
              <p>Pegawai yang bersangkutan</p>
              <p className='mt-16'>
                {profile?.name ?? '...............................'}
              </p>
            </div>
          </div>
        </div>
      </Main>
    </>
  )
}
