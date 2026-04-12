import { useState, useMemo } from 'react'
import { format } from 'date-fns'
import { useQuery } from '@tanstack/react-query'
import { id } from 'date-fns/locale'
import {
  Download,
  ExternalLink,
  LayoutGrid,
  Table as TableIcon,
} from 'lucide-react'
import { type DateRange } from 'react-day-picker'
import { exportToXlsx } from '@/lib/export'
import { supabase } from '@/lib/supabase'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { DateRangePicker } from '@/components/date-range-picker'

type DateFilter = 'today' | 'week' | 'month'

const DATE_FILTER_LABELS: Record<DateFilter, string> = {
  today: 'Hari Ini',
  week: 'Minggu Ini',
  month: 'Bulan Ini',
}

const EXPORT_COLUMNS = [
  { key: 'date' as const, header: 'Tanggal' },
  { key: 'end_date' as const, header: 'Tanggal Berakhir' },
  { key: 'description' as const, header: 'Deskripsi' },
  { key: 'start_time' as const, header: 'Jam Mulai' },
  { key: 'end_time' as const, header: 'Jam Selesai' },
  { key: 'volume' as const, header: 'Volume' },
  { key: 'unit_name' as const, header: 'Satuan' },
  { key: 'team_name' as const, header: 'Tim' },
  { key: 'link_bukti_dukung' as const, header: 'Link Bukti Dukung' },
  { key: 'is_done' as const, header: 'Status' },
]

function getDateRange(filter: DateFilter): { start: Date; end: Date } {
  const now = new Date()
  switch (filter) {
    case 'today':
      return {
        start: new Date(now.getFullYear(), now.getMonth(), now.getDate()),
        end: new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate(),
          23,
          59,
          59
        ),
      }
    case 'week': {
      const day = now.getDay()
      const diff = now.getDate() - day + (day === 0 ? -6 : 1)
      const start = new Date(now.getFullYear(), now.getMonth(), diff)
      const end = new Date(
        start.getFullYear(),
        start.getMonth(),
        start.getDate() + 6,
        23,
        59,
        59
      )
      return { start, end }
    }
    case 'month':
      return {
        start: new Date(now.getFullYear(), now.getMonth(), 1),
        end: new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59),
      }
  }
}

interface MemberActivityDialogProps {
  userId: string | null
  userName: string
  isOpen: boolean
  onOpenChange: (open: boolean) => void
}

export function MemberActivityDialog({
  userId,
  userName,
  isOpen,
  onOpenChange,
}: MemberActivityDialogProps) {
  const [dateFilter, setDateFilter] = useState<DateFilter>('month')
  const [dateRange, setDateRange] = useState<DateRange | undefined>()
  const [viewMode, setViewMode] = useState<'card' | 'table'>('card')

  const handleFilterChange = (filter: DateFilter) => {
    setDateFilter(filter)
    setDateRange(undefined)
  }

  const { data: activities = [], isLoading } = useQuery({
    queryKey: ['member-activities-full', userId],
    queryFn: async () => {
      if (!userId) return []

      const { data } = await supabase
        .from('activities')
        .select(`*, unit:unit_measurement(name), assignor_team:teams(name)`)
        .eq('user_id', userId)
        .order('date', { ascending: false })
        .order('start_time', { ascending: false })

      return data || []
    },
    enabled: !!userId && isOpen,
  })

  const filteredData = useMemo(() => {
    if (dateRange?.from) {
      const from = dateRange.from
      const to = dateRange.to
      return activities.filter((task) => {
        const taskDate = new Date(task.date)
        if (!to) {
          const start = new Date(
            from.getFullYear(),
            from.getMonth(),
            from.getDate()
          )
          const end = new Date(
            from.getFullYear(),
            from.getMonth(),
            from.getDate(),
            23,
            59,
            59
          )
          return taskDate >= start && taskDate <= end
        }
        const start = new Date(
          from.getFullYear(),
          from.getMonth(),
          from.getDate()
        )
        const end = new Date(
          to.getFullYear(),
          to.getMonth(),
          to.getDate(),
          23,
          59,
          59
        )
        return taskDate >= start && taskDate <= end
      })
    }
    const { start, end } = getDateRange(dateFilter)
    return activities.filter((task) => {
      const taskDate = new Date(task.date)
      return taskDate >= start && taskDate <= end
    })
  }, [activities, dateFilter, dateRange])

  const handleExport = () => {
    const exportData = filteredData.map((a) => ({
      ...a,
      unit_name: a.unit?.name ?? '-',
      team_name: a.assignor_team?.name ?? '-',
      is_done: a.is_done ? 'Selesai' : 'Pending',
    }))
    exportToXlsx(
      exportData,
      `activities-${userName}-${format(new Date(), 'yyyy-MM-dd')}`,
      EXPORT_COLUMNS
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className='flex max-h-[85vh] max-w-[95vw] flex-col overflow-hidden sm:max-w-[1200px]'>
        <DialogHeader className='shrink-0'>
          <DialogTitle>Detail Aktivitas Pegawai</DialogTitle>
          <DialogDescription>
            Riwayat pengerjaan tugas oleh{' '}
            <span className='font-bold text-foreground'>{userName}</span>
          </DialogDescription>
        </DialogHeader>

        {/* Toolbar & Filters */}
        <div className='flex shrink-0 flex-wrap items-center justify-between gap-2 border-b py-2'>
          <div className='flex flex-wrap items-center gap-2'>
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
                  </Button>
                )
              )}
            </div>
            <DateRangePicker
              date={dateRange}
              onSelect={(range: DateRange | undefined) => {
                setDateRange(range)
                if (range?.from) {
                  setDateFilter('month')
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
                  setDateFilter('month')
                }}
              >
                Atur Ulang
              </Button>
            )}
          </div>
          <div className='flex items-center gap-2'>
            <Button
              variant='outline'
              size='sm'
              className='h-8 gap-1.5'
              onClick={handleExport}
              disabled={filteredData.length === 0}
            >
              <Download className='h-3.5 w-3.5' />
              <span className='max-sm:hidden'>Export</span>
            </Button>
            <Tabs
              value={viewMode}
              onValueChange={(v) => setViewMode(v as 'card' | 'table')}
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
        </div>

        <div className='-mx-6 flex-1 overflow-auto px-6'>
          {isLoading ? (
            <div className='flex h-32 items-center justify-center text-muted-foreground'>
              Memuat data aktivitas...
            </div>
          ) : filteredData.length === 0 ? (
            <div className='mt-4 flex h-32 items-center justify-center rounded-md border border-dashed text-muted-foreground'>
              Tidak ada aktivitas pada rentang waktu ini.
            </div>
          ) : viewMode === 'card' ? (
            <div className='mt-4 flex flex-col divide-y divide-border/50 overflow-hidden rounded-xl border bg-card shadow-sm'>
              {filteredData.map((act, i) => (
                <div
                  key={act.id}
                  className={cn(
                    'flex items-start gap-4 px-5 py-4 transition-colors hover:bg-muted/30',
                    i === 0 && 'rounded-t-xl',
                    i === filteredData.length - 1 && 'rounded-b-xl'
                  )}
                >
                  <div
                    className={cn(
                      'mt-[7px] h-2 w-2 shrink-0 rounded-full ring-2 ring-offset-2',
                      act.is_done
                        ? 'bg-emerald-400 ring-emerald-200'
                        : 'bg-amber-400 ring-amber-200'
                    )}
                  />
                  <div className='flex min-w-0 flex-1 flex-col gap-2'>
                    <div className='flex flex-wrap items-center gap-2'>
                      <span className='inline-flex items-center gap-1.5 rounded-md bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground'>
                        {format(new Date(act.date), 'EEE, d MMM yyyy', {
                          locale: id,
                        })}
                      </span>
                      {act.end_date && (
                        <span className='inline-flex items-center gap-1.5 rounded-md bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground'>
                          s/d{' '}
                          {format(new Date(act.end_date), 'EEE, d MMM yyyy', {
                            locale: id,
                          })}
                        </span>
                      )}
                      <span className='inline-flex items-center gap-1.5 rounded-md bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground tabular-nums'>
                        {act.start_time?.slice(0, 5) || '--:--'} –{' '}
                        {act.end_time?.slice(0, 5) || '--:--'}
                      </span>
                      <span
                        className={cn(
                          'inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-semibold',
                          act.is_done
                            ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400'
                            : 'bg-amber-50 text-amber-600 dark:bg-amber-950/30 dark:text-amber-400'
                        )}
                      >
                        {act.is_done ? 'Selesai' : 'Pending'}
                      </span>
                    </div>
                    <p className='text-[15px] leading-snug font-semibold'>
                      {act.description}
                    </p>
                    <div className='flex flex-wrap items-center gap-x-5 gap-y-1 pt-0.5'>
                      <span className='inline-flex items-center gap-1.5 text-xs text-muted-foreground'>
                        {act.volume} {act.unit?.name}
                      </span>
                      <span className='inline-flex items-center gap-1.5 text-xs text-muted-foreground'>
                        {act.assignor_team?.name || '-'}
                      </span>
                      {act.link_bukti_dukung && (
                        <a
                          href={act.link_bukti_dukung}
                          target='_blank'
                          rel='noreferrer'
                          className='inline-flex items-center gap-1.5 text-xs text-blue-500 hover:text-blue-600 hover:underline'
                        >
                          Bukti Dukung <ExternalLink className='h-3 w-3' />
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className='mt-4 rounded-md border'>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className='whitespace-nowrap'>Tanggal</TableHead>
                    <TableHead>Tanggal Berakhir</TableHead>
                    <TableHead>Jam</TableHead>
                    <TableHead className='min-w-[200px]'>
                      Deskripsi Aktivitas
                    </TableHead>
                    <TableHead className='text-right'>Volume</TableHead>
                    <TableHead>Satuan</TableHead>
                    <TableHead>Pemberi Kerja</TableHead>
                    <TableHead className='text-center'>Bukti Dukung</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredData.map((act) => (
                    <TableRow key={act.id}>
                      <TableCell className='font-medium whitespace-nowrap'>
                        {format(new Date(act.date), 'dd MMM yyyy', {
                          locale: id,
                        })}
                      </TableCell>
                      <TableCell className='whitespace-nowrap text-muted-foreground'>
                        {act.end_date
                          ? format(new Date(act.end_date), 'dd MMM yyyy', {
                              locale: id,
                            })
                          : '-'}
                      </TableCell>
                      <TableCell className='whitespace-nowrap text-muted-foreground'>
                        {act.start_time?.slice(0, 5) || '-'} s/d{' '}
                        {act.end_time?.slice(0, 5) || '-'}
                      </TableCell>
                      <TableCell>{act.description}</TableCell>
                      <TableCell className='text-right'>{act.volume}</TableCell>
                      <TableCell>{act.unit?.name || '-'}</TableCell>
                      <TableCell>{act.assignor_team?.name || '-'}</TableCell>
                      <TableCell className='text-center'>
                        {act.link_bukti_dukung ? (
                          <a
                            href={act.link_bukti_dukung}
                            target='_blank'
                            rel='noreferrer'
                            className='inline-flex items-center text-blue-500 hover:text-blue-700'
                          >
                            Link <ExternalLink className='ml-1 h-3 w-3' />
                          </a>
                        ) : (
                          <span className='text-muted-foreground'>-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {act.is_done ? (
                          <Badge variant='default' className='bg-green-500'>
                            Selesai
                          </Badge>
                        ) : (
                          <Badge variant='secondary'>Pending</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
