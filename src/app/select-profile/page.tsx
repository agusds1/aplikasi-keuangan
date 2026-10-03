import { redirect } from 'next/navigation'
import { getCurrentUser, getActiveMemberId } from '@/lib/auth/session'
import { db } from '@/lib/db'
import { members } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { ProfilePicker } from './profile-picker'

export default async function SelectProfilePage() {
  const user = await getCurrentUser()
  if (!user) redirect('/login')

  const activeMemberId = await getActiveMemberId()
  if (activeMemberId) redirect('/dashboard')

  const familyMembers = await db
    .select()
    .from(members)
    .where(eq(members.isActive, true))

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-blue-50 to-pink-50 dark:from-slate-900 dark:to-slate-800">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold">Siapa yang mau input?</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Pilih profil untuk melanjutkan
          </p>
        </div>
        <ProfilePicker members={familyMembers} />
      </div>
    </div>
  )
}