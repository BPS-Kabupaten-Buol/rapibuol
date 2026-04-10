import { format, startOfMonth, endOfMonth, subYears } from 'date-fns'
import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { Activity, Clock, Target, Plus } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { ActivityHeatmap } from './activity-heatmap'

export default function UserDashboard({ userId }: { userId: string }) {
  // 1. Fetch Profile & Role
  const { data: profile } = useQuery({
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
  const { data: stats } = useQuery({
    queryKey: ['stats', userId],
    queryFn: async () => {
      const start = startOfMonth(new Date()).toISOString()
      const end = endOfMonth(new Date()).toISOString()

      const [volumeRes, pendingRes, avgRes] = await Promise.all([
        supabase
          .from('activities')
          .select('volume')
          .eq('user_id', userId)
          .gte('date', start)
          .lte('date', end),
        supabase
          .from('activities')
          .select('id', { count: 'exact' })
          .eq('user_id', userId)
          .eq('is_done', false),
        supabase
          .from('activities')
          .select('id', { count: 'exact' })
          .eq('user_id', userId)
          .gte('date', start)
          .lte('date', end),
      ])

      const totalVolume =
        volumeRes.data?.reduce((acc, curr) => acc + curr.volume, 0) || 0
      const pendingCount = pendingRes.count || 0
      const daysInMonth = new Date().getDate()
      const avgTasks = ((avgRes.count || 0) / daysInMonth).toFixed(1)

      return { totalVolume, pendingCount, avgTasks }
    },
  })

  // 3. Fetch Heatmap Data
  const { data: heatmapData } = useQuery({
    queryKey: ['heatmap', userId],
    queryFn: async () => {
      const { data } = await supabase
        .from('activities')
        .select('date')
        .eq('user_id', userId)
        .gte('date', format(subYears(new Date(), 1), 'yyyy-MM-dd'))

      const counts =
        data?.reduce((acc: Record<string, number>, curr) => {
          acc[curr.date] = (acc[curr.date] || 0) + 1
          return acc
        }, {}) || {}
      return counts
    },
  })

  // 4. Fetch Today's Tasks
  const { data: todayTasks } = useQuery({
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
              {profile?.name || 'Memuat...'}
            </h1>
            <div className='flex items-center gap-2 text-sm text-muted-foreground'>
              <span>{profile?.email}</span>
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
            <div className='text-2xl font-bold'>{stats?.totalVolume || 0}</div>
            <p className='text-xs text-muted-foreground'>Bulan ini</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className='flex flex-row items-center justify-between pb-2'>
            <CardTitle className='text-sm font-medium'>Tugas Pending</CardTitle>
            <Clock className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>{stats?.pendingCount || 0}</div>
            <p className='text-xs text-muted-foreground'>
              Menunggu diselesaikan (keseluruhan)
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
            <div className='text-2xl font-bold'>{stats?.avgTasks || '0.0'}</div>
            <p className='text-xs text-muted-foreground'>
              Per hari (Bulan ini)
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Middle Row: Heatmap */}
      <Card className='overflow-hidden'>
        <CardHeader>
          <CardTitle>Aktivitas Setahun Terakhir</CardTitle>
        </CardHeader>
        <CardContent>
          <div className='w-full'>
            <ActivityHeatmap data={heatmapData || {}} />
          </div>
        </CardContent>
      </Card>

      {/* Bottom Row: Tugas Hari Ini */}
      <Card>
        <CardHeader className='flex flex-row items-center justify-between'>
          <CardTitle>Daftar Tugas Hari Ini</CardTitle>
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
                {todayTasks?.length === 0 ? (
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
  )
}
