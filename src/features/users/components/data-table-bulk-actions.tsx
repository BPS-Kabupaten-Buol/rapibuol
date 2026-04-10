import { useState } from 'react'
import { type Table } from '@tanstack/react-table'
import { KeyRound } from 'lucide-react'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { DataTableBulkActions as BulkActionsToolbar } from '@/components/data-table'
import { type User } from '../data/schema'

type DataTableBulkActionsProps<TData> = {
  table: Table<TData>
}

export function DataTableBulkActions<TData>({
  table,
}: DataTableBulkActionsProps<TData>) {
  const [isSending, setIsSending] = useState(false)
  const selectedRows = table.getFilteredSelectedRowModel().rows

  const handleBulkResetPassword = async () => {
    setIsSending(true)
    const selectedUsers = selectedRows.map((row) => row.original as User)

    try {
      await Promise.all(
        selectedUsers.map((user) =>
          supabase.auth.resetPasswordForEmail(user.email)
        )
      )
      toast.success(
        `Reset password link sent to ${selectedUsers.length} user${selectedUsers.length > 1 ? 's' : ''}`
      )
      table.resetRowSelection()
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : 'Failed to send reset links'
      )
    } finally {
      setIsSending(false)
    }
  }

  return (
    <BulkActionsToolbar table={table} entityName='user'>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant='outline'
            size='icon'
            onClick={handleBulkResetPassword}
            disabled={isSending}
            className='size-8'
            aria-label='Send reset password to selected users'
          >
            <KeyRound />
            <span className='sr-only'>Send reset password</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>{isSending ? 'Sending...' : 'Send reset password'}</p>
        </TooltipContent>
      </Tooltip>
    </BulkActionsToolbar>
  )
}
