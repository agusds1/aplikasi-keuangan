'use client'

import { useState } from 'react'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2 } from 'lucide-react'
import { createDebtAction } from '@/app/actions/debts'
import { CurrencyInput } from '@/components/ui/currency-input'
import type { Account } from '@/lib/db/schema'
import { formatCurrency } from '@/lib/format'

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  accounts: Account[]
  onSuccess: () => void
}

export function DebtFormSheet({ open, onOpenChange, accounts, onSuccess }: Props) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [principal, setPrincipal] = useState('')
  const [interest, setInterest] = useState('0')
  const [tenor, setTenor] = useState('')
  const [accountId, setAccountId] = useState(accounts[0]?.id || '')
  const [interestType, setInterestType] = useState<'PERCENTAGE' | 'FIXED'>('PERCENTAGE')
  const [interestAmount, setInterestAmount] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null); setLoading(true)

    const res = await createDebtAction({
      name,
      principalAmount: Number(principal),
      interestRate: Number(interest),
      interestType, // <-- BARU
      interestAmount: Number(interestAmount), // <-- BARU
      tenorMonths: Number(tenor),
      accountId,
    })

    if (res.error) {
      setError(res.error); setLoading(false); return
    }

    setName(''); setPrincipal(''); setInterest('0'); setTenor('')
    onOpenChange(false); setLoading(false); onSuccess()
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="max-h-[90vh] overflow-y-auto">
        <SheetHeader><SheetTitle>Catat Hutang Baru</SheetTitle></SheetHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label>Nama Hutang / Pemberi Pinjaman</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Bank ABC / Koperasi" required />
          </div>
          <div className="space-y-2">
            <Label>Nominal Pinjaman (Pokok)</Label>
            <CurrencyInput value={principal} onChange={setPrincipal} required />
          </div>
          
                    <div className="space-y-2">
            <Label>Tipe Bunga</Label>
            <div className="grid grid-cols-2 gap-2">
              <Button type="button" variant={interestType === 'PERCENTAGE' ? 'default' : 'outline'} onClick={() => setInterestType('PERCENTAGE')}>
                Persentase (%)
              </Button>
              <Button type="button" variant={interestType === 'FIXED' ? 'default' : 'outline'} onClick={() => setInterestType('FIXED')}>
                Nominal (Rp)
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {interestType === 'PERCENTAGE' ? (
              <div className="space-y-2">
                <Label>Bunga per Bulan (%)</Label>
                <Input type="number" value={interest} onChange={(e) => setInterest(e.target.value)} required />
              </div>
            ) : (
              <div className="space-y-2">
                <Label>Bunga per Bulan (Rp)</Label>
                <CurrencyInput value={interestAmount} onChange={setInterestAmount} required />
              </div>
            )}
            <div className="space-y-2">
              <Label>Tenor (Bulan)</Label>
              <Input type="number" value={tenor} onChange={(e) => setTenor(e.target.value)} placeholder="12" required />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Masuk ke Dompet Mana?</Label>
            <select value={accountId} onChange={(e) => setAccountId(e.target.value)} className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm" required>
              {accounts.map((acc) => <option key={acc.id} value={acc.id}>{acc.name} ({formatCurrency(acc.currentBalance)})</option>)}
            </select>
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Simpan Hutang
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  )
}