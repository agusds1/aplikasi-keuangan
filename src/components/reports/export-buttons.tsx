'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Download, FileSpreadsheet, Loader2, Wallet, PieChart, Scale, ChevronDown } from 'lucide-react'
import { 
  getTransactionCSVAction, 
  getCashFlowCSVAction, 
  getIncomeStatementCSVAction, 
  getBalanceSheetCSVAction 
} from '@/app/actions/export'
import { format } from 'date-fns'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuGroup,
} from '@/components/ui/dropdown-menu'

export function ExportButtons() {
  const [loading, setLoading] = useState<string | null>(null)
  const currentMonth = format(new Date(), 'yyyy-MM')

  function downloadCSV(csvContent: string, filename: string) {
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', filename)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  async function handleDownload(type: 'transaksi' | 'aruskas' | 'labarugi' | 'neraca') {
    setLoading(type)
    
    if (type === 'transaksi') {
      const res = await getTransactionCSVAction(currentMonth)
      if (res.success && res.csv) downloadCSV(res.csv, res.filename!)
    } else if (type === 'aruskas') {
      const res = await getCashFlowCSVAction(currentMonth)
      if (res.success && res.csv) downloadCSV(res.csv, res.filename!)
    } else if (type === 'labarugi') {
      const res = await getIncomeStatementCSVAction(currentMonth)
      if (res.success && res.csv) downloadCSV(res.csv, res.filename!)
    } else if (type === 'neraca') {
      const res = await getBalanceSheetCSVAction()
      if (res.success && res.csv) downloadCSV(res.csv, res.filename!)
    }
    
    setLoading(null)
  }

  return (
    <div className="flex justify-end mt-4">
      <DropdownMenu>
        <DropdownMenuTrigger 
          className="inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 px-3"
          disabled={loading !== null}
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
          Export Laporan
          <ChevronDown className="h-4 w-4 opacity-50" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuGroup>
            <DropdownMenuLabel>Pilih Format Laporan</DropdownMenuLabel>
            <DropdownMenuSeparator />
            
            <DropdownMenuItem onClick={() => handleDownload('transaksi')} disabled={loading !== null}>
              <FileSpreadsheet className="mr-2 h-4 w-4 text-green-600" />
              Transaksi Detail
            </DropdownMenuItem>
            
            <DropdownMenuItem onClick={() => handleDownload('aruskas')} disabled={loading !== null}>
              <Wallet className="mr-2 h-4 w-4 text-blue-600" />
              Arus Kas (Cash Flow)
            </DropdownMenuItem>
            
            <DropdownMenuItem onClick={() => handleDownload('labarugi')} disabled={loading !== null}>
              <PieChart className="mr-2 h-4 w-4 text-orange-600" />
              Laba/Rugi (Surplus)
            </DropdownMenuItem>
            
            <DropdownMenuItem onClick={() => handleDownload('neraca')} disabled={loading !== null}>
              <Scale className="mr-2 h-4 w-4 text-purple-600" />
              Neraca (Kekayaan)
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}