'use client'

import { useState } from 'react'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Loader2, Info } from 'lucide-react'
import { payDebtAction } from '@/app/actions/debts'
import { CurrencyInput } from '@/components/ui/currency-input'
import type { Account } from '@/lib/db/schema'
import { formatCurrency } from '@/lib/format'

type Props = {
  debt: any
  accounts: Account[]
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function PayDebtSheet({ debt, accounts, open, onOpenChange, onSuccess }: Props) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const principalAwal = parseFloat(debt.principalAmount)
  const remaining = parseFloat(debt.remainingPrincipal)
  const interestRate = parseFloat(debt.interestRate || '0') // Contoh: 2 (artinya 2%)
  const tenor = debt.tenorMonths || 1
  
  // 1. Cicilan Pokok Flat (Pokok Awal / Tenor)
  // Jika sisa hutang lebih kecil dari cicilan normal, maka bayar sisa hutangnya saja (pelunasan)
  const cicilanPokokFlat = Math.round(principalAwal / tenor)
  const defaultPokok = Math.min(cicilanPokokFlat, remaining)
  
  // 2. Cicilan Bunga Flat (Pokok Awal × Bunga per Bulan)
  // Jika ini adalah pelunasan (sisa < cicilan pokok), biasanya bunga juga disesuaikan/dihilangkan. 
  // Untuk simplifikasi, kita tetap tagih bunga flat sesuai bulan berjalan.
  const defaultBunga = Math.round(principalAwal * (interestRate / 100))
  
  const [principal, setPrincipal] = useState(defaultPokok.toString())
  const [interest, setInterest] = useState(defaultBunga.toString())
  const [accountId, setAccountId] = useState(accounts[0]?.id || '')

  const total = (Number(principal) || 0) + (Number(interest) || 0)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null); setLoading(true)

    const res = await payDebtAction(debt.id, {
      principalPaid: Number(principal),
      interestPaid: Number(interest),
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
        <SheetHeader><SheetTitle>Bayar Cicilan: {debt.name}</SheetTitle></SheetHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          
          <div className="bg-muted p-3 rounded-lg flex items-start gap-2">
            <Info className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
            <p className="text-xs text-muted-foreground">
              Sisa Pokok: <strong>{formatCurrency(remaining)}</strong>. Tagihan Pokok: <strong>{formatCurrency(cicilanPokokFlat)}</strong> / bln.
            </p>
          </div>

          <div className="space-y-2">
            <Label>Porsi Pokok</Label>
            <CurrencyInput value={principal} onChange={setPrincipal} required />
          </div>

          <div className="space-y-2">
            <Label>Porsi Bunga (Beban)</Label>
            <CurrencyInput value={interest} onChange={setInterest} required />
          </div>

          <div className="space-y-2">
            <Label>Uang dari Dompet</Label>
            <select value={accountId} onChange={(e) => setAccountId(e.target.value)} className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm" required>
              {accounts.map((acc) => <option key={acc.id} value={acc.id}>{acc.name} ({formatCurrency(acc.currentBalance)})</option>)}
            </select>
          </div>

          <div className="border-t pt-3 flex justify-between font-bold">
            <span>Total Bayar:</span>
            <span className="text-primary">{formatCurrency(total)}</span>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Konfirmasi Pembayaran
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  )
}