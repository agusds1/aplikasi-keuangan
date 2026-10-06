import { getActiveMemberId } from '@/lib/auth/session'
import { db } from '@/lib/db'
import { members, categories } from '@/lib/db/schema'
import { eq, and, inArray } from 'drizzle-orm'
import { getMonthlySummary, getCategoryBreakdown, getMemberBreakdown } from '@/lib/db/analytics'
import { SummaryCards } from '@/components/dashboard/summary-cards'
import { CategoryProgress } from '@/components/dashboard/category-progress'
import { MemberBreakdown } from '@/components/dashboard/member-breakdown'
import { format } from 'date-fns'
import { id as idLocale } from 'date-fns/locale'
import Link from 'next/link'
import { ClipboardList, BarChart3 } from 'lucide-react'
import { getUpcomingPlans } from '@/lib/db/queries'
import { Bell, AlertCircle } from 'lucide-react'
import { PlanRecapCard } from '@/components/dashboard/plan-recap-card'
import { getActivePlans, getPendingPlansCount } from '@/lib/db/queries'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function DashboardPage() {
  const activeMemberId = await getActiveMemberId()
  const [activeMember] = await db
    .select()
    .from(members)
    .where(eq(members.id, activeMemberId!))
    .limit(1)

  const [summary, categoryBreakdown, memberBreakdown, activePlans] =
  await Promise.all([
    getMonthlySummary(activeMember.familyId),
    getCategoryBreakdown(activeMember.familyId),
    getMemberBreakdown(activeMember.familyId),
    getActivePlans(activeMember.familyId),
  ])


  // Filter breakdown untuk hanya yang punya alokasi (untuk tabungan)
  const savingCategories = categoryBreakdown.filter(
    (c) => c.categoryType === 'SAVING'
  )
  const totalSaving = savingCategories.reduce((sum, c) => sum + c.actual, 0)

  const pendingPlans = await getPendingPlansCount(
    activeMember.familyId,
    activeMemberId!
  )

  const upcomingPlans = await getUpcomingPlans(
    activeMember.familyId,
    activeMemberId!
  )

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

      {upcomingPlans.length > 0 && (
        <Link href="/plans">
          <div className="rounded-xl bg-orange-50 dark:bg-orange-950 border border-orange-200 dark:border-orange-800 p-4 flex items-start justify-between hover:bg-orange-100 dark:hover:bg-orange-900 transition-colors">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-orange-100 dark:bg-orange-900 flex items-center justify-center shrink-0">
                <Bell className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-orange-900 dark:text-orange-100">
                  {upcomingPlans.length} Rencana Mendekati Tanggal
                </p>
                <p className="text-xs text-orange-700 dark:text-orange-300 mt-0.5">
                  {upcomingPlans
                    .slice(0, 2)
                    .map((r) => {
                      const days = Math.ceil(
                        (new Date(r.plan.plannedDate).getTime() -
                          new Date().setHours(0, 0, 0, 0)) /
                          (1000 * 60 * 60 * 24)
                      )
                      return days === 0
                        ? 'Hari ini'
                        : `${days} hari lagi`
                    })
                    .join(', ')}
                  {upcomingPlans.length > 2 && ` +${upcomingPlans.length - 2}`}
                </p>
              </div>
            </div>
            <span className="text-orange-600">→</span>
          </div>
        </Link>
      )}

      {/* Alert Rencana Menunggu Persetujuan */}
      {pendingPlans > 0 && (
        <Link href="/plans">
          <div className="rounded-xl bg-primary/5 border border-primary/20 p-4 flex items-center justify-between hover:bg-primary/10 transition-colors">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                <ClipboardList className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-semibold">Rencana Transaksi</p>
                <p className="text-xs text-muted-foreground">
                  {pendingPlans} transaksi menunggu persetujuan Anda
                </p>
              </div>
            </div>
            <span className="text-primary">→</span>
          </div>
        </Link>
      )}

      {/* Summary Cards */}
      <SummaryCards
        income={summary.income}
        expense={summary.expense}
        saving={totalSaving}
      />

      {/* Rekap Rencana Transaksi */}
      <PlanRecapCard plans={activePlans} />

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

      {/* Quick link ke Laporan */}
      <Link href="/reports">
        <div className="rounded-xl bg-card border p-4 flex items-center justify-between hover:bg-muted/50 transition-colors">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
              <BarChart3 className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold">Lihat Laporan Lengkap</p>
              <p className="text-xs text-muted-foreground">
                Grafik pengeluaran & tren
              </p>
            </div>
          </div>
          <span className="text-muted-foreground">→</span>
        </div>
      </Link>
    </div>
  )
}