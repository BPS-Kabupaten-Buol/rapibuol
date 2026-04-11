import { useState, useMemo } from 'react'
import {
  Search,
  User,
  CheckCircle2,
  XCircle,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
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
  activeUsersToday: Set<number>
  isLoading: boolean
}

export function KepalaSatkerCards({
  users,
  activities,
  activeUsersToday,
  isLoading,
}: KepalaSatkerCardsProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [sheetOpen, setSheetOpen] = useState(false)
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null)
  const [selectedMemberName, setSelectedMemberName] = useState<string>('')
  const [expandedCard, setExpandedCard] = useState<number | null>(null)

  const filteredUsers = useMemo(() => {
    if (!searchQuery.trim()) return users
    const query = searchQuery.toLowerCase()
    return users.filter((u) => u.name?.toLowerCase().includes(query))
  }, [users, searchQuery])

  const reportedCount = filteredUsers.filter((u) =>
    activeUsersToday.has(u.id)
  ).length
  const notReportedCount = filteredUsers.length - reportedCount

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
          Master Data Pantauan Pegawai Harian
        </h3>

        <div className='relative mb-3'>
          <Search className='absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground' />
          <Input
            placeholder='Cari nama pegawai...'
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className='pl-9'
          />
        </div>

        <div className='mb-3 flex items-center gap-3 text-xs'>
          <span className='flex items-center gap-1 rounded bg-emerald-50 px-2 py-1 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400'>
            <CheckCircle2 className='h-3 w-3' />
            {reportedCount} Sudah Lapor
          </span>
          <span className='flex items-center gap-1 rounded bg-red-50 px-2 py-1 text-red-600 dark:bg-red-950/30 dark:text-red-400'>
            <XCircle className='h-3 w-3' />
            {notReportedCount} Belum Lapor
          </span>
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
            const hasReportedToday = activeUsersToday.has(user.id)
            const teamName = user.users_teams?.[0]?.teams?.name || '-'
            const isExpanded = expandedCard === user.id

            return (
              <div
                key={user.id}
                className={cn(
                  'rounded-xl border bg-card shadow-sm transition-colors',
                  hasReportedToday
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
                      hasReportedToday
                        ? 'bg-emerald-100 dark:bg-emerald-950/30'
                        : 'bg-red-100 dark:bg-red-950/30'
                    )}
                  >
                    <User
                      className={cn(
                        'h-5 w-5',
                        hasReportedToday
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
                      variant={hasReportedToday ? 'default' : 'destructive'}
                      className={cn(
                        hasReportedToday &&
                          'bg-emerald-500 hover:bg-emerald-600'
                      )}
                    >
                      {hasReportedToday ? 'Sudah Lapor' : 'Belum Lapor'}
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
