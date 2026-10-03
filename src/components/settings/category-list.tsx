'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus, Edit2, Trash2 } from 'lucide-react'
import type { Category } from '@/lib/db/schema'
import { deleteCategoryAction } from '@/app/actions/categories'
import { CategoryFormDialog } from './category-form-dialog'
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

const TYPE_LABELS: Record<string, string> = {
  INCOME: '💰 Pemasukan',
  EXPENSE: '💸 Pengeluaran',
  SAVING: '🏦 Tabungan',
  INVESTMENT: '📈 Investasi',
  DEBT: '💳 Hutang',
  SOCIAL: '🤲 Sosial',
}

export function CategoryList({ categories }: { categories: Category[] }) {
  const [editing, setEditing] = useState<Category | null>(null)
  const [creating, setCreating] = useState(false)
  const [deleting, setDeleting] = useState<Category | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Group by type
  const grouped = categories.reduce<Record<string, Category[]>>((acc, cat) => {
    if (!acc[cat.type]) acc[cat.type] = []
    acc[cat.type].push(cat)
    return acc
  }, {})

  async function handleDelete() {
    if (!deleting) return
    setError(null)

    const result = await deleteCategoryAction(deleting.id)
    if (result.error) {
      setError(result.error)
      return
    }
    setDeleting(null)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          {categories.length} kategori
        </p>
        <Button size="sm" onClick={() => setCreating(true)}>
          <Plus className="mr-1 h-4 w-4" />
          Tambah
        </Button>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 dark:bg-red-950 p-3 text-xs text-red-700 dark:text-red-300">
          {error}
        </div>
      )}

      {Object.entries(grouped).map(([type, cats]) => (
        <div key={type} className="space-y-2">
          <h3 className="text-xs font-semibold text-muted-foreground px-1">
            {TYPE_LABELS[type]}
          </h3>
          <div className="space-y-1.5">
            {cats.map((cat) => (
              <Card key={cat.id}>
                <CardContent className="p-2.5">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-9 h-9 rounded-lg flex items-center justify-center text-lg shrink-0"
                      style={{ backgroundColor: `${cat.color}20` }}
                    >
                      {cat.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {cat.name}
                      </p>
                      {cat.isFixed && (
                        <p className="text-[10px] text-muted-foreground">
                          Tetap
                        </p>
                      )}
                    </div>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8"
                      onClick={() => setEditing(cat)}
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 text-destructive"
                      onClick={() => setDeleting(cat)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ))}

      {/* Create Dialog */}
      {creating && (
        <CategoryFormDialog
          open={creating}
          onOpenChange={setCreating}
          category={null}
        />
      )}

      {/* Edit Dialog */}
      {editing && (
        <CategoryFormDialog
          open={!!editing}
          onOpenChange={(open) => !open && setEditing(null)}
          category={editing}
        />
      )}

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleting} onOpenChange={(open) => !open && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus kategori?</AlertDialogTitle>
            <AlertDialogDescription>
              Kategori <strong>{deleting?.name}</strong> akan dihapus permanen.
              Transaksi lama dengan kategori ini tidak akan terpengaruh.
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
    </div>
  )
}