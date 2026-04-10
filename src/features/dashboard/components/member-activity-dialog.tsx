import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
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
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  format, 
  startOfDay, 
  endOfDay, 
  startOfWeek, 
  endOfWeek, 
  startOfMonth, 
  endOfMonth 
} from 'date-fns'
import { id } from 'date-fns/locale'
import { ExternalLink } from 'lucide-react'

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

interface MemberActivityDialogProps {
  userId: string | null
  userName: string
  isOpen: boolean
  onOpenChange: (open: boolean) => void
}

export function MemberActivityDialog({ userId, userName, isOpen, onOpenChange }: MemberActivityDialogProps) {
  const [dateFilter, setDateFilter] = useState<DateFilter>('month')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  const handleFilterChange = (filter: DateFilter) => {
    setDateFilter(filter)
    setStartDate('')
    setEndDate('')
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
    enabled: !!userId && isOpen
  })

  const filteredData = useMemo(() => {
    let filtered = activities
    if (startDate || endDate) {
      filtered = activities.filter((task) => {
        const taskDate = new Date(task.date)
        if (startDate && !endDate)
          return taskDate >= startOfDay(new Date(startDate))
        if (!startDate && endDate)
          return taskDate <= endOfDay(new Date(endDate))
        return (
          taskDate >= startOfDay(new Date(startDate)) &&
          taskDate <= endOfDay(new Date(endDate))
        )
      })
    } else {
      const { start, end } = getDateRange(dateFilter)
      filtered = activities.filter((task) => {
        const taskDate = new Date(task.date)
        return taskDate >= start && taskDate <= end
      })
    }
    return filtered
  }, [activities, dateFilter, startDate, endDate])

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[1200px] max-w-[95vw] max-h-[85vh] flex flex-col overflow-hidden">
        <DialogHeader className="shrink-0">
          <DialogTitle>Detail Aktivitas Pegawai</DialogTitle>
          <DialogDescription>
            Riwayat pengerjaan tugas oleh <span className="font-bold text-foreground">{userName}</span>
          </DialogDescription>
        </DialogHeader>
        
        {/* Toolbar & Filters */}
        <div className='flex flex-wrap items-center gap-2 shrink-0 py-2 border-b'>
            <div className='flex items-center gap-1 rounded-lg border p-1'>
            {(Object.keys(DATE_FILTER_LABELS) as DateFilter[]).map((filter) => (
                <Button
                key={filter}
                variant={dateFilter === filter && !startDate && !endDate ? 'default' : 'ghost'}
                size='sm'
                className='h-7 px-3 text-xs'
                onClick={() => handleFilterChange(filter)}
                >
                {DATE_FILTER_LABELS[filter]}
                </Button>
            ))}
            </div>
            <div className='flex items-center gap-2'>
            <input
                type='date'
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className='h-8 w-[140px] rounded-md border bg-background px-2 text-sm'
            />
            <span className='text-muted-foreground'>—</span>
            <input
                type='date'
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className='h-8 w-[140px] rounded-md border bg-background px-2 text-sm'
            />
            {(startDate || endDate) && (
                <Button
                variant='ghost'
                size='sm'
                className='h-8 px-2 text-xs text-muted-foreground'
                onClick={() => {
                    setStartDate('')
                    setEndDate('')
                }}
                >
                Reset
                </Button>
            )}
            </div>
        </div>

        <div className="flex-1 overflow-auto -mx-6 px-6">
          {isLoading ? (
            <div className="flex h-32 items-center justify-center text-muted-foreground">
              Memuat data aktivitas...
            </div>
          ) : filteredData.length === 0 ? (
            <div className="flex h-32 items-center justify-center text-muted-foreground mt-4 border rounded-md border-dashed">
              Tidak ada aktivitas pada rentang waktu ini.
            </div>
          ) : (
            <div className="rounded-md border mt-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="whitespace-nowrap">Tanggal</TableHead>
                  <TableHead>Jam</TableHead>
                  <TableHead className="min-w-[200px]">Deskripsi Aktivitas</TableHead>
                  <TableHead className="text-right">Volume</TableHead>
                  <TableHead>Satuan</TableHead>
                  <TableHead>Pemberi Kerja</TableHead>
                  <TableHead className="text-center">Bukti Dukung</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredData.map((act) => (
                  <TableRow key={act.id}>
                    <TableCell className="whitespace-nowrap font-medium">
                      {format(new Date(act.date), 'dd MMM yyyy', { locale: id })}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-muted-foreground">
                        {act.start_time?.slice(0, 5) || '-'} s/d {act.end_time?.slice(0, 5) || '-'}
                    </TableCell>
                    <TableCell>{act.description}</TableCell>
                    <TableCell className="text-right">{act.volume}</TableCell>
                    <TableCell>{act.unit?.name || '-'}</TableCell>
                    <TableCell>{act.assignor_team?.name || '-'}</TableCell>
                    <TableCell className="text-center">
                        {act.link_bukti_dukung ? (
                            <a href={act.link_bukti_dukung} target="_blank" rel="noreferrer" className="inline-flex items-center text-blue-500 hover:text-blue-700">
                                Link <ExternalLink className="ml-1 h-3 w-3" />
                            </a>
                        ) : (
                            <span className="text-muted-foreground">-</span>
                        )}
                    </TableCell>
                    <TableCell>
                      {act.is_done ? (
                        <Badge variant="default" className="bg-green-500">Selesai</Badge>
                      ) : (
                        <Badge variant="secondary">Pending</Badge>
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
