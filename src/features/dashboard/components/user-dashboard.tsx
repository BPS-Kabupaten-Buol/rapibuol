import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns'
import { useQuery } from '@tanstack/react-query'
import { Activity, Target } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'
import { Link } from '@tanstack/react-router'
import { ActivityHeatmap } from './activity-heatmap'

export default function UserDashboard({ userId }: { userId: string }) {
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
    queryKey: ['stats', userId],
    queryFn: async () => {
      const start = startOfMonth(new Date()).toISOString()
      const end = endOfMonth(new Date()).toISOString()

      const [volumeRes, doneRes, avgRes] = await Promise.all([
        supabase
          .from('activities')
          .select('volume')
          .eq('user_id', userId)
          .gte('date', start)
          .lte('date', end),
        // Hitung aktivitas yang selesai bulan ini
        supabase
          .from('activities')
          .select('id', { count: 'exact' })
          .eq('user_id', userId)
          .eq('is_done', true)
          .gte('date', start)
          .lte('date', end),
        supabase
          .from('activities')
          .select('id', { count: 'exact' })
          .eq('user_id', userId)
          .gte('date', start)
          .lte('date', end),
      ])

      const totalVolume =
        volumeRes.data?.reduce((acc, curr) => acc + curr.volume, 0) || 0
      const doneCount = doneRes.count || 0
      const daysInMonth = new Date().getDate()
      const avgTasks = ((avgRes.count || 0) / daysInMonth).toFixed(1)

      return { totalVolume, doneCount, avgTasks }
    },
  })

  // 3. Fetch Heatmap Data (3 bulan terakhir)
  const heatmapStart = subMonths(new Date(), 3)
  const { data: heatmapData, isLoading: isLoadingHeatmap } = useQuery({
    queryKey: ['heatmap', userId],
    queryFn: async () => {
      const { data } = await supabase
        .from('activities')
        .select('date')
        .eq('user_id', userId)
        .gte('date', format(heatmapStart, 'yyyy-MM-dd'))

      const counts =
        data?.reduce((acc: Record<string, number>, curr) => {
          acc[curr.date] = (acc[curr.date] || 0) + 1
          return acc
        }, {}) || {}
      return counts
    },
  })

  // 4. Fetch Today's Tasks
  const { data: todayTasks, isLoading: isLoadingTasks } = useQuery({
    queryKey: ['tasks_today', userId],
    queryFn: async () => {
      const today = format(new Date(), 'yyyy-MM-dd')
      const { data } = await supabase
        .from('activities')
        .select(`*, unit:unit_measurement(name), assignor_team:teams(name)`)
        .eq('user_id', userId)
        .eq('date', today)
      return data || []
    },
  })

  return (
    <div className='flex flex-col gap-6 p-1'>
      {/* Header */}
      <div className='flex flex-col items-start justify-between gap-4 rounded-lg border bg-card p-6 shadow-sm sm:flex-row sm:items-center'>
        <div className='flex items-center gap-4'>
          <Avatar className='h-16 w-16'>
            <AvatarImage
              src={`https://api.dicebear.com/7.x/initials/svg?seed=${profile?.name || 'User'}`}
            />
            <AvatarFallback>US</AvatarFallback>
          </Avatar>
          <div>
            <h1 className='text-2xl font-bold'>
              {isLoadingProfile ? <Skeleton className="h-8 w-48" /> : profile?.name || 'User'}
            </h1>
            <div className='mt-2 flex items-center gap-2 text-sm text-muted-foreground'>
              {isLoadingProfile ? <Skeleton className="h-4 w-32" /> : <span>{profile?.email}</span>}
            </div>
          </div>
        </div>
        <Badge variant='default' className='bg-green-500 hover:bg-green-600'>
          Aktif
        </Badge>
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
              {isLoadingStats ? <Skeleton className="h-8 w-16" /> : stats?.totalVolume || 0}
            </div>
            <p className='text-xs text-muted-foreground'>Bulan ini</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className='flex flex-row items-center justify-between pb-2'>
            <CardTitle className='text-sm font-medium'>Selesai Bulan Ini</CardTitle>
            <Target className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>
              {isLoadingStats ? <Skeleton className="h-8 w-16" /> : stats?.doneCount || 0}
            </div>
            <p className='text-xs text-muted-foreground'>
              Aktivitas selesai bulan ini
            </p>
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
              {isLoadingStats ? <Skeleton className="h-8 w-16" /> : stats?.avgTasks || '0.0'}
            </div>
            <p className='text-xs text-muted-foreground'>
              Per hari (Bulan ini)
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Row: Heatmap + Tugas Hari Ini side by side */}
      <div className='grid gap-4 lg:grid-cols-[auto_1fr]'>

        {/* Heatmap */}
        <Card className='overflow-hidden lg:w-fit'>
          <CardHeader className='pb-2'>
            <CardTitle className='text-sm font-medium'>Aktivitas 3 Bulan Terakhir</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingHeatmap ? (
              <Skeleton className='h-[120px] w-[280px]' />
            ) : (
              <ActivityHeatmap data={heatmapData || {}} startDate={heatmapStart} />
            )}
          </CardContent>
        </Card>

        {/* Tugas Hari Ini */}
        <Card className='min-w-0'>
          <CardHeader className='flex flex-row items-center justify-between'>
            <CardTitle>Daftar Tugas Hari Ini</CardTitle>
            <Link to='/activities' className='text-sm font-medium hover:underline'>
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
                        <TableCell><Skeleton className="h-5 w-full" /></TableCell>
                        <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                        <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                        <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                      </TableRow>
                    ))
                  ) : todayTasks?.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={4}
                        className='py-6 text-center text-muted-foreground'
                      >
                        Belum menginput aktivitas hari ini.
                      </TableCell>
                    </TableRow>
                  ) : (
                    todayTasks?.map((task) => (
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
