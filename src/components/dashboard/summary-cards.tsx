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
import { cn } from '@/lib/utils'
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
  income: {
    total: number
    breakdown: BreakdownRow[]
  }
  expense: {
    total: number
  }
  saving: {
    total: number
    breakdown: BreakdownRow[]
  }
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
    <div className="space-y-2">
      {/* PEMASUKAN */}
      <Card>
        <CardContent className="p-0">
          <div className="p-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div className="w-10 h-10 rounded-full bg-green-50 dark:bg-green-950 flex items-center justify-center shrink-0">
                <TrendingUp className="h-5 w-5 text-green-600" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                  <span>Pemasukan</span>
                </div>
                <p className="text-base font-bold text-green-600 truncate">
                  {formatCurrency(income.total)}
                </p>
                {income.breakdown.length > 0 && (
                  <button
                    onClick={() => setIncomeExpanded((v) => !v)}
                    className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground transition-colors -mt-0.5"
                  >
                    {incomeExpanded ? (
                      <ChevronUp className="h-3 w-3" />
                    ) : (
                      <ChevronDown className="h-3 w-3" />
                    )}
                    {incomeExpanded ? 'Tutup detail' : 'Lihat detail'}
                  </button>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <RangeFilterButton
                value={incomeRange}
                onChange={onIncomeRangeChange}
              />
            </div>
          </div>

          {incomeExpanded && (
            <div className="border-t px-4 pb-4 pt-3">
              <CategoryMemberBreakdown
                data={income.breakdown}
                emptyMessage="Belum ada pemasukan di periode ini"
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* PENGELUARAN */}
      <Card>
        <CardContent className="p-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className="w-10 h-10 rounded-full bg-red-50 dark:bg-red-950 flex items-center justify-center shrink-0">
              <TrendingDown className="h-5 w-5 text-red-600" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                <span>Pengeluaran</span>
              </div>
              <p className="text-base font-bold text-red-600 truncate">
                {formatCurrency(expense.total)}
              </p>
            </div>
          </div>
          <div className="shrink-0">
            <RangeFilterButton
              value={expenseRange}
              onChange={onExpenseRangeChange}
            />
          </div>
        </CardContent>
      </Card>

      {/* TABUNGAN */}
      <Card>
        <CardContent className="p-0">
          <div className="p-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div className="w-10 h-10 rounded-full bg-cyan-50 dark:bg-cyan-950 flex items-center justify-center shrink-0">
                <PiggyBank className="h-5 w-5 text-cyan-600" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                  <span>Tabungan</span>
                </div>
                <p className="text-base font-bold text-cyan-600 truncate">
                  {formatCurrency(saving.total)}
                </p>
                {saving.breakdown.length > 0 && (
                  <button
                    onClick={() => setSavingExpanded((v) => !v)}
                    className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground transition-colors -mt-0.5"
                  >
                    {savingExpanded ? (
                      <ChevronUp className="h-3 w-3" />
                    ) : (
                      <ChevronDown className="h-3 w-3" />
                    )}
                    {savingExpanded ? 'Tutup detail' : 'Lihat detail'}
                  </button>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <RangeFilterButton
                value={savingRange}
                onChange={onSavingRangeChange}
              />
            </div>
          </div>

          {savingExpanded && (
            <div className="border-t px-4 pb-4 pt-3">
              <CategoryMemberBreakdown
                data={saving.breakdown}
                emptyMessage="Belum ada tabungan di periode ini"
              />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}