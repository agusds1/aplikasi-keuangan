'use client'

import { useMemo } from 'react'
import { formatCurrency } from '@/lib/format'
import { MemberBadge } from '@/components/shared/member-badge'
import { cn } from '@/lib/utils'

type BreakdownRow = {
  categoryId: string
  categoryName: string
  categoryIcon: string
  categoryColor: string
  memberId: string
  memberName: string
  memberAvatar: string
  memberColor: string
  memberRole: string
  total: number
}

type Grouped = {
  categoryId: string
  categoryName: string
  categoryIcon: string
  categoryColor: string
  total: number
  members: {
    memberId: string
    memberName: string
    memberAvatar: string
    memberColor: string
    memberRole: string
    total: number
  }[]
}

export function CategoryMemberBreakdown({
  data,
  emptyMessage = 'Belum ada data',
}: {
  data: BreakdownRow[]
  emptyMessage?: string
}) {
  const grouped = useMemo(() => {
    const map = new Map<string, Grouped>()

    for (const row of data) {
      if (!map.has(row.categoryId)) {
        map.set(row.categoryId, {
          categoryId: row.categoryId,
          categoryName: row.categoryName,
          categoryIcon: row.categoryIcon,
          categoryColor: row.categoryColor,
          total: 0,
          members: [],
        })
      }
      const group = map.get(row.categoryId)!
      group.total += row.total
      group.members.push({
        memberId: row.memberId,
        memberName: row.memberName,
        memberAvatar: row.memberAvatar,
        memberColor: row.memberColor,
        memberRole: row.memberRole,
        total: row.total,
      })
    }

    // Sort group by total desc, members by total desc
    return Array.from(map.values())
      .sort((a, b) => b.total - a.total)
      .map((g) => ({
        ...g,
        members: g.members.sort((a, b) => b.total - a.total),
      }))
  }, [data])

  if (grouped.length === 0) {
    return (
      <div className="rounded-lg bg-muted/30 border border-dashed p-4 text-center">
        <p className="text-xs text-muted-foreground">{emptyMessage}</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {grouped.map((group) => (
        <div key={group.categoryId} className="space-y-1.5">
          {/* Kategori header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="text-sm">{group.categoryIcon}</span>
              <span className="text-xs font-semibold truncate">
                {group.categoryName}
              </span>
            </div>
            <span className="text-xs font-bold whitespace-nowrap ml-2">
              {formatCurrency(group.total)}
            </span>
          </div>

          {/* Member breakdown */}
          <div className="pl-4 space-y-1">
            {group.members.map((m) => (
              <div
                key={`${group.categoryId}-${m.memberId}`}
                className="flex items-center justify-between"
              >
                <MemberBadge
                  name={m.memberName}
                  avatar={m.memberAvatar}
                  color={m.memberColor}
                  size="sm"
                />
                <span className="text-[11px] font-medium whitespace-nowrap ml-2 text-muted-foreground">
                  {formatCurrency(m.total)}
                </span>
              </div>
            ))}
          </div>

          {/* Divider kecuali yang terakhir */}
          {grouped.indexOf(group) < grouped.length - 1 && (
            <div className="border-b border-dashed pt-1" />
          )}
        </div>
      ))}
    </div>
  )
}