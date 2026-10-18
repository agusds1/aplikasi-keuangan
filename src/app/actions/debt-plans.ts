'use server'

import { revalidatePath } from 'next/cache'
import { db } from '@/lib/db'
import { debtPlans, debts, members, accounts, categories, transactions } from '@/lib/db/schema'
import { getActiveMemberId } from '@/lib/auth/session'
import { eq, and, sql } from 'drizzle-orm'
import { z } from 'zod'

const planSchema = z.object({
  debtId: z.string().uuid(),
  accountId: z.string().uuid(),
  installmentNumber: z.coerce.number().min(1),
  principalPaid: z.coerce.number().positive(),
  interestPaid: z.coerce.number().min(0),
  plannedDate: z.string(),
})

export async function createDebtPlanAction(input: {
  debtId: string
  accountId: string
  installmentNumber: number
  principalPaid: number
  interestPaid: number
  plannedDate: string
}) {
  const memberId = await getActiveMemberId()
  if (!memberId) return { error: 'Tidak ada profil aktif' }

  const [member] = await db.select().from(members).where(eq(members.id, memberId)).limit(1)
  if (!member) return { error: 'Member tidak ditemukan' }

  const parsed = planSchema.safeParse(input)
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  try {
    await db.insert(debtPlans).values({
      familyId: member.familyId,
      debtId: parsed.data.debtId,
      creatorId: member.id,
      accountId: parsed.data.accountId,
      installmentNumber: parsed.data.installmentNumber,
      principalPaid: parsed.data.principalPaid.toString(),
      interestPaid: parsed.data.interestPaid.toString(),
      plannedDate: new Date(parsed.data.plannedDate),
      status: 'PENDING',
    })

    revalidatePath('/debts')
    revalidatePath('/plans')
    return { success: true }
  } catch (err) {
    console.error(err)
    return { error: 'Gagal membuat rencana pelunasan' }
  }
}

export async function deleteDebtPlanAction(planId: string) {
  const memberId = await getActiveMemberId()
  if (!memberId) return { error: 'Tidak ada profil aktif' }
  
  try {
    await db.delete(debtPlans).where(and(eq(debtPlans.id, planId), eq(debtPlans.status, 'PENDING')))
    revalidatePath('/debts')
    revalidatePath('/plans')
    return { success: true }
  } catch (err) {
    return { error: 'Gagal menghapus rencana' }
  }
}

// 1. Approve Rencana Pelunasan (Oleh Pasangan)
export async function approveDebtPlanAction(planId: string) {
  const memberId = await getActiveMemberId()
  if (!memberId) return { error: 'Tidak ada profil aktif' }

  try {
    await db.update(debtPlans)
      .set({ status: 'APPROVED', reviewedAt: new Date() })
      .where(eq(debtPlans.id, planId))
    
    revalidatePath('/debts')
    revalidatePath('/plans')
    return { success: true }
  } catch (err) {
    return { error: 'Gagal menyetujui rencana' }
  }
}

// 2. Eksekusi Pembayaran (Mengaktifkan tombol Bayar Cicilan)
export async function executeDebtPlanAction(planId: string) {
  const memberId = await getActiveMemberId()
  if (!memberId) return { error: 'Tidak ada profil aktif' }

  try {
    const [plan] = await db.select().from(debtPlans).where(eq(debtPlans.id, planId)).limit(1)
    if (!plan || plan.status !== 'APPROVED') return { error: 'Rencana belum disetujui atau sudah dibayar' }

    const totalPaid = parseFloat(plan.principalPaid) + parseFloat(plan.interestPaid)

    // 1. Potong Saldo Dompet
    await db.update(accounts)
      .set({ currentBalance: sql`${accounts.currentBalance} - ${totalPaid}` })
      .where(eq(accounts.id, plan.accountId))

    // 2. Kurangi Sisa Pokok Hutang
    const [debt] = await db.select().from(debts).where(eq(debts.id, plan.debtId)).limit(1)
    const newRemaining = parseFloat(debt.remainingPrincipal) - parseFloat(plan.principalPaid)
    await db.update(debts)
      .set({ remainingPrincipal: newRemaining.toString(), isActive: newRemaining > 0 })
      .where(eq(debts.id, plan.debtId))

    // 3. Catat Transaksi Pokok (TRANSFER)
    if (parseFloat(plan.principalPaid) > 0) {
      let [catPokok] = await db.select().from(categories).where(eq(categories.type, 'DEBT')).limit(1)
      if (!catPokok) {
        const [newCat] = await db.insert(categories).values({ familyId: plan.familyId, name: 'Bayar Hutang', type: 'DEBT', icon: '💳' }).returning()
        catPokok = newCat
      }
      await db.insert(transactions).values({
        familyId: plan.familyId, categoryId: catPokok.id, accountId: plan.accountId, memberId: memberId,
        amount: plan.principalPaid, type: 'TRANSFER', description: `Pelunasan ke-${plan.installmentNumber}: ${debt.name}`, date: new Date(),
      })
    }

    // 4. Catat Transaksi Bunga (EXPENSE)
    if (parseFloat(plan.interestPaid) > 0) {
      let [catBunga] = await db.select().from(categories).where(eq(categories.name, 'Bunga')).limit(1)
      if (!catBunga) {
        const [newCat] = await db.insert(categories).values({ familyId: plan.familyId, name: 'Bunga', type: 'EXPENSE', icon: '📈' }).returning()
        catBunga = newCat
      }
      await db.insert(transactions).values({
        familyId: plan.familyId, categoryId: catBunga.id, accountId: plan.accountId, memberId: memberId,
        amount: plan.interestPaid, type: 'EXPENSE', description: `Bunga Pelunasan ke-${plan.installmentNumber}: ${debt.name}`, date: new Date(),
      })
    }

    // 5. Update Status Rencana jadi PAID
    await db.update(debtPlans).set({ status: 'PAID', paidAt: new Date() }).where(eq(debtPlans.id, planId))

    revalidatePath('/debts')
    revalidatePath('/plans')
    revalidatePath('/dashboard')
    revalidatePath('/accounts')
    revalidatePath('/transactions')
    return { success: true }
  } catch (err) {
    console.error(err)
    return { error: 'Gagal mengeksekusi pembayaran' }
  }
}

// Fungsi khusus untuk Approve Rencana Hutang dari Menu Rencana Transaksi
export async function reviewDebtPlanAction(
  planId: string,
  action: 'APPROVE' | 'REVISION' | 'REJECT',
  note?: string
) {
  const memberId = await getActiveMemberId()
  if (!memberId) return { error: 'Tidak ada profil aktif' }

  try {
    const [plan] = await db.select().from(debtPlans).where(eq(debtPlans.id, planId)).limit(1)
    if (!plan) return { error: 'Rencana tidak ditemukan' }
    
    // Pastikan yang mereview bukan pembuatnya sendiri
    if (plan.creatorId === memberId) {
      return { error: 'Tidak bisa mereview rencana sendiri' }
    }

    const statusMap = {
      APPROVE: 'APPROVED',
      REVISION: 'REVISION',
      REJECT: 'REJECTED',
    } as const

    await db.update(debtPlans)
      .set({ status: statusMap[action], reviewNote: note || null, reviewedAt: new Date() })
      .where(eq(debtPlans.id, planId))

    revalidatePath('/debts')
    revalidatePath('/plans')
    revalidatePath('/dashboard')
    return { success: true }
  } catch (err) {
    console.error(err)
    return { error: 'Gagal memproses persetujuan' }
  }
}

export async function updateDebtPlanAction(
  planId: string,
  input: {
    accountId: string
    installmentNumber: number
    principalPaid: number
    interestPaid: number
    plannedDate: string
  }
) {
  const memberId = await getActiveMemberId()
  if (!memberId) return { error: 'Tidak ada profil aktif' }

  try {
    await db.update(debtPlans)
      .set({
        accountId: input.accountId,
        installmentNumber: input.installmentNumber,
        principalPaid: input.principalPaid.toString(),
        interestPaid: input.interestPaid.toString(),
        plannedDate: new Date(input.plannedDate),
        status: 'PENDING', // Kembali ke pending untuk direview ulang
        reviewNote: null,
        reviewedAt: null,
      })
      .where(eq(debtPlans.id, planId))

    revalidatePath('/debts')
    revalidatePath('/plans')
    return { success: true }
  } catch (err) {
    console.error(err)
    return { error: 'Gagal mengubah rencana' }
  }
}