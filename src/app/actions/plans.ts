'use server'

import { revalidatePath } from 'next/cache'
import { db } from '@/lib/db'
import {
  transactionPlans,
  members,
  transactions,
  categories,
} from '@/lib/db/schema'
import { getActiveMemberId } from '@/lib/auth/session'
import { eq, and } from 'drizzle-orm'
import { z } from 'zod'

const planSchema = z.object({
  categoryId: z.string().uuid(),
  type: z.enum(['INCOME', 'EXPENSE', 'TRANSFER']),
  amount: z.coerce.number().positive(),
  description: z.string().optional(),
  plannedDate: z.string(),
})

// Buat rencana baru
export async function createPlanAction(input: {
  categoryId: string
  type: 'INCOME' | 'EXPENSE' | 'TRANSFER'
  amount: number
  description?: string
  plannedDate: string
}) {
  const memberId = await getActiveMemberId()
  if (!memberId) return { error: 'Tidak ada profil aktif' }

  const [member] = await db
    .select()
    .from(members)
    .where(eq(members.id, memberId))
    .limit(1)

  if (!member) return { error: 'Member tidak ditemukan' }

  // Cari pasangan (reviewer)
  const [partner] = await db
    .select()
    .from(members)
    .where(
      and(
        eq(members.familyId, member.familyId),
        eq(members.isActive, true),
        // Bukan diri sendiri
        // Kita akan filter di JS karena drizzle tidak punya `ne` di and dengan mudah
      )
    )

  const allMembers = await db
    .select()
    .from(members)
    .where(
      and(eq(members.familyId, member.familyId), eq(members.isActive, true))
    )

  const reviewer = allMembers.find((m) => m.id !== memberId)

  if (!reviewer) {
    return {
      error:
        'Tidak ada anggota lain untuk memverifikasi. Tambah anggota dulu di Setting.',
    }
  }

  const parsed = planSchema.safeParse(input)
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message }
  }

  try {
    await db.insert(transactionPlans).values({
      familyId: member.familyId,
      categoryId: parsed.data.categoryId,
      creatorId: member.id,
      reviewerId: reviewer.id,
      amount: parsed.data.amount.toString(),
      type: parsed.data.type,
      description: parsed.data.description || null,
      plannedDate: new Date(parsed.data.plannedDate),
      status: 'PENDING',
    })

    revalidatePath('/plans')
    revalidatePath('/dashboard')
    return { success: true }
  } catch (err) {
    console.error(err)
    return { error: 'Gagal membuat rencana' }
  }
}

// Update rencana (oleh pembuat)
export async function updatePlanAction(
  planId: string,
  input: {
    categoryId: string
    type: 'INCOME' | 'EXPENSE' | 'TRANSFER'
    amount: number
    description?: string
    plannedDate: string
  }
) {
  const memberId = await getActiveMemberId()
  if (!memberId) return { error: 'Tidak ada profil aktif' }

  const parsed = planSchema.safeParse(input)
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message }
  }

  try {
    const [plan] = await db
      .select()
      .from(transactionPlans)
      .where(eq(transactionPlans.id, planId))
      .limit(1)

    if (!plan) return { error: 'Rencana tidak ditemukan' }
    if (plan.creatorId !== memberId) {
      return { error: 'Hanya pembuat yang bisa edit' }
    }
    if (plan.status === 'EXECUTED') {
      return { error: 'Rencana sudah dieksekusi' }
    }

    await db
      .update(transactionPlans)
      .set({
        categoryId: parsed.data.categoryId,
        type: parsed.data.type,
        amount: parsed.data.amount.toString(),
        description: parsed.data.description || null,
        plannedDate: new Date(parsed.data.plannedDate),
        // Reset ke pending setelah diedit
        status: 'PENDING',
        reviewNote: null,
        reviewedAt: null,
      })
      .where(eq(transactionPlans.id, planId))

    revalidatePath('/plans')
    revalidatePath('/dashboard')
    return { success: true }
  } catch (err) {
    console.error(err)
    return { error: 'Gagal mengubah rencana' }
  }
}

// Approve / Revisi / Reject (oleh reviewer)
export async function reviewPlanAction(
  planId: string,
  action: 'APPROVE' | 'REVISION' | 'REJECT',
  note?: string
) {
  const memberId = await getActiveMemberId()
  if (!memberId) return { error: 'Tidak ada profil aktif' }

  try {
    const [plan] = await db
      .select()
      .from(transactionPlans)
      .where(eq(transactionPlans.id, planId))
      .limit(1)

    if (!plan) return { error: 'Rencana tidak ditemukan' }
    if (plan.reviewerId !== memberId) {
      return { error: 'Hanya pasangan yang bisa review' }
    }
    if (plan.status === 'EXECUTED') {
      return { error: 'Rencana sudah dieksekusi' }
    }

    const statusMap = {
      APPROVE: 'APPROVED',
      REVISION: 'REVISION',
      REJECT: 'REJECTED',
    } as const

    await db
      .update(transactionPlans)
      .set({
        status: statusMap[action],
        reviewNote: note || null,
        reviewedAt: new Date(),
      })
      .where(eq(transactionPlans.id, planId))

    revalidatePath('/plans')
    revalidatePath('/dashboard')
    return { success: true }
  } catch (err) {
    console.error(err)
    return { error: 'Gagal review rencana' }
  }
}

// Ubah jadi transaksi (oleh pembuat, setelah approved & tanggal tiba)
export async function executePlanAction(planId: string) {
  const memberId = await getActiveMemberId()
  if (!memberId) return { error: 'Tidak ada profil aktif' }

  try {
    const [plan] = await db
      .select()
      .from(transactionPlans)
      .where(eq(transactionPlans.id, planId))
      .limit(1)

    if (!plan) return { error: 'Rencana tidak ditemukan' }
    if (plan.creatorId !== memberId) {
      return { error: 'Hanya pembuat yang bisa eksekusi' }
    }
    if (plan.status !== 'APPROVED') {
      return { error: 'Rencana belum disetujui' }
    }

    // Cek tanggal — hanya bisa eksekusi saat hari H atau setelahnya
    const planDate = new Date(plan.plannedDate)
    planDate.setHours(0, 0, 0, 0)
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    if (planDate > today) {
      return {
        error: `Rencana dijadwalkan untuk ${planDate.toLocaleDateString(
          'id-ID',
          { day: 'numeric', month: 'long', year: 'numeric' }
        )}. Belum waktunya eksekusi.`,
      }
    }

    // Buat transaksi dengan date = plannedDate (tanggal rencana, bukan hari ini)
    const [newTx] = await db
      .insert(transactions)
      .values({
        familyId: plan.familyId,
        categoryId: plan.categoryId,
        memberId: plan.creatorId,
        amount: plan.amount,
        type: plan.type,
        description: plan.description,
        date: plan.plannedDate,
      })
      .returning()

    // Update plan
    await db
      .update(transactionPlans)
      .set({
        status: 'EXECUTED',
        executedTransactionId: newTx.id,
        executedAt: new Date(),
      })
      .where(eq(transactionPlans.id, planId))

    revalidatePath('/plans')
    revalidatePath('/transactions')
    revalidatePath('/dashboard')
    return { success: true, transactionId: newTx.id }
  } catch (err) {
    console.error(err)
    return { error: 'Gagal eksekusi rencana' }
  }
}

// Hapus rencana (oleh pembuat, sebelum executed)
export async function deletePlanAction(planId: string) {
  const memberId = await getActiveMemberId()
  if (!memberId) return { error: 'Tidak ada profil aktif' }

  try {
    const [plan] = await db
      .select()
      .from(transactionPlans)
      .where(eq(transactionPlans.id, planId))
      .limit(1)

    if (!plan) return { error: 'Rencana tidak ditemukan' }
    if (plan.creatorId !== memberId) {
      return { error: 'Hanya pembuat yang bisa hapus' }
    }
    if (plan.status === 'EXECUTED') {
      return { error: 'Rencana sudah dieksekusi, tidak bisa dihapus' }
    }

    await db.delete(transactionPlans).where(eq(transactionPlans.id, planId))

    revalidatePath('/plans')
    revalidatePath('/dashboard')
    return { success: true }
  } catch (err) {
    console.error(err)
    return { error: 'Gagal menghapus rencana' }
  }
}