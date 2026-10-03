'use server'

import { revalidatePath } from 'next/cache'
import { db } from '@/lib/db'
import { transactions, members } from '@/lib/db/schema'
import { getActiveMemberId, getCurrentUser } from '@/lib/auth/session'
import { eq } from 'drizzle-orm'
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