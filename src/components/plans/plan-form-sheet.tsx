'use client'

import { useState } from 'react'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Plus, Loader2 } from 'lucide-react'
import type { Category } from '@/lib/db/schema'
import { createPlanAction } from '@/app/actions/plans'
import { cn } from '@/lib/utils'
import { Calendar } from '@/components/ui/calendar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { CalendarIcon } from 'lucide-react'
import { format } from 'date-fns'
import { id as idLocale } from 'date-fns/locale'

export function PlanFormSheet({ categories }: { categories: Category[] }) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedType, setSelectedType] = useState<'EXPENSE' | 'INCOME'>('EXPENSE')
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null)
  const [plannedDate, setPlannedDate] = useState<Date>(new Date())
  const [datePickerOpen, setDatePickerOpen] = useState(false)

  const filteredCategories = categories.filter((c) => {
    if (selectedType === 'INCOME') return c.type === 'INCOME'
    return c.type !== 'INCOME'
  })

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)

    if (!selectedCategoryId) {
      setError('Pilih kategori dulu')
      return
    }

    setLoading(true)
    const formData = new FormData(e.currentTarget)

    const result = await createPlanAction({
      categoryId: selectedCategoryId,
      type: selectedType,
      amount: Number(formData.get('amount')),
      description: (formData.get('description') as string) || undefined,
      plannedDate: plannedDate.toISOString(),
    })

    if (result.error) {
      setError(result.error)
      setLoading(false)
      return
    }

    // ⬇️ RESET — di sini tempatnya
    setSelectedCategoryId(null)
    setPlannedDate(new Date())   // ← ini yang baru ditambahkan
    setOpen(false)
    setLoading(false)
    ;(e.target as HTMLFormElement).reset()
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger className="fixed bottom-20 right-4 z-40 h-14 w-14 rounded-full shadow-lg bg-primary text-primary-foreground hover:bg-primary/90 inline-flex items-center justify-center">
        <Plus className="h-6 w-6" />
      </SheetTrigger>
      <SheetContent side="bottom" className="max-h-[90vh] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Buat Rencana Transaksi</SheetTitle>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="grid grid-cols-2 gap-2">
            <Button
              type="button"
              variant={selectedType === 'EXPENSE' ? 'default' : 'outline'}
              onClick={() => {
                setSelectedType('EXPENSE')
                setSelectedCategoryId(null)
              }}
            >
              💸 Pengeluaran
            </Button>
            <Button
              type="button"
              variant={selectedType === 'INCOME' ? 'default' : 'outline'}
              onClick={() => {
                setSelectedType('INCOME')
                setSelectedCategoryId(null)
              }}
            >
              💰 Pemasukan
            </Button>
          </div>

          <div className="space-y-2">
            <Label htmlFor="plan-amount">Nominal</Label>
            <Input
              id="plan-amount"
              name="amount"
              type="number"
              inputMode="numeric"
              placeholder="0"
              required
              min={1}
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
                  format(plannedDate, 'EEEE, d MMMM yyyy', { locale: idLocale })
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
            <Label htmlFor="plan-description">Catatan (opsional)</Label>
            <Input
              id="plan-description"
              name="description"
              placeholder="Misal: Beli kulkas baru"
            />
          </div>

          <div className="rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground">
            💡 Rencana ini akan dikirim ke pasangan untuk disetujui sebelum
            dieksekusi.
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Kirim Rencana
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  )
}