'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2 } from 'lucide-react'
import type { Member } from '@/lib/db/schema'
import {
  createMemberAction,
  updateMemberAction,
} from '@/app/actions/members'
import { cn } from '@/lib/utils'

const AVATARS = ['👨', '👩', '👦', '👧', '🧑', '👴', '👵', '👶', '🐱', '🐶']
const COLORS = [
  '#3b82f6',
  '#ec4899',
  '#10b981',
  '#f59e0b',
  '#8b5cf6',
  '#ef4444',
  '#06b6d4',
  '#84cc16',
]

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  member: Member | null
}

export function MemberFormDialog({ open, onOpenChange, member }: Props) {
  const isEditing = !!member
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [name, setName] = useState(member?.name ?? '')
  const [role, setRole] = useState<'HUSBAND' | 'WIFE' | 'CHILD' | 'OTHER'>(
    (member?.role as any) ?? 'OTHER'
  )
  const [avatar, setAvatar] = useState(member?.avatar ?? '👤')
  const [color, setColor] = useState(member?.color ?? '#3b82f6')
  const [pin, setPin] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (!name.trim()) {
      setError('Nama wajib diisi')
      return
    }

    setLoading(true)

    const payload = { name: name.trim(), role, avatar, color, pin }

    const result = isEditing
      ? await updateMemberAction(member!.id, payload)
      : await createMemberAction(payload)

    if (result.error) {
      setError(result.error)
      setLoading(false)
      return
    }

    onOpenChange(false)
    setLoading(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Edit Anggota' : 'Tambah Anggota'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Preview */}
          <div className="flex flex-col items-center gap-2 py-2">
            <div
              className="w-20 h-20 rounded-full flex items-center justify-center text-4xl"
              style={{ backgroundColor: `${color}30` }}
            >
              {avatar}
            </div>
            <p className="font-semibold">{name || 'Nama Anggota'}</p>
          </div>

          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Nama</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Misal: Andi"
            />
          </div>

          {/* Role */}
          <div className="space-y-2">
            <Label>Peran</Label>
            <div className="grid grid-cols-4 gap-2">
              {[
                { value: 'HUSBAND', label: 'Suami' },
                { value: 'WIFE', label: 'Istri' },
                { value: 'CHILD', label: 'Anak' },
                { value: 'OTHER', label: 'Lain' },
              ].map((r) => (
                <Button
                  key={r.value}
                  type="button"
                  size="sm"
                  variant={role === r.value ? 'default' : 'outline'}
                  onClick={() => setRole(r.value as any)}
                  className="text-xs"
                >
                  {r.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Avatar */}
          <div className="space-y-2">
            <Label>Avatar</Label>
            <div className="grid grid-cols-5 gap-2">
              {AVATARS.map((a) => (
                <button
                  key={a}
                  type="button"
                  onClick={() => setAvatar(a)}
                  className={cn(
                    'aspect-square rounded-lg border text-2xl flex items-center justify-center transition-all',
                    avatar === a
                      ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                      : 'border-border hover:bg-muted'
                  )}
                >
                  {a}
                </button>
              ))}
            </div>
          </div>

          {/* Color */}
          <div className="space-y-2">
            <Label>Warna</Label>
            <div className="grid grid-cols-8 gap-2">
              {COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={cn(
                    'aspect-square rounded-full border-2 transition-all',
                    color === c
                      ? 'border-foreground scale-110'
                      : 'border-transparent'
                  )}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          {/* PIN */}
          <div className="space-y-2">
            <Label htmlFor="pin">
              PIN (opsional){' '}
              <span className="text-xs text-muted-foreground">
                {isEditing ? '— isi untuk ganti' : '— 4-6 digit'}
              </span>
            </Label>
            <Input
              id="pin"
              type="password"
              inputMode="numeric"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              placeholder="••••"
              maxLength={6}
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Batal
            </Button>
            <Button type="submit" className="flex-1" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEditing ? 'Simpan' : 'Tambah'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}