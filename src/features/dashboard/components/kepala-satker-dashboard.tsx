import { useState, useMemo } from 'react'
import { format, startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns'
import { useQuery } from '@tanstack/react-query'
import { Activity, Users, Map, Clock } from 'lucide-react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
} from 'recharts'
import { supabase } from '@/lib/supabase'
import { useIsMobile } from '@/hooks/use-mobile'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { KepalaSatkerCards } from './kepala-satker-dashboard-cards'
import { MemberActivityDialog } from './member-activity-dialog'

export default function KepalaSatkerDashboard() {
  const [period] = useState<'month'>('month')
  const [sheetOpen, setSheetOpen] = useState(false)
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null)
  const [selectedMemberName, setSelectedMemberName] = useState<string>('')
  const isMobile = useIsMobile()

  // 1. Fetch All Profiles with Teams & Roles
  const { data: allUsers = [], isLoading: isLoadingUsers } = useQuery({
    queryKey: ['all-users-satker'],
    queryFn: async () => {
      const { data } = await supabase.from('profiles').select(`
          id, name, email,
          users_teams(teams(name)),
          users_roles(roles(name))
        `)
      return data || []
    },
  })

  // 2. Fetch All Activities in the period
  const { data: allActivities = [], isLoading: isLoadingActivities } = useQuery(
    {
      queryKey: ['all-activities-satker', period],
      queryFn: async () => {
        const today = new Date()
        // For now, let's just stick to 'month' as requested in plan: "Total Output Satker (bulan berjalan)"
        const startStr = format(startOfMonth(today), 'yyyy-MM-dd')
        const endStr = format(endOfMonth(today), 'yyyy-MM-dd')

        const { data } = await supabase
          .from('activities')
          .select('*, assignor_team:teams(name)')
          .gte('date', startStr)
          .lte('date', endStr)
        return data || []
      },
    }
  )

  // 3. Today's active users
  const todayStr = format(new Date(), 'yyyy-MM-dd')
  const activeUsersTodayList = allActivities.filter((a) => a.date === todayStr)
  const activeUsersToday = new Set(activeUsersTodayList.map((a) => a.user_id))

  // 4. Transform data for Bar Chart (Tim teraktif)
  const teamStats = useMemo(() => {
    const stats: Record<string, number> = {}

    allActivities.forEach((act) => {
      const teamName = act.assignor_team?.name || 'Tanpa Tim'
      stats[teamName] = (stats[teamName] || 0) + 1
    })

    return Object.keys(stats)
      .map((name) => ({
        name,
        total: stats[name],
      }))
      .sort((a, b) => b.total - a.total)
  }, [allActivities, allUsers])

  // 5. Transform data for Line Chart (Trend harian)
  const trendData = useMemo(() => {
    const end = new Date()
    const start = startOfMonth(end)
    const days = eachDayOfInterval({ start, end })

    const groupByDate = allActivities.reduce(
      (acc: Record<string, number>, curr) => {
        acc[curr.date] = (acc[curr.date] || 0) + 1
        return acc
      },
      {}
    )

    return days.map((day) => {
      const dateStr = format(day, 'yyyy-MM-dd')
      return {
        date: format(day, 'dd MMM'),
        total: groupByDate[dateStr] || 0,
      }
    })
  }, [allActivities])

  // Calculate Metrics
  const isLoading = isLoadingUsers || isLoadingActivities

  const complianceRate =
    allUsers.length > 0
      ? Math.round((activeUsersToday.size / allUsers.length) * 100)
      : 0
  const totalOutput = allActivities.filter((a) => a.is_done).length

  const missingReportUsers = allUsers.filter((u) => !activeUsersToday.has(u.id))

  return (
    <div className='flex flex-col gap-6 p-1'>
      {/* Header */}
      <div className='rounded-lg border bg-card p-6 shadow-sm'>
        <h2 className='text-xl font-bold'>Pengawasan Makro Satker</h2>
        <p className='text-sm text-muted-foreground'>
          Pantau kesehatan produktivitas organisasi secara menyeluruh bulan ini.
        </p>
      </div>

      {/* Stats */}
      <div className='grid gap-4 md:grid-cols-4'>
        <Card className='col-span-1 border-l-4 border-l-blue-500 md:col-span-1'>
          <CardHeader className='flex flex-row items-center justify-between pb-2'>
            <CardTitle className='text-sm font-medium'>Total Output</CardTitle>
            <Activity className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>
              {isLoading ? <Skeleton className='h-8 w-16' /> : totalOutput}
            </div>
            <p className='text-xs text-muted-foreground'>
              Aktivitas Selesai (Bulan Ini)
            </p>
          </CardContent>
        </Card>

        <Card className='col-span-1 border-l-4 border-l-green-500 md:col-span-1'>
          <CardHeader className='flex flex-row items-center justify-between pb-2'>
            <CardTitle className='text-sm font-medium'>
              Kepatuhan Harian
            </CardTitle>
            <Clock className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>
              {isLoading ? (
                <Skeleton className='h-8 w-16' />
              ) : (
                `${complianceRate}%`
              )}
            </div>
            <p className='text-xs text-muted-foreground'>
              Pegawai Melapor Hari Ini
            </p>
          </CardContent>
        </Card>

        <Card className='col-span-1 border-l-4 border-l-indigo-500 md:col-span-1'>
          <CardHeader className='flex flex-row items-center justify-between pb-2'>
            <CardTitle className='text-sm font-medium'>Total Pegawai</CardTitle>
            <Users className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>
              {isLoading ? <Skeleton className='h-8 w-16' /> : allUsers.length}
            </div>
            <p className='text-xs text-muted-foreground'>Terdaftar di Sistem</p>
          </CardContent>
        </Card>

        <Card
          className={`col-span-1 border-l-4 md:col-span-1 ${missingReportUsers.length > 5 ? 'border-l-red-500' : 'border-l-orange-400'}`}
        >
          <CardHeader className='flex flex-row items-center justify-between pb-2'>
            <CardTitle className='text-sm font-medium'>Belum Melapor</CardTitle>
            <Map className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div
              className={`text-2xl font-bold ${missingReportUsers.length > 0 ? 'text-red-500' : ''}`}
            >
              {isLoading ? (
                <Skeleton className='h-8 w-16' />
              ) : (
                missingReportUsers.length
              )}
            </div>
            <p className='text-xs text-muted-foreground'>
              Alpha / Belum Input Hari Ini
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Visualisasi Analytics */}
      <div className='grid gap-4 md:grid-cols-2'>
        <Card className='col-span-1'>
          <CardHeader>
            <CardTitle>Trend Aktivitas Harian</CardTitle>
            <CardDescription>
              Fluktuasi produktivitas harian satuan kerja (Bulan Berjalan).
            </CardDescription>
          </CardHeader>
          <CardContent className='px-2'>
            <div className='h-[250px] w-full'>
              {isLoading ? (
                <Skeleton className='h-full w-full' />
              ) : (
                <ResponsiveContainer width='100%' height='100%'>
                  <LineChart data={trendData}>
                    <CartesianGrid strokeDasharray='3 3' vertical={false} />
                    <XAxis
                      dataKey='date'
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis fontSize={12} tickLine={false} axisLine={false} />
                    <Tooltip />
                    <Line
                      type='monotone'
                      dataKey='total'
                      stroke='#3b82f6'
                      strokeWidth={2}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className='col-span-1'>
          <CardHeader>
            <CardTitle>Beban/Output per Tim</CardTitle>
            <CardDescription>Perbandingan aktivitas antar tim.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className='h-[250px] w-full'>
              {isLoading ? (
                <Skeleton className='h-full w-full' />
              ) : (
                <ResponsiveContainer width='100%' height='100%'>
                  <BarChart
                    data={teamStats}
                    layout='vertical'
                    margin={{ left: 20 }}
                  >
                    <CartesianGrid strokeDasharray='3 3' horizontal={false} />
                    <XAxis
                      type='number'
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      dataKey='name'
                      type='category'
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                      width={100}
                    />
                    <Tooltip cursor={{ fill: 'transparent' }} />
                    <Bar dataKey='total' fill='#10b981' radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Master Table Pegawai */}
      {isMobile ? (
        <KepalaSatkerCards
          users={allUsers as any}
          activities={allActivities}
          activeUsersToday={activeUsersToday}
          isLoading={isLoading}
        />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Master Data Pantauan Pegawai</CardTitle>
            <CardDescription>
              Daftar seluruh pegawai BPS beserta rekap kerja dan kehadiran
              lapor.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nama Pegawai</TableHead>
                  <TableHead>Tim</TableHead>
                  <TableHead className='text-center'>
                    Aktivitas Bulan Ini
                  </TableHead>
                  <TableHead className='text-center'>
                    Status Lapor Hari Ini
                  </TableHead>
                  <TableHead className='text-right'>Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading
                  ? Array.from({ length: 4 }).map((_, i) => (
                      <TableRow key={i}>
                        <TableCell>
                          <Skeleton className='h-5 w-48' />
                        </TableCell>
                        <TableCell>
                          <Skeleton className='h-5 w-32' />
                        </TableCell>
                        <TableCell>
                          <Skeleton className='mx-auto h-5 w-16' />
                        </TableCell>
                        <TableCell>
                          <Skeleton className='mx-auto h-5 w-24' />
                        </TableCell>
                        <TableCell>
                          <Skeleton className='ml-auto h-5 w-16' />
                        </TableCell>
                      </TableRow>
                    ))
                  : allUsers.map((u: any) => {
                      const userActs = allActivities.filter(
                        (a) => a.user_id === u.id
                      )
                      const hasReportedToday = activeUsersToday.has(u.id)
                      const teamName = u.users_teams?.[0]?.teams?.name || '-'

                      return (
                        <TableRow key={u.id}>
                          <TableCell className='font-medium'>
                            {u.name}
                          </TableCell>
                          <TableCell>{teamName}</TableCell>
                          <TableCell className='text-center text-lg font-bold'>
                            {userActs.length}
                          </TableCell>
                          <TableCell className='text-center'>
                            {hasReportedToday ? (
                              <Badge variant='default' className='bg-green-500'>
                                Sudah Lapor
                              </Badge>
                            ) : (
                              <Badge variant='destructive'>Belum Lapor</Badge>
                            )}
                          </TableCell>
                          <TableCell className='text-right'>
                            <Button
                              variant='outline'
                              size='sm'
                              onClick={() => {
                                setSelectedMemberId(u.id)
                                setSelectedMemberName(u.name)
                                setSheetOpen(true)
                              }}
                            >
                              Detail
                            </Button>
                          </TableCell>
                        </TableRow>
                      )
                    })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <MemberActivityDialog
        userId={selectedMemberId}
        userName={selectedMemberName}
        isOpen={sheetOpen}
        onOpenChange={setSheetOpen}
      />
    </div>
  )
}
