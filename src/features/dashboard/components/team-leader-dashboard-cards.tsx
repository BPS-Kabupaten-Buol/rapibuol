import { useState } from 'react'
import { User, CheckCircle2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { MemberActivityDialog } from './member-activity-dialog'

interface MemberProfile {
  name?: string
  email?: string
  users_roles?: Array<{ roles?: Array<{ name?: string }> }>
}

interface TeamMember {
  user_id: number
  profiles?: MemberProfile | MemberProfile[] | null
}

interface Activity {
  id: number
  user_id: number
  is_done: boolean
  description?: string
}

interface TeamLeaderCardsProps {
  members: TeamMember[]
  activities: Activity[]
  missingReportMembers: TeamMember[]
  isLoading: boolean
}

function getProfileData(member: TeamMember): MemberProfile {
  if (!member.profiles) return {}
  if (Array.isArray(member.profiles)) return member.profiles[0] || {}
  return member.profiles
}

export function TeamLeaderCards({
  members,
  activities,
  missingReportMembers,
  isLoading,
}: TeamLeaderCardsProps) {
  const [sheetOpen, setSheetOpen] = useState(false)
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null)
  const [selectedMemberName, setSelectedMemberName] = useState<string>('')

  if (isLoading) {
    return (
      <div className='flex flex-col gap-4'>
        <div className='space-y-2'>
          <Skeleton className='h-5 w-40' />
          {Array.from({ length: 2 }).map((_, i) => (
            <div
              key={i}
              className='flex items-center gap-3 rounded-lg border bg-card p-3'
            >
              <Skeleton className='h-10 w-10 rounded-full' />
              <div className='flex-1 space-y-1'>
                <Skeleton className='h-4 w-32' />
                <Skeleton className='h-3 w-24' />
              </div>
            </div>
          ))}
        </div>
        <div className='space-y-2'>
          <Skeleton className='h-5 w-40' />
          {Array.from({ length: 2 }).map((_, i) => (
            <div
              key={i}
              className='flex items-center gap-3 rounded-lg border bg-card p-3'
            >
              <Skeleton className='h-10 w-10 rounded-full' />
              <div className='flex-1 space-y-1'>
                <Skeleton className='h-4 w-32' />
                <Skeleton className='h-3 w-24' />
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className='flex flex-col gap-6'>
      <div className='space-y-3'>
        <div className='flex items-center gap-2'>
          <h3 className='font-semibold'>Performa Anggota</h3>
          <Badge variant='secondary' className='text-xs'>
            {members.length} anggota
          </Badge>
        </div>
        <div className='flex flex-col gap-2'>
          {members.map((member) => {
            const profileData = getProfileData(member)
            const memberActs = activities.filter(
              (a) => a.user_id === member.user_id
            )
            const doneActs = memberActs.filter((a) => a.is_done)
            const completionRate =
              memberActs.length > 0
                ? Math.round((doneActs.length / memberActs.length) * 100)
                : 0

            return (
              <div
                key={member.user_id}
                className='flex items-center gap-3 rounded-lg border bg-card p-3'
              >
                <div className='flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted'>
                  <User className='h-5 w-5 text-muted-foreground' />
                </div>
                <div className='flex min-w-0 flex-1 flex-col gap-1'>
                  <p className='truncate text-sm font-medium'>
                    {profileData.name || 'Unknown'}
                  </p>
                  <div className='flex flex-wrap items-center gap-2 text-xs'>
                    <span className='rounded bg-muted px-1.5 py-0.5 text-muted-foreground'>
                      {memberActs.length} tugas
                    </span>
                    <span
                      className={cn(
                        'rounded px-1.5 py-0.5 font-medium',
                        completionRate === 100
                          ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400'
                          : completionRate >= 50
                            ? 'bg-amber-50 text-amber-600 dark:bg-amber-950/30 dark:text-amber-400'
                            : 'bg-red-50 text-red-600 dark:bg-red-950/30 dark:text-red-400'
                      )}
                    >
                      {completionRate}% selesai
                    </span>
                  </div>
                </div>
                <Button
                  variant='ghost'
                  size='sm'
                  className='shrink-0'
                  onClick={() => {
                    setSelectedMemberId(member.user_id.toString())
                    setSelectedMemberName(profileData.name || 'Unknown')
                    setSheetOpen(true)
                  }}
                >
                  Detail
                </Button>
              </div>
            )
          })}
        </div>
      </div>

      <div className='space-y-3'>
        <div className='flex items-center gap-2'>
          <h3 className='font-semibold text-red-600 dark:text-red-400'>
            Belum Ada Pelaporan
          </h3>
          {missingReportMembers.length > 0 ? (
            <Badge variant='destructive' className='text-xs'>
              {missingReportMembers.length} belum melapor
            </Badge>
          ) : (
            <Badge variant='default' className='bg-emerald-500 text-xs'>
              Semua sudah melapor
            </Badge>
          )}
        </div>
        <div className='flex flex-col gap-2'>
          {missingReportMembers.length === 0 ? (
            <div className='flex items-center justify-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-600 dark:border-emerald-900 dark:bg-emerald-950/20 dark:text-emerald-400'>
              <CheckCircle2 className='h-4 w-4' />
              Semua anggota sudah melapor hari ini!
            </div>
          ) : (
            missingReportMembers.map((member) => {
              const profileData = getProfileData(member)
              return (
                <div
                  key={member.user_id}
                  className='flex items-center gap-3 rounded-lg border border-red-200 bg-red-50/50 p-3 dark:border-red-900 dark:bg-red-950/10'
                >
                  <div className='flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-100 dark:bg-red-950/30'>
                    <User className='h-5 w-5 text-red-500' />
                  </div>
                  <div className='flex min-w-0 flex-1 flex-col gap-0.5'>
                    <p className='truncate text-sm font-medium'>
                      {profileData.name || 'Unknown'}
                    </p>
                    <span className='text-xs text-muted-foreground'>
                      Belum input aktivitas hari ini
                    </span>
                  </div>
                  <Badge variant='destructive' className='shrink-0 text-xs'>
                    Belum Lapor
                  </Badge>
                </div>
              )
            })
          )}
        </div>
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
