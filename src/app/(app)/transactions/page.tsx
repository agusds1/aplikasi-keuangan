import { getActiveMemberId } from '@/lib/auth/session'
import { db } from '@/lib/db'
import { members } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { getCategoriesByFamily, getRecentTransactions } from '@/lib/db/queries'
import { TransactionFormSheet } from '@/components/transactions/transaction-form-sheet'
import { MemberBadge } from '@/components/shared/member-badge'
import { format } from 'date-fns'
import { id as idLocale } from 'date-fns/locale'

function formatCurrency(amount: string | number) {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(num)
}

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
        <div className="space-y-2">
          {txList.map((tx) => (
            <div
              key={tx.id}
              className="rounded-xl bg-card border p-3 flex items-start gap-3"
            >
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center text-xl shrink-0"
                style={{ backgroundColor: `${tx.category?.color}20` }}
              >
                {tx.category?.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-sm truncate">
                      {tx.description || tx.category?.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {tx.category?.name}
                    </p>
                  </div>
                  <p
                    className={`font-semibold text-sm whitespace-nowrap ${
                      tx.type === 'INCOME'
                        ? 'text-green-600'
                        : 'text-red-600'
                    }`}
                  >
                    {tx.type === 'INCOME' ? '+' : '-'}
                    {formatCurrency(tx.amount)}
                  </p>
                </div>
                <div className="flex items-center gap-2 mt-1.5">
                  {tx.member && (
                    <MemberBadge
                      name={tx.member.name}
                      avatar={tx.member.avatar}
                      color={tx.member.color}
                      size="sm"
                    />
                  )}
                  <span className="text-[10px] text-muted-foreground">
                    ·{' '}
                    {format(new Date(tx.date), 'd MMM yyyy', {
                      locale: idLocale,
                    })}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <TransactionFormSheet categories={categories} />
    </div>
  )
}