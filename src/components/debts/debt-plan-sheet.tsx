'use client'

import { useState } from 'react'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2, CalendarIcon } from 'lucide-react'
import { createDebtPlanAction } from '@/app/actions/debt-plans'
import { CurrencyInput } from '@/components/ui/currency-input'
import type { Account } from '@/lib/db/schema'
import { format } from 'date-fns'
import { id as idLocale } from 'date-fns/locale'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'
import { formatCurrency } from '@/lib/format'

type Props = {
  debt: any
  accounts: Account[]
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function DebtPlanSheet({ debt, accounts, open, onOpenChange, onSuccess }: Props) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const principalAwal = parseFloat(debt.principalAmount)
  const remaining = parseFloat(debt.remainingPrincipal)
  const interestRate = parseFloat(debt.interestRate || '0')
  const tenor = debt.tenorMonths || 1
  
  // Hitung default
  const cicilanPokok = Math.round(principalAwal / tenor)
  const defaultPokok = Math.min(cicilanPokok, remaining)
  const defaultBunga = Math.round(principalAwal * (interestRate / 100))
  
  const [principal, setPrincipal] = useState(defaultPokok.toString())
  const [interest, setInterest] = useState(defaultBunga.toString())
  const [plannedDate, setPlannedDate] = useState<Date>(new Date())
  const [datePickerOpen, setDatePickerOpen] = useState(false)
  const [accountId, setAccountId] = useState(accounts[0]?.id || '')
  const [installmentNumber, setInstallmentNumber] = useState('1')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null); setLoading(true)

    const res = await createDebtPlanAction({
      debtId: debt.id,
      accountId,
      installmentNumber: Number(installmentNumber),
      principalPaid: Number(principal),
      interestPaid: Number(interest),
      plannedDate: plannedDate.toISOString(),
    })

    if (res.error) {
      setError(res.error); setLoading(false); return
    }

    onOpenChange(false); setLoading(false); onSuccess()
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="max-h-[90vh] overflow-y-auto">
        <SheetHeader><SheetTitle>Buat Rencana Pelunasan</SheetTitle></SheetHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-2">
              <Label>Pelunasan Ke-</Label>
              <Input type="number" value={installmentNumber} onChange={(e) => setInstallmentNumber(e.target.value)} min={1} required />
            </div>
            <div className="space-y-2">
              <Label>Tanggal Rencana</Label>
              <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
                <PopoverTrigger className="w-full flex items-center justify-start text-left font-normal px-3 py-2 border rounded-md bg-background hover:bg-muted text-sm h-10">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {format(plannedDate, 'd MMM yyyy', { locale: idLocale })}
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={plannedDate} onSelect={(d) => { if (d) { setPlannedDate(d); setDatePickerOpen(false) } }} locale={idLocale} />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Porsi Pokok</Label>
            <CurrencyInput value={principal} onChange={setPrincipal} required />
          </div>

          <div className="space-y-2">
            <Label>Porsi Bunga</Label>
            <CurrencyInput value={interest} onChange={setInterest} required />
          </div>

          <div className="space-y-2">
            <Label>Uang dari Dompet</Label>
            <select value={accountId} onChange={(e) => setAccountId(e.target.value)} className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm" required>
              {accounts.map((acc) => <option key={acc.id} value={acc.id}>{acc.name} ({formatCurrency(acc.currentBalance)})</option>)}
            </select>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Kirim Rencana Persetujuan
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  )
}