'use server'

import { revalidatePath } from 'next/cache'
import { db } from '@/lib/db'
import { transactions, members, accounts } from '@/lib/db/schema'
import { getActiveMemberId, getCurrentUser } from '@/lib/auth/session'
import { eq, and, sql } from 'drizzle-orm'
import { z } from 'zod'

const transactionSchema = z.object({
  categoryId: z.string().uuid(),
  accountId: z.string().uuid(),
  type: z.enum(['INCOME', 'EXPENSE', 'TRANSFER', 'LOAN_RECEIVE', 'ASSET_SALE']),
  amount: z.coerce.number().positive('Nominal harus lebih dari 0'),
  description: z.string().optional(),
  date: z.string(),
})

export async function createTransactionAction(input: {
  categoryId: string
  accountId: string
  type: 'INCOME' | 'EXPENSE' | 'TRANSFER' | 'LOAN_RECEIVE' | 'ASSET_SALE'
  amount: number
  description?: string
  date: string
}) {
  const user = await getCurrentUser()
  if (!user) return { error: 'Tidak ada session' }

  const memberId = await getActiveMemberId()
  if (!memberId) return { error: 'Tidak ada profil aktif' }

  const [member] = await db.select().from(members).where(eq(members.id, memberId)).limit(1)
  if (!member) return { error: 'Member tidak ditemukan' }

  const parsed = transactionSchema.safeParse(input)
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  try {
    // 1. Simpan Transaksi
    await db.insert(transactions).values({
      familyId: member.familyId,
      categoryId: parsed.data.categoryId,
      accountId: parsed.data.accountId,
      memberId: member.id,
      amount: Math.round(parsed.data.amount).toString(),
      type: parsed.data.type,
      description: parsed.data.description || null,
      date: new Date(parsed.data.date),
    })

    // 2. Update Saldo Dompet
    const isIncome = ['INCOME', 'LOAN_RECEIVE', 'ASSET_SALE'].includes(parsed.data.type)
    const balanceChange = isIncome 
      ? sql`${accounts.currentBalance} + ${parsed.data.amount}`
      : sql`${accounts.currentBalance} - ${parsed.data.amount}`

    await db.update(accounts)
      .set({ currentBalance: balanceChange })
      .where(eq(accounts.id, parsed.data.accountId))

    revalidatePath('/transactions')
    revalidatePath('/dashboard')
    revalidatePath('/accounts')
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
    accountId: string
    type: 'INCOME' | 'EXPENSE' | 'TRANSFER' | 'LOAN_RECEIVE' | 'ASSET_SALE'
    amount: number
    description?: string
    date: string
  }
) {
  const memberId = await getActiveMemberId()
  if (!memberId) return { error: 'Tidak ada profil aktif' }

  const [member] = await db.select().from(members).where(eq(members.id, memberId)).limit(1)
  if (!member) return { error: 'Member tidak ditemukan' }

  const parsed = transactionSchema.safeParse(input)
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  try {
    const [oldTx] = await db.select().from(transactions).where(eq(transactions.id, transactionId)).limit(1)
    if (!oldTx) return { error: 'Transaksi tidak ditemukan' }

    // 1. Kembalikan saldo dompet lama
    const oldIsIncome = ['INCOME', 'LOAN_RECEIVE', 'ASSET_SALE'].includes(oldTx.type)
    const revertChange = oldIsIncome 
      ? sql`${accounts.currentBalance} - ${oldTx.amount}`
      : sql`${accounts.currentBalance} + ${oldTx.amount}`
    
    await db.update(accounts).set({ currentBalance: revertChange }).where(eq(accounts.id, oldTx.accountId!))

    // 2. Update Transaksi
    await db.update(transactions).set({
      categoryId: parsed.data.categoryId,
      accountId: parsed.data.accountId,
      type: parsed.data.type,
      amount: Math.round(parsed.data.amount).toString(),
      description: parsed.data.description || null,
      date: new Date(parsed.data.date),
    }).where(eq(transactions.id, transactionId))

    // 3. Terapkan saldo dompet baru
    const newIsIncome = ['INCOME', 'LOAN_RECEIVE', 'ASSET_SALE'].includes(parsed.data.type)
    const applyChange = newIsIncome
      ? sql`${accounts.currentBalance} + ${parsed.data.amount}`
      : sql`${accounts.currentBalance} - ${parsed.data.amount}`

    await db.update(accounts).set({ currentBalance: applyChange }).where(eq(accounts.id, parsed.data.accountId))

    revalidatePath('/transactions')
    revalidatePath('/dashboard')
    revalidatePath('/accounts')
    return { success: true }
  } catch (err) {
    console.error(err)
    return { error: 'Gagal mengubah transaksi' }
  }
}

export async function deleteTransactionAction(transactionId: string) {
  const memberId = await getActiveMemberId()
  if (!memberId) return { error: 'Tidak ada profil aktif' }

  const [member] = await db.select().from(members).where(eq(members.id, memberId)).limit(1)
  if (!member) return { error: 'Member tidak ditemukan' }

  try {
    const [oldTx] = await db.select().from(transactions).where(eq(transactions.id, transactionId)).limit(1)
    if (oldTx && oldTx.accountId) {
      // Kembalikan saldo dompet
      const oldIsIncome = ['INCOME', 'LOAN_RECEIVE', 'ASSET_SALE'].includes(oldTx.type)
      const revertChange = oldIsIncome 
        ? sql`${accounts.currentBalance} - ${oldTx.amount}`
        : sql`${accounts.currentBalance} + ${oldTx.amount}`
      
      await db.update(accounts).set({ currentBalance: revertChange }).where(eq(accounts.id, oldTx.accountId))
    }

    await db.delete(transactions).where(eq(transactions.id, transactionId))

    revalidatePath('/transactions')
    revalidatePath('/dashboard')
    revalidatePath('/accounts')
    return { success: true }
  } catch (err) {
    console.error(err)
    return { error: 'Gagal menghapus transaksi' }
  }
}