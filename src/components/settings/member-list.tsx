'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Plus, Edit2 } from 'lucide-react'
import type { Member } from '@/lib/db/schema'
import { toggleMemberActiveAction } from '@/app/actions/members'
import { MemberFormDialog } from './member-form-dialog'

export function MemberList({
  members,
  activeMemberId,
}: {
  members: Member[]
  activeMemberId: string
}) {
  const [editing, setEditing] = useState<Member | null>(null)
  const [creating, setCreating] = useState(false)

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          {members.filter((m) => m.isActive).length} anggota aktif
        </p>
        <Button size="sm" onClick={() => setCreating(true)}>
          <Plus className="mr-1 h-4 w-4" />
          Tambah
        </Button>
      </div>

      <div className="space-y-2">
        {members.map((m) => (
          <Card key={m.id}>
            <CardContent className="p-3">
              <div className="flex items-center gap-3">
                <div
                  className="w-11 h-11 rounded-full flex items-center justify-center text-xl shrink-0"
                  style={{ backgroundColor: `${m.color}30` }}
                >
                  {m.avatar}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-sm truncate">{m.name}</p>
                    {m.id === activeMemberId && (
                      <Badge variant="secondary" className="text-[10px]">
                        Aktif
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground capitalize">
                    {m.role.toLowerCase()}
                    {m.pinHash && ' · 🔒 PIN'}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8"
                    onClick={() => setEditing(m)}
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                  </Button>
                  <Switch
                    checked={m.isActive}
                    onCheckedChange={(checked) => {
                      toggleMemberActiveAction(m.id, checked)
                    }}
                    disabled={m.id === activeMemberId}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Create Dialog */}
      {creating && (
        <MemberFormDialog
          open={creating}
          onOpenChange={setCreating}
          member={null}
        />
      )}

      {/* Edit Dialog */}
      {editing && (
        <MemberFormDialog
          open={!!editing}
          onOpenChange={(open) => !open && setEditing(null)}
          member={editing}
        />
      )}
    </div>
  )
}