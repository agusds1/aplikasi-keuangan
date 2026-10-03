'use client'

import { selectMemberAction } from '@/app/actions/auth'
import { Card } from '@/components/ui/card'
import type { Member } from '@/lib/db/schema'
import { useState } from 'react'

export function ProfilePicker({ members }: { members: Member[] }) {
  const [loading, setLoading] = useState<string | null>(null)

  async function handleSelect(memberId: string) {
    setLoading(memberId)
    await selectMemberAction(memberId)
  }

  return (
    <div className="grid grid-cols-2 gap-4">
      {members.map((member) => (
        <Card
          key={member.id}
          className="cursor-pointer hover:shadow-lg transition-all hover:scale-105 active:scale-95"
          onClick={() => handleSelect(member.id)}
          style={{ borderColor: member.color }}
        >
          <div className="p-6 flex flex-col items-center gap-2">
            <div
              className="w-20 h-20 rounded-full flex items-center justify-center text-4xl"
              style={{ backgroundColor: `${member.color}20` }}
            >
              {member.avatar}
            </div>
            <p className="font-semibold">{member.name}</p>
            <p className="text-xs text-muted-foreground capitalize">
              {member.role.toLowerCase()}
            </p>
            {loading === member.id && (
              <p className="text-xs text-muted-foreground">Memuat...</p>
            )}
          </div>
        </Card>
      ))}
    </div>
  )
}