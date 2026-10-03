import { db } from './index'
import { categories, members, transactions } from './schema'
import { and, desc, eq } from 'drizzle-orm'

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