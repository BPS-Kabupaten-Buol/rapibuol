import { useState } from 'react'
import {
  type ColumnDef,
  type SortingState,
  type VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table'
import { Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import type { UserTeamWithUser } from '../data/schema'

interface TeamMembersTableProps {
  members: UserTeamWithUser[]
  isLoading?: boolean
  onRemove: (memberId: number) => Promise<void>
}

export function TeamMembersTable({
  members,
  isLoading,
  onRemove,
}: TeamMembersTableProps) {
  const [rowSelection, setRowSelection] = useState({})
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
  const [sorting, setSorting] = useState<SortingState>([])
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10,
  })
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)

  const columns: ColumnDef<UserTeamWithUser>[] = [
    {
      accessorKey: 'user_name',
      header: 'Name',
      cell: ({ row }) => (
        <span className='font-medium'>{row.getValue('user_name')}</span>
      ),
    },
    {
      accessorKey: 'user_email',
      header: 'Email',
      cell: ({ row }) => (
        <span className='text-sm text-muted-foreground'>
          {row.getValue('user_email')}
        </span>
      ),
    },
    {
      accessorKey: 'created_at',
      header: 'Joined',
      cell: ({ row }) => {
        const date = row.getValue('created_at') as Date
        return <span className='text-sm'>{date.toLocaleDateString()}</span>
      },
    },
    {
      id: 'actions',
      cell: ({ row }) => (
        <div className='text-right'>
          <Button
            variant='ghost'
            size='sm'
            onClick={() => {
              setDeletingId(row.original.id)
              setDeleteConfirmOpen(true)
            }}
            className='text-red-600 hover:text-red-700'
          >
            <Trash2 className='h-4 w-4' />
          </Button>
        </div>
      ),
    },
  ]

  const table = useReactTable({
    data: members,
    columns,
    state: {
      sorting,
      pagination,
      rowSelection,
      columnVisibility,
    },
    enableRowSelection: true,
    onPaginationChange: setPagination,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onColumnVisibilityChange: setColumnVisibility,
    getPaginationRowModel: getPaginationRowModel(),
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
  })

  const handleRemove = async () => {
    if (!deletingId) return

    try {
      await onRemove(deletingId)
      toast.success('Member removed successfully')
      setDeleteConfirmOpen(false)
      setDeletingId(null)
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Failed to remove member'
      )
    }
  }

  return (
    <>
      <div className='rounded-lg border'>
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className='group/row'>
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    className={cn(
                      'bg-background group-hover/row:bg-muted group-data-[state=selected]/row:bg-muted'
                    )}
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className='h-24 text-center'
                >
                  Loading members...
                </TableCell>
              </TableRow>
            ) : table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && 'selected'}
                  className='group/row'
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell
                      key={cell.id}
                      className={cn(
                        'bg-background group-hover/row:bg-muted group-data-[state=selected]/row:bg-muted'
                      )}
                    >
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className='h-24 text-center'
                >
                  No members in this team
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Member</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove this member from the team? This
              action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className='flex gap-2'>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRemove}
              className='text-destructive-foreground bg-destructive hover:bg-destructive/90'
            >
              Remove
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
