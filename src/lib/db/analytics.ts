import { db } from './index'
import { transactions, categories, members, allocations } from './schema'
import { and, eq, gte, lte, sql, desc, sum } from 'drizzle-orm'

// Helper: dapatkan rentang bulan
export function getMonthRange(date = new Date()) {
  const start = new Date(date.getFullYear(), date.getMonth(), 1)
  const end = new Date(
    date.getFullYear(),
    date.getMonth() + 1,
    0,
    23,
    59,
    59
  )
  return { start, end }
}

// Format period YYYY-MM
export function getPeriod(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

// 1. Summary total bulan ini
export async function getMonthlySummary(familyId: string, date = new Date()) {
  const { start, end } = getMonthRange(date)

  const result = await db
    .select({
      type: transactions.type,
      total: sum(transactions.amount),
    })
    .from(transactions)
    .where(
      and(
        eq(transactions.familyId, familyId),
        gte(transactions.date, start),
        lte(transactions.date, end)
      )
    )
    .groupBy(transactions.type)

  const summary = {
    income: 0,
    expense: 0,
    transfer: 0,
  }

  for (const row of result) {
    const amount = parseFloat(row.total ?? '0')
    if (row.type === 'INCOME') summary.income = amount
    if (row.type === 'EXPENSE') summary.expense = amount
    if (row.type === 'TRANSFER') summary.transfer = amount
  }

  return summary
}

// 2. Breakdown per kategori (untuk progress alokasi)
export async function getCategoryBreakdown(
  familyId: string,
  date = new Date()
) {
  const { start, end } = getMonthRange(date)
  const period = getPeriod(date)

  const result = await db
    .select({
      categoryId: categories.id,
      categoryName: categories.name,
      categoryIcon: categories.icon,
      categoryColor: categories.color,
      categoryType: categories.type,
      planned: allocations.plannedAmount,
      actual: sql<string>`COALESCE(SUM(${transactions.amount}), 0)`.as(
        'actual'
      ),
    })
    .from(categories)
    .leftJoin(
      allocations,
      and(
        eq(allocations.categoryId, categories.id),
        eq(allocations.period, period)
      )
    )
    .leftJoin(
      transactions,
      and(
        eq(transactions.categoryId, categories.id),
        gte(transactions.date, start),
        lte(transactions.date, end)
      )
    )
    .where(eq(categories.familyId, familyId))
    .groupBy(
      categories.id,
      categories.name,
      categories.icon,
      categories.color,
      categories.type,
      allocations.plannedAmount
    )
    .orderBy(categories.sortOrder)

  return result.map((r) => ({
    ...r,
    planned: parseFloat(r.planned ?? '0'),
    actual: parseFloat(r.actual ?? '0'),
    percentage:
      r.planned && parseFloat(r.planned) > 0
        ? (parseFloat(r.actual ?? '0') / parseFloat(r.planned)) * 100
        : 0,
  }))
}

// 3. Breakdown per member (siapa pengeluaran berapa)
export async function getMemberBreakdown(
  familyId: string,
  date = new Date()
) {
  const { start, end } = getMonthRange(date)

  const result = await db
    .select({
      memberId: members.id,
      memberName: members.name,
      memberAvatar: members.avatar,
      memberColor: members.color,
      total: sql<string>`COALESCE(SUM(${transactions.amount}), 0)`.as('total'),
    })
    .from(members)
    .leftJoin(
      transactions,
      and(
        eq(transactions.memberId, members.id),
        eq(transactions.type, 'EXPENSE'),
        gte(transactions.date, start),
        lte(transactions.date, end)
      )
    )
    .where(eq(members.familyId, familyId))
    .groupBy(members.id, members.name, members.avatar, members.color)
    .orderBy(desc(sql`total`))

  return result.map((r) => ({
    ...r,
    total: parseFloat(r.total ?? '0'),
  }))
}

// 4. Ambil alokasi yang sudah ada untuk period tertentu
export async function getAllocationsByPeriod(
  familyId: string,
  period: string
) {
  const result = await db
    .select({
      categoryId: allocations.categoryId,
      plannedAmount: allocations.plannedAmount,
    })
    .from(allocations)
    .innerJoin(categories, eq(allocations.categoryId, categories.id))
    .where(
      and(eq(categories.familyId, familyId), eq(allocations.period, period))
    )

  return result.reduce<Record<string, number>>((acc, row) => {
    acc[row.categoryId] = parseFloat(row.plannedAmount)
    return acc
  }, {})
}

// 5. Pengeluaran per kategori (untuk pie chart)
export async function getExpenseByCategory(
  familyId: string,
  date = new Date()
) {
  const { start, end } = getMonthRange(date)

  const result = await db
    .select({
      categoryId: categories.id,
      categoryName: categories.name,
      categoryIcon: categories.icon,
      categoryColor: categories.color,
      total: sql<string>`COALESCE(SUM(${transactions.amount}), 0)`.as('total'),
    })
    .from(transactions)
    .innerJoin(categories, eq(transactions.categoryId, categories.id))
    .where(
      and(
        eq(transactions.familyId, familyId),
        eq(transactions.type, 'EXPENSE'),
        gte(transactions.date, start),
        lte(transactions.date, end)
      )
    )
    .groupBy(
      categories.id,
      categories.name,
      categories.icon,
      categories.color
    )
    .orderBy(desc(sql`total`))

  return result.map((r) => ({
    ...r,
    total: parseFloat(r.total ?? '0'),
  }))
}

// 6. Tren 6 bulan terakhir
export async function getMonthlyTrend(familyId: string, months = 6) {
  const now = new Date()
  const results: {
    period: string
    label: string
    income: number
    expense: number
  }[] = []

  for (let i = months - 1; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const { start, end } = getMonthRange(date)

    const rows = await db
      .select({
        type: transactions.type,
        total: sum(transactions.amount),
      })
      .from(transactions)
      .where(
        and(
          eq(transactions.familyId, familyId),
          gte(transactions.date, start),
          lte(transactions.date, end)
        )
      )
      .groupBy(transactions.type)

    const income =
      parseFloat(
        rows.find((r) => r.type === 'INCOME')?.total ?? '0'
      ) || 0
    const expense =
      parseFloat(
        rows.find((r) => r.type === 'EXPENSE')?.total ?? '0'
      ) || 0

    results.push({
      period: getPeriod(date),
      label: date.toLocaleDateString('id-ID', { month: 'short' }),
      income,
      expense,
    })
  }

  return results
}