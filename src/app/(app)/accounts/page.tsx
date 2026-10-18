import { getActiveMemberId } from '@/lib/auth/session'
import { db } from '@/lib/db'
import { members } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { getAccountsByFamily } from '@/lib/db/queries'
import { AccountsClient } from './accounts-client'

export default async function AccountsPage() {
  const activeMemberId = await getActiveMemberId()
  const [member] = await db.select().from(members).where(eq(members.id, activeMemberId!)).limit(1)
  
  // Ambil data di server
  const accounts = await getAccountsByFamily(member.familyId)

  // Kirim ke client component
  return <AccountsClient initialAccounts={accounts} />
}