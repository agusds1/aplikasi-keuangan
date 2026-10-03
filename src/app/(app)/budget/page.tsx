import { getActiveMemberId } from '@/lib/auth/session'
import { db } from '@/lib/db'
import { members } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { getCategoriesByFamily } from '@/lib/db/queries'
import {
  getMonthlySummary,
  getAllocationsByPeriod,
  getPeriod,
} from '@/lib/db/analytics'
import { BudgetForm } from '@/components/budget/budget-form'
import { format } from 'date-fns'
import { id as idLocale } from 'date-fns/locale'

export default async function BudgetPage() {
  const activeMemberId = await getActiveMemberId()
  const [activeMember] = await db
    .select()
    .from(members)
    .where(eq(members.id, activeMemberId!))
    .limit(1)

  const now = new Date()
  const period = getPeriod(now)
  const periodLabel = format(now, 'MMMM yyyy', { locale: idLocale })

  const [categories, allocations, summary] = await Promise.all([
    getCategoriesByFamily(activeMember.familyId),
    getAllocationsByPeriod(activeMember.familyId, period),
    getMonthlySummary(activeMember.familyId, now),
  ])

  // Untuk budget, gunakan pemasukan aktual bulan ini sebagai batas atas
  // Kalau belum ada pemasukan, gunakan 0
  const totalIncome = summary.income

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold">💰 Anggaran</h1>
        <p className="text-xs text-muted-foreground">
          Tentukan alokasi per pos untuk bulan ini
        </p>
      </div>

      <BudgetForm
        categories={categories}
        existingAllocations={allocations}
        period={period}
        periodLabel={periodLabel}
        totalIncome={totalIncome}
      />
    </div>
  )
}