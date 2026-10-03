import { getActiveMemberId } from '@/lib/auth/session'
import { db } from '@/lib/db'
import { members } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import {
  getExpenseByCategory,
  getMemberBreakdown,
  getMonthlyTrend,
  getMonthlySummary,
} from '@/lib/db/analytics'
import { ExpensePieChart } from '@/components/reports/expense-pie-chart'
import { MemberBarChart } from '@/components/reports/member-bar-chart'
import { TrendLineChart } from '@/components/reports/trend-line-chart'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { format } from 'date-fns'
import { id as idLocale } from 'date-fns/locale'
import { formatCurrency } from '@/lib/format'

export default async function ReportsPage() {
  const activeMemberId = await getActiveMemberId()
  const [activeMember] = await db
    .select()
    .from(members)
    .where(eq(members.id, activeMemberId!))
    .limit(1)

  const [categoryData, memberData, trendData, summary] = await Promise.all([
    getExpenseByCategory(activeMember.familyId),
    getMemberBreakdown(activeMember.familyId),
    getMonthlyTrend(activeMember.familyId, 6),
    getMonthlySummary(activeMember.familyId),
  ])

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold">📊 Laporan</h1>
        <p className="text-xs text-muted-foreground capitalize">
          {format(new Date(), 'MMMM yyyy', { locale: idLocale })}
        </p>
      </div>

      {/* Pie Chart */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">
            🍰 Pengeluaran per Kategori
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ExpensePieChart data={categoryData} />
        </CardContent>
      </Card>

      {/* Bar Chart Member */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">
            👥 Pengeluaran per Anggota
          </CardTitle>
        </CardHeader>
        <CardContent>
          <MemberBarChart data={memberData} />
        </CardContent>
      </Card>

      {/* Trend Line Chart */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">
            📈 Tren 6 Bulan Terakhir
          </CardTitle>
        </CardHeader>
        <CardContent>
          <TrendLineChart data={trendData} />
        </CardContent>
      </Card>

      {/* Summary Bulan Ini */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">💼 Ringkasan Bulan Ini</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Pemasukan</span>
            <span className="font-semibold text-green-600">
              {formatCurrency(summary.income)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Pengeluaran</span>
            <span className="font-semibold text-red-600">
              {formatCurrency(summary.expense)}
            </span>
          </div>
          <div className="border-t pt-2 flex justify-between">
            <span className="font-medium">Selisih</span>
            <span
              className={`font-bold ${
                summary.income - summary.expense >= 0
                  ? 'text-green-600'
                  : 'text-red-600'
              }`}
            >
              {formatCurrency(summary.income - summary.expense)}
            </span>
          </div>
          {summary.income > 0 && (
            <div className="flex justify-between text-xs text-muted-foreground pt-1">
              <span>Rasio tabungan</span>
              <span>
                {(
                  ((summary.income - summary.expense) / summary.income) *
                  100
                ).toFixed(1)}
                %
              </span>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}