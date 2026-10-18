'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus, Trash2, ArrowRightLeft } from 'lucide-react'
import { formatCurrency } from '@/lib/format'
import type { Account } from '@/lib/db/schema'
import { AssetFormSheet } from './asset-form-sheet'
import { SellAssetSheet } from './sell-asset-sheet'
import { deleteAssetAction } from '@/app/actions/assets'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

type Asset = any

export function AssetList({ assets, accounts }: { assets: Asset[]; accounts: Account[] }) {
  const router = useRouter()
  const [showCreate, setShowCreate] = useState(false)
  const [sellingAsset, setSellingAsset] = useState<Asset | null>(null)
  const [deletingAsset, setDeletingAsset] = useState<Asset | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleRefresh = () => router.refresh()

  async function handleDelete() {
    if (!deletingAsset) return
    setError(null)
    const res = await deleteAssetAction(deletingAsset.id)
    if (res.error) {
      setError(res.error)
      return
    }
    setDeletingAsset(null)
    handleRefresh()
  }

  const getIcon = (type: string) => {
    if (type === 'VEHICLE') return '🚗'
    if (type === 'PROPERTY') return '🏠'
    if (type === 'GOLD') return '🪙'
    if (type === 'INVESTMENT') return '📈'
    return '📦'
  }

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <Button size="sm" onClick={() => setShowCreate(true)}>
          <Plus className="mr-1 h-4 w-4" /> Tambah Aset
        </Button>
      </div>

      {error && <div className="p-3 bg-red-50 text-red-700 text-xs rounded-lg">{error}</div>}

      {assets.length === 0 ? (
        <div className="rounded-xl bg-card border p-12 text-center">
          <div className="text-4xl mb-3">📦</div>
          <p className="font-medium">Belum ada aset tercatat</p>
        </div>
      ) : (
        <div className="space-y-3">
          {assets.map((asset) => (
            <Card key={asset.id}>
              <CardContent className="p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-lg">
                      {getIcon(asset.type)}
                    </div>
                    <div>
                      <p className="font-bold">{asset.name}</p>
                      <p className="text-[10px] text-muted-foreground capitalize">{asset.type.toLowerCase()}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-bold text-green-600">{formatCurrency(asset.currentValue)}</p>
                    <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => setDeletingAsset(asset)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button size="sm" variant="outline" className="flex-1" onClick={() => setSellingAsset(asset)}>
                    <ArrowRightLeft className="mr-1 h-3.5 w-3.5" /> Jual Aset
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {showCreate && <AssetFormSheet open={showCreate} onOpenChange={setShowCreate} accounts={accounts} onSuccess={handleRefresh} />}
      {sellingAsset && <SellAssetSheet asset={sellingAsset} accounts={accounts} open={!!sellingAsset} onOpenChange={(o) => !o && setSellingAsset(null)} onSuccess={handleRefresh} />}

      <AlertDialog open={!!deletingAsset} onOpenChange={(open) => !open && setDeletingAsset(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Aset?</AlertDialogTitle>
            <AlertDialogDescription>
              Data aset <strong>{deletingAsset?.name}</strong> akan dihapus. (Catatan: Jika kamu salah input pembelian, hapus juga transaksinya secara manual di menu Transaksi).
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-white hover:bg-destructive/90">
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}