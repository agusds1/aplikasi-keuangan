import { cookies } from 'next/headers'
import { db } from '@/lib/db'
import { eq } from 'drizzle-orm'
import bcrypt from 'bcryptjs'
import { users, members } from '@/lib/db/schema'

const SESSION_COOKIE = 'family_session'
const ACTIVE_MEMBER_COOKIE = 'active_member'

// Login: verifikasi email & password
export async function login(email: string, password: string) {
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1)

  if (!user) return null

  const valid = await bcrypt.compare(password, user.passwordHash)
  if (!valid) return null

  return { id: user.id, email: user.email }
}

// Set session cookie
export async function setSession(userId: string) {
  const cookieStore = await cookies()
  cookieStore.set(SESSION_COOKIE, userId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 30, // 30 hari
  })
}

// Ambil user yang sedang login
export async function getCurrentUser() {
  const cookieStore = await cookies()
  const userId = cookieStore.get(SESSION_COOKIE)?.value
  if (!userId) return null

  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, userId))
    .limit(1)

  return user ?? null
}

// Logout
export async function logout() {
  const cookieStore = await cookies()
  cookieStore.delete(SESSION_COOKIE)
  cookieStore.delete(ACTIVE_MEMBER_COOKIE)
}

// Set member aktif (Suami / Istri)
export async function setActiveMember(memberId: string) {
  const cookieStore = await cookies()
  cookieStore.set(ACTIVE_MEMBER_COOKIE, memberId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 30,
  })
}

// Ambil member aktif
export async function getActiveMemberId() {
  const cookieStore = await cookies()
  return cookieStore.get(ACTIVE_MEMBER_COOKIE)?.value ?? null
}

// Verifikasi PIN member
export async function verifyMemberPin(memberId: string, pin: string) {
  const [member] = await db
    .select()
    .from(members)
    .where(eq(members.id, memberId))
    .limit(1)

  if (!member) return { error: 'Member tidak ditemukan' }
  if (!member.pinHash) return { success: true, needsSetup: true }

  const valid = await bcrypt.compare(pin, member.pinHash)
  if (!valid) return { error: 'PIN salah' }

  return { success: true, needsSetup: false }
}