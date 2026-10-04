import { getActiveMemberId } from '@/lib/auth/session'
import { db } from '@/lib/db'
import { members } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { getCategoriesByFamily, getPlansByFamily } from '@/lib/db/queries'
import { PlanFormSheet } from '@/components/plans/plan-form-sheet'
import { PlanList } from '@/components/plans/plan-list'
import { PlanCalendar } from '@/components/plans/plan-calendar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'

export default async function PlansPage() {
  const activeMemberId = await getActiveMemberId()
  const [activeMember] = await db
    .select()
    .from(members)
    .where(eq(members.id, activeMemberId!))
    .limit(1)

  const [categories, plans] = await Promise.all([
    getCategoriesByFamily(activeMember.familyId),
    getPlansByFamily(activeMember.familyId),
  ])

  // ===== Filter =====
  const now = new Date()
  now.setHours(0, 0, 0, 0)

  // Perlu di-review (reviewer = active member, status PENDING)
  const needReview = plans.filter(
    (p) => p.plan.reviewerId === activeMemberId && p.plan.status === 'PENDING'
  )

  // Perlu direvisi & kirim ulang (creator = active member, status REVISION)
  const needRevision = plans.filter(
    (p) =>
      p.plan.creatorId === activeMemberId && p.plan.status === 'REVISION'
  )

  // Semua APPROVED yang creator-nya active member
  const allApproved = plans.filter(
    (p) => p.plan.creatorId === activeMemberId && p.plan.status === 'APPROVED'
  )

  // Siap dieksekusi (tanggal sudah tiba atau lewat)
  const executableNow = allApproved.filter((p) => {
    const planDate = new Date(p.plan.plannedDate)
    planDate.setHours(0, 0, 0, 0)
    return planDate <= now
  })

  // Akan datang (tanggal belum tiba)
  const upcomingExecutable = allApproved.filter((p) => {
    const planDate = new Date(p.plan.plannedDate)
    planDate.setHours(0, 0, 0, 0)
    return planDate > now
  })

  // Menunggu (creator = active member, status PENDING)
  const waiting = plans.filter(
    (p) => p.plan.creatorId === activeMemberId && p.plan.status === 'PENDING'
  )

  // Riwayat (EXECUTED atau REJECTED)
  const history = plans.filter((p) =>
    ['EXECUTED', 'REJECTED'].includes(p.plan.status)
  )

  const totalAction =
    needReview.length +
    needRevision.length +
    executableNow.length +
    upcomingExecutable.length

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
          <TabsTrigger
            value="need-action"
            className="flex flex-col gap-0.5 py-2 text-[10px]"
          >
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
          <TabsTrigger
            value="waiting"
            className="flex flex-col gap-0.5 py-2 text-[10px]"
          >
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
          <TabsTrigger
            value="calendar"
            className="flex flex-col gap-0.5 py-2 text-[10px]"
          >
            <span className="text-base">📅</span>
            <span>Kalender</span>
          </TabsTrigger>
          <TabsTrigger
            value="history"
            className="flex flex-col gap-0.5 py-2 text-[10px]"
          >
            <span className="text-base">📜</span>
            <span>Riwayat</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="need-action" className="mt-4 space-y-4">
          {totalAction === 0 ? (
            <div className="rounded-xl bg-card border p-12 text-center">
              <div className="text-4xl mb-3">✨</div>
              <p className="font-medium">Tidak ada yang perlu diaksi</p>
              <p className="text-sm text-muted-foreground mt-1">
                Semua rencana sudah ditangani
              </p>
            </div>
          ) : (
            <>
              {needRevision.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold mb-2">
                    ✏️ Perlu direvisi & kirim ulang
                  </h3>
                  <PlanList
                    plans={needRevision}
                    activeMemberId={activeMemberId!}
                    categories={categories}
                  />
                </div>
              )}

              {needReview.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold mb-2">
                    🔍 Perlu di-review
                  </h3>
                  <PlanList
                    plans={needReview}
                    activeMemberId={activeMemberId!}
                    categories={categories}
                  />
                </div>
              )}

              {executableNow.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
                    🔔 Siap Dieksekusi
                    <Badge className="text-[10px] bg-green-600 text-white">
                      {executableNow.length}
                    </Badge>
                  </h3>
                  <PlanList
                    plans={executableNow}
                    activeMemberId={activeMemberId!}
                    categories={categories}
                  />
                </div>
              )}

              {upcomingExecutable.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
                    📅 Akan Datang
                    <Badge variant="secondary" className="text-[10px]">
                      {upcomingExecutable.length}
                    </Badge>
                  </h3>
                  <PlanList
                    plans={upcomingExecutable}
                    activeMemberId={activeMemberId!}
                    categories={categories}
                  />
                </div>
              )}
            </>
          )}
        </TabsContent>

        <TabsContent value="waiting" className="mt-4">
          {waiting.length === 0 ? (
            <div className="rounded-xl bg-card border p-12 text-center">
              <div className="text-4xl mb-3">⏳</div>
              <p className="font-medium">Tidak ada yang menunggu</p>
              <p className="text-sm text-muted-foreground mt-1">
                Buat rencana baru untuk di-review pasangan
              </p>
            </div>
          ) : (
            <PlanList
              plans={waiting}
              activeMemberId={activeMemberId!}
              categories={categories}
            />
          )}
        </TabsContent>

        <TabsContent value="calendar" className="mt-4">
          <PlanCalendar
            plans={plans.map((row) => ({
              ...row.plan,
              category: row.category,
              creator: row.creator,
            }))}
          />
        </TabsContent>

        <TabsContent value="history" className="mt-4">
          {history.length === 0 ? (
            <div className="rounded-xl bg-card border p-12 text-center">
              <div className="text-4xl mb-3">📜</div>
              <p className="font-medium">Belum ada riwayat</p>
            </div>
          ) : (
            <PlanList
              plans={history}
              activeMemberId={activeMemberId!}
              categories={categories}
            />
          )}
        </TabsContent>
      </Tabs>

      <PlanFormSheet categories={categories} />
    </div>
  )
}