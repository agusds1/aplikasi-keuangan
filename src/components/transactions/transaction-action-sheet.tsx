'use client'

import { useState } from 'react'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Edit2, Trash2, Loader2 } from 'lucide-react'
import type { Category, Account } from '@/lib/db/schema'
import {
  updateTransactionAction,
  deleteTransactionAction,
} from '@/app/actions/transactions'
import { cn } from '@/lib/utils'
import { CurrencyInput } from '@/components/ui/currency-input'

type TransactionData = {
  id: string
  categoryId: string
  accountId: string | null
  type: 'INCOME' | 'EXPENSE' | 'TRANSFER' | 'LOAN_RECEIVE' | 'ASSET_SALE'
  amount: string
  description: string | null
  date: Date
}

type Props = {
  transaction: TransactionData
  categories: Category[]
  accounts: Account[]
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function TransactionActionSheet({
  transaction,
  categories,
  accounts,
  open,
  onOpenChange,
}: Props) {
  const [mode, setMode] = useState<'menu' | 'edit'>('menu')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const [selectedType, setSelectedType] = useState<'EXPENSE' | 'INCOME'>(
    transaction.type === 'INCOME' ? 'INCOME' : 'EXPENSE'
  )
  const [selectedCategoryId, setSelectedCategoryId] = useState(
    transaction.categoryId
  )
  const [selectedAccountId, setSelectedAccountId] = useState(
    transaction.accountId || accounts[0]?.id || ''
  )
  
  // Ubah state amount menjadi string murni angka
  const [amount, setAmount] = useState(
    Math.round(parseFloat(transaction.amount)).toString()
  )

  const filteredCategories = categories.filter((c) => {
    if (selectedType === 'INCOME') return c.type === 'INCOME'
    return c.type !== 'INCOME'
  })

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (!selectedCategoryId) return setError('Pilih kategori dulu')
    if (!selectedAccountId) return setError('Pilih dompet dulu')

    const numAmount = parseFloat(amount)
    if (!numAmount || numAmount <= 0) return setError('Nominal tidak valid')

    setLoading(true)

    const result = await updateTransactionAction(transaction.id, {
      categoryId: selectedCategoryId,
      accountId: selectedAccountId,
      type: selectedType,
      amount: numAmount,
      date: transaction.date.toISOString(),
    })

    if (result.error) {
      setError(result.error)
      setLoading(false)
      return
    }

    onOpenChange(false)
    setLoading(false)
  }

  async function handleDelete() {
    setLoading(true)
    const result = await deleteTransactionAction(transaction.id)

    if (result.error) {
      setError(result.error)
      setLoading(false)
      setConfirmDelete(false)
      return
    }

    setConfirmDelete(false)
    onOpenChange(false)
    setLoading(false)
  }

  function handleClose(open: boolean) {
    onOpenChange(open)
    if (!open) {
      setTimeout(() => {
        setMode('menu')
        setError(null)
      }, 300)
    }
  }

  return (
    <>
      <Sheet open={open} onOpenChange={handleClose}>
        <SheetContent side="bottom" className="max-h-[90vh] overflow-y-auto">
          {mode === 'menu' ? (
            <>
              <SheetHeader>
                <SheetTitle>Aksi Transaksi</SheetTitle>
              </SheetHeader>

              <div className="space-y-2 mt-4">
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => setMode('edit')}
                >
                  <Edit2 className="mr-2 h-4 w-4" />
                  Edit Transaksi
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start text-destructive hover:text-destructive"
                  onClick={() => setConfirmDelete(true)}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Hapus Transaksi
                </Button>
              </div>

              {error && (
                <p className="text-sm text-destructive mt-3">{error}</p>
              )}
            </>
          ) : (
            <>
              <SheetHeader>
                <SheetTitle>Edit Transaksi</SheetTitle>
              </SheetHeader>

              <form onSubmit={handleUpdate} className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    type="button"
                    variant={selectedType === 'EXPENSE' ? 'default' : 'outline'}
                    onClick={() => {
                      setSelectedType('EXPENSE')
                      setSelectedCategoryId('')
                    }}
                  >
                    💸 Pengeluaran
                  </Button>
                  <Button
                    type="button"
                    variant={selectedType === 'INCOME' ? 'default' : 'outline'}
                    onClick={() => {
                      setSelectedType('INCOME')
                      setSelectedCategoryId('')
                    }}
                  >
                    💰 Pemasukan
                  </Button>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-amount">Nominal</Label>
                  {/* GANTI INPUT BIASA MENJADI CURRENCY INPUT */}
                  <CurrencyInput
                    id="edit-amount"
                    value={amount}
                    onChange={setAmount}
                    className="text-lg font-semibold"
                  />
                </div>

                {/* Pilihan Dompet */}
                <div className="space-y-2">
                  <Label>Uang dari Dompet</Label>
                  <select
                    value={selectedAccountId}
                    onChange={(e) => setSelectedAccountId(e.target.value)}
                    className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    required
                  >
                    {accounts.map((acc) => (
                      <option key={acc.id} value={acc.id}>
                        {acc.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <Label>Kategori</Label>
                  <div className="grid grid-cols-3 gap-2">
                    {filteredCategories.map((cat) => (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setSelectedCategoryId(cat.id)}
                        className={cn(
                          'flex flex-col items-center gap-1 p-3 rounded-lg border transition-all',
                          selectedCategoryId === cat.id
                            ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                            : 'border-border hover:bg-muted'
                        )}
                      >
                        <span className="text-2xl">{cat.icon}</span>
                        <span className="text-xs text-center leading-tight">
                          {cat.name}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {error && (
                  <p className="text-sm text-destructive">{error}</p>
                )}

                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1"
                    onClick={() => setMode('menu')}
                    disabled={loading}
                  >
                    Kembali
                  </Button>
                  <Button type="submit" className="flex-1" disabled={loading}>
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Simpan
                  </Button>
                </div>
              </form>
            </>
          )}
        </SheetContent>
      </Sheet>

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus transaksi?</AlertDialogTitle>
            <AlertDialogDescription>
              Transaksi ini akan dihapus permanen dan tidak bisa dikembalikan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading}>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={loading}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}