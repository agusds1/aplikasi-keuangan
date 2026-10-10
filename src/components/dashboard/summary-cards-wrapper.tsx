'use client'

import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { useCallback } from 'react'
import { SummaryCards } from './summary-cards'
import {
  type DateRangeValue,
  encodeRange,
  decodeRange,
} from '@/lib/date-range'

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
}

export function SummaryCardsWrapper({ income, expense, saving }: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const incomeRange = decodeRange(searchParams.get('income'))
  const expenseRange = decodeRange(searchParams.get('expense'))
  const savingRange = decodeRange(searchParams.get('saving'))

  const updateParam = useCallback(
    (key: string, value: DateRangeValue) => {
      const params = new URLSearchParams(searchParams.toString())
      const encoded = encodeRange(value)

      if (encoded === 'all') {
        params.delete(key)
      } else {
        params.set(key, encoded)
      }

      const query = params.toString()
      router.push(query ? `${pathname}?${query}` : pathname, {
        scroll: false,
      })
    },
    [router, pathname, searchParams]
  )

  return (
    <SummaryCards
      income={income}
      expense={expense}
      saving={saving}
      incomeRange={incomeRange}
      expenseRange={expenseRange}
      savingRange={savingRange}
      onIncomeRangeChange={(v) => updateParam('income', v)}
      onExpenseRangeChange={(v) => updateParam('expense', v)}
      onSavingRangeChange={(v) => updateParam('saving', v)}
    />
  )
}