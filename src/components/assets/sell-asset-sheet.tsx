'use client'

import { useState } from 'react'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Loader2, Info } from 'lucide-react'
import { sellAssetAction } from '@/app/actions/assets'
import { CurrencyInput } from '@/components/ui/currency-input'
import type { Account } from '@/lib/db/schema'
import { formatCurrency } from '@/lib/format'

type Props = {
  asset: any
  accounts: Account[]
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function SellAssetSheet({ asset, accounts, open, onOpenChange, onSuccess }: Props) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const purchaseValue = parseFloat(asset.purchaseValue)
  const [salePrice, setSalePrice] = useState(purchaseValue.toString())
  const [accountId, setAccountId] = useState(accounts[0]?.id || '')

  const profitLoss = (Number(salePrice) || 0) - purchaseValue

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null); setLoading(true)

    const res = await sellAssetAction(asset.id, {
      salePrice: Number(salePrice),
      accountId,
    })

    if (res.error) {
      setError(res.error); setLoading(false); return
    }

    onOpenChange(false); setLoading(false); onSuccess()
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom">
        <SheetHeader><SheetTitle>Jual Aset: {asset.name}</SheetTitle></SheetHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          
          <div className="bg-muted p-3 rounded-lg flex items-start gap-2">
            <Info className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
            <p className="text-xs text-muted-foreground">
              Harga Beli: <strong>{formatCurrency(purchaseValue)}</strong>.
            </p>
          </div>

          <div className="space-y-2">
            <Label>Harga Jual</Label>
            <CurrencyInput value={salePrice} onChange={setSalePrice} required />
          </div>

          <div className="space-y-2">
            <Label>Uang Masuk ke Dompet</Label>
            <select value={accountId} onChange={(e) => setAccountId(e.target.value)} className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm" required>
              {accounts.map((acc) => <option key={acc.id} value={acc.id}>{acc.name}</option>)}
            </select>
          </div>

          {/* Hitung Untung/Rugi Otomatis */}
          <div className={`p-3 rounded-lg text-sm font-bold ${profitLoss > 0 ? 'bg-green-100 text-green-700' : profitLoss < 0 ? 'bg-red-100 text-red-700' : 'bg-muted text-muted-foreground'}`}>
            {profitLoss > 0 && `Untung: ${formatCurrency(profitLoss)}`}
            {profitLoss < 0 && `Rugi: ${formatCurrency(Math.abs(profitLoss))}`}
            {profitLoss === 0 && `Tidak ada untung/rugi (Impas)`}
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Konfirmasi Penjualan
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  )
}