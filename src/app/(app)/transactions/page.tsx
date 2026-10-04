import { getActiveMemberId } from '@/lib/auth/session'
import { db } from '@/lib/db'
import { members } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { getCategoriesByFamily, getRecentTransactions } from '@/lib/db/queries'
import { TransactionFormSheet } from '@/components/transactions/transaction-form-sheet'
import { TransactionList } from '@/components/transactions/transaction-list'

export default async function TransactionsPage() {
  const activeMemberId = await getActiveMemberId()
  const [activeMember] = await db
    .select()
    .from(members)
    .where(eq(members.id, activeMemberId!))
    .limit(1)

  const [categories, txList] = await Promise.all([
    getCategoriesByFamily(activeMember.familyId),
    getRecentTransactions(activeMember.familyId, 50),
  ])

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Transaksi</h1>
        <p className="text-xs text-muted-foreground">
          {txList.length} transaksi terakhir
        </p>
      </div>

      {txList.length === 0 ? (
        <div className="rounded-xl bg-card border p-12 text-center">
          <div className="text-4xl mb-3">📝</div>
          <p className="font-medium">Belum ada transaksi</p>
          <p className="text-sm text-muted-foreground mt-1">
            Tap tombol + di bawah untuk mencatat
          </p>
        </div>
      ) : (
        <TransactionList transactions={txList as any} categories={categories} />
      )}

      <TransactionFormSheet categories={categories} />
    </div>
  )
}