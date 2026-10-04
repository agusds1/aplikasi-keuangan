'use server'

import { revalidatePath } from 'next/cache'
import { db } from '@/lib/db'
import { transactions, members } from '@/lib/db/schema'
import { getActiveMemberId, getCurrentUser } from '@/lib/auth/session'
import { eq, and } from 'drizzle-orm'
import { z } from 'zod'

const transactionSchema = z.object({
  categoryId: z.string().uuid(),
  type: z.enum(['INCOME', 'EXPENSE', 'TRANSFER']),
  amount: z.coerce.number().positive('Nominal harus lebih dari 0'),
  description: z.string().optional(),
  date: z.string(),
})

export async function createTransactionAction(input: {
  categoryId: string
  type: 'INCOME' | 'EXPENSE' | 'TRANSFER'
  amount: number
  description?: string
  date: string
}) {
  const user = await getCurrentUser()
  if (!user) return { error: 'Tidak ada session' }

  const memberId = await getActiveMemberId()
  if (!memberId) return { error: 'Tidak ada profil aktif' }

  const [member] = await db
    .select()
    .from(members)
    .where(eq(members.id, memberId))
    .limit(1)

  if (!member) return { error: 'Member tidak ditemukan' }

  const parsed = transactionSchema.safeParse(input)
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message }
  }

  try {
    await db.insert(transactions).values({
      familyId: member.familyId,
      categoryId: parsed.data.categoryId,
      memberId: member.id,
      amount: parsed.data.amount.toString(),
      type: parsed.data.type,
      description: parsed.data.description || null,
      date: new Date(parsed.data.date),
    })

    revalidatePath('/transactions')
    revalidatePath('/dashboard')
    return { success: true }
  } catch (err) {
    console.error(err)
    return { error: 'Gagal menyimpan transaksi' }
  }
}

export async function updateTransactionAction(
  transactionId: string,
  input: {
    categoryId: string
    type: 'INCOME' | 'EXPENSE' | 'TRANSFER'
    amount: number
    description?: string
    date: string
  }
) {
  const memberId = await getActiveMemberId()
  if (!memberId) return { error: 'Tidak ada profil aktif' }

  const [member] = await db
    .select()
    .from(members)
    .where(eq(members.id, memberId))
    .limit(1)

  if (!member) return { error: 'Member tidak ditemukan' }

  const parsed = transactionSchema.safeParse(input)
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message }
  }

  try {
    await db
      .update(transactions)
      .set({
        categoryId: parsed.data.categoryId,
        type: parsed.data.type,
        amount: parsed.data.amount.toString(),
        description: parsed.data.description || null,
        date: new Date(parsed.data.date),
      })
      .where(
        and(
          eq(transactions.id, transactionId),
          eq(transactions.familyId, member.familyId)
        )
      )

    revalidatePath('/transactions')
    revalidatePath('/dashboard')
    revalidatePath('/reports')
    return { success: true }
  } catch (err) {
    console.error(err)
    return { error: 'Gagal mengubah transaksi' }
  }
}

export async function deleteTransactionAction(transactionId: string) {
  const memberId = await getActiveMemberId()
  if (!memberId) return { error: 'Tidak ada profil aktif' }

  const [member] = await db
    .select()
    .from(members)
    .where(eq(members.id, memberId))
    .limit(1)

  if (!member) return { error: 'Member tidak ditemukan' }

  try {
    await db
      .delete(transactions)
      .where(
        and(
          eq(transactions.id, transactionId),
          eq(transactions.familyId, member.familyId)
        )
      )

    revalidatePath('/transactions')
    revalidatePath('/dashboard')
    revalidatePath('/reports')
    return { success: true }
  } catch (err) {
    console.error(err)
    return { error: 'Gagal menghapus transaksi' }
  }
}