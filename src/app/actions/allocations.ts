'use server'

import { revalidatePath } from 'next/cache'
import { db } from '@/lib/db'
import { allocations, categories, members } from '@/lib/db/schema'
import { getActiveMemberId } from '@/lib/auth/session'
import { and, eq, inArray } from 'drizzle-orm'
import { z } from 'zod'

const allocationItemSchema = z.object({
  categoryId: z.string().uuid(),
  plannedAmount: z.coerce.number().min(0),
})

const saveAllocationsSchema = z.object({
  period: z.string().regex(/^\d{4}-\d{2}$/),
  items: z.array(allocationItemSchema),
})

export async function saveAllocationsAction(input: {
  period: string
  items: { categoryId: string; plannedAmount: number }[]
}) {
  const memberId = await getActiveMemberId()
  if (!memberId) return { error: 'Tidak ada profil aktif' }

  const [member] = await db
    .select()
    .from(members)
    .where(eq(members.id, memberId))
    .limit(1)

  if (!member) return { error: 'Member tidak ditemukan' }

  const parsed = saveAllocationsSchema.safeParse(input)
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message }
  }

  try {
    // Ambil semua categoryId yang valid untuk family ini
    const categoryIds = parsed.data.items.map((i) => i.categoryId)
    const validCategories = await db
      .select({ id: categories.id })
      .from(categories)
      .where(
        and(
          eq(categories.familyId, member.familyId),
          inArray(categories.id, categoryIds)
        )
      )

    const validIds = new Set(validCategories.map((c) => c.id))

    // Hapus alokasi lama untuk period ini
    await db
      .delete(allocations)
      .where(
        and(
          eq(allocations.period, parsed.data.period),
          inArray(
            allocations.categoryId,
            Array.from(validIds)
          )
        )
      )

    // Insert alokasi baru (hanya yang > 0)
    const itemsToInsert = parsed.data.items
      .filter((i) => validIds.has(i.categoryId) && i.plannedAmount > 0)
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

// Copy alokasi dari bulan sebelumnya
export async function copyPreviousMonthAction(currentPeriod: string) {
  const memberId = await getActiveMemberId()
  if (!memberId) return { error: 'Tidak ada profil aktif' }

  const [member] = await db
    .select()
    .from(members)
    .where(eq(members.id, memberId))
    .limit(1)

  if (!member) return { error: 'Member tidak ditemukan' }

  // Hitung period sebelumnya
  const [year, month] = currentPeriod.split('-').map(Number)
  const prevDate = new Date(year, month - 2, 1)
  const prevPeriod = `${prevDate.getFullYear()}-${String(
    prevDate.getMonth() + 1
  ).padStart(2, '0')}`

  try {
    // Ambil alokasi bulan sebelumnya
    const prevAllocations = await db
      .select({
        categoryId: allocations.categoryId,
        plannedAmount: allocations.plannedAmount,
      })
      .from(allocations)
      .innerJoin(categories, eq(allocations.categoryId, categories.id))
      .where(
        and(
          eq(categories.familyId, member.familyId),
          eq(allocations.period, prevPeriod)
        )
      )

    if (prevAllocations.length === 0) {
      return { error: `Tidak ada alokasi di ${prevPeriod}` }
    }

    // Hapus alokasi bulan ini
    const categoryIds = prevAllocations.map((a) => a.categoryId)
    await db
      .delete(allocations)
      .where(
        and(
          eq(allocations.period, currentPeriod),
          inArray(allocations.categoryId, categoryIds)
        )
      )

    // Insert ulang
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