import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Activity, Clock, Target, Plus } from 'lucide-react'
import { format, startOfMonth, endOfMonth, subYears, eachDayOfInterval } from 'date-fns'

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
    }
  })

  // 2. Fetch Stats
  const { data: stats } = useQuery({
    queryKey: ['stats', userId],
    queryFn: async () => {
      const start = startOfMonth(new Date()).toISOString()
      const end = endOfMonth(new Date()).toISOString()

      const [volumeRes, pendingRes, avgRes] = await Promise.all([
        supabase.from('activities').select('volume').eq('user_id', userId).gte('date', start).lte('date', end),
        supabase.from('activities').select('id', { count: 'exact' }).eq('user_id', userId).eq('is_done', false),
        supabase.from('activities').select('id', { count: 'exact' }).eq('user_id', userId).gte('date', start).lte('date', end),
      ])

      const totalVolume = volumeRes.data?.reduce((acc, curr) => acc + curr.volume, 0) || 0
      const pendingCount = pendingRes.count || 0
      const daysInMonth = new Date().getDate()
      const avgTasks = ((avgRes.count || 0) / daysInMonth).toFixed(1)

      return { totalVolume, pendingCount, avgTasks }
    }
  })

  // 3. Fetch Heatmap Data
  const { data: heatmapData } = useQuery({
    queryKey: ['heatmap', userId],
    queryFn: async () => {
      const { data } = await supabase
        .from('activities')
        .select('date, id')
        .eq('user_id', userId)
        .gte('date', format(subYears(new Date(), 1), 'yyyy-MM-dd'))

      const counts = data?.reduce((acc: Record<string, number>, curr) => {
        acc[curr.date] = (acc[curr.date] || 0) + 1
        return acc
      }, {}) || {}
      return counts
    }
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
        .eq('is_done', false)
      return data || []
    }
  })

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between bg-card p-6 rounded-lg border shadow-sm gap-4">
        <div className="flex items-center gap-4">
          <Avatar className="h-16 w-16">
            <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${profile?.name || 'User'}`} />
            <AvatarFallback>US</AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-2xl font-bold">{profile?.name || 'Memuat...'}</h1>
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <span>{profile?.email}</span>
              <span>•</span>
              <span className="capitalize">{profile?.users_roles?.[0]?.roles?.name || 'Pelaksana'}</span>
            </div>
          </div>
        </div>
        <Badge variant="default" className="bg-green-500 hover:bg-green-600">Aktif</Badge>
      </div>

      {/* Top Row: Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Volume Kerja</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalVolume || 0}</div>
            <p className="text-xs text-muted-foreground">Bulan ini</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Tugas Pending</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.pendingCount || 0}</div>
            <p className="text-xs text-muted-foreground">Menunggu diselesaikan</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Rata-rata Tugas</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.avgTasks || '0.0'}</div>
            <p className="text-xs text-muted-foreground">Per hari (Bulan ini)</p>
          </CardContent>
        </Card>
      </div>

      {/* Middle Row: Heatmap */}
      <Card>
        <CardHeader>
          <CardTitle>Aktivitas Tahunan</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-1">
            {eachDayOfInterval({ start: subYears(new Date(), 1), end: new Date() }).map(day => {
              const dateStr = format(day, 'yyyy-MM-dd')
              const count = heatmapData?.[dateStr] || 0
              let bg = 'bg-muted'
              if (count === 1) bg = 'bg-green-200 dark:bg-green-900'
              if (count === 2) bg = 'bg-green-400 dark:bg-green-700'
              if (count >= 3) bg = 'bg-green-600 dark:bg-green-500'

              return (
                <div
                  key={dateStr}
                  title={`${dateStr}: ${count} tugas`}
                  className={`h-3 w-3 rounded-sm ${bg}`}
                />
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Bottom Row: Tugas Hari Ini */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Tugas Hari Ini</CardTitle>
          <Button size="sm">
            <Plus className="mr-2 h-4 w-4" />
            Tambah Aktivitas
          </Button>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Deskripsi</TableHead>
                  <TableHead>Volume</TableHead>
                  <TableHead>Pemberi Tugas</TableHead>
                  <TableHead>Waktu</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {todayTasks?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground py-6">
                      Tidak ada tugas pending hari ini.
                    </TableCell>
                  </TableRow>
                ) : (
                  todayTasks?.map((task) => (
                    <TableRow key={task.id}>
                      <TableCell className="font-medium">{task.description}</TableCell>
                      <TableCell>{task.volume} {task.unit?.name}</TableCell>
                      <TableCell>{task.assignor_team?.name || '-'}</TableCell>
                      <TableCell>
                        {task.start_time?.slice(0,5) || '-'} s/d {task.end_time?.slice(0,5) || '-'}
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
