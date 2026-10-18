'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import {
  TrendingUp,
  TrendingDown,
  PiggyBank,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'
import { formatCurrency } from '@/lib/format'
import { RangeFilterButton } from './range-filter-button'
import { CategoryMemberBreakdown } from './category-member-breakdown'
import type { DateRangeValue } from '@/lib/date-range'

type BreakdownRow = {
  categoryId: string
  categoryName: string
  categoryIcon: string
  categoryColor: string
  memberId: string
  memberName: string
  memberAvatar: string
  memberColor: string
  memberRole: string
  total: number
}

type Props = {
  income: { total: number; breakdown: BreakdownRow[] }
  expense: { total: number }
  saving: { total: number; breakdown: BreakdownRow[] }
  incomeRange: DateRangeValue
  expenseRange: DateRangeValue
  savingRange: DateRangeValue
  onIncomeRangeChange: (v: DateRangeValue) => void
  onExpenseRangeChange: (v: DateRangeValue) => void
  onSavingRangeChange: (v: DateRangeValue) => void
}

export function SummaryCards({
  income,
  expense,
  saving,
  incomeRange,
  expenseRange,
  savingRange,
  onIncomeRangeChange,
  onExpenseRangeChange,
  onSavingRangeChange,
}: Props) {
  const [incomeExpanded, setIncomeExpanded] = useState(false)
  const [savingExpanded, setSavingExpanded] = useState(false)

  return (
    <div className="space-y-3">
      {/* PEMASUKAN */}
      <Card>
        <CardContent className="p-0">
          <div className="p-4 flex items-center justify-between gap-3 h-[72px]">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div className="w-10 h-10 rounded-full bg-green-50 dark:bg-green-950 flex items-center justify-center shrink-0">
                <TrendingUp className="h-5 w-5 text-green-600" />
              </div>
              <div className="min-w-0 flex-1 flex flex-col justify-center">
                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                  <span>Pemasukan</span>
                </div>
                <p className="text-base font-bold text-green-600 truncate leading-tight">
                  {formatCurrency(income.total)}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <RangeFilterButton value={incomeRange} onChange={onIncomeRangeChange} />
            </div>
          </div>
          
          {income.breakdown.length > 0 && (
            <div className="border-t">
              <button
                onClick={() => setIncomeExpanded((v) => !v)}
                className="w-full px-4 py-2 flex items-center justify-between text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                <span>{incomeExpanded ? 'Tutup detail' : 'Lihat detail'}</span>
                {incomeExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
              </button>
              {incomeExpanded && (
                <div className="px-4 pb-4 pt-1">
                  <CategoryMemberBreakdown data={income.breakdown} emptyMessage="Belum ada data" />
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* PENGELUARAN */}
      <Card>
        <CardContent className="p-0">
          <div className="p-4 flex items-center justify-between gap-3 h-[72px]">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div className="w-10 h-10 rounded-full bg-red-50 dark:bg-red-950 flex items-center justify-center shrink-0">
                <TrendingDown className="h-5 w-5 text-red-600" />
              </div>
              <div className="min-w-0 flex-1 flex flex-col justify-center">
                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                  <span>Pengeluaran</span>
                </div>
                <p className="text-base font-bold text-red-600 truncate leading-tight">
                  {formatCurrency(expense.total)}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <RangeFilterButton value={expenseRange} onChange={onExpenseRangeChange} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* TABUNGAN */}
      <Card>
        <CardContent className="p-0">
          <div className="p-4 flex items-center justify-between gap-3 h-[72px]">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div className="w-10 h-10 rounded-full bg-cyan-50 dark:bg-cyan-950 flex items-center justify-center shrink-0">
                <PiggyBank className="h-5 w-5 text-cyan-600" />
              </div>
              <div className="min-w-0 flex-1 flex flex-col justify-center">
                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                  <span>Tabungan</span>
                </div>
                <p className="text-base font-bold text-cyan-600 truncate leading-tight">
                  {formatCurrency(saving.total)}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <RangeFilterButton value={savingRange} onChange={onSavingRangeChange} />
            </div>
          </div>

          {saving.breakdown.length > 0 && (
            <div className="border-t">
              <button
                onClick={() => setSavingExpanded((v) => !v)}
                className="w-full px-4 py-2 flex items-center justify-between text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                <span>{savingExpanded ? 'Tutup detail' : 'Lihat detail'}</span>
                {savingExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
              </button>
              {savingExpanded && (
                <div className="px-4 pb-4 pt-1">
                  <CategoryMemberBreakdown data={saving.breakdown} emptyMessage="Belum ada data" />
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}