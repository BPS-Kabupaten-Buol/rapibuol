import { useState, useMemo } from 'react'
import { Trash2, Plus, X, Search, Users, Check } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useUsers } from '@/features/users/hooks'
import { useTeamMembers } from '../hooks'
import { useTeamDialog } from './teams-provider'

export function TeamsMembersDialog() {
  const { isMembersOpen, onMembersOpen, selectedTeam } = useTeamDialog()
  const [isAddingMember, setIsAddingMember] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([])
  const [searchQuery, setSearchQuery] = useState('')

  const { members, isLoading, addMembers, removeMember } = useTeamMembers(
    selectedTeam?.id || 0
  )
  const { users } = useUsers()

  // Filter out users that are already team members
  const availableUsers = useMemo(
    () => users.filter((user) => !members.some((m) => m.user_id === user.id)),
    [users, members]
  )

  // Filter by search query
  const filteredUsers = useMemo(() => {
    const q = searchQuery.toLowerCase()
    if (!q) return availableUsers
    return availableUsers.filter(
      (u) => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)
    )
  }, [availableUsers, searchQuery])

  const toggleUser = (userId: string) => {
    setSelectedUserIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    )
  }

  const toggleAll = () => {
    if (selectedUserIds.length === filteredUsers.length) {
      setSelectedUserIds([])
    } else {
      setSelectedUserIds(filteredUsers.map((u) => u.id))
    }
  }

  const handleAddMembers = async () => {
    if (selectedUserIds.length === 0) return
    setIsSubmitting(true)
    try {
      await addMembers(selectedUserIds)
      const count = selectedUserIds.length
      toast.success(`${count} anggota berhasil ditambahkan!`)
      setSelectedUserIds([])
      setSearchQuery('')
      setIsAddingMember(false)
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Gagal menambahkan anggota'
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancel = () => {
    setIsAddingMember(false)
    setSelectedUserIds([])
    setSearchQuery('')
  }

  const handleRemoveMember = async (memberId: number, memberName: string) => {
    try {
      await removeMember(memberId)
      toast.success(`${memberName} dihapus dari tim`)
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Gagal menghapus anggota'
      )
    }
  }

  const allFilteredSelected =
    filteredUsers.length > 0 &&
    filteredUsers.every((u) => selectedUserIds.includes(u.id))

  return (
    <Dialog open={isMembersOpen} onOpenChange={onMembersOpen}>
      <DialogContent className='flex max-w-2xl flex-col'>
        <DialogHeader>
          <DialogTitle className='flex items-center gap-2'>
            <Users className='h-5 w-5' />
            Anggota Tim
          </DialogTitle>
          <DialogDescription>
            Kelola anggota untuk tim{' '}
            <span className='font-semibold text-foreground'>
              {selectedTeam?.name}
            </span>
          </DialogDescription>
        </DialogHeader>

        <div className='space-y-4'>
          {/* Add Member Panel */}
          {!isAddingMember ? (
            <Button
              onClick={() => setIsAddingMember(true)}
              variant='outline'
              size='sm'
              className='w-full'
              disabled={availableUsers.length === 0}
            >
              <Plus className='mr-2 h-4 w-4' />
              {availableUsers.length === 0
                ? 'Semua pengguna sudah menjadi anggota'
                : 'Tambah Anggota'}
            </Button>
          ) : (
            <div className='rounded-lg border bg-muted/30'>
              {/* Panel header */}
              <div className='flex items-center justify-between border-b px-4 py-3'>
                <div className='flex items-center gap-2'>
                  <h3 className='text-sm font-semibold'>Pilih Anggota Baru</h3>
                  {selectedUserIds.length > 0 && (
                    <Badge variant='secondary'>{selectedUserIds.length} dipilih</Badge>
                  )}
                </div>
                <button
                  onClick={handleCancel}
                  className='text-muted-foreground transition-colors hover:text-foreground'
                >
                  <X className='h-4 w-4' />
                </button>
              </div>

              {/* Search */}
              <div className='border-b px-4 py-2'>
                <div className='relative'>
                  <Search className='absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground' />
                  <Input
                    placeholder='Cari nama atau email...'
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className='h-9 pl-9'
                  />
                </div>
              </div>

              {/* User List */}
              <ScrollArea className='h-52'>
                {filteredUsers.length === 0 ? (
                  <div className='flex h-full items-center justify-center py-8 text-sm text-muted-foreground'>
                    {searchQuery
                      ? 'Tidak ada pengguna yang cocok'
                      : 'Semua pengguna sudah menjadi anggota'}
                  </div>
                ) : (
                  <div className='divide-y'>
                    {/* Select All row */}
                    <label className='flex cursor-pointer items-center gap-3 bg-muted/40 px-4 py-2.5 transition-colors hover:bg-muted/70'>
                      <Checkbox
                        checked={allFilteredSelected}
                        onCheckedChange={toggleAll}
                        id='select-all'
                      />
                      <span className='text-xs font-medium text-muted-foreground'>
                        Pilih semua ({filteredUsers.length})
                      </span>
                    </label>

                    {filteredUsers.map((user) => {
                      const isSelected = selectedUserIds.includes(user.id)
                      return (
                        <label
                          key={user.id}
                          htmlFor={`user-${user.id}`}
                          className='flex cursor-pointer items-center gap-3 px-4 py-2.5 transition-colors hover:bg-muted/50'
                        >
                          <Checkbox
                            id={`user-${user.id}`}
                            checked={isSelected}
                            onCheckedChange={() => toggleUser(user.id)}
                          />
                          <div className='flex flex-1 items-center justify-between'>
                            <span className='text-sm font-medium'>{user.name}</span>
                            <span className='text-xs text-muted-foreground'>
                              {user.email}
                            </span>
                          </div>
                          {isSelected && (
                            <Check className='h-3.5 w-3.5 text-primary' />
                          )}
                        </label>
                      )
                    })}
                  </div>
                )}
              </ScrollArea>

              {/* Actions */}
              <div className='flex items-center justify-between border-t px-4 py-3'>
                <span className='text-xs text-muted-foreground'>
                  {selectedUserIds.length === 0
                    ? 'Belum ada yang dipilih'
                    : `${selectedUserIds.length} pengguna dipilih`}
                </span>
                <div className='flex gap-2'>
                  <Button variant='outline' size='sm' onClick={handleCancel}>
                    Batal
                  </Button>
                  <Button
                    size='sm'
                    onClick={handleAddMembers}
                    disabled={selectedUserIds.length === 0 || isSubmitting}
                  >
                    {isSubmitting
                      ? 'Menambahkan...'
                      : `Tambah ${selectedUserIds.length > 0 ? `(${selectedUserIds.length})` : ''}`}
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Members List */}
          <div className='rounded-lg border'>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nama</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Bergabung</TableHead>
                  <TableHead className='w-10 text-right'>Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={4} className='h-24 text-center'>
                      Memuat anggota...
                    </TableCell>
                  </TableRow>
                ) : members.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className='h-24 text-center'>
                      Belum ada anggota di tim ini
                    </TableCell>
                  </TableRow>
                ) : (
                  members.map((member) => (
                    <TableRow key={member.id}>
                      <TableCell className='font-medium'>
                        {member.user_name}
                      </TableCell>
                      <TableCell className='text-sm text-muted-foreground'>
                        {member.user_email}
                      </TableCell>
                      <TableCell className='text-sm'>
                        {member.created_at.toLocaleDateString('id-ID')}
                      </TableCell>
                      <TableCell className='text-right'>
                        <button
                          onClick={() =>
                            handleRemoveMember(member.id, member.user_name)
                          }
                          className='text-red-500 transition-colors hover:text-red-700'
                          title='Hapus anggota'
                        >
                          <Trash2 className='h-4 w-4' />
                        </button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          <div className='flex justify-end gap-2'>
            <Button variant='outline' onClick={() => onMembersOpen(false)}>
              Tutup
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
