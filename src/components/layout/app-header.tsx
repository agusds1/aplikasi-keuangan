import { getActiveMemberId } from '@/lib/auth/session'
import { db } from '@/lib/db'
import { members } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { AvatarSwitcher } from './avatar-switcher'

export async function AppHeader() {
  const activeMemberId = await getActiveMemberId()
  if (!activeMemberId) return null

  const [activeMember] = await db
    .select()
    .from(members)
    .where(eq(members.id, activeMemberId))
    .limit(1)

  if (!activeMember) return null

  return (
    <header className="sticky top-0 z-40 bg-background/95 backdrop-blur border-b">
      <div className="max-w-md mx-auto flex items-center justify-between px-4 h-14">
        <div className="flex items-center gap-2">
          <span className="text-lg font-bold">💰</span>
          <span className="text-sm font-semibold">Keuangan Keluarga</span>
        </div>
        <AvatarSwitcher member={activeMember} />
      </div>
    </header>
  )
}