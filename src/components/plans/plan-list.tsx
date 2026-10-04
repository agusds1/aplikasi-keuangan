'use client'

import { useRouter } from 'next/navigation'
import { PlanCard } from './plan-card'
import type { Category } from '@/lib/db/schema'

type Plan = any

export function PlanList({
  plans,
  activeMemberId,
  categories,
}: {
  plans: Plan[]
  activeMemberId: string
  categories: Category[]
}) {
  const router = useRouter()

  const handleUpdate = () => {
    router.refresh()
  }

  return (
    <div className="space-y-3">
      {plans.map((row) => (
        <PlanCard
          key={row.plan.id}
          plan={{
            ...row.plan,
            category: row.category,
            creator: row.creator,
          }}
          activeMemberId={activeMemberId}
          categories={categories}
          onUpdate={handleUpdate}
        />
      ))}
    </div>
  )
}