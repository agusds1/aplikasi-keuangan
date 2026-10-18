'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus, CheckCircle2, Trash2, Play, Pencil, ChevronDown } from 'lucide-react'
import { formatCurrency } from '@/lib/format'
import type { Account } from '@/lib/db/schema'
import { DebtFormSheet } from './debt-form-sheet'
import { DebtPlanSheet } from './debt-plan-sheet'
import { EditDebtPlanSheet } from './edit-debt-plan-sheet'
import { deleteDebtAction } from '@/app/actions/debts'
import { executeDebtPlanAction } from '@/app/actions/debt-plans'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'

type Debt = any

export function DebtList({ debts, accounts, activeMemberId }: { debts: Debt[]; accounts: Account[]; activeMemberId: string }) {
  const router = useRouter()
  const [showCreate, setShowCreate] = useState(false)
  const [planningDebt, setPlanningDebt] = useState<Debt | null>(null)
  const [editingPlan, setEditingPlan] = useState<any | null>(null)
  const [deletingDebt, setDeletingDebt] = useState<Debt | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loadingPlanId, setLoadingPlanId] = useState<string | null>(null)

  const handleRefresh = () => router.refresh()

  async function handleDelete() {
    if (!deletingDebt) return
    setError(null)
    const res = await deleteDebtAction(deletingDebt.id)
    if (res.error) { setError(res.error); return }
    setDeletingDebt(null)
    handleRefresh()
  }

  async function handleExecutePlan(planId: string) {
    setError(null)
    setLoadingPlanId(planId)
    const res = await executeDebtPlanAction(planId)
    setLoadingPlanId(null)
    if (res.error) { setError(res.error); return }
    handleRefresh()
  }

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <Button size="sm" onClick={() => setShowCreate(true)}>
          <Plus className="mr-1 h-4 w-4" /> Tambah Hutang
        </Button>
      </div>

      {error && <div className="p-3 bg-red-50 text-red-700 text-xs rounded-lg">{error}</div>}

      {debts.length === 0 ? (
        <div className="rounded-xl bg-card border p-12 text-center">
          <div className="text-4xl mb-3">🎉</div>
          <p className="font-medium">Alhamdulillah, tidak ada hutang</p>
        </div>
      ) : (
        <div className="space-y-3">
          {debts.map((debt) => {
            const principal = parseFloat(debt.principalAmount)
            const remaining = parseFloat(debt.remainingPrincipal)
            const progress = ((principal - remaining) / principal) * 100
            const isOwner = debt.memberId === activeMemberId

            return (
              <Card key={debt.id} className={remaining <= 0 ? 'opacity-60' : ''}>
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-bold flex items-center gap-2">
                        {debt.name} 
                        <span className="text-[10px] font-normal px-1.5 py-0.5 bg-muted rounded text-muted-foreground">
                          {debt.memberName} {/* TAMPILKAN NAMA ASLI */}
                        </span>
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Bunga: {debt.interestRate}% / bln · Tenor: {debt.tenorMonths} bln
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {remaining <= 0 ? (
                        <CheckCircle2 className="text-green-600" />
                      ) : (
                        <p className="text-sm font-bold text-red-600">{formatCurrency(remaining)}</p>
                      )}
                      {isOwner && (
                        <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => setDeletingDebt(debt)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="h-2 rounded-full bg-muted overflow-hidden">
                      <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${Math.min(progress, 100)}%` }} />
                    </div>
                    <div className="flex justify-between text-[10px] text-muted-foreground">
                      <span>Terbayar: {progress.toFixed(1)}%</span>
                      <span>Total: {formatCurrency(principal)}</span>
                    </div>
                  </div>

                  {debt.plans && debt.plans.length > 0 && (
                    <details className="group border-t pt-3 mt-1">
                      <summary className="flex items-center justify-between cursor-pointer list-none text-sm font-semibold text-primary hover:text-primary/80">
                        <span>Lihat Rencana Pelunasan ({debt.plans.length})</span>
                        <ChevronDown className="h-4 w-4 transition-transform group-open:rotate-180" />
                      </summary>
                      
                      <div className="space-y-2 mt-3">
                        {debt.plans.map((plan: any) => (
                          <div key={plan.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/50 border text-xs">
                            <div>
                              <p className="font-medium">Ke-{plan.installmentNumber} ({new Date(plan.plannedDate).toLocaleDateString('id-ID')})</p>
                              <p className={`text-[10px] font-bold ${
                                plan.status === 'PAID' ? 'text-green-600' : 
                                plan.status === 'APPROVED' ? 'text-blue-600' : 
                                plan.status === 'REVISION' ? 'text-orange-600' : 'text-muted-foreground'
                              }`}>{plan.status}</p>
                            </div>
                            
                            {plan.status === 'APPROVED' && isOwner && (
                              <Button size="sm" className="h-7 text-xs bg-green-600 hover:bg-green-700" onClick={() => handleExecutePlan(plan.id)} disabled={loadingPlanId === plan.id}>
                                {loadingPlanId === plan.id ? 'Memproses...' : <><Play className="w-3 h-3 mr-1" /> Bayar</>}
                              </Button>
                            )}
                            {plan.status === 'APPROVED' && !isOwner && (
                              <span className="text-[10px] font-bold text-blue-600 bg-blue-100 px-2 py-1 rounded">Tunggu {debt.memberName}</span>
                            )}
                            {plan.status === 'REVISION' && isOwner && (
                              <Button size="sm" variant="outline" className="h-7 text-xs border-orange-500 text-orange-600" onClick={() => setEditingPlan(plan)}>
                                <Pencil className="w-3 h-3 mr-1" /> Edit
                              </Button>
                            )}
                            {plan.status === 'PAID' && (
                              <span className="text-[10px] font-bold text-green-600 bg-green-100 px-2 py-1 rounded">LUNAS</span>
                            )}
                            {plan.status === 'PENDING' && (
                              <span className="text-[10px] font-bold text-muted-foreground bg-muted px-2 py-1 rounded">Menunggu ACC</span>
                            )}
                          </div>
                        ))}
                      </div>
                    </details>
                  )}

                  {remaining > 0 && isOwner && (
                    <Button size="sm" variant="outline" className="w-full mt-2" onClick={() => setPlanningDebt(debt)}>
                      📝 Buat Rencana Pelunasan Baru
                    </Button>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {showCreate && <DebtFormSheet open={showCreate} onOpenChange={setShowCreate} accounts={accounts} onSuccess={handleRefresh} />}
      {planningDebt && <DebtPlanSheet debt={planningDebt} accounts={accounts} open={!!planningDebt} onOpenChange={(o) => !o && setPlanningDebt(null)} onSuccess={handleRefresh} />}
      {editingPlan && <EditDebtPlanSheet plan={editingPlan} accounts={accounts} open={!!editingPlan} onOpenChange={(o) => !o && setEditingPlan(null)} onSuccess={handleRefresh} />}

      <AlertDialog open={!!deletingDebt} onOpenChange={(open) => !open && setDeletingDebt(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Catatan Hutang?</AlertDialogTitle>
            <AlertDialogDescription>Data hutang <strong>{deletingDebt?.name}</strong> akan dihapus permanen.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-white hover:bg-destructive/90">Hapus</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}