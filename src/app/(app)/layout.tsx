import { redirect } from 'next/navigation'
import { getCurrentUser, getActiveMemberId } from '@/lib/auth/session'
import { AppHeader } from '@/components/layout/app-header'
import { BottomNav } from '@/components/layout/bottom-nav'

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getCurrentUser()
  if (!user) redirect('/login')

  const activeMemberId = await getActiveMemberId()
  if (!activeMemberId) redirect('/select-profile')

  return (
    <div className="min-h-screen bg-muted/30">
      <AppHeader />
      <main className="max-w-md mx-auto pb-20 pt-4 px-4">{children}</main>
      <BottomNav />
    </div>
  )
}