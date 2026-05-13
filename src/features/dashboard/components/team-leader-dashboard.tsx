import { useState, useMemo } from 'react'
import {
  format,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
} from 'date-fns'
import { useQuery } from '@tanstack/react-query'
import { Users, AlertTriangle, Activity } from 'lucide-react'
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
import { ScrollArea } from '@/components/ui/scroll-area'
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
import { MemberActivityDialog } from './member-activity-dialog'
import { TeamLeaderCards } from './team-leader-dashboard-cards'

interface Team {
  id: number
  name: string
}

const MONTH_NAMES = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember']

export default function TeamLeaderDashboard({ teams }: { teams: Team[] }) {
  const currentYear = new Date().getFullYear()
  const [selectedTeam, setSelectedTeam] = useState<string>(
    teams.length > 0 ? teams[0].id.toString() : ''
  )
  const [period, setPeriod] = useState<'today' | 'week' | 'month' | 'custom-month'>('today')
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth())
  const [selectedYear, setSelectedYear] = useState<number>(currentYear)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null)
  const [selectedMemberName, setSelectedMemberName] = useState<string>('')
  const isMobile = useIsMobile()

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

  // 2. Fetch Activities based on period
  const { data: activities = [], isLoading: isLoadingActivities } = useQuery({
    queryKey: ['team-activities-period', teamId, memberIds, period, selectedMonth, selectedYear],
    queryFn: async () => {
      if (!teamId || memberIds.length === 0) return []

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
        .select('*')
        .in('user_id', memberIds)
        .gte('date', startStr)
        .lte('date', endStr)

      return data || []
    },
    enabled: memberIds.length > 0,
  })

  // Calculations
  const isLoading = isLoadingMembers || isLoadingActivities

  const completedActivities = activities.filter((a) => a.is_done).length

  const periodLabel =
    period === 'today'
      ? 'Hari Ini'
      : period === 'week'
        ? 'Minggu Ini'
        : period === 'custom-month'
          ? `${MONTH_NAMES[selectedMonth]} ${selectedYear}`
          : 'Bulan Ini'

  // Calculate active members based on period
  const getActiveMembersForPeriod = () => {
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

    return new Set(
      activities
        .filter((a) => a.date >= startStr && a.date <= endStr)
        .map((a) => a.user_id)
    )
  }

  const activeMembersThisPeriod = getActiveMembersForPeriod()

  // Who hasn't reported in this period
  const missingReportMembers = members.filter(
    (m) => !activeMembersThisPeriod.has(m.user_id)
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

          <div className='flex items-center gap-2'>
            <Select value={period} onValueChange={(val: any) => setPeriod(val)}>
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

      {/* Stats */}
      <div className='grid gap-4 md:grid-cols-3'>
        <Card>
          <CardHeader className='flex flex-row items-center justify-between pb-2'>
            <CardTitle className='text-sm font-medium'>Realisasi Tim</CardTitle>
            <Activity className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>
              {isLoading ? (
                <Skeleton className='h-8 w-16' />
              ) : (
                `${completedActivities} / ${activities.length}`
              )}
            </div>
            <p className='text-xs text-muted-foreground'>
              Aktivitas selesai dari total di periode ini
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='flex flex-row items-center justify-between pb-2'>
            <CardTitle className='text-sm font-medium'>
              Anggota Aktif {periodLabel}
            </CardTitle>
            <Users className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>
              {isLoading ? (
                <Skeleton className='h-8 w-16' />
              ) : (
                `${activeMembersThisPeriod.size} / ${members.length}`
              )}
            </div>
            <p className='text-xs text-muted-foreground'>
              Anggota yang sudah input di periode ini
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
              {isLoading ? (
                <Skeleton className='h-8 w-16' />
              ) : (
                missingReportMembers.length
              )}
            </div>
            <p className='text-xs text-muted-foreground'>
              Orang belum input periode ini
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabel Kinerja & Belum Lapor */}
      {isMobile ? (
        <TeamLeaderCards
          members={members}
          activities={activities}
          missingReportMembers={missingReportMembers}
          isLoading={isLoading}
        />
      ) : (
        <div className='grid gap-6 md:grid-cols-2'>
          {/* Table: Kinerja */}
          <Card className='col-span-1 md:col-span-1'>
            <CardHeader>
              <CardTitle>Performa Anggota</CardTitle>
              <CardDescription>Berdasarkan periode berjalan</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className='h-[400px] w-full rounded-md border'>
                <Table>
                  <TableHeader className='sticky top-0 z-10 bg-muted/50'>
                    <TableRow>
                      <TableHead>Nama</TableHead>
                      <TableHead className='text-center'>Total Tugas</TableHead>
                      <TableHead className='text-center'>Selesai</TableHead>
                      <TableHead className='text-right'>Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading
                      ? Array.from({ length: 3 }).map((_, i) => (
                          <TableRow key={i}>
                            <TableCell>
                              <Skeleton className='h-5 w-32' />
                            </TableCell>
                            <TableCell>
                              <Skeleton className='mx-auto h-5 w-16' />
                            </TableCell>
                            <TableCell>
                              <Skeleton className='mx-auto h-5 w-16' />
                            </TableCell>
                            <TableCell>
                              <Skeleton className='ml-auto h-5 w-16' />
                            </TableCell>
                          </TableRow>
                        ))
                      : members.map((member) => {
                          const memberActs = activities.filter(
                            (a) => a.user_id === member.user_id
                          )
                          const doneActs = memberActs.filter((a) => a.is_done)
                          const profileData =
                            (Array.isArray(member.profiles)
                              ? member.profiles[0]
                              : member.profiles) || {}

                          return (
                            <TableRow key={member.user_id}>
                              <TableCell className='font-medium'>
                                {profileData.name || 'Unknown'}
                              </TableCell>
                              <TableCell className='text-center'>
                                {memberActs.length}
                              </TableCell>
                              <TableCell className='text-center'>
                                {doneActs.length}
                              </TableCell>
                              <TableCell className='text-right'>
                                <Button
                                  variant='outline'
                                  size='sm'
                                  onClick={() => {
                                    setSelectedMemberId(member.user_id)
                                    setSelectedMemberName(
                                      profileData.name || 'Unknown'
                                    )
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
                Anggota yang belum input setidaknya 1 aktivitas minggu ini.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <ScrollArea className='h-[400px] w-full rounded-md border'>
                  <Table>
                    <TableHeader className='sticky top-0 z-10 bg-muted/50'>
                      <TableRow>
                        <TableHead>Nama</TableHead>
                        <TableHead className='text-right'>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {Array.from({ length: 3 }).map((_, i) => (
                        <TableRow key={i}>
                          <TableCell>
                            <Skeleton className='h-5 w-32' />
                          </TableCell>
                          <TableCell>
                            <Skeleton className='ml-auto h-5 w-16' />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ScrollArea>
              ) : missingReportMembers.length === 0 ? (
                <div className='flex h-32 items-center justify-center rounded-md border border-dashed text-muted-foreground'>
                  Semua anggota sudah melapor minggu ini!
                </div>
              ) : (
                <ScrollArea className='h-[400px] w-full rounded-md border'>
                  <Table>
                    <TableHeader className='sticky top-0 z-10 bg-muted/50'>
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
