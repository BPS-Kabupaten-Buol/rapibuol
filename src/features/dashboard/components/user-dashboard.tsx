import { useMemo, useState } from 'react'
import {
  format,
  parseISO,
  startOfMonth,
  endOfMonth,
  subMonths,
  startOfWeek,
  endOfWeek,
} from 'date-fns'
import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { Activity, Target } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { buildActivityOverlapOr } from '@/features/activities/lib/activity-date-range'
import { countActivitiesPerDay } from '@/features/activities/lib/count-activities-per-day'
import { ActivityHeatmap } from './activity-heatmap'

const MONTH_NAMES = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember']

type Period = 'today' | 'week' | 'month' | 'custom-month'

type PeriodTask = {
  id: number
  description: string
  start_time: string | null
  end_time: string | null
  volume: number | null
  is_done: boolean
  unit: { name: string } | null
}

function getInitials(name?: string | null): string {
  if (!name) return '?'
  const initials = name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('')
  return initials || '?'
}

export default function UserDashboard({ userId }: { userId: string }) {
  const currentYear = new Date().getFullYear()
  const [period, setPeriod] = useState<Period>('today')
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth())
  const [selectedYear, setSelectedYear] = useState<number>(currentYear)
  // 1. Fetch Profile & Role
  const { data: profile, isLoading: isLoadingProfile } = useQuery({
    queryKey: ['profile', userId],
    queryFn: async () => {
      const { data } = await supabase
        .from('profiles')
        .select(`*, users_roles(roles(name))`)
        .eq('id', userId)
        .single()
      return data
    },
  })

  // 2. Fetch Stats
  const { data: stats, isLoading: isLoadingStats } = useQuery({
    queryKey: ['stats', userId, period, selectedMonth, selectedYear],
    queryFn: async () => {
      const today = new Date()
      let start: Date
      let end: Date

      if (period === 'today') {
        start = today
        end = today
      } else if (period === 'week') {
        start = startOfWeek(today, { weekStartsOn: 1 })
        end = endOfWeek(today, { weekStartsOn: 1 })
      } else if (period === 'custom-month') {
        const customDate = new Date(selectedYear, selectedMonth, 1)
        start = startOfMonth(customDate)
        end = endOfMonth(customDate)
      } else {
        start = startOfMonth(today)
        end = endOfMonth(today)
      }

      const startStr = format(start, 'yyyy-MM-dd')
      const endStr = format(end, 'yyyy-MM-dd')

      const [periodCountRes, doneRes] = await Promise.all([
        supabase
          .from('activities')
          .select('id', { count: 'exact' })
          .eq('user_id', userId)
          .lte('date', endStr)
          .or(buildActivityOverlapOr(startStr)),
        supabase
          .from('activities')
          .select('id', { count: 'exact' })
          .eq('user_id', userId)
          .eq('is_done', true)
          .lte('date', endStr)
          .or(buildActivityOverlapOr(startStr)),
      ])

      const periodCount = periodCountRes.count || 0
      const doneCount = doneRes.count || 0
      const dayCount =
        Math.round((Date.parse(endStr) - Date.parse(startStr)) / 86_400_000) + 1
      const weekCount = Math.max(1, dayCount / 7)
      const avgTasks = (periodCount / weekCount).toFixed(1)

      return {
        periodCount,
        doneCount,
        avgTasks,
        periodLabel:
          period === 'today'
            ? 'Hari Ini'
            : period === 'week'
              ? 'Minggu Ini'
              : period === 'custom-month'
                ? `${MONTH_NAMES[selectedMonth]} ${selectedYear}`
                : 'Bulan Ini',
      }
    },
  })

  // 3. Fetch Heatmap Data (3 bulan terakhir)
  const heatmapStartStr = format(subMonths(new Date(), 3), 'yyyy-MM-dd')
  const heatmapStart = parseISO(heatmapStartStr)
  const todayStr = format(new Date(), 'yyyy-MM-dd')
  const { data: heatmapData, isLoading: isLoadingHeatmap } = useQuery({
    queryKey: ['heatmap', userId, heatmapStartStr, todayStr],
    queryFn: async () => {
      const { data } = await supabase
        .from('activities')
        .select('id, date, end_date')
        .eq('user_id', userId)
        .lte('date', todayStr)
        .or(buildActivityOverlapOr(heatmapStartStr))

      return countActivitiesPerDay(data ?? [], heatmapStartStr, todayStr)
    },
  })

  const heatmapTotal = useMemo(
    () =>
      Object.values(heatmapData ?? {}).reduce((sum, count) => sum + count, 0),
    [heatmapData]
  )

  const heatmapActiveDays = useMemo(
    () => Object.values(heatmapData ?? {}).filter((count) => count > 0).length,
    [heatmapData]
  )

  // 4. Fetch Tasks based on period
  const { data: periodTasks, isLoading: isLoadingTasks } = useQuery({
    queryKey: ['tasks_period', userId, period, selectedMonth, selectedYear],
    queryFn: async () => {
      const today = new Date()
      let start: Date
      let end: Date

      if (period === 'today') {
        start = today
        end = today
      } else if (period === 'week') {
        start = startOfWeek(today, { weekStartsOn: 1 })
        end = endOfWeek(today, { weekStartsOn: 1 })
      } else if (period === 'custom-month') {
        const customDate = new Date(selectedYear, selectedMonth, 1)
        start = startOfMonth(customDate)
        end = endOfMonth(customDate)
      } else {
        start = startOfMonth(today)
        end = endOfMonth(today)
      }

      const startStr = format(start, 'yyyy-MM-dd')
      const endStr = format(end, 'yyyy-MM-dd')

      const { data } = await supabase
        .from('activities')
        .select(`*, unit:unit_measurement(name), assignor_team:teams(name)`)
        .eq('user_id', userId)
        .lte('date', endStr)
        .or(buildActivityOverlapOr(startStr))
      return (data ?? []) as unknown as PeriodTask[]
    },
  })

  return (
    <div className='flex flex-col gap-6 p-1'>
      {/* Header */}
      <div className='flex flex-col items-start justify-between gap-4 rounded-lg border bg-card p-6 shadow-sm sm:flex-row sm:items-center'>
        <div className='flex items-center gap-4'>
          <Avatar className='h-16 w-16'>
            <AvatarFallback>{getInitials(profile?.name)}</AvatarFallback>
          </Avatar>
          <div>
            <h1 className='text-2xl font-bold'>
              {isLoadingProfile ? (
                <Skeleton className='h-8 w-48' />
              ) : (
                profile?.name || 'User'
              )}
            </h1>
            <div className='mt-2 flex items-center gap-2 text-sm text-muted-foreground'>
              {isLoadingProfile ? (
                <Skeleton className='h-4 w-32' />
              ) : (
                <span>{profile?.email}</span>
              )}
            </div>
          </div>
        </div>
        <div className='flex items-center gap-4'>
          <Badge variant='default' className='bg-green-500 hover:bg-green-600'>
            Aktif
          </Badge>
          <div className='flex items-center gap-2'>
            <Select value={period} onValueChange={(val) => setPeriod(val as Period)}>
              <SelectTrigger className='w-[140px]'>
                <SelectValue placeholder='Periode' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='today'>Harian</SelectItem>
                <SelectItem value='week'>Mingguan</SelectItem>
                <SelectItem value='month'>Bulanan</SelectItem>
                <SelectItem value='custom-month'>Pilih Bulan</SelectItem>
              </SelectContent>
            </Select>
            {period === 'custom-month' && (
              <>
                <Select value={selectedMonth.toString()} onValueChange={(v) => setSelectedMonth(Number(v))}>
                  <SelectTrigger className='w-[110px]'>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {MONTH_NAMES.map((name, i) => (
                      <SelectItem key={i} value={i.toString()}>{name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={selectedYear.toString()} onValueChange={(v) => setSelectedYear(Number(v))}>
                  <SelectTrigger className='w-[90px]'>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[currentYear, currentYear - 1, currentYear - 2].map((y) => (
                      <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Top Row: Stats */}
      <div className='grid gap-4 md:grid-cols-3'>
        <Card>
          <CardHeader className='flex flex-row items-center justify-between pb-2'>
            <CardTitle className='text-sm font-medium'>
              Total Kegiatan
            </CardTitle>
            <Activity className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>
              {isLoadingStats ? (
                <Skeleton className='h-8 w-16' />
              ) : (
                stats?.periodCount || 0
              )}
            </div>
            <p className='text-xs text-muted-foreground'>
              {stats?.periodLabel}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className='flex flex-row items-center justify-between pb-2'>
            <CardTitle className='text-sm font-medium'>Selesai</CardTitle>
            <Target className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>
              {isLoadingStats ? (
                <Skeleton className='h-8 w-16' />
              ) : (
                stats?.doneCount || 0
              )}
            </div>
            <p className='text-xs text-muted-foreground'>Tugas diselesaikan</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className='flex flex-row items-center justify-between pb-2'>
            <CardTitle className='text-sm font-medium'>
              Rata-rata Tugas
            </CardTitle>
            <Target className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>
              {isLoadingStats ? (
                <Skeleton className='h-8 w-16' />
              ) : (
                stats?.avgTasks || '0.0'
              )}
            </div>
            <p className='text-xs text-muted-foreground'>
              Per minggu ({stats?.periodLabel ?? 'periode ini'})
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Row: Heatmap + Tugas */}
      <div className='grid gap-4 lg:grid-cols-[auto_1fr]'>
        {/* Heatmap */}
        <Card className='overflow-hidden lg:w-fit'>
          <CardHeader className='pb-2'>
            <div className='flex items-start justify-between gap-6'>
              <div>
                <CardTitle className='text-sm font-medium'>
                  Aktivitas 3 Bulan Terakhir
                </CardTitle>
                <CardDescription className='text-xs'>
                  {isLoadingHeatmap
                    ? 'Menghitung...'
                    : `${heatmapActiveDays} hari aktif`}
                </CardDescription>
              </div>
              <div className='text-right'>
                {isLoadingHeatmap ? (
                  <Skeleton className='h-7 w-12' />
                ) : (
                  <>
                    <div className='text-2xl leading-none font-bold tabular-nums'>
                      {heatmapTotal}
                    </div>
                    <div className='text-[11px] text-muted-foreground'>
                      aktivitas
                    </div>
                  </>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoadingHeatmap ? (
              <Skeleton className='h-[120px] w-[280px]' />
            ) : (
              <ActivityHeatmap
                data={heatmapData || {}}
                startDate={heatmapStart}
              />
            )}
          </CardContent>
        </Card>

        {/* Tugas Period */}
        <Card className='min-w-0'>
          <CardHeader className='flex flex-row items-center justify-between'>
            <CardTitle>
              Daftar Tugas {stats?.periodLabel || 'Hari Ini'}
            </CardTitle>
            <Link
              to='/activities'
              className='text-sm font-medium hover:underline'
            >
              Aktivitas Saya &rarr;
            </Link>
          </CardHeader>
          <CardContent>
            <div className='overflow-x-auto'>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Deskripsi</TableHead>
                    <TableHead>Jam</TableHead>
                    <TableHead>Volume</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoadingTasks ? (
                    Array.from({ length: 3 }).map((_, i) => (
                      <TableRow key={i}>
                        <TableCell>
                          <Skeleton className='h-5 w-full' />
                        </TableCell>
                        <TableCell>
                          <Skeleton className='h-5 w-24' />
                        </TableCell>
                        <TableCell>
                          <Skeleton className='h-5 w-16' />
                        </TableCell>
                        <TableCell>
                          <Skeleton className='h-5 w-20' />
                        </TableCell>
                      </TableRow>
                    ))
                  ) : periodTasks?.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={4}
                        className='py-6 text-center text-muted-foreground'
                      >
                        Belum ada aktivitas pada periode ini.
                      </TableCell>
                    </TableRow>
                  ) : (
                    periodTasks?.map((task) => (
                      <TableRow key={task.id}>
                        <TableCell className='font-medium'>
                          {task.description}
                        </TableCell>
                        <TableCell>
                          {task.start_time?.slice(0, 5) || '-'} s/d{' '}
                          {task.end_time?.slice(0, 5) || '-'}
                        </TableCell>
                        <TableCell>
                          {task.volume} {task.unit?.name}
                        </TableCell>
                        <TableCell>
                          {task.is_done ? (
                            <Badge variant='default' className='bg-green-500'>
                              Selesai
                            </Badge>
                          ) : (
                            <Badge variant='secondary'>Pending</Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
