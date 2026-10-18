'use client'

import { useState } from 'react'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Plus, Loader2 } from 'lucide-react'
import { createTransactionAction } from '@/app/actions/transactions'
import type { Category, Account } from '@/lib/db/schema'
import { cn } from '@/lib/utils'
import { formatCurrency } from '@/lib/format'
import { CurrencyInput } from '@/components/ui/currency-input' // <-- Import CurrencyInput

type Props = {
  categories: Category[]
  accounts: Account[]
}

export function TransactionFormSheet({ categories, accounts }: Props) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedType, setSelectedType] = useState<'EXPENSE' | 'INCOME'>('EXPENSE')
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null)
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(accounts[0]?.id || null)
  
  // State untuk amount
  const [amount, setAmount] = useState('')

  const filteredCategories = categories.filter((c) => {
    if (selectedType === 'INCOME') return c.type === 'INCOME'
    return c.type !== 'INCOME'
  })

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)

    if (!selectedCategoryId) return setError('Pilih kategori dulu')
    if (!selectedAccountId) return setError('Pilih dompet dulu')
    if (!amount) return setError('Nominal tidak boleh kosong')

    setLoading(true)
    const formData = new FormData(e.currentTarget)

    const result = await createTransactionAction({
      categoryId: selectedCategoryId,
      accountId: selectedAccountId,
      type: selectedType,
      amount: Number(amount), // <-- Pakai state amount
      description: (formData.get('description') as string) || undefined,
      date: new Date().toISOString(),
    })

    if (result.error) {
      setError(result.error)
      setLoading(false)
      return
    }

    setSelectedCategoryId(null)
    setAmount('')
    setOpen(false)
    setLoading(false)
    ;(e.target as HTMLFormElement).reset()
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger className="fixed bottom-20 right-4 z-40 h-14 w-14 rounded-full shadow-lg bg-primary text-primary-foreground hover:bg-primary/90 inline-flex items-center justify-center">
        <Plus className="h-6 w-6" />
      </SheetTrigger>
      <SheetContent side="bottom" className="max-h-[90vh] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Catat Transaksi</SheetTitle>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="grid grid-cols-2 gap-2">
            <Button type="button" variant={selectedType === 'EXPENSE' ? 'default' : 'outline'} onClick={() => { setSelectedType('EXPENSE'); setSelectedCategoryId(null) }}>💸 Pengeluaran</Button>
            <Button type="button" variant={selectedType === 'INCOME' ? 'default' : 'outline'} onClick={() => { setSelectedType('INCOME'); setSelectedCategoryId(null) }}>💰 Pemasukan</Button>
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">Nominal</Label>
            {/* Ganti Input Biasa dengan CurrencyInput */}
            <CurrencyInput
              id="amount"
              value={amount}
              onChange={setAmount}
              className="text-lg font-semibold"
            />
          </div>

          <div className="space-y-2">
            <Label>Uang dari Dompet</Label>
            <select
              value={selectedAccountId || ''}
              onChange={(e) => setSelectedAccountId(e.target.value)}
              className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              required
            >
              {accounts.map((acc) => (
                <option key={acc.id} value={acc.id}>
                  {acc.name} ({formatCurrency(acc.currentBalance)})
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label>Kategori</Label>
            <div className="grid grid-cols-3 gap-2">
              {filteredCategories.map((cat) => (
                <button key={cat.id} type="button" onClick={() => setSelectedCategoryId(cat.id)} className={cn('flex flex-col items-center gap-1 p-3 rounded-lg border transition-all', selectedCategoryId === cat.id ? 'border-primary bg-primary/5 ring-2 ring-primary/20' : 'border-border hover:bg-muted')}>
                  <span className="text-2xl">{cat.icon}</span>
                  <span className="text-xs text-center leading-tight">{cat.name}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Catatan (opsional)</Label>
            <Input id="description" name="description" placeholder="Misal: Belanja di pasar" />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Simpan Transaksi
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  )
}