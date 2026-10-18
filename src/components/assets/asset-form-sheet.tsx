'use client'

import { useState } from 'react'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2 } from 'lucide-react'
import { createAssetAction } from '@/app/actions/assets'
import { CurrencyInput } from '@/components/ui/currency-input'
import type { Account } from '@/lib/db/schema'

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  accounts: Account[]
  onSuccess: () => void
}

export function AssetFormSheet({ open, onOpenChange, accounts, onSuccess }: Props) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [type, setType] = useState<'VEHICLE' | 'PROPERTY' | 'GOLD' | 'INVESTMENT' | 'OTHER'>('GOLD')
  const [purchaseValue, setPurchaseValue] = useState('')
  const [accountId, setAccountId] = useState(accounts[0]?.id || '')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null); setLoading(true)

    const res = await createAssetAction({
      name,
      type,
      purchaseValue: Number(purchaseValue),
      accountId,
    })

    if (res.error) {
      setError(res.error); setLoading(false); return
    }

    setName(''); setPurchaseValue('')
    onOpenChange(false); setLoading(false); onSuccess()
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom">
        <SheetHeader><SheetTitle>Beli Aset Baru</SheetTitle></SheetHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label>Nama Aset</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Emas Antam 5gr / Motor Vario" required />
          </div>
          
          <div className="space-y-2">
            <Label>Tipe Aset</Label>
            <select value={type} onChange={(e) => setType(e.target.value as any)} className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm">
              <option value="GOLD">🪙 Emas / Perhiasan</option>
              <option value="VEHICLE">🚗 Kendaraan</option>
              <option value="PROPERTY">🏠 Properti / Tanah</option>
              <option value="INVESTMENT">📈 Investasi (Saham/RD)</option>
              <option value="OTHER">📦 Lainnya</option>
            </select>
          </div>

          <div className="space-y-2">
            <Label>Harga Beli</Label>
            <CurrencyInput value={purchaseValue} onChange={setPurchaseValue} required />
          </div>

          <div className="space-y-2">
            <Label>Bayar dari Dompet</Label>
            <select value={accountId} onChange={(e) => setAccountId(e.target.value)} className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm" required>
              {accounts.map((acc) => <option key={acc.id} value={acc.id}>{acc.name}</option>)}
            </select>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Beli & Simpan Aset
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  )
}