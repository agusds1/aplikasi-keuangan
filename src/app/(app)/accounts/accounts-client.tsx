'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { formatCurrency } from '@/lib/format'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus, Edit2, Trash2 } from 'lucide-react'
import { AccountFormSheet } from '@/components/accounts/account-form-sheet'
import type { Account } from '@/lib/db/schema'
import { deleteAccountAction } from '@/app/actions/accounts'
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

type Props = { initialAccounts: Account[] }

export function AccountsClient({ initialAccounts }: Props) {
  const router = useRouter()
  const accounts = initialAccounts || []
  
  const [showCreate, setShowCreate] = useState(false)
  const [editingAccount, setEditingAccount] = useState<Account | null>(null)
  const [deletingAccount, setDeletingAccount] = useState<Account | null>(null)
  const [error, setError] = useState<string | null>(null)

  const totalBalance = accounts.reduce((s, a) => s + parseFloat(a.currentBalance), 0)

  async function handleDelete() {
    if (!deletingAccount) return
    setError(null)
    const res = await deleteAccountAction(deletingAccount.id)
    if (res.error) {
      setError(res.error)
      return
    }
    setDeletingAccount(null)
    router.refresh()
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">💳 Dompet & Kas</h1>
          <p className="text-xs text-muted-foreground">Total Saldo: {formatCurrency(totalBalance)}</p>
        </div>
        <Button size="icon" variant="outline" onClick={() => setShowCreate(true)}>
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      {error && <div className="p-3 bg-red-50 text-red-700 text-xs rounded-lg">{error}</div>}

      <div className="space-y-2">
        {accounts.map(acc => (
          <Card key={acc.id}>
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-lg">
                  {acc.type === 'BANK' ? '🏦' : acc.type === 'CASH' ? '💵' : '📱'}
                </div>
                <div>
                  <p className="font-semibold text-sm">{acc.name}</p>
                  <p className="text-[10px] text-muted-foreground capitalize">{acc.type.toLowerCase()}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <p className="font-bold text-sm mr-2">{formatCurrency(acc.currentBalance)}</p>
                <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground" onClick={() => setEditingAccount(acc)}>
                  <Edit2 className="h-4 w-4" />
                </Button>
                <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => setDeletingAccount(acc)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {showCreate && <AccountFormSheet open={showCreate} onOpenChange={setShowCreate} account={null} />}
      {editingAccount && <AccountFormSheet open={!!editingAccount} onOpenChange={(open) => !open && setEditingAccount(null)} account={editingAccount} />}

      <AlertDialog open={!!deletingAccount} onOpenChange={(open) => !open && setDeletingAccount(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Dompet?</AlertDialogTitle>
            <AlertDialogDescription>
              Dompet <strong>{deletingAccount?.name}</strong> akan dihapus permanen.
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