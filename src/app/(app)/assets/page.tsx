import { getActiveMemberId } from '@/lib/auth/session'
import { db } from '@/lib/db'
import { members } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { getAssetsByFamily, getAccountsByFamily } from '@/lib/db/queries'
import { AssetList } from '@/components/assets/asset-list'
import { formatCurrency } from '@/lib/format'

export default async function AssetsPage() {
  const activeMemberId = await getActiveMemberId()
  const [member] = await db.select().from(members).where(eq(members.id, activeMemberId!)).limit(1)

  const [assets, accounts] = await Promise.all([
    getAssetsByFamily(member.familyId),
    getAccountsByFamily(member.familyId),
  ])

  const totalAssetValue = assets.reduce((sum, a) => sum + parseFloat(a.currentValue), 0)

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold">📦 Manajemen Aset</h1>
        <p className="text-xs text-muted-foreground mt-1">
          Total Nilai Aset: <span className="font-bold text-green-600">{formatCurrency(totalAssetValue)}</span>
        </p>
      </div>

      <AssetList assets={assets} accounts={accounts} activeMemberId={activeMemberId!} />
    </div>
  )
}