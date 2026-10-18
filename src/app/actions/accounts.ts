'use server'

import { revalidatePath } from 'next/cache'
import { db } from '@/lib/db'
import { accounts, members, transactions } from '@/lib/db/schema'
import { getActiveMemberId } from '@/lib/auth/session'
import { eq, and } from 'drizzle-orm'
import { z } from 'zod'

const accountSchema = z.object({
  name: z.string().min(1, 'Nama dompet wajib diisi'),
  type: z.enum(['CASH', 'BANK', 'EWALLET']),
  initialBalance: z.coerce.number().min(0),
})

export async function createAccountAction(input: {
  name: string
  type: 'CASH' | 'BANK' | 'EWALLET'
  initialBalance: number
}) {
  const memberId = await getActiveMemberId()
  if (!memberId) return { error: 'Tidak ada profil aktif' }

  const [member] = await db.select().from(members).where(eq(members.id, memberId)).limit(1)
  if (!member) return { error: 'Member tidak ditemukan' }

  const parsed = accountSchema.safeParse(input)
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  try {
    await db.insert(accounts).values({
      familyId: member.familyId,
      name: parsed.data.name,
      type: parsed.data.type,
      initialBalance: Math.round(parsed.data.initialBalance).toString(),
      currentBalance: Math.round(parsed.data.initialBalance).toString(),
    })
    revalidatePath('/accounts')
    revalidatePath('/dashboard')
    return { success: true }
  } catch (err) {
    console.error(err)
    return { error: 'Gagal membuat dompet' }
  }
}

export async function updateAccountAction(
  accountId: string,
  input: { name: string; type: 'CASH' | 'BANK' | 'EWALLET'; initialBalance: number }
) {
  const memberId = await getActiveMemberId()
  if (!memberId) return { error: 'Tidak ada profil aktif' }

  const [member] = await db.select().from(members).where(eq(members.id, memberId)).limit(1)
  if (!member) return { error: 'Member tidak ditemukan' }

  const parsed = accountSchema.safeParse(input)
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  try {
    // KITA PAKSA SALDO SAAT INI = SALDO AWAL
    // Ini agar jika ada minus nyangkut, bisa di-reset paksa lewat form edit
    await db.update(accounts).set({
      name: parsed.data.name,
      type: parsed.data.type,
      initialBalance: Math.round(parsed.data.initialBalance).toString(),
      currentBalance: Math.round(parsed.data.initialBalance).toString(), 
    }).where(and(eq(accounts.id, accountId), eq(accounts.familyId, member.familyId)))

    revalidatePath('/accounts')
    revalidatePath('/dashboard')
    return { success: true }
  } catch (err) {
    console.error(err)
    return { error: 'Gagal mengubah dompet' }
  }
}

export async function deleteAccountAction(accountId: string) {
  const memberId = await getActiveMemberId()
  if (!memberId) return { error: 'Tidak ada profil aktif' }

  const [member] = await db.select().from(members).where(eq(members.id, memberId)).limit(1)
  if (!member) return { error: 'Member tidak ditemukan' }

  try {
    const [acc] = await db.select().from(accounts).where(eq(accounts.id, accountId)).limit(1)
    if (!acc) return { error: 'Dompet tidak ditemukan' }

    // PENGAMAN 1: Cek apakah ada transaksi
    const txs = await db.select().from(transactions).where(eq(transactions.accountId, accountId)).limit(1)
    if (txs.length > 0) {
      return { error: 'Dompet tidak bisa dihapus karena sudah memiliki riwayat transaksi.' }
    }

    // PENGAMAN 2: Cek saldo harus 0
    if (parseFloat(acc.currentBalance) !== 0) {
      return { error: 'Dompet tidak bisa dihapus jika saldo belum 0. Silakan tarik/pindahkan saldonya dulu.' }
    }

    await db.delete(accounts).where(and(eq(accounts.id, accountId), eq(accounts.familyId, member.familyId)))
    revalidatePath('/accounts')
    revalidatePath('/dashboard')
    return { success: true }
  } catch (err) {
    console.error(err)
    return { error: 'Gagal menghapus dompet' }
  }
}