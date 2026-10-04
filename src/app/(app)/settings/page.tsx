import { getActiveMemberId } from '@/lib/auth/session'
import { db } from '@/lib/db'
import { members } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { getCategoriesByFamily, getMembersByFamily } from '@/lib/db/queries'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { MemberList } from '@/components/settings/member-list'
import { CategoryList } from '@/components/settings/category-list'
import { logoutAction } from '@/app/actions/auth'
import { Button } from '@/components/ui/button'
import { LogOut, Wallet } from 'lucide-react'
import { SetPinSection } from '@/components/settings/set-pin-section'

export default async function SettingsPage() {
  const activeMemberId = await getActiveMemberId()
  const [activeMember] = await db
    .select()
    .from(members)
    .where(eq(members.id, activeMemberId!))
    .limit(1)

  const [familyMembers, categories] = await Promise.all([
    getMembersByFamily(activeMember.familyId),
    getCategoriesByFamily(activeMember.familyId),
  ])

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold">⚙️ Pengaturan</h1>
        <p className="text-xs text-muted-foreground">
          Kelola anggota & kategori keluarga
        </p>
      </div>

      <Tabs defaultValue="members" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="members">👥 Anggota</TabsTrigger>
          <TabsTrigger value="categories">📁 Kategori</TabsTrigger>
        </TabsList>

        <TabsContent value="members" className="mt-4">
          <MemberList
            members={familyMembers}
            activeMemberId={activeMemberId!}
          />
        </TabsContent>

        <TabsContent value="categories" className="mt-4">
          <CategoryList categories={categories} />
        </TabsContent>
      </Tabs>

      {/* PIN Section */}
      <div className="pt-6 border-t">
        <SetPinSection hasPin={!!activeMember.pinHash} />
      </div>

      {/* Danger zone */}
      <div className="pt-6 border-t mt-6 space-y-3">
        <div>
          <h3 className="text-sm font-bold">Akun</h3>
          <p className="text-xs text-muted-foreground">
            Keluar dari akun keluarga
          </p>
        </div>
        <form action={logoutAction}>
          <Button type="submit" variant="outline" className="w-full">
            <LogOut className="mr-2 h-4 w-4" />
            Keluar dari Akun
          </Button>
        </form>
      </div>
    </div>
  )
}