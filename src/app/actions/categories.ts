'use server'

import { revalidatePath } from 'next/cache'
import { db } from '@/lib/db'
import { categories, members, transactions } from '@/lib/db/schema'
import { getActiveMemberId } from '@/lib/auth/session'
import { eq, and, count } from 'drizzle-orm'
import { z } from 'zod'

const categorySchema = z.object({
  name: z.string().min(1, 'Nama wajib diisi'),
  type: z.enum(['INCOME', 'EXPENSE', 'SAVING', 'DEBT', 'INVESTMENT', 'SOCIAL']),
  icon: z.string().min(1),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  isFixed: z.boolean().default(false),
})

export async function createCategoryAction(input: {
  name: string
  type: 'INCOME' | 'EXPENSE' | 'SAVING' | 'DEBT' | 'INVESTMENT' | 'SOCIAL'
  icon: string
  color: string
  isFixed?: boolean
}) {
  const activeMemberId = await getActiveMemberId()
  if (!activeMemberId) return { error: 'Tidak ada profil aktif' }

  const [active] = await db
    .select()
    .from(members)
    .where(eq(members.id, activeMemberId))
    .limit(1)

  if (!active) return { error: 'Member tidak ditemukan' }

  const parsed = categorySchema.safeParse({
    ...input,
    isFixed: input.isFixed ?? false,
  })

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message }
  }

  try {
    await db.insert(categories).values({
      familyId: active.familyId,
      name: parsed.data.name,
      type: parsed.data.type,
      icon: parsed.data.icon,
      color: parsed.data.color,
      isFixed: parsed.data.isFixed,
      sortOrder: 100,
    })

    revalidatePath('/settings')
    revalidatePath('/budget')
    return { success: true }
  } catch (err) {
    console.error(err)
    return { error: 'Gagal menambah kategori' }
  }
}

export async function updateCategoryAction(
  categoryId: string,
  input: {
    name: string
    type: 'INCOME' | 'EXPENSE' | 'SAVING' | 'DEBT' | 'INVESTMENT' | 'SOCIAL'
    icon: string
    color: string
    isFixed?: boolean
  }
) {
  const activeMemberId = await getActiveMemberId()
  if (!activeMemberId) return { error: 'Tidak ada profil aktif' }

  const [active] = await db
    .select()
    .from(members)
    .where(eq(members.id, activeMemberId))
    .limit(1)

  if (!active) return { error: 'Member tidak ditemukan' }

  const parsed = categorySchema.safeParse({
    ...input,
    isFixed: input.isFixed ?? false,
  })

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message }
  }

  try {
    await db
      .update(categories)
      .set({
        name: parsed.data.name,
        type: parsed.data.type,
        icon: parsed.data.icon,
        color: parsed.data.color,
        isFixed: parsed.data.isFixed,
      })
      .where(
        and(
          eq(categories.id, categoryId),
          eq(categories.familyId, active.familyId)
        )
      )

    revalidatePath('/settings')
    revalidatePath('/budget')
    return { success: true }
  } catch (err) {
    console.error(err)
    return { error: 'Gagal mengubah kategori' }
  }
}

export async function deleteCategoryAction(categoryId: string) {
  const activeMemberId = await getActiveMemberId()
  if (!activeMemberId) return { error: 'Tidak ada profil aktif' }

  const [active] = await db
    .select()
    .from(members)
    .where(eq(members.id, activeMemberId))
    .limit(1)

  if (!active) return { error: 'Member tidak ditemukan' }

  try {
    // Cek apakah kategori masih dipakai di transaksi
    const [txCount] = await db
      .select({ count: count() })
      .from(transactions)
      .where(eq(transactions.categoryId, categoryId))

    if (txCount.count > 0) {
      return {
        error: `Kategori masih dipakai di ${txCount.count} transaksi. Tidak bisa dihapus.`,
      }
    }

    await db
      .delete(categories)
      .where(
        and(
          eq(categories.id, categoryId),
          eq(categories.familyId, active.familyId)
        )
      )

    revalidatePath('/settings')
    revalidatePath('/budget')
    return { success: true }
  } catch (err) {
    console.error(err)
    return { error: 'Gagal menghapus kategori' }
  }
}