import { format } from 'date-fns'
import { Calendar as CalendarIcon } from 'lucide-react'
import { type DateRange } from 'react-day-picker'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'

type DateRangePickerProps = {
  date: DateRange | undefined
  onSelect: (date: DateRange | undefined) => void
  placeholder?: string
}

export function DateRangePicker({
  date,
  onSelect,
  placeholder = 'Pilih rentang tanggal',
}: DateRangePickerProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant='outline'
          data-empty={!date?.from}
          className='h-8 w-auto justify-start gap-2 px-3 text-xs font-normal data-[empty=true]:text-muted-foreground'
        >
          <CalendarIcon className='h-3.5 w-3.5 opacity-50' />
          {date?.from ? (
            date.to ? (
              <>
                {format(date.from, 'MMM d')} - {format(date.to, 'MMM d, yyyy')}
              </>
            ) : (
              format(date.from, 'MMM d, yyyy')
            )
          ) : (
            <span>{placeholder}</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className='w-auto p-0' align='start'>
        <Calendar
          mode='range'
          defaultMonth={date?.from}
          selected={date}
          onSelect={onSelect}
          numberOfMonths={2}
        />
      </PopoverContent>
    </Popover>
  )
}
