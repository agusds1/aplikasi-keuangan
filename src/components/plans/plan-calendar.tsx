'use client'

import { useState, useMemo } from 'react'
import { Calendar } from '@/components/ui/calendar'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { format } from 'date-fns'
import { id as idLocale } from 'date-fns/locale'
import { MemberBadge } from '@/components/shared/member-badge'
import { formatCurrency } from '@/lib/format'
import { cn } from '@/lib/utils'
import type { Category } from '@/lib/db/schema'

type Plan = {
  id: string
  amount: string
  type: string
  description: string | null
  plannedDate: Date
  status: string
  creatorId: string
  category: {
    id: string
    name: string
    icon: string
    color: string
  } | null
  creator: {
    id: string
    name: string
    avatar: string
    color: string
    role: string
  } | null
}

const STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-yellow-500',
  APPROVED: 'bg-green-500',
  REVISION: 'bg-orange-500',
  REJECTED: 'bg-red-500',
  EXECUTED: 'bg-blue-500',
}

const STATUS_LABELS: Record<string, string> = {
  PENDING: '⏳ Menunggu',
  APPROVED: '✅ Disetujui',
  REVISION: '✏️ Revisi',
  REJECTED: '❌ Ditolak',
  EXECUTED: '✓ Dieksekusi',
}

export function PlanCalendar({ plans }: { plans: Plan[] }) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined)
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date())

  // Group plans by date
  const plansByDate = useMemo(() => {
    const map = new Map<string, Plan[]>()
    for (const plan of plans) {
      const key = format(new Date(plan.plannedDate), 'yyyy-MM-dd')
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(plan)
    }
    return map
  }, [plans])

  // Dates yang punya rencana (untuk modifier di calendar)
  const datesWithPlans = useMemo(() => {
    return Array.from(plansByDate.keys()).map((key) => new Date(key))
  }, [plansByDate])

  // Plans untuk tanggal yang dipilih
  const selectedPlans = selectedDate
    ? plansByDate.get(format(selectedDate, 'yyyy-MM-dd')) ?? []
    : []

  // Plans untuk bulan yang ditampilkan
  const monthPlans = useMemo(() => {
    const monthKey = format(currentMonth, 'yyyy-MM')
    return plans.filter(
      (p) => format(new Date(p.plannedDate), 'yyyy-MM') === monthKey
    )
  }, [plans, currentMonth])

  return (
    <div className="space-y-4">
      {/* Calendar */}
      <Card>
        <CardContent className="p-3">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={setSelectedDate}
            onMonthChange={setCurrentMonth}
            locale={idLocale}
            modifiers={{
              hasPlan: datesWithPlans,
            }}
            modifiersClassNames={{
              hasPlan:
                'relative after:absolute after:bottom-1 after:left-1/2 after:-translate-x-1/2 after:w-1 after:h-1 after:rounded-full after:bg-primary',
            }}
            className="rounded-md w-full"
          />
        </CardContent>
      </Card>

      {/* Info bulan */}
      <div className="flex items-center justify-between px-1">
        <p className="text-sm font-semibold capitalize">
          {format(currentMonth, 'MMMM yyyy', { locale: idLocale })}
        </p>
        <Badge variant="secondary" className="text-[10px]">
          {monthPlans.length} rencana
        </Badge>
      </div>

      {/* Plans untuk tanggal terpilih */}
      {selectedDate ? (
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground px-1">
            {format(selectedDate, 'EEEE, d MMMM yyyy', { locale: idLocale })}
          </p>
          {selectedPlans.length === 0 ? (
            <div className="rounded-xl bg-card border p-6 text-center">
              <p className="text-sm text-muted-foreground">
                Tidak ada rencana di tanggal ini
              </p>
            </div>
          ) : (
            selectedPlans.map((plan) => (
              <PlanCalendarItem key={plan.id} plan={plan} />
            ))
          )}
        </div>
      ) : (
        <div className="rounded-xl bg-muted/30 border border-dashed p-6 text-center">
          <p className="text-sm text-muted-foreground">
            Tap tanggal di kalender untuk lihat rencana
          </p>
        </div>
      )}
    </div>
  )
}

function PlanCalendarItem({ plan }: { plan: Plan }) {
  return (
    <Card>
      <CardContent className="p-3">
        <div className="flex items-start gap-3">
          <div
            className="w-9 h-9 rounded-lg flex items-center justify-center text-lg shrink-0"
            style={{ backgroundColor: `${plan.category?.color}20` }}
          >
            {plan.category?.icon}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <p className="text-sm font-medium truncate">
                {plan.description || plan.category?.name}
              </p>
              <p
                className={cn(
                  'text-sm font-semibold whitespace-nowrap',
                  plan.type === 'INCOME' ? 'text-green-600' : 'text-red-600'
                )}
              >
                {plan.type === 'INCOME' ? '+' : '-'}
                {formatCurrency(plan.amount)}
              </p>
            </div>
            <div className="flex items-center gap-2 mt-1.5">
              {plan.creator && (
                <MemberBadge
                  name={plan.creator.name}
                  avatar={plan.creator.avatar}
                  color={plan.creator.color}
                  size="sm"
                />
              )}
              <Badge
                className={cn(
                  'text-[10px] text-white',
                  STATUS_COLORS[plan.status]
                )}
              >
                {STATUS_LABELS[plan.status]}
              </Badge>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}