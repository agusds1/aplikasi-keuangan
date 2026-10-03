'use client'

import { useState, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { formatCurrency } from '@/lib/format'
import { cn } from '@/lib/utils'
import { Loader2, Copy, Save, AlertCircle, CheckCircle2 } from 'lucide-react'
import type { Category } from '@/lib/db/schema'
import {
  saveAllocationsAction,
  copyPreviousMonthAction,
} from '@/app/actions/allocations'

type Props = {
  categories: Category[]
  existingAllocations: Record<string, number>
  period: string
  periodLabel: string
  totalIncome: number
}

export function BudgetForm({
  categories,
  existingAllocations,
  period,
  periodLabel,
  totalIncome,
}: Props) {
  const [values, setValues] = useState<Record<string, number>>(() => {
    const initial: Record<string, number> = {}
    for (const cat of categories) {
      initial[cat.id] = existingAllocations[cat.id] ?? 0
    }
    return initial
  })

  const [loading, setLoading] = useState(false)
  const [copying, setCopying] = useState(false)
  const [message, setMessage] = useState<{
    type: 'success' | 'error'
    text: string
  } | null>(null)

  const totalAllocated = useMemo(
    () => Object.values(values).reduce((sum, v) => sum + (v || 0), 0),
    [values]
  )

  const remaining = totalIncome - totalAllocated
  const isBalanced = Math.abs(remaining) < 1 // toleransi 1 rupiah untuk rounding
  const isOver = remaining < 0

  function handleChange(categoryId: string, value: string) {
    const num = parseFloat(value.replace(/\D/g, '')) || 0
    setValues((prev) => ({ ...prev, [categoryId]: num }))
    setMessage(null)
  }

  async function handleSave() {
    setLoading(true)
    setMessage(null)

    const items = Object.entries(values).map(([categoryId, plannedAmount]) => ({
      categoryId,
      plannedAmount,
    }))

    const result = await saveAllocationsAction({ period, items })

    if (result.error) {
      setMessage({ type: 'error', text: result.error })
    } else {
      setMessage({ type: 'success', text: 'Alokasi berhasil disimpan!' })
    }
    setLoading(false)
  }

  async function handleCopyPrevious() {
    setCopying(true)
    setMessage(null)

    const result = await copyPreviousMonthAction(period)

    if (result.error) {
      setMessage({ type: 'error', text: result.error })
    } else {
      setMessage({
        type: 'success',
        text: `Berhasil copy ${result.count} alokasi dari bulan lalu. Refresh halaman untuk melihat.`,
      })
    }
    setCopying(false)
  }

  // Group categories by type
  const groups = [
    {
      title: '💰 Pemasukan',
      type: 'INCOME' as const,
      icon: '💰',
    },
    {
      title: '💸 Pengeluaran Rutin',
      type: 'EXPENSE' as const,
      icon: '💸',
    },
    {
      title: '🏦 Tabungan',
      type: 'SAVING' as const,
      icon: '🏦',
    },
    {
      title: '📈 Investasi',
      type: 'INVESTMENT' as const,
      icon: '📈',
    },
    {
      title: '💳 Hutang',
      type: 'DEBT' as const,
      icon: '💳',
    },
    {
      title: '🤲 Sosial',
      type: 'SOCIAL' as const,
      icon: '🤲',
    },
  ]

  return (
    <div className="space-y-4">
      {/* Header Period */}
      <Card>
        <CardContent className="p-4">
          <p className="text-xs text-muted-foreground">Periode</p>
          <p className="font-semibold capitalize">{periodLabel}</p>
        </CardContent>
      </Card>

      {/* Info Pemasukan */}
      <Card>
        <CardContent className="p-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              Pemasukan Bulan Ini
            </span>
            <span className="font-semibold">
              {formatCurrency(totalIncome)}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              Total Dialokasikan
            </span>
            <span className="font-semibold">
              {formatCurrency(totalAllocated)}
            </span>
          </div>
          <div className="border-t pt-2 flex items-center justify-between">
            <span className="text-sm font-medium">Sisa</span>
            <span
              className={cn(
                'font-bold',
                isBalanced && 'text-green-600',
                isOver && 'text-red-600',
                !isBalanced && !isOver && 'text-orange-600'
              )}
            >
              {formatCurrency(remaining)}
            </span>
          </div>

          {isBalanced && (
            <div className="flex items-center gap-1.5 text-xs text-green-600 pt-1">
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span>Alokasi seimbang! 🎉</span>
            </div>
          )}
          {isOver && (
            <div className="flex items-center gap-1.5 text-xs text-red-600 pt-1">
              <AlertCircle className="h-3.5 w-3.5" />
              <span>Alokasi melebihi pemasukan!</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Copy Button */}
      <Button
        variant="outline"
        className="w-full"
        onClick={handleCopyPrevious}
        disabled={copying}
      >
        {copying ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <Copy className="mr-2 h-4 w-4" />
        )}
        Copy dari Bulan Lalu
      </Button>

      {/* Categories */}
      {groups.map((group) => {
        const groupCategories = categories.filter((c) => c.type === group.type)
        if (groupCategories.length === 0) return null

        return (
          <div key={group.type} className="space-y-2">
            <h3 className="text-sm font-bold px-1">{group.title}</h3>
            <div className="space-y-2">
              {groupCategories.map((cat) => (
                <Card key={cat.id}>
                  <CardContent className="p-3">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-9 h-9 rounded-lg flex items-center justify-center text-lg shrink-0"
                        style={{ backgroundColor: `${cat.color}20` }}
                      >
                        {cat.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {cat.name}
                        </p>
                      </div>
                      <Input
                        type="text"
                        inputMode="numeric"
                        value={
                          values[cat.id]
                            ? new Intl.NumberFormat('id-ID').format(
                                values[cat.id]
                              )
                            : ''
                        }
                        onChange={(e) =>
                          handleChange(cat.id, e.target.value)
                        }
                        placeholder="0"
                        className="w-32 text-right font-medium"
                      />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )
      })}

      {/* Message */}
      {message && (
        <div
          className={cn(
            'rounded-lg p-3 text-sm',
            message.type === 'success' &&
              'bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300',
            message.type === 'error' &&
              'bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300'
          )}
        >
          {message.text}
        </div>
      )}

      {/* Sticky Save Button */}
      <div className="sticky bottom-20 z-10 pt-2">
        <Button
          className="w-full shadow-lg"
          size="lg"
          onClick={handleSave}
          disabled={loading}
        >
          {loading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Save className="mr-2 h-4 w-4" />
          )}
          Simpan Alokasi
        </Button>
      </div>
    </div>
  )
}