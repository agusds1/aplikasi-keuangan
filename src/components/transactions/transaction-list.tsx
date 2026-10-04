'use client'

import { useState } from 'react'
import { MemberBadge } from '@/components/shared/member-badge'
import { TransactionActionSheet } from './transaction-action-sheet'
import { format } from 'date-fns'
import { id as idLocale } from 'date-fns/locale'
import type { Category } from '@/lib/db/schema'

function formatCurrency(amount: string | number) {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(num)
}

type TransactionItem = {
  id: string
  amount: string
  type: 'INCOME' | 'EXPENSE' | 'TRANSFER'
  description: string | null
  date: Date
  category: {
    id: string
    name: string
    icon: string
    color: string
    type: string
  } | null
  member: {
    id: string
    name: string
    avatar: string
    color: string
    role: string
  } | null
}

type Props = {
  transactions: TransactionItem[]
  categories: Category[]
}

export function TransactionList({ transactions, categories }: Props) {
  const [selected, setSelected] = useState<TransactionItem | null>(null)

  return (
    <>
      <div className="space-y-2">
        {transactions.map((tx) => (
          <button
            key={tx.id}
            onClick={() => setSelected(tx)}
            className="w-full text-left rounded-xl bg-card border p-3 flex items-start gap-3 transition-colors hover:bg-muted/50 active:scale-[0.99]"
          >
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center text-xl shrink-0"
              style={{ backgroundColor: `${tx.category?.color}20` }}
            >
              {tx.category?.icon}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-sm truncate">
                    {tx.description || tx.category?.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {tx.category?.name}
                  </p>
                </div>
                <p
                  className={`font-semibold text-sm whitespace-nowrap ${
                    tx.type === 'INCOME' ? 'text-green-600' : 'text-red-600'
                  }`}
                >
                  {tx.type === 'INCOME' ? '+' : '-'}
                  {formatCurrency(tx.amount)}
                </p>
              </div>
              <div className="flex items-center gap-2 mt-1.5">
                {tx.member && (
                  <MemberBadge
                    name={tx.member.name}
                    avatar={tx.member.avatar}
                    color={tx.member.color}
                    size="sm"
                  />
                )}
                <span className="text-[10px] text-muted-foreground">
                  ·{' '}
                  {format(new Date(tx.date), 'd MMM yyyy', {
                    locale: idLocale,
                  })}
                </span>
              </div>
            </div>
          </button>
        ))}
      </div>

      {selected && (
        <TransactionActionSheet
          transaction={{
            id: selected.id,
            categoryId: selected.category?.id ?? '',
            type: selected.type,
            amount: selected.amount,
            description: selected.description,
            date: new Date(selected.date),
          }}
          categories={categories}
          open={!!selected}
          onOpenChange={(open) => !open && setSelected(null)}
        />
      )}
    </>
  )
}