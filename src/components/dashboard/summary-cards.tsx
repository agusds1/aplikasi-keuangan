import { Card, CardContent } from '@/components/ui/card'
import { formatCurrency } from '@/lib/format'
import { TrendingUp, TrendingDown, Wallet, PiggyBank } from 'lucide-react'

type Props = {
  income: number
  expense: number
  saving: number
}

export function SummaryCards({ income, expense, saving }: Props) {
  const sisa = income - expense

  return (
    <div className="grid grid-cols-2 gap-3">
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
            <TrendingUp className="h-3.5 w-3.5 text-green-600" />
            <span>Pemasukan</span>
          </div>
          <p className="text-base font-bold text-green-600">
            {formatCurrency(income, true)}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
            <TrendingDown className="h-3.5 w-3.5 text-red-600" />
            <span>Pengeluaran</span>
          </div>
          <p className="text-base font-bold text-red-600">
            {formatCurrency(expense, true)}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
            <Wallet className="h-3.5 w-3.5 text-blue-600" />
            <span>Sisa</span>
          </div>
          <p
            className={`text-base font-bold ${
              sisa >= 0 ? 'text-blue-600' : 'text-red-600'
            }`}
          >
            {formatCurrency(sisa, true)}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
            <PiggyBank className="h-3.5 w-3.5 text-cyan-600" />
            <span>Tabungan</span>
          </div>
          <p className="text-base font-bold text-cyan-600">
            {formatCurrency(saving, true)}
          </p>
        </CardContent>
      </Card>
    </div>
  )
}