import { useState, useMemo } from 'react'
import { Check, Search, Users } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Checkbox } from '@/components/ui/checkbox'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useUsers } from '@/features/users/hooks'
import { type UserTeamWithUser } from '../data/schema'

interface AddMemberDialogProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  onAddMembers: (userIds: string[]) => Promise<void>
  currentMembers: UserTeamWithUser[]
}

export function AddMemberDialog({
  isOpen,
  onOpenChange,
  onAddMembers,
  currentMembers,
}: AddMemberDialogProps) {
  const { users } = useUsers()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([])
  const [searchQuery, setSearchQuery] = useState('')

  // Filter out users that are already team members
  const availableUsers = useMemo(
    () => users.filter((user) => !currentMembers.some((m) => m.user_id === user.id)),
    [users, currentMembers]
  )

  // Filter by search query
  const filteredUsers = useMemo(() => {
    const q = searchQuery.toLowerCase()
    if (!q) return availableUsers
    return availableUsers.filter(
      (u: any) => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)
    )
  }, [availableUsers, searchQuery])

  const toggleUser = (userId: string) => {
    setSelectedUserIds((prev: string[]) =>
      prev.includes(userId) ? prev.filter((id: string) => id !== userId) : [...prev, userId]
    )
  }

  const toggleAll = () => {
    if (selectedUserIds.length === filteredUsers.length && filteredUsers.length > 0) {
      setSelectedUserIds([])
    } else {
      setSelectedUserIds(filteredUsers.map((u: any) => u.id))
    }
  }

  const handleAdd = async () => {
    if (selectedUserIds.length === 0) return
    setIsSubmitting(true)
    try {
      await onAddMembers(selectedUserIds)
      toast.success(`${selectedUserIds.length} anggota berhasil ditambahkan!`)
      setSelectedUserIds([])
      setSearchQuery('')
      onOpenChange(false)
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Gagal menambahkan anggota'
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    setSelectedUserIds([])
    setSearchQuery('')
    onOpenChange(false)
  }

  const allFilteredSelected =
    filteredUsers.length > 0 &&
    filteredUsers.every((u: any) => selectedUserIds.includes(u.id))

  return (
    <Sheet open={isOpen} onOpenChange={handleClose}>
      <SheetContent className='flex w-full flex-col sm:max-w-md'>
        <SheetHeader className='mb-4 text-left'>
          <SheetTitle className='flex items-center gap-2'>
            <Users className='h-5 w-5' />
            Pilih Anggota Tim
          </SheetTitle>
          <SheetDescription>
            Pilih beberapa pengguna sekaligus untuk ditambahkan ke tim ini.
          </SheetDescription>
        </SheetHeader>

        <div className='flex flex-1 flex-col gap-4 overflow-hidden p-2'>
          {/* Search bar */}
          <div className='relative'>
            <Search className='absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground' />
            <Input
              placeholder='Cari nama atau email...'
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className='h-9 pl-9'
            />
          </div>

          {/* Selected count badge */}
          {selectedUserIds.length > 0 && (
            <div className='flex items-center justify-between'>
              <span className='text-xs font-medium text-muted-foreground'>
                {selectedUserIds.length} pengguna dipilih
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedUserIds([])}
                className="h-7 px-2 text-xs text-red-500 hover:text-red-700 hover:bg-red-50"
              >
                Reset
              </Button>
            </div>
          )}

          {/* User List */}
          <div className='flex-1 overflow-hidden rounded-md border bg-muted/20'>
            <ScrollArea className='h-full'>
              {filteredUsers.length === 0 ? (
                <div className='flex h-full items-center justify-center p-8 text-center text-sm text-muted-foreground'>
                  {searchQuery
                    ? 'Tidak ada pengguna yang cocok.'
                    : 'Semua pengguna sudah terdaftar di tim ini.'}
                </div>
              ) : (
                <div className='divide-y'>
                  {/* Select All row */}
                  <label className='flex cursor-pointer items-center gap-3 bg-muted/40 px-4 py-3 transition-colors hover:bg-muted/70'>
                    <Checkbox
                      checked={allFilteredSelected}
                      onCheckedChange={toggleAll}
                    />
                    <div className='flex flex-1 flex-col'>
                      <span className='text-xs font-semibold'>Pilih Semua</span>
                      <span className='text-[10px] text-muted-foreground'>
                        {filteredUsers.length} pengguna tampil
                      </span>
                    </div>
                  </label>

                  {filteredUsers.map((user: any) => {
                    const isSelected = selectedUserIds.includes(user.id)
                    return (
                      <label
                        key={user.id}
                        className={cn(
                          'flex cursor-pointer items-center gap-3 px-4 py-3 transition-colors hover:bg-muted/50',
                          isSelected && 'bg-primary/5'
                        )}
                      >
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => toggleUser(user.id)}
                        />
                        <div className='flex flex-1 flex-col'>
                          <span className='text-sm font-medium leading-none'>
                            {user.name}
                          </span>
                          <span className='mt-1 text-xs text-muted-foreground'>
                            {user.email}
                          </span>
                        </div>
                        {isSelected && (
                          <Check className='h-4 w-4 text-primary' />
                        )}
                      </label>
                    )
                  })}
                </div>
              )}
            </ScrollArea>
          </div>

          <div className='flex gap-3 pt-4'>
            <Button
              variant='outline'
              className='flex-1'
              onClick={handleClose}
              disabled={isSubmitting}
            >
              Batal
            </Button>
            <Button
              className='flex-1'
              onClick={handleAdd}
              disabled={isSubmitting || selectedUserIds.length === 0}
            >
              {isSubmitting
                ? 'Menambahkan...'
                : `Tambah (${selectedUserIds.length})`}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
