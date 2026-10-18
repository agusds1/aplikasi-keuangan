'use client'

import { useState } from 'react'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Loader2 } from 'lucide-react'
import { createAccountAction, updateAccountAction } from '@/app/actions/accounts'
import { CurrencyInput } from '@/components/ui/currency-input'
import type { Account } from '@/lib/db/schema'

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  account: Account | null
}

export function AccountFormSheet({ open, onOpenChange, account }: Props) {
  const isEditing = !!account
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [type, setType] = useState<'CASH' | 'BANK' | 'EWALLET'>(
    (account?.type as any) || 'BANK'
  )
  const [balance, setBalance] = useState(
    account ? Math.round(parseFloat(account.initialBalance)).toString() : ''
  )
  const [name, setName] = useState(account?.name || '')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const payload = {
      name,
      type,
      initialBalance: Number(balance),
    }

    const res = isEditing
      ? await updateAccountAction(account.id, payload)
      : await createAccountAction(payload)

    if (res.error) {
      setError(res.error)
      setLoading(false)
      return
    }

    onOpenChange(false)
    setLoading(false)
    
    // Reset form jika bukan mode edit (buat baru)
    if (!isEditing) {
      setName('')
      setBalance('')
      setType('BANK')
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom">
        <SheetHeader>
          <SheetTitle>{isEditing ? 'Edit Dompet' : 'Tambah Dompet'}</SheetTitle>
        </SheetHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="grid grid-cols-3 gap-2">
            {['CASH', 'BANK', 'EWALLET'].map((t) => (
              <Button
                key={t}
                type="button"
                variant={type === t ? 'default' : 'outline'}
                onClick={() => setType(t as any)}
              >
                {t}
              </Button>
            ))}
          </div>

          <div className="space-y-2">
            <Label>Nama Dompet</Label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="BCA / Dompet / OVO"
              className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Saldo Awal</Label>
            <CurrencyInput
              placeholder="0"
              value={balance}
              onChange={setBalance}
              required
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}
          
          <Button type="submit" className="w-full" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Simpan
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  )
}