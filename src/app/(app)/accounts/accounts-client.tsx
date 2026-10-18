'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { formatCurrency } from '@/lib/format'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus, Edit2 } from 'lucide-react'
import { AccountFormSheet } from '@/components/accounts/account-form-sheet'
import type { Account } from '@/lib/db/schema'

type Props = {
  initialAccounts: Account[]
}

export function AccountsClient({ initialAccounts }: Props) {
  const router = useRouter()
  const [accounts, setAccounts] = useState<Account[]>(initialAccounts || [])
  const [showCreate, setShowCreate] = useState(false)
  const [editingAccount, setEditingAccount] = useState<Account | null>(null)

  const totalBalance = accounts.reduce((s, a) => s + parseFloat(a.currentBalance), 0)

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
              <div className="flex items-center gap-3">
                <p className="font-bold text-sm">{formatCurrency(acc.currentBalance)}</p>
                <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setEditingAccount(acc)}>
                  <Edit2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Create Dialog */}
      {showCreate && (
        <AccountFormSheet
          open={showCreate}
          onOpenChange={setShowCreate}
          account={null}
        />
      )}

      {/* Edit Dialog */}
      {editingAccount && (
        <AccountFormSheet
          open={!!editingAccount}
          onOpenChange={(open) => !open && setEditingAccount(null)}
          account={editingAccount}
        />
      )}
    </div>
  )
}