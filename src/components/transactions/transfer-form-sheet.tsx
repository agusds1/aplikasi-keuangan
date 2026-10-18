'use client'

import { useState } from 'react'
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ArrowRightLeft, Loader2 } from 'lucide-react'
import { transferAction } from '@/app/actions/transactions'
import type { Account, Category } from '@/lib/db/schema'
import { formatCurrency } from '@/lib/format'
import { CurrencyInput } from '@/components/ui/currency-input'

export function TransferFormSheet({ accounts, categories }: { accounts: Account[], categories: Category[] }) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const [fromId, setFromId] = useState(accounts[0]?.id || '')
  const [toId, setToId] = useState(accounts[1]?.id || '')
  const [amount, setAmount] = useState('')
  const [categoryId, setCategoryId] = useState('') // Kategori Tabungan

  // Filter kategori yang tipenya SAVING atau INVESTMENT
  const savingCategories = categories.filter(c => ['SAVING', 'INVESTMENT'].includes(c.type))

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)

    if (!fromId || !toId) return setError('Pilih dompet asal dan tujuan')
    if (fromId === toId) return setError('Dompet asal dan tujuan tidak boleh sama')
    if (!amount) return setError('Nominal tidak boleh kosong')
    if (!categoryId) return setError('Pilih tujuan tabungan (kategori)')

    setLoading(true)
    const formData = new FormData(e.currentTarget)

    // Panggil transferAction dengan menambahkan categoryId
    const result = await transferAction({
      fromAccountId: fromId,
      toAccountId: toId,
      amount: Number(amount),
      categoryId: categoryId, // Kirim kategori tabungan
      description: (formData.get('description') as string) || undefined,
      date: new Date().toISOString(),
    })

    if (result.error) {
      setError(result.error)
      setLoading(false)
      return
    }

    setAmount('')
    setCategoryId('')
    setOpen(false)
    setLoading(false)
    ;(e.target as HTMLFormElement).reset()
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger className="fixed bottom-36 right-4 z-40 h-14 w-14 rounded-full shadow-lg bg-blue-600 text-white hover:bg-blue-700 inline-flex items-center justify-center">
        <ArrowRightLeft className="h-6 w-6" />
      </SheetTrigger>
      <SheetContent side="bottom" className="max-h-[90vh] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Transfer ke Tabungan/Aset</SheetTitle>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          
          <div className="space-y-2">
            <Label>Dari Dompet</Label>
            <select value={fromId} onChange={(e) => setFromId(e.target.value)} className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm" required>
              {accounts.map((acc) => (
                <option key={acc.id} value={acc.id}>{acc.name} ({formatCurrency(acc.currentBalance)})</option>
              ))}
            </select>
          </div>

          <div className="flex justify-center">
            <ArrowRightLeft className="text-muted-foreground rotate-90" />
          </div>

          <div className="space-y-2">
            <Label>Ke Dompet Tujuan</Label>
            <select value={toId} onChange={(e) => setToId(e.target.value)} className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm" required>
              {accounts.map((acc) => (
                <option key={acc.id} value={acc.id}>{acc.name} ({formatCurrency(acc.currentBalance)})</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label>Nominal Transfer</Label>
            <CurrencyInput value={amount} onChange={setAmount} className="text-lg font-semibold" />
          </div>

          {/* DROPDOWN KATEGORI TABUNGAN */}
          <div className="space-y-2">
            <Label>Alokasi Tabungan Untuk Apa?</Label>
            <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm" required>
              <option value="" disabled>Pilih Tujuan Tabungan</option>
              {savingCategories.map((cat) => (
                <option key={cat.id} value={cat.id}>{cat.icon} {cat.name}</option>
              ))}
            </select>
            <p className="text-[10px] text-muted-foreground">Ini akan menggerakkan progress di menu Anggaran.</p>
          </div>

          <div className="space-y-2">
            <Label>Catatan (opsional)</Label>
            <Input name="description" placeholder="Misal: Nabung bulan Oktober" />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Proses Transfer
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  )
}