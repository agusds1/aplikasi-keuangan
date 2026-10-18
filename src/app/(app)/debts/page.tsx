import { getActiveMemberId } from '@/lib/auth/session'
import { db } from '@/lib/db'
import { members } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { getDebtsByFamily, getAccountsByFamily, getDebtPlansByDebt } from '@/lib/db/queries'
import { DebtList } from '@/components/debts/debt-list'
import { formatCurrency } from '@/lib/format'

export default async function DebtsPage() {
  const activeMemberId = await getActiveMemberId()
  const [member] = await db.select().from(members).where(eq(members.id, activeMemberId!)).limit(1)

  const [debts, accounts] = await Promise.all([
    getDebtsByFamily(member.familyId),
    getAccountsByFamily(member.familyId),
  ])

  const debtsWithPlans = await Promise.all(
    debts.map(async (debt) => ({
      ...debt,
      plans: await getDebtPlansByDebt(debt.id)
    }))
  )

  const totalDebt = debts.reduce((sum, d) => sum + parseFloat(d.remainingPrincipal), 0)

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold">💳 Manajemen Hutang</h1>
        <p className="text-xs text-muted-foreground mt-1">
          Sisa Total Hutang: <span className="font-bold text-red-600">{formatCurrency(totalDebt)}</span>
        </p>
      </div>

      <DebtList debts={debtsWithPlans} accounts={accounts} activeMemberId={activeMemberId!} />
    </div>
  )
}