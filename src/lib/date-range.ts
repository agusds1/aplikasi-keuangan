import {
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear,
} from 'date-fns'

export type RangeType = 'ALL' | 'MONTH' | 'CUSTOM'

export type DateRangeValue = {
  type: RangeType
  start?: Date
  end?: Date
}

export function getRangeDates(value: DateRangeValue): {
  start?: Date
  end?: Date
} {
  const now = new Date()

  if (value.type === 'ALL') {
    return {}
  }

  if (value.type === 'MONTH') {
    return {
      start: startOfMonth(now),
      end: endOfMonth(now),
    }
  }

  if (value.type === 'CUSTOM') {
    return {
      start: value.start,
      end: value.end,
    }
  }

  return {}
}

export function getRangeLabel(value: DateRangeValue): string {
  if (value.type === 'ALL') return 'Semua'
  if (value.type === 'MONTH') return 'Bulan Ini'
  if (value.type === 'CUSTOM') {
    if (!value.start || !value.end) return 'Acak'
    const fmt = (d: Date) =>
      d.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    return `${fmt(value.start)} - ${fmt(value.end)}`
  }
  return 'Semua'
}

// Encode ke URL param
export function encodeRange(value: DateRangeValue): string {
  if (value.type === 'ALL') return 'all'
  if (value.type === 'MONTH') return 'month'
  if (value.type === 'CUSTOM' && value.start && value.end) {
    // Normalize ke tengah hari lokal untuk hindari timezone shift saat encode
    const startNorm = new Date(value.start)
    startNorm.setHours(12, 0, 0, 0)
    const endNorm = new Date(value.end)
    endNorm.setHours(12, 0, 0, 0)

    const startStr = startNorm.toISOString().split('T')[0]
    const endStr = endNorm.toISOString().split('T')[0]
    return `custom:${startStr}:${endStr}`
  }
  return 'all'
}

// Decode dari URL param
export function decodeRange(param: string | null | undefined): DateRangeValue {
  if (!param || param === 'all') return { type: 'ALL' }
  if (param === 'month') return { type: 'MONTH' }

  if (param.startsWith('custom:')) {
    const parts = param.split(':')
    if (parts.length === 3) {
      // Parse sebagai tanggal lokal, bukan UTC
      const [sy, sm, sd] = parts[1].split('-').map(Number)
      const [ey, em, ed] = parts[2].split('-').map(Number)

      const start = new Date(sy, sm - 1, sd, 0, 0, 0, 0)
      const end = new Date(ey, em - 1, ed, 23, 59, 59, 999)

      if (!isNaN(start.getTime()) && !isNaN(end.getTime())) {
        return { type: 'CUSTOM', start, end }
      }
    }
  }

  return { type: 'ALL' }
}