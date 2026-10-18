import { getActiveMemberId } from '@/lib/auth/session'
import { db } from '@/lib/db'
import { members } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import {
  getCategoryBreakdown,
  getMemberBreakdown,
  getIncomeSummary,
  getExpenseSummary,
  getSavingSummary,
} from '@/lib/db/analytics'
import { SummaryCardsWrapper } from '@/components/dashboard/summary-cards-wrapper'
import { CategoryProgress } from '@/components/dashboard/category-progress'
import { MemberBreakdown } from '@/components/dashboard/member-breakdown'
import { PlanRecapCard } from '@/components/dashboard/plan-recap-card'
import { getActivePlans, getPendingPlansCount, getNetWorthData, getDebtPlansForApproval } from '@/lib/db/queries'
import { format } from 'date-fns'
import { id as idLocale } from 'date-fns/locale'
import Link from 'next/link'
import { ClipboardList, BarChart3 } from 'lucide-react'
import { decodeRange, getRangeDates } from '@/lib/date-range'
import { NetWorthCard } from '@/components/dashboard/net-worth-card'

type SearchParams = Promise<{
  income?: string
  expense?: string
  saving?: string
}>

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: SearchParams
}) {
  const params = await searchParams

  const activeMemberId = await getActiveMemberId()
  const [activeMember] = await db
    .select()
    .from(members)
    .where(eq(members.id, activeMemberId!))
    .limit(1)

  const incomeRange = decodeRange(params.income)
  const expenseRange = decodeRange(params.expense)
  const savingRange = decodeRange(params.saving)

  const [
    incomeSummary,
    expenseSummary,
    savingSummary,
    categoryBreakdown,
    memberBreakdown,
    activePlans,
    pendingPlans,
    debtPlans,
    netWorthData,
  ] = await Promise.all([
    getIncomeSummary(getRangeDates(incomeRange)),
    getExpenseSummary(getRangeDates(expenseRange)),
    getSavingSummary(getRangeDates(savingRange)),
    getCategoryBreakdown(activeMember.familyId),
    getMemberBreakdown(activeMember.familyId),
    getActivePlans(activeMember.familyId),
    getPendingPlansCount(activeMember.familyId, activeMemberId!),
    getDebtPlansForApproval(activeMember.familyId), // Ambil Rencana Hutang
    getNetWorthData(activeMember.familyId),
  ])

  // HITUNG NOTIFIKASI HUTANG: Hanya hitung yang BUKAN dibuat oleh diri sendiri
  const pendingDebtPlansForMe = debtPlans.filter(
    (dp) => dp.plan.creatorId !== activeMemberId
  )

  // Total notifikasi = Rencana Biasa + Rencana Hutang milik pasangan
  const totalPending = pendingPlans + pendingDebtPlansForMe.length

  return (
    <div className="space-y-3 pb-6">
      
      {/* Greeting */}
      <div className="mb-1">
        <p className="text-sm text-muted-foreground">
          {format(new Date(), 'EEEE, d MMMM yyyy', { locale: idLocale })}
        </p>
        <h1 className="text-xl font-bold flex items-center gap-2">
          <span>Halo, {activeMember.avatar} {activeMember.name}</span>
        </h1>
      </div>

      {/* NET WORTH CARD */}
      <NetWorthCard
        totalCash={netWorthData.totalCash}
        totalAssets={netWorthData.totalAssets}
        totalDebts={netWorthData.totalDebts}
        netWorth={netWorthData.netWorth}
      />

      {/* Alert Rencana Menunggu Persetujuan */}
      {totalPending > 0 && (
        <Link href="/plans">
          <div className="rounded-xl bg-primary/5 border border-primary/20 p-4 flex items-center justify-between hover:bg-primary/10 transition-colors h-[72px]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                <ClipboardList className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-semibold">Rencana Transaksi</p>
                <p className="text-xs text-muted-foreground">
                  {totalPending} transaksi menunggu persetujuan Anda
                </p>
              </div>
            </div>
            <span className="text-primary">→</span>
          </div>
        </Link>
      )}

      {/* Summary Cards */}
      <SummaryCardsWrapper
        income={{ total: incomeSummary.total, breakdown: incomeSummary.breakdown }}
        expense={{ total: expenseSummary.total }}
        saving={{ total: savingSummary.total, breakdown: savingSummary.breakdown }}
      />

      {/* Rekap Rencana Transaksi */}
      <PlanRecapCard plans={activePlans} />

      {/* Progress Alokasi */}
      <div>
        <div className="flex items-center justify-between mb-3 mt-4">
          <h2 className="text-sm font-bold">📊 Progress Anggaran</h2>
          <span className="text-xs text-muted-foreground">
            {format(new Date(), 'MMMM yyyy', { locale: idLocale })}
          </span>
        </div>
        <CategoryProgress data={categoryBreakdown} />
      </div>

      {/* Breakdown per Member */}
      <div>
        <h2 className="text-sm font-bold mb-3 mt-4">👥 Pengeluaran per Anggota</h2>
        <MemberBreakdown data={memberBreakdown} />
      </div>

      {/* Quick link ke Laporan */}
      <div className="mt-4">
        <Link href="/reports">
          <div className="rounded-xl bg-card border p-4 flex items-center justify-between hover:bg-muted/50 transition-colors h-[72px]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                <BarChart3 className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-semibold">Lihat Laporan Lengkap</p>
                <p className="text-xs text-muted-foreground">Grafik pengeluaran & tren</p>
              </div>
            </div>
            <span className="text-muted-foreground">→</span>
          </div>
        </Link>
      </div>
    </div>
  )
}