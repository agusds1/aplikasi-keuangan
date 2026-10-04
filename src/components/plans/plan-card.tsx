'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Check,
  X,
  RotateCcw,
  Play,
  Trash2,
  Loader2,
  MessageSquare,
  Pencil,
  Clock,
} from 'lucide-react'
import { MemberBadge } from '@/components/shared/member-badge'
import { formatCurrency } from '@/lib/format'
import { format } from 'date-fns'
import { id as idLocale } from 'date-fns/locale'
import {
  reviewPlanAction,
  executePlanAction,
  deletePlanAction,
} from '@/app/actions/plans'
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
import { cn } from '@/lib/utils'
import type { Category } from '@/lib/db/schema'
import { PlanEditSheet } from './plan-edit-sheet'

type Plan = {
  id: string
  amount: string
  type: string
  description: string | null
  plannedDate: Date
  status: string
  reviewNote: string | null
  creatorId: string
  reviewerId: string
  createdAt: Date
  category: {
    id: string
    name: string
    icon: string
    color: string
  } | null
  creator: {
    id: string
    name: string
    avatar: string
    color: string
    role: string
  } | null
}

const STATUS_CONFIG = {
  PENDING: {
    label: '⏳ Menunggu Review',
    color:
      'bg-yellow-100 text-yellow-800 dark:bg-yellow-950 dark:text-yellow-300',
  },
  APPROVED: {
    label: '✅ Disetujui',
    color:
      'bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300',
  },
  REVISION: {
    label: '✏️ Perlu Revisi',
    color:
      'bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-300',
  },
  REJECTED: {
    label: '❌ Ditolak',
    color: 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300',
  },
  EXECUTED: {
    label: '✓ Sudah Dieksekusi',
    color: 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300',
  },
} as const

export function PlanCard({
  plan,
  activeMemberId,
  categories,
  onUpdate,
}: {
  plan: Plan
  activeMemberId: string
  categories: Category[]
  onUpdate: () => void
}) {
  const [loading, setLoading] = useState<string | null>(null)
  const [showNoteDialog, setShowNoteDialog] = useState(false)
  const [noteAction, setNoteAction] = useState<'REVISION' | 'REJECT' | null>(
    null
  )
  const [note, setNote] = useState('')
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [showEditSheet, setShowEditSheet] = useState(false)

  const isCreator = plan.creatorId === activeMemberId
  const isReviewer = plan.reviewerId === activeMemberId
  const status = STATUS_CONFIG[plan.status as keyof typeof STATUS_CONFIG]

  // Cek apakah sudah waktunya eksekusi
  const planDate = new Date(plan.plannedDate)
  planDate.setHours(0, 0, 0, 0)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const isReadyToExecute = planDate <= today
  const daysUntil = Math.ceil(
    (planDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
  )

  async function handleApprove() {
    setLoading('approve')
    await reviewPlanAction(plan.id, 'APPROVE')
    setLoading(null)
    onUpdate()
  }

  async function handleReviewWithNote() {
    if (!noteAction) return
    setLoading('review')
    await reviewPlanAction(plan.id, noteAction, note)
    setLoading(null)
    setShowNoteDialog(false)
    setNote('')
    setNoteAction(null)
    onUpdate()
  }

  async function handleExecute() {
    setLoading('execute')
    const result = await executePlanAction(plan.id)
    setLoading(null)
    if (result?.error) {
      alert(result.error)
      return
    }
    onUpdate()
  }

  async function handleDelete() {
    setLoading('delete')
    await deletePlanAction(plan.id)
    setLoading(null)
    setConfirmDelete(false)
    onUpdate()
  }

  return (
    <>
      <Card>
        <CardContent className="p-4 space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3 flex-1 min-w-0">
              <div
                className="w-11 h-11 rounded-lg flex items-center justify-center text-xl shrink-0"
                style={{ backgroundColor: `${plan.category?.color}20` }}
              >
                {plan.category?.icon}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">
                  {plan.description || plan.category?.name}
                </p>
                <p className="text-xs text-muted-foreground">
                  {plan.category?.name}
                </p>
              </div>
            </div>
            <p
              className={cn(
                'font-bold text-sm whitespace-nowrap',
                plan.type === 'INCOME' ? 'text-green-600' : 'text-red-600'
              )}
            >
              {plan.type === 'INCOME' ? '+' : '-'}
              {formatCurrency(plan.amount)}
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <Badge className={cn('text-[10px]', status.color)}>
              {status.label}
            </Badge>
            <Badge variant="outline" className="text-[10px]">
              📅 {format(new Date(plan.plannedDate), 'd MMM yyyy', {
                locale: idLocale,
              })}
            </Badge>
          </div>

          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              {plan.creator && (
                <MemberBadge
                  name={plan.creator.name}
                  avatar={plan.creator.avatar}
                  color={plan.creator.color}
                  size="sm"
                />
              )}
              <span>
                ·{' '}
                {format(new Date(plan.createdAt), 'd MMM', {
                  locale: idLocale,
                })}
              </span>
            </div>
          </div>

          {plan.reviewNote && (
            <div className="rounded-lg bg-muted/50 p-2.5 text-xs">
              <div className="flex items-start gap-2">
                <MessageSquare className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                <p className="italic">{plan.reviewNote}</p>
              </div>
            </div>
          )}

          <div className="flex flex-wrap gap-2 pt-1">
            {/* Creator: Edit (PENDING atau REVISION) */}
            {isCreator &&
              (plan.status === 'PENDING' || plan.status === 'REVISION') && (
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1"
                  onClick={() => setShowEditSheet(true)}
                  disabled={loading !== null}
                >
                  <Pencil className="mr-1 h-3.5 w-3.5" />
                  {plan.status === 'REVISION' ? 'Edit & Kirim Ulang' : 'Edit'}
                </Button>
              )}

            {/* Reviewer: Approve/Revisi/Reject saat PENDING */}
            {isReviewer && plan.status === 'PENDING' && (
              <>
                <Button
                  size="sm"
                  className="flex-1 bg-green-600 hover:bg-green-700"
                  onClick={handleApprove}
                  disabled={loading !== null}
                >
                  {loading === 'approve' ? (
                    <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Check className="mr-1 h-3.5 w-3.5" />
                  )}
                  Setujui
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    setNoteAction('REVISION')
                    setShowNoteDialog(true)
                  }}
                  disabled={loading !== null}
                >
                  <RotateCcw className="mr-1 h-3.5 w-3.5" />
                  Revisi
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="text-destructive"
                  onClick={() => {
                    setNoteAction('REJECT')
                    setShowNoteDialog(true)
                  }}
                  disabled={loading !== null}
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              </>
            )}

            {/* Creator: Eksekusi saat APPROVED */}
            {isCreator && plan.status === 'APPROVED' && (
              <>
                {isReadyToExecute ? (
                  <Button
                    size="sm"
                    className="flex-1 bg-green-600 hover:bg-green-700"
                    onClick={handleExecute}
                    disabled={loading !== null}
                  >
                    {loading === 'execute' ? (
                      <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Play className="mr-1 h-3.5 w-3.5" />
                    )}
                    Ubah Jadi Transaksi
                  </Button>
                ) : (
                  <div className="flex-1 space-y-1">
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full"
                      disabled
                    >
                      <Clock className="mr-1 h-3.5 w-3.5" />
                      {daysUntil === 1 ? 'Besok' : `${daysUntil} hari lagi`}
                    </Button>
                    <p className="text-[10px] text-muted-foreground text-center">
                      Dijadwalkan{' '}
                      {format(new Date(plan.plannedDate), 'd MMM yyyy', {
                        locale: idLocale,
                      })}
                    </p>
                  </div>
                )}
              </>
            )}

            {/* Delete: hanya pembuat, sebelum executed */}
            {isCreator && plan.status !== 'EXECUTED' && (
              <Button
                size="sm"
                variant="outline"
                className="text-destructive ml-auto"
                onClick={() => setConfirmDelete(true)}
                disabled={loading !== null}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Edit Sheet */}
      {showEditSheet && plan.category && (
        <PlanEditSheet
          plan={{
            id: plan.id,
            categoryId: plan.category.id,
            type: plan.type as 'INCOME' | 'EXPENSE' | 'TRANSFER',
            amount: plan.amount,
            description: plan.description,
            plannedDate: new Date(plan.plannedDate),
          }}
          categories={categories}
          open={showEditSheet}
          onOpenChange={setShowEditSheet}
        />
      )}

      {/* Note Dialog */}
      <AlertDialog open={showNoteDialog} onOpenChange={setShowNoteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {noteAction === 'REVISION' ? 'Minta revisi?' : 'Tolak rencana?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              Berikan catatan untuk pasangan (opsional).
            </AlertDialogDescription>
          </AlertDialogHeader>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Misal: Nominal terlalu besar, tolong dikurangi"
            className="w-full rounded-md border p-2 text-sm min-h-[80px]"
          />
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handleReviewWithNote}>
              {loading === 'review' && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Kirim
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Confirm */}
      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus rencana?</AlertDialogTitle>
            <AlertDialogDescription>
              Rencana ini akan dihapus permanen.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}