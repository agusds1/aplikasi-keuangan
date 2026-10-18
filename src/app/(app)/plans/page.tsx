import { getActiveMemberId } from '@/lib/auth/session'
import { db } from '@/lib/db'
import { members } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { getCategoriesByFamily, getPlansByFamily, getDebtPlansForApproval } from '@/lib/db/queries'
import { PlanFormSheet } from '@/components/plans/plan-form-sheet'
import { PlanList } from '@/components/plans/plan-list'
import { PlanCalendar } from '@/components/plans/plan-calendar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { formatCurrency } from '@/lib/format'

// Helper untuk memformat hutang agar sesuai dengan komponen PlanCard
function formatDebtPlansForUI(debtPlans: any[], activeMemberId: string) {
  return debtPlans.map((dp) => ({
    plan: {
      id: dp.plan.id,
      amount: (Number(dp.plan.principalPaid) + Number(dp.plan.interestPaid)).toString(),
      type: 'EXPENSE',
      description: `Pelunasan ke-${dp.plan.installmentNumber}: ${dp.debtName}`,
      plannedDate: dp.plan.plannedDate,
      status: dp.plan.status,
      creatorId: dp.plan.creatorId, 
      reviewerId: '', // <-- KOSONGKAN KEMBALI
      createdAt: dp.plan.createdAt,
      reviewNote: dp.plan.reviewNote,
    },
    category: { id: 'debt-category', name: 'Bayar Hutang', icon: '💳', color: '#ef4444' },
    creator: { id: dp.plan.creatorId, name: dp.creator.name, avatar: dp.creator.avatar, color: '#3b82f6', role: 'MEMBER' },
    isDebtPlan: true,
  }))
}

export default async function PlansPage() {
  const activeMemberId = await getActiveMemberId()
  const [activeMember] = await db
    .select()
    .from(members)
    .where(eq(members.id, activeMemberId!))
    .limit(1)

  const [categories, plans, debtPlans] = await Promise.all([
    getCategoriesByFamily(activeMember.familyId),
    getPlansByFamily(activeMember.familyId),
    getDebtPlansForApproval(activeMember.familyId),
  ])

  const formattedDebtPlans = formatDebtPlansForUI(debtPlans, activeMemberId!)

  // Gabungkan rencana biasa dan rencana hutang
  const allPlans = [...plans, ...formattedDebtPlans]

  // Filter (sama seperti sebelumnya)
  const now = new Date()
  now.setHours(0, 0, 0, 0)

  const needReview = allPlans.filter((p) => {
    if ((p as any).isDebtPlan && p.plan.status === 'PENDING') {
      return p.plan.creatorId !== activeMemberId 
    }
    return p.plan.reviewerId === activeMemberId && p.plan.status === 'PENDING'
  })
  const needRevision = allPlans.filter(
    (p) => p.plan.creatorId === activeMemberId && p.plan.status === 'REVISION'
  )
  const allApproved = allPlans.filter(
    (p) => p.plan.creatorId === activeMemberId && p.plan.status === 'APPROVED'
  )
  const executableNow = allApproved.filter((p) => {
    const planDate = new Date(p.plan.plannedDate)
    planDate.setHours(0, 0, 0, 0)
    return planDate <= now
  })
  const upcomingExecutable = allApproved.filter((p) => {
    const planDate = new Date(p.plan.plannedDate)
    planDate.setHours(0, 0, 0, 0)
    return planDate > now
  })
  const waiting = allPlans.filter(
    (p) => p.plan.creatorId === activeMemberId && p.plan.status === 'PENDING'
  )
  const history = allPlans.filter((p) =>
    ['EXECUTED', 'REJECTED', 'PAID'].includes(p.plan.status)
  )

  const totalAction = needReview.length + needRevision.length + executableNow.length + upcomingExecutable.length

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold">📋 Rencana Transaksi</h1>
        <p className="text-xs text-muted-foreground">
          Rencanakan dulu, eksekusi setelah disetujui pasangan
        </p>
      </div>

      <Tabs defaultValue="need-action" className="w-full">
        <TabsList className="grid w-full grid-cols-4 h-auto p-1">
          <TabsTrigger value="need-action" className="flex flex-col gap-0.5 py-2 text-[10px]">
            <span className="text-base">⚡</span>
            <span className="flex items-center gap-1">
              Aksi
              {totalAction > 0 && (
                <span className="text-[8px] bg-primary text-primary-foreground rounded-full w-4 h-4 flex items-center justify-center">
                  {totalAction}
                </span>
              )}
            </span>
          </TabsTrigger>
          <TabsTrigger value="waiting" className="flex flex-col gap-0.5 py-2 text-[10px]">
            <span className="text-base">⏳</span>
            <span className="flex items-center gap-1">
              Tunggu
              {waiting.length > 0 && (
                <span className="text-[8px] bg-muted rounded-full w-4 h-4 flex items-center justify-center">
                  {waiting.length}
                </span>
              )}
            </span>
          </TabsTrigger>
          <TabsTrigger value="calendar" className="flex flex-col gap-0.5 py-2 text-[10px]">
            <span className="text-base">📅</span>
            <span>Kalender</span>
          </TabsTrigger>
          <TabsTrigger value="history" className="flex flex-col gap-0.5 py-2 text-[10px]">
            <span className="text-base">📜</span>
            <span>Riwayat</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="need-action" className="mt-4 space-y-4">
          {totalAction === 0 ? (
            <div className="rounded-xl bg-card border p-12 text-center">
              <div className="text-4xl mb-3">✨</div>
              <p className="font-medium">Tidak ada yang perlu diaksi</p>
            </div>
          ) : (
            <>
              {needRevision.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold mb-2">✏️ Perlu direvisi</h3>
                  <PlanList plans={needRevision} activeMemberId={activeMemberId!} categories={categories} />
                </div>
              )}
              {needReview.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold mb-2">🔍 Perlu di-review</h3>
                  <PlanList plans={needReview} activeMemberId={activeMemberId!} categories={categories} />
                </div>
              )}
              {executableNow.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
                    🔔 Siap Dieksekusi
                    <Badge className="text-[10px] bg-green-600 text-white">{executableNow.length}</Badge>
                  </h3>
                  <PlanList plans={executableNow} activeMemberId={activeMemberId!} categories={categories} />
                </div>
              )}
              {upcomingExecutable.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
                    📅 Akan Datang
                    <Badge variant="secondary" className="text-[10px]">{upcomingExecutable.length}</Badge>
                  </h3>
                  <PlanList plans={upcomingExecutable} activeMemberId={activeMemberId!} categories={categories} />
                </div>
              )}
            </>
          )}
        </TabsContent>

        <TabsContent value="waiting" className="mt-4">
          {waiting.length === 0 ? (
            <div className="rounded-xl bg-card border p-12 text-center">
              <p className="text-sm text-muted-foreground">Tidak ada yang menunggu</p>
            </div>
          ) : (
            <PlanList plans={waiting} activeMemberId={activeMemberId!} categories={categories} />
          )}
        </TabsContent>

        <TabsContent value="calendar" className="mt-4">
          <PlanCalendar plans={allPlans.map((p) => ({ ...p.plan, category: p.category, creator: p.creator }))} />
        </TabsContent>

        <TabsContent value="history" className="mt-4">
          {history.length === 0 ? (
            <div className="rounded-xl bg-card border p-12 text-center">
              <p className="text-sm text-muted-foreground">Belum ada riwayat</p>
            </div>
          ) : (
            <PlanList plans={history} activeMemberId={activeMemberId!} categories={categories} />
          )}
        </TabsContent>
      </Tabs>

      <PlanFormSheet categories={categories} />
    </div>
  )
}