'use server'

import { revalidatePath } from 'next/cache'
import { db } from '@/lib/db'
import { members } from '@/lib/db/schema'
import { getActiveMemberId } from '@/lib/auth/session'
import { eq, and } from 'drizzle-orm'
import { z } from 'zod'
import bcrypt from 'bcryptjs'

const memberSchema = z.object({
  name: z.string().min(1, 'Nama wajib diisi'),
  role: z.enum(['HUSBAND', 'WIFE', 'CHILD', 'OTHER']),
  avatar: z.string().min(1),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  pin: z.string().optional(),
})

export async function createMemberAction(input: {
  name: string
  role: 'HUSBAND' | 'WIFE' | 'CHILD' | 'OTHER'
  avatar: string
  color: string
  pin?: string
}) {
  const activeMemberId = await getActiveMemberId()
  if (!activeMemberId) return { error: 'Tidak ada profil aktif' }

  const [active] = await db
    .select()
    .from(members)
    .where(eq(members.id, activeMemberId))
    .limit(1)

  if (!active) return { error: 'Member tidak ditemukan' }

  const parsed = memberSchema.safeParse(input)
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message }
  }

  try {
    const pinHash = parsed.data.pin
      ? await bcrypt.hash(parsed.data.pin, 10)
      : null

    await db.insert(members).values({
      familyId: active.familyId,
      name: parsed.data.name,
      role: parsed.data.role,
      avatar: parsed.data.avatar,
      color: parsed.data.color,
      pinHash,
    })

    revalidatePath('/settings')
    return { success: true }
  } catch (err) {
    console.error(err)
    return { error: 'Gagal menambah anggota' }
  }
}

export async function updateMemberAction(
  memberId: string,
  input: {
    name: string
    role: 'HUSBAND' | 'WIFE' | 'CHILD' | 'OTHER'
    avatar: string
    color: string
    pin?: string
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

  const parsed = memberSchema.safeParse(input)
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message }
  }

  try {
    const updateData: Record<string, unknown> = {
      name: parsed.data.name,
      role: parsed.data.role,
      avatar: parsed.data.avatar,
      color: parsed.data.color,
    }

    if (parsed.data.pin !== undefined && parsed.data.pin !== '') {
      updateData.pinHash = await bcrypt.hash(parsed.data.pin, 10)
    }

    await db
      .update(members)
      .set(updateData)
      .where(
        and(eq(members.id, memberId), eq(members.familyId, active.familyId))
      )

    revalidatePath('/settings')
    return { success: true }
  } catch (err) {
    console.error(err)
    return { error: 'Gagal mengubah anggota' }
  }
}

export async function toggleMemberActiveAction(
  memberId: string,
  isActive: boolean
) {
  const activeMemberId = await getActiveMemberId()
  if (!activeMemberId) return { error: 'Tidak ada profil aktif' }

  const [active] = await db
    .select()
    .from(members)
    .where(eq(members.id, activeMemberId))
    .limit(1)

  if (!active) return { error: 'Member tidak ditemukan' }

  // Cegah menonaktifkan diri sendiri
  if (memberId === activeMemberId && !isActive) {
    return { error: 'Tidak bisa menonaktifkan profil yang sedang aktif' }
  }

  try {
    await db
      .update(members)
      .set({ isActive })
      .where(
        and(eq(members.id, memberId), eq(members.familyId, active.familyId))
      )

    revalidatePath('/settings')
    return { success: true }
  } catch (err) {
    console.error(err)
    return { error: 'Gagal mengubah status anggota' }
  }
}