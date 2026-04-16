import { useState, useMemo } from 'react'
import { Search, User, ChevronDown, ChevronUp } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { MemberActivityDialog } from './member-activity-dialog'

interface Activity {
  id: number
  user_id: number
  is_done: boolean
  date: string
  description?: string
}

interface UserProfile {
  id: number
  name?: string
  email?: string
  users_teams?: Array<{ teams?: { name?: string } }>
  users_roles?: Array<{ roles?: { name?: string } }>
}

interface KepalaSatkerCardsProps {
  users: UserProfile[]
  activities: Activity[]
  activeUsersThisPeriod: Set<number>
  isLoading: boolean
  periodLabel?: string
}

export function KepalaSatkerCards({
  users,
  activities,
  activeUsersThisPeriod: activeUsersThisWeek,
  isLoading,
  periodLabel = 'periode ini',
}: KepalaSatkerCardsProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [reportFilter, setReportFilter] = useState<'all' | 'sudah' | 'belum'>(
    'all'
  )
  const [sheetOpen, setSheetOpen] = useState(false)
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null)
  const [selectedMemberName, setSelectedMemberName] = useState<string>('')
  const [expandedCard, setExpandedCard] = useState<number | null>(null)

  const filteredUsers = useMemo(() => {
    let result = users
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      result = result.filter((u) => u.name?.toLowerCase().includes(query))
    }
    if (reportFilter === 'sudah') {
      result = result.filter((u) => activeUsersThisWeek.has(u.id))
    } else if (reportFilter === 'belum') {
      result = result.filter((u) => !activeUsersThisWeek.has(u.id))
    }
    return result
  }, [users, searchQuery, reportFilter, activeUsersThisWeek])

  const reportedCount = users.filter((u) =>
    activeUsersThisWeek.has(u.id)
  ).length
  const notReportedCount = users.length - reportedCount

  if (isLoading) {
    return (
      <div className='flex flex-col gap-4'>
        <Skeleton className='h-10 w-full' />
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className='rounded-lg border bg-card p-4'>
            <Skeleton className='mb-2 h-5 w-32' />
            <Skeleton className='h-4 w-48' />
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className='flex flex-col gap-3'>
      <div className='rounded-xl border bg-card p-4 shadow-sm'>
        <h3 className='mb-3 font-semibold'>
          Master Data Pantauan Pegawai {periodLabel}
        </h3>

        <Tabs
          value={reportFilter}
          onValueChange={(v: any) => setReportFilter(v)}
          className='mb-3'
        >
          <TabsList className='w-full'>
            <TabsTrigger value='all' className='flex-1'>
              Semua ({users.length})
            </TabsTrigger>
            <TabsTrigger value='sudah' className='flex-1'>
              Sudah ({reportedCount})
            </TabsTrigger>
            <TabsTrigger value='belum' className='flex-1'>
              Belum ({notReportedCount})
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <div className='relative'>
          <Search className='absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground' />
          <Input
            placeholder='Cari nama pegawai...'
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className='pl-9'
          />
        </div>
      </div>

      {filteredUsers.length === 0 ? (
        <div className='flex h-24 items-center justify-center rounded-lg border border-dashed text-sm text-muted-foreground'>
          {searchQuery ? 'Tidak ada pegawai yang cocok.' : 'Tidak ada data.'}
        </div>
      ) : (
        <div className='flex flex-col gap-2'>
          {filteredUsers.map((user) => {
            const userActs = activities.filter((a) => a.user_id === user.id)
            const hasReportedThisWeek = activeUsersThisWeek.has(user.id)
            const teamName = user.users_teams?.[0]?.teams?.name || '-'
            const isExpanded = expandedCard === user.id

            return (
              <div
                key={user.id}
                className={cn(
                  'rounded-xl border bg-card shadow-sm transition-colors',
                  hasReportedThisWeek
                    ? 'border-emerald-200 dark:border-emerald-900'
                    : 'border-red-200 dark:border-red-900'
                )}
              >
                <button
                  className='flex w-full items-center gap-3 p-4 text-left'
                  onClick={() => setExpandedCard(isExpanded ? null : user.id)}
                >
                  <div
                    className={cn(
                      'flex h-10 w-10 shrink-0 items-center justify-center rounded-full',
                      hasReportedThisWeek
                        ? 'bg-emerald-100 dark:bg-emerald-950/30'
                        : 'bg-red-100 dark:bg-red-950/30'
                    )}
                  >
                    <User
                      className={cn(
                        'h-5 w-5',
                        hasReportedThisWeek
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-red-600 dark:text-red-400'
                      )}
                    />
                  </div>
                  <div className='flex min-w-0 flex-1 flex-col gap-0.5'>
                    <p className='truncate font-medium'>
                      {user.name || 'Unknown'}
                    </p>
                    <p className='truncate text-xs text-muted-foreground'>
                      {teamName}
                    </p>
                  </div>
                  <div className='flex items-center gap-2'>
                    <Badge
                      variant={hasReportedThisWeek ? 'default' : 'destructive'}
                      className={cn(
                        hasReportedThisWeek &&
                          'bg-emerald-500 hover:bg-emerald-600'
                      )}
                    >
                      {hasReportedThisWeek ? 'Sudah Lapor' : 'Belum Lapor'}
                    </Badge>
                    {isExpanded ? (
                      <ChevronUp className='h-4 w-4 text-muted-foreground' />
                    ) : (
                      <ChevronDown className='h-4 w-4 text-muted-foreground' />
                    )}
                  </div>
                </button>

                {isExpanded && (
                  <div className='border-t border-border/50 px-4 py-3'>
                    <div className='mb-3 flex items-center justify-between rounded-lg bg-muted/50 p-3'>
                      <div>
                        <p className='text-xs text-muted-foreground'>
                          Aktivitas Bulan Ini
                        </p>
                        <p className='text-2xl font-bold'>{userActs.length}</p>
                      </div>
                      <div className='text-right'>
                        <p className='text-xs text-muted-foreground'>
                          Aktivitas Selesai
                        </p>
                        <p className='text-2xl font-bold text-emerald-600 dark:text-emerald-400'>
                          {userActs.filter((a) => a.is_done).length}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant='outline'
                      size='sm'
                      className='w-full'
                      onClick={() => {
                        setSelectedMemberId(user.id.toString())
                        setSelectedMemberName(user.name || 'Unknown')
                        setSheetOpen(true)
                      }}
                    >
                      Lihat Detail Aktivitas
                    </Button>
                  </div>
                )}
              </div>
            )
          })}
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
