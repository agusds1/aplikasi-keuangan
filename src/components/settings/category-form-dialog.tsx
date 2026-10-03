'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Loader2 } from 'lucide-react'
import type { Category } from '@/lib/db/schema'
import {
  createCategoryAction,
  updateCategoryAction,
} from '@/app/actions/categories'
import { cn } from '@/lib/utils'

const ICONS = [
  '💰', '🍚', '🚗', '💡', '📱', '📚', '🏦', '🎓', '📈', '💳',
  '🤲', '🎁', '🎉', '👕', '💊', '🏠', '✈️', '🍔', '☕', '🎮',
]

const COLORS = [
  '#10b981', '#f59e0b', '#06b6d4', '#8b5cf6',
  '#ef4444', '#14b8a6', '#3b82f6', '#ec4899',
]

type CategoryType = 'INCOME' | 'EXPENSE' | 'SAVING' | 'DEBT' | 'INVESTMENT' | 'SOCIAL'

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  category: Category | null
}

export function CategoryFormDialog({ open, onOpenChange, category }: Props) {
  const isEditing = !!category
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [name, setName] = useState(category?.name ?? '')
  const [type, setType] = useState<CategoryType>(
    (category?.type as CategoryType) ?? 'EXPENSE'
  )
  const [icon, setIcon] = useState(category?.icon ?? '📁')
  const [color, setColor] = useState(category?.color ?? '#f59e0b')
  const [isFixed, setIsFixed] = useState(category?.isFixed ?? false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (!name.trim()) {
      setError('Nama wajib diisi')
      return
    }

    setLoading(true)

    const payload = {
      name: name.trim(),
      type,
      icon,
      color,
      isFixed,
    }

    const result = isEditing
      ? await updateCategoryAction(category!.id, payload)
      : await createCategoryAction(payload)

    if (result.error) {
      setError(result.error)
      setLoading(false)
      return
    }

    onOpenChange(false)
    setLoading(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Edit Kategori' : 'Tambah Kategori'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Preview */}
          <div className="flex flex-col items-center gap-2 py-2">
            <div
              className="w-16 h-16 rounded-xl flex items-center justify-center text-3xl"
              style={{ backgroundColor: `${color}30` }}
            >
              {icon}
            </div>
            <p className="font-semibold">{name || 'Nama Kategori'}</p>
          </div>

          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="cat-name">Nama</Label>
            <Input
              id="cat-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Misal: Belanja Bulanan"
            />
          </div>

          {/* Type */}
          <div className="space-y-2">
            <Label>Tipe</Label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { value: 'INCOME', label: '💰 Masuk' },
                { value: 'EXPENSE', label: '💸 Keluar' },
                { value: 'SAVING', label: '🏦 Nabung' },
                { value: 'INVESTMENT', label: '📈 Invest' },
                { value: 'DEBT', label: '💳 Hutang' },
                { value: 'SOCIAL', label: '🤲 Sosial' },
              ].map((t) => (
                <Button
                  key={t.value}
                  type="button"
                  size="sm"
                  variant={type === t.value ? 'default' : 'outline'}
                  onClick={() => setType(t.value as CategoryType)}
                  className="text-xs"
                >
                  {t.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Icon */}
          <div className="space-y-2">
            <Label>Icon</Label>
            <div className="grid grid-cols-8 gap-1.5">
              {ICONS.map((i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setIcon(i)}
                  className={cn(
                    'aspect-square rounded-lg border text-xl flex items-center justify-center transition-all',
                    icon === i
                      ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                      : 'border-border hover:bg-muted'
                  )}
                >
                  {i}
                </button>
              ))}
            </div>
          </div>

          {/* Color */}
          <div className="space-y-2">
            <Label>Warna</Label>
            <div className="grid grid-cols-8 gap-2">
              {COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={cn(
                    'aspect-square rounded-full border-2 transition-all',
                    color === c
                      ? 'border-foreground scale-110'
                      : 'border-transparent'
                  )}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          {/* isFixed */}
          <div className="flex items-center justify-between p-3 rounded-lg border">
            <div>
              <p className="text-sm font-medium">Pengeluaran Tetap</p>
              <p className="text-xs text-muted-foreground">
                Nominal sama setiap bulan
              </p>
            </div>
            <Switch checked={isFixed} onCheckedChange={setIsFixed} />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Batal
            </Button>
            <Button type="submit" className="flex-1" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEditing ? 'Simpan' : 'Tambah'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}