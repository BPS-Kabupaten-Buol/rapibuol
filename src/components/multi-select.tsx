import { useState } from 'react'
import { Check, ChevronsUpDown, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'

type MultiSelectProps = {
  value: number[]
  onChange: (value: number[]) => void
  options: { label: string; value: number }[]
  placeholder?: string
  className?: string
}

export function MultiSelect({
  value,
  onChange,
  options,
  placeholder = 'Select options',
  className,
}: MultiSelectProps) {
  const [open, setOpen] = useState(false)

  const selectedOptions = options.filter((opt) => value.includes(opt.value))

  const handleSelect = (currentValue: number) => {
    if (value.includes(currentValue)) {
      onChange(value.filter((v) => v !== currentValue))
    } else {
      onChange([...value, currentValue])
    }
  }

  const handleRemove = (currentValue: number) => {
    onChange(value.filter((v) => v !== currentValue))
  }

  return (
    <div className={cn('space-y-2', className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant='outline'
            role='combobox'
            aria-expanded={open}
            className='w-full justify-between'
          >
            {selectedOptions.length > 0 ? (
              <div className='flex flex-wrap gap-1'>
                {selectedOptions.map((opt) => (
                  <Badge
                    key={opt.value}
                    variant='secondary'
                    className='mr-1'
                    onClick={(e) => {
                      e.stopPropagation()
                      handleRemove(opt.value)
                    }}
                  >
                    {opt.label}
                    <X className='ml-1 h-3 w-3 cursor-pointer' />
                  </Badge>
                ))}
              </div>
            ) : (
              <span className='text-muted-foreground'>{placeholder}</span>
            )}
            <ChevronsUpDown className='ml-2 h-4 w-4 shrink-0 opacity-50' />
          </Button>
        </PopoverTrigger>
        <PopoverContent className='w-full p-0'>
          <Command>
            <CommandInput placeholder='Search...' />
            <CommandList>
              <CommandEmpty>No option found.</CommandEmpty>
              <CommandGroup>
                {options.map((opt) => (
                  <CommandItem
                    key={opt.value}
                    value={opt.label}
                    onSelect={() => handleSelect(opt.value)}
                  >
                    <Check
                      className={cn(
                        'mr-2 h-4 w-4',
                        value.includes(opt.value) ? 'opacity-100' : 'opacity-0'
                      )}
                    />
                    {opt.label}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  )
}
