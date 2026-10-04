'use client'

import { useState } from 'react'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Calendar } from '@/components/ui/calendar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Loader2, CalendarIcon } from 'lucide-react'
import type { Category } from '@/lib/db/schema'
import { updatePlanAction } from '@/app/actions/plans'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'
import { id as idLocale } from 'date-fns/locale'

type Plan = {
  id: string
  categoryId: string
  type: 'INCOME' | 'EXPENSE' | 'TRANSFER'
  amount: string
  description: string | null
  plannedDate: Date
}

export function PlanEditSheet({
  plan,
  categories,
  open,
  onOpenChange,
}: {
  plan: Plan
  categories: Category[]
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedType, setSelectedType] = useState<'EXPENSE' | 'INCOME'>(
    plan.type === 'INCOME' ? 'INCOME' : 'EXPENSE'
  )
  const [selectedCategoryId, setSelectedCategoryId] = useState(plan.categoryId)
  const [amount, setAmount] = useState(plan.amount)
  const [description, setDescription] = useState(plan.description ?? '')
  const [plannedDate, setPlannedDate] = useState<Date>(
    new Date(plan.plannedDate)
  )
  const [datePickerOpen, setDatePickerOpen] = useState(false)

  const filteredCategories = categories.filter((c) => {
    if (selectedType === 'INCOME') return c.type === 'INCOME'
    return c.type !== 'INCOME'
  })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (!selectedCategoryId) {
      setError('Pilih kategori dulu')
      return
    }

    setLoading(true)
    const result = await updatePlanAction(plan.id, {
      categoryId: selectedCategoryId,
      type: selectedType,
      amount: parseFloat(amount),
      description: description || undefined,
      plannedDate: plannedDate.toISOString(),
    })

    if (result.error) {
      setError(result.error)
      setLoading(false)
      return
    }

    onOpenChange(false)
    setLoading(false)
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="max-h-[90vh] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Edit Rencana</SheetTitle>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="grid grid-cols-2 gap-2">
            <Button
              type="button"
              variant={selectedType === 'EXPENSE' ? 'default' : 'outline'}
              onClick={() => {
                setSelectedType('EXPENSE')
                setSelectedCategoryId('')
              }}
            >
              💸 Pengeluaran
            </Button>
            <Button
              type="button"
              variant={selectedType === 'INCOME' ? 'default' : 'outline'}
              onClick={() => {
                setSelectedType('INCOME')
                setSelectedCategoryId('')
              }}
            >
              💰 Pemasukan
            </Button>
          </div>

          <div className="space-y-2">
            <Label>Nominal</Label>
            <Input
              type="number"
              inputMode="numeric"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              min={1}
              required
              className="text-lg font-semibold"
            />
          </div>

          <div className="space-y-2">
            <Label>Kategori</Label>
            <div className="grid grid-cols-3 gap-2">
              {filteredCategories.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedCategoryId(cat.id)}
                  className={cn(
                    'flex flex-col items-center gap-1 p-3 rounded-lg border transition-all',
                    selectedCategoryId === cat.id
                      ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                      : 'border-border hover:bg-muted'
                  )}
                >
                  <span className="text-2xl">{cat.icon}</span>
                  <span className="text-xs text-center leading-tight">
                    {cat.name}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Date Picker */}
          <div className="space-y-2">
            <Label>Tanggal Rencana</Label>
            <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
              <PopoverTrigger
                className={cn(
                  'w-full flex items-center justify-start text-left font-normal px-3 py-2 border rounded-md bg-background hover:bg-muted',
                  !plannedDate && 'text-muted-foreground'
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {plannedDate ? (
                  format(plannedDate, 'EEEE, d MMMM yyyy', {
                    locale: idLocale,
                  })
                ) : (
                  <span>Pilih tanggal</span>
                )}
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={plannedDate}
                  onSelect={(date) => {
                    if (date) {
                      setPlannedDate(date)
                      setDatePickerOpen(false) // ← auto close
                    }
                  }}
                  locale={idLocale}
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <Label>Catatan</Label>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Catatan"
            />
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
              Simpan & Kirim Ulang
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  )
}