'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Lock, Loader2, Check } from 'lucide-react'
import { setMemberPinAction } from '@/app/actions/auth'

export function SetPinSection({ hasPin }: { hasPin: boolean }) {
  const [pin, setPin] = useState('')
  const [confirmPin, setConfirmPin] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{
    type: 'success' | 'error'
    text: string
  } | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setMessage(null)

    if (pin.length < 4 || pin.length > 6) {
      setMessage({ type: 'error', text: 'PIN harus 4-6 digit' })
      return
    }
    if (pin !== confirmPin) {
      setMessage({ type: 'error', text: 'PIN dan konfirmasi tidak sama' })
      return
    }

    setLoading(true)
    const result = await setMemberPinAction(pin)

    if (result?.error) {
      setMessage({ type: 'error', text: result.error })
    } else {
      setMessage({
        type: 'success',
        text: hasPin ? 'PIN berhasil diubah!' : 'PIN berhasil dibuat!',
      })
      setPin('')
      setConfirmPin('')
    }
    setLoading(false)
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Lock className="h-4 w-4" />
        <h3 className="text-sm font-bold">
          {hasPin ? 'Ubah PIN' : 'Buat PIN'}
        </h3>
      </div>
      <p className="text-xs text-muted-foreground">
        PIN mencegah orang lain masuk sebagai kamu. Berbeda dengan pasangan.
      </p>

      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="space-y-2">
          <Label htmlFor="new-pin">PIN Baru (4-6 digit)</Label>
          <Input
            id="new-pin"
            type="password"
            inputMode="numeric"
            value={pin}
            onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
            placeholder="••••"
            maxLength={6}
            className="text-center tracking-widest"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirm-pin">Konfirmasi PIN</Label>
          <Input
            id="confirm-pin"
            type="password"
            inputMode="numeric"
            value={confirmPin}
            onChange={(e) =>
              setConfirmPin(e.target.value.replace(/\D/g, ''))
            }
            placeholder="••••"
            maxLength={6}
            className="text-center tracking-widest"
          />
        </div>

        {message && (
          <div
            className={`rounded-lg p-3 text-sm flex items-center gap-2 ${
              message.type === 'success'
                ? 'bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300'
                : 'bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300'
            }`}
          >
            {message.type === 'success' && <Check className="h-4 w-4" />}
            {message.text}
          </div>
        )}

        <Button type="submit" disabled={loading} className="w-full">
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {hasPin ? 'Ubah PIN' : 'Simpan PIN'}
        </Button>
      </form>
    </div>
  )
}