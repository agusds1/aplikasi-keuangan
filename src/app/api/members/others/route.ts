import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { members } from '@/lib/db/schema'
import { getActiveMemberId } from '@/lib/auth/session'
import { eq, and, ne } from 'drizzle-orm'

export async function GET() {
  const activeMemberId = await getActiveMemberId()
  if (!activeMemberId) {
    return NextResponse.json([])
  }

  const [active] = await db
    .select()
    .from(members)
    .where(eq(members.id, activeMemberId))
    .limit(1)

  if (!active) return NextResponse.json([])

  const others = await db
    .select()
    .from(members)
    .where(
      and(
        eq(members.familyId, active.familyId),
        eq(members.isActive, true),
        ne(members.id, activeMemberId)
      )
    )

  return NextResponse.json(others)
}