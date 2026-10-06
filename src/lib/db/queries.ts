import { db } from './index'
import { categories, members, transactions } from './schema'
import { transactionPlans } from './schema'
import { and, desc, eq, inArray, ne, or, gte, lte } from 'drizzle-orm'



export async function getCategoriesByFamily(familyId: string) {
  return db
    .select()
    .from(categories)
    .where(eq(categories.familyId, familyId))
    .orderBy(categories.sortOrder)
}

export async function getMembersByFamily(familyId: string) {
  return db
    .select()
    .from(members)
    .where(eq(members.familyId, familyId))
}

export async function getRecentTransactions(familyId: string, limit = 50) {
  return db
    .select({
      id: transactions.id,
      amount: transactions.amount,
      type: transactions.type,
      description: transactions.description,
      date: transactions.date,
      createdAt: transactions.createdAt,
      category: {
        id: categories.id,
        name: categories.name,
        icon: categories.icon,
        color: categories.color,
        type: categories.type,
      },
      member: {
        id: members.id,
        name: members.name,
        avatar: members.avatar,
        color: members.color,
        role: members.role,
      },
    })
    .from(transactions)
    .leftJoin(categories, eq(transactions.categoryId, categories.id))
    .leftJoin(members, eq(transactions.memberId, members.id))
    .where(eq(transactions.familyId, familyId))
    .orderBy(desc(transactions.date), desc(transactions.createdAt))
    .limit(limit)
}

export async function getPlansByFamily(familyId: string) {
  const rows = await db
    .select({
      plan: transactionPlans,
      category: {
        id: categories.id,
        name: categories.name,
        icon: categories.icon,
        color: categories.color,
      },
      creator: {
        id: members.id,
        name: members.name,
        avatar: members.avatar,
        color: members.color,
        role: members.role,
      },
    })
    .from(transactionPlans)
    .leftJoin(categories, eq(transactionPlans.categoryId, categories.id))
    .leftJoin(members, eq(transactionPlans.creatorId, members.id))
    .where(eq(transactionPlans.familyId, familyId))
    .orderBy(desc(transactionPlans.createdAt))

  return rows
}

export async function getPendingPlansCount(
  familyId: string,
  reviewerId: string
) {
  const rows = await db
    .select({ id: transactionPlans.id })
    .from(transactionPlans)
    .where(
      and(
        eq(transactionPlans.familyId, familyId),
        eq(transactionPlans.reviewerId, reviewerId),
        eq(transactionPlans.status, 'PENDING')
      )
    )

  return rows.length
}

export async function getUpcomingPlans(
  familyId: string,
  memberId: string,
  daysAhead = 2
) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const future = new Date(today)
  future.setDate(future.getDate() + daysAhead)
  future.setHours(23, 59, 59, 999)

  const rows = await db
    .select({
      plan: transactionPlans,
      category: {
        id: categories.id,
        name: categories.name,
        icon: categories.icon,
        color: categories.color,
      },
    })
    .from(transactionPlans)
    .leftJoin(categories, eq(transactionPlans.categoryId, categories.id))
    .where(
      and(
        eq(transactionPlans.familyId, familyId),
        gte(transactionPlans.plannedDate, today),
        lte(transactionPlans.plannedDate, future),
        or(
          and(
            eq(transactionPlans.status, 'PENDING'),
            eq(transactionPlans.reviewerId, memberId)
          ),
          and(
            eq(transactionPlans.status, 'APPROVED'),
            eq(transactionPlans.creatorId, memberId)
          )
        )
      )
    )
    .orderBy(transactionPlans.plannedDate)

  return rows
}

export async function getPlanRecapByMonth(
  familyId: string,
  date = new Date()
) {
  const start = new Date(date.getFullYear(), date.getMonth(), 1)
  const end = new Date(
    date.getFullYear(),
    date.getMonth() + 1,
    0,
    23,
    59,
    59
  )

  const rows = await db
    .select({
      planId: transactionPlans.id,
      amount: transactionPlans.amount,
      type: transactionPlans.type,
      status: transactionPlans.status,
      plannedDate: transactionPlans.plannedDate,
      categoryId: categories.id,
      categoryName: categories.name,
      categoryIcon: categories.icon,
      categoryColor: categories.color,
      categoryType: categories.type,
    })
    .from(transactionPlans)
    .leftJoin(categories, eq(transactionPlans.categoryId, categories.id))
    .where(
      and(
        eq(transactionPlans.familyId, familyId),
        gte(transactionPlans.plannedDate, start),
        lte(transactionPlans.plannedDate, end),
        // Hanya yang belum dieksekusi
        ne(transactionPlans.status, 'EXECUTED')
      )
    )
    .orderBy(desc(transactionPlans.plannedDate))

  return rows
}

export async function getActivePlans(familyId: string) {
  const rows = await db
    .select({
      planId: transactionPlans.id,
      amount: transactionPlans.amount,
      type: transactionPlans.type,
      status: transactionPlans.status,
      plannedDate: transactionPlans.plannedDate,
      categoryId: categories.id,
      categoryName: categories.name,
      categoryIcon: categories.icon,
      categoryColor: categories.color,
      categoryType: categories.type,
    })
    .from(transactionPlans)
    .leftJoin(categories, eq(transactionPlans.categoryId, categories.id))
    .where(
      and(
        eq(transactionPlans.familyId, familyId),
        ne(transactionPlans.status, 'EXECUTED')
      )
    )
    .orderBy(desc(transactionPlans.plannedDate))

  return rows
}