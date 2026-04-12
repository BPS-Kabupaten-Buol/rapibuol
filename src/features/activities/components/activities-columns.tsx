import { format } from 'date-fns'
import { Link } from '@tanstack/react-router'
import { type ColumnDef } from '@tanstack/react-table'
import { ClipboardList } from 'lucide-react'
import { Checkbox } from '@/components/ui/checkbox'
import { DataTableColumnHeader } from '@/components/data-table'
import { type Team } from '@/features/teams/api/teams'
import { type Unit } from '@/features/units/api/units'
import { statuses } from '../data/data'
import { type Activity } from '../data/schema'
import { DataTableRowActions } from './data-table-row-actions'

function truncateUrl(url: string, maxLength = 30): string {
  try {
    const parsed = new URL(url)
    const domain =
      parsed.hostname + (parsed.pathname.length > 1 ? parsed.pathname : '')
    if (domain.length > maxLength) {
      return domain.slice(0, maxLength - 3) + '...'
    }
    return domain
  } catch {
    return url.length > maxLength ? url.slice(0, maxLength - 3) + '...' : url
  }
}

export const activitiesColumns = (
  teams: Team[],
  units: Unit[]
): ColumnDef<Activity>[] => [
  {
    id: 'select',
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && 'indeterminate')
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label='Pilih semua'
        className='translate-y-[2px]'
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label='Pilih baris'
        className='translate-y-[2px]'
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: 'description',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Deskripsi' />
    ),
    meta: {
      className: 'ps-1 min-w-[350px]',
      tdClassName: 'ps-4',
    },
    cell: ({ row }) => {
      return (
        <div className='flex items-start gap-3 py-1'>
          {/* Menggunakan items-start agar icon tetap di atas jika teks panjang */}
          <div className='mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10'>
            <ClipboardList className='h-4 w-4 text-primary' />
          </div>

          {/* Gunakan whitespace-normal agar teks bisa wrap ke bawah */}
          {/* Atau gunakan line-clamp-2 jika ingin membatasi hanya 2 baris */}
          <div className='flex flex-col'>
            <span className='leading-tight font-medium break-words whitespace-normal'>
              {row.getValue('description')}
            </span>
          </div>
        </div>
      )
    },
  },
  {
    accessorKey: 'date',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Tanggal' />
    ),
    meta: {
      className: 'w-[140px]',
    },
    cell: ({ row }) => {
      const dateVal = row.getValue('date')
      return (
        <div className='text-center'>
          {dateVal ? format(new Date(dateVal as string), 'PPP') : '-'}
        </div>
      )
    },
  },
  {
    accessorKey: 'end_date',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Tanggal Berakhir' />
    ),
    meta: {
      className: 'w-[140px]',
    },
    cell: ({ row }) => {
      const endDateVal = row.original.end_date
      return (
        <div className='text-center'>
          {endDateVal ? format(new Date(endDateVal), 'PPP') : '-'}
        </div>
      )
    },
  },
  {
    accessorKey: 'volume',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Volume' />
    ),
    meta: {
      className: 'w-[100px] text-center',
      thClassName: 'text-center',
    },
    cell: ({ row }) => (
      <div className='text-center'>{row.getValue('volume')}</div>
    ),
  },
  {
    accessorKey: 'unit',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Satuan' />
    ),
    meta: {
      className: 'w-[120px]',
    },
    cell: ({ row }) => {
      const unit = units.find((u) => u.id === row.getValue('unit'))
      return <div>{unit ? unit.name : '-'}</div>
    },
  },
  {
    accessorKey: 'start_time',
    header: ({ column }) => (
      <DataTableColumnHeader
        column={column}
        title='Jam Mulai'
        className='w-full justify-center'
      />
    ),
    meta: {
      className: 'w-[100px] text-center',
      thClassName: 'text-center',
    },
    cell: ({ row }) => (
      <div className='text-center'>{row.original.start_time || '-'}</div>
    ),
  },
  {
    accessorKey: 'end_time',
    header: ({ column }) => (
      <DataTableColumnHeader
        column={column}
        title='Jam Selesai'
        className='w-full justify-center'
      />
    ),
    meta: {
      className: 'w-[100px] text-center',
      thClassName: 'text-center',
    },
    cell: ({ row }) => (
      <div className='text-center'>{row.original.end_time || '-'}</div>
    ),
  },
  {
    accessorKey: 'assignor',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Pemberi Tugas' />
    ),
    meta: {
      className: 'w-[140px]',
    },
    cell: ({ row }) => {
      const team = teams.find((t) => t.id === row.getValue('assignor'))
      return <div>{team ? team.name : '-'}</div>
    },
  },
  {
    accessorKey: 'link_bukti_dukung',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Bukti Dukung' />
    ),
    meta: {
      className: 'w-[140px]',
    },
    cell: ({ row }) => {
      const url = row.original.link_bukti_dukung
      if (!url) return <div>-</div>
      return (
        <div className='text-left'>
          <Link
            className='hover:text-blue-500 hover:underline'
            to={url}
            target='_blank'
            title={url}
          >
            {truncateUrl(url)}
          </Link>
        </div>
      )
    },
  },
  {
    accessorKey: 'is_done',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Status' />
    ),
    cell: ({ row }) => {
      const status = statuses.find(
        (status) => status.value === row.getValue('is_done')
      )

      if (!status) return null

      return (
        <div className='flex w-[120px] items-center gap-2'>
          {status.icon && (
            <status.icon
              className={`size-4 ${row.getValue('is_done') ? 'text-green-500' : 'text-yellow-500'}`}
            />
          )}
          <span>{status.label}</span>
        </div>
      )
    },
  },
  {
    id: 'actions',
    cell: ({ row }) => <DataTableRowActions row={row} />,
  },
]
