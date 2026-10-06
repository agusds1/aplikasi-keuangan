'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  ChevronDown,
  ChevronUp,
  ChevronRight,
  Filter,
  X,
} from 'lucide-react'
import { formatCurrency } from '@/lib/format'
import { cn } from '@/lib/utils'
import { format, startOfWeek, startOfMonth, startOfYear } from 'date-fns'
import { id as idLocale } from 'date-fns/locale'

type PlanRow = {
  planId: string
  amount: string
  type: string
  status: string
  plannedDate: Date | string
  categoryId: string | null
  categoryName: string | null
  categoryIcon: string | null
  categoryColor: string | null
  categoryType: string | null
}

type PeriodFilter = 'ALL' | 'WEEK' | 'MONTH' | 'YEAR'
type StatusFilter = 'ALL' | 'PENDING' | 'APPROVED' | 'REVISION' | 'REJECTED'

const STATUS_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: 'ALL', label: 'Semua Status' },
  { value: 'PENDING', label: '⏳ Menunggu' },
  { value: 'APPROVED', label: '✅ Disetujui' },
  { value: 'REVISION', label: '✏️ Revisi' },
  { value: 'REJECTED', label: '❌ Ditolak' },
]

const PERIOD_OPTIONS: { value: PeriodFilter; label: string }[] = [
  { value: 'ALL', label: 'Semua' },
  { value: 'WEEK', label: 'Minggu Ini' },
  { value: 'MONTH', label: 'Bulan Ini' },
  { value: 'YEAR', label: 'Tahun Ini' },
]

const STATUS_BADGE: Record<string, { label: string; color: string }> = {
  PENDING: {
    label: '⏳ Waiting',
    color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-950 dark:text-yellow-300',
  },
  APPROVED: {
    label: '✅ Approved',
    color: 'bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300',
  },
  REVISION: {
    label: '✏️ Revision',
    color: 'bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-300',
  },
  REJECTED: {
    label: '❌ Rejected',
    color: 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300',
  },
}

export function PlanRecapCard({ plans }: { plans: PlanRow[] }) {
  const [expanded, setExpanded] = useState(false)
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL')
  const [periodFilter, setPeriodFilter] = useState<PeriodFilter>('ALL')
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false)
  const [showStatusDropdown, setShowStatusDropdown] = useState(false)
  const [showPeriodDropdown, setShowPeriodDropdown] = useState(false)

  // Kategori unik yang ADA di rencana
  const availableCategories = useMemo(() => {
    const map = new Map<
      string,
      { id: string; name: string; icon: string; color: string }
    >()
    for (const plan of plans) {
      if (plan.categoryId && !map.has(plan.categoryId)) {
        map.set(plan.categoryId, {
          id: plan.categoryId,
          name: plan.categoryName ?? 'Tanpa Kategori',
          icon: plan.categoryIcon ?? '📁',
          color: plan.categoryColor ?? '#64748b',
        })
      }
    }
    return Array.from(map.values()).sort((a, b) =>
      a.name.localeCompare(b.name)
    )
  }, [plans])

  // Filter rencana
  const filteredPlans = useMemo(() => {
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())

    // Week range
    const weekStart = startOfWeek(today, { weekStartsOn: 1 })
    const weekEnd = new Date(weekStart)
    weekEnd.setDate(weekEnd.getDate() + 6)
    weekEnd.setHours(23, 59, 59, 999)

    // Month range
    const monthStart = startOfMonth(today)
    const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0)
    monthEnd.setHours(23, 59, 59, 999)

    // Year range
    const yearStart = startOfYear(today)
    const yearEnd = new Date(today.getFullYear(), 11, 31)
    yearEnd.setHours(23, 59, 59, 999)

    return plans.filter((plan) => {
      // Filter kategori
      if (categoryFilter !== 'ALL' && plan.categoryId !== categoryFilter) {
        return false
      }

      // Filter status
      if (statusFilter !== 'ALL' && plan.status !== statusFilter) {
        return false
      }

      // Filter periode — dengan batas atas DAN batas bawah
      const planDate = new Date(plan.plannedDate)

      if (periodFilter === 'WEEK') {
        if (planDate < weekStart || planDate > weekEnd) return false
      }
      if (periodFilter === 'MONTH') {
        if (planDate < monthStart || planDate > monthEnd) return false
      }
      if (periodFilter === 'YEAR') {
        if (planDate < yearStart || planDate > yearEnd) return false
      }

      return true
    })
  }, [plans, categoryFilter, statusFilter, periodFilter])

  // Group by kategori + breakdown status
  const grouped = useMemo(() => {
    const map = new Map<
      string,
      {
        categoryId: string
        categoryName: string
        categoryIcon: string
        categoryColor: string
        total: number
        count: number
        statusCount: Record<string, number>
      }
    >()

    for (const plan of filteredPlans) {
      const key = plan.categoryId ?? 'unknown'
      if (!map.has(key)) {
        map.set(key, {
          categoryId: key,
          categoryName: plan.categoryName ?? 'Tanpa Kategori',
          categoryIcon: plan.categoryIcon ?? '📁',
          categoryColor: plan.categoryColor ?? '#64748b',
          total: 0,
          count: 0,
          statusCount: {},
        })
      }
      const group = map.get(key)!
      group.total += parseFloat(plan.amount)
      group.count += 1
      group.statusCount[plan.status] =
        (group.statusCount[plan.status] ?? 0) + 1
    }

    return Array.from(map.values()).sort((a, b) => b.total - a.total)
  }, [filteredPlans])

  const grandTotal = grouped.reduce((sum, g) => sum + g.total, 0)
  const hasActiveFilter =
    categoryFilter !== 'ALL' ||
    statusFilter !== 'ALL' ||
    periodFilter !== 'ALL'

  function resetFilters() {
    setCategoryFilter('ALL')
    setStatusFilter('ALL')
    setPeriodFilter('ALL')
  }

  function closeAllDropdowns() {
    setShowCategoryDropdown(false)
    setShowStatusDropdown(false)
    setShowPeriodDropdown(false)
  }

  const categoryLabel =
    categoryFilter === 'ALL'
      ? 'Kategori'
      : availableCategories.find((c) => c.id === categoryFilter)?.name ??
        'Kategori'

  const statusLabel =
    STATUS_OPTIONS.find((s) => s.value === statusFilter)?.label ?? 'Status'

  const periodLabel =
    PERIOD_OPTIONS.find((p) => p.value === periodFilter)?.label ?? 'Periode'

  return (
    <Card>
      <CardContent className="p-0">
        {/* Header — selalu terlihat */}
        <button
          onClick={() => setExpanded((v) => !v)}
          className="w-full p-4 flex items-start justify-between hover:bg-muted/30 transition-colors text-left gap-3"
        >
          <div className="flex items-start gap-3 min-w-0 flex-1">
            <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-lg shrink-0 mt-0.5">
              📋
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                <span>Rekap Rencana Transaksi</span>
                <span>·</span>
                <span>{filteredPlans.length} rencana</span>
              </div>
              <p className="text-base font-bold text-blue-600 dark:text-blue-400">
                {formatCurrency(grandTotal)}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1 shrink-0 mt-0.5">
            {expanded ? (
              <ChevronUp className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            )}
          </div>
        </button>

        {/* Konten — hanya saat expanded */}
        {expanded && (
          <div className="border-t">
            {/* Filter Bar */}
            <div className="p-3 space-y-2">
              <div className="flex items-center gap-2 flex-wrap">
                <Filter className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-xs text-muted-foreground font-medium">
                  Filter:
                </span>

                {/* Filter Kategori */}
                <div className="relative">
                  <Button
                    size="sm"
                    variant={categoryFilter !== 'ALL' ? 'default' : 'outline'}
                    className="h-7 text-xs gap-1"
                    onClick={() => {
                      closeAllDropdowns()
                      setShowCategoryDropdown((v) => !v)
                    }}
                  >
                    {categoryLabel}
                    <ChevronDown className="h-3 w-3" />
                  </Button>
                  {showCategoryDropdown && (
                    <>
                      <div
                        className="fixed inset-0 z-40"
                        onClick={() => setShowCategoryDropdown(false)}
                      />
                      <div className="absolute top-9 left-0 z-50 min-w-[180px] max-h-60 overflow-y-auto rounded-lg border bg-popover shadow-lg p-1">
                        <button
                          onClick={() => {
                            setCategoryFilter('ALL')
                            setShowCategoryDropdown(false)
                          }}
                          className={cn(
                            'w-full text-left px-2 py-1.5 rounded text-xs hover:bg-muted',
                            categoryFilter === 'ALL' && 'bg-muted font-medium'
                          )}
                        >
                          🗂️ Semua Kategori
                        </button>
                        {availableCategories.map((cat) => (
                          <button
                            key={cat.id}
                            onClick={() => {
                              setCategoryFilter(cat.id)
                              setShowCategoryDropdown(false)
                            }}
                            className={cn(
                              'w-full text-left px-2 py-1.5 rounded text-xs hover:bg-muted flex items-center gap-2',
                              categoryFilter === cat.id &&
                                'bg-muted font-medium'
                            )}
                          >
                            <span>{cat.icon}</span>
                            <span className="truncate">{cat.name}</span>
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>

                {/* Filter Status */}
                <div className="relative">
                  <Button
                    size="sm"
                    variant={statusFilter !== 'ALL' ? 'default' : 'outline'}
                    className="h-7 text-xs gap-1"
                    onClick={() => {
                      closeAllDropdowns()
                      setShowStatusDropdown((v) => !v)
                    }}
                  >
                    {statusLabel}
                    <ChevronDown className="h-3 w-3" />
                  </Button>
                  {showStatusDropdown && (
                    <>
                      <div
                        className="fixed inset-0 z-40"
                        onClick={() => setShowStatusDropdown(false)}
                      />
                      <div className="absolute top-9 left-0 z-50 min-w-[160px] rounded-lg border bg-popover shadow-lg p-1">
                        {STATUS_OPTIONS.map((s) => (
                          <button
                            key={s.value}
                            onClick={() => {
                              setStatusFilter(s.value)
                              setShowStatusDropdown(false)
                            }}
                            className={cn(
                              'w-full text-left px-2 py-1.5 rounded text-xs hover:bg-muted',
                              statusFilter === s.value &&
                                'bg-muted font-medium'
                            )}
                          >
                            {s.label}
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>

                {/* Filter Periode */}
                <div className="relative">
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-xs gap-1"
                    onClick={() => {
                      closeAllDropdowns()
                      setShowPeriodDropdown((v) => !v)
                    }}
                  >
                    {periodLabel}
                    <ChevronDown className="h-3 w-3" />
                  </Button>
                  {showPeriodDropdown && (
                    <>
                      <div
                        className="fixed inset-0 z-40"
                        onClick={() => setShowPeriodDropdown(false)}
                      />
                      <div className="absolute top-9 left-0 z-50 min-w-[140px] rounded-lg border bg-popover shadow-lg p-1">
                        {PERIOD_OPTIONS.map((p) => (
                          <button
                            key={p.value}
                            onClick={() => {
                              setPeriodFilter(p.value)
                              setShowPeriodDropdown(false)
                            }}
                            className={cn(
                              'w-full text-left px-2 py-1.5 rounded text-xs hover:bg-muted',
                              periodFilter === p.value &&
                                'bg-muted font-medium'
                            )}
                          >
                            {p.label}
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>

                {hasActiveFilter && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 text-xs gap-1 text-muted-foreground"
                    onClick={resetFilters}
                  >
                    <X className="h-3 w-3" />
                    Reset
                  </Button>
                )}
              </div>
            </div>

            {/* List */}
            <div className="px-4 pb-4 space-y-3">
              {grouped.length === 0 ? (
                <div className="rounded-lg bg-muted/30 border border-dashed p-6 text-center">
                  <p className="text-sm text-muted-foreground">
                    Tidak ada rencana sesuai filter
                  </p>
                </div>
              ) : (
                <>
                  {grouped.map((g) => {
                    const percentage = (g.total / grandTotal) * 100
                    return (
                      <div key={g.categoryId} className="space-y-1.5">
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2 min-w-0">
                            <span>{g.categoryIcon}</span>
                            <span className="font-medium truncate">
                              {g.categoryName}
                            </span>
                          </div>
                          <span className="text-sm font-semibold whitespace-nowrap ml-2">
                            {formatCurrency(g.total)}
                          </span>
                        </div>

                        {/* Badge status */}
                        {Object.keys(g.statusCount).length > 0 && (
                          <div className="flex items-center gap-1 flex-wrap">
                            {(['PENDING', 'APPROVED', 'REVISION', 'REJECTED'] as const).map(
                              (status) => {
                                const count = g.statusCount[status]
                                if (!count) return null
                                const config = STATUS_BADGE[status]
                                return (
                                  <Badge
                                    key={status}
                                    className={cn(
                                      'text-[9px] px-1.5 py-0 h-4 gap-0.5',
                                      config.color
                                    )}
                                  >
                                    <span>{config.label}</span>
                                    <span className="font-semibold">{count}</span>
                                  </Badge>
                                )
                              }
                            )}
                          </div>
                        )}

                        <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all"
                            style={{
                              width: `${percentage}%`,
                              backgroundColor: g.categoryColor,
                            }}
                          />
                        </div>
                        <p className="text-[10px] text-muted-foreground">
                          {percentage.toFixed(1)}% dari total
                        </p>
                      </div>
                    )
                  })}

                  {/* Link ke /plans */}
                  <Link
                    href="/plans"
                    className="flex items-center justify-center gap-1 text-xs text-primary hover:underline pt-2"
                  >
                    Lihat semua rencana
                    <ChevronRight className="h-3 w-3" />
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}