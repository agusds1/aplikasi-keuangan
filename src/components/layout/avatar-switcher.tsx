'use client'

import { useState } from 'react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { Member } from '@/lib/db/schema'
import { logoutAction, selectMemberAction } from '@/app/actions/auth'
import { LogOut, UserCog, Loader2, Lock } from 'lucide-react'
import { db } from '@/lib/db'
import { members as membersTable } from '@/lib/db/schema'
import { eq, and, ne } from 'drizzle-orm'

export function AvatarSwitcher({ member }: { member: Member }) {
  const [loading, setLoading] = useState(false)
  const [showSwitchDialog, setShowSwitchDialog] = useState(false)
  const [otherMembers, setOtherMembers] = useState<Member[]>([])
  const [selectedMember, setSelectedMember] = useState<Member | null>(null)
  const [pin, setPin] = useState('')
  const [pinError, setPinError] = useState<string | null>(null)
  const [pinLoading, setPinLoading] = useState(false)

  async function handleLogout() {
    setLoading(true)
    await logoutAction()
  }

  async function handleOpenSwitch() {
    // Ambil member lain di family yang sama
    const others = await fetch('/api/members/others').then((r) => r.json())
    setOtherMembers(others)
    setShowSwitchDialog(true)
  }

  async function handleSubmitPin(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedMember) return

    setPinLoading(true)
    setPinError(null)

    const result = await selectMemberAction(selectedMember.id, pin)

    if (result?.error) {
      setPinError(result.error)
      setPinLoading(false)
      return
    }

    // Akan redirect
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger className="flex items-center gap-2 rounded-full p-1 pr-3 transition-colors hover:bg-muted">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-lg"
            style={{ backgroundColor: `${member.color}30` }}
          >
            {member.avatar}
          </div>
          <span className="text-xs font-medium">{member.name}</span>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuGroup>
            <DropdownMenuLabel>Profil Aktif</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleOpenSwitch}>
              <UserCog className="mr-2 h-4 w-4" />
              Ganti Profil
            </DropdownMenuItem>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleLogout} className="text-destructive">
            <LogOut className="mr-2 h-4 w-4" />
            Keluar
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Switch Profile Dialog — pilih member */}
      <Dialog
        open={showSwitchDialog && !selectedMember}
        onOpenChange={(open) => {
          setShowSwitchDialog(open)
          if (!open) {
            setSelectedMember(null)
            setPin('')
            setPinError(null)
          }
        }}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Ganti Profil</DialogTitle>
            <DialogDescription>
              Pilih profil yang mau dipakai
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-3">
            {otherMembers.map((m) => (
              <button
                key={m.id}
                onClick={() => setSelectedMember(m)}
                className="flex flex-col items-center gap-2 p-4 rounded-lg border hover:bg-muted transition-colors"
              >
                <div
                  className="w-14 h-14 rounded-full flex items-center justify-center text-2xl relative"
                  style={{ backgroundColor: `${m.color}30` }}
                >
                  {m.avatar}
                  {m.pinHash && (
                    <div
                      className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full bg-background border-2 flex items-center justify-center"
                      style={{ borderColor: m.color }}
                    >
                      <Lock
                        className="h-2.5 w-2.5"
                        style={{ color: m.color }}
                      />
                    </div>
                  )}
                </div>
                <span className="text-sm font-medium">{m.name}</span>
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* PIN Dialog */}
      <Dialog
        open={!!selectedMember}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedMember(null)
            setPin('')
            setPinError(null)
          }
        }}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-center">Masukkan PIN</DialogTitle>
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
              <Label htmlFor="pin-switch">PIN</Label>
              <Input
                id="pin-switch"
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
                  Belum punya PIN — langsung masuk, atur nanti di Setting.
                </p>
              )}
            </div>

            {pinError && (
              <p className="text-sm text-destructive text-center">
                {pinError}
              </p>
            )}

            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => setSelectedMember(null)}
                disabled={pinLoading}
              >
                Batal
              </Button>
              <Button type="submit" className="flex-1" disabled={pinLoading}>
                {pinLoading && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Masuk
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}