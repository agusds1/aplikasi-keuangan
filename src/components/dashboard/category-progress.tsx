import { formatCurrency, formatPercent } from '@/lib/format'
import { cn } from '@/lib/utils'
import { AlertCircle } from 'lucide-react'

type CategoryData = {
  categoryId: string
  categoryName: string
  categoryIcon: string
  categoryColor: string
  planned: number
  actual: number
  percentage: number
}

export function CategoryProgress({ data }: { data: CategoryData[] }) {
  // 1. Hanya ambil yang memiliki anggaran (planned > 0)
  const withPlanned = data
    .filter((d) => d.planned > 0)
    .sort((a, b) => b.percentage - a.percentage) // Urutkan dari yang paling overbudget

  // 2. Ambil pengeluaran yang TIDAK dianggarkan (planned = 0, tapi actual > 0)
  const unplanned = data.filter((d) => d.planned === 0 && d.actual > 0)

  if (withPlanned.length === 0 && unplanned.length === 0) {
    return (
      <div className="rounded-xl bg-card border p-6 text-center">
        <p className="text-sm text-muted-foreground">Belum ada alokasi bulan ini</p>
        <p className="text-xs text-muted-foreground mt-1">Atur di tab Anggaran</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* ITEM YANG DIANGGARKAN */}
      {withPlanned.map((cat) => {
        const isOver = cat.percentage > 100
        const isWarning = cat.percentage > 80 && cat.percentage <= 100

        return (
          <div key={cat.categoryId} className="space-y-1.5">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2 min-w-0">
                <span>{cat.categoryIcon}</span>
                <span className="font-medium truncate">{cat.categoryName}</span>
                {/* LABEL OVERBUDGET */}
                {isOver && (
                  <span className="text-[9px] font-bold bg-red-100 text-red-700 px-1.5 py-0.5 rounded shrink-0">
                    Overbudget
                  </span>
                )}
              </div>
              <span
                className={cn(
                  'text-xs font-bold shrink-0 ml-2',
                  isOver && 'text-red-600',
                  isWarning && 'text-orange-600',
                  !isOver && !isWarning && 'text-muted-foreground'
                )}
              >
                {formatPercent(cat.percentage)}
              </span>
            </div>
            <div className="h-2 rounded-full bg-muted overflow-hidden">
              <div
                className={cn(
                  'h-full transition-all rounded-full',
                  isOver && 'bg-red-500',
                  isWarning && 'bg-orange-500',
                  !isOver && !isWarning && 'bg-primary'
                )}
                style={{ width: `${Math.min(cat.percentage, 100)}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-[10px] text-muted-foreground">
              <span className={cn(isOver && 'text-red-600 font-bold')}>
                {formatCurrency(cat.actual)}
              </span>
              <span>dari {formatCurrency(cat.planned)}</span>
            </div>
          </div>
        )
      })}

      {/* ITEM YANG TIDAK DIANGGARKAN */}
      {unplanned.length > 0 && (
        <div className="mt-4 pt-3 border-t border-dashed">
          <div className="flex items-center gap-1.5 mb-2 text-orange-600">
            <AlertCircle className="h-3.5 w-3.5" />
            <p className="text-xs font-bold">Pengeluaran Tanpa Anggaran</p>
          </div>
          <div className="space-y-2">
            {unplanned.map((cat) => (
              <div key={cat.categoryId} className="flex items-center justify-between text-xs bg-orange-50 dark:bg-orange-950/30 p-2 rounded-md">
                <div className="flex items-center gap-2">
                  <span>{cat.categoryIcon}</span>
                  <span className="font-medium text-orange-800 dark:text-orange-300">{cat.categoryName}</span>
                </div>
                <span className="font-bold text-orange-600">{formatCurrency(cat.actual)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}