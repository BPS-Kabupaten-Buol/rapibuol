import { useEffect, useMemo, useState, useCallback } from 'react'
import {
  startOfDay,
  endOfDay,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
} from 'date-fns'
import { useQuery } from '@tanstack/react-query'
import { getRouteApi } from '@tanstack/react-router'
import {
  type SortingState,
  type VisibilityState,
  flexRender,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table'
import {
  Check,
  Download,
  LayoutGrid,
  ListChecks,
  Table as TableIcon,
  X,
} from 'lucide-react'
import { type DateRange } from 'react-day-picker'
import { cn } from '@/lib/utils'
// import { useIsMobile } from '@/hooks/use-mobile'
import { useTableUrlState } from '@/hooks/use-table-url-state'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { DataTablePagination, DataTableToolbar } from '@/components/data-table'
import { DateRangePicker } from '@/components/date-range-picker'
import { getTeams } from '@/features/teams/api/teams'
import { getUnits } from '@/features/units/api/units'
import { type Activity } from '../data/schema'
import { exportActivities } from '../lib/export-activities'
import { ActivitiesCards } from './activities-cards'
import { activitiesColumns } from './activities-columns'
import { useActivities } from './activities-provider'
import { DataTableBulkActions } from './data-table-bulk-actions'

const route = getRouteApi('/_authenticated/activities/')

type DataTableProps = {
  data: Activity[]
  isLoading?: boolean
}

type DateFilter = 'today' | 'week' | 'month'

const DATE_FILTER_LABELS: Record<DateFilter, string> = {
  today: 'Hari Ini',
  week: 'Minggu Ini',
  month: 'Bulan Ini',
}

function getDateRange(filter: DateFilter): { start: Date; end: Date } {
  const now = new Date()
  switch (filter) {
    case 'today':
      return { start: startOfDay(now), end: endOfDay(now) }
    case 'week':
      return {
        start: startOfWeek(now, { weekStartsOn: 1 }),
        end: endOfWeek(now, { weekStartsOn: 1 }),
      }
    case 'month':
      return { start: startOfMonth(now), end: endOfMonth(now) }
  }
}

export function ActivitiesTable({ data, isLoading }: DataTableProps) {
  const { setDetailActivity, selectionMode, setSelectionMode } = useActivities()

  const { data: teams = [] } = useQuery({
    queryKey: ['teams', 'options'],
    queryFn: getTeams,
  })

  const { data: units = [] } = useQuery({
    queryKey: ['units'],
    queryFn: getUnits,
  })

  // Date preset filter state - default: today
  const [dateFilter, setDateFilter] = useState<DateFilter>('today')

  // const isMobile = useIsMobile()

  // View mode state - default is card for mobile, table for desktop
  const [viewMode, setViewMode] = useState<'table' | 'card'>('card')

  // // Sync viewMode with mobile detection on initial mount
  // useEffect(() => {
  //   setViewMode(isMobile ? 'card' : 'table')
  // }, [isMobile])

  // Manual date range state (overrides preset when filled)
  const [dateRange, setDateRange] = useState<DateRange | undefined>()

  const handleFilterChange = useCallback((filter: DateFilter) => {
    setDateFilter(filter)
    setDateRange(undefined)
  }, [])

  // Filter data: manual range takes priority over preset
  const filteredData = useMemo(() => {
    if (dateRange?.from) {
      const from = dateRange.from
      const to = dateRange.to
      return data.filter((task) => {
        const taskDate = new Date(task.date)
        if (!to) return taskDate >= startOfDay(from)
        return taskDate >= startOfDay(from) && taskDate <= endOfDay(to)
      })
    }
    const { start, end } = getDateRange(dateFilter)
    return data.filter((task) => {
      const taskDate = new Date(task.date)
      return taskDate >= start && taskDate <= end
    })
  }, [data, dateFilter, dateRange])

  // Local UI-only states
  const [rowSelection, setRowSelection] = useState({})
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})

  // Local state management for table (uncomment to use local-only state, not synced with URL)
  // const [globalFilter, onGlobalFilterChange] = useState('')
  // const [columnFilters, onColumnFiltersChange] = useState<ColumnFiltersState>([])
  // const [pagination, onPaginationChange] = useState<PaginationState>({ pageIndex: 0, pageSize: 10 })

  // Synced with URL states (updated to match route search schema defaults)
  const {
    globalFilter,
    onGlobalFilterChange,
    columnFilters,
    onColumnFiltersChange,
    pagination,
    onPaginationChange,
    ensurePageInRange,
  } = useTableUrlState({
    search: route.useSearch(),
    navigate: route.useNavigate(),
    pagination: { defaultPage: 1, defaultPageSize: 10 },
    globalFilter: { enabled: true, key: 'filter' },
    columnFilters: [
      { columnId: 'is_done', searchKey: 'is_done', type: 'array' },
      { columnId: 'assignor', searchKey: 'assignor', type: 'array' },
    ],
  })

  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data: filteredData,
    columns: activitiesColumns(teams, units, selectionMode),
    state: {
      sorting,
      columnVisibility,
      rowSelection,
      columnFilters,
      globalFilter,
      pagination,
    },
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onColumnVisibilityChange: setColumnVisibility,
    globalFilterFn: (row, _columnId, filterValue) => {
      const description = String(row.getValue('description')).toLowerCase()
      const searchValue = String(filterValue).toLowerCase()

      return description.includes(searchValue)
    },
    filterFns: {
      dateRange: (row, columnId, filterValue) => {
        const rowDate = new Date(row.getValue(columnId))
        const [startDate, endDate] = filterValue as [string, string]

        if (!startDate && !endDate) return true
        if (startDate && !endDate) return rowDate >= new Date(startDate)
        if (!startDate && endDate) return rowDate <= new Date(endDate)
        return rowDate >= new Date(startDate) && rowDate <= new Date(endDate)
      },
    },
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    onPaginationChange,
    onGlobalFilterChange,
    onColumnFiltersChange,
  })

  const pageCount = table.getPageCount()
  useEffect(() => {
    ensurePageInRange(pageCount)
  }, [pageCount, ensurePageInRange])

  const selectedCount = table.getFilteredSelectedRowModel().rows.length

  const stopSelectionMode = () => {
    table.resetRowSelection()
    setSelectionMode(false)
  }

  const toggleSelectionMode = () => {
    if (selectionMode) {
      stopSelectionMode()
      return
    }
    setSelectionMode(true)
  }

  return (
    <div
      className={cn(
        'max-sm:has-[div[role="toolbar"]]:mb-16', // Add margin bottom to the table on mobile when the toolbar is visible
        'flex flex-1 flex-col gap-4'
      )}
    >
      <DataTableToolbar
        table={table}
        searchPlaceholder='Cari deskripsi...'
        filters={
          [
            // {
            //   columnId: 'assignor',
            //   title: 'Tim',
            //   options: teams.map((t) => ({ label: t.name, value: String(t.id) })),
            // },
          ]
        }
        viewSlot={
          <div className='flex min-w-0 items-center gap-2'>
            <Button
              variant={selectionMode ? 'secondary' : 'outline'}
              size='sm'
              className='h-8 gap-1.5'
              onClick={toggleSelectionMode}
            >
              {selectionMode ? (
                <X className='h-3.5 w-3.5' />
              ) : (
                <ListChecks className='h-3.5 w-3.5' />
              )}
              <span className='max-sm:hidden'>
                {selectionMode ? 'Batal' : 'Pilih'}
              </span>
            </Button>
            <Button
              variant='outline'
              size='sm'
              className='h-8 gap-1.5'
              onClick={() => exportActivities(filteredData, teams, units)}
              disabled={filteredData.length === 0}
            >
              <Download className='h-3.5 w-3.5' />
              <span className='max-sm:hidden'>Export</span>
            </Button>
            <Tabs
              value={viewMode}
              onValueChange={(v) => setViewMode(v as 'table' | 'card')}
              className='h-8'
            >
              <TabsList className='h-8 p-1'>
                <TabsTrigger
                  value='card'
                  className='h-6 px-2'
                  title='Tampilan Kartu'
                >
                  <LayoutGrid className='h-3.5 w-3.5' />
                </TabsTrigger>
                <TabsTrigger
                  value='table'
                  className='h-6 px-2'
                  title='Tampilan Tabel'
                >
                  <TableIcon className='h-3.5 w-3.5' />
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        }
        dateRangeSlot={
          <div className='flex min-w-0 flex-wrap items-center gap-2 overflow-x-auto'>
            <div className='flex items-center gap-1 rounded-lg border p-1'>
              {(Object.keys(DATE_FILTER_LABELS) as DateFilter[]).map(
                (filter) => (
                  <Button
                    key={filter}
                    variant={
                      dateFilter === filter && !dateRange?.from
                        ? 'default'
                        : 'ghost'
                    }
                    size='sm'
                    className='h-7 px-3 text-xs'
                    onClick={() => handleFilterChange(filter)}
                  >
                    {DATE_FILTER_LABELS[filter]}
                    {dateFilter === filter && !dateRange?.from && (
                      <Badge
                        variant='secondary'
                        className='ml-1.5 h-4 px-1 text-[10px]'
                      >
                        {filteredData.length}
                      </Badge>
                    )}
                  </Button>
                )
              )}
            </div>
            <DateRangePicker
              date={dateRange}
              onSelect={(range) => {
                setDateRange(range)
                if (range?.from) {
                  setDateFilter('today')
                }
              }}
            />
            {dateRange?.from && (
              <Button
                variant='ghost'
                size='sm'
                className='h-8 px-2 text-xs text-muted-foreground'
                onClick={() => {
                  setDateRange(undefined)
                  setDateFilter('today')
                }}
              >
                Atur Ulang
              </Button>
            )}
          </div>
        }
      />
      {selectionMode && (
        <div className='flex flex-wrap items-center gap-2 rounded-lg border bg-muted/40 px-3 py-2 text-sm'>
          <Check className='h-4 w-4 shrink-0 text-emerald-500' />
          <span className='font-medium tabular-nums'>
            {selectedCount} dipilih
          </span>
          <div className='ms-auto flex items-center gap-1'>
            <Button
              variant='ghost'
              size='sm'
              className='h-7 px-2 text-xs'
              onClick={() => table.toggleAllPageRowsSelected(true)}
            >
              Pilih semua
            </Button>
            <Button
              variant='ghost'
              size='sm'
              className='h-7 px-2 text-xs'
              onClick={() => table.resetRowSelection()}
              disabled={selectedCount === 0}
            >
              Kosongkan
            </Button>
          </div>
        </div>
      )}
      {viewMode === 'table' ? (
        <div className='overflow-x-auto rounded-md border'>
          <Table className='min-w-[600px]'>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => {
                    return (
                      <TableHead
                        key={header.id}
                        colSpan={header.colSpan}
                        className={cn(
                          header.column.columnDef.meta?.className,
                          header.column.columnDef.meta?.thClassName
                        )}
                      >
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                      </TableHead>
                    )
                  })}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell>
                      <Skeleton className='h-4 w-4' />
                    </TableCell>
                    <TableCell>
                      <Skeleton className='h-4 w-[120px]' />
                    </TableCell>
                    <TableCell>
                      <Skeleton className='h-4 w-[200px]' />
                    </TableCell>
                    <TableCell>
                      <Skeleton className='h-4 w-16' />
                    </TableCell>
                    <TableCell>
                      <Skeleton className='h-4 w-16' />
                    </TableCell>
                    <TableCell>
                      <Skeleton className='h-4 w-24' />
                    </TableCell>
                    <TableCell>
                      <Skeleton className='h-4 w-10' />
                    </TableCell>
                    <TableCell>
                      <Skeleton className='ml-auto h-8 w-8' />
                    </TableCell>
                  </TableRow>
                ))
              ) : table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && 'selected'}
                    className='cursor-pointer'
                    onClick={(event) => {
                      const target = event.target as HTMLElement
                      if (
                        target.closest(
                          'button, a, input, [role="menu"], [role="checkbox"]'
                        )
                      ) {
                        return
                      }
                      if (selectionMode) {
                        row.toggleSelected()
                        return
                      }
                      setDetailActivity(row.original)
                    }}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell
                        key={cell.id}
                        className={cn(
                          cell.column.columnDef.meta?.className,
                          cell.column.columnDef.meta?.tdClassName
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
                    colSpan={activitiesColumns(teams, units).length}
                    className='h-24 text-center'
                  >
                    Tidak ada hasil.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      ) : isLoading ? (
        <div className='flex flex-col divide-y divide-border/50 overflow-hidden rounded-xl border bg-card shadow-sm'>
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className='flex items-start gap-4 px-5 py-4'>
              <Skeleton className='mt-2 h-2 w-2 shrink-0 rounded-full' />
              <div className='flex flex-1 flex-col gap-3'>
                <div className='flex gap-2'>
                  <Skeleton className='h-5 w-36 rounded-md' />
                  <Skeleton className='h-5 w-16 rounded-md' />
                  <Skeleton className='h-5 w-16 rounded-md' />
                </div>
                <Skeleton className='h-5 w-3/4' />
                <div className='flex gap-4'>
                  <Skeleton className='h-4 w-20' />
                  <Skeleton className='h-4 w-24' />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <ActivitiesCards table={table} teams={teams} units={units} />
      )}
      <DataTablePagination table={table} className='mt-auto' />
      <DataTableBulkActions table={table} teams={teams} units={units} />
    </div>
  )
}
