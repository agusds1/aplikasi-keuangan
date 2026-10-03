import { formatCurrency, formatPercent } from '@/lib/format'
import { cn } from '@/lib/utils'

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
  const withPlanned = data.filter((d) => d.planned > 0)

  if (withPlanned.length === 0) {
    return (
      <div className="rounded-xl bg-card border p-6 text-center">
        <p className="text-sm text-muted-foreground">
          Belum ada alokasi bulan ini
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          Atur di tab Anggaran
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {withPlanned.map((cat) => {
        const isOver = cat.percentage > 100
        const isWarning = cat.percentage > 80 && cat.percentage <= 100

        return (
          <div key={cat.categoryId} className="space-y-1.5">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <span>{cat.categoryIcon}</span>
                <span className="font-medium">{cat.categoryName}</span>
              </div>
              <span
                className={cn(
                  'text-xs font-semibold',
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
                style={{
                  width: `${Math.min(cat.percentage, 100)}%`,
                }}
              />
            </div>
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{formatCurrency(cat.actual)}</span>
              <span>dari {formatCurrency(cat.planned)}</span>
            </div>
          </div>
        )
      })}
    </div>
  )
}