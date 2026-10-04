'use server'

import { redirect } from 'next/navigation'
import {
  login,
  setSession,
  logout,
  setActiveMember,
  verifyMemberPin,
} from '@/lib/auth/session'
import { z } from 'zod'

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
})

export async function loginAction(formData: FormData) {
  const parsed = loginSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
  })

  if (!parsed.success) {
    return { error: 'Email atau password tidak valid' }
  }

  const user = await login(parsed.data.email, parsed.data.password)
  if (!user) {
    return { error: 'Email atau password salah' }
  }

  await setSession(user.id)
  redirect('/select-profile')
}

export async function logoutAction() {
  await logout()
  redirect('/login')
}

// Pilih profil — sekarang butuh PIN (kecuali belum di-set)
export async function selectMemberAction(memberId: string, pin?: string) {
  const verify = await verifyMemberPin(memberId, pin ?? '')

  if (verify.error) {
    return { error: verify.error }
  }

  // Kalau member belum punya PIN, langsung aktifkan (nanti bisa setup di setting)
  await setActiveMember(memberId)

  if (verify.needsSetup) {
    redirect('/settings?setup=pin')
  }

  redirect('/dashboard')
}

// Set/update PIN member yang sedang aktif
export async function setMemberPinAction(pin: string) {
  const { getActiveMemberId } = await import('@/lib/auth/session')
  const { db } = await import('@/lib/db')
  const { members } = await import('@/lib/db/schema')
  const { eq } = await import('drizzle-orm')
  const bcrypt = (await import('bcryptjs')).default

  const memberId = await getActiveMemberId()
  if (!memberId) return { error: 'Tidak ada profil aktif' }

  // Validasi PIN: 4-6 digit angka
  if (!/^\d{4,6}$/.test(pin)) {
    return { error: 'PIN harus 4-6 digit angka' }
  }

  try {
    const pinHash = await bcrypt.hash(pin, 10)
    await db
      .update(members)
      .set({ pinHash })
      .where(eq(members.id, memberId))

    return { success: true }
  } catch (err) {
    console.error(err)
    return { error: 'Gagal menyimpan PIN' }
  }
}