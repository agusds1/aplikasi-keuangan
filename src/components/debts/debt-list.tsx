'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus, CheckCircle2, Trash2 } from 'lucide-react'
import { formatCurrency } from '@/lib/format'
import type { Account } from '@/lib/db/schema'
import { DebtFormSheet } from './debt-form-sheet'
import { PayDebtSheet } from './pay-debt-sheet'
import { deleteDebtAction } from '@/app/actions/debts'
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

type Debt = any

export function DebtList({ debts, accounts }: { debts: Debt[]; accounts: Account[] }) {
  const router = useRouter()
  const [showCreate, setShowCreate] = useState(false)
  const [payingDebt, setPayingDebt] = useState<Debt | null>(null)
  const [deletingDebt, setDeletingDebt] = useState<Debt | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleRefresh = () => router.refresh()

  async function handleDelete() {
    if (!deletingDebt) return
    setError(null)
    const res = await deleteDebtAction(deletingDebt.id)
    if (res.error) {
      setError(res.error)
      return
    }
    setDeletingDebt(null)
    handleRefresh()
  }

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <Button size="sm" onClick={() => setShowCreate(true)}>
          <Plus className="mr-1 h-4 w-4" /> Tambah Hutang
        </Button>
      </div>

      {error && <div className="p-3 bg-red-50 text-red-700 text-xs rounded-lg">{error}</div>}

      {debts.length === 0 ? (
        <div className="rounded-xl bg-card border p-12 text-center">
          <div className="text-4xl mb-3">🎉</div>
          <p className="font-medium">Alhamdulillah, tidak ada hutang</p>
        </div>
      ) : (
        <div className="space-y-3">
          {debts.map((debt) => {
            const principal = parseFloat(debt.principalAmount)
            const remaining = parseFloat(debt.remainingPrincipal)
            const progress = ((principal - remaining) / principal) * 100

            return (
              <Card key={debt.id} className={remaining <= 0 ? 'opacity-60' : ''}>
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-bold">{debt.name}</p>
                      <p className="text-xs text-muted-foreground">
                        Bunga: {debt.interestRate}% / bln · Tenor: {debt.tenorMonths} bln
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {remaining <= 0 ? (
                        <CheckCircle2 className="text-green-600" />
                      ) : (
                        <p className="text-sm font-bold text-red-600">{formatCurrency(remaining)}</p>
                      )}
                      <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => setDeletingDebt(debt)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="h-2 rounded-full bg-muted overflow-hidden">
                      <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${Math.min(progress, 100)}%` }} />
                    </div>
                    <div className="flex justify-between text-[10px] text-muted-foreground">
                      <span>Terbayar: {progress.toFixed(1)}%</span>
                      <span>Total: {formatCurrency(principal)}</span>
                    </div>
                  </div>

                  {remaining > 0 && (
                    <Button size="sm" className="w-full" onClick={() => setPayingDebt(debt)}>
                      💸 Bayar Cicilan
                    </Button>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {showCreate && <DebtFormSheet open={showCreate} onOpenChange={setShowCreate} accounts={accounts} onSuccess={handleRefresh} />}
      {payingDebt && <PayDebtSheet debt={payingDebt} accounts={accounts} open={!!payingDebt} onOpenChange={(o) => !o && setPayingDebt(null)} onSuccess={handleRefresh} />}

      <AlertDialog open={!!deletingDebt} onOpenChange={(open) => !open && setDeletingDebt(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Catatan Hutang?</AlertDialogTitle>
            <AlertDialogDescription>
              Data hutang <strong>{deletingDebt?.name}</strong> akan dihapus. Transaksi riwayat pembayaran yang sudah terjadi tidak akan terhapus.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-white hover:bg-destructive/90">
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}