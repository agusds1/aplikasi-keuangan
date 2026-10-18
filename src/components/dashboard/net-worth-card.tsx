import { Card, CardContent } from '@/components/ui/card'
import { formatCurrency } from '@/lib/format'
import { Wallet, Package, CreditCard, TrendingUp } from 'lucide-react'

type Props = {
  totalCash: number
  totalAssets: number
  totalDebts: number
  netWorth: number
}

export function NetWorthCard({ totalCash, totalAssets, totalDebts, netWorth }: Props) {
  return (
    <Card className="bg-gradient-to-br from-emerald-500 to-teal-700 text-white border-none overflow-hidden relative shadow-lg">
      <div className="absolute right-0 top-0 opacity-20 translate-x-4 -translate-y-4">
        <TrendingUp className="w-32 h-32" />
      </div>
      <CardContent className="p-5 relative z-10">
        <p className="text-xs font-medium text-emerald-100 mb-1">Total Kekayaan Bersih (Net Worth)</p>
        <h2 className="text-3xl font-bold mb-4">{formatCurrency(netWorth)}</h2>
        
        <div className="grid grid-cols-3 gap-2 text-xs">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-1 text-emerald-100">
              <Wallet className="h-3 w-3" /> Kas
            </div>
            <p className="font-semibold">{formatCurrency(totalCash, true)}</p>
          </div>
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-1 text-emerald-100">
              <Package className="h-3 w-3" /> Aset
            </div>
            <p className="font-semibold">{formatCurrency(totalAssets, true)}</p>
          </div>
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-1 text-emerald-100">
              <CreditCard className="h-3 w-3" /> Hutang
            </div>
            <p className="font-semibold">{formatCurrency(totalDebts, true)}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}