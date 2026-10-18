'use client'

import { useState, useMemo, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { formatCurrency } from '@/lib/format'
import { cn } from '@/lib/utils'
import {
  Loader2, Copy, Save, AlertCircle, CheckCircle2, ChevronLeft, ChevronRight, Trash2, Plus, Trash
} from 'lucide-react'
import type { Category } from '@/lib/db/schema'
import { saveAllocationsAction, copyPreviousMonthAction, deleteAllocationsAction } from '@/app/actions/allocations'
import { useRouter } from 'next/navigation'
import { CurrencyInput } from '@/components/ui/currency-input'
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

type Props = {
  categories: Category[]
  existingAllocations: Record<string, number>
  period: string
  periodLabel: string
  totalIncomeActual: number
}

export function BudgetForm({ categories, existingAllocations, period, periodLabel, totalIncomeActual }: Props) {
  const router = useRouter()
  
  const [activeCategoryIds, setActiveCategoryIds] = useState<string[]>([])
  const [values, setValues] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(false)
  const [copying, setCopying] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  
  // State untuk dialog Hapus Massal
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const incomeCategories = categories.filter((c) => c.type === 'INCOME')
  const expenseCategories = categories.filter((c) => c.type === 'EXPENSE' || c.type === 'SOCIAL')
  const savingCategories = categories.filter((c) => c.type === 'SAVING' || c.type === 'INVESTMENT')

  useEffect(() => {
    const initialValues: Record<string, number> = {}
    const initialActive: string[] = []

    categories.forEach((cat) => {
      const val = existingAllocations[cat.id] ?? 0
      initialValues[cat.id] = val
      if (val > 0) initialActive.push(cat.id)
    })

    setValues(initialValues)
    setActiveCategoryIds(initialActive)
  }, [period, existingAllocations, categories])

  const plannedIncome = useMemo(
    () => incomeCategories.reduce((sum, c) => sum + (values[c.id] || 0), 0),
    [values, incomeCategories]
  )
  
  const totalAllocated = useMemo(
    () => expenseCategories.concat(savingCategories).reduce((sum, c) => sum + (values[c.id] || 0), 0),
    [values, expenseCategories, savingCategories]
  )
  
  const remaining = plannedIncome - totalAllocated
  const isBalanced = Math.abs(remaining) < 1
  const isOver = remaining < 0

  function handleNominalChange(categoryId: string, val: string) {
    const num = parseFloat(val) || 0
    setValues((prev) => ({ ...prev, [categoryId]: num }))
    setMessage(null)
  }

  function handlePercentChange(categoryId: string, val: string, baseAmount: number) {
    const percent = parseFloat(val) || 0
    const nominal = Math.round((percent / 100) * baseAmount)
    setValues((prev) => ({ ...prev, [categoryId]: nominal }))
    setMessage(null)
  }

  function addCategory(categoryId: string) {
    if (!activeCategoryIds.includes(categoryId)) {
      setActiveCategoryIds((prev) => [...prev, categoryId])
    }
  }

  function removeCategory(categoryId: string) {
    setActiveCategoryIds((prev) => prev.filter((id) => id !== categoryId))
    setValues((prev) => ({ ...prev, [categoryId]: 0 }))
  }

  async function handleSave() {
    setLoading(true); setMessage(null)
    const items = Object.entries(values)
      .filter(([id]) => activeCategoryIds.includes(id))
      .map(([categoryId, plannedAmount]) => ({ categoryId, plannedAmount }))

    const result = await saveAllocationsAction({ period, items })

    if (result.error) setMessage({ type: 'error', text: result.error })
    else setMessage({ type: 'success', text: 'Anggaran berhasil disimpan!' })
    setLoading(false)
  }

  async function handleCopyPrevious() {
    setCopying(true); setMessage(null)
    const result = await copyPreviousMonthAction(period)
    if (result.error) setMessage({ type: 'error', text: result.error })
    else {
      setMessage({ type: 'success', text: `Berhasil copy ${result.count} alokasi dari bulan lalu.` })
      router.refresh()
    }
    setCopying(false)
  }

  async function handleDeleteAll() {
    setDeleting(true); setMessage(null)
    const result = await deleteAllocationsAction(period)
    setDeleting(false)
    setShowDeleteDialog(false)
    
    if (result.error) setMessage({ type: 'error', text: result.error })
    else {
      setMessage({ type: 'success', text: 'Semua anggaran bulan ini berhasil dihapus.' })
      router.refresh()
    }
  }

  function changeMonth(offset: number) {
    const [year, month] = period.split('-').map(Number)
    const date = new Date(year, month - 1 + offset, 1)
    const newPeriod = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
    router.push(`/budget?period=${newPeriod}`)
  }

  const renderRow = (cat: Category, baseAmount: number) => {
    if (!activeCategoryIds.includes(cat.id)) return null
    const nominalValue = values[cat.id] || 0
    const percentValue = baseAmount > 0 ? Math.round((nominalValue / baseAmount) * 100) : 0

    return (
      <Card key={cat.id}>
        <CardContent className="p-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-7 h-7 rounded-md flex items-center justify-center text-sm shrink-0" style={{ backgroundColor: `${cat.color}20` }}>
                {cat.icon}
              </div>
              <p className="text-sm font-medium truncate">{cat.name}</p>
            </div>
            <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive shrink-0 -mr-2" onClick={() => removeCategory(cat.id)}>
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="relative">
              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground font-medium">Rp</span>
              <CurrencyInput 
                value={nominalValue ? nominalValue.toString() : ''} 
                onChange={(v) => handleNominalChange(cat.id, v)} 
                className="pl-8 font-medium h-9 text-sm w-full" 
              />
            </div>
            <div className="relative">
              <Input
                type="number"
                value={percentValue || ''}
                onChange={(e) => handlePercentChange(cat.id, e.target.value, baseAmount)}
                className="pr-7 font-medium h-9 text-sm w-full text-right"
                placeholder="0"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground font-medium">%</span>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  const renderAddButton = (unselectedCats: Category[]) => {
    if (unselectedCats.length === 0) return null
    return (
      <div className="relative flex justify-end mt-2">
        <select 
          className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
          onChange={(e) => {
            if (e.target.value) addCategory(e.target.value)
            e.target.value = ""
          }}
        >
          <option value="" disabled>Pilih Kategori</option>
          {unselectedCats.map(c => (
            <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
          ))}
        </select>
        <Button variant="outline" size="sm" className="pointer-events-none w-full">
          <Plus className="mr-1 h-4 w-4" /> Tambah Item
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between bg-card border p-2 rounded-xl">
        <Button variant="ghost" size="icon" onClick={() => changeMonth(-1)}><ChevronLeft className="h-5 w-5" /></Button>
        <p className="font-semibold capitalize">{periodLabel}</p>
        <Button variant="ghost" size="icon" onClick={() => changeMonth(1)}><ChevronRight className="h-5 w-5" /></Button>
      </div>

      <div className="flex justify-end gap-2">
         <Button variant="outline" size="sm" onClick={handleCopyPrevious} disabled={copying}>
          {copying ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Copy className="mr-2 h-4 w-4" />} Copy Bulan Lalu
        </Button>
        <Button variant="destructive" size="sm" onClick={() => setShowDeleteDialog(true)}>
          <Trash className="mr-2 h-4 w-4" /> Hapus
        </Button>
      </div>

      <div className="space-y-2">
        <h3 className="text-sm font-bold px-1">💰 Rencana Pemasukan</h3>
        {incomeCategories.map((cat) => renderRow(cat, plannedIncome))}
        {renderAddButton(incomeCategories.filter(c => !activeCategoryIds.includes(c.id)))}
        <div className="flex justify-between px-2 text-sm font-bold mt-3">
          <span>Total Rencana</span>
          <span className="text-green-600">{formatCurrency(plannedIncome)}</span>
        </div>
      </div>

      <div className="space-y-2 mt-6">
        <h3 className="text-sm font-bold px-1">💸 Alokasi Pengeluaran & Tabungan</h3>
        {expenseCategories.concat(savingCategories).map((cat) => renderRow(cat, plannedIncome))}
        {renderAddButton(expenseCategories.concat(savingCategories).filter(c => !activeCategoryIds.includes(c.id)))}
        <div className="flex justify-between px-2 text-sm font-bold mt-3">
          <span>Total Dialokasikan</span>
          <span>{formatCurrency(totalAllocated)}</span>
        </div>
      </div>

      <Card className={cn("border", isBalanced ? "bg-green-50 border-green-200" : isOver ? "bg-red-50 border-red-200" : "bg-orange-50 border-orange-200")}>
        <CardContent className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-sm">
            {isBalanced ? <CheckCircle2 className="h-5 w-5 text-green-600" /> : <AlertCircle className="h-5 w-5 text-orange-600" />}
            <span className={isBalanced ? "text-green-700" : isOver ? "text-red-700" : "text-orange-700"}>
              {isBalanced ? 'Anggaran Seimbang!' : isOver ? 'Overbudget!' : 'Sisa Belum Dialokasikan'}
            </span>
          </div>
          <span className={cn("font-bold", isBalanced ? "text-green-700" : isOver ? "text-red-700" : "text-orange-700")}>{formatCurrency(remaining)}</span>
        </CardContent>
      </Card>

      {message && <div className={`p-3 rounded-lg text-sm ${message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{message.text}</div>}

      <Button className="w-full shadow-lg" size="lg" onClick={handleSave} disabled={loading}>
        {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />} Simpan Anggaran
      </Button>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Semua Anggaran?</AlertDialogTitle>
            <AlertDialogDescription>
              Ini akan menghapus seluruh data rencana pemasukan dan alokasi di bulan ini secara permanen dari database.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteAll} className="bg-destructive text-white hover:bg-destructive/90" disabled={deleting}>
              {deleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Hapus Permanen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}