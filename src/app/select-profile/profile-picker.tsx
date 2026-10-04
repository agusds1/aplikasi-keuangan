'use client'

import { useState } from 'react'
import { selectMemberAction } from '@/app/actions/auth'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import type { Member } from '@/lib/db/schema'
import { Loader2, Lock } from 'lucide-react'

export function ProfilePicker({ members }: { members: Member[] }) {
  const [selectedMember, setSelectedMember] = useState<Member | null>(null)
  const [pin, setPin] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function handleSelectMember(member: Member) {
    setSelectedMember(member)
    setPin('')
    setError(null)
  }

  async function handleSubmitPin(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedMember) return

    setLoading(true)
    setError(null)

    const result = await selectMemberAction(selectedMember.id, pin)

    if (result?.error) {
      setError(result.error)
      setLoading(false)
      return
    }

    // Kalau berhasil, akan redirect — jadi tidak perlu apa-apa lagi
  }

  return (
    <>
      <div className="grid grid-cols-2 gap-4">
        {members.map((member) => (
          <Card
            key={member.id}
            className="cursor-pointer hover:shadow-lg transition-all hover:scale-105 active:scale-95"
            onClick={() => handleSelectMember(member)}
            style={{ borderColor: member.color }}
          >
            <div className="p-6 flex flex-col items-center gap-2">
              <div
                className="w-20 h-20 rounded-full flex items-center justify-center text-4xl relative"
                style={{ backgroundColor: `${member.color}20` }}
              >
                {member.avatar}
                {member.pinHash && (
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-background border-2 flex items-center justify-center"
                    style={{ borderColor: member.color }}
                  >
                    <Lock className="h-3 w-3" style={{ color: member.color }} />
                  </div>
                )}
              </div>
              <p className="font-semibold">{member.name}</p>
              <p className="text-xs text-muted-foreground capitalize">
                {member.role.toLowerCase()}
              </p>
            </div>
          </Card>
        ))}
      </div>

      {/* PIN Dialog */}
      <Dialog
        open={!!selectedMember}
        onOpenChange={(open) => !open && setSelectedMember(null)}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-center">
              Masukkan PIN
            </DialogTitle>
            <DialogDescription className="text-center">
              untuk masuk sebagai {selectedMember?.avatar}{' '}
              <span className="font-semibold">{selectedMember?.name}</span>
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmitPin} className="space-y-4">
            <div className="flex justify-center">
              <div
                className="w-20 h-20 rounded-full flex items-center justify-center text-4xl"
                style={{
                  backgroundColor: `${selectedMember?.color}20`,
                }}
              >
                {selectedMember?.avatar}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="pin">PIN</Label>
              <Input
                id="pin"
                type="password"
                inputMode="numeric"
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                placeholder="••••"
                maxLength={6}
                autoFocus
                className="text-center text-2xl tracking-widest"
              />
              {!selectedMember?.pinHash && (
                <p className="text-xs text-muted-foreground text-center">
                  Profil ini belum punya PIN — langsung masuk, nanti
                  atur di Setting.
                </p>
              )}
            </div>

            {error && (
              <p className="text-sm text-destructive text-center">{error}</p>
            )}

            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => setSelectedMember(null)}
                disabled={loading}
              >
                Batal
              </Button>
              <Button type="submit" className="flex-1" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Masuk
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}