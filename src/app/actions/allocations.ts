'use server'

import { revalidatePath } from 'next/cache'
import { db } from '@/lib/db'
import { allocations, categories, members } from '@/lib/db/schema'
import { getActiveMemberId } from '@/lib/auth/session'
import { and, eq, inArray } from 'drizzle-orm'
import { z } from 'zod'

const saveAllocationsSchema = z.object({
  period: z.string().regex(/^\d{4}-\d{2}$/),
  items: z.array(z.object({
    categoryId: z.string().uuid(),
    plannedAmount: z.coerce.number().min(0),
  })),
})

export async function saveAllocationsAction(input: {
  period: string
  items: { categoryId: string; plannedAmount: number }[]
}) {
  const memberId = await getActiveMemberId()
  if (!memberId) return { error: 'Tidak ada profil aktif' }

  const [member] = await db.select().from(members).where(eq(members.id, memberId)).limit(1)
  if (!member) return { error: 'Member tidak ditemukan' }

  const parsed = saveAllocationsSchema.safeParse(input)
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  try {
    // 1. HAPUS SEMUA alokasi di bulan ini, apapun kategorinya
    // (Kita cari dulu ID kategori milik family ini)
    const validCategories = await db.select({ id: categories.id })
      .from(categories)
      .where(eq(categories.familyId, member.familyId))
      
    const validIds = validCategories.map((c) => c.id)

    if (validIds.length > 0) {
      await db.delete(allocations).where(
        and(
          eq(allocations.period, parsed.data.period),
          inArray(allocations.categoryId, validIds)
        )
      )
    }

    // 2. Insert alokasi baru (hanya yang > 0)
    const itemsToInsert = parsed.data.items
      .filter((i) => validIds.includes(i.categoryId) && i.plannedAmount > 0)
      .map((i) => ({
        categoryId: i.categoryId,
        period: parsed.data.period,
        plannedAmount: i.plannedAmount.toString(),
      }))

    if (itemsToInsert.length > 0) {
      await db.insert(allocations).values(itemsToInsert)
    }

    revalidatePath('/budget')
    revalidatePath('/dashboard')
    return { success: true }
  } catch (err) {
    console.error(err)
    return { error: 'Gagal menyimpan alokasi' }
  }
}

export async function copyPreviousMonthAction(currentPeriod: string) {
  const memberId = await getActiveMemberId()
  if (!memberId) return { error: 'Tidak ada profil aktif' }

  const [member] = await db.select().from(members).where(eq(members.id, memberId)).limit(1)
  if (!member) return { error: 'Member tidak ditemukan' }

  const [year, month] = currentPeriod.split('-').map(Number)
  const prevDate = new Date(year, month - 2, 1)
  const prevPeriod = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}`

  try {
    const prevAllocations = await db.select({
      categoryId: allocations.categoryId,
      plannedAmount: allocations.plannedAmount,
    })
    .from(allocations)
    .innerJoin(categories, eq(allocations.categoryId, categories.id))
    .where(and(eq(categories.familyId, member.familyId), eq(allocations.period, prevPeriod)))

    if (prevAllocations.length === 0) {
      return { error: `Tidak ada alokasi di bulan sebelumnya (${prevPeriod})` }
    }

    const categoryIds = prevAllocations.map((a) => a.categoryId)
    await db.delete(allocations).where(and(eq(allocations.period, currentPeriod), inArray(allocations.categoryId, categoryIds)))

    await db.insert(allocations).values(
      prevAllocations.map((a) => ({
        categoryId: a.categoryId,
        period: currentPeriod,
        plannedAmount: a.plannedAmount,
      }))
    )

    revalidatePath('/budget')
    revalidatePath('/dashboard')
    return { success: true, count: prevAllocations.length }
  } catch (err) {
    console.error(err)
    return { error: 'Gagal copy alokasi' }
  }
}

export async function deleteAllocationsAction(period: string) {
  const memberId = await getActiveMemberId()
  if (!memberId) return { error: 'Tidak ada profil aktif' }

  const [member] = await db.select().from(members).where(eq(members.id, memberId)).limit(1)
  if (!member) return { error: 'Member tidak ditemukan' }

  try {
    const validCategories = await db.select({ id: categories.id })
      .from(categories)
      .where(eq(categories.familyId, member.familyId))
    
    const validIds = validCategories.map((c) => c.id)

    if (validIds.length > 0) {
      await db.delete(allocations).where(
        and(
          eq(allocations.period, period),
          inArray(allocations.categoryId, validIds)
        )
      )
    }

    revalidatePath('/budget')
    revalidatePath('/dashboard')
    return { success: true }
  } catch (err) {
    console.error(err)
    return { error: 'Gagal menghapus anggaran' }
  }
}