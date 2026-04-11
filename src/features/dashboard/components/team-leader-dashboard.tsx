import { useState, useMemo } from 'react'
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
} from 'date-fns'
import { useQuery } from '@tanstack/react-query'
import { Users, AlertTriangle, Activity } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'
import { MemberActivityDialog } from './member-activity-dialog'

interface Team {
  id: number
  name: string
}

export default function TeamLeaderDashboard({
  teams,
}: {
  teams: Team[]
}) {
  const [selectedTeam, setSelectedTeam] = useState<string>(
    teams.length > 0 ? teams[0].id.toString() : ''
  )
  const [period, setPeriod] = useState<'today' | 'week' | 'month'>('today')
  const [sheetOpen, setSheetOpen] = useState(false)
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null)
  const [selectedMemberName, setSelectedMemberName] = useState<string>('')

  const teamId = selectedTeam ? parseInt(selectedTeam) : null

  // 1. Fetch Team Members
  const { data: members = [], isLoading: isLoadingMembers } = useQuery({
    queryKey: ['team-members', teamId],
    queryFn: async () => {
      if (!teamId) return []
      const { data } = await supabase
        .from('users_teams')
        .select(
          `
          user_id,
          profiles(
            name,
            email,
            users_roles(roles(name))
          )
        `
        )
        .eq('team_id', teamId)
      return data || []
    },
    enabled: !!teamId,
  })

  const memberIds = useMemo(() => members.map((m) => m.user_id), [members])

  // 2. Fetch Activities for current period
  const { data: activities = [], isLoading: isLoadingActivities } = useQuery({
    queryKey: ['team-activities', teamId, period, memberIds],
    queryFn: async () => {
      if (!teamId || memberIds.length === 0) return []

      const today = new Date()
      let startStr = ''
      let endStr = ''

      if (period === 'today') {
        startStr = format(today, 'yyyy-MM-dd')
        endStr = startStr
      } else if (period === 'week') {
        startStr = format(startOfWeek(today, { weekStartsOn: 1 }), 'yyyy-MM-dd')
        endStr = format(endOfWeek(today, { weekStartsOn: 1 }), 'yyyy-MM-dd')
      } else {
        startStr = format(startOfMonth(today), 'yyyy-MM-dd')
        endStr = format(endOfMonth(today), 'yyyy-MM-dd')
      }

      const { data } = await supabase
        .from('activities')
        .select('*')
        .in('user_id', memberIds)
        .gte('date', startStr)
        .lte('date', endStr)

      return data || []
    },
    enabled: memberIds.length > 0,
  })

  // 3. Fetch Today's Activities explicitly (for "Belum Lapor" alert)
  const { data: todayActivities = [], isLoading: isLoadingToday } = useQuery({
    queryKey: ['team-activities-today', teamId, memberIds],
    queryFn: async () => {
      if (!teamId || memberIds.length === 0) return []
      const today = format(new Date(), 'yyyy-MM-dd')
      const { data } = await supabase
        .from('activities')
        .select('user_id')
        .in('user_id', memberIds)
        .eq('date', today)
      return data || []
    },
    enabled: memberIds.length > 0,
  })

  // Calculations
  const isLoading = isLoadingMembers || isLoadingActivities || isLoadingToday

  const completedActivities = activities.filter((a) => a.is_done).length

  // Members who have at least one activity recorded today
  const activeMembersToday = new Set(todayActivities.map((a) => a.user_id))

  // Who hasn't reported today
  const missingReportMembers = members.filter(
    (m) => !activeMembersToday.has(m.user_id)
  )

  return (
    <div className='flex flex-col gap-6 p-1'>
      {/* Header & Controls */}
      <div className='flex flex-col items-start justify-between gap-4 rounded-lg border bg-card p-6 shadow-sm sm:flex-row sm:items-center'>
        <div>
          <h2 className='text-xl font-bold'>Pemantauan Tim</h2>
          <p className='text-sm text-muted-foreground'>
            Pantau kinerja dan disiplin anggota tim Anda.
          </p>
        </div>
        <div className='flex items-center gap-4'>
          {teams.length > 1 && (
            <Select value={selectedTeam} onValueChange={setSelectedTeam}>
              <SelectTrigger className='w-[180px]'>
                <SelectValue placeholder='Pilih Tim' />
              </SelectTrigger>
              <SelectContent>
                {teams.map((t) => (
                  <SelectItem key={t.id} value={t.id.toString()}>
                    {t.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          <Select value={period} onValueChange={(val: any) => setPeriod(val)}>
            <SelectTrigger className='w-[140px]'>
              <SelectValue placeholder='Periode' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='today'>Hari Ini</SelectItem>
              <SelectItem value='week'>Minggu Ini</SelectItem>
              <SelectItem value='month'>Bulan Ini</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Stats */}
      <div className='grid gap-4 md:grid-cols-3'>
        <Card>
          <CardHeader className='flex flex-row items-center justify-between pb-2'>
            <CardTitle className='text-sm font-medium'>Realisasi Tim</CardTitle>
            <Activity className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>
              {isLoading ? <Skeleton className="h-8 w-16" /> : `${completedActivities} / ${activities.length}`}
            </div>
            <p className='text-xs text-muted-foreground'>
              Aktivitas selesai dari total di periode ini
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='flex flex-row items-center justify-between pb-2'>
            <CardTitle className='text-sm font-medium'>
              Anggota Aktif Hari Ini
            </CardTitle>
            <Users className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>
              {isLoading ? <Skeleton className="h-8 w-16" /> : `${activeMembersToday.size} / ${members.length}`}
            </div>
            <p className='text-xs text-muted-foreground'>
              Anggota yang sudah input hari ini
            </p>
          </CardContent>
        </Card>

        <Card
          className={
            missingReportMembers.length > 0
              ? 'border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950/20'
              : ''
          }
        >
          <CardHeader className='flex flex-row items-center justify-between pb-2'>
            <CardTitle className='text-sm font-medium'>Belum Lapor</CardTitle>
            <AlertTriangle
              className={`h-4 w-4 ${missingReportMembers.length > 0 ? 'text-red-500' : 'text-muted-foreground'}`}
            />
          </CardHeader>
          <CardContent>
            <div
              className={`text-2xl font-bold ${missingReportMembers.length > 0 ? 'text-red-600 dark:text-red-400' : ''}`}
            >
              {isLoading ? <Skeleton className="h-8 w-16" /> : missingReportMembers.length}
            </div>
            <p className='text-xs text-muted-foreground'>
              Orang belum input hari ini
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabel Kinerja & Belum Lapor */}
      <div className='grid gap-6 md:grid-cols-2'>
        {/* Table: Kinerja */}
        <Card className='col-span-1 md:col-span-1'>
          <CardHeader>
            <CardTitle>Performa Anggota</CardTitle>
            <CardDescription>
              Berdasarkan periode{' '}
              {period === 'today'
                ? 'Hari Ini'
                : period === 'week'
                  ? 'Minggu Ini'
                  : 'Bulan Ini'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className='h-[400px] w-full rounded-md border'>
              <Table>
                <TableHeader className='bg-muted/50 sticky top-0 z-10'>
                <TableRow>
                  <TableHead>Nama</TableHead>
                  <TableHead className='text-center'>Total Tugas</TableHead>
                  <TableHead className='text-center'>Selesai</TableHead>
                  <TableHead className='text-right'>Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-16 mx-auto" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-16 mx-auto" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-16 ml-auto" /></TableCell>
                    </TableRow>
                  ))
                ) : (
                  members.map((member) => {
                    const memberActs = activities.filter(
                    (a) => a.user_id === member.user_id
                  )
                  const doneActs = memberActs.filter((a) => a.is_done)
                  // @ts-ignore
                  const profileData =
                    ((Array.isArray(member.profiles)
                      ? member.profiles[0]
                      : member.profiles) as any) || {}

                  return (
                    <TableRow key={member.user_id}>
                      <TableCell className='font-medium'>
                        {profileData.name || 'Unknown'}
                      </TableCell>
                      <TableCell className='text-center'>
                        {memberActs.length}
                      </TableCell>
                      <TableCell className='text-center'>
                        {memberActs.length > 0
                          ? Math.round(
                              (doneActs.length / memberActs.length) * 100
                            )
                          : 0}
                        %
                      </TableCell>
                      <TableCell className='text-right'>
                        <Button
                          variant='outline'
                          size='sm'
                          onClick={() => {
                            setSelectedMemberId(member.user_id)
                            setSelectedMemberName(profileData.name || 'Unknown')
                            setSheetOpen(true)
                          }}
                        >
                          Detail
                        </Button>
                      </TableCell>
                    </TableRow>
                  )
                }))}
                </TableBody>
              </Table>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Table: Belum Lapor */}
        <Card className='col-span-1 md:col-span-1'>
          <CardHeader>
            <CardTitle className='text-red-600 dark:text-red-400'>
              Belum Ada Pelaporan
            </CardTitle>
            <CardDescription>
              Anggota yang belum input setidaknya 1 aktivitas hari ini.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <ScrollArea className='h-[400px] w-full rounded-md border'>
                <Table>
                  <TableHeader className='bg-muted/50 sticky top-0 z-10'>
                    <TableRow>
                      <TableHead>Nama</TableHead>
                      <TableHead className='text-right'>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {Array.from({ length: 3 }).map((_, i) => (
                      <TableRow key={i}>
                        <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                        <TableCell><Skeleton className="h-5 w-16 ml-auto" /></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            ) : missingReportMembers.length === 0 ? (
              <div className='flex h-32 items-center justify-center rounded-md border border-dashed text-muted-foreground'>
                Semua anggota sudah melapor hari ini!
              </div>
            ) : (
              <ScrollArea className='h-[400px] w-full rounded-md border'>
                <Table>
                  <TableHeader className='bg-muted/50 sticky top-0 z-10'>
                    <TableRow>
                      <TableHead>Nama</TableHead>
                      <TableHead className='text-right'>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                <TableBody>
                  {missingReportMembers.map((member) => {
                    // @ts-ignore
                    const profileData =
                      ((Array.isArray(member.profiles)
                        ? member.profiles[0]
                        : member.profiles) as any) || {}
                    return (
                      <TableRow key={member.user_id}>
                        <TableCell className='font-medium'>
                          {profileData.name || 'Unknown'}
                        </TableCell>
                        <TableCell className='text-right'>
                          <Badge variant='destructive'>Belum Lapor</Badge>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      </div>

      <MemberActivityDialog
        userId={selectedMemberId}
        userName={selectedMemberName}
        isOpen={sheetOpen}
        onOpenChange={setSheetOpen}
      />
    </div>
  )
}
