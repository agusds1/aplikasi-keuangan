'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { ChevronDown, CalendarIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'
import { id as idLocale } from 'date-fns/locale'
import type { DateRange } from 'react-day-picker'
import {
  type DateRangeValue,
  getRangeLabel,
} from '@/lib/date-range'

type Props = {
  value: DateRangeValue
  onChange: (value: DateRangeValue) => void
  className?: string
}

export function RangeFilterButton({ value, onChange, className }: Props) {
  const [open, setOpen] = useState(false)
  const [tempRange, setTempRange] = useState<DateRange | undefined>(
    value.type === 'CUSTOM' && value.start && value.end
      ? { from: value.start, to: value.end }
      : undefined
  )

  function handleSelectSimple(type: 'ALL' | 'MONTH') {
    onChange({ type })
    setOpen(false)
  }

  function handleApplyCustom() {
    if (tempRange?.from && tempRange?.to) {
      onChange({
        type: 'CUSTOM',
        start: tempRange.from,
        end: tempRange.to,
      })
      setOpen(false)
    }
  }

  function handleClearCustom() {
    setTempRange(undefined)
    onChange({ type: 'ALL' })
    setOpen(false)
  }

  const label = getRangeLabel(value)
  const isActive = value.type !== 'ALL'

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        className={cn(
          'inline-flex items-center gap-1 rounded-md px-2 py-1 text-[10px] font-medium transition-colors',
          isActive
            ? 'bg-primary text-primary-foreground hover:bg-primary/90'
            : 'bg-muted text-muted-foreground hover:bg-muted/80',
          className
        )}
      >
        <span className="truncate max-w-[80px]">{label}</span>
        <ChevronDown className="h-3 w-3 shrink-0" />
      </PopoverTrigger>
      <PopoverContent
        align="end"
        className="w-auto p-0"
        sideOffset={4}
      >
        <div className="p-2 space-y-1 w-56">
          {/* Opsi simple */}
          <button
            onClick={() => handleSelectSimple('ALL')}
            className={cn(
              'w-full text-left px-2 py-1.5 rounded text-xs hover:bg-muted transition-colors',
              value.type === 'ALL' && 'bg-muted font-medium'
            )}
          >
            🗓️ Semua
          </button>
          <button
            onClick={() => handleSelectSimple('MONTH')}
            className={cn(
              'w-full text-left px-2 py-1.5 rounded text-xs hover:bg-muted transition-colors',
              value.type === 'MONTH' && 'bg-muted font-medium'
            )}
          >
            📅 Bulan Ini
          </button>

          {/* Custom range */}
          <div className="border-t pt-2 mt-2">
            <p className="px-2 text-[10px] text-muted-foreground mb-2">
              🎯Custom Range
            </p>
            <div className="flex justify-center">
              <Calendar
                mode="range"
                selected={tempRange}
                onSelect={setTempRange}
                numberOfMonths={1}
                locale={idLocale}
                className="rounded-md"
              />
            </div>

            {tempRange?.from && tempRange?.to && (
              <div className="px-2 py-2 text-[10px] text-muted-foreground text-center border-t">
                {format(tempRange.from, 'd MMM yyyy', { locale: idLocale })}
                {' → '}
                {format(tempRange.to, 'd MMM yyyy', { locale: idLocale })}
              </div>
            )}

            <div className="flex gap-1 pt-2">
              <Button
                size="sm"
                variant="outline"
                className="flex-1 h-7 text-xs"
                onClick={handleClearCustom}
              >
                Reset
              </Button>
              <Button
                size="sm"
                className="flex-1 h-7 text-xs"
                disabled={!tempRange?.from || !tempRange?.to}
                onClick={handleApplyCustom}
              >
                Terapkan
              </Button>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}