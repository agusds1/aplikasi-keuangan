import { getActiveMemberId } from '@/lib/auth/session'
import { db } from '@/lib/db'
import { members, categories } from '@/lib/db/schema'
import { eq, and, inArray } from 'drizzle-orm'
import {
  getMonthlySummary,
  getCategoryBreakdown,
  getMemberBreakdown,
} from '@/lib/db/analytics'
import { SummaryCards } from '@/components/dashboard/summary-cards'
import { CategoryProgress } from '@/components/dashboard/category-progress'
import { MemberBreakdown } from '@/components/dashboard/member-breakdown'
import { format } from 'date-fns'
import { id as idLocale } from 'date-fns/locale'

export default async function DashboardPage() {
  const activeMemberId = await getActiveMemberId()
  const [activeMember] = await db
    .select()
    .from(members)
    .where(eq(members.id, activeMemberId!))
    .limit(1)

  const [summary, categoryBreakdown, memberBreakdown] = await Promise.all([
    getMonthlySummary(activeMember.familyId),
    getCategoryBreakdown(activeMember.familyId),
    getMemberBreakdown(activeMember.familyId),
  ])

  // Filter breakdown untuk hanya yang punya alokasi (untuk tabungan)
  const savingCategories = categoryBreakdown.filter(
    (c) => c.categoryType === 'SAVING'
  )
  const totalSaving = savingCategories.reduce((sum, c) => sum + c.actual, 0)

  return (
    <div className="space-y-6">
      {/* Greeting */}
      <div>
        <p className="text-sm text-muted-foreground">
          {format(new Date(), 'EEEE, d MMMM yyyy', { locale: idLocale })}
        </p>
        <h1 className="text-xl font-bold flex items-center gap-2">
          <span>Halo, {activeMember.avatar} {activeMember.name}</span>
        </h1>
      </div>

      {/* Summary Cards */}
      <SummaryCards
        income={summary.income}
        expense={summary.expense}
        saving={totalSaving}
      />

      {/* Progress Alokasi */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold">📊 Progress Anggaran</h2>
          <span className="text-xs text-muted-foreground">
            {format(new Date(), 'MMMM yyyy', { locale: idLocale })}
          </span>
        </div>
        <CategoryProgress data={categoryBreakdown} />
      </div>

      {/* Breakdown per Member */}
      <div>
        <h2 className="text-sm font-bold mb-3">
          👥 Pengeluaran per Anggota
        </h2>
        <MemberBreakdown data={memberBreakdown} />
      </div>
    </div>
  )
}