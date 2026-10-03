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
import type { Member } from '@/lib/db/schema'
import { logoutAction } from '@/app/actions/auth'
import { LogOut, UserCog } from 'lucide-react'

export function AvatarSwitcher({ member }: { member: Member }) {
  const [loading, setLoading] = useState(false)

  async function handleLogout() {
    setLoading(true)
    await logoutAction()
  }

  return (
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
          <DropdownMenuItem
            onClick={() => {
              window.location.href = '/switch-profile'
            }}
          >
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
  )
}