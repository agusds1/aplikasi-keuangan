'use server'

import { redirect } from 'next/navigation'
import { login, setSession, logout, setActiveMember } from '@/lib/auth/session'
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

export async function selectMemberAction(memberId: string) {
  await setActiveMember(memberId)
  redirect('/dashboard')
}