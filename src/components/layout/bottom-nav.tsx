'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Receipt,
  Wallet,
  CreditCard,
  Package,
  MoreHorizontal,
  WalletCards,
  ClipboardList,
  BarChart3,
  Settings,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'

const mainNav = [
  { href: '/dashboard', label: 'Beranda', icon: LayoutDashboard },
  { href: '/transactions', label: 'Transaksi', icon: Receipt },
  { href: '/accounts', label: 'Dompet', icon: Wallet },
  { href: '/debts', label: 'Hutang', icon: CreditCard },
  { href: '/assets', label: 'Aset', icon: Package },
]

const moreNav = [
  { href: '/budget', label: 'Anggaran', icon: WalletCards },
  { href: '/plans', label: 'Rencana', icon: ClipboardList },
  { href: '/reports', label: 'Laporan', icon: BarChart3 },
  { href: '/settings', label: 'Setting', icon: Settings },
]

export function BottomNav() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  // Cek apakah pathname saat ini ada di dalam menu 'more'
  const isMoreActive = moreNav.some((item) => pathname.startsWith(item.href))

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t safe-area-bottom">
      <div className="max-w-md mx-auto grid grid-cols-6">
        {mainNav.map((item) => {
          const Icon = item.icon
          const isActive = pathname.startsWith(item.href)

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-col items-center justify-center gap-0.5 py-2 transition-colors',
                isActive
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <Icon className={cn('h-4 w-4 sm:h-5 sm:w-5', isActive && 'stroke-[2.5]')} />
              <span className="text-[9px] sm:text-[10px] font-medium">{item.label}</span>
            </Link>
          )
        })}

        {/* Tombol More */}
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger
            className={cn(
              'flex flex-col items-center justify-center gap-0.5 py-2 transition-colors',
              isMoreActive
                ? 'text-primary'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <MoreHorizontal
              className={cn('h-4 w-4 sm:h-5 sm:w-5', isMoreActive && 'stroke-[2.5]')}
            />
            <span className="text-[9px] sm:text-[10px] font-medium">Lainnya</span>
          </SheetTrigger>
          <SheetContent side="bottom" className="max-h-[80vh]">
            <SheetHeader>
              <SheetTitle>Menu Lainnya</SheetTitle>
            </SheetHeader>
            <div className="grid grid-cols-4 gap-4 mt-6 pb-8">
              {moreNav.map((item) => {
                const Icon = item.icon
                const isActive = pathname.startsWith(item.href)

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className={cn(
                      'flex flex-col items-center gap-2 p-3 rounded-xl border transition-colors',
                      isActive
                        ? 'bg-primary/10 border-primary/30 text-primary'
                        : 'bg-card hover:bg-muted border-border text-muted-foreground'
                    )}
                  >
                    <Icon className="h-6 w-6" />
                    <span className="text-xs font-medium text-center">{item.label}</span>
                  </Link>
                )
              })}
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </nav>
  )
}